#!/usr/bin/env node

import { fileURLToPath, pathToFileURL } from "node:url";
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = path.join(root, "plugin-registry.json");
const errors = [];

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
    addError(`${label} must stay inside ${path.relative(root, baseDir)}: ${relativePath}`);
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
  const entryPath = resolveContainedPath(pluginDir, manifest.entry, `${label} entry`);
  if (!entryPath || !(await fileExists(entryPath, `${label} entry`))) {
    return;
  }

  if (manifest.style !== undefined) {
    const stylePath = resolveContainedPath(pluginDir, manifest.style, `${label} style`);
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
    addError(`${label} entry must export a plugin object as named "plugin" or default.`);
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

async function main() {
  const registry = await readJson(registryPath, "plugin-registry.json");
  if (!isPlainObject(registry) || !Array.isArray(registry.plugins)) {
    addError('plugin-registry.json must be an object with a "plugins" array.');
  }

  const plugins = Array.isArray(registry?.plugins) ? registry.plugins : [];
  const seenIds = new Set();
  const seenManifestUrls = new Set();

  for (const [index, entry] of plugins.entries()) {
    const label = `plugins[${index}]`;
    if (!isPlainObject(entry)) {
      addError(`${label} must be an object.`);
      continue;
    }

    for (const field of ["id", "name", "version", "manifestUrl"]) {
      requireString(entry, field, label);
    }

    if (typeof entry.id === "string") {
      if (seenIds.has(entry.id)) {
        addError(`Duplicate plugin id in registry: ${entry.id}`);
      }
      seenIds.add(entry.id);
    }

    if (typeof entry.homepage === "string" && !/^https?:\/\//.test(entry.homepage)) {
      addError(`${label} homepage must use http(s): ${entry.homepage}`);
    }

    if (
      entry.categories !== undefined &&
      (!Array.isArray(entry.categories) ||
        !entry.categories.every((category) => typeof category === "string" && category.trim() !== ""))
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
      addError(`${label} manifestUrl must be relative or HTTPS: ${entry.manifestUrl}`);
      continue;
    }

    const manifestPath = resolveContainedPath(root, entry.manifestUrl, `${label} manifestUrl`);
    if (!manifestPath || !(await fileExists(manifestPath, `${label} manifest`))) {
      continue;
    }
    await validateLocalPlugin(entry, manifestPath, `${label} (${entry.id ?? entry.manifestUrl})`);
  }

  if (errors.length > 0) {
    console.error("Plugin validation failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(`Validated ${plugins.length} plugin registry entries.`);
}

await main();
