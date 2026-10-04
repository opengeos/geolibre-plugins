// Unit tests for worker/src/stats.js.
//
//   npm run test:worker
//
// D1 is emulated with Node's built-in SQLite running worker/schema.sql, so the
// real SQL in stats.js is what gets tested.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { beforeEach, describe, it } from "node:test";

import {
  countedFolder,
  isoWeek,
  recordUsage,
  rollUp,
  statsResponse,
  visitorAddress,
} from "../src/stats.js";

const schema = readFileSync(new URL("../schema.sql", import.meta.url), "utf8");

/** Just enough of the D1 API (prepare, bind, batch) for stats.js. */
class FakeD1 {
  constructor() {
    this.db = new DatabaseSync(":memory:");
    this.db.exec(schema);
  }

  prepare(sql) {
    return {
      sql,
      args: [],
      bind(...args) {
        return { ...this, args };
      },
    };
  }

  async batch(statements) {
    return statements.map(({ sql, args }) => {
      const statement = this.db.prepare(sql);
      if (/^\s*select/i.test(sql)) {
        // Plain objects, as D1 returns (node:sqlite rows have no prototype).
        return { results: statement.all(...args).map((row) => ({ ...row })) };
      }
      statement.run(...args);
      return { results: [] };
    });
  }

  rows(sql) {
    return this.db
      .prepare(sql)
      .all()
      .map((row) => ({ ...row }));
  }
}

const SALT = "test-salt";
const MONDAY = new Date("2026-10-05T12:00:00Z"); // 2026-W41
const LAST_WEEK = new Date("2026-09-30T12:00:00Z"); // 2026-W40

function request(ip, agent = "Mozilla/5.0 (GeoLibre test)") {
  const headers = new Headers({ "User-Agent": agent });
  if (ip) headers.set("CF-Connecting-IP", ip);
  return new Request("https://plugins.geolibre.app/plugins/x/plugin.json", {
    headers,
  });
}

describe("isoWeek", () => {
  it("numbers weeks the ISO 8601 way, including year boundaries", () => {
    for (const [day, week] of [
      ["2026-10-04", "2026-W40"],
      ["2026-10-05", "2026-W41"],
      ["2021-01-03", "2020-W53"],
      ["2024-12-30", "2025-W01"],
      ["2026-01-01", "2026-W01"],
      ["2027-01-01", "2026-W53"],
    ]) {
      assert.equal(isoWeek(new Date(`${day}T12:00:00Z`)), week, day);
    }
  });
});

describe("visitorAddress", () => {
  it("keeps IPv4 and reduces IPv6 to its /64 network", () => {
    for (const [ip, expected] of [
      ["203.0.113.9", "203.0.113.9"],
      ["::ffff:1.2.3.4", "1.2.3.4"],
      ["2001:db8:1:2:aaaa:bbbb:cccc:dddd", "2001:db8:1:2"],
      ["2001:db8:1:2::1", "2001:db8:1:2"],
      ["2001:DB8:0001:0002:1::", "2001:db8:1:2"],
      ["2001:db8::1", "2001:db8:0:0"],
    ]) {
      assert.equal(visitorAddress(ip), expected, ip);
    }
  });

  it("leaves malformed addresses alone instead of throwing", () => {
    assert.equal(visitorAddress("bogus"), "bogus");
    assert.equal(visitorAddress("1:2:3"), "1:2:3");
    assert.doesNotThrow(() => visitorAddress("1:2:3:4:5:6:7:8::9"));
  });
});

describe("countedFolder", () => {
  const counted = (path, init = {}) => {
    const url = new URL(`https://plugins.geolibre.app/${path}`);
    const req = new Request(url, {
      method: init.method ?? "GET",
      headers: { "User-Agent": init.agent ?? "Mozilla/5.0" },
    });
    return countedFolder(req, url, url.pathname.slice(1));
  };

  it("counts GETs of a plugin's stable manifest", () => {
    assert.equal(counted("plugins/movecost/plugin.json"), "movecost");
    assert.equal(
      counted("plugins/movecost/plugin.json?__geolibre_plugin_cache=x"),
      "movecost",
    );
  });

  it("ignores versioned files, other methods, deploy checks, bots and scripts", () => {
    assert.equal(counted("plugins/movecost/0.2.4/plugin.json"), null);
    assert.equal(counted("plugins/movecost/0.2.4/index.js"), null);
    assert.equal(
      counted("plugins/movecost/plugin.json", { method: "HEAD" }),
      null,
    );
    assert.equal(
      counted("plugins/movecost/plugin.json?__geolibre_check=1"),
      null,
    );
    assert.equal(
      counted("plugins/movecost/plugin.json", { agent: "Googlebot/2.1" }),
      null,
    );
    assert.equal(
      counted("plugins/movecost/plugin.json", { agent: "curl/8.0" }),
      null,
    );
    assert.equal(counted("plugins/movecost/plugin.json", { agent: "" }), null);
    assert.equal(counted("plugins/stats.json"), null);
  });
});

describe("recordUsage, rollUp and statsResponse", () => {
  let env;
  beforeEach(() => {
    env = { STATS: new FakeD1(), STATS_SALT: SALT };
  });

  async function stats(now = MONDAY) {
    return (await statsResponse(env, now)).json();
  }

  it("counts distinct users per week and every launch", async () => {
    await recordUsage(env, request("198.51.100.1"), "movecost", MONDAY);
    await recordUsage(env, request("198.51.100.1"), "movecost", MONDAY);
    await recordUsage(env, request("198.51.100.2"), "movecost", MONDAY);
    await recordUsage(env, request("198.51.100.1"), "streamsnap", MONDAY);

    const body = await stats();
    assert.equal(body.thisWeek, "2026-W41");
    assert.deepEqual(body.plugins.movecost, {
      usersThisWeek: 2,
      usersLastWeek: 0,
      launches: 3,
    });
    assert.deepEqual(body.plugins.streamsnap, {
      usersThisWeek: 1,
      usersLastWeek: 0,
      launches: 1,
    });
    assert.equal(body.since, "2026-10-05");
  });

  it("counts one user for rotating addresses in one IPv6 /64", async () => {
    await recordUsage(env, request("2001:db8:1:2::a"), "movecost", MONDAY);
    await recordUsage(env, request("2001:db8:1:2::b"), "movecost", MONDAY);
    assert.equal((await stats()).plugins.movecost.usersThisWeek, 1);
  });

  it("counts a launch but no user when the client IP is missing", async () => {
    await recordUsage(env, request(null), "movecost", MONDAY);
    assert.deepEqual((await stats()).plugins.movecost, {
      usersThisWeek: 0,
      usersLastWeek: 0,
      launches: 1,
    });
  });

  it("stores no IP address, and hashes that differ per plugin", async () => {
    await recordUsage(env, request("198.51.100.1"), "movecost", MONDAY);
    await recordUsage(env, request("198.51.100.1"), "streamsnap", MONDAY);
    const rows = env.STATS.rows("SELECT plugin, visitor FROM weekly_visitors");
    assert.equal(rows.length, 2);
    for (const row of rows) assert.doesNotMatch(row.visitor, /198\.51\.100/);
    assert.notEqual(rows[0].visitor, rows[1].visitor);
  });

  it("does nothing without the database or the salt", async () => {
    await recordUsage(
      { STATS: env.STATS },
      request("198.51.100.1"),
      "movecost",
      MONDAY,
    );
    assert.deepEqual(env.STATS.rows("SELECT * FROM daily_launches"), []);
  });

  it("rolls finished weeks up into counts and deletes their hashes", async () => {
    await recordUsage(env, request("198.51.100.1"), "movecost", LAST_WEEK);
    await recordUsage(env, request("198.51.100.2"), "movecost", LAST_WEEK);
    await recordUsage(env, request("198.51.100.3"), "movecost", MONDAY);

    // Before the roll-up, last week is counted from its remaining hashes.
    const before = await stats();
    assert.equal(before.plugins.movecost.usersLastWeek, 2);
    assert.equal(before.pendingRollUp, 2);

    await rollUp(env, MONDAY);
    assert.deepEqual(env.STATS.rows("SELECT week FROM weekly_visitors"), [
      { week: "2026-W41" },
    ]);
    assert.deepEqual(
      env.STATS.rows("SELECT week, plugin, users FROM weekly_users"),
      [{ week: "2026-W40", plugin: "movecost", users: 2 }],
    );
    const body = await stats();
    assert.equal(body.pendingRollUp, 0);
    assert.equal(body.plugins.movecost.usersLastWeek, 2);
    assert.equal(body.plugins.movecost.usersThisWeek, 1);
    assert.equal(body.plugins.movecost.launches, 3);
  });

  it("serves the summary with CORS and a one-hour cache", async () => {
    const response = await statsResponse(env, MONDAY);
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), "*");
    assert.equal(response.headers.get("Cache-Control"), "public, max-age=3600");
    assert.deepEqual((await response.json()).plugins, {});
  });
});
