// Unit tests for scripts/source-bundles.mjs, which downloads and unpacks
// release zips from pull requests: untrusted input.
//
//   npm run test:scripts
//
// No network: a zip is seeded into the download cache under its SHA-256, which
// unpackSourceBundle reads before downloading, and fetch is stubbed for the
// download rules.

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, it } from "node:test";

import { zipSync } from "fflate";

import {
  cacheDir,
  hasSource,
  listFiles,
  unpackSourceBundle,
  zipFolder,
} from "../source-bundles.mjs";

const MANIFEST = JSON.stringify({ id: "demo", version: "1.0.0" });
const text = (value) => new TextEncoder().encode(value);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

// Cache entries this file created, removed after each test.
const seeded = new Set();
const realFetch = globalThis.fetch;

afterEach(async () => {
  globalThis.fetch = realFetch;
  for (const hash of seeded) {
    await fs.rm(path.join(cacheDir, `${hash}.zip`), { force: true });
    await fs.rm(path.join(cacheDir, hash), { recursive: true, force: true });
  }
  seeded.clear();
});

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

/**
 * Put a zip in the download cache and return a registry entry for it.
 *
 * @param {Uint8Array} zip The zip bytes.
 * @param {string} [hash] The SHA-256 the entry claims (defaults to the real one).
 * @returns {Promise<{ source: { url: string, sha256: string } }>}
 */
async function seed(zip, hash = sha256(zip)) {
  await fs.mkdir(cacheDir, { recursive: true });
  await fs.writeFile(path.join(cacheDir, `${hash}.zip`), zip);
  seeded.add(hash);
  return { source: { url: "https://example.invalid/demo.zip", sha256: hash } };
}

/**
 * Unpack a zip seeded from these files and read each unpacked file back.
 *
 * @param {Record<string, string | Uint8Array>} files Zip entries.
 * @returns {Promise<Record<string, string>>} Unpacked path to its text.
 */
async function unpack(files) {
  const { dir, files: names } = await unpackSourceBundle(
    await seed(makeZip(files)),
  );
  const contents = {};
  for (const name of names) {
    contents[name] = await fs.readFile(path.join(dir, name), "utf8");
  }
  return contents;
}

describe("hasSource", () => {
  it("accepts a source with an https URL string and a SHA-256", () => {
    assert.equal(
      hasSource({
        source: { url: "https://x.test/a.zip", sha256: "a".repeat(64) },
      }),
      true,
    );
  });

  it("rejects missing or malformed sources, since the hash names cache paths", () => {
    for (const entry of [
      null,
      "string",
      {},
      { source: { url: "https://x.test/a.zip" } },
      { source: { url: "https://x.test/a.zip", sha256: "A".repeat(64) } },
      {
        source: { url: "https://x.test/a.zip", sha256: "../".repeat(21) + "a" },
      },
      { source: { url: 1, sha256: "a".repeat(64) } },
    ]) {
      assert.equal(hasSource(entry), false, JSON.stringify(entry));
    }
  });
});

describe("unpackSourceBundle layout", () => {
  it("unpacks a zip with plugin.json at the root", async () => {
    assert.deepEqual(
      await unpack({ "plugin.json": MANIFEST, "index.js": "export {}" }),
      { "index.js": "export {}", "plugin.json": MANIFEST },
    );
  });

  it("unpacks only the shallowest folder holding plugin.json", async () => {
    assert.deepEqual(
      await unpack({
        "demo/plugin.json": MANIFEST,
        "demo/dist/index.js": "export {}",
        "demo/deep/plugin.json": "{}",
        "README.md": "outside the plugin folder",
      }),
      {
        "deep/plugin.json": "{}",
        "dist/index.js": "export {}",
        "plugin.json": MANIFEST,
      },
    );
  });

  it("leaves out __MACOSX/ and .DS_Store", async () => {
    assert.deepEqual(
      Object.keys(
        await unpack({
          "demo/plugin.json": MANIFEST,
          "demo/.DS_Store": "junk",
          "__MACOSX/demo/._plugin.json": "junk",
          "__MACOSX/plugin.json": "junk",
        }),
      ),
      ["plugin.json"],
    );
  });

  it("fails without a plugin.json", async () => {
    await assert.rejects(
      unpack({ "index.js": "export {}" }),
      /has no plugin\.json/,
    );
  });
});

describe("unpackSourceBundle safety", () => {
  for (const name of [
    "../escape.js",
    "a/../../escape.js",
    "/etc/escape.js",
    "a\\..\\escape.js",
    "./index.js",
    "my file.js",
    "café.js",
  ]) {
    it(`rejects the unsafe path ${JSON.stringify(name)}`, async () => {
      await assert.rejects(
        unpack({ "plugin.json": MANIFEST, [name]: "x" }),
        /contains an unsafe path/,
      );
    });
  }

  it("writes nothing outside its folder when a path is unsafe", async () => {
    const outside = path.join(cacheDir, "escape.js");
    await fs.rm(outside, { force: true });
    await assert.rejects(
      unpack({ "plugin.json": MANIFEST, "../escape.js": "x" }),
    );
    await assert.rejects(fs.stat(outside), { code: "ENOENT" });
  });

  it("rejects a zip whose SHA-256 differs from the entry", async () => {
    const zip = makeZip({ "plugin.json": MANIFEST });
    const entry = await seed(zip, "0".repeat(64));
    await assert.rejects(
      unpackSourceBundle(entry),
      /has SHA-256 [0-9a-f]{64}, but the registry entry lists 0{64}/,
    );
  });

  it("rejects a file over the per-file cap before inflating it", async () => {
    await assert.rejects(
      unpack({
        "plugin.json": MANIFEST,
        "big.bin": new Uint8Array(50 * 1024 * 1024 + 1),
      }),
      /big\.bin is larger than 52428800 bytes/,
    );
  });

  it("rejects more than 2000 files", async () => {
    const files = { "plugin.json": MANIFEST };
    for (let i = 0; i < 2000; i += 1) files[`f${i}.js`] = "";
    await assert.rejects(
      unpack(files),
      /more than 209715200 bytes or 2000 files/,
    );
  });

  it("rejects more than 200 MiB unpacked in total", async () => {
    const chunk = new Uint8Array(45 * 1024 * 1024);
    const files = { "plugin.json": MANIFEST };
    for (let i = 0; i < 5; i += 1) files[`part${i}.bin`] = chunk;
    await assert.rejects(unpack(files), /more than 209715200 bytes/);
  });

  it("counts only the plugin folder against the limits", async () => {
    const files = { "demo/plugin.json": MANIFEST };
    for (let i = 0; i < 2001; i += 1) files[`docs/f${i}.txt`] = "";
    assert.deepEqual(Object.keys(await unpack(files)), ["plugin.json"]);
  });
});

describe("downloads", () => {
  /**
   * An entry for a zip that isn't cached, so unpacking must download it.
   *
   * @param {string} url The entry's source URL.
   * @returns {{ source: { url: string, sha256: string } }}
   */
  function uncached(url, zip = makeZip({ "plugin.json": MANIFEST })) {
    seeded.add(sha256(zip));
    return { source: { url, sha256: sha256(zip) } };
  }

  for (const [url, message] of [
    ["http://example.com/a.zip", /must use https:\/\//],
    ["https://localhost/a.zip", /not localhost or an IP address/],
    ["https://localhost./a.zip", /not localhost or an IP address/],
    ["https://app.localhost/a.zip", /not localhost or an IP address/],
    ["https://169.254.169.254/a.zip", /not localhost or an IP address/],
    ["https://[::1]/a.zip", /not localhost or an IP address/],
    ["not a url", /is not a valid URL/],
  ]) {
    it(`refuses ${url} without fetching it`, async () => {
      globalThis.fetch = () => assert.fail("fetch must not be called");
      await assert.rejects(unpackSourceBundle(uncached(url)), message);
    });
  }

  it("downloads, verifies and caches a zip", async () => {
    const zip = makeZip({ "plugin.json": MANIFEST });
    globalThis.fetch = async () => new Response(zip);
    const entry = uncached("https://example.test/a.zip", zip);
    const { files } = await unpackSourceBundle(entry);
    assert.deepEqual(files, ["plugin.json"]);
    // Cached under its hash, so the next run doesn't download it again.
    globalThis.fetch = () => assert.fail("fetch must not be called");
    await unpackSourceBundle(entry);
  });

  it("follows https redirects but refuses one to plain http or an IP", async () => {
    const zip = makeZip({ "plugin.json": MANIFEST });
    const redirect = (location) =>
      new Response(null, { status: 302, headers: { location } });
    globalThis.fetch = async (url) =>
      String(url).includes("start")
        ? redirect("https://cdn.test/final.zip")
        : new Response(zip);
    await unpackSourceBundle(uncached("https://example.test/start.zip", zip));

    for (const location of [
      "http://cdn.test/a.zip",
      "https://10.0.0.1/a.zip",
    ]) {
      globalThis.fetch = async () => redirect(location);
      await assert.rejects(
        unpackSourceBundle(
          uncached(
            "https://example.test/a.zip",
            makeZip({ "plugin.json": location }),
          ),
        ),
        /redirected to (a non-HTTPS URL|localhost or an IP address)/,
      );
    }
  });

  it("gives up after five redirects", async () => {
    globalThis.fetch = async () =>
      new Response(null, {
        status: 302,
        headers: { location: "https://loop.test/a.zip" },
      });
    await assert.rejects(
      unpackSourceBundle(uncached("https://loop.test/a.zip")),
      /redirected more than 5 times/,
    );
  });

  it("refuses a download over 100 MiB, by header or by body", async () => {
    globalThis.fetch = async () =>
      new Response("x", {
        headers: { "content-length": String(200 * 1024 * 1024) },
      });
    await assert.rejects(
      unpackSourceBundle(uncached("https://example.test/a.zip")),
      /is larger than 104857600 bytes/,
    );

    const megabyte = new Uint8Array(1024 * 1024);
    globalThis.fetch = async () =>
      new Response(
        new ReadableStream({
          pull(controller) {
            controller.enqueue(megabyte);
          },
        }),
      );
    await assert.rejects(
      unpackSourceBundle(uncached("https://example.test/b.zip")),
      /is larger than 104857600 bytes/,
    );
  });

  it("reports an HTTP error", async () => {
    globalThis.fetch = async () => new Response("gone", { status: 404 });
    await assert.rejects(
      unpackSourceBundle(uncached("https://example.test/a.zip")),
      /returned HTTP 404/,
    );
  });
});

describe("listFiles and zipFolder", () => {
  /**
   * Make a temporary plugin folder.
   *
   * @returns {Promise<string>} Its path.
   */
  async function tempPlugin() {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "source-bundles-"));
    await fs.mkdir(path.join(dir, "dist"));
    await fs.writeFile(path.join(dir, "plugin.json"), MANIFEST);
    await fs.writeFile(path.join(dir, "dist", "index.js"), "export {}");
    await fs.writeFile(path.join(dir, ".DS_Store"), "junk");
    return dir;
  }

  it("lists files sorted, without OS metadata", async () => {
    const dir = await tempPlugin();
    assert.deepEqual(await listFiles(dir), ["dist/index.js", "plugin.json"]);
    await fs.rm(dir, { recursive: true });
  });

  it("refuses a symlink, which a zip install couldn't reproduce", async () => {
    const dir = await tempPlugin();
    await fs.symlink("/etc/hostname", path.join(dir, "link.js"));
    await assert.rejects(listFiles(dir), /link\.js is not a regular file/);
    await fs.rm(dir, { recursive: true });
  });

  it("zips a folder reproducibly, and the zip unpacks to the same files", async () => {
    const dir = await tempPlugin();
    const zip = await zipFolder(dir);
    assert.deepEqual(zip, await zipFolder(dir));
    const { files } = await unpackSourceBundle(await seed(zip));
    assert.deepEqual(files, ["dist/index.js", "plugin.json"]);
    await fs.rm(dir, { recursive: true });
  });
});
