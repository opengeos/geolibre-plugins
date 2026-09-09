import { t as BaseDecoder } from "./basedecoder-BEbFOz03.js";
//#region node_modules/geotiff/dist-module/compression/jpeg.js
var dctZigZag = new Int32Array([
	0,
	1,
	8,
	16,
	9,
	2,
	3,
	10,
	17,
	24,
	32,
	25,
	18,
	11,
	4,
	5,
	12,
	19,
	26,
	33,
	40,
	48,
	41,
	34,
	27,
	20,
	13,
	6,
	7,
	14,
	21,
	28,
	35,
	42,
	49,
	56,
	57,
	50,
	43,
	36,
	29,
	22,
	15,
	23,
	30,
	37,
	44,
	51,
	58,
	59,
	52,
	45,
	38,
	31,
	39,
	46,
	53,
	60,
	61,
	54,
	47,
	55,
	62,
	63
]);
var dctCos1 = 4017;
var dctSin1 = 799;
var dctCos3 = 3406;
var dctSin3 = 2276;
var dctCos6 = 1567;
var dctSin6 = 3784;
var dctSqrt2 = 5793;
var dctSqrt1d2 = 2896;
/** @typedef {(number|HuffmanNode)[]} HuffmanNode */
/** @typedef {{children: HuffmanNode, index: number}} Code */
/**
* @typedef {Object} JpegComponent
* @property {number} h
* @property {number} v
* @property {number} [quantizationIdx]
* @property {Int32Array} [quantizationTable]
* @property {number} blocksPerLine
* @property {number} blocksPerColumn
* @property {Int32Array[][]} blocks
* @property {HuffmanNode} [huffmanTableDC]
* @property {HuffmanNode} [huffmanTableAC]
* @property {number} [pred]
*/
/**
* @typedef {Object} JpegFrame
* @property {boolean} extended
* @property {boolean} progressive
* @property {number} precision
* @property {number} scanLines
* @property {number} samplesPerLine
* @property {Object.<string, JpegComponent>} components
* @property {number[]} componentsOrder
* @property {number} maxH
* @property {number} maxV
* @property {number} mcusPerLine
* @property {number} mcusPerColumn
*/
/**
* @param {Uint8Array<ArrayBuffer>} codeLengths
* @param {Uint8Array<ArrayBuffer>} values
* @returns {HuffmanNode}
*/
function buildHuffmanTable(codeLengths, values) {
	let k = 0;
	/** @type {Array<Code>} */
	const code = [];
	let length = 16;
	while (length > 0 && !codeLengths[length - 1]) --length;
	code.push({
		children: [],
		index: 0
	});
	/** @type {Code|undefined} */
	let p = code[0];
	/** @type {Code|undefined} */
	let q;
	for (let i = 0; i < length; i++) {
		for (let j = 0; j < codeLengths[i]; j++) {
			p = code.pop();
			if (!p) throw new Error("buildHuffmanTable: codeLength mismatch");
			p.children[p.index] = values[k];
			while (p.index > 0) {
				p = code.pop();
				if (!p) throw new Error("buildHuffmanTable: codeLength mismatch");
			}
			p.index++;
			code.push(p);
			while (code.length <= i) {
				code.push(q = {
					children: [],
					index: 0
				});
				p.children[p.index] = q.children;
				p = q;
			}
			k++;
		}
		if (i + 1 < length) {
			code.push(q = {
				children: [],
				index: 0
			});
			p.children[p.index] = q.children;
			p = q;
		}
	}
	return code[0].children;
}
/**
* @param {Uint8Array} data
* @param {number} initialOffset
* @param {JpegFrame} frame
* @param {JpegComponent[]} components
* @param {number} resetInterval
* @param {number} spectralStart
* @param {number} spectralEnd
* @param {number} successivePrev
* @param {number} successive
*/
function decodeScan(data, initialOffset, frame, components, resetInterval, spectralStart, spectralEnd, successivePrev, successive) {
	const { mcusPerLine, progressive } = frame;
	if (components.length > 1 && (mcusPerLine === void 0 || frame.mcusPerColumn === void 0)) throw new Error("Missing MCU dimensions");
	if (components.length === 1 && (components[0].blocksPerLine === void 0 || components[0].blocksPerColumn === void 0)) throw new Error("Missing block dimensions");
	const startOffset = initialOffset;
	let offset = initialOffset;
	let bitsData = 0;
	let bitsCount = 0;
	function readBit() {
		if (bitsCount > 0) {
			bitsCount--;
			return bitsData >> bitsCount & 1;
		}
		bitsData = data[offset++];
		if (bitsData === 255) {
			const nextByte = data[offset++];
			if (nextByte) throw new Error(`unexpected marker: ${(bitsData << 8 | nextByte).toString(16)}`);
		}
		bitsCount = 7;
		return bitsData >>> 7;
	}
	/** @param {HuffmanNode|undefined} tree */
	function decodeHuffman(tree) {
		if (!tree) throw new Error("Huffman table not found");
		let node = tree;
		let bit;
		while ((bit = readBit()) !== null) {
			const next = node[bit];
			if (typeof next === "number") return next;
			if (typeof next !== "object") throw new Error("invalid huffman sequence");
			node = next;
		}
		return null;
	}
	/** @param {number} initialLength */
	function receive(initialLength) {
		let length = initialLength;
		let n = 0;
		while (length > 0) {
			const bit = readBit();
			if (bit === null) return;
			n = n << 1 | bit;
			--length;
		}
		return n;
	}
	/** @param {number} length */
	function receiveAndExtend(length) {
		const n = receive(length);
		if (n === void 0) return;
		if (n >= 1 << length - 1) return n;
		return n + (-1 << length) + 1;
	}
	/**
	* @param {JpegComponent} component
	* @param {Int32Array} zz
	*/
	function decodeBaseline(component, zz) {
		const t = decodeHuffman(component.huffmanTableDC);
		if (t === null) throw new Error("Huffman error");
		const diff = t === 0 ? 0 : receiveAndExtend(t);
		if (diff === void 0) throw new Error("Unexpected end of stream");
		if (component.pred === void 0) component.pred = 0;
		component.pred += diff;
		zz[0] = component.pred;
		let k = 1;
		while (k < 64) {
			const rs = decodeHuffman(component.huffmanTableAC);
			if (rs === null) throw new Error("Unexpected end of data in AC coefficient decoding");
			const s = rs & 15;
			const r = rs >> 4;
			if (s === 0) {
				if (r < 15) break;
				k += 16;
			} else {
				k += r;
				const z = dctZigZag[k];
				const val = receiveAndExtend(s);
				if (val === void 0) throw new Error("Unexpected end of stream");
				zz[z] = val;
				k++;
			}
		}
	}
	/**
	* @param {JpegComponent} component
	* @param {Int32Array} zz
	*/
	function decodeDCFirst(component, zz) {
		const t = decodeHuffman(component.huffmanTableDC);
		if (t === null) throw new Error("Huffman error");
		const value = receiveAndExtend(t);
		if (value === void 0) throw new Error("Unexpected end of data in DC coefficient decoding");
		const diff = t === 0 ? 0 : value << successive;
		if (component.pred === void 0) component.pred = 0;
		component.pred += diff;
		zz[0] = component.pred;
	}
	/**
	* @param {JpegComponent} _
	* @param {Int32Array} zz
	*/
	function decodeDCSuccessive(_, zz) {
		const bit = readBit();
		if (bit === null) throw new Error("Unexpected end of data in DC coefficient decoding");
		zz[0] |= bit << successive;
	}
	let eobrun = 0;
	/**
	* @param {JpegComponent} component
	* @param {Int32Array} zz
	*/
	function decodeACFirst(component, zz) {
		if (eobrun > 0) {
			eobrun--;
			return;
		}
		let k = spectralStart;
		const e = spectralEnd;
		while (k <= e) {
			const rs = decodeHuffman(component.huffmanTableAC);
			if (rs === null) throw new Error("Unexpected end of data in AC coefficient decoding");
			const s = rs & 15;
			const r = rs >> 4;
			if (s === 0) {
				if (r < 15) {
					const value = receive(r);
					if (value === void 0) throw new Error("Unexpected end of data in AC coefficient decoding");
					eobrun = value + (1 << r) - 1;
					break;
				}
				k += 16;
			} else {
				k += r;
				const z = dctZigZag[k];
				const value = receiveAndExtend(s);
				if (value === void 0) throw new Error("Unexpected end of data in AC coefficient decoding");
				zz[z] = value * (1 << successive);
				k++;
			}
		}
	}
	let successiveACState = 0;
	/** @type {number} */
	let successiveACNextValue;
	/**
	* @param {JpegComponent} component
	* @param {Int32Array} zz
	*/
	function decodeACSuccessive(component, zz) {
		let k = spectralStart;
		const e = spectralEnd;
		let r = 0;
		while (k <= e) {
			const z = dctZigZag[k];
			const direction = zz[z] < 0 ? -1 : 1;
			switch (successiveACState) {
				case 0: {
					const rs = decodeHuffman(component.huffmanTableAC);
					if (rs === null) throw new Error("Unexpected end of data in AC coefficient decoding");
					const s = rs & 15;
					r = rs >> 4;
					if (s === 0) if (r < 15) {
						const value = receive(r);
						if (value === void 0) throw new Error("Unexpected end of data in AC coefficient decoding");
						eobrun = value + (1 << r);
						successiveACState = 4;
					} else {
						r = 16;
						successiveACState = 1;
					}
					else {
						if (s !== 1) throw new Error("invalid ACn encoding");
						const nextVal = receiveAndExtend(s);
						if (nextVal === void 0) throw new Error("Unexpected end of data in AC coefficient decoding");
						successiveACNextValue = nextVal;
						successiveACState = r ? 2 : 3;
					}
					continue;
				}
				case 1:
				case 2:
					if (zz[z]) {
						const bit = readBit();
						if (bit === null) throw new Error("Unexpected end of data in AC coefficient decoding");
						zz[z] += (bit << successive) * direction;
					} else {
						r--;
						if (r === 0) successiveACState = successiveACState === 2 ? 3 : 0;
					}
					break;
				case 3:
					if (zz[z]) {
						const bit = readBit();
						if (bit === null) throw new Error("Unexpected end of data in AC coefficient decoding");
						zz[z] += (bit << successive) * direction;
					} else {
						zz[z] = successiveACNextValue << successive;
						successiveACState = 0;
					}
					break;
				case 4:
					if (zz[z]) {
						const bit = readBit();
						if (bit === null) throw new Error("Unexpected end of data in AC coefficient decoding");
						zz[z] += (bit << successive) * direction;
					}
					break;
				default: break;
			}
			k++;
		}
		if (successiveACState === 4) {
			eobrun--;
			if (eobrun === 0) successiveACState = 0;
		}
	}
	/**
	* @param {JpegComponent} component
	* @param {function} decodeFunction
	* @param {number} mcu
	* @param {number} row
	* @param {number} col
	*/
	function decodeMcu(component, decodeFunction, mcu, row, col) {
		const mcuRow = mcu / mcusPerLine | 0;
		const mcuCol = mcu % mcusPerLine;
		const blockRow = mcuRow * component.v + row;
		const blockCol = mcuCol * component.h + col;
		if (!component.blocks) throw new Error("Missing blocks");
		decodeFunction(component, component.blocks[blockRow][blockCol]);
	}
	/**
	* @param {JpegComponent} component
	* @param {function} decodeFunction
	* @param {number} mcu
	*/
	function decodeBlock(component, decodeFunction, mcu) {
		const blockRow = mcu / component.blocksPerLine | 0;
		const blockCol = mcu % component.blocksPerLine;
		if (!component.blocks) throw new Error("Missing blocks");
		decodeFunction(component, component.blocks[blockRow][blockCol]);
	}
	const componentsLength = components.length;
	let component;
	let i;
	let j;
	let k;
	let n;
	let decodeFn;
	if (progressive) if (spectralStart === 0) decodeFn = successivePrev === 0 ? decodeDCFirst : decodeDCSuccessive;
	else decodeFn = successivePrev === 0 ? decodeACFirst : decodeACSuccessive;
	else decodeFn = decodeBaseline;
	let mcu = 0;
	let marker;
	let mcuExpected;
	if (componentsLength === 1) mcuExpected = components[0].blocksPerLine * components[0].blocksPerColumn;
	else mcuExpected = mcusPerLine * frame.mcusPerColumn;
	const usedResetInterval = resetInterval || mcuExpected;
	while (mcu < mcuExpected) {
		for (i = 0; i < componentsLength; i++) components[i].pred = 0;
		eobrun = 0;
		if (componentsLength === 1) {
			component = components[0];
			for (n = 0; n < usedResetInterval; n++) {
				decodeBlock(component, decodeFn, mcu);
				mcu++;
			}
		} else for (n = 0; n < usedResetInterval; n++) {
			for (i = 0; i < componentsLength; i++) {
				component = components[i];
				const { h, v } = component;
				for (j = 0; j < v; j++) for (k = 0; k < h; k++) decodeMcu(component, decodeFn, mcu, j, k);
			}
			mcu++;
			if (mcu === mcuExpected) break;
		}
		bitsCount = 0;
		marker = data[offset] << 8 | data[offset + 1];
		if (marker < 65280) throw new Error("marker was not found");
		if (marker >= 65488 && marker <= 65495) offset += 2;
		else break;
	}
	return offset - startOffset;
}
/**
* @param {JpegComponent} component
*/
function buildComponentData(component) {
	const lines = [];
	const { blocksPerLine, blocksPerColumn } = component;
	if (!blocksPerLine || !blocksPerColumn || !component.blocks) throw new Error("Missing component data");
	const samplesPerLine = blocksPerLine << 3;
	const R = new Int32Array(64);
	const r = new Uint8Array(64);
	/**
	* @param {Int32Array} zz
	* @param {Uint8Array} dataOut
	* @param {Int32Array} dataIn
	*/
	function quantizeAndInverse(zz, dataOut, dataIn) {
		const qt = component.quantizationTable;
		if (!qt) throw new Error("No quantization table found");
		let v0;
		let v1;
		let v2;
		let v3;
		let v4;
		let v5;
		let v6;
		let v7;
		let t;
		const p = dataIn;
		let i;
		for (i = 0; i < 64; i++) p[i] = zz[i] * qt[i];
		for (i = 0; i < 8; ++i) {
			const row = 8 * i;
			if (p[1 + row] === 0 && p[2 + row] === 0 && p[3 + row] === 0 && p[4 + row] === 0 && p[5 + row] === 0 && p[6 + row] === 0 && p[7 + row] === 0) {
				t = dctSqrt2 * p[0 + row] + 512 >> 10;
				p[0 + row] = t;
				p[1 + row] = t;
				p[2 + row] = t;
				p[3 + row] = t;
				p[4 + row] = t;
				p[5 + row] = t;
				p[6 + row] = t;
				p[7 + row] = t;
				continue;
			}
			v0 = dctSqrt2 * p[0 + row] + 128 >> 8;
			v1 = dctSqrt2 * p[4 + row] + 128 >> 8;
			v2 = p[2 + row];
			v3 = p[6 + row];
			v4 = dctSqrt1d2 * (p[1 + row] - p[7 + row]) + 128 >> 8;
			v7 = dctSqrt1d2 * (p[1 + row] + p[7 + row]) + 128 >> 8;
			v5 = p[3 + row] << 4;
			v6 = p[5 + row] << 4;
			t = v0 - v1 + 1 >> 1;
			v0 = v0 + v1 + 1 >> 1;
			v1 = t;
			t = v2 * dctSin6 + v3 * dctCos6 + 128 >> 8;
			v2 = v2 * dctCos6 - v3 * dctSin6 + 128 >> 8;
			v3 = t;
			t = v4 - v6 + 1 >> 1;
			v4 = v4 + v6 + 1 >> 1;
			v6 = t;
			t = v7 + v5 + 1 >> 1;
			v5 = v7 - v5 + 1 >> 1;
			v7 = t;
			t = v0 - v3 + 1 >> 1;
			v0 = v0 + v3 + 1 >> 1;
			v3 = t;
			t = v1 - v2 + 1 >> 1;
			v1 = v1 + v2 + 1 >> 1;
			v2 = t;
			t = v4 * dctSin3 + v7 * dctCos3 + 2048 >> 12;
			v4 = v4 * dctCos3 - v7 * dctSin3 + 2048 >> 12;
			v7 = t;
			t = v5 * dctSin1 + v6 * dctCos1 + 2048 >> 12;
			v5 = v5 * dctCos1 - v6 * dctSin1 + 2048 >> 12;
			v6 = t;
			p[0 + row] = v0 + v7;
			p[7 + row] = v0 - v7;
			p[1 + row] = v1 + v6;
			p[6 + row] = v1 - v6;
			p[2 + row] = v2 + v5;
			p[5 + row] = v2 - v5;
			p[3 + row] = v3 + v4;
			p[4 + row] = v3 - v4;
		}
		for (i = 0; i < 8; ++i) {
			const col = i;
			if (p[8 + col] === 0 && p[16 + col] === 0 && p[24 + col] === 0 && p[32 + col] === 0 && p[40 + col] === 0 && p[48 + col] === 0 && p[56 + col] === 0) {
				t = dctSqrt2 * dataIn[i + 0] + 8192 >> 14;
				p[0 + col] = t;
				p[8 + col] = t;
				p[16 + col] = t;
				p[24 + col] = t;
				p[32 + col] = t;
				p[40 + col] = t;
				p[48 + col] = t;
				p[56 + col] = t;
				continue;
			}
			v0 = dctSqrt2 * p[0 + col] + 2048 >> 12;
			v1 = dctSqrt2 * p[32 + col] + 2048 >> 12;
			v2 = p[16 + col];
			v3 = p[48 + col];
			v4 = dctSqrt1d2 * (p[8 + col] - p[56 + col]) + 2048 >> 12;
			v7 = dctSqrt1d2 * (p[8 + col] + p[56 + col]) + 2048 >> 12;
			v5 = p[24 + col];
			v6 = p[40 + col];
			t = v0 - v1 + 1 >> 1;
			v0 = v0 + v1 + 1 >> 1;
			v1 = t;
			t = v2 * dctSin6 + v3 * dctCos6 + 2048 >> 12;
			v2 = v2 * dctCos6 - v3 * dctSin6 + 2048 >> 12;
			v3 = t;
			t = v4 - v6 + 1 >> 1;
			v4 = v4 + v6 + 1 >> 1;
			v6 = t;
			t = v7 + v5 + 1 >> 1;
			v5 = v7 - v5 + 1 >> 1;
			v7 = t;
			t = v0 - v3 + 1 >> 1;
			v0 = v0 + v3 + 1 >> 1;
			v3 = t;
			t = v1 - v2 + 1 >> 1;
			v1 = v1 + v2 + 1 >> 1;
			v2 = t;
			t = v4 * dctSin3 + v7 * dctCos3 + 2048 >> 12;
			v4 = v4 * dctCos3 - v7 * dctSin3 + 2048 >> 12;
			v7 = t;
			t = v5 * dctSin1 + v6 * dctCos1 + 2048 >> 12;
			v5 = v5 * dctCos1 - v6 * dctSin1 + 2048 >> 12;
			v6 = t;
			p[0 + col] = v0 + v7;
			p[56 + col] = v0 - v7;
			p[8 + col] = v1 + v6;
			p[48 + col] = v1 - v6;
			p[16 + col] = v2 + v5;
			p[40 + col] = v2 - v5;
			p[24 + col] = v3 + v4;
			p[32 + col] = v3 - v4;
		}
		for (i = 0; i < 64; ++i) {
			const sample = 128 + (p[i] + 8 >> 4);
			if (sample < 0) dataOut[i] = 0;
			else if (sample > 255) dataOut[i] = 255;
			else dataOut[i] = sample;
		}
	}
	for (let blockRow = 0; blockRow < blocksPerColumn; blockRow++) {
		const scanLine = blockRow << 3;
		for (let i = 0; i < 8; i++) lines.push(new Uint8Array(samplesPerLine));
		for (let blockCol = 0; blockCol < blocksPerLine; blockCol++) {
			quantizeAndInverse(component.blocks[blockRow][blockCol], r, R);
			let offset = 0;
			const sample = blockCol << 3;
			for (let j = 0; j < 8; j++) {
				const line = lines[scanLine + j];
				for (let i = 0; i < 8; i++) line[sample + i] = r[offset++];
			}
		}
	}
	return lines;
}
var JpegStreamReader = class {
	constructor() {
		this.jfif = null;
		this.adobe = null;
		/** @type {number} */
		this.resetInterval = 0;
		/** @type {Int32Array[]} */
		this.quantizationTables = [];
		/** @type {HuffmanNode[]} */
		this.huffmanTablesAC = [];
		/** @type {HuffmanNode[]} */
		this.huffmanTablesDC = [];
		/** @type {JpegFrame[]} */
		this.frames = [];
	}
	resetFrames() {
		this.frames = [];
	}
	/** @param {Uint8Array} data */
	parse(data) {
		let offset = 0;
		function readUint16() {
			const value = data[offset] << 8 | data[offset + 1];
			offset += 2;
			return value;
		}
		function readDataBlock() {
			const length = readUint16();
			const array = data.subarray(offset, offset + length - 2);
			offset += array.length;
			return array;
		}
		/** @param {JpegFrame} frame */
		function prepareComponents(frame) {
			let maxH = 0;
			let maxV = 0;
			let component;
			let componentId;
			for (componentId in frame.components) if (frame.components.hasOwnProperty(componentId)) {
				component = frame.components[componentId];
				if (maxH < component.h) maxH = component.h;
				if (maxV < component.v) maxV = component.v;
			}
			const mcusPerLine = Math.ceil(frame.samplesPerLine / 8 / maxH);
			const mcusPerColumn = Math.ceil(frame.scanLines / 8 / maxV);
			for (componentId in frame.components) if (frame.components.hasOwnProperty(componentId)) {
				component = frame.components[componentId];
				const blocksPerLine = Math.ceil(Math.ceil(frame.samplesPerLine / 8) * component.h / maxH);
				const blocksPerColumn = Math.ceil(Math.ceil(frame.scanLines / 8) * component.v / maxV);
				const blocksPerLineForMcu = mcusPerLine * component.h;
				const blocksPerColumnForMcu = mcusPerColumn * component.v;
				const blocks = [];
				for (let i = 0; i < blocksPerColumnForMcu; i++) {
					const row = [];
					for (let j = 0; j < blocksPerLineForMcu; j++) row.push(new Int32Array(64));
					blocks.push(row);
				}
				component.blocksPerLine = blocksPerLine;
				component.blocksPerColumn = blocksPerColumn;
				component.blocks = blocks;
			}
			frame.maxH = maxH;
			frame.maxV = maxV;
			frame.mcusPerLine = mcusPerLine;
			frame.mcusPerColumn = mcusPerColumn;
		}
		let fileMarker = readUint16();
		if (fileMarker !== 65496) throw new Error("SOI not found");
		fileMarker = readUint16();
		while (fileMarker !== 65497) {
			switch (fileMarker) {
				case 65280: break;
				case 65504:
				case 65505:
				case 65506:
				case 65507:
				case 65508:
				case 65509:
				case 65510:
				case 65511:
				case 65512:
				case 65513:
				case 65514:
				case 65515:
				case 65516:
				case 65517:
				case 65518:
				case 65519:
				case 65534: {
					const appData = readDataBlock();
					if (fileMarker === 65504) {
						if (appData[0] === 74 && appData[1] === 70 && appData[2] === 73 && appData[3] === 70 && appData[4] === 0) this.jfif = {
							version: {
								major: appData[5],
								minor: appData[6]
							},
							densityUnits: appData[7],
							xDensity: appData[8] << 8 | appData[9],
							yDensity: appData[10] << 8 | appData[11],
							thumbWidth: appData[12],
							thumbHeight: appData[13],
							thumbData: appData.subarray(14, 14 + 3 * appData[12] * appData[13])
						};
					}
					if (fileMarker === 65518) {
						if (appData[0] === 65 && appData[1] === 100 && appData[2] === 111 && appData[3] === 98 && appData[4] === 101 && appData[5] === 0) this.adobe = {
							version: appData[6],
							flags0: appData[7] << 8 | appData[8],
							flags1: appData[9] << 8 | appData[10],
							transformCode: appData[11]
						};
					}
					break;
				}
				case 65499: {
					const quantizationTablesEnd = readUint16() + offset - 2;
					while (offset < quantizationTablesEnd) {
						const quantizationTableSpec = data[offset++];
						const tableData = new Int32Array(64);
						if (quantizationTableSpec >> 4 === 0) for (let j = 0; j < 64; j++) {
							const z = dctZigZag[j];
							tableData[z] = data[offset++];
						}
						else if (quantizationTableSpec >> 4 === 1) for (let j = 0; j < 64; j++) {
							const z = dctZigZag[j];
							tableData[z] = readUint16();
						}
						else throw new Error("DQT: invalid table spec");
						this.quantizationTables[quantizationTableSpec & 15] = tableData;
					}
					break;
				}
				case 65472:
				case 65473:
				case 65474: {
					readUint16();
					/** @type {JpegFrame} */
					const frame = {
						extended: fileMarker === 65473,
						progressive: fileMarker === 65474,
						precision: data[offset++],
						scanLines: readUint16(),
						samplesPerLine: readUint16(),
						/** @type {Object.<string, JpegComponent>} */
						components: {},
						/** @type {number[]} */
						componentsOrder: [],
						maxH: 0,
						maxV: 0,
						mcusPerLine: 0,
						mcusPerColumn: 0
					};
					const componentsCount = data[offset++];
					let componentId;
					for (let i = 0; i < componentsCount; i++) {
						componentId = data[offset];
						const h = data[offset + 1] >> 4;
						const v = data[offset + 1] & 15;
						const qId = data[offset + 2];
						frame.componentsOrder.push(componentId);
						frame.components[componentId] = {
							h,
							v,
							quantizationIdx: qId,
							blocksPerLine: 0,
							blocksPerColumn: 0,
							blocks: []
						};
						offset += 3;
					}
					prepareComponents(frame);
					this.frames.push(frame);
					break;
				}
				case 65476: {
					const huffmanLength = readUint16();
					for (let i = 2; i < huffmanLength;) {
						const huffmanTableSpec = data[offset++];
						const codeLengths = new Uint8Array(16);
						let codeLengthSum = 0;
						for (let j = 0; j < 16; j++, offset++) {
							codeLengths[j] = data[offset];
							codeLengthSum += codeLengths[j];
						}
						const huffmanValues = new Uint8Array(codeLengthSum);
						for (let j = 0; j < codeLengthSum; j++, offset++) huffmanValues[j] = data[offset];
						i += 17 + codeLengthSum;
						if (huffmanTableSpec >> 4 === 0) this.huffmanTablesDC[huffmanTableSpec & 15] = buildHuffmanTable(codeLengths, huffmanValues);
						else this.huffmanTablesAC[huffmanTableSpec & 15] = buildHuffmanTable(codeLengths, huffmanValues);
					}
					break;
				}
				case 65501:
					readUint16();
					this.resetInterval = readUint16();
					break;
				case 65498: {
					readUint16();
					const selectorsCount = data[offset++];
					const components = [];
					const frame = this.frames[0];
					for (let i = 0; i < selectorsCount; i++) {
						const component = frame.components[data[offset++]];
						const tableSpec = data[offset++];
						component.huffmanTableDC = this.huffmanTablesDC[tableSpec >> 4];
						component.huffmanTableAC = this.huffmanTablesAC[tableSpec & 15];
						components.push(component);
					}
					const spectralStart = data[offset++];
					const spectralEnd = data[offset++];
					const successiveApproximation = data[offset++];
					const processed = decodeScan(data, offset, frame, components, this.resetInterval, spectralStart, spectralEnd, successiveApproximation >> 4, successiveApproximation & 15);
					offset += processed;
					break;
				}
				case 65535:
					if (data[offset] !== 255) offset--;
					break;
				default:
					if (data[offset - 3] === 255 && data[offset - 2] >= 192 && data[offset - 2] <= 254) {
						offset -= 3;
						break;
					}
					throw new Error(`unknown JPEG marker ${fileMarker.toString(16)}`);
			}
			fileMarker = readUint16();
		}
	}
	getResult() {
		const { frames } = this;
		if (this.frames.length === 0) throw new Error("no frames were decoded");
		else if (this.frames.length > 1) console.warn("more than one frame is not supported");
		for (let i = 0; i < this.frames.length; i++) {
			const cp = this.frames[i].components;
			for (const j of Object.keys(cp)) {
				const qIdx = cp[j].quantizationIdx;
				if (typeof qIdx === "number") {
					cp[j].quantizationTable = this.quantizationTables[qIdx];
					delete cp[j].quantizationIdx;
				}
			}
		}
		const frame = frames[0];
		if (!frame.maxH || !frame.maxV) throw new Error("Invalid frame dimensions");
		const { components, componentsOrder } = frame;
		const outComponents = [];
		const width = frame.samplesPerLine;
		const height = frame.scanLines;
		for (let i = 0; i < componentsOrder.length; i++) {
			const component = components[componentsOrder[i]];
			outComponents.push({
				lines: buildComponentData(component),
				scaleX: component.h / frame.maxH,
				scaleY: component.v / frame.maxV
			});
		}
		const out = new Uint8Array(width * height * outComponents.length);
		let oi = 0;
		for (let y = 0; y < height; ++y) for (let x = 0; x < width; ++x) for (let i = 0; i < outComponents.length; ++i) {
			const component = outComponents[i];
			out[oi] = component.lines[0 | y * component.scaleY][0 | x * component.scaleX];
			++oi;
		}
		return out;
	}
};
var JpegDecoder = class extends BaseDecoder {
	/**
	* @param {import('./basedecoder.js').BaseDecoderParameters & { JPEGTables?: Uint8Array }} parameters
	*/
	constructor(parameters) {
		super(parameters);
		this.reader = new JpegStreamReader();
		if (parameters.JPEGTables) this.reader.parse(parameters.JPEGTables);
	}
	/** @param {ArrayBuffer} buffer */
	decodeBlock(buffer) {
		this.reader.resetFrames();
		this.reader.parse(new Uint8Array(buffer));
		return this.reader.getResult().buffer;
	}
};
//#endregion
export { JpegDecoder as default };
