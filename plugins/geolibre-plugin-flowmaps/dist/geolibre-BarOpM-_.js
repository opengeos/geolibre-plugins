const PLUGIN_DATA_PARAM = "plugin-data";
function getPluginDataValue(params) {
  var _a;
  const trimmed = (_a = params.get(PLUGIN_DATA_PARAM)) == null ? void 0 : _a.trim();
  return trimmed ? trimmed : null;
}
async function maybeHandleDeepLink(consumer, params) {
  const value = getPluginDataValue(params);
  if (value) await consumer.loadFromUrl(value);
}
let pluginInstance = null;
const plugin = {
  id: "geolibre-plugin-flowmaps",
  name: "Flowmaps.gl",
  version: "0.1.0",
  urlParameterNames: [PLUGIN_DATA_PARAM],
  async activate(app) {
    if (!pluginInstance) {
      const { FlowmapsPluginHost } = await import("./host-impl-NbwMShhe.js");
      pluginInstance = new FlowmapsPluginHost();
    }
    await pluginInstance.activate(app);
  },
  handleUrlParameters(app, params) {
    if (pluginInstance) pluginInstance.handleUrlParameters(app, params);
  },
  deactivate(app) {
    if (pluginInstance) {
      pluginInstance.deactivate(app);
    }
  },
  getProjectState() {
    return (pluginInstance == null ? void 0 : pluginInstance.getProjectState()) ?? void 0;
  },
  applyProjectState(app, state) {
    if (pluginInstance) {
      pluginInstance.applyProjectState(app, state);
    }
  }
};
export {
  maybeHandleDeepLink as m,
  plugin as p
};
