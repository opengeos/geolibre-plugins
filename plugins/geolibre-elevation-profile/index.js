//#region src/lib/elevation/geometry.ts
/** Mean Earth radius in meters (IUGG), used for haversine distances. */
var EARTH_RADIUS_M = 6371008.8;
var toRadians = (degrees) => degrees * Math.PI / 180;
/**
* Great-circle distance between two coordinates using the haversine formula.
*
* @param a - Start coordinate as `[lng, lat]`
* @param b - End coordinate as `[lng, lat]`
* @returns The distance between the points in meters
*/
function haversineMeters(a, b) {
	const lat1 = toRadians(a[1]);
	const lat2 = toRadians(b[1]);
	const dLat = toRadians(b[1] - a[1]);
	const dLng = toRadians(b[0] - a[0]);
	const sinDLat = Math.sin(dLat / 2);
	const sinDLng = Math.sin(dLng / 2);
	const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
	return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}
/**
* Running distance from the first coordinate to each coordinate along the line.
*
* @param coords - Ordered polyline vertices as `[lng, lat]`
* @returns An array the same length as `coords` where entry `i` is the cumulative
*   distance in meters from `coords[0]` to `coords[i]` (entry `0` is always `0`)
*/
function cumulativeDistances(coords) {
	const distances = [];
	let total = 0;
	for (let i = 0; i < coords.length; i += 1) {
		if (i > 0) total += haversineMeters(coords[i - 1], coords[i]);
		distances.push(total);
	}
	return distances;
}
var lerp = (a, b, t) => a + (b - a) * t;
/**
* Resample a polyline into `maxPoints` points spaced evenly by distance.
*
* The first and last points always coincide with the original endpoints. This
* keeps the elevation request within a provider's per-call point limit while
* producing a smooth profile regardless of how many vertices the user drew.
*
* @param coords - Ordered polyline vertices as `[lng, lat]`
* @param maxPoints - Maximum number of samples to produce (coerced to at least 2)
* @returns The resampled coordinates and their cumulative distances
*/
function resampleLine(coords, maxPoints) {
	if (coords.length === 0) return {
		coords: [],
		distances: []
	};
	if (coords.length === 1) return {
		coords: [coords[0]],
		distances: [0]
	};
	const target = Math.max(2, Math.floor(maxPoints));
	const cumulative = cumulativeDistances(coords);
	const total = cumulative[cumulative.length - 1];
	if (total === 0) return {
		coords: [coords[0], coords[coords.length - 1]],
		distances: [0, 0]
	};
	const sampledCoords = [];
	const sampledDistances = [];
	let segment = 1;
	for (let i = 0; i < target; i += 1) {
		const distance = total * i / (target - 1);
		while (segment < coords.length - 1 && cumulative[segment] < distance) segment += 1;
		const segStart = cumulative[segment - 1];
		const segLength = cumulative[segment] - segStart;
		const t = segLength === 0 ? 0 : (distance - segStart) / segLength;
		const start = coords[segment - 1];
		const end = coords[segment];
		sampledCoords.push([lerp(start[0], end[0], t), lerp(start[1], end[1], t)]);
		sampledDistances.push(distance);
	}
	sampledCoords[0] = coords[0];
	sampledCoords[sampledCoords.length - 1] = coords[coords.length - 1];
	return {
		coords: sampledCoords,
		distances: sampledDistances
	};
}
/**
* Compute min/max elevation, cumulative ascent/descent, and total distance.
*
* @param elevations - Sampled elevations in meters, in along-line order
* @param distances - Cumulative distances in meters matching `elevations`
* @returns The aggregated {@link ProfileStats}
*/
function computeStats(elevations, distances) {
	const totalDistance = distances.length ? distances[distances.length - 1] : 0;
	if (elevations.length === 0) return {
		min: 0,
		max: 0,
		gain: 0,
		loss: 0,
		totalDistance
	};
	let min = elevations[0];
	let max = elevations[0];
	let gain = 0;
	let loss = 0;
	for (let i = 0; i < elevations.length; i += 1) {
		const elevation = elevations[i];
		if (elevation < min) min = elevation;
		if (elevation > max) max = elevation;
		if (i > 0) {
			const delta = elevation - elevations[i - 1];
			if (delta > 0) gain += delta;
			else loss += -delta;
		}
	}
	return {
		min,
		max,
		gain,
		loss,
		totalDistance
	};
}
var ENDPOINT = "https://api.open-meteo.com/v1/elevation";
/** Error thrown when an elevation request cannot be completed or parsed. */
var ElevationFetchError = class extends Error {
	constructor(message) {
		super(message);
		this.name = "ElevationFetchError";
	}
};
/**
* Fetch elevations (in meters) for an ordered list of coordinates.
*
* @param points - Coordinates as `[lng, lat]`, at most {@link MAX_POINTS_PER_REQUEST}
* @param fetchImpl - Optional `fetch` implementation; defaults to the global `fetch`
* @returns The elevation in meters for each input coordinate, in the same order
* @throws {ElevationFetchError} On too many points, a network error, a non-2xx
*   response, a malformed body, or a length mismatch
*/
async function fetchElevations(points, fetchImpl) {
	if (points.length === 0) return [];
	if (points.length > 100) throw new ElevationFetchError(`Too many points: ${points.length} (max 100).`);
	const doFetch = fetchImpl ?? ((url) => fetch(url));
	const url = `${ENDPOINT}?latitude=${points.map((p) => p[1].toFixed(6)).join(",")}&longitude=${points.map((p) => p[0].toFixed(6)).join(",")}`;
	let response;
	try {
		response = await doFetch(url);
	} catch (error) {
		throw new ElevationFetchError(`Could not reach the elevation service: ${error instanceof Error ? error.message : "unknown error"}`);
	}
	if (!response.ok) throw new ElevationFetchError(`Elevation request failed (HTTP ${response.status}).`);
	let data;
	try {
		data = await response.json();
	} catch {
		throw new ElevationFetchError("Could not parse the elevation response.");
	}
	if (!data || !Array.isArray(data.elevation)) throw new ElevationFetchError("Malformed elevation response.");
	if (data.elevation.length !== points.length) throw new ElevationFetchError(`Expected ${points.length} elevations but received ${data.elevation.length}.`);
	return data.elevation;
}
//#endregion
//#region src/lib/chart/profileChart.ts
var DEFAULT_PADDING = {
	top: 8,
	right: 8,
	bottom: 18,
	left: 36
};
/**
* Build the chart geometry for a set of profile points.
*
* @param points - Profile samples in along-line order (distance ascending)
* @param width - Chart width in pixels
* @param height - Chart height in pixels
* @param padding - Optional inner padding; sensible defaults are used otherwise
* @returns The {@link ChartGeometry} describing scales, paths, and hover lookup
*/
function buildChartGeometry(points, width, height, padding = DEFAULT_PADDING) {
	const plotWidth = Math.max(1, width - padding.left - padding.right);
	const plotHeight = Math.max(1, height - padding.top - padding.bottom);
	const bottomY = padding.top + plotHeight;
	const distances = points.map((p) => p.distance);
	const elevations = points.map((p) => p.elevation);
	const totalDistance = distances.length ? distances[distances.length - 1] : 0;
	const minElevation = elevations.length ? Math.min(...elevations) : 0;
	const maxElevation = elevations.length ? Math.max(...elevations) : 0;
	const elevationRange = maxElevation - minElevation;
	const xScale = (distance) => {
		if (totalDistance === 0) return padding.left;
		return padding.left + distance / totalDistance * plotWidth;
	};
	const yScale = (elevation) => {
		if (elevationRange === 0) return padding.top + plotHeight / 2;
		return padding.top + (1 - (elevation - minElevation) / elevationRange) * plotHeight;
	};
	const indexForX = (px) => {
		if (points.length === 0) return -1;
		if (points.length === 1) return 0;
		const clamped = Math.min(padding.left + plotWidth, Math.max(padding.left, px));
		const targetDistance = totalDistance === 0 ? 0 : (clamped - padding.left) / plotWidth * totalDistance;
		let nearest = 0;
		let nearestDelta = Infinity;
		for (let i = 0; i < distances.length; i += 1) {
			const delta = Math.abs(distances[i] - targetDistance);
			if (delta < nearestDelta) {
				nearestDelta = delta;
				nearest = i;
			}
		}
		return nearest;
	};
	let linePath = "";
	for (let i = 0; i < points.length; i += 1) {
		const x = xScale(points[i].distance);
		const y = yScale(points[i].elevation);
		linePath += `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
		if (i < points.length - 1) linePath += " ";
	}
	let areaPath = "";
	if (points.length > 0) {
		const firstX = xScale(points[0].distance);
		const lastX = xScale(points[points.length - 1].distance);
		areaPath = `${linePath} L${lastX.toFixed(2)} ${bottomY.toFixed(2)} L${firstX.toFixed(2)} ${bottomY.toFixed(2)} Z`;
	}
	return {
		width,
		height,
		padding,
		linePath,
		areaPath,
		xScale,
		yScale,
		indexForX,
		minElevation,
		maxElevation,
		totalDistance
	};
}
//#endregion
//#region src/lib/elevation/format.ts
var FEET_PER_METER = 3.28084;
var MILES_PER_METER = 621371e-9;
var KM_PER_METER = .001;
/** Ordered unit systems, for cycling a toggle button. */
var UNIT_SYSTEMS = ["metric", "imperial"];
/** Short label for a unit system's distance/elevation units. */
function unitSystemLabel(system) {
	return system === "imperial" ? "ft / mi" : "m / km";
}
/**
* Format an elevation value for display.
*
* @param meters - The elevation in meters
* @param system - The active unit system
* @returns A rounded elevation with its unit, e.g. `"742 m"` or `"2434 ft"`
*/
function formatElevation(meters, system) {
	if (system === "imperial") return `${Math.round(meters * FEET_PER_METER)} ft`;
	return `${Math.round(meters)} m`;
}
/**
* Format a distance value for display, switching to a larger unit when helpful.
*
* Metric distances under 1 km render in meters; imperial distances under about a
* tenth of a mile render in feet.
*
* @param meters - The distance in meters
* @param system - The active unit system
* @returns A formatted distance with its unit, e.g. `"850 m"`, `"1.50 km"`, or `"2.30 mi"`
*/
function formatDistance(meters, system) {
	if (system === "imperial") {
		const miles = meters * MILES_PER_METER;
		if (miles < .1) return `${Math.round(meters * FEET_PER_METER)} ft`;
		return `${miles.toFixed(2)} mi`;
	}
	if (meters < 1e3) return `${Math.round(meters)} m`;
	return `${(meters * KM_PER_METER).toFixed(2)} km`;
}
//#endregion
//#region src/lib/core/ElevationProfileControl.ts
var SVG_NS = "http://www.w3.org/2000/svg";
var SOURCE_LINE = "geolibre-elevation-profile-line";
var SOURCE_VERTICES = "geolibre-elevation-profile-vertices";
var SOURCE_HOVER = "geolibre-elevation-profile-hover";
var LAYER_LINE = "geolibre-elevation-profile-line-layer";
var LAYER_VERTICES = "geolibre-elevation-profile-vertices-layer";
var LAYER_HOVER = "geolibre-elevation-profile-hover-layer";
var LINE_COLOR = "#f97316";
var HOVER_COLOR = "#ef4444";
var CHART_HEIGHT = 132;
var DEFAULT_OPTIONS = {
	collapsed: true,
	title: "Elevation Profile",
	panelWidth: 320,
	unitSystem: "metric",
	className: "",
	maxSamples: 100
};
var emptyFeatureCollection = () => ({
	type: "FeatureCollection",
	features: []
});
var lineFeature = (coords) => ({
	type: "Feature",
	geometry: {
		type: "LineString",
		coordinates: coords
	},
	properties: {}
});
var pointFeature = (coord) => ({
	type: "Feature",
	geometry: {
		type: "Point",
		coordinates: coord
	},
	properties: {}
});
var pointCollection = (coords) => ({
	type: "FeatureCollection",
	features: coords.map(pointFeature)
});
/**
* A MapLibre control that draws a line on the map and charts the elevation
* profile along it, sampling elevations from the Open-Meteo API.
*
* Implements {@link DeepLinkConsumer} so GeoLibre can restore a shared line from
* a URL parameter, and exposes {@link getState}/{@link setState} for project
* persistence.
*/
var ElevationProfileControl = class {
	_options;
	_state;
	_map;
	_mapContainer;
	_container;
	_panel;
	_statusEl;
	_statsEl;
	_chartEl;
	_drawButton;
	_clearButton;
	_unitButton;
	_readoutEl;
	_drawing = false;
	_drawVertices = [];
	_profilePoints = [];
	_sampledCoords = [];
	_stats = null;
	_requestToken = 0;
	_onMapClick = (e) => this._handleMapClick(e);
	_onMapDblClick = (e) => this._handleMapDblClick(e);
	_onKeyDown = (e) => this._handleKeyDown(e);
	_resizeHandler = null;
	_mapResizeHandler = null;
	_clickOutsideHandler = null;
	/**
	* @param options - Optional configuration overrides
	*/
	constructor(options) {
		this._options = {
			...DEFAULT_OPTIONS,
			...options
		};
		this._options.maxSamples = Math.min(100, Math.max(2, Math.floor(this._options.maxSamples)));
		this._state = {
			collapsed: this._options.collapsed,
			unitSystem: this._options.unitSystem,
			line: null
		};
	}
	/** @inheritdoc */
	onAdd(map) {
		this._map = map;
		this._mapContainer = map.getContainer();
		this._container = this._createContainer();
		this._panel = this._createPanel();
		this._mapContainer.appendChild(this._panel);
		this._setupPanelListeners();
		if (!this._state.collapsed) {
			this._panel.classList.add("expanded");
			requestAnimationFrame(() => this._updatePanelPosition());
		}
		if (this._state.line && this._state.line.length >= 2) this._profileLine(this._state.line, { fit: false });
		return this._container;
	}
	/** @inheritdoc */
	onRemove() {
		this._exitDrawing();
		this._removeMapLayers();
		if (this._resizeHandler) {
			window.removeEventListener("resize", this._resizeHandler);
			this._resizeHandler = null;
		}
		if (this._mapResizeHandler && this._map) {
			this._map.off("resize", this._mapResizeHandler);
			this._mapResizeHandler = null;
		}
		if (this._clickOutsideHandler) {
			document.removeEventListener("click", this._clickOutsideHandler);
			this._clickOutsideHandler = null;
		}
		this._panel?.parentNode?.removeChild(this._panel);
		this._container?.parentNode?.removeChild(this._container);
		this._map = void 0;
		this._mapContainer = void 0;
		this._container = void 0;
		this._panel = void 0;
		this._statusEl = void 0;
		this._statsEl = void 0;
		this._chartEl = void 0;
	}
	/** Returns a copy of the serializable control state. */
	getState() {
		return {
			collapsed: this._state.collapsed,
			unitSystem: this._state.unitSystem,
			line: this._state.line ? this._state.line.map((c) => [...c]) : null
		};
	}
	/**
	* Merge new state and reflect it in the UI and map. Used by GeoLibre to
	* restore project state.
	*
	* @param newState - Partial state to apply
	*/
	setState(newState) {
		const lineChanged = "line" in newState && newState.line !== this._state.line;
		this._state = {
			...this._state,
			...newState
		};
		if (newState.unitSystem) this._syncUnitButton();
		if (this._panel) this._panel.classList.toggle("expanded", !this._state.collapsed);
		if (lineChanged && this._map) if (this._state.line && this._state.line.length >= 2) this._profileLine(this._state.line, { fit: false });
		else this._clearProfile();
		else if (newState.unitSystem) this._renderProfile();
	}
	/**
	* Load and profile a line provided via a deep link, fitting the map to it.
	*
	* @param coords - The line vertices as `[lng, lat]`
	*/
	async loadLine(coords) {
		if (coords.length < 2) return;
		this.expand();
		await this._profileLine(coords, { fit: true });
	}
	/** Toggle the panel open or closed. */
	toggle() {
		if (this._state.collapsed) this.expand();
		else this.collapse();
	}
	/** Open the panel. */
	expand() {
		this._state.collapsed = false;
		this._panel?.classList.add("expanded");
		this._updatePanelPosition();
	}
	/** Close the panel (drawing, if active, is cancelled). */
	collapse() {
		this._state.collapsed = true;
		this._panel?.classList.remove("expanded");
		if (this._drawing) this._exitDrawing();
	}
	_startDrawing() {
		if (!this._map) return;
		this._clearProfile();
		this._drawing = true;
		this._drawVertices = [];
		this._map.getCanvas().style.cursor = "crosshair";
		this._map.doubleClickZoom.disable();
		this._map.on("click", this._onMapClick);
		this._map.on("dblclick", this._onMapDblClick);
		document.addEventListener("keydown", this._onKeyDown);
		this._setStatus("Click on the map to add points. Double-click or press Enter to finish.");
		this._syncButtons();
	}
	_exitDrawing() {
		if (!this._map) {
			this._drawing = false;
			return;
		}
		this._drawing = false;
		this._map.getCanvas().style.cursor = "";
		this._map.doubleClickZoom.enable();
		this._map.off("click", this._onMapClick);
		this._map.off("dblclick", this._onMapDblClick);
		document.removeEventListener("keydown", this._onKeyDown);
		this._syncButtons();
	}
	_handleMapClick(e) {
		this._drawVertices.push([e.lngLat.lng, e.lngLat.lat]);
		this._renderDrawGeometry();
	}
	_handleMapDblClick(e) {
		e.preventDefault();
		this._dedupeTailVertex();
		this._finishDrawing();
	}
	_handleKeyDown(e) {
		if (!this._drawing) return;
		if (e.key === "Enter") {
			e.preventDefault();
			this._finishDrawing();
		} else if (e.key === "Escape") {
			e.preventDefault();
			this._cancelDrawing();
		}
	}
	_dedupeTailVertex() {
		const n = this._drawVertices.length;
		if (n < 2) return;
		const a = this._drawVertices[n - 1];
		const b = this._drawVertices[n - 2];
		if (Math.abs(a[0] - b[0]) < 1e-7 && Math.abs(a[1] - b[1]) < 1e-7) this._drawVertices.pop();
	}
	_cancelDrawing() {
		this._exitDrawing();
		this._clearProfile();
		this._setStatus("Drawing cancelled.");
	}
	_finishDrawing() {
		const vertices = this._drawVertices;
		this._exitDrawing();
		if (vertices.length < 2) {
			this._clearProfile();
			this._setStatus("Need at least two points to build a profile.");
			return;
		}
		this._profileLine(vertices, { fit: false });
	}
	async _profileLine(coords, opts) {
		if (!this._map) return;
		this._state.line = coords.map((c) => [...c]);
		this._renderLineGeometry(coords);
		if (opts.fit) this._fitToLine(coords);
		const token = ++this._requestToken;
		this._setStatus("Sampling elevation…");
		this._setBusy(true);
		const sampled = resampleLine(coords, this._options.maxSamples);
		try {
			const elevations = await fetchElevations(sampled.coords);
			if (token !== this._requestToken) return;
			this._sampledCoords = sampled.coords;
			this._profilePoints = sampled.distances.map((distance, i) => ({
				distance,
				elevation: elevations[i]
			}));
			this._stats = computeStats(elevations, sampled.distances);
			this._setStatus("");
			this._renderProfile();
		} catch (error) {
			if (token !== this._requestToken) return;
			const message = error instanceof ElevationFetchError ? error.message : "Could not load elevation data.";
			this._stats = null;
			this._profilePoints = [];
			this._setStatus(message);
			this._renderProfile();
		} finally {
			if (token === this._requestToken) this._setBusy(false);
		}
		this._syncButtons();
	}
	_clearProfile() {
		this._requestToken += 1;
		this._state.line = null;
		this._drawVertices = [];
		this._profilePoints = [];
		this._sampledCoords = [];
		this._stats = null;
		this._renderLineGeometry([]);
		this._clearHover();
		this._setStatus("");
		this._renderProfile();
		this._syncButtons();
	}
	_ensureMapLayers() {
		const map = this._map;
		if (!map || !map.isStyleLoaded()) return false;
		if (!map.getSource(SOURCE_LINE)) {
			map.addSource(SOURCE_LINE, {
				type: "geojson",
				data: emptyFeatureCollection()
			});
			map.addLayer({
				id: LAYER_LINE,
				type: "line",
				source: SOURCE_LINE,
				layout: {
					"line-cap": "round",
					"line-join": "round"
				},
				paint: {
					"line-color": LINE_COLOR,
					"line-width": 3
				}
			});
		}
		if (!map.getSource(SOURCE_VERTICES)) {
			map.addSource(SOURCE_VERTICES, {
				type: "geojson",
				data: emptyFeatureCollection()
			});
			map.addLayer({
				id: LAYER_VERTICES,
				type: "circle",
				source: SOURCE_VERTICES,
				paint: {
					"circle-radius": 4,
					"circle-color": "#ffffff",
					"circle-stroke-color": LINE_COLOR,
					"circle-stroke-width": 2
				}
			});
		}
		if (!map.getSource(SOURCE_HOVER)) {
			map.addSource(SOURCE_HOVER, {
				type: "geojson",
				data: emptyFeatureCollection()
			});
			map.addLayer({
				id: LAYER_HOVER,
				type: "circle",
				source: SOURCE_HOVER,
				paint: {
					"circle-radius": 6,
					"circle-color": HOVER_COLOR,
					"circle-stroke-color": "#ffffff",
					"circle-stroke-width": 2
				}
			});
		}
		return true;
	}
	_removeMapLayers() {
		const map = this._map;
		if (!map) return;
		for (const layer of [
			LAYER_HOVER,
			LAYER_VERTICES,
			LAYER_LINE
		]) if (map.getLayer(layer)) map.removeLayer(layer);
		for (const source of [
			SOURCE_HOVER,
			SOURCE_VERTICES,
			SOURCE_LINE
		]) if (map.getSource(source)) map.removeSource(source);
	}
	_setLineData(coords) {
		const map = this._map;
		if (!map) return;
		const lineSource = map.getSource(SOURCE_LINE);
		const vertexSource = map.getSource(SOURCE_VERTICES);
		if (lineSource) lineSource.setData(lineFeature(coords));
		if (vertexSource) vertexSource.setData(pointCollection(coords));
	}
	/** Render in-progress drawing vertices (line through the clicked points). */
	_renderDrawGeometry() {
		if (!this._ensureMapLayers()) return;
		this._setLineData(this._drawVertices);
	}
	/** Render a finished/restored line. */
	_renderLineGeometry(coords) {
		if (!this._ensureMapLayers()) return;
		this._setLineData(coords);
	}
	_setHoverPoint(coord) {
		const map = this._map;
		if (!map) return;
		const source = map.getSource(SOURCE_HOVER);
		if (!source) return;
		source.setData(coord ? pointFeature(coord) : emptyFeatureCollection());
	}
	_fitToLine(coords) {
		if (!this._map || coords.length === 0) return;
		let minLng = coords[0][0];
		let minLat = coords[0][1];
		let maxLng = coords[0][0];
		let maxLat = coords[0][1];
		for (const [lng, lat] of coords) {
			minLng = Math.min(minLng, lng);
			minLat = Math.min(minLat, lat);
			maxLng = Math.max(maxLng, lng);
			maxLat = Math.max(maxLat, lat);
		}
		this._map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
			padding: 60,
			duration: 600,
			maxZoom: 14
		});
	}
	_createContainer() {
		const container = document.createElement("div");
		container.className = `maplibregl-ctrl maplibregl-ctrl-group elevation-profile${this._options.className ? ` ${this._options.className}` : ""}`;
		const toggle = document.createElement("button");
		toggle.type = "button";
		toggle.className = "elevation-profile-toggle";
		toggle.setAttribute("aria-label", this._options.title);
		toggle.title = this._options.title;
		toggle.appendChild(this._createMountainIcon());
		toggle.addEventListener("click", () => this.toggle());
		container.appendChild(toggle);
		return container;
	}
	_createMountainIcon() {
		const svg = document.createElementNS(SVG_NS, "svg");
		svg.setAttribute("viewBox", "0 0 24 24");
		svg.setAttribute("width", "20");
		svg.setAttribute("height", "20");
		svg.setAttribute("fill", "none");
		svg.setAttribute("stroke", "currentColor");
		svg.setAttribute("stroke-width", "2");
		svg.setAttribute("stroke-linecap", "round");
		svg.setAttribute("stroke-linejoin", "round");
		svg.setAttribute("aria-hidden", "true");
		const path = document.createElementNS(SVG_NS, "path");
		path.setAttribute("d", "M3 20h18L14 7l-3.5 6L8 9l-5 11z");
		svg.appendChild(path);
		return svg;
	}
	_createPanel() {
		const panel = document.createElement("div");
		panel.className = "elevation-profile-panel";
		panel.style.width = `${this._options.panelWidth}px`;
		const header = document.createElement("div");
		header.className = "elevation-profile-header";
		const title = document.createElement("span");
		title.className = "elevation-profile-title";
		title.textContent = this._options.title;
		const close = document.createElement("button");
		close.type = "button";
		close.className = "elevation-profile-close";
		close.setAttribute("aria-label", "Close panel");
		close.innerHTML = "&times;";
		close.addEventListener("click", () => this.collapse());
		header.append(title, close);
		const actions = document.createElement("div");
		actions.className = "elevation-profile-actions";
		const draw = document.createElement("button");
		draw.type = "button";
		draw.className = "elevation-profile-button elevation-profile-primary";
		draw.textContent = "Draw line";
		draw.addEventListener("click", () => {
			if (this._drawing) this._finishDrawing();
			else this._startDrawing();
		});
		this._drawButton = draw;
		const clear = document.createElement("button");
		clear.type = "button";
		clear.className = "elevation-profile-button";
		clear.textContent = "Clear";
		clear.addEventListener("click", () => this._clearProfile());
		this._clearButton = clear;
		const unit = document.createElement("button");
		unit.type = "button";
		unit.className = "elevation-profile-button elevation-profile-unit";
		unit.addEventListener("click", () => this._cycleUnits());
		this._unitButton = unit;
		actions.append(draw, clear, unit);
		const status = document.createElement("div");
		status.className = "elevation-profile-status";
		this._statusEl = status;
		const stats = document.createElement("div");
		stats.className = "elevation-profile-stats";
		this._statsEl = stats;
		const chart = document.createElement("div");
		chart.className = "elevation-profile-chart";
		this._chartEl = chart;
		const readout = document.createElement("div");
		readout.className = "elevation-profile-readout";
		this._readoutEl = readout;
		panel.append(header, actions, status, stats, chart, readout);
		this._syncUnitButton();
		this._syncButtons();
		this._renderProfile();
		return panel;
	}
	_renderProfile() {
		this._renderStats();
		this._renderChart();
	}
	_renderStats() {
		if (!this._statsEl) return;
		this._statsEl.textContent = "";
		if (!this._stats) {
			this._statsEl.classList.remove("has-data");
			return;
		}
		this._statsEl.classList.add("has-data");
		const system = this._state.unitSystem;
		const items = [
			["Distance", formatDistance(this._stats.totalDistance, system)],
			["Min", formatElevation(this._stats.min, system)],
			["Max", formatElevation(this._stats.max, system)],
			["Ascent ↑", formatElevation(this._stats.gain, system)],
			["Descent ↓", formatElevation(this._stats.loss, system)]
		];
		for (const [label, value] of items) {
			const cell = document.createElement("div");
			cell.className = "elevation-profile-stat";
			const valueEl = document.createElement("span");
			valueEl.className = "elevation-profile-stat-value";
			valueEl.textContent = value;
			const labelEl = document.createElement("span");
			labelEl.className = "elevation-profile-stat-label";
			labelEl.textContent = label;
			cell.append(valueEl, labelEl);
			this._statsEl.appendChild(cell);
		}
	}
	_renderChart() {
		const host = this._chartEl;
		if (!host) return;
		host.textContent = "";
		if (this._readoutEl) this._readoutEl.textContent = "";
		if (this._profilePoints.length < 2) return;
		const width = Math.max(160, this._options.panelWidth - 24);
		const height = CHART_HEIGHT;
		const geometry = buildChartGeometry(this._profilePoints, width, height);
		const system = this._state.unitSystem;
		const svg = document.createElementNS(SVG_NS, "svg");
		svg.setAttribute("class", "elevation-profile-svg");
		svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
		svg.setAttribute("width", "100%");
		svg.setAttribute("height", `${height}`);
		svg.setAttribute("preserveAspectRatio", "none");
		const area = document.createElementNS(SVG_NS, "path");
		area.setAttribute("class", "elevation-profile-area");
		area.setAttribute("d", geometry.areaPath);
		const line = document.createElementNS(SVG_NS, "path");
		line.setAttribute("class", "elevation-profile-line");
		line.setAttribute("d", geometry.linePath);
		const maxLabel = this._axisLabel(formatElevation(geometry.maxElevation, system), geometry.padding.left - 4, geometry.yScale(geometry.maxElevation) + 3, "end");
		const minLabel = this._axisLabel(formatElevation(geometry.minElevation, system), geometry.padding.left - 4, geometry.yScale(geometry.minElevation), "end");
		const hoverGroup = document.createElementNS(SVG_NS, "g");
		hoverGroup.setAttribute("class", "elevation-profile-hover");
		hoverGroup.style.display = "none";
		const hoverLine = document.createElementNS(SVG_NS, "line");
		hoverLine.setAttribute("class", "elevation-profile-hover-line");
		hoverLine.setAttribute("y1", `${geometry.padding.top}`);
		hoverLine.setAttribute("y2", `${height - geometry.padding.bottom}`);
		const hoverDot = document.createElementNS(SVG_NS, "circle");
		hoverDot.setAttribute("class", "elevation-profile-hover-dot");
		hoverDot.setAttribute("r", "3.5");
		hoverGroup.append(hoverLine, hoverDot);
		svg.append(area, line, maxLabel, minLabel, hoverGroup);
		host.appendChild(svg);
		const onMove = (event) => {
			const rect = svg.getBoundingClientRect();
			const px = (event.clientX - rect.left) / rect.width * width;
			const index = geometry.indexForX(px);
			if (index < 0) return;
			const point = this._profilePoints[index];
			const x = geometry.xScale(point.distance);
			const y = geometry.yScale(point.elevation);
			hoverGroup.style.display = "";
			hoverLine.setAttribute("x1", `${x}`);
			hoverLine.setAttribute("x2", `${x}`);
			hoverDot.setAttribute("cx", `${x}`);
			hoverDot.setAttribute("cy", `${y}`);
			this._setHoverPoint(this._sampledCoords[index] ?? null);
			if (this._readoutEl) this._readoutEl.textContent = `${formatDistance(point.distance, system)} · ${formatElevation(point.elevation, system)}`;
		};
		const onLeave = () => {
			hoverGroup.style.display = "none";
			this._clearHover();
			if (this._readoutEl) this._readoutEl.textContent = "";
		};
		svg.addEventListener("mousemove", onMove);
		svg.addEventListener("mouseleave", onLeave);
	}
	_axisLabel(text, x, y, anchor) {
		const label = document.createElementNS(SVG_NS, "text");
		label.setAttribute("class", "elevation-profile-axis");
		label.setAttribute("x", `${x}`);
		label.setAttribute("y", `${y}`);
		label.setAttribute("text-anchor", anchor);
		label.textContent = text;
		return label;
	}
	_clearHover() {
		this._setHoverPoint(null);
	}
	_cycleUnits() {
		const next = UNIT_SYSTEMS[(UNIT_SYSTEMS.indexOf(this._state.unitSystem) + 1) % UNIT_SYSTEMS.length];
		this._state.unitSystem = next;
		this._syncUnitButton();
		this._renderProfile();
	}
	_syncUnitButton() {
		if (this._unitButton) {
			this._unitButton.textContent = unitSystemLabel(this._state.unitSystem);
			this._unitButton.title = `Units: ${unitSystemLabel(this._state.unitSystem)}`;
		}
	}
	_syncButtons() {
		if (this._drawButton) {
			this._drawButton.textContent = this._drawing ? "Finish" : "Draw line";
			this._drawButton.classList.toggle("is-active", this._drawing);
		}
		if (this._clearButton) this._clearButton.disabled = !this._state.line && !this._drawing;
	}
	_setBusy(busy) {
		if (this._drawButton) this._drawButton.disabled = busy;
	}
	_setStatus(message) {
		if (this._statusEl) this._statusEl.textContent = message;
	}
	_setupPanelListeners() {
		this._clickOutsideHandler = (e) => {
			if (this._state.collapsed || this._drawing) return;
			const target = e.target;
			if (this._container && this._panel && !this._container.contains(target) && !this._panel.contains(target)) this.collapse();
		};
		document.addEventListener("click", this._clickOutsideHandler);
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
		if (parent.classList.contains("maplibregl-ctrl-bottom-left")) return "bottom-left";
		if (parent.classList.contains("maplibregl-ctrl-bottom-right")) return "bottom-right";
		return "top-right";
	}
	_updatePanelPosition() {
		if (!this._container || !this._panel || !this._mapContainer) return;
		const button = this._container.querySelector(".elevation-profile-toggle");
		if (!button) return;
		const buttonRect = button.getBoundingClientRect();
		const mapRect = this._mapContainer.getBoundingClientRect();
		const position = this._getControlPosition();
		const gap = 5;
		const top = buttonRect.top - mapRect.top;
		const bottom = mapRect.bottom - buttonRect.bottom;
		const left = buttonRect.left - mapRect.left;
		const right = mapRect.right - buttonRect.right;
		this._panel.style.top = "";
		this._panel.style.bottom = "";
		this._panel.style.left = "";
		this._panel.style.right = "";
		switch (position) {
			case "top-left":
				this._panel.style.top = `${top + buttonRect.height + gap}px`;
				this._panel.style.left = `${left}px`;
				break;
			case "top-right":
				this._panel.style.top = `${top + buttonRect.height + gap}px`;
				this._panel.style.right = `${right}px`;
				break;
			case "bottom-left":
				this._panel.style.bottom = `${bottom + buttonRect.height + gap}px`;
				this._panel.style.left = `${left}px`;
				break;
			case "bottom-right":
				this._panel.style.bottom = `${bottom + buttonRect.height + gap}px`;
				this._panel.style.right = `${right}px`;
				break;
		}
	}
};
//#endregion
//#region src/lib/utils/deep-link.ts
/** Query-parameter name this plugin owns. */
var ELEVATION_LINE_PARAM = "elevation-line";
/**
* Extract the raw elevation-line value from parsed query parameters. Returns the
* trimmed value, or `null` when the parameter is absent or blank.
*/
function getElevationLineValue(params) {
	const trimmed = params.get(ELEVATION_LINE_PARAM)?.trim();
	return trimmed ? trimmed : null;
}
/**
* Parse a `lng,lat;lng,lat;...` string back into polyline vertices.
*
* Malformed or out-of-range pairs are skipped. Returns `null` when fewer than two
* valid vertices remain, since a profile needs at least a start and an end.
*
* @param value - The encoded line string
* @returns The parsed coordinates, or `null` when there is no usable line
*/
function parseLine(value) {
	const coords = [];
	for (const pair of value.split(";")) {
		const [lngText, latText] = pair.split(",");
		const lng = Number(lngText);
		const lat = Number(latText);
		if (Number.isFinite(lng) && Number.isFinite(lat) && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) coords.push([lng, lat]);
	}
	return coords.length >= 2 ? coords : null;
}
/**
* If the query parameters carry a valid {@link ELEVATION_LINE_PARAM}, parse it
* and forward the coordinates to the consumer. No-op when the parameter is
* absent, blank, or does not describe a usable line. Returns the consumer's
* promise (if any) so callers can await completion.
*/
async function maybeHandleDeepLink(consumer, params) {
	const value = getElevationLineValue(params);
	if (!value) return;
	const coords = parseLine(value);
	if (coords) await consumer.loadLine(coords);
}
//#endregion
//#region src/geolibre.ts
var control = null;
var position = "top-right";
var pendingState = null;
function createControl() {
	const next = new ElevationProfileControl({
		collapsed: pendingState?.collapsed ?? true,
		unitSystem: pendingState?.unitSystem ?? "metric"
	});
	if (pendingState) next.setState(pendingState);
	return next;
}
function isLngLatArray(value) {
	return Array.isArray(value) && value.every((pair) => Array.isArray(pair) && pair.length === 2 && typeof pair[0] === "number" && typeof pair[1] === "number");
}
function isPluginState(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return false;
	const candidate = value;
	if ("collapsed" in candidate && typeof candidate.collapsed !== "boolean") return false;
	if ("unitSystem" in candidate && candidate.unitSystem !== "metric" && candidate.unitSystem !== "imperial") return false;
	if ("line" in candidate && candidate.line !== null && !isLngLatArray(candidate.line)) return false;
	return true;
}
/**
* The GeoLibre plugin entry point. GeoLibre loads the built bundle and reads
* this exported object to drive the plugin lifecycle.
*/
var plugin = {
	id: "geolibre-elevation-profile",
	name: "Elevation Profile",
	version: "0.1.0",
	urlParameterNames: [ELEVATION_LINE_PARAM],
	activate(app) {
		control = control ?? createControl();
		if (!app.addMapControl(control, position)) {
			control = null;
			return false;
		}
	},
	handleUrlParameters(_app, params) {
		if (control) return maybeHandleDeepLink(control, params);
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
		if (!isPluginState(state)) return false;
		pendingState = state;
		control?.setState(pendingState);
	}
};
//#endregion
export { plugin as default, plugin };
