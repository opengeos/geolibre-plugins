#!/usr/bin/env node

// Validate the per-plugin registry entries in `registry/<id>.json` and the
// plugins they point at.
//
// Cheap metadata checks (required fields, duplicate ids, manifest paths) always
// run on every entry. Importing a plugin's entry bundle is the expensive part,
// so `--changed-since <git-ref>` limits it to the plugins whose registry entry
// or plugin folder changed since that ref. Changes to the validation tooling
// itself still import every plugin.
//
//   node scripts/validate_plugins.mjs                        # every plugin
//   node scripts/validate_plugins.mjs --changed-since main   # only changed

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import fs from "node:fs/promises";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020.js";

import { loadBlocklist, loadRegistryEntries, root } from "./registry.mjs";

import {
  hasSource,
  listFiles,
  readableSourceDir,
  sourceFolder,
  unpackSourceBundle,
} from "./source-bundles.mjs";

const errors = [];

// Field-level rules live in schemas/, which editors can also use. This script
// adds the checks a schema cannot express: file names, duplicates, paths on
// disk, and what the entry bundle actually exports.
// `verbose` exposes the failing schema, whose `$comment` holds a readable
// version of a `pattern` or `not` rule.
const ajv = new Ajv2020({ allErrors: true, verbose: true });
const loadSchema = (name) =>
  JSON.parse(readFileSync(path.join(root, "schemas", name), "utf8"));
const validateEntrySchema = ajv.compile(
  loadSchema("registry-entry.schema.json"),
);
const validateManifestSchema = ajv.compile(
  loadSchema("plugin-manifest.schema.json"),
);
const validateBlocklistSchema = ajv.compile(
  loadSchema("blocklist.schema.json"),
);

// Changes to any of these re-validate every plugin, since they can change how
// every plugin is checked.
const TOOLING_PATHS = [
  "scripts/",
  "blocklist.json",
  "schemas/",
  "package.json",
  "package-lock.json",
  ".github/workflows/test-plugins.yml",
];

function addError(message) {
  errors.push(message);
}

async function readJson(filePath, label) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    addError(`${label} is not valid JSON: ${error.message}`);
    // Not null: a file holding the JSON literal `null` must reach the schema.
    return undefined;
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Run a compiled schema and report each failure against `label`.
 *
 * @param {import("ajv").ValidateFunction} validate Compiled schema.
 * @param {unknown} data The JSON value to check.
 * @param {string} label Prefix for error messages.
 * @returns {boolean} Whether the value matched the schema.
 */
function checkSchema(validate, data, label) {
  if (validate(data)) {
    return true;
  }
  // A `oneOf` with a hint already explains what is allowed, so drop the
  // per-branch failures reported at the same path.
  const hintedOneOfPaths = new Set(
    validate.errors
      .filter((e) => e.keyword === "oneOf" && e.parentSchema?.$comment)
      .map((e) => e.instancePath),
  );
  for (const error of validate.errors) {
    if (error.keyword !== "oneOf" && hintedOneOfPaths.has(error.instancePath)) {
      continue;
    }
    const where = error.instancePath ? ` ${error.instancePath}` : "";
    // `$comment` describes a `pattern`, `oneOf` or `not` rule, so only use it
    // for those. A `not` rule keeps its hint on its own subschema; the others
    // keep it on the schema that holds the rule.
    const hint =
      error.keyword === "not"
        ? error.schema?.$comment
        : error.keyword === "pattern" || error.keyword === "oneOf"
          ? error.parentSchema?.$comment
          : undefined;
    let message = error.message;
    if (typeof hint === "string") {
      message = hint;
    } else if (error.keyword === "additionalProperties") {
      message = `has an unknown field "${error.params.additionalProperty}"`;
    } else if (error.keyword === "enum") {
      message = `must be one of: ${error.params.allowedValues.join(", ")}`;
    }
    addError(`${label}${where} ${message}`);
  }
  return false;
}

function resolveContainedPath(baseDir, relativePath, label) {
  if (typeof relativePath !== "string" || relativePath.trim() === "") {
    addError(`${label} must be a non-empty string.`);
    return null;
  }

  if (path.isAbsolute(relativePath)) {
    addError(`${label} must be relative, not absolute: ${relativePath}`);
    return null;
  }

  const resolved = path.resolve(baseDir, relativePath);
  const relative = path.relative(baseDir, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    addError(
      `${label} must stay inside ${path.relative(root, baseDir)}: ${relativePath}`,
    );
    return null;
  }

  return resolved;
}

async function fileExists(filePath, label) {
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      addError(`${label} is not a file: ${path.relative(root, filePath)}`);
      return false;
    }
    return true;
  } catch {
    addError(`${label} does not exist: ${path.relative(root, filePath)}`);
    return false;
  }
}

/**
 * Check a local plugin's manifest and files, and optionally import its entry.
 *
 * @param {object} registryEntry The plugin's registry entry.
 * @param {string} manifestPath Absolute path to its `plugin.json`.
 * @param {string} label Prefix for error messages.
 * @param {boolean} importBundle Whether to import (execute) the entry bundle.
 */
async function validateLocalPlugin(
  registryEntry,
  manifestPath,
  label,
  importBundle,
) {
  const manifest = await readJson(manifestPath, `${label} manifest`);
  if (manifest === undefined) {
    return;
  }
  // Keep going after a schema failure so the checks below report their own
  // problems in the same run; only importing needs a valid manifest.
  const manifestValid = checkSchema(
    validateManifestSchema,
    manifest,
    `${label} manifest`,
  );
  if (!isPlainObject(manifest)) {
    return;
  }

  for (const field of ["id", "name", "version"]) {
    if (
      typeof registryEntry[field] === "string" &&
      typeof manifest[field] === "string" &&
      registryEntry[field] !== manifest[field]
    ) {
      addError(
        `${label} ${field} mismatch: registry has "${registryEntry[field]}", manifest has "${manifest[field]}".`,
      );
    }
  }

  // The schema has already reported a missing or non-string entry or style.
  if (typeof manifest.entry !== "string") {
    return;
  }
  const pluginDir = path.dirname(manifestPath);
  const entryPath = resolveContainedPath(
    pluginDir,
    manifest.entry,
    `${label} entry`,
  );
  if (!entryPath || !(await fileExists(entryPath, `${label} entry`))) {
    return;
  }

  if (typeof manifest.style === "string") {
    const stylePath = resolveContainedPath(
      pluginDir,
      manifest.style,
      `${label} style`,
    );
    if (stylePath) {
      await fileExists(stylePath, `${label} style`);
    }
  }

  if (!importBundle || !manifestValid) {
    return;
  }

  let moduleExports;
  try {
    moduleExports = await import(pathToFileURL(entryPath).href);
  } catch (error) {
    addError(`${label} entry could not be imported: ${error.message}`);
    return;
  }

  const plugin = moduleExports.plugin ?? moduleExports.default;
  if (!isPlainObject(plugin)) {
    addError(
      `${label} entry must export a plugin object as named "plugin" or default.`,
    );
    return;
  }

  for (const field of ["id", "name", "version"]) {
    if (plugin[field] !== manifest[field]) {
      addError(
        `${label} exported plugin ${field} mismatch: plugin has "${plugin[field]}", manifest has "${manifest[field]}".`,
      );
    }
  }

  if (typeof plugin.activate !== "function") {
    addError(`${label} exported plugin must define an activate(app) function.`);
  }
}

function parseArgs(argv) {
  const args = { changedSince: null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--changed-since") {
      args.changedSince = argv[i + 1];
      i += 1;
    } else if (argv[i].startsWith("--changed-since=")) {
      args.changedSince = argv[i].slice("--changed-since=".length);
    } else {
      console.error(`Unknown argument: ${argv[i]}`);
      process.exit(2);
    }
  }
  if (
    args.changedSince === undefined ||
    args.changedSince === "" ||
    args.changedSince?.startsWith("-")
  ) {
    console.error("--changed-since needs a git ref.");
    process.exit(2);
  }
  return args;
}

/**
 * List the files changed between the merge base of `ref` and HEAD.
 *
 * @param {string} ref Git ref to diff against.
 * @returns {string[] | null} Repo-relative paths, or null when git fails.
 */
function changedFilesSince(ref) {
  try {
    const output = execFileSync(
      "git",
      ["diff", "--name-only", "--no-renames", `${ref}...HEAD`],
      { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    return output.split("\n").filter(Boolean);
  } catch (error) {
    console.warn(
      `Could not diff against ${ref} (${error.message.trim()}); validating every plugin.`,
    );
    return null;
  }
}

/**
 * Read a JSON file as it was at a git ref.
 *
 * @param {string} ref Git ref.
 * @param {string} file Repo-relative path.
 * @returns {object | null} The parsed file, or null if it didn't exist there.
 */
function readJsonAtRef(ref, file) {
  try {
    return JSON.parse(
      execFileSync("git", ["show", `${ref}:${file}`], {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }),
    );
  } catch {
    return null;
  }
}

/**
 * Decide whether a registry entry's bundle should be imported.
 *
 * @param {string} file The entry's `registry/<id>.json` path.
 * @param {string} pluginDir The entry's `plugins/<dir>` folder.
 * @param {string[] | null} changedFiles Changed paths, or null for "all".
 * @returns {boolean}
 */
function isSelected(file, pluginDir, changedFiles) {
  if (changedFiles === null) {
    return true;
  }
  return changedFiles.some(
    (changed) => changed === file || changed.startsWith(`${pluginDir}/`),
  );
}

/**
 * Check that a folder of readable source still matches the release zip.
 *
 * @param {object} entry The registry entry, with a `source`.
 * @param {string} label Prefix for error messages.
 * @param {string} sourceDir Repo-relative folder holding the source.
 */
async function checkReadableSource(entry, label, sourceDir) {
  let unpacked;
  try {
    unpacked = await unpackSourceBundle(entry);
  } catch (error) {
    addError(`${label} source: ${error.message}`);
    return;
  }
  let local;
  try {
    local = await listFiles(path.join(root, sourceDir));
  } catch (error) {
    addError(`${label}: cannot read ${sourceDir}/: ${error.message}`);
    return;
  }
  const differing = [...new Set([...local, ...unpacked.files])].filter(
    (file) =>
      !local.includes(file) ||
      !unpacked.files.includes(file) ||
      !readFileSync(path.join(root, sourceDir, file)).equals(
        readFileSync(path.join(unpacked.dir, file)),
      ),
  );
  if (differing.length > 0) {
    addError(
      `${label}: ${sourceDir}/ no longer matches its release zip (${differing.join(", ")}). Rebuild the zip with node scripts/make_migration_zip.mjs ${sourceDir}, publish it, and bump the version.`,
    );
  }
}

/**
 * Check an entry hosted from a release zip.
 *
 * Its files are served from R2 at `plugins/<id>/`, so that path must not also
 * exist here. Downloading the zip is the expensive part, so like importing a
 * committed bundle it only happens when the entry changed (or for a full run).
 *
 * @param {object} entry The registry entry, with a `source`.
 * @param {string} file Its `registry/<id>.json` path.
 * @param {string} label Prefix for error messages.
 * @param {string} pluginDir The `plugins/<dir>` folder its manifestUrl names.
 * @param {string[] | null} changedFiles Changed paths, or null for "all".
 * @param {string | null} baseRef The --changed-since ref. Without one (a
 *   full run) the version-reuse check is skipped; the deploy's write-once
 *   marker still refuses a reused version.
 */
async function validateSourceEntry(
  entry,
  file,
  label,
  pluginDir,
  changedFiles,
  baseRef,
) {
  // Published versions never change, and the deploy refuses a different zip
  // for a version it already published. Catch that here, in the pull request,
  // by comparing with the entry on the base branch.
  const base = baseRef ? readJsonAtRef(baseRef, file) : null;
  if (
    base?.source?.sha256 &&
    base.version === entry.version &&
    base.source.sha256 !== entry.source.sha256
  ) {
    addError(
      `${label} changes source.sha256 but keeps version ${entry.version}; published versions never change, so bump the version.`,
    );
  }
  // A release-zip plugin whose readable source is kept here (the sample in
  // examples/sample/) must still match its release zip, file for file.
  // Comparing contents, not a rebuilt zip's hash, doesn't depend on the zip
  // library's compressor output.
  const sourceDir = readableSourceDir(entry);
  if (sourceDir) {
    await checkReadableSource(entry, label, sourceDir);
  }

  // plugins/<id>/, or a migrated plugin's original folder (sourceFolder).
  const expected = `plugins/${sourceFolder(entry)}/plugin.json`;
  if (entry.manifestUrl !== expected) {
    addError(`${label} has a source, so manifestUrl must be ${expected}.`);
  }
  try {
    await fs.stat(path.join(root, pluginDir));
    addError(
      `${label} has a source, so its code is served from the release zip; remove ${pluginDir}/ from this repository.`,
    );
  } catch {
    // Expected: nothing is committed for a source entry.
  }
  if (!isSelected(file, pluginDir, changedFiles)) {
    return;
  }
  let unpacked;
  try {
    unpacked = await unpackSourceBundle(entry);
  } catch (error) {
    addError(`${label} source: ${error.message}`);
    return;
  }
  checkScreenshots(entry, unpacked, label);
  await validateLocalPlugin(
    entry,
    path.join(unpacked.dir, "plugin.json"),
    `${label} (release zip)`,
    true,
  );
}

// Screenshots are shown on the catalog, so keep each one small.
const MAX_SCREENSHOT_BYTES = 1024 * 1024;
// The leading bytes of each allowed image format, so a file is what its
// extension says (the mirror serves it with that format's Content-Type).
const IMAGE_SIGNATURES = {
  png: (bytes) =>
    bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")),
  jpg: (bytes) => bytes.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex")),
  jpeg: (bytes) => bytes.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex")),
  webp: (bytes) =>
    bytes.subarray(0, 4).toString("latin1") === "RIFF" &&
    bytes.subarray(8, 12).toString("latin1") === "WEBP",
};

/**
 * Check that each screenshot an entry lists is an image in its release zip.
 *
 * @param {object} entry The registry entry, with a `source`.
 * @param {{ dir: string, files: string[] }} unpacked The unpacked zip.
 * @param {string} label Prefix for error messages.
 */
function checkScreenshots(entry, unpacked, label) {
  for (const { path: shot } of entry.screenshots ?? []) {
    if (!unpacked.files.includes(shot)) {
      addError(
        `${label} screenshot ${shot} is not in the release zip (paths are relative to its plugin.json).`,
      );
      continue;
    }
    const bytes = readFileSync(path.join(unpacked.dir, shot));
    if (bytes.length > MAX_SCREENSHOT_BYTES) {
      addError(
        `${label} screenshot ${shot} is ${bytes.length} bytes; the limit is ${MAX_SCREENSHOT_BYTES}.`,
      );
    }
    const extension = shot.split(".").pop().toLowerCase();
    if (!IMAGE_SIGNATURES[extension]?.(bytes)) {
      addError(
        `${label} screenshot ${shot} is not a valid .${extension} image.`,
      );
    }
  }
}

/**
 * Check `blocklist.json`: its schema, no duplicate entries, and no fully
 * blocked plugin still listed in the registry (a blocked bundle hash still
 * being served is checked by build_registry.mjs, which knows every hash).
 *
 * @param {Set<string>} registryIds Ids listed in the registry.
 */
async function checkBlocklist(registryIds) {
  let blocklist;
  try {
    blocklist = await loadBlocklist();
  } catch (error) {
    addError(`blocklist.json cannot be read: ${error.message}`);
    return;
  }
  if (!checkSchema(validateBlocklistSchema, blocklist, "blocklist.json")) {
    return;
  }
  const seen = new Set();
  const wholeBlocks = new Set(
    blocklist.blocked
      .filter((entry) => !entry.bundleSha256)
      .map((entry) => entry.id),
  );
  for (const [index, entry] of blocklist.blocked.entries()) {
    if (entry.bundleSha256 && wholeBlocks.has(entry.id)) {
      addError(
        `blocklist.json blocked[${index}] blocks one bundle of ${entry.id}, which is already blocked outright; remove it.`,
      );
    }
    const key = `${entry.id} ${entry.bundleSha256 ?? "*"}`;
    if (seen.has(key)) {
      addError(`blocklist.json blocked[${index}] duplicates an earlier entry.`);
    }
    seen.add(key);
    if (entry.bundleSha256 === undefined && registryIds.has(entry.id)) {
      addError(
        `blocklist.json blocks every version of ${entry.id}, so remove registry/${entry.id}.json too.`,
      );
    }
  }
}

/**
 * Report folders under `plugins/` that no registry entry points at.
 *
 * @param {Map<string, string>} referencedDirs `plugins/<dir>` folders in use.
 */
async function checkOrphanPluginDirs(referencedDirs) {
  let dirents;
  try {
    dirents = await fs.readdir(path.join(root, "plugins"), {
      withFileTypes: true,
    });
  } catch {
    return;
  }
  for (const dirent of dirents) {
    const dir = path.posix.join("plugins", dirent.name);
    if (dirent.isDirectory() && !referencedDirs.has(dir)) {
      addError(
        `${dir}/ is not referenced by any registry/*.json manifestUrl; add a registry entry or remove the folder.`,
      );
    }
  }
}

async function main() {
  const { changedSince } = parseArgs(process.argv.slice(2));
  let changedFiles = null;
  if (changedSince) {
    changedFiles = changedFilesSince(changedSince);
    if (
      changedFiles?.some((file) =>
        TOOLING_PATHS.some((tooling) =>
          tooling.endsWith("/") ? file.startsWith(tooling) : file === tooling,
        ),
      )
    ) {
      console.log("Validation tooling changed; validating every plugin.");
      changedFiles = null;
    }
  }

  const loaded = await loadRegistryEntries();
  loaded.errors.forEach(addError);

  const seenIds = new Set();
  const seenManifestUrls = new Set();
  // `plugins/<dir>` -> the registry file that points at it.
  const referencedDirs = new Map();
  let imported = 0;

  for (const { file, entry } of loaded.entries) {
    const label = file;
    checkSchema(validateEntrySchema, entry, label);
    if (!isPlainObject(entry)) {
      continue;
    }

    if (typeof entry.id === "string") {
      if (path.posix.basename(file) !== `${entry.id}.json`) {
        addError(`${label} must be named registry/${entry.id}.json.`);
      }
      if (seenIds.has(entry.id)) {
        addError(`Duplicate plugin id in registry: ${entry.id}`);
      }
      seenIds.add(entry.id);
    }

    if (typeof entry.manifestUrl !== "string") {
      continue;
    }

    if (seenManifestUrls.has(entry.manifestUrl)) {
      addError(`Duplicate manifestUrl in registry: ${entry.manifestUrl}`);
    }
    seenManifestUrls.add(entry.manifestUrl);

    if (/^https:\/\//.test(entry.manifestUrl)) {
      continue;
    }
    if (/^[a-z]+:\/\//i.test(entry.manifestUrl)) {
      addError(
        `${label} manifestUrl must be relative or HTTPS: ${entry.manifestUrl}`,
      );
      continue;
    }

    // A relative manifestUrl resolves against the published
    // plugin-registry.json, which sits at the repository root.
    const manifestPath = resolveContainedPath(
      root,
      entry.manifestUrl,
      `${label} manifestUrl`,
    );
    if (!manifestPath) {
      continue;
    }
    // Local plugins live in their own `plugins/<dir>/` folder, which is also
    // how --changed-since maps changed files back to a registry entry.
    const [top, dir, ...rest] = path
      .relative(root, manifestPath)
      .split(path.sep);
    if (top !== "plugins" || !dir || rest.length === 0) {
      addError(
        `${label} manifestUrl must point inside a plugins/<dir>/ folder: ${entry.manifestUrl}`,
      );
      continue;
    }
    const pluginDir = `plugins/${dir}`;
    if (referencedDirs.has(pluginDir)) {
      addError(
        `${label} shares ${pluginDir}/ with ${referencedDirs.get(pluginDir)}; each plugin needs its own folder.`,
      );
    }
    referencedDirs.set(pluginDir, file);

    if (entry.screenshots && !hasSource(entry)) {
      addError(
        `${label} lists screenshots, which are served from its release zip, so it needs a source.`,
      );
    }
    if (hasSource(entry)) {
      await validateSourceEntry(
        entry,
        file,
        label,
        pluginDir,
        changedFiles,
        changedSince,
      );
      if (isSelected(file, pluginDir, changedFiles)) {
        imported += 1;
      }
      continue;
    }

    if (!(await fileExists(manifestPath, `${label} manifest`))) {
      continue;
    }
    const importBundle = isSelected(file, pluginDir, changedFiles);
    if (importBundle) {
      imported += 1;
    }
    await validateLocalPlugin(entry, manifestPath, label, importBundle);
  }

  await checkOrphanPluginDirs(referencedDirs);
  await checkBlocklist(seenIds);

  if (errors.length > 0) {
    console.error("Plugin validation failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(
    `Validated ${loaded.entries.length} registry entries; imported ${imported} plugin bundles.`,
  );
}

await main();
