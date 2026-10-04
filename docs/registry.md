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
| `categories` | no | One to four tags shown on the card, from the list below. |
| `minGeoLibreVersion` | no | Semantic version. Gates installation against the running app version. |

Unknown fields are rejected, so a typo such as `minGeolibreVersion` fails
validation instead of being ignored.

`categories` values come from a fixed list: `Analysis`, `Archaeology`, `Basemaps`, `Climate`, `Data`, `Ecology`, `Example`,
`Hydrology`, `Imagery`, `Oceans`, `Raster`, `Terrain`, `Utilities`, `Vector`,
`Visualization`.
Open an issue to propose a new category.

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

## Schemas

Both formats are defined as JSON Schemas, published alongside the registry:

- [`registry-entry.schema.json`](https://plugins.geolibre.app/schemas/registry-entry.schema.json)
  for `registry/<id>.json`
- [`plugin-manifest.schema.json`](https://plugins.geolibre.app/schemas/plugin-manifest.schema.json)
  for `plugin.json`

`npm run validate` checks every entry and manifest against them, and the
repository's `.vscode/settings.json` applies them in VS Code as you edit.

See **[Develop a plugin](develop.md)** for the full workflow.
