const path = require("path");
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const { createDb, resolveDataDir, resolveDatabasePath, METRICS, monthKey, parseMonthKey } = require("./db");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const PORT = Number(process.env.PORT || 8787);
const NODE_ENV = process.env.NODE_ENV || "development";
const DATA_DIR = resolveDataDir(process.env.DATA_DIR);
const DATABASE_PATH = resolveDatabasePath({
  databasePath: process.env.DB_PATH || process.env.DATABASE_PATH || "",
  dataDir: DATA_DIR,
});
const MIN_COUNTRY_N = Number(process.env.MIN_COUNTRY_N || 5);
const READ_CACHE_TTL_MS = Number(process.env.READ_CACHE_TTL_MS || 15000);
const VOTE_RATE_WINDOW_MS = Number(process.env.VOTE_RATE_WINDOW_MS || 60000);
const VOTE_RATE_MAX = Number(process.env.VOTE_RATE_MAX || 8);
const VOTE_BURST_WINDOW_MS = Number(process.env.VOTE_BURST_WINDOW_MS || 10000);
const VOTE_BURST_MAX = Number(process.env.VOTE_BURST_MAX || 20);

const COOKIE_NAME = process.env.COOKIE_NAME || "gsb_device";
const COOKIE_MAX_AGE_DAYS = Number(process.env.COOKIE_MAX_AGE_DAYS || 370);
const COOKIE_SAMESITE = process.env.COOKIE_SAMESITE || "lax";
const COOKIE_SECURE = String(process.env.COOKIE_SECURE || "false") === "true";

const FRONTEND_ORIGIN = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const app = express();
app.set("trust proxy", 1);

const gsb = createDb({ databasePath: DATABASE_PATH, dataDir: DATA_DIR, minCountryN: MIN_COUNTRY_N });

const bootTime = Date.now();
const readCache = new Map();
const burstTimestamps = [];

function nowISO() {
  return new Date().toISOString();
}

function inAllowedOrigin(origin) {
  if (!FRONTEND_ORIGIN.length) return true;
  return FRONTEND_ORIGIN.includes(origin);
}

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (inAllowedOrigin(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "25kb" }));
app.use(cookieParser());

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getDeviceToken(req, res) {
  let token = req.cookies[COOKIE_NAME];
  if (!token) {
    token = crypto.randomUUID();
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: COOKIE_SAMESITE,
      maxAge: COOKIE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
      path: "/",
    });
  }
  return token;
}

function validMetric(metric) {
  return METRICS.includes(metric);
}

function validCountry(country) {
  return typeof country === "string" && /^(?:[A-Z]{2}|OTHER|WORLD)$/.test(country);
}

function normalizeIso2(raw) {
  const val = String(raw || "").trim().toUpperCase().replace(/[^A-Z]/g, "");
  if (!val || val === "XX") return "OTHER";
  if (val.length !== 2) return "OTHER";
  return val;
}

function detectCountryFromHeaders(req) {
  const keys = [
    "cf-ipcountry",
    "x-vercel-ip-country",
    "x-country-code",
    "x-appengine-country",
    "cloudfront-viewer-country",
  ];
  for (const key of keys) {
    const value = req.headers[key];
    if (value) {
      return normalizeIso2(value);
    }
  }
  return "OTHER";
}

function validMonth(month) {
  return !!parseMonthKey(month);
}

function parseVoteBody(body) {
  const month = String(body?.month || "");
  const requestedCountryRaw = body?.requestedCountry == null ? "" : String(body.requestedCountry || "");
  const scores = body?.scores || {};

  if (!validMonth(month)) {
    return { ok: false, error: "invalid_month" };
  }

  const requestedCountryCandidate = requestedCountryRaw.trim().toUpperCase();
  let requestedCountry = "";
  if (requestedCountryCandidate === "OTHER") {
    requestedCountry = "OTHER";
  } else if (/^[A-Z]{2}$/.test(requestedCountryCandidate)) {
    requestedCountry = requestedCountryCandidate;
  }

  const politics = Number(scores.politics);
  const environment = Number(scores.environment);
  const safety = Number(scores.safety);
  const social = Number(scores.social);

  const values = [politics, environment, safety, social];
  if (!values.every((n) => Number.isFinite(n) && n >= 0 && n <= 10)) {
    return { ok: false, error: "invalid_scores" };
  }

  const global = Number(((politics + environment + safety + social) / 4).toFixed(2));
  return {
    ok: true,
    month,
    requestedCountry,
    scores: { politics, environment, safety, social, global },
  };
}

function cacheKey(name, params = {}) {
  return `${name}:${JSON.stringify(params)}`;
}

function getCached(name, params, producer) {
  const key = cacheKey(name, params);
  const item = readCache.get(key);
  if (item && Date.now() - item.ts < READ_CACHE_TTL_MS) {
    return { data: item.data, cached: true, ageMs: Date.now() - item.ts };
  }

  const data = producer();
  readCache.set(key, { ts: Date.now(), data });
  return { data, cached: false, ageMs: 0 };
}

function clearReadCache() {
  readCache.clear();
}

function cleanupBurstWindow() {
  const cut = Date.now() - VOTE_BURST_WINDOW_MS;
  while (burstTimestamps.length && burstTimestamps[0] < cut) {
    burstTimestamps.shift();
  }
}

function voteBurstGuard(req, res, next) {
  cleanupBurstWindow();
  if (burstTimestamps.length >= VOTE_BURST_MAX) {
    return res.status(503).json({
      error: "vote_busy",
      retryAfterSec: 20,
      message: "Voting ist gerade stark ausgelastet. Bitte kurz warten.",
    });
  }
  burstTimestamps.push(Date.now());
  return next();
}

const voteLimiter = rateLimit({
  windowMs: VOTE_RATE_WINDOW_MS,
  max: VOTE_RATE_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "rate_limited",
    retryAfterSec: Math.ceil(VOTE_RATE_WINDOW_MS / 1000),
    message: "Zu viele Abstimmungen in kurzer Zeit. Bitte kurz warten.",
  },
});

app.get("/api/v1/meta", (req, res) => {
  const deviceToken = getDeviceToken(req, res);
  const detectedCountry = detectCountryFromHeaders(req);
  const payload = {
    serverTime: nowISO(),
    version: "api-1.0.0",
    minCountryN: MIN_COUNTRY_N,
    cookiePresent: Boolean(deviceToken),
    detectedCountry,
  };
  res.json(payload);
});

app.get("/api/v1/whoami", (req, res) => {
  const detectedCountry = detectCountryFromHeaders(req);
  res.json({
    detectedCountry,
  });
});

app.get("/api/v1/status", (req, res) => {
  cleanupBurstWindow();
  res.json({
    ok: true,
    serverTime: nowISO(),
    uptimeSec: Math.floor((Date.now() - bootTime) / 1000),
    readCacheEntries: readCache.size,
    readCacheTtlMs: READ_CACHE_TTL_MS,
    voteWindow: {
      burstWindowMs: VOTE_BURST_WINDOW_MS,
      burstCount: burstTimestamps.length,
      burstMax: VOTE_BURST_MAX,
      limiterWindowMs: VOTE_RATE_WINDOW_MS,
      limiterMax: VOTE_RATE_MAX,
    },
  });
});

app.get("/api/v1/aggregate", (req, res) => {
  const country = String(req.query.country || "WORLD").toUpperCase();
  const metric = String(req.query.metric || "global").toLowerCase();
  const month = String(req.query.month || monthKey());

  if (!validCountry(country)) return res.status(400).json({ error: "invalid_country" });
  if (!validMetric(metric)) return res.status(400).json({ error: "invalid_metric" });
  if (!validMonth(month)) return res.status(400).json({ error: "invalid_month" });

  const cached = getCached("aggregate", { country, metric, month }, () => {
    return gsb.getAggregate(country, metric, month);
  });

  res.json({ ...cached.data, _cache: { hit: cached.cached, ageMs: cached.ageMs } });
});

app.get("/api/v1/snapshot", (req, res) => {
  const month = String(req.query.month || monthKey());
  const metric = String(req.query.metric || "global").toLowerCase();

  if (!validMonth(month)) return res.status(400).json({ error: "invalid_month" });
  if (!validMetric(metric)) return res.status(400).json({ error: "invalid_metric" });

  const cached = getCached("snapshot", { month, metric }, () => {
    return gsb.getSnapshot(month, metric);
  });

  res.json({ ...cached.data, _cache: { hit: cached.cached, ageMs: cached.ageMs } });
});

app.get("/api/v1/profile", (req, res) => {
  const month = String(req.query.month || monthKey());
  const country = String(req.query.country || "WORLD").toUpperCase();

  if (!validMonth(month)) return res.status(400).json({ error: "invalid_month" });
  if (!validCountry(country)) return res.status(400).json({ error: "invalid_country" });

  const cached = getCached("profile", { month, country }, () => {
    return gsb.getCountryProfile(month, country);
  });

  res.json({ ...cached.data, month, _cache: { hit: cached.cached, ageMs: cached.ageMs } });
});

app.get("/api/v1/leaderboard", (req, res) => {
  const month = String(req.query.month || monthKey());
  const metric = String(req.query.metric || "global").toLowerCase();
  const limit = Number(req.query.limit || 10);

  if (!validMonth(month)) return res.status(400).json({ error: "invalid_month" });
  if (!validMetric(metric)) return res.status(400).json({ error: "invalid_metric" });

  const cached = getCached("leaderboard", { month, metric, limit }, () => {
    return gsb.getLeaderboard(month, metric, limit);
  });

  res.json({ ...cached.data, _cache: { hit: cached.cached, ageMs: cached.ageMs } });
});

app.get("/api/v1/dashboard", (req, res) => {
  const month = String(req.query.month || monthKey());
  const metric = String(req.query.metric || "global").toLowerCase();
  const country = String(req.query.country || "WORLD").toUpperCase();
  const limit = Number(req.query.limit || 10);

  if (!validMonth(month)) return res.status(400).json({ error: "invalid_month" });
  if (!validMetric(metric)) return res.status(400).json({ error: "invalid_metric" });
  if (!validCountry(country)) return res.status(400).json({ error: "invalid_country" });

  const cached = getCached("dashboard", { month, metric, country, limit }, () => {
    const dashboard = gsb.getDashboard({ month, metric, country, leaderboardLimit: limit });
    return {
      ...dashboard,
      meta: {
        serverTime: nowISO(),
        version: "api-1.0.0",
        minCountryN: MIN_COUNTRY_N,
      },
      status: {
        voteBusy: burstTimestamps.length >= Math.floor(VOTE_BURST_MAX * 0.8),
        readCacheTtlMs: READ_CACHE_TTL_MS,
      },
    };
  });

  res.json({ ...cached.data, _cache: { hit: cached.cached, ageMs: cached.ageMs } });
});

app.post("/api/v1/votes", voteLimiter, voteBurstGuard, (req, res) => {
  const parsed = parseVoteBody(req.body);
  if (!parsed.ok) {
    return res.status(400).json({ error: parsed.error });
  }

  const detectedCountry = detectCountryFromHeaders(req);
  const country = parsed.requestedCountry || detectedCountry;
  const countrySource = parsed.requestedCountry ? "manual" : "auto";
  const token = getDeviceToken(req, res);
  const deviceHash = hashToken(token);

  try {
    const result = gsb.recordVote({
      month: parsed.month,
      country,
      countrySource,
      scores: parsed.scores,
      deviceHash,
      createdAt: nowISO(),
    });

    if (!result.ok && result.code === "already_voted_this_month") {
      return res.status(409).json({ error: "already_voted_this_month" });
    }

    clearReadCache();

    return res.status(201).json({
      ok: true,
      month: parsed.month,
      country,
      countrySource,
      detectedCountry,
      scores: parsed.scores,
    });
  } catch (err) {
    console.error("POST /votes failed", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

app.get("/healthz", (req, res) => {
  res.json({ ok: true, time: nowISO() });
});

app.use((err, req, res, next) => {
  if (!err) return next();
  console.error("Unhandled error", err);
  res.status(500).json({ error: "internal_error" });
});

app.listen(PORT, () => {
  console.log(`GSB backend listening on http://localhost:${PORT}`);
  console.log(`DATA_DIR: ${DATA_DIR}`);
  console.log(`DB: ${path.resolve(DATABASE_PATH)}`);
});
