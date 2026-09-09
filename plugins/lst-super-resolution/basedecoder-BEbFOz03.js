//#region node_modules/geotiff/dist-module/predictor.js
/**
* @param {Uint8Array|Uint16Array|Uint32Array} row
* @param {number} stride
*/
function decodeRowAcc(row, stride) {
	let length = row.length - stride;
	let offset = 0;
	do {
		for (let i = stride; i > 0; i--) {
			row[offset + stride] += row[offset];
			offset++;
		}
		length -= stride;
	} while (length > 0);
}
/**
* @param {Uint8Array} row
* @param {number} stride
* @param {number} bytesPerSample
*/
function decodeRowFloatingPoint(row, stride, bytesPerSample) {
	let index = 0;
	let count = row.length;
	const wc = count / bytesPerSample;
	while (count > stride) {
		for (let i = stride; i > 0; --i) {
			row[index + stride] += row[index];
			++index;
		}
		count -= stride;
	}
	const copy = row.slice();
	for (let i = 0; i < wc; ++i) for (let b = 0; b < bytesPerSample; ++b) row[bytesPerSample * i + b] = copy[(bytesPerSample - b - 1) * wc + i];
}
/**
* @param {ArrayBufferLike} block
* @param {number} predictor
* @param {number} width
* @param {number} height
* @param {number[]} bitsPerSample
* @param {number} planarConfiguration
* @returns
*/
function applyPredictor(block, predictor, width, height, bitsPerSample, planarConfiguration) {
	if (!predictor || predictor === 1) return block;
	for (let i = 0; i < bitsPerSample.length; ++i) {
		if (bitsPerSample[i] % 8 !== 0) throw new Error("When decoding with predictor, only multiple of 8 bits are supported.");
		if (bitsPerSample[i] !== bitsPerSample[0]) throw new Error("When decoding with predictor, all samples must have the same size.");
	}
	const bytesPerSample = bitsPerSample[0] / 8;
	const stride = planarConfiguration === 2 ? 1 : bitsPerSample.length;
	for (let i = 0; i < height; ++i) {
		if (i * stride * width * bytesPerSample >= block.byteLength) break;
		let row;
		if (predictor === 2) {
			switch (bitsPerSample[0]) {
				case 8:
					row = new Uint8Array(block, i * stride * width * bytesPerSample, stride * width * bytesPerSample);
					break;
				case 16:
					row = new Uint16Array(block, i * stride * width * bytesPerSample, stride * width * bytesPerSample / 2);
					break;
				case 32:
					row = new Uint32Array(block, i * stride * width * bytesPerSample, stride * width * bytesPerSample / 4);
					break;
				default: throw new Error(`Predictor 2 not allowed with ${bitsPerSample[0]} bits per sample.`);
			}
			decodeRowAcc(row, stride);
		} else if (predictor === 3) {
			row = new Uint8Array(block, i * stride * width * bytesPerSample, stride * width * bytesPerSample);
			decodeRowFloatingPoint(row, stride, bytesPerSample);
		}
	}
	return block;
}
//#endregion
//#region node_modules/geotiff/dist-module/compression/basedecoder.js
/**
* @typedef {Object} BaseDecoderParameters
* @property {number} tileWidth
* @property {number} tileHeight
* @property {number} predictor
* @property {number|number[]|import('../geotiff.js').TypedArray} bitsPerSample
* @property {number} planarConfiguration
* @property {number} [samplesPerPixel]
*/
var BaseDecoder = class {
	/**
	* @param {BaseDecoderParameters} parameters
	*/
	constructor(parameters) {
		this.parameters = parameters;
	}
	/**
	* @abstract
	* @param {ArrayBufferLike} _buffer
	* @returns {Promise<ArrayBufferLike>|ArrayBufferLike}
	*/
	decodeBlock(_buffer) {
		throw new Error("decodeBlock not implemented");
	}
	/**
	* @param {ArrayBufferLike} buffer
	* @returns {Promise<ArrayBufferLike>}
	*/
	async decode(buffer) {
		const decoded = await this.decodeBlock(buffer);
		const { tileWidth, tileHeight, predictor, bitsPerSample, planarConfiguration } = this.parameters;
		if (predictor !== 1) return applyPredictor(decoded, predictor, tileWidth, tileHeight, Array.isArray(bitsPerSample) || ArrayBuffer.isView(bitsPerSample) ? Array.from(bitsPerSample) : [bitsPerSample], planarConfiguration);
		return decoded;
	}
};
//#endregion
export { BaseDecoder as t };
