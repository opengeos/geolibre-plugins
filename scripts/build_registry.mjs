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

// The registry must never offer what the blocklist refuses (GeoLibre would
// install it and then refuse to load it). validate_plugins.mjs checks the
// whole-plugin rule too; repeating it here keeps a bare build safe.
let blocklist;
try {
  blocklist = await loadBlocklist();
} catch (error) {
  console.error(`blocklist.json cannot be read: ${error.message}`);
  process.exit(1);
}
if (!Array.isArray(blocklist?.blocked)) {
  console.error(
    'blocklist.json must have a "blocked" array; run npm run validate for details.',
  );
  process.exit(1);
}
const wholeBlocks = new Set(
  blocklist.blocked
    .filter((entry) => !entry.bundleSha256)
    .map((entry) => entry.id),
);
const hashBlocks = blocklist.blocked.filter((entry) => entry.bundleSha256);
const conflicts = [];
for (const plugin of registry.plugins) {
  if (wholeBlocks.has(plugin.id)) {
    conflicts.push(`${plugin.id} is blocked outright but still listed`);
  }
  for (const block of hashBlocks.filter((entry) => entry.id === plugin.id)) {
    if (plugin.bundleSha256 === undefined) {
      // Without a hash the block can't be checked against what is served.
      conflicts.push(
        `${plugin.id} has a version blocked by hash, but its entry has no bundleSha256 to check`,
      );
    } else if (plugin.bundleSha256 === block.bundleSha256) {
      conflicts.push(
        `${plugin.id} ${plugin.version} serves the blocked bundle ${plugin.bundleSha256}`,
      );
    }
  }
}
if (conflicts.length > 0) {
  console.error("The registry contradicts blocklist.json:");
  for (const conflict of conflicts) {
    console.error(`- ${conflict}`);
  }
  process.exit(1);
}

await fs.writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
console.log(
  `Wrote ${path.relative(root, registryPath)} with ${entries.length} plugins.`,
);
// Drop cached release zips the registry no longer uses (see deploy-pages.yml).
await pruneSourceCache(entries.map(({ entry }) => entry));
