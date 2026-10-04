// Serves plugin files mirrored to R2 at plugins.geolibre.app/plugins/*, and
// passes every other request through to the GitHub Pages origin.
//
// CI uploads each plugin version that comes from a release zip to
// `plugins/<id>/<version>/...`, which never changes once written, then
// rewrites `plugins/<id>/plugin.json` to point into that folder. Plugins
// still committed to the repository have no R2 objects, so their requests
// fall through to Pages unchanged.

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

export default {
  /**
   * @param {Request} request
   * @param {{ PLUGINS: R2Bucket }} env
   * @returns {Promise<Response>}
   */
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = url.pathname.replace(/^\/+/, "");

    // Only plain reads of plugin files are served from R2. Anything else,
    // including a path the URL parser could not normalize, goes to Pages.
    if (
      (request.method !== "GET" && request.method !== "HEAD") ||
      !key.startsWith("plugins/") ||
      key
        .split("/")
        .some((part) => part === "" || part === "." || part === "..")
    ) {
      return fetch(request);
    }

    const object = await env.PLUGINS.get(key, { onlyIf: request.headers });
    if (object === null) {
      return fetch(request);
    }

    const headers = baseHeaders(key);
    headers.set("ETag", object.httpEtag);
    // `get` with `onlyIf` returns the metadata without a body when the
    // client's copy is current.
    if (!("body" in object)) {
      return new Response(null, { status: 304, headers });
    }
    return new Response(request.method === "HEAD" ? null : object.body, {
      headers,
    });
  },
};
