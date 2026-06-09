# GeoLibre Plugins

The plugin marketplace registry for [GeoLibre](https://github.com/opengeos/GeoLibre).

This repository is published to GitHub Pages at **https://plugins.geolibre.app**
and hosts:

- `plugin-registry.json` — the curated index the GeoLibre Manage Plugins dialog
  reads (`https://plugins.geolibre.app/plugin-registry.json`).
- One folder per plugin (e.g. `sample/`) containing its `plugin.json` manifest
  and built assets.

GitHub Pages serves these files with permissive CORS, so the GeoLibre app
(running on a different origin) can fetch the registry and each plugin bundle.

## Registry format

`plugin-registry.json` is an object with a `plugins` array. Each entry:

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "Optional short description",
  "author": "Author name",
  "homepage": "https://github.com/owner/my-plugin",
  "manifestUrl": "my-plugin/plugin.json",
  "categories": ["Example"],
  "minGeoLibreVersion": "0.9.0"
}
```

- `id`, `name`, `version`, and `manifestUrl` are required; the rest are optional.
- `manifestUrl` may be relative (resolved against this registry's URL, so a
  same-origin plugin hosted here uses e.g. `my-plugin/plugin.json`) or an
  absolute HTTPS URL pointing at a plugin hosted elsewhere.
- `homepage` must be `http(s)`; other schemes are dropped by the app.
- `minGeoLibreVersion` gates installation against the running app version.

## Plugin manifest

Each plugin folder has a `plugin.json` (the same contract GeoLibre's external
plugin loader expects):

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "entry": "index.js",
  "style": "style.css"
}
```

`entry` must be a self-contained ES module exporting a `GeoLibrePlugin` as the
default or a named `plugin` export, with `id`/`name`/`version` matching the
manifest. `entry` and `style` are resolved relative to the manifest, so keep
them inside the plugin's own folder. See [`sample/`](./sample) for a minimal,
copy-ready template.

## Adding a plugin

1. Add a folder `<id>/` with `plugin.json`, the built `entry` JS, and any
   `style` CSS.
2. Add an entry to `plugin-registry.json` pointing `manifestUrl` at
   `<id>/plugin.json`.
3. Open a pull request. On merge to `main`, the
   [Deploy to GitHub Pages](.github/workflows/deploy-pages.yml) workflow
   publishes the update to `plugins.geolibre.app`.

## Deployment

Pushing to `main` runs the Pages workflow, which uploads the repository root as
the site. The custom domain is set by the `CNAME` file
(`plugins.geolibre.app`); `.nojekyll` disables Jekyll so files are served
verbatim.

> One-time setup: enable **Settings → Pages → Source: GitHub Actions**, and add
> a DNS `CNAME` record for `plugins.geolibre.app` pointing at
> `opengeos.github.io`.
