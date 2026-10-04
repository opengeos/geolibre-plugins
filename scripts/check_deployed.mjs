#!/usr/bin/env node

// Check that the published site serves the bundles the published registry
// describes: for every entry with a `bundleSha256`, download its manifest,
// entry and style the way GeoLibre does and compare the hash. A mismatch means
// GeoLibre would refuse the plugin, for example because a CDN rewrote a file.
//
//   node scripts/check_deployed.mjs [registry-url]
//
// Edge caches can serve the previous bundle for a few minutes after a deploy,
// so a mismatch is retried before the check fails.

import { computeBundleHash, decodeSource } from "./registry.mjs";

const registryUrl =
  process.argv[2] ?? "https://plugins.geolibre.app/plugin-registry.json";
const ATTEMPTS = 6;
const RETRY_DELAY_MS = 30_000;

/**
 * Fetch a URL with a cache-busting query, as GeoLibre does for plugin assets.
 *
 * @param {URL} url The asset URL.
 * @returns {Promise<Response>}
 */
async function fetchFresh(url) {
  const busted = new URL(url);
  busted.searchParams.set("__geolibre_check", Date.now().toString());
  const response = await fetch(busted, { cache: "no-store" });
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
  const registry = await (await fetchFresh(new URL(registryUrl))).json();
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
