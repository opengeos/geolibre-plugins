# Registry format

The registry is published at
[`https://plugins.geolibre.app/plugin-registry.json`](https://plugins.geolibre.app/plugin-registry.json)
and read directly by GeoLibre's Manage Plugins dialog. GitHub Pages serves it (and
every plugin bundle) with permissive CORS, so the app can fetch it cross-origin.

## `plugin-registry.json`

An object with a `plugins` array (a bare array is also accepted). The file is
not committed: the deploy workflow generates it from one file per plugin,
`registry/<id>.json`, each holding a single entry, so pull requests for
different plugins never edit the same file. Run `npm run build:registry` to
generate it locally.

A `registry/my-plugin.json` file holds one entry, with the fields at the top
level. Its name must match the entry's `id`:

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "Optional short description",
  "author": "Author name",
  "homepage": "https://github.com/owner/my-plugin",
  "manifestUrl": "plugins/my-plugin/plugin.json",
  "categories": ["Example"],
  "minGeoLibreVersion": "0.9.0"
}
```

The generated `plugin-registry.json` wraps every entry in a `plugins` array:

```json
{
  "version": 1,
  "plugins": [
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "version": "1.0.0",
      "description": "Optional short description",
      "author": "Author name",
      "homepage": "https://github.com/owner/my-plugin",
      "manifestUrl": "plugins/my-plugin/plugin.json",
      "categories": ["Example"],
      "minGeoLibreVersion": "0.9.0"
    }
  ]
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | Unique plugin id: lowercase letters and digits separated by `.`, `_` or `-`. Must match the file name, the manifest, and the exported plugin. |
| `name` | yes | Display name shown in the marketplace. |
| `version` | yes | Semantic version such as `1.2.3`. Used for the update-available check against the loaded version. |
| `manifestUrl` | yes | Relative (resolved against the registry URL, and inside `plugins/<dir>/`) or an absolute HTTPS URL. |
| `description` | no | Short summary shown on the card. |
| `author` | no | Shown on the card. |
| `homepage` | no | Must be `http(s)`; other schemes are dropped. |
| `repository` | no | HTTPS URL of the plugin's source code, linked from its catalog page. |
| `issues` | no | HTTPS URL for reporting problems with the plugin, linked from its catalog page. |
| `license` | no | SPDX license identifier or expression, such as `MIT` or `Apache-2.0 OR MIT`, shown on the catalog page. |
| `categories` | no | One to four tags shown on the card, from the list below. |
| `minGeoLibreVersion` | no | Semantic version. Gates installation against the running app version. |
| `source` | no | `{ "url", "sha256" }` of the plugin's release zip, for a plugin whose code isn't committed here. `manifestUrl` must then be `plugins/<id>/plugin.json` (a plugin moved from a committed folder keeps that folder's URL). See [Develop a plugin](develop.md#or-host-it-from-a-release-zip). |
| `screenshots` | no | Up to four `{ "path", "caption" }` images shown on the plugin's catalog page; see below. Needs a `source`. |
| `publishableSettings` | no | Project-state keys that survive "Strip credentials" and shared project exports: `true` keeps the whole plugin state, an array of up to 64 key names keeps only those. Absent keeps nothing. |

Unknown fields are rejected, so a typo such as `minGeolibreVersion` fails
validation instead of being ignored.

The generated `plugin-registry.json` also gives each plugin hosted here a
`bundleSha256`: the SHA-256 that GeoLibre computes over the entry and style it
downloads (SHA-256 of the entry, SHA-256 of the style or of an empty string,
then SHA-256 of the two digests). The build computes it from the committed
files, so never write it in `registry/<id>.json`. After each deploy, CI
downloads every published bundle and fails if any hash differs.

Each screenshot's `path` names a PNG, JPEG or WebP file of at most 1 MiB
inside the release zip, relative to its `plugin.json` (for example
`screenshots/main.png`), and `caption` says what it shows; it is also the
image's alternative text. CI checks that each file is in the zip and is the
image its extension says. The mirror serves it from the version's folder, and
the generated `plugin-registry.json` adds its `url`, relative to the registry
like `manifestUrl`. GeoLibre ignores `repository`, `issues`, `license` and
`screenshots`; they are for the catalog.

`categories` values come from a fixed list: `Analysis`, `Archaeology`,
`Basemaps`, `Climate`, `Data`, `Ecology`, `Example`, `Hydrology`, `Imagery`,
`Oceans`, `Raster`, `Terrain`, `Utilities`, `Vector`, `Visualization`. Open an
issue to propose a new category.

A relative `manifestUrl` resolves against the registry location, so a plugin
hosted alongside the registry uses e.g. `plugins/my-plugin/plugin.json`. Entries whose
resolved manifest URL is not HTTPS (or HTTP on localhost) are dropped, so they
behave consistently when GeoLibre re-reads its settings on the next launch.

## `plugin.json` (per plugin)

The manifest GeoLibre's external-plugin loader expects:

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "entry": "index.js",
  "style": "style.css"
}
```

`entry` must be a self-contained `.js`/`.mjs` ES module exporting a
`GeoLibrePlugin` as the default or a named `plugin` export, with
`id`/`name`/`version` matching this manifest. `entry` and `style` are resolved
relative to the manifest, so keep them inside the plugin's own folder.

## `blocklist.json`

Published at
[`https://plugins.geolibre.app/blocklist.json`](https://plugins.geolibre.app/blocklist.json),
next to the registry. It lists plugins, or single bundles of them, that
GeoLibre refuses to load, so a malicious or broken plugin can be stopped on
every install without waiting for an app release:

```json
{
  "version": 1,
  "blocked": [
    {
      "id": "my-plugin",
      "bundleSha256": "3f5c…(64 hex characters)",
      "reason": "Version 1.2.0 sends map data to an undisclosed server.",
      "date": "2026-10-04"
    }
  ]
}
```

An entry with a `bundleSha256` blocks only that bundle (one version); without
one it blocks every version of the plugin. `reason` is shown to users whose
plugin is refused. CI keeps the two files consistent: a plugin blocked
outright must also be removed from `registry/`, and the registry may not serve
a blocked bundle.

GeoLibre support for the blocklist ships with a later app release; until
then, removing a plugin from the registry only stops new installs.

## Usage statistics

[`https://plugins.geolibre.app/plugins/stats.json`](https://plugins.geolibre.app/plugins/stats.json)
gives approximate usage per plugin, keyed by the `plugins/<dir>/` folder of its
`manifestUrl`, and the catalog shows it on each plugin's card and page:

```json
{
  "since": "2026-10-04",
  "thisWeek": "2026-W40",
  "lastWeek": "2026-W39",
  "plugins": {
    "movecost": { "usersThisWeek": 5, "usersLastWeek": 42, "launches": 310 }
  }
}
```

GeoLibre fetches each installed plugin's `plugin.json` when it starts, so the
counts measure how many people use a plugin, not how many installed it. They
come from those fetches alone; the app sends nothing extra.

- **Users** are distinct visitors per ISO week. A visitor is a hash of the
  plugin and the IP address (for IPv6, its /64 network), keyed with a secret that only the Worker holds and
  that changes every week. Without that secret a hash can't be turned back
  into an IP, and hashes can't be matched across weeks or across plugins.
  They're deleted once the week ends and only the count is kept. No IP address
  is stored.
- **Launches** count every fetch since `since`.
- Fetches by the registry's own deploy check, by obvious bots, and for
  plugins that don't exist aren't counted. Offline desktop use isn't seen at
  all, and people sharing one IP count as one user.

The counts are approximate and unauthenticated: a determined script can
inflate them, so treat them as a rough popularity signal, not exact figures.

## Schemas

Both formats are defined as JSON Schemas, published alongside the registry:

- [`registry-entry.schema.json`](https://plugins.geolibre.app/schemas/registry-entry.schema.json)
  for `registry/<id>.json`
- [`plugin-manifest.schema.json`](https://plugins.geolibre.app/schemas/plugin-manifest.schema.json)
  for `plugin.json`
- [`blocklist.schema.json`](https://plugins.geolibre.app/schemas/blocklist.schema.json)
  for `blocklist.json`

`npm run validate` checks every entry and manifest against them, and the
repository's `.vscode/settings.json` applies them in VS Code as you edit.

See **[Develop a plugin](develop.md)** for the full workflow.
