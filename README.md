# GeoLibre Plugins

The plugin marketplace registry for [GeoLibre](https://github.com/opengeos/GeoLibre).

This repository is published to GitHub Pages at **https://plugins.geolibre.app**
and hosts:

- `plugin-registry.json` — the curated index the GeoLibre Manage Plugins dialog
  reads (`https://plugins.geolibre.app/plugin-registry.json`). It is generated
  at deploy time from one file per plugin in `registry/<id>.json`.
- A `plugins/` directory with one folder per plugin (e.g. `plugins/movecost/`),
  each containing its `plugin.json` manifest and built assets.

GitHub Pages serves these files with permissive CORS, so the GeoLibre app
(running on a different origin) can fetch the registry and each plugin bundle.

## Registry format

`plugin-registry.json` is an object with a `plugins` array. Each entry comes
from its own `registry/<id>.json` file, which holds just that entry:

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

- `id`, `name`, `version`, and `manifestUrl` are required; the rest are optional.
- `manifestUrl` may be relative (resolved against this registry's URL, so a
  plugin hosted here uses e.g. `plugins/my-plugin/plugin.json`) or an
  absolute HTTPS URL pointing at a plugin hosted elsewhere.
- `homepage` must be `http(s)`; other schemes are dropped by the app.
- `minGeoLibreVersion` gates installation against the running app version.
- The generated registry adds a `bundleSha256` to each plugin hosted here, so
  GeoLibre can check that the code it downloads is the code that was reviewed.
  It is computed at build time; don't add it yourself.
- `categories` takes one to four values from a fixed list: `Analysis`,
  `Archaeology`, `Basemaps`, `Climate`, `Data`, `Ecology`, `Example`,
  `Hydrology`, `Imagery`, `Oceans`, `Raster`, `Terrain`, `Utilities`, `Vector`,
  `Visualization`. Open an issue to propose a new one.

[`schemas/registry-entry.schema.json`](schemas/registry-entry.schema.json) and
[`schemas/plugin-manifest.schema.json`](schemas/plugin-manifest.schema.json)
define both formats. `npm run validate` checks them, and VS Code picks them up
from `.vscode/settings.json`.

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
them inside the plugin's own folder. See [`examples/sample/`](./examples/sample) for a minimal,
copy-ready template.

## Contributing a plugin

Plugins are **trusted code** that runs with full app privileges, so the registry
is curated: open a pull request and a maintainer reviews it before it ships.
[`CODEOWNERS`](.github/CODEOWNERS) requests a maintainer's review on every pull
request automatically.

> **Start from the template:** the
> [geolibre-plugin-template](https://github.com/opengeos/geolibre-plugin-template)
> is the recommended starting point for plugin development. It includes a
> MapLibre control wrapper, a `plugin.json` manifest, a GeoLibre plugin entry
> point, and a build that produces the bundle layout below. The
> [`examples/sample/`](./examples/sample) plugin here is a minimal in-repo example.

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
control can match the in-app light/dark theme. Copy [`examples/sample/`](./examples/sample) as a
starting point.

Installed plugins are listed under **Plugins → Installed** automatically. To add
a few actions to a built-in menu (Add Data, Processing, or Controls), prefer
`app.registerMenuContribution?.()` over a top-level `app.registerToolbarMenu?.()`
menu; see [Develop a plugin](https://plugins.geolibre.app/develop/#where-your-plugin-shows-up-in-the-menus).

### 2. Add the plugin folder

> **Prefer a release zip.** Every plugin in the registry is now served from a
> release zip ([Or host it from a release zip](#or-host-it-from-a-release-zip)
> below), which keeps built code out of this repository. Committing a folder
> still works.

Create `plugins/<id>/` containing `plugin.json`, the built `entry` JS, and any
`style` CSS. Keep `entry`/`style` paths relative and inside the folder.

Commit the bundle as your build emits it. The
[Minify plugin bundles](.github/workflows/minify-bundles.yml) workflow
whitespace-minifies every committed `plugins/**/*.js` — worth about 73% of the
line count here, since most plugin builds mangle identifiers but leave the
whitespace in. It only strips whitespace: no identifier mangling, no syntax
rewriting, no tree shaking, and dependency license headers are kept.

On a branch in this repository the workflow pushes the result back to your
branch. From a fork it cannot (the Actions token has no write access to your
fork), so it fails and you run it yourself — or download the `minified-bundles`
artifact it uploads and commit that:

```bash
npm ci
npm run minify        # rewrite the bundles in place
npm run minify:check  # what CI checks
```

### 3. Register it

Add a `registry/<id>.json` file holding your plugin's registry entry (the file
name must match its `id`), with `manifestUrl` pointing at
`plugins/<id>/plugin.json` (relative) — or an absolute HTTPS URL if you host the
plugin elsewhere. Set `minGeoLibreVersion` to the lowest GeoLibre version you
support. Don't edit `plugin-registry.json`: it is generated from `registry/`
when the site is deployed, so pull requests for different plugins never
conflict.

#### Or host it from a release zip

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

### 4. Test locally

Point a local GeoLibre build at your branch's registry, then open
**Settings → Manage Plugins** and install it:

```bash
npm run build:registry   # generate plugin-registry.json from registry/
npm run validate         # check every entry and import every bundle
# serve this repo with CORS on http://localhost:8090, then build GeoLibre with:
VITE_GEOLIBRE_PLUGIN_REGISTRY_URL=http://localhost:8090/plugin-registry.json
```

`http://localhost` and HTTPS registries are accepted; other schemes are rejected.

### 5. Open a pull request

On merge to `main`, the
[Deploy to GitHub Pages](.github/workflows/deploy-pages.yml) workflow publishes
the update to `plugins.geolibre.app`.

### Updating a plugin

Bump `version` in both the plugin's `plugin.json` **and** its
`registry/<id>.json` entry, update the built assets, and open a PR. GeoLibre
shows an **Update** action to users whose installed version is older than the
registry version; uninstalling removes it at runtime.

## Deployment

Pushing to `main` runs the Pages workflow, which uploads the repository root as
the site. The custom domain is set by the `CNAME` file
(`plugins.geolibre.app`); `.nojekyll` disables Jekyll so files are served
verbatim.

> One-time setup: enable **Settings → Pages → Source: GitHub Actions**, and add
> a DNS `CNAME` record for `plugins.geolibre.app` pointing at
> `opengeos.github.io`.

### Blocking a plugin

To stop a malicious or broken plugin on every install, add an entry to
[`blocklist.json`](blocklist.json) (see
[Registry format](https://plugins.geolibre.app/registry/#blocklistjson)):

- To block one bad version, add its `id` and the `bundleSha256` from
  `plugin-registry.json`, and point its registry entry at a fixed release (or
  remove the entry).
- To block every version, add only the `id` and delete
  `registry/<id>.json`.

Give a short `reason` (users see it) and the `date`. CI refuses a blocklist
that the registry contradicts.

### Release-zip mirror

Plugins with a `source` are served from the `geolibre-plugins` R2 bucket by the
`geolibre-plugins-mirror` Worker ([`worker/`](worker/)), routed on
`plugins.geolibre.app/plugins/*`. The Worker serves an object when the bucket
has one and passes every other request through to Pages, so committed plugins
are unaffected. The bucket has no public domain of its own; only the Worker
reads it. An object in the bucket takes precedence over Pages, so moving a
plugin back to a committed folder also means deleting its `plugins/<id>/`
objects from the bucket.

Before the registry is deployed, `scripts/publish_sources.mjs` uploads each
release to `plugins/<id>/<version>/` and then switches the stable
`plugins/<id>/plugin.json` to it, so the live registry never lists a hash the
mirror can't serve. The reverse can briefly happen: between that switch and the
Pages deploy finishing (a minute or two, plus the manifest's 60-second cache),
the old registry's hash doesn't match the new code. An install in that window
is held back; installing again or using **Update** once the new registry is
live fixes it.

To move a committed plugin to the mirror without changing what users run:

1. `node scripts/make_migration_zip.mjs plugins/<dir>` builds a reproducible
   zip of the committed files and prints its SHA-256.
2. Upload it to the `bundles-2026-10` release (`gh release upload`).
3. Add `source` to the plugin's registry entry, keep its `manifestUrl`, and
   delete `plugins/<dir>/`. `bundleSha256` must not change, so existing
   installs keep their integrity pins.

The sample plugin's readable source lives in [`examples/sample/`](examples/sample),
which isn't served; its served copy comes from the release zip.

> One-time setup: deploy the Worker with
> `npx wrangler deploy --config worker/wrangler.toml`, and add the repository
> secrets `CLOUDFLARE_R2_TOKEN` (an API token with R2 write access to the
> `geolibre-plugins` bucket) and `CLOUDFLARE_ACCOUNT_ID`. They're only needed
> once an entry has a `source`.
