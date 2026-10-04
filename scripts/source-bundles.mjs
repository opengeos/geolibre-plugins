// Release zips for plugins whose code is not committed here.
//
// A registry entry with `"source": { "url", "sha256" }` points at a plugin's
// release zip instead of a `plugins/<dir>/` folder. CI downloads the zip,
// checks its SHA-256, and unpacks it with the same layout rules as GeoLibre's
// own zip install (`plugin-archive-unpack.ts`): `plugin.json` at the root or
// inside a single wrapping folder, with `__MACOSX/` ignored. The unpacked
// plugin is then validated, hashed, and mirrored to R2 like any other.

import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import path from "node:path";

import { unzipSync, zipSync } from "fflate";

// Not imported from registry.mjs, which imports this module.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const cacheDir = path.join(root, ".cache", "sources");

// Per-plugin exceptions for release-zip plugins, keyed by id:
// - `folder`: a plugin committed under another folder before it moved to a
//   release zip keeps that folder, so existing installs keep their URL.
//   Listing these, rather than accepting any folder, stops an entry from
//   claiming and overwriting another plugin's folder in R2.
// - `sourceDir`: where its readable source is kept in this repository. CI
//   checks that folder still matches the release zip, file for file.
const MIGRATED = new Map([
  [
    "geolibre-sample-plugin",
    { folder: "sample", sourceDir: "examples/sample" },
  ],
]);

/**
 * The `plugins/<dir>` folder a release-zip entry must be served from.
 *
 * @param {{ id: string }} entry A registry entry with a `source`.
 * @returns {string} The folder name.
 */
export function sourceFolder(entry) {
  return MIGRATED.get(entry.id)?.folder ?? entry.id;
}

/**
 * The folder in this repository that holds a release-zip plugin's readable
 * source, if any.
 *
 * @param {{ id: string }} entry A registry entry with a `source`.
 * @returns {string | null} A repo-relative folder, or null.
 */
export function readableSourceDir(entry) {
  return MIGRATED.get(entry.id)?.sourceDir ?? null;
}

// Per-file cap, matching MAX_PLUGIN_ASSET_BYTES in GeoLibre.
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const MAX_ZIP_BYTES = 100 * 1024 * 1024;
const MAX_UNPACKED_BYTES = 200 * 1024 * 1024;
const MAX_FILES = 2000;
const DOWNLOAD_TIMEOUT_MS = 120_000;

/**
 * Whether a registry entry is hosted from a release zip.
 *
 * @param {unknown} entry A registry entry.
 * @returns {boolean}
 */
export function hasSource(entry) {
  return (
    entry !== null &&
    typeof entry === "object" &&
    typeof entry.source?.url === "string" &&
    typeof entry.source?.sha256 === "string"
  );
}

/**
 * Read a response body, failing as soon as it passes `limit` bytes.
 *
 * @param {Response} response The download.
 * @param {number} limit Maximum body size.
 * @param {string} url For the error message.
 * @returns {Promise<Uint8Array>}
 */
async function readCapped(response, limit, url) {
  const tooLarge = () => new Error(`${url} is larger than ${limit} bytes`);
  if (Number(response.headers.get("content-length")) > limit) {
    throw tooLarge();
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.byteLength;
    if (size > limit) {
      throw tooLarge();
    }
    chunks.push(chunk);
  }
  return new Uint8Array(Buffer.concat(chunks));
}

/**
 * Download a release zip, or reuse a cached copy, and check its SHA-256.
 *
 * @param {{ url: string, sha256: string }} source The entry's `source`.
 * @returns {Promise<Uint8Array>} The verified zip bytes.
 */
async function fetchVerifiedZip(source) {
  const cached = path.join(cacheDir, `${source.sha256}.zip`);
  let bytes;
  try {
    bytes = new Uint8Array(await fs.readFile(cached));
  } catch {
    const response = await fetch(source.url, {
      signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`${source.url} returned HTTP ${response.status}`);
    }
    // fetch follows redirects; don't accept one that left HTTPS.
    if (!response.url.startsWith("https://")) {
      throw new Error(`${source.url} redirected to a non-HTTPS URL`);
    }
    bytes = await readCapped(response, MAX_ZIP_BYTES, source.url);
  }
  const actual = createHash("sha256").update(bytes).digest("hex");
  if (actual !== source.sha256) {
    throw new Error(
      `${source.url} has SHA-256 ${actual}, but the registry entry lists ${source.sha256}`,
    );
  }
  await fs.mkdir(cacheDir, { recursive: true });
  await fs.writeFile(cached, bytes);
  return bytes;
}

/**
 * Find `plugin.json`: at the root, or else the shallowest one, ignoring
 * `__MACOSX/`. Mirrors `findManifestPath` in GeoLibre.
 *
 * @param {string[]} names Zip entry names.
 * @returns {string | null}
 */
function findManifestPath(names) {
  if (names.includes("plugin.json")) {
    return "plugin.json";
  }
  let best = null;
  for (const name of names) {
    if (!name.endsWith("/plugin.json") || name.startsWith("__MACOSX/")) {
      continue;
    }
    if (best === null || name.split("/").length < best.split("/").length) {
      best = name;
    }
  }
  return best;
}

/**
 * Whether a zip entry is OS metadata rather than part of the plugin: macOS's
 * `__MACOSX/` folder and `.DS_Store` files. These are never unpacked, so they
 * are never published either.
 *
 * @param {string} name A zip entry name.
 * @returns {boolean}
 */
function isJunk(name) {
  return (
    name.startsWith("__MACOSX/") ||
    name === ".DS_Store" ||
    name.endsWith("/.DS_Store")
  );
}

/**
 * Whether a path inside the zip is a plain relative path made of URL-safe
 * characters.
 *
 * @param {string} name A zip entry name, relative to the manifest folder.
 * @returns {boolean}
 */
function isSafeRelativePath(name) {
  // Plain URL-safe names only: the Worker maps the request path to the R2 key
  // without percent-decoding, so a name like "my file.js" could never be served.
  return (
    /^[A-Za-z0-9._@+-]+(?:\/[A-Za-z0-9._@+-]+)*$/.test(name) &&
    name.split("/").every((part) => part !== "." && part !== "..")
  );
}

/**
 * Download, verify and unpack a source entry's release zip.
 *
 * Only the folder that holds `plugin.json` is unpacked, into
 * `.cache/sources/<sha256>/`, so the result looks like a `plugins/<dir>/`
 * folder and can be validated and hashed the same way.
 *
 * @param {{ source: { url: string, sha256: string } }} entry A source entry.
 * @returns {Promise<{ dir: string, files: string[] }>} The unpacked folder
 *   and the paths of the files in it, relative to that folder.
 */
export async function unpackSourceBundle(entry) {
  const dir = path.join(cacheDir, entry.source.sha256);
  const zip = await fetchVerifiedZip(entry.source);
  // Pass 1: read the zip's directory only (nothing is inflated) to find the
  // folder that holds plugin.json.
  const allNames = [];
  unzipSync(zip, {
    filter: (file) => {
      if (!file.name.endsWith("/") && !isJunk(file.name)) {
        allNames.push(file.name);
      }
      return false;
    },
  });
  const manifestPath = findManifestPath(allNames);
  if (manifestPath === null) {
    throw new Error(`${entry.source.url} has no plugin.json`);
  }
  const prefix = manifestPath.slice(0, -"plugin.json".length);

  // Pass 2: inflate only that folder, so unrelated files elsewhere in the zip
  // don't count against the limits. fflate inflates each file into a buffer
  // of its declared size, so capping the declared sizes bounds memory; the
  // inflated lengths are checked again below in case the directory lied.
  let unpackedBytes = 0;
  let fileCount = 0;
  const tooLarge = () =>
    new Error(
      `${entry.source.url} unpacks to more than ${MAX_UNPACKED_BYTES} bytes or ${MAX_FILES} files`,
    );
  const archive = unzipSync(zip, {
    filter: (file) => {
      if (
        file.name.endsWith("/") ||
        isJunk(file.name) ||
        !file.name.startsWith(prefix)
      ) {
        return false;
      }
      if (file.originalSize > MAX_FILE_BYTES) {
        throw new Error(`${file.name} is larger than ${MAX_FILE_BYTES} bytes`);
      }
      unpackedBytes += file.originalSize;
      fileCount += 1;
      if (unpackedBytes > MAX_UNPACKED_BYTES || fileCount > MAX_FILES) {
        throw tooLarge();
      }
      return true;
    },
  });
  const names = Object.keys(archive);
  const inflatedBytes = names.reduce(
    (sum, name) => sum + archive[name].byteLength,
    0,
  );
  if (inflatedBytes > MAX_UNPACKED_BYTES) {
    throw tooLarge();
  }

  await fs.rm(dir, { recursive: true, force: true });
  const files = [];
  for (const name of names) {
    const relative = name.slice(prefix.length);
    if (!isSafeRelativePath(relative)) {
      throw new Error(`${entry.source.url} contains an unsafe path: ${name}`);
    }
    const target = path.join(dir, relative);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, archive[name]);
    files.push(relative);
  }
  return { dir, files: files.sort() };
}

/**
 * Delete cached zips and unpacked folders that no registry entry references
 * any more, so the CI cache only holds current releases.
 *
 * @param {unknown[]} entries Registry entries.
 * @returns {Promise<number>} How many cache items were removed.
 */
export async function pruneSourceCache(entries) {
  const keep = new Set(
    entries.filter(hasSource).map((entry) => entry.source.sha256),
  );
  let names;
  try {
    names = await fs.readdir(cacheDir);
  } catch {
    return 0;
  }
  let removed = 0;
  for (const name of names) {
    if (!keep.has(name.replace(/\.zip$/, ""))) {
      await fs.rm(path.join(cacheDir, name), { recursive: true, force: true });
      removed += 1;
    }
  }
  return removed;
}

// Zip timestamps are stored as local date and time, so build the date from
// local fields: it then encodes the same way in every time zone.
const FIXED_DATE = new Date(1980, 0, 2);

/**
 * List every file under a folder, relative to it, sorted, leaving out OS
 * metadata such as `.DS_Store`.
 *
 * @param {string} dir Absolute folder path.
 * @param {string} [prefix] Path prefix for recursion.
 * @returns {Promise<string[]>}
 */
export async function listFiles(dir, prefix = "") {
  const files = [];
  for (const dirent of await fs.readdir(path.join(dir, prefix), {
    withFileTypes: true,
  })) {
    const relative = path.posix.join(prefix, dirent.name);
    if (dirent.isDirectory()) {
      files.push(...(await listFiles(dir, relative)));
    } else if (dirent.isFile()) {
      if (!isJunk(relative)) {
        files.push(relative);
      }
    } else {
      throw new Error(`${relative} is not a regular file`);
    }
  }
  return files.sort();
}

/**
 * Zip a plugin folder reproducibly: files sorted, a fixed date, and the bytes
 * as they are, so the same folder always gives the same SHA-256.
 *
 * @param {string} folder Absolute path to a folder with a plugin.json.
 * @returns {Promise<Uint8Array>} The zip bytes.
 */
export async function zipFolder(folder) {
  const entries = {};
  for (const file of await listFiles(folder)) {
    entries[file] = [
      new Uint8Array(await fs.readFile(path.join(folder, file))),
      { mtime: FIXED_DATE, level: 9 },
    ];
  }
  return zipSync(entries);
}
