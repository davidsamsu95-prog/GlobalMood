(function () {
  "use strict";

  const METRICS = [
    { key: "global", label: "Gesamtzufriedenheit" },
    { key: "politics", label: "Politik" },
    { key: "environment", label: "Umwelt" },
    { key: "safety", label: "Sicherheit" },
    { key: "social", label: "Soziales" },
  ];

  const VOTE_METRICS = [
    { key: "politics", name: "Politik", desc: "Wie zufrieden seid Ihr mit der politischen Gesamtsituation?", defaultValue: 6 },
    { key: "environment", name: "Umwelt", desc: "Wie erlebt Ihr Natur, Klima, Luft, Wasser, Zukunftsfahigkeit?", defaultValue: 6 },
    { key: "safety", name: "Sicherheit", desc: "Wie sicher fuhlt sich Euer Alltag an (Kriminalitat, Stabilitat, Frieden)?", defaultValue: 6 },
    { key: "social", name: "Soziales", desc: "Wie empfindet Ihr Zusammenhalt, Fairness, Lebensqualitat im Miteinander?", defaultValue: 6 },
  ];

  const COUNTRIES = [
    { code: "DE", name: "Deutschland", x: 440, y: 155 },
    { code: "AT", name: "Osterreich", x: 455, y: 167 },
    { code: "CH", name: "Schweiz", x: 430, y: 172 },
    { code: "FR", name: "Frankreich", x: 415, y: 175 },
    { code: "US", name: "USA", x: 220, y: 170 },
    { code: "BR", name: "Brasilien", x: 310, y: 290 },
    { code: "IN", name: "Indien", x: 585, y: 205 },
    { code: "JP", name: "Japan", x: 710, y: 185 },
    { code: "ZA", name: "Sudafrika", x: 575, y: 340 },
    { code: "AU", name: "Australien", x: 740, y: 330 },
    { code: "NG", name: "Nigeria", x: 500, y: 250 },
    { code: "UA", name: "Ukraine", x: 480, y: 140 },
    { code: "IL", name: "Israel", x: 490, y: 195 },
    { code: "PS", name: "Palastina", x: 494, y: 200 },
  ];

  const COUNTRY_BY_CODE = COUNTRIES.reduce((acc, c) => {
    acc[c.code] = c;
    return acc;
  }, {});

  const DASHBOARD_CACHE_KEY = "gm_dashboard_cache_v1";
  const PENDING_VOTES_KEY = "gm_pending_votes_v1";
  const LOCAL_MONTH_LOCK_KEY = "gm_local_month_lock_v1";

  const CONFIG = {
    API_BASE: String((window.GM_CONFIG && window.GM_CONFIG.API_BASE) || "").replace(/\/$/, ""),
    REQUEST_TIMEOUT_MS: 10000,
    POLL_INTERVAL_MS: 45000,
    QUEUE_RETRY_BASE_MS: 30000,
    QUEUE_RETRY_MAX_MS: 15 * 60 * 1000,
    LEADERBOARD_LIMIT: 10,
  };

  const appState = {
    currentMetric: "global",
    currentCountry: "WORLD",
    trendChart: null,
    radarChart: null,
    dashboard: null,
    pendingVotes: [],
    queueBusy: false,
    refreshBusy: false,
    online: true,
  };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function fmtInt(n) {
    return Number(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function monthKey(date) {
    const d = date || new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  function nextMonthKey() {
    const d = new Date();
    const x = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    return monthKey(x);
  }

  function monthLabel(key) {
    const m = /^(\d{4})-(\d{2})$/.exec(key || "");
    if (!m) return key;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, 1);
    return `${d.toLocaleString("de-DE", { month: "short" })} ${String(d.getFullYear()).slice(2)}`;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[char];
    });
  }

  function toast(msg, sub) {
    const node = $("#toast");
    if (!node) return;
    node.innerHTML = `<div style="font-weight:600;letter-spacing:.2px;">${escapeHtml(msg)}</div>${sub ? `<small>${escapeHtml(sub)}</small>` : ""}`;
    node.style.display = "block";
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      node.style.display = "none";
    }, 3600);
  }

  function safeGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      console.error("localStorage read failed", err);
      return fallback;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error("localStorage write failed", err);
      return false;
    }
  }

  function safeRemove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (err) {
      console.error("localStorage remove failed", err);
      return false;
    }
  }

  function metricLabel(metric) {
    const hit = METRICS.find((m) => m.key === metric);
    return hit ? hit.label : metric;
  }

  function countryLabel(code) {
    if (code === "WORLD") return "Weltweit (Aggregat)";
    return COUNTRY_BY_CODE[code] ? COUNTRY_BY_CODE[code].name : code;
  }

  function metricColor(value) {
    if (!Number.isFinite(value)) return "rgba(255,255,255,.75)";
    if (value < 4) return "rgba(255,128,128,.9)";
    if (value < 6.5) return "rgba(255,255,255,.8)";
    return "rgba(114,255,195,.9)";
  }

  function localMonthLocked() {
    return localStorage.getItem(LOCAL_MONTH_LOCK_KEY) === monthKey();
  }

  function setLocalMonthLock() {
    localStorage.setItem(LOCAL_MONTH_LOCK_KEY, monthKey());
  }

  function clearLocalMonthLock() {
    localStorage.removeItem(LOCAL_MONTH_LOCK_KEY);
  }

  function apiUrl(path, params) {
    const url = new URL(`${CONFIG.API_BASE}${path}`, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          url.searchParams.set(k, String(v));
        }
      });
    }
    return url.toString();
  }

  async function fetchJson(path, options = {}, params) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(apiUrl(path, params), {
        ...options,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
        signal: controller.signal,
      });

      let data = null;
      try {
        data = await response.json();
      } catch (err) {
        data = null;
      }

      if (!response.ok) {
        const error = new Error((data && data.error) || "request_failed");
        error.status = response.status;
        error.payload = data;
        throw error;
      }

      return data;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function getDashboard() {
    return fetchJson(
      "/api/v1/dashboard",
      { method: "GET" },
      {
        month: monthKey(),
        metric: appState.currentMetric,
        country: appState.currentCountry,
        limit: CONFIG.LEADERBOARD_LIMIT,
      },
    );
  }

  async function postVote(payload) {
    return fetchJson("/api/v1/votes", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  function readCachedDashboard() {
    return safeGet(DASHBOARD_CACHE_KEY, null);
  }

  function writeCachedDashboard(dashboard) {
    return safeSet(DASHBOARD_CACHE_KEY, {
      ts: Date.now(),
      month: monthKey(),
      dashboard,
    });
  }

  function readPendingVotes() {
    return safeGet(PENDING_VOTES_KEY, []);
  }

  function writePendingVotes() {
    safeSet(PENDING_VOTES_KEY, appState.pendingVotes);
  }

  function queueSize() {
    return appState.pendingVotes.length;
  }

  function queueInfoText() {
    if (!queueSize()) return "";
    return ` · Warteschlange: ${queueSize()} Vote(s)`;
  }

  function renderMetricsSelect() {
    const sel = $("#metricSelect");
    sel.innerHTML = "";

    METRICS.forEach((metric) => {
      const option = document.createElement("option");
      option.value = metric.key;
      option.textContent = metric.label;
      sel.appendChild(option);
    });

    sel.value = appState.currentMetric;
  }

  function renderCountrySelects() {
    const statsSel = $("#countrySelect");
    const voteSel = $("#voteCountry");

    statsSel.innerHTML = "";
    voteSel.innerHTML = "";

    const world = document.createElement("option");
    world.value = "WORLD";
    world.textContent = "Weltweit (Aggregat)";
    statsSel.appendChild(world);

    COUNTRIES.forEach((country) => {
      const a = document.createElement("option");
      a.value = country.code;
      a.textContent = country.name;
      statsSel.appendChild(a);

      const b = document.createElement("option");
      b.value = country.code;
      b.textContent = country.name;
      voteSel.appendChild(b);
    });

    const other = document.createElement("option");
    other.value = "OTHER";
    other.textContent = "Anderes / nicht genannt";
    voteSel.appendChild(other);

    statsSel.value = appState.currentCountry;
    voteSel.value = "DE";
  }

  function renderVoteGrid() {
    const grid = $("#voteGrid");
    grid.innerHTML = "";

    VOTE_METRICS.forEach((metric) => {
      const node = document.createElement("div");
      node.className = "metric";
      node.innerHTML = `
        <div class="metricTop">
          <div>
            <div class="name">${escapeHtml(metric.name)}</div>
            <div class="desc">${escapeHtml(metric.desc)}</div>
          </div>
          <div class="pill">0-10</div>
        </div>
        <div class="meter">
          <input id="m_${metric.key}" type="range" min="0" max="10" step="1" value="${metric.defaultValue}" />
          <output id="o_${metric.key}">${metric.defaultValue}</output>
        </div>
      `;
      grid.appendChild(node);
    });

    VOTE_METRICS.forEach((metric) => {
      const slider = $(`#m_${metric.key}`);
      const output = $(`#o_${metric.key}`);
      slider.addEventListener("input", () => {
        output.textContent = slider.value;
      });
    });
  }

  function renderMapPins() {
    const pins = $("#pins");
    pins.innerHTML = "";

    COUNTRIES.forEach((country) => {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "pin");
      g.setAttribute("data-country", country.code);
      g.setAttribute("transform", `translate(${country.x} ${country.y})`);

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("r", "6.5");
      circle.setAttribute("stroke", "rgba(255,255,255,.18)");
      circle.setAttribute("fill", "rgba(255,255,255,.75)");

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", "10");
      text.setAttribute("y", "4");
      text.textContent = country.code;

      g.appendChild(circle);
      g.appendChild(text);
      pins.appendChild(g);

      g.style.cursor = "pointer";
      g.addEventListener("click", () => {
        $("#countrySelect").value = country.code;
        $("#countrySelect").dispatchEvent(new Event("change"));
      });
    });
  }

  function updateMapPins(snapshot) {
    const values = (snapshot && snapshot.countries ? snapshot.countries : []).reduce((acc, row) => {
      acc[row.country] = row.value;
      return acc;
    }, {});

    $$("#pins .pin").forEach((pin) => {
      const country = pin.getAttribute("data-country");
      const circle = pin.querySelector("circle");
      if (circle) {
        circle.setAttribute("fill", metricColor(values[country]));
      }
      pin.style.opacity = appState.currentCountry === "WORLD" || appState.currentCountry === country ? "1" : "0.35";
      pin.style.transform = appState.currentCountry === country ? "scale(1.05)" : "scale(1)";
    });
  }

  function renderHeader(data) {
    const header = (data && data.header) || {};
    const meta = (data && data.meta) || {};
    const status = (data && data.status) || {};

    const globalIndex = header.globalIndex;
    $("#globalIndex").textContent = Number.isFinite(globalIndex) ? Number(globalIndex).toFixed(2) : "-";

    const delta = header.deltaMoM;
    const deltaNode = $("#deltaMoM");
    deltaNode.classList.remove("ok", "bad", "warn");

    if (!Number.isFinite(delta)) {
      deltaNode.classList.add("warn");
      deltaNode.innerHTML = "<span class=\"dot\" style=\"background:rgba(255,214,102,.9)\"></span>Trend: <strong>n/a</strong> (Vorperiode fehlt)";
    } else {
      deltaNode.classList.add(delta > 0.05 ? "ok" : delta < -0.05 ? "bad" : "warn");
      deltaNode.innerHTML = `<span class="dot" style="background:${delta >= 0 ? "rgba(114,255,195,.9)" : "rgba(255,128,128,.9)"}"></span>Trend: <strong>${delta >= 0 ? "+" : ""}${Number(delta).toFixed(2)}</strong> seit letztem Monat`;
    }

    const votes = Number(header.totalVotes || 0);
    $("#totalVotes").innerHTML = `<span class="dot" style="background:rgba(255,255,255,.55)"></span>Stimmen: <strong>${fmtInt(votes)}</strong>`;

    const sample = $("#sampleHint");
    if (votes < 25) {
      sample.classList.remove("ok", "bad");
      sample.classList.add("warn");
      sample.innerHTML = `<span class="dot" style="background:rgba(255,214,102,.9)"></span><strong>Kleine Stichprobe (${fmtInt(votes)} Stimmen)</strong>`;
    } else {
      sample.classList.remove("warn", "bad");
      sample.classList.add("ok");
      sample.innerHTML = `<span class="dot" style="background:rgba(114,255,195,.9)"></span><strong>Stichprobe wachst (${fmtInt(votes)} Stimmen)</strong>`;
    }

    $("#serverTime").textContent = meta.serverTime ? new Date(meta.serverTime).toLocaleString("de-DE") : "-";
    $("#ver").textContent = meta.version || "-";
    $("#monthPill").textContent = data.month || monthKey();

    const hint = $("#liveHint");
    const source = appState.online ? "Live-API" : "lokaler Cache";
    const busy = status.voteBusy ? " · Voting gerade ausgelastet" : "";
    hint.textContent = `${source}${busy}${queueInfoText()}`;

    renderCooldownNote(status.voteBusy);
  }

  function renderCooldownNote(voteBusy) {
    const note = $("#cooldownNote");
    if (localMonthLocked()) {
      note.innerHTML = `<strong>Hinweis:</strong> Ihr habt diesen Monat bereits abgestimmt (lokale Sicherung). Nachste Abgabe ab <span class="pill">${nextMonthKey()}</span>.`;
      return;
    }

    if (queueSize()) {
      note.innerHTML = `<strong>Warteschlange aktiv:</strong> ${queueSize()} Vote(s) werden automatisch erneut gesendet. Bitte nichts doppelt absenden.`;
      return;
    }

    if (voteBusy) {
      note.innerHTML = "<strong>Hinweis:</strong> Statistik bleibt abrufbar. Voting kann bei Last kurz verzogert sein.";
      return;
    }

    note.innerHTML = "<strong>Prinzip:</strong> anonym & aggregiert. 1 Stimme pro Gerat und Monat (serverseitig abgesichert).";
  }

  function renderLeaderboard(data) {
    const body = $("#leaderBody");
    body.innerHTML = "";

    const rows = (data && data.leaderboard && data.leaderboard.rows) || [];
    const minCountryN = data && data.meta ? data.meta.minCountryN : 0;

    if (!rows.length) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="5" class="muted">Noch keine Lander mit mindestens ${minCountryN} Stimmen im aktuellen Monat.</td>`;
      body.appendChild(tr);
      return;
    }

    rows.forEach((row, index) => {
      const tr = document.createElement("tr");
      const delta = row.delta;
      const deltaText = Number.isFinite(delta) ? `${delta >= 0 ? "+" : ""}${Number(delta).toFixed(2)}` : "n/a";
      const deltaColor = !Number.isFinite(delta)
        ? "rgba(170,182,214,.9)"
        : delta >= 0
          ? "rgba(114,255,195,.95)"
          : "rgba(255,128,128,.95)";

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${escapeHtml(countryLabel(row.country))} <span class="pill">${escapeHtml(row.country)}</span></td>
        <td><span class="pill">${Number(row.value || 0).toFixed(2)}</span></td>
        <td style="color:${deltaColor}">${deltaText}</td>
        <td>${fmtInt(row.n || 0)}</td>
      `;

      body.appendChild(tr);
    });
  }

  function renderCharts(data) {
    if (typeof window.Chart !== "function") {
      toast("Chart.js nicht verfugbar.", "Diagramme werden nicht angezeigt.");
      return;
    }

    const trend = data && data.trend ? data.trend : { labels: [], values: [] };
    const profile = data && data.profile
      ? data.profile
      : { politics: 0, environment: 0, safety: 0, social: 0, country: appState.currentCountry, n: 0 };

    const trendLabels = (trend.labels || []).map(monthLabel);
    const trendValues = trend.values || [];

    if (appState.trendChart) appState.trendChart.destroy();
    appState.trendChart = new window.Chart($("#trendChart"), {
      type: "line",
      data: {
        labels: trendLabels,
        datasets: [{
          label: `Trend - ${metricLabel(appState.currentMetric)} (${countryLabel(appState.currentCountry)})`,
          data: trendValues,
          tension: 0.25,
          pointRadius: 2.5,
          pointHoverRadius: 4,
          borderWidth: 2,
          spanGaps: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, labels: { color: "rgba(234,240,255,.92)" } },
          tooltip: {
            enabled: true,
            callbacks: {
              label(ctx) {
                if (ctx.raw === null) return "keine Daten";
                return `${ctx.dataset.label}: ${Number(ctx.raw).toFixed(2)}`;
              },
            },
          },
        },
        scales: {
          x: { ticks: { color: "rgba(170,182,214,.85)" }, grid: { color: "rgba(255,255,255,.06)" } },
          y: {
            min: 0,
            max: 10,
            ticks: { color: "rgba(170,182,214,.85)" },
            grid: { color: "rgba(255,255,255,.06)" },
          },
        },
      },
    });

    if (appState.radarChart) appState.radarChart.destroy();
    appState.radarChart = new window.Chart($("#radarChart"), {
      type: "radar",
      data: {
        labels: ["Politik", "Umwelt", "Sicherheit", "Soziales"],
        datasets: [{
          label: `Profil - ${countryLabel(profile.country || appState.currentCountry)}${profile.n ? ` (${profile.n} Stimmen)` : ""}`,
          data: [
            Number(profile.politics || 0),
            Number(profile.environment || 0),
            Number(profile.safety || 0),
            Number(profile.social || 0),
          ],
          borderWidth: 2,
          pointRadius: 3,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true, labels: { color: "rgba(234,240,255,.92)" } } },
        scales: {
          r: {
            min: 0,
            max: 10,
            ticks: { color: "rgba(170,182,214,.85)" },
            grid: { color: "rgba(255,255,255,.06)" },
            angleLines: { color: "rgba(255,255,255,.08)" },
            pointLabels: { color: "rgba(234,240,255,.92)" },
          },
        },
      },
    });
  }

  function renderDashboard(data) {
    appState.dashboard = data;
    renderHeader(data);
    renderLeaderboard(data);
    renderCharts(data);
    updateMapPins(data.snapshot);
  }

  async function refreshDashboard() {
    if (appState.refreshBusy) return;
    appState.refreshBusy = true;

    try {
      const dashboard = await getDashboard();
      appState.online = true;
      writeCachedDashboard(dashboard);
      renderDashboard(dashboard);
    } catch (err) {
      appState.online = false;
      const cached = readCachedDashboard();
      if (cached && cached.dashboard) {
        renderDashboard(cached.dashboard);
        toast("Live-Daten aktuell nicht erreichbar.", "Anzeige aus lokalem Cache.");
      } else {
        toast("Backend nicht erreichbar.", "Bitte API-URL pru fen oder spater erneut laden.");
      }
      console.error("refreshDashboard failed", err);
    } finally {
      appState.refreshBusy = false;
    }
  }

  function buildVotePayload() {
    const scores = {};
    VOTE_METRICS.forEach((metric) => {
      scores[metric.key] = Number($(`#m_${metric.key}`).value);
    });

    return {
      month: monthKey(),
      country: $("#voteCountry").value,
      scores,
    };
  }

  function payloadFingerprint(payload) {
    return `${payload.month}|${payload.country}|${payload.scores.politics}|${payload.scores.environment}|${payload.scores.safety}|${payload.scores.social}`;
  }

  function enqueueVote(payload, reason) {
    const fp = payloadFingerprint(payload);
    const already = appState.pendingVotes.some((v) => v.fp === fp && v.month === payload.month);
    if (already) return;

    appState.pendingVotes.push({
      id: `q_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      fp,
      month: payload.month,
      payload,
      attempts: 0,
      retryAt: Date.now(),
      reason,
      createdAt: new Date().toISOString(),
    });

    writePendingVotes();
  }

  function removeQueueById(id) {
    appState.pendingVotes = appState.pendingVotes.filter((v) => v.id !== id);
    writePendingVotes();
  }

  function scheduleRetryMs(attempts) {
    const backoff = CONFIG.QUEUE_RETRY_BASE_MS * Math.max(1, attempts);
    return Math.min(backoff, CONFIG.QUEUE_RETRY_MAX_MS);
  }

  async function flushVoteQueue() {
    if (appState.queueBusy || !appState.pendingVotes.length) return;
    appState.queueBusy = true;

    try {
      const next = appState.pendingVotes
        .slice()
        .sort((a, b) => a.retryAt - b.retryAt)[0];

      if (!next || next.retryAt > Date.now()) return;

      try {
        await postVote(next.payload);
        removeQueueById(next.id);
        setLocalMonthLock();
        toast("Gepufferter Vote erfolgreich gesendet.", `Monat ${next.payload.month}`);
        await refreshDashboard();
      } catch (err) {
        if (err.status === 409) {
          removeQueueById(next.id);
          setLocalMonthLock();
          await refreshDashboard();
          return;
        }

        const idx = appState.pendingVotes.findIndex((v) => v.id === next.id);
        if (idx >= 0) {
          appState.pendingVotes[idx].attempts += 1;
          appState.pendingVotes[idx].retryAt = Date.now() + scheduleRetryMs(appState.pendingVotes[idx].attempts);
          appState.pendingVotes[idx].reason = err.status || "network";
          writePendingVotes();
        }
      }
    } finally {
      appState.queueBusy = false;
      renderCooldownNote(appState.dashboard && appState.dashboard.status && appState.dashboard.status.voteBusy);
      $("#liveHint").textContent = `${appState.online ? "Live-API" : "lokaler Cache"}${queueInfoText()}`;
    }
  }

  async function submitVote() {
    if (localMonthLocked()) {
      toast("Diesen Monat bereits abgestimmt.", "Lokale Sicherung aktiv.");
      return;
    }

    const payload = buildVotePayload();

    try {
      await postVote(payload);
      setLocalMonthLock();
      toast("Abstimmung gespeichert.", "Danke fur deine Stimme.");
      await refreshDashboard();
      const statsAnchor = document.querySelector('[data-scroll="#stats"]');
      if (statsAnchor) statsAnchor.click();
    } catch (err) {
      if (err.status === 409) {
        setLocalMonthLock();
        renderCooldownNote(false);
        toast("Diesen Monat bereits abgestimmt.", "Serverseitige Monatsregel hat gegriffen.");
        return;
      }

      if (err.status === 429 || err.status === 503 || !err.status) {
        enqueueVote(payload, err.status || "network");
        renderCooldownNote(true);
        toast("Voting ausgelastet - Stimme gepuffert.", "Die App sendet automatisch nach.");
        return;
      }

      toast("Abstimmung fehlgeschlagen.", "Bitte spater erneut versuchen.");
      console.error("submitVote failed", err);
    }
  }

  function randomizeVote() {
    VOTE_METRICS.forEach((metric) => {
      const value = Math.floor(Math.random() * 11);
      const slider = $(`#m_${metric.key}`);
      slider.value = value;
      slider.dispatchEvent(new Event("input"));
    });
    toast("Zufallswerte gesetzt.");
  }

  async function share() {
    const text = `Globales Stimmungsbarometer: ${metricLabel(appState.currentMetric)} - ${countryLabel(appState.currentCountry)}.`;
    const url = window.location.href.split("#")[0] + "#stats";

    try {
      if (navigator.share) {
        await navigator.share({ title: "Globales Stimmungsbarometer", text, url });
        toast("Geteilt.");
        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast("Link kopiert.");
        return;
      }

      toast("Teilen nicht verfugbar.");
    } catch (err) {
      toast("Teilen abgebrochen.");
    }
  }

  function initNav() {
    $$('[data-scroll]').forEach((btn) => {
      btn.addEventListener("click", () => {
        const sel = btn.getAttribute("data-scroll");
        const node = document.querySelector(sel);
        if (node) node.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function bindEvents() {
    $("#metricSelect").addEventListener("change", async (event) => {
      appState.currentMetric = event.target.value;
      await refreshDashboard();
    });

    $("#countrySelect").addEventListener("change", async (event) => {
      appState.currentCountry = event.target.value;
      await refreshDashboard();
    });

    $("#submitVote").addEventListener("click", submitVote);
    $("#randomize").addEventListener("click", randomizeVote);
    $("#shareBtn").addEventListener("click", share);

    $("#resetLocal").addEventListener("click", () => {
      const ok = window.confirm("Lokale Warteschlange, Cache und Monats-Lock wirklich loschen?");
      if (!ok) return;

      appState.pendingVotes = [];
      safeRemove(PENDING_VOTES_KEY);
      safeRemove(DASHBOARD_CACHE_KEY);
      clearLocalMonthLock();
      renderCooldownNote(false);
      toast("Lokale Pufferdaten geloscht.");
    });
  }

  function runSmokeChecks() {
    const checks = [];

    checks.push({ name: "metric count", pass: METRICS.length === 5 });
    checks.push({ name: "country registry", pass: COUNTRIES.length >= 10 });
    checks.push({ name: "month format", pass: /^\d{4}-\d{2}$/.test(monthKey()) });

    const failed = checks.filter((x) => !x.pass);
    if (failed.length) {
      console.error("Smoke checks failed", failed);
    }
  }

  function initIntervals() {
    setInterval(refreshDashboard, CONFIG.POLL_INTERVAL_MS);
    setInterval(flushVoteQueue, 5000);
  }

  async function init() {
    appState.pendingVotes = readPendingVotes();

    renderMetricsSelect();
    renderCountrySelects();
    renderVoteGrid();
    renderMapPins();
    initNav();
    bindEvents();

    runSmokeChecks();
    await refreshDashboard();
    await flushVoteQueue();
    initIntervals();
  }

  init();
})();
