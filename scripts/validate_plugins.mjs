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
import { pathToFileURL } from "node:url";
import fs from "node:fs/promises";
import path from "node:path";

import { loadRegistryEntries, root } from "./registry.mjs";

const errors = [];

// Changes to any of these re-validate every plugin, since they can change how
// every plugin is checked.
const TOOLING_PATHS = [
  "scripts/",
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

function requireString(object, field, label) {
  if (typeof object[field] !== "string" || object[field].trim() === "") {
    addError(`${label} must define a non-empty string "${field}".`);
    return false;
  }
  return true;
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

async function validateLocalPlugin(registryEntry, manifestPath, label) {
  const manifest = await readJson(manifestPath, `${label} manifest`);
  if (!isPlainObject(manifest)) {
    addError(`${label} manifest must be a JSON object.`);
    return;
  }

  for (const field of ["id", "name", "version", "entry"]) {
    requireString(manifest, field, `${label} manifest`);
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

  const pluginDir = path.dirname(manifestPath);
  const entryPath = resolveContainedPath(
    pluginDir,
    manifest.entry,
    `${label} entry`,
  );
  if (!entryPath || !(await fileExists(entryPath, `${label} entry`))) {
    return;
  }

  if (manifest.style !== undefined) {
    const stylePath = resolveContainedPath(
      pluginDir,
      manifest.style,
      `${label} style`,
    );
    if (stylePath) {
      await fileExists(stylePath, `${label} style`);
    }
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
  if (args.changedSince === undefined || args.changedSince === "") {
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
 * @param {string | null} pluginDir The entry's `plugins/<dir>` folder, if local.
 * @param {string[] | null} changedFiles Changed paths, or null for "all".
 * @returns {boolean}
 */
function isSelected(file, pluginDir, changedFiles) {
  if (changedFiles === null) {
    return true;
  }
  return changedFiles.some(
    (changed) =>
      changed === file ||
      (pluginDir !== null && changed.startsWith(`${pluginDir}/`)),
  );
}

/**
 * Report folders under `plugins/` that no registry entry points at.
 *
 * @param {Set<string>} referencedDirs `plugins/<dir>` folders in use.
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
  const referencedDirs = new Set();
  let imported = 0;

  for (const { file, entry } of loaded.entries) {
    const label = file;
    if (!isPlainObject(entry)) {
      addError(`${label} must be a JSON object.`);
      continue;
    }

    for (const field of ["id", "name", "version", "manifestUrl"]) {
      requireString(entry, field, label);
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

    if (
      typeof entry.homepage === "string" &&
      !/^https?:\/\//.test(entry.homepage)
    ) {
      addError(`${label} homepage must use http(s): ${entry.homepage}`);
    }

    if (
      entry.categories !== undefined &&
      (!Array.isArray(entry.categories) ||
        !entry.categories.every(
          (category) => typeof category === "string" && category.trim() !== "",
        ))
    ) {
      addError(`${label} categories must contain only non-empty strings.`);
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
    const [top, dir] = path.relative(root, manifestPath).split(path.sep);
    const pluginDir = top === "plugins" && dir ? `plugins/${dir}` : null;
    if (pluginDir) {
      referencedDirs.add(pluginDir);
    }

    if (!(await fileExists(manifestPath, `${label} manifest`))) {
      continue;
    }
    if (!isSelected(file, pluginDir, changedFiles)) {
      continue;
    }
    imported += 1;
    await validateLocalPlugin(entry, manifestPath, label);
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
