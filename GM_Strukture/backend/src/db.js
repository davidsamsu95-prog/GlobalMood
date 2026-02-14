const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const METRICS = ["global", "politics", "environment", "safety", "social"];

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function parseMonthKey(key) {
  const m = /^(\d{4})-(\d{2})$/.exec(key);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  return { year, month };
}

function monthSeries(count, anchorMonth = monthKey()) {
  const p = parseMonthKey(anchorMonth);
  if (!p) {
    return Array.from({ length: count }, () => monthKey());
  }

  const out = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(p.year, p.month - 1 - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

function ensureParentDir(filePath) {
  const parent = path.dirname(filePath);
  if (!fs.existsSync(parent)) {
    fs.mkdirSync(parent, { recursive: true });
  }
}

function valueFromRow(row, metric) {
  if (!row || !row.n) return null;
  const key = `sum_${metric}`;
  if (!Object.prototype.hasOwnProperty.call(row, key)) return null;
  return Number((row[key] / row.n).toFixed(2));
}

function weightedValue(rows, metric) {
  if (!rows.length) return null;
  let totalN = 0;
  let sum = 0;

  rows.forEach((row) => {
    totalN += row.n;
    sum += row[`sum_${metric}`];
  });

  if (!totalN) return null;
  return Number((sum / totalN).toFixed(2));
}

function weightedProfile(rows) {
  if (!rows.length) return null;
  let totalN = 0;
  const sums = {
    politics: 0,
    environment: 0,
    safety: 0,
    social: 0,
    global: 0,
  };

  rows.forEach((row) => {
    totalN += row.n;
    sums.politics += row.sum_politics;
    sums.environment += row.sum_environment;
    sums.safety += row.sum_safety;
    sums.social += row.sum_social;
    sums.global += row.sum_global;
  });

  if (!totalN) return null;

  return {
    n: totalN,
    politics: Number((sums.politics / totalN).toFixed(2)),
    environment: Number((sums.environment / totalN).toFixed(2)),
    safety: Number((sums.safety / totalN).toFixed(2)),
    social: Number((sums.social / totalN).toFixed(2)),
    global: Number((sums.global / totalN).toFixed(2)),
  };
}

function createDb({ databasePath, minCountryN = 5 }) {
  const absolutePath = path.resolve(databasePath);
  ensureParentDir(absolutePath);

  const db = new Database(absolutePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS device_month (
      device_hash TEXT NOT NULL,
      month TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY(device_hash, month)
    );

    CREATE TABLE IF NOT EXISTS agg_month_country (
      month TEXT NOT NULL,
      country TEXT NOT NULL,
      n INTEGER NOT NULL,
      sum_politics REAL NOT NULL,
      sum_environment REAL NOT NULL,
      sum_safety REAL NOT NULL,
      sum_social REAL NOT NULL,
      sum_global REAL NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY(month, country)
    );

    CREATE INDEX IF NOT EXISTS idx_agg_month ON agg_month_country(month);
    CREATE INDEX IF NOT EXISTS idx_agg_country ON agg_month_country(country);
  `);

  const stmtInsertDeviceMonth = db.prepare(`
    INSERT INTO device_month (device_hash, month, created_at)
    VALUES (?, ?, ?)
  `);

  const stmtUpsertAgg = db.prepare(`
    INSERT INTO agg_month_country (
      month, country, n,
      sum_politics, sum_environment, sum_safety, sum_social, sum_global,
      updated_at
    ) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(month, country) DO UPDATE SET
      n = agg_month_country.n + 1,
      sum_politics = agg_month_country.sum_politics + excluded.sum_politics,
      sum_environment = agg_month_country.sum_environment + excluded.sum_environment,
      sum_safety = agg_month_country.sum_safety + excluded.sum_safety,
      sum_social = agg_month_country.sum_social + excluded.sum_social,
      sum_global = agg_month_country.sum_global + excluded.sum_global,
      updated_at = excluded.updated_at
  `);

  const stmtRowsByMonth = db.prepare(`
    SELECT month, country, n, sum_politics, sum_environment, sum_safety, sum_social, sum_global
    FROM agg_month_country
    WHERE month = ?
  `);

  const stmtRowsByMonths = db.prepare(`
    SELECT month, country, n, sum_politics, sum_environment, sum_safety, sum_social, sum_global
    FROM agg_month_country
    WHERE month IN (SELECT value FROM json_each(?))
  `);

  const stmtCountryRowsByMonths = db.prepare(`
    SELECT month, country, n, sum_politics, sum_environment, sum_safety, sum_social, sum_global
    FROM agg_month_country
    WHERE country = ? AND month IN (SELECT value FROM json_each(?))
  `);

  const stmtRowByMonthCountry = db.prepare(`
    SELECT month, country, n, sum_politics, sum_environment, sum_safety, sum_social, sum_global
    FROM agg_month_country
    WHERE month = ? AND country = ?
  `);

  const recordVoteTx = db.transaction(({ month, country, scores, deviceHash, createdAt }) => {
    stmtInsertDeviceMonth.run(deviceHash, month, createdAt);

    stmtUpsertAgg.run(
      month,
      country,
      scores.politics,
      scores.environment,
      scores.safety,
      scores.social,
      scores.global,
      createdAt,
    );
  });

  function recordVote(payload) {
    try {
      recordVoteTx(payload);
      return { ok: true };
    } catch (err) {
      if (String(err.message || "").includes("UNIQUE constraint failed: device_month")) {
        return { ok: false, code: "already_voted_this_month" };
      }
      throw err;
    }
  }

  function rowsForMonth(month) {
    return stmtRowsByMonth.all(month);
  }

  function totalVotesForMonth(month) {
    const rows = rowsForMonth(month);
    return rows.reduce((sum, row) => sum + row.n, 0);
  }

  function getWorldProfile(month) {
    const rows = rowsForMonth(month);
    const profile = weightedProfile(rows);
    if (!profile) {
      return { country: "WORLD", n: 0, politics: 0, environment: 0, safety: 0, social: 0, global: 0 };
    }
    return { country: "WORLD", ...profile };
  }

  function getCountryProfile(month, country) {
    if (country === "WORLD") return getWorldProfile(month);

    const row = stmtRowByMonthCountry.get(month, country);
    if (!row) {
      return { country, n: 0, politics: 0, environment: 0, safety: 0, social: 0, global: 0 };
    }

    return {
      country,
      n: row.n,
      politics: valueFromRow(row, "politics") || 0,
      environment: valueFromRow(row, "environment") || 0,
      safety: valueFromRow(row, "safety") || 0,
      social: valueFromRow(row, "social") || 0,
      global: valueFromRow(row, "global") || 0,
    };
  }

  function getTrend(month, metric, country) {
    const months = monthSeries(12, month);

    let rows = [];
    if (country === "WORLD") {
      rows = stmtRowsByMonths.all(JSON.stringify(months));
    } else {
      rows = stmtCountryRowsByMonths.all(country, JSON.stringify(months));
    }

    const byMonth = months.reduce((acc, m) => {
      acc[m] = [];
      return acc;
    }, {});

    rows.forEach((row) => {
      if (byMonth[row.month]) {
        byMonth[row.month].push(row);
      }
    });

    const values = months.map((m) => {
      const monthRows = byMonth[m] || [];
      if (!monthRows.length) return null;

      if (country === "WORLD") {
        return weightedValue(monthRows, metric);
      }

      const row = monthRows[0];
      return valueFromRow(row, metric);
    });

    return { labels: months, values };
  }

  function getSnapshot(month, metric) {
    const rows = rowsForMonth(month);
    const worldValue = weightedValue(rows, metric);
    const totalVotes = rows.reduce((sum, row) => sum + row.n, 0);

    return {
      month,
      metric,
      world: {
        n: totalVotes,
        value: worldValue || 0,
      },
      countries: rows
        .map((row) => ({
          country: row.country,
          n: row.n,
          value: valueFromRow(row, metric) || 0,
        }))
        .sort((a, b) => b.value - a.value),
    };
  }

  function previousMonth(month) {
    const p = parseMonthKey(month);
    if (!p) return month;
    const d = new Date(p.year, p.month - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  function getLeaderboard(month, metric, limit = 10) {
    const currentRows = rowsForMonth(month);
    const prevRows = rowsForMonth(previousMonth(month));

    const prevByCountry = prevRows.reduce((acc, row) => {
      acc[row.country] = row;
      return acc;
    }, {});

    const rows = currentRows
      .filter((row) => row.n >= minCountryN)
      .map((row) => {
        const value = valueFromRow(row, metric) || 0;
        const prev = prevByCountry[row.country];
        const prevValue = prev ? valueFromRow(prev, metric) : null;

        return {
          country: row.country,
          n: row.n,
          value,
          delta: prevValue === null ? null : Number((value - prevValue).toFixed(2)),
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, Math.max(1, Math.min(50, Number(limit) || 10)));

    return { month, metric, rows };
  }

  function getAggregate(country, metric, month) {
    const trend = getTrend(month, metric, country);
    return {
      country,
      metric,
      labels: trend.labels,
      values: trend.values,
    };
  }

  function getDashboard({ month, metric, country, leaderboardLimit = 10 }) {
    const globalSnapshot = getSnapshot(month, "global");
    const globalTrend = getTrend(month, "global", "WORLD");
    const trend = getTrend(month, metric, country);
    const profile = getCountryProfile(month, country);
    const snapshot = getSnapshot(month, metric);
    const leaderboard = getLeaderboard(month, metric, leaderboardLimit);

    const vals = globalTrend.values.filter((v) => v !== null);
    const current = vals.length ? vals[vals.length - 1] : null;
    const previous = vals.length > 1 ? vals[vals.length - 2] : null;
    const deltaMoM = current !== null && previous !== null ? Number((current - previous).toFixed(2)) : null;

    return {
      month,
      metric,
      country,
      minCountryN,
      header: {
        globalIndex: current,
        deltaMoM,
        totalVotes: globalSnapshot.world.n,
      },
      trend,
      profile,
      snapshot,
      leaderboard,
    };
  }

  return {
    db,
    metrics: METRICS,
    monthKey,
    parseMonthKey,
    recordVote,
    getWorldProfile,
    getCountryProfile,
    getTrend,
    getSnapshot,
    getLeaderboard,
    getAggregate,
    getDashboard,
    totalVotesForMonth,
  };
}

module.exports = {
  createDb,
  METRICS,
  monthKey,
  parseMonthKey,
};
