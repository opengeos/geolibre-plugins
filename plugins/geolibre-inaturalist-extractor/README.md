# iNaturalist Extractor — GeoLibre plugin

<!-- Badges: shields.io. Static badges need no setup; the "Repo" row is live and shows data once the repository is public. -->

**Plugin**

[![Version](https://img.shields.io/badge/version-1.5.0-2ea44f?style=flat-square)](https://github.com/Defani/Geolibre-Inaturalist-Extraction-Plugins/blob/main/geolibre-inaturalist-extractor/plugin.json)
[![Plugin ID](https://img.shields.io/badge/id-geolibre--inaturalist--extractor-555555?style=flat-square)](https://github.com/Defani/Geolibre-Inaturalist-Extraction-Plugins/blob/main/geolibre-inaturalist-extractor/plugin.json)
[![Category](https://img.shields.io/badge/category-Data-0b7285?style=flat-square)](https://github.com/opengeos/geolibre-plugins)
[![Min GeoLibre](https://img.shields.io/badge/GeoLibre-%E2%89%A5%203.0.0-0b7285?style=flat-square)](https://github.com/opengeos/GeoLibre)
[![Engine](https://img.shields.io/badge/engine-MapLibre_only-396CB2?style=flat-square&logo=maplibre&logoColor=white)](#notes--limitations)
[![GeoLibre Marketplace](https://img.shields.io/badge/GeoLibre-Marketplace-6f42c1?style=flat-square)](https://github.com/opengeos/geolibre-plugins)

**Tech stack**

[![JavaScript](https://img.shields.io/badge/JavaScript-ES_Modules-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript)
[![CSS](https://img.shields.io/badge/CSS-scoped_styles-1572B6?style=flat-square&logo=css&logoColor=white)](https://github.com/Defani/Geolibre-Inaturalist-Extraction-Plugins/blob/main/geolibre-inaturalist-extractor/style.css)
[![MapLibre GL JS](https://img.shields.io/badge/MapLibre-GL_JS-396CB2?style=flat-square&logo=maplibre&logoColor=white)](https://maplibre.org)
[![GeoJSON](https://img.shields.io/badge/GeoJSON-layer_output-2E7D32?style=flat-square)](https://geojson.org)
[![No bundler](https://img.shields.io/badge/build-no_bundler-lightgrey?style=flat-square)](#files)

**Data and platform**

[![iNaturalist API](https://img.shields.io/badge/data-iNaturalist_API_v1-74AC00?style=flat-square&logo=inaturalist&logoColor=white)](https://api.inaturalist.org/docs)
[![GeoLibre Plugin API](https://img.shields.io/badge/API-GeoLibre_Plugin_API-0b7285?style=flat-square)](https://geolibre.app/plugin-api/)

**License**

[![License](https://img.shields.io/badge/license-GPL--2.0--or--later-blue?style=flat-square&logo=gnu&logoColor=white)](#license)
[![Data](https://img.shields.io/badge/data-licensed_per_contributor-lightgrey?style=flat-square)](#using-the-data-and-photos)

**Repo**

[![Last commit](https://img.shields.io/github/last-commit/Defani/Geolibre-Inaturalist-Extraction-Plugins?style=flat-square)](https://github.com/Defani/Geolibre-Inaturalist-Extraction-Plugins/commits)
[![Issues](https://img.shields.io/github/issues/Defani/Geolibre-Inaturalist-Extraction-Plugins?style=flat-square)](https://github.com/Defani/Geolibre-Inaturalist-Extraction-Plugins/issues)
[![Stars](https://img.shields.io/github/stars/Defani/Geolibre-Inaturalist-Extraction-Plugins?style=flat-square)](https://github.com/Defani/Geolibre-Inaturalist-Extraction-Plugins/stargazers)

Fetches [iNaturalist](https://www.inaturalist.org) observations and adds them
to the map as a GeoJSON layer. Click any point to open a popup with the
observation's species, observer, date, quality grade and iconic taxon — plus
a small photo strip whenever that observation actually has a photo attached
(no photo → the popup just skips that section, it never shows a
broken/empty image).

- **Repository:** <https://github.com/Defani/Geolibre-Inaturalist-Extraction-Plugins>
- **Plugin id:** `geolibre-inaturalist-extractor` ·
- **License:** GPL-2.0-or-later (see [License](#license))
- **Sources and references:** see [Credits, sources & references](#credits-sources--references)

This plugin merges the feature set of the [rinat](https://docs.ropensci.org/rinat/)
R package and the QGIS "iNaturalist Extractor" plugin into GeoLibre's own
plugin API, so it isn't just a bounding-box fetcher.

<img width="1920" height="1080" alt="Screenshot 2026-09-22 100207" src="https://github.com/user-attachments/assets/f5b6c13d-685c-4daf-8df9-a2545df21f9c" />


## What it does

| Feature               | What it does                                                                                                                                                                                                                                                                                                                       | API / GeoLibre                     |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Toolbar and panel     | A toolbar button (vector raven icon) opens a right-sidebar panel.                                                                                                                                                                                                                                                 | `registerRightPanel`               |
| Coordinates required  | Only observations with a real, public location are extracted. A photo is shown whenever an observation has one, but it is never required; no photo just means the popup skips that section.                                                                                                                                        | `geo=true`                         |
| Area to search        | Current map view (`app.getViewBounds()`), or the extent of the layer selected in the Layers panel (`getSelectedLayerId()` / `getLayerFeatures()`), the GeoLibre equivalent of the QGIS plugin's "use layer extent".                                                                                                                | Bounding box                       |
| Date filtering        | Off by default, so results cover all years. When on, pick a from/to range: the same date twice for a single day, or Jan 1 to Dec 31 for a whole year.                                                                                                                                                                              | `d1` / `d2`                        |
| Species / iconic taxa | Type a scientific or common name to narrow to one species or group and its descendants. Leave it blank and tick one or more iconic taxa (Plantae, Aves, Insecta, Mammalia, ...) to filter broadly.                                                                                                                                 | `taxon_name`, `iconic_taxa`        |
| Observer / keyword    | Filter by one or more usernames (comma-separated) and/or a free-text keyword across the whole observation, broader than the species field, e.g. a habitat or behaviour term.                                                                                                                                                       | `user_login[]`, `q`                |
| Quality grade         | Dropdown: Any, Research grade, Needs ID, Casual, or Verifiable (research + needs ID).                                                                                                                                                                                                                                              | `quality_grade`                    |
| Advanced filters      | Collapsible section with the extra rinat `get_inat_obs()` arguments, see the table below.                                                                                                                                                                                                                                          | See below                          |
| Max observations | 10 to 2000, fetched in pages of at most 200 against the public API and trimmed to exactly your limit, following iNaturalist's guidance to request small-to-medium batches instead of bulk-scraping. | Paging of at most 200 |
| GeoJSON layer output  | Results are added as a normal GeoJSON layer, so they appear in the Layers panel and persist with the project.                                                                                                                                                                                                                      | `app.addGeoJsonLayer()`            |
| Click popup           | Click a point to see species, observer, date, quality grade and iconic taxon. Up to three photo thumbnails are shown (each is a link to the full-size photo); with no photo, only the text details appear. In the attribute table the photos are plain URL columns (`photo1` ... `photo5`, plus `photoCount` and `photoAttribution`) rather than a JSON list. The DOM popup is positioned with `map.project()` and kept in sync on `move`, so no second copy of `maplibre-gl` is bundled. | `queryRenderedFeatures`, `project` |

### Advanced filters (rinat)

| Filter          | What it does                                                                                                                                              | API parameter               |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Taxon ID        | One or more numeric IDs, descendants included; combined (AND) with the species / iconic-taxa filters.                                                     | `taxon_id`                  |
| Place ID        | One or more numeric IDs.                                                                                                                                  | `place_id`                  |
| Photo license   | CC0, CC BY, CC BY-SA, CC BY-NC, CC BY-ND, CC BY-NC-SA or CC BY-NC-ND.                                                                                     | `photo_license`             |
| Project         | A project ID or URL slug, e.g. `crows-in-vermont`.                                                                                                        | `project_id`                |
| Annotation      | Pick a term (Life stage, Sex, Flowers and fruits, Leaves, Alive or dead, Evidence of presence) and optionally one of its values, e.g. Life stage → Larva. | `term_id` / `term_value_id` |
| Ignore the Area | Opt-in switch that drops the bounding box, so a place or project isn't clipped to the current view.                                                       | No bounding box sent        |

## Files

```
geolibre-inaturalist-extractor/   # the plugin itself (this is what gets published)
  plugin.json                     # manifest (id/name/version must match index.js's exports)
  index.js                        # self-contained ES module (no bundler needed, no imports)
  style.css                       # scoped .geolibre-inat-* styles, theme-aware
  LICENSE                         # GNU GPL v2 (used under "or any later version")
marketplace/
  registry-entry.json             # entry for opengeos/geolibre-plugins
docs/
  installation.md                 # install from file, manifest URL or marketplace
  publishing.md                   # how to submit / update the marketplace entry
.github/                          # issue and pull request templates
CHANGELOG.md
CONTRIBUTING.md
LICENSE
README.md
```

## Installing it

- **Quickest (any GeoLibre build):** Settings → Manage Plugins → Settings →
  *Install from file* → zip `plugin.json`, `index.js` and `style.css` from
  `geolibre-inaturalist-extractor/` (see [docs/installation.md](https://github.com/Defani/Geolibre-Inaturalist-Extraction-Plugins/blob/main/docs/installation.md))
  and pick it, or
  point GeoLibre at a manifest URL serving `plugin.json` from wherever you
  host these files.
- **From the GeoLibre marketplace:** once the entry below is merged into
  [`opengeos/geolibre-plugins`](https://github.com/opengeos/geolibre-plugins),
  the plugin appears in GeoLibre's *Manage Plugins* dialog.

  ```json
  {
    "id": "geolibre-inaturalist-extractor",
    "name": "iNaturalist Extractor",
    "version": "1.5.0",
    "description": "Fetch georeferenced iNaturalist observations by map view or layer extent, with species, date, observer, quality-grade and advanced (taxon ID, place ID, photo license, project, annotation) filters, and a photo popup.",
    "author": "Defani Arman (Alfitriansyah)",
    "homepage": "https://github.com/Defani/Geolibre-Inaturalist-Extraction-Plugins",
    "manifestUrl": "plugins/geolibre-inaturalist-extractor/plugin.json",
    "categories": ["Data"],
    "minGeoLibreVersion": "3.0.0"
  }
  ```

## Notes / limitations

- Coordinates from iNaturalist's `geojson` field are already WGS84
  lon/lat, so no reprojection is needed (unlike the QGIS version of this
  extractor, which has to transform into the project CRS).
- "Active layer extent" reads whichever layer is currently selected in the
  Layers panel via `getSelectedLayerId()`; if nothing is selected, pick a
  layer from the dropdown that appears once "Active layer extent" is chosen.
- The iNaturalist `iconic_taxa=Animalia` filter is narrower than it looks:
  the API (and website) treat "Animalia" as *animals not covered by any
  other iconic taxon* (so mostly invertebrates other than molluscs, insects
  and arachnids), not literally every animal. This is iNaturalist's own
  behaviour, not something this plugin can change.
- **Place ID and Project are still limited by the Area** (the API ANDs every
  filter), so a place outside the current map view returns nothing. Tick
  *Ignore the Area* in the advanced section to search the whole place or
  project; it requires at least one other filter so it can't pull the latest
  observations from the entire world.
- A **photo license** filter only matches observations that have a photo under
  that license, so photo-less observations are excluded when it is set.
- Annotations, taxon IDs and place IDs are exact IDs from iNaturalist (see its
  "How to use iNaturalist Search URLs" help page); the annotation dropdowns
  cover the six most common controlled terms.
- The browser can't set a custom `User-Agent` header the way the QGIS
  plugin does, so requests go out with whatever the browser sends. Paging
  still respects the "small/medium batch" limit in the UI, and requests are
  spaced ~250 ms apart.
- The plugin declares `engines: ["maplibre"]` only — it uses `app.getMap()`
  directly for click/hover handling, which returns `null` on the Cesium
  globe or the Mapbox renderer.

## Credits, sources & references

Everything this plugin builds on, in one place. "Reviewed" gives the version
or date of the material that was actually read while developing it.

### Data and API — iNaturalist

| Source | Link | How it is used here |
|---|---|---|
| **iNaturalist** — the observations and photos themselves | <https://www.inaturalist.org> | All data comes from the public observations endpoint, `https://api.inaturalist.org/v1/observations`. Observations and photos belong to their contributors and the iNaturalist community. |
| **iNaturalist API Recommended Practices** | <https://www.inaturalist.org/pages/api+recommended+practices> | Basis for the "small-to-medium batches, not bulk scraping" warning in the panel and for fetching in pages of at most 200. The 2000-observation cap and the ~250 ms gap between pages are this plugin's own conservative limits. |
| **iNaturalistAPI** — source of the API server, including its OpenAPI request schema (reviewed v2.2.0; `package.json` declares MIT) | <https://github.com/inaturalist/iNaturalistAPI> · docs: <https://api.inaturalist.org/docs> | The parameter definitions in `openapi/schema/request/observations_search.js` were used to check every parameter this plugin sends: `quality_grade` (`casual`, `needs_id`, `research`), `photo_license` (seven lower-case CC values), `term_id` / `term_value_id` (integers; the value must be combined with a term), `project_id` (ID or slug), `place_id` and `taxon_id`. |
| **How to use iNaturalist Search URLs** — iNaturalist Help (reviewed 20 Sep 2026) | <https://help.inaturalist.org/en/support/solutions/articles/151000170738-how-to-use-inaturalist-search-urls> | Source of the annotation term and value IDs used in the *Annotation* dropdowns (Life stage = 1, Sex = 9, Flowers and fruits = 12, Leaves = 36, Alive or dead = 17, Evidence of presence = 22, and their values); of the lower-case `photo_license` convention; of how place, taxon and project IDs/slugs are found; and of the note that observations are licensed separately from the media they contain. |
| **How to use iNaturalist's Search URLs (wiki)** — iNaturalist Forum, the community wiki the Help page is based on | Part 1: <https://forum.inaturalist.org/t/how-to-use-inaturalists-search-urls-wiki-part-1-of-2/63> · Part 2 (annotations): <https://forum.inaturalist.org/t/how-to-use-inaturalists-search-urls-wiki-part-2-of-2/18792> | Background for the search parameters above. Part 2 is the annotations reference that rinat itself points to. |

### Feature reference — rinat (R package)

**rinat: Access 'iNaturalist' Data Through APIs** — reviewed version 0.1.10
(2025-08-31). Authors: Vijay Barve, Edmund Hart and Stéphane Guillou
(maintainer). Licensed MIT + file LICENSE (Copyright 2014 Edmund Hart).

- Website: <https://docs.ropensci.org/rinat/>
- Source: <https://github.com/ropensci/rinat>
- CRAN: <https://CRAN.R-project.org/package=rinat>

This plugin does not include or run any rinat code. rinat was the functional
reference for which filters to expose and how they map to the API:

| rinat argument / function | Plugin control |
|---|---|
| `get_inat_obs(query = ...)` | Keyword search (`q`) |
| `get_inat_obs(taxon_name = ...)` | Species / taxon name (`taxon_name`) |
| `get_inat_obs(taxon_id = ...)` | Advanced → Taxon ID (`taxon_id`) |
| `get_inat_obs(place_id = ...)` | Advanced → Place ID (`place_id`) |
| `get_inat_obs(quality = ...)` | Quality grade dropdown (`quality_grade`) |
| `get_inat_obs(annotation = c(term, value))` | Advanced → Annotation (`term_id`, `term_value_id`) |
| `get_inat_obs(photo_license = ...)` | Advanced → Photo license (`photo_license`) |
| `get_inat_obs(year / month / day)` | Date range (`d1` / `d2`) |
| `get_inat_obs(bounds = ...)` | Area: map view or layer extent (bounding box) |
| `get_inat_obs(maxresults = ...)` | Max observations |
| `get_inat_obs_user()` | Observer filter (`user_login[]`) |
| `get_inat_obs_project()` | Advanced → Project (`project_id`) |

rinat's own changelog dates these features: `place_id` (0.1.6), `annotation`
(0.1.9) and `photo_license` (0.1.10). Its documentation also recommends
`quality = "research"` for more reliable data, which is why *Research grade* is
one of the dropdown choices.

### Behaviour reference — QGIS "iNaturalist Extractor" plugin

**iNaturalist Extractor (QGIS plugin)** by **Jules Grillot** — reviewed version
1.1.3. Licensed **GPL-2.0-or-later**.

- Repository: <https://framagit.org/JulesGrillot/plugin_inaturalist_extractor/>
- Documentation: <https://plugin-inaturalist-extractor-52906a.frama.io/>

This plugin re-implements the QGIS plugin's workflow for GeoLibre and follows
it closely: extraction limited to an extent (the QGIS plugin offers a drawn
extent or a layer's extent; this one offers the current map view or a layer's
extent); the request shape (`order_by=id`, `order=desc`, `spam=false`, paged
bounding-box queries); the 200-per-page limit; the API-recommended-practices
warning; the "verifiable only" option (now the quality-grade dropdown); up to
three photos per observation (shown here in a popup); and the "data provided
by iNaturalist" credit. No files from the QGIS plugin are included in this
repository. Because the behaviour follows it this closely, this repository
uses the same license family — see [License](#license).

### Platform, plugin API and publishing docs — GeoLibre

| Source | Link | How it is used here |
|---|---|---|
| **GeoLibre** — the host application | <https://github.com/opengeos/GeoLibre> | The app this plugin runs in. |
| **GeoLibre Plugin API** | <https://geolibre.app/plugin-api/> · <https://github.com/opengeos/GeoLibre/blob/main/docs/plugin-api.md> | The contract used by `index.js`: `activate` / `deactivate`, `registerRightPanel` and `render(container)` (the plugin must fill the container itself), `addMapControl`, `getMap`, `getViewBounds`, `listLayers`, `getSelectedLayerId`, `getLayerFeatures`, `addGeoJsonLayer`, and the `engines` field. |
| **GeoLibre plugin marketplace** — *Registry format* and *Develop a plugin* docs | <https://github.com/opengeos/geolibre-plugins> · registry: <https://plugins.geolibre.app/plugin-registry.json> | The `plugin.json` manifest shape, the registry entry format shown under [Installing it](#installing-it), and the publishing workflow (bump `version` in both `plugin.json` and the registry entry, pull request, CI preview). |
| **geolibre-plugin-template** | <https://github.com/opengeos/geolibre-plugin-template> | The recommended starting point for GeoLibre plugins; its panel example documents `registerRightPanel`. |
| **geolibre-nasa-opera** by Qiusheng Wu (reviewed v0.3.1; MIT, Copyright 2026 Qiusheng Wu) | <https://github.com/opengeos/geolibre-nasa-opera> | Consulted as a working example of a GeoLibre plugin that registers a docked right-sidebar panel and falls back to a floating panel. No files from it are included here. |

### Map engine

**MapLibre GL JS** — <https://maplibre.org>. GeoLibre's map engine; the plugin
declares `engines: ["maplibre"]` and uses `queryRenderedFeatures` and
`project` for click detection and the popup. It is provided by the host, so
nothing is bundled.

### Using the data and photos

Each observation, and each photo, carries its own license chosen by the
observer — observations are licensed separately from the media they contain,
and by default the API returns observations regardless of license. The popup
shows the photographer attribution when iNaturalist provides it. If you reuse
or redistribute photos, use the **Photo license** filter and check the license
of each item first. The panel credits "the iNaturalist community" for data and
photos.

## License

Copyright (c) 2026 Defani Arman (Alfitriansyah).

This program is free software; you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software
Foundation; either version 2 of the License, or (at your option) any later
version. It is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE. See the [LICENSE](https://github.com/Defani/Geolibre-Inaturalist-Extraction-Plugins/blob/main/LICENSE) file for the full text.

The QGIS plugin this one follows is GPL-2.0-or-later, so this repository uses
the same terms. The other projects listed above (rinat, iNaturalistAPI,
geolibre-nasa-opera) are MIT-licensed and are referenced only; none of their
code is included.

The icons (raven and the sidebar section icons) are from Google's [Material
Symbols](https://fonts.google.com/icons), licensed under Apache-2.0, and are
inlined as SVG paths.

## Disclaimer

This is an independent project. It is not affiliated with or endorsed by
iNaturalist, the rinat authors, GeoLibre, or the author of the QGIS plugin.
