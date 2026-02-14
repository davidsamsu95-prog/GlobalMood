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
    { key: "safety", name: "Sicherheit", desc: "Wie sicher fuehlt sich Euer Alltag an (Kriminalitaet, Stabilitaet, Frieden)?", defaultValue: 6 },
    { key: "social", name: "Soziales", desc: "Wie empfindet Ihr Zusammenhalt, Fairness, Lebensqualitaet im Miteinander?", defaultValue: 6 },
  ];

  const COUNTRIES = [
    { code: "DE", name: "Deutschland" },
    { code: "AT", name: "Oesterreich" },
    { code: "CH", name: "Schweiz" },
    { code: "FR", name: "Frankreich" },
    { code: "US", name: "USA" },
    { code: "BR", name: "Brasilien" },
    { code: "IN", name: "Indien" },
    { code: "JP", name: "Japan" },
    { code: "ZA", name: "Suedafrika" },
    { code: "AU", name: "Australien" },
    { code: "NG", name: "Nigeria" },
    { code: "UA", name: "Ukraine" },
    { code: "IL", name: "Israel" },
    { code: "PS", name: "Palaestina" },
  ];

  const COUNTRY_BY_CODE = COUNTRIES.reduce((acc, c) => {
    acc[c.code] = c;
    return acc;
  }, {});

  const REGION_BY_COUNTRY = {
    DE: "Europe",
    AT: "Europe",
    CH: "Europe",
    FR: "Europe",
    UA: "Europe",
    US: "North America",
    BR: "South America",
    IN: "Asia",
    JP: "Asia",
    IL: "Asia",
    PS: "Asia",
    ZA: "Africa",
    NG: "Africa",
    AU: "Oceania",
  };

  const N3_TO_A2 = {
    "036": "AU",
    "040": "AT",
    "076": "BR",
    "250": "FR",
    "275": "PS",
    "276": "DE",
    "356": "IN",
    "376": "IL",
    "392": "JP",
    "566": "NG",
    "710": "ZA",
    "756": "CH",
    "804": "UA",
    "840": "US",
  };

  const GEO_TREE = {
    Europe: {
      label: "Europa",
      center: [15, 52],
      countries: {
        DE: {
          label: "Deutschland",
          center: [10.45, 51.16],
          states: {
            "Baden-Wuerttemberg": { center: [9.15, 48.5], cities: { Ulm: [10.0, 48.4], Stuttgart: [9.18, 48.78] } },
            Bayern: { center: [11.5, 48.9], cities: { Muenchen: [11.58, 48.14], Nuernberg: [11.08, 49.45] } },
          },
        },
        AT: {
          label: "Oesterreich",
          center: [14.12, 47.52],
          states: { "National": { center: [14.12, 47.52], cities: { Wien: [16.37, 48.2], Graz: [15.44, 47.07] } } },
        },
        CH: {
          label: "Schweiz",
          center: [8.23, 46.8],
          states: { "National": { center: [8.23, 46.8], cities: { Zuerich: [8.54, 47.37], Bern: [7.44, 46.95] } } },
        },
        FR: {
          label: "Frankreich",
          center: [2.21, 46.23],
          states: { "National": { center: [2.21, 46.23], cities: { Paris: [2.35, 48.86], Lyon: [4.83, 45.76] } } },
        },
        UA: {
          label: "Ukraine",
          center: [31.16, 48.37],
          states: { "National": { center: [31.16, 48.37], cities: { Kyjiw: [30.52, 50.45], Lwiw: [24.03, 49.84] } } },
        },
      },
    },
    Asia: {
      label: "Asien",
      center: [90, 30],
      countries: {
        IN: {
          label: "Indien",
          center: [78.96, 20.59],
          states: { "National": { center: [78.96, 20.59], cities: { Delhi: [77.21, 28.61], Mumbai: [72.88, 19.07] } } },
        },
        JP: {
          label: "Japan",
          center: [138.25, 36.2],
          states: { "National": { center: [138.25, 36.2], cities: { Tokio: [139.69, 35.68], Osaka: [135.5, 34.69] } } },
        },
        IL: {
          label: "Israel",
          center: [34.85, 31.05],
          states: { "National": { center: [34.85, 31.05], cities: { Jerusalem: [35.22, 31.77], TelAviv: [34.78, 32.08] } } },
        },
        PS: {
          label: "Palaestina",
          center: [35.2, 31.95],
          states: { "National": { center: [35.2, 31.95], cities: { Ramallah: [35.2, 31.9], Gaza: [34.47, 31.5] } } },
        },
      },
    },
    "North America": {
      label: "Nordamerika",
      center: [-100, 44],
      countries: {
        US: {
          label: "USA",
          center: [-98.58, 39.83],
          states: {
            California: { center: [-119.42, 36.77], cities: { "San Francisco": [-122.42, 37.77], LosAngeles: [-118.24, 34.05] } },
            "New York": { center: [-75.0, 43.0], cities: { NYC: [-74.0, 40.71], Buffalo: [-78.87, 42.89] } },
          },
        },
      },
    },
    "South America": {
      label: "Suedamerika",
      center: [-60, -18],
      countries: {
        BR: {
          label: "Brasilien",
          center: [-51.92, -14.23],
          states: { "National": { center: [-51.92, -14.23], cities: { SaoPaulo: [-46.63, -23.55], Rio: [-43.17, -22.9] } } },
        },
      },
    },
    Africa: {
      label: "Afrika",
      center: [20, 4],
      countries: {
        ZA: {
          label: "Suedafrika",
          center: [22.94, -30.56],
          states: { "National": { center: [22.94, -30.56], cities: { Johannesburg: [28.05, -26.2], Kapstadt: [18.42, -33.93] } } },
        },
        NG: {
          label: "Nigeria",
          center: [8.67, 9.08],
          states: { "National": { center: [8.67, 9.08], cities: { Lagos: [3.38, 6.52], Abuja: [7.4, 9.08] } } },
        },
      },
    },
    Oceania: {
      label: "Ozeanien",
      center: [134, -24],
      countries: {
        AU: {
          label: "Australien",
          center: [133.77, -25.27],
          states: { "National": { center: [133.77, -25.27], cities: { Sydney: [151.21, -33.87], Melbourne: [144.96, -37.81] } } },
        },
      },
    },
  };

  const DASHBOARD_CACHE_KEY = "gm_dashboard_cache_v1";
  const PENDING_VOTES_KEY = "gm_pending_votes_v1";
  const LOCAL_MONTH_LOCK_KEY = "gm_local_month_lock_v1";

  const CONFIG = {
    REQUEST_TIMEOUT_MS: 10000,
    POLL_INTERVAL_MS: 45000,
    QUEUE_RETRY_BASE_MS: 30000,
    QUEUE_RETRY_MAX_MS: 15 * 60 * 1000,
    LEADERBOARD_LIMIT: 10,
  };

  const CHART_THEME = {
    text: "#2b3340",
    muted: "#5c6674",
    grid: "#e6eaf0",
    line: "#1f7a4d",
    radarFill: "rgba(31,122,77,0.12)",
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
    apiBase: "",
    questStep: 1,
    activeTab: "statsTab",
    worldMapReady: false,
    worldMap: null,
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
    return String(str).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[char]));
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
    } catch (_err) {
      return fallback;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_err) {
      return false;
    }
  }

  function safeRemove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (_err) {
      return false;
    }
  }

  async function loadRuntimeConfig() {
    const configUrl = new URL("config.json", window.location.href);
    const fromWindowEnv = window.__ENV__ && typeof window.__ENV__.API_BASE === "string" ? window.__ENV__.API_BASE : "";

    let fromConfigJson = "";
    try {
      const response = await fetch(configUrl.toString(), { cache: "no-store" });
      if (response.ok) {
        const runtimeConfig = await response.json();
        if (runtimeConfig && typeof runtimeConfig.API_BASE === "string") {
          fromConfigJson = runtimeConfig.API_BASE;
        }
      }
    } catch (_err) {
      // optional runtime config file
    }

    const fromLegacyConfig = window.GM_CONFIG && typeof window.GM_CONFIG.API_BASE === "string" ? window.GM_CONFIG.API_BASE : "";
    appState.apiBase = (fromWindowEnv || fromConfigJson || fromLegacyConfig || "").trim().replace(/\/$/, "");
  }

  function metricLabel(metric) {
    const hit = METRICS.find((m) => m.key === metric);
    return hit ? hit.label : metric;
  }

  function countryLabel(code) {
    if (code === "WORLD") return "Weltweit (Aggregat)";
    return COUNTRY_BY_CODE[code] ? COUNTRY_BY_CODE[code].name : code;
  }

  function setActiveTab(tabId) {
    appState.activeTab = tabId;
    $$(".tabBtn").forEach((btn) => {
      const active = btn.getAttribute("data-tab") === tabId;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });

    $$(".tabPanel").forEach((panel) => {
      panel.classList.toggle("active", panel.id === tabId);
    });
  }

  function initTabs() {
    $$(".tabBtn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tabId = btn.getAttribute("data-tab");
        if (tabId) setActiveTab(tabId);
      });
    });
  }

  function setQuestStep(step) {
    const safeStep = Math.max(1, Math.min(4, Number(step) || 1));
    appState.questStep = safeStep;
    const text = $("#questStepText");
    const fill = $("#questStepFill");
    if (text) text.textContent = `Schritt ${safeStep} von 4`;
    if (fill) fill.style.width = `${(safeStep / 4) * 100}%`;
  }

  function updateMoodMeter(globalIndex) {
    const value = Number(globalIndex);
    const meterValue = $("#moodValue");
    const meterFill = $("#moodFill");
    if (!Number.isFinite(value)) {
      if (meterValue) meterValue.textContent = "-";
      if (meterFill) meterFill.style.width = "0%";
      return;
    }
    const clamped = Math.max(0, Math.min(10, value));
    if (meterValue) meterValue.textContent = `${clamped.toFixed(2)} / 10`;
    if (meterFill) meterFill.style.width = `${clamped * 10}%`;
  }

  function getTrendDelta(values) {
    const nums = (values || []).filter((v) => Number.isFinite(v));
    if (nums.length < 2) return null;
    return Number((nums[nums.length - 1] - nums[nums.length - 2]).toFixed(2));
  }

  function renderScoreTiles(data) {
    const profile = (data && data.profile) || {};
    const trendValues = (data && data.trend && data.trend.values) || [];
    const trendDelta = getTrendDelta(trendValues);

    VOTE_METRICS.forEach((metric) => {
      const scoreNode = $(`#score-${metric.key}`);
      const trendNode = $(`#trend-${metric.key}`);
      const score = Number(profile[metric.key] || 0);
      if (scoreNode) scoreNode.textContent = score.toFixed(2);

      if (!trendNode) return;
      if (!Number.isFinite(trendDelta)) {
        trendNode.textContent = "-> n/a";
        trendNode.style.color = "#808b99";
      } else if (trendDelta > 0.02) {
        trendNode.textContent = `+ ${trendDelta.toFixed(2)}`;
        trendNode.style.color = "#1f7a4d";
      } else if (trendDelta < -0.02) {
        trendNode.textContent = `${trendDelta.toFixed(2)}`;
        trendNode.style.color = "#a73535";
      } else {
        trendNode.textContent = "0.00";
        trendNode.style.color = "#8a6b00";
      }
    });
  }

  function apiUrl(path, params) {
    const url = new URL(`${appState.apiBase}${path}`, window.location.origin);
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
      } catch (_err) {
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
    return fetchJson("/api/v1/dashboard", { method: "GET" }, {
      month: monthKey(),
      metric: appState.currentMetric,
      country: appState.currentCountry,
      limit: CONFIG.LEADERBOARD_LIMIT,
    });
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

  function setSelectOptions(selectEl, options, selected) {
    if (!selectEl) return;
    selectEl.innerHTML = "";
    options.forEach((opt) => {
      const o = document.createElement("option");
      o.value = opt.value;
      o.textContent = opt.label;
      selectEl.appendChild(o);
    });
    if (selected && options.some((o) => o.value === selected)) {
      selectEl.value = selected;
    }
  }

  function getCountriesForRegion(regionKey) {
    if (!regionKey || regionKey === "ALL") {
      return COUNTRIES.map((c) => c.code);
    }
    const region = GEO_TREE[regionKey];
    return region ? Object.keys(region.countries) : [];
  }

  function getRegionForCountry(code) {
    const regionKey = REGION_BY_COUNTRY[code];
    return regionKey && GEO_TREE[regionKey] ? regionKey : null;
  }

  function updateGeoSelectionText(regionKey, countryCode, stateName, cityName) {
    const regionLabel = regionKey && GEO_TREE[regionKey] ? GEO_TREE[regionKey].label : "Weltweit";
    const countryLabelText = countryCode && COUNTRY_BY_CODE[countryCode] ? COUNTRY_BY_CODE[countryCode].name : "Alle Laender";
    const parts = [regionLabel, countryLabelText];
    if (stateName && stateName !== "ALL") parts.push(stateName);
    if (cityName && cityName !== "ALL") parts.push(cityName);
    const node = $("#geoSelection");
    if (node) node.textContent = `Auswahl: ${parts.join(" / ")}`;
  }

  function populateGeoStates(countryCode, selectedState = "ALL") {
    const stateSelect = $("#geoStateSelect");
    const citySelect = $("#geoCitySelect");
    if (!countryCode || countryCode === "ALL") {
      setSelectOptions(stateSelect, [{ value: "ALL", label: "Alle Regionen" }], "ALL");
      setSelectOptions(citySelect, [{ value: "ALL", label: "Alle Staedte" }], "ALL");
      return;
    }

    const regionKey = getRegionForCountry(countryCode);
    const countryData = regionKey ? GEO_TREE[regionKey].countries[countryCode] : null;
    const stateNames = countryData ? Object.keys(countryData.states) : [];
    const options = [{ value: "ALL", label: "Alle Regionen" }].concat(stateNames.map((name) => ({ value: name, label: name })));
    setSelectOptions(stateSelect, options, selectedState);

    const stateKey = stateSelect.value;
    if (!countryData || stateKey === "ALL") {
      setSelectOptions(citySelect, [{ value: "ALL", label: "Alle Staedte" }], "ALL");
      return;
    }

    const cityNames = Object.keys(countryData.states[stateKey].cities || {});
    setSelectOptions(citySelect, [{ value: "ALL", label: "Alle Staedte" }].concat(cityNames.map((name) => ({ value: name, label: name }))), "ALL");
  }

  function populateGeoCountries(regionKey, selectedCountry = "ALL") {
    const countrySelect = $("#geoCountrySelect");
    const codes = getCountriesForRegion(regionKey);
    const options = [{ value: "ALL", label: "Alle Laender" }].concat(codes.map((code) => ({ value: code, label: countryLabel(code) })));
    setSelectOptions(countrySelect, options, selectedCountry);
    populateGeoStates(countrySelect.value);
  }

  function initGeoSelectors() {
    const regionSelect = $("#geoRegionSelect");
    const regionOptions = [{ value: "ALL", label: "Alle Kontinente" }].concat(
      Object.keys(GEO_TREE).map((key) => ({ value: key, label: GEO_TREE[key].label })),
    );
    setSelectOptions(regionSelect, regionOptions, "ALL");
    populateGeoCountries("ALL");
    updateGeoSelectionText("ALL", "ALL");
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

    VOTE_METRICS.forEach((metric, index) => {
      const slider = $(`#m_${metric.key}`);
      const output = $(`#o_${metric.key}`);
      const stepNo = index + 1;
      slider.addEventListener("input", () => {
        output.textContent = slider.value;
        setQuestStep(stepNo);
      });
      slider.addEventListener("focus", () => setQuestStep(stepNo));
    });

    setQuestStep(1);
  }

  function moodColor(value, fallback = "#e9edf2") {
    if (!Number.isFinite(value)) return fallback;
    if (value < 4.5) return "#f0a5a5";
    if (value < 6.5) return "#f5ddb0";
    return "#9bd7b8";
  }

  function regionForLonLat(lon, lat) {
    if (lon >= -170 && lon <= -30 && lat > 10) return "North America";
    if (lon >= -95 && lon <= -30 && lat <= 10) return "South America";
    if (lon >= -25 && lon <= 60 && lat > 30) return "Europe";
    if (lon >= -20 && lon <= 55 && lat >= -35 && lat <= 30) return "Africa";
    if (lon >= 55 && lon <= 180 && lat > -10) return "Asia";
    if (lon >= 100 && lon <= 180 && lat < -10) return "Oceania";
    return "Global";
  }

  function computeRegionMood(snapshot, globalValue) {
    const grouped = {
      Europe: [],
      "North America": [],
      "South America": [],
      Asia: [],
      Africa: [],
      Oceania: [],
      Global: [],
    };

    (snapshot && snapshot.countries ? snapshot.countries : []).forEach((row) => {
      const region = REGION_BY_COUNTRY[row.country] || "Global";
      grouped[region].push(Number(row.value));
      grouped.Global.push(Number(row.value));
    });

    const out = {};
    Object.entries(grouped).forEach(([region, values]) => {
      const valid = values.filter((v) => Number.isFinite(v));
      if (!valid.length) {
        out[region] = Number.isFinite(globalValue) ? Number(globalValue) : null;
        return;
      }
      out[region] = valid.reduce((a, b) => a + b, 0) / valid.length;
    });
    return out;
  }

  function worldMapTransform(tx, ty, scale) {
    if (!appState.worldMap || !appState.worldMap.zoomLayer) return;
    appState.worldMap.zoomLayer
      .transition()
      .duration(260)
      .attr("transform", `translate(${tx},${ty}) scale(${scale})`);
    appState.worldMap.transform = { tx, ty, scale };
  }

  function worldMapResetZoom() {
    if (!appState.worldMap || !appState.worldMap.width) return;
    worldMapTransform(0, 0, 1);
    appState.worldMap.paths.classed("active", false);
  }

  function worldMapZoomToFeature(feature) {
    if (!appState.worldMap) return;
    const bounds = appState.worldMap.path.bounds(feature);
    const dx = bounds[1][0] - bounds[0][0];
    const dy = bounds[1][1] - bounds[0][1];
    const x = (bounds[0][0] + bounds[1][0]) / 2;
    const y = (bounds[0][1] + bounds[1][1]) / 2;
    const scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / appState.worldMap.width, dy / appState.worldMap.height)));
    const tx = appState.worldMap.width / 2 - scale * x;
    const ty = appState.worldMap.height / 2 - scale * y;
    worldMapTransform(tx, ty, scale);
  }

  function worldMapZoomToLonLat(lon, lat, scale = 3) {
    if (!appState.worldMap) return;
    const p = appState.worldMap.projection([lon, lat]);
    if (!p) return;
    const s = Math.max(1, Math.min(9, scale));
    const tx = appState.worldMap.width / 2 - s * p[0];
    const ty = appState.worldMap.height / 2 - s * p[1];
    worldMapTransform(tx, ty, s);
  }

  async function initWorldMap() {
    if (appState.worldMapReady) return;
    if (typeof window.d3 === "undefined" || typeof window.topojson === "undefined") return;

    const svg = window.d3.select("#worldMapSvg");
    if (svg.empty()) return;

    const width = 960;
    const height = 480;
    svg.selectAll("*").remove();

    const projection = window.d3.geoNaturalEarth1().fitSize([width, height], { type: "Sphere" });
    const path = window.d3.geoPath(projection);

    const zoomLayer = svg.append("g").attr("class", "world-zoom-layer");
    zoomLayer.append("path")
      .datum({ type: "Sphere" })
      .attr("d", path)
      .attr("fill", "#f8fafc")
      .attr("stroke", "#d8dee6")
      .attr("stroke-width", 1);

    let countries = [];
    try {
      const world = await window.d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");
      countries = window.topojson.feature(world, world.objects.countries).features;
    } catch (_err) {
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#7a8594")
        .style("font-size", "14px")
        .text("Weltkarte konnte nicht geladen werden.");
      return;
    }

    const featureByCode = {};
    const paths = zoomLayer.append("g")
      .attr("class", "world-country-layer")
      .selectAll("path")
      .data(countries)
      .join("path")
      .attr("d", path)
      .attr("class", "world-country")
      .attr("fill", "#e9edf2")
      .attr("stroke", "#cfd6de")
      .attr("stroke-width", 0.35)
      .each((feature) => {
        const code = N3_TO_A2[String(feature.id).padStart(3, "0")] || N3_TO_A2[String(feature.id)];
        if (code) featureByCode[code] = feature;
      })
      .on("click", (event, feature) => {
        event.stopPropagation();
        paths.classed("active", false);
        const el = window.d3.select(event.currentTarget);
        el.classed("active", true);
        worldMapZoomToFeature(feature);

        const code = N3_TO_A2[String(feature.id).padStart(3, "0")] || N3_TO_A2[String(feature.id)];
        if (code) {
          const regionKey = getRegionForCountry(code);
          const regionSelect = $("#geoRegionSelect");
          const countrySelect = $("#geoCountrySelect");
          if (regionKey && regionSelect) regionSelect.value = regionKey;
          populateGeoCountries(regionKey || "ALL", code);
          if (countrySelect) countrySelect.value = code;
          populateGeoStates(code);
          updateGeoSelectionText(regionKey, code, "ALL", "ALL");

          const statsCountry = $("#countrySelect");
          if (statsCountry && statsCountry.value !== code) {
            statsCountry.value = code;
            statsCountry.dispatchEvent(new Event("change"));
          }
        }
      });

    svg.on("click", () => worldMapResetZoom());

    appState.worldMap = {
      width,
      height,
      projection,
      path,
      zoomLayer,
      paths,
      featureByCode,
      transform: { tx: 0, ty: 0, scale: 1 },
    };
    appState.worldMapReady = true;
  }

  function updateWorldMap(snapshot, globalIndex) {
    if (!appState.worldMapReady || !appState.worldMap) return;
    const regionMood = computeRegionMood(snapshot, globalIndex);

    appState.worldMap.paths
      .attr("fill", (feature) => {
        const c = window.d3.geoCentroid(feature);
        const region = regionForLonLat(c[0], c[1]);
        return moodColor(regionMood[region], "#eceff3");
      });
  }

  function renderHeader(data) {
    const header = (data && data.header) || {};
    const meta = (data && data.meta) || {};
    const status = (data && data.status) || {};

    const globalIndex = header.globalIndex;
    $("#globalIndex").textContent = Number.isFinite(globalIndex) ? Number(globalIndex).toFixed(2) : "-";
    updateMoodMeter(globalIndex);

    const delta = header.deltaMoM;
    const deltaNode = $("#deltaMoM");
    deltaNode.classList.remove("ok", "bad", "warn");

    if (!Number.isFinite(delta)) {
      deltaNode.classList.add("warn");
      deltaNode.innerHTML = "<span class=\"dot\"></span>Trend: <strong>n/a</strong> (Vorperiode fehlt)";
    } else {
      deltaNode.classList.add(delta > 0.05 ? "ok" : delta < -0.05 ? "bad" : "warn");
      deltaNode.innerHTML = `<span class="dot"></span>Trend: <strong>${delta >= 0 ? "+" : ""}${Number(delta).toFixed(2)}</strong> seit letztem Monat`;
    }

    const votes = Number(header.totalVotes || 0);
    $("#totalVotes").innerHTML = `<span class="dot"></span>Stimmen: <strong>${fmtInt(votes)}</strong>`;

    const sample = $("#sampleHint");
    if (votes < 25) {
      sample.classList.remove("ok", "bad");
      sample.classList.add("warn");
      sample.innerHTML = `<span class="dot"></span><strong>Kleine Stichprobe (${fmtInt(votes)} Stimmen)</strong>`;
    } else {
      sample.classList.remove("warn", "bad");
      sample.classList.add("ok");
      sample.innerHTML = `<span class="dot"></span><strong>Stichprobe waechst (${fmtInt(votes)} Stimmen)</strong>`;
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
      note.innerHTML = `<strong>Hinweis:</strong> Ihr habt diesen Monat bereits abgestimmt (lokale Sicherung). Naechste Abgabe ab <span class="pill">${nextMonthKey()}</span>.`;
      return;
    }

    if (queueSize()) {
      note.innerHTML = `<strong>Warteschlange aktiv:</strong> ${queueSize()} Vote(s) werden automatisch erneut gesendet. Bitte nichts doppelt absenden.`;
      return;
    }

    if (voteBusy) {
      note.innerHTML = "<strong>Hinweis:</strong> Statistik bleibt abrufbar. Voting kann bei Last kurz verzoegert sein.";
      return;
    }

    note.innerHTML = "<strong>Prinzip:</strong> anonym & aggregiert. 1 Stimme pro Geraet und Monat (serverseitig abgesichert).";
  }

  function renderLeaderboard(data) {
    const body = $("#leaderBody");
    body.innerHTML = "";

    const rows = (data && data.leaderboard && data.leaderboard.rows) || [];
    const minCountryN = data && data.meta ? data.meta.minCountryN : 0;

    if (!rows.length) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="5" class="muted">Noch keine Laender mit mindestens ${minCountryN} Stimmen im aktuellen Monat.</td>`;
      body.appendChild(tr);
      return;
    }

    rows.forEach((row, index) => {
      const tr = document.createElement("tr");
      const delta = row.delta;
      const deltaText = Number.isFinite(delta) ? `${delta >= 0 ? "+" : ""}${Number(delta).toFixed(2)}` : "n/a";
      const deltaColor = !Number.isFinite(delta)
        ? "#7a8594"
        : delta >= 0
          ? "#1f7a4d"
          : "#a73535";

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
      toast("Chart.js nicht verfuegbar.", "Diagramme werden nicht angezeigt.");
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
          borderColor: CHART_THEME.line,
          pointBackgroundColor: CHART_THEME.line,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, labels: { color: CHART_THEME.text } },
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
          x: { ticks: { color: CHART_THEME.muted }, grid: { color: CHART_THEME.grid } },
          y: { min: 0, max: 10, ticks: { color: CHART_THEME.muted }, grid: { color: CHART_THEME.grid } },
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
          data: [Number(profile.politics || 0), Number(profile.environment || 0), Number(profile.safety || 0), Number(profile.social || 0)],
          borderWidth: 2,
          pointRadius: 3,
          borderColor: CHART_THEME.line,
          pointBackgroundColor: CHART_THEME.line,
          backgroundColor: CHART_THEME.radarFill,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true, labels: { color: CHART_THEME.text } } },
        scales: {
          r: {
            min: 0,
            max: 10,
            ticks: { color: CHART_THEME.muted },
            grid: { color: CHART_THEME.grid },
            angleLines: { color: CHART_THEME.grid },
            pointLabels: { color: CHART_THEME.text },
          },
        },
      },
    });
  }

  async function renderDashboard(data) {
    appState.dashboard = data;
    renderHeader(data);
    renderScoreTiles(data);
    renderLeaderboard(data);
    renderCharts(data);
    if (!appState.worldMapReady) {
      await initWorldMap();
    }
    updateWorldMap(data.snapshot, data.header && data.header.globalIndex);
  }

  async function refreshDashboard() {
    if (appState.refreshBusy) return;
    appState.refreshBusy = true;

    try {
      const dashboard = await getDashboard();
      appState.online = true;
      writeCachedDashboard(dashboard);
      await renderDashboard(dashboard);
    } catch (err) {
      appState.online = false;
      const cached = readCachedDashboard();
      if (cached && cached.dashboard) {
        await renderDashboard(cached.dashboard);
        toast("Live-Daten aktuell nicht erreichbar.", "Anzeige aus lokalem Cache.");
      } else {
        toast("Backend nicht erreichbar.", "Bitte API-URL pruefen oder spaeter erneut laden.");
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
      const next = appState.pendingVotes.slice().sort((a, b) => a.retryAt - b.retryAt)[0];
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
      const hint = $("#liveHint");
      if (hint) hint.textContent = `${appState.online ? "Live-API" : "lokaler Cache"}${queueInfoText()}`;
    }
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

  async function submitVote() {
    if (localMonthLocked()) {
      toast("Diesen Monat bereits abgestimmt.", "Lokale Sicherung aktiv.");
      return;
    }

    const payload = buildVotePayload();
    try {
      await postVote(payload);
      setLocalMonthLock();
      toast("Abstimmung gespeichert.", "Danke fuer deine Stimme.");
      setActiveTab("statsTab");
      await refreshDashboard();
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

      toast("Abstimmung fehlgeschlagen.", "Bitte spaeter erneut versuchen.");
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
    setQuestStep(4);
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

      toast("Teilen nicht verfuegbar.");
    } catch (_err) {
      toast("Teilen abgebrochen.");
    }
  }

  function initNav() {
    $$('[data-scroll]').forEach((btn) => {
      btn.addEventListener("click", () => {
        const sel = btn.getAttribute("data-scroll");
        if (sel === "#stats") {
          setActiveTab("statsTab");
          return;
        }
        if (sel === "#vote" || sel === "#method") {
          setActiveTab("voteTab");
          const node = document.querySelector(sel);
          if (node) node.scrollIntoView({ behavior: "smooth", block: "start" });
        }
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
      const code = appState.currentCountry;
      if (code && code !== "WORLD") {
        const regionKey = getRegionForCountry(code);
        const regionSelect = $("#geoRegionSelect");
        if (regionSelect && regionKey) regionSelect.value = regionKey;
        populateGeoCountries(regionKey || "ALL", code);
        populateGeoStates(code);
        updateGeoSelectionText(regionKey, code, "ALL", "ALL");
        if (appState.worldMap && appState.worldMap.featureByCode[code]) {
          worldMapZoomToFeature(appState.worldMap.featureByCode[code]);
          appState.worldMap.paths.classed("active", false);
        }
      }
      await refreshDashboard();
    });

    $("#geoRegionSelect").addEventListener("change", (event) => {
      const regionKey = event.target.value;
      populateGeoCountries(regionKey);
      const countryCode = $("#geoCountrySelect").value;
      updateGeoSelectionText(regionKey, countryCode, "ALL", "ALL");
      if (regionKey !== "ALL" && GEO_TREE[regionKey]) {
        const center = GEO_TREE[regionKey].center;
        worldMapZoomToLonLat(center[0], center[1], 2.1);
      } else {
        worldMapResetZoom();
      }
    });

    $("#geoCountrySelect").addEventListener("change", async (event) => {
      const countryCode = event.target.value;
      populateGeoStates(countryCode);
      const regionKey = getRegionForCountry(countryCode);
      updateGeoSelectionText(regionKey, countryCode, "ALL", "ALL");

      if (countryCode !== "ALL") {
        const statsCountry = $("#countrySelect");
        if (statsCountry.value !== countryCode) {
          statsCountry.value = countryCode;
          statsCountry.dispatchEvent(new Event("change"));
          return;
        }
        if (appState.worldMap && appState.worldMap.featureByCode[countryCode]) {
          worldMapZoomToFeature(appState.worldMap.featureByCode[countryCode]);
        }
      } else {
        worldMapResetZoom();
      }
      await refreshDashboard();
    });

    $("#geoStateSelect").addEventListener("change", (event) => {
      const countryCode = $("#geoCountrySelect").value;
      const stateKey = event.target.value;
      const citySelect = $("#geoCitySelect");
      const regionKey = getRegionForCountry(countryCode);
      if (!countryCode || countryCode === "ALL") {
        setSelectOptions(citySelect, [{ value: "ALL", label: "Alle Staedte" }], "ALL");
        return;
      }
      const countryData = regionKey ? GEO_TREE[regionKey].countries[countryCode] : null;
      if (!countryData || stateKey === "ALL") {
        setSelectOptions(citySelect, [{ value: "ALL", label: "Alle Staedte" }], "ALL");
        updateGeoSelectionText(regionKey, countryCode, "ALL", "ALL");
        return;
      }
      const cities = Object.keys(countryData.states[stateKey].cities || {});
      setSelectOptions(citySelect, [{ value: "ALL", label: "Alle Staedte" }].concat(cities.map((c) => ({ value: c, label: c }))), "ALL");
      const center = countryData.states[stateKey].center;
      if (center) worldMapZoomToLonLat(center[0], center[1], 4.2);
      updateGeoSelectionText(regionKey, countryCode, stateKey, "ALL");
    });

    $("#geoCitySelect").addEventListener("change", (event) => {
      const cityKey = event.target.value;
      const countryCode = $("#geoCountrySelect").value;
      const stateKey = $("#geoStateSelect").value;
      const regionKey = getRegionForCountry(countryCode);
      const countryData = regionKey ? GEO_TREE[regionKey].countries[countryCode] : null;
      if (!countryData || !stateKey || stateKey === "ALL" || cityKey === "ALL") {
        updateGeoSelectionText(regionKey, countryCode, stateKey, "ALL");
        return;
      }
      const cityCoords = countryData.states[stateKey].cities[cityKey];
      if (cityCoords) worldMapZoomToLonLat(cityCoords[0], cityCoords[1], 7);
      updateGeoSelectionText(regionKey, countryCode, stateKey, cityKey);
    });

    $("#geoResetBtn").addEventListener("click", () => {
      $("#geoRegionSelect").value = "ALL";
      populateGeoCountries("ALL");
      worldMapResetZoom();
      updateGeoSelectionText("ALL", "ALL", "ALL", "ALL");
    });

    $("#submitVote").addEventListener("click", submitVote);
    $("#randomize").addEventListener("click", randomizeVote);
    $("#shareBtn").addEventListener("click", share);

    const resetLocalBtn = $("#resetLocal");
    if (resetLocalBtn) {
      resetLocalBtn.addEventListener("click", () => {
        const ok = window.confirm("Lokale Warteschlange, Cache und Monats-Lock wirklich loeschen?");
        if (!ok) return;

        appState.pendingVotes = [];
        safeRemove(PENDING_VOTES_KEY);
        safeRemove(DASHBOARD_CACHE_KEY);
        clearLocalMonthLock();
        renderCooldownNote(false);
        toast("Lokale Pufferdaten geloescht.");
      });
    }
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
    await loadRuntimeConfig();
    appState.pendingVotes = readPendingVotes();

    initTabs();
    setActiveTab("statsTab");

    renderMetricsSelect();
    renderCountrySelects();
    initGeoSelectors();
    renderVoteGrid();
    initNav();
    bindEvents();

    runSmokeChecks();
    await initWorldMap();
    await refreshDashboard();
    await flushVoteQueue();
    initIntervals();
  }

  init();
})();
