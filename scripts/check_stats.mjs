#!/usr/bin/env node

// Check the live usage counts: plugins/stats.json responds, is current, and
// the weekly roll-up has deleted the visitor hashes of finished weeks.
//
//   node scripts/check_stats.mjs [site-url]
//
// Runs nightly from test-plugins.yml, after scripts/check_deployed.mjs, so a
// problem with the Worker or its D1 database shows up between deploys. The
// roll-up runs daily at 00:15 UTC, well before the nightly check.

import { isoWeek } from "../worker/src/stats.js";

const siteUrl = process.argv[2] || "https://plugins.geolibre.app/";
const statsUrl = new URL(
  "plugins/stats.json",
  siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`,
);
// The Worker keeps one edge copy per UTC hour, so a copy can be up to an hour
// old; allow a little more for clock skew.
const MAX_AGE_MS = 70 * 60 * 1000;

const problems = [];
let body;
try {
  const response = await fetch(statsUrl, {
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  body = await response.json();
} catch (error) {
  console.error(`::error::${statsUrl} could not be read: ${error.message}`);
  process.exit(1);
}

const now = new Date();
const generated = Date.parse(body.generated);
if (Number.isNaN(generated) || now - generated > MAX_AGE_MS) {
  problems.push(
    `it was generated at ${body.generated}, more than an hour ago, so the edge cache is serving a stale copy.`,
  );
}
if (body.thisWeek !== isoWeek(now)) {
  problems.push(`its week is ${body.thisWeek}, not ${isoWeek(now)}.`);
}
if (typeof body.plugins !== "object" || body.plugins === null) {
  problems.push("it has no plugins object.");
} else if (Object.keys(body.plugins).length === 0) {
  problems.push(
    "it lists no plugins, so nothing is being counted (check the Worker's STATS binding and STATS_SALT secret).",
  );
}
if (typeof body.pendingRollUp !== "number") {
  problems.push(
    "it has no pendingRollUp count, so the deployed Worker is older than this check.",
  );
} else if (body.pendingRollUp !== 0) {
  problems.push(
    `${body.pendingRollUp} visitor hash(es) from finished weeks are still stored, so the daily roll-up didn't run (check the Worker's cron trigger).`,
  );
}

for (const problem of problems) {
  console.error(`::error::${statsUrl}: ${problem}`);
}
if (problems.length > 0) {
  process.exit(1);
}
console.log(
  `${statsUrl} is current: ${Object.keys(body.plugins).length} plugins counted since ${body.since}, no finished week left to roll up.`,
);
