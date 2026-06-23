// GeoLibre external plugin used as the marketplace's sample / template.
// It is a self-contained ES module that exports a `plugin` implementing the
// GeoLibrePlugin contract, the same shape any external plugin must provide.
//
// Besides a theme-aware map control, it demonstrates the optional plugin UI
// surface APIs: a right-sidebar panel (in the shared-rail "replace-style" mode,
// where it shares the Style sidebar's single rail), a top toolbar menu, and a
// floating panel. Every UI-surface call is optional-chained, so on a host that
// does not provide a given surface the plugin still works as a plain map
// control.
// It ships style.css so its control and panels are theme-aware in light/dark.

const SVG_NS = "http://www.w3.org/2000/svg";
const STAR_PATH =
  "M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.9l-5.8 3.05 1.1-6.46-4.69-4.58 6.49-.94L12 2.5z";

const RIGHT_PANEL_ID = "geolibre-sample-workbench";
const FLOATING_PANEL_ID = "geolibre-sample-tools";
const TOOLBAR_MENU_ID = "geolibre-sample-menu";

// The host API captured in activate, so the map control's click handler can
// drive the UI surfaces.
let appApi = null;
// Disposers returned by the register* calls; run on deactivate.
const disposers = [];

// Built through the DOM API rather than innerHTML so the template models the
// safe idiom for authors who later swap in dynamic content.
function createStarIcon() {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "18");
  svg.setAttribute("height", "18");
  svg.setAttribute("fill", "currentColor");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", STAR_PATH);
  svg.appendChild(path);
  return svg;
}

// Fill a panel/card body with plain DOM. Returns a cleanup function the host
// runs when the panel closes or is unregistered.
function fillPanel(container, heading, body) {
  const wrap = document.createElement("div");
  wrap.className = "geolibre-sample-panel";
  const title = document.createElement("h2");
  title.textContent = heading;
  const text = document.createElement("p");
  text.textContent = body;
  wrap.append(title, text);
  container.appendChild(wrap);
  return () => wrap.remove();
}

const control = {
  _container: null,
  onAdd() {
    const container = document.createElement("div");
    container.className =
      "maplibregl-ctrl maplibregl-ctrl-group geolibre-sample-plugin-control";
    const button = document.createElement("button");
    button.type = "button";
    button.title = "Open the Sample workbench panel";
    button.setAttribute("aria-label", "Open the Sample workbench panel");
    button.appendChild(createStarIcon());
    button.addEventListener("click", () => {
      // Open the right-sidebar panel where supported; otherwise just toggle a
      // visual active state so the control still gives feedback on any host.
      if (appApi?.openRightPanel) {
        appApi.openRightPanel(RIGHT_PANEL_ID);
      } else {
        button.classList.toggle("is-active");
      }
    });
    container.appendChild(button);
    this._container = container;
    return container;
  },
  onRemove() {
    this._container?.remove();
    this._container = null;
  },
};

// Register the optional UI surfaces, collecting their disposers. Each register*
// method is optional, so this degrades gracefully on hosts without them.
function registerSurfaces(app) {
  const keep = (dispose) => {
    if (typeof dispose === "function") disposers.push(dispose);
  };

  keep(
    app.registerRightPanel?.({
      id: RIGHT_PANEL_ID,
      title: "Sample Workbench",
      // Shared-rail mode: the panel shares the Style sidebar's single rail
      // instead of docking beside it. The host shows one far-right rail listing
      // both this Workbench and Style; selecting one expands it while the other
      // stays a rail entry, so a workbench-style plugin reads as a first-class
      // right-sidebar workspace rather than a second rail next to Style.
      //
      // Other dock values: "left-of-layers", "right-of-layers", "left-of-style",
      // "right-of-style" (the positional default). A host too old to know
      // "replace-style" falls back to "right-of-style", so the panel still works
      // as a normal dockable sidebar.
      dock: "replace-style",
      defaultWidth: 320,
      render: (container) =>
        fillPanel(
          container,
          "Sample Workbench",
          "A right-sidebar panel registered via app.registerRightPanel() with " +
            'dock: "replace-style". It shares the Style panel\'s single rail: ' +
            "the rail lists both this Workbench and Style, and opening one " +
            "collapses the other, so you never see two adjacent rails. Click the " +
            "star control or the Sample menu to open it; use the header buttons " +
            "to collapse or close it, or pick Style in the rail to switch.",
        ),
    }),
  );

  keep(
    app.registerFloatingPanel?.({
      id: FLOATING_PANEL_ID,
      title: "Sample Tools",
      defaultWidth: 280,
      render: (container) =>
        fillPanel(
          container,
          "Sample Tools",
          "A draggable, closeable card over the map, registered via " +
            "app.registerFloatingPanel(). Drag its title bar to move it.",
        ),
    }),
  );

  keep(
    app.registerToolbarMenu?.({
      id: TOOLBAR_MENU_ID,
      label: "Sample",
      items: [
        {
          id: "open-right",
          label: "Open workbench panel",
          disabled: !app.openRightPanel,
          onSelect: () => app.openRightPanel?.(RIGHT_PANEL_ID),
        },
        {
          type: "submenu",
          id: "tools",
          label: "Tools",
          items: [
            {
              id: "open-floating",
              label: "Open floating tools",
              disabled: !app.openFloatingPanel,
              onSelect: () => app.openFloatingPanel?.(FLOATING_PANEL_ID),
            },
          ],
        },
        { type: "separator" },
        {
          id: "close-panels",
          label: "Close panels",
          disabled: !app.closeRightPanel && !app.closeFloatingPanel,
          onSelect: () => {
            app.closeRightPanel?.(RIGHT_PANEL_ID);
            app.closeFloatingPanel?.(FLOATING_PANEL_ID);
          },
        },
      ],
    }),
  );
}

export const plugin = {
  id: "geolibre-sample-plugin",
  name: "Sample Plugin",
  version: "1.2.0",
  activate(app) {
    appApi = app;
    app.addMapControl(control, "top-right");
    registerSurfaces(app);
  },
  deactivate(app) {
    for (const dispose of disposers.splice(0)) {
      try {
        dispose();
      } catch (error) {
        console.error("Sample plugin cleanup failed.", error);
      }
    }
    app.removeMapControl(control);
    appApi = null;
  },
};

export default plugin;
