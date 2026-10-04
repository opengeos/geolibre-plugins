#!/usr/bin/env node

// Check that the published site serves the bundles the published registry
// describes: for every entry with a `bundleSha256`, download its manifest,
// entry and style the way GeoLibre does and compare the hash. A mismatch means
// GeoLibre would refuse the plugin, for example because a CDN rewrote a file.
//
//   node scripts/check_deployed.mjs [site-url]
//
// `site-url` is the deployed site's root (default https://plugins.geolibre.app/);
// the registry is read from its plugin-registry.json. A failure here comes after
// the site is live, so it alerts rather than prevents: fix forward and redeploy.
//
// Edge caches can serve the previous bundle for a few minutes after a deploy,
// so a mismatch is retried before the check fails.

import { computeBundleHash, decodeSource } from "./registry.mjs";

const siteUrl = process.argv[2] || "https://plugins.geolibre.app/";
const registryUrl = new URL(
  "plugin-registry.json",
  siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`,
);
const ATTEMPTS = 6;
const RETRY_DELAY_MS = 30_000;
// Bounds each request, body included, so a stalled server can't hold the job.
const FETCH_TIMEOUT_MS = 30_000;

/**
 * Fetch a URL with a cache-busting query, as GeoLibre does for plugin assets.
 *
 * @param {URL} url The asset URL.
 * @returns {Promise<Response>}
 */
async function fetchFresh(url) {
  const busted = new URL(url);
  busted.searchParams.set("__geolibre_check", Date.now().toString());
  const response = await fetch(busted, {
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`);
  }
  return response;
}

/**
 * Hash the bundle a published manifest points at.
 *
 * @param {URL} manifestUrl Absolute manifest URL.
 * @returns {Promise<string>}
 */
async function hashPublishedBundle(manifestUrl) {
  const manifest = await (await fetchFresh(manifestUrl)).json();
  const read = async (file) =>
    decodeSource(
      new Uint8Array(
        await (await fetchFresh(new URL(file, manifestUrl))).arrayBuffer(),
      ),
    );
  const entrySource = await read(manifest.entry);
  const styleSource =
    typeof manifest.style === "string" ? await read(manifest.style) : null;
  return computeBundleHash(entrySource, styleSource);
}

/**
 * Compare every hashed registry entry against the live bundles once.
 *
 * @returns {Promise<string[]>} One message per mismatch or fetch failure.
 */
async function checkOnce() {
  let registry;
  try {
    registry = await (await fetchFresh(registryUrl)).json();
  } catch (error) {
    // Right after a deploy the registry itself can be briefly unavailable;
    // report it so the attempt is retried instead of crashing.
    return [`registry: ${error.message}`];
  }
  const problems = [];
  let checked = 0;
  for (const entry of registry.plugins ?? []) {
    if (typeof entry.bundleSha256 !== "string") {
      continue;
    }
    checked += 1;
    const manifestUrl = new URL(entry.manifestUrl, registryUrl);
    try {
      const actual = await hashPublishedBundle(manifestUrl);
      if (actual !== entry.bundleSha256) {
        problems.push(
          `${entry.id}: registry has ${entry.bundleSha256}, ${manifestUrl} serves ${actual}`,
        );
      }
    } catch (error) {
      problems.push(`${entry.id}: ${error.message}`);
    }
  }
  console.log(`Checked ${checked} published bundles.`);
  return problems;
}

for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
  const problems = await checkOnce();
  if (problems.length === 0) {
    console.log("Every published bundle matches its registry hash.");
    process.exit(0);
  }
  console.warn(`Attempt ${attempt}/${ATTEMPTS}:`);
  for (const problem of problems) {
    console.warn(`- ${problem}`);
  }
  if (attempt < ATTEMPTS) {
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  }
}
console.error(
  "Published bundles do not match the registry; GeoLibre will refuse them.",
);
process.exit(1);
