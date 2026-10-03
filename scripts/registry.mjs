// Shared loader for the per-plugin registry entries in `registry/<id>.json`.
//
// Each plugin's registry entry lives in its own file so pull requests that add
// or update different plugins never touch the same file. The published
// `plugin-registry.json` is generated from these files at build time by
// `scripts/build_registry.mjs` and is not committed.

import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import path from "node:path";

export const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
export const registryDir = path.join(root, "registry");
export const registryPath = path.join(root, "plugin-registry.json");

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
 * Assemble the published registry document from loaded entries.
 *
 * @param {{ entry: unknown }[]} entries Entries from `loadRegistryEntries()`.
 * @returns {{ version: number, plugins: unknown[] }}
 */
export function buildRegistry(entries) {
  return {
    version: REGISTRY_FORMAT_VERSION,
    plugins: entries.map(({ entry }) => entry),
  };
}
