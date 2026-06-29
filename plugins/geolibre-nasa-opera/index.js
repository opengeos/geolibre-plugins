import { n as GeoAgentControl } from "./GeoAgentControl-BK8Q6PEC-QtqA2iOY.js";
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
* Ready-made band-math expressions for a product/band, shown as presets next to
* the Expression field. The selected band is referenced as `b1`. Each preset
* also carries a rescale + colormap so the computed layer displays meaningfully.
*/
function expressionPresets(shortName, band) {
	const b = band ?? "";
	if (/RTC-S1/i.test(shortName) && /^(VV|VH|HH|HV)$/i.test(b)) return [{
		label: "Backscatter dB (10·log10)",
		expression: "10*log10(b1)",
		rescale: "-30,0",
		colormapName: "gray"
	}];
	if (/DSWX/i.test(shortName) && /WTR/i.test(b)) return [{
		label: "Open-water mask (class 1)",
		expression: "where(b1==1,1,0)",
		rescale: "0,1",
		colormapName: "blues"
	}, {
		label: "Surface-water mask (1+2)",
		expression: "where((b1==1)|(b1==2),1,0)",
		rescale: "0,1",
		colormapName: "blues"
	}];
	return [];
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
var ENDPOINT_GLOBAL = "GEOLIBRE_NASA_OPERA_TITILER_CMR_ENDPOINT";
var DEFAULT_TITILER_CMR_ENDPOINT = resolveDefaultTitilerCmrEndpoint();
function resolveDefaultTitilerCmrEndpoint(override) {
	return cleanEndpoint(override) || cleanEndpoint(readGlobalEndpoint()) || cleanEndpoint(void 0) || "https://titiler-cmr.opengeos.org";
}
function cleanEndpoint(value) {
	const trimmed = value?.trim();
	return trimmed ? trimmed.replace(/\/+$/, "") : void 0;
}
function readGlobalEndpoint() {
	return globalThis[ENDPOINT_GLOBAL];
}
/** TileMatrixSet id used for the XYZ tile grid. */
var TILE_MATRIX_SET = "WebMercatorQuad";
function appendValue(query, key, value) {
	if (value == null) return;
	if (Array.isArray(value)) for (const item of value) query.append(key, String(item));
	else query.set(key, String(value));
}
function appendCommonCmrParams(query, params) {
	query.set("collection_concept_id", params.conceptId);
	if (params.granuleUr) query.set("granule_ur", params.granuleUr);
	if (params.temporal) query.set("temporal", params.temporal);
	for (const asset of params.assets ?? []) query.append("assets", asset);
	if (params.assetsRegex) query.set("assets_regex", params.assetsRegex);
	for (const variable of params.variables ?? []) query.append("variables", variable);
	if (params.group) query.set("group", params.group);
	if (params.sel) query.set("sel", typeof params.sel === "string" ? params.sel : JSON.stringify(params.sel));
	const rescaleValues = Array.isArray(params.rescale) ? params.rescale : params.rescale ? [params.rescale] : [];
	for (const value of rescaleValues) query.append("rescale", value);
	applyExpression(query, params.expression);
	if (params.colormap) query.set("colormap", params.colormap);
	if (params.colormapName) query.set("colormap_name", params.colormapName);
	if (params.minzoom != null) query.set("minzoom", String(params.minzoom));
	if (params.maxzoom != null) query.set("maxzoom", String(params.maxzoom));
	for (const [key, value] of Object.entries(params.extraParams ?? {})) appendValue(query, key, value);
}
/** Build a backend-neutral tilejson URL for rasterio or xarray. */
function buildCmrTileJsonUrl(params) {
	const base = params.endpoint.replace(/\/+$/, "");
	const query = new URLSearchParams();
	appendCommonCmrParams(query, params);
	return `${base}/${params.backend}/${TILE_MATRIX_SET}/tilejson.json?${query.toString()}`;
}
/** Build a backend-neutral point-query URL for rasterio or xarray. */
function buildCmrPointUrl(params) {
	const base = params.endpoint.replace(/\/+$/, "");
	const query = new URLSearchParams();
	appendCommonCmrParams(query, params);
	return `${base}/${params.backend}/point/${params.lon},${params.lat}?${query.toString()}`;
}
/** Build a backend-neutral statistics URL for rasterio or xarray. */
function buildCmrStatisticsUrl(params) {
	const base = params.endpoint.replace(/\/+$/, "");
	const query = new URLSearchParams();
	appendCommonCmrParams(query, params);
	if (params.categorical) query.set("categorical", "true");
	else if (params.histogramBins) query.set("histogram_bins", String(params.histogramBins));
	return `${base}/${params.backend}/statistics?${query.toString()}`;
}
/** Build a backend-neutral timeseries TileJSON URL. */
function buildCmrTimeseriesTileJsonUrl(params) {
	const base = params.endpoint.replace(/\/+$/, "");
	const query = new URLSearchParams();
	appendCommonCmrParams(query, params);
	if (params.step) query.set("step", params.step);
	if (params.temporalMode) query.set("temporal_mode", params.temporalMode);
	return `${base}/${params.backend}/timeseries/${TILE_MATRIX_SET}/tilejson.json?${query.toString()}`;
}
/**
* Apply a band-math `expression` to a query. titiler evaluates expressions over
* bands named `b1`, `b2`, ... so `asset_as_band=true` is sent alongside it to
* map each requested asset onto a band. No-op when `expression` is blank.
*/
function applyExpression(query, expression) {
	const expr = expression?.trim();
	if (!expr) return;
	query.set("expression", expr);
	query.set("asset_as_band", "true");
}
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
	return buildCmrTileJsonUrl({
		endpoint: params.endpoint,
		conceptId: params.conceptId,
		backend: params.backend,
		temporal: params.datetime,
		granuleUr: params.granuleUr,
		assets: params.bands,
		assetsRegex: params.bandsRegex,
		rescale: params.colormap ? void 0 : params.rescale,
		colormapName: params.colormap ? void 0 : params.colormapName,
		colormap: params.colormap,
		expression: params.expression
	});
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
	return buildCmrPointUrl({
		endpoint: params.endpoint,
		conceptId: params.conceptId,
		backend: params.backend,
		lon: params.lon,
		lat: params.lat,
		granuleUr: params.granuleUr,
		temporal: params.datetime,
		assets: params.bands,
		assetsRegex: params.bandsRegex,
		expression: params.expression
	});
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
	return buildCmrStatisticsUrl({
		endpoint: params.endpoint,
		conceptId: params.conceptId,
		backend: params.backend,
		granuleUr: params.granuleUr,
		temporal: params.datetime,
		assets: params.bands,
		assetsRegex: params.bandsRegex,
		categorical: params.categorical,
		histogramBins: params.histogramBins,
		expression: params.expression
	});
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
		percentile2: toOptNum(s.percentile_2),
		percentile98: toOptNum(s.percentile_98),
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
/** Fetch arbitrary JSON from titiler-cmr. */
async function fetchTitilerJson(url, init) {
	const res = await fetch(url, {
		...init,
		headers: {
			Accept: "application/json",
			...init?.headers ?? {}
		}
	});
	if (!res.ok) throw new Error(`titiler-cmr request failed (${res.status})`);
	return await res.json();
}
/** Fetch a backend-neutral timeseries TileJSON document. */
async function fetchTimeSeriesTileJson(url) {
	const json = await fetchTitilerJson(url);
	if (!json || typeof json !== "object" || Array.isArray(json)) throw new Error("titiler-cmr returned an invalid timeseries TileJSON");
	return json;
}
/** Normalize TileJSON bounds to a `[w, s, e, n]` tuple when present. */
function tileJsonBounds(json) {
	if (json.bounds && json.bounds.length === 4) {
		const [w, s, e, n] = json.bounds;
		return [
			w,
			s,
			e,
			n
		];
	}
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
	_expressionInput;
	_expressionPresetSelect;
	_expressionHint;
	_currentExpressionPresets = [];
	_displayBtn;
	_downloadBandBtn;
	_downloadAllBtn;
	_downloadReportBtn;
	_options;
	_state;
	_lastStatus = "";
	_lastChangeResult;
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
			expression: "",
			endpoint: resolveDefaultTitilerCmrEndpoint(options.defaultEndpoint)
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
		this._expressionInput = void 0;
		this._expressionPresetSelect = void 0;
		this._expressionHint = void 0;
		this._displayBtn = void 0;
		this._downloadBandBtn = void 0;
		this._downloadAllBtn = void 0;
		this._downloadReportBtn = void 0;
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
	getAgentContext() {
		this._readForm();
		return {
			ok: true,
			status: this._lastStatus,
			product: this._state.product,
			endpoint: this._state.endpoint,
			bbox: this._state.bbox,
			start: this._state.start,
			end: this._state.end,
			selectedGranuleIds: [...this._selectedIds],
			products: OPERA_PRODUCTS.map((p) => ({
				shortName: p.shortName,
				shortTitle: p.shortTitle,
				description: p.description
			})),
			granules: this._agentGranuleSummaries()
		};
	}
	async searchForAgent(params) {
		this.expand();
		const product = params.product ? resolveProductForAgent(params.product) : void 0;
		if (params.product && !product) return {
			ok: false,
			status: `Unknown OPERA product: ${params.product}`,
			product: this._state.product,
			granules: this._agentGranuleSummaries()
		};
		if (product) this._state.product = product.shortName;
		if (params.bbox !== void 0) {
			const bbox = normalizeAgentBBox(params.bbox);
			if (!bbox) return {
				ok: false,
				status: "Invalid bbox. Use [west,south,east,north].",
				product: this._state.product,
				granules: this._agentGranuleSummaries()
			};
			this._state.bbox = bbox.map((v) => trimNumber(v)).join(", ");
		}
		if (params.start !== void 0) this._state.start = params.start;
		if (params.end !== void 0) this._state.end = params.end;
		if (params.count !== void 0 && Number.isFinite(params.count)) this._state.count = Math.min(Math.max(Math.round(params.count), 1), 500);
		this._syncForm();
		await this._onSearch();
		return {
			ok: !/^Search failed:/i.test(this._lastStatus),
			status: this._lastStatus,
			product: this._state.product,
			granules: this._agentGranuleSummaries()
		};
	}
	async displayForAgent(params) {
		this.expand();
		if (this._selectGranulesForAgent(params.granuleIds, params.maxGranules).length === 0) return {
			ok: false,
			status: "No granules selected. Run search_opera_granules first or pass granuleIds from the latest search.",
			product: this._state.product,
			granules: this._agentGranuleSummaries(),
			displayedLayerIds: [],
			selectedGranuleIds: []
		};
		if (params.band) this._setBandForAgent(params.band);
		if (params.rescale !== void 0) {
			this._state.rescale = params.rescale;
			if (this._rescaleInput) this._rescaleInput.value = params.rescale;
		}
		if (params.colormapName !== void 0) {
			this._state.colormapName = params.colormapName;
			if (this._colormapSelect) this._colormapSelect.value = params.colormapName;
		}
		if (params.expression !== void 0) this._setExpression(params.expression);
		const before = new Set(this._registeredLayerIds);
		await this._onDisplay();
		const displayedLayerIds = this._registeredLayerIds.filter((id) => !before.has(id));
		return {
			ok: displayedLayerIds.length > 0 && !/^Display failed:/i.test(this._lastStatus),
			status: this._lastStatus,
			product: this._state.product,
			granules: this._agentGranuleSummaries(),
			displayedLayerIds,
			selectedGranuleIds: [...this._selectedIds]
		};
	}
	registerTileJsonForAgent(params) {
		const tileUrl = params.tilejson.tiles[0];
		if (!tileUrl) return {
			ok: false,
			status: "TileJSON did not include any tile URL."
		};
		const layerId = params.id ?? `titiler-cmr-${slug(params.name) || Date.now()}`;
		this._registerLayer({
			id: layerId,
			name: params.name,
			type: "raster",
			source: {
				type: "raster",
				tiles: [tileUrl],
				tileSize: tileSizeFromTemplate(tileUrl),
				...params.tilejson.minzoom != null ? { minzoom: params.tilejson.minzoom } : {},
				...params.tilejson.maxzoom != null ? { maxzoom: params.tilejson.maxzoom } : {}
			},
			nativeLayerIds: [],
			opacity: params.opacity ?? 1,
			metadata: params.metadata
		});
		const bounds = tileJsonBounds(params.tilejson);
		if (params.fitBounds !== false && bounds) this._options.fitBounds?.(bounds);
		const status = `Registered titiler-cmr layer ${layerId}.`;
		this._setStatus(status);
		return {
			ok: true,
			layerId,
			status
		};
	}
	async detectChangeForAgent(params) {
		this.expand();
		const product = params.product !== void 0 ? resolveProductForAgent(params.product) : getProduct(this._state.product);
		if (!product) return {
			ok: false,
			status: `Unknown OPERA product: ${params.product ?? this._state.product}`,
			product: this._state.product,
			band: params.band ?? "",
			displayedLayerIds: []
		};
		const bbox = params.bbox !== void 0 ? normalizeAgentBBox(params.bbox) : this._currentBBox();
		if (!bbox) return {
			ok: false,
			status: "Set or pass a bbox for change detection.",
			product: product.shortName,
			band: params.band ?? product.render.bands?.[0] ?? "",
			displayedLayerIds: []
		};
		const windowDays = Math.min(Math.max(params.windowDays ?? 7, 0), 90);
		const beforeRange = dateWindow(params.beforeDate, windowDays);
		const afterRange = dateWindow(params.afterDate, windowDays);
		const band = params.band ?? product.render.bands?.[0] ?? "";
		this._setStatus("Searching before/after OPERA granules…");
		try {
			const [beforeSearch, afterSearch] = await Promise.all([searchGranules({
				shortName: product.shortName,
				bbox,
				start: beforeRange.start,
				end: beforeRange.end,
				count: 20
			}), searchGranules({
				shortName: product.shortName,
				bbox,
				start: afterRange.start,
				end: afterRange.end,
				count: 20
			})]);
			const beforeGranule = closestGranule(beforeSearch.granules, params.beforeDate);
			const afterGranule = closestGranule(afterSearch.granules, params.afterDate);
			if (!beforeGranule || !afterGranule) return {
				ok: false,
				status: "No before/after granule pair found for the requested dates.",
				product: product.shortName,
				band,
				bbox,
				displayedLayerIds: []
			};
			this._state.product = product.shortName;
			this._state.bbox = bbox.map((v) => trimNumber(v)).join(", ");
			this._state.start = beforeRange.start;
			this._state.end = afterRange.end;
			this._state.count = 2;
			this._state.expression = params.expression ?? "";
			this._state.rescale = params.rescale ?? bandRenderDefaults(product.shortName, band).rescale;
			this._state.colormapName = params.colormapName ?? bandRenderDefaults(product.shortName, band).colormapName;
			this._granules = [beforeGranule, afterGranule];
			this._renderResults();
			this._syncForm();
			this._options.addGeoJsonLayer?.(`OPERA ${product.shortTitle} Change Pair`, {
				type: "FeatureCollection",
				features: [beforeGranule, afterGranule].filter((granule) => granule.geometry).map((granule, index) => ({
					type: "Feature",
					geometry: granule.geometry,
					properties: {
						_operaGranuleId: granule.id,
						id: granule.id,
						role: index === 0 ? "before" : "after",
						beginDate: granule.beginDate ?? ""
					}
				}))
			});
			this._options.fitBounds?.(this._combinedBounds(this._granules) ?? bbox);
			const beforeDisplay = await this.displayForAgent({
				granuleIds: [beforeGranule.id],
				band,
				rescale: params.rescale,
				colormapName: params.colormapName,
				expression: params.expression
			});
			const afterDisplay = await this.displayForAgent({
				granuleIds: [afterGranule.id],
				band,
				rescale: params.rescale,
				colormapName: params.colormapName,
				expression: params.expression
			});
			const [beforeStats, afterStats] = await Promise.all([this._statsForChange(product.shortName, beforeGranule, band, bbox, params.expression), this._statsForChange(product.shortName, afterGranule, band, bbox, params.expression)]);
			const change = changeDelta(beforeStats, afterStats);
			const status = hasStatisticError(beforeStats) || hasStatisticError(afterStats) ? `Change detection displayed for ${product.shortTitle} ${band}; statistics unavailable.` : `Change detection complete for ${product.shortTitle} ${band}.`;
			this._setStatus(status);
			const result = {
				ok: true,
				status,
				product: product.shortName,
				band,
				bbox,
				before: {
					date: params.beforeDate,
					granuleId: beforeGranule.id,
					granuleDate: beforeGranule.beginDate,
					layerIds: beforeDisplay.displayedLayerIds,
					statistics: beforeStats
				},
				after: {
					date: params.afterDate,
					granuleId: afterGranule.id,
					granuleDate: afterGranule.beginDate,
					layerIds: afterDisplay.displayedLayerIds,
					statistics: afterStats
				},
				change,
				displayedLayerIds: [...beforeDisplay.displayedLayerIds, ...afterDisplay.displayedLayerIds]
			};
			if (!hasStatisticError(beforeStats) && !hasStatisticError(afterStats)) result.derivedLayer = this._addChangeSummaryLayer(product.shortTitle, result);
			this._lastChangeResult = result;
			this._updateReportButton();
			return result;
		} catch (err) {
			return {
				ok: false,
				status: `Change detection failed: ${err instanceof Error ? err.message : String(err)}`,
				product: product.shortName,
				band,
				bbox,
				displayedLayerIds: []
			};
		}
	}
	async analyzeTimeSeriesForAgent(params) {
		this.expand();
		const product = params.product !== void 0 ? resolveProductForAgent(params.product) : getProduct(this._state.product);
		if (!product) return {
			ok: false,
			status: `Unknown OPERA product: ${params.product ?? this._state.product}`,
			product: this._state.product,
			band: params.band ?? "",
			observations: [],
			displayedLayerIds: []
		};
		const bbox = params.bbox !== void 0 ? normalizeAgentBBox(params.bbox) : this._currentBBox();
		if (!bbox) return {
			ok: false,
			status: "Set or pass a bbox for time-series analysis.",
			product: product.shortName,
			band: params.band ?? product.render.bands?.[0] ?? "",
			observations: [],
			displayedLayerIds: []
		};
		const count = Math.min(Math.max(Math.round(params.count ?? 12), 1), 100);
		const searchCount = Math.min(500, Math.max(count * 4, count));
		const band = params.band ?? product.render.bands?.[0] ?? "";
		this._setStatus("Searching OPERA time series…");
		try {
			const granules = selectTimeSeriesGranules((await searchGranules({
				shortName: product.shortName,
				bbox,
				start: params.start,
				end: params.end,
				count: searchCount
			})).granules, params.start, params.end, count, params.intervalDays);
			if (granules.length === 0) return {
				ok: false,
				status: "No granules found for the requested time series.",
				product: product.shortName,
				band,
				bbox,
				observations: [],
				displayedLayerIds: []
			};
			this._state.product = product.shortName;
			this._state.bbox = bbox.map((v) => trimNumber(v)).join(", ");
			this._state.start = params.start;
			this._state.end = params.end;
			this._state.count = granules.length;
			this._state.expression = params.expression ?? "";
			this._state.rescale = params.rescale ?? bandRenderDefaults(product.shortName, band).rescale;
			this._state.colormapName = params.colormapName ?? bandRenderDefaults(product.shortName, band).colormapName;
			this._granules = granules;
			this._renderResults();
			this._syncForm();
			this._options.addGeoJsonLayer?.(`OPERA ${product.shortTitle} Time Series`, {
				type: "FeatureCollection",
				features: granules.filter((granule) => granule.geometry).map((granule, index) => ({
					type: "Feature",
					geometry: granule.geometry,
					properties: {
						_operaGranuleId: granule.id,
						id: granule.id,
						sequence: index + 1,
						beginDate: granule.beginDate ?? ""
					}
				}))
			});
			this._options.fitBounds?.(this._combinedBounds(this._granules) ?? bbox);
			let displayedLayerIds = [];
			const endpoints = params.displayEndpoints ? uniqueGranules([granules[0], granules[granules.length - 1]]) : [];
			for (const granule of endpoints) {
				const display = await this.displayForAgent({
					granuleIds: [granule.id],
					band,
					rescale: params.rescale,
					colormapName: params.colormapName,
					expression: params.expression
				});
				displayedLayerIds = displayedLayerIds.concat(display.displayedLayerIds);
			}
			const observations = await Promise.all(granules.map(async (granule) => ({
				date: granule.beginDate?.slice(0, 10) ?? "",
				granuleId: granule.id,
				granuleDate: granule.beginDate,
				layerIds: displayedLayerIdsForGranule(granule.id, displayedLayerIds),
				statistics: await this._statsForChange(product.shortName, granule, band, bbox, params.expression)
			})));
			const stats = observations.map((item) => item.statistics).filter((item) => !!item);
			const trends = stats.length >= 2 ? changeDelta(stats[0], stats[stats.length - 1]) : {};
			const errorCount = stats.filter(hasStatisticError).length;
			const status = errorCount > 0 ? `Analyzed ${observations.length} ${product.shortTitle} observation(s); ${errorCount} statistic request(s) failed.` : `Analyzed ${observations.length} ${product.shortTitle} observation(s).`;
			this._setStatus(status);
			return {
				ok: true,
				status,
				product: product.shortName,
				band,
				bbox,
				observations,
				trends,
				displayedLayerIds
			};
		} catch (err) {
			return {
				ok: false,
				status: `Time-series analysis failed: ${err instanceof Error ? err.message : String(err)}`,
				product: product.shortName,
				band,
				bbox,
				observations: [],
				displayedLayerIds: []
			};
		}
	}
	exportChangeReportForAgent(params = {}) {
		const result = this._lastChangeResult;
		const format = params.format ?? "markdown";
		if (!result) return {
			ok: false,
			status: "Run change detection before exporting a change report.",
			format
		};
		const filename = changeReportFilename(result, format);
		const content = format === "json" ? JSON.stringify(result, null, 2) : buildChangeReportMarkdown(result);
		return {
			ok: true,
			status: `Prepared ${format} change report.`,
			filename,
			format,
			content
		};
	}
	_addChangeSummaryLayer(productTitle, result) {
		if (!result.bbox || !result.before || !result.after) return void 0;
		const name = `OPERA ${productTitle} Change Summary`;
		const changeType = classifyChange(result.change);
		this._options.addGeoJsonLayer?.(name, {
			type: "FeatureCollection",
			features: [{
				...bboxFeature$1(result.bbox),
				properties: {
					_operaChangeLayer: true,
					id: `${result.before.granuleId}-${result.after.granuleId}`,
					product: result.product,
					band: result.band,
					changeType,
					beforeDate: result.before.date,
					afterDate: result.after.date,
					beforeGranuleId: result.before.granuleId,
					afterGranuleId: result.after.granuleId,
					...prefixedProperties("before", result.before.statistics),
					...prefixedProperties("after", result.after.statistics),
					...prefixedProperties("change", result.change)
				}
			}]
		});
		return {
			name,
			featureCount: 1,
			changeType
		};
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
		const expression = this._state.expression.trim();
		const categorical = userColormap || expression ? void 0 : colormapForBand(product.shortName, band);
		this._setDisplayBusy(true);
		this._setStatus(`Requesting ${selected.length} granule(s) from titiler-cmr…`);
		try {
			const conceptId = selected[0].conceptId ?? await resolveConceptId(product.shortName);
			let ok = 0;
			await Promise.all(selected.map(async (granule) => {
				const url = buildTileJsonUrl({
					endpoint: this._state.endpoint || DEFAULT_TITILER_CMR_ENDPOINT,
					conceptId,
					backend: product.render.backend,
					granuleUr: granule.id,
					bands: band ? [band] : product.render.bands,
					bandsRegex: product.render.bandsRegex,
					rescale: userRescale || product.render.rescale,
					colormapName: userColormap || product.render.colormapName,
					colormap: categorical,
					expression
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
		} finally {
			this._setDisplayBusy(false);
		}
	}
	async _statsForChange(shortName, granule, band, bbox, expression) {
		const product = getProduct(shortName);
		if (!product) return void 0;
		const conceptId = granule.conceptId ?? await resolveConceptId(shortName);
		const expr = expression?.trim();
		const categorical = !expr && isCategoricalBand(shortName, band);
		const url = buildStatisticsUrl({
			endpoint: this._state.endpoint || DEFAULT_TITILER_CMR_ENDPOINT,
			conceptId,
			backend: product.render.backend,
			granuleUr: granule.id,
			bands: band ? [band] : product.render.bands,
			bandsRegex: product.render.bandsRegex,
			categorical,
			expression: expr,
			histogramBins: categorical ? void 0 : 20
		});
		let bandStats;
		try {
			bandStats = firstBandStats(await fetchStatistics(url, bboxFeature$1(bbox)));
		} catch (err) {
			return { error: err instanceof Error ? err.message : String(err) };
		}
		if (!bandStats) return { error: "No statistics returned for AOI." };
		if (isDswxWaterBand(shortName, band) && !expr) return waterStatisticsSummary(bandStats);
		return continuousStatisticsSummary(bandStats);
	}
	/** Toggle the Display button's loading state. */
	_setDisplayBusy(busy) {
		const btn = this._displayBtn;
		if (!btn) return;
		btn.classList.toggle("opera-busy", busy);
		btn.disabled = busy;
		btn.textContent = busy ? "Displaying…" : "Display";
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
	_agentGranuleSummaries() {
		return this._granules.map((granule) => ({
			id: granule.id,
			beginDate: granule.beginDate,
			endDate: granule.endDate,
			bbox: granule.bbox,
			bands: granuleBands(granule).map((band) => band.token),
			linkCount: granule.dataLinks.length
		}));
	}
	_selectGranulesForAgent(granuleIds, maxGranules) {
		const wanted = new Set((granuleIds ?? []).map((id) => id.trim()).filter(Boolean));
		const limit = maxGranules !== void 0 && Number.isFinite(maxGranules) ? Math.min(Math.max(Math.round(maxGranules), 1), 25) : granuleIds && granuleIds.length > 0 ? granuleIds.length : 1;
		const selected = wanted.size > 0 ? this._granules.filter((granule) => wanted.has(granule.id)) : this._granules.slice(0, limit);
		this._selectedIds = new Set(selected.map((granule) => granule.id));
		this._activeGranule = selected[0] ?? null;
		this._anchorId = this._activeGranule?.id ?? null;
		this._refreshSelectionUI(this._activeGranule?.id);
		return selected;
	}
	_setBandForAgent(band) {
		const token = band.trim();
		if (!token || !this._bandSelect) return;
		if (!Array.from(this._bandSelect.options).some((option) => option.value === token)) {
			const opt = document.createElement("option");
			opt.value = token;
			opt.textContent = token;
			this._bandSelect.appendChild(opt);
		}
		this._bandSelect.value = token;
		this._applyBandDefaults(token);
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
          <path d="M13 7 9 3 5 7l4 4"/>
          <path d="m17 11 4 4-4 4-4-4"/>
          <path d="m8 12 4 4 6-6-4-4Z"/>
          <path d="m16 8 3-3"/>
          <path d="M9 21a6 6 0 0 0-6-6"/>
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
		content.appendChild(this._buildReportButton());
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
		this._refreshExpressionPresets();
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
			this._updateExpressionHint();
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
		wrap.append(rescaleGroup, cmapGroup, this._buildExpressionGroup());
		return wrap;
	}
	/**
	* Optional band-math expression (rio-tiler `expression`). When set it
	* overrides plain band rendering everywhere (Display / Inspect / Statistics);
	* the selected band is `b1`. A per-band presets dropdown fills the field.
	*/
	_buildExpressionGroup() {
		const group = el("div", "plugin-control-group");
		const row = el("div", "opera-label-row");
		row.appendChild(label("Expression (band math)"));
		const presets = document.createElement("select");
		presets.className = "opera-expr-presets";
		presets.title = "Insert a ready-made expression";
		this._expressionPresetSelect = presets;
		presets.addEventListener("change", () => {
			const preset = this._currentExpressionPresets.find((p) => p.expression === presets.value);
			if (preset) this._applyExpressionPreset(preset);
			presets.selectedIndex = 0;
		});
		row.appendChild(presets);
		group.appendChild(row);
		const input = document.createElement("input");
		input.className = "plugin-control-input";
		input.type = "text";
		input.placeholder = "blank = raw band — e.g. 10*log10(b1)";
		input.value = this._state.expression;
		input.dataset.field = "expression";
		input.addEventListener("input", () => {
			this._state.expression = input.value;
			this._updateExpressionHint();
		});
		this._expressionInput = input;
		group.appendChild(input);
		const hint = el("div", "opera-expr-hint");
		hint.textContent = "Set a Rescale (min,max) above so the computed result displays.";
		this._expressionHint = hint;
		group.appendChild(hint);
		this._refreshExpressionPresets();
		this._updateExpressionHint();
		return group;
	}
	/** Apply a preset's expression plus its rescale/colormap, if any. */
	_applyExpressionPreset(preset) {
		this._setExpression(preset.expression);
		if (preset.rescale != null) {
			this._state.rescale = preset.rescale;
			if (this._rescaleInput) this._rescaleInput.value = preset.rescale;
		}
		if (preset.colormapName != null) {
			this._state.colormapName = preset.colormapName;
			if (this._colormapSelect) this._colormapSelect.value = preset.colormapName;
		}
		this._updateExpressionHint();
	}
	/**
	* Show a hint when an expression is set but no rescale is given: a computed
	* value rarely matches the band's default stretch, so it would render flat.
	*/
	_updateExpressionHint() {
		if (!this._expressionHint) return;
		const needsRescale = !!this._state.expression.trim() && !this._state.rescale.trim();
		this._expressionHint.style.display = needsRescale ? "block" : "none";
	}
	/** Set the expression field + state. */
	_setExpression(value) {
		this._state.expression = value;
		if (this._expressionInput) this._expressionInput.value = value;
		this._updateExpressionHint();
	}
	/** Rebuild the presets dropdown for the active product/band. */
	_refreshExpressionPresets() {
		const select = this._expressionPresetSelect;
		if (!select) return;
		const band = this._bandSelect?.value;
		const presets = expressionPresets(this._state.product, band);
		this._currentExpressionPresets = presets;
		select.innerHTML = "";
		const placeholder = document.createElement("option");
		placeholder.value = "";
		placeholder.textContent = "Presets…";
		select.appendChild(placeholder);
		for (const preset of presets) {
			const opt = document.createElement("option");
			opt.value = preset.expression;
			opt.textContent = preset.label;
			select.appendChild(opt);
		}
		select.disabled = presets.length === 0;
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
							endpoint: this._state.endpoint || DEFAULT_TITILER_CMR_ENDPOINT,
							conceptId,
							backend: product.render.backend,
							lon: lngLat.lng,
							lat: lngLat.lat,
							granuleUr: granule.id,
							bands: band ? [band] : product.render.bands,
							bandsRegex: product.render.bandsRegex,
							expression: this._state.expression.trim()
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
		panel.addEventListener("click", (ev) => {
			const target = ev.target;
			const rescaleBtn = target?.closest(".opera-stats-apply-rescale");
			if (rescaleBtn?.dataset.rescale) {
				this._applyRescale(rescaleBtn.dataset.rescale);
				return;
			}
			if (target?.closest(".opera-hist-download")) {
				const container = target.closest(".opera-hist");
				if (container) this._downloadHistogram(container);
			}
		});
		this._statsPanel = panel;
		return panel;
	}
	/** Fill the Rendering rescale field from a suggested "min,max" value. */
	_applyRescale(value) {
		this._state.rescale = value;
		if (this._rescaleInput) this._rescaleInput.value = value;
		this._setStatus(`Rescale set to ${value}. Click Display to apply it.`);
	}
	/** Export the histogram (data stashed on the container) as a standalone SVG. */
	_downloadHistogram(container) {
		const raw = container.dataset.hist;
		if (!raw) return;
		let data;
		try {
			data = JSON.parse(raw);
		} catch {
			this._setStatus("Could not read histogram data for export.");
			return;
		}
		const svg = buildHistogramSvg(data);
		const name = `histogram-${slug(data.band)}${data.granuleId ? `-${slug(data.granuleId)}` : ""}.svg`;
		const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = name;
		document.body.appendChild(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(url), 0);
		this._setStatus(`Downloaded ${name}.`);
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
		const expression = this._state.expression.trim();
		const categorical = !expression && isCategoricalBand(product.shortName, band);
		this._setStatsContent(`<div class="opera-stats-loading">Computing statistics for ${selected.length} granule(s)…</div>`);
		this._setStatus(`Computing statistics for ${selected.length} granule(s)…`);
		try {
			const conceptId = selected[0].conceptId ?? await resolveConceptId(product.shortName);
			const results = await Promise.all(selected.map(async (granule) => {
				try {
					return {
						granule,
						stats: await fetchStatistics(buildStatisticsUrl({
							endpoint: this._state.endpoint || DEFAULT_TITILER_CMR_ENDPOINT,
							conceptId,
							backend: product.render.backend,
							granuleUr: granule.id,
							bands: band ? [band] : product.render.bands,
							bandsRegex: product.render.bandsRegex,
							categorical,
							expression,
							histogramBins: categorical ? void 0 : 20
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
			return `<div class="opera-stats-block">${head}${isDswxWaterBand(shortName, band) && !this._state.expression.trim() ? renderWaterStats(bandStats) : renderContinuousStats(bandStats, band, granule.id)}</div>`;
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
	_buildReportButton() {
		const row = el("div", "opera-download-row");
		const reportBtn = document.createElement("button");
		reportBtn.type = "button";
		reportBtn.className = "plugin-control-button opera-secondary-button";
		reportBtn.textContent = "Download change report";
		reportBtn.title = "Download a Markdown report from the latest change detection result";
		reportBtn.disabled = !this._lastChangeResult;
		reportBtn.addEventListener("click", () => this._downloadChangeReport());
		this._downloadReportBtn = reportBtn;
		row.append(reportBtn);
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
	_downloadChangeReport() {
		const report = this.exportChangeReportForAgent({ format: "markdown" });
		if (!report.ok || !report.content || !report.filename) {
			this._setStatus(report.status);
			return;
		}
		this._downloadTextFile(report.filename, report.content, "text/markdown");
		this._setStatus(`Downloaded ${report.filename}.`);
	}
	_downloadTextFile(filename, content, type) {
		const blob = new Blob([content], { type });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	}
	_updateReportButton() {
		if (this._downloadReportBtn) this._downloadReportBtn.disabled = !this._lastChangeResult;
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
		this._lastStatus = message;
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
		const margin = 8;
		const minPanelHeight = 200;
		this._panel.style.top = "";
		this._panel.style.bottom = "";
		this._panel.style.left = "";
		this._panel.style.right = "";
		let available;
		switch (position) {
			case "top-left":
				this._panel.style.top = `${buttonTop + buttonRect.height + gap}px`;
				this._panel.style.left = `${buttonLeft}px`;
				available = mapRect.height - (buttonTop + buttonRect.height + gap);
				break;
			case "top-right":
				this._panel.style.top = `${buttonTop + buttonRect.height + gap}px`;
				this._panel.style.right = `${buttonRight}px`;
				available = mapRect.height - (buttonTop + buttonRect.height + gap);
				break;
			case "bottom-left":
				this._panel.style.bottom = `${buttonBottom + buttonRect.height + gap}px`;
				this._panel.style.left = `${buttonLeft}px`;
				available = mapRect.height - (buttonBottom + buttonRect.height + gap);
				break;
			case "bottom-right":
				this._panel.style.bottom = `${buttonBottom + buttonRect.height + gap}px`;
				this._panel.style.right = `${buttonRight}px`;
				available = mapRect.height - (buttonBottom + buttonRect.height + gap);
				break;
			default: available = mapRect.height;
		}
		this._panel.style.maxHeight = `${Math.max(minPanelHeight, available - margin)}px`;
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
function trimNumber(value) {
	return parseFloat(value.toFixed(6)).toString();
}
function normalizeAgentBBox(value) {
	const parts = Array.isArray(value) ? value : value.split(",").map((part) => Number(part.trim()));
	if (parts.length !== 4 || !parts.every(Number.isFinite)) return void 0;
	const [w, s, e, n] = parts.map(Number);
	if (w >= e || s >= n) return void 0;
	return [
		w,
		s,
		e,
		n
	];
}
function resolveProductForAgent(value) {
	const normalized = value.trim().toLowerCase();
	return OPERA_PRODUCTS.find((product) => product.shortName.toLowerCase() === normalized || product.shortTitle.toLowerCase() === normalized || product.title.toLowerCase() === normalized);
}
function dateWindow(date, windowDays) {
	const center = parseIsoDate(date);
	const days = Math.max(Math.round(windowDays), 0);
	return {
		start: addDays(center, -days).toISOString().slice(0, 10),
		end: addDays(center, days).toISOString().slice(0, 10)
	};
}
function parseIsoDate(value) {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
	if (!match) throw new Error(`Invalid date "${value}". Use YYYY-MM-DD.`);
	const year = Number(match[1]);
	const month = Number(match[2]) - 1;
	const day = Number(match[3]);
	const date = new Date(Date.UTC(year, month, day));
	if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month || date.getUTCDate() !== day) throw new Error(`Invalid date "${value}". Use YYYY-MM-DD.`);
	return date;
}
function addDays(date, days) {
	const next = new Date(date);
	next.setUTCDate(next.getUTCDate() + days);
	return next;
}
function closestGranule(granules, targetDate) {
	const target = parseIsoDate(targetDate).getTime();
	return [...granules].sort((a, b) => {
		return Math.abs(granuleTime(a) - target) - Math.abs(granuleTime(b) - target);
	})[0];
}
function selectTimeSeriesGranules(granules, start, end, count, intervalDays) {
	const sorted = granules.filter((granule) => Number.isFinite(granuleTime(granule))).sort((a, b) => granuleTime(a) - granuleTime(b));
	if (sorted.length <= count && !intervalDays) return sorted;
	const step = intervalDays ? Math.max(Math.round(intervalDays), 1) : 0;
	if (step > 0) {
		const picked = [];
		const used = /* @__PURE__ */ new Set();
		for (let cursor = parseIsoDate(start); cursor <= parseIsoDate(end) && picked.length < count; cursor = addDays(cursor, step)) {
			const target = cursor.getTime();
			const nearest = sorted.filter((granule) => !used.has(granule.id)).sort((a, b) => Math.abs(granuleTime(a) - target) - Math.abs(granuleTime(b) - target))[0];
			if (nearest) {
				picked.push(nearest);
				used.add(nearest.id);
			}
		}
		return picked.sort((a, b) => granuleTime(a) - granuleTime(b));
	}
	if (sorted.length <= count) return sorted;
	const result = [];
	const last = sorted.length - 1;
	for (let i = 0; i < count; i += 1) {
		const granule = sorted[Math.round(i / Math.max(count - 1, 1) * last)];
		if (granule && !result.some((item) => item.id === granule.id)) result.push(granule);
	}
	return result;
}
function uniqueGranules(granules) {
	const seen = /* @__PURE__ */ new Set();
	const result = [];
	for (const granule of granules) {
		if (!granule || seen.has(granule.id)) continue;
		seen.add(granule.id);
		result.push(granule);
	}
	return result;
}
function displayedLayerIdsForGranule(granuleId, layerIds) {
	const token = slug(granuleId);
	return layerIds.filter((id) => id.includes(token));
}
function granuleTime(granule) {
	const value = granule.beginDate ?? granule.endDate ?? "";
	const time = Date.parse(value);
	return Number.isFinite(time) ? time : Infinity;
}
function bboxFeature$1(bbox) {
	const [w, s, e, n] = bbox;
	return {
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
	};
}
function waterStatisticsSummary(stats) {
	let openWaterPixels = 0;
	let partialWaterPixels = 0;
	let validPixels = 0;
	if (stats.histogram) {
		const [counts, values] = stats.histogram;
		values.forEach((value, index) => {
			const count = counts[index] ?? 0;
			validPixels += count;
			if (value === 1) openWaterPixels = count;
			if (value === 2) partialWaterPixels = count;
		});
	}
	const surfaceWaterPixels = openWaterPixels + partialWaterPixels;
	return {
		metric: "DSWx water class area",
		validPixels,
		validKm2: pixelsToKm2(validPixels),
		openWaterPixels,
		openWaterKm2: pixelsToKm2(openWaterPixels),
		openWaterPercent: validPixels > 0 ? openWaterPixels / validPixels * 100 : null,
		partialWaterPixels,
		partialWaterKm2: pixelsToKm2(partialWaterPixels),
		surfaceWaterPixels,
		surfaceWaterKm2: pixelsToKm2(surfaceWaterPixels),
		surfaceWaterPercent: validPixels > 0 ? surfaceWaterPixels / validPixels * 100 : null
	};
}
function continuousStatisticsSummary(stats) {
	return {
		metric: "continuous raster statistics",
		min: stats.min,
		max: stats.max,
		mean: stats.mean,
		std: stats.std,
		median: stats.median ?? null,
		count: stats.count,
		validPixels: stats.validPixels ?? null,
		validPercent: stats.validPercent ?? null,
		validKm2: stats.validPixels != null ? pixelsToKm2(stats.validPixels) : null,
		percentile2: stats.percentile2 ?? null,
		percentile98: stats.percentile98 ?? null
	};
}
function changeDelta(before, after) {
	if (!before || !after) return {};
	const delta = {};
	for (const [key, afterValue] of Object.entries(after)) {
		const beforeValue = before[key];
		if (typeof beforeValue !== "number" || typeof afterValue !== "number") continue;
		const change = afterValue - beforeValue;
		delta[`${key}Before`] = beforeValue;
		delta[`${key}After`] = afterValue;
		delta[`${key}Change`] = change;
		delta[`${key}PercentChange`] = beforeValue !== 0 ? change / Math.abs(beforeValue) * 100 : null;
	}
	return delta;
}
function classifyChange(change) {
	const value = numericChangeMetric(change);
	if (value == null) return "unknown";
	const tolerance = Math.max(Math.abs(value) * .001, 1e-9);
	if (value > tolerance) return "gain";
	if (value < -tolerance) return "loss";
	return "stable";
}
function numericChangeMetric(change) {
	for (const key of [
		"surfaceWaterKm2Change",
		"openWaterKm2Change",
		"meanChange",
		"medianChange",
		"validKm2Change"
	]) {
		const value = change?.[key];
		if (typeof value === "number" && Number.isFinite(value)) return value;
	}
	return null;
}
function prefixedProperties(prefix, values) {
	const out = {};
	if (!values) return out;
	for (const [key, value] of Object.entries(values)) out[`${prefix}_${key}`] = value;
	return out;
}
function changeReportFilename(result, format) {
	const before = safeDateToken(result.before?.date ?? result.before?.granuleDate);
	const after = safeDateToken(result.after?.date ?? result.after?.granuleDate);
	const ext = format === "json" ? "json" : "md";
	return `opera-change-${slug(result.product)}-${slug(result.band)}-${before}-to-${after}.${ext}`;
}
function buildChangeReportMarkdown(result) {
	const lines = [
		"# OPERA Change Detection Report",
		"",
		`- Product: ${result.product}`,
		`- Band: ${result.band}`,
		`- Status: ${result.status}`
	];
	if (result.bbox) lines.push(`- AOI bbox: ${result.bbox.join(", ")}`);
	if (result.derivedLayer) lines.push(`- Derived layer: ${result.derivedLayer.name} (${result.derivedLayer.changeType ?? "unknown"})`);
	lines.push("", "## Before", "");
	lines.push(...observationReportLines(result.before));
	lines.push("", "## After", "");
	lines.push(...observationReportLines(result.after));
	lines.push("", "## Change", "");
	lines.push(...metricReportLines(result.change));
	return `${lines.join("\n")}\n`;
}
function observationReportLines(observation) {
	if (!observation) return ["No observation recorded."];
	return [
		`- Requested date: ${observation.date}`,
		`- Granule date: ${observation.granuleDate ?? "n/a"}`,
		`- Granule ID: ${observation.granuleId}`,
		`- Layer IDs: ${observation.layerIds.length ? observation.layerIds.join(", ") : "none"}`,
		"",
		...metricReportLines(observation.statistics)
	];
}
function metricReportLines(values) {
	if (!values || Object.keys(values).length === 0) return ["No metrics recorded."];
	return Object.entries(values).map(([key, value]) => {
		return `- ${key}: ${typeof value === "number" && Number.isFinite(value) ? formatNumber(value) : value == null ? "n/a" : String(value)}`;
	});
}
function safeDateToken(value) {
	return (value?.slice(0, 10) ?? "unknown").replace(/[^0-9a-z-]/gi, "");
}
function hasStatisticError(stats) {
	return typeof stats?.error === "string" && stats.error.length > 0;
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
function renderContinuousStats(s, band, granuleId) {
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
	return statGrid(rows) + renderHistogram(s, band, granuleId) + renderRescaleSuggestion(s);
}
/**
* A compact bar-chart of the band's value distribution over the AOI, from the
* `/statistics` histogram (`[counts, edges]`). The chart area is vertically
* resizable (CSS), and the histogram data is stashed on the container so the
* Download button can export a self-contained, labeled SVG. Empty when no
* histogram is present.
*/
function renderHistogram(s, band, granuleId) {
	const hist = s.histogram;
	if (!hist || hist[0].length === 0) return "";
	const [counts, edges] = hist;
	const categorical = edges.length === counts.length;
	const max = Math.max(...counts, 1);
	const bars = counts.map((c, i) => {
		const label = categorical ? formatStat(edges[i]) : `${formatStat(edges[i])}–${formatStat(edges[i + 1])}`;
		return `<span class="opera-hist-bar" style="height:${Math.max(Math.round(c / max * 100), c > 0 ? 2 : 0)}%" title="${escapeHtml(`${label}: ${c.toLocaleString()}`)}"></span>`;
	}).join("");
	return `<div class="opera-hist" data-hist="${escapeHtml(JSON.stringify({
		counts,
		edges,
		band: band ?? "band",
		granuleId
	}))}"><div class="opera-hist-bars" title="Drag the bottom-right corner to resize">${bars}</div><div class="opera-hist-axis"><span>${escapeHtml(formatStat(edges[0]))}</span><span>${escapeHtml(formatStat(edges[edges.length - 1]))}</span></div><button type="button" class="opera-link-button opera-hist-download">Download SVG</button></div>`;
}
/**
* Build a standalone, labeled SVG of a histogram for download. Self-contained
* (inline attributes, no external CSS or fonts beyond a generic family) so it
* renders on its own when opened as a file.
*/
function buildHistogramSvg(data) {
	const W = 480;
	const H = 260;
	const m = {
		t: 34,
		r: 14,
		b: 36,
		l: 52
	};
	const cw = W - m.l - m.r;
	const ch = H - m.t - m.b;
	const { counts, edges } = data;
	const max = Math.max(...counts, 1);
	const bw = cw / (counts.length || 1);
	const bars = counts.map((c, i) => {
		const h = c / max * ch;
		const x = m.l + i * bw;
		const y = m.t + (ch - h);
		return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(bw - 1, .5).toFixed(1)}" height="${h.toFixed(1)}" fill="#2b7fff"/>`;
	}).join("");
	const baseY = m.t + ch;
	const text = (x, y, value, anchor = "start", size = 12, weight = "normal") => `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="#333">${escapeHtml(value)}</text>`;
	const labels = text(W / 2, 20, `${data.band} — value distribution`, "middle", 14, "600") + text(m.l, H - 12, formatStat(edges[0]), "start") + text(m.l + cw, H - 12, formatStat(edges[edges.length - 1]), "end") + text(m.l - 6, m.t + 10, max.toLocaleString(), "end", 11) + text(m.l - 6, baseY, "0", "end", 11);
	const axis = `<line x1="${m.l}" y1="${baseY}" x2="${m.l + cw}" y2="${baseY}" stroke="#999" stroke-width="1"/>`;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="-apple-system, Segoe UI, Roboto, sans-serif"><rect width="${W}" height="${H}" fill="#ffffff"/>` + bars + axis + labels + `</svg>`;
}
/**
* A one-click "apply a 2–98% rescale" button, when the stats carry sensible
* percentile bounds. The bounds are stashed on `data-rescale` and applied by
* the panel's delegated click handler.
*/
function renderRescaleSuggestion(s) {
	const lo = s.percentile2;
	const hi = s.percentile98;
	if (lo == null || hi == null || !(hi > lo)) return "";
	const value = `${formatNumber(lo)},${formatNumber(hi)}`;
	return `<button type="button" class="plugin-control-button opera-secondary-button opera-block-button opera-stats-apply-rescale" data-rescale="${escapeHtml(value)}">Apply 2–98% rescale (${escapeHtml(value)})</button>`;
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
//#region node_modules/@strands-agents/sdk/dist/src/errors.js
/**
* Normalizes an unknown error value to an Error instance.
*
* This helper ensures that any thrown value (Error, string, number, etc.)
* is converted to a proper Error object for consistent error handling.
*
* @param error - The error value to normalize
* @returns An Error instance
*/
function normalizeError(error) {
	return error instanceof Error ? error : new Error(String(error));
}
//#endregion
//#region node_modules/@strands-agents/sdk/dist/src/types/json.js
/**
* Creates a deep copy of a value using JSON serialization.
*
* @param value - The value to copy
* @returns A deep copy of the value
* @throws Error if the value cannot be JSON serialized
*/
function deepCopy(value) {
	try {
		return JSON.parse(JSON.stringify(value));
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		throw new Error(`Unable to serialize tool result: ${errorMessage}`, { cause: error });
	}
}
/**
* Removes undefined values from an object.
* Useful for JSON serialization to avoid including undefined fields in output.
*
* @param obj - Object with potentially undefined values
* @returns New object with undefined values removed
*
* @example
* ```typescript
* const data = { name: 'test', value: undefined, count: 0 }
* const clean = omitUndefined(data)
* // Result: { name: 'test', count: 0 }
* ```
*/
function omitUndefined(obj) {
	const result = {};
	for (const [key, value] of Object.entries(obj)) if (value !== void 0) result[key] = value;
	return result;
}
//#endregion
//#region node_modules/@strands-agents/sdk/dist/src/types/media.js
/**
* Media and document content types for multimodal AI interactions.
*
* This module provides types for handling images, videos, and documents
* with support for multiple sources (bytes, S3, URLs, files).
*/
/**
* Cross-platform base64 encoding function that works in both browser and Node.js environments.
*/
function encodeBase64(input) {
	if (input instanceof Uint8Array) {
		if (typeof globalThis.Buffer === "function") return globalThis.Buffer.from(input).toString("base64");
		const CHUNK_SIZE = 32768;
		let binary = "";
		for (let i = 0; i < input.length; i += CHUNK_SIZE) binary += String.fromCharCode.apply(null, input.subarray(i, Math.min(i + CHUNK_SIZE, input.length)));
		return globalThis.btoa(binary);
	}
	if (typeof globalThis.btoa === "function") return globalThis.btoa(input);
	return globalThis.Buffer.from(input, "binary").toString("base64");
}
/**
* Cross-platform base64 decoding function that works in both browser and Node.js environments.
*
* @param input - Base64 encoded string to decode
* @returns Decoded bytes as Uint8Array
*/
function decodeBase64(input) {
	if (typeof globalThis.Buffer === "function") return new Uint8Array(globalThis.Buffer.from(input, "base64"));
	const binary = globalThis.atob(input);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}
/**
* S3 location for media and document sources.
*/
var S3Location = class S3Location {
	type = "s3";
	uri;
	bucketOwner;
	constructor(data) {
		this.uri = data.uri;
		if (data.bucketOwner !== void 0) this.bucketOwner = data.bucketOwner;
	}
	/**
	* Serializes the S3Location to a JSON-compatible S3LocationData object.
	* Called automatically by JSON.stringify().
	*/
	toJSON() {
		return omitUndefined({
			type: this.type,
			uri: this.uri,
			bucketOwner: this.bucketOwner
		});
	}
	/**
	* Creates an S3Location instance from S3LocationData.
	*
	* @param data - S3LocationData to deserialize
	* @returns S3Location instance
	*/
	static fromJSON(data) {
		return new S3Location(data);
	}
};
/**
* Image content block.
*/
var ImageBlock = class ImageBlock {
	/**
	* Discriminator for image content.
	*/
	type = "imageBlock";
	/**
	* Image format.
	*/
	format;
	/**
	* Image source.
	*/
	source;
	constructor(data) {
		this.format = data.format;
		this.source = this._convertSource(data.source);
	}
	_convertSource(source) {
		if ("bytes" in source) return {
			type: "imageSourceBytes",
			bytes: source.bytes
		};
		if ("url" in source) return {
			type: "imageSourceUrl",
			url: source.url
		};
		if ("location" in source) return {
			type: "imageSourceS3Location",
			location: new S3Location(source.location)
		};
		throw new Error("Invalid image source");
	}
	/**
	* Serializes the ImageBlock to a JSON-compatible ContentBlockData object.
	* Called automatically by JSON.stringify().
	* Uint8Array bytes are encoded as base64 string.
	*/
	toJSON() {
		let source;
		if (this.source.type === "imageSourceBytes") source = { bytes: encodeBase64(this.source.bytes) };
		else if (this.source.type === "imageSourceUrl") source = { url: this.source.url };
		else source = { location: this.source.location.toJSON() };
		return { image: {
			format: this.format,
			source
		} };
	}
	/**
	* Creates an ImageBlock instance from its wrapped data format.
	* Base64-encoded bytes are decoded back to Uint8Array.
	*
	* @param data - Wrapped ImageBlockData to deserialize (accepts both string and Uint8Array for bytes)
	* @returns ImageBlock instance
	*/
	static fromJSON(data) {
		const image = data.image;
		let source;
		if ("bytes" in image.source) {
			const bytes = image.source.bytes;
			source = { bytes: typeof bytes === "string" ? decodeBase64(bytes) : bytes };
		} else if ("url" in image.source) source = { url: image.source.url };
		else source = { location: image.source.location };
		return new ImageBlock({
			format: image.format,
			source
		});
	}
};
/**
* Video content block.
*/
var VideoBlock = class VideoBlock {
	/**
	* Discriminator for video content.
	*/
	type = "videoBlock";
	/**
	* Video format.
	*/
	format;
	/**
	* Video source.
	*/
	source;
	constructor(data) {
		this.format = data.format;
		this.source = this._convertSource(data.source);
	}
	_convertSource(source) {
		if ("bytes" in source) return {
			type: "videoSourceBytes",
			bytes: source.bytes
		};
		if ("location" in source) return {
			type: "videoSourceS3Location",
			location: new S3Location(source.location)
		};
		throw new Error("Invalid video source");
	}
	/**
	* Serializes the VideoBlock to a JSON-compatible ContentBlockData object.
	* Called automatically by JSON.stringify().
	* Uint8Array bytes are encoded as base64 string.
	*/
	toJSON() {
		let source;
		if (this.source.type === "videoSourceBytes") source = { bytes: encodeBase64(this.source.bytes) };
		else source = { location: this.source.location.toJSON() };
		return { video: {
			format: this.format,
			source
		} };
	}
	/**
	* Creates a VideoBlock instance from its wrapped data format.
	* Base64-encoded bytes are decoded back to Uint8Array.
	*
	* @param data - Wrapped VideoBlockData to deserialize (accepts both string and Uint8Array for bytes)
	* @returns VideoBlock instance
	*/
	static fromJSON(data) {
		const video = data.video;
		let source;
		if ("bytes" in video.source) {
			const bytes = video.source.bytes;
			source = { bytes: typeof bytes === "string" ? decodeBase64(bytes) : bytes };
		} else source = { location: video.source.location };
		return new VideoBlock({
			format: video.format,
			source
		});
	}
};
/**
* Document content block.
*/
var DocumentBlock = class DocumentBlock {
	/**
	* Discriminator for document content.
	*/
	type = "documentBlock";
	/**
	* Document name.
	*/
	name;
	/**
	* Document format.
	*/
	format;
	/**
	* Document source.
	*/
	source;
	/**
	* Citation configuration.
	*/
	citations;
	/**
	* Context information for the document.
	*/
	context;
	constructor(data) {
		this.name = data.name;
		this.format = data.format;
		this.source = this._convertSource(data.source);
		if (data.citations !== void 0) this.citations = data.citations;
		if (data.context !== void 0) this.context = data.context;
	}
	_convertSource(source) {
		if ("bytes" in source) return {
			type: "documentSourceBytes",
			bytes: source.bytes
		};
		if ("text" in source) return {
			type: "documentSourceText",
			text: source.text
		};
		if ("content" in source) return {
			type: "documentSourceContentBlock",
			content: source.content.map((block) => new TextBlock(block.text))
		};
		if ("location" in source) return {
			type: "documentSourceS3Location",
			location: new S3Location(source.location)
		};
		throw new Error("Invalid document source");
	}
	/**
	* Serializes the DocumentBlock to a JSON-compatible ContentBlockData object.
	* Called automatically by JSON.stringify().
	* Uint8Array bytes are encoded as base64 string.
	*/
	toJSON() {
		let source;
		if (this.source.type === "documentSourceBytes") source = { bytes: encodeBase64(this.source.bytes) };
		else if (this.source.type === "documentSourceText") source = { text: this.source.text };
		else if (this.source.type === "documentSourceContentBlock") source = { content: this.source.content.map((block) => block.toJSON()) };
		else source = { location: this.source.location.toJSON() };
		return { document: omitUndefined({
			name: this.name,
			format: this.format,
			source,
			citations: this.citations,
			context: this.context
		}) };
	}
	/**
	* Creates a DocumentBlock instance from its wrapped data format.
	* Base64-encoded bytes are decoded back to Uint8Array.
	*
	* @param data - Wrapped DocumentBlockData to deserialize (accepts both string and Uint8Array for bytes)
	* @returns DocumentBlock instance
	*/
	static fromJSON(data) {
		const doc = data.document;
		let source;
		if ("bytes" in doc.source) {
			const bytes = doc.source.bytes;
			source = { bytes: typeof bytes === "string" ? decodeBase64(bytes) : bytes };
		} else if ("text" in doc.source) source = { text: doc.source.text };
		else if ("content" in doc.source) source = { content: doc.source.content };
		else source = { location: doc.source.location };
		const result = {
			name: doc.name,
			format: doc.format,
			source
		};
		if (doc.citations !== void 0) result.citations = doc.citations;
		if (doc.context !== void 0) result.context = doc.context;
		return new DocumentBlock(result);
	}
};
//#endregion
//#region node_modules/@strands-agents/sdk/dist/src/types/messages.js
/**
* Text content block within a message.
*/
var TextBlock = class TextBlock {
	/**
	* Discriminator for text content.
	*/
	type = "textBlock";
	/**
	* Plain text content.
	*/
	text;
	constructor(data) {
		this.text = data;
	}
	/**
	* Serializes the TextBlock to a JSON-compatible TextBlockData object.
	* Called automatically by JSON.stringify().
	*/
	toJSON() {
		return { text: this.text };
	}
	/**
	* Creates a TextBlock instance from TextBlockData.
	*
	* @param data - TextBlockData to deserialize
	* @returns TextBlock instance
	*/
	static fromJSON(data) {
		return new TextBlock(data.text);
	}
};
/**
* Tool result content block.
*/
var ToolResultBlock = class ToolResultBlock {
	/**
	* Discriminator for tool result content.
	*/
	type = "toolResultBlock";
	/**
	* The ID of the tool use that this result corresponds to.
	*/
	toolUseId;
	/**
	* Status of the tool execution.
	*/
	status;
	/**
	* The content returned by the tool.
	*/
	content;
	/**
	* The original error object when status is 'error'.
	* Available for inspection by hooks, error handlers, and agent loop.
	* Tools must wrap non-Error thrown values into Error objects.
	*/
	error;
	constructor(data) {
		this.toolUseId = data.toolUseId;
		this.status = data.status;
		this.content = data.content;
		if (data.error !== void 0) this.error = data.error;
	}
	/**
	* Serializes the ToolResultBlock to a JSON-compatible ContentBlockData object.
	* Called automatically by JSON.stringify().
	* Note: The error field is not serialized (deferred for future implementation).
	*/
	toJSON() {
		return { toolResult: {
			toolUseId: this.toolUseId,
			status: this.status,
			content: this.content.map((block) => block.toJSON())
		} };
	}
	/**
	* Creates a ToolResultBlock instance from its wrapped data format.
	*
	* @param data - Wrapped ToolResultBlockData to deserialize
	* @returns ToolResultBlock instance
	*/
	static fromJSON(data) {
		const content = data.toolResult.content.map(toolResultContentFromData);
		return new ToolResultBlock({
			toolUseId: data.toolResult.toolUseId,
			status: data.toolResult.status,
			content
		});
	}
};
/**
* Converts a single ToolResultContentData to a ToolResultContent class instance.
*
* @param data - The tool result content data to convert
* @returns A ToolResultContent instance of the appropriate type
* @throws Error if the content data type is unknown
*/
function toolResultContentFromData(data) {
	if ("text" in data) return new TextBlock(data.text);
	if ("json" in data) return new JsonBlock(data);
	if ("image" in data) return ImageBlock.fromJSON(data);
	if ("video" in data) return VideoBlock.fromJSON(data);
	if ("document" in data) return DocumentBlock.fromJSON(data);
	throw new Error("Unknown ToolResultContentData type");
}
/**
* JSON content block within a message.
* Used for structured data returned from tools or model responses.
*/
var JsonBlock = class JsonBlock {
	/**
	* Discriminator for JSON content.
	*/
	type = "jsonBlock";
	/**
	* Structured JSON data.
	*/
	json;
	constructor(data) {
		this.json = data.json;
	}
	/**
	* Serializes the JsonBlock to a JSON-compatible JsonBlockData object.
	* Called automatically by JSON.stringify().
	*/
	toJSON() {
		return { json: this.json };
	}
	/**
	* Creates a JsonBlock instance from JsonBlockData.
	*
	* @param data - JsonBlockData to deserialize
	* @returns JsonBlock instance
	*/
	static fromJSON(data) {
		return new JsonBlock(data);
	}
};
//#endregion
//#region node_modules/zod/v4/core/core.js
var _a$1;
function $constructor(name, initializer, params) {
	function init(inst, def) {
		if (!inst._zod) Object.defineProperty(inst, "_zod", {
			value: {
				def,
				constr: _,
				traits: /* @__PURE__ */ new Set()
			},
			enumerable: false
		});
		if (inst._zod.traits.has(name)) return;
		inst._zod.traits.add(name);
		initializer(inst, def);
		const proto = _.prototype;
		const keys = Object.keys(proto);
		for (let i = 0; i < keys.length; i++) {
			const k = keys[i];
			if (!(k in inst)) inst[k] = proto[k].bind(inst);
		}
	}
	const Parent = params?.Parent ?? Object;
	class Definition extends Parent {}
	Object.defineProperty(Definition, "name", { value: name });
	function _(def) {
		var _a;
		const inst = params?.Parent ? new Definition() : this;
		init(inst, def);
		(_a = inst._zod).deferred ?? (_a.deferred = []);
		for (const fn of inst._zod.deferred) fn();
		return inst;
	}
	Object.defineProperty(_, "init", { value: init });
	Object.defineProperty(_, Symbol.hasInstance, { value: (inst) => {
		if (params?.Parent && inst instanceof params.Parent) return true;
		return inst?._zod?.traits?.has(name);
	} });
	Object.defineProperty(_, "name", { value: name });
	return _;
}
var $ZodAsyncError = class extends Error {
	constructor() {
		super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
	}
};
var $ZodEncodeError = class extends Error {
	constructor(name) {
		super(`Encountered unidirectional transform during encode: ${name}`);
		this.name = "ZodEncodeError";
	}
};
(_a$1 = globalThis).__zod_globalConfig ?? (_a$1.__zod_globalConfig = {});
var globalConfig = globalThis.__zod_globalConfig;
function config(newConfig) {
	if (newConfig) Object.assign(globalConfig, newConfig);
	return globalConfig;
}
//#endregion
//#region node_modules/zod/v4/core/util.js
function getEnumValues(entries) {
	const numericValues = Object.values(entries).filter((v) => typeof v === "number");
	return Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
}
function jsonStringifyReplacer(_, value) {
	if (typeof value === "bigint") return value.toString();
	return value;
}
function cached(getter) {
	return { get value() {
		{
			const value = getter();
			Object.defineProperty(this, "value", { value });
			return value;
		}
		throw new Error("cached value already set");
	} };
}
function nullish(input) {
	return input === null || input === void 0;
}
function cleanRegex(source) {
	const start = source.startsWith("^") ? 1 : 0;
	const end = source.endsWith("$") ? source.length - 1 : source.length;
	return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
	const ratio = val / step;
	const roundedRatio = Math.round(ratio);
	const tolerance = Number.EPSILON * Math.max(Math.abs(ratio), 1);
	if (Math.abs(ratio - roundedRatio) < tolerance) return 0;
	return ratio - roundedRatio;
}
var EVALUATING = /* @__PURE__*/ Symbol("evaluating");
function defineLazy(object, key, getter) {
	let value = void 0;
	Object.defineProperty(object, key, {
		get() {
			if (value === EVALUATING) return;
			if (value === void 0) {
				value = EVALUATING;
				value = getter();
			}
			return value;
		},
		set(v) {
			Object.defineProperty(object, key, { value: v });
		},
		configurable: true
	});
}
function assignProp(target, prop, value) {
	Object.defineProperty(target, prop, {
		value,
		writable: true,
		enumerable: true,
		configurable: true
	});
}
function mergeDefs(...defs) {
	const mergedDescriptors = {};
	for (const def of defs) Object.assign(mergedDescriptors, Object.getOwnPropertyDescriptors(def));
	return Object.defineProperties({}, mergedDescriptors);
}
function esc(str) {
	return JSON.stringify(str);
}
function slugify(input) {
	return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
var captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {};
function isObject(data) {
	return typeof data === "object" && data !== null && !Array.isArray(data);
}
var allowsEval = /* @__PURE__*/ cached(() => {
	if (globalConfig.jitless) return false;
	if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) return false;
	try {
		new Function("");
		return true;
	} catch (_) {
		return false;
	}
});
function isPlainObject(o) {
	if (isObject(o) === false) return false;
	const ctor = o.constructor;
	if (ctor === void 0) return true;
	if (typeof ctor !== "function") return true;
	const prot = ctor.prototype;
	if (isObject(prot) === false) return false;
	if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) return false;
	return true;
}
function shallowClone(o) {
	if (isPlainObject(o)) return { ...o };
	if (Array.isArray(o)) return [...o];
	if (o instanceof Map) return new Map(o);
	if (o instanceof Set) return new Set(o);
	return o;
}
var propertyKeyTypes = /* @__PURE__*/ new Set([
	"string",
	"number",
	"symbol"
]);
function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
	const cl = new inst._zod.constr(def ?? inst._zod.def);
	if (!def || params?.parent) cl._zod.parent = inst;
	return cl;
}
function normalizeParams(_params) {
	const params = _params;
	if (!params) return {};
	if (typeof params === "string") return { error: () => params };
	if (params?.message !== void 0) {
		if (params?.error !== void 0) throw new Error("Cannot specify both `message` and `error` params");
		params.error = params.message;
	}
	delete params.message;
	if (typeof params.error === "string") return {
		...params,
		error: () => params.error
	};
	return params;
}
function optionalKeys(shape) {
	return Object.keys(shape).filter((k) => {
		return shape[k]._zod.optin === "optional" && shape[k]._zod.optout === "optional";
	});
}
var NUMBER_FORMAT_RANGES = {
	safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
	int32: [-2147483648, 2147483647],
	uint32: [0, 4294967295],
	float32: [-34028234663852886e22, 34028234663852886e22],
	float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
};
function pick(schema, mask) {
	const currDef = schema._zod.def;
	const checks = currDef.checks;
	if (checks && checks.length > 0) throw new Error(".pick() cannot be used on object schemas containing refinements");
	return clone(schema, mergeDefs(schema._zod.def, {
		get shape() {
			const newShape = {};
			for (const key in mask) {
				if (!(key in currDef.shape)) throw new Error(`Unrecognized key: "${key}"`);
				if (!mask[key]) continue;
				newShape[key] = currDef.shape[key];
			}
			assignProp(this, "shape", newShape);
			return newShape;
		},
		checks: []
	}));
}
function omit(schema, mask) {
	const currDef = schema._zod.def;
	const checks = currDef.checks;
	if (checks && checks.length > 0) throw new Error(".omit() cannot be used on object schemas containing refinements");
	return clone(schema, mergeDefs(schema._zod.def, {
		get shape() {
			const newShape = { ...schema._zod.def.shape };
			for (const key in mask) {
				if (!(key in currDef.shape)) throw new Error(`Unrecognized key: "${key}"`);
				if (!mask[key]) continue;
				delete newShape[key];
			}
			assignProp(this, "shape", newShape);
			return newShape;
		},
		checks: []
	}));
}
function extend(schema, shape) {
	if (!isPlainObject(shape)) throw new Error("Invalid input to extend: expected a plain object");
	const checks = schema._zod.def.checks;
	if (checks && checks.length > 0) {
		const existingShape = schema._zod.def.shape;
		for (const key in shape) if (Object.getOwnPropertyDescriptor(existingShape, key) !== void 0) throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
	}
	return clone(schema, mergeDefs(schema._zod.def, { get shape() {
		const _shape = {
			...schema._zod.def.shape,
			...shape
		};
		assignProp(this, "shape", _shape);
		return _shape;
	} }));
}
function safeExtend(schema, shape) {
	if (!isPlainObject(shape)) throw new Error("Invalid input to safeExtend: expected a plain object");
	return clone(schema, mergeDefs(schema._zod.def, { get shape() {
		const _shape = {
			...schema._zod.def.shape,
			...shape
		};
		assignProp(this, "shape", _shape);
		return _shape;
	} }));
}
function merge(a, b) {
	if (a._zod.def.checks?.length) throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
	return clone(a, mergeDefs(a._zod.def, {
		get shape() {
			const _shape = {
				...a._zod.def.shape,
				...b._zod.def.shape
			};
			assignProp(this, "shape", _shape);
			return _shape;
		},
		get catchall() {
			return b._zod.def.catchall;
		},
		checks: b._zod.def.checks ?? []
	}));
}
function partial(Class, schema, mask) {
	const checks = schema._zod.def.checks;
	if (checks && checks.length > 0) throw new Error(".partial() cannot be used on object schemas containing refinements");
	return clone(schema, mergeDefs(schema._zod.def, {
		get shape() {
			const oldShape = schema._zod.def.shape;
			const shape = { ...oldShape };
			if (mask) for (const key in mask) {
				if (!(key in oldShape)) throw new Error(`Unrecognized key: "${key}"`);
				if (!mask[key]) continue;
				shape[key] = Class ? new Class({
					type: "optional",
					innerType: oldShape[key]
				}) : oldShape[key];
			}
			else for (const key in oldShape) shape[key] = Class ? new Class({
				type: "optional",
				innerType: oldShape[key]
			}) : oldShape[key];
			assignProp(this, "shape", shape);
			return shape;
		},
		checks: []
	}));
}
function required(Class, schema, mask) {
	return clone(schema, mergeDefs(schema._zod.def, { get shape() {
		const oldShape = schema._zod.def.shape;
		const shape = { ...oldShape };
		if (mask) for (const key in mask) {
			if (!(key in shape)) throw new Error(`Unrecognized key: "${key}"`);
			if (!mask[key]) continue;
			shape[key] = new Class({
				type: "nonoptional",
				innerType: oldShape[key]
			});
		}
		else for (const key in oldShape) shape[key] = new Class({
			type: "nonoptional",
			innerType: oldShape[key]
		});
		assignProp(this, "shape", shape);
		return shape;
	} }));
}
function aborted(x, startIndex = 0) {
	if (x.aborted === true) return true;
	for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue !== true) return true;
	return false;
}
function explicitlyAborted(x, startIndex = 0) {
	if (x.aborted === true) return true;
	for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue === false) return true;
	return false;
}
function prefixIssues(path, issues) {
	return issues.map((iss) => {
		var _a;
		(_a = iss).path ?? (_a.path = []);
		iss.path.unshift(path);
		return iss;
	});
}
function unwrapMessage(message) {
	return typeof message === "string" ? message : message?.message;
}
function finalizeIssue(iss, ctx, config) {
	const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config.customError?.(iss)) ?? unwrapMessage(config.localeError?.(iss)) ?? "Invalid input";
	const { inst: _inst, continue: _continue, input: _input, ...rest } = iss;
	rest.path ?? (rest.path = []);
	rest.message = message;
	if (ctx?.reportInput) rest.input = _input;
	return rest;
}
function getLengthableOrigin(input) {
	if (Array.isArray(input)) return "array";
	if (typeof input === "string") return "string";
	return "unknown";
}
function issue(...args) {
	const [iss, input, inst] = args;
	if (typeof iss === "string") return {
		message: iss,
		code: "custom",
		input,
		inst
	};
	return { ...iss };
}
//#endregion
//#region node_modules/zod/v4/core/errors.js
var initializer$1 = (inst, def) => {
	inst.name = "$ZodError";
	Object.defineProperty(inst, "_zod", {
		value: inst._zod,
		enumerable: false
	});
	Object.defineProperty(inst, "issues", {
		value: def,
		enumerable: false
	});
	inst.message = JSON.stringify(def, jsonStringifyReplacer, 2);
	Object.defineProperty(inst, "toString", {
		value: () => inst.message,
		enumerable: false
	});
};
var $ZodError = $constructor("$ZodError", initializer$1);
var $ZodRealError = $constructor("$ZodError", initializer$1, { Parent: Error });
function flattenError(error, mapper = (issue) => issue.message) {
	const fieldErrors = {};
	const formErrors = [];
	for (const sub of error.issues) if (sub.path.length > 0) {
		fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
		fieldErrors[sub.path[0]].push(mapper(sub));
	} else formErrors.push(mapper(sub));
	return {
		formErrors,
		fieldErrors
	};
}
function formatError(error, mapper = (issue) => issue.message) {
	const fieldErrors = { _errors: [] };
	const processError = (error, path = []) => {
		for (const issue of error.issues) if (issue.code === "invalid_union" && issue.errors.length) issue.errors.map((issues) => processError({ issues }, [...path, ...issue.path]));
		else if (issue.code === "invalid_key") processError({ issues: issue.issues }, [...path, ...issue.path]);
		else if (issue.code === "invalid_element") processError({ issues: issue.issues }, [...path, ...issue.path]);
		else {
			const fullpath = [...path, ...issue.path];
			if (fullpath.length === 0) fieldErrors._errors.push(mapper(issue));
			else {
				let curr = fieldErrors;
				let i = 0;
				while (i < fullpath.length) {
					const el = fullpath[i];
					if (!(i === fullpath.length - 1)) curr[el] = curr[el] || { _errors: [] };
					else {
						curr[el] = curr[el] || { _errors: [] };
						curr[el]._errors.push(mapper(issue));
					}
					curr = curr[el];
					i++;
				}
			}
		}
	};
	processError(error);
	return fieldErrors;
}
//#endregion
//#region node_modules/zod/v4/core/parse.js
var _parse = (_Err) => (schema, value, _ctx, _params) => {
	const ctx = _ctx ? {
		..._ctx,
		async: false
	} : { async: false };
	const result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) throw new $ZodAsyncError();
	if (result.issues.length) {
		const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
		captureStackTrace(e, _params?.callee);
		throw e;
	}
	return result.value;
};
var _parseAsync = (_Err) => async (schema, value, _ctx, params) => {
	const ctx = _ctx ? {
		..._ctx,
		async: true
	} : { async: true };
	let result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) result = await result;
	if (result.issues.length) {
		const e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
		captureStackTrace(e, params?.callee);
		throw e;
	}
	return result.value;
};
var _safeParse = (_Err) => (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		async: false
	} : { async: false };
	const result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) throw new $ZodAsyncError();
	return result.issues.length ? {
		success: false,
		error: new (_Err ?? $ZodError)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
	} : {
		success: true,
		data: result.value
	};
};
var safeParse$1 = /* @__PURE__*/ _safeParse($ZodRealError);
var _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		async: true
	} : { async: true };
	let result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) result = await result;
	return result.issues.length ? {
		success: false,
		error: new _Err(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
	} : {
		success: true,
		data: result.value
	};
};
var safeParseAsync$1 = /* @__PURE__*/ _safeParseAsync($ZodRealError);
var _encode = (_Err) => (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		direction: "backward"
	} : { direction: "backward" };
	return _parse(_Err)(schema, value, ctx);
};
var _decode = (_Err) => (schema, value, _ctx) => {
	return _parse(_Err)(schema, value, _ctx);
};
var _encodeAsync = (_Err) => async (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		direction: "backward"
	} : { direction: "backward" };
	return _parseAsync(_Err)(schema, value, ctx);
};
var _decodeAsync = (_Err) => async (schema, value, _ctx) => {
	return _parseAsync(_Err)(schema, value, _ctx);
};
var _safeEncode = (_Err) => (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		direction: "backward"
	} : { direction: "backward" };
	return _safeParse(_Err)(schema, value, ctx);
};
var _safeDecode = (_Err) => (schema, value, _ctx) => {
	return _safeParse(_Err)(schema, value, _ctx);
};
var _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		direction: "backward"
	} : { direction: "backward" };
	return _safeParseAsync(_Err)(schema, value, ctx);
};
var _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
	return _safeParseAsync(_Err)(schema, value, _ctx);
};
//#endregion
//#region node_modules/zod/v4/core/regexes.js
/**
* @deprecated CUID v1 is deprecated by its authors due to information leakage
* (timestamps embedded in the id). Use {@link cuid2} instead.
* See https://github.com/paralleldrive/cuid.
*/
var cuid = /^[cC][0-9a-z]{6,}$/;
var cuid2 = /^[0-9a-z]+$/;
var ulid = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/;
var xid = /^[0-9a-vA-V]{20}$/;
var ksuid = /^[A-Za-z0-9]{27}$/;
var nanoid = /^[a-zA-Z0-9_-]{21}$/;
/** ISO 8601-1 duration regex. Does not support the 8601-2 extensions like negative durations or fractional/negative components. */
var duration$1 = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
/** A regex for any UUID-like identifier: 8-4-4-4-12 hex pattern */
var guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
/** Returns a regex for validating an RFC 9562/4122 UUID.
*
* @param version Optionally specify a version 1-8. If no version is specified, all versions are supported. */
var uuid = (version) => {
	if (!version) return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
	return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
/** Practical email validation */
var email = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
var _emoji$1 = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
function emoji() {
	return new RegExp(_emoji$1, "u");
}
var ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
var cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
var cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
var base64url = /^[A-Za-z0-9_-]*$/;
var httpProtocol = /^https?$/;
var e164 = /^\+[1-9]\d{6,14}$/;
var dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
var date$1 = /*@__PURE__*/ new RegExp(`^${dateSource}$`);
function timeSource(args) {
	const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
	return typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
}
function time$1(args) {
	return new RegExp(`^${timeSource(args)}$`);
}
function datetime$1(args) {
	const time = timeSource({ precision: args.precision });
	const opts = ["Z"];
	if (args.local) opts.push("");
	if (args.offset) opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
	const timeRegex = `${time}(?:${opts.join("|")})`;
	return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
var string$1 = (params) => {
	const regex = params ? `[\\s\\S]{${params?.minimum ?? 0},${params?.maximum ?? ""}}` : `[\\s\\S]*`;
	return new RegExp(`^${regex}$`);
};
var integer = /^-?\d+$/;
var number$1 = /^-?\d+(?:\.\d+)?$/;
var boolean$1 = /^(?:true|false)$/i;
var lowercase = /^[^A-Z]*$/;
var uppercase = /^[^a-z]*$/;
//#endregion
//#region node_modules/zod/v4/core/checks.js
var $ZodCheck = /*@__PURE__*/ $constructor("$ZodCheck", (inst, def) => {
	var _a;
	inst._zod ?? (inst._zod = {});
	inst._zod.def = def;
	(_a = inst._zod).onattach ?? (_a.onattach = []);
});
var numericOriginMap = {
	number: "number",
	bigint: "bigint",
	object: "date"
};
var $ZodCheckLessThan = /*@__PURE__*/ $constructor("$ZodCheckLessThan", (inst, def) => {
	$ZodCheck.init(inst, def);
	const origin = numericOriginMap[typeof def.value];
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		const curr = (def.inclusive ? bag.maximum : bag.exclusiveMaximum) ?? Number.POSITIVE_INFINITY;
		if (def.value < curr) if (def.inclusive) bag.maximum = def.value;
		else bag.exclusiveMaximum = def.value;
	});
	inst._zod.check = (payload) => {
		if (def.inclusive ? payload.value <= def.value : payload.value < def.value) return;
		payload.issues.push({
			origin,
			code: "too_big",
			maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
			input: payload.value,
			inclusive: def.inclusive,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckGreaterThan = /*@__PURE__*/ $constructor("$ZodCheckGreaterThan", (inst, def) => {
	$ZodCheck.init(inst, def);
	const origin = numericOriginMap[typeof def.value];
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		const curr = (def.inclusive ? bag.minimum : bag.exclusiveMinimum) ?? Number.NEGATIVE_INFINITY;
		if (def.value > curr) if (def.inclusive) bag.minimum = def.value;
		else bag.exclusiveMinimum = def.value;
	});
	inst._zod.check = (payload) => {
		if (def.inclusive ? payload.value >= def.value : payload.value > def.value) return;
		payload.issues.push({
			origin,
			code: "too_small",
			minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
			input: payload.value,
			inclusive: def.inclusive,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckMultipleOf = /*@__PURE__*/ $constructor("$ZodCheckMultipleOf", (inst, def) => {
	$ZodCheck.init(inst, def);
	inst._zod.onattach.push((inst) => {
		var _a;
		(_a = inst._zod.bag).multipleOf ?? (_a.multipleOf = def.value);
	});
	inst._zod.check = (payload) => {
		if (typeof payload.value !== typeof def.value) throw new Error("Cannot mix number and bigint in multiple_of check.");
		if (typeof payload.value === "bigint" ? payload.value % def.value === BigInt(0) : floatSafeRemainder(payload.value, def.value) === 0) return;
		payload.issues.push({
			origin: typeof payload.value,
			code: "not_multiple_of",
			divisor: def.value,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckNumberFormat = /*@__PURE__*/ $constructor("$ZodCheckNumberFormat", (inst, def) => {
	$ZodCheck.init(inst, def);
	def.format = def.format || "float64";
	const isInt = def.format?.includes("int");
	const origin = isInt ? "int" : "number";
	const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		bag.format = def.format;
		bag.minimum = minimum;
		bag.maximum = maximum;
		if (isInt) bag.pattern = integer;
	});
	inst._zod.check = (payload) => {
		const input = payload.value;
		if (isInt) {
			if (!Number.isInteger(input)) {
				payload.issues.push({
					expected: origin,
					format: def.format,
					code: "invalid_type",
					continue: false,
					input,
					inst
				});
				return;
			}
			if (!Number.isSafeInteger(input)) {
				if (input > 0) payload.issues.push({
					input,
					code: "too_big",
					maximum: Number.MAX_SAFE_INTEGER,
					note: "Integers must be within the safe integer range.",
					inst,
					origin,
					inclusive: true,
					continue: !def.abort
				});
				else payload.issues.push({
					input,
					code: "too_small",
					minimum: Number.MIN_SAFE_INTEGER,
					note: "Integers must be within the safe integer range.",
					inst,
					origin,
					inclusive: true,
					continue: !def.abort
				});
				return;
			}
		}
		if (input < minimum) payload.issues.push({
			origin: "number",
			input,
			code: "too_small",
			minimum,
			inclusive: true,
			inst,
			continue: !def.abort
		});
		if (input > maximum) payload.issues.push({
			origin: "number",
			input,
			code: "too_big",
			maximum,
			inclusive: true,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckMaxLength = /*@__PURE__*/ $constructor("$ZodCheckMaxLength", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = (payload) => {
		const val = payload.value;
		return !nullish(val) && val.length !== void 0;
	});
	inst._zod.onattach.push((inst) => {
		const curr = inst._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
		if (def.maximum < curr) inst._zod.bag.maximum = def.maximum;
	});
	inst._zod.check = (payload) => {
		const input = payload.value;
		if (input.length <= def.maximum) return;
		const origin = getLengthableOrigin(input);
		payload.issues.push({
			origin,
			code: "too_big",
			maximum: def.maximum,
			inclusive: true,
			input,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckMinLength = /*@__PURE__*/ $constructor("$ZodCheckMinLength", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = (payload) => {
		const val = payload.value;
		return !nullish(val) && val.length !== void 0;
	});
	inst._zod.onattach.push((inst) => {
		const curr = inst._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
		if (def.minimum > curr) inst._zod.bag.minimum = def.minimum;
	});
	inst._zod.check = (payload) => {
		const input = payload.value;
		if (input.length >= def.minimum) return;
		const origin = getLengthableOrigin(input);
		payload.issues.push({
			origin,
			code: "too_small",
			minimum: def.minimum,
			inclusive: true,
			input,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckLengthEquals = /*@__PURE__*/ $constructor("$ZodCheckLengthEquals", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = (payload) => {
		const val = payload.value;
		return !nullish(val) && val.length !== void 0;
	});
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		bag.minimum = def.length;
		bag.maximum = def.length;
		bag.length = def.length;
	});
	inst._zod.check = (payload) => {
		const input = payload.value;
		const length = input.length;
		if (length === def.length) return;
		const origin = getLengthableOrigin(input);
		const tooBig = length > def.length;
		payload.issues.push({
			origin,
			...tooBig ? {
				code: "too_big",
				maximum: def.length
			} : {
				code: "too_small",
				minimum: def.length
			},
			inclusive: true,
			exact: true,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckStringFormat = /*@__PURE__*/ $constructor("$ZodCheckStringFormat", (inst, def) => {
	var _a, _b;
	$ZodCheck.init(inst, def);
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		bag.format = def.format;
		if (def.pattern) {
			bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
			bag.patterns.add(def.pattern);
		}
	});
	if (def.pattern) (_a = inst._zod).check ?? (_a.check = (payload) => {
		def.pattern.lastIndex = 0;
		if (def.pattern.test(payload.value)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: def.format,
			input: payload.value,
			...def.pattern ? { pattern: def.pattern.toString() } : {},
			inst,
			continue: !def.abort
		});
	});
	else (_b = inst._zod).check ?? (_b.check = () => {});
});
var $ZodCheckRegex = /*@__PURE__*/ $constructor("$ZodCheckRegex", (inst, def) => {
	$ZodCheckStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		def.pattern.lastIndex = 0;
		if (def.pattern.test(payload.value)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "regex",
			input: payload.value,
			pattern: def.pattern.toString(),
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckLowerCase = /*@__PURE__*/ $constructor("$ZodCheckLowerCase", (inst, def) => {
	def.pattern ?? (def.pattern = lowercase);
	$ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckUpperCase = /*@__PURE__*/ $constructor("$ZodCheckUpperCase", (inst, def) => {
	def.pattern ?? (def.pattern = uppercase);
	$ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckIncludes = /*@__PURE__*/ $constructor("$ZodCheckIncludes", (inst, def) => {
	$ZodCheck.init(inst, def);
	const escapedRegex = escapeRegex(def.includes);
	const pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position}}${escapedRegex}` : escapedRegex);
	def.pattern = pattern;
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
		bag.patterns.add(pattern);
	});
	inst._zod.check = (payload) => {
		if (payload.value.includes(def.includes, def.position)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "includes",
			includes: def.includes,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckStartsWith = /*@__PURE__*/ $constructor("$ZodCheckStartsWith", (inst, def) => {
	$ZodCheck.init(inst, def);
	const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
	def.pattern ?? (def.pattern = pattern);
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
		bag.patterns.add(pattern);
	});
	inst._zod.check = (payload) => {
		if (payload.value.startsWith(def.prefix)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "starts_with",
			prefix: def.prefix,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckEndsWith = /*@__PURE__*/ $constructor("$ZodCheckEndsWith", (inst, def) => {
	$ZodCheck.init(inst, def);
	const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
	def.pattern ?? (def.pattern = pattern);
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
		bag.patterns.add(pattern);
	});
	inst._zod.check = (payload) => {
		if (payload.value.endsWith(def.suffix)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "ends_with",
			suffix: def.suffix,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckOverwrite = /*@__PURE__*/ $constructor("$ZodCheckOverwrite", (inst, def) => {
	$ZodCheck.init(inst, def);
	inst._zod.check = (payload) => {
		payload.value = def.tx(payload.value);
	};
});
//#endregion
//#region node_modules/zod/v4/core/doc.js
var Doc = class {
	constructor(args = []) {
		this.content = [];
		this.indent = 0;
		if (this) this.args = args;
	}
	indented(fn) {
		this.indent += 1;
		fn(this);
		this.indent -= 1;
	}
	write(arg) {
		if (typeof arg === "function") {
			arg(this, { execution: "sync" });
			arg(this, { execution: "async" });
			return;
		}
		const lines = arg.split("\n").filter((x) => x);
		const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
		const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
		for (const line of dedented) this.content.push(line);
	}
	compile() {
		const F = Function;
		const args = this?.args;
		const lines = [...(this?.content ?? [``]).map((x) => `  ${x}`)];
		return new F(...args, lines.join("\n"));
	}
};
//#endregion
//#region node_modules/zod/v4/core/versions.js
var version = {
	major: 4,
	minor: 4,
	patch: 3
};
//#endregion
//#region node_modules/zod/v4/core/schemas.js
var $ZodType = /*@__PURE__*/ $constructor("$ZodType", (inst, def) => {
	var _a;
	inst ?? (inst = {});
	inst._zod.def = def;
	inst._zod.bag = inst._zod.bag || {};
	inst._zod.version = version;
	const checks = [...inst._zod.def.checks ?? []];
	if (inst._zod.traits.has("$ZodCheck")) checks.unshift(inst);
	for (const ch of checks) for (const fn of ch._zod.onattach) fn(inst);
	if (checks.length === 0) {
		(_a = inst._zod).deferred ?? (_a.deferred = []);
		inst._zod.deferred?.push(() => {
			inst._zod.run = inst._zod.parse;
		});
	} else {
		const runChecks = (payload, checks, ctx) => {
			let isAborted = aborted(payload);
			let asyncResult;
			for (const ch of checks) {
				if (ch._zod.def.when) {
					if (explicitlyAborted(payload)) continue;
					if (!ch._zod.def.when(payload)) continue;
				} else if (isAborted) continue;
				const currLen = payload.issues.length;
				const _ = ch._zod.check(payload);
				if (_ instanceof Promise && ctx?.async === false) throw new $ZodAsyncError();
				if (asyncResult || _ instanceof Promise) asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
					await _;
					if (payload.issues.length === currLen) return;
					if (!isAborted) isAborted = aborted(payload, currLen);
				});
				else {
					if (payload.issues.length === currLen) continue;
					if (!isAborted) isAborted = aborted(payload, currLen);
				}
			}
			if (asyncResult) return asyncResult.then(() => {
				return payload;
			});
			return payload;
		};
		const handleCanaryResult = (canary, payload, ctx) => {
			if (aborted(canary)) {
				canary.aborted = true;
				return canary;
			}
			const checkResult = runChecks(payload, checks, ctx);
			if (checkResult instanceof Promise) {
				if (ctx.async === false) throw new $ZodAsyncError();
				return checkResult.then((checkResult) => inst._zod.parse(checkResult, ctx));
			}
			return inst._zod.parse(checkResult, ctx);
		};
		inst._zod.run = (payload, ctx) => {
			if (ctx.skipChecks) return inst._zod.parse(payload, ctx);
			if (ctx.direction === "backward") {
				const canary = inst._zod.parse({
					value: payload.value,
					issues: []
				}, {
					...ctx,
					skipChecks: true
				});
				if (canary instanceof Promise) return canary.then((canary) => {
					return handleCanaryResult(canary, payload, ctx);
				});
				return handleCanaryResult(canary, payload, ctx);
			}
			const result = inst._zod.parse(payload, ctx);
			if (result instanceof Promise) {
				if (ctx.async === false) throw new $ZodAsyncError();
				return result.then((result) => runChecks(result, checks, ctx));
			}
			return runChecks(result, checks, ctx);
		};
	}
	defineLazy(inst, "~standard", () => ({
		validate: (value) => {
			try {
				const r = safeParse$1(inst, value);
				return r.success ? { value: r.data } : { issues: r.error?.issues };
			} catch (_) {
				return safeParseAsync$1(inst, value).then((r) => r.success ? { value: r.data } : { issues: r.error?.issues });
			}
		},
		vendor: "zod",
		version: 1
	}));
});
var $ZodString = /*@__PURE__*/ $constructor("$ZodString", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = [...inst?._zod.bag?.patterns ?? []].pop() ?? string$1(inst._zod.bag);
	inst._zod.parse = (payload, _) => {
		if (def.coerce) try {
			payload.value = String(payload.value);
		} catch (_) {}
		if (typeof payload.value === "string") return payload;
		payload.issues.push({
			expected: "string",
			code: "invalid_type",
			input: payload.value,
			inst
		});
		return payload;
	};
});
var $ZodStringFormat = /*@__PURE__*/ $constructor("$ZodStringFormat", (inst, def) => {
	$ZodCheckStringFormat.init(inst, def);
	$ZodString.init(inst, def);
});
var $ZodGUID = /*@__PURE__*/ $constructor("$ZodGUID", (inst, def) => {
	def.pattern ?? (def.pattern = guid);
	$ZodStringFormat.init(inst, def);
});
var $ZodUUID = /*@__PURE__*/ $constructor("$ZodUUID", (inst, def) => {
	if (def.version) {
		const v = {
			v1: 1,
			v2: 2,
			v3: 3,
			v4: 4,
			v5: 5,
			v6: 6,
			v7: 7,
			v8: 8
		}[def.version];
		if (v === void 0) throw new Error(`Invalid UUID version: "${def.version}"`);
		def.pattern ?? (def.pattern = uuid(v));
	} else def.pattern ?? (def.pattern = uuid());
	$ZodStringFormat.init(inst, def);
});
var $ZodEmail = /*@__PURE__*/ $constructor("$ZodEmail", (inst, def) => {
	def.pattern ?? (def.pattern = email);
	$ZodStringFormat.init(inst, def);
});
var $ZodURL = /*@__PURE__*/ $constructor("$ZodURL", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		try {
			const trimmed = payload.value.trim();
			if (!def.normalize && def.protocol?.source === httpProtocol.source) {
				if (!/^https?:\/\//i.test(trimmed)) {
					payload.issues.push({
						code: "invalid_format",
						format: "url",
						note: "Invalid URL format",
						input: payload.value,
						inst,
						continue: !def.abort
					});
					return;
				}
			}
			const url = new URL(trimmed);
			if (def.hostname) {
				def.hostname.lastIndex = 0;
				if (!def.hostname.test(url.hostname)) payload.issues.push({
					code: "invalid_format",
					format: "url",
					note: "Invalid hostname",
					pattern: def.hostname.source,
					input: payload.value,
					inst,
					continue: !def.abort
				});
			}
			if (def.protocol) {
				def.protocol.lastIndex = 0;
				if (!def.protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol)) payload.issues.push({
					code: "invalid_format",
					format: "url",
					note: "Invalid protocol",
					pattern: def.protocol.source,
					input: payload.value,
					inst,
					continue: !def.abort
				});
			}
			if (def.normalize) payload.value = url.href;
			else payload.value = trimmed;
			return;
		} catch (_) {
			payload.issues.push({
				code: "invalid_format",
				format: "url",
				input: payload.value,
				inst,
				continue: !def.abort
			});
		}
	};
});
var $ZodEmoji = /*@__PURE__*/ $constructor("$ZodEmoji", (inst, def) => {
	def.pattern ?? (def.pattern = emoji());
	$ZodStringFormat.init(inst, def);
});
var $ZodNanoID = /*@__PURE__*/ $constructor("$ZodNanoID", (inst, def) => {
	def.pattern ?? (def.pattern = nanoid);
	$ZodStringFormat.init(inst, def);
});
/**
* @deprecated CUID v1 is deprecated by its authors due to information leakage
* (timestamps embedded in the id). Use {@link $ZodCUID2} instead.
* See https://github.com/paralleldrive/cuid.
*/
var $ZodCUID = /*@__PURE__*/ $constructor("$ZodCUID", (inst, def) => {
	def.pattern ?? (def.pattern = cuid);
	$ZodStringFormat.init(inst, def);
});
var $ZodCUID2 = /*@__PURE__*/ $constructor("$ZodCUID2", (inst, def) => {
	def.pattern ?? (def.pattern = cuid2);
	$ZodStringFormat.init(inst, def);
});
var $ZodULID = /*@__PURE__*/ $constructor("$ZodULID", (inst, def) => {
	def.pattern ?? (def.pattern = ulid);
	$ZodStringFormat.init(inst, def);
});
var $ZodXID = /*@__PURE__*/ $constructor("$ZodXID", (inst, def) => {
	def.pattern ?? (def.pattern = xid);
	$ZodStringFormat.init(inst, def);
});
var $ZodKSUID = /*@__PURE__*/ $constructor("$ZodKSUID", (inst, def) => {
	def.pattern ?? (def.pattern = ksuid);
	$ZodStringFormat.init(inst, def);
});
var $ZodISODateTime = /*@__PURE__*/ $constructor("$ZodISODateTime", (inst, def) => {
	def.pattern ?? (def.pattern = datetime$1(def));
	$ZodStringFormat.init(inst, def);
});
var $ZodISODate = /*@__PURE__*/ $constructor("$ZodISODate", (inst, def) => {
	def.pattern ?? (def.pattern = date$1);
	$ZodStringFormat.init(inst, def);
});
var $ZodISOTime = /*@__PURE__*/ $constructor("$ZodISOTime", (inst, def) => {
	def.pattern ?? (def.pattern = time$1(def));
	$ZodStringFormat.init(inst, def);
});
var $ZodISODuration = /*@__PURE__*/ $constructor("$ZodISODuration", (inst, def) => {
	def.pattern ?? (def.pattern = duration$1);
	$ZodStringFormat.init(inst, def);
});
var $ZodIPv4 = /*@__PURE__*/ $constructor("$ZodIPv4", (inst, def) => {
	def.pattern ?? (def.pattern = ipv4);
	$ZodStringFormat.init(inst, def);
	inst._zod.bag.format = `ipv4`;
});
var $ZodIPv6 = /*@__PURE__*/ $constructor("$ZodIPv6", (inst, def) => {
	def.pattern ?? (def.pattern = ipv6);
	$ZodStringFormat.init(inst, def);
	inst._zod.bag.format = `ipv6`;
	inst._zod.check = (payload) => {
		try {
			new URL(`http://[${payload.value}]`);
		} catch {
			payload.issues.push({
				code: "invalid_format",
				format: "ipv6",
				input: payload.value,
				inst,
				continue: !def.abort
			});
		}
	};
});
var $ZodCIDRv4 = /*@__PURE__*/ $constructor("$ZodCIDRv4", (inst, def) => {
	def.pattern ?? (def.pattern = cidrv4);
	$ZodStringFormat.init(inst, def);
});
var $ZodCIDRv6 = /*@__PURE__*/ $constructor("$ZodCIDRv6", (inst, def) => {
	def.pattern ?? (def.pattern = cidrv6);
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		const parts = payload.value.split("/");
		try {
			if (parts.length !== 2) throw new Error();
			const [address, prefix] = parts;
			if (!prefix) throw new Error();
			const prefixNum = Number(prefix);
			if (`${prefixNum}` !== prefix) throw new Error();
			if (prefixNum < 0 || prefixNum > 128) throw new Error();
			new URL(`http://[${address}]`);
		} catch {
			payload.issues.push({
				code: "invalid_format",
				format: "cidrv6",
				input: payload.value,
				inst,
				continue: !def.abort
			});
		}
	};
});
function isValidBase64(data) {
	if (data === "") return true;
	if (/\s/.test(data)) return false;
	if (data.length % 4 !== 0) return false;
	try {
		atob(data);
		return true;
	} catch {
		return false;
	}
}
var $ZodBase64 = /*@__PURE__*/ $constructor("$ZodBase64", (inst, def) => {
	def.pattern ?? (def.pattern = base64);
	$ZodStringFormat.init(inst, def);
	inst._zod.bag.contentEncoding = "base64";
	inst._zod.check = (payload) => {
		if (isValidBase64(payload.value)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "base64",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
function isValidBase64URL(data) {
	if (!base64url.test(data)) return false;
	const base64 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
	return isValidBase64(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
}
var $ZodBase64URL = /*@__PURE__*/ $constructor("$ZodBase64URL", (inst, def) => {
	def.pattern ?? (def.pattern = base64url);
	$ZodStringFormat.init(inst, def);
	inst._zod.bag.contentEncoding = "base64url";
	inst._zod.check = (payload) => {
		if (isValidBase64URL(payload.value)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "base64url",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodE164 = /*@__PURE__*/ $constructor("$ZodE164", (inst, def) => {
	def.pattern ?? (def.pattern = e164);
	$ZodStringFormat.init(inst, def);
});
function isValidJWT(token, algorithm = null) {
	try {
		const tokensParts = token.split(".");
		if (tokensParts.length !== 3) return false;
		const [header] = tokensParts;
		if (!header) return false;
		const parsedHeader = JSON.parse(atob(header));
		if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT") return false;
		if (!parsedHeader.alg) return false;
		if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm)) return false;
		return true;
	} catch {
		return false;
	}
}
var $ZodJWT = /*@__PURE__*/ $constructor("$ZodJWT", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (isValidJWT(payload.value, def.alg)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "jwt",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodNumber = /*@__PURE__*/ $constructor("$ZodNumber", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = inst._zod.bag.pattern ?? number$1;
	inst._zod.parse = (payload, _ctx) => {
		if (def.coerce) try {
			payload.value = Number(payload.value);
		} catch (_) {}
		const input = payload.value;
		if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) return payload;
		const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? "Infinity" : void 0 : void 0;
		payload.issues.push({
			expected: "number",
			code: "invalid_type",
			input,
			inst,
			...received ? { received } : {}
		});
		return payload;
	};
});
var $ZodNumberFormat = /*@__PURE__*/ $constructor("$ZodNumberFormat", (inst, def) => {
	$ZodCheckNumberFormat.init(inst, def);
	$ZodNumber.init(inst, def);
});
var $ZodBoolean = /*@__PURE__*/ $constructor("$ZodBoolean", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = boolean$1;
	inst._zod.parse = (payload, _ctx) => {
		if (def.coerce) try {
			payload.value = Boolean(payload.value);
		} catch (_) {}
		const input = payload.value;
		if (typeof input === "boolean") return payload;
		payload.issues.push({
			expected: "boolean",
			code: "invalid_type",
			input,
			inst
		});
		return payload;
	};
});
var $ZodUnknown = /*@__PURE__*/ $constructor("$ZodUnknown", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload) => payload;
});
var $ZodNever = /*@__PURE__*/ $constructor("$ZodNever", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, _ctx) => {
		payload.issues.push({
			expected: "never",
			code: "invalid_type",
			input: payload.value,
			inst
		});
		return payload;
	};
});
var $ZodVoid = /*@__PURE__*/ $constructor("$ZodVoid", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (typeof input === "undefined") return payload;
		payload.issues.push({
			expected: "void",
			code: "invalid_type",
			input,
			inst
		});
		return payload;
	};
});
function handleArrayResult(result, final, index) {
	if (result.issues.length) final.issues.push(...prefixIssues(index, result.issues));
	final.value[index] = result.value;
}
var $ZodArray = /*@__PURE__*/ $constructor("$ZodArray", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		if (!Array.isArray(input)) {
			payload.issues.push({
				expected: "array",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		payload.value = Array(input.length);
		const proms = [];
		for (let i = 0; i < input.length; i++) {
			const item = input[i];
			const result = def.element._zod.run({
				value: item,
				issues: []
			}, ctx);
			if (result instanceof Promise) proms.push(result.then((result) => handleArrayResult(result, payload, i)));
			else handleArrayResult(result, payload, i);
		}
		if (proms.length) return Promise.all(proms).then(() => payload);
		return payload;
	};
});
function handlePropertyResult(result, final, key, input, isOptionalIn, isOptionalOut) {
	const isPresent = key in input;
	if (result.issues.length) {
		if (isOptionalIn && isOptionalOut && !isPresent) return;
		final.issues.push(...prefixIssues(key, result.issues));
	}
	if (!isPresent && !isOptionalIn) {
		if (!result.issues.length) final.issues.push({
			code: "invalid_type",
			expected: "nonoptional",
			input: void 0,
			path: [key]
		});
		return;
	}
	if (result.value === void 0) {
		if (isPresent) final.value[key] = void 0;
	} else final.value[key] = result.value;
}
function normalizeDef(def) {
	const keys = Object.keys(def.shape);
	for (const k of keys) if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) throw new Error(`Invalid element at key "${k}": expected a Zod schema`);
	const okeys = optionalKeys(def.shape);
	return {
		...def,
		keys,
		keySet: new Set(keys),
		numKeys: keys.length,
		optionalKeys: new Set(okeys)
	};
}
function handleCatchall(proms, input, payload, ctx, def, inst) {
	const unrecognized = [];
	const keySet = def.keySet;
	const _catchall = def.catchall._zod;
	const t = _catchall.def.type;
	const isOptionalIn = _catchall.optin === "optional";
	const isOptionalOut = _catchall.optout === "optional";
	for (const key in input) {
		if (key === "__proto__") continue;
		if (keySet.has(key)) continue;
		if (t === "never") {
			unrecognized.push(key);
			continue;
		}
		const r = _catchall.run({
			value: input[key],
			issues: []
		}, ctx);
		if (r instanceof Promise) proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut)));
		else handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut);
	}
	if (unrecognized.length) payload.issues.push({
		code: "unrecognized_keys",
		keys: unrecognized,
		input,
		inst
	});
	if (!proms.length) return payload;
	return Promise.all(proms).then(() => {
		return payload;
	});
}
var $ZodObject = /*@__PURE__*/ $constructor("$ZodObject", (inst, def) => {
	$ZodType.init(inst, def);
	if (!Object.getOwnPropertyDescriptor(def, "shape")?.get) {
		const sh = def.shape;
		Object.defineProperty(def, "shape", { get: () => {
			const newSh = { ...sh };
			Object.defineProperty(def, "shape", { value: newSh });
			return newSh;
		} });
	}
	const _normalized = cached(() => normalizeDef(def));
	defineLazy(inst._zod, "propValues", () => {
		const shape = def.shape;
		const propValues = {};
		for (const key in shape) {
			const field = shape[key]._zod;
			if (field.values) {
				propValues[key] ?? (propValues[key] = /* @__PURE__ */ new Set());
				for (const v of field.values) propValues[key].add(v);
			}
		}
		return propValues;
	});
	const isObject$1 = isObject;
	const catchall = def.catchall;
	let value;
	inst._zod.parse = (payload, ctx) => {
		value ?? (value = _normalized.value);
		const input = payload.value;
		if (!isObject$1(input)) {
			payload.issues.push({
				expected: "object",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		payload.value = {};
		const proms = [];
		const shape = value.shape;
		for (const key of value.keys) {
			const el = shape[key];
			const isOptionalIn = el._zod.optin === "optional";
			const isOptionalOut = el._zod.optout === "optional";
			const r = el._zod.run({
				value: input[key],
				issues: []
			}, ctx);
			if (r instanceof Promise) proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut)));
			else handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut);
		}
		if (!catchall) return proms.length ? Promise.all(proms).then(() => payload) : payload;
		return handleCatchall(proms, input, payload, ctx, _normalized.value, inst);
	};
});
var $ZodObjectJIT = /*@__PURE__*/ $constructor("$ZodObjectJIT", (inst, def) => {
	$ZodObject.init(inst, def);
	const superParse = inst._zod.parse;
	const _normalized = cached(() => normalizeDef(def));
	const generateFastpass = (shape) => {
		const doc = new Doc([
			"shape",
			"payload",
			"ctx"
		]);
		const normalized = _normalized.value;
		const parseStr = (key) => {
			const k = esc(key);
			return `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
		};
		doc.write(`const input = payload.value;`);
		const ids = Object.create(null);
		let counter = 0;
		for (const key of normalized.keys) ids[key] = `key_${counter++}`;
		doc.write(`const newResult = {};`);
		for (const key of normalized.keys) {
			const id = ids[key];
			const k = esc(key);
			const schema = shape[key];
			const isOptionalIn = schema?._zod?.optin === "optional";
			const isOptionalOut = schema?._zod?.optout === "optional";
			doc.write(`const ${id} = ${parseStr(key)};`);
			if (isOptionalIn && isOptionalOut) doc.write(`
        if (${id}.issues.length) {
          if (${k} in input) {
            payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
              ...iss,
              path: iss.path ? [${k}, ...iss.path] : [${k}]
            })));
          }
        }
        
        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }
        
      `);
			else if (!isOptionalIn) doc.write(`
        const ${id}_present = ${k} in input;
        if (${id}.issues.length) {
          payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${k}, ...iss.path] : [${k}]
          })));
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
        }

        if (${id}_present) {
          if (${id}.value === undefined) {
            newResult[${k}] = undefined;
          } else {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
			else doc.write(`
        if (${id}.issues.length) {
          payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${k}, ...iss.path] : [${k}]
          })));
        }
        
        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }
        
      `);
		}
		doc.write(`payload.value = newResult;`);
		doc.write(`return payload;`);
		const fn = doc.compile();
		return (payload, ctx) => fn(shape, payload, ctx);
	};
	let fastpass;
	const isObject$2 = isObject;
	const jit = !globalConfig.jitless;
	const fastEnabled = jit && allowsEval.value;
	const catchall = def.catchall;
	let value;
	inst._zod.parse = (payload, ctx) => {
		value ?? (value = _normalized.value);
		const input = payload.value;
		if (!isObject$2(input)) {
			payload.issues.push({
				expected: "object",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
			if (!fastpass) fastpass = generateFastpass(def.shape);
			payload = fastpass(payload, ctx);
			if (!catchall) return payload;
			return handleCatchall([], input, payload, ctx, value, inst);
		}
		return superParse(payload, ctx);
	};
});
function handleUnionResults(results, final, inst, ctx) {
	for (const result of results) if (result.issues.length === 0) {
		final.value = result.value;
		return final;
	}
	const nonaborted = results.filter((r) => !aborted(r));
	if (nonaborted.length === 1) {
		final.value = nonaborted[0].value;
		return nonaborted[0];
	}
	final.issues.push({
		code: "invalid_union",
		input: final.value,
		inst,
		errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
	});
	return final;
}
var $ZodUnion = /*@__PURE__*/ $constructor("$ZodUnion", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "optin", () => def.options.some((o) => o._zod.optin === "optional") ? "optional" : void 0);
	defineLazy(inst._zod, "optout", () => def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0);
	defineLazy(inst._zod, "values", () => {
		if (def.options.every((o) => o._zod.values)) return new Set(def.options.flatMap((option) => Array.from(option._zod.values)));
	});
	defineLazy(inst._zod, "pattern", () => {
		if (def.options.every((o) => o._zod.pattern)) {
			const patterns = def.options.map((o) => o._zod.pattern);
			return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
		}
	});
	const first = def.options.length === 1 ? def.options[0]._zod.run : null;
	inst._zod.parse = (payload, ctx) => {
		if (first) return first(payload, ctx);
		let async = false;
		const results = [];
		for (const option of def.options) {
			const result = option._zod.run({
				value: payload.value,
				issues: []
			}, ctx);
			if (result instanceof Promise) {
				results.push(result);
				async = true;
			} else {
				if (result.issues.length === 0) return result;
				results.push(result);
			}
		}
		if (!async) return handleUnionResults(results, payload, inst, ctx);
		return Promise.all(results).then((results) => {
			return handleUnionResults(results, payload, inst, ctx);
		});
	};
});
var $ZodIntersection = /*@__PURE__*/ $constructor("$ZodIntersection", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		const left = def.left._zod.run({
			value: input,
			issues: []
		}, ctx);
		const right = def.right._zod.run({
			value: input,
			issues: []
		}, ctx);
		if (left instanceof Promise || right instanceof Promise) return Promise.all([left, right]).then(([left, right]) => {
			return handleIntersectionResults(payload, left, right);
		});
		return handleIntersectionResults(payload, left, right);
	};
});
function mergeValues(a, b) {
	if (a === b) return {
		valid: true,
		data: a
	};
	if (a instanceof Date && b instanceof Date && +a === +b) return {
		valid: true,
		data: a
	};
	if (isPlainObject(a) && isPlainObject(b)) {
		const bKeys = Object.keys(b);
		const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
		const newObj = {
			...a,
			...b
		};
		for (const key of sharedKeys) {
			const sharedValue = mergeValues(a[key], b[key]);
			if (!sharedValue.valid) return {
				valid: false,
				mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
			};
			newObj[key] = sharedValue.data;
		}
		return {
			valid: true,
			data: newObj
		};
	}
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return {
			valid: false,
			mergeErrorPath: []
		};
		const newArray = [];
		for (let index = 0; index < a.length; index++) {
			const itemA = a[index];
			const itemB = b[index];
			const sharedValue = mergeValues(itemA, itemB);
			if (!sharedValue.valid) return {
				valid: false,
				mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
			};
			newArray.push(sharedValue.data);
		}
		return {
			valid: true,
			data: newArray
		};
	}
	return {
		valid: false,
		mergeErrorPath: []
	};
}
function handleIntersectionResults(result, left, right) {
	const unrecKeys = /* @__PURE__ */ new Map();
	let unrecIssue;
	for (const iss of left.issues) if (iss.code === "unrecognized_keys") {
		unrecIssue ?? (unrecIssue = iss);
		for (const k of iss.keys) {
			if (!unrecKeys.has(k)) unrecKeys.set(k, {});
			unrecKeys.get(k).l = true;
		}
	} else result.issues.push(iss);
	for (const iss of right.issues) if (iss.code === "unrecognized_keys") for (const k of iss.keys) {
		if (!unrecKeys.has(k)) unrecKeys.set(k, {});
		unrecKeys.get(k).r = true;
	}
	else result.issues.push(iss);
	const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
	if (bothKeys.length && unrecIssue) result.issues.push({
		...unrecIssue,
		keys: bothKeys
	});
	if (aborted(result)) return result;
	const merged = mergeValues(left.value, right.value);
	if (!merged.valid) throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
	result.value = merged.data;
	return result;
}
var $ZodRecord = /*@__PURE__*/ $constructor("$ZodRecord", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		if (!isPlainObject(input)) {
			payload.issues.push({
				expected: "record",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		const proms = [];
		const values = def.keyType._zod.values;
		if (values) {
			payload.value = {};
			const recordKeys = /* @__PURE__ */ new Set();
			for (const key of values) if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
				recordKeys.add(typeof key === "number" ? key.toString() : key);
				const keyResult = def.keyType._zod.run({
					value: key,
					issues: []
				}, ctx);
				if (keyResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
				if (keyResult.issues.length) {
					payload.issues.push({
						code: "invalid_key",
						origin: "record",
						issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
						input: key,
						path: [key],
						inst
					});
					continue;
				}
				const outKey = keyResult.value;
				const result = def.valueType._zod.run({
					value: input[key],
					issues: []
				}, ctx);
				if (result instanceof Promise) proms.push(result.then((result) => {
					if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
					payload.value[outKey] = result.value;
				}));
				else {
					if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
					payload.value[outKey] = result.value;
				}
			}
			let unrecognized;
			for (const key in input) if (!recordKeys.has(key)) {
				unrecognized = unrecognized ?? [];
				unrecognized.push(key);
			}
			if (unrecognized && unrecognized.length > 0) payload.issues.push({
				code: "unrecognized_keys",
				input,
				inst,
				keys: unrecognized
			});
		} else {
			payload.value = {};
			for (const key of Reflect.ownKeys(input)) {
				if (key === "__proto__") continue;
				if (!Object.prototype.propertyIsEnumerable.call(input, key)) continue;
				let keyResult = def.keyType._zod.run({
					value: key,
					issues: []
				}, ctx);
				if (keyResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
				if (typeof key === "string" && number$1.test(key) && keyResult.issues.length) {
					const retryResult = def.keyType._zod.run({
						value: Number(key),
						issues: []
					}, ctx);
					if (retryResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
					if (retryResult.issues.length === 0) keyResult = retryResult;
				}
				if (keyResult.issues.length) {
					if (def.mode === "loose") payload.value[key] = input[key];
					else payload.issues.push({
						code: "invalid_key",
						origin: "record",
						issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
						input: key,
						path: [key],
						inst
					});
					continue;
				}
				const result = def.valueType._zod.run({
					value: input[key],
					issues: []
				}, ctx);
				if (result instanceof Promise) proms.push(result.then((result) => {
					if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
					payload.value[keyResult.value] = result.value;
				}));
				else {
					if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
					payload.value[keyResult.value] = result.value;
				}
			}
		}
		if (proms.length) return Promise.all(proms).then(() => payload);
		return payload;
	};
});
var $ZodEnum = /*@__PURE__*/ $constructor("$ZodEnum", (inst, def) => {
	$ZodType.init(inst, def);
	const values = getEnumValues(def.entries);
	const valuesSet = new Set(values);
	inst._zod.values = valuesSet;
	inst._zod.pattern = new RegExp(`^(${values.filter((k) => propertyKeyTypes.has(typeof k)).map((o) => typeof o === "string" ? escapeRegex(o) : o.toString()).join("|")})$`);
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (valuesSet.has(input)) return payload;
		payload.issues.push({
			code: "invalid_value",
			values,
			input,
			inst
		});
		return payload;
	};
});
var $ZodTransform = /*@__PURE__*/ $constructor("$ZodTransform", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "optional";
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") throw new $ZodEncodeError(inst.constructor.name);
		const _out = def.transform(payload.value, payload);
		if (ctx.async) return (_out instanceof Promise ? _out : Promise.resolve(_out)).then((output) => {
			payload.value = output;
			payload.fallback = true;
			return payload;
		});
		if (_out instanceof Promise) throw new $ZodAsyncError();
		payload.value = _out;
		payload.fallback = true;
		return payload;
	};
});
function handleOptionalResult(result, input) {
	if (input === void 0 && (result.issues.length || result.fallback)) return {
		issues: [],
		value: void 0
	};
	return result;
}
var $ZodOptional = /*@__PURE__*/ $constructor("$ZodOptional", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "optional";
	inst._zod.optout = "optional";
	defineLazy(inst._zod, "values", () => {
		return def.innerType._zod.values ? new Set([...def.innerType._zod.values, void 0]) : void 0;
	});
	defineLazy(inst._zod, "pattern", () => {
		const pattern = def.innerType._zod.pattern;
		return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		if (def.innerType._zod.optin === "optional") {
			const input = payload.value;
			const result = def.innerType._zod.run(payload, ctx);
			if (result instanceof Promise) return result.then((r) => handleOptionalResult(r, input));
			return handleOptionalResult(result, input);
		}
		if (payload.value === void 0) return payload;
		return def.innerType._zod.run(payload, ctx);
	};
});
var $ZodExactOptional = /*@__PURE__*/ $constructor("$ZodExactOptional", (inst, def) => {
	$ZodOptional.init(inst, def);
	defineLazy(inst._zod, "values", () => def.innerType._zod.values);
	defineLazy(inst._zod, "pattern", () => def.innerType._zod.pattern);
	inst._zod.parse = (payload, ctx) => {
		return def.innerType._zod.run(payload, ctx);
	};
});
var $ZodNullable = /*@__PURE__*/ $constructor("$ZodNullable", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
	defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
	defineLazy(inst._zod, "pattern", () => {
		const pattern = def.innerType._zod.pattern;
		return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
	});
	defineLazy(inst._zod, "values", () => {
		return def.innerType._zod.values ? new Set([...def.innerType._zod.values, null]) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		if (payload.value === null) return payload;
		return def.innerType._zod.run(payload, ctx);
	};
});
var $ZodDefault = /*@__PURE__*/ $constructor("$ZodDefault", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "optional";
	defineLazy(inst._zod, "values", () => def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		if (payload.value === void 0) {
			payload.value = def.defaultValue;
			/**
			* $ZodDefault returns the default value immediately in forward direction.
			* It doesn't pass the default value into the validator ("prefault"). There's no reason to pass the default value through validation. The validity of the default is enforced by TypeScript statically. Otherwise, it's the responsibility of the user to ensure the default is valid. In the case of pipes with divergent in/out types, you can specify the default on the `in` schema of your ZodPipe to set a "prefault" for the pipe.   */
			return payload;
		}
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then((result) => handleDefaultResult(result, def));
		return handleDefaultResult(result, def);
	};
});
function handleDefaultResult(payload, def) {
	if (payload.value === void 0) payload.value = def.defaultValue;
	return payload;
}
var $ZodPrefault = /*@__PURE__*/ $constructor("$ZodPrefault", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "optional";
	defineLazy(inst._zod, "values", () => def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		if (payload.value === void 0) payload.value = def.defaultValue;
		return def.innerType._zod.run(payload, ctx);
	};
});
var $ZodNonOptional = /*@__PURE__*/ $constructor("$ZodNonOptional", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "values", () => {
		const v = def.innerType._zod.values;
		return v ? new Set([...v].filter((x) => x !== void 0)) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then((result) => handleNonOptionalResult(result, inst));
		return handleNonOptionalResult(result, inst);
	};
});
function handleNonOptionalResult(payload, inst) {
	if (!payload.issues.length && payload.value === void 0) payload.issues.push({
		code: "invalid_type",
		expected: "nonoptional",
		input: payload.value,
		inst
	});
	return payload;
}
var $ZodCatch = /*@__PURE__*/ $constructor("$ZodCatch", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "optional";
	defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
	defineLazy(inst._zod, "values", () => def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then((result) => {
			payload.value = result.value;
			if (result.issues.length) {
				payload.value = def.catchValue({
					...payload,
					error: { issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config())) },
					input: payload.value
				});
				payload.issues = [];
				payload.fallback = true;
			}
			return payload;
		});
		payload.value = result.value;
		if (result.issues.length) {
			payload.value = def.catchValue({
				...payload,
				error: { issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config())) },
				input: payload.value
			});
			payload.issues = [];
			payload.fallback = true;
		}
		return payload;
	};
});
var $ZodPipe = /*@__PURE__*/ $constructor("$ZodPipe", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "values", () => def.in._zod.values);
	defineLazy(inst._zod, "optin", () => def.in._zod.optin);
	defineLazy(inst._zod, "optout", () => def.out._zod.optout);
	defineLazy(inst._zod, "propValues", () => def.in._zod.propValues);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") {
			const right = def.out._zod.run(payload, ctx);
			if (right instanceof Promise) return right.then((right) => handlePipeResult(right, def.in, ctx));
			return handlePipeResult(right, def.in, ctx);
		}
		const left = def.in._zod.run(payload, ctx);
		if (left instanceof Promise) return left.then((left) => handlePipeResult(left, def.out, ctx));
		return handlePipeResult(left, def.out, ctx);
	};
});
function handlePipeResult(left, next, ctx) {
	if (left.issues.length) {
		left.aborted = true;
		return left;
	}
	return next._zod.run({
		value: left.value,
		issues: left.issues,
		fallback: left.fallback
	}, ctx);
}
var $ZodReadonly = /*@__PURE__*/ $constructor("$ZodReadonly", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "propValues", () => def.innerType._zod.propValues);
	defineLazy(inst._zod, "values", () => def.innerType._zod.values);
	defineLazy(inst._zod, "optin", () => def.innerType?._zod?.optin);
	defineLazy(inst._zod, "optout", () => def.innerType?._zod?.optout);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then(handleReadonlyResult);
		return handleReadonlyResult(result);
	};
});
function handleReadonlyResult(payload) {
	payload.value = Object.freeze(payload.value);
	return payload;
}
var $ZodCustom = /*@__PURE__*/ $constructor("$ZodCustom", (inst, def) => {
	$ZodCheck.init(inst, def);
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, _) => {
		return payload;
	};
	inst._zod.check = (payload) => {
		const input = payload.value;
		const r = def.fn(input);
		if (r instanceof Promise) return r.then((r) => handleRefineResult(r, payload, input, inst));
		handleRefineResult(r, payload, input, inst);
	};
});
function handleRefineResult(result, payload, input, inst) {
	if (!result) {
		const _iss = {
			code: "custom",
			input,
			inst,
			path: [...inst._zod.def.path ?? []],
			continue: !inst._zod.def.abort
		};
		if (inst._zod.def.params) _iss.params = inst._zod.def.params;
		payload.issues.push(issue(_iss));
	}
}
//#endregion
//#region node_modules/zod/v4/core/registries.js
var _a;
var $ZodRegistry = class {
	constructor() {
		this._map = /* @__PURE__ */ new WeakMap();
		this._idmap = /* @__PURE__ */ new Map();
	}
	add(schema, ..._meta) {
		const meta = _meta[0];
		this._map.set(schema, meta);
		if (meta && typeof meta === "object" && "id" in meta) this._idmap.set(meta.id, schema);
		return this;
	}
	clear() {
		this._map = /* @__PURE__ */ new WeakMap();
		this._idmap = /* @__PURE__ */ new Map();
		return this;
	}
	remove(schema) {
		const meta = this._map.get(schema);
		if (meta && typeof meta === "object" && "id" in meta) this._idmap.delete(meta.id);
		this._map.delete(schema);
		return this;
	}
	get(schema) {
		const p = schema._zod.parent;
		if (p) {
			const pm = { ...this.get(p) ?? {} };
			delete pm.id;
			const f = {
				...pm,
				...this._map.get(schema)
			};
			return Object.keys(f).length ? f : void 0;
		}
		return this._map.get(schema);
	}
	has(schema) {
		return this._map.has(schema);
	}
};
function registry() {
	return new $ZodRegistry();
}
(_a = globalThis).__zod_globalRegistry ?? (_a.__zod_globalRegistry = registry());
var globalRegistry = globalThis.__zod_globalRegistry;
//#endregion
//#region node_modules/zod/v4/core/api.js
// @__NO_SIDE_EFFECTS__
function _string(Class, params) {
	return new Class({
		type: "string",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _email(Class, params) {
	return new Class({
		type: "string",
		format: "email",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _guid(Class, params) {
	return new Class({
		type: "string",
		format: "guid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uuid(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uuidv4(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v4",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uuidv6(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v6",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uuidv7(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v7",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _url(Class, params) {
	return new Class({
		type: "string",
		format: "url",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _emoji(Class, params) {
	return new Class({
		type: "string",
		format: "emoji",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _nanoid(Class, params) {
	return new Class({
		type: "string",
		format: "nanoid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/**
* @deprecated CUID v1 is deprecated by its authors due to information leakage
* (timestamps embedded in the id). Use {@link _cuid2} instead.
* See https://github.com/paralleldrive/cuid.
*/
// @__NO_SIDE_EFFECTS__
function _cuid(Class, params) {
	return new Class({
		type: "string",
		format: "cuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _cuid2(Class, params) {
	return new Class({
		type: "string",
		format: "cuid2",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _ulid(Class, params) {
	return new Class({
		type: "string",
		format: "ulid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _xid(Class, params) {
	return new Class({
		type: "string",
		format: "xid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _ksuid(Class, params) {
	return new Class({
		type: "string",
		format: "ksuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _ipv4(Class, params) {
	return new Class({
		type: "string",
		format: "ipv4",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _ipv6(Class, params) {
	return new Class({
		type: "string",
		format: "ipv6",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _cidrv4(Class, params) {
	return new Class({
		type: "string",
		format: "cidrv4",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _cidrv6(Class, params) {
	return new Class({
		type: "string",
		format: "cidrv6",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _base64(Class, params) {
	return new Class({
		type: "string",
		format: "base64",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _base64url(Class, params) {
	return new Class({
		type: "string",
		format: "base64url",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _e164(Class, params) {
	return new Class({
		type: "string",
		format: "e164",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _jwt(Class, params) {
	return new Class({
		type: "string",
		format: "jwt",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _isoDateTime(Class, params) {
	return new Class({
		type: "string",
		format: "datetime",
		check: "string_format",
		offset: false,
		local: false,
		precision: null,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _isoDate(Class, params) {
	return new Class({
		type: "string",
		format: "date",
		check: "string_format",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _isoTime(Class, params) {
	return new Class({
		type: "string",
		format: "time",
		check: "string_format",
		precision: null,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _isoDuration(Class, params) {
	return new Class({
		type: "string",
		format: "duration",
		check: "string_format",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _number(Class, params) {
	return new Class({
		type: "number",
		checks: [],
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _int(Class, params) {
	return new Class({
		type: "number",
		check: "number_format",
		abort: false,
		format: "safeint",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _boolean(Class, params) {
	return new Class({
		type: "boolean",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _unknown(Class) {
	return new Class({ type: "unknown" });
}
// @__NO_SIDE_EFFECTS__
function _never(Class, params) {
	return new Class({
		type: "never",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _void$1(Class, params) {
	return new Class({
		type: "void",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _lt(value, params) {
	return new $ZodCheckLessThan({
		check: "less_than",
		...normalizeParams(params),
		value,
		inclusive: false
	});
}
// @__NO_SIDE_EFFECTS__
function _lte(value, params) {
	return new $ZodCheckLessThan({
		check: "less_than",
		...normalizeParams(params),
		value,
		inclusive: true
	});
}
// @__NO_SIDE_EFFECTS__
function _gt(value, params) {
	return new $ZodCheckGreaterThan({
		check: "greater_than",
		...normalizeParams(params),
		value,
		inclusive: false
	});
}
// @__NO_SIDE_EFFECTS__
function _gte(value, params) {
	return new $ZodCheckGreaterThan({
		check: "greater_than",
		...normalizeParams(params),
		value,
		inclusive: true
	});
}
// @__NO_SIDE_EFFECTS__
function _multipleOf(value, params) {
	return new $ZodCheckMultipleOf({
		check: "multiple_of",
		...normalizeParams(params),
		value
	});
}
// @__NO_SIDE_EFFECTS__
function _maxLength(maximum, params) {
	return new $ZodCheckMaxLength({
		check: "max_length",
		...normalizeParams(params),
		maximum
	});
}
// @__NO_SIDE_EFFECTS__
function _minLength(minimum, params) {
	return new $ZodCheckMinLength({
		check: "min_length",
		...normalizeParams(params),
		minimum
	});
}
// @__NO_SIDE_EFFECTS__
function _length(length, params) {
	return new $ZodCheckLengthEquals({
		check: "length_equals",
		...normalizeParams(params),
		length
	});
}
// @__NO_SIDE_EFFECTS__
function _regex(pattern, params) {
	return new $ZodCheckRegex({
		check: "string_format",
		format: "regex",
		...normalizeParams(params),
		pattern
	});
}
// @__NO_SIDE_EFFECTS__
function _lowercase(params) {
	return new $ZodCheckLowerCase({
		check: "string_format",
		format: "lowercase",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uppercase(params) {
	return new $ZodCheckUpperCase({
		check: "string_format",
		format: "uppercase",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _includes(includes, params) {
	return new $ZodCheckIncludes({
		check: "string_format",
		format: "includes",
		...normalizeParams(params),
		includes
	});
}
// @__NO_SIDE_EFFECTS__
function _startsWith(prefix, params) {
	return new $ZodCheckStartsWith({
		check: "string_format",
		format: "starts_with",
		...normalizeParams(params),
		prefix
	});
}
// @__NO_SIDE_EFFECTS__
function _endsWith(suffix, params) {
	return new $ZodCheckEndsWith({
		check: "string_format",
		format: "ends_with",
		...normalizeParams(params),
		suffix
	});
}
// @__NO_SIDE_EFFECTS__
function _overwrite(tx) {
	return new $ZodCheckOverwrite({
		check: "overwrite",
		tx
	});
}
// @__NO_SIDE_EFFECTS__
function _normalize(form) {
	return /* @__PURE__ */ _overwrite((input) => input.normalize(form));
}
// @__NO_SIDE_EFFECTS__
function _trim() {
	return /* @__PURE__ */ _overwrite((input) => input.trim());
}
// @__NO_SIDE_EFFECTS__
function _toLowerCase() {
	return /* @__PURE__ */ _overwrite((input) => input.toLowerCase());
}
// @__NO_SIDE_EFFECTS__
function _toUpperCase() {
	return /* @__PURE__ */ _overwrite((input) => input.toUpperCase());
}
// @__NO_SIDE_EFFECTS__
function _slugify() {
	return /* @__PURE__ */ _overwrite((input) => slugify(input));
}
// @__NO_SIDE_EFFECTS__
function _array(Class, element, params) {
	return new Class({
		type: "array",
		element,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _refine(Class, fn, _params) {
	return new Class({
		type: "custom",
		check: "custom",
		fn,
		...normalizeParams(_params)
	});
}
// @__NO_SIDE_EFFECTS__
function _superRefine(fn, params) {
	const ch = /* @__PURE__ */ _check((payload) => {
		payload.addIssue = (issue$2) => {
			if (typeof issue$2 === "string") payload.issues.push(issue(issue$2, payload.value, ch._zod.def));
			else {
				const _issue = issue$2;
				if (_issue.fatal) _issue.continue = false;
				_issue.code ?? (_issue.code = "custom");
				_issue.input ?? (_issue.input = payload.value);
				_issue.inst ?? (_issue.inst = ch);
				_issue.continue ?? (_issue.continue = !ch._zod.def.abort);
				payload.issues.push(issue(_issue));
			}
		};
		return fn(payload.value, payload);
	}, params);
	return ch;
}
// @__NO_SIDE_EFFECTS__
function _check(fn, params) {
	const ch = new $ZodCheck({
		check: "custom",
		...normalizeParams(params)
	});
	ch._zod.check = fn;
	return ch;
}
//#endregion
//#region node_modules/zod/v4/core/to-json-schema.js
function initializeContext(params) {
	let target = params?.target ?? "draft-2020-12";
	if (target === "draft-4") target = "draft-04";
	if (target === "draft-7") target = "draft-07";
	return {
		processors: params.processors ?? {},
		metadataRegistry: params?.metadata ?? globalRegistry,
		target,
		unrepresentable: params?.unrepresentable ?? "throw",
		override: params?.override ?? (() => {}),
		io: params?.io ?? "output",
		counter: 0,
		seen: /* @__PURE__ */ new Map(),
		cycles: params?.cycles ?? "ref",
		reused: params?.reused ?? "inline",
		external: params?.external ?? void 0
	};
}
function process(schema, ctx, _params = {
	path: [],
	schemaPath: []
}) {
	var _a;
	const def = schema._zod.def;
	const seen = ctx.seen.get(schema);
	if (seen) {
		seen.count++;
		if (_params.schemaPath.includes(schema)) seen.cycle = _params.path;
		return seen.schema;
	}
	const result = {
		schema: {},
		count: 1,
		cycle: void 0,
		path: _params.path
	};
	ctx.seen.set(schema, result);
	const overrideSchema = schema._zod.toJSONSchema?.();
	if (overrideSchema) result.schema = overrideSchema;
	else {
		const params = {
			..._params,
			schemaPath: [..._params.schemaPath, schema],
			path: _params.path
		};
		if (schema._zod.processJSONSchema) schema._zod.processJSONSchema(ctx, result.schema, params);
		else {
			const _json = result.schema;
			const processor = ctx.processors[def.type];
			if (!processor) throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
			processor(schema, ctx, _json, params);
		}
		const parent = schema._zod.parent;
		if (parent) {
			if (!result.ref) result.ref = parent;
			process(parent, ctx, params);
			ctx.seen.get(parent).isParent = true;
		}
	}
	const meta = ctx.metadataRegistry.get(schema);
	if (meta) Object.assign(result.schema, meta);
	if (ctx.io === "input" && isTransforming(schema)) {
		delete result.schema.examples;
		delete result.schema.default;
	}
	if (ctx.io === "input" && "_prefault" in result.schema) (_a = result.schema).default ?? (_a.default = result.schema._prefault);
	delete result.schema._prefault;
	return ctx.seen.get(schema).schema;
}
function extractDefs(ctx, schema) {
	const root = ctx.seen.get(schema);
	if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
	const idToSchema = /* @__PURE__ */ new Map();
	for (const entry of ctx.seen.entries()) {
		const id = ctx.metadataRegistry.get(entry[0])?.id;
		if (id) {
			const existing = idToSchema.get(id);
			if (existing && existing !== entry[0]) throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
			idToSchema.set(id, entry[0]);
		}
	}
	const makeURI = (entry) => {
		const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
		if (ctx.external) {
			const externalId = ctx.external.registry.get(entry[0])?.id;
			const uriGenerator = ctx.external.uri ?? ((id) => id);
			if (externalId) return { ref: uriGenerator(externalId) };
			const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
			entry[1].defId = id;
			return {
				defId: id,
				ref: `${uriGenerator("__shared")}#/${defsSegment}/${id}`
			};
		}
		if (entry[1] === root) return { ref: "#" };
		const defUriPrefix = `#/${defsSegment}/`;
		const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
		return {
			defId,
			ref: defUriPrefix + defId
		};
	};
	const extractToDef = (entry) => {
		if (entry[1].schema.$ref) return;
		const seen = entry[1];
		const { ref, defId } = makeURI(entry);
		seen.def = { ...seen.schema };
		if (defId) seen.defId = defId;
		const schema = seen.schema;
		for (const key in schema) delete schema[key];
		schema.$ref = ref;
	};
	if (ctx.cycles === "throw") for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (seen.cycle) throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
	}
	for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (schema === entry[0]) {
			extractToDef(entry);
			continue;
		}
		if (ctx.external) {
			const ext = ctx.external.registry.get(entry[0])?.id;
			if (schema !== entry[0] && ext) {
				extractToDef(entry);
				continue;
			}
		}
		if (ctx.metadataRegistry.get(entry[0])?.id) {
			extractToDef(entry);
			continue;
		}
		if (seen.cycle) {
			extractToDef(entry);
			continue;
		}
		if (seen.count > 1) {
			if (ctx.reused === "ref") {
				extractToDef(entry);
				continue;
			}
		}
	}
}
function finalize(ctx, schema) {
	const root = ctx.seen.get(schema);
	if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
	const flattenRef = (zodSchema) => {
		const seen = ctx.seen.get(zodSchema);
		if (seen.ref === null) return;
		const schema = seen.def ?? seen.schema;
		const _cached = { ...schema };
		const ref = seen.ref;
		seen.ref = null;
		if (ref) {
			flattenRef(ref);
			const refSeen = ctx.seen.get(ref);
			const refSchema = refSeen.schema;
			if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
				schema.allOf = schema.allOf ?? [];
				schema.allOf.push(refSchema);
			} else Object.assign(schema, refSchema);
			Object.assign(schema, _cached);
			if (zodSchema._zod.parent === ref) for (const key in schema) {
				if (key === "$ref" || key === "allOf") continue;
				if (!(key in _cached)) delete schema[key];
			}
			if (refSchema.$ref && refSeen.def) for (const key in schema) {
				if (key === "$ref" || key === "allOf") continue;
				if (key in refSeen.def && JSON.stringify(schema[key]) === JSON.stringify(refSeen.def[key])) delete schema[key];
			}
		}
		const parent = zodSchema._zod.parent;
		if (parent && parent !== ref) {
			flattenRef(parent);
			const parentSeen = ctx.seen.get(parent);
			if (parentSeen?.schema.$ref) {
				schema.$ref = parentSeen.schema.$ref;
				if (parentSeen.def) for (const key in schema) {
					if (key === "$ref" || key === "allOf") continue;
					if (key in parentSeen.def && JSON.stringify(schema[key]) === JSON.stringify(parentSeen.def[key])) delete schema[key];
				}
			}
		}
		ctx.override({
			zodSchema,
			jsonSchema: schema,
			path: seen.path ?? []
		});
	};
	for (const entry of [...ctx.seen.entries()].reverse()) flattenRef(entry[0]);
	const result = {};
	if (ctx.target === "draft-2020-12") result.$schema = "https://json-schema.org/draft/2020-12/schema";
	else if (ctx.target === "draft-07") result.$schema = "http://json-schema.org/draft-07/schema#";
	else if (ctx.target === "draft-04") result.$schema = "http://json-schema.org/draft-04/schema#";
	else if (ctx.target === "openapi-3.0") {}
	if (ctx.external?.uri) {
		const id = ctx.external.registry.get(schema)?.id;
		if (!id) throw new Error("Schema is missing an `id` property");
		result.$id = ctx.external.uri(id);
	}
	Object.assign(result, root.def ?? root.schema);
	const rootMetaId = ctx.metadataRegistry.get(schema)?.id;
	if (rootMetaId !== void 0 && result.id === rootMetaId) delete result.id;
	const defs = ctx.external?.defs ?? {};
	for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (seen.def && seen.defId) {
			if (seen.def.id === seen.defId) delete seen.def.id;
			defs[seen.defId] = seen.def;
		}
	}
	if (ctx.external) {} else if (Object.keys(defs).length > 0) if (ctx.target === "draft-2020-12") result.$defs = defs;
	else result.definitions = defs;
	try {
		const finalized = JSON.parse(JSON.stringify(result));
		Object.defineProperty(finalized, "~standard", {
			value: {
				...schema["~standard"],
				jsonSchema: {
					input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
					output: createStandardJSONSchemaMethod(schema, "output", ctx.processors)
				}
			},
			enumerable: false,
			writable: false
		});
		return finalized;
	} catch (_err) {
		throw new Error("Error converting schema to JSON.");
	}
}
function isTransforming(_schema, _ctx) {
	const ctx = _ctx ?? { seen: /* @__PURE__ */ new Set() };
	if (ctx.seen.has(_schema)) return false;
	ctx.seen.add(_schema);
	const def = _schema._zod.def;
	if (def.type === "transform") return true;
	if (def.type === "array") return isTransforming(def.element, ctx);
	if (def.type === "set") return isTransforming(def.valueType, ctx);
	if (def.type === "lazy") return isTransforming(def.getter(), ctx);
	if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault") return isTransforming(def.innerType, ctx);
	if (def.type === "intersection") return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
	if (def.type === "record" || def.type === "map") return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
	if (def.type === "pipe") {
		if (_schema._zod.traits.has("$ZodCodec")) return true;
		return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
	}
	if (def.type === "object") {
		for (const key in def.shape) if (isTransforming(def.shape[key], ctx)) return true;
		return false;
	}
	if (def.type === "union") {
		for (const option of def.options) if (isTransforming(option, ctx)) return true;
		return false;
	}
	if (def.type === "tuple") {
		for (const item of def.items) if (isTransforming(item, ctx)) return true;
		if (def.rest && isTransforming(def.rest, ctx)) return true;
		return false;
	}
	return false;
}
/**
* Creates a toJSONSchema method for a schema instance.
* This encapsulates the logic of initializing context, processing, extracting defs, and finalizing.
*/
var createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
	const ctx = initializeContext({
		...params,
		processors
	});
	process(schema, ctx);
	extractDefs(ctx, schema);
	return finalize(ctx, schema);
};
var createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
	const { libraryOptions, target } = params ?? {};
	const ctx = initializeContext({
		...libraryOptions ?? {},
		target,
		io,
		processors
	});
	process(schema, ctx);
	extractDefs(ctx, schema);
	return finalize(ctx, schema);
};
//#endregion
//#region node_modules/zod/v4/core/json-schema-processors.js
var formatMap = {
	guid: "uuid",
	url: "uri",
	datetime: "date-time",
	json_string: "json-string",
	regex: ""
};
var stringProcessor = (schema, ctx, _json, _params) => {
	const json = _json;
	json.type = "string";
	const { minimum, maximum, format, patterns, contentEncoding } = schema._zod.bag;
	if (typeof minimum === "number") json.minLength = minimum;
	if (typeof maximum === "number") json.maxLength = maximum;
	if (format) {
		json.format = formatMap[format] ?? format;
		if (json.format === "") delete json.format;
		if (format === "time") delete json.format;
	}
	if (contentEncoding) json.contentEncoding = contentEncoding;
	if (patterns && patterns.size > 0) {
		const regexes = [...patterns];
		if (regexes.length === 1) json.pattern = regexes[0].source;
		else if (regexes.length > 1) json.allOf = [...regexes.map((regex) => ({
			...ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? { type: "string" } : {},
			pattern: regex.source
		}))];
	}
};
var numberProcessor = (schema, ctx, _json, _params) => {
	const json = _json;
	const { minimum, maximum, format, multipleOf, exclusiveMaximum, exclusiveMinimum } = schema._zod.bag;
	if (typeof format === "string" && format.includes("int")) json.type = "integer";
	else json.type = "number";
	const exMin = typeof exclusiveMinimum === "number" && exclusiveMinimum >= (minimum ?? Number.NEGATIVE_INFINITY);
	const exMax = typeof exclusiveMaximum === "number" && exclusiveMaximum <= (maximum ?? Number.POSITIVE_INFINITY);
	const legacy = ctx.target === "draft-04" || ctx.target === "openapi-3.0";
	if (exMin) if (legacy) {
		json.minimum = exclusiveMinimum;
		json.exclusiveMinimum = true;
	} else json.exclusiveMinimum = exclusiveMinimum;
	else if (typeof minimum === "number") json.minimum = minimum;
	if (exMax) if (legacy) {
		json.maximum = exclusiveMaximum;
		json.exclusiveMaximum = true;
	} else json.exclusiveMaximum = exclusiveMaximum;
	else if (typeof maximum === "number") json.maximum = maximum;
	if (typeof multipleOf === "number") json.multipleOf = multipleOf;
};
var booleanProcessor = (_schema, _ctx, json, _params) => {
	json.type = "boolean";
};
var bigintProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("BigInt cannot be represented in JSON Schema");
};
var symbolProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("Symbols cannot be represented in JSON Schema");
};
var nullProcessor = (_schema, ctx, json, _params) => {
	if (ctx.target === "openapi-3.0") {
		json.type = "string";
		json.nullable = true;
		json.enum = [null];
	} else json.type = "null";
};
var undefinedProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("Undefined cannot be represented in JSON Schema");
};
var voidProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("Void cannot be represented in JSON Schema");
};
var neverProcessor = (_schema, _ctx, json, _params) => {
	json.not = {};
};
var anyProcessor = (_schema, _ctx, _json, _params) => {};
var unknownProcessor = (_schema, _ctx, _json, _params) => {};
var dateProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("Date cannot be represented in JSON Schema");
};
var enumProcessor = (schema, _ctx, json, _params) => {
	const def = schema._zod.def;
	const values = getEnumValues(def.entries);
	if (values.every((v) => typeof v === "number")) json.type = "number";
	if (values.every((v) => typeof v === "string")) json.type = "string";
	json.enum = values;
};
var literalProcessor = (schema, ctx, json, _params) => {
	const def = schema._zod.def;
	const vals = [];
	for (const val of def.values) if (val === void 0) {
		if (ctx.unrepresentable === "throw") throw new Error("Literal `undefined` cannot be represented in JSON Schema");
	} else if (typeof val === "bigint") if (ctx.unrepresentable === "throw") throw new Error("BigInt literals cannot be represented in JSON Schema");
	else vals.push(Number(val));
	else vals.push(val);
	if (vals.length === 0) {} else if (vals.length === 1) {
		const val = vals[0];
		json.type = val === null ? "null" : typeof val;
		if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") json.enum = [val];
		else json.const = val;
	} else {
		if (vals.every((v) => typeof v === "number")) json.type = "number";
		if (vals.every((v) => typeof v === "string")) json.type = "string";
		if (vals.every((v) => typeof v === "boolean")) json.type = "boolean";
		if (vals.every((v) => v === null)) json.type = "null";
		json.enum = vals;
	}
};
var nanProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("NaN cannot be represented in JSON Schema");
};
var templateLiteralProcessor = (schema, _ctx, json, _params) => {
	const _json = json;
	const pattern = schema._zod.pattern;
	if (!pattern) throw new Error("Pattern not found in template literal");
	_json.type = "string";
	_json.pattern = pattern.source;
};
var fileProcessor = (schema, _ctx, json, _params) => {
	const _json = json;
	const file = {
		type: "string",
		format: "binary",
		contentEncoding: "binary"
	};
	const { minimum, maximum, mime } = schema._zod.bag;
	if (minimum !== void 0) file.minLength = minimum;
	if (maximum !== void 0) file.maxLength = maximum;
	if (mime) if (mime.length === 1) {
		file.contentMediaType = mime[0];
		Object.assign(_json, file);
	} else {
		Object.assign(_json, file);
		_json.anyOf = mime.map((m) => ({ contentMediaType: m }));
	}
	else Object.assign(_json, file);
};
var successProcessor = (_schema, _ctx, json, _params) => {
	json.type = "boolean";
};
var customProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("Custom types cannot be represented in JSON Schema");
};
var functionProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("Function types cannot be represented in JSON Schema");
};
var transformProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("Transforms cannot be represented in JSON Schema");
};
var mapProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("Map cannot be represented in JSON Schema");
};
var setProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("Set cannot be represented in JSON Schema");
};
var arrayProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const def = schema._zod.def;
	const { minimum, maximum } = schema._zod.bag;
	if (typeof minimum === "number") json.minItems = minimum;
	if (typeof maximum === "number") json.maxItems = maximum;
	json.type = "array";
	json.items = process(def.element, ctx, {
		...params,
		path: [...params.path, "items"]
	});
};
var objectProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const def = schema._zod.def;
	json.type = "object";
	json.properties = {};
	const shape = def.shape;
	for (const key in shape) json.properties[key] = process(shape[key], ctx, {
		...params,
		path: [
			...params.path,
			"properties",
			key
		]
	});
	const allKeys = new Set(Object.keys(shape));
	const requiredKeys = new Set([...allKeys].filter((key) => {
		const v = def.shape[key]._zod;
		if (ctx.io === "input") return v.optin === void 0;
		else return v.optout === void 0;
	}));
	if (requiredKeys.size > 0) json.required = Array.from(requiredKeys);
	if (def.catchall?._zod.def.type === "never") json.additionalProperties = false;
	else if (!def.catchall) {
		if (ctx.io === "output") json.additionalProperties = false;
	} else if (def.catchall) json.additionalProperties = process(def.catchall, ctx, {
		...params,
		path: [...params.path, "additionalProperties"]
	});
};
var unionProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	const isExclusive = def.inclusive === false;
	const options = def.options.map((x, i) => process(x, ctx, {
		...params,
		path: [
			...params.path,
			isExclusive ? "oneOf" : "anyOf",
			i
		]
	}));
	if (isExclusive) json.oneOf = options;
	else json.anyOf = options;
};
var intersectionProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	const a = process(def.left, ctx, {
		...params,
		path: [
			...params.path,
			"allOf",
			0
		]
	});
	const b = process(def.right, ctx, {
		...params,
		path: [
			...params.path,
			"allOf",
			1
		]
	});
	const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
	json.allOf = [...isSimpleIntersection(a) ? a.allOf : [a], ...isSimpleIntersection(b) ? b.allOf : [b]];
};
var tupleProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const def = schema._zod.def;
	json.type = "array";
	const prefixPath = ctx.target === "draft-2020-12" ? "prefixItems" : "items";
	const restPath = ctx.target === "draft-2020-12" ? "items" : ctx.target === "openapi-3.0" ? "items" : "additionalItems";
	const prefixItems = def.items.map((x, i) => process(x, ctx, {
		...params,
		path: [
			...params.path,
			prefixPath,
			i
		]
	}));
	const rest = def.rest ? process(def.rest, ctx, {
		...params,
		path: [
			...params.path,
			restPath,
			...ctx.target === "openapi-3.0" ? [def.items.length] : []
		]
	}) : null;
	if (ctx.target === "draft-2020-12") {
		json.prefixItems = prefixItems;
		if (rest) json.items = rest;
	} else if (ctx.target === "openapi-3.0") {
		json.items = { anyOf: prefixItems };
		if (rest) json.items.anyOf.push(rest);
		json.minItems = prefixItems.length;
		if (!rest) json.maxItems = prefixItems.length;
	} else {
		json.items = prefixItems;
		if (rest) json.additionalItems = rest;
	}
	const { minimum, maximum } = schema._zod.bag;
	if (typeof minimum === "number") json.minItems = minimum;
	if (typeof maximum === "number") json.maxItems = maximum;
};
var recordProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const def = schema._zod.def;
	json.type = "object";
	const keyType = def.keyType;
	const patterns = keyType._zod.bag?.patterns;
	if (def.mode === "loose" && patterns && patterns.size > 0) {
		const valueSchema = process(def.valueType, ctx, {
			...params,
			path: [
				...params.path,
				"patternProperties",
				"*"
			]
		});
		json.patternProperties = {};
		for (const pattern of patterns) json.patternProperties[pattern.source] = valueSchema;
	} else {
		if (ctx.target === "draft-07" || ctx.target === "draft-2020-12") json.propertyNames = process(def.keyType, ctx, {
			...params,
			path: [...params.path, "propertyNames"]
		});
		json.additionalProperties = process(def.valueType, ctx, {
			...params,
			path: [...params.path, "additionalProperties"]
		});
	}
	const keyValues = keyType._zod.values;
	if (keyValues) {
		const validKeyValues = [...keyValues].filter((v) => typeof v === "string" || typeof v === "number");
		if (validKeyValues.length > 0) json.required = validKeyValues;
	}
};
var nullableProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	const inner = process(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	if (ctx.target === "openapi-3.0") {
		seen.ref = def.innerType;
		json.nullable = true;
	} else json.anyOf = [inner, { type: "null" }];
};
var nonoptionalProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	process(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
};
var defaultProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	process(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	json.default = JSON.parse(JSON.stringify(def.defaultValue));
};
var prefaultProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	process(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	if (ctx.io === "input") json._prefault = JSON.parse(JSON.stringify(def.defaultValue));
};
var catchProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	process(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	let catchValue;
	try {
		catchValue = def.catchValue(void 0);
	} catch {
		throw new Error("Dynamic catch values are not supported in JSON Schema");
	}
	json.default = catchValue;
};
var pipeProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	const inIsTransform = def.in._zod.traits.has("$ZodTransform");
	const innerType = ctx.io === "input" ? inIsTransform ? def.out : def.in : def.out;
	process(innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = innerType;
};
var readonlyProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	process(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	json.readOnly = true;
};
var promiseProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	process(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
};
var optionalProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	process(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
};
var lazyProcessor = (schema, ctx, _json, params) => {
	const innerType = schema._zod.innerType;
	process(innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = innerType;
};
var allProcessors = {
	string: stringProcessor,
	number: numberProcessor,
	boolean: booleanProcessor,
	bigint: bigintProcessor,
	symbol: symbolProcessor,
	null: nullProcessor,
	undefined: undefinedProcessor,
	void: voidProcessor,
	never: neverProcessor,
	any: anyProcessor,
	unknown: unknownProcessor,
	date: dateProcessor,
	enum: enumProcessor,
	literal: literalProcessor,
	nan: nanProcessor,
	template_literal: templateLiteralProcessor,
	file: fileProcessor,
	success: successProcessor,
	custom: customProcessor,
	function: functionProcessor,
	transform: transformProcessor,
	map: mapProcessor,
	set: setProcessor,
	array: arrayProcessor,
	object: objectProcessor,
	union: unionProcessor,
	intersection: intersectionProcessor,
	tuple: tupleProcessor,
	record: recordProcessor,
	nullable: nullableProcessor,
	nonoptional: nonoptionalProcessor,
	default: defaultProcessor,
	prefault: prefaultProcessor,
	catch: catchProcessor,
	pipe: pipeProcessor,
	readonly: readonlyProcessor,
	promise: promiseProcessor,
	optional: optionalProcessor,
	lazy: lazyProcessor
};
function toJSONSchema(input, params) {
	if ("_idmap" in input) {
		const registry = input;
		const ctx = initializeContext({
			...params,
			processors: allProcessors
		});
		const defs = {};
		for (const entry of registry._idmap.entries()) {
			const [_, schema] = entry;
			process(schema, ctx);
		}
		const schemas = {};
		ctx.external = {
			registry,
			uri: params?.uri,
			defs
		};
		for (const entry of registry._idmap.entries()) {
			const [key, schema] = entry;
			extractDefs(ctx, schema);
			schemas[key] = finalize(ctx, schema);
		}
		if (Object.keys(defs).length > 0) schemas.__shared = { [ctx.target === "draft-2020-12" ? "$defs" : "definitions"]: defs };
		return { schemas };
	}
	const ctx = initializeContext({
		...params,
		processors: allProcessors
	});
	process(input, ctx);
	extractDefs(ctx, input);
	return finalize(ctx, input);
}
//#endregion
//#region node_modules/zod/v4/classic/iso.js
var ZodISODateTime = /*@__PURE__*/ $constructor("ZodISODateTime", (inst, def) => {
	$ZodISODateTime.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function datetime(params) {
	return /* @__PURE__ */ _isoDateTime(ZodISODateTime, params);
}
var ZodISODate = /*@__PURE__*/ $constructor("ZodISODate", (inst, def) => {
	$ZodISODate.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function date(params) {
	return /* @__PURE__ */ _isoDate(ZodISODate, params);
}
var ZodISOTime = /*@__PURE__*/ $constructor("ZodISOTime", (inst, def) => {
	$ZodISOTime.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function time(params) {
	return /* @__PURE__ */ _isoTime(ZodISOTime, params);
}
var ZodISODuration = /*@__PURE__*/ $constructor("ZodISODuration", (inst, def) => {
	$ZodISODuration.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function duration(params) {
	return /* @__PURE__ */ _isoDuration(ZodISODuration, params);
}
//#endregion
//#region node_modules/zod/v4/classic/errors.js
var initializer = (inst, issues) => {
	$ZodError.init(inst, issues);
	inst.name = "ZodError";
	Object.defineProperties(inst, {
		format: { value: (mapper) => formatError(inst, mapper) },
		flatten: { value: (mapper) => flattenError(inst, mapper) },
		addIssue: { value: (issue) => {
			inst.issues.push(issue);
			inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
		} },
		addIssues: { value: (issues) => {
			inst.issues.push(...issues);
			inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
		} },
		isEmpty: { get() {
			return inst.issues.length === 0;
		} }
	});
};
var ZodRealError = /*@__PURE__*/ $constructor("ZodError", initializer, { Parent: Error });
//#endregion
//#region node_modules/zod/v4/classic/parse.js
var parse = /* @__PURE__ */ _parse(ZodRealError);
var parseAsync = /* @__PURE__ */ _parseAsync(ZodRealError);
var safeParse = /* @__PURE__ */ _safeParse(ZodRealError);
var safeParseAsync = /* @__PURE__ */ _safeParseAsync(ZodRealError);
var encode = /* @__PURE__ */ _encode(ZodRealError);
var decode = /* @__PURE__ */ _decode(ZodRealError);
var encodeAsync = /* @__PURE__ */ _encodeAsync(ZodRealError);
var decodeAsync = /* @__PURE__ */ _decodeAsync(ZodRealError);
var safeEncode = /* @__PURE__ */ _safeEncode(ZodRealError);
var safeDecode = /* @__PURE__ */ _safeDecode(ZodRealError);
var safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
var safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);
//#endregion
//#region node_modules/zod/v4/classic/schemas.js
var _installedGroups = /* @__PURE__ */ new WeakMap();
function _installLazyMethods(inst, group, methods) {
	const proto = Object.getPrototypeOf(inst);
	let installed = _installedGroups.get(proto);
	if (!installed) {
		installed = /* @__PURE__ */ new Set();
		_installedGroups.set(proto, installed);
	}
	if (installed.has(group)) return;
	installed.add(group);
	for (const key in methods) {
		const fn = methods[key];
		Object.defineProperty(proto, key, {
			configurable: true,
			enumerable: false,
			get() {
				const bound = fn.bind(this);
				Object.defineProperty(this, key, {
					configurable: true,
					writable: true,
					enumerable: true,
					value: bound
				});
				return bound;
			},
			set(v) {
				Object.defineProperty(this, key, {
					configurable: true,
					writable: true,
					enumerable: true,
					value: v
				});
			}
		});
	}
}
var ZodType = /*@__PURE__*/ $constructor("ZodType", (inst, def) => {
	$ZodType.init(inst, def);
	Object.assign(inst["~standard"], { jsonSchema: {
		input: createStandardJSONSchemaMethod(inst, "input"),
		output: createStandardJSONSchemaMethod(inst, "output")
	} });
	inst.toJSONSchema = createToJSONSchemaMethod(inst, {});
	inst.def = def;
	inst.type = def.type;
	Object.defineProperty(inst, "_def", { value: def });
	inst.parse = (data, params) => parse(inst, data, params, { callee: inst.parse });
	inst.safeParse = (data, params) => safeParse(inst, data, params);
	inst.parseAsync = async (data, params) => parseAsync(inst, data, params, { callee: inst.parseAsync });
	inst.safeParseAsync = async (data, params) => safeParseAsync(inst, data, params);
	inst.spa = inst.safeParseAsync;
	inst.encode = (data, params) => encode(inst, data, params);
	inst.decode = (data, params) => decode(inst, data, params);
	inst.encodeAsync = async (data, params) => encodeAsync(inst, data, params);
	inst.decodeAsync = async (data, params) => decodeAsync(inst, data, params);
	inst.safeEncode = (data, params) => safeEncode(inst, data, params);
	inst.safeDecode = (data, params) => safeDecode(inst, data, params);
	inst.safeEncodeAsync = async (data, params) => safeEncodeAsync(inst, data, params);
	inst.safeDecodeAsync = async (data, params) => safeDecodeAsync(inst, data, params);
	_installLazyMethods(inst, "ZodType", {
		check(...chks) {
			const def = this.def;
			return this.clone(mergeDefs(def, { checks: [...def.checks ?? [], ...chks.map((ch) => typeof ch === "function" ? { _zod: {
				check: ch,
				def: { check: "custom" },
				onattach: []
			} } : ch)] }), { parent: true });
		},
		with(...chks) {
			return this.check(...chks);
		},
		clone(def, params) {
			return clone(this, def, params);
		},
		brand() {
			return this;
		},
		register(reg, meta) {
			reg.add(this, meta);
			return this;
		},
		refine(check, params) {
			return this.check(refine(check, params));
		},
		superRefine(refinement, params) {
			return this.check(superRefine(refinement, params));
		},
		overwrite(fn) {
			return this.check(/* @__PURE__ */ _overwrite(fn));
		},
		optional() {
			return optional(this);
		},
		exactOptional() {
			return exactOptional(this);
		},
		nullable() {
			return nullable(this);
		},
		nullish() {
			return optional(nullable(this));
		},
		nonoptional(params) {
			return nonoptional(this, params);
		},
		array() {
			return array(this);
		},
		or(arg) {
			return union([this, arg]);
		},
		and(arg) {
			return intersection(this, arg);
		},
		transform(tx) {
			return pipe(this, transform(tx));
		},
		default(d) {
			return _default(this, d);
		},
		prefault(d) {
			return prefault(this, d);
		},
		catch(params) {
			return _catch(this, params);
		},
		pipe(target) {
			return pipe(this, target);
		},
		readonly() {
			return readonly(this);
		},
		describe(description) {
			const cl = this.clone();
			globalRegistry.add(cl, { description });
			return cl;
		},
		meta(...args) {
			if (args.length === 0) return globalRegistry.get(this);
			const cl = this.clone();
			globalRegistry.add(cl, args[0]);
			return cl;
		},
		isOptional() {
			return this.safeParse(void 0).success;
		},
		isNullable() {
			return this.safeParse(null).success;
		},
		apply(fn) {
			return fn(this);
		}
	});
	Object.defineProperty(inst, "description", {
		get() {
			return globalRegistry.get(inst)?.description;
		},
		configurable: true
	});
	return inst;
});
/** @internal */
var _ZodString = /*@__PURE__*/ $constructor("_ZodString", (inst, def) => {
	$ZodString.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => stringProcessor(inst, ctx, json, params);
	const bag = inst._zod.bag;
	inst.format = bag.format ?? null;
	inst.minLength = bag.minimum ?? null;
	inst.maxLength = bag.maximum ?? null;
	_installLazyMethods(inst, "_ZodString", {
		regex(...args) {
			return this.check(/* @__PURE__ */ _regex(...args));
		},
		includes(...args) {
			return this.check(/* @__PURE__ */ _includes(...args));
		},
		startsWith(...args) {
			return this.check(/* @__PURE__ */ _startsWith(...args));
		},
		endsWith(...args) {
			return this.check(/* @__PURE__ */ _endsWith(...args));
		},
		min(...args) {
			return this.check(/* @__PURE__ */ _minLength(...args));
		},
		max(...args) {
			return this.check(/* @__PURE__ */ _maxLength(...args));
		},
		length(...args) {
			return this.check(/* @__PURE__ */ _length(...args));
		},
		nonempty(...args) {
			return this.check(/* @__PURE__ */ _minLength(1, ...args));
		},
		lowercase(params) {
			return this.check(/* @__PURE__ */ _lowercase(params));
		},
		uppercase(params) {
			return this.check(/* @__PURE__ */ _uppercase(params));
		},
		trim() {
			return this.check(/* @__PURE__ */ _trim());
		},
		normalize(...args) {
			return this.check(/* @__PURE__ */ _normalize(...args));
		},
		toLowerCase() {
			return this.check(/* @__PURE__ */ _toLowerCase());
		},
		toUpperCase() {
			return this.check(/* @__PURE__ */ _toUpperCase());
		},
		slugify() {
			return this.check(/* @__PURE__ */ _slugify());
		}
	});
});
var ZodString = /*@__PURE__*/ $constructor("ZodString", (inst, def) => {
	$ZodString.init(inst, def);
	_ZodString.init(inst, def);
	inst.email = (params) => inst.check(/* @__PURE__ */ _email(ZodEmail, params));
	inst.url = (params) => inst.check(/* @__PURE__ */ _url(ZodURL, params));
	inst.jwt = (params) => inst.check(/* @__PURE__ */ _jwt(ZodJWT, params));
	inst.emoji = (params) => inst.check(/* @__PURE__ */ _emoji(ZodEmoji, params));
	inst.guid = (params) => inst.check(/* @__PURE__ */ _guid(ZodGUID, params));
	inst.uuid = (params) => inst.check(/* @__PURE__ */ _uuid(ZodUUID, params));
	inst.uuidv4 = (params) => inst.check(/* @__PURE__ */ _uuidv4(ZodUUID, params));
	inst.uuidv6 = (params) => inst.check(/* @__PURE__ */ _uuidv6(ZodUUID, params));
	inst.uuidv7 = (params) => inst.check(/* @__PURE__ */ _uuidv7(ZodUUID, params));
	inst.nanoid = (params) => inst.check(/* @__PURE__ */ _nanoid(ZodNanoID, params));
	inst.guid = (params) => inst.check(/* @__PURE__ */ _guid(ZodGUID, params));
	inst.cuid = (params) => inst.check(/* @__PURE__ */ _cuid(ZodCUID, params));
	inst.cuid2 = (params) => inst.check(/* @__PURE__ */ _cuid2(ZodCUID2, params));
	inst.ulid = (params) => inst.check(/* @__PURE__ */ _ulid(ZodULID, params));
	inst.base64 = (params) => inst.check(/* @__PURE__ */ _base64(ZodBase64, params));
	inst.base64url = (params) => inst.check(/* @__PURE__ */ _base64url(ZodBase64URL, params));
	inst.xid = (params) => inst.check(/* @__PURE__ */ _xid(ZodXID, params));
	inst.ksuid = (params) => inst.check(/* @__PURE__ */ _ksuid(ZodKSUID, params));
	inst.ipv4 = (params) => inst.check(/* @__PURE__ */ _ipv4(ZodIPv4, params));
	inst.ipv6 = (params) => inst.check(/* @__PURE__ */ _ipv6(ZodIPv6, params));
	inst.cidrv4 = (params) => inst.check(/* @__PURE__ */ _cidrv4(ZodCIDRv4, params));
	inst.cidrv6 = (params) => inst.check(/* @__PURE__ */ _cidrv6(ZodCIDRv6, params));
	inst.e164 = (params) => inst.check(/* @__PURE__ */ _e164(ZodE164, params));
	inst.datetime = (params) => inst.check(datetime(params));
	inst.date = (params) => inst.check(date(params));
	inst.time = (params) => inst.check(time(params));
	inst.duration = (params) => inst.check(duration(params));
});
function string(params) {
	return /* @__PURE__ */ _string(ZodString, params);
}
var ZodStringFormat = /*@__PURE__*/ $constructor("ZodStringFormat", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	_ZodString.init(inst, def);
});
var ZodEmail = /*@__PURE__*/ $constructor("ZodEmail", (inst, def) => {
	$ZodEmail.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodGUID = /*@__PURE__*/ $constructor("ZodGUID", (inst, def) => {
	$ZodGUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodUUID = /*@__PURE__*/ $constructor("ZodUUID", (inst, def) => {
	$ZodUUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodURL = /*@__PURE__*/ $constructor("ZodURL", (inst, def) => {
	$ZodURL.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodEmoji = /*@__PURE__*/ $constructor("ZodEmoji", (inst, def) => {
	$ZodEmoji.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodNanoID = /*@__PURE__*/ $constructor("ZodNanoID", (inst, def) => {
	$ZodNanoID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
/**
* @deprecated CUID v1 is deprecated by its authors due to information leakage
* (timestamps embedded in the id). Use {@link ZodCUID2} instead.
* See https://github.com/paralleldrive/cuid.
*/
var ZodCUID = /*@__PURE__*/ $constructor("ZodCUID", (inst, def) => {
	$ZodCUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodCUID2 = /*@__PURE__*/ $constructor("ZodCUID2", (inst, def) => {
	$ZodCUID2.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodULID = /*@__PURE__*/ $constructor("ZodULID", (inst, def) => {
	$ZodULID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodXID = /*@__PURE__*/ $constructor("ZodXID", (inst, def) => {
	$ZodXID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodKSUID = /*@__PURE__*/ $constructor("ZodKSUID", (inst, def) => {
	$ZodKSUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodIPv4 = /*@__PURE__*/ $constructor("ZodIPv4", (inst, def) => {
	$ZodIPv4.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodIPv6 = /*@__PURE__*/ $constructor("ZodIPv6", (inst, def) => {
	$ZodIPv6.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodCIDRv4 = /*@__PURE__*/ $constructor("ZodCIDRv4", (inst, def) => {
	$ZodCIDRv4.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodCIDRv6 = /*@__PURE__*/ $constructor("ZodCIDRv6", (inst, def) => {
	$ZodCIDRv6.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodBase64 = /*@__PURE__*/ $constructor("ZodBase64", (inst, def) => {
	$ZodBase64.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodBase64URL = /*@__PURE__*/ $constructor("ZodBase64URL", (inst, def) => {
	$ZodBase64URL.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodE164 = /*@__PURE__*/ $constructor("ZodE164", (inst, def) => {
	$ZodE164.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodJWT = /*@__PURE__*/ $constructor("ZodJWT", (inst, def) => {
	$ZodJWT.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodNumber = /*@__PURE__*/ $constructor("ZodNumber", (inst, def) => {
	$ZodNumber.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => numberProcessor(inst, ctx, json, params);
	_installLazyMethods(inst, "ZodNumber", {
		gt(value, params) {
			return this.check(/* @__PURE__ */ _gt(value, params));
		},
		gte(value, params) {
			return this.check(/* @__PURE__ */ _gte(value, params));
		},
		min(value, params) {
			return this.check(/* @__PURE__ */ _gte(value, params));
		},
		lt(value, params) {
			return this.check(/* @__PURE__ */ _lt(value, params));
		},
		lte(value, params) {
			return this.check(/* @__PURE__ */ _lte(value, params));
		},
		max(value, params) {
			return this.check(/* @__PURE__ */ _lte(value, params));
		},
		int(params) {
			return this.check(int(params));
		},
		safe(params) {
			return this.check(int(params));
		},
		positive(params) {
			return this.check(/* @__PURE__ */ _gt(0, params));
		},
		nonnegative(params) {
			return this.check(/* @__PURE__ */ _gte(0, params));
		},
		negative(params) {
			return this.check(/* @__PURE__ */ _lt(0, params));
		},
		nonpositive(params) {
			return this.check(/* @__PURE__ */ _lte(0, params));
		},
		multipleOf(value, params) {
			return this.check(/* @__PURE__ */ _multipleOf(value, params));
		},
		step(value, params) {
			return this.check(/* @__PURE__ */ _multipleOf(value, params));
		},
		finite() {
			return this;
		}
	});
	const bag = inst._zod.bag;
	inst.minValue = Math.max(bag.minimum ?? Number.NEGATIVE_INFINITY, bag.exclusiveMinimum ?? Number.NEGATIVE_INFINITY) ?? null;
	inst.maxValue = Math.min(bag.maximum ?? Number.POSITIVE_INFINITY, bag.exclusiveMaximum ?? Number.POSITIVE_INFINITY) ?? null;
	inst.isInt = (bag.format ?? "").includes("int") || Number.isSafeInteger(bag.multipleOf ?? .5);
	inst.isFinite = true;
	inst.format = bag.format ?? null;
});
function number(params) {
	return /* @__PURE__ */ _number(ZodNumber, params);
}
var ZodNumberFormat = /*@__PURE__*/ $constructor("ZodNumberFormat", (inst, def) => {
	$ZodNumberFormat.init(inst, def);
	ZodNumber.init(inst, def);
});
function int(params) {
	return /* @__PURE__ */ _int(ZodNumberFormat, params);
}
var ZodBoolean = /*@__PURE__*/ $constructor("ZodBoolean", (inst, def) => {
	$ZodBoolean.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => booleanProcessor(inst, ctx, json, params);
});
function boolean(params) {
	return /* @__PURE__ */ _boolean(ZodBoolean, params);
}
var ZodUnknown = /*@__PURE__*/ $constructor("ZodUnknown", (inst, def) => {
	$ZodUnknown.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => void 0;
});
function unknown() {
	return /* @__PURE__ */ _unknown(ZodUnknown);
}
var ZodNever = /*@__PURE__*/ $constructor("ZodNever", (inst, def) => {
	$ZodNever.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => neverProcessor(inst, ctx, json, params);
});
function never(params) {
	return /* @__PURE__ */ _never(ZodNever, params);
}
var ZodVoid = /*@__PURE__*/ $constructor("ZodVoid", (inst, def) => {
	$ZodVoid.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => voidProcessor(inst, ctx, json, params);
});
function _void(params) {
	return /* @__PURE__ */ _void$1(ZodVoid, params);
}
var ZodArray = /*@__PURE__*/ $constructor("ZodArray", (inst, def) => {
	$ZodArray.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => arrayProcessor(inst, ctx, json, params);
	inst.element = def.element;
	_installLazyMethods(inst, "ZodArray", {
		min(n, params) {
			return this.check(/* @__PURE__ */ _minLength(n, params));
		},
		nonempty(params) {
			return this.check(/* @__PURE__ */ _minLength(1, params));
		},
		max(n, params) {
			return this.check(/* @__PURE__ */ _maxLength(n, params));
		},
		length(n, params) {
			return this.check(/* @__PURE__ */ _length(n, params));
		},
		unwrap() {
			return this.element;
		}
	});
});
function array(element, params) {
	return /* @__PURE__ */ _array(ZodArray, element, params);
}
var ZodObject = /*@__PURE__*/ $constructor("ZodObject", (inst, def) => {
	$ZodObjectJIT.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => objectProcessor(inst, ctx, json, params);
	defineLazy(inst, "shape", () => {
		return def.shape;
	});
	_installLazyMethods(inst, "ZodObject", {
		keyof() {
			return _enum(Object.keys(this._zod.def.shape));
		},
		catchall(catchall) {
			return this.clone({
				...this._zod.def,
				catchall
			});
		},
		passthrough() {
			return this.clone({
				...this._zod.def,
				catchall: unknown()
			});
		},
		loose() {
			return this.clone({
				...this._zod.def,
				catchall: unknown()
			});
		},
		strict() {
			return this.clone({
				...this._zod.def,
				catchall: never()
			});
		},
		strip() {
			return this.clone({
				...this._zod.def,
				catchall: void 0
			});
		},
		extend(incoming) {
			return extend(this, incoming);
		},
		safeExtend(incoming) {
			return safeExtend(this, incoming);
		},
		merge(other) {
			return merge(this, other);
		},
		pick(mask) {
			return pick(this, mask);
		},
		omit(mask) {
			return omit(this, mask);
		},
		partial(...args) {
			return partial(ZodOptional, this, args[0]);
		},
		required(...args) {
			return required(ZodNonOptional, this, args[0]);
		}
	});
});
function object(shape, params) {
	return new ZodObject({
		type: "object",
		shape: shape ?? {},
		...normalizeParams(params)
	});
}
var ZodUnion = /*@__PURE__*/ $constructor("ZodUnion", (inst, def) => {
	$ZodUnion.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => unionProcessor(inst, ctx, json, params);
	inst.options = def.options;
});
function union(options, params) {
	return new ZodUnion({
		type: "union",
		options,
		...normalizeParams(params)
	});
}
var ZodIntersection = /*@__PURE__*/ $constructor("ZodIntersection", (inst, def) => {
	$ZodIntersection.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => intersectionProcessor(inst, ctx, json, params);
});
function intersection(left, right) {
	return new ZodIntersection({
		type: "intersection",
		left,
		right
	});
}
var ZodRecord = /*@__PURE__*/ $constructor("ZodRecord", (inst, def) => {
	$ZodRecord.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => recordProcessor(inst, ctx, json, params);
	inst.keyType = def.keyType;
	inst.valueType = def.valueType;
});
function record(keyType, valueType, params) {
	if (!valueType || !valueType._zod) return new ZodRecord({
		type: "record",
		keyType: string(),
		valueType: keyType,
		...normalizeParams(valueType)
	});
	return new ZodRecord({
		type: "record",
		keyType,
		valueType,
		...normalizeParams(params)
	});
}
var ZodEnum = /*@__PURE__*/ $constructor("ZodEnum", (inst, def) => {
	$ZodEnum.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => enumProcessor(inst, ctx, json, params);
	inst.enum = def.entries;
	inst.options = Object.values(def.entries);
	const keys = new Set(Object.keys(def.entries));
	inst.extract = (values, params) => {
		const newEntries = {};
		for (const value of values) if (keys.has(value)) newEntries[value] = def.entries[value];
		else throw new Error(`Key ${value} not found in enum`);
		return new ZodEnum({
			...def,
			checks: [],
			...normalizeParams(params),
			entries: newEntries
		});
	};
	inst.exclude = (values, params) => {
		const newEntries = { ...def.entries };
		for (const value of values) if (keys.has(value)) delete newEntries[value];
		else throw new Error(`Key ${value} not found in enum`);
		return new ZodEnum({
			...def,
			checks: [],
			...normalizeParams(params),
			entries: newEntries
		});
	};
});
function _enum(values, params) {
	return new ZodEnum({
		type: "enum",
		entries: Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values,
		...normalizeParams(params)
	});
}
var ZodTransform = /*@__PURE__*/ $constructor("ZodTransform", (inst, def) => {
	$ZodTransform.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => transformProcessor(inst, ctx, json, params);
	inst._zod.parse = (payload, _ctx) => {
		if (_ctx.direction === "backward") throw new $ZodEncodeError(inst.constructor.name);
		payload.addIssue = (issue$1) => {
			if (typeof issue$1 === "string") payload.issues.push(issue(issue$1, payload.value, def));
			else {
				const _issue = issue$1;
				if (_issue.fatal) _issue.continue = false;
				_issue.code ?? (_issue.code = "custom");
				_issue.input ?? (_issue.input = payload.value);
				_issue.inst ?? (_issue.inst = inst);
				payload.issues.push(issue(_issue));
			}
		};
		const output = def.transform(payload.value, payload);
		if (output instanceof Promise) return output.then((output) => {
			payload.value = output;
			payload.fallback = true;
			return payload;
		});
		payload.value = output;
		payload.fallback = true;
		return payload;
	};
});
function transform(fn) {
	return new ZodTransform({
		type: "transform",
		transform: fn
	});
}
var ZodOptional = /*@__PURE__*/ $constructor("ZodOptional", (inst, def) => {
	$ZodOptional.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
	return new ZodOptional({
		type: "optional",
		innerType
	});
}
var ZodExactOptional = /*@__PURE__*/ $constructor("ZodExactOptional", (inst, def) => {
	$ZodExactOptional.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function exactOptional(innerType) {
	return new ZodExactOptional({
		type: "optional",
		innerType
	});
}
var ZodNullable = /*@__PURE__*/ $constructor("ZodNullable", (inst, def) => {
	$ZodNullable.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => nullableProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
	return new ZodNullable({
		type: "nullable",
		innerType
	});
}
var ZodDefault = /*@__PURE__*/ $constructor("ZodDefault", (inst, def) => {
	$ZodDefault.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => defaultProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
	inst.removeDefault = inst.unwrap;
});
function _default(innerType, defaultValue) {
	return new ZodDefault({
		type: "default",
		innerType,
		get defaultValue() {
			return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
		}
	});
}
var ZodPrefault = /*@__PURE__*/ $constructor("ZodPrefault", (inst, def) => {
	$ZodPrefault.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => prefaultProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
	return new ZodPrefault({
		type: "prefault",
		innerType,
		get defaultValue() {
			return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
		}
	});
}
var ZodNonOptional = /*@__PURE__*/ $constructor("ZodNonOptional", (inst, def) => {
	$ZodNonOptional.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => nonoptionalProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
	return new ZodNonOptional({
		type: "nonoptional",
		innerType,
		...normalizeParams(params)
	});
}
var ZodCatch = /*@__PURE__*/ $constructor("ZodCatch", (inst, def) => {
	$ZodCatch.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => catchProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
	inst.removeCatch = inst.unwrap;
});
function _catch(innerType, catchValue) {
	return new ZodCatch({
		type: "catch",
		innerType,
		catchValue: typeof catchValue === "function" ? catchValue : () => catchValue
	});
}
var ZodPipe = /*@__PURE__*/ $constructor("ZodPipe", (inst, def) => {
	$ZodPipe.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => pipeProcessor(inst, ctx, json, params);
	inst.in = def.in;
	inst.out = def.out;
});
function pipe(in_, out) {
	return new ZodPipe({
		type: "pipe",
		in: in_,
		out
	});
}
var ZodReadonly = /*@__PURE__*/ $constructor("ZodReadonly", (inst, def) => {
	$ZodReadonly.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => readonlyProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function readonly(innerType) {
	return new ZodReadonly({
		type: "readonly",
		innerType
	});
}
var ZodCustom = /*@__PURE__*/ $constructor("ZodCustom", (inst, def) => {
	$ZodCustom.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => customProcessor(inst, ctx, json, params);
});
function refine(fn, _params = {}) {
	return /* @__PURE__ */ _refine(ZodCustom, fn, _params);
}
function superRefine(fn, params) {
	return /* @__PURE__ */ _superRefine(fn, params);
}
//#endregion
//#region node_modules/@strands-agents/sdk/dist/src/tools/tool.js
/**
* Event yielded during tool execution to report streaming progress.
* Tools can yield zero or more of these events before returning the final ToolResult.
*
* @example
* ```typescript
* const streamEvent = new ToolStreamEvent({
*   data: 'Processing step 1...'
* })
*
* // Or with structured data
* const streamEvent = new ToolStreamEvent({
*   data: { progress: 50, message: 'Halfway complete' }
* })
* ```
*/
var ToolStreamEvent = class {
	/**
	* Discriminator for tool stream events.
	*/
	type = "toolStreamEvent";
	/**
	* Caller-provided data for the progress update.
	* Can be any type of data the tool wants to report.
	*/
	data;
	constructor(eventData) {
		if (eventData.data !== void 0) this.data = eventData.data;
	}
};
/**
* Interface for tool implementations.
* Tools are used by agents to interact with their environment and perform specific actions.
*
* The Tool interface provides a streaming execution model where tools can yield
* progress events during execution before returning a final result.
*
* Most implementations should use FunctionTool rather than implementing this interface directly.
*/
var Tool = class {};
/**
* Creates an error ToolResultBlock from an error object.
* Ensures all errors are normalized to Error objects and includes the original error
* in the ToolResultBlock for inspection by hooks, error handlers, and agent loop.
*
* TODO: Implement consistent logging format as defined in #30
* This error should be logged to the caller using the established logging pattern.
*
* @param error - The error that occurred (can be Error object or any thrown value)
* @param toolUseId - The tool use ID for the ToolResultBlock
* @returns A ToolResultBlock with error status, error message content, and original error object
*/
function createErrorResult(error, toolUseId) {
	const errorObject = normalizeError(error);
	return new ToolResultBlock({
		toolUseId,
		status: "error",
		content: [new TextBlock(`Error: ${errorObject.message}`)],
		error: errorObject
	});
}
//#endregion
//#region node_modules/@strands-agents/sdk/dist/src/interrupt.js
/**
* Error thrown when human input is required to continue agent execution.
* Caught by the agent loop to trigger an interrupt stop.
*/
var InterruptError = class extends Error {
	/**
	* The interrupts that caused this error.
	*/
	interrupts;
	constructor(interrupt) {
		const all = Array.isArray(interrupt) ? interrupt : [interrupt];
		const message = all.length === 1 ? `Interrupt raised: ${all[0].name}` : `${all.length} interrupts raised: ${all.map((i) => i.name).join(", ")}`;
		super(message);
		this.name = "InterruptError";
		this.interrupts = all;
	}
};
//#endregion
//#region node_modules/@strands-agents/sdk/dist/src/tools/function-tool.js
/**
* A Tool implementation that wraps a callback function and handles all ToolResultBlock conversion.
*
* FunctionTool allows creating tools from existing functions without needing to manually
* handle ToolResultBlock formatting or error handling. It supports multiple callback patterns:
* - Async generators for streaming responses
* - Promises for async operations
* - Synchronous functions for immediate results
*
* All return values are automatically wrapped in ToolResultBlock, and errors are caught and
* returned as error ToolResultBlocks.
*
* @example
* ```typescript
* // Create a tool with streaming
* const streamingTool = new FunctionTool({
*   name: 'processor',
*   description: 'Processes data with progress updates',
*   inputSchema: { type: 'object', properties: { data: { type: 'string' } } },
*   callback: async function* (input: any) {
*     yield 'Starting processing...'
*     // Do some work
*     yield 'Halfway done...'
*     // More work
*     return 'Processing complete!'
*   }
* })
* ```
*/
var FunctionTool = class extends Tool {
	/**
	* The unique name of the tool.
	*/
	name;
	/**
	* Human-readable description of what the tool does.
	*/
	description;
	/**
	* OpenAPI JSON specification for the tool.
	*/
	toolSpec;
	/**
	* The callback function that implements the tool's logic.
	*/
	_callback;
	/**
	* Creates a new FunctionTool instance.
	*
	* @param config - Configuration object for the tool
	*
	* @example
	* ```typescript
	* // Tool with input schema
	* const greetTool = new FunctionTool({
	*   name: 'greeter',
	*   description: 'Greets a person by name',
	*   inputSchema: {
	*     type: 'object',
	*     properties: { name: { type: 'string' } },
	*     required: ['name']
	*   },
	*   callback: (input: any) => `Hello, ${input.name}!`
	* })
	*
	* // Tool without input (no parameters)
	* const statusTool = new FunctionTool({
	*   name: 'getStatus',
	*   description: 'Gets system status',
	*   callback: () => ({ status: 'operational' })
	* })
	* ```
	*/
	constructor(config) {
		super();
		this.name = config.name;
		this.description = config.description;
		const inputSchema = config.inputSchema ?? {
			type: "object",
			properties: {},
			additionalProperties: false
		};
		this.toolSpec = {
			name: config.name,
			description: config.description,
			inputSchema
		};
		this._callback = config.callback;
	}
	/**
	* Executes the tool with streaming support.
	* Handles all callback patterns (async generator, promise, sync) and converts results to ToolResultBlock.
	*
	* @param toolContext - Context information including the tool use request and invocation state
	* @returns Async generator that yields ToolStreamEvents and returns a ToolResultBlock
	*/
	async *stream(toolContext) {
		const { toolUse } = toolContext;
		try {
			const result = this._callback(toolUse.input, toolContext);
			if (result && typeof result === "object" && Symbol.asyncIterator in result) {
				const generator = result;
				let iterResult = await generator.next();
				while (!iterResult.done) {
					yield new ToolStreamEvent({ data: iterResult.value });
					iterResult = await generator.next();
				}
				return this._wrapInToolResult(iterResult.value, toolUse.toolUseId);
			} else if (result instanceof Promise) {
				const value = await result;
				return this._wrapInToolResult(value, toolUse.toolUseId);
			} else return this._wrapInToolResult(result, toolUse.toolUseId);
		} catch (error) {
			if (error instanceof InterruptError) throw error;
			return createErrorResult(error, toolUse.toolUseId);
		}
	}
	/**
	* Invokes the tool directly with raw input and returns the unwrapped result.
	*
	* Unlike stream(), this method:
	* - Returns the raw result (not wrapped in ToolResult)
	* - Consumes async generators and returns the generator's return value
	* - Lets errors throw naturally (not wrapped in error ToolResult)
	*
	* @param input - The input parameters for the tool
	* @param context - Optional tool execution context
	* @returns The unwrapped result
	*/
	async invoke(input, context) {
		const result = this._callback(input, context);
		if (result && typeof result === "object" && Symbol.asyncIterator in result) {
			const generator = result;
			let iterResult = await generator.next();
			while (!iterResult.done) iterResult = await generator.next();
			return iterResult.value;
		}
		return await result;
	}
	/**
	* Wraps a value in a ToolResultBlock with success status.
	*
	* Due to AWS Bedrock limitations (only accepts objects as JSON content), the following
	* rules are applied:
	* - Content blocks (TextBlock, JsonBlock, ImageBlock, VideoBlock, DocumentBlock) → passed through directly
	* - Arrays of content blocks → used directly as content array
	* - Strings → TextBlock
	* - Numbers, Booleans → TextBlock (converted to string)
	* - null, undefined → TextBlock (special string representation)
	* - Objects → JsonBlock (with deep copy)
	* - Arrays (non-content blocks) → JsonBlock wrapped in \{ $value: array \} (with deep copy)
	*
	* @param value - The value to wrap (can be any type)
	* @param toolUseId - The tool use ID for the ToolResultBlock
	* @returns A ToolResultBlock containing the value
	*/
	_wrapInToolResult(value, toolUseId) {
		try {
			if (value instanceof DocumentBlock || value instanceof ImageBlock || value instanceof VideoBlock) return new ToolResultBlock({
				toolUseId,
				status: "success",
				content: [value]
			});
			if (value === null) return new ToolResultBlock({
				toolUseId,
				status: "success",
				content: [new TextBlock("<null>")]
			});
			if (value === void 0) return new ToolResultBlock({
				toolUseId,
				status: "success",
				content: [new TextBlock("<undefined>")]
			});
			const contentBlock = this._asToolResultContent(value);
			if (contentBlock) return new ToolResultBlock({
				toolUseId,
				status: "success",
				content: [contentBlock]
			});
			if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return new ToolResultBlock({
				toolUseId,
				status: "success",
				content: [new TextBlock(String(value))]
			});
			if (Array.isArray(value)) {
				if (value.length > 0) {
					const converted = value.map((item) => this._asToolResultContent(item));
					if (converted.every((item) => item !== void 0)) return new ToolResultBlock({
						toolUseId,
						status: "success",
						content: converted
					});
				}
				return new ToolResultBlock({
					toolUseId,
					status: "success",
					content: [new JsonBlock({ json: { $value: deepCopy(value) } })]
				});
			}
			return new ToolResultBlock({
				toolUseId,
				status: "success",
				content: [new JsonBlock({ json: deepCopy(value) })]
			});
		} catch (error) {
			return createErrorResult(error, toolUseId);
		}
	}
	/**
	* Converts a value to a ToolResultContent instance if it matches a known content type.
	* Accepts both class instances and plain data objects.
	*
	* @param value - Value to check and convert
	* @returns ToolResultContent instance, or undefined if not a recognized content type
	*/
	_asToolResultContent(value) {
		if (typeof value !== "object") return void 0;
		if (value instanceof TextBlock || value instanceof JsonBlock || value instanceof ImageBlock || value instanceof VideoBlock || value instanceof DocumentBlock) return value;
		try {
			if (Object.keys(value).length !== 1) return void 0;
			return toolResultContentFromData(value);
		} catch {
			return;
		}
	}
};
//#endregion
//#region node_modules/@strands-agents/sdk/dist/src/tools/zod-utils.js
/**
* Converts a Zod schema to JSON Schema format.
* Strips the $schema property to reduce token usage.
*
* @param schema - The Zod schema to convert
* @returns JSON Schema representation
*/
function zodSchemaToJsonSchema(schema) {
	const { $schema: _$schema, ...jsonSchema } = toJSONSchema(schema);
	return jsonSchema;
}
//#endregion
//#region node_modules/@strands-agents/sdk/dist/src/tools/zod-tool.js
/**
* Zod-based tool implementation.
* Extends Tool abstract class and implements InvokableTool interface.
*/
var ZodTool = class extends Tool {
	/**
	* Internal FunctionTool for delegating stream operations.
	*/
	_functionTool;
	/**
	* Zod schema for input validation.
	* Note: undefined is normalized to z.void() in constructor, so this is always defined.
	*/
	_inputSchema;
	/**
	* User callback function.
	*/
	_callback;
	constructor(config) {
		super();
		const { name, description = "", inputSchema, callback } = config;
		this._inputSchema = inputSchema ?? _void();
		this._callback = callback;
		let generatedSchema;
		if (this._inputSchema instanceof ZodVoid) generatedSchema = {
			type: "object",
			properties: {},
			additionalProperties: false
		};
		else generatedSchema = zodSchemaToJsonSchema(this._inputSchema);
		this._functionTool = new FunctionTool({
			name,
			description,
			inputSchema: generatedSchema,
			callback: (input, toolContext) => {
				return callback(this._inputSchema instanceof ZodVoid ? input : this._inputSchema.parse(input), toolContext);
			}
		});
	}
	/**
	* The unique name of the tool.
	*/
	get name() {
		return this._functionTool.name;
	}
	/**
	* Human-readable description of what the tool does.
	*/
	get description() {
		return this._functionTool.description;
	}
	/**
	* OpenAPI JSON specification for the tool.
	*/
	get toolSpec() {
		return this._functionTool.toolSpec;
	}
	/**
	* Executes the tool with streaming support.
	* Delegates to internal FunctionTool implementation.
	*
	* @param toolContext - Context information including the tool use request and invocation state
	* @returns Async generator that yields ToolStreamEvents and returns a ToolResultBlock
	*/
	stream(toolContext) {
		return this._functionTool.stream(toolContext);
	}
	/**
	* Invokes the tool directly with type-safe input and returns the unwrapped result.
	*
	* Unlike stream(), this method:
	* - Returns the raw result (not wrapped in ToolResult)
	* - Consumes async generators and returns only the final value
	* - Lets errors throw naturally (not wrapped in error ToolResult)
	*
	* @param input - The input parameters for the tool
	* @param context - Optional tool execution context
	* @returns The unwrapped result
	*/
	async invoke(input, context) {
		const validatedInput = this._inputSchema instanceof ZodVoid ? input : this._inputSchema.parse(input);
		const result = this._callback(validatedInput, context);
		if (result && typeof result === "object" && Symbol.asyncIterator in result) {
			const generator = result;
			let iterResult = await generator.next();
			while (!iterResult.done) iterResult = await generator.next();
			return iterResult.value;
		} else return await result;
	}
};
//#endregion
//#region node_modules/@strands-agents/sdk/dist/src/tools/tool-factory.js
/**
* Checks whether a value is a Zod schema type.
*
* @param value - The value to check
* @returns True if the value is a Zod schema
*/
function isZodType(value) {
	return value instanceof ZodType;
}
/**
* Creates an InvokableTool from either a Zod schema or JSON schema configuration.
*
* When a Zod schema is provided as `inputSchema`, input is validated at runtime and
* the callback receives typed input. When a JSON schema (or no schema) is provided,
* the callback receives `unknown` input with no runtime validation.
*
* @example
* ```typescript
* import { tool } from '@strands-agents/sdk'
* import { z } from 'zod'
*
* // With Zod schema (typed + validated)
* const calculator = tool({
*   name: 'calculator',
*   description: 'Adds two numbers',
*   inputSchema: z.object({ a: z.number(), b: z.number() }),
*   callback: (input) => input.a + input.b,
* })
*
* // With JSON schema (untyped, no validation)
* const greeter = tool({
*   name: 'greeter',
*   description: 'Greets a person',
*   inputSchema: {
*     type: 'object',
*     properties: { name: { type: 'string' } },
*     required: ['name'],
*   },
*   callback: (input) => `Hello, ${(input as { name: string }).name}!`,
* })
* ```
*
* @param config - Tool configuration
* @returns An InvokableTool that implements the Tool interface with invoke() method
*/
function tool(config) {
	if (config.inputSchema && isZodType(config.inputSchema)) return new ZodTool(config);
	return new FunctionTool(config);
}
//#endregion
//#region src/lib/opera/agent-tools.ts
var OPERA_AGENT_SYSTEM_PROMPT = `NASA OPERA domain tools are available for searching and visualizing OPERA satellite products.

Use OPERA tools when the user asks for OPERA, DSWx, RTC-S1, CSLC-S1, DIST, surface water, SAR backscatter, or disturbance data.
- Prefer search_and_display_opera when the user asks to find/show/display OPERA data in one request.
- Use detect_opera_change_between_dates when the user asks to compare two dates, detect change, or create before/after OPERA layers.
- Use analyze_opera_time_series when the user asks for trends, time-series change, repeated observations, or change over time.
- Use export_opera_change_report after change detection when the user asks to export, save, summarize, or download the analysis.
- If the user gives a place but not a bbox, use the current map extent unless you first navigate the map to the place with MapLibre tools.
- For surface water requests, prefer product OPERA_L3_DSWX-HLS_V1 and band B01_WTR unless the user asks for Sentinel-1 DSWx.
- For SAR backscatter, prefer product OPERA_L2_RTC-S1_V1 and band VV unless the user asks for another polarization.
- Keep max_granules small, usually 1-3, unless the user asks for many scenes.
- After displaying OPERA data, summarize product, date range, band, displayed granule count, and any layer ids.

Advanced titiler-cmr tools are also available for backend-aware analysis beyond basic OPERA search/display.
- Use titiler_cmr_tilejson for arbitrary rasterio or xarray TileJSON generation and optional layer registration.
- Use titiler_cmr_point_query for backend-aware pixel/variable sampling.
- Use titiler_cmr_statistics for AOI statistics over bbox or GeoJSON.
- Use titiler_cmr_timeseries_tilejson for time-indexed TileJSON responses.`;
var bboxSchema = union([array(number()).length(4), string()]).optional().describe("Bounding box as [west,south,east,north] or 'west,south,east,north'. Omit to use current map extent.");
var searchSchema = object({
	product: string().optional().describe("OPERA product short_name or label, e.g. OPERA_L3_DSWX-HLS_V1, DSWX-HLS, RTC-S1."),
	bbox: bboxSchema,
	start: string().optional().describe("Inclusive start date, YYYY-MM-DD."),
	end: string().optional().describe("Inclusive end date, YYYY-MM-DD."),
	count: number().int().min(1).max(500).optional()
});
var displaySchema = object({
	granule_ids: array(string()).optional().describe("Granule ids from search_opera_granules. Omit to display the first result(s)."),
	max_granules: number().int().min(1).max(25).optional().describe("Max granules to display when granule_ids is omitted."),
	band: string().optional().describe("Band/layer token, e.g. B01_WTR, VV, VH, B10_DEM."),
	rescale: string().optional().describe("Optional render stretch such as '0,3000'."),
	colormap_name: string().optional().describe("Optional titiler named colormap, e.g. terrain, gray, blues."),
	expression: string().optional().describe("Optional rio-tiler expression; selected band is b1.")
});
var searchAndDisplaySchema = searchSchema.merge(displaySchema);
var changeDetectionSchema = object({
	product: string().optional().describe("OPERA product short_name or label, e.g. OPERA_L3_DSWX-HLS_V1, DSWX-HLS, RTC-S1."),
	bbox: bboxSchema,
	before_date: string().describe("Baseline date, YYYY-MM-DD."),
	after_date: string().describe("Comparison date, YYYY-MM-DD."),
	window_days: number().int().min(0).max(90).optional().describe("Days on each side of each date to search for the nearest granule. Defaults to 7."),
	band: string().optional().describe("Band/layer token, e.g. B01_WTR, VV, VH."),
	rescale: string().optional().describe("Optional render stretch such as '0,3000'."),
	colormap_name: string().optional().describe("Optional titiler named colormap, e.g. gray, blues."),
	expression: string().optional().describe("Optional rio-tiler expression; selected band is b1.")
});
var timeSeriesSchema = object({
	product: string().optional().describe("OPERA product short_name or label, e.g. OPERA_L3_DSWX-HLS_V1, DSWX-HLS, RTC-S1."),
	bbox: bboxSchema,
	start: string().describe("Inclusive start date, YYYY-MM-DD."),
	end: string().describe("Inclusive end date, YYYY-MM-DD."),
	count: number().int().min(1).max(100).optional().describe("Max observations to analyze. Defaults to 12."),
	interval_days: number().int().min(1).max(365).optional().describe("Optional sampling interval in days. The closest granule per interval is used."),
	band: string().optional().describe("Band/layer token, e.g. B01_WTR, VV, VH."),
	rescale: string().optional().describe("Optional render stretch such as '0,3000'."),
	colormap_name: string().optional().describe("Optional titiler named colormap, e.g. gray, blues."),
	expression: string().optional().describe("Optional rio-tiler expression; selected band is b1."),
	display_endpoints: boolean().optional().describe("Display the first and last observations as map layers.")
});
var changeReportSchema = object({ format: _enum(["markdown", "json"]).optional().describe("Report format. Defaults to markdown.") });
var backendSchema = _enum(["rasterio", "xarray"]);
var queryValueSchema = union([
	string(),
	number(),
	boolean(),
	array(union([
		string(),
		number(),
		boolean()
	]))
]);
var titilerCommonSchema = object({
	backend: backendSchema.describe("titiler-cmr backend: rasterio for COG/GeoTIFF, xarray for NetCDF/HDF5/Zarr."),
	collection_concept_id: string().describe("CMR collection concept id, e.g. C2021957657-LPCLOUD."),
	endpoint: string().optional().describe("titiler-cmr endpoint. Omit to use the OPERA panel endpoint."),
	granule_ur: string().optional().describe("Exact CMR GranuleUR to pin the request."),
	temporal: string().optional().describe("Temporal filter as RFC3339 instant/range, e.g. 2024-02-01T00:00:00Z/2024-03-01T00:00:00Z."),
	assets: array(string()).optional().describe("Rasterio asset names, repeated as assets=."),
	assets_regex: string().optional().describe("Rasterio asset regex."),
	variables: array(string()).optional().describe("Xarray variable names, repeated as variables=."),
	group: string().optional().describe("Xarray group path."),
	sel: union([string(), record(string(), unknown())]).optional().describe("Xarray dimension selector, object or JSON string."),
	rescale: union([string(), array(string())]).optional().describe("One or more rescale values, e.g. '0,1'."),
	colormap_name: string().optional(),
	colormap: string().optional().describe("Explicit titiler colormap JSON."),
	expression: string().optional().describe("Expression using b1, b2, ..."),
	minzoom: number().int().optional(),
	maxzoom: number().int().optional(),
	extra_params: record(string(), queryValueSchema).optional().describe("Extra titiler-cmr query parameters passed through as-is.")
});
var titilerTileJsonSchema = titilerCommonSchema.extend({
	name: string().optional().describe("Layer name when add_to_map is true."),
	add_to_map: boolean().optional().describe("Register the returned TileJSON as a map raster layer."),
	opacity: number().min(0).max(1).optional(),
	fit_bounds: boolean().optional()
});
var titilerPointSchema = titilerCommonSchema.extend({
	lon: number(),
	lat: number()
});
var titilerStatisticsSchema = titilerCommonSchema.extend({
	bbox: array(number()).length(4).optional().describe("AOI bbox [west,south,east,north]. Omit if geojson is provided."),
	geojson: unknown().optional().describe("AOI GeoJSON Feature or FeatureCollection."),
	categorical: boolean().optional(),
	histogram_bins: number().int().min(1).optional()
});
var titilerTimeseriesSchema = titilerTileJsonSchema.extend({
	step: string().optional().describe("ISO-8601 duration step, e.g. P1D, P1W, P1M."),
	temporal_mode: _enum(["point", "interval"]).optional(),
	add_first_to_map: boolean().optional().describe("Register the first returned timeseries TileJSON as a map layer.")
});
function createOperaAgentTools(getControl) {
	const controlOrThrow = () => {
		const control = getControl();
		if (!control) throw new Error("NASA OPERA control is not active.");
		return control;
	};
	return [
		tool({
			name: "get_opera_context",
			description: "Return supported OPERA products, current OPERA search settings, latest granule results, selected granules, and endpoint.",
			inputSchema: object({}),
			callback: () => toJsonValue(controlOrThrow().getAgentContext())
		}),
		tool({
			name: "search_opera_granules",
			description: "Search NASA CMR for OPERA granules. Results also populate the OPERA panel and add footprint layers to the map.",
			inputSchema: searchSchema,
			callback: async (input) => toJsonValue(await controlOrThrow().searchForAgent({
				product: input.product,
				bbox: input.bbox,
				start: input.start,
				end: input.end,
				count: input.count
			}))
		}),
		tool({
			name: "display_opera_granules",
			description: "Display selected OPERA granules from the latest search as titiler-cmr raster layers on the map.",
			inputSchema: displaySchema,
			callback: async (input) => toJsonValue(await controlOrThrow().displayForAgent({
				granuleIds: input.granule_ids,
				maxGranules: input.max_granules,
				band: input.band,
				rescale: input.rescale,
				colormapName: input.colormap_name,
				expression: input.expression
			}))
		}),
		tool({
			name: "search_and_display_opera",
			description: "Search NASA CMR for OPERA granules and immediately display the first matching granule(s) as titiler-cmr raster layers.",
			inputSchema: searchAndDisplaySchema,
			callback: async (input) => {
				const control = controlOrThrow();
				const search = await control.searchForAgent({
					product: input.product,
					bbox: input.bbox,
					start: input.start,
					end: input.end,
					count: input.count
				});
				if (!search.ok || search.granules.length === 0) return toJsonValue({
					search,
					display: null
				});
				return toJsonValue({
					search,
					display: await control.displayForAgent({
						granuleIds: input.granule_ids,
						maxGranules: input.max_granules,
						band: input.band,
						rescale: input.rescale,
						colormapName: input.colormap_name,
						expression: input.expression
					})
				});
			}
		}),
		tool({
			name: "detect_opera_change_between_dates",
			description: "Find the closest OPERA granules around two dates, display before/after layers, and compute AOI change statistics.",
			inputSchema: changeDetectionSchema,
			callback: async (input) => toJsonValue(await controlOrThrow().detectChangeForAgent({
				product: input.product,
				bbox: input.bbox,
				beforeDate: input.before_date,
				afterDate: input.after_date,
				windowDays: input.window_days,
				band: input.band,
				rescale: input.rescale,
				colormapName: input.colormap_name,
				expression: input.expression
			}))
		}),
		tool({
			name: "analyze_opera_time_series",
			description: "Analyze AOI statistics across OPERA granules over a date range and return first-to-last trend metrics. Can display first/last layers.",
			inputSchema: timeSeriesSchema,
			callback: async (input) => toJsonValue(await controlOrThrow().analyzeTimeSeriesForAgent({
				product: input.product,
				bbox: input.bbox,
				start: input.start,
				end: input.end,
				count: input.count,
				intervalDays: input.interval_days,
				band: input.band,
				rescale: input.rescale,
				colormapName: input.colormap_name,
				expression: input.expression,
				displayEndpoints: input.display_endpoints
			}))
		}),
		tool({
			name: "export_opera_change_report",
			description: "Return a Markdown or JSON report for the latest OPERA change detection result.",
			inputSchema: changeReportSchema,
			callback: (input) => toJsonValue(controlOrThrow().exportChangeReportForAgent({ format: input.format }))
		}),
		tool({
			name: "titiler_cmr_tilejson",
			description: "Generate a titiler-cmr TileJSON using either rasterio or xarray backend. Optionally registers it as a raster layer on the map.",
			inputSchema: titilerTileJsonSchema,
			callback: async (input) => {
				const control = controlOrThrow();
				const url = buildCmrTileJsonUrl(commonParams(control, input));
				const tilejson = await fetchTileJson(url);
				const layer = input.add_to_map || input.add_to_map === void 0 ? control.registerTileJsonForAgent({
					name: input.name ?? `titiler-cmr ${input.backend} ${input.collection_concept_id}`,
					tilejson,
					opacity: input.opacity,
					fitBounds: input.fit_bounds,
					metadata: {
						sourceKind: "titiler-cmr-advanced",
						backend: input.backend,
						collectionConceptId: input.collection_concept_id,
						url
					}
				}) : null;
				return toJsonValue({
					ok: true,
					url,
					backend: input.backend,
					tileCount: tilejson.tiles.length,
					bounds: tilejson.bounds,
					minzoom: tilejson.minzoom,
					maxzoom: tilejson.maxzoom,
					layer
				});
			}
		}),
		tool({
			name: "titiler_cmr_point_query",
			description: "Sample pixel values or xarray variables at a lon/lat point using titiler-cmr rasterio or xarray backend.",
			inputSchema: titilerPointSchema,
			callback: async (input) => {
				const url = buildCmrPointUrl({
					...commonParams(controlOrThrow(), input),
					lon: input.lon,
					lat: input.lat
				});
				return toJsonValue({
					ok: true,
					url,
					result: await fetchTitilerJson(url)
				});
			}
		}),
		tool({
			name: "titiler_cmr_statistics",
			description: "Compute titiler-cmr rasterio or xarray statistics over a bbox or supplied GeoJSON AOI.",
			inputSchema: titilerStatisticsSchema,
			callback: async (input) => {
				const control = controlOrThrow();
				const feature = input.geojson ?? (input.bbox ? bboxFeature(input.bbox) : null);
				if (!feature) throw new Error("Provide bbox or geojson for titiler_cmr_statistics.");
				const url = buildCmrStatisticsUrl({
					...commonParams(control, input),
					categorical: input.categorical,
					histogramBins: input.histogram_bins
				});
				return toJsonValue({
					ok: true,
					url,
					result: await fetchTitilerJson(url, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(feature)
					})
				});
			}
		}),
		tool({
			name: "titiler_cmr_timeseries_tilejson",
			description: "Request a titiler-cmr timeseries TileJSON using rasterio or xarray backend. Can register the first returned timestep as a map layer.",
			inputSchema: titilerTimeseriesSchema,
			callback: async (input) => {
				const control = controlOrThrow();
				const url = buildCmrTimeseriesTileJsonUrl({
					...commonParams(control, input),
					step: input.step,
					temporalMode: input.temporal_mode
				});
				const series = await fetchTimeSeriesTileJson(url);
				const entries = Object.entries(series);
				const first = entries[0];
				const layer = input.add_first_to_map && first ? control.registerTileJsonForAgent({
					name: input.name ?? `titiler-cmr ${input.backend} timeseries ${first[0]}`,
					tilejson: first[1],
					opacity: input.opacity,
					fitBounds: input.fit_bounds,
					metadata: {
						sourceKind: "titiler-cmr-timeseries",
						backend: input.backend,
						collectionConceptId: input.collection_concept_id,
						timestep: first[0],
						url
					}
				}) : null;
				return toJsonValue({
					ok: true,
					url,
					backend: input.backend,
					timesteps: entries.map(([key, tilejson]) => ({
						key,
						tileCount: tilejson.tiles?.length ?? 0,
						bounds: tilejson.bounds
					})),
					layer
				});
			}
		})
	];
}
function endpointFor(control, endpoint) {
	return endpoint?.trim() || control.getAgentContext().endpoint || DEFAULT_TITILER_CMR_ENDPOINT;
}
function commonParams(control, input) {
	return {
		endpoint: endpointFor(control, input.endpoint),
		backend: input.backend,
		conceptId: input.collection_concept_id,
		granuleUr: input.granule_ur,
		temporal: input.temporal,
		assets: input.assets,
		assetsRegex: input.assets_regex,
		variables: input.variables,
		group: input.group,
		sel: input.sel,
		rescale: input.rescale,
		colormapName: input.colormap_name,
		colormap: input.colormap,
		expression: input.expression,
		minzoom: input.minzoom,
		maxzoom: input.maxzoom,
		extraParams: input.extra_params
	};
}
function bboxFeature(bbox) {
	const [w, s, e, n] = bbox;
	return {
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
	};
}
function toJsonValue(value) {
	return JSON.parse(JSON.stringify(value));
}
//#endregion
//#region src/geolibre.ts
var operaControl = null;
var geoAgentControl = null;
var position = "top-left";
var pendingOperaState = null;
var pendingGeoAgentState = null;
function createControl(app) {
	const next = new OperaControl({
		collapsed: pendingOperaState?.collapsed ?? false,
		panelWidth: pendingOperaState?.panelWidth ?? 340,
		title: "NASA OPERA",
		addGeoJsonLayer: (name, data) => app.addGeoJsonLayer?.(name, data),
		registerLayer: (layer) => app.registerExternalNativeLayer?.(layer),
		unregisterLayer: (id) => app.unregisterExternalNativeLayer?.(id),
		fitBounds: (bounds) => app.fitBounds?.(bounds),
		getMapBounds: () => readMapBounds(app)
	});
	if (pendingOperaState) next.setState(pendingOperaState);
	return next;
}
function createGeoAgentControl() {
	const next = new GeoAgentControl({
		collapsed: pendingGeoAgentState?.collapsed ?? true,
		panelWidth: pendingGeoAgentState?.panelWidth ?? 410,
		panelHeight: pendingGeoAgentState?.panelHeight,
		title: "OPERA GeoAgent",
		storagePrefix: "geolibre.nasa-opera.geoagent",
		allowCodeExecutionDefault: pendingGeoAgentState?.allowCodeExecution ?? true,
		allowDestructiveToolsDefault: pendingGeoAgentState?.allowDestructiveTools ?? false,
		showPermissionToggles: true,
		customSystemPrompt: OPERA_AGENT_SYSTEM_PROMPT,
		customTools: () => createOperaAgentTools(() => operaControl)
	});
	if (pendingGeoAgentState) next.setState(pendingGeoAgentState);
	return next;
}
function companionPosition(primary) {
	switch (primary) {
		case "top-right": return "top-left";
		case "bottom-left": return "bottom-right";
		case "bottom-right": return "bottom-left";
		default: return "top-right";
	}
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
function isNasaOperaProjectState(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return false;
	return "opera" in value || "geoAgent" in value;
}
var plugin = {
	id: "geolibre-nasa-opera",
	name: "NASA OPERA",
	version: "0.2.2",
	activate(app) {
		operaControl = operaControl ?? createControl(app);
		if (!app.addMapControl(operaControl, position)) {
			operaControl = null;
			return false;
		}
		geoAgentControl = geoAgentControl ?? createGeoAgentControl();
		if (!app.addMapControl(geoAgentControl, companionPosition(position))) {
			app.removeMapControl(operaControl);
			operaControl = null;
			geoAgentControl = null;
			return false;
		}
	},
	deactivate(app) {
		if (geoAgentControl) {
			pendingGeoAgentState = geoAgentControl.getState();
			app.removeMapControl(geoAgentControl);
			geoAgentControl = null;
		}
		if (operaControl) {
			pendingOperaState = operaControl.getState();
			app.removeMapControl(operaControl);
			operaControl = null;
		}
	},
	getMapControlPosition() {
		return position;
	},
	setMapControlPosition(app, nextPosition) {
		position = nextPosition;
		if (!operaControl) return;
		if (geoAgentControl) app.removeMapControl(geoAgentControl);
		app.removeMapControl(operaControl);
		const added = app.addMapControl(operaControl, position);
		const agentAdded = !geoAgentControl || app.addMapControl(geoAgentControl, companionPosition(position));
		if (!added || !agentAdded) {
			pendingOperaState = operaControl.getState();
			pendingGeoAgentState = geoAgentControl?.getState() ?? null;
			if (added) app.removeMapControl(operaControl);
			if (agentAdded && geoAgentControl) app.removeMapControl(geoAgentControl);
			operaControl = null;
			geoAgentControl = null;
			return false;
		}
	},
	getProjectState() {
		return {
			opera: operaControl?.getState() ?? pendingOperaState ?? void 0,
			geoAgent: geoAgentControl?.getState() ?? pendingGeoAgentState ?? void 0
		};
	},
	applyProjectState(_app, state) {
		if (isNasaOperaProjectState(state)) {
			pendingOperaState = isOperaState(state.opera) ? state.opera : null;
			pendingGeoAgentState = state.geoAgent && typeof state.geoAgent === "object" ? state.geoAgent : null;
			if (pendingOperaState) operaControl?.setState(pendingOperaState);
			if (pendingGeoAgentState) geoAgentControl?.setState(pendingGeoAgentState);
			return;
		}
		if (!isOperaState(state)) return false;
		pendingOperaState = state;
		operaControl?.setState(state);
	}
};
//#endregion
export { plugin as default, plugin };
