#!/usr/bin/env node

// Build a release zip from a committed plugin folder, for moving that plugin
// to the release-zip mirror without changing a single served byte. Existing
// installs pin a hash of the exact entry and style bytes, so the zip holds the
// committed files as they are.
//
//   node scripts/make_migration_zip.mjs plugins/sample [out-dir]
//
// The zip is reproducible: files are sorted and stamped with a fixed date, so
// anyone can rebuild it from the same commit and get the same SHA-256. It is
// written to out-dir (default .cache/migration/) as <id>-<version>.zip, and
// its path and SHA-256 are printed.

import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { zipSync } from "fflate";

import { root } from "./registry.mjs";

// Zip timestamps are stored as local date and time, so build the date from
// local fields: it then encodes the same way in every time zone.
const FIXED_DATE = new Date(1980, 0, 2);

/**
 * List every file under a folder, relative to it, sorted.
 *
 * @param {string} dir Absolute folder path.
 * @param {string} [prefix] Path prefix for recursion.
 * @returns {Promise<string[]>}
 */
async function listFiles(dir, prefix = "") {
  const files = [];
  for (const dirent of await fs.readdir(path.join(dir, prefix), {
    withFileTypes: true,
  })) {
    const relative = path.posix.join(prefix, dirent.name);
    if (dirent.isDirectory()) {
      files.push(...(await listFiles(dir, relative)));
    } else if (dirent.isFile()) {
      files.push(relative);
    } else {
      throw new Error(`${relative} is not a regular file`);
    }
  }
  return files.sort();
}

const [folderArg, outArg] = process.argv.slice(2);
if (!folderArg) {
  console.error(
    "Usage: node scripts/make_migration_zip.mjs plugins/<dir> [out-dir]",
  );
  process.exit(2);
}
const folder = path.resolve(root, folderArg);
const manifest = JSON.parse(
  await fs.readFile(path.join(folder, "plugin.json"), "utf8"),
);

const entries = {};
for (const file of await listFiles(folder)) {
  entries[file] = [
    new Uint8Array(await fs.readFile(path.join(folder, file))),
    { mtime: FIXED_DATE, level: 9 },
  ];
}
const zip = zipSync(entries);

const outDir = path.resolve(root, outArg ?? ".cache/migration");
await fs.mkdir(outDir, { recursive: true });
const out = path.join(outDir, `${manifest.id}-${manifest.version}.zip`);
await fs.writeFile(out, zip);
const sha256 = createHash("sha256").update(zip).digest("hex");
console.log(
  JSON.stringify({ file: path.relative(root, out), sha256 }, null, 2),
);
