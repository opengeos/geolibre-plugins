-- D1 schema for the plugin usage counts (worker/src/stats.js).
--
--   npx wrangler d1 execute geolibre-plugins-stats --remote --file worker/schema.sql

-- Distinct visitors of the current week: an HMAC of the IP with a
-- weekly salt. Rolled up into weekly_users and deleted once the week ends.
CREATE TABLE IF NOT EXISTS weekly_visitors (
  week TEXT NOT NULL,
  plugin TEXT NOT NULL,
  visitor TEXT NOT NULL,
  PRIMARY KEY (week, plugin, visitor)
);

CREATE TABLE IF NOT EXISTS weekly_users (
  week TEXT NOT NULL,
  plugin TEXT NOT NULL,
  users INTEGER NOT NULL,
  PRIMARY KEY (week, plugin)
);

CREATE TABLE IF NOT EXISTS daily_launches (
  day TEXT NOT NULL,
  plugin TEXT NOT NULL,
  launches INTEGER NOT NULL,
  PRIMARY KEY (day, plugin)
);
