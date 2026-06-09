# Registry format

The registry is published at
[`https://plugins.geolibre.app/plugin-registry.json`](https://plugins.geolibre.app/plugin-registry.json)
and read directly by GeoLibre's Manage Plugins dialog. GitHub Pages serves it (and
every plugin bundle) with permissive CORS, so the app can fetch it cross-origin.

## `plugin-registry.json`

An object with a `plugins` array (a bare array is also accepted). Each entry:

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
| `id` | yes | Unique plugin id; must match the manifest and the exported plugin. |
| `name` | yes | Display name shown in the marketplace. |
| `version` | yes | Used for the update-available check against the loaded version. |
| `manifestUrl` | yes | Relative (resolved against the registry URL) or an absolute HTTPS URL. |
| `description` | no | Short summary shown on the card. |
| `author` | no | Shown on the card. |
| `homepage` | no | Must be `http(s)`; other schemes are dropped. |
| `categories` | no | Tags shown on the card. |
| `minGeoLibreVersion` | no | Gates installation against the running app version. |

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

See **[Develop a plugin](develop.md)** for the full workflow.
