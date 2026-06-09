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

## Contributing a plugin

Plugins are **trusted code** that runs with full app privileges, so the registry
is curated: open a pull request and a maintainer reviews it before it ships.

> **Start from the template:** the
> [geolibre-plugin-template](https://github.com/opengeos/geolibre-plugin-template)
> is the recommended starting point for plugin development. It includes a
> MapLibre control wrapper, a `plugin.json` manifest, a GeoLibre plugin entry
> point, and a build that produces the bundle layout below. The
> [`sample/`](./sample) plugin here is a minimal in-repo example.

### 1. Build a plugin entry

Your `entry` is a single self-contained ES module — bundle your dependencies in;
relative `import`s are not resolved by the loader. It must export a
`GeoLibrePlugin` as the default export or a named `plugin` export, and its
`id` / `name` / `version` must match the `plugin.json` manifest. The minimal
shape:

```js
export const plugin = {
  id: "my-plugin",
  name: "My Plugin",
  version: "1.0.0",
  activate(app) {
    // add a control, layer, etc. using the app API
  },
  deactivate(app) {
    // tear down whatever activate added
  },
};
export default plugin;
```

External plugins must **not** set `activeByDefault`. The optional `style` CSS is
injected globally, so scope your selectors (e.g. a plugin-specific class prefix);
`hsl(var(--foreground))` and the other GeoLibre design tokens are available so a
control can match the in-app light/dark theme. Copy [`sample/`](./sample) as a
starting point.

### 2. Add the plugin folder

Create `<id>/` at the repo root containing `plugin.json`, the built `entry` JS,
and any `style` CSS. Keep `entry`/`style` paths relative and inside the folder.

### 3. Register it

Add an entry to `plugin-registry.json` with `manifestUrl` pointing at
`<id>/plugin.json` (relative) — or an absolute HTTPS URL if you host the plugin
elsewhere. Set `minGeoLibreVersion` to the lowest GeoLibre version you support.

### 4. Test locally

Point a local GeoLibre build at your branch's registry, then open
**Settings → Manage Plugins** and install it:

```bash
# serve this repo with CORS on http://localhost:8090, then build GeoLibre with:
VITE_GEOLIBRE_PLUGIN_REGISTRY_URL=http://localhost:8090/plugin-registry.json
```

`http://localhost` and HTTPS registries are accepted; other schemes are rejected.

### 5. Open a pull request

On merge to `main`, the
[Deploy to GitHub Pages](.github/workflows/deploy-pages.yml) workflow publishes
the update to `plugins.geolibre.app`.

### Updating a plugin

Bump `version` in both the plugin's `plugin.json` **and** its registry entry,
update the built assets, and open a PR. GeoLibre shows an **Update** action to
users whose installed version is older than the registry version; uninstalling
removes it at runtime.

## Deployment

Pushing to `main` runs the Pages workflow, which uploads the repository root as
the site. The custom domain is set by the `CNAME` file
(`plugins.geolibre.app`); `.nojekyll` disables Jekyll so files are served
verbatim.

> One-time setup: enable **Settings → Pages → Source: GitHub Actions**, and add
> a DNS `CNAME` record for `plugins.geolibre.app` pointing at
> `opengeos.github.io`.
