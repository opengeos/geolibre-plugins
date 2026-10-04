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

import { loadRegistryEntries, root } from "./registry.mjs";

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

// Changes to any of these re-validate every plugin, since they can change how
// every plugin is checked.
const TOOLING_PATHS = [
  "scripts/",
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
    return null;
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
  if (manifest === null) {
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
