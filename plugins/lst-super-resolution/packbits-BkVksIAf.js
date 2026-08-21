import { t as BaseDecoder } from "./basedecoder-BEbFOz03.js";
//#region node_modules/geotiff/dist-module/compression/packbits.js
var PackbitsDecoder = class extends BaseDecoder {
	/** @param {ArrayBuffer} buffer */
	decodeBlock(buffer) {
		const dataView = new DataView(buffer);
		const out = [];
		for (let i = 0; i < buffer.byteLength; ++i) {
			let header = dataView.getInt8(i);
			if (header < 0) {
				const next = dataView.getUint8(i + 1);
				header = -header;
				for (let j = 0; j <= header; ++j) out.push(next);
				i += 1;
			} else {
				for (let j = 0; j <= header; ++j) out.push(dataView.getUint8(i + j + 1));
				i += header + 1;
			}
		}
		return new Uint8Array(out).buffer;
	}
};
//#endregion
export { PackbitsDecoder as default };
