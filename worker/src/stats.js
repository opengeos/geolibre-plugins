// Anonymous plugin usage counts.
//
// GeoLibre fetches each installed plugin's stable `plugins/<dir>/plugin.json`
// when it starts, so counting those fetches measures how many people use a
// plugin, without any change to the app. Two numbers are kept per plugin:
//
// - users per ISO week: distinct visitors, where a visitor is an HMAC of the
//   plugin and client IP keyed with a secret salt that changes every week. (Leaving the
//   User-Agent out means a script can't mint users by varying it; people
//   behind one IP count as one user, so the figure is a lower bound.)
//   Without the secret (held only by this Worker) a hash can't be turned back
//   into an IP; with it, an IPv4 address could be recovered by brute force,
//   so hashes are kept only until the week is rolled up into a count. They
//   can't be linked across weeks or across plugins. No IP address is stored.
// - launches per day: every counted fetch.
//
// Fetches made by the registry's own deploy check (`__geolibre_check`) and by
// obvious bots aren't counted. Recording never delays or fails the response.

const STABLE_MANIFEST =
  /^plugins\/([a-z0-9]+(?:[._-][a-z0-9]+)*)\/plugin\.json$/;
const BOT =
  /bot\b|crawl|spider|slurp|facebookexternalhit|curl\/|wget\/|python-requests|go-http-client/i;

/**
 * ISO 8601 week of a date, like "2026-W40".
 *
 * @param {Date} date
 * @returns {string}
 */
export function isoWeek(date) {
  const day = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  // Thursday of this week decides the week-numbering year.
  const weekday = day.getUTCDay() || 7;
  day.setUTCDate(day.getUTCDate() + 4 - weekday);
  const yearStart = Date.UTC(day.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((day - yearStart) / 86400000 + 1) / 7);
  return `${day.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/**
 * The plugin folder a request counts toward, or null when it isn't counted.
 *
 * @param {Request} request
 * @param {URL} url
 * @param {string} key The request path without its leading slash.
 * @returns {string | null}
 */
export function countedFolder(request, url, key) {
  if (request.method !== "GET" || url.searchParams.has("__geolibre_check")) {
    return null;
  }
  // No User-Agent at all is a script, not a GeoLibre install.
  const agent = request.headers.get("User-Agent") ?? "";
  if (!agent || BOT.test(agent)) return null;
  return STABLE_MANIFEST.exec(key)?.[1] ?? null;
}

/**
 * The part of a client address that identifies a visitor: the whole IPv4
 * address, or the /64 network of an IPv6 one (devices rotate the rest for
 * privacy, which would otherwise count one person several times).
 *
 * @param {string} ip
 * @returns {string}
 */
export function visitorAddress(ip) {
  if (!ip.includes(":")) return ip;
  // An IPv4 address carried in IPv6 form (::ffff:1.2.3.4) is that IPv4.
  const embedded = /(?:^|:)(\d{1,3}(?:\.\d{1,3}){3})$/.exec(ip);
  if (embedded) return embedded[1];
  // Anything that isn't a well-formed IPv6 address is used as it is.
  if (!/^[0-9a-f:]+$/i.test(ip) || (ip.match(/::/g) ?? []).length > 1)
    return ip;
  const [head, tail = ""] = ip.toLowerCase().split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const fill = 8 - left.length - right.length;
  const groups =
    ip.includes("::") && fill >= 1
      ? [...left, ...Array(fill).fill("0"), ...right]
      : left;
  if (groups.length !== 8) return ip;
  return groups
    .slice(0, 4)
    .map((group) => group.replace(/^0+(?=.)/, ""))
    .join(":");
}

async function visitorHash(secret, week, folder, request) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(`${secret}:${week}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const ip = visitorAddress(request.headers.get("CF-Connecting-IP") ?? "");
  // The plugin is part of the input, so one person's hashes for different
  // plugins don't match: the table can't show which plugins someone uses.
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${folder}\n${ip}`),
  );
  return Array.from(new Uint8Array(signature).slice(0, 16), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

/**
 * Count one use of a plugin. Does nothing unless the stats database and the
 * salt secret are configured.
 *
 * @param {{ STATS?: D1Database, STATS_SALT?: string }} env
 * @param {Request} request
 * @param {string} folder
 * @param {Date} [now]
 */
export async function recordUsage(env, request, folder, now = new Date()) {
  if (!env.STATS || !env.STATS_SALT) return;
  const week = isoWeek(now);
  const day = now.toISOString().slice(0, 10);
  const statements = [
    env.STATS.prepare(
      "INSERT INTO daily_launches (day, plugin, launches) VALUES (?, ?, 1) " +
        "ON CONFLICT (day, plugin) DO UPDATE SET launches = launches + 1",
    ).bind(day, folder),
  ];
  // Without the client IP every visitor with the same User-Agent would hash
  // alike, so such a request counts as a launch but not as a user.
  if (request.headers.get("CF-Connecting-IP")) {
    const visitor = await visitorHash(env.STATS_SALT, week, folder, request);
    statements.push(
      env.STATS.prepare(
        "INSERT OR IGNORE INTO weekly_visitors (week, plugin, visitor) VALUES (?, ?, ?)",
      ).bind(week, folder, visitor),
    );
  }
  await env.STATS.batch(statements);
}

/**
 * Roll finished weeks' visitors up into counts and delete their hashes.
 * Runs daily from the Worker's cron trigger.
 *
 * @param {{ STATS?: D1Database }} env
 * @param {Date} [now]
 */
export async function rollUp(env, now = new Date()) {
  if (!env.STATS) return;
  const week = isoWeek(now);
  await env.STATS.batch([
    env.STATS.prepare(
      "INSERT OR REPLACE INTO weekly_users (week, plugin, users) " +
        "SELECT week, plugin, COUNT(*) FROM weekly_visitors WHERE week < ? GROUP BY week, plugin",
    ).bind(week),
    env.STATS.prepare("DELETE FROM weekly_visitors WHERE week < ?").bind(week),
  ]);
}

/**
 * The public usage summary served at plugins/stats.json.
 *
 * @param {{ STATS?: D1Database }} env
 * @param {Date} [now]
 * @returns {Promise<Response>}
 */
export async function statsResponse(env, now = new Date()) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=3600",
    "Content-Type": "application/json; charset=utf-8",
  };
  if (!env.STATS) {
    return new Response(JSON.stringify({ plugins: {} }), { headers });
  }
  const thisWeek = isoWeek(now);
  const lastWeek = isoWeek(new Date(now.getTime() - 7 * 86400000));
  const [current, previous, previousLive, launches, since, pending] =
    await env.STATS.batch([
      env.STATS.prepare(
        "SELECT plugin, COUNT(*) AS users FROM weekly_visitors WHERE week = ? GROUP BY plugin",
      ).bind(thisWeek),
      env.STATS.prepare(
        "SELECT plugin, users FROM weekly_users WHERE week = ?",
      ).bind(lastWeek),
      // Until the daily roll-up has run for a finished week, its visitors are
      // still here; count them directly so last week doesn't read 0.
      env.STATS.prepare(
        "SELECT plugin, COUNT(*) AS users FROM weekly_visitors WHERE week = ? GROUP BY plugin",
      ).bind(lastWeek),
      env.STATS.prepare(
        "SELECT plugin, SUM(launches) AS launches FROM daily_launches GROUP BY plugin",
      ),
      env.STATS.prepare("SELECT MIN(day) AS day FROM daily_launches"),
      env.STATS.prepare(
        "SELECT COUNT(*) AS rows FROM weekly_visitors WHERE week < ?",
      ).bind(thisWeek),
    ]);
  const plugins = {};
  const entry = (plugin) =>
    (plugins[plugin] ??= { usersThisWeek: 0, usersLastWeek: 0, launches: 0 });
  for (const row of current.results)
    entry(row.plugin).usersThisWeek = row.users;
  for (const row of [...previous.results, ...previousLive.results]) {
    const usage = entry(row.plugin);
    usage.usersLastWeek = Math.max(usage.usersLastWeek, row.users);
  }
  for (const row of launches.results) entry(row.plugin).launches = row.launches;
  const body = {
    generated: now.toISOString(),
    since: since.results[0]?.day ?? null,
    thisWeek,
    lastWeek,
    // Visitor hashes of finished weeks still stored: 0 once the daily roll-up
    // has run, so a monitor can tell the hashes really are deleted.
    pendingRollUp: pending.results[0]?.rows ?? 0,
    // Keyed by the plugins/<dir>/ folder of each plugin's manifestUrl.
    plugins,
  };
  return new Response(JSON.stringify(body), { headers });
}
