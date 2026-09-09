import { t as BaseDecoder } from "./basedecoder-BEbFOz03.js";
import { t as inflate_1 } from "./pako.esm-Bh1yUGpp.js";
//#region node_modules/geotiff/dist-module/compression/deflate.js
var DeflateDecoder = class extends BaseDecoder {
	/** @param {ArrayBuffer} buffer */
	decodeBlock(buffer) {
		return inflate_1(new Uint8Array(buffer)).buffer;
	}
};
//#endregion
export { DeflateDecoder as default };
