#!/usr/bin/env node

// Whitespace-minifies the committed plugin bundles.
//
// Plugin `entry` files are build output that contributors copy in from their
// own plugin build, and most of those builds mangle identifiers but leave the
// whitespace in. That costs nothing at runtime but makes the bundles enormous
// in review and in git history -- one 3.5 MB flowmap.gl bundle landed as a
// 92,381-line diff. Stripping the whitespace (and nothing else) takes that to
// ~2,500 lines with no change to what the code does.
//
//   node scripts/minify_bundles.mjs            # check; exit 1 if anything is unminified
//   node scripts/minify_bundles.mjs --fix      # rewrite the bundles in place
//
// Only `minifyWhitespace` is enabled: no identifier mangling, no syntax
// rewriting, no tree shaking, no down-levelling. Legal comments (`/*! */`,
// `@license`, `@preserve`) are kept inline so the bundled dependencies' license
// headers survive.

import esbuild from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pluginsDir = path.join(root, "plugins");

// Hand-written sources that are meant to be read, not shipped small.
// `plugins/sample/index.js` is the copy-ready template that docs/develop.md and
// the README point contributors at; its comments are the point of the file.
const SKIP = new Set(["plugins/sample/index.js"]);

// esbuild's first pass over an already-pretty-printed bundle is not quite its
// own fixed point (it re-flows a few long lines), so minifying twice can differ
// from minifying once. Iterate to the fixed point instead, or the check would
// flag files that --fix had just written.
const MAX_PASSES = 5;

const TRANSFORM_OPTIONS = {
  loader: "js",
  format: "esm",
  minifyWhitespace: true,
  // Default is "ascii", which escapes non-ASCII as \uXXXX and would inflate
  // bundles that carry unicode strings. ES modules are always decoded as UTF-8.
  charset: "utf8",
};

async function collectBundles(dir) {
  const found = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...(await collectBundles(absolute)));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      found.push(absolute);
    }
  }
  return found;
}

async function minifyToFixedPoint(code, label) {
  let current = code;
  for (let pass = 0; pass < MAX_PASSES; pass += 1) {
    const result = await esbuild.transform(current, TRANSFORM_OPTIONS);
    if (result.code === current) {
      return current;
    }
    current = result.code;
  }
  throw new Error(
    `${label} did not converge after ${MAX_PASSES} minification passes.`,
  );
}

function formatBytes(bytes) {
  const mb = bytes / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(2)} MB` : `${Math.round(bytes / 1024)} KB`;
}

function countLines(text) {
  return text.split("\n").length;
}

async function main() {
  const fix = process.argv.includes("--fix");

  let bundles;
  try {
    bundles = await collectBundles(pluginsDir);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log("No plugins/ directory; nothing to minify.");
      return;
    }
    throw error;
  }

  const unminified = [];
  let failed = 0;
  for (const absolute of bundles.sort()) {
    const relative = path.relative(root, absolute);
    if (SKIP.has(relative)) {
      continue;
    }

    const original = await fs.readFile(absolute, "utf8");
    let minified;
    try {
      minified = await minifyToFixedPoint(original, relative);
    } catch (error) {
      console.error(`${relative} could not be minified: ${error.message}`);
      failed += 1;
      continue;
    }

    if (minified === original) {
      continue;
    }

    unminified.push(relative);
    console.log(
      `${fix ? "minified" : "unminified"} ${relative}\n` +
        `    ${countLines(original)} lines / ${formatBytes(original.length)}` +
        ` -> ${countLines(minified)} lines / ${formatBytes(minified.length)}`,
    );

    if (fix) {
      await fs.writeFile(absolute, minified);
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} plugin bundle(s) could not be parsed.`);
    process.exitCode = 1;
    return;
  }

  if (unminified.length === 0) {
    console.log(
      `All ${bundles.length} plugin bundles are whitespace-minified.`,
    );
    return;
  }

  if (fix) {
    console.log(`\nMinified ${unminified.length} plugin bundle(s).`);
    return;
  }

  console.error(
    `\n${unminified.length} plugin bundle(s) are not whitespace-minified.` +
      `\nFix with: node scripts/minify_bundles.mjs --fix`,
  );
  process.exitCode = 1;
}

await main();
