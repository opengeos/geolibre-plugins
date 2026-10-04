#!/usr/bin/env node

// Generate `plugin-registry.json` from the per-plugin `registry/<id>.json`
// files. The Pages and test workflows run this before publishing; run it
// locally (`npm run build:registry`) before serving the repo to a local
// GeoLibre build. It assembles the file and adds each local plugin's bundle
// hash; `npm run validate` checks the entries themselves.

import fs from "node:fs/promises";
import path from "node:path";

import {
  buildRegistry,
  loadBlocklist,
  loadRegistryEntries,
  registryPath,
  root,
} from "./registry.mjs";
import { pruneSourceCache } from "./source-bundles.mjs";

const { entries, errors } = await loadRegistryEntries();
if (errors.length > 0) {
  console.error("Cannot build the registry:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

const registry = await buildRegistry(entries);

// The registry must never offer a bundle the blocklist refuses: GeoLibre
// would install it and then refuse to load it.
const blockedHashes = new Set(
  (await loadBlocklist()).blocked
    .filter((entry) => entry.bundleSha256)
    .map((entry) => `${entry.id} ${entry.bundleSha256}`),
);
const served = registry.plugins.filter((plugin) =>
  blockedHashes.has(`${plugin.id} ${plugin.bundleSha256}`),
);
if (served.length > 0) {
  console.error("The registry serves bundles that blocklist.json blocks:");
  for (const plugin of served) {
    console.error(`- ${plugin.id} ${plugin.version} (${plugin.bundleSha256})`);
  }
  process.exit(1);
}

await fs.writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
console.log(
  `Wrote ${path.relative(root, registryPath)} with ${entries.length} plugins.`,
);
// Drop cached release zips the registry no longer uses (see deploy-pages.yml).
await pruneSourceCache(entries.map(({ entry }) => entry));
