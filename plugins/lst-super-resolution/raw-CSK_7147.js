import { t as BaseDecoder } from "./basedecoder-BEbFOz03.js";
//#region node_modules/geotiff/dist-module/compression/raw.js
var RawDecoder = class extends BaseDecoder {
	/** @param {ArrayBuffer} buffer */
	decodeBlock(buffer) {
		return buffer;
	}
};
//#endregion
export { RawDecoder as default };
