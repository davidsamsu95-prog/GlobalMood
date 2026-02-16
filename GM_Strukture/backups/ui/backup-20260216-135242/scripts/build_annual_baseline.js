#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const OUT_FILE = path.join(ROOT, "annual_baseline.json");

function usage() {
  console.log("Usage: node scripts/build_annual_baseline.js [input.json]");
  console.log("Input format: { year, updatedAt?, sourceNote?, sources?, countries:[{country,value,n?,delta?,metrics?}] }");
}

function normalizeCountryRow(row) {
  if (!row || typeof row !== "object") return null;
  const country = String(row.country || "").toUpperCase();
  if (!country) return null;

  const value = Number(row.value);
  if (!Number.isFinite(value)) return null;

  const metrics = row.metrics && typeof row.metrics === "object" ? row.metrics : {};

  return {
    country,
    value: Math.max(0, Math.min(100, value)),
    n: Math.max(0, Number(row.n || 0)),
    delta: Number.isFinite(Number(row.delta)) ? Number(row.delta) : null,
    metrics: {
      politics: Number.isFinite(Number(metrics.politics)) ? Number(metrics.politics) : Math.max(0, Math.min(100, value)),
      environment: Number.isFinite(Number(metrics.environment)) ? Number(metrics.environment) : Math.max(0, Math.min(100, value)),
      safety: Number.isFinite(Number(metrics.safety)) ? Number(metrics.safety) : Math.max(0, Math.min(100, value)),
      social: Number.isFinite(Number(metrics.social)) ? Number(metrics.social) : Math.max(0, Math.min(100, value)),
    },
  };
}

function main() {
  const arg = process.argv[2];
  if (arg === "-h" || arg === "--help") {
    usage();
    process.exit(0);
  }

  let input;
  if (arg) {
    const raw = fs.readFileSync(path.resolve(process.cwd(), arg), "utf8");
    input = JSON.parse(raw);
  } else {
    const raw = fs.readFileSync(OUT_FILE, "utf8");
    input = JSON.parse(raw);
  }

  const rows = Array.isArray(input.countries) ? input.countries.map(normalizeCountryRow).filter(Boolean) : [];
  if (!rows.length) {
    throw new Error("No valid countries found in input.");
  }

  const payload = {
    year: Number(input.year) || new Date().getFullYear(),
    updatedAt: input.updatedAt || new Date().toISOString(),
    sourceNote: input.sourceNote || "Annual baseline dataset",
    sources: Array.isArray(input.sources) ? input.sources : [],
    countries: rows,
  };

  fs.writeFileSync(OUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Wrote ${OUT_FILE} with ${rows.length} countries for year ${payload.year}.`);
}

main();
