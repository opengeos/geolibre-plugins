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
  loadRegistryEntries,
  registryPath,
  root,
} from "./registry.mjs";

const { entries, errors } = await loadRegistryEntries();
if (errors.length > 0) {
  console.error("Cannot build the registry:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

await fs.writeFile(
  registryPath,
  `${JSON.stringify(await buildRegistry(entries), null, 2)}\n`,
);
console.log(
  `Wrote ${path.relative(root, registryPath)} with ${entries.length} plugins.`,
);
