# Develop a plugin

Plugins are **trusted code** that runs with full app privileges, so the registry
is curated: open a pull request and a maintainer reviews it before it ships.

!!! tip "Start from the template"
    The [**geolibre-plugin-template**](https://github.com/opengeos/geolibre-plugin-template)
    is the recommended starting point. It includes a MapLibre control wrapper, a
    `plugin.json` manifest, a GeoLibre plugin entry point, and a build that
    produces the bundle layout below. The [`sample/`](https://github.com/opengeos/geolibre-plugins/tree/main/sample)
    plugin in this repo is a minimal in-repo example.

## 1. Build a plugin entry

Your `entry` is a single self-contained ES module — bundle your dependencies in;
relative `import`s are not resolved by the loader. It must export a
`GeoLibrePlugin` as the default export or a named `plugin` export, and its
`id` / `name` / `version` must match the `plugin.json` manifest:

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
injected globally, so scope your selectors (e.g. a plugin-specific class
prefix); `hsl(var(--foreground))` and the other GeoLibre design tokens are
available so a control can match the in-app light/dark theme.

## 2. Add the plugin folder

Create `<id>/` at the repository root with `plugin.json`, the built `entry` JS,
and any `style` CSS. Keep `entry`/`style` paths relative and inside the folder:

```text
my-plugin/
  plugin.json
  index.js
  style.css
```

## 3. Register it

Add an entry to [`plugin-registry.json`](registry.md) with `manifestUrl`
pointing at `my-plugin/plugin.json` (relative) — or an absolute HTTPS URL if you
host the plugin elsewhere. Set `minGeoLibreVersion` to the lowest GeoLibre
version you support.

## 4. Test locally

Point a local GeoLibre build at your branch's registry, then open
**Settings → Manage Plugins** and install it:

```bash
# serve this repo with CORS on http://localhost:8090, then build GeoLibre with:
VITE_GEOLIBRE_PLUGIN_REGISTRY_URL=http://localhost:8090/plugin-registry.json
```

`http://localhost` and HTTPS registries are accepted; other schemes are
rejected.

## 5. Open a pull request

On merge to `main`, the Pages workflow publishes the update to
`plugins.geolibre.app` and the new plugin appears in the catalog and in
GeoLibre's Manage Plugins dialog.

## Updating a plugin

Bump `version` in both the plugin's `plugin.json` **and** its registry entry,
update the built assets, and open a pull request. GeoLibre shows an **Update**
action to users whose installed version is older than the registry version;
uninstalling removes the plugin at runtime.

## Security model

- The registry is an allowlist — only curated entries are offered for install.
- Manifest URLs must be HTTPS (or HTTP on localhost); other schemes are dropped.
- `homepage` must be `http(s)`; other schemes are dropped before rendering.
- A plugin's `entry` executes with the same privileges as GeoLibre itself, which
  is why entries are reviewed and the registry is curated.
