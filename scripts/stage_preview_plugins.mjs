#!/usr/bin/env node

// Stage release-zip plugins from a pull request for the preview build.
//
//   node scripts/stage_preview_plugins.mjs <pr-checkout> <dest> [registry/<id>.json ...]
//
// For each changed registry file that has a `source`, read the entry from the
// PR checkout as plain JSON, then download, verify and unpack its release zip
// with this repository's own code (source-bundles.mjs) into <dest>/<id>/. The
// preview workflow runs this from the base branch under pull_request_target:
// nothing from the pull request is executed, only its JSON is read and its
// zip unpacked. Prints the staged ids, one per line.

import fs from "node:fs/promises";
import path from "node:path";

import { hasSource, unpackSourceBundle } from "./source-bundles.mjs";

const ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const REGISTRY_FILE = /^registry\/([a-z0-9]+(?:[._-][a-z0-9]+)*)\.json$/;

const [prRoot, dest, ...files] = process.argv.slice(2);
if (!prRoot || !dest) {
  console.error(
    "Usage: node scripts/stage_preview_plugins.mjs <pr-checkout> <dest> [registry/<id>.json ...]",
  );
  process.exit(2);
}

const staged = [];
let failed = 0;
for (const file of files) {
  // Only plain registry/<id>.json names, so a crafted path can't escape.
  const fileId = REGISTRY_FILE.exec(file)?.[1];
  if (!fileId) {
    continue;
  }
  let entry;
  try {
    entry = JSON.parse(await fs.readFile(path.join(prRoot, file), "utf8"));
  } catch {
    // Deleted in the PR, or not valid JSON (validation reports that).
    continue;
  }
  // The file name, the entry's id and the zip's plugin.json must all name
  // the same plugin, so the preview shows exactly what the PR changes.
  if (!hasSource(entry) || entry.id !== fileId || !ID.test(entry.id)) {
    continue;
  }
  // One broken entry (bad hash, 404, oversized zip) shouldn't stop the
  // preview for the others; report it and carry on.
  let dir;
  try {
    ({ dir } = await unpackSourceBundle(entry));
  } catch (error) {
    console.error(
      `::error::${file}: could not stage its release zip: ${error.message}`,
    );
    failed += 1;
    continue;
  }
  let manifestId;
  try {
    manifestId = JSON.parse(
      await fs.readFile(path.join(dir, "plugin.json"), "utf8"),
    ).id;
  } catch {
    manifestId = undefined;
  }
  if (manifestId !== entry.id) {
    console.error(
      `::error::${file}: the release zip's plugin.json has id "${manifestId}", not "${entry.id}".`,
    );
    failed += 1;
    continue;
  }
  const target = path.join(dest, entry.id);
  await fs.rm(target, { recursive: true, force: true });
  await fs.mkdir(dest, { recursive: true });
  await fs.cp(dir, target, { recursive: true });
  staged.push(entry.id);
  console.error(`staged ${entry.id} ${entry.version} from ${entry.source.url}`);
}
console.log(staged.join("\n"));
// Fail the step only when nothing could be staged, so a preview of the
// plugins that did stage still gets built.
if (failed > 0 && staged.length === 0) {
  process.exit(1);
}
