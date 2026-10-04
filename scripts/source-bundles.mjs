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

import { unzipSync } from "fflate";

// Not imported from registry.mjs, which imports this module.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const cacheDir = path.join(root, ".cache", "sources");

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
 * Whether a path inside the zip is a plain relative path.
 *
 * @param {string} name A zip entry name, relative to the manifest folder.
 * @returns {boolean}
 */
function isSafeRelativePath(name) {
  return (
    !name.startsWith("/") &&
    !name.includes("\\") &&
    !/^[a-z][a-z\d+.-]*:/i.test(name) &&
    name.split("/").every((part) => part && part !== "." && part !== "..")
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
  // Check sizes from the zip directory before inflating anything.
  let unpackedBytes = 0;
  let fileCount = 0;
  const archive = unzipSync(zip, {
    filter: (file) => {
      if (isJunk(file.name)) {
        return false;
      }
      if (file.originalSize > MAX_FILE_BYTES) {
        throw new Error(`${file.name} is larger than ${MAX_FILE_BYTES} bytes`);
      }
      unpackedBytes += file.originalSize;
      fileCount += 1;
      if (unpackedBytes > MAX_UNPACKED_BYTES || fileCount > MAX_FILES) {
        throw new Error(
          `${entry.source.url} unpacks to more than ${MAX_UNPACKED_BYTES} bytes or ${MAX_FILES} files`,
        );
      }
      return true;
    },
  });
  const names = Object.keys(archive).filter((name) => !name.endsWith("/"));
  const manifestPath = findManifestPath(names);
  if (manifestPath === null) {
    throw new Error(`${entry.source.url} has no plugin.json`);
  }
  const prefix = manifestPath.slice(0, -"plugin.json".length);

  await fs.rm(dir, { recursive: true, force: true });
  const files = [];
  for (const name of names) {
    if (!name.startsWith(prefix)) {
      continue;
    }
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
