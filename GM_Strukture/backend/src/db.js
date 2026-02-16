const { Pool } = require("pg");

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
    totalN += Number(row.n || 0);
    sum += Number(row[`sum_${metric}`] || 0);
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
    totalN += Number(row.n || 0);
    sums.politics += Number(row.sum_politics || 0);
    sums.environment += Number(row.sum_environment || 0);
    sums.safety += Number(row.sum_safety || 0);
    sums.social += Number(row.sum_social || 0);
    sums.global += Number(row.sum_global || 0);
  });

  if (!totalN) return null;

  return {
    n: totalN,
    n_manual: rows.reduce((sum, row) => sum + Number(row.n_manual || 0), 0),
    n_auto: rows.reduce((sum, row) => sum + Number(row.n_auto || 0), 0),
    politics: Number((sums.politics / totalN).toFixed(2)),
    environment: Number((sums.environment / totalN).toFixed(2)),
    safety: Number((sums.safety / totalN).toFixed(2)),
    social: Number((sums.social / totalN).toFixed(2)),
    global: Number((sums.global / totalN).toFixed(2)),
  };
}

function buildPoolConfig(databaseUrl) {
  const isLocal = /localhost|127\.0\.0\.1/.test(databaseUrl);
  const sslDisabled = String(process.env.PG_SSL_DISABLE || "false") === "true";
  return {
    connectionString: databaseUrl,
    ssl: isLocal || sslDisabled ? false : { rejectUnauthorized: false },
  };
}

async function createDb({ databaseUrl, minCountryN = 5 }) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const pool = new Pool(buildPoolConfig(databaseUrl));

  await pool.query(`
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
      n_manual INTEGER NOT NULL DEFAULT 0,
      n_auto INTEGER NOT NULL DEFAULT 0,
      sum_politics DOUBLE PRECISION NOT NULL,
      sum_environment DOUBLE PRECISION NOT NULL,
      sum_safety DOUBLE PRECISION NOT NULL,
      sum_social DOUBLE PRECISION NOT NULL,
      sum_global DOUBLE PRECISION NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY(month, country)
    );

    CREATE INDEX IF NOT EXISTS idx_agg_month ON agg_month_country(month);
    CREATE INDEX IF NOT EXISTS idx_agg_country ON agg_month_country(country);
  `);

  async function recordVote({ month, country, countrySource, scores, deviceHash, createdAt }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `INSERT INTO device_month (device_hash, month, created_at) VALUES ($1, $2, $3)`,
        [deviceHash, month, createdAt],
      );

      const nManual = countrySource === "manual" ? 1 : 0;
      const nAuto = countrySource === "manual" ? 0 : 1;

      await client.query(
        `
          INSERT INTO agg_month_country (
            month, country, n, n_manual, n_auto,
            sum_politics, sum_environment, sum_safety, sum_social, sum_global,
            updated_at
          ) VALUES ($1, $2, 1, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT(month, country) DO UPDATE SET
            n = agg_month_country.n + 1,
            n_manual = agg_month_country.n_manual + EXCLUDED.n_manual,
            n_auto = agg_month_country.n_auto + EXCLUDED.n_auto,
            sum_politics = agg_month_country.sum_politics + EXCLUDED.sum_politics,
            sum_environment = agg_month_country.sum_environment + EXCLUDED.sum_environment,
            sum_safety = agg_month_country.sum_safety + EXCLUDED.sum_safety,
            sum_social = agg_month_country.sum_social + EXCLUDED.sum_social,
            sum_global = agg_month_country.sum_global + EXCLUDED.sum_global,
            updated_at = EXCLUDED.updated_at
        `,
        [
          month,
          country,
          nManual,
          nAuto,
          scores.politics,
          scores.environment,
          scores.safety,
          scores.social,
          scores.global,
          createdAt,
        ],
      );

      await client.query("COMMIT");
      return { ok: true };
    } catch (err) {
      await client.query("ROLLBACK");
      if (err && err.code === "23505") {
        return { ok: false, code: "already_voted_this_month" };
      }
      throw err;
    } finally {
      client.release();
    }
  }

  async function rowsForMonth(month) {
    const result = await pool.query(
      `
        SELECT month, country, n, n_manual, n_auto,
               sum_politics, sum_environment, sum_safety, sum_social, sum_global
        FROM agg_month_country
        WHERE month = $1
      `,
      [month],
    );
    return result.rows;
  }

  async function totalVotesForMonth(month) {
    const rows = await rowsForMonth(month);
    return rows.reduce((sum, row) => sum + Number(row.n || 0), 0);
  }

  async function getWorldProfile(month) {
    const rows = await rowsForMonth(month);
    const profile = weightedProfile(rows);
    if (!profile) {
      return { country: "WORLD", n: 0, n_manual: 0, n_auto: 0, politics: 0, environment: 0, safety: 0, social: 0, global: 0 };
    }
    return { country: "WORLD", ...profile };
  }

  async function getCountryProfile(month, country) {
    if (country === "WORLD") return getWorldProfile(month);

    const result = await pool.query(
      `
        SELECT month, country, n, n_manual, n_auto,
               sum_politics, sum_environment, sum_safety, sum_social, sum_global
        FROM agg_month_country
        WHERE month = $1 AND country = $2
      `,
      [month, country],
    );
    const row = result.rows[0];

    if (!row) {
      return { country, n: 0, n_manual: 0, n_auto: 0, politics: 0, environment: 0, safety: 0, social: 0, global: 0 };
    }

    return {
      country,
      n: Number(row.n || 0),
      n_manual: Number(row.n_manual || 0),
      n_auto: Number(row.n_auto || 0),
      politics: valueFromRow(row, "politics") || 0,
      environment: valueFromRow(row, "environment") || 0,
      safety: valueFromRow(row, "safety") || 0,
      social: valueFromRow(row, "social") || 0,
      global: valueFromRow(row, "global") || 0,
    };
  }

  async function getTrend(month, metric, country) {
    const months = monthSeries(12, month);

    let rows = [];
    if (country === "WORLD") {
      const result = await pool.query(
        `
          SELECT month, country, n, n_manual, n_auto,
                 sum_politics, sum_environment, sum_safety, sum_social, sum_global
          FROM agg_month_country
          WHERE month = ANY($1::text[])
        `,
        [months],
      );
      rows = result.rows;
    } else {
      const result = await pool.query(
        `
          SELECT month, country, n, n_manual, n_auto,
                 sum_politics, sum_environment, sum_safety, sum_social, sum_global
          FROM agg_month_country
          WHERE country = $1 AND month = ANY($2::text[])
        `,
        [country, months],
      );
      rows = result.rows;
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

      return valueFromRow(monthRows[0], metric);
    });

    return { labels: months, values };
  }

  async function getSnapshot(month, metric) {
    const rows = await rowsForMonth(month);
    const worldValue = weightedValue(rows, metric);
    const totalVotes = rows.reduce((sum, row) => sum + Number(row.n || 0), 0);
    const totalManual = rows.reduce((sum, row) => sum + Number(row.n_manual || 0), 0);
    const totalAuto = rows.reduce((sum, row) => sum + Number(row.n_auto || 0), 0);

    return {
      month,
      metric,
      world: {
        n: totalVotes,
        n_manual: totalManual,
        n_auto: totalAuto,
        value: worldValue || 0,
      },
      countries: rows
        .map((row) => ({
          country: row.country,
          n: Number(row.n || 0),
          n_manual: Number(row.n_manual || 0),
          n_auto: Number(row.n_auto || 0),
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

  async function getLeaderboard(month, metric, limit = 10) {
    const currentRows = await rowsForMonth(month);
    const prevRows = await rowsForMonth(previousMonth(month));
    const world = {
      n: currentRows.reduce((sum, row) => sum + Number(row.n || 0), 0),
      n_manual: currentRows.reduce((sum, row) => sum + Number(row.n_manual || 0), 0),
      n_auto: currentRows.reduce((sum, row) => sum + Number(row.n_auto || 0), 0),
    };

    const prevByCountry = prevRows.reduce((acc, row) => {
      acc[row.country] = row;
      return acc;
    }, {});

    const rows = currentRows
      .filter((row) => Number(row.n || 0) >= minCountryN)
      .map((row) => {
        const value = valueFromRow(row, metric) || 0;
        const prev = prevByCountry[row.country];
        const prevValue = prev ? valueFromRow(prev, metric) : null;

        return {
          country: row.country,
          n: Number(row.n || 0),
          n_manual: Number(row.n_manual || 0),
          n_auto: Number(row.n_auto || 0),
          value,
          delta: prevValue === null ? null : Number((value - prevValue).toFixed(2)),
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, Math.max(1, Math.min(50, Number(limit) || 10)));

    return { month, metric, world, rows };
  }

  async function getAggregate(country, metric, month) {
    const trend = await getTrend(month, metric, country);
    return {
      country,
      metric,
      labels: trend.labels,
      values: trend.values,
    };
  }

  async function getDashboard({ month, metric, country, leaderboardLimit = 10 }) {
    const globalSnapshot = await getSnapshot(month, "global");
    const globalTrend = await getTrend(month, "global", "WORLD");
    const trend = await getTrend(month, metric, country);
    const profile = await getCountryProfile(month, country);
    const snapshot = await getSnapshot(month, metric);
    const leaderboard = await getLeaderboard(month, metric, leaderboardLimit);

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
    pool,
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
