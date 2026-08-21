import { t as BaseDecoder } from "./basedecoder-BEbFOz03.js";
//#region node_modules/geotiff/dist-module/compression/webimage.js
/**
* class WebImageDecoder
*
* This decoder uses the browsers image decoding facilities to read image
* formats like WebP when supported.
*/
var WebImageDecoder = class extends BaseDecoder {
	/**
	* @param {import('./basedecoder.js').BaseDecoderParameters} parameters
	*/
	constructor(parameters) {
		super(parameters);
		if (typeof createImageBitmap === "undefined") throw new Error("Cannot decode WebImage as `createImageBitmap` is not available");
		else if (typeof document === "undefined" && typeof OffscreenCanvas === "undefined") throw new Error("Cannot decode WebImage as neither `document` nor `OffscreenCanvas` is not available");
	}
	/** @param {ArrayBuffer} buffer */
	async decodeBlock(buffer) {
		const blob = new Blob([buffer]);
		const imageBitmap = await createImageBitmap(blob);
		let canvas;
		if (typeof document !== "undefined") {
			canvas = document.createElement("canvas");
			canvas.width = imageBitmap.width;
			canvas.height = imageBitmap.height;
		} else canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
		const ctx = canvas.getContext("2d");
		ctx.drawImage(imageBitmap, 0, 0);
		const imageData = ctx.getImageData(0, 0, imageBitmap.width, imageBitmap.height).data;
		const samplesPerPixel = this.parameters.samplesPerPixel || 4;
		if (samplesPerPixel === 4) return imageData.buffer;
		else if (samplesPerPixel === 3) {
			const rgb = new Uint8ClampedArray(imageBitmap.width * imageBitmap.height * 3);
			for (let i = 0, j = 0; i < rgb.length; i += 3, j += 4) {
				rgb[i] = imageData[j];
				rgb[i + 1] = imageData[j + 1];
				rgb[i + 2] = imageData[j + 2];
			}
			return rgb.buffer;
		} else throw new Error(`Unsupported SamplesPerPixel value: ${samplesPerPixel}`);
	}
};
//#endregion
export { WebImageDecoder as default };
