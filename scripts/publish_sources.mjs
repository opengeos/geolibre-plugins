#!/usr/bin/env node

// Mirror plugins hosted from release zips to the R2 bucket that the
// `geolibre-plugins-mirror` Worker serves at plugins.geolibre.app/plugins/*.
//
// For each registry entry with a `source`:
//   1. Upload the unpacked zip to `plugins/<dir>/<version>/`, where <dir> is
//      the folder manifestUrl names (normally the id). A version folder
//      is written once: a `.source-sha256` marker records which zip it came
//      from, and a different zip for the same version is an error (bump the
//      version instead).
//   2. Then, for every plugin, point the stable `plugins/<dir>/plugin.json` at
//      that folder (its `entry` and `style` become `<version>/...`). Switching
//      one file switches the whole plugin, so a client never mixes a new
//      manifest with old code.
//
// Run it before deploying the registry, so the registry never announces a
// bundle hash the mirror doesn't serve yet. The reverse is briefly possible:
// until the new registry is live, the old one still lists the previous hash,
// so an install in that window is held back until it is retried (see the
// README's "Release-zip mirror" section).
//
//   node scripts/publish_sources.mjs            # needs CLOUDFLARE_API_TOKEN
//   node scripts/publish_sources.mjs --dry-run  # print the plan only
//
// The token needs R2 write access to the bucket; CLOUDFLARE_ACCOUNT_ID picks
// the account.

import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { loadRegistryEntries } from "./registry.mjs";
import { hasSource, unpackSourceBundle } from "./source-bundles.mjs";

const BUCKET = "geolibre-plugins";
const WRANGLER = "wrangler@4.147.0";
const MARKER = ".source-sha256";
const dryRun = process.argv.includes("--dry-run");

// Stored with each object; the Worker serves it back.
const CONTENT_TYPES = {
  css: "text/css; charset=utf-8",
  geojson: "application/geo+json",
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  js: "text/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  map: "application/json; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
  png: "image/png",
  svg: "image/svg+xml",
  txt: "text/plain; charset=utf-8",
  wasm: "application/wasm",
  webp: "image/webp",
  woff: "font/woff",
  woff2: "font/woff2",
};

/**
 * Run wrangler with the given arguments.
 *
 * A stalled call fails the deploy instead of hanging it; the next run
 * retries, and the marker-last order keeps a partial upload harmless.
 *
 * @param {string[]} args Arguments after `wrangler`.
 * @param {number} [timeout] Milliseconds before the call is killed.
 * @returns {string} Standard output.
 */
function wrangler(args, timeout = 120_000) {
  return execFileSync("npx", ["--yes", WRANGLER, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout,
  });
}

/**
 * Read an object's text from the bucket.
 *
 * @param {string} key Object key.
 * @returns {string | null} The text, or null when the object doesn't exist.
 */
function getObject(key) {
  try {
    return wrangler([
      "r2",
      "object",
      "get",
      `${BUCKET}/${key}`,
      "--pipe",
      "--remote",
    ]);
  } catch (error) {
    // Wrangler prints "The specified key does not exist." for a missing key.
    // Match stderr only: error.message repeats the command, whose key could
    // contain any text, and the "written once" check depends on telling a
    // missing marker apart from a failed request.
    if (/specified key does not exist/i.test(String(error.stderr ?? ""))) {
      return null;
    }
    throw error;
  }
}

/**
 * Upload a file to the bucket.
 *
 * @param {string} key Object key.
 * @param {string} file Local file path.
 */
function putObject(key, file) {
  const extension = key.split(".").pop()?.toLowerCase() ?? "";
  const args = [
    "r2",
    "object",
    "put",
    `${BUCKET}/${key}`,
    "--file",
    file,
    "--remote",
  ];
  if (CONTENT_TYPES[extension]) {
    args.push("--content-type", CONTENT_TYPES[extension]);
  }
  if (dryRun) {
    console.log(`  would upload ${key}`);
    return;
  }
  // Files can be up to 50 MB, so uploads get longer than reads.
  wrangler(args, 600_000);
  console.log(`  uploaded ${key}`);
}

/**
 * Upload text to the bucket through a temporary file.
 *
 * @param {string} key Object key.
 * @param {string} text Contents.
 */
async function putText(key, text) {
  const file = path.join(os.tmpdir(), `geolibre-publish-${process.pid}.tmp`);
  await fs.writeFile(file, text);
  try {
    putObject(key, file);
  } finally {
    await fs.rm(file, { force: true });
  }
}

/**
 * The stable manifest: the release's own manifest with `entry` and `style`
 * pointing into its version folder.
 *
 * @param {Record<string, unknown>} manifest The release's plugin.json.
 * @param {string} version The plugin version.
 * @param {string[]} files The unpacked files, relative to the zip's
 *   plugin.json folder.
 * @returns {string}
 */
function stableManifest(manifest, version, files) {
  // Point at the file as uploaded: `./x.js` and `x.js` name the same object,
  // but the Worker refuses keys with `.` segments, so normalize first and
  // insist the result is one of the unpacked files.
  const inVersion = (field) => {
    if (typeof manifest[field] !== "string") {
      throw new Error(`plugin.json ${field} must be a string`);
    }
    const normalized = path.posix.normalize(manifest[field]);
    if (!files.includes(normalized)) {
      throw new Error(
        `plugin.json ${field} "${manifest[field]}" is not in the release zip`,
      );
    }
    return `${version}/${normalized}`;
  };
  const pointed = { ...manifest, entry: inVersion("entry") };
  if (typeof manifest.style === "string") {
    pointed.style = inVersion("style");
  }
  return `${JSON.stringify(pointed, null, 2)}\n`;
}

const { entries, errors } = await loadRegistryEntries();
if (errors.length > 0) {
  throw new Error(errors.join("\n"));
}
const sources = entries.map(({ entry }) => entry).filter(hasSource);
if (sources.length === 0) {
  console.log("No registry entries are hosted from a release zip.");
  process.exit(0);
}
for (const name of ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"]) {
  if (!dryRun && !process.env[name]) {
    console.error(
      `${sources.length} plugin(s) are hosted from release zips, but ${name} is not set.`,
    );
    process.exit(1);
  }
}

// Step 1: version folders. Every one is in place before any plugin switches.
const stable = [];
for (const entry of sources) {
  const { dir, files } = await unpackSourceBundle(entry);
  const manifest = JSON.parse(
    await fs.readFile(path.join(dir, "plugin.json"), "utf8"),
  );
  // validate_plugins.mjs has already checked that the zip's plugin.json
  // version equals entry.version, so the folder name matches its contents.
  // The schema already limits id and version to these forms; checking again
  // here keeps a bad value from ever becoming an R2 key.
  // Files go in the folder manifestUrl names: plugins/<id>/ for new plugins,
  // or the folder a migrated plugin was always served from.
  const folder = /^plugins\/([a-z0-9]+(?:[._-][a-z0-9]+)*)\/plugin\.json$/.exec(
    entry.manifestUrl,
  )?.[1];
  if (
    !folder ||
    !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.+-]*)?$/.test(entry.version)
  ) {
    throw new Error(
      `${entry.id} ${entry.version}: unexpected manifestUrl or version format`,
    );
  }
  const prefix = `plugins/${folder}/${entry.version}/`;
  if (files.includes(MARKER)) {
    throw new Error(`${entry.id}: the release zip may not contain ${MARKER}`);
  }
  console.log(`${entry.id} ${entry.version}:`);

  const marker = dryRun ? null : getObject(prefix + MARKER);
  if (marker !== null && marker.trim() === entry.source.sha256) {
    console.log("  version folder already published");
  } else if (marker !== null) {
    throw new Error(
      `${entry.id} ${entry.version} was already published from a different zip (${marker.trim()}). Published versions never change; bump the version.`,
    );
  } else {
    for (const file of files) {
      putObject(prefix + file, path.join(dir, file));
    }
    // Written last, so a failed upload is retried in full next time.
    await putText(prefix + MARKER, `${entry.source.sha256}\n`);
  }
  stable.push({
    entry,
    key: `plugins/${folder}/plugin.json`,
    text: stableManifest(manifest, entry.version, files),
  });
}

// Step 2: switch each stable manifest to its version folder.
for (const { entry, key, text } of stable) {
  if (!dryRun && getObject(key) === text) {
    console.log(`${key} already points at ${entry.version}`);
    continue;
  }
  await putText(key, text);
}
console.log(`Published ${sources.length} plugin(s) from release zips.`);
