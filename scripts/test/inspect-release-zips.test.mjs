// Tests for scripts/inspect_release_zips.mjs, which the Claude review runs on
// pull requests: everything it reads is untrusted.
//
//   npm run test:scripts
//
// The script is a CLI, so each test runs it against a temporary pull-request
// checkout. Zips are seeded into the download cache, so nothing is downloaded.

import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { zipSync } from "fflate";

import { cacheDir } from "../source-bundles.mjs";

const script = fileURLToPath(
  new URL("../inspect_release_zips.mjs", import.meta.url),
);
const text = (value) => new TextEncoder().encode(value);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/**
 * Zip files given as { name: string | Uint8Array }.
 *
 * @param {Record<string, string | Uint8Array>} files Zip entries.
 * @returns {Uint8Array} The zip bytes.
 */
function makeZip(files) {
  return zipSync(
    Object.fromEntries(
      Object.entries(files).map(([name, data]) => [
        name,
        typeof data === "string" ? text(data) : data,
      ]),
    ),
  );
}

describe("inspect_release_zips.mjs", () => {
  let checkout;
  const seeded = [];

  /**
   * Seed a zip into the cache and write a registry entry pointing at it.
   *
   * @param {string} id The plugin id, also the file name.
   * @param {Record<string, string | Uint8Array>} files The zip's files.
   * @param {object} [overrides] Fields to change in the entry.
   */
  async function addPlugin(id, files, overrides = {}) {
    const zip = makeZip(files);
    const hash = sha256(zip);
    await fs.mkdir(cacheDir, { recursive: true });
    await fs.writeFile(path.join(cacheDir, `${hash}.zip`), zip);
    seeded.push(hash);
    const entry = {
      id,
      name: id,
      version: "1.0.0",
      manifestUrl: `plugins/${id}/plugin.json`,
      source: { url: `https://example.invalid/${id}.zip`, sha256: hash },
      ...overrides,
    };
    await fs.writeFile(
      path.join(checkout, "registry", `${id}.json`),
      JSON.stringify(entry),
    );
  }

  /**
   * Run the inspector on registry files and read its JSON report.
   *
   * @param {string[]} files `registry/<id>.json` paths.
   * @returns {Promise<{ stdout: string, report: object[] | null }>}
   */
  async function inspect(files) {
    const dest = path.join(checkout, ".plugin-review");
    await fs.rm(dest, { recursive: true, force: true });
    const { stdout } = await promisify(execFile)("node", [
      script,
      checkout,
      dest,
      ...files,
    ]);
    let report = null;
    try {
      report = JSON.parse(
        await fs.readFile(path.join(dest, "report.json"), "utf8"),
      );
    } catch {
      // No report: nothing was inspected.
    }
    return { stdout, report };
  }

  before(async () => {
    checkout = await fs.mkdtemp(path.join(os.tmpdir(), "inspect-zips-"));
    await fs.mkdir(path.join(checkout, "registry"));
  });

  after(async () => {
    await fs.rm(checkout, { recursive: true, force: true });
    for (const hash of seeded) {
      await fs.rm(path.join(cacheDir, `${hash}.zip`), { force: true });
      await fs.rm(path.join(cacheDir, hash), { recursive: true, force: true });
    }
  });

  it("reports sizes, pattern hits and hosts, scanning every file", async () => {
    await addPlugin("good", {
      "good/plugin.json": JSON.stringify({ id: "good", version: "1.0.0" }),
      "good/index.js": 'fetch("https://api.example.com/v1");',
      // A script under an odd extension, and one hidden behind a NUL byte.
      "good/payload.dat": 'eval(atob("eA=="));',
      "good/hidden.js": '/*\0*/ new WebSocket("wss://203.0.113.5:9/s")',
    });
    const { stdout, report } = await inspect(["registry/good.json"]);
    assert.match(stdout, /\| good \| 1\.0\.0 \| .* \| 4 \| verified \|/);
    const [record] = report;
    assert.equal(record.manifestId, "good");
    assert.deepEqual(
      record.files.map((file) => file.path),
      ["hidden.js", "index.js", "payload.dat", "plugin.json"],
    );
    const byPath = Object.fromEntries(record.files.map((f) => [f.path, f]));
    assert.ok(byPath["payload.dat"].hits["dynamic code: eval"]);
    assert.ok(byPath["payload.dat"].hits["obfuscation hints"]);
    assert.equal(byPath["hidden.js"].binary, true);
    assert.ok(byPath["hidden.js"].hits.network);
    assert.deepEqual(record.hosts, ["203.0.113.5", "api.example.com"]);
    const unpacked = path.join(checkout, record.unpackedDir, "index.js");
    assert.match(await fs.readFile(unpacked, "utf8"), /api\.example\.com/);
  });

  it("flags a plugin.json id that differs from the registry", async () => {
    await addPlugin("other", {
      "plugin.json": JSON.stringify({ id: "not-other" }),
    });
    const { stdout, report } = await inspect(["registry/other.json"]);
    assert.equal(report[0].manifestId, "not-other");
    assert.match(stdout, /plugin\.json id mismatch/);
  });

  it("lists entries it could not or would not inspect", async () => {
    await fs.writeFile(path.join(checkout, "registry", "broken.json"), "{");
    await addPlugin("renamed", { "plugin.json": "{}" }, { id: "elsewhere" });
    await addPlugin("badhash", { "plugin.json": "{}" });
    const entry = JSON.parse(
      await fs.readFile(path.join(checkout, "registry", "badhash.json")),
    );
    // The zip is cached under the wrong hash, so verification fails offline.
    await fs.copyFile(
      path.join(cacheDir, `${entry.source.sha256}.zip`),
      path.join(cacheDir, `${"0".repeat(64)}.zip`),
    );
    seeded.push("0".repeat(64));
    entry.source.sha256 = "0".repeat(64);
    await fs.writeFile(
      path.join(checkout, "registry", "badhash.json"),
      JSON.stringify(entry),
    );
    await fs.writeFile(
      path.join(checkout, "registry", "committed.json"),
      JSON.stringify({
        id: "committed",
        manifestUrl: "plugins/committed/plugin.json",
      }),
    );

    const { report } = await inspect([
      "registry/broken.json",
      "registry/renamed.json",
      "registry/badhash.json",
      "registry/committed.json",
      "plugins/x/plugin.json",
      "registry/../../etc/passwd.json",
    ]);
    assert.deepEqual(
      report.map((record) => [
        record.file,
        record.notInspected ?? record.error,
      ]),
      [
        ["registry/broken.json", "not readable as a JSON file"],
        ["registry/renamed.json", "its id does not match the file name"],
        ["registry/badhash.json", report[2].error],
      ],
    );
    assert.match(
      report[2].error,
      /has SHA-256 [0-9a-f]{64}, but the registry entry lists 0{64}/,
    );
  });

  it("inspects at most 20 release zips per pull request", async () => {
    const files = [];
    for (let i = 0; i < 21; i += 1) {
      await addPlugin(`many${i}`, { "plugin.json": "{}" });
      files.push(`registry/many${i}.json`);
    }
    const { report } = await inspect(files);
    assert.equal(report.filter((record) => !record.notInspected).length, 20);
    assert.match(report[20].notInspected, /over the limit of 20/);
  });

  it("keeps untrusted text from breaking out of the Markdown", async () => {
    await addPlugin(
      "sneaky",
      { "plugin.json": JSON.stringify({ id: "sneaky" }), "a|b`c.js": "" },
      { version: "1.0.0 | injected `code`\n::stop-commands::x" },
    );
    const { stdout } = await inspect(["registry/sneaky.json"]);
    const row = stdout.split("\n").find((line) => line.startsWith("| sneaky"));
    // The version cell keeps the table's seven column separators.
    assert.equal(row.split("|").length, 8, row);
    assert.doesNotMatch(stdout, /\n::stop-commands::/);
    assert.doesNotMatch(row, /`/);
  });

  it("writes no report when no changed entry has a release zip", async () => {
    const { stdout, report } = await inspect(["registry/committed.json"]);
    assert.equal(report, null);
    assert.equal(stdout, "");
  });
});
