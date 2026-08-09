//#region src/lib/core/PluginControl.ts
/**
* Default options for the PluginControl.
*
* The host-capability callbacks default to safe no-ops so the control works as a
* standalone MapLibre control. The GeoLibre wrapper (`src/geolibre.ts`) binds
* them to the real host APIs when the plugin runs inside GeoLibre.
*/
var DEFAULT_OPTIONS = {
	collapsed: true,
	position: "top-right",
	title: "Plugin Control",
	panelWidth: 300,
	className: "",
	pickFiles: () => Promise.resolve(null),
	registerNativeLayer: () => void 0,
	unregisterNativeLayer: () => void 0
};
/**
* A template MapLibre GL control that can be customized for various plugin needs.
*
* @example
* ```typescript
* const control = new PluginControl({
*   title: 'My Custom Control',
*   collapsed: false,
*   panelWidth: 320,
* });
* map.addControl(control, 'top-right');
* ```
*/
var PluginControl = class {
	_map;
	_mapContainer;
	_container;
	_panel;
	_status;
	_options;
	_state;
	_eventHandlers = new globalThis.Map();
	_registeredNativeLayerIds = [];
	_resizeHandler = null;
	_mapResizeHandler = null;
	_clickOutsideHandler = null;
	/**
	* Creates a new PluginControl instance.
	*
	* @param options - Configuration options for the control
	*/
	constructor(options) {
		this._options = {
			...DEFAULT_OPTIONS,
			...options
		};
		this._state = {
			collapsed: this._options.collapsed,
			panelWidth: this._options.panelWidth,
			data: {}
		};
	}
	/**
	* Called when the control is added to the map.
	* Implements the IControl interface.
	*
	* @param map - The MapLibre GL map instance
	* @returns The control's container element
	*/
	onAdd(map) {
		this._map = map;
		this._mapContainer = map.getContainer();
		this._container = this._createContainer();
		this._panel = this._createPanel();
		this._mapContainer.appendChild(this._panel);
		this._setupEventListeners();
		if (!this._state.collapsed) {
			this._panel.classList.add("expanded");
			requestAnimationFrame(() => {
				this._updatePanelPosition();
			});
		}
		return this._container;
	}
	/**
	* Called when the control is removed from the map.
	* Implements the IControl interface.
	*/
	onRemove() {
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
		this._clearNativeLayers();
		this._panel?.parentNode?.removeChild(this._panel);
		this._container?.parentNode?.removeChild(this._container);
		this._map = void 0;
		this._mapContainer = void 0;
		this._container = void 0;
		this._panel = void 0;
		this._status = void 0;
		this._eventHandlers.clear();
	}
	/**
	* Gets the current state of the control.
	*
	* @returns The current plugin state
	*/
	getState() {
		return { ...this._state };
	}
	/**
	* Updates the control state.
	*
	* @param newState - Partial state to merge with current state
	*/
	setState(newState) {
		this._state = {
			...this._state,
			...newState
		};
		this._emit("statechange");
	}
	/**
	* Toggles the collapsed state of the control panel.
	*/
	toggle() {
		this._state.collapsed = !this._state.collapsed;
		if (this._panel) if (this._state.collapsed) {
			this._panel.classList.remove("expanded");
			this._emit("collapse");
		} else {
			this._panel.classList.add("expanded");
			this._updatePanelPosition();
			this._emit("expand");
		}
		this._emit("statechange");
	}
	/**
	* Expands the control panel.
	*/
	expand() {
		if (this._state.collapsed) this.toggle();
	}
	/**
	* Collapses the control panel.
	*/
	collapse() {
		if (!this._state.collapsed) this.toggle();
	}
	/**
	* Registers an event handler.
	*
	* @param event - The event type to listen for
	* @param handler - The callback function
	*/
	on(event, handler) {
		if (!this._eventHandlers.has(event)) this._eventHandlers.set(event, /* @__PURE__ */ new Set());
		this._eventHandlers.get(event).add(handler);
	}
	/**
	* Removes an event handler.
	*
	* @param event - The event type
	* @param handler - The callback function to remove
	*/
	off(event, handler) {
		this._eventHandlers.get(event)?.delete(handler);
	}
	/**
	* Gets the map instance.
	*
	* @returns The MapLibre GL map instance or undefined if not added to a map
	*/
	getMap() {
		return this._map;
	}
	/**
	* Gets the control container element.
	*
	* @returns The container element or undefined if not added to a map
	*/
	getContainer() {
		return this._container;
	}
	/**
	* Open the host's directory picker and act on the chosen files.
	*
	* Calls the `pickFiles` option, which the GeoLibre wrapper binds to
	* `app.pickLocalDirectoryFiles`. Outside GeoLibre (or on a host without file
	* access) it resolves to `null`. Replace the body with your own handling of
	* the returned files.
	*
	* @returns The selected files, or `null` if the picker was unavailable or cancelled
	*/
	async openFiles() {
		try {
			const files = await this._options.pickFiles();
			if (!files || files.length === 0) {
				this._setStatus("No files selected.");
				return files;
			}
			this._setStatus(`Selected ${files.length} file(s).`);
			return files;
		} catch {
			this._setStatus("Unable to open folder.");
			return null;
		}
	}
	/**
	* Load plugin data referenced by a deep link.
	*
	* Satisfies {@link DeepLinkConsumer}: the GeoLibre wrapper routes a
	* `?plugin-data=<value>` URL parameter here. This template implementation just
	* records the value and demonstrates handing a native layer to the host;
	* replace it with your own fetch-and-render logic.
	*
	* @param value - The deep-link value (for example, a dataset URL)
	*/
	async loadFromUrl(value) {
		this.setState({ data: {
			...this._state.data,
			loadedUrl: value
		} });
		this._setStatus(`Loaded: ${value}`);
		this._registerNativeLayer({
			id: "plugin-template-data",
			name: "Plugin data",
			nativeLayerIds: ["plugin-template-data-layer"],
			sourceIds: ["plugin-template-data-source"],
			opacity: 1,
			style: {
				circleRadius: 5,
				fillColor: "#2f7ed8"
			},
			metadata: { sourceUrl: value }
		});
	}
	/**
	* Register a native layer with the host, tracking its id so it can be removed
	* when the control is torn down. No-ops outside GeoLibre.
	*
	* @param layer - The native layer registration payload
	*/
	_registerNativeLayer(layer) {
		try {
			this._options.registerNativeLayer(layer);
			if (!this._registeredNativeLayerIds.includes(layer.id)) this._registeredNativeLayerIds.push(layer.id);
		} catch {
			this._setStatus("Failed to register native layer.");
		}
	}
	/**
	* Unregister every native layer this control registered with the host.
	*/
	_clearNativeLayers() {
		const ids = [...this._registeredNativeLayerIds];
		this._registeredNativeLayerIds = [];
		for (const id of ids) try {
			this._options.unregisterNativeLayer(id);
		} catch {}
	}
	/**
	* Update the status line in the panel, if it is mounted.
	*
	* @param message - The status text to display
	*/
	_setStatus(message) {
		if (this._status) this._status.textContent = message;
	}
	/**
	* Emits an event to all registered handlers.
	*
	* @param event - The event type to emit
	*/
	_emit(event) {
		const handlers = this._eventHandlers.get(event);
		if (handlers) {
			const eventData = {
				type: event,
				state: this.getState()
			};
			handlers.forEach((handler) => handler(eventData));
		}
	}
	/**
	* Creates the main container element for the control.
	* Contains a toggle button (29x29) matching navigation control size.
	*
	* @returns The container element
	*/
	_createContainer() {
		const container = document.createElement("div");
		container.className = `maplibregl-ctrl maplibregl-ctrl-group plugin-control${this._options.className ? ` ${this._options.className}` : ""}`;
		const toggleBtn = document.createElement("button");
		toggleBtn.className = "plugin-control-toggle";
		toggleBtn.type = "button";
		toggleBtn.setAttribute("aria-label", this._options.title);
		toggleBtn.innerHTML = `
      <span class="plugin-control-icon">
        <svg viewBox="0 0 24 24" width="22" height="22" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      </span>
    `;
		toggleBtn.addEventListener("click", () => this.toggle());
		container.appendChild(toggleBtn);
		return container;
	}
	/**
	* Creates the panel element with header and content areas.
	* Panel is positioned as a dropdown below the toggle button.
	*
	* @returns The panel element
	*/
	_createPanel() {
		const panel = document.createElement("div");
		panel.className = "plugin-control-panel";
		panel.style.width = `${this._options.panelWidth}px`;
		const header = document.createElement("div");
		header.className = "plugin-control-header";
		const title = document.createElement("span");
		title.className = "plugin-control-title";
		title.textContent = this._options.title;
		const closeBtn = document.createElement("button");
		closeBtn.className = "plugin-control-close";
		closeBtn.type = "button";
		closeBtn.setAttribute("aria-label", "Close panel");
		closeBtn.innerHTML = "&times;";
		closeBtn.addEventListener("click", () => this.collapse());
		header.appendChild(title);
		header.appendChild(closeBtn);
		const content = document.createElement("div");
		content.className = "plugin-control-content";
		const placeholder = document.createElement("p");
		placeholder.className = "plugin-control-placeholder";
		placeholder.textContent = "Add your custom plugin content here.";
		const actions = document.createElement("div");
		actions.className = "plugin-control-actions";
		const openFolderBtn = document.createElement("button");
		openFolderBtn.type = "button";
		openFolderBtn.className = "plugin-control-action";
		openFolderBtn.textContent = "Open folder…";
		openFolderBtn.addEventListener("click", () => {
			this.openFiles();
		});
		actions.appendChild(openFolderBtn);
		const status = document.createElement("div");
		status.className = "plugin-control-status";
		status.textContent = "";
		this._status = status;
		content.appendChild(placeholder);
		content.appendChild(actions);
		content.appendChild(status);
		panel.appendChild(header);
		panel.appendChild(content);
		return panel;
	}
	/**
	* Setup event listeners for panel positioning and click-outside behavior.
	*/
	_setupEventListeners() {
		this._clickOutsideHandler = (e) => {
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
	/**
	* Detect which corner the control is positioned in.
	*
	* @returns The position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
	*/
	_getControlPosition() {
		const parent = this._container?.parentElement;
		if (!parent) return "top-right";
		if (parent.classList.contains("maplibregl-ctrl-top-left")) return "top-left";
		if (parent.classList.contains("maplibregl-ctrl-top-right")) return "top-right";
		if (parent.classList.contains("maplibregl-ctrl-bottom-left")) return "bottom-left";
		if (parent.classList.contains("maplibregl-ctrl-bottom-right")) return "bottom-right";
		return "top-right";
	}
	/**
	* Update the panel position based on button location and control corner.
	* Positions the panel next to the button, expanding in the appropriate direction.
	*/
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
		const panelGap = 5;
		this._panel.style.top = "";
		this._panel.style.bottom = "";
		this._panel.style.left = "";
		this._panel.style.right = "";
		switch (position) {
			case "top-left":
				this._panel.style.top = `${buttonTop + buttonRect.height + panelGap}px`;
				this._panel.style.left = `${buttonLeft}px`;
				break;
			case "top-right":
				this._panel.style.top = `${buttonTop + buttonRect.height + panelGap}px`;
				this._panel.style.right = `${buttonRight}px`;
				break;
			case "bottom-left":
				this._panel.style.bottom = `${buttonBottom + buttonRect.height + panelGap}px`;
				this._panel.style.left = `${buttonLeft}px`;
				break;
			case "bottom-right":
				this._panel.style.bottom = `${buttonBottom + buttonRect.height + panelGap}px`;
				this._panel.style.right = `${buttonRight}px`;
				break;
		}
	}
};
//#endregion
//#region src/lib/geolibre/floating-panel.ts
/**
* Demonstration of the GeoLibre floating panel host API.
*
* A floating panel is a draggable, closeable card the host overlays on the
* map's top-left corner. Unlike the right-sidebar panel (a single docked
* workspace), several floating panels can be open at once and they do not
* shrink the map. The render contract is the same plain-DOM `render(container)`
* as the right panel.
*
* Self-contained so it is easy to copy, adapt, or delete. It is registered (but
* not opened) from the plugin's `activate` hook; the template's toolbar menu
* opens it on demand (see `./toolbar-menu.ts`).
*/
/** Stable id for this plugin's floating panel. Replace with your own. */
var FLOATING_PANEL_ID = "geolibre-plugin-template-tools";
/**
* Register the template's floating panel.
*
* @param app - The GeoLibre host API passed to the plugin's `activate` hook.
* @returns A disposer that unregisters (and closes) the panel, or `null` when
*   the host does not provide floating panels.
*/
function registerTemplateFloatingPanel(app) {
	if (!app.registerFloatingPanel) return null;
	return app.registerFloatingPanel({
		id: FLOATING_PANEL_ID,
		title: "Floating Tools",
		defaultWidth: 280,
		render(container) {
			const wrap = document.createElement("div");
			wrap.className = "geolibre-plugin-floating-panel";
			const heading = document.createElement("h2");
			heading.textContent = "Floating Tools";
			const body = document.createElement("p");
			body.textContent = "A draggable card over the map, rendered by the plugin through app.registerFloatingPanel(). Open it with app.openFloatingPanel() and close it with app.closeFloatingPanel().";
			wrap.append(heading, body);
			container.appendChild(wrap);
			return () => {
				wrap.remove();
			};
		}
	});
}
//#endregion
//#region src/lib/geolibre/right-panel.ts
/**
* Demonstration of the GeoLibre right-sidebar panel host API.
*
* A plugin can register a native right-sidebar panel that docks beside
* GeoLibre's built-in Style panel and behaves like a first-class part of the
* workspace, instead of emulating one with a fixed overlay. The host renders
* the panel chrome (header, collapse/close buttons, a collapsible rail, and a
* resize handle); the plugin owns only the body via `render(container)`, using
* plain DOM so it never has to share the host's UI framework.
*
* This module is intentionally self-contained so it is easy to copy, adapt, or
* delete. Wire it from the plugin's `activate`/`deactivate` hooks (see
* `src/geolibre.ts`).
*/
/** Stable id for this plugin's right panel. Replace with your own. */
var RIGHT_PANEL_ID = "geolibre-plugin-template-workbench";
/**
* Register and open the template's right-sidebar panel.
*
* @param app - The GeoLibre host API passed to the plugin's `activate` hook.
* @returns A disposer that closes and unregisters the panel, or `null` when the
*   host does not provide a right sidebar (so the caller can skip cleanup).
*/
function registerTemplateRightPanel(app) {
	if (!app.registerRightPanel) return null;
	const unregister = app.registerRightPanel({
		id: RIGHT_PANEL_ID,
		title: "Workbench",
		defaultWidth: 320,
		render(container) {
			const wrap = document.createElement("div");
			wrap.className = "geolibre-plugin-right-panel";
			const heading = document.createElement("h2");
			heading.textContent = "Plugin Workbench";
			const body = document.createElement("p");
			body.textContent = "This panel is rendered by the plugin through app.registerRightPanel(). Replace this content with your own workbench, query review, or dashboard UI. Drive it with app.openRightPanel(), collapseRightPanel(), and closeRightPanel().";
			wrap.append(heading, body);
			container.appendChild(wrap);
			return () => {
				wrap.remove();
			};
		}
	});
	app.openRightPanel?.(RIGHT_PANEL_ID);
	return () => {
		app.closeRightPanel?.(RIGHT_PANEL_ID);
		unregister();
	};
}
//#endregion
//#region src/lib/geolibre/toolbar-menu.ts
/**
* Demonstration of the GeoLibre top toolbar menu host API.
*
* A plugin can add its own top-level menu button to the GeoLibre banner (beside
* Project / Edit / View / Plugins), with nested submenus and action items. Menu
* items typically open one of the plugin's panels; here they open the
* template's right panel and floating panel, and a third item closes both.
*
* Self-contained so it is easy to copy, adapt, or delete. Wire it from the
* plugin's `activate`/`deactivate` hooks (see `src/geolibre.ts`).
*/
/** Stable id for this plugin's toolbar menu. Replace with your own. */
var TOOLBAR_MENU_ID = "geolibre-plugin-template-menu";
/**
* Register the template's top toolbar menu.
*
* @param app - The GeoLibre host API passed to the plugin's `activate` hook.
* @returns A disposer that unregisters the menu, or `null` when the host has no
*   top toolbar.
*/
function registerTemplateToolbarMenu(app) {
	if (!app.registerToolbarMenu) return null;
	return app.registerToolbarMenu({
		id: TOOLBAR_MENU_ID,
		label: "Template",
		items: [
			{
				id: "open-right",
				label: "Open workbench panel",
				disabled: !app.openRightPanel,
				onSelect: () => app.openRightPanel?.(RIGHT_PANEL_ID)
			},
			{
				type: "submenu",
				id: "tools",
				label: "Tools",
				items: [{
					id: "open-floating",
					label: "Open floating tools",
					disabled: !app.openFloatingPanel,
					onSelect: () => app.openFloatingPanel?.(FLOATING_PANEL_ID)
				}]
			},
			{ type: "separator" },
			{
				id: "close-panels",
				label: "Close panels",
				disabled: !app.closeRightPanel && !app.closeFloatingPanel,
				onSelect: () => {
					app.closeRightPanel?.(RIGHT_PANEL_ID);
					app.closeFloatingPanel?.(FLOATING_PANEL_ID);
				}
			}
		]
	});
}
//#endregion
//#region src/lib/utils/deep-link.ts
/**
* Deep-linking support for the GeoLibre integration: a plugin can be opened with
* a value preloaded by adding a query parameter to the GeoLibre URL, e.g.
* `https://geolibre.app/?plugin-data=https://example.com/dataset.zip`.
*
* GeoLibre auto-activates a plugin when a URL carries a parameter the plugin
* declared in `urlParameterNames`, then dispatches the parsed query parameters
* to the plugin's `handleUrlParameters(app, params)` hook. These helpers operate
* purely on a `URLSearchParams`, with no DOM or MapLibre imports, so the logic
* can be unit-tested in isolation.
*
* Rename {@link PLUGIN_DATA_PARAM} and adapt {@link DeepLinkConsumer} to whatever
* your plugin needs to receive (a dataset URL, a feature id, a view state, ...).
*/
/** Query-parameter name this plugin owns. Rename for your plugin. */
var PLUGIN_DATA_PARAM = "plugin-data";
/**
* Extract the deep-link value from parsed query parameters. Returns the trimmed
* value, or `null` when the parameter is absent or blank.
*/
function getPluginDataValue(params) {
	const trimmed = params.get(PLUGIN_DATA_PARAM)?.trim();
	return trimmed ? trimmed : null;
}
/**
* If the query parameters carry a {@link PLUGIN_DATA_PARAM} value, forward it to
* the consumer. No-op when the parameter is absent or blank. Returns the
* consumer's promise (if any) so callers can await completion.
*/
async function maybeHandleDeepLink(consumer, params) {
	const value = getPluginDataValue(params);
	if (value) await consumer.loadFromUrl(value);
}
//#endregion
//#region src/geolibre.ts
var control = null;
var position = "top-right";
var pendingState = null;
var disposeRightPanel = null;
var disposeFloatingPanel = null;
var disposeToolbarMenu = null;
function createControl(app) {
	const nextControl = new PluginControl({
		collapsed: pendingState?.collapsed ?? true,
		panelWidth: pendingState?.panelWidth ?? 300,
		title: "GeoLibre Plugin Template",
		pickFiles: () => app.pickLocalDirectoryFiles?.() ?? Promise.resolve(null),
		registerNativeLayer: (layer) => app.registerExternalNativeLayer?.(layer),
		unregisterNativeLayer: (id) => app.unregisterExternalNativeLayer?.(id)
	});
	if (pendingState) nextControl.setState(pendingState);
	return nextControl;
}
function isPluginState(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return false;
	const candidate = value;
	if ("collapsed" in candidate && typeof candidate.collapsed !== "boolean") return false;
	if ("panelWidth" in candidate && typeof candidate.panelWidth !== "number") return false;
	if ("data" in candidate && (typeof candidate.data !== "object" || candidate.data === null || Array.isArray(candidate.data))) return false;
	return true;
}
var plugin = {
	id: "geolibre-plugin-template",
	name: "GeoLibre Plugin Template",
	version: "0.1.0",
	urlParameterNames: [PLUGIN_DATA_PARAM],
	activate(app) {
		control = control ?? createControl(app);
		if (!app.addMapControl(control, position)) {
			control = null;
			return false;
		}
		disposeRightPanel = registerTemplateRightPanel(app);
		disposeFloatingPanel = registerTemplateFloatingPanel(app);
		disposeToolbarMenu = registerTemplateToolbarMenu(app);
	},
	handleUrlParameters(_app, params) {
		if (control) return maybeHandleDeepLink(control, params);
	},
	deactivate(app) {
		disposeToolbarMenu?.();
		disposeToolbarMenu = null;
		disposeFloatingPanel?.();
		disposeFloatingPanel = null;
		disposeRightPanel?.();
		disposeRightPanel = null;
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
		control?.setState(state);
	}
};
//#endregion
export { plugin as default, plugin };
