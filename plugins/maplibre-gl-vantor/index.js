globalThis.process=globalThis.process||{env:{NODE_ENV:"production"},argv:[],version:"",versions:{},browser:true,platform:"browser",hrtime:()=>[0,0],nextTick:(f)=>setTimeout(f,0)};
const INTERNAL_LAYER_METADATA = { "geolibre:internal": true };
function resolveHref(baseUrl, href) {
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return href;
  }
  return new URL(href, baseUrl).href;
}
function formatDate(isoString) {
  if (!isoString) return "";
  return isoString.slice(0, 10);
}
function itemsToFeatureCollection(items) {
  return {
    type: "FeatureCollection",
    features: items.filter((item) => item.geometry).map((item) => ({
      type: "Feature",
      id: item.id,
      geometry: item.geometry,
      properties: {
        id: item.id,
        phase: item.properties.phase || "",
        datetime: item.properties.datetime || "",
        vehicle_name: item.properties.vehicle_name || item.properties.constellation || "",
        cloud_cover: item.properties["eo:cloud_cover"] ?? ""
      }
    }))
  };
}

const DEFAULT_CATALOG_URL$1 = "https://vantor-opendata.s3.amazonaws.com/events/catalog.json";
class StacClient {
  constructor(catalogUrl) {
    this.catalogUrl = catalogUrl || DEFAULT_CATALOG_URL$1;
  }
  async fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }
  async fetchCatalog() {
    const catalog = await this.fetchJson(this.catalogUrl);
    const events = [];
    for (const link of catalog.links) {
      if (link.rel === "child") {
        const href = resolveHref(this.catalogUrl, link.href);
        const fallbackName = href.split("/").slice(-2, -1)[0] || href;
        const title = link.title || fallbackName;
        events.push({
          id: link.title || fallbackName,
          title,
          href
        });
      }
    }
    return events;
  }
  async fetchCollection(collectionUrl) {
    return this.fetchJson(collectionUrl);
  }
  async fetchItems(collectionUrl) {
    const collection = await this.fetchJson(collectionUrl);
    const itemLinks = collection.links.filter((l) => l.rel === "item");
    const items = [];
    const seenIds = /* @__PURE__ */ new Set();
    const results = await this.fetchWithConcurrency(
      itemLinks.map((l) => resolveHref(collectionUrl, l.href)),
      6
    );
    for (const item of results) {
      if (item && !seenIds.has(item.id)) {
        seenIds.add(item.id);
        items.push(item);
      }
    }
    return items;
  }
  async fetchWithConcurrency(urls, concurrency) {
    const results = [];
    const queue = [...urls];
    const worker = async () => {
      while (queue.length > 0) {
        const url = queue.shift();
        try {
          const data = await this.fetchJson(url);
          results.push(data);
        } catch {
        }
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(concurrency, urls.length) }, () => worker())
    );
    return results;
  }
  filterItemsByBBox(items, bbox) {
    return items.filter((item) => {
      const itemBbox = item.bbox;
      if (!itemBbox || itemBbox.length < 4) return true;
      const [iw, is, ie, iN] = itemBbox;
      return iw <= bbox.east && ie >= bbox.west && is <= bbox.north && iN >= bbox.south;
    });
  }
  filterItemsByPhase(items, phase) {
    if (phase === "all") return items;
    return items.filter((item) => {
      const itemPhase = (item.properties.phase || "").toLowerCase().replace("-event", "");
      return itemPhase === phase;
    });
  }
  getCogUrl(item) {
    const assets = item.assets || {};
    const visual = assets.visual;
    if (visual) return visual.href;
    for (const asset of Object.values(assets)) {
      const assetType = asset.type || "";
      if (assetType.includes("geotiff") || assetType.includes("tiff")) {
        return asset.href;
      }
    }
    return null;
  }
  getThumbnailUrl(item) {
    const thumbnail = item.assets?.thumbnail;
    return thumbnail ? thumbnail.href : null;
  }
  getItemProperties(item) {
    const props = item.properties || {};
    return {
      id: item.id || "Unknown",
      datetime: props.datetime || "",
      phase: props.phase || "",
      sensor: props.vehicle_name || props.constellation || "",
      cloud_cover: props["eo:cloud_cover"] ?? "",
      pan_gsd: props.pan_gsd ?? "",
      ms_gsd: props.multispectral_gsd ?? "",
      off_nadir: props["view:off_nadir"] ?? ""
    };
  }
}

const stacClient = new StacClient();
class PanelUI extends EventTarget {
  constructor(container, collapsed = false, panelWidth, maxHeight, theme = "auto") {
    super();
    this.items = [];
    this.sortState = null;
    this.root = container;
    this.collapsed = collapsed;
    this.panelWidth = panelWidth;
    this.maxHeight = maxHeight;
    this.theme = theme;
    this.buildUI();
  }
  buildUI() {
    this.panelDiv = this.el("div", "vantor-panel");
    this.panelDiv.classList.add(`vantor-panel--theme-${this.theme}`);
    if (this.collapsed) {
      this.panelDiv.classList.add("vantor-panel--collapsed");
    }
    if (this.panelWidth) {
      this.panelDiv.style.setProperty("--vantor-panel-width", `${this.panelWidth}px`);
    }
    if (this.maxHeight !== void 0) {
      const val = typeof this.maxHeight === "number" ? `${this.maxHeight}px` : this.maxHeight;
      this.panelDiv.style.setProperty("--vantor-panel-max-height", val);
    }
    this.toggleBtn = this.el("button", "vantor-panel__toggle");
    this.toggleBtn.type = "button";
    this.toggleBtn.innerHTML = "&#10005;";
    this.toggleBtn.title = "Collapse panel";
    this.toggleBtn.addEventListener("click", () => {
      this.collapsed = true;
      this.panelDiv.classList.add("vantor-panel--collapsed");
    });
    this.panelDiv.appendChild(this.toggleBtn);
    const openBtn = this.el("button", "vantor-panel__open-btn");
    openBtn.type = "button";
    openBtn.setAttribute("aria-label", "Open Vantor STAC Explorer");
    const openIcon = this.el("span", "maplibregl-ctrl-icon vantor-panel__open-icon");
    openIcon.setAttribute("aria-hidden", "true");
    openBtn.appendChild(openIcon);
    openBtn.title = "Open Vantor STAC Explorer";
    openBtn.addEventListener("click", () => {
      this.collapsed = false;
      this.panelDiv.classList.remove("vantor-panel--collapsed");
    });
    this.panelDiv.appendChild(openBtn);
    this.contentDiv = this.el("div", "vantor-panel__content");
    const header = this.el("div", "vantor-panel__header");
    const h3 = document.createElement("h3");
    h3.textContent = "Vantor STAC Explorer";
    header.appendChild(h3);
    this.contentDiv.appendChild(header);
    this.buildSearchSection();
    this.buildResultsSection();
    this.buildActionsSection();
    this.buildProgressSection();
    this.statusDiv = this.el("div", "vantor-panel__status");
    this.statusDiv.textContent = "Ready";
    this.contentDiv.appendChild(this.statusDiv);
    this.panelDiv.appendChild(this.contentDiv);
    this.buildResizeHandles();
    this.root.appendChild(this.panelDiv);
  }
  buildResizeHandles() {
    const left = this.el(
      "div",
      "vantor-panel__resize-handle vantor-panel__resize-handle--bl"
    );
    const right = this.el(
      "div",
      "vantor-panel__resize-handle vantor-panel__resize-handle--br"
    );
    left.setAttribute("aria-hidden", "true");
    right.setAttribute("aria-hidden", "true");
    this.attachResize(left, "left");
    this.attachResize(right, "right");
    this.panelDiv.appendChild(left);
    this.panelDiv.appendChild(right);
  }
  attachResize(handle, side) {
    const MIN_W = 280;
    const MIN_H = 220;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    handle.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const rect = this.panelDiv.getBoundingClientRect();
      const startW = rect.width;
      const startH = rect.height;
      handle.setPointerCapture(e.pointerId);
      this.panelDiv.classList.add("vantor-panel--resizing");
      const onMove = (ev) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        const dw = side === "right" ? dx : -dx;
        const maxW = Math.max(MIN_W, window.innerWidth - 20);
        const maxH = Math.max(MIN_H, window.innerHeight - 40);
        const newW = clamp(startW + dw, MIN_W, maxW);
        const newH = clamp(startH + dy, MIN_H, maxH);
        this.panelDiv.classList.add("vantor-panel--resized");
        this.panelDiv.style.setProperty("--vantor-panel-width", `${newW}px`);
        this.panelDiv.style.setProperty("--vantor-panel-height", `${newH}px`);
      };
      const onUp = (ev) => {
        handle.releasePointerCapture(ev.pointerId);
        handle.removeEventListener("pointermove", onMove);
        handle.removeEventListener("pointerup", onUp);
        this.panelDiv.classList.remove("vantor-panel--resizing");
      };
      handle.addEventListener("pointermove", onMove);
      handle.addEventListener("pointerup", onUp);
    });
  }
  buildSearchSection() {
    const section = this.el("div", "vantor-panel__search");
    const title = this.el("div", "vantor-panel__section-title");
    title.textContent = "Search";
    section.appendChild(title);
    const eventField = this.el("div", "vantor-panel__field");
    const eventLabel = document.createElement("label");
    eventLabel.textContent = "Event";
    eventField.appendChild(eventLabel);
    const eventRow = this.el("div", "vantor-panel__select-row");
    this.eventSelect = document.createElement("select");
    this.eventSelect.innerHTML = '<option value="">Loading events...</option>';
    eventRow.appendChild(this.eventSelect);
    const refreshBtn = this.el("button", "vantor-panel__btn vantor-panel__btn--refresh");
    refreshBtn.type = "button";
    refreshBtn.innerHTML = "&#8635;";
    refreshBtn.title = "Refresh catalog";
    refreshBtn.addEventListener("click", () => this.emit("refresh"));
    eventRow.appendChild(refreshBtn);
    eventField.appendChild(eventRow);
    section.appendChild(eventField);
    const phaseField = this.el("div", "vantor-panel__field");
    const phaseLabel = document.createElement("label");
    phaseLabel.textContent = "Phase";
    phaseField.appendChild(phaseLabel);
    this.phaseSelect = document.createElement("select");
    for (const [value, text] of [
      ["all", "All"],
      ["pre", "Pre-event"],
      ["post", "Post-event"]
    ]) {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = text;
      this.phaseSelect.appendChild(opt);
    }
    phaseField.appendChild(this.phaseSelect);
    section.appendChild(phaseField);
    const spatialField = this.el("div", "vantor-panel__field");
    this.useExtentCheckbox = document.createElement("input");
    this.useExtentCheckbox.type = "checkbox";
    const checkLabel = this.el("label", "vantor-panel__checkbox-label");
    checkLabel.appendChild(this.useExtentCheckbox);
    const checkSpan = document.createElement("span");
    checkSpan.textContent = "Use Map Extent";
    checkLabel.appendChild(checkSpan);
    spatialField.appendChild(checkLabel);
    section.appendChild(spatialField);
    const bboxControls = this.el("div", "vantor-panel__bbox-controls");
    this.drawBBoxBtn = this.el("button", "vantor-panel__btn vantor-panel__btn--small");
    this.drawBBoxBtn.type = "button";
    this.drawBBoxBtn.textContent = "Draw BBox";
    this.drawBBoxBtn.addEventListener("click", () => {
      this.drawBBoxBtn.classList.toggle("vantor-panel__btn--active");
      this.emit("draw-bbox");
    });
    bboxControls.appendChild(this.drawBBoxBtn);
    this.clearBBoxBtn = this.el("button", "vantor-panel__btn vantor-panel__btn--small");
    this.clearBBoxBtn.type = "button";
    this.clearBBoxBtn.textContent = "Clear";
    this.clearBBoxBtn.disabled = true;
    this.clearBBoxBtn.addEventListener("click", () => {
      this.emit("clear-bbox");
    });
    bboxControls.appendChild(this.clearBBoxBtn);
    section.appendChild(bboxControls);
    this.bboxInfo = this.el("span", "vantor-panel__bbox-info");
    section.appendChild(this.bboxInfo);
    this.searchBtn = this.el("button", "vantor-panel__btn vantor-panel__btn--primary");
    this.searchBtn.type = "button";
    this.searchBtn.textContent = "Search";
    this.searchBtn.addEventListener("click", () => this.emit("search"));
    section.appendChild(this.searchBtn);
    this.contentDiv.appendChild(section);
  }
  buildResultsSection() {
    const section = this.el("div", "vantor-panel__results");
    const title = this.el("div", "vantor-panel__section-title");
    title.textContent = "Results";
    section.appendChild(title);
    const headerRow = this.el("div", "vantor-panel__results-header");
    this.countLabel = document.createElement("span");
    this.countLabel.className = "vantor-panel__count";
    this.countLabel.textContent = "0 item(s) found";
    headerRow.appendChild(this.countLabel);
    const selectControls = this.el("div", "vantor-panel__select-controls");
    const selectAllBtn = this.el("button", "vantor-panel__btn vantor-panel__btn--small");
    selectAllBtn.type = "button";
    selectAllBtn.textContent = "Select All";
    selectAllBtn.addEventListener("click", () => {
      this.setAllChecked(true);
      this.emit("select-all");
    });
    selectControls.appendChild(selectAllBtn);
    const deselectAllBtn = this.el("button", "vantor-panel__btn vantor-panel__btn--small");
    deselectAllBtn.type = "button";
    deselectAllBtn.textContent = "Deselect All";
    deselectAllBtn.addEventListener("click", () => {
      this.setAllChecked(false);
      this.emit("deselect-all");
    });
    selectControls.appendChild(deselectAllBtn);
    headerRow.appendChild(selectControls);
    section.appendChild(headerRow);
    this.tableContainer = this.el("div", "vantor-panel__table-container");
    this.table = document.createElement("table");
    this.table.className = "vantor-panel__table";
    this.thead = document.createElement("thead");
    const headerTr = document.createElement("tr");
    const columns = ["", "ID", "Date", "Phase", "Sensor", "Cloud%", "GSD"];
    columns.forEach((col, idx) => {
      const th = document.createElement("th");
      th.textContent = col;
      if (idx > 0) {
        th.addEventListener("click", () => this.sortByColumn(idx));
      }
      headerTr.appendChild(th);
    });
    this.thead.appendChild(headerTr);
    this.table.appendChild(this.thead);
    this.tbody = document.createElement("tbody");
    this.table.appendChild(this.tbody);
    this.tableContainer.appendChild(this.table);
    section.appendChild(this.tableContainer);
    this.contentDiv.appendChild(section);
  }
  buildActionsSection() {
    const section = this.el("div", "vantor-panel__actions");
    this.visualizeBtn = this.el("button", "vantor-panel__btn vantor-panel__btn--success");
    this.visualizeBtn.type = "button";
    this.visualizeBtn.textContent = "Visualize";
    this.visualizeBtn.addEventListener("click", () => this.emit("visualize"));
    section.appendChild(this.visualizeBtn);
    this.downloadBtn = this.el("button", "vantor-panel__btn vantor-panel__btn--warning");
    this.downloadBtn.type = "button";
    this.downloadBtn.textContent = "Download";
    this.downloadBtn.addEventListener("click", () => this.emit("download"));
    section.appendChild(this.downloadBtn);
    this.contentDiv.appendChild(section);
  }
  buildProgressSection() {
    this.progressContainer = this.el("div", "vantor-panel__progress-container");
    const progressTrack = this.el("div", "vantor-panel__progress");
    this.progressBar = this.el("div", "vantor-panel__progress-bar");
    this.progressBar.style.width = "0%";
    progressTrack.appendChild(this.progressBar);
    this.progressContainer.appendChild(progressTrack);
    this.cancelBtn = this.el("button", "vantor-panel__btn vantor-panel__btn--small");
    this.cancelBtn.type = "button";
    this.cancelBtn.textContent = "Cancel";
    this.cancelBtn.addEventListener("click", () => this.emit("cancel-download"));
    this.progressContainer.appendChild(this.cancelBtn);
    this.contentDiv.appendChild(this.progressContainer);
  }
  // -- Public methods --
  setEvents(events) {
    this.eventSelect.innerHTML = "";
    if (events.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "No events found";
      this.eventSelect.appendChild(opt);
    } else {
      for (const event of events) {
        const opt = document.createElement("option");
        opt.value = event.href;
        opt.textContent = event.title;
        this.eventSelect.appendChild(opt);
      }
    }
  }
  setItems(items) {
    this.items = items;
    this.sortState = null;
    this.countLabel.textContent = `${items.length} item(s) found`;
    this.renderTable(items);
  }
  getSelectedEventUrl() {
    return this.eventSelect.value;
  }
  getPhase() {
    return this.phaseSelect.value;
  }
  isUseMapExtent() {
    return this.useExtentCheckbox.checked;
  }
  setBBoxInfo(text) {
    this.bboxInfo.textContent = text;
    this.clearBBoxBtn.disabled = !text;
  }
  setDrawBBoxActive(active) {
    this.drawBBoxBtn.classList.toggle("vantor-panel__btn--active", active);
  }
  getCheckedItems() {
    const checked = [];
    const checkboxes = this.tbody.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((cb) => {
      if (cb.checked) {
        const itemId = cb.dataset.itemId;
        const item = this.items.find((i) => i.id === itemId);
        if (item) checked.push(item);
      }
    });
    return checked;
  }
  highlightRow(itemId) {
    const prev = this.tbody.querySelector(".vantor-panel__table-row--highlighted");
    if (prev) prev.classList.remove("vantor-panel__table-row--highlighted");
    const rows = this.tbody.querySelectorAll("tr");
    for (const row of rows) {
      if (row.dataset.itemId === itemId) {
        row.classList.add("vantor-panel__table-row--highlighted");
        this.scrollRowIntoView(row);
        break;
      }
    }
  }
  /**
   * Scroll the results table container so `row` is visible, accounting for the
   * sticky table header. Scrolls only the table container (not the page), which
   * `Element.scrollIntoView({ block: 'nearest' })` does not do reliably here.
   */
  scrollRowIntoView(row) {
    const container = this.tableContainer;
    const cRect = container.getBoundingClientRect();
    const rRect = row.getBoundingClientRect();
    const headerH = this.thead.getBoundingClientRect().height;
    const viewTop = cRect.top + container.clientTop + headerH;
    const viewBottom = cRect.top + container.clientTop + container.clientHeight;
    const deltaTop = rRect.top - viewTop;
    const deltaBottom = rRect.bottom - viewBottom;
    if (deltaTop < 0) {
      container.scrollBy({ top: deltaTop, behavior: "smooth" });
    } else if (deltaBottom > 0) {
      container.scrollBy({ top: deltaBottom, behavior: "smooth" });
    }
  }
  /** Check or uncheck a result row's selection checkbox by item id. */
  setRowChecked(itemId, checked) {
    const checkbox = this.tbody.querySelector(
      `input[type="checkbox"][data-item-id="${CSS.escape(itemId)}"]`
    );
    if (checkbox) checkbox.checked = checked;
  }
  setLoading(loading) {
    this.searchBtn.disabled = loading;
    this.searchBtn.textContent = loading ? "Searching..." : "Search";
  }
  setStatus(message, type = "info") {
    this.statusDiv.textContent = message;
    this.statusDiv.className = `vantor-panel__status vantor-panel__status--${type}`;
  }
  setTheme(theme) {
    this.panelDiv.classList.remove(
      "vantor-panel--theme-auto",
      "vantor-panel--theme-light",
      "vantor-panel--theme-dark"
    );
    this.theme = theme;
    this.panelDiv.classList.add(`vantor-panel--theme-${theme}`);
  }
  setProgress(value) {
    if (value < 0) {
      this.progressContainer.classList.remove("vantor-panel__progress-container--visible");
    } else {
      this.progressContainer.classList.add("vantor-panel__progress-container--visible");
      this.progressBar.style.width = `${Math.min(100, Math.max(0, value))}%`;
    }
  }
  setDownloading(downloading) {
    this.downloadBtn.disabled = downloading;
    this.visualizeBtn.disabled = downloading;
    if (!downloading) {
      this.setProgress(-1);
    }
  }
  // -- Private methods --
  renderTable(items) {
    this.tbody.innerHTML = "";
    for (const item of items) {
      const props = stacClient.getItemProperties(item);
      const tr = document.createElement("tr");
      tr.dataset.itemId = item.id;
      tr.addEventListener("click", (e) => {
        if (e.target.tagName === "INPUT") return;
        this.emit("row-click", item.id);
      });
      const tdCheck = document.createElement("td");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.dataset.itemId = item.id;
      checkbox.addEventListener("click", (e) => e.stopPropagation());
      tdCheck.appendChild(checkbox);
      tr.appendChild(tdCheck);
      tr.appendChild(this.createTd(props.id));
      tr.appendChild(this.createTd(formatDate(props.datetime)));
      const phaseTd = this.createTd(props.phase);
      if (props.phase === "pre") phaseTd.classList.add("vantor-phase--pre");
      if (props.phase === "post") phaseTd.classList.add("vantor-phase--post");
      tr.appendChild(phaseTd);
      tr.appendChild(this.createTd(props.sensor));
      const cc = props.cloud_cover;
      tr.appendChild(this.createTd(typeof cc === "number" ? cc.toFixed(1) : String(cc)));
      const gsd = props.pan_gsd;
      tr.appendChild(
        this.createTd(typeof gsd === "number" ? gsd.toFixed(2) : String(gsd))
      );
      this.tbody.appendChild(tr);
    }
  }
  createTd(text) {
    const td = document.createElement("td");
    td.textContent = text;
    td.title = text;
    return td;
  }
  sortByColumn(colIdx) {
    if (this.items.length === 0) return;
    if (this.sortState?.column === colIdx) {
      this.sortState.direction = this.sortState.direction === "asc" ? "desc" : "asc";
    } else {
      this.sortState = { column: colIdx, direction: "asc" };
    }
    const ths = this.thead.querySelectorAll("th");
    ths.forEach((th) => {
      th.classList.remove("vantor-sort-asc", "vantor-sort-desc");
    });
    ths[colIdx].classList.add(
      this.sortState.direction === "asc" ? "vantor-sort-asc" : "vantor-sort-desc"
    );
    const propKeys = [
      "id",
      "id",
      "datetime",
      "phase",
      "sensor",
      "cloud_cover",
      "pan_gsd"
    ];
    const key = propKeys[colIdx];
    const dir = this.sortState.direction === "asc" ? 1 : -1;
    const sorted = [...this.items].sort((a, b) => {
      const propsA = stacClient.getItemProperties(a);
      const propsB = stacClient.getItemProperties(b);
      const va = propsA[key];
      const vb = propsB[key];
      if (typeof va === "number" && typeof vb === "number") {
        return (va - vb) * dir;
      }
      return String(va).localeCompare(String(vb)) * dir;
    });
    this.renderTable(sorted);
  }
  setAllChecked(checked) {
    const checkboxes = this.tbody.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((cb) => {
      cb.checked = checked;
    });
  }
  emit(type, itemId) {
    this.dispatchEvent(
      new CustomEvent("panel-action", {
        detail: {
          type,
          eventUrl: this.eventSelect.value,
          phase: this.phaseSelect.value,
          useMapExtent: this.useExtentCheckbox.checked,
          itemId
        }
      })
    );
  }
  el(tag, className) {
    const element = document.createElement(tag);
    element.className = className;
    return element;
  }
}

const SOURCE_ID$2 = "vantor-footprints-source";
const FILL_LAYER_ID$2 = "vantor-footprints-fill";
const PRE_LINE_LAYER_ID = "vantor-footprints-pre-line";
const POST_LINE_LAYER_ID = "vantor-footprints-post-line";
class FootprintLayer {
  constructor(map) {
    this.clickHandler = null;
    this.onClickCallback = null;
    this.map = map;
  }
  setItems(items) {
    const fc = itemsToFeatureCollection(items);
    if (this.map.getSource(SOURCE_ID$2)) {
      this.map.getSource(SOURCE_ID$2).setData(fc);
    } else {
      this.map.addSource(SOURCE_ID$2, {
        type: "geojson",
        data: fc,
        promoteId: "id"
      });
      this.map.addLayer({
        id: FILL_LAYER_ID$2,
        type: "fill",
        source: SOURCE_ID$2,
        metadata: INTERNAL_LAYER_METADATA,
        paint: {
          "fill-color": [
            "case",
            ["==", ["get", "phase"], "pre"],
            "#2196F3",
            ["==", ["get", "phase"], "post"],
            "#F44336",
            "#9E9E9E"
          ],
          "fill-opacity": 0.1
        }
      });
      this.map.addLayer({
        id: PRE_LINE_LAYER_ID,
        type: "line",
        source: SOURCE_ID$2,
        metadata: INTERNAL_LAYER_METADATA,
        filter: ["==", ["get", "phase"], "pre"],
        paint: {
          "line-color": "#2196F3",
          "line-width": 2,
          "line-opacity": 0.8
        }
      });
      this.map.addLayer({
        id: POST_LINE_LAYER_ID,
        type: "line",
        source: SOURCE_ID$2,
        metadata: INTERNAL_LAYER_METADATA,
        filter: ["==", ["get", "phase"], "post"],
        paint: {
          "line-color": "#F44336",
          "line-width": 2,
          "line-opacity": 0.8
        }
      });
      this.map.on("mouseenter", FILL_LAYER_ID$2, () => {
        this.map.getCanvas().style.cursor = "pointer";
      });
      this.map.on("mouseleave", FILL_LAYER_ID$2, () => {
        this.map.getCanvas().style.cursor = "";
      });
    }
  }
  onClick(callback) {
    this.onClickCallback = callback;
    if (this.clickHandler) {
      this.map.off("click", FILL_LAYER_ID$2, this.clickHandler);
    }
    this.clickHandler = (e) => {
      const features = this.map.queryRenderedFeatures(e.point, {
        layers: [FILL_LAYER_ID$2]
      });
      if (features && features.length > 0) {
        const itemId = features[0].properties?.id;
        if (itemId && this.onClickCallback) {
          this.onClickCallback(itemId);
        }
      }
    };
    this.map.on("click", FILL_LAYER_ID$2, this.clickHandler);
  }
  fitToBounds(items) {
    if (items.length === 0) return;
    let west = Infinity;
    let south = Infinity;
    let east = -Infinity;
    let north = -Infinity;
    for (const item of items) {
      if (item.bbox && item.bbox.length >= 4) {
        west = Math.min(west, item.bbox[0]);
        south = Math.min(south, item.bbox[1]);
        east = Math.max(east, item.bbox[2]);
        north = Math.max(north, item.bbox[3]);
      }
    }
    if (west <= east && south <= north) {
      this.map.fitBounds(
        [
          [west, south],
          [east, north]
        ],
        { padding: 50 }
      );
    }
  }
  remove() {
    if (this.clickHandler) {
      this.map.off("click", FILL_LAYER_ID$2, this.clickHandler);
      this.clickHandler = null;
    }
    for (const layerId of [POST_LINE_LAYER_ID, PRE_LINE_LAYER_ID, FILL_LAYER_ID$2]) {
      if (this.map.getLayer(layerId)) {
        this.map.removeLayer(layerId);
      }
    }
    if (this.map.getSource(SOURCE_ID$2)) {
      this.map.removeSource(SOURCE_ID$2);
    }
  }
}

const SOURCE_ID$1 = "vantor-highlight-source";
const FILL_LAYER_ID$1 = "vantor-highlight-fill";
const LINE_LAYER_ID$1 = "vantor-highlight-line";
const EMPTY_FC$1 = {
  type: "FeatureCollection",
  features: []
};
class HighlightLayer {
  constructor(map) {
    this.map = map;
    this.init();
  }
  init() {
    this.map.addSource(SOURCE_ID$1, {
      type: "geojson",
      data: EMPTY_FC$1
    });
    this.map.addLayer({
      id: FILL_LAYER_ID$1,
      type: "fill",
      source: SOURCE_ID$1,
      metadata: INTERNAL_LAYER_METADATA,
      paint: {
        "fill-color": "#FFEB3B",
        "fill-opacity": 0.3
      }
    });
    this.map.addLayer({
      id: LINE_LAYER_ID$1,
      type: "line",
      source: SOURCE_ID$1,
      metadata: INTERNAL_LAYER_METADATA,
      paint: {
        "line-color": "#FFC107",
        "line-width": 3
      }
    });
  }
  highlight(item) {
    const source = this.map.getSource(SOURCE_ID$1);
    if (!source || !item.geometry) return;
    source.setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: item.geometry,
          properties: { id: item.id }
        }
      ]
    });
    if (item.bbox) {
      this.map.fitBounds(
        [
          [item.bbox[0], item.bbox[1]],
          [item.bbox[2], item.bbox[3]]
        ],
        { padding: 50, maxZoom: 15, duration: 500 }
      );
    }
  }
  clear() {
    const source = this.map.getSource(SOURCE_ID$1);
    if (source) {
      source.setData(EMPTY_FC$1);
    }
  }
  remove() {
    if (this.map.getLayer(LINE_LAYER_ID$1)) {
      this.map.removeLayer(LINE_LAYER_ID$1);
    }
    if (this.map.getLayer(FILL_LAYER_ID$1)) {
      this.map.removeLayer(FILL_LAYER_ID$1);
    }
    if (this.map.getSource(SOURCE_ID$1)) {
      this.map.removeSource(SOURCE_ID$1);
    }
  }
}

const SOURCE_ID = "vantor-draw-bbox-source";
const FILL_LAYER_ID = "vantor-draw-bbox-fill";
const LINE_LAYER_ID = "vantor-draw-bbox-line";
const EMPTY_FC = {
  type: "FeatureCollection",
  features: []
};
class DrawBBox {
  constructor(map) {
    this.active = false;
    this.startPoint = null;
    this.resolvePromise = null;
    this.map = map;
    this.boundMouseDown = this.onMouseDown.bind(this);
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundMouseUp = this.onMouseUp.bind(this);
    this.initLayers();
  }
  initLayers() {
    if (this.map.getSource(SOURCE_ID)) return;
    this.map.addSource(SOURCE_ID, {
      type: "geojson",
      data: EMPTY_FC
    });
    this.map.addLayer({
      id: FILL_LAYER_ID,
      type: "fill",
      source: SOURCE_ID,
      metadata: INTERNAL_LAYER_METADATA,
      paint: {
        "fill-color": "#1976D2",
        "fill-opacity": 0.1
      }
    });
    this.map.addLayer({
      id: LINE_LAYER_ID,
      type: "line",
      source: SOURCE_ID,
      metadata: INTERNAL_LAYER_METADATA,
      paint: {
        "line-color": "#1976D2",
        "line-width": 2,
        "line-dasharray": [3, 3]
      }
    });
  }
  activate() {
    return new Promise((resolve) => {
      this.resolvePromise = resolve;
      this.active = true;
      this.startPoint = null;
      this.map.getCanvas().style.cursor = "crosshair";
      this.map.dragPan.disable();
      this.map.on("mousedown", this.boundMouseDown);
    });
  }
  deactivate() {
    this.active = false;
    this.startPoint = null;
    this.map.getCanvas().style.cursor = "";
    this.map.dragPan.enable();
    this.map.off("mousedown", this.boundMouseDown);
    this.map.off("mousemove", this.boundMouseMove);
    this.map.off("mouseup", this.boundMouseUp);
  }
  clear() {
    const source = this.map.getSource(SOURCE_ID);
    if (source) {
      source.setData(EMPTY_FC);
    }
  }
  setBBox(bbox) {
    this.initLayers();
    const source = this.map.getSource(SOURCE_ID);
    if (source) {
      source.setData({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [bbox.west, bbox.south],
                  [bbox.east, bbox.south],
                  [bbox.east, bbox.north],
                  [bbox.west, bbox.north],
                  [bbox.west, bbox.south]
                ]
              ]
            },
            properties: {}
          }
        ]
      });
    }
  }
  onMouseDown(e) {
    if (!this.active) return;
    e.preventDefault();
    this.startPoint = [e.lngLat.lng, e.lngLat.lat];
    this.map.on("mousemove", this.boundMouseMove);
    this.map.on("mouseup", this.boundMouseUp);
  }
  onMouseMove(e) {
    if (!this.active || !this.startPoint) return;
    const currentPoint = [e.lngLat.lng, e.lngLat.lat];
    this.updateRectangle(this.startPoint, currentPoint);
  }
  onMouseUp(e) {
    if (!this.active || !this.startPoint) return;
    const endPoint = [e.lngLat.lng, e.lngLat.lat];
    const bbox = {
      west: Math.min(this.startPoint[0], endPoint[0]),
      south: Math.min(this.startPoint[1], endPoint[1]),
      east: Math.max(this.startPoint[0], endPoint[0]),
      north: Math.max(this.startPoint[1], endPoint[1])
    };
    this.updateRectangle(this.startPoint, endPoint);
    this.deactivate();
    if (this.resolvePromise) {
      this.resolvePromise(bbox);
      this.resolvePromise = null;
    }
  }
  updateRectangle(start, end) {
    const source = this.map.getSource(SOURCE_ID);
    if (!source) return;
    const west = Math.min(start[0], end[0]);
    const south = Math.min(start[1], end[1]);
    const east = Math.max(start[0], end[0]);
    const north = Math.max(start[1], end[1]);
    source.setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [west, south],
                [east, south],
                [east, north],
                [west, north],
                [west, south]
              ]
            ]
          },
          properties: {}
        }
      ]
    });
  }
  removeLayers() {
    if (this.active) {
      this.deactivate();
    }
    if (this.map.getLayer(LINE_LAYER_ID)) {
      this.map.removeLayer(LINE_LAYER_ID);
    }
    if (this.map.getLayer(FILL_LAYER_ID)) {
      this.map.removeLayer(FILL_LAYER_ID);
    }
    if (this.map.getSource(SOURCE_ID)) {
      this.map.removeSource(SOURCE_ID);
    }
  }
}

function ensureMercatorProjection(map) {
  const m = map;
  const setMercator = () => {
    try {
      if (m.getProjection?.()?.type === "mercator") return;
      m.setProjection?.({ type: "mercator" });
    } catch {
    }
  };
  setMercator();
  m.once?.("idle", setMercator);
}
class CogLayer {
  constructor(map, rasterLoader, cogAdder) {
    this.manager = null;
    this.managerPromise = null;
    this.activeLayers = [];
    this.eventHandlers = /* @__PURE__ */ new Map();
    this.map = map;
    this.rasterLoader = rasterLoader ?? (() => Promise.resolve().then(() => maplibreGlRaster));
    this.cogAdder = cogAdder;
  }
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, /* @__PURE__ */ new Set());
    }
    this.eventHandlers.get(event).add(handler);
  }
  off(event, handler) {
    this.eventHandlers.get(event)?.delete(handler);
  }
  emit(event, detail) {
    this.eventHandlers.get(event)?.forEach((handler) => handler(detail));
  }
  ensureManager() {
    if (!this.managerPromise) {
      this.managerPromise = (async () => {
        try {
          const { LayerManager } = await this.rasterLoader();
          const manager = new LayerManager(this.map, {
            interleaved: true
          });
          this.manager = manager;
          return manager;
        } catch (e) {
          this.managerPromise = null;
          throw new Error(
            "Failed to initialize COG renderer. Ensure maplibre-gl-raster (and its @deck.gl/* and @luma.gl/* peers) are installed. " + String(e)
          );
        }
      })();
    }
    return this.managerPromise;
  }
  async addCogLayer(item) {
    const cogUrl = this.findCogUrl(item);
    if (!cogUrl) {
      throw new Error(`No COG URL found for item ${item.id}`);
    }
    if (this.activeLayers.some((l) => l.itemId === item.id)) return;
    const name = item.id;
    if (this.cogAdder) {
      await this.cogAdder(name, cogUrl, { nodata: 0 });
      this.activeLayers.push({ itemId: item.id, cogUrl, name, visible: true, opacity: 1 });
      this.emit("layeradd", { layerId: item.id, url: cogUrl, name });
      return;
    }
    const manager = await this.ensureManager();
    await manager.addRaster(cogUrl, {
      id: item.id,
      name,
      zoomTo: false,
      state: { nodata: 0 }
    });
    this.activeLayers.push({ itemId: item.id, cogUrl, name, visible: true, opacity: 1 });
    ensureMercatorProjection(this.map);
    this.emit("layeradd", { layerId: item.id, url: cogUrl, name });
  }
  async removeCogLayer(itemId) {
    const existed = this.activeLayers.some((l) => l.itemId === itemId);
    this.activeLayers = this.activeLayers.filter((l) => l.itemId !== itemId);
    this.manager?.removeRaster(itemId);
    if (existed) {
      this.emit("layerremove", { layerId: itemId });
    }
  }
  async removeAll() {
    const ids = this.activeLayers.map((l) => l.itemId);
    this.activeLayers = [];
    for (const id of ids) {
      this.manager?.removeRaster(id);
    }
    for (const id of ids) {
      this.emit("layerremove", { layerId: id });
    }
  }
  setLayerVisibility(layerId, visible) {
    const entry = this.activeLayers.find((l) => l.itemId === layerId);
    if (!entry) return;
    entry.visible = visible;
    this.manager?.setVisible(layerId, visible);
  }
  setLayerOpacity(layerId, opacity) {
    const entry = this.activeLayers.find((l) => l.itemId === layerId);
    if (!entry) return;
    entry.opacity = Math.max(0, Math.min(1, opacity));
    this.manager?.setState(layerId, { opacity: entry.opacity });
  }
  getLayerEntry(layerId) {
    const entry = this.activeLayers.find((l) => l.itemId === layerId);
    if (!entry) return null;
    return { name: entry.name, visible: entry.visible, opacity: entry.opacity };
  }
  findCogUrl(item) {
    const assets = item.assets || {};
    if (assets.visual) return assets.visual.href;
    for (const asset of Object.values(assets)) {
      const t = (asset.type || "").toLowerCase();
      if (t.includes("geotiff") || t.includes("tiff")) return asset.href;
    }
    return null;
  }
  getActiveLayerIds() {
    return this.activeLayers.map((l) => l.itemId);
  }
  remove() {
    const ids = this.activeLayers.map((l) => l.itemId);
    this.manager?.destroy();
    this.manager = null;
    this.managerPromise = null;
    this.activeLayers = [];
    for (const id of ids) {
      this.emit("layerremove", { layerId: id });
    }
  }
}

class Downloader {
  constructor() {
    this.cancelled = false;
  }
  async downloadItems(items, getCogUrl, onProgress) {
    this.cancelled = false;
    const total = items.length;
    let completed = 0;
    let failed = 0;
    for (let i = 0; i < items.length; i++) {
      if (this.cancelled) {
        onProgress?.(i, total, `Download cancelled. ${completed} file(s) completed.`);
        break;
      }
      const item = items[i];
      const cogUrl = getCogUrl(item);
      if (!cogUrl) {
        failed++;
        continue;
      }
      const filename = `${item.id}.tif`;
      try {
        onProgress?.(i, total, `Downloading ${filename}...`);
        const a = document.createElement("a");
        a.href = cogUrl;
        a.download = filename;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        completed++;
        onProgress?.(i + 1, total, `Started ${filename} (${completed}/${total})`);
        if (i < items.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (e) {
        failed++;
        onProgress?.(
          i + 1,
          total,
          `Failed to download ${filename}: ${e.message}`
        );
      }
    }
    return { completed, failed };
  }
  cancel() {
    this.cancelled = true;
  }
}

const DEFAULT_CATALOG_URL = "https://vantor-opendata.s3.amazonaws.com/events/catalog.json";
class VantorControl {
  constructor(options = {}) {
    this.map = null;
    this.container = null;
    this.panel = null;
    this.footprintLayer = null;
    this.highlightLayer = null;
    this.drawBBox = null;
    this.cogLayer = null;
    this.items = [];
    this.drawnBBox = null;
    this.selectionLock = false;
    this.isDrawing = false;
    this.options = options;
    this.stacClient = new StacClient(options.catalogUrl || DEFAULT_CATALOG_URL);
    this.downloader = new Downloader();
  }
  onAdd(map) {
    this.map = map;
    this.container = document.createElement("div");
    this.container.className = "maplibregl-ctrl maplibregl-ctrl-vantor";
    this.panel = new PanelUI(
      this.container,
      this.options.collapsed,
      this.options.panelWidth,
      this.options.maxHeight,
      this.options.theme
    );
    this.bindEvents();
    this.loadCatalog();
    this.cogLayer = new CogLayer(
      map,
      this.options.rasterLoader,
      this.options.cogAdder
    );
    const initLayers = () => {
      this.footprintLayer = new FootprintLayer(map);
      this.highlightLayer = new HighlightLayer(map);
      this.drawBBox = new DrawBBox(map);
      this.footprintLayer.onClick((itemId) => {
        this.handleFootprintClick(itemId);
      });
    };
    if (map.isStyleLoaded()) {
      initLayers();
    } else {
      map.once("load", initLayers);
    }
    return this.container;
  }
  onRemove() {
    this.footprintLayer?.remove();
    this.highlightLayer?.remove();
    this.drawBBox?.removeLayers();
    this.cogLayer?.remove();
    this.container?.remove();
    this.map = null;
    this.container = null;
    this.panel = null;
    this.footprintLayer = null;
    this.highlightLayer = null;
    this.drawBBox = null;
    this.cogLayer = null;
  }
  getDefaultPosition() {
    return this.options.position || "top-right";
  }
  getCogLayer() {
    return this.cogLayer;
  }
  /**
   * Switch the panel color theme at runtime. Useful for syncing with a host
   * application that has its own dark-mode toggle.
   */
  setTheme(theme) {
    this.options.theme = theme;
    this.panel?.setTheme(theme);
  }
  bindEvents() {
    if (!this.panel) return;
    this.panel.addEventListener("panel-action", ((e) => {
      const detail = e.detail;
      switch (detail.type) {
        case "search":
          this.handleSearch();
          break;
        case "refresh":
          this.loadCatalog();
          break;
        case "draw-bbox":
          this.handleDrawBBox();
          break;
        case "clear-bbox":
          this.handleClearBBox();
          break;
        case "row-click":
          if (detail.itemId) this.handleTableRowClick(detail.itemId);
          break;
        case "visualize":
          this.handleVisualize();
          break;
        case "download":
          this.handleDownload();
          break;
        case "cancel-download":
          this.downloader.cancel();
          break;
        case "select-all":
        case "deselect-all":
          this.options.onSelectionChange?.(this.panel.getCheckedItems());
          break;
      }
    }));
  }
  async loadCatalog() {
    if (!this.panel) return;
    this.panel.setStatus("Fetching catalog...", "info");
    this.panel.setLoading(true);
    try {
      const events = await this.stacClient.fetchCatalog();
      this.panel.setEvents(events);
      this.panel.setStatus(
        `Found ${events.length} event(s). Select an event and click Search.`,
        "success"
      );
    } catch (err) {
      this.panel.setStatus(
        `Failed to fetch catalog: ${err.message}`,
        "error"
      );
    } finally {
      this.panel.setLoading(false);
    }
  }
  async handleSearch() {
    if (!this.panel || !this.map) return;
    const eventUrl = this.panel.getSelectedEventUrl();
    if (!eventUrl) {
      this.panel.setStatus("Please select an event first.", "warning");
      return;
    }
    this.panel.setLoading(true);
    this.panel.setStatus("Fetching items...", "info");
    try {
      let items = await this.stacClient.fetchItems(eventUrl);
      const bbox = this.getSearchBBox();
      if (bbox) {
        items = this.stacClient.filterItemsByBBox(items, bbox);
      }
      const phase = this.panel.getPhase();
      if (phase !== "all") {
        items = this.stacClient.filterItemsByPhase(
          items,
          phase
        );
      }
      this.items = items;
      this.panel.setItems(items);
      this.footprintLayer?.setItems(items);
      this.footprintLayer?.fitToBounds(items);
      this.highlightLayer?.clear();
      this.panel.setStatus(
        `Found ${items.length} item(s). Check items to visualize or download.`,
        "success"
      );
      this.options.onItemsLoaded?.(items);
    } catch (err) {
      this.panel.setStatus(
        `Failed to fetch items: ${err.message}`,
        "error"
      );
    } finally {
      this.panel.setLoading(false);
    }
  }
  getSearchBBox() {
    if (this.drawnBBox) return this.drawnBBox;
    if (this.panel?.isUseMapExtent() && this.map) {
      const bounds = this.map.getBounds();
      return {
        west: bounds.getWest(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        north: bounds.getNorth()
      };
    }
    return null;
  }
  async handleDrawBBox() {
    if (!this.drawBBox || !this.panel) return;
    if (this.isDrawing) {
      this.drawBBox.deactivate();
      this.isDrawing = false;
      this.panel.setDrawBBoxActive(false);
      this.panel.setStatus("BBox drawing cancelled.", "info");
      return;
    }
    this.isDrawing = true;
    this.panel.setDrawBBoxActive(true);
    this.panel.setStatus("Draw a rectangle on the map...", "info");
    try {
      const bbox = await this.drawBBox.activate();
      this.drawnBBox = bbox;
      this.panel.setBBoxInfo(
        `${bbox.west.toFixed(4)}, ${bbox.south.toFixed(4)}, ${bbox.east.toFixed(4)}, ${bbox.north.toFixed(4)}`
      );
      this.panel.setStatus("Bounding box set. Click Search to filter.", "success");
    } catch {
      this.panel.setStatus("BBox drawing failed.", "error");
    } finally {
      this.isDrawing = false;
      this.panel.setDrawBBoxActive(false);
    }
  }
  handleClearBBox() {
    this.drawnBBox = null;
    this.drawBBox?.clear();
    this.panel?.setBBoxInfo("");
    this.panel?.setStatus("Bounding box cleared.", "info");
  }
  handleTableRowClick(itemId) {
    if (this.selectionLock) return;
    this.selectionLock = true;
    try {
      const item = this.items.find((i) => i.id === itemId);
      if (!item) return;
      this.highlightLayer?.highlight(item);
      this.panel?.highlightRow(itemId);
    } finally {
      setTimeout(() => {
        this.selectionLock = false;
      }, 100);
    }
  }
  handleFootprintClick(itemId) {
    if (this.selectionLock) return;
    this.selectionLock = true;
    try {
      const item = this.items.find((i) => i.id === itemId);
      if (!item) return;
      this.highlightLayer?.highlight(item);
      this.panel?.highlightRow(itemId);
      this.panel?.setRowChecked(itemId, true);
    } finally {
      setTimeout(() => {
        this.selectionLock = false;
      }, 100);
    }
  }
  async handleVisualize() {
    if (!this.panel || !this.cogLayer) return;
    const checked = this.panel.getCheckedItems();
    if (checked.length === 0) {
      this.panel.setStatus("No items selected. Check items first.", "warning");
      return;
    }
    this.panel.setStatus(`Adding ${checked.length} COG layer(s)...`, "info");
    let added = 0;
    for (const item of checked) {
      try {
        await this.cogLayer.addCogLayer(item);
        added++;
      } catch (err) {
        this.panel.setStatus(
          `Failed to add ${item.id}: ${err.message}`,
          "error"
        );
      }
    }
    if (added > 0) {
      this.panel.setStatus(`Added ${added} COG layer(s).`, "success");
    }
  }
  async handleDownload() {
    if (!this.panel) return;
    const checked = this.panel.getCheckedItems();
    if (checked.length === 0) {
      this.panel.setStatus("No items selected. Check items first.", "warning");
      return;
    }
    this.panel.setDownloading(true);
    this.panel.setProgress(0);
    this.panel.setStatus(`Downloading ${checked.length} file(s)...`, "info");
    const result = await this.downloader.downloadItems(
      checked,
      (item) => this.stacClient.getCogUrl(item),
      (current, total, message) => {
        this.panel?.setProgress(current / total * 100);
        this.panel?.setStatus(message, "info");
      }
    );
    this.panel.setDownloading(false);
    if (result.completed > 0) {
      this.panel.setStatus(
        `Downloaded ${result.completed} file(s).${result.failed > 0 ? ` ${result.failed} failed.` : ""}`,
        result.failed > 0 ? "warning" : "success"
      );
    } else {
      this.panel.setStatus("Download cancelled or failed.", "warning");
    }
  }
}

let control = null;
let position = "top-left";
let themeObserver = null;
function hostTheme() {
  return typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light";
}
function createControl(app) {
  return new VantorControl({
    collapsed: false,
    panelWidth: 380,
    theme: hostTheme(),
    // Prefer the host's addCogLayer so COGs become native layers in the Layers
    // panel; fall back to the host's maplibre-gl-raster instance if absent.
    cogAdder: app.addCogLayer ? (name, url, options) => app.addCogLayer(name, url, options) : void 0,
    rasterLoader: app.getMaplibreGlRaster ? () => app.getMaplibreGlRaster() : void 0
  });
}
const plugin = {
  id: "maplibre-gl-vantor",
  name: "Vantor Open Data",
  version: "0.2.1",
  activate(app) {
    const isNew = !control;
    control = control ?? createControl(app);
    const added = app.addMapControl(control, position);
    if (!added) {
      control = null;
      return false;
    }
    if (isNew && app.setMapProjection) {
      control.getCogLayer()?.on("layeradd", () => app.setMapProjection("mercator"));
    }
    if (!themeObserver && typeof document !== "undefined" && typeof MutationObserver !== "undefined") {
      themeObserver = new MutationObserver(() => control?.setTheme(hostTheme()));
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"]
      });
    }
  },
  deactivate(app) {
    themeObserver?.disconnect();
    themeObserver = null;
    if (!control) return;
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
    const added = app.addMapControl(control, position);
    if (!added) {
      control = null;
      return false;
    }
  }
};

class LayerManager {
  constructor() {
    throw new Error(
      "maplibre-gl-raster is not bundled in the Vantor Open Data GeoLibre plugin; the host must provide it via app.getMaplibreGlRaster()."
    );
  }
}
const DEFAULT_ENGINE = "maplibre-gl-raster";

const maplibreGlRaster = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  DEFAULT_ENGINE,
  LayerManager
}, Symbol.toStringTag, { value: 'Module' }));

export { plugin as default, plugin };
