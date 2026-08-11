//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
//#region node_modules/geotiff/dist-module/globals.js
/** @import {TypedArray} from './geotiff.js' */
var fieldTypes = {
	BYTE: 1,
	ASCII: 2,
	SHORT: 3,
	LONG: 4,
	RATIONAL: 5,
	SBYTE: 6,
	UNDEFINED: 7,
	SSHORT: 8,
	SLONG: 9,
	SRATIONAL: 10,
	FLOAT: 11,
	DOUBLE: 12,
	IFD: 13,
	LONG8: 16,
	SLONG8: 17,
	IFD8: 18
};
/** @typedef {keyof fieldTypes} FieldTypeName */
/** @typedef {fieldTypes[keyof typeof fieldTypes]} FieldType */
/** @typedef {Record<FieldTypeName, number>} FieldTypeSizes */
var fieldTypeSizes = {
	[fieldTypes.BYTE]: 1,
	[fieldTypes.ASCII]: 1,
	[fieldTypes.SBYTE]: 1,
	[fieldTypes.UNDEFINED]: 1,
	[fieldTypes.SHORT]: 2,
	[fieldTypes.SSHORT]: 2,
	[fieldTypes.LONG]: 4,
	[fieldTypes.SLONG]: 4,
	[fieldTypes.FLOAT]: 4,
	[fieldTypes.IFD]: 4,
	[fieldTypes.RATIONAL]: 8,
	[fieldTypes.SRATIONAL]: 8,
	[fieldTypes.DOUBLE]: 8,
	[fieldTypes.LONG8]: 8,
	[fieldTypes.SLONG8]: 8,
	[fieldTypes.IFD8]: 8
};
/** @typedef {fieldTypeSizes[keyof typeof fieldTypeSizes]} FieldTypeSize */
/**
* Get the byte size for a given field type.
* @param {FieldType} fieldType The TIFF field type constant
* @returns {number} The size in bytes
* @throws {RangeError} If the field type is invalid
*/
function getFieldTypeSize(fieldType) {
	const size = fieldTypeSizes[fieldType];
	if (size === void 0) throw new RangeError(`Invalid field type: ${fieldType}`);
	return size;
}
/**
* @typedef {Object} TagDictionaryEntry
* @property {number} tag
* @property {string} [name]
* @property {number} [type]
* @property {boolean} [isArray]
* @property {boolean} [eager]
*/
var tagDictionary = {
	NewSubfileType: {
		tag: 254,
		type: fieldTypes.LONG,
		eager: true
	},
	SubfileType: {
		tag: 255,
		type: fieldTypes.SHORT,
		eager: true
	},
	ImageWidth: {
		tag: 256,
		type: fieldTypes.SHORT,
		eager: true
	},
	ImageLength: {
		tag: 257,
		type: fieldTypes.SHORT,
		eager: true
	},
	BitsPerSample: {
		tag: 258,
		type: fieldTypes.SHORT,
		isArray: true,
		eager: true
	},
	Compression: {
		tag: 259,
		type: fieldTypes.SHORT,
		eager: true
	},
	PhotometricInterpretation: {
		tag: 262,
		type: fieldTypes.SHORT,
		eager: true
	},
	Threshholding: {
		tag: 263,
		type: fieldTypes.SHORT
	},
	CellWidth: {
		tag: 264,
		type: fieldTypes.SHORT
	},
	CellLength: {
		tag: 265,
		type: fieldTypes.SHORT
	},
	FillOrder: {
		tag: 266,
		type: fieldTypes.SHORT
	},
	DocumentName: {
		tag: 269,
		type: fieldTypes.ASCII
	},
	ImageDescription: {
		tag: 270,
		type: fieldTypes.ASCII
	},
	Make: {
		tag: 271,
		type: fieldTypes.ASCII
	},
	Model: {
		tag: 272,
		type: fieldTypes.ASCII
	},
	StripOffsets: {
		tag: 273,
		type: fieldTypes.SHORT,
		isArray: true
	},
	Orientation: {
		tag: 274,
		type: fieldTypes.SHORT
	},
	SamplesPerPixel: {
		tag: 277,
		type: fieldTypes.SHORT,
		eager: true
	},
	RowsPerStrip: {
		tag: 278,
		type: fieldTypes.SHORT,
		eager: true
	},
	StripByteCounts: {
		tag: 279,
		type: fieldTypes.LONG,
		isArray: true
	},
	MinSampleValue: {
		tag: 280,
		type: fieldTypes.SHORT,
		isArray: true
	},
	MaxSampleValue: {
		tag: 281,
		type: fieldTypes.SHORT,
		isArray: true
	},
	XResolution: {
		tag: 282,
		type: fieldTypes.RATIONAL
	},
	YResolution: {
		tag: 283,
		type: fieldTypes.RATIONAL
	},
	PlanarConfiguration: {
		tag: 284,
		type: fieldTypes.SHORT,
		eager: true
	},
	PageName: {
		tag: 285,
		type: fieldTypes.ASCII
	},
	XPosition: {
		tag: 286,
		type: fieldTypes.RATIONAL
	},
	YPosition: {
		tag: 287,
		type: fieldTypes.RATIONAL
	},
	FreeOffsets: {
		tag: 288,
		type: fieldTypes.LONG
	},
	FreeByteCounts: {
		tag: 289,
		type: fieldTypes.LONG
	},
	GrayResponseUnit: {
		tag: 290,
		type: fieldTypes.SHORT
	},
	GrayResponseCurve: {
		tag: 291,
		type: fieldTypes.SHORT,
		isArray: true
	},
	T4Options: {
		tag: 292,
		type: fieldTypes.LONG
	},
	T6Options: {
		tag: 293,
		type: fieldTypes.LONG
	},
	ResolutionUnit: {
		tag: 296,
		type: fieldTypes.SHORT
	},
	PageNumber: {
		tag: 297,
		type: fieldTypes.SHORT,
		isArray: true
	},
	TransferFunction: {
		tag: 301,
		type: fieldTypes.SHORT,
		isArray: true
	},
	Software: {
		tag: 305,
		type: fieldTypes.ASCII
	},
	DateTime: {
		tag: 306,
		type: fieldTypes.ASCII
	},
	Artist: {
		tag: 315,
		type: fieldTypes.ASCII
	},
	HostComputer: {
		tag: 316,
		type: fieldTypes.ASCII
	},
	Predictor: {
		tag: 317,
		type: fieldTypes.SHORT
	},
	WhitePoint: {
		tag: 318,
		type: fieldTypes.RATIONAL,
		isArray: true
	},
	PrimaryChromaticities: {
		tag: 319,
		type: fieldTypes.RATIONAL,
		isArray: true
	},
	ColorMap: {
		tag: 320,
		type: fieldTypes.SHORT,
		isArray: true
	},
	HalftoneHints: {
		tag: 321,
		type: fieldTypes.SHORT,
		isArray: true
	},
	TileWidth: {
		tag: 322,
		type: fieldTypes.SHORT,
		eager: true
	},
	TileLength: {
		tag: 323,
		type: fieldTypes.SHORT,
		eager: true
	},
	TileOffsets: {
		tag: 324,
		type: fieldTypes.LONG,
		isArray: true
	},
	TileByteCounts: {
		tag: 325,
		type: fieldTypes.SHORT,
		isArray: true
	},
	InkSet: {
		tag: 332,
		type: fieldTypes.SHORT
	},
	InkNames: {
		tag: 333,
		type: fieldTypes.ASCII
	},
	NumberOfInks: {
		tag: 334,
		type: fieldTypes.SHORT
	},
	DotRange: {
		tag: 336,
		type: fieldTypes.BYTE,
		isArray: true
	},
	TargetPrinter: {
		tag: 337,
		type: fieldTypes.ASCII
	},
	ExtraSamples: {
		tag: 338,
		type: fieldTypes.BYTE,
		isArray: true,
		eager: true
	},
	SampleFormat: {
		tag: 339,
		type: fieldTypes.SHORT,
		isArray: true,
		eager: true
	},
	SMinSampleValue: {
		tag: 340,
		isArray: true
	},
	SMaxSampleValue: {
		tag: 341,
		isArray: true
	},
	TransferRange: {
		tag: 342,
		type: fieldTypes.SHORT,
		isArray: true
	},
	JPEGProc: {
		tag: 512,
		type: fieldTypes.SHORT
	},
	JPEGInterchangeFormat: {
		tag: 513,
		type: fieldTypes.LONG
	},
	JPEGInterchangeFormatLngth: {
		tag: 514,
		type: fieldTypes.LONG
	},
	JPEGRestartInterval: {
		tag: 515,
		type: fieldTypes.SHORT
	},
	JPEGLosslessPredictors: {
		tag: 517,
		type: fieldTypes.SHORT,
		isArray: true
	},
	JPEGPointTransforms: {
		tag: 518,
		type: fieldTypes.SHORT,
		isArray: true
	},
	JPEGQTables: {
		tag: 519,
		type: fieldTypes.LONG,
		isArray: true
	},
	JPEGDCTables: {
		tag: 520,
		type: fieldTypes.LONG,
		isArray: true
	},
	JPEGACTables: {
		tag: 521,
		type: fieldTypes.LONG,
		isArray: true
	},
	YCbCrCoefficients: {
		tag: 529,
		type: fieldTypes.RATIONAL,
		isArray: true
	},
	YCbCrSubSampling: {
		tag: 530,
		type: fieldTypes.SHORT,
		isArray: true
	},
	YCbCrPositioning: {
		tag: 531,
		type: fieldTypes.SHORT
	},
	ReferenceBlackWhite: {
		tag: 532,
		type: fieldTypes.LONG,
		isArray: true
	},
	Copyright: {
		tag: 33432,
		type: fieldTypes.ASCII
	},
	BadFaxLines: { tag: 326 },
	CleanFaxData: { tag: 327 },
	ClipPath: { tag: 343 },
	ConsecutiveBadFaxLines: { tag: 328 },
	Decode: { tag: 433 },
	DefaultImageColor: { tag: 434 },
	Indexed: { tag: 346 },
	JPEGTables: {
		tag: 347,
		isArray: true,
		eager: true
	},
	StripRowCounts: {
		tag: 559,
		isArray: true
	},
	SubIFDs: {
		tag: 330,
		isArray: true
	},
	XClipPathUnits: { tag: 344 },
	YClipPathUnits: { tag: 345 },
	ApertureValue: { tag: 37378 },
	ColorSpace: { tag: 40961 },
	DateTimeDigitized: { tag: 36868 },
	DateTimeOriginal: { tag: 36867 },
	ExifIFD: {
		tag: 34665,
		name: "Exif IFD",
		type: fieldTypes.LONG
	},
	ExifVersion: { tag: 36864 },
	ExposureTime: { tag: 33434 },
	FileSource: { tag: 41728 },
	Flash: { tag: 37385 },
	FlashpixVersion: { tag: 40960 },
	FNumber: { tag: 33437 },
	ImageUniqueID: { tag: 42016 },
	LightSource: { tag: 37384 },
	MakerNote: { tag: 37500 },
	ShutterSpeedValue: { tag: 37377 },
	UserComment: { tag: 37510 },
	IPTC: { tag: 33723 },
	CZ_LSMINFO: { tag: 34412 },
	ICCProfile: {
		tag: 34675,
		name: "ICC Profile"
	},
	XMP: { tag: 700 },
	GDAL_METADATA: { tag: 42112 },
	GDAL_NODATA: {
		tag: 42113,
		type: fieldTypes.ASCII,
		eager: true
	},
	Photoshop: { tag: 34377 },
	ModelPixelScale: {
		tag: 33550,
		type: fieldTypes.DOUBLE,
		isArray: true,
		eager: true
	},
	ModelTiepoint: {
		tag: 33922,
		type: fieldTypes.DOUBLE,
		isArray: true,
		eager: true
	},
	ModelTransformation: {
		tag: 34264,
		type: fieldTypes.DOUBLE,
		isArray: true,
		eager: true
	},
	GeoKeyDirectory: {
		tag: 34735,
		type: fieldTypes.SHORT,
		isArray: true,
		eager: true
	},
	GeoDoubleParams: {
		tag: 34736,
		type: fieldTypes.DOUBLE,
		isArray: true,
		eager: true
	},
	GeoAsciiParams: {
		tag: 34737,
		type: fieldTypes.ASCII,
		eager: true
	},
	LercParameters: {
		tag: 50674,
		eager: true
	}
};
/** @typedef {keyof typeof tagDictionary} TagName */
/** @typedef {typeof tagDictionary[keyof typeof tagDictionary]['tag']} Tag */
/**
* @typedef {Extract<keyof typeof tagDictionary,
*   { [K in keyof typeof tagDictionary]: (typeof tagDictionary)[K] extends { eager: true }
*   ? K : never }[keyof typeof tagDictionary]>} EagerTagName
*/
/**
* @typedef {Extract<Tag, { [K in keyof typeof tagDictionary]: (typeof tagDictionary)[K] extends { eager: true }
*   ? (typeof tagDictionary)[K]['tag'] : never }[keyof typeof tagDictionary]>} EagerTag
*/
/** @typedef {Extract<typeof tagDictionary[keyof typeof tagDictionary], {type: any}>['type']} TagType */
/**
* @template {number} T
* @typedef {T extends 2 ? string : number} GeoTiffPrimitive
*/
/**
* @template {TagName} T
* @typedef {typeof tagDictionary[T]} TagDef
*/
/**
* @typedef {{
*   1: number;
*   2: string;
*   3: number;
*   4: number;
*   5: number;
*   6: number;
*   7: ArrayBuffer;
*   8: number;
*   9: number;
*   10: number;
*   11: number;
*   12: number;
*   16: number;
*   17: number;
*   18: number;
* }} FieldTypeMap
*/
/**
* @template {TagName} T
* @typedef {TagDef<T> extends { isArray: true }
*   ? (TagDef<T> extends { type: typeof fieldTypes.DOUBLE } ? number[] :
*      TagDef<T> extends { type: typeof fieldTypes.ASCII } ? string[] :
*      TagDef<T> extends { type: typeof fieldTypes.BYTE | typeof fieldTypes.SBYTE | typeof fieldTypes.UNDEFINED }
*        ? Uint8Array | Int8Array :
*      (number[] | TypedArray))
*   : (TagDef<T> extends { type: keyof FieldTypeMap } ? FieldTypeMap[TagDef<T>['type']] : any)} TagValue
*/
/**
* Maps tag names to their numeric values
* @type {Record<string, number>}
*/
var tags = {};
/**
* Maps tag numbers to their definitions
* @type {Record<number, { tag: number, name: string, type: string|number|undefined, isArray: boolean, eager: boolean }>}
*/
var tagDefinitions = {};
/**
* Registers a new field tag
* @param {number} tag the numeric tiff tag
* @param {string} name the name of the tag that will be reported in the IFD
* @param {keyof fieldTypes|number|undefined} type the tags data type
* @param {Boolean} isArray whether the tag is an array
* @param {boolean} [eager=false] whether to eagerly fetch deferred fields.
*                                 When false (default), tags are loaded lazily on-demand.
*                                 When true, all tags are loaded immediately during parsing.
*/
function registerTag(tag, name, type, isArray = false, eager = false) {
	tags[name] = tag;
	tagDefinitions[tag] = {
		tag,
		name,
		type: typeof type === "string" ? fieldTypes[type] : type,
		isArray,
		eager
	};
}
for (const [key, value] of Object.entries(tagDictionary)) {
	const entry = value;
	registerTag(entry.tag, entry.name || key, entry.type, entry.isArray, entry.eager);
}
/**
* @param {number|string} tagIdentifier The field tag ID or name
* @returns {number} the resolved tag ID
*/
function resolveTag(tagIdentifier) {
	if (typeof tagIdentifier === "number") return tagIdentifier;
	return tags[tagIdentifier];
}
var photometricInterpretations = {
	WhiteIsZero: 0,
	BlackIsZero: 1,
	RGB: 2,
	Palette: 3,
	TransparencyMask: 4,
	CMYK: 5,
	YCbCr: 6,
	CIELab: 8,
	ICCLab: 9
};
var ExtraSamplesValues = {
	Unspecified: 0,
	Assocalpha: 1,
	Unassalpha: 2
};
var LercParameters = {
	Version: 0,
	AddCompression: 1
};
var LercAddCompression = {
	None: 0,
	Deflate: 1,
	Zstandard: 2
};
var geoKeyNames = {
	1024: "GTModelTypeGeoKey",
	1025: "GTRasterTypeGeoKey",
	1026: "GTCitationGeoKey",
	2048: "GeographicTypeGeoKey",
	2049: "GeogCitationGeoKey",
	2050: "GeogGeodeticDatumGeoKey",
	2051: "GeogPrimeMeridianGeoKey",
	2052: "GeogLinearUnitsGeoKey",
	2053: "GeogLinearUnitSizeGeoKey",
	2054: "GeogAngularUnitsGeoKey",
	2055: "GeogAngularUnitSizeGeoKey",
	2056: "GeogEllipsoidGeoKey",
	2057: "GeogSemiMajorAxisGeoKey",
	2058: "GeogSemiMinorAxisGeoKey",
	2059: "GeogInvFlatteningGeoKey",
	2060: "GeogAzimuthUnitsGeoKey",
	2061: "GeogPrimeMeridianLongGeoKey",
	2062: "GeogTOWGS84GeoKey",
	3072: "ProjectedCSTypeGeoKey",
	3073: "PCSCitationGeoKey",
	3074: "ProjectionGeoKey",
	3075: "ProjCoordTransGeoKey",
	3076: "ProjLinearUnitsGeoKey",
	3077: "ProjLinearUnitSizeGeoKey",
	3078: "ProjStdParallel1GeoKey",
	3079: "ProjStdParallel2GeoKey",
	3080: "ProjNatOriginLongGeoKey",
	3081: "ProjNatOriginLatGeoKey",
	3082: "ProjFalseEastingGeoKey",
	3083: "ProjFalseNorthingGeoKey",
	3084: "ProjFalseOriginLongGeoKey",
	3085: "ProjFalseOriginLatGeoKey",
	3086: "ProjFalseOriginEastingGeoKey",
	3087: "ProjFalseOriginNorthingGeoKey",
	3088: "ProjCenterLongGeoKey",
	3089: "ProjCenterLatGeoKey",
	3090: "ProjCenterEastingGeoKey",
	3091: "ProjCenterNorthingGeoKey",
	3092: "ProjScaleAtNatOriginGeoKey",
	3093: "ProjScaleAtCenterGeoKey",
	3094: "ProjAzimuthAngleGeoKey",
	3095: "ProjStraightVertPoleLongGeoKey",
	3096: "ProjRectifiedGridAngleGeoKey",
	4096: "VerticalCSTypeGeoKey",
	4097: "VerticalCitationGeoKey",
	4098: "VerticalDatumGeoKey",
	4099: "VerticalUnitsGeoKey"
};
/** @typedef {geoKeyNames[keyof typeof geoKeyNames]} GeoKeyName */
/**
* @type {Record<GeoKeyName, number>}
*/
var geoKeys = {};
for (const [key, name] of Object.entries(geoKeyNames)) geoKeys[name] = parseInt(key, 10);
//#endregion
export { geoKeyNames as a, resolveTag as c, __toESM as d, fieldTypes as i, tagDefinitions as l, LercAddCompression as n, getFieldTypeSize as o, LercParameters as r, photometricInterpretations as s, ExtraSamplesValues as t, __commonJSMin as u };
