/**
* Sends a message to the backend.
* @example
* ```typescript
* import { invoke } from '@tauri-apps/api/core';
* await invoke('login', { user: 'tauri', password: 'poiwe3h4r5ip3yrhtew9ty' });
* ```
*
* @param cmd The command name.
* @param args The optional arguments to pass to the command.
* @param options The request options.
* @return A promise resolving or rejecting to the backend response.
*
* @since 1.0.0
*/
async function invoke(cmd, args = {}, options) {
	return window.__TAURI_INTERNALS__.invoke(cmd, args, options);
}
function isTauri() {
	return !!(globalThis || window).isTauri;
}
//#endregion
//#region node_modules/@tauri-apps/plugin-opener/dist-js/index.js
/**
* Open files and URLs using their default application.
*
* ## Security
*
* This API has a scope configuration that forces you to restrict the files and urls to be opened.
*
* ### Restricting access to the {@link open | `open`} API
*
* On the configuration object, `open: true` means that the {@link open} API can be used with any URL,
* as the argument is validated with the `^((mailto:\w+)|(tel:\w+)|(https?://\w+)).+` regex.
* You can change that regex by changing the boolean value to a string, e.g. `open: ^https://github.com/`.
*
* @module
*/
/**
* Opens a url with the system's default app, or the one specified with {@linkcode openWith}.
*
* @example
* ```typescript
* import { openUrl } from '@tauri-apps/plugin-opener';
*
* // opens the given URL on the default browser:
* await openUrl('https://github.com/tauri-apps/tauri');
* // opens the given URL using `firefox`:
* await openUrl('https://github.com/tauri-apps/tauri', 'firefox');
* ```
*
* @param url The URL to open.
* @param openWith The app to open the URL with. If not specified, defaults to the system default application for the specified url type.
* On mobile, `openWith` can be provided as `inAppBrowser` to open the URL in an in-app browser. Otherwise, it will open the URL in the system default browser.
*
* @since 2.0.0
*/
async function openUrl(url, openWith) {
	await invoke("plugin:opener|open_url", {
		url,
		with: openWith
	});
}
//#endregion
//#region src/lib/opera/cmr.ts
var CMR_BASE = "https://cmr.earthdata.nasa.gov/search";
/** In-memory cache of short_name -> concept_id to avoid repeat lookups. */
var conceptIdCache = /* @__PURE__ */ new Map();
/**
* Resolve a collection `concept_id` from its short_name via the CMR collections
* endpoint, caching the result. titiler-cmr keys off `concept_id`, not
* short_name.
*/
async function resolveConceptId(shortName) {
	const cached = conceptIdCache.get(shortName);
	if (cached) return cached;
	const url = `${CMR_BASE}/collections.umm_json?short_name=${encodeURIComponent(shortName)}&page_size=1`;
	const res = await fetch(url, { headers: { Accept: "application/json" } });
	if (!res.ok) throw new Error(`CMR collection lookup failed (${res.status})`);
	const conceptId = (await res.json()).items?.[0]?.meta?.["concept-id"];
	if (!conceptId) throw new Error(`No CMR collection found for short_name "${shortName}"`);
	conceptIdCache.set(shortName, conceptId);
	return conceptId;
}
/**
* Search OPERA granules. Returns parsed granules, a footprint
* `FeatureCollection` ready for `app.addGeoJsonLayer`, and the combined bounds.
*/
async function searchGranules(params) {
	const query = new URLSearchParams();
	query.set("short_name", params.shortName);
	query.set("page_size", String(params.count ?? 50));
	if (params.bbox) query.set("bounding_box", params.bbox.join(","));
	if (params.start && params.end) query.set("temporal", `${params.start}T00:00:00Z,${params.end}T23:59:59Z`);
	const url = `${CMR_BASE}/granules.umm_json?${query.toString()}`;
	const res = await fetch(url, { headers: { Accept: "application/json" } });
	if (!res.ok) throw new Error(`CMR granule search failed (${res.status})`);
	const granules = ((await res.json()).items ?? []).map(parseGranule);
	return {
		granules,
		featureCollection: {
			type: "FeatureCollection",
			features: granules.filter((g) => g.geometry).map((g) => ({
				type: "Feature",
				geometry: g.geometry,
				properties: {
					_operaGranuleId: g.id,
					id: g.id,
					beginDate: g.beginDate ?? "",
					endDate: g.endDate ?? "",
					links: g.dataLinks.length
				}
			}))
		},
		bounds: combinedBounds(granules)
	};
}
var RASTER_EXT = /\.(tiff?|h5|hdf5?|hdf)$/i;
/** Parse one UMM-G granule item into an {@link OperaGranule}. */
function parseGranule(item) {
	const umm = item.umm ?? {};
	const id = umm.GranuleUR ?? item.meta?.["native-id"] ?? item.meta?.["concept-id"] ?? "";
	const range = umm.TemporalExtent?.RangeDateTime;
	const geo = umm.SpatialExtent?.HorizontalSpatialDomain?.Geometry;
	let geometry = null;
	let bbox;
	const rect = geo?.BoundingRectangles?.[0];
	const poly = geo?.GPolygons?.[0]?.Boundary?.Points;
	if (rect) {
		const { WestBoundingCoordinate: w, SouthBoundingCoordinate: s } = rect;
		const { EastBoundingCoordinate: e, NorthBoundingCoordinate: n } = rect;
		bbox = [
			w,
			s,
			e,
			n
		];
		geometry = {
			type: "Polygon",
			coordinates: [[
				[w, s],
				[e, s],
				[e, n],
				[w, n],
				[w, s]
			]]
		};
	} else if (poly && poly.length >= 3) {
		const ring = poly.map((p) => [p.Longitude, p.Latitude]);
		const first = ring[0];
		const last = ring[ring.length - 1];
		if (first[0] !== last[0] || first[1] !== last[1]) ring.push(first);
		geometry = {
			type: "Polygon",
			coordinates: [ring]
		};
		bbox = ringBounds(ring);
	}
	const dataLinks = (umm.RelatedUrls ?? []).map((u) => u.URL ?? "").filter((u) => RASTER_EXT.test(u));
	return {
		id,
		conceptId: item.meta?.["collection-concept-id"],
		beginDate: range?.BeginningDateTime,
		endDate: range?.EndingDateTime,
		bbox,
		geometry,
		dataLinks
	};
}
/** Bounds of a coordinate ring as `[w, s, e, n]`. */
function ringBounds(ring) {
	let w = Infinity;
	let s = Infinity;
	let e = -Infinity;
	let n = -Infinity;
	for (const [lon, lat] of ring) {
		if (lon < w) w = lon;
		if (lon > e) e = lon;
		if (lat < s) s = lat;
		if (lat > n) n = lat;
	}
	return [
		w,
		s,
		e,
		n
	];
}
/** Combine all granule bboxes into one `[w, s, e, n]`, or undefined if none. */
function combinedBounds(granules) {
	const boxes = granules.map((g) => g.bbox).filter((b) => !!b);
	if (boxes.length === 0) return void 0;
	return boxes.reduce((acc, b) => [
		Math.min(acc[0], b[0]),
		Math.min(acc[1], b[1]),
		Math.max(acc[2], b[2]),
		Math.max(acc[3], b[3])
	], [
		Infinity,
		Infinity,
		-Infinity,
		-Infinity
	]);
}
var BAND_PATTERNS = [
	/_(B\d+_[A-Za-z0-9-]+)\.tiff?$/i,
	/_([VH]{2})\.tiff?$/i,
	/_([A-Z][A-Za-z0-9-]+)\.tiff?$/
];
/**
* Extract the band/layer token from a data link filename. Ports the QGIS
* plugin's `_get_layer_band` regexes.
*/
function getLayerBand(url) {
	const name = url.split("/").pop() ?? url;
	for (const pattern of BAND_PATTERNS) {
		const match = name.match(pattern);
		if (match) return match[1];
	}
	const parts = name.replace(RASTER_EXT, "").split("_");
	return parts[parts.length - 1] || name;
}
/**
* Build the selectable band list for a granule, de-duplicated by band token.
* CMR commonly lists each asset twice (an HTTPS link and an S3 link), so the
* raw data links would otherwise yield duplicate entries; the first (HTTPS)
* occurrence wins.
*/
function granuleBands(granule) {
	const seen = /* @__PURE__ */ new Set();
	const bands = [];
	for (const url of granule.dataLinks) {
		const token = getLayerBand(url);
		if (seen.has(token)) continue;
		seen.add(token);
		bands.push({
			token,
			url,
			label: token
		});
	}
	return bands;
}
//#endregion
//#region src/lib/opera/colormaps.ts
/**
* Categorical colormaps for OPERA layers.
*
* titiler-cmr's multi-asset rasterio backend returns the raw class values and
* does not apply a COG's embedded color table, so categorical layers (e.g. the
* DSWx water classification) render as grayscale unless we pass an explicit
* `colormap`. These map class value -> [R, G, B, A].
*/
/**
* OPERA DSWx WTR / BWTR / WTR-1 / WTR-2 water-classification colormap.
*
* Class colors follow the official DSWx-HLS legend (white = not water, blue =
* open water, lightskyblue = partial surface water, cyan = snow/ice, grey =
* cloud/cloud shadow). "Not water" and fill are made transparent so the water
* classes overlay the basemap instead of painting the land solid white.
*/
var DSWX_WTR_COLORMAP = {
	"0": [
		0,
		0,
		0,
		0
	],
	"1": [
		0,
		0,
		255,
		255
	],
	"2": [
		135,
		206,
		250,
		255
	],
	"252": [
		0,
		255,
		255,
		255
	],
	"253": [
		128,
		128,
		128,
		255
	],
	"254": [
		0,
		0,
		128,
		255
	],
	"255": [
		0,
		0,
		0,
		0
	]
};
/** Human-readable labels for DSWx WTR class values, used in stats breakdowns. */
var DSWX_WTR_CLASS_LABELS = {
	"0": "Not water",
	"1": "Open water",
	"2": "Partial surface water",
	"252": "Snow/ice",
	"253": "Cloud/cloud shadow",
	"254": "Ocean masked",
	"255": "Fill"
};
/**
* Return an explicit titiler `colormap` (JSON string) for a categorical band,
* or `undefined` to let the caller fall back to rescale/grayscale rendering.
*/
function colormapForBand(shortName, band) {
	if (!band) return void 0;
	if (/DSWX/i.test(shortName) && /WTR/i.test(band)) return JSON.stringify(DSWX_WTR_COLORMAP);
}
/**
* Whether a band holds discrete class values, so zonal statistics should
* request a per-class (categorical) histogram rather than continuous bins.
*/
function isCategoricalBand(shortName, band) {
	if (!band) return false;
	if (/DSWX/i.test(shortName) && /WTR/i.test(band)) return true;
	if (/DIST/i.test(shortName) && /STATUS/i.test(band)) return true;
	return false;
}
/** Whether a band is a DSWx water-classification layer (open-water areas). */
function isDswxWaterBand(shortName, band) {
	return !!band && /DSWX/i.test(shortName) && /WTR/i.test(band);
}
//#endregion
//#region src/lib/opera/products.ts
var OPERA_PRODUCTS = [
	{
		shortName: "OPERA_L3_DSWX-HLS_V1",
		title: "Dynamic Surface Water Extent from Harmonized Landsat Sentinel-2 (Version 1)",
		shortTitle: "DSWX-HLS",
		description: "Surface water extent derived from HLS data",
		render: {
			backend: "rasterio",
			bands: ["B01_WTR"],
			bandsRegex: "B[0-9]{2}_[A-Z]+"
		}
	},
	{
		shortName: "OPERA_L3_DSWX-S1_V1",
		title: "Dynamic Surface Water Extent from Sentinel-1 (Version 1)",
		shortTitle: "DSWX-S1",
		description: "Surface water extent derived from Sentinel-1 SAR data",
		render: {
			backend: "rasterio",
			bands: ["B01_WTR"],
			bandsRegex: "B[0-9]{2}_[A-Z]+"
		}
	},
	{
		shortName: "OPERA_L3_DIST-ALERT-HLS_V1",
		title: "Land Surface Disturbance Alert from HLS (Version 1)",
		shortTitle: "DIST-ALERT",
		description: "Near real-time disturbance alerts",
		render: {
			backend: "rasterio",
			bands: ["VEG-DIST-STATUS"],
			bandsRegex: "[A-Z-]+",
			rescale: "0,4"
		}
	},
	{
		shortName: "OPERA_L3_DIST-ANN-HLS_V1",
		title: "Land Surface Disturbance Annual from HLS (Version 1)",
		shortTitle: "DIST-ANN",
		description: "Annual land surface disturbance product",
		render: {
			backend: "rasterio",
			bands: ["VEG-DIST-STATUS"],
			bandsRegex: "[A-Z-]+",
			rescale: "0,4"
		}
	},
	{
		shortName: "OPERA_L2_RTC-S1_V1",
		title: "Radiometric Terrain Corrected SAR Backscatter from Sentinel-1 (Version 1)",
		shortTitle: "RTC-S1",
		description: "Analysis-ready SAR backscatter data",
		render: {
			backend: "rasterio",
			bands: ["VV"],
			bandsRegex: "(VV|VH|HH|HV)",
			rescale: "0,0.4",
			colormapName: "gray"
		}
	},
	{
		shortName: "OPERA_L2_RTC-S1-STATIC_V1",
		title: "RTC-S1 Static Layers (Version 1)",
		shortTitle: "RTC-S1-STATIC",
		description: "Static layers for RTC-S1 product",
		render: {
			backend: "rasterio",
			bandsRegex: "[A-Za-z_]+"
		}
	},
	{
		shortName: "OPERA_L2_CSLC-S1_V1",
		title: "Coregistered Single-Look Complex from Sentinel-1 (Version 1)",
		shortTitle: "CSLC-S1",
		description: "SLC data coregistered to a common reference",
		render: {
			backend: "rasterio",
			bandsRegex: "[A-Za-z_]+"
		}
	},
	{
		shortName: "OPERA_L2_CSLC-S1-STATIC_V1",
		title: "CSLC-S1 Static Layers (Version 1)",
		shortTitle: "CSLC-S1-STATIC",
		description: "Static layers for CSLC-S1 product",
		render: {
			backend: "rasterio",
			bandsRegex: "[A-Za-z_]+"
		}
	}
];
/** Look up a product by its CMR short_name. */
function getProduct(shortName) {
	return OPERA_PRODUCTS.find((p) => p.shortName === shortName);
}
/**
* Default render hints for a band, used to auto-populate the Rendering fields so
* the user sees what will be applied and can tweak it. Categorical DSWx water
* bands return blanks (their built-in class colormap applies); continuous bands
* (DEM, confidence, SAR backscatter) get a sensible stretch + colormap so they
* are not rendered flat.
*/
function bandRenderDefaults(shortName, band) {
	const empty = {
		rescale: "",
		colormapName: ""
	};
	if (!band) return empty;
	const b = band.toUpperCase();
	if (/DSWX/i.test(shortName) && /WTR/.test(b)) return empty;
	if (/DEM/.test(b)) return {
		rescale: "0,3000",
		colormapName: "terrain"
	};
	if (/^(VV|VH|HH|HV)$/.test(b)) return {
		rescale: "0,0.4",
		colormapName: "gray"
	};
	if (/CONF/.test(b)) return {
		rescale: "0,100",
		colormapName: "viridis"
	};
	const product = getProduct(shortName);
	return {
		rescale: product?.render.rescale ?? "",
		colormapName: product?.render.colormapName ?? ""
	};
}
//#endregion
//#region src/lib/opera/titiler.ts
var DEFAULT_TITILER_CMR_ENDPOINT = "https://staging.openveda.cloud/api/titiler-cmr";
/** TileMatrixSet id used for the XYZ tile grid. */
var TILE_MATRIX_SET = "WebMercatorQuad";
/**
* Build the titiler-cmr `tilejson.json` request URL (current API).
*
* Path: `{endpoint}/{backend}/WebMercatorQuad/tilejson.json` (backend is a path
* segment). Query params for the rasterio backend:
* `collection_concept_id`, `assets` (repeatable), `assets_regex`, `temporal`,
* `rescale`, `colormap_name`.
*
* Note: the older leafmap-style names (`concept_id`, `bands`, `bands_regex`,
* `datetime` on `{endpoint}/WebMercatorQuad/tilejson.json`) still work but only
* via a 301 redirect, so we target the canonical form directly. Verified live
* against the hosted staging endpoint.
*/
function buildTileJsonUrl(params) {
	const base = params.endpoint.replace(/\/+$/, "");
	const query = new URLSearchParams();
	query.set("collection_concept_id", params.conceptId);
	if (params.granuleUr) query.set("granule_ur", params.granuleUr);
	if (params.datetime) query.set("temporal", params.datetime);
	for (const band of params.bands ?? []) query.append("assets", band);
	if (params.bandsRegex) query.set("assets_regex", params.bandsRegex);
	if (params.colormap) query.set("colormap", params.colormap);
	else {
		if (params.rescale) query.set("rescale", params.rescale);
		if (params.colormapName) query.set("colormap_name", params.colormapName);
	}
	return `${base}/${params.backend}/${TILE_MATRIX_SET}/tilejson.json?${query.toString()}`;
}
/**
* Read the tile pixel size from a returned XYZ tile template's `tilesize` query
* param (titiler-cmr defaults to 512), falling back to 256.
*/
function tileSizeFromTemplate(template) {
	const match = template.match(/[?&]tilesize=(\d+)/);
	return match ? parseInt(match[1], 10) : 256;
}
/**
* Build a titiler-cmr `/point/{lon},{lat}` request URL.
*
* Path: `{endpoint}/{backend}/point/{lon},{lat}` (lon first). Reuses the same
* CMR query params as the tile request (`collection_concept_id`, `granule_ur`,
* `temporal`, `assets`, `assets_regex`) so a click reads exactly the
* granule/band being displayed. Verified live against the staging endpoint.
*/
function buildPointUrl(params) {
	const base = params.endpoint.replace(/\/+$/, "");
	const query = new URLSearchParams();
	query.set("collection_concept_id", params.conceptId);
	if (params.granuleUr) query.set("granule_ur", params.granuleUr);
	if (params.datetime) query.set("temporal", params.datetime);
	for (const band of params.bands ?? []) query.append("assets", band);
	if (params.bandsRegex) query.set("assets_regex", params.bandsRegex);
	return `${base}/${params.backend}/point/${params.lon},${params.lat}?${query.toString()}`;
}
/** Fetch a point pixel-value document from titiler-cmr. */
async function fetchPoint(url) {
	const res = await fetch(url, { headers: { Accept: "application/json" } });
	if (!res.ok) throw new Error(`titiler-cmr point request failed (${res.status})`);
	const json = await res.json();
	return {
		coordinates: json.coordinates,
		assets: (json.assets ?? []).map((asset) => ({
			name: asset.name,
			values: asset.values,
			bandNames: asset.band_names,
			bandDescriptions: asset.band_descriptions ?? void 0
		}))
	};
}
/**
* Build a titiler-cmr `/statistics` request URL.
*
* Path: `{endpoint}/{backend}/statistics` (POST a GeoJSON Feature as the AOI).
* Reuses the same CMR query params as the tile request, plus optional
* `categorical`. Verified live against the staging endpoint.
*/
function buildStatisticsUrl(params) {
	const base = params.endpoint.replace(/\/+$/, "");
	const query = new URLSearchParams();
	query.set("collection_concept_id", params.conceptId);
	if (params.granuleUr) query.set("granule_ur", params.granuleUr);
	if (params.datetime) query.set("temporal", params.datetime);
	for (const band of params.bands ?? []) query.append("assets", band);
	if (params.bandsRegex) query.set("assets_regex", params.bandsRegex);
	if (params.categorical) query.set("categorical", "true");
	return `${base}/${params.backend}/statistics?${query.toString()}`;
}
/** Coerce an unknown JSON value to a finite number, or NaN. */
function toNum(value) {
	return typeof value === "number" && Number.isFinite(value) ? value : NaN;
}
/** Coerce to a finite number, or undefined when absent/non-finite. */
function toOptNum(value) {
	return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
/**
* POST a GeoJSON AOI to titiler-cmr `/statistics` and parse the per-band stats.
*
* `feature` is a GeoJSON Feature (or FeatureCollection); titiler-cmr echoes it
* back with `properties.statistics` keyed by band name (e.g. `b1`).
*/
async function fetchStatistics(url, feature) {
	const res = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json"
		},
		body: JSON.stringify(feature)
	});
	if (!res.ok) throw new Error(`titiler-cmr statistics request failed (${res.status})`);
	const raw = (await res.json()).properties?.statistics ?? {};
	const bands = {};
	for (const [name, s] of Object.entries(raw)) bands[name] = {
		min: toNum(s.min),
		max: toNum(s.max),
		mean: toNum(s.mean),
		std: toNum(s.std),
		median: toOptNum(s.median),
		count: toNum(s.count),
		validPixels: toOptNum(s.valid_pixels),
		validPercent: toOptNum(s.valid_percent),
		histogram: Array.isArray(s.histogram) ? s.histogram : void 0,
		description: typeof s.description === "string" ? s.description : void 0
	};
	return { bands };
}
/** Fetch a TileJSON document from titiler-cmr. */
async function fetchTileJson(url) {
	const res = await fetch(url, { headers: { Accept: "application/json" } });
	if (!res.ok) throw new Error(`titiler-cmr tilejson request failed (${res.status})`);
	const json = await res.json();
	if (!json.tiles || json.tiles.length === 0) throw new Error("titiler-cmr returned no tiles for this query");
	return json;
}
//#endregion
//#region src/lib/core/OperaControl.ts
var PANEL_CLASS = "plugin-control-panel opera-panel";
var HL_SRC = "opera-hl-src";
var HL_FILL = "opera-hl-fill";
var HL_LINE = "opera-hl-line";
/**
* Named titiler colormaps offered in the Rendering section. Empty string means
* "use the band/product default" (e.g. the DSWx categorical colormap).
*/
var COLORMAP_NAMES = [
	"",
	"viridis",
	"terrain",
	"gist_earth",
	"gray",
	"plasma",
	"magma",
	"inferno",
	"cividis",
	"blues",
	"greens",
	"reds",
	"rdylgn",
	"spectral",
	"jet",
	"ocean"
];
function defaultDateRange() {
	const now = /* @__PURE__ */ new Date();
	const end = now.toISOString().slice(0, 10);
	const prior = new Date(now);
	prior.setMonth(prior.getMonth() - 1);
	return {
		start: prior.toISOString().slice(0, 10),
		end
	};
}
/**
* MapLibre control hosting the NASA OPERA search + display UI.
*
* Workflow: pick a product, set a bbox + date range, Search (CMR granule
* search, public) to draw footprints and fill the results table, select a
* granule + band, then Display to render its COG tiles via titiler-cmr.
*/
var OperaControl = class {
	_map;
	_mapContainer;
	_container;
	_panel;
	_status;
	_tableBody;
	_bandSelect;
	_rescaleInput;
	_colormapSelect;
	_displayBtn;
	_downloadBandBtn;
	_downloadAllBtn;
	_options;
	_state;
	_granules = [];
	_view = [];
	_selectedIds = /* @__PURE__ */ new Set();
	_activeGranule = null;
	_anchorId = null;
	_sortKey = null;
	_sortDir = 1;
	_bands = [];
	_registeredLayerIds = [];
	_resizeHandler = null;
	_mapResizeHandler = null;
	_drawing = false;
	_drawBtn;
	_drawRect;
	_drawStart;
	_drawStartLngLat;
	_inspecting = false;
	_inspectBtn;
	_inspectPopup;
	_inspectLngLat;
	_inspectMoveHandler = null;
	_statsBtn;
	_statsPanel;
	constructor(options = {}) {
		this._options = options;
		const { start, end } = defaultDateRange();
		this._state = {
			collapsed: options.collapsed ?? true,
			panelWidth: options.panelWidth ?? 340,
			product: OPERA_PRODUCTS[0]?.shortName ?? "",
			bbox: "",
			start,
			end,
			count: 50,
			rescale: "",
			colormapName: "",
			endpoint: DEFAULT_TITILER_CMR_ENDPOINT
		};
	}
	onAdd(map) {
		this._map = map;
		this._mapContainer = map.getContainer();
		this._container = this._createContainer();
		this._panel = this._createPanel();
		this._mapContainer.appendChild(this._panel);
		this._setupEventListeners();
		if (!this._state.collapsed) {
			this._panel.classList.add("expanded");
			requestAnimationFrame(() => this._updatePanelPosition());
		}
		return this._container;
	}
	onRemove() {
		if (this._resizeHandler) {
			window.removeEventListener("resize", this._resizeHandler);
			this._resizeHandler = null;
		}
		if (this._mapResizeHandler && this._map) {
			this._map.off("resize", this._mapResizeHandler);
			this._mapResizeHandler = null;
		}
		if (this._drawing) this._endDraw();
		this._stopInspect();
		this._removeInspectPopup();
		if (this._map) {
			this._map.off("click", this._onMapClick);
			this._map.off("mousemove", this._onMapMouseMove);
		}
		this._removeHighlightLayers();
		this._clearLayers();
		this._panel?.parentNode?.removeChild(this._panel);
		this._container?.parentNode?.removeChild(this._container);
		this._map = void 0;
		this._mapContainer = void 0;
		this._container = void 0;
		this._panel = void 0;
		this._status = void 0;
		this._tableBody = void 0;
		this._bandSelect = void 0;
		this._rescaleInput = void 0;
		this._colormapSelect = void 0;
		this._displayBtn = void 0;
		this._downloadBandBtn = void 0;
		this._downloadAllBtn = void 0;
		this._inspectBtn = void 0;
		this._statsBtn = void 0;
		this._statsPanel = void 0;
	}
	getState() {
		this._readForm();
		return { ...this._state };
	}
	setState(next) {
		this._state = {
			...this._state,
			...next
		};
	}
	toggle() {
		this._state.collapsed = !this._state.collapsed;
		if (!this._panel) return;
		if (this._state.collapsed) this._panel.classList.remove("expanded");
		else {
			this._panel.classList.add("expanded");
			this._updatePanelPosition();
		}
	}
	collapse() {
		if (!this._state.collapsed) this.toggle();
	}
	expand() {
		if (this._state.collapsed) this.toggle();
	}
	_registerLayer(layer) {
		try {
			this._options.registerLayer?.(layer);
			if (!this._registeredLayerIds.includes(layer.id)) this._registeredLayerIds.push(layer.id);
		} catch {
			this._setStatus("Failed to add layer.");
		}
	}
	_clearLayers() {
		const ids = [...this._registeredLayerIds];
		this._registeredLayerIds = [];
		for (const id of ids) try {
			this._options.unregisterLayer?.(id);
		} catch {}
	}
	async _onSearch() {
		this._readForm();
		const product = getProduct(this._state.product);
		if (!product) {
			this._setStatus("Select a product first.");
			return;
		}
		const bbox = this._currentBBox();
		this._setStatus("Searching CMR…");
		try {
			const result = await searchGranules({
				shortName: product.shortName,
				bbox,
				start: this._state.start || void 0,
				end: this._state.end || void 0,
				count: this._state.count
			});
			this._granules = result.granules;
			this._renderResults();
			if (result.featureCollection.features.length > 0) this._options.addGeoJsonLayer?.(`OPERA ${product.shortTitle} Footprints (${result.granules.length})`, result.featureCollection);
			if (result.bounds) this._options.fitBounds?.(result.bounds);
			this._setStatus(result.granules.length > 0 ? `Found ${result.granules.length} granule(s).` : "No granules found for this query.");
		} catch (err) {
			this._setStatus(`Search failed: ${err instanceof Error ? err.message : String(err)}`);
		}
	}
	async _onDisplay() {
		const product = getProduct(this._state.product);
		const selected = this._granules.filter((g) => this._selectedIds.has(g.id));
		if (!product || selected.length === 0) {
			this._setStatus("Select a granule first.");
			return;
		}
		const band = this._bandSelect?.value || product.render.bands?.[0];
		const userRescale = this._state.rescale.trim();
		const userColormap = this._state.colormapName.trim();
		const categorical = userColormap ? void 0 : colormapForBand(product.shortName, band);
		this._setStatus(`Requesting ${selected.length} granule(s) from titiler-cmr…`);
		try {
			const conceptId = selected[0].conceptId ?? await resolveConceptId(product.shortName);
			let ok = 0;
			await Promise.all(selected.map(async (granule) => {
				const url = buildTileJsonUrl({
					endpoint: this._state.endpoint || "https://staging.openveda.cloud/api/titiler-cmr",
					conceptId,
					backend: product.render.backend,
					granuleUr: granule.id,
					bands: band ? [band] : product.render.bands,
					bandsRegex: product.render.bandsRegex,
					rescale: userRescale || product.render.rescale,
					colormapName: userColormap || product.render.colormapName,
					colormap: categorical
				});
				try {
					const tilejson = await fetchTileJson(url);
					const tileUrl = tilejson.tiles[0];
					const layerId = `opera-cog-${slug(granule.id)}-${slug(band ?? "band")}`;
					this._registerLayer({
						id: layerId,
						name: `OPERA ${product.shortTitle} ${band ?? ""} — ${granule.id}`.trim(),
						type: "raster",
						source: {
							type: "raster",
							tiles: [tileUrl],
							tileSize: tileSizeFromTemplate(tileUrl),
							...tilejson.minzoom != null ? { minzoom: tilejson.minzoom } : {},
							...tilejson.maxzoom != null ? { maxzoom: tilejson.maxzoom } : {}
						},
						nativeLayerIds: [],
						opacity: 1,
						metadata: {
							sourceKind: "opera-titiler-cmr",
							granuleId: granule.id
						}
					});
					ok++;
				} catch {}
			}));
			const bounds = this._combinedBounds(selected);
			if (bounds) this._options.fitBounds?.(bounds);
			this._setStatus(ok === selected.length ? `Displayed ${ok} granule(s).` : `Displayed ${ok}/${selected.length} granule(s).`);
		} catch (err) {
			this._setStatus(`Display failed: ${err instanceof Error ? err.message : String(err)}`);
		}
	}
	/**
	* Update the selection from a row/footprint click, honoring modifier keys:
	* Ctrl/Cmd toggles, Shift selects a contiguous range from the anchor, plain
	* click selects just that granule.
	*/
	_applySelection(granule, opts = {}) {
		const id = granule.id;
		if (opts.range && this._anchorId) {
			const order = this._view.map((g) => g.id);
			const a = order.indexOf(this._anchorId);
			const b = order.indexOf(id);
			if (a >= 0 && b >= 0) {
				const [lo, hi] = a <= b ? [a, b] : [b, a];
				this._selectedIds = new Set(order.slice(lo, hi + 1));
			} else {
				this._selectedIds = new Set([id]);
				this._anchorId = id;
			}
		} else if (opts.toggle) {
			if (this._selectedIds.has(id)) this._selectedIds.delete(id);
			else this._selectedIds.add(id);
			this._anchorId = id;
		} else {
			this._selectedIds = new Set([id]);
			this._anchorId = id;
		}
		this._activeGranule = granule;
		this._refreshSelectionUI(opts.scroll ? id : void 0);
	}
	/** Sync row highlight, band list, Display button, and footprint highlight. */
	_refreshSelectionUI(scrollToId) {
		if (this._tableBody) for (const node of Array.from(this._tableBody.children)) {
			const row = node;
			const id = row.dataset.granuleId ?? "";
			row.classList.toggle("selected", this._selectedIds.has(id));
			if (scrollToId && id === scrollToId) row.scrollIntoView({ block: "nearest" });
		}
		this._bands = this._activeGranule ? granuleBands(this._activeGranule) : [];
		this._populateBands();
		const hasSelection = this._selectedIds.size > 0;
		const hasBand = this._bands.length > 0;
		if (this._displayBtn) this._displayBtn.disabled = !hasSelection || !hasBand;
		if (this._downloadBandBtn) this._downloadBandBtn.disabled = !hasSelection || !hasBand;
		if (this._downloadAllBtn) this._downloadAllBtn.disabled = !hasSelection;
		if (this._inspectBtn) this._inspectBtn.disabled = !hasSelection || !hasBand;
		if (this._statsBtn) this._statsBtn.disabled = !hasSelection || !hasBand;
		if (this._inspecting && (!hasSelection || !hasBand)) this._stopInspect();
		this._highlightSelectedFootprints();
	}
	/** Union of the given granules' bounding boxes. */
	_combinedBounds(granules) {
		const boxes = granules.map((g) => g.bbox).filter((b) => !!b);
		if (boxes.length === 0) return void 0;
		return boxes.reduce((acc, b) => [
			Math.min(acc[0], b[0]),
			Math.min(acc[1], b[1]),
			Math.max(acc[2], b[2]),
			Math.max(acc[3], b[3])
		], [
			Infinity,
			Infinity,
			-Infinity,
			-Infinity
		]);
	}
	_highlightData(features) {
		return {
			type: "FeatureCollection",
			features
		};
	}
	_ensureHighlightLayers() {
		const map = this._map;
		if (!map) return;
		if (!map.getSource(HL_SRC)) map.addSource(HL_SRC, {
			type: "geojson",
			data: this._highlightData([])
		});
		if (!map.getLayer(HL_FILL)) map.addLayer({
			id: HL_FILL,
			type: "fill",
			source: HL_SRC,
			paint: {
				"fill-color": "#ffd400",
				"fill-opacity": .12
			}
		});
		if (!map.getLayer(HL_LINE)) map.addLayer({
			id: HL_LINE,
			type: "line",
			source: HL_SRC,
			paint: {
				"line-color": "#ffd400",
				"line-width": 3
			}
		});
	}
	_highlightSelectedFootprints() {
		const map = this._map;
		if (!map) return;
		this._ensureHighlightLayers();
		const features = this._granules.filter((g) => this._selectedIds.has(g.id) && g.geometry).map((g) => ({
			type: "Feature",
			geometry: g.geometry,
			properties: {}
		}));
		map.getSource(HL_SRC)?.setData(this._highlightData(features));
		if (map.getLayer(HL_FILL)) map.moveLayer(HL_FILL);
		if (map.getLayer(HL_LINE)) map.moveLayer(HL_LINE);
	}
	_clearHighlight() {
		(this._map?.getSource(HL_SRC))?.setData(this._highlightData([]));
	}
	_removeHighlightLayers() {
		const map = this._map;
		if (!map) return;
		for (const id of [HL_FILL, HL_LINE]) if (map.getLayer(id)) map.removeLayer(id);
		if (map.getSource(HL_SRC)) map.removeSource(HL_SRC);
	}
	_onMapClick = (e) => {
		const map = this._map;
		if (!map || this._drawing) return;
		if (this._inspecting) {
			this._inspectAt({
				lng: e.lngLat.lng,
				lat: e.lngLat.lat
			});
			return;
		}
		const hit = map.queryRenderedFeatures(e.point).find((f) => f.properties && f.properties._operaGranuleId);
		if (!hit) return;
		const id = String(hit.properties._operaGranuleId);
		const granule = this._granules.find((g) => g.id === id);
		if (!granule) return;
		const oe = e.originalEvent;
		this.expand();
		this._applySelection(granule, {
			toggle: !!oe && (oe.ctrlKey || oe.metaKey),
			range: !!oe && oe.shiftKey,
			scroll: true
		});
	};
	_onMapMouseMove = (e) => {
		const map = this._map;
		if (!map || this._drawing) return;
		if (this._inspecting) {
			map.getCanvas().style.cursor = "crosshair";
			return;
		}
		const over = map.queryRenderedFeatures(e.point).some((f) => f.properties && f.properties._operaGranuleId);
		map.getCanvas().style.cursor = over ? "pointer" : "";
	};
	_toggleDraw() {
		if (this._drawing) this._endDraw();
		else this._startDraw();
	}
	_startDraw() {
		const map = this._map;
		if (!map) return;
		this._stopInspect();
		this._drawing = true;
		if (this._drawBtn) this._drawBtn.textContent = "Cancel";
		map.getCanvas().style.cursor = "crosshair";
		map.dragPan.disable();
		map.boxZoom.disable();
		map.doubleClickZoom.disable();
		map.on("mousedown", this._onDrawDown);
	}
	_endDraw() {
		const map = this._map;
		this._drawing = false;
		this._drawStart = void 0;
		this._drawStartLngLat = void 0;
		if (this._drawRect) {
			this._drawRect.remove();
			this._drawRect = void 0;
		}
		if (this._drawBtn) this._drawBtn.textContent = "Draw";
		if (map) {
			map.getCanvas().style.cursor = "";
			map.off("mousedown", this._onDrawDown);
			map.off("mousemove", this._onDrawMove);
			map.dragPan.enable();
			map.boxZoom.enable();
			map.doubleClickZoom.enable();
		}
	}
	_onDrawDown = (e) => {
		const map = this._map;
		if (!map || !this._mapContainer) return;
		e.preventDefault();
		this._drawStart = {
			x: e.point.x,
			y: e.point.y
		};
		this._drawStartLngLat = {
			lng: e.lngLat.lng,
			lat: e.lngLat.lat
		};
		const rect = document.createElement("div");
		rect.className = "opera-draw-rect";
		this._mapContainer.appendChild(rect);
		this._drawRect = rect;
		map.on("mousemove", this._onDrawMove);
		map.once("mouseup", this._onDrawUp);
	};
	_onDrawMove = (e) => {
		if (!this._drawRect || !this._drawStart) return;
		const { x: x1, y: y1 } = this._drawStart;
		const x2 = e.point.x;
		const y2 = e.point.y;
		this._drawRect.style.left = `${Math.min(x1, x2)}px`;
		this._drawRect.style.top = `${Math.min(y1, y2)}px`;
		this._drawRect.style.width = `${Math.abs(x2 - x1)}px`;
		this._drawRect.style.height = `${Math.abs(y2 - y1)}px`;
	};
	_onDrawUp = (e) => {
		const start = this._drawStartLngLat;
		if (start) {
			const end = e.lngLat;
			const w = Math.min(start.lng, end.lng);
			const s = Math.min(start.lat, end.lat);
			const ee = Math.max(start.lng, end.lng);
			const n = Math.max(start.lat, end.lat);
			this._state.bbox = [
				w,
				s,
				ee,
				n
			].map((v) => v.toFixed(4)).join(", ");
			this._syncForm();
		}
		this._endDraw();
	};
	_currentBBox() {
		return this._parseBBox(this._state.bbox) ?? this._options.getMapBounds?.() ?? void 0;
	}
	/** Parse a "west, south, east, north" string into a BBox, or undefined. */
	_parseBBox(value) {
		const parts = value.split(",").map((p) => parseFloat(p.trim()));
		if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) return [
			parts[0],
			parts[1],
			parts[2],
			parts[3]
		];
	}
	_useMapExtent() {
		const bounds = this._options.getMapBounds?.();
		if (!bounds) {
			this._setStatus("Map extent unavailable.");
			return;
		}
		this._state.bbox = bounds.map((v) => v.toFixed(4)).join(", ");
		this._syncForm();
	}
	_createContainer() {
		const container = document.createElement("div");
		container.className = `maplibregl-ctrl maplibregl-ctrl-group plugin-control opera-control${this._options.className ? ` ${this._options.className}` : ""}`;
		const toggleBtn = document.createElement("button");
		toggleBtn.className = "plugin-control-toggle";
		toggleBtn.type = "button";
		toggleBtn.setAttribute("aria-label", this._options.title ?? "NASA OPERA");
		toggleBtn.innerHTML = `
      <span class="plugin-control-icon">
        <svg viewBox="0 0 24 24" width="22" height="22" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9"/>
          <path d="M3 12h18"/>
          <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18"/>
        </svg>
      </span>`;
		toggleBtn.addEventListener("click", () => this.toggle());
		container.appendChild(toggleBtn);
		return container;
	}
	_createPanel() {
		const panel = document.createElement("div");
		panel.className = PANEL_CLASS;
		panel.style.width = `${this._state.panelWidth}px`;
		const header = document.createElement("div");
		header.className = "plugin-control-header";
		const title = document.createElement("span");
		title.className = "plugin-control-title";
		title.textContent = this._options.title ?? "NASA OPERA";
		const closeBtn = document.createElement("button");
		closeBtn.className = "plugin-control-close";
		closeBtn.type = "button";
		closeBtn.setAttribute("aria-label", "Close panel");
		closeBtn.innerHTML = "&times;";
		closeBtn.addEventListener("click", () => this.collapse());
		header.append(title, closeBtn);
		const content = document.createElement("div");
		content.className = "plugin-control-content";
		content.appendChild(this._buildProductGroup());
		content.appendChild(this._buildBBoxGroup());
		content.appendChild(this._buildDateGroup());
		content.appendChild(this._buildCountGroup());
		content.appendChild(this._buildSearchButton());
		const status = document.createElement("div");
		status.className = "plugin-control-status";
		this._status = status;
		content.appendChild(status);
		const divider = document.createElement("div");
		divider.className = "plugin-control-divider";
		content.appendChild(divider);
		content.appendChild(this._buildResultsTable());
		content.appendChild(this._buildBandGroup());
		content.appendChild(this._buildRenderGroup());
		content.appendChild(this._buildDisplayButton());
		content.appendChild(this._buildInspectButton());
		content.appendChild(this._buildStatisticsButton());
		content.appendChild(this._buildStatsPanel());
		content.appendChild(this._buildDownloadGroup());
		const endpointDivider = document.createElement("div");
		endpointDivider.className = "plugin-control-divider";
		content.appendChild(endpointDivider);
		content.appendChild(this._buildEndpointGroup());
		panel.append(header, content);
		return panel;
	}
	_buildProductGroup() {
		const group = el("div", "plugin-control-group");
		group.appendChild(label("Product"));
		const select = document.createElement("select");
		select.className = "plugin-control-input opera-select";
		select.dataset.field = "product";
		for (const p of OPERA_PRODUCTS) {
			const opt = document.createElement("option");
			opt.value = p.shortName;
			opt.textContent = `${p.shortTitle} — ${p.shortName}`;
			opt.title = p.title;
			if (p.shortName === this._state.product) opt.selected = true;
			select.appendChild(opt);
		}
		select.addEventListener("change", () => {
			this._state.product = select.value;
		});
		group.appendChild(select);
		return group;
	}
	_buildBBoxGroup() {
		const group = el("div", "plugin-control-group");
		const row = document.createElement("div");
		row.className = "opera-label-row";
		row.appendChild(label("Bounding box (W, S, E, N)"));
		const actions = document.createElement("span");
		actions.className = "opera-bbox-actions";
		const extentBtn = document.createElement("button");
		extentBtn.type = "button";
		extentBtn.className = "opera-link-button";
		extentBtn.textContent = "Use map extent";
		extentBtn.addEventListener("click", () => this._useMapExtent());
		const drawBtn = document.createElement("button");
		drawBtn.type = "button";
		drawBtn.className = "opera-link-button";
		drawBtn.textContent = "Draw";
		drawBtn.addEventListener("click", () => this._toggleDraw());
		this._drawBtn = drawBtn;
		actions.append(extentBtn, drawBtn);
		row.appendChild(actions);
		group.appendChild(row);
		const input = document.createElement("input");
		input.className = "plugin-control-input";
		input.type = "text";
		input.placeholder = "west, south, east, north";
		input.value = this._state.bbox;
		input.dataset.field = "bbox";
		input.addEventListener("input", () => {
			this._state.bbox = input.value;
		});
		group.appendChild(input);
		return group;
	}
	_buildDateGroup() {
		const group = el("div", "plugin-control-group");
		group.appendChild(label("Date range"));
		const row = document.createElement("div");
		row.className = "plugin-control-flex";
		for (const field of ["start", "end"]) {
			const input = document.createElement("input");
			input.className = "plugin-control-input";
			input.type = "date";
			input.value = this._state[field];
			input.dataset.field = field;
			input.addEventListener("input", () => {
				this._state[field] = input.value;
			});
			row.appendChild(input);
		}
		group.appendChild(row);
		return group;
	}
	_buildCountGroup() {
		const group = el("div", "plugin-control-group");
		group.appendChild(label("Max results"));
		const input = document.createElement("input");
		input.className = "plugin-control-input";
		input.type = "number";
		input.min = "1";
		input.max = "500";
		input.value = String(this._state.count);
		input.dataset.field = "count";
		input.addEventListener("input", () => {
			const v = parseInt(input.value, 10);
			if (Number.isFinite(v)) this._state.count = Math.min(Math.max(v, 1), 500);
		});
		group.appendChild(input);
		return group;
	}
	_buildSearchButton() {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "plugin-control-button opera-block-button";
		btn.textContent = "Search";
		btn.addEventListener("click", () => void this._onSearch());
		return btn;
	}
	_buildResultsTable() {
		const container = document.createElement("div");
		const hint = el("div", "opera-hint");
		hint.textContent = "Click a header to sort. Ctrl/Cmd or Shift-click rows to select multiple.";
		container.appendChild(hint);
		const wrap = document.createElement("div");
		wrap.className = "opera-results";
		const table = document.createElement("table");
		table.className = "opera-table";
		const thead = document.createElement("thead");
		const headRow = document.createElement("tr");
		for (const [key, text] of [
			["id", "Granule"],
			["begin", "Begin"],
			["links", "Links"]
		]) {
			const th = document.createElement("th");
			th.className = "opera-th";
			th.dataset.sort = key;
			th.innerHTML = `${text}<span class="opera-sort-ind"></span>`;
			th.addEventListener("click", () => this._onSortClick(key));
			headRow.appendChild(th);
		}
		thead.appendChild(headRow);
		table.appendChild(thead);
		const body = document.createElement("tbody");
		this._tableBody = body;
		table.appendChild(body);
		wrap.appendChild(table);
		container.appendChild(wrap);
		return container;
	}
	_renderResults() {
		this._view = [...this._granules];
		this._selectedIds.clear();
		this._anchorId = null;
		this._activeGranule = null;
		this._bands = [];
		this._populateBands();
		if (this._displayBtn) this._displayBtn.disabled = true;
		if (this._downloadBandBtn) this._downloadBandBtn.disabled = true;
		if (this._downloadAllBtn) this._downloadAllBtn.disabled = true;
		if (this._inspectBtn) this._inspectBtn.disabled = true;
		if (this._statsBtn) this._statsBtn.disabled = true;
		this._stopInspect();
		this._clearStats();
		this._clearHighlight();
		this._renderRows();
	}
	/** (Re)build the table body from the current view + sort, keeping selection. */
	_renderRows() {
		if (!this._tableBody) return;
		this._sortView();
		this._tableBody.innerHTML = "";
		for (const granule of this._view) {
			const tr = document.createElement("tr");
			tr.className = "opera-row";
			tr.dataset.granuleId = granule.id;
			if (this._selectedIds.has(granule.id)) tr.classList.add("selected");
			const begin = granule.beginDate?.slice(0, 10) ?? "";
			tr.innerHTML = `
        <td title="${escapeHtml(granule.id)}">${escapeHtml(shorten(granule.id))}</td>
        <td>${escapeHtml(begin)}</td>
        <td>${granule.dataLinks.length}</td>`;
			tr.addEventListener("click", (ev) => this._applySelection(granule, {
				toggle: ev.ctrlKey || ev.metaKey,
				range: ev.shiftKey
			}));
			this._tableBody.appendChild(tr);
		}
		this._updateSortIndicators();
	}
	_onSortClick(key) {
		if (this._sortKey === key) this._sortDir = this._sortDir === 1 ? -1 : 1;
		else {
			this._sortKey = key;
			this._sortDir = 1;
		}
		this._renderRows();
	}
	_sortView() {
		const key = this._sortKey;
		if (!key) return;
		const dir = this._sortDir;
		this._view.sort((a, b) => {
			if (key === "links") return (a.dataLinks.length - b.dataLinks.length) * dir;
			const av = key === "begin" ? a.beginDate ?? "" : a.id;
			const bv = key === "begin" ? b.beginDate ?? "" : b.id;
			return av < bv ? -dir : av > bv ? dir : 0;
		});
	}
	_updateSortIndicators() {
		const head = this._tableBody?.parentElement?.querySelector("thead");
		if (!head) return;
		head.querySelectorAll(".opera-th").forEach((th) => {
			const ind = th.querySelector(".opera-sort-ind");
			if (!ind) return;
			ind.textContent = th.dataset.sort === this._sortKey ? this._sortDir === 1 ? " ▲" : " ▼" : "";
		});
	}
	_buildBandGroup() {
		const group = el("div", "plugin-control-group");
		group.appendChild(label("Layer / band"));
		const select = document.createElement("select");
		select.className = "plugin-control-input opera-select";
		select.addEventListener("change", () => this._applyBandDefaults(select.value));
		this._bandSelect = select;
		group.appendChild(select);
		return group;
	}
	/**
	* Populate the Rendering fields with the selected band's default rescale +
	* colormap, so the applied rendering is visible and tweakable. Categorical
	* water bands populate blanks (their built-in class colormap applies).
	*/
	_applyBandDefaults(band) {
		if (!band) return;
		const defaults = bandRenderDefaults(this._state.product, band);
		this._state.rescale = defaults.rescale;
		this._state.colormapName = defaults.colormapName;
		if (this._rescaleInput) this._rescaleInput.value = defaults.rescale;
		if (this._colormapSelect) this._colormapSelect.value = defaults.colormapName;
	}
	_populateBands() {
		const select = this._bandSelect;
		if (!select) return;
		select.innerHTML = "";
		const preferred = getProduct(this._state.product)?.render.bands?.[0];
		for (const band of this._bands) {
			const opt = document.createElement("option");
			opt.value = band.token;
			opt.textContent = band.label;
			if (preferred && band.token === preferred) opt.selected = true;
			select.appendChild(opt);
		}
		if (this._bands.length === 0) {
			const opt = document.createElement("option");
			opt.textContent = "Select a granule…";
			opt.disabled = true;
			opt.selected = true;
			select.appendChild(opt);
		} else this._applyBandDefaults(select.value);
	}
	_buildRenderGroup() {
		const wrap = document.createElement("div");
		const rescaleGroup = el("div", "plugin-control-group");
		rescaleGroup.appendChild(label("Rescale (min,max)"));
		const rescale = document.createElement("input");
		rescale.className = "plugin-control-input";
		rescale.type = "text";
		rescale.placeholder = "auto — e.g. 0,3000 for DEM";
		rescale.value = this._state.rescale;
		rescale.dataset.field = "rescale";
		rescale.addEventListener("input", () => {
			this._state.rescale = rescale.value;
		});
		this._rescaleInput = rescale;
		rescaleGroup.appendChild(rescale);
		const cmapGroup = el("div", "plugin-control-group");
		cmapGroup.appendChild(label("Colormap"));
		const cmap = document.createElement("select");
		cmap.className = "plugin-control-input opera-select";
		cmap.dataset.field = "colormapName";
		for (const name of COLORMAP_NAMES) {
			const opt = document.createElement("option");
			opt.value = name;
			opt.textContent = name || "(default)";
			if (name === this._state.colormapName) opt.selected = true;
			cmap.appendChild(opt);
		}
		cmap.addEventListener("change", () => {
			this._state.colormapName = cmap.value;
		});
		this._colormapSelect = cmap;
		cmapGroup.appendChild(cmap);
		wrap.append(rescaleGroup, cmapGroup);
		return wrap;
	}
	_buildDisplayButton() {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "plugin-control-button opera-block-button";
		btn.textContent = "Display";
		btn.disabled = true;
		this._displayBtn = btn;
		btn.addEventListener("click", () => void this._onDisplay());
		return btn;
	}
	_buildInspectButton() {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "plugin-control-button opera-secondary-button opera-block-button";
		btn.textContent = "Inspect pixel values";
		btn.title = "Toggle, then click the map to read the selected band's value at that location";
		btn.disabled = true;
		btn.addEventListener("click", () => this._toggleInspect());
		this._inspectBtn = btn;
		return btn;
	}
	_toggleInspect() {
		if (this._inspecting) this._stopInspect();
		else this._startInspect();
	}
	_startInspect() {
		if (!this._map) return;
		if (this._drawing) this._endDraw();
		this._inspecting = true;
		if (this._inspectBtn) {
			this._inspectBtn.classList.add("active");
			this._inspectBtn.textContent = "Inspecting — click the map";
		}
		this._map.getCanvas().style.cursor = "crosshair";
		this._setStatus("Click the map to read pixel values. Click Inspect again to stop.");
	}
	_stopInspect() {
		if (!this._inspecting) return;
		this._inspecting = false;
		if (this._inspectBtn) {
			this._inspectBtn.classList.remove("active");
			this._inspectBtn.textContent = "Inspect pixel values";
		}
		if (this._map) this._map.getCanvas().style.cursor = "";
	}
	/**
	* Query titiler-cmr `/point` for each selected granule at the clicked
	* location and show the values in a map popup. Each granule is pinned by
	* `granule_ur` so the values match exactly what Display renders.
	*/
	async _inspectAt(lngLat) {
		const product = getProduct(this._state.product);
		const selected = this._granules.filter((g) => this._selectedIds.has(g.id));
		if (!product || selected.length === 0) {
			this._setStatus("Select a granule first, then click the map to inspect.");
			return;
		}
		const band = this._bandSelect?.value || product.render.bands?.[0];
		this._showInspectPopup(lngLat, "<em>Reading value…</em>");
		try {
			const conceptId = selected[0].conceptId ?? await resolveConceptId(product.shortName);
			const results = await Promise.all(selected.map(async (granule) => {
				try {
					return {
						granule,
						point: await fetchPoint(buildPointUrl({
							endpoint: this._state.endpoint || "https://staging.openveda.cloud/api/titiler-cmr",
							conceptId,
							backend: product.render.backend,
							lon: lngLat.lng,
							lat: lngLat.lat,
							granuleUr: granule.id,
							bands: band ? [band] : product.render.bands,
							bandsRegex: product.render.bandsRegex
						}))
					};
				} catch {
					return {
						granule,
						point: null
					};
				}
			}));
			if (this._inspectLngLat !== lngLat) return;
			this._showInspectPopup(lngLat, this._formatInspect(lngLat, results, band));
		} catch (err) {
			if (this._inspectLngLat !== lngLat) return;
			this._showInspectPopup(lngLat, `Inspect failed: ${escapeHtml(err instanceof Error ? err.message : String(err))}`);
		}
	}
	/** Render the per-granule point values as popup HTML. */
	_formatInspect(lngLat, results, band) {
		return `
      <div class="opera-inspect-band">${escapeHtml(band ?? "value")}</div>
      <div class="opera-inspect-coord">${lngLat.lng.toFixed(4)}, ${lngLat.lat.toFixed(4)}</div>` + results.map(({ granule, point }) => {
			const name = escapeHtml(shorten(granule.id, 24));
			const value = point && point.assets.length > 0 ? formatPointValues(point) : "no data";
			return `<div class="opera-inspect-row"><span class="opera-inspect-g" title="${escapeHtml(granule.id)}">${name}</span><span class="opera-inspect-v">${escapeHtml(value)}</span></div>`;
		}).join("");
	}
	_showInspectPopup(lngLat, html) {
		const map = this._map;
		const container = this._mapContainer;
		if (!map || !container) return;
		this._inspectLngLat = lngLat;
		if (!this._inspectPopup) {
			const popup = document.createElement("div");
			popup.className = "opera-inspect-popup";
			const close = document.createElement("button");
			close.className = "opera-inspect-close";
			close.type = "button";
			close.setAttribute("aria-label", "Close");
			close.innerHTML = "&times;";
			close.addEventListener("click", () => this._removeInspectPopup());
			const body = document.createElement("div");
			body.className = "opera-inspect-body";
			popup.append(close, body);
			container.appendChild(popup);
			this._inspectPopup = popup;
			this._inspectMoveHandler = () => this._positionInspectPopup();
			map.on("move", this._inspectMoveHandler);
		}
		const body = this._inspectPopup.querySelector(".opera-inspect-body");
		if (body) body.innerHTML = html;
		this._positionInspectPopup();
	}
	_positionInspectPopup() {
		const map = this._map;
		const popup = this._inspectPopup;
		const ll = this._inspectLngLat;
		if (!map || !popup || !ll) return;
		const p = map.project([ll.lng, ll.lat]);
		popup.style.left = `${p.x}px`;
		popup.style.top = `${p.y}px`;
	}
	_removeInspectPopup() {
		if (this._inspectMoveHandler && this._map) {
			this._map.off("move", this._inspectMoveHandler);
			this._inspectMoveHandler = null;
		}
		this._inspectPopup?.remove();
		this._inspectPopup = void 0;
		this._inspectLngLat = void 0;
	}
	_buildStatisticsButton() {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "plugin-control-button opera-secondary-button opera-block-button";
		btn.textContent = "Statistics (current AOI)";
		btn.title = "Compute zonal statistics for the selected band over the current bounding box";
		btn.disabled = true;
		btn.addEventListener("click", () => void this._onStatistics());
		this._statsBtn = btn;
		return btn;
	}
	_buildStatsPanel() {
		const panel = el("div", "opera-stats");
		this._statsPanel = panel;
		return panel;
	}
	_clearStats() {
		if (this._statsPanel) this._statsPanel.innerHTML = "";
	}
	_setStatsContent(html) {
		if (this._statsPanel) this._statsPanel.innerHTML = html;
	}
	/**
	* Build a GeoJSON Polygon Feature for the current AOI (the bbox field, or the
	* map extent when the field is blank) plus the bbox itself and whether it came
	* from the map extent, so the panel can show what area was actually summarized.
	*/
	_aoiFeature() {
		const typed = this._parseBBox(this._state.bbox);
		const bbox = typed ?? this._options.getMapBounds?.() ?? void 0;
		if (!bbox) return void 0;
		const [w, s, e, n] = bbox;
		return {
			feature: {
				type: "Feature",
				properties: {},
				geometry: {
					type: "Polygon",
					coordinates: [[
						[w, s],
						[e, s],
						[e, n],
						[w, n],
						[w, s]
					]]
				}
			},
			bbox,
			fromMapExtent: !typed
		};
	}
	/**
	* Compute zonal statistics for the selected band over the current AOI, one
	* `/statistics` POST per selected granule (pinned by `granule_ur` so the
	* numbers reflect exactly the chosen granules). DSWx water bands are queried
	* categorically to derive open-water area.
	*/
	async _onStatistics() {
		const product = getProduct(this._state.product);
		const selected = this._granules.filter((g) => this._selectedIds.has(g.id));
		if (!product || selected.length === 0) {
			this._setStatus("Select a granule first.");
			return;
		}
		const aoi = this._aoiFeature();
		if (!aoi) {
			this._setStatus("Set a bounding box (type it, Use map extent, or Draw) for the AOI.");
			return;
		}
		const band = this._bandSelect?.value || product.render.bands?.[0];
		const categorical = isCategoricalBand(product.shortName, band);
		this._setStatsContent(`<div class="opera-stats-loading">Computing statistics for ${selected.length} granule(s)…</div>`);
		this._setStatus(`Computing statistics for ${selected.length} granule(s)…`);
		try {
			const conceptId = selected[0].conceptId ?? await resolveConceptId(product.shortName);
			const results = await Promise.all(selected.map(async (granule) => {
				try {
					return {
						granule,
						stats: await fetchStatistics(buildStatisticsUrl({
							endpoint: this._state.endpoint || "https://staging.openveda.cloud/api/titiler-cmr",
							conceptId,
							backend: product.render.backend,
							granuleUr: granule.id,
							bands: band ? [band] : product.render.bands,
							bandsRegex: product.render.bandsRegex,
							categorical
						}), aoi.feature)
					};
				} catch {
					return {
						granule,
						stats: null
					};
				}
			}));
			this._renderStats(results, product.shortName, band, aoi);
			const ok = results.filter((r) => r.stats).length;
			this._setStatus(ok === selected.length ? `Statistics for ${ok} granule(s).` : `Statistics for ${ok}/${selected.length} granule(s).`);
		} catch (err) {
			this._clearStats();
			this._setStatus(`Statistics failed: ${err instanceof Error ? err.message : String(err)}`);
		}
	}
	_renderStats(results, shortName, band, aoi) {
		const blocks = results.map(({ granule, stats }) => {
			const head = `<div class="opera-stats-granule" title="${escapeHtml(granule.id)}">${escapeHtml(shorten(granule.id, 26))}</div>`;
			const bandStats = stats ? firstBandStats(stats) : void 0;
			if (!bandStats) return `<div class="opera-stats-block">${head}<div class="opera-stats-empty">no data in AOI</div></div>`;
			return `<div class="opera-stats-block">${head}${isDswxWaterBand(shortName, band) ? renderWaterStats(bandStats) : renderContinuousStats(bandStats)}</div>`;
		});
		const [w, s, e, n] = aoi.bbox;
		const extentNote = aoi.fromMapExtent ? " · map extent" : "";
		const header = `<div class="opera-stats-title">${escapeHtml(band ?? "band")} — AOI statistics</div><div class="opera-stats-aoi">AOI ${w.toFixed(2)}, ${s.toFixed(2)}, ${e.toFixed(2)}, ${n.toFixed(2)}${extentNote}</div>`;
		this._setStatsContent(header + blocks.join(""));
	}
	_buildDownloadGroup() {
		const row = el("div", "opera-download-row");
		const bandBtn = document.createElement("button");
		bandBtn.type = "button";
		bandBtn.className = "plugin-control-button opera-secondary-button";
		bandBtn.textContent = "Download band";
		bandBtn.title = "Download the selected band for each selected granule";
		bandBtn.disabled = true;
		bandBtn.addEventListener("click", () => this._downloadSelected(false));
		this._downloadBandBtn = bandBtn;
		const allBtn = document.createElement("button");
		allBtn.type = "button";
		allBtn.className = "plugin-control-button opera-secondary-button";
		allBtn.textContent = "Download all bands";
		allBtn.title = "Download every band file for each selected granule";
		allBtn.disabled = true;
		allBtn.addEventListener("click", () => this._downloadSelected(true));
		this._downloadAllBtn = allBtn;
		row.append(bandBtn, allBtn);
		return row;
	}
	/**
	* Download the selected granules' files through the browser. OPERA data is
	* Earthdata-protected, so each URL is opened as a navigation (new tab): the
	* browser follows the login redirect and downloads when the user has an
	* Earthdata session. No credentials are handled by the plugin.
	*/
	_downloadSelected(allBands) {
		const product = getProduct(this._state.product);
		const selected = this._granules.filter((g) => this._selectedIds.has(g.id));
		if (selected.length === 0) {
			this._setStatus("Select a granule first.");
			return;
		}
		const band = this._bandSelect?.value || product?.render.bands?.[0];
		const urls = [];
		for (const granule of selected) {
			const https = granule.dataLinks.filter((u) => u.startsWith("https://"));
			if (allBands) urls.push(...https);
			else {
				const match = https.find((u) => getLayerBand(u) === band);
				if (match) urls.push(match);
			}
		}
		if (urls.length === 0) {
			this._setStatus("No downloadable files found for the selection.");
			return;
		}
		this._triggerDownloads(urls);
		this._setStatus(`Downloading ${urls.length} file(s). Sign in to NASA Earthdata if prompted.`);
	}
	/** Trigger downloads for each URL, staggered to avoid being collapsed. */
	_triggerDownloads(urls) {
		urls.forEach((url, i) => {
			setTimeout(() => void this._openForDownload(url), i * 300);
		});
	}
	/**
	* Open one download URL. Under Tauri the webview ignores anchor/window.open,
	* so route through the system browser via the opener plugin (where the user's
	* Earthdata session lives). On the web/standalone, fall back to an anchor
	* click that opens in a new tab so a login page never replaces the app.
	*/
	async _openForDownload(url) {
		if (isTauri()) try {
			await openUrl(url);
			return;
		} catch {}
		const a = document.createElement("a");
		a.href = url;
		a.download = "";
		a.target = "_blank";
		a.rel = "noopener";
		document.body.appendChild(a);
		a.click();
		a.remove();
	}
	_buildEndpointGroup() {
		const group = el("div", "plugin-control-group opera-endpoint");
		group.appendChild(label("titiler-cmr endpoint"));
		const input = document.createElement("input");
		input.className = "plugin-control-input";
		input.type = "text";
		input.value = this._state.endpoint;
		input.dataset.field = "endpoint";
		input.addEventListener("input", () => {
			this._state.endpoint = input.value.trim();
		});
		group.appendChild(input);
		return group;
	}
	_readForm() {
		if (!this._panel) return;
		this._panel.querySelectorAll("[data-field]").forEach((field) => {
			const key = field.dataset.field;
			if (!key) return;
			if (key === "count") {
				const v = parseInt(field.value, 10);
				if (Number.isFinite(v)) this._state.count = v;
			} else if (key in this._state) this._state[key] = field.value;
		});
	}
	_syncForm() {
		if (!this._panel) return;
		this._panel.querySelectorAll("[data-field]").forEach((field) => {
			const key = field.dataset.field;
			if (!key) return;
			const value = this._state[key];
			if (value != null) field.value = String(value);
		});
	}
	_setStatus(message) {
		if (this._status) this._status.textContent = message;
	}
	_setupEventListeners() {
		this._map?.on("click", this._onMapClick);
		this._map?.on("mousemove", this._onMapMouseMove);
		this._resizeHandler = () => {
			if (!this._state.collapsed) this._updatePanelPosition();
		};
		window.addEventListener("resize", this._resizeHandler);
		this._mapResizeHandler = () => {
			if (!this._state.collapsed) this._updatePanelPosition();
		};
		this._map?.on("resize", this._mapResizeHandler);
	}
	_getControlPosition() {
		const parent = this._container?.parentElement;
		if (!parent) return "top-right";
		if (parent.classList.contains("maplibregl-ctrl-top-left")) return "top-left";
		if (parent.classList.contains("maplibregl-ctrl-top-right")) return "top-right";
		if (parent.classList.contains("maplibregl-ctrl-bottom-left")) return "bottom-left";
		if (parent.classList.contains("maplibregl-ctrl-bottom-right")) return "bottom-right";
		return "top-right";
	}
	_updatePanelPosition() {
		if (!this._container || !this._panel || !this._mapContainer) return;
		const button = this._container.querySelector(".plugin-control-toggle");
		if (!button) return;
		const buttonRect = button.getBoundingClientRect();
		const mapRect = this._mapContainer.getBoundingClientRect();
		const position = this._getControlPosition();
		const buttonTop = buttonRect.top - mapRect.top;
		const buttonBottom = mapRect.bottom - buttonRect.bottom;
		const buttonLeft = buttonRect.left - mapRect.left;
		const buttonRight = mapRect.right - buttonRect.right;
		const gap = 5;
		this._panel.style.top = "";
		this._panel.style.bottom = "";
		this._panel.style.left = "";
		this._panel.style.right = "";
		switch (position) {
			case "top-left":
				this._panel.style.top = `${buttonTop + buttonRect.height + gap}px`;
				this._panel.style.left = `${buttonLeft}px`;
				break;
			case "top-right":
				this._panel.style.top = `${buttonTop + buttonRect.height + gap}px`;
				this._panel.style.right = `${buttonRight}px`;
				break;
			case "bottom-left":
				this._panel.style.bottom = `${buttonBottom + buttonRect.height + gap}px`;
				this._panel.style.left = `${buttonLeft}px`;
				break;
			case "bottom-right":
				this._panel.style.bottom = `${buttonBottom + buttonRect.height + gap}px`;
				this._panel.style.right = `${buttonRight}px`;
				break;
		}
	}
};
function el(tag, className) {
	const node = document.createElement(tag);
	node.className = className;
	return node;
}
function label(text) {
	const node = document.createElement("label");
	node.className = "plugin-control-label";
	node.textContent = text;
	return node;
}
function slug(value) {
	return value.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function shorten(value, max = 28) {
	return value.length > max ? `…${value.slice(value.length - max)}` : value;
}
/** Format a number for the inspect popup: integers as-is, floats trimmed. */
function formatNumber(v) {
	if (Number.isInteger(v)) return String(v);
	return parseFloat(v.toPrecision(5)).toString();
}
/** A finite number formatted for display, or "n/a". */
function formatStat(n) {
	return Number.isFinite(n) ? formatNumber(n) : "n/a";
}
/** Format an area in km², widening precision for small areas. */
function formatArea(km2) {
	if (km2 >= 100) return km2.toFixed(0);
	if (km2 >= 1) return km2.toFixed(2);
	return km2.toFixed(3);
}
/** The first (typically only) band's statistics from a result. */
function firstBandStats(stats) {
	return Object.values(stats.bands)[0];
}
/** A key/value grid of scalar statistics. */
function statGrid(rows) {
	return `<div class="opera-stats-grid">${rows.map(([k, v]) => `<span class="opera-stats-k">${escapeHtml(k)}</span><span class="opera-stats-v">${escapeHtml(v)}</span>`).join("")}</div>`;
}
/** Pixels -> area in km² at the OPERA native grid spacing. */
function pixelsToKm2(pixels) {
	return pixels * 30 * 30 / 1e6;
}
/** Continuous-band statistics block (min/max/mean/std/median/coverage). */
function renderContinuousStats(s) {
	const rows = [
		["min", formatStat(s.min)],
		["max", formatStat(s.max)],
		["mean", formatStat(s.mean)],
		["std", formatStat(s.std)]
	];
	if (s.median != null) rows.push(["median", formatStat(s.median)]);
	if (s.validPixels != null) {
		rows.push(["valid px", Math.round(s.validPixels).toLocaleString()]);
		rows.push(["valid area", `${formatArea(pixelsToKm2(s.validPixels))} km²`]);
	} else rows.push(["count", formatStat(s.count)]);
	if (s.validPercent != null) rows.push(["valid %", `${s.validPercent.toFixed(1)}%`]);
	return statGrid(rows);
}
/**
* DSWx water-band block: derive open-water area from the categorical histogram
* (class pixel counts x pixel area) and list every class count. Areas are a
* fraction of the total valid area, which is shown so the magnitude is
* interpretable (e.g. a whole-granule AOI yields thousands of km²).
*/
function renderWaterStats(s) {
	let openCount = 0;
	let partialCount = 0;
	let validCount = 0;
	const classRows = [];
	if (s.histogram) {
		const [counts, values] = s.histogram;
		values.forEach((v, i) => {
			const count = counts[i] ?? 0;
			validCount += count;
			if (v === 1) openCount = count;
			if (v === 2) partialCount = count;
			const label = DSWX_WTR_CLASS_LABELS[String(v)] ?? `Class ${v}`;
			classRows.push(`<div class="opera-stats-row"><span>${escapeHtml(label)}</span><span>${count.toLocaleString()}</span></div>`);
		});
	}
	const pct = (px) => validCount > 0 ? ` (${(px / validCount * 100).toFixed(1)}% of valid)` : "";
	return `<div class="opera-stats-headline">${`Open water: <b>${formatArea(pixelsToKm2(openCount))} km²</b>${pct(openCount)}`}</div><div class="opera-stats-sub">${`Open + partial: ${formatArea(pixelsToKm2(openCount + partialCount))} km²${pct(openCount + partialCount)}`}</div><div class="opera-stats-sub">${`Valid: ${formatArea(pixelsToKm2(validCount))} km² · ${validCount.toLocaleString()} px`}</div><div class="opera-stats-classes">${classRows.join("")}</div>`;
}
/**
* Flatten a point result's asset values into a compact label, e.g. `1` for a
* single-band class value or `VV=0.0123, VH=0.0047` across bands.
*/
function formatPointValues(point) {
	const parts = [];
	for (const asset of point.assets) asset.values.forEach((v, i) => {
		const text = v == null ? "nodata" : formatNumber(v);
		const single = point.assets.length === 1 && asset.values.length === 1;
		parts.push(single ? text : `${asset.bandNames[i] ?? `b${i + 1}`}=${text}`);
	});
	return parts.length > 0 ? parts.join(", ") : "no data";
}
function escapeHtml(value) {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
//#endregion
//#region src/geolibre.ts
var control = null;
var position = "top-left";
var pendingState = null;
function createControl(app) {
	const next = new OperaControl({
		collapsed: pendingState?.collapsed ?? true,
		panelWidth: pendingState?.panelWidth ?? 340,
		title: "NASA OPERA",
		addGeoJsonLayer: (name, data) => app.addGeoJsonLayer?.(name, data),
		registerLayer: (layer) => app.registerExternalNativeLayer?.(layer),
		unregisterLayer: (id) => app.unregisterExternalNativeLayer?.(id),
		fitBounds: (bounds) => app.fitBounds?.(bounds),
		getMapBounds: () => readMapBounds(app)
	});
	if (pendingState) next.setState(pendingState);
	return next;
}
/** Read the current map extent as a `[w, s, e, n]` box, or null. */
function readMapBounds(app) {
	const map = app.getMap?.();
	if (!map) return null;
	const b = map.getBounds();
	return [
		b.getWest(),
		b.getSouth(),
		b.getEast(),
		b.getNorth()
	];
}
function isOperaState(value) {
	return !!value && typeof value === "object" && !Array.isArray(value);
}
var plugin = {
	id: "geolibre-nasa-opera",
	name: "NASA OPERA",
	version: "0.2.0",
	activate(app) {
		control = control ?? createControl(app);
		if (!app.addMapControl(control, position)) {
			control = null;
			return false;
		}
	},
	deactivate(app) {
		if (!control) return;
		pendingState = control.getState();
		app.removeMapControl(control);
		control = null;
	},
	getMapControlPosition() {
		return position;
	},
	setMapControlPosition(app, nextPosition) {
		position = nextPosition;
		if (!control) return;
		app.removeMapControl(control);
		if (!app.addMapControl(control, position)) {
			pendingState = control.getState();
			control = null;
			return false;
		}
	},
	getProjectState() {
		return control?.getState() ?? pendingState ?? void 0;
	},
	applyProjectState(_app, state) {
		if (!isOperaState(state)) return false;
		pendingState = state;
		control?.setState(state);
	}
};
//#endregion
export { plugin as default, plugin };
