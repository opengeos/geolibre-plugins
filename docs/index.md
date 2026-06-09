---
hide:
  - navigation
  - toc
---

# GeoLibre Plugins

The plugin marketplace for [GeoLibre](https://geolibre.app). Browse curated
plugins and install them straight from the app — no manual setup.

[Browse plugins](plugins.md){ .md-button .md-button--primary }
[Develop a plugin](develop.md){ .md-button }

## Install plugins from GeoLibre

Open **Settings → Manage Plugins** in GeoLibre. The dialog lists every plugin in
this registry under **All**, **Installed**, **Not installed**, and
**Upgradeable**, with one-click install, update, and uninstall.

<div class="grid cards" markdown>

-   :material-storefront:{ .lg .middle } __Curated registry__

    ---

    Every plugin is reviewed before it ships. The registry is published at
    [`plugins.geolibre.app/plugin-registry.json`](https://plugins.geolibre.app/plugin-registry.json)
    and read directly by the GeoLibre Manage Plugins dialog.

-   :material-puzzle:{ .lg .middle } __One-click install__

    ---

    Install, update, and remove plugins live from inside GeoLibre. Updates
    appear automatically when a newer version is published here.

-   :material-source-branch:{ .lg .middle } __Open contribution__

    ---

    Anyone can publish a plugin. Start from the
    [plugin template](https://github.com/opengeos/geolibre-plugin-template), then
    open a pull request to add it to the registry.

-   :material-shield-check:{ .lg .middle } __Trusted by design__

    ---

    Plugins run with full app privileges, so the registry is curated and served
    over HTTPS. See [Develop a plugin](develop.md) for the trust model.

</div>

## How it works

1. A plugin lives in its own folder here (or anywhere on HTTPS) as a
   self-contained ES module plus a `plugin.json` manifest.
2. An entry in [`plugin-registry.json`](registry.md) points GeoLibre at that
   manifest.
3. GeoLibre fetches the registry, lists the plugins, and loads the ones the user
   installs.

Ready to publish your own? Head to **[Develop a plugin](develop.md)**.
