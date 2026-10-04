# Develop a plugin

Plugins are **trusted code** that runs with full app privileges, so the registry
is curated: open a pull request and a maintainer reviews it before it ships.

!!! tip "Start from the template"
    The [**geolibre-plugin-template**](https://github.com/opengeos/geolibre-plugin-template)
    is the recommended starting point. It includes a MapLibre control wrapper, a
    `plugin.json` manifest, a GeoLibre plugin entry point, and a build that
    produces the bundle layout below. The [`examples/sample/`](https://github.com/opengeos/geolibre-plugins/tree/main/examples/sample)
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

### Where your plugin shows up in the menus

GeoLibre keeps external plugins out of the way of the built-in menus, the way
QGIS does. From least to most prominent:

- **Plugins → Installed** (automatic). Every plugin installed from this
  registry, a zip, or a manifest URL is listed in the **Plugins → Installed**
  submenu, sorted alphabetically, ending with a **Manage Plugins…** shortcut.
  You do not need to do anything for this.
- **A submenu in a built-in menu** (recommended for a few actions). Like a QGIS
  plugin that adds itself to the Vector or Raster menu, call
  `app.registerMenuContribution?.({ id, menu, items })` with `menu` set to
  `"addData"`, `"processing"`, or `"controls"`. The host nests your items under
  a submenu named after your plugin at the end of that menu; you cannot insert
  loose items or reorder built-in entries.
- **A top-level toolbar menu.** `app.registerToolbarMenu?.({ id, label, items })`
  adds a menu to the banner after Help. Users can turn it off with the
  **Show menu in toolbar** switch in your plugin's Plugins → Installed entry,
  which folds the menu into that entry instead, so keep its top level short.

```js
activate(app) {
  this.disposeMenu = app.registerMenuContribution?.({
    id: "my-plugin-processing", // ids are global: prefix with your plugin id
    menu: "processing",
    items: [{ id: "run", label: "Run analysis", onSelect: () => runAnalysis(app) }],
  });
},
deactivate() {
  this.disposeMenu?.();
},
```

Call these APIs with optional chaining (`?.`) so the plugin still loads on
GeoLibre versions that predate them. See "Toolbar menus" and "Adding items to
built-in menus" in the
[GeoLibre plugin API docs](https://github.com/opengeos/GeoLibre/blob/main/docs/plugin-api.md)
for the full item shape (actions, submenus, separators, icons, and translated
label getters).

## 2. Add the plugin folder

!!! tip "Prefer a release zip"
    Every plugin in the registry is now served from a release zip
    ([Or host it from a release zip](#or-host-it-from-a-release-zip) below),
    which keeps built code out of this repository. Committing a folder still
    works.

Create `plugins/<id>/` with `plugin.json`, the built `entry` JS, and any
`style` CSS. Keep `entry`/`style` paths relative and inside the folder:

```text
plugins/
  my-plugin/
    plugin.json
    index.js
    style.css
```

Commit the bundle exactly as your build emits it; nothing reformats it. Build
it minified: every line of a committed bundle is part of the diff a reviewer
has to read. A release zip avoids that diff, but its bundle is also served
exactly as built, so build that minified too to keep downloads small.

## 3. Register it

Add a `registry/my-plugin.json` file holding your plugin's
[registry entry](registry.md) (the file name must match its `id`), with
`manifestUrl` pointing at `plugins/my-plugin/plugin.json` (relative) — or an
absolute HTTPS URL if you host the plugin elsewhere. Set `minGeoLibreVersion`
to the lowest GeoLibre version you support. Don't edit `plugin-registry.json`:
it is generated from `registry/` when the site is deployed.

### Or host it from a release zip

Instead of committing the bundle, you can point the registry entry at a
release zip you publish in your own repository: add a `source` with the zip's
HTTPS URL and its SHA-256, keep `manifestUrl` as `plugins/<id>/plugin.json`,
and leave `plugins/<id>/` out of this repository:

```json
"manifestUrl": "plugins/my-plugin/plugin.json",
"source": {
  "url": "https://github.com/owner/my-plugin/releases/download/v1.0.0/my-plugin-1.0.0.zip",
  "sha256": "<output of sha256sum my-plugin-1.0.0.zip>"
}
```

The zip uses the same layout as a GeoLibre zip install: `plugin.json` at the
root or inside one top-level folder, with `entry` and `style` beside it. CI
downloads it, checks the hash, and validates it like a committed plugin. On
merge it is copied to `plugins.geolibre.app/plugins/<id>/<version>/`, which
never changes once published, so a new release needs a new `version` and a new
`source`. Users keep installing from the same `plugins/<id>/plugin.json` URL.

## 4. Test locally

Point a local GeoLibre build at your branch's registry, then open
**Settings → Manage Plugins** and install it:

```bash
npm run build:registry   # generate plugin-registry.json from registry/
npm run validate         # check every entry and import every bundle
# serve this repo with CORS on http://localhost:8090, then build GeoLibre with:
VITE_GEOLIBRE_PLUGIN_REGISTRY_URL=http://localhost:8090/plugin-registry.json
```

`http://localhost` and HTTPS registries are accepted; other schemes are
rejected.

## 5. Format and check

This repo uses [pre-commit](https://pre-commit.com) to format code (Prettier for
JS/CSS/JSON/YAML, Ruff for Python) and to reject files larger than 10 MB:

```bash
pip install pre-commit
pre-commit install   # run automatically on `git commit`
pre-commit run --all-files
```

Built plugin bundles (`plugins/*/index.js`, `plugins/*/style.css`) are size
checked but never reformatted.

The same hooks run on every pull request in the **Lint** workflow, so a branch
that has not been formatted will fail CI.

## 6. Open a pull request

Every pull request that adds or changes a plugin, either a `plugins/<id>/`
folder or a `registry/<id>.json` entry with a `source` release zip, gets a
live preview: CI builds GeoLibre with your plugin baked in and posts the URL as
a comment. If a pull request changes both for the same plugin, the release zip
is previewed, since that is what the registry will serve.

```text
https://opengeos.org/pages-preview/geolibre-plugins/pr-<N>/
```

Your plugin loads automatically there, so you can exercise it in the real app
before review. The preview rebuilds on every push and is deleted when the pull
request closes.

!!! warning "Previews run unreviewed code"
    A preview executes the pull request's plugin with full app privileges in
    your browser. Open previews only for pull requests you are reviewing.


On merge to `main`, the Pages workflow publishes the update to
`plugins.geolibre.app` and the new plugin appears in the catalog and in
GeoLibre's Manage Plugins dialog.

## Updating a plugin

Bump `version` in both the plugin's `plugin.json` **and** its
`registry/<id>.json` entry, update the built assets, and open a pull request.
GeoLibre shows an **Update** action to users whose installed version is older
than the registry version; uninstalling removes the plugin at runtime.

## Security model

- The registry is an allowlist — only curated entries are offered for install.
- Manifest URLs must be HTTPS (or HTTP on localhost); other schemes are dropped.
- `homepage` must be `http(s)`; other schemes are dropped before rendering.
- A plugin's `entry` executes with the same privileges as GeoLibre itself, which
  is why entries are reviewed and the registry is curated.
