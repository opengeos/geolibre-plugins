## What this changes

<!-- One or two sentences. For a plugin: what it does, and whether this adds it or updates it. -->

## Plugin checklist

<!-- For a pull request that adds or updates a plugin. Delete this section otherwise. -->

- [ ] `registry/<id>.json` is named after the plugin's `id`, and `plugin-registry.json` is not edited (it is generated).
- [ ] `source` has the release zip's HTTPS URL and its SHA-256, and the zip is the exact file that was hashed. The [plugin template](https://github.com/opengeos/geolibre-plugin-template)'s release workflow prints both.
- [ ] `manifestUrl` is `plugins/<id>/plugin.json`, and nothing is committed under `plugins/`.
- [ ] `version` matches the zip's `plugin.json`, and is new for an update: a published version never changes.
- [ ] `minGeoLibreVersion` is the oldest GeoLibre the plugin works with, and `categories` come from the [fixed list](https://plugins.geolibre.app/registry/#plugin-registryjson).
- [ ] The bundle is built minified (it is served as built), and `plugin.json` doesn't set `activeByDefault`.
- [ ] The plugin only contacts the hosts its description implies, and loads no code from elsewhere at runtime. The automated review unpacks the zip and checks this, so say here why any other host is needed.
- [ ] Tested by installing it from a local registry (README, "Test locally") or from this PR's preview.
