// Serves plugin files mirrored to R2 at plugins.geolibre.app/plugins/*, and
// passes every other request through to the GitHub Pages origin.
//
// CI uploads each plugin version that comes from a release zip to
// `plugins/<id>/<version>/...`, which never changes once written, then
// rewrites `plugins/<id>/plugin.json` to point into that folder. Plugins
// still committed to the repository have no R2 objects, so their requests
// fall through to Pages unchanged.
//
// It also counts plugin usage anonymously and serves the counts at
// plugins/stats.json (see stats.js).
//
// Range requests are not supported: a ranged GET gets the whole file with a
// 200, which is valid HTTP and all GeoLibre's whole-file fetches need.

import { countedFolder, recordUsage, rollUp, statsResponse } from "./stats.js";

// Versioned files never change once uploaded, so they can be cached for good.
// Anything else (the stable plugin.json) must pick up a new release quickly.
const VERSIONED_PATH = /^plugins\/[^/]+\/\d+\.\d+\.\d+[^/]*\//;

const CONTENT_TYPES = {
  css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
};

/**
 * Headers every mirrored response carries. GeoLibre fetches plugins from the
 * browser (web and desktop alike), so CORS must allow any origin, as Pages does.
 *
 * @param {string} key The R2 object key.
 * @returns {Headers}
 */
function baseHeaders(key) {
  const headers = new Headers({
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": VERSIONED_PATH.test(key)
      ? "public, max-age=31536000, immutable"
      : "public, max-age=60",
    "X-Content-Type-Options": "nosniff",
  });
  const extension = key.split(".").pop()?.toLowerCase() ?? "";
  if (CONTENT_TYPES[extension]) {
    headers.set("Content-Type", CONTENT_TYPES[extension]);
  }
  return headers;
}

/**
 * Serve a request from R2, or pass it through to the Pages origin.
 *
 * @param {Request} request
 * @param {{ PLUGINS: R2Bucket }} env
 * @param {string} key The request path without its leading slash.
 * @returns {Promise<Response>}
 */
async function serve(request, env, key) {
  // Only plain reads of plugin files are served from R2. Anything else,
  // including a path the URL parser could not normalize, goes to Pages.
  if (
    (request.method !== "GET" && request.method !== "HEAD") ||
    !key.startsWith("plugins/") ||
    key.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    return fetch(request);
  }

  // Only revalidation headers: with these, an object without a body always
  // means "not modified" (304). If-Match and friends would need a 412.
  const conditional = new Headers();
  for (const name of ["If-None-Match", "If-Modified-Since"]) {
    const value = request.headers.get(name);
    if (value !== null) {
      conditional.set(name, value);
    }
  }
  let object;
  try {
    object = await env.PLUGINS.get(key, { onlyIf: conditional });
  } catch (error) {
    // An R2 problem must not take down plugins that only live on Pages:
    // fall through to the origin, which serves those and 404s the rest.
    console.error(`R2 lookup failed for ${key}`, error);
    return fetch(request);
  }
  if (object === null) {
    return fetch(request);
  }

  const headers = baseHeaders(key);
  // The upload stored a Content-Type; prefer it over the extension table.
  const stored = new Headers();
  object.writeHttpMetadata(stored);
  if (stored.has("Content-Type")) {
    headers.set("Content-Type", stored.get("Content-Type"));
  }
  headers.set("ETag", object.httpEtag);
  headers.set("Content-Length", String(object.size));
  // `get` with `onlyIf` returns the metadata without a body when the
  // client's copy is current.
  if (!("body" in object)) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(request.method === "HEAD" ? null : object.body, {
    headers,
  });
}

export default {
  /**
   * @param {Request} request
   * @param {{ PLUGINS: R2Bucket, STATS?: D1Database, STATS_SALT?: string }} env
   * @param {ExecutionContext} ctx
   * @returns {Promise<Response>}
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const key = url.pathname.replace(/^\/+/, "");

    if (key === "plugins/stats.json" && request.method === "GET") {
      try {
        // Worker responses aren't edge-cached by default; keep one copy per
        // hour so this public endpoint doesn't query D1 on every request. The
        // zone's cache settings can stretch the copy's TTL, so the key changes
        // every UTC hour: an old copy is never served past its hour.
        const hour = new Date().toISOString().slice(0, 13);
        const cacheKey = new Request(
          `${url.origin}/plugins/stats.json?hour=${hour}`,
        );
        const cached = await caches.default.match(cacheKey);
        if (cached) return cached;
        const response = await statsResponse(env);
        ctx.waitUntil(caches.default.put(cacheKey, response.clone()));
        return response;
      } catch (error) {
        console.error("Could not build plugins/stats.json", error);
        return new Response(JSON.stringify({ plugins: {} }), {
          status: 503,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-store",
            "Content-Type": "application/json; charset=utf-8",
          },
        });
      }
    }

    const response = await serve(request, env, key);

    // Count a launch only for a plugin that was actually served (200, or a
    // 304 revalidation), so made-up folders can't add entries; and only after
    // responding, so a stats problem never affects serving the plugin.
    const folder = countedFolder(request, url, key);
    if (folder && (response.status === 200 || response.status === 304)) {
      ctx.waitUntil(
        recordUsage(env, request, folder).catch((error) =>
          console.error(`Could not count a use of ${folder}`, error),
        ),
      );
    }
    return response;
  },

  /**
   * Daily: roll finished weeks' visitor hashes up into counts and delete them.
   *
   * @param {ScheduledController} controller
   * @param {{ STATS?: D1Database }} env
   */
  async scheduled(controller, env) {
    await rollUp(env);
  },
};
