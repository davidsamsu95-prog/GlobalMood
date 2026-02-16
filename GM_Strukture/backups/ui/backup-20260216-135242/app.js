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
	            Berlin: { center: [13.4, 52.52], cities: { Berlin: [13.4, 52.52] } },
	            Brandenburg: { center: [13.43, 52.41], cities: { Potsdam: [13.06, 52.4], Cottbus: [14.33, 51.76] } },
	            Bremen: { center: [8.8, 53.08], cities: { Bremen: [8.8, 53.08], Bremerhaven: [8.58, 53.55] } },
	            Hamburg: { center: [9.99, 53.55], cities: { Hamburg: [9.99, 53.55] } },
	            Hessen: { center: [9.0, 50.5], cities: { Frankfurt: [8.68, 50.11], Wiesbaden: [8.24, 50.08] } },
	            "Mecklenburg-Vorpommern": { center: [12.5, 53.8], cities: { Schwerin: [11.41, 53.63], Rostock: [12.14, 54.09] } },
	            Niedersachsen: { center: [9.4, 52.8], cities: { Hannover: [9.73, 52.37], Braunschweig: [10.53, 52.27] } },
	            "Nordrhein-Westfalen": { center: [7.55, 51.47], cities: { Koeln: [6.96, 50.94], Duesseldorf: [6.78, 51.23] } },
	            "Rheinland-Pfalz": { center: [7.45, 49.95], cities: { Mainz: [8.27, 49.99], Koblenz: [7.59, 50.36] } },
	            Saarland: { center: [6.99, 49.4], cities: { Saarbruecken: [6.99, 49.24] } },
	            Sachsen: { center: [13.2, 51.0], cities: { Dresden: [13.74, 51.05], Leipzig: [12.37, 51.34] } },
	            "Sachsen-Anhalt": { center: [11.69, 51.95], cities: { Magdeburg: [11.64, 52.13], Halle: [11.97, 51.48] } },
	            "Schleswig-Holstein": { center: [9.8, 54.2], cities: { Kiel: [10.12, 54.32], Luebeck: [10.69, 53.87] } },
	            Thueringen: { center: [11.03, 50.98], cities: { Erfurt: [11.03, 50.98], Jena: [11.59, 50.93] } },
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
  const UI_LANG_KEY = "gm_ui_lang_v1";
  const ANNUAL_BASELINE_URL = "annual_baseline.json";

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
    detectedCountry: "OTHER",
    countrySourceMode: "auto",
    backendConfigured: false,
    tabAnimTimer: null,
    dataMode: "monthly",
    annualBaseline: null,
    uiLang: "de",
    uiLocale: "de-DE",
  };

  const I18N = {
    de: {
      langName: "Deutsch",
      nav: { stats: "Weltstatistik", vote: "Abstimmen", method: "Methodik", switchView: "Ansicht wechseln" },
      stats: {
        title: "Weltstatistik",
        mapByRegion: "Weltkarte nach Regionen",
        legendLow: "niedrig",
        legendMid: "mittel",
        legendHigh: "hoch",
        geoRegion: "Kontinent",
        geoCountry: "Land",
        geoState: "Region/Bundesland",
        geoCity: "Stadt",
        geoReset: "Karte zuruecksetzen",
        geoAllContinents: "Alle Kontinente",
        geoAllCountries: "Alle Laender",
        geoAllRegions: "Alle Regionen",
        geoAllCities: "Alle Staedte",
        selectionPrefix: "Auswahl:",
        selectionWorld: "Weltweit",
        selectionAllCountries: "Alle Laender",
        metric: "Metrik",
        regionCountry: "Region / Land",
        worldAggregate: "Weltweit (Aggregat)",
        otherCountry: "Anderes / nicht genannt",
        trendPrefix: "Trend:",
        trendSinceLastMonth: "seit letztem Monat",
        trendNoPrev: "n/a (Vorperiode fehlt)",
        votesLabel: "Stimmen:",
        sampleSmall: "Kleine Stichprobe ({count} Stimmen)",
        sampleGrowing: "Stichprobe waechst ({count} Stimmen)",
        noAnnualRows: "Keine Jahreswerte fuer Laender vorhanden.",
        noMonthlyRows: "Noch keine Laender mit mindestens {min} Stimmen im aktuellen Monat.",
      },
      modes: {
        monthly: "Monatlich",
        annual: "Jaehrlich",
        sources: "Quellen",
        annualHint: "Offizielle Jahresdaten {year} (statisch, kuratiert)",
        annualLoadFailed: "Jahresdaten konnten nicht geladen werden.",
      },
      live: {
        liveApi: "Live-API",
        localCache: "lokaler Cache",
        busy: "Voting gerade ausgelastet",
        queue: "Warteschlange: {count} Vote(s)",
      },
      vote: {
        step: "Schritt {current} von {total}",
        detected: "Erkannt: {country}",
        source: "Quelle: {mode}",
        manualToggle: "Manuell waehlen",
      },
      cooldown: {
        note: "Hinweis:",
        queueActive: "Warteschlange aktiv:",
        principle: "Prinzip:",
        already: "Ihr habt diesen Monat bereits abgestimmt (lokale Sicherung). Naechste Abgabe ab",
        queueText: "{count} Vote(s) werden automatisch erneut gesendet. Bitte nichts doppelt absenden.",
        busy: "Statistik bleibt abrufbar. Voting kann bei Last kurz verzoegert sein.",
        principleText: "anonym & aggregiert. 1 Stimme pro Geraet und Monat (serverseitig abgesichert).",
      },
      toast: {
        random: "Zufallswerte gesetzt.",
        bufferedSent: "Gepufferter Vote erfolgreich gesendet.",
        month: "Monat {month}",
        votedAlready: "Diesen Monat bereits abgestimmt.",
        localGuard: "Lokale Sicherung aktiv.",
        voteSaved: "Abstimmung gespeichert.",
        voteThanks: "Danke fuer deine Stimme.",
        serverRule: "Serverseitige Monatsregel hat gegriffen.",
        busyBuffered: "Voting ausgelastet - Stimme gepuffert.",
        autoRetry: "Die App sendet automatisch nach.",
        voteFailed: "Abstimmung fehlgeschlagen.",
        retryLater: "Bitte spaeter erneut versuchen.",
        shared: "Geteilt.",
        linkCopied: "Link kopiert.",
        shareUnavailable: "Teilen nicht verfuegbar.",
        shareCanceled: "Teilen abgebrochen.",
      },
      charts: { noData: "keine Daten", trendLabel: "Trend", profileLabel: "Profil", votes: "Stimmen" },
      metrics: {
        global: "Gesamtzufriedenheit",
        politics: "Politik",
        environment: "Umwelt",
        safety: "Sicherheit",
        social: "Soziales",
      },
      metricDesc: {
        politics: "Wie zufrieden seid Ihr mit der politischen Gesamtsituation?",
        environment: "Wie erlebt Ihr Natur, Klima, Luft, Wasser, Zukunftsfahigkeit?",
        safety: "Wie sicher fuehlt sich Euer Alltag an (Kriminalitaet, Stabilitaet, Frieden)?",
        social: "Wie empfindet Ihr Zusammenhalt, Fairness, Lebensqualitaet im Miteinander?",
      },
      sourceModal: {
        title: "Jahresdaten: Quellen",
        close: "Schliessen",
        noLoaded: "Keine Jahresquellen geladen.",
        source: "Quelle",
        dataset: "Datensatz:",
        none: "Keine Einzelquellen hinterlegt.",
      },
      methodModal: { close: "Schliessen" },
      table: { rank: "Rang", country: "Land", index: "Index", delta: "Delta", votes: "Stimmen" },
    },
    en: {
      langName: "English",
      nav: { stats: "World Stats", vote: "Vote", method: "Method", switchView: "Switch view" },
      stats: {
        title: "World Stats",
        mapByRegion: "World map by regions",
        legendLow: "low",
        legendMid: "medium",
        legendHigh: "high",
        geoRegion: "Continent",
        geoCountry: "Country",
        geoState: "Region/State",
        geoCity: "City",
        geoReset: "Reset map",
        geoAllContinents: "All continents",
        geoAllCountries: "All countries",
        geoAllRegions: "All regions",
        geoAllCities: "All cities",
        selectionPrefix: "Selection:",
        selectionWorld: "Worldwide",
        selectionAllCountries: "All countries",
        metric: "Metric",
        regionCountry: "Region / Country",
        worldAggregate: "Worldwide (aggregate)",
        otherCountry: "Other / not listed",
        trendPrefix: "Trend:",
        trendSinceLastMonth: "since last month",
        trendNoPrev: "n/a (no previous period)",
        votesLabel: "Votes:",
        sampleSmall: "Small sample ({count} votes)",
        sampleGrowing: "Sample growing ({count} votes)",
        noAnnualRows: "No annual country values available.",
        noMonthlyRows: "No countries with at least {min} votes this month yet.",
      },
      modes: {
        monthly: "Monthly",
        annual: "Annual",
        sources: "Sources",
        annualHint: "Official annual data {year} (static, curated)",
        annualLoadFailed: "Annual data could not be loaded.",
      },
      live: {
        liveApi: "Live API",
        localCache: "local cache",
        busy: "Voting is currently under load",
        queue: "Queue: {count} vote(s)",
      },
      vote: {
        step: "Step {current} of {total}",
        detected: "Detected: {country}",
        source: "Source: {mode}",
        manualToggle: "Select manually",
      },
      cooldown: {
        note: "Note:",
        queueActive: "Queue active:",
        principle: "Principle:",
        already: "You already voted this month (local safeguard). Next submission from",
        queueText: "{count} vote(s) will be retried automatically. Please do not submit duplicates.",
        busy: "Statistics remain available. Voting may be briefly delayed under load.",
        principleText: "anonymous & aggregated. 1 vote per device and month (server-side enforced).",
      },
      toast: {
        random: "Random values set.",
        bufferedSent: "Buffered vote sent successfully.",
        month: "Month {month}",
        votedAlready: "Already voted this month.",
        localGuard: "Local safeguard active.",
        voteSaved: "Vote saved.",
        voteThanks: "Thanks for your vote.",
        serverRule: "Server-side monthly rule applied.",
        busyBuffered: "Voting busy - vote buffered.",
        autoRetry: "The app retries automatically.",
        voteFailed: "Vote failed.",
        retryLater: "Please try again later.",
        shared: "Shared.",
        linkCopied: "Link copied.",
        shareUnavailable: "Share not available.",
        shareCanceled: "Share canceled.",
      },
      charts: { noData: "no data", trendLabel: "Trend", profileLabel: "Profile", votes: "votes" },
      metrics: {
        global: "Overall satisfaction",
        politics: "Politics",
        environment: "Environment",
        safety: "Safety",
        social: "Social",
      },
      metricDesc: {
        politics: "How satisfied are you with the overall political situation?",
        environment: "How do you experience nature, climate, air, water, and future sustainability?",
        safety: "How safe does your daily life feel (crime, stability, peace)?",
        social: "How do you perceive cohesion, fairness, and quality of life in society?",
      },
      sourceModal: {
        title: "Annual data: sources",
        close: "Close",
        noLoaded: "No annual sources loaded.",
        source: "Source",
        dataset: "Dataset:",
        none: "No individual sources provided.",
      },
      methodModal: { close: "Close" },
      table: { rank: "Rank", country: "Country", index: "Index", delta: "Delta", votes: "Votes" },
    },
  };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function deepRead(obj, path) {
    return String(path || "").split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
  }

  function t(key, vars = {}) {
    const lang = I18N[appState.uiLang] ? appState.uiLang : "de";
    const template = deepRead(I18N[lang], key) ?? deepRead(I18N.de, key) ?? key;
    return String(template).replace(/\{(\w+)\}/g, (_m, token) => (vars[token] !== undefined ? String(vars[token]) : `{${token}}`));
  }

  function resolveUiLang(input) {
    const raw = String(input || "").toLowerCase();
    if (raw.startsWith("de")) return "de";
    if (raw.startsWith("en")) return "en";
    return "de";
  }

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
    return `${d.toLocaleString(appState.uiLocale || "de-DE", { month: "short" })} ${String(d.getFullYear()).slice(2)}`;
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
    return t(`metrics.${metric}`) || metric;
  }

  function countryLabel(code) {
    if (code === "WORLD") return t("stats.worldAggregate");
    return COUNTRY_BY_CODE[code] ? COUNTRY_BY_CODE[code].name : code;
  }

  function isAnnualMode() {
    return appState.dataMode === "annual";
  }

  function parseAnnualValue(rawValue) {
    const n = Number(rawValue);
    if (!Number.isFinite(n)) return null;
    if (n <= 10) return Math.max(0, Math.min(10, n));
    return Math.max(0, Math.min(10, n / 10));
  }

  function parseAnnualRow(row) {
    if (!row || typeof row !== "object") return null;
    const country = String(row.country || row.countryCode || row.code || "").toUpperCase();
    if (!country || !COUNTRY_BY_CODE[country]) return null;
    const value = parseAnnualValue(row.value);
    if (!Number.isFinite(value)) return null;
    const metrics = row.metrics && typeof row.metrics === "object" ? row.metrics : {};
    const politics = parseAnnualValue(metrics.politics ?? row.politics ?? value);
    const environment = parseAnnualValue(metrics.environment ?? row.environment ?? value);
    const safety = parseAnnualValue(metrics.safety ?? row.safety ?? value);
    const social = parseAnnualValue(metrics.social ?? row.social ?? value);
    return {
      country,
      value,
      n: Number(row.n || row.sampleSize || 0),
      delta: Number.isFinite(Number(row.delta)) ? Number(row.delta) : null,
      politics: Number.isFinite(politics) ? politics : value,
      environment: Number.isFinite(environment) ? environment : value,
      safety: Number.isFinite(safety) ? safety : value,
      social: Number.isFinite(social) ? social : value,
    };
  }

  async function loadAnnualBaseline() {
    if (appState.annualBaseline) return appState.annualBaseline;
    const res = await fetch(ANNUAL_BASELINE_URL, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`annual_baseline_load_failed_${res.status}`);
    }
    const json = await res.json();
    const rows = Array.isArray(json.countries) ? json.countries.map(parseAnnualRow).filter(Boolean) : [];
    appState.annualBaseline = {
      year: Number(json.year) || new Date().getFullYear(),
      updatedAt: json.updatedAt || null,
      sourceNote: json.sourceNote || "",
      sources: Array.isArray(json.sources) ? json.sources : [],
      rows,
    };
    return appState.annualBaseline;
  }

  function buildAnnualDashboard(annual) {
    const rows = Array.isArray(annual && annual.rows) ? annual.rows.slice() : [];
    const validValues = rows.map((r) => Number(r.value)).filter((n) => Number.isFinite(n));
    const global = validValues.length ? validValues.reduce((a, b) => a + b, 0) / validValues.length : null;
    const selectedCode = appState.currentCountry === "WORLD" ? null : appState.currentCountry;
    const selectedRow = selectedCode ? rows.find((r) => r.country === selectedCode) : null;
    const profileRow = selectedRow || {
      country: "WORLD",
      value: global,
      n: rows.reduce((acc, r) => acc + Number(r.n || 0), 0),
      politics: global,
      environment: global,
      safety: global,
      social: global,
    };
    const scoreKey = appState.currentMetric === "global" ? "value" : appState.currentMetric;
    const sortedRows = rows
      .slice()
      .sort((a, b) => Number((b[scoreKey] ?? b.value) || 0) - Number((a[scoreKey] ?? a.value) || 0))
      .slice(0, CONFIG.LEADERBOARD_LIMIT)
      .map((r) => ({
        country: r.country,
        value: Number((r[scoreKey] ?? r.value) || 0),
        delta: r.delta,
        n: r.n,
      }));
    const trendLabel = String(annual.year || new Date().getFullYear());
    const selectedMetricValue = Number(profileRow[appState.currentMetric] || profileRow.value || global || 0);
    return {
      month: trendLabel,
      metric: appState.currentMetric,
      country: appState.currentCountry,
      minCountryN: 0,
      header: {
        globalIndex: global,
        deltaMoM: null,
        totalVotes: rows.reduce((acc, r) => acc + Number(r.n || 0), 0),
      },
      trend: {
        labels: [trendLabel],
        values: [selectedMetricValue],
      },
      profile: {
        country: profileRow.country,
        n: profileRow.n || 0,
        n_manual: 0,
        n_auto: 0,
        politics: Number(profileRow.politics || 0),
        environment: Number(profileRow.environment || 0),
        safety: Number(profileRow.safety || 0),
        social: Number(profileRow.social || 0),
        global: Number(profileRow.value || 0),
      },
      snapshot: {
        month: trendLabel,
        metric: appState.currentMetric,
        world: {
          n: rows.reduce((acc, r) => acc + Number(r.n || 0), 0),
          n_manual: 0,
          n_auto: 0,
          value: Number.isFinite(global) ? global : 0,
        },
        countries: rows.map((r) => ({
          country: r.country,
          value: r[appState.currentMetric] || r.value,
          n: r.n,
          n_manual: 0,
          n_auto: 0,
        })),
      },
      leaderboard: {
        month: trendLabel,
        metric: appState.currentMetric,
        rows: sortedRows,
      },
      meta: {
        serverTime: annual.updatedAt || null,
        version: `annual-${trendLabel}`,
        minCountryN: 0,
        dataMode: "annual",
      },
      status: {
        voteBusy: false,
        readCacheTtlMs: 0,
      },
    };
  }

  function renderAnnualSourcesModal() {
    const body = $("#sourceModalBody");
    if (!body) return;
    const annual = appState.annualBaseline;
    if (!annual) {
      body.innerHTML = `<div class="muted">${escapeHtml(t("sourceModal.noLoaded"))}</div>`;
      return;
    }
    const items = (annual.sources || []).map((src) => {
      if (!src || typeof src !== "object") return "";
      const label = escapeHtml(src.title || src.name || t("sourceModal.source"));
      const url = src.url ? String(src.url) : "";
      if (!url) return `<li>${label}</li>`;
      return `<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${label}</a></li>`;
    }).filter(Boolean);
    const note = annual.sourceNote ? `<div class="sourceMeta">${escapeHtml(annual.sourceNote)}</div>` : "";
    body.innerHTML = `
      <div class="fineprint">${escapeHtml(t("sourceModal.dataset"))} <span class="pill">${escapeHtml(String(annual.year || ""))}</span></div>
      ${items.length ? `<ul class="sourceList">${items.join("")}</ul>` : `<div class="muted">${escapeHtml(t("sourceModal.none"))}</div>`}
      ${note}
    `;
  }

  function openSourceModal() {
    renderAnnualSourcesModal();
    const modal = $("#sourceModal");
    if (!modal) return;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modalOpen");
  }

  function closeSourceModal() {
    const modal = $("#sourceModal");
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    if (!$("#methodModal") || !$("#methodModal").classList.contains("open")) {
      document.body.classList.remove("modalOpen");
    }
  }

  function renderDataModeUi() {
    const monthlyBtn = $("#modeMonthlyBtn");
    const annualBtn = $("#modeAnnualBtn");
    const sourceBtn = $("#annualSourcesBtn");
    const annual = isAnnualMode();
    if (monthlyBtn) {
      monthlyBtn.textContent = t("modes.monthly");
      monthlyBtn.classList.toggle("active", !annual);
      monthlyBtn.setAttribute("aria-pressed", annual ? "false" : "true");
    }
    if (annualBtn) {
      annualBtn.textContent = t("modes.annual");
      annualBtn.classList.toggle("active", annual);
      annualBtn.setAttribute("aria-pressed", annual ? "true" : "false");
    }
    if (sourceBtn) {
      sourceBtn.textContent = t("modes.sources");
      sourceBtn.hidden = !annual;
    }
  }

  function applyStaticTranslations() {
    document.documentElement.lang = appState.uiLang;
    const langSel = $("#langSelect");
    if (langSel) langSel.value = appState.uiLang;
    if (langSel) langSel.setAttribute("aria-label", appState.uiLang === "en" ? "Select language" : "Sprache waehlen");

    const navButtons = $$(".nav .chipIcon");
    if (navButtons[0]) navButtons[0].setAttribute("aria-label", t("nav.stats"));
    if (navButtons[1]) navButtons[1].setAttribute("aria-label", t("nav.vote"));
    if (navButtons[2]) navButtons[2].setAttribute("aria-label", t("nav.method"));

    const statsTab = $("#statsTab");
    const voteTab = $("#voteTab");
    const viewPager = $(".viewPager");
    if (statsTab) statsTab.setAttribute("aria-label", t("nav.stats"));
    if (voteTab) voteTab.setAttribute("aria-label", t("nav.vote"));
    if (viewPager) viewPager.setAttribute("aria-label", t("nav.switchView"));

    const dots = $$(".viewDot");
    const showWord = appState.uiLang === "en" ? "show" : "anzeigen";
    if (dots[0]) dots[0].setAttribute("aria-label", `${t("nav.stats")} ${showWord}`);
    if (dots[1]) dots[1].setAttribute("aria-label", `${t("nav.vote")} ${showWord}`);
    const swap = $("#viewSwapBtn");
    if (swap) swap.setAttribute("aria-label", t("nav.switchView"));

    const statsTitle = $("#statsTitle");
    if (statsTitle) statsTitle.textContent = t("stats.title");
    const worldMapRegionLabel = $("#worldMapRegionLabel");
    if (worldMapRegionLabel) worldMapRegionLabel.textContent = t("stats.mapByRegion");
    const legendLow = $("#legendLow");
    const legendMid = $("#legendMid");
    const legendHigh = $("#legendHigh");
    if (legendLow) legendLow.innerHTML = `<i class="c low"></i>${escapeHtml(t("stats.legendLow"))}`;
    if (legendMid) legendMid.innerHTML = `<i class="c mid"></i>${escapeHtml(t("stats.legendMid"))}`;
    if (legendHigh) legendHigh.innerHTML = `<i class="c high"></i>${escapeHtml(t("stats.legendHigh"))}`;

    const geoRegionLabel = $("#geoRegionLabel");
    const geoCountryLabel = $("#geoCountryLabel");
    const geoStateLabel = $("#geoStateLabel");
    const geoCityLabel = $("#geoCityLabel");
    const geoResetBtn = $("#geoResetBtn");
    if (geoRegionLabel) geoRegionLabel.textContent = t("stats.geoRegion");
    if (geoCountryLabel) geoCountryLabel.textContent = t("stats.geoCountry");
    if (geoStateLabel) geoStateLabel.textContent = t("stats.geoState");
    if (geoCityLabel) geoCityLabel.textContent = t("stats.geoCity");
    if (geoResetBtn) geoResetBtn.textContent = t("stats.geoReset");

    const globalMoodLabel = $("#globalMoodLabel");
    if (globalMoodLabel) globalMoodLabel.textContent = "Global Mood Index";
    const metricLabelNode = $("#metricLabel");
    const countryFilterLabel = $("#countryFilterLabel");
    if (metricLabelNode) metricLabelNode.textContent = t("stats.metric");
    if (countryFilterLabel) countryFilterLabel.textContent = t("stats.regionCountry");

    const methodCloseBtn = $("#methodCloseBtn");
    const sourceCloseBtn = $("#sourceCloseBtn");
    const sourceTitle = $("#sourceTitle");
    const questTitle = $("#questTitle");
    const questHint = document.querySelector("#vote .cardHd .hint");
    const questCountryLabel = document.querySelector(".questCountry > .label");
    const overrideToggleText = document.querySelector(".overrideToggle");
    const submitVoteBtn = $("#submitVote");
    const randomizeBtn = $("#randomize");
    const methodTitle = $("#methodTitle");
    const tableHeadCells = $$(".table thead th");
    if (methodCloseBtn) methodCloseBtn.textContent = t("methodModal.close");
    if (sourceCloseBtn) sourceCloseBtn.textContent = t("sourceModal.close");
    if (sourceTitle) sourceTitle.textContent = t("sourceModal.title");
    if (methodTitle) methodTitle.textContent = appState.uiLang === "en" ? "Method (short)" : "Methodik (kurz)";
    if (questTitle) questTitle.textContent = appState.uiLang === "en" ? "Monthly Voting" : "Monatliche Abstimmung";
    if (questHint) questHint.textContent = appState.uiLang === "en"
      ? "Rate four areas, then confirm submission."
      : "Vier Bereiche bewerten, dann Abgabe bestaetigen.";
    if (questCountryLabel) questCountryLabel.textContent = appState.uiLang === "en"
      ? "Country (auto-detected, optional manual)"
      : "Land (automatisch erkannt, optional manuell)";
    if (overrideToggleText) overrideToggleText.lastChild.textContent = ` ${t("vote.manualToggle")}`;
    if (submitVoteBtn) submitVoteBtn.textContent = appState.uiLang === "en" ? "Submit" : "Abgeben";
    if (randomizeBtn) randomizeBtn.textContent = appState.uiLang === "en" ? "Randomize" : "Zufallswerte";
    if (tableHeadCells[0]) tableHeadCells[0].textContent = t("table.rank");
    if (tableHeadCells[1]) tableHeadCells[1].textContent = t("table.country");
    if (tableHeadCells[2]) tableHeadCells[2].textContent = t("table.index");
    if (tableHeadCells[3]) tableHeadCells[3].textContent = t("table.delta");
    if (tableHeadCells[4]) tableHeadCells[4].textContent = t("table.votes");
  }

  function applyLanguage(lang, { persist = true } = {}) {
    appState.uiLang = resolveUiLang(lang);
    appState.uiLocale = appState.uiLang === "en" ? "en-US" : "de-DE";
    if (persist) safeSet(UI_LANG_KEY, appState.uiLang);
    applyStaticTranslations();
    renderDataModeUi();
    renderMetricsSelect();
    renderCountrySelects();
    updateCountryUi();
    initGeoSelectors();
    renderVoteGrid();
    if (appState.dashboard) {
      renderHeader(appState.dashboard);
      renderLeaderboard(appState.dashboard);
      renderCharts(appState.dashboard);
      renderScoreTiles(appState.dashboard);
    } else {
      updateGeoSelectionText("ALL", "ALL");
    }
  }

  async function setDataMode(mode) {
    const target = mode === "annual" ? "annual" : "monthly";
    if (appState.dataMode === target) return;
    appState.dataMode = target;
    renderDataModeUi();
    await refreshDashboard();
  }

  function updateViewPager(tabId) {
    $$(".viewDot").forEach((dot) => {
      const active = dot.getAttribute("data-tab") === tabId;
      dot.classList.toggle("active", active);
      dot.setAttribute("aria-current", active ? "true" : "false");
    });
  }

  function setActiveTab(tabId, options = {}) {
    const animate = options.animate !== false;
    const current = appState.activeTab;
    const target = tabId === "voteTab" ? "voteTab" : "statsTab";
    if (current === target) {
      updateViewPager(target);
      return;
    }

    const from = document.getElementById(current);
    const to = document.getElementById(target);
    appState.activeTab = target;
    updateViewPager(target);

    if (!to) return;

    if (appState.tabAnimTimer) {
      window.clearTimeout(appState.tabAnimTimer);
      appState.tabAnimTimer = null;
    }

    if (!animate || !from) {
      $$(".tabPanel").forEach((panel) => {
        panel.classList.remove("is-entering", "is-leaving");
        panel.classList.toggle("active", panel.id === target);
      });
      return;
    }

    from.classList.remove("is-entering");
    to.classList.remove("is-leaving");
    from.classList.add("is-leaving");
    to.classList.add("active", "is-entering");

    appState.tabAnimTimer = window.setTimeout(() => {
      from.classList.remove("active", "is-leaving");
      to.classList.remove("is-entering");
      appState.tabAnimTimer = null;
    }, 420);
  }

  function initViewControls() {
    $$(".viewDot").forEach((dot) => {
      dot.addEventListener("click", () => {
        const tabId = dot.getAttribute("data-tab");
        if (tabId) {
          setActiveTab(tabId, { animate: true });
          scrollToTopbar();
        }
      });
    });

    const swap = $("#viewSwapBtn");
    if (swap) {
      swap.addEventListener("click", () => {
        const next = appState.activeTab === "statsTab" ? "voteTab" : "statsTab";
        setActiveTab(next, { animate: true });
        scrollToTopbar();
      });
    }
  }

  function scrollToTopbar() {
    const topbar = $(".topbar");
    if (topbar) {
      topbar.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setQuestStep(step) {
    const safeStep = Math.max(1, Math.min(4, Number(step) || 1));
    appState.questStep = safeStep;
    const text = $("#questStepText");
    const fill = $("#questStepFill");
    if (text) text.textContent = t("vote.step", { current: safeStep, total: 4 });
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

  function buildOfflineDashboard() {
    return {
      month: monthKey(),
      metric: appState.currentMetric,
      country: appState.currentCountry,
      minCountryN: 0,
      header: { globalIndex: null, deltaMoM: null, totalVotes: 0 },
      trend: { labels: [], values: [] },
      profile: { country: appState.currentCountry, n: 0, n_manual: 0, n_auto: 0, politics: 0, environment: 0, safety: 0, social: 0, global: 0 },
      snapshot: { month: monthKey(), metric: appState.currentMetric, world: { n: 0, n_manual: 0, n_auto: 0, value: 0 }, countries: [] },
      leaderboard: { month: monthKey(), metric: appState.currentMetric, rows: [] },
      meta: { serverTime: null, version: "offline", minCountryN: 0 },
      status: { voteBusy: false, readCacheTtlMs: 0 },
    };
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

  async function getWhoAmI() {
    return fetchJson("/api/v1/whoami", { method: "GET" });
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
    return ` · ${t("live.queue", { count: queueSize() })}`;
  }

  function renderMetricsSelect() {
    const sel = $("#metricSelect");
    sel.innerHTML = "";
    METRICS.forEach((metric) => {
      const option = document.createElement("option");
      option.value = metric.key;
      option.textContent = metricLabel(metric.key);
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
    world.textContent = t("stats.worldAggregate");
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
    other.textContent = t("stats.otherCountry");
    voteSel.appendChild(other);

    statsSel.value = appState.currentCountry;
    voteSel.value = appState.detectedCountry && appState.detectedCountry !== "OTHER" ? appState.detectedCountry : "DE";
  }

  function updateCountryUi() {
    const detectedBadge = $("#detectedCountryBadge");
    const sourceBadge = $("#countrySourceBadge");
    const overrideToggle = $("#countryOverrideToggle");
    const voteSelect = $("#voteCountry");

    const detected = appState.detectedCountry || "OTHER";
    if (detectedBadge) {
      detectedBadge.textContent = t("vote.detected", { country: countryLabel(detected) });
    }

    const manualToggleOn = overrideToggle && overrideToggle.checked;
    const selected = voteSelect ? voteSelect.value : "";
    const manual = manualToggleOn && selected && selected !== detected;
    appState.countrySourceMode = manual ? "manual" : "auto";
    if (sourceBadge) {
      sourceBadge.textContent = t("vote.source", { mode: manual ? "manual" : "auto" });
    }

    if (voteSelect) {
      voteSelect.disabled = !manualToggleOn;
      if (!manualToggleOn) {
        const target = detected !== "OTHER" ? detected : "OTHER";
        if (Array.from(voteSelect.options).some((o) => o.value === target)) {
          voteSelect.value = target;
        }
      }
    }
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
    const regionLabel = regionKey && GEO_TREE[regionKey] ? GEO_TREE[regionKey].label : t("stats.selectionWorld");
    const countryLabelText = countryCode && COUNTRY_BY_CODE[countryCode] ? COUNTRY_BY_CODE[countryCode].name : t("stats.selectionAllCountries");
    const parts = [regionLabel, countryLabelText];
    if (stateName && stateName !== "ALL") parts.push(stateName);
    if (cityName && cityName !== "ALL") parts.push(cityName);
    const node = $("#geoSelection");
    if (node) node.textContent = `${t("stats.selectionPrefix")} ${parts.join(" / ")}`;
  }

  function populateGeoStates(countryCode, selectedState = "ALL") {
    const stateSelect = $("#geoStateSelect");
    const citySelect = $("#geoCitySelect");
    if (!countryCode || countryCode === "ALL") {
      setSelectOptions(stateSelect, [{ value: "ALL", label: t("stats.geoAllRegions") }], "ALL");
      setSelectOptions(citySelect, [{ value: "ALL", label: t("stats.geoAllCities") }], "ALL");
      return;
    }

    const regionKey = getRegionForCountry(countryCode);
    const countryData = regionKey ? GEO_TREE[regionKey].countries[countryCode] : null;
    const stateNames = countryData ? Object.keys(countryData.states) : [];
    const options = [{ value: "ALL", label: t("stats.geoAllRegions") }].concat(stateNames.map((name) => ({ value: name, label: name })));
    setSelectOptions(stateSelect, options, selectedState);

    const stateKey = stateSelect.value;
    if (!countryData || stateKey === "ALL") {
      setSelectOptions(citySelect, [{ value: "ALL", label: t("stats.geoAllCities") }], "ALL");
      return;
    }

    const cityNames = Object.keys(countryData.states[stateKey].cities || {});
    setSelectOptions(citySelect, [{ value: "ALL", label: t("stats.geoAllCities") }].concat(cityNames.map((name) => ({ value: name, label: name }))), "ALL");
  }

  function populateGeoCountries(regionKey, selectedCountry = "ALL") {
    const countrySelect = $("#geoCountrySelect");
    const codes = getCountriesForRegion(regionKey);
    const options = [{ value: "ALL", label: t("stats.geoAllCountries") }].concat(codes.map((code) => ({ value: code, label: countryLabel(code) })));
    setSelectOptions(countrySelect, options, selectedCountry);
    populateGeoStates(countrySelect.value);
  }

  function initGeoSelectors() {
    const regionSelect = $("#geoRegionSelect");
    const regionOptions = [{ value: "ALL", label: t("stats.geoAllContinents") }].concat(
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
            <div class="name">${escapeHtml(metricLabel(metric.key))}</div>
            <div class="desc">${escapeHtml(t(`metricDesc.${metric.key}`))}</div>
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
    if (value < 4.5) return "#eab8b8";
    if (value < 6.5) return "#ebddbe";
    return "#b8dbc8";
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
    worldMapSetActiveFeature(null);
  }

  function worldMapSetActiveFeature(feature) {
    if (!appState.worldMap || !appState.worldMap.paths) return;
    appState.worldMap.activeFeature = feature || null;
    appState.worldMap.paths.classed("active", (d) => Boolean(feature && d === feature));
    if (!appState.worldMap.activeOutline) return;
    if (!feature) {
      appState.worldMap.activeOutline.style("display", "none");
      return;
    }
    appState.worldMap.activeOutline
      .attr("d", appState.worldMap.path(feature))
      .style("display", null);
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
    const spherePath = path({ type: "Sphere" });
    const oceanGradientId = "worldOceanGradient";

    const defs = svg.append("defs");
    const oceanGradient = defs.append("radialGradient")
      .attr("id", oceanGradientId)
      .attr("cx", "50%")
      .attr("cy", "46%")
      .attr("r", "64%");
    oceanGradient.append("stop").attr("offset", "0%").attr("stop-color", "#d9f0ff");
    oceanGradient.append("stop").attr("offset", "62%").attr("stop-color", "#c4e4fb");
    oceanGradient.append("stop").attr("offset", "100%").attr("stop-color", "#a4c9e6");

    const vignetteGradientId = "worldSphereVignette";
    const vignetteGradient = defs.append("radialGradient")
      .attr("id", vignetteGradientId)
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "58%");
    vignetteGradient.append("stop").attr("offset", "58%").attr("stop-color", "rgba(0,0,0,0)");
    vignetteGradient.append("stop").attr("offset", "100%").attr("stop-color", "rgba(5,18,38,0.24)");

    const zoomLayer = svg.append("g").attr("class", "world-zoom-layer");
    zoomLayer.append("path")
      .datum({ type: "Sphere" })
      .attr("d", spherePath)
      .attr("class", "world-sphere-bg")
      .attr("fill", `url(#${oceanGradientId})`);

    zoomLayer.append("path")
      .datum({ type: "Sphere" })
      .attr("d", spherePath)
      .attr("class", "world-sphere-halo");

    zoomLayer.append("path")
      .datum({ type: "Sphere" })
      .attr("d", spherePath)
      .attr("class", "world-sphere-vignette")
      .attr("fill", `url(#${vignetteGradientId})`);

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
      .attr("fill", "#f0eee8")
      .attr("stroke", "rgba(158, 180, 207, 0.34)")
      .attr("stroke-width", 0.34)
      .each((feature) => {
        const code = N3_TO_A2[String(feature.id).padStart(3, "0")] || N3_TO_A2[String(feature.id)];
        if (code) featureByCode[code] = feature;
      })
      .on("click", (event, feature) => {
        event.stopPropagation();
        worldMapSetActiveFeature(feature);
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

    const activeOutline = zoomLayer.append("path")
      .attr("class", "world-active-outline")
      .style("display", "none");

    svg.on("click", () => worldMapResetZoom());

    appState.worldMap = {
      width,
      height,
      projection,
      path,
      zoomLayer,
      paths,
      activeOutline,
      featureByCode,
      activeFeature: null,
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
      deltaNode.innerHTML = `<span class="dot"></span>${escapeHtml(t("stats.trendPrefix"))} <strong>${escapeHtml(t("stats.trendNoPrev"))}</strong>`;
    } else {
      deltaNode.classList.add(delta > 0.05 ? "ok" : delta < -0.05 ? "bad" : "warn");
      deltaNode.innerHTML = `<span class="dot"></span>${escapeHtml(t("stats.trendPrefix"))} <strong>${delta >= 0 ? "+" : ""}${Number(delta).toFixed(2)}</strong> ${escapeHtml(t("stats.trendSinceLastMonth"))}`;
    }

    const votes = Number(header.totalVotes || 0);
    $("#totalVotes").innerHTML = `<span class="dot"></span>${escapeHtml(t("stats.votesLabel"))} <strong>${fmtInt(votes)}</strong>`;

    const sample = $("#sampleHint");
    if (votes < 25) {
      sample.classList.remove("ok", "bad");
      sample.classList.add("warn");
      sample.innerHTML = `<span class="dot"></span><strong>${escapeHtml(t("stats.sampleSmall", { count: fmtInt(votes) }))}</strong>`;
    } else {
      sample.classList.remove("warn", "bad");
      sample.classList.add("ok");
      sample.innerHTML = `<span class="dot"></span><strong>${escapeHtml(t("stats.sampleGrowing", { count: fmtInt(votes) }))}</strong>`;
    }

    $("#serverTime").textContent = meta.serverTime ? new Date(meta.serverTime).toLocaleString(appState.uiLocale || "de-DE") : "-";
    $("#ver").textContent = meta.version || "-";
    $("#monthPill").textContent = data.month || monthKey();

    const hint = $("#liveHint");
    if (isAnnualMode()) {
      const year = appState.annualBaseline && appState.annualBaseline.year ? appState.annualBaseline.year : data.month;
      hint.textContent = t("modes.annualHint", { year });
    } else {
      const source = appState.online ? t("live.liveApi") : t("live.localCache");
      const busy = status.voteBusy ? ` · ${t("live.busy")}` : "";
      hint.textContent = `${source}${busy}${queueInfoText()}`;
    }

    renderCooldownNote(status.voteBusy);
  }

  function renderCooldownNote(voteBusy) {
    const note = $("#cooldownNote");
    if (localMonthLocked()) {
      note.innerHTML = `<strong>${escapeHtml(t("cooldown.note"))}</strong> ${escapeHtml(t("cooldown.already"))} <span class="pill">${nextMonthKey()}</span>.`;
      return;
    }

    if (queueSize()) {
      note.innerHTML = `<strong>${escapeHtml(t("cooldown.queueActive"))}</strong> ${escapeHtml(t("cooldown.queueText", { count: queueSize() }))}`;
      return;
    }

    if (voteBusy) {
      note.innerHTML = `<strong>${escapeHtml(t("cooldown.note"))}</strong> ${escapeHtml(t("cooldown.busy"))}`;
      return;
    }

    note.innerHTML = `<strong>${escapeHtml(t("cooldown.principle"))}</strong> ${escapeHtml(t("cooldown.principleText"))}`;
  }

  function renderLeaderboard(data) {
    const body = $("#leaderBody");
    body.innerHTML = "";

    const rows = (data && data.leaderboard && data.leaderboard.rows) || [];
    const minCountryN = data && data.meta ? data.meta.minCountryN : 0;

    if (!rows.length) {
      const tr = document.createElement("tr");
      tr.innerHTML = isAnnualMode()
        ? `<td colspan="5" class="muted">${escapeHtml(t("stats.noAnnualRows"))}</td>`
        : `<td colspan="5" class="muted">${escapeHtml(t("stats.noMonthlyRows", { min: minCountryN }))}</td>`;
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
      toast("Chart.js unavailable.", "Charts are not displayed.");
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
          label: `${t("charts.trendLabel")} - ${metricLabel(appState.currentMetric)} (${countryLabel(appState.currentCountry)})`,
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
                if (ctx.raw === null) return t("charts.noData");
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
        labels: [t("metrics.politics"), t("metrics.environment"), t("metrics.safety"), t("metrics.social")],
        datasets: [{
          label: `${t("charts.profileLabel")} - ${countryLabel(profile.country || appState.currentCountry)}${profile.n ? ` (${profile.n} ${t("charts.votes")})` : ""}`,
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
    if (isAnnualMode()) {
      appState.refreshBusy = true;
      try {
        const annual = await loadAnnualBaseline();
        appState.online = true;
        await renderDashboard(buildAnnualDashboard(annual));
      } catch (err) {
        console.error("refreshDashboard annual failed", err);
        appState.online = false;
        await renderDashboard(buildOfflineDashboard());
        const hint = $("#liveHint");
        if (hint) hint.textContent = t("modes.annualLoadFailed");
      } finally {
        appState.refreshBusy = false;
      }
      return;
    }
    if (!appState.backendConfigured) {
      appState.online = false;
      await renderDashboard(buildOfflineDashboard());
      return;
    }
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
        // quiet fallback
      } else {
        // quiet offline mode on network failure
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

    const payload = {
      month: monthKey(),
      scores,
    };
    const override = $("#countryOverrideToggle");
    const selected = $("#voteCountry").value;
    const manual = override && override.checked && selected && selected !== appState.detectedCountry;
    if (manual) {
      payload.requestedCountry = selected;
    }
    return payload;
  }

  function payloadFingerprint(payload) {
    const countryKey = payload.requestedCountry || "AUTO";
    return `${payload.month}|${countryKey}|${payload.scores.politics}|${payload.scores.environment}|${payload.scores.safety}|${payload.scores.social}`;
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
        toast(t("toast.bufferedSent"), t("toast.month", { month: next.payload.month }));
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
      if (hint) {
        if (isAnnualMode()) {
          const year = appState.annualBaseline && appState.annualBaseline.year ? appState.annualBaseline.year : "";
          hint.textContent = t("modes.annualHint", { year });
        } else {
          hint.textContent = `${appState.online ? t("live.liveApi") : t("live.localCache")}${queueInfoText()}`;
        }
      }
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
    if (!appState.backendConfigured) {
      return;
    }
    if (localMonthLocked()) {
      toast(t("toast.votedAlready"), t("toast.localGuard"));
      return;
    }

    const payload = buildVotePayload();
    try {
      await postVote(payload);
      if (payload.requestedCountry) {
        appState.countrySourceMode = "manual";
      } else {
        appState.countrySourceMode = "auto";
      }
      setLocalMonthLock();
      toast(t("toast.voteSaved"), t("toast.voteThanks"));
      setActiveTab("statsTab");
      await refreshDashboard();
    } catch (err) {
      if (err.status === 409) {
        setLocalMonthLock();
        renderCooldownNote(false);
        toast(t("toast.votedAlready"), t("toast.serverRule"));
        return;
      }

      if (err.status === 429 || err.status === 503 || !err.status) {
        enqueueVote(payload, err.status || "network");
        renderCooldownNote(true);
        toast(t("toast.busyBuffered"), t("toast.autoRetry"));
        return;
      }

      toast(t("toast.voteFailed"), t("toast.retryLater"));
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
    toast(t("toast.random"));
  }

  async function share() {
    const text = `${t("stats.title")}: ${metricLabel(appState.currentMetric)} - ${countryLabel(appState.currentCountry)}.`;
    const url = window.location.href.split("#")[0] + "#stats";

    try {
      if (navigator.share) {
        await navigator.share({ title: t("stats.title"), text, url });
        toast(t("toast.shared"));
        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast(t("toast.linkCopied"));
        return;
      }

      toast(t("toast.shareUnavailable"));
    } catch (_err) {
      toast(t("toast.shareCanceled"));
    }
  }

  function initNav() {
    $$('[data-scroll]').forEach((btn) => {
      btn.addEventListener("click", () => {
        const sel = btn.getAttribute("data-scroll");
        if (sel === "#method") {
          openMethodModal();
          return;
        }
        if (sel === "#stats") {
          setActiveTab("statsTab");
          scrollToTopbar();
          return;
        }
        if (sel === "#vote") {
          setActiveTab("voteTab");
          scrollToTopbar();
        }
      });
    });
  }

  function openMethodModal() {
    const modal = $("#methodModal");
    if (!modal) return;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modalOpen");
  }

  function closeMethodModal() {
    const modal = $("#methodModal");
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    if (!$("#sourceModal") || !$("#sourceModal").classList.contains("open")) {
      document.body.classList.remove("modalOpen");
    }
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
          const feature = appState.worldMap.featureByCode[code];
          worldMapSetActiveFeature(feature);
          worldMapZoomToFeature(feature);
        }
      }
      await refreshDashboard();
    });

    const overrideToggle = $("#countryOverrideToggle");
    if (overrideToggle) {
      overrideToggle.addEventListener("change", () => {
        updateCountryUi();
      });
    }

    const voteCountry = $("#voteCountry");
    if (voteCountry) {
      voteCountry.addEventListener("change", () => {
        updateCountryUi();
      });
    }

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
          const feature = appState.worldMap.featureByCode[countryCode];
          worldMapSetActiveFeature(feature);
          worldMapZoomToFeature(feature);
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
        setSelectOptions(citySelect, [{ value: "ALL", label: t("stats.geoAllCities") }], "ALL");
        return;
      }
      const countryData = regionKey ? GEO_TREE[regionKey].countries[countryCode] : null;
      if (!countryData || stateKey === "ALL") {
        setSelectOptions(citySelect, [{ value: "ALL", label: t("stats.geoAllCities") }], "ALL");
        updateGeoSelectionText(regionKey, countryCode, "ALL", "ALL");
        return;
      }
      const cities = Object.keys(countryData.states[stateKey].cities || {});
      setSelectOptions(citySelect, [{ value: "ALL", label: t("stats.geoAllCities") }].concat(cities.map((c) => ({ value: c, label: c }))), "ALL");
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
    const shareBtn = $("#shareBtn");
    if (shareBtn) {
      shareBtn.addEventListener("click", share);
    }
    const modeMonthlyBtn = $("#modeMonthlyBtn");
    const modeAnnualBtn = $("#modeAnnualBtn");
    if (modeMonthlyBtn) {
      modeMonthlyBtn.addEventListener("click", async () => {
        await setDataMode("monthly");
      });
    }
    if (modeAnnualBtn) {
      modeAnnualBtn.addEventListener("click", async () => {
        await setDataMode("annual");
      });
    }
    const annualSourcesBtn = $("#annualSourcesBtn");
    if (annualSourcesBtn) {
      annualSourcesBtn.addEventListener("click", openSourceModal);
    }

    const methodCloseBtn = $("#methodCloseBtn");
    if (methodCloseBtn) {
      methodCloseBtn.addEventListener("click", closeMethodModal);
    }
    const methodModal = $("#methodModal");
    if (methodModal) {
      methodModal.addEventListener("click", (event) => {
        const target = event.target;
        if (target && target.getAttribute && target.getAttribute("data-close-method-modal") === "true") {
          closeMethodModal();
        }
      });
    }
    const sourceCloseBtn = $("#sourceCloseBtn");
    if (sourceCloseBtn) {
      sourceCloseBtn.addEventListener("click", closeSourceModal);
    }
    const sourceModal = $("#sourceModal");
    if (sourceModal) {
      sourceModal.addEventListener("click", (event) => {
        const target = event.target;
        if (target && target.getAttribute && target.getAttribute("data-close-source-modal") === "true") {
          closeSourceModal();
        }
      });
    }
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      closeMethodModal();
      closeSourceModal();
    });

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

  function initLanguageControls() {
    const stored = safeGet(UI_LANG_KEY, "");
    const auto = (navigator.languages && navigator.languages[0]) || navigator.language || "de";
    appState.uiLang = resolveUiLang(stored || auto);
    appState.uiLocale = appState.uiLang === "en" ? "en-US" : "de-DE";
    applyStaticTranslations();
    const langSelect = $("#langSelect");
    if (langSelect) {
      langSelect.value = appState.uiLang;
      langSelect.addEventListener("change", async (event) => {
        applyLanguage(event.target.value, { persist: true });
        await refreshDashboard();
      });
    }
  }

  async function init() {
    await loadRuntimeConfig();
    appState.backendConfigured = Boolean(appState.apiBase);
    appState.pendingVotes = readPendingVotes();
    initLanguageControls();

    initViewControls();
    setActiveTab("statsTab", { animate: false });
    renderDataModeUi();

    renderMetricsSelect();
    renderCountrySelects();
    updateCountryUi();
    initGeoSelectors();
    renderVoteGrid();
    initNav();
    bindEvents();

    runSmokeChecks();
    await initWorldMap();
    if (appState.backendConfigured) {
      try {
        const who = await getWhoAmI();
        appState.detectedCountry = who && who.detectedCountry ? who.detectedCountry : "OTHER";
      } catch (_err) {
        appState.detectedCountry = "OTHER";
      }
      renderCountrySelects();
      updateCountryUi();
    }
    await refreshDashboard();
    await flushVoteQueue();
    if (appState.backendConfigured) {
      initIntervals();
    }
  }

  init();
})();
