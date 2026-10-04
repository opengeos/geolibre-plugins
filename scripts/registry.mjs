// Shared loader for the per-plugin registry entries in `registry/<id>.json`.
//
// Each plugin's registry entry lives in its own file so pull requests that add
// or update different plugins never touch the same file. The published
// `plugin-registry.json` is generated from these files at build time by
// `scripts/build_registry.mjs` and is not committed.

import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import path from "node:path";

import {
  hasSource,
  sourceFolder,
  unpackSourceBundle,
} from "./source-bundles.mjs";

export const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
export const registryDir = path.join(root, "registry");
export const registryPath = path.join(root, "plugin-registry.json");
export const blocklistPath = path.join(root, "blocklist.json");

/**
 * Read `blocklist.json`: plugins, or single bundles of them, that GeoLibre
 * refuses to load. Published as is at the site root.
 *
 * @returns {Promise<{ version: number, blocked: { id: string, bundleSha256?: string, reason: string, date: string }[] }>}
 */
export async function loadBlocklist() {
  return JSON.parse(await fs.readFile(blocklistPath, "utf8"));
}

// Format version of the generated `plugin-registry.json`.
export const REGISTRY_FORMAT_VERSION = 1;

/**
 * Read every `registry/*.json` entry, sorted by file name.
 *
 * Parse failures are reported in `errors` rather than thrown, so a validator
 * can list every broken file at once.
 *
 * @returns {Promise<{ entries: { file: string, entry: unknown }[], errors: string[] }>}
 *   `file` is the path relative to the repository root.
 */
export async function loadRegistryEntries() {
  const errors = [];
  let names;
  try {
    names = await fs.readdir(registryDir);
  } catch (error) {
    return {
      entries: [],
      errors: [`Cannot read registry/: ${error.message}`],
    };
  }

  const entries = [];
  for (const name of names.filter((n) => n.endsWith(".json")).sort()) {
    const file = path.posix.join("registry", name);
    try {
      const entry = JSON.parse(
        await fs.readFile(path.join(registryDir, name), "utf8"),
      );
      entries.push({ file, entry });
    } catch (error) {
      errors.push(`${file} is not valid JSON: ${error.message}`);
    }
  }
  return { entries, errors };
}

/**
 * Hash a plugin bundle the way GeoLibre does.
 *
 * Mirrors `computePluginBundleHash` in GeoLibre's
 * `apps/geolibre-desktop/src/lib/plugin-integrity.ts`: SHA-256 of the entry
 * and of the style (an empty string when there is none), then SHA-256 of the
 * two digests together. The sources are text decoded the way `fetch`'s
 * `Response.text()` decodes them, so callers should pass `decodeSource()`
 * output.
 *
 * @param {string} entrySource The entry module's source.
 * @param {string | null | undefined} styleSource The stylesheet, if any.
 * @returns {string} Lowercase hex digest.
 */
export function computeBundleHash(entrySource, styleSource) {
  const sha256 = (data) => createHash("sha256").update(data).digest();
  const combined = Buffer.concat([
    sha256(Buffer.from(entrySource, "utf8")),
    sha256(Buffer.from(styleSource ?? "", "utf8")),
  ]);
  return sha256(combined).toString("hex");
}

/**
 * Decode bundle bytes the way `Response.text()` does (UTF-8, BOM stripped,
 * invalid sequences replaced), so the hash matches what the app computes.
 *
 * @param {Uint8Array} bytes Raw file bytes.
 * @returns {string}
 */
export function decodeSource(bytes) {
  return new TextDecoder().decode(bytes);
}

/**
 * Hash a plugin hosted in this repository from its manifest on disk.
 *
 * @param {string} manifestUrl A relative `plugins/<dir>/plugin.json` URL.
 * @returns {Promise<string>} The bundle hash.
 */
export async function hashLocalBundle(manifestUrl) {
  return hashBundleAt(path.join(root, manifestUrl));
}

/**
 * Hash the plugin whose `plugin.json` is at `manifestPath`.
 *
 * @param {string} manifestPath Absolute path to a `plugin.json`.
 * @returns {Promise<string>} The bundle hash.
 */
export async function hashBundleAt(manifestPath) {
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const pluginDir = path.dirname(manifestPath);
  const entrySource = decodeSource(
    await fs.readFile(path.join(pluginDir, manifest.entry)),
  );
  const styleSource =
    typeof manifest.style === "string"
      ? decodeSource(await fs.readFile(path.join(pluginDir, manifest.style)))
      : null;
  return computeBundleHash(entrySource, styleSource);
}

/**
 * Assemble the published registry document from loaded entries.
 *
 * Each plugin hosted here, whether committed or unpacked from its release
 * zip, gets a `bundleSha256`: the hash GeoLibre computes
 * over the entry and style it downloads, so the app can check that what it
 * fetched is what was reviewed. It is computed here and never written in
 * `registry/<id>.json`.
 *
 * @param {{ entry: Record<string, unknown> }[]} entries Entries from
 *   `loadRegistryEntries()`, already validated.
 * @returns {Promise<{ version: number, plugins: Record<string, unknown>[] }>}
 */
export async function buildRegistry(entries) {
  const plugins = [];
  for (const { entry } of entries) {
    if (hasSource(entry)) {
      // Hosted from a release zip and served from R2: hash the unpacked zip.
      const { dir } = await unpackSourceBundle(entry);
      const plugin = {
        ...entry,
        bundleSha256: await hashBundleAt(path.join(dir, "plugin.json")),
      };
      if (entry.screenshots) {
        // Served from the version's immutable mirror folder; relative to the
        // registry, like manifestUrl.
        const folder = `plugins/${sourceFolder(entry)}/${entry.version}`;
        plugin.screenshots = entry.screenshots.map((shot) => ({
          ...shot,
          url: `${folder}/${shot.path}`,
        }));
      }
      plugins.push(plugin);
      continue;
    }
    const isLocal =
      typeof entry.manifestUrl === "string" &&
      entry.manifestUrl.startsWith("plugins/");
    plugins.push(
      isLocal
        ? { ...entry, bundleSha256: await hashLocalBundle(entry.manifestUrl) }
        : entry,
    );
  }
  return { version: REGISTRY_FORMAT_VERSION, plugins };
}
