//#region node_modules/flatbuffers/mjs/utils.js
var int32 = new Int32Array(2);
var float32 = new Float32Array(int32.buffer);
var float64 = new Float64Array(int32.buffer);
var isLittleEndian = new Uint16Array(new Uint8Array([1, 0]).buffer)[0] === 1;
//#endregion
//#region node_modules/flatbuffers/mjs/encoding.js
var Encoding;
(function(Encoding) {
	Encoding[Encoding["UTF8_BYTES"] = 1] = "UTF8_BYTES";
	Encoding[Encoding["UTF16_STRING"] = 2] = "UTF16_STRING";
})(Encoding || (Encoding = {}));
//#endregion
//#region node_modules/flatbuffers/mjs/byte-buffer.js
var ByteBuffer = class ByteBuffer {
	/**
	* Create a new ByteBuffer with a given array of bytes (`Uint8Array`)
	*/
	constructor(bytes_) {
		this.bytes_ = bytes_;
		this.position_ = 0;
		this.text_decoder_ = new TextDecoder();
	}
	/**
	* Create and allocate a new ByteBuffer with a given size.
	*/
	static allocate(byte_size) {
		return new ByteBuffer(new Uint8Array(byte_size));
	}
	clear() {
		this.position_ = 0;
	}
	/**
	* Get the underlying `Uint8Array`.
	*/
	bytes() {
		return this.bytes_;
	}
	/**
	* Get the buffer's position.
	*/
	position() {
		return this.position_;
	}
	/**
	* Set the buffer's position.
	*/
	setPosition(position) {
		this.position_ = position;
	}
	/**
	* Get the buffer's capacity.
	*/
	capacity() {
		return this.bytes_.length;
	}
	readInt8(offset) {
		return this.readUint8(offset) << 24 >> 24;
	}
	readUint8(offset) {
		return this.bytes_[offset];
	}
	readInt16(offset) {
		return this.readUint16(offset) << 16 >> 16;
	}
	readUint16(offset) {
		return this.bytes_[offset] | this.bytes_[offset + 1] << 8;
	}
	readInt32(offset) {
		return this.bytes_[offset] | this.bytes_[offset + 1] << 8 | this.bytes_[offset + 2] << 16 | this.bytes_[offset + 3] << 24;
	}
	readUint32(offset) {
		return this.readInt32(offset) >>> 0;
	}
	readInt64(offset) {
		return BigInt.asIntN(64, BigInt(this.readUint32(offset)) + (BigInt(this.readUint32(offset + 4)) << BigInt(32)));
	}
	readUint64(offset) {
		return BigInt.asUintN(64, BigInt(this.readUint32(offset)) + (BigInt(this.readUint32(offset + 4)) << BigInt(32)));
	}
	readFloat32(offset) {
		int32[0] = this.readInt32(offset);
		return float32[0];
	}
	readFloat64(offset) {
		int32[isLittleEndian ? 0 : 1] = this.readInt32(offset);
		int32[isLittleEndian ? 1 : 0] = this.readInt32(offset + 4);
		return float64[0];
	}
	writeInt8(offset, value) {
		this.bytes_[offset] = value;
	}
	writeUint8(offset, value) {
		this.bytes_[offset] = value;
	}
	writeInt16(offset, value) {
		this.bytes_[offset] = value;
		this.bytes_[offset + 1] = value >> 8;
	}
	writeUint16(offset, value) {
		this.bytes_[offset] = value;
		this.bytes_[offset + 1] = value >> 8;
	}
	writeInt32(offset, value) {
		this.bytes_[offset] = value;
		this.bytes_[offset + 1] = value >> 8;
		this.bytes_[offset + 2] = value >> 16;
		this.bytes_[offset + 3] = value >> 24;
	}
	writeUint32(offset, value) {
		this.bytes_[offset] = value;
		this.bytes_[offset + 1] = value >> 8;
		this.bytes_[offset + 2] = value >> 16;
		this.bytes_[offset + 3] = value >> 24;
	}
	writeInt64(offset, value) {
		this.writeInt32(offset, Number(BigInt.asIntN(32, value)));
		this.writeInt32(offset + 4, Number(BigInt.asIntN(32, value >> BigInt(32))));
	}
	writeUint64(offset, value) {
		this.writeUint32(offset, Number(BigInt.asUintN(32, value)));
		this.writeUint32(offset + 4, Number(BigInt.asUintN(32, value >> BigInt(32))));
	}
	writeFloat32(offset, value) {
		float32[0] = value;
		this.writeInt32(offset, int32[0]);
	}
	writeFloat64(offset, value) {
		float64[0] = value;
		this.writeInt32(offset, int32[isLittleEndian ? 0 : 1]);
		this.writeInt32(offset + 4, int32[isLittleEndian ? 1 : 0]);
	}
	/**
	* Return the file identifier.   Behavior is undefined for FlatBuffers whose
	* schema does not include a file_identifier (likely points at padding or the
	* start of a the root vtable).
	*/
	getBufferIdentifier() {
		if (this.bytes_.length < this.position_ + 4 + 4) throw new Error("FlatBuffers: ByteBuffer is too short to contain an identifier.");
		let result = "";
		for (let i = 0; i < 4; i++) result += String.fromCharCode(this.readInt8(this.position_ + 4 + i));
		return result;
	}
	/**
	* Look up a field in the vtable, return an offset into the object, or 0 if the
	* field is not present.
	*/
	__offset(bb_pos, vtable_offset) {
		const vtable = bb_pos - this.readInt32(bb_pos);
		return vtable_offset < this.readInt16(vtable) ? this.readInt16(vtable + vtable_offset) : 0;
	}
	/**
	* Initialize any Table-derived type to point to the union at the given offset.
	*/
	__union(t, offset) {
		t.bb_pos = offset + this.readInt32(offset);
		t.bb = this;
		return t;
	}
	/**
	* Create a JavaScript string from UTF-8 data stored inside the FlatBuffer.
	* This allocates a new string and converts to wide chars upon each access.
	*
	* To avoid the conversion to string, pass Encoding.UTF8_BYTES as the
	* "optionalEncoding" argument. This is useful for avoiding conversion when
	* the data will just be packaged back up in another FlatBuffer later on.
	*
	* @param offset
	* @param opt_encoding Defaults to UTF16_STRING
	*/
	__string(offset, opt_encoding) {
		offset += this.readInt32(offset);
		const length = this.readInt32(offset);
		offset += 4;
		const utf8bytes = this.bytes_.subarray(offset, offset + length);
		if (opt_encoding === Encoding.UTF8_BYTES) return utf8bytes;
		else return this.text_decoder_.decode(utf8bytes);
	}
	/**
	* Handle unions that can contain string as its member, if a Table-derived type then initialize it,
	* if a string then return a new one
	*
	* WARNING: strings are immutable in JS so we can't change the string that the user gave us, this
	* makes the behaviour of __union_with_string different compared to __union
	*/
	__union_with_string(o, offset) {
		if (typeof o === "string") return this.__string(offset);
		return this.__union(o, offset);
	}
	/**
	* Retrieve the relative offset stored at "offset"
	*/
	__indirect(offset) {
		return offset + this.readInt32(offset);
	}
	/**
	* Get the start of data of a vector whose offset is stored at "offset" in this object.
	*/
	__vector(offset) {
		return offset + this.readInt32(offset) + 4;
	}
	/**
	* Get the length of a vector whose offset is stored at "offset" in this object.
	*/
	__vector_len(offset) {
		return this.readInt32(offset + this.readInt32(offset));
	}
	__has_identifier(ident) {
		if (ident.length != 4) throw new Error("FlatBuffers: file identifier must be length 4");
		for (let i = 0; i < 4; i++) if (ident.charCodeAt(i) != this.readInt8(this.position() + 4 + i)) return false;
		return true;
	}
	/**
	* A helper function for generating list for obj api
	*/
	createScalarList(listAccessor, listLength) {
		const ret = [];
		for (let i = 0; i < listLength; ++i) {
			const val = listAccessor(i);
			if (val !== null) ret.push(val);
		}
		return ret;
	}
	/**
	* A helper function for generating list for obj api
	* @param listAccessor function that accepts an index and return data at that index
	* @param listLength listLength
	* @param res result list
	*/
	createObjList(listAccessor, listLength) {
		const ret = [];
		for (let i = 0; i < listLength; ++i) {
			const val = listAccessor(i);
			if (val !== null) ret.push(val.unpack());
		}
		return ret;
	}
};
//#endregion
//#region node_modules/slice-source/empty.js
var empty_default = new Uint8Array(0);
//#endregion
//#region node_modules/slice-source/cancel.js
function cancel_default() {
	return this._source.cancel();
}
//#endregion
//#region node_modules/slice-source/concat.js
function concat(a, b) {
	if (!a.length) return b;
	if (!b.length) return a;
	var c = new Uint8Array(a.length + b.length);
	c.set(a);
	c.set(b, a.length);
	return c;
}
//#endregion
//#region node_modules/slice-source/read.js
function read_default() {
	var that = this, array = that._array.subarray(that._index);
	return that._source.read().then(function(result) {
		that._array = empty_default;
		that._index = 0;
		return result.done ? array.length > 0 ? {
			done: false,
			value: array
		} : {
			done: true,
			value: void 0
		} : {
			done: false,
			value: concat(array, result.value)
		};
	});
}
//#endregion
//#region node_modules/slice-source/slice.js
function slice_default(length) {
	if ((length |= 0) < 0) throw new Error("invalid length");
	var that = this, index = this._array.length - this._index;
	if (this._index + length <= this._array.length) return Promise.resolve(this._array.subarray(this._index, this._index += length));
	var array = new Uint8Array(length);
	array.set(this._array.subarray(this._index));
	return (function read() {
		return that._source.read().then(function(result) {
			if (result.done) {
				that._array = empty_default;
				that._index = 0;
				return index > 0 ? array.subarray(0, index) : null;
			}
			if (index + result.value.length >= length) {
				that._array = result.value;
				that._index = length - index;
				array.set(result.value.subarray(0, length - index), index);
				return array;
			}
			array.set(result.value, index);
			index += result.value.length;
			return read();
		});
	})();
}
//#endregion
//#region node_modules/slice-source/index.js
function slice(source) {
	return typeof source.slice === "function" ? source : new SliceSource(typeof source.read === "function" ? source : source.getReader());
}
function SliceSource(source) {
	this._source = source;
	this._array = empty_default;
	this._index = 0;
}
SliceSource.prototype.read = read_default;
SliceSource.prototype.slice = slice_default;
SliceSource.prototype.cancel = cancel_default;
//#endregion
//#region node_modules/flatgeobuf/lib/mjs/flat-geobuf/column-type.js
var o;
var ColumnType = ((o = {})[o.Byte = 0] = "Byte", o[o.UByte = 1] = "UByte", o[o.Bool = 2] = "Bool", o[o.Short = 3] = "Short", o[o.UShort = 4] = "UShort", o[o.Int = 5] = "Int", o[o.UInt = 6] = "UInt", o[o.Long = 7] = "Long", o[o.ULong = 8] = "ULong", o[o.Float = 9] = "Float", o[o.Double = 10] = "Double", o[o.String = 11] = "String", o[o.Json = 12] = "Json", o[o.DateTime = 13] = "DateTime", o[o.Binary = 14] = "Binary", o);
//#endregion
//#region node_modules/flatgeobuf/lib/mjs/flat-geobuf/column.js
var Column = class Column {
	bb = null;
	bb_pos = 0;
	__init(t, s) {
		return this.bb_pos = t, this.bb = s, this;
	}
	static getRootAsColumn(t, s) {
		return (s || new Column()).__init(t.readInt32(t.position()) + t.position(), t);
	}
	static getSizePrefixedRootAsColumn(s, i) {
		return s.setPosition(s.position() + 4), (i || new Column()).__init(s.readInt32(s.position()) + s.position(), s);
	}
	name(t) {
		let s = this.bb.__offset(this.bb_pos, 4);
		return s ? this.bb.__string(this.bb_pos + s, t) : null;
	}
	type() {
		let t = this.bb.__offset(this.bb_pos, 6);
		return t ? this.bb.readUint8(this.bb_pos + t) : ColumnType.Byte;
	}
	title(t) {
		let s = this.bb.__offset(this.bb_pos, 8);
		return s ? this.bb.__string(this.bb_pos + s, t) : null;
	}
	description(t) {
		let s = this.bb.__offset(this.bb_pos, 10);
		return s ? this.bb.__string(this.bb_pos + s, t) : null;
	}
	width() {
		let t = this.bb.__offset(this.bb_pos, 12);
		return t ? this.bb.readInt32(this.bb_pos + t) : -1;
	}
	precision() {
		let t = this.bb.__offset(this.bb_pos, 14);
		return t ? this.bb.readInt32(this.bb_pos + t) : -1;
	}
	scale() {
		let t = this.bb.__offset(this.bb_pos, 16);
		return t ? this.bb.readInt32(this.bb_pos + t) : -1;
	}
	nullable() {
		let t = this.bb.__offset(this.bb_pos, 18);
		return !t || !!this.bb.readInt8(this.bb_pos + t);
	}
	unique() {
		let t = this.bb.__offset(this.bb_pos, 20);
		return !!t && !!this.bb.readInt8(this.bb_pos + t);
	}
	primaryKey() {
		let t = this.bb.__offset(this.bb_pos, 22);
		return !!t && !!this.bb.readInt8(this.bb_pos + t);
	}
	metadata(t) {
		let s = this.bb.__offset(this.bb_pos, 24);
		return s ? this.bb.__string(this.bb_pos + s, t) : null;
	}
	static startColumn(t) {
		t.startObject(11);
	}
	static addName(t, s) {
		t.addFieldOffset(0, s, 0);
	}
	static addType(t, i) {
		t.addFieldInt8(1, i, ColumnType.Byte);
	}
	static addTitle(t, s) {
		t.addFieldOffset(2, s, 0);
	}
	static addDescription(t, s) {
		t.addFieldOffset(3, s, 0);
	}
	static addWidth(t, s) {
		t.addFieldInt32(4, s, -1);
	}
	static addPrecision(t, s) {
		t.addFieldInt32(5, s, -1);
	}
	static addScale(t, s) {
		t.addFieldInt32(6, s, -1);
	}
	static addNullable(t, s) {
		t.addFieldInt8(7, +s, 1);
	}
	static addUnique(t, s) {
		t.addFieldInt8(8, +s, 0);
	}
	static addPrimaryKey(t, s) {
		t.addFieldInt8(9, +s, 0);
	}
	static addMetadata(t, s) {
		t.addFieldOffset(10, s, 0);
	}
	static endColumn(t) {
		let s = t.endObject();
		return t.requiredField(s, 4), s;
	}
	static createColumn(t, s, i, e, b, d, n, a, o, l, r, _) {
		return Column.startColumn(t), Column.addName(t, s), Column.addType(t, i), Column.addTitle(t, e), Column.addDescription(t, b), Column.addWidth(t, d), Column.addPrecision(t, n), Column.addScale(t, a), Column.addNullable(t, o), Column.addUnique(t, l), Column.addPrimaryKey(t, r), Column.addMetadata(t, _), Column.endColumn(t);
	}
};
//#endregion
//#region node_modules/flatgeobuf/lib/mjs/flat-geobuf/crs.js
var Crs = class Crs {
	bb = null;
	bb_pos = 0;
	__init(t, s) {
		return this.bb_pos = t, this.bb = s, this;
	}
	static getRootAsCrs(t, s) {
		return (s || new Crs()).__init(t.readInt32(t.position()) + t.position(), t);
	}
	static getSizePrefixedRootAsCrs(s, i) {
		return s.setPosition(s.position() + 4), (i || new Crs()).__init(s.readInt32(s.position()) + s.position(), s);
	}
	org(t) {
		let s = this.bb.__offset(this.bb_pos, 4);
		return s ? this.bb.__string(this.bb_pos + s, t) : null;
	}
	code() {
		let t = this.bb.__offset(this.bb_pos, 6);
		return t ? this.bb.readInt32(this.bb_pos + t) : 0;
	}
	name(t) {
		let s = this.bb.__offset(this.bb_pos, 8);
		return s ? this.bb.__string(this.bb_pos + s, t) : null;
	}
	description(t) {
		let s = this.bb.__offset(this.bb_pos, 10);
		return s ? this.bb.__string(this.bb_pos + s, t) : null;
	}
	wkt(t) {
		let s = this.bb.__offset(this.bb_pos, 12);
		return s ? this.bb.__string(this.bb_pos + s, t) : null;
	}
	codeString(t) {
		let s = this.bb.__offset(this.bb_pos, 14);
		return s ? this.bb.__string(this.bb_pos + s, t) : null;
	}
	static startCrs(t) {
		t.startObject(6);
	}
	static addOrg(t, s) {
		t.addFieldOffset(0, s, 0);
	}
	static addCode(t, s) {
		t.addFieldInt32(1, s, 0);
	}
	static addName(t, s) {
		t.addFieldOffset(2, s, 0);
	}
	static addDescription(t, s) {
		t.addFieldOffset(3, s, 0);
	}
	static addWkt(t, s) {
		t.addFieldOffset(4, s, 0);
	}
	static addCodeString(t, s) {
		t.addFieldOffset(5, s, 0);
	}
	static endCrs(t) {
		return t.endObject();
	}
	static createCrs(t, s, i, e, r, b, d) {
		return Crs.startCrs(t), Crs.addOrg(t, s), Crs.addCode(t, i), Crs.addName(t, e), Crs.addDescription(t, r), Crs.addWkt(t, b), Crs.addCodeString(t, d), Crs.endCrs(t);
	}
};
//#endregion
//#region node_modules/flatgeobuf/lib/mjs/flat-geobuf/geometry-type.js
var r;
var GeometryType = ((r = {})[r.Unknown = 0] = "Unknown", r[r.Point = 1] = "Point", r[r.LineString = 2] = "LineString", r[r.Polygon = 3] = "Polygon", r[r.MultiPoint = 4] = "MultiPoint", r[r.MultiLineString = 5] = "MultiLineString", r[r.MultiPolygon = 6] = "MultiPolygon", r[r.GeometryCollection = 7] = "GeometryCollection", r[r.CircularString = 8] = "CircularString", r[r.CompoundCurve = 9] = "CompoundCurve", r[r.CurvePolygon = 10] = "CurvePolygon", r[r.MultiCurve = 11] = "MultiCurve", r[r.MultiSurface = 12] = "MultiSurface", r[r.Curve = 13] = "Curve", r[r.Surface = 14] = "Surface", r[r.PolyhedralSurface = 15] = "PolyhedralSurface", r[r.TIN = 16] = "TIN", r[r.Triangle = 17] = "Triangle", r);
//#endregion
//#region node_modules/flatgeobuf/lib/mjs/flat-geobuf/header.js
var Header = class Header {
	bb = null;
	bb_pos = 0;
	__init(t, s) {
		return this.bb_pos = t, this.bb = s, this;
	}
	static getRootAsHeader(t, s) {
		return (s || new Header()).__init(t.readInt32(t.position()) + t.position(), t);
	}
	static getSizePrefixedRootAsHeader(s, e) {
		return s.setPosition(s.position() + 4), (e || new Header()).__init(s.readInt32(s.position()) + s.position(), s);
	}
	name(t) {
		let s = this.bb.__offset(this.bb_pos, 4);
		return s ? this.bb.__string(this.bb_pos + s, t) : null;
	}
	envelope(t) {
		let s = this.bb.__offset(this.bb_pos, 6);
		return s ? this.bb.readFloat64(this.bb.__vector(this.bb_pos + s) + 8 * t) : 0;
	}
	envelopeLength() {
		let t = this.bb.__offset(this.bb_pos, 6);
		return t ? this.bb.__vector_len(this.bb_pos + t) : 0;
	}
	envelopeArray() {
		let t = this.bb.__offset(this.bb_pos, 6);
		return t ? new Float64Array(this.bb.bytes().buffer, this.bb.bytes().byteOffset + this.bb.__vector(this.bb_pos + t), this.bb.__vector_len(this.bb_pos + t)) : null;
	}
	geometryType() {
		let t = this.bb.__offset(this.bb_pos, 8);
		return t ? this.bb.readUint8(this.bb_pos + t) : GeometryType.Unknown;
	}
	hasZ() {
		let t = this.bb.__offset(this.bb_pos, 10);
		return !!t && !!this.bb.readInt8(this.bb_pos + t);
	}
	hasM() {
		let t = this.bb.__offset(this.bb_pos, 12);
		return !!t && !!this.bb.readInt8(this.bb_pos + t);
	}
	hasT() {
		let t = this.bb.__offset(this.bb_pos, 14);
		return !!t && !!this.bb.readInt8(this.bb_pos + t);
	}
	hasTm() {
		let t = this.bb.__offset(this.bb_pos, 16);
		return !!t && !!this.bb.readInt8(this.bb_pos + t);
	}
	columns(t, e) {
		let i = this.bb.__offset(this.bb_pos, 18);
		return i ? (e || new Column()).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos + i) + 4 * t), this.bb) : null;
	}
	columnsLength() {
		let t = this.bb.__offset(this.bb_pos, 18);
		return t ? this.bb.__vector_len(this.bb_pos + t) : 0;
	}
	featuresCount() {
		let t = this.bb.__offset(this.bb_pos, 20);
		return t ? this.bb.readUint64(this.bb_pos + t) : BigInt("0");
	}
	indexNodeSize() {
		let t = this.bb.__offset(this.bb_pos, 22);
		return t ? this.bb.readUint16(this.bb_pos + t) : 16;
	}
	crs(t) {
		let s = this.bb.__offset(this.bb_pos, 24);
		return s ? (t || new Crs()).__init(this.bb.__indirect(this.bb_pos + s), this.bb) : null;
	}
	title(t) {
		let s = this.bb.__offset(this.bb_pos, 26);
		return s ? this.bb.__string(this.bb_pos + s, t) : null;
	}
	description(t) {
		let s = this.bb.__offset(this.bb_pos, 28);
		return s ? this.bb.__string(this.bb_pos + s, t) : null;
	}
	metadata(t) {
		let s = this.bb.__offset(this.bb_pos, 30);
		return s ? this.bb.__string(this.bb_pos + s, t) : null;
	}
	static startHeader(t) {
		t.startObject(14);
	}
	static addName(t, s) {
		t.addFieldOffset(0, s, 0);
	}
	static addEnvelope(t, s) {
		t.addFieldOffset(1, s, 0);
	}
	static createEnvelopeVector(t, s) {
		t.startVector(8, s.length, 8);
		for (let e = s.length - 1; e >= 0; e--) t.addFloat64(s[e]);
		return t.endVector();
	}
	static startEnvelopeVector(t, s) {
		t.startVector(8, s, 8);
	}
	static addGeometryType(t, s) {
		t.addFieldInt8(2, s, GeometryType.Unknown);
	}
	static addHasZ(t, s) {
		t.addFieldInt8(3, +s, 0);
	}
	static addHasM(t, s) {
		t.addFieldInt8(4, +s, 0);
	}
	static addHasT(t, s) {
		t.addFieldInt8(5, +s, 0);
	}
	static addHasTm(t, s) {
		t.addFieldInt8(6, +s, 0);
	}
	static addColumns(t, s) {
		t.addFieldOffset(7, s, 0);
	}
	static createColumnsVector(t, s) {
		t.startVector(4, s.length, 4);
		for (let e = s.length - 1; e >= 0; e--) t.addOffset(s[e]);
		return t.endVector();
	}
	static startColumnsVector(t, s) {
		t.startVector(4, s, 4);
	}
	static addFeaturesCount(t, s) {
		t.addFieldInt64(8, s, BigInt("0"));
	}
	static addIndexNodeSize(t, s) {
		t.addFieldInt16(9, s, 16);
	}
	static addCrs(t, s) {
		t.addFieldOffset(10, s, 0);
	}
	static addTitle(t, s) {
		t.addFieldOffset(11, s, 0);
	}
	static addDescription(t, s) {
		t.addFieldOffset(12, s, 0);
	}
	static addMetadata(t, s) {
		t.addFieldOffset(13, s, 0);
	}
	static endHeader(t) {
		return t.endObject();
	}
	static finishHeaderBuffer(t, s) {
		t.finish(s);
	}
	static finishSizePrefixedHeaderBuffer(t, s) {
		t.finish(s, void 0, !0);
	}
};
//#endregion
//#region node_modules/flatgeobuf/lib/mjs/flat-geobuf/geometry.js
var Geometry = class Geometry {
	bb = null;
	bb_pos = 0;
	__init(t, e) {
		return this.bb_pos = t, this.bb = e, this;
	}
	static getRootAsGeometry(t, e) {
		return (e || new Geometry()).__init(t.readInt32(t.position()) + t.position(), t);
	}
	static getSizePrefixedRootAsGeometry(e, s) {
		return e.setPosition(e.position() + 4), (s || new Geometry()).__init(e.readInt32(e.position()) + e.position(), e);
	}
	ends(t) {
		let e = this.bb.__offset(this.bb_pos, 4);
		return e ? this.bb.readUint32(this.bb.__vector(this.bb_pos + e) + 4 * t) : 0;
	}
	endsLength() {
		let t = this.bb.__offset(this.bb_pos, 4);
		return t ? this.bb.__vector_len(this.bb_pos + t) : 0;
	}
	endsArray() {
		let t = this.bb.__offset(this.bb_pos, 4);
		return t ? new Uint32Array(this.bb.bytes().buffer, this.bb.bytes().byteOffset + this.bb.__vector(this.bb_pos + t), this.bb.__vector_len(this.bb_pos + t)) : null;
	}
	xy(t) {
		let e = this.bb.__offset(this.bb_pos, 6);
		return e ? this.bb.readFloat64(this.bb.__vector(this.bb_pos + e) + 8 * t) : 0;
	}
	xyLength() {
		let t = this.bb.__offset(this.bb_pos, 6);
		return t ? this.bb.__vector_len(this.bb_pos + t) : 0;
	}
	xyArray() {
		let t = this.bb.__offset(this.bb_pos, 6);
		return t ? new Float64Array(this.bb.bytes().buffer, this.bb.bytes().byteOffset + this.bb.__vector(this.bb_pos + t), this.bb.__vector_len(this.bb_pos + t)) : null;
	}
	z(t) {
		let e = this.bb.__offset(this.bb_pos, 8);
		return e ? this.bb.readFloat64(this.bb.__vector(this.bb_pos + e) + 8 * t) : 0;
	}
	zLength() {
		let t = this.bb.__offset(this.bb_pos, 8);
		return t ? this.bb.__vector_len(this.bb_pos + t) : 0;
	}
	zArray() {
		let t = this.bb.__offset(this.bb_pos, 8);
		return t ? new Float64Array(this.bb.bytes().buffer, this.bb.bytes().byteOffset + this.bb.__vector(this.bb_pos + t), this.bb.__vector_len(this.bb_pos + t)) : null;
	}
	m(t) {
		let e = this.bb.__offset(this.bb_pos, 10);
		return e ? this.bb.readFloat64(this.bb.__vector(this.bb_pos + e) + 8 * t) : 0;
	}
	mLength() {
		let t = this.bb.__offset(this.bb_pos, 10);
		return t ? this.bb.__vector_len(this.bb_pos + t) : 0;
	}
	mArray() {
		let t = this.bb.__offset(this.bb_pos, 10);
		return t ? new Float64Array(this.bb.bytes().buffer, this.bb.bytes().byteOffset + this.bb.__vector(this.bb_pos + t), this.bb.__vector_len(this.bb_pos + t)) : null;
	}
	t(t) {
		let e = this.bb.__offset(this.bb_pos, 12);
		return e ? this.bb.readFloat64(this.bb.__vector(this.bb_pos + e) + 8 * t) : 0;
	}
	tLength() {
		let t = this.bb.__offset(this.bb_pos, 12);
		return t ? this.bb.__vector_len(this.bb_pos + t) : 0;
	}
	tArray() {
		let t = this.bb.__offset(this.bb_pos, 12);
		return t ? new Float64Array(this.bb.bytes().buffer, this.bb.bytes().byteOffset + this.bb.__vector(this.bb_pos + t), this.bb.__vector_len(this.bb_pos + t)) : null;
	}
	tm(t) {
		let e = this.bb.__offset(this.bb_pos, 14);
		return e ? this.bb.readUint64(this.bb.__vector(this.bb_pos + e) + 8 * t) : BigInt(0);
	}
	tmLength() {
		let t = this.bb.__offset(this.bb_pos, 14);
		return t ? this.bb.__vector_len(this.bb_pos + t) : 0;
	}
	type() {
		let t = this.bb.__offset(this.bb_pos, 16);
		return t ? this.bb.readUint8(this.bb_pos + t) : GeometryType.Unknown;
	}
	parts(t, e) {
		let s = this.bb.__offset(this.bb_pos, 18);
		return s ? (e || new Geometry()).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos + s) + 4 * t), this.bb) : null;
	}
	partsLength() {
		let t = this.bb.__offset(this.bb_pos, 18);
		return t ? this.bb.__vector_len(this.bb_pos + t) : 0;
	}
	static startGeometry(t) {
		t.startObject(8);
	}
	static addEnds(t, e) {
		t.addFieldOffset(0, e, 0);
	}
	static createEndsVector(t, e) {
		t.startVector(4, e.length, 4);
		for (let s = e.length - 1; s >= 0; s--) t.addInt32(e[s]);
		return t.endVector();
	}
	static startEndsVector(t, e) {
		t.startVector(4, e, 4);
	}
	static addXy(t, e) {
		t.addFieldOffset(1, e, 0);
	}
	static createXyVector(t, e) {
		t.startVector(8, e.length, 8);
		for (let s = e.length - 1; s >= 0; s--) t.addFloat64(e[s]);
		return t.endVector();
	}
	static startXyVector(t, e) {
		t.startVector(8, e, 8);
	}
	static addZ(t, e) {
		t.addFieldOffset(2, e, 0);
	}
	static createZVector(t, e) {
		t.startVector(8, e.length, 8);
		for (let s = e.length - 1; s >= 0; s--) t.addFloat64(e[s]);
		return t.endVector();
	}
	static startZVector(t, e) {
		t.startVector(8, e, 8);
	}
	static addM(t, e) {
		t.addFieldOffset(3, e, 0);
	}
	static createMVector(t, e) {
		t.startVector(8, e.length, 8);
		for (let s = e.length - 1; s >= 0; s--) t.addFloat64(e[s]);
		return t.endVector();
	}
	static startMVector(t, e) {
		t.startVector(8, e, 8);
	}
	static addT(t, e) {
		t.addFieldOffset(4, e, 0);
	}
	static createTVector(t, e) {
		t.startVector(8, e.length, 8);
		for (let s = e.length - 1; s >= 0; s--) t.addFloat64(e[s]);
		return t.endVector();
	}
	static startTVector(t, e) {
		t.startVector(8, e, 8);
	}
	static addTm(t, e) {
		t.addFieldOffset(5, e, 0);
	}
	static createTmVector(t, e) {
		t.startVector(8, e.length, 8);
		for (let s = e.length - 1; s >= 0; s--) t.addInt64(e[s]);
		return t.endVector();
	}
	static startTmVector(t, e) {
		t.startVector(8, e, 8);
	}
	static addType(t, s) {
		t.addFieldInt8(6, s, GeometryType.Unknown);
	}
	static addParts(t, e) {
		t.addFieldOffset(7, e, 0);
	}
	static createPartsVector(t, e) {
		t.startVector(4, e.length, 4);
		for (let s = e.length - 1; s >= 0; s--) t.addOffset(e[s]);
		return t.endVector();
	}
	static startPartsVector(t, e) {
		t.startVector(4, e, 4);
	}
	static endGeometry(t) {
		return t.endObject();
	}
	static createGeometry(t, e, s, b, r, o, i, _, h) {
		return Geometry.startGeometry(t), Geometry.addEnds(t, e), Geometry.addXy(t, s), Geometry.addZ(t, b), Geometry.addM(t, r), Geometry.addT(t, o), Geometry.addTm(t, i), Geometry.addType(t, _), Geometry.addParts(t, h), Geometry.endGeometry(t);
	}
};
//#endregion
//#region node_modules/flatgeobuf/lib/mjs/flat-geobuf/feature.js
var Feature = class Feature {
	bb = null;
	bb_pos = 0;
	__init(t, e) {
		return this.bb_pos = t, this.bb = e, this;
	}
	static getRootAsFeature(t, e) {
		return (e || new Feature()).__init(t.readInt32(t.position()) + t.position(), t);
	}
	static getSizePrefixedRootAsFeature(e, s) {
		return e.setPosition(e.position() + 4), (s || new Feature()).__init(e.readInt32(e.position()) + e.position(), e);
	}
	geometry(t) {
		let e = this.bb.__offset(this.bb_pos, 4);
		return e ? (t || new Geometry()).__init(this.bb.__indirect(this.bb_pos + e), this.bb) : null;
	}
	properties(t) {
		let e = this.bb.__offset(this.bb_pos, 6);
		return e ? this.bb.readUint8(this.bb.__vector(this.bb_pos + e) + t) : 0;
	}
	propertiesLength() {
		let t = this.bb.__offset(this.bb_pos, 6);
		return t ? this.bb.__vector_len(this.bb_pos + t) : 0;
	}
	propertiesArray() {
		let t = this.bb.__offset(this.bb_pos, 6);
		return t ? new Uint8Array(this.bb.bytes().buffer, this.bb.bytes().byteOffset + this.bb.__vector(this.bb_pos + t), this.bb.__vector_len(this.bb_pos + t)) : null;
	}
	columns(t, s) {
		let r = this.bb.__offset(this.bb_pos, 8);
		return r ? (s || new Column()).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos + r) + 4 * t), this.bb) : null;
	}
	columnsLength() {
		let t = this.bb.__offset(this.bb_pos, 8);
		return t ? this.bb.__vector_len(this.bb_pos + t) : 0;
	}
	static startFeature(t) {
		t.startObject(3);
	}
	static addGeometry(t, e) {
		t.addFieldOffset(0, e, 0);
	}
	static addProperties(t, e) {
		t.addFieldOffset(1, e, 0);
	}
	static createPropertiesVector(t, e) {
		t.startVector(1, e.length, 1);
		for (let s = e.length - 1; s >= 0; s--) t.addInt8(e[s]);
		return t.endVector();
	}
	static startPropertiesVector(t, e) {
		t.startVector(1, e, 1);
	}
	static addColumns(t, e) {
		t.addFieldOffset(2, e, 0);
	}
	static createColumnsVector(t, e) {
		t.startVector(4, e.length, 4);
		for (let s = e.length - 1; s >= 0; s--) t.addOffset(e[s]);
		return t.endVector();
	}
	static startColumnsVector(t, e) {
		t.startVector(4, e, 4);
	}
	static endFeature(t) {
		return t.endObject();
	}
	static finishFeatureBuffer(t, e) {
		t.finish(e);
	}
	static finishSizePrefixedFeatureBuffer(t, e) {
		t.finish(e, void 0, !0);
	}
	static createFeature(t, e, s, r) {
		return Feature.startFeature(t), Feature.addGeometry(t, e), Feature.addProperties(t, s), Feature.addColumns(t, r), Feature.endFeature(t);
	}
};
//#endregion
//#region node_modules/flatgeobuf/lib/mjs/header-meta.js
function fromByteBuffer(t) {
	let r = Header.getRootAsHeader(t), i = r.featuresCount(), n = r.indexNodeSize(), o = [];
	for (let e = 0; e < r.columnsLength(); e++) {
		let t = r.columns(e);
		if (!t) throw Error("Column unexpectedly missing");
		if (!t.name()) throw Error("Column name unexpectedly missing");
		o.push({
			name: t.name(),
			type: t.type(),
			title: t.title(),
			description: t.description(),
			width: t.width(),
			precision: t.precision(),
			scale: t.scale(),
			nullable: t.nullable(),
			unique: t.unique(),
			primary_key: t.primaryKey()
		});
	}
	let l = r.crs(), s = l ? {
		org: l.org(),
		code: l.code(),
		name: l.name(),
		description: l.description(),
		wkt: l.wkt(),
		code_string: l.codeString()
	} : null;
	return {
		geometryType: r.geometryType(),
		columns: o,
		envelope: null,
		featuresCount: Number(i),
		indexNodeSize: n,
		crs: s,
		title: r.title(),
		description: r.description(),
		metadata: r.metadata()
	};
}
//#endregion
//#region node_modules/flatgeobuf/lib/mjs/constants.js
var magicbytes = new Uint8Array([
	102,
	103,
	98,
	3,
	102,
	103,
	98,
	0
]);
//#endregion
//#region node_modules/@repeaterjs/repeater/repeater.js
/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
var extendStatics = function(d, b) {
	extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, b) {
		d.__proto__ = b;
	} || function(d, b) {
		for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	};
	return extendStatics(d, b);
};
function __extends(d, b) {
	extendStatics(d, b);
	function __() {
		this.constructor = d;
	}
	d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}
function __awaiter(thisArg, _arguments, P, generator) {
	function adopt(value) {
		return value instanceof P ? value : new P(function(resolve) {
			resolve(value);
		});
	}
	return new (P || (P = Promise))(function(resolve, reject) {
		function fulfilled(value) {
			try {
				step(generator.next(value));
			} catch (e) {
				reject(e);
			}
		}
		function rejected(value) {
			try {
				step(generator["throw"](value));
			} catch (e) {
				reject(e);
			}
		}
		function step(result) {
			result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
		}
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
}
function __generator(thisArg, body) {
	var _ = {
		label: 0,
		sent: function() {
			if (t[0] & 1) throw t[1];
			return t[1];
		},
		trys: [],
		ops: []
	}, f, y, t, g;
	return g = {
		next: verb(0),
		"throw": verb(1),
		"return": verb(2)
	}, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
		return this;
	}), g;
	function verb(n) {
		return function(v) {
			return step([n, v]);
		};
	}
	function step(op) {
		if (f) throw new TypeError("Generator is already executing.");
		while (_) try {
			if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
			if (y = 0, t) op = [op[0] & 2, t.value];
			switch (op[0]) {
				case 0:
				case 1:
					t = op;
					break;
				case 4:
					_.label++;
					return {
						value: op[1],
						done: false
					};
				case 5:
					_.label++;
					y = op[1];
					op = [0];
					continue;
				case 7:
					op = _.ops.pop();
					_.trys.pop();
					continue;
				default:
					if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
						_ = 0;
						continue;
					}
					if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
						_.label = op[1];
						break;
					}
					if (op[0] === 6 && _.label < t[1]) {
						_.label = t[1];
						t = op;
						break;
					}
					if (t && _.label < t[2]) {
						_.label = t[2];
						_.ops.push(op);
						break;
					}
					if (t[2]) _.ops.pop();
					_.trys.pop();
					continue;
			}
			op = body.call(thisArg, _);
		} catch (e) {
			op = [6, e];
			y = 0;
		} finally {
			f = t = 0;
		}
		if (op[0] & 5) throw op[1];
		return {
			value: op[0] ? op[1] : void 0,
			done: true
		};
	}
}
function __values(o) {
	var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
	if (m) return m.call(o);
	if (o && typeof o.length === "number") return { next: function() {
		if (o && i >= o.length) o = void 0;
		return {
			value: o && o[i++],
			done: !o
		};
	} };
	throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}
function __await(v) {
	return this instanceof __await ? (this.v = v, this) : new __await(v);
}
function __asyncGenerator(thisArg, _arguments, generator) {
	if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
	var g = generator.apply(thisArg, _arguments || []), i, q = [];
	return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
		return this;
	}, i;
	function verb(n) {
		if (g[n]) i[n] = function(v) {
			return new Promise(function(a, b) {
				q.push([
					n,
					v,
					a,
					b
				]) > 1 || resume(n, v);
			});
		};
	}
	function resume(n, v) {
		try {
			step(g[n](v));
		} catch (e) {
			settle(q[0][3], e);
		}
	}
	function step(r) {
		r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
	}
	function fulfill(value) {
		resume("next", value);
	}
	function reject(value) {
		resume("throw", value);
	}
	function settle(f, v) {
		if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
	}
}
/** An error subclass which is thrown when there are too many pending push or next operations on a single repeater. */
var RepeaterOverflowError = function(_super) {
	__extends(RepeaterOverflowError, _super);
	function RepeaterOverflowError(message) {
		var _this = _super.call(this, message) || this;
		Object.defineProperty(_this, "name", {
			value: "RepeaterOverflowError",
			enumerable: false
		});
		if (typeof Object.setPrototypeOf === "function") Object.setPrototypeOf(_this, _this.constructor.prototype);
		else _this.__proto__ = _this.constructor.prototype;
		if (typeof Error.captureStackTrace === "function") Error.captureStackTrace(_this, _this.constructor);
		return _this;
	}
	return RepeaterOverflowError;
}(Error);
(function() {
	function FixedBuffer(capacity) {
		if (capacity < 0) throw new RangeError("Capacity may not be less than 0");
		this._c = capacity;
		this._q = [];
	}
	Object.defineProperty(FixedBuffer.prototype, "empty", {
		get: function() {
			return this._q.length === 0;
		},
		enumerable: false,
		configurable: true
	});
	Object.defineProperty(FixedBuffer.prototype, "full", {
		get: function() {
			return this._q.length >= this._c;
		},
		enumerable: false,
		configurable: true
	});
	FixedBuffer.prototype.add = function(value) {
		if (this.full) throw new Error("Buffer full");
		else this._q.push(value);
	};
	FixedBuffer.prototype.remove = function() {
		if (this.empty) throw new Error("Buffer empty");
		return this._q.shift();
	};
	return FixedBuffer;
})();
(function() {
	function SlidingBuffer(capacity) {
		if (capacity < 1) throw new RangeError("Capacity may not be less than 1");
		this._c = capacity;
		this._q = [];
	}
	Object.defineProperty(SlidingBuffer.prototype, "empty", {
		get: function() {
			return this._q.length === 0;
		},
		enumerable: false,
		configurable: true
	});
	Object.defineProperty(SlidingBuffer.prototype, "full", {
		get: function() {
			return false;
		},
		enumerable: false,
		configurable: true
	});
	SlidingBuffer.prototype.add = function(value) {
		while (this._q.length >= this._c) this._q.shift();
		this._q.push(value);
	};
	SlidingBuffer.prototype.remove = function() {
		if (this.empty) throw new Error("Buffer empty");
		return this._q.shift();
	};
	return SlidingBuffer;
})();
(function() {
	function DroppingBuffer(capacity) {
		if (capacity < 1) throw new RangeError("Capacity may not be less than 1");
		this._c = capacity;
		this._q = [];
	}
	Object.defineProperty(DroppingBuffer.prototype, "empty", {
		get: function() {
			return this._q.length === 0;
		},
		enumerable: false,
		configurable: true
	});
	Object.defineProperty(DroppingBuffer.prototype, "full", {
		get: function() {
			return false;
		},
		enumerable: false,
		configurable: true
	});
	DroppingBuffer.prototype.add = function(value) {
		if (this._q.length < this._c) this._q.push(value);
	};
	DroppingBuffer.prototype.remove = function() {
		if (this.empty) throw new Error("Buffer empty");
		return this._q.shift();
	};
	return DroppingBuffer;
})();
/** Makes sure promise-likes don’t cause unhandled rejections. */
function swallow(value) {
	if (value != null && typeof value.then === "function") value.then(NOOP, NOOP);
}
/*** REPEATER STATES ***/
/** The following is an enumeration of all possible repeater states. These states are ordered, and a repeater may only advance to higher states. */
/** The initial state of the repeater. */
var Initial = 0;
/** Repeaters advance to this state the first time the next method is called on the repeater. */
var Started = 1;
/** Repeaters advance to this state when the stop function is called. */
var Stopped = 2;
/** Repeaters advance to this state when there are no values left to be pulled from the repeater. */
var Done = 3;
/** Repeaters advance to this state if an error is thrown into the repeater. */
var Rejected = 4;
/** The maximum number of push or next operations which may exist on a single repeater. */
var MAX_QUEUE_LENGTH = 1024;
var NOOP = function() {};
/** A helper function used to mimic the behavior of async generators where the final iteration is consumed. */
function consumeExecution(r) {
	var err = r.err;
	var execution = Promise.resolve(r.execution).then(function(value) {
		if (err != null) throw err;
		return value;
	});
	r.err = void 0;
	r.execution = execution.then(function() {}, function() {});
	return r.pending === void 0 ? execution : r.pending.then(function() {
		return execution;
	});
}
/** A helper function for building iterations from values. Promises are unwrapped, so that iterations never have their value property set to a promise. */
function createIteration(r, value) {
	var done = r.state >= Done;
	return Promise.resolve(value).then(function(value) {
		if (!done && r.state >= Rejected) return consumeExecution(r).then(function(value) {
			return {
				value,
				done: true
			};
		});
		return {
			value,
			done
		};
	});
}
/**
* This function is bound and passed to the executor as the stop argument.
*
* Advances state to Stopped.
*/
function stop(r, err) {
	var e_1, _a;
	if (r.state >= Stopped) return;
	r.state = Stopped;
	r.onnext();
	r.onstop();
	if (r.err == null) r.err = err;
	if (r.pushes.length === 0 && (typeof r.buffer === "undefined" || r.buffer.empty)) finish(r);
	else try {
		for (var _b = __values(r.pushes), _d = _b.next(); !_d.done; _d = _b.next()) _d.value.resolve();
	} catch (e_1_1) {
		e_1 = { error: e_1_1 };
	} finally {
		try {
			if (_d && !_d.done && (_a = _b.return)) _a.call(_b);
		} finally {
			if (e_1) throw e_1.error;
		}
	}
}
/**
* The difference between stopping a repeater vs finishing a repeater is that stopping a repeater allows next to continue to drain values from the push queue and buffer, while finishing a repeater will clear all pending values and end iteration immediately. Once, a repeater is finished, all iterations will have the done property set to true.
*
* Advances state to Done.
*/
function finish(r) {
	var e_2, _a;
	if (r.state >= Done) return;
	if (r.state < Stopped) stop(r);
	r.state = Done;
	r.buffer = void 0;
	try {
		for (var _b = __values(r.nexts), _d = _b.next(); !_d.done; _d = _b.next()) {
			var next = _d.value;
			var execution = r.pending === void 0 ? consumeExecution(r) : r.pending.then(function() {
				return consumeExecution(r);
			});
			next.resolve(createIteration(r, execution));
		}
	} catch (e_2_1) {
		e_2 = { error: e_2_1 };
	} finally {
		try {
			if (_d && !_d.done && (_a = _b.return)) _a.call(_b);
		} finally {
			if (e_2) throw e_2.error;
		}
	}
	r.pushes = [];
	r.nexts = [];
}
/**
* Called when a promise passed to push rejects, or when a push call is unhandled.
*
* Advances state to Rejected.
*/
function reject(r) {
	if (r.state >= Rejected) return;
	if (r.state < Done) finish(r);
	r.state = Rejected;
}
/** This function is bound and passed to the executor as the push argument. */
function push(r, value) {
	swallow(value);
	if (r.pushes.length >= 1024) throw new RepeaterOverflowError("No more than " + MAX_QUEUE_LENGTH + " pending calls to push are allowed on a single repeater.");
	else if (r.state >= Stopped) return Promise.resolve(void 0);
	var valueP = r.pending === void 0 ? Promise.resolve(value) : r.pending.then(function() {
		return value;
	});
	valueP = valueP.catch(function(err) {
		if (r.state < Stopped) r.err = err;
		reject(r);
	});
	var nextP;
	if (r.nexts.length) {
		r.nexts.shift().resolve(createIteration(r, valueP));
		if (r.nexts.length) nextP = Promise.resolve(r.nexts[0].value);
		else if (typeof r.buffer !== "undefined" && !r.buffer.full) nextP = Promise.resolve(void 0);
		else nextP = new Promise(function(resolve) {
			return r.onnext = resolve;
		});
	} else if (typeof r.buffer !== "undefined" && !r.buffer.full) {
		r.buffer.add(valueP);
		nextP = Promise.resolve(void 0);
	} else nextP = new Promise(function(resolve) {
		return r.pushes.push({
			resolve,
			value: valueP
		});
	});
	var floating = true;
	var next = {};
	var unhandled = nextP.catch(function(err) {
		if (floating) throw err;
	});
	next.then = function(onfulfilled, onrejected) {
		floating = false;
		return Promise.prototype.then.call(nextP, onfulfilled, onrejected);
	};
	next.catch = function(onrejected) {
		floating = false;
		return Promise.prototype.catch.call(nextP, onrejected);
	};
	next.finally = nextP.finally.bind(nextP);
	r.pending = valueP.then(function() {
		return unhandled;
	}).catch(function(err) {
		r.err = err;
		reject(r);
	});
	return next;
}
/**
* Creates the stop callable promise which is passed to the executor
*/
function createStop(r) {
	var stop1 = stop.bind(null, r);
	var stopP = new Promise(function(resolve) {
		return r.onstop = resolve;
	});
	stop1.then = stopP.then.bind(stopP);
	stop1.catch = stopP.catch.bind(stopP);
	stop1.finally = stopP.finally.bind(stopP);
	return stop1;
}
/**
* Calls the executor passed into the constructor. This function is called the first time the next method is called on the repeater.
*
* Advances state to Started.
*/
function execute(r) {
	if (r.state >= Started) return;
	r.state = Started;
	var push1 = push.bind(null, r);
	var stop1 = createStop(r);
	r.execution = new Promise(function(resolve) {
		return resolve(r.executor(push1, stop1));
	});
	r.execution.catch(function() {
		return stop(r);
	});
}
var records = /* @__PURE__ */ new WeakMap();
var Repeater = function() {
	function Repeater(executor, buffer) {
		records.set(this, {
			executor,
			buffer,
			err: void 0,
			state: Initial,
			pushes: [],
			nexts: [],
			pending: void 0,
			execution: void 0,
			onnext: NOOP,
			onstop: NOOP
		});
	}
	Repeater.prototype.next = function(value) {
		swallow(value);
		var r = records.get(this);
		if (r === void 0) throw new Error("WeakMap error");
		if (r.nexts.length >= 1024) throw new RepeaterOverflowError("No more than " + MAX_QUEUE_LENGTH + " pending calls to next are allowed on a single repeater.");
		if (r.state <= Initial) execute(r);
		r.onnext(value);
		if (typeof r.buffer !== "undefined" && !r.buffer.empty) {
			var result = createIteration(r, r.buffer.remove());
			if (r.pushes.length) {
				var push_2 = r.pushes.shift();
				r.buffer.add(push_2.value);
				r.onnext = push_2.resolve;
			}
			return result;
		} else if (r.pushes.length) {
			var push_3 = r.pushes.shift();
			r.onnext = push_3.resolve;
			return createIteration(r, push_3.value);
		} else if (r.state >= Stopped) {
			finish(r);
			return createIteration(r, consumeExecution(r));
		}
		return new Promise(function(resolve) {
			return r.nexts.push({
				resolve,
				value
			});
		});
	};
	Repeater.prototype.return = function(value) {
		swallow(value);
		var r = records.get(this);
		if (r === void 0) throw new Error("WeakMap error");
		finish(r);
		r.execution = Promise.resolve(r.execution).then(function() {
			return value;
		});
		return createIteration(r, consumeExecution(r));
	};
	Repeater.prototype.throw = function(err) {
		var r = records.get(this);
		if (r === void 0) throw new Error("WeakMap error");
		if (r.state <= Initial || r.state >= Stopped || typeof r.buffer !== "undefined" && !r.buffer.empty) {
			finish(r);
			if (r.err == null) r.err = err;
			return createIteration(r, consumeExecution(r));
		}
		return this.next(Promise.reject(err));
	};
	Repeater.prototype[Symbol.asyncIterator] = function() {
		return this;
	};
	Repeater.race = race;
	Repeater.merge = merge;
	Repeater.zip = zip;
	Repeater.latest = latest;
	return Repeater;
}();
/*** COMBINATOR FUNCTIONS ***/
function getIterators(values, options) {
	var e_3, _a;
	var iters = [];
	var _loop_1 = function(value) {
		if (value != null && typeof value[Symbol.asyncIterator] === "function") iters.push(value[Symbol.asyncIterator]());
		else if (value != null && typeof value[Symbol.iterator] === "function") iters.push(value[Symbol.iterator]());
		else iters.push((function valueToAsyncIterator() {
			return __asyncGenerator(this, arguments, function valueToAsyncIterator_1() {
				return __generator(this, function(_a) {
					switch (_a.label) {
						case 0:
							if (!options.yieldValues) return [3, 3];
							return [4, __await(value)];
						case 1: return [4, _a.sent()];
						case 2:
							_a.sent();
							_a.label = 3;
						case 3:
							if (!options.returnValues) return [3, 5];
							return [4, __await(value)];
						case 4: return [2, _a.sent()];
						case 5: return [2];
					}
				});
			});
		})());
	};
	try {
		for (var values_1 = __values(values), values_1_1 = values_1.next(); !values_1_1.done; values_1_1 = values_1.next()) {
			var value = values_1_1.value;
			_loop_1(value);
		}
	} catch (e_3_1) {
		e_3 = { error: e_3_1 };
	} finally {
		try {
			if (values_1_1 && !values_1_1.done && (_a = values_1.return)) _a.call(values_1);
		} finally {
			if (e_3) throw e_3.error;
		}
	}
	return iters;
}
function race(contenders) {
	var _this = this;
	var iters = getIterators(contenders, { returnValues: true });
	return new Repeater(function(push, stop) {
		return __awaiter(_this, void 0, void 0, function() {
			var advance, stopped, finalIteration, iteration, i_1, _loop_2;
			return __generator(this, function(_a) {
				switch (_a.label) {
					case 0:
						if (!iters.length) {
							stop();
							return [2];
						}
						stopped = false;
						stop.then(function() {
							advance();
							stopped = true;
						});
						_a.label = 1;
					case 1:
						_a.trys.push([
							1,
							,
							5,
							7
						]);
						iteration = void 0;
						i_1 = 0;
						_loop_2 = function() {
							var j, iters_1, iters_1_1, iter;
							var e_4, _a;
							return __generator(this, function(_b) {
								switch (_b.label) {
									case 0:
										j = i_1;
										try {
											for (iters_1 = (e_4 = void 0, __values(iters)), iters_1_1 = iters_1.next(); !iters_1_1.done; iters_1_1 = iters_1.next()) {
												iter = iters_1_1.value;
												Promise.resolve(iter.next()).then(function(iteration) {
													if (iteration.done) {
														stop();
														if (finalIteration === void 0) finalIteration = iteration;
													} else if (i_1 === j) {
														i_1++;
														advance(iteration);
													}
												}, function(err) {
													return stop(err);
												});
											}
										} catch (e_4_1) {
											e_4 = { error: e_4_1 };
										} finally {
											try {
												if (iters_1_1 && !iters_1_1.done && (_a = iters_1.return)) _a.call(iters_1);
											} finally {
												if (e_4) throw e_4.error;
											}
										}
										return [4, new Promise(function(resolve) {
											return advance = resolve;
										})];
									case 1:
										iteration = _b.sent();
										if (!(iteration !== void 0)) return [3, 3];
										return [4, push(iteration.value)];
									case 2:
										_b.sent();
										_b.label = 3;
									case 3: return [2];
								}
							});
						};
						_a.label = 2;
					case 2:
						if (!!stopped) return [3, 4];
						return [5, _loop_2()];
					case 3:
						_a.sent();
						return [3, 2];
					case 4: return [2, finalIteration && finalIteration.value];
					case 5:
						stop();
						return [4, Promise.race(iters.map(function(iter) {
							return iter.return && iter.return();
						}))];
					case 6:
						_a.sent();
						return [7];
					case 7: return [2];
				}
			});
		});
	});
}
function merge(contenders) {
	var _this = this;
	var iters = getIterators(contenders, { yieldValues: true });
	return new Repeater(function(push, stop) {
		return __awaiter(_this, void 0, void 0, function() {
			var advances, stopped, finalIteration;
			var _this = this;
			return __generator(this, function(_a) {
				switch (_a.label) {
					case 0:
						if (!iters.length) {
							stop();
							return [2];
						}
						advances = [];
						stopped = false;
						stop.then(function() {
							var e_5, _a;
							stopped = true;
							try {
								for (var advances_1 = __values(advances), advances_1_1 = advances_1.next(); !advances_1_1.done; advances_1_1 = advances_1.next()) {
									var advance = advances_1_1.value;
									advance();
								}
							} catch (e_5_1) {
								e_5 = { error: e_5_1 };
							} finally {
								try {
									if (advances_1_1 && !advances_1_1.done && (_a = advances_1.return)) _a.call(advances_1);
								} finally {
									if (e_5) throw e_5.error;
								}
							}
						});
						_a.label = 1;
					case 1:
						_a.trys.push([
							1,
							,
							3,
							4
						]);
						return [4, Promise.all(iters.map(function(iter, i) {
							return __awaiter(_this, void 0, void 0, function() {
								var iteration, _a;
								return __generator(this, function(_b) {
									switch (_b.label) {
										case 0:
											_b.trys.push([
												0,
												,
												6,
												9
											]);
											_b.label = 1;
										case 1:
											if (!!stopped) return [3, 5];
											Promise.resolve(iter.next()).then(function(iteration) {
												return advances[i](iteration);
											}, function(err) {
												return stop(err);
											});
											return [4, new Promise(function(resolve) {
												advances[i] = resolve;
											})];
										case 2:
											iteration = _b.sent();
											if (!(iteration !== void 0)) return [3, 4];
											if (iteration.done) {
												finalIteration = iteration;
												return [2];
											}
											return [4, push(iteration.value)];
										case 3:
											_b.sent();
											_b.label = 4;
										case 4: return [3, 1];
										case 5: return [3, 9];
										case 6:
											_a = iter.return;
											if (!_a) return [3, 8];
											return [4, iter.return()];
										case 7:
											_a = _b.sent();
											_b.label = 8;
										case 8: return [7];
										case 9: return [2];
									}
								});
							});
						}))];
					case 2:
						_a.sent();
						return [2, finalIteration && finalIteration.value];
					case 3:
						stop();
						return [7];
					case 4: return [2];
				}
			});
		});
	});
}
function zip(contenders) {
	var _this = this;
	var iters = getIterators(contenders, { returnValues: true });
	return new Repeater(function(push, stop) {
		return __awaiter(_this, void 0, void 0, function() {
			var advance, stopped, iterations, values;
			return __generator(this, function(_a) {
				switch (_a.label) {
					case 0:
						if (!iters.length) {
							stop();
							return [2, []];
						}
						stopped = false;
						stop.then(function() {
							advance();
							stopped = true;
						});
						_a.label = 1;
					case 1:
						_a.trys.push([
							1,
							,
							6,
							8
						]);
						_a.label = 2;
					case 2:
						if (!!stopped) return [3, 5];
						Promise.all(iters.map(function(iter) {
							return iter.next();
						})).then(function(iterations) {
							return advance(iterations);
						}, function(err) {
							return stop(err);
						});
						return [4, new Promise(function(resolve) {
							return advance = resolve;
						})];
					case 3:
						iterations = _a.sent();
						if (iterations === void 0) return [2];
						values = iterations.map(function(iteration) {
							return iteration.value;
						});
						if (iterations.some(function(iteration) {
							return iteration.done;
						})) return [2, values];
						return [4, push(values)];
					case 4:
						_a.sent();
						return [3, 2];
					case 5: return [3, 8];
					case 6:
						stop();
						return [4, Promise.all(iters.map(function(iter) {
							return iter.return && iter.return();
						}))];
					case 7:
						_a.sent();
						return [7];
					case 8: return [2];
				}
			});
		});
	});
}
function latest(contenders) {
	var _this = this;
	var iters = getIterators(contenders, {
		yieldValues: true,
		returnValues: true
	});
	return new Repeater(function(push, stop) {
		return __awaiter(_this, void 0, void 0, function() {
			var advance, advances, stopped, iterations_1, values_2;
			var _this = this;
			return __generator(this, function(_a) {
				switch (_a.label) {
					case 0:
						if (!iters.length) {
							stop();
							return [2, []];
						}
						advances = [];
						stopped = false;
						stop.then(function() {
							var e_6, _a;
							advance();
							try {
								for (var advances_2 = __values(advances), advances_2_1 = advances_2.next(); !advances_2_1.done; advances_2_1 = advances_2.next()) {
									var advance1 = advances_2_1.value;
									advance1();
								}
							} catch (e_6_1) {
								e_6 = { error: e_6_1 };
							} finally {
								try {
									if (advances_2_1 && !advances_2_1.done && (_a = advances_2.return)) _a.call(advances_2);
								} finally {
									if (e_6) throw e_6.error;
								}
							}
							stopped = true;
						});
						_a.label = 1;
					case 1:
						_a.trys.push([
							1,
							,
							5,
							7
						]);
						Promise.all(iters.map(function(iter) {
							return iter.next();
						})).then(function(iterations) {
							return advance(iterations);
						}, function(err) {
							return stop(err);
						});
						return [4, new Promise(function(resolve) {
							return advance = resolve;
						})];
					case 2:
						iterations_1 = _a.sent();
						if (iterations_1 === void 0) return [2];
						values_2 = iterations_1.map(function(iteration) {
							return iteration.value;
						});
						if (iterations_1.every(function(iteration) {
							return iteration.done;
						})) return [2, values_2];
						return [4, push(values_2.slice())];
					case 3:
						_a.sent();
						return [4, Promise.all(iters.map(function(iter, i) {
							return __awaiter(_this, void 0, void 0, function() {
								var iteration;
								return __generator(this, function(_a) {
									switch (_a.label) {
										case 0:
											if (iterations_1[i].done) return [2, iterations_1[i].value];
											_a.label = 1;
										case 1:
											if (!!stopped) return [3, 4];
											Promise.resolve(iter.next()).then(function(iteration) {
												return advances[i](iteration);
											}, function(err) {
												return stop(err);
											});
											return [4, new Promise(function(resolve) {
												return advances[i] = resolve;
											})];
										case 2:
											iteration = _a.sent();
											if (iteration === void 0) return [2, iterations_1[i].value];
											else if (iteration.done) return [2, iteration.value];
											values_2[i] = iteration.value;
											return [4, push(values_2.slice())];
										case 3:
											_a.sent();
											return [3, 1];
										case 4: return [2];
									}
								});
							});
						}))];
					case 4: return [2, _a.sent()];
					case 5:
						stop();
						return [4, Promise.all(iters.map(function(iter) {
							return iter.return && iter.return();
						}))];
					case 6:
						_a.sent();
						return [7];
					case 7: return [2];
				}
			});
		});
	});
}
//#endregion
//#region node_modules/flatgeobuf/lib/mjs/config.js
var e = class e {
	static global = new e();
	_extraRequestThreshold = 262144;
	extraRequestThreshold() {
		return this._extraRequestThreshold;
	}
	setExtraRequestThreshold(e) {
		if (e < 0) throw Error("extraRequestThreshold cannot be negative");
		this._extraRequestThreshold = e;
	}
};
//#endregion
//#region node_modules/flatgeobuf/lib/mjs/packedrtree.js
function calcTreeSize(e, t) {
	t = Math.min(Math.max(+t, 2), 65535);
	let l = e, n = l;
	do
		n += l = Math.ceil(l / t);
	while (1 !== l);
	return 40 * n;
}
function generateLevelBounds(e, t) {
	if (t < 2) throw Error("Node size must be at least 2");
	if (0 === e) throw Error("Number of items must be greater than 0");
	let l = e, n = l, o = [l];
	do
		n += l = Math.ceil(l / t), o.push(l);
	while (1 !== l);
	let r = [];
	for (let e of (l = n, o)) r.push(l - e), l -= e;
	let i = [];
	for (let e = 0; e < o.length; e++) i.push([r[e], r[e] + o[e]]);
	return i;
}
async function* streamSearch(t, l, n, o) {
	class r {
		_level;
		nodes;
		constructor(e, t) {
			this._level = t, this.nodes = e;
		}
		level() {
			return this._level;
		}
		startNodeIdx() {
			return this.nodes[0];
		}
		endNodeIdx() {
			return this.nodes[1];
		}
		extendEndNodeIdx(e) {
			this.nodes[1] = e;
		}
		toString() {
			return `[NodeRange level: ${this._level}, nodes: ${this.nodes[0]}-${this.nodes[1]}]`;
		}
	}
	let { minX: i, minY: s, maxX: d, maxY: u } = n, h = generateLevelBounds(t, l), a = h[0][0], N = [new r([0, 1], h.length - 1)];
	for (; 0 !== N.length;) {
		let n = N.shift(), c = n.startNodeIdx(), g = c >= a, f = (() => {
			let [, e] = h[n.level()], t = Math.min(n.endNodeIdx() + l, e);
			return g && t < e ? t + 1 : t;
		})(), x = f - c, v = new DataView(await o(40 * c, 40 * x));
		for (let l = c; l < f; l++) {
			let o = l - c, h = 40 * o;
			if (d < v.getFloat64(h + 0, !0) || u < v.getFloat64(h + 8, !0) || i > v.getFloat64(h + 16, !0) || s > v.getFloat64(h + 24, !0)) continue;
			let f = v.getBigUint64(h + 32, !0);
			if (g) {
				let e = (() => {
					if (l < t - 1) {
						let e = (o + 1) * 40;
						return v.getBigUint64(e + 32, !0) - f;
					}
					return null;
				})(), n = l - a;
				yield [
					Number(f),
					n,
					Number(e)
				];
				continue;
			}
			let x = e.global.extraRequestThreshold() / 40, m = N[N.length - 1];
			if (void 0 !== m && m.level() === n.level() - 1 && f < m.endNodeIdx() + x) {
				m.extendEndNodeIdx(Number(f));
				continue;
			}
			let E = (() => {
				let e = n.level() - 1;
				return new r([Number(f), Number(f) + 1], e);
			})();
			void 0 !== m && (m.level(), E.level()), N.push(E);
		}
	}
}
//#endregion
//#region node_modules/flatgeobuf/lib/mjs/http-reader.js
var HttpReader = class HttpReader {
	headerClient;
	header;
	headerLength;
	indexLength;
	nocache;
	constructor(e, t, r, a, s) {
		this.headerClient = e, this.header = t, this.headerLength = r, this.indexLength = a, this.nocache = s;
	}
	static async open(e, r) {
		let a, n = new u(e, r), f = 2024 + (() => {
			let e, t = 0;
			for (e = 0; e < 3; e++) t += 16 ** e * 40;
			return t;
		})();
		if (!new Uint8Array(await n.getRange(0, 8, f, "header")).subarray(0, 3).every((e, t) => magicbytes[t] === e)) throw Error("Not a FlatGeobuf file");
		if ((a = new DataView(await n.getRange(8, 4, f, "header")).getUint32(0, !0)) > 10485760 || a < 8) throw Error("Invalid header size");
		let d = await n.getRange(12, a, f, "header"), g = fromByteBuffer(new ByteBuffer(new Uint8Array(d))), c = calcTreeSize(g.featuresCount, g.indexNodeSize);
		return new HttpReader(n, g, a, c, r);
	}
	async *selectBbox(t) {
		let a = this.lengthBeforeTree(), s = this.headerClient, n = async (e, t) => s.getRange(a + e, t, 0, "index"), i = [], h = [];
		for await (let e$1 of streamSearch(this.header.featuresCount, this.header.indexNodeSize, t, n)) {
			let [t, a] = e$1, [, , s] = e$1;
			if (s || (s = 4), 0 === h.length) {
				h.push([
					t,
					s,
					a
				]);
				continue;
			}
			let n = h[h.length - 1];
			t - (n[0] + n[1]) > e.global.extraRequestThreshold() && (i.push(h), h = []), h.push([
				t,
				s,
				a
			]);
		}
		this.headerClient.logUsage("header+index"), h.length > 0 && i.push(h);
		let o = i.flatMap((e) => this.readFeatureBatch(e, this.nocache));
		yield* Repeater.merge(o);
	}
	lengthBeforeTree() {
		return magicbytes.length + 4 + this.headerLength;
	}
	lengthBeforeFeatures() {
		return this.lengthBeforeTree() + this.indexLength;
	}
	buildFeatureClient(e) {
		return new u(this.headerClient.httpClient, e);
	}
	async *readFeatureBatch(e, t) {
		let [r] = e[0], [a, s] = e[e.length - 1], n = this.buildFeatureClient(t), i = a + s - r;
		for (let [t, , r] of e) yield {
			id: r,
			feature: await this.readFeature(n, t, i)
		}, i = 0;
		n.logUsage("feature");
	}
	async readFeature(e, r, s) {
		let i, h = r + this.lengthBeforeFeatures();
		i = new DataView(await e.getRange(h, 4, s, "feature length")).getUint32(0, !0);
		let o = new Uint8Array(await e.getRange(h + 4, i, s, "feature data")), l = new Uint8Array(i + 4);
		l.set(o, 4);
		let f = new ByteBuffer(l);
		return f.setPosition(4), Feature.getRootAsFeature(f);
	}
};
var u = class {
	httpClient;
	bytesEverUsed = 0;
	bytesEverFetched = 0;
	buffer = /* @__PURE__ */ new ArrayBuffer(0);
	head = 0;
	constructor(e, t) {
		if ("string" == typeof e) this.httpClient = new d(e, t);
		else if (e instanceof d) this.httpClient = e;
		else throw Error("Unknown source ");
	}
	async getRange(e, t, r, a) {
		this.bytesEverUsed += t;
		let s = e - this.head, n = s + t;
		if (s >= 0 && n <= this.buffer.byteLength) return this.buffer.slice(s, n);
		let i = Math.max(t, r);
		return this.bytesEverFetched += i, this.buffer = await this.httpClient.getRange(e, i, a), this.head = e, this.buffer.slice(0, t);
	}
	logUsage(e) {
		e.split(" ")[0], (100 * this.bytesEverUsed / this.bytesEverFetched).toFixed(2);
	}
};
var d = class {
	url;
	nocache;
	requestsEverMade = 0;
	bytesEverRequested = 0;
	constructor(e, t) {
		this.url = e, this.nocache = t;
	}
	async getRange(e, t, r) {
		this.requestsEverMade += 1, this.bytesEverRequested += t;
		let a = { Range: `bytes=${e}-${e + t - 1}` };
		this.nocache && (a["Cache-Control"] = "no-cache, no-store");
		return await (await fetch(this.url, { headers: a })).arrayBuffer();
	}
};
//#endregion
//#region node_modules/flatgeobuf/lib/mjs/generic/geometry.js
function pairFlatCoordinates(t, e) {
	let r = [];
	for (let o = 0; o < t.length; o += 2) {
		let n = [t[o], t[o + 1]];
		e && n.push(e[o >> 1]), r.push(n);
	}
	return r;
}
new TextEncoder();
//#endregion
//#region node_modules/flatgeobuf/lib/mjs/generic/feature.js
var s = new TextDecoder();
function parseProperties(e, r) {
	let a = {};
	if (!r || 0 === r.length) return a;
	let n = e.propertiesArray();
	if (!n) return a;
	let o = new DataView(n.buffer, n.byteOffset), i = e.propertiesLength(), l = 0;
	for (; l < i;) {
		let e = o.getUint16(l, !0);
		l += 2;
		let i = r[e], c = i.name;
		switch (i.type) {
			case ColumnType.Bool:
				a[c] = !!o.getUint8(l), l += 1;
				break;
			case ColumnType.Byte:
				a[c] = o.getInt8(l), l += 1;
				break;
			case ColumnType.UByte:
				a[c] = o.getUint8(l), l += 1;
				break;
			case ColumnType.Short:
				a[c] = o.getInt16(l, !0), l += 2;
				break;
			case ColumnType.UShort:
				a[c] = o.getUint16(l, !0), l += 2;
				break;
			case ColumnType.Int:
				a[c] = o.getInt32(l, !0), l += 4;
				break;
			case ColumnType.UInt:
				a[c] = o.getUint32(l, !0), l += 4;
				break;
			case ColumnType.Long:
				a[c] = Number(o.getBigInt64(l, !0)), l += 8;
				break;
			case ColumnType.ULong:
				a[c] = Number(o.getBigUint64(l, !0)), l += 8;
				break;
			case ColumnType.Float:
				a[c] = o.getFloat32(l, !0), l += 4;
				break;
			case ColumnType.Double:
				a[c] = o.getFloat64(l, !0), l += 8;
				break;
			case ColumnType.DateTime:
			case ColumnType.String: {
				let e = o.getUint32(l, !0);
				l += 4, a[c] = s.decode(n.subarray(l, l + e)), l += e;
				break;
			}
			case ColumnType.Json: {
				let e = o.getUint32(l, !0);
				l += 4;
				let t = s.decode(n.subarray(l, l + e));
				a[c] = JSON.parse(t), l += e;
				break;
			}
			case ColumnType.Binary: {
				let e = o.getUint32(l, !0);
				l += 4, a[c] = n.subarray(l, l + e), l += e;
				break;
			}
			default: throw Error(`Unknown type ${i.type}`);
		}
	}
	return a;
}
//#endregion
//#region node_modules/flatgeobuf/lib/mjs/generic/featurecollection.js
function deserialize$2(t, r, n) {
	if (!t.subarray(0, 3).every((e, t) => magicbytes[t] === e)) throw Error("Not a FlatGeobuf file");
	let o = new ByteBuffer(t), u = o.readUint32(magicbytes.length);
	o.setPosition(magicbytes.length + 4);
	let s = fromByteBuffer(o);
	n && n(s);
	let d = magicbytes.length + 4 + u, { indexNodeSize: p, featuresCount: y } = s;
	p > 0 && (d += calcTreeSize(y, p));
	let g = [];
	for (; d < o.capacity();) {
		let e = o.readUint32(d);
		o.setPosition(d + 4);
		let t = Feature.getRootAsFeature(o);
		g.push(r(g.length, t, s)), d += 4 + e;
	}
	return g;
}
async function* deserializeStream$1(r, n, o) {
	let a, l = slice(r), u = async (e) => await l.slice(e), s = new Uint8Array(await u(8, "magic bytes"));
	if (!s.subarray(0, 3).every((e, t) => magicbytes[t] === e)) throw Error("Not a FlatGeobuf file");
	s = new Uint8Array(await u(4, "header length"));
	let d = new ByteBuffer(s), p = d.readUint32(0);
	s = new Uint8Array(await u(p, "header data"));
	let y = fromByteBuffer(d = new ByteBuffer(s));
	o && o(y);
	let { indexNodeSize: c, featuresCount: h } = y;
	if (c > 0) await u(calcTreeSize(h, c), "entire index, w/o rect");
	let w = 0;
	for (; a = await g(u, y, n, w++);) yield a;
}
async function* deserializeFiltered$1(e, t, r, n, o = !1) {
	let a = await HttpReader.open(e, o);
	for await (let e of (n && n(a.header), a.selectBbox(t))) yield r(e.id, e.feature, a.header);
}
async function g(t, r, n, o) {
	let i = new Uint8Array(await t(4, "feature length"));
	if (0 === i.byteLength) return;
	let f = new ByteBuffer(i), u = f.readUint32(0);
	i = new Uint8Array(await t(u, "feature data"));
	let s = new Uint8Array(u + 4);
	return s.set(i, 4), (f = new ByteBuffer(s)).setPosition(4), n(o, Feature.getRootAsFeature(f), r);
}
//#endregion
//#region node_modules/ol/proj/Units.js
/**
* @typedef {Object} MetersPerUnitLookup
* @property {number} radians Radians
* @property {number} degrees Degrees
* @property {number} ft  Feet
* @property {number} m Meters
* @property {number} us-ft US feet
*/
/**
* Meters per unit lookup table.
* @const
* @type {MetersPerUnitLookup}
* @api
*/
var METERS_PER_UNIT$1 = {
	"radians": 6370997 / (2 * Math.PI),
	"degrees": 2 * Math.PI * 6370997 / 360,
	"ft": .3048,
	"m": 1,
	"us-ft": 1200 / 3937
};
//#endregion
//#region node_modules/ol/proj/Projection.js
/**
* @module ol/proj/Projection
*/
/**
* The function is called with a `number` view resolution and a
* {@link module:ol/coordinate~Coordinate} as arguments, and returns the `number` resolution
* in projection units at the passed coordinate.
* @typedef {function(number, import("../coordinate.js").Coordinate):number} GetPointResolution
* @api
*/
/**
* @typedef {Object} Options
* @property {string} code The SRS identifier code, e.g. `EPSG:4326`.
* @property {import("./Units.js").Units} [units] Units. Required unless a
* proj4 projection is defined for `code`.
* @property {import("../extent.js").Extent} [extent] The validity extent for the SRS.
* @property {string} [axisOrientation='enu'] The axis orientation as specified in Proj4.
* @property {boolean} [global=false] Whether the projection is valid for the whole globe.
* @property {number} [metersPerUnit] The meters per unit for the SRS.
* If not provided, the `units` are used to get the meters per unit from the {@link METERS_PER_UNIT}
* lookup table.
* @property {import("../extent.js").Extent} [worldExtent] The world extent for the SRS.
* @property {GetPointResolution} [getPointResolution]
* Function to determine resolution at a point. The function is called with a
* `number` view resolution and a {@link module:ol/coordinate~Coordinate} as arguments, and returns
* the `number` resolution in projection units at the passed coordinate. If this is `undefined`,
* the default {@link module:ol/proj.getPointResolution} function will be used.
*/
/**
* @classdesc
* In most cases, you should not need to create instances of this class.
* Instead, where projection information is required, you can use a string
* projection code or identifier (e.g. `EPSG:4326`) instead of a projection
* instance.
*
* The library includes support for transforming coordinates between the following
* projections:
*
*  WGS 84 / Geographic - Using codes `EPSG:4326`, `CRS:84`, `urn:ogc:def:crs:EPSG:6.6:4326`,
*    `urn:ogc:def:crs:OGC:1.3:CRS84`, `urn:ogc:def:crs:OGC:2:84`, `http://www.opengis.net/gml/srs/epsg.xml#4326`,
*    or `urn:x-ogc:def:crs:EPSG:4326`
*  WGS 84 / Spherical Mercator - Using codes `EPSG:3857`, `EPSG:102100`, `EPSG:102113`, `EPSG:900913`,
*    `urn:ogc:def:crs:EPSG:6.18:3:3857`, or `http://www.opengis.net/gml/srs/epsg.xml#3857`
*  WGS 84 / UTM zones - Using codes `EPSG:32601` through `EPSG:32660` for northern zones
*    and `EPSG:32701` through `EPSG:32760` for southern zones. Note that the built-in UTM transforms
*    are lower accuracy (with errors on the order of 0.1 m) than those that you might get in a
*    library like [proj4js](https://github.com/proj4js/proj4js).
*
* For additional projection support, or to use higher accuracy transforms than the built-in ones, you can use
* the [proj4js](https://github.com/proj4js/proj4js) library. With `proj4js`, after adding any new projection
* definitions, call the {@link module:ol/proj/proj4.register} function.
*
* You can use the {@link module:ol/proj.get} function to retrieve a projection instance
* for one of the registered projections.
*
* @api
*/
var Projection = class {
	/**
	* @param {Options} options Projection options.
	*/
	constructor(options) {
		/**
		* @private
		* @type {string}
		*/
		this.code_ = options.code;
		/**
		* Units of projected coordinates. When set to `TILE_PIXELS`, a
		* `this.extent_` and `this.worldExtent_` must be configured properly for each
		* tile.
		* @private
		* @type {import("./Units.js").Units}
		*/
		this.units_ = options.units;
		/**
		* Validity extent of the projection in projected coordinates. For projections
		* with `TILE_PIXELS` units, this is the extent of the tile in
		* tile pixel space.
		* @private
		* @type {import("../extent.js").Extent}
		*/
		this.extent_ = options.extent !== void 0 ? options.extent : null;
		/**
		* Extent of the world in EPSG:4326. For projections with
		* `TILE_PIXELS` units, this is the extent of the tile in
		* projected coordinate space.
		* @private
		* @type {import("../extent.js").Extent}
		*/
		this.worldExtent_ = options.worldExtent !== void 0 ? options.worldExtent : null;
		/**
		* @private
		* @type {string}
		*/
		this.axisOrientation_ = options.axisOrientation !== void 0 ? options.axisOrientation : "enu";
		/**
		* @private
		* @type {boolean}
		*/
		this.global_ = options.global !== void 0 ? options.global : false;
		/**
		* @private
		* @type {boolean}
		*/
		this.canWrapX_ = !!(this.global_ && this.extent_);
		/**
		* @private
		* @type {GetPointResolution|undefined}
		*/
		this.getPointResolutionFunc_ = options.getPointResolution;
		/**
		* @private
		* @type {import("../tilegrid/TileGrid.js").default}
		*/
		this.defaultTileGrid_ = null;
		/**
		* @private
		* @type {number|undefined}
		*/
		this.metersPerUnit_ = options.metersPerUnit;
	}
	/**
	* @return {boolean} The projection is suitable for wrapping the x-axis
	*/
	canWrapX() {
		return this.canWrapX_;
	}
	/**
	* Get the code for this projection, e.g. 'EPSG:4326'.
	* @return {string} Code.
	* @api
	*/
	getCode() {
		return this.code_;
	}
	/**
	* Get the validity extent for this projection.
	* @return {import("../extent.js").Extent} Extent.
	* @api
	*/
	getExtent() {
		return this.extent_;
	}
	/**
	* Get the units of this projection.
	* @return {import("./Units.js").Units} Units.
	* @api
	*/
	getUnits() {
		return this.units_;
	}
	/**
	* Get the amount of meters per unit of this projection.  If the projection is
	* not configured with `metersPerUnit` or a units identifier, the return is
	* `undefined`.
	* @return {number|undefined} Meters.
	* @api
	*/
	getMetersPerUnit() {
		return this.metersPerUnit_ || METERS_PER_UNIT$1[this.units_];
	}
	/**
	* Get the world extent for this projection.
	* @return {import("../extent.js").Extent} Extent.
	* @api
	*/
	getWorldExtent() {
		return this.worldExtent_;
	}
	/**
	* Get the axis orientation of this projection.
	* Example values are:
	* enu - the default easting, northing, elevation.
	* neu - northing, easting, up - useful for "lat/long" geographic coordinates,
	*     or south orientated transverse mercator.
	* wnu - westing, northing, up - some planetary coordinate systems have
	*     "west positive" coordinate systems
	* @return {string} Axis orientation.
	* @api
	*/
	getAxisOrientation() {
		return this.axisOrientation_;
	}
	/**
	* Is this projection a global projection which spans the whole world?
	* @return {boolean} Whether the projection is global.
	* @api
	*/
	isGlobal() {
		return this.global_;
	}
	/**
	* Set if the projection is a global projection which spans the whole world
	* @param {boolean} global Whether the projection is global.
	* @api
	*/
	setGlobal(global) {
		this.global_ = global;
		this.canWrapX_ = !!(global && this.extent_);
	}
	/**
	* @return {import("../tilegrid/TileGrid.js").default} The default tile grid.
	*/
	getDefaultTileGrid() {
		return this.defaultTileGrid_;
	}
	/**
	* @param {import("../tilegrid/TileGrid.js").default} tileGrid The default tile grid.
	*/
	setDefaultTileGrid(tileGrid) {
		this.defaultTileGrid_ = tileGrid;
	}
	/**
	* Set the validity extent for this projection.
	* @param {import("../extent.js").Extent} extent Extent.
	* @api
	*/
	setExtent(extent) {
		this.extent_ = extent;
		this.canWrapX_ = !!(this.global_ && extent);
	}
	/**
	* Set the world extent for this projection.
	* @param {import("../extent.js").Extent} worldExtent World extent
	*     [minlon, minlat, maxlon, maxlat].
	* @api
	*/
	setWorldExtent(worldExtent) {
		this.worldExtent_ = worldExtent;
	}
	/**
	* Set the getPointResolution function (see {@link module:ol/proj.getPointResolution}
	* for this projection.
	* @param {function(number, import("../coordinate.js").Coordinate):number} func Function
	* @api
	*/
	setGetPointResolution(func) {
		this.getPointResolutionFunc_ = func;
	}
	/**
	* Get the custom point resolution function for this projection (if set).
	* @return {GetPointResolution|undefined} The custom point
	* resolution function (if set).
	*/
	getPointResolutionFunc() {
		return this.getPointResolutionFunc_;
	}
};
//#endregion
//#region node_modules/ol/proj/epsg3857.js
/**
* @module ol/proj/epsg3857
*/
/**
* Radius of WGS84 sphere
*
* @const
* @type {number}
*/
var RADIUS$1 = 6378137;
/**
* @const
* @type {number}
*/
var HALF_SIZE = Math.PI * RADIUS$1;
/**
* @const
* @type {import("../extent.js").Extent}
*/
var EXTENT$1 = [
	-HALF_SIZE,
	-HALF_SIZE,
	HALF_SIZE,
	HALF_SIZE
];
/**
* @const
* @type {import("../extent.js").Extent}
*/
var WORLD_EXTENT = [
	-180,
	-85,
	180,
	85
];
/**
* Maximum safe value in y direction
* @const
* @type {number}
*/
var MAX_SAFE_Y = RADIUS$1 * Math.log(Math.tan(Math.PI / 2));
/**
* @classdesc
* Projection object for web/spherical Mercator (EPSG:3857).
*/
var EPSG3857Projection = class extends Projection {
	/**
	* @param {string} code Code.
	*/
	constructor(code) {
		super({
			code,
			units: "m",
			extent: EXTENT$1,
			global: true,
			worldExtent: WORLD_EXTENT,
			getPointResolution: function(resolution, point) {
				return resolution / Math.cosh(point[1] / RADIUS$1);
			}
		});
	}
};
/**
* Projections equal to EPSG:3857.
*
* @const
* @type {Array<import("./Projection.js").default>}
*/
var PROJECTIONS$1 = [
	new EPSG3857Projection("EPSG:3857"),
	new EPSG3857Projection("EPSG:102100"),
	new EPSG3857Projection("EPSG:102113"),
	new EPSG3857Projection("EPSG:900913"),
	new EPSG3857Projection("http://www.opengis.net/def/crs/EPSG/0/3857"),
	new EPSG3857Projection("http://www.opengis.net/gml/srs/epsg.xml#3857")
];
/**
* Transformation from EPSG:4326 to EPSG:3857.
*
* @param {Array<number>} input Input array of coordinate values.
* @param {Array<number>} [output] Output array of coordinate values.
* @param {number} [dimension] Dimension (default is `2`).
* @param {number} [stride] Stride (default is `dimension`).
* @return {Array<number>} Output array of coordinate values.
*/
function fromEPSG4326(input, output, dimension, stride) {
	const length = input.length;
	dimension = dimension > 1 ? dimension : 2;
	stride = stride ?? dimension;
	if (output === void 0) if (dimension > 2) output = input.slice();
	else output = new Array(length);
	for (let i = 0; i < length; i += stride) {
		output[i] = HALF_SIZE * input[i] / 180;
		let y = RADIUS$1 * Math.log(Math.tan(Math.PI * (+input[i + 1] + 90) / 360));
		if (y > MAX_SAFE_Y) y = MAX_SAFE_Y;
		else if (y < -MAX_SAFE_Y) y = -MAX_SAFE_Y;
		output[i + 1] = y;
	}
	return output;
}
/**
* Transformation from EPSG:3857 to EPSG:4326.
*
* @param {Array<number>} input Input array of coordinate values.
* @param {Array<number>} [output] Output array of coordinate values.
* @param {number} [dimension] Dimension (default is `2`).
* @param {number} [stride] Stride (default is `dimension`).
* @return {Array<number>} Output array of coordinate values.
*/
function toEPSG4326(input, output, dimension, stride) {
	const length = input.length;
	dimension = dimension > 1 ? dimension : 2;
	stride = stride ?? dimension;
	if (output === void 0) if (dimension > 2) output = input.slice();
	else output = new Array(length);
	for (let i = 0; i < length; i += stride) {
		output[i] = 180 * input[i] / HALF_SIZE;
		output[i + 1] = 360 * Math.atan(Math.exp(input[i + 1] / RADIUS$1)) / Math.PI - 90;
	}
	return output;
}
//#endregion
//#region node_modules/ol/proj/epsg4326.js
/**
* @module ol/proj/epsg4326
*/
/**
* Semi-major radius of the WGS84 ellipsoid.
*
* @const
* @type {number}
*/
var RADIUS = 6378137;
/**
* Extent of the EPSG:4326 projection which is the whole world.
*
* @const
* @type {import("../extent.js").Extent}
*/
var EXTENT = [
	-180,
	-90,
	180,
	90
];
/**
* @const
* @type {number}
*/
var METERS_PER_UNIT = Math.PI * RADIUS / 180;
/**
* @classdesc
* Projection object for WGS84 geographic coordinates (EPSG:4326).
*
* Note that OpenLayers does not strictly comply with the EPSG definition.
* The EPSG registry defines 4326 as a CRS for Latitude,Longitude (y,x).
* OpenLayers treats EPSG:4326 as a pseudo-projection, with x,y coordinates.
*/
var EPSG4326Projection = class extends Projection {
	/**
	* @param {string} code Code.
	* @param {string} [axisOrientation] Axis orientation.
	*/
	constructor(code, axisOrientation) {
		super({
			code,
			units: "degrees",
			extent: EXTENT,
			axisOrientation,
			global: true,
			metersPerUnit: METERS_PER_UNIT,
			worldExtent: EXTENT
		});
	}
};
/**
* Projections equal to EPSG:4326.
*
* @const
* @type {Array<import("./Projection.js").default>}
*/
var PROJECTIONS = [
	new EPSG4326Projection("CRS:84"),
	new EPSG4326Projection("EPSG:4326", "neu"),
	new EPSG4326Projection("urn:ogc:def:crs:OGC:1.3:CRS84"),
	new EPSG4326Projection("urn:ogc:def:crs:OGC:2:84"),
	new EPSG4326Projection("http://www.opengis.net/def/crs/OGC/1.3/CRS84"),
	new EPSG4326Projection("http://www.opengis.net/gml/srs/epsg.xml#4326", "neu"),
	new EPSG4326Projection("http://www.opengis.net/def/crs/EPSG/0/4326", "neu")
];
//#endregion
//#region node_modules/ol/proj/projections.js
/**
* @module ol/proj/projections
*/
/**
* @type {Object<string, import("./Projection.js").default>}
*/
var cache = {};
/**
* Add a projection to the cache.
* @param {string} code The projection code.
* @param {import("./Projection.js").default} projection The projection to cache.
*/
function add$1(code, projection) {
	cache[code] = projection;
}
//#endregion
//#region node_modules/ol/proj/transforms.js
/**
* @private
* @type {!Object<string, Object<string, import("../proj.js").TransformFunction>>}
*/
var transforms = {};
/**
* Registers a conversion function to convert coordinates from the source
* projection to the destination projection.
*
* @param {import("./Projection.js").default} source Source.
* @param {import("./Projection.js").default} destination Destination.
* @param {import("../proj.js").TransformFunction} transformFn Transform.
*/
function add(source, destination, transformFn) {
	const sourceCode = source.getCode();
	const destinationCode = destination.getCode();
	if (!(sourceCode in transforms)) transforms[sourceCode] = {};
	transforms[sourceCode][destinationCode] = transformFn;
}
//#endregion
//#region node_modules/ol/proj.js
/**
* @param {Array<number>} input Input coordinate array.
* @param {Array<number>} [output] Output array of coordinate values.
* @return {Array<number>} Output coordinate array (new array, same coordinate
*     values).
*/
function cloneTransform(input, output) {
	if (output !== void 0) {
		for (let i = 0, ii = input.length; i < ii; ++i) output[i] = input[i];
		output = output;
	} else output = input.slice();
	return output;
}
/**
* Add a Projection object to the list of supported projections that can be
* looked up by their code.
*
* @param {Projection} projection Projection instance.
* @api
*/
function addProjection(projection) {
	add$1(projection.getCode(), projection);
	add(projection, projection, cloneTransform);
}
/**
* @param {Array<Projection>} projections Projections.
*/
function addProjections(projections) {
	projections.forEach(addProjection);
}
/**
* Registers transformation functions that don't alter coordinates. Those allow
* to transform between projections with equal meaning.
*
* @param {Array<Projection>} projections Projections.
* @api
*/
function addEquivalentProjections(projections) {
	addProjections(projections);
	projections.forEach(function(source) {
		projections.forEach(function(destination) {
			if (source !== destination) add(source, destination, cloneTransform);
		});
	});
}
/**
* Registers transformation functions to convert coordinates in any projection
* in projection1 to any projection in projection2.
*
* @param {Array<Projection>} projections1 Projections with equal
*     meaning.
* @param {Array<Projection>} projections2 Projections with equal
*     meaning.
* @param {TransformFunction} forwardTransform Transformation from any
*   projection in projection1 to any projection in projection2.
* @param {TransformFunction} inverseTransform Transform from any projection
*   in projection2 to any projection in projection1..
*/
function addEquivalentTransforms(projections1, projections2, forwardTransform, inverseTransform) {
	projections1.forEach(function(projection1) {
		projections2.forEach(function(projection2) {
			add(projection1, projection2, forwardTransform);
			add(projection2, projection1, inverseTransform);
		});
	});
}
/**
* Add transforms to and from EPSG:4326 and EPSG:3857.  This function is called
* by when this module is executed and should only need to be called again after
* `clearAllProjections()` is called (e.g. in tests).
*/
function addCommon() {
	addEquivalentProjections(PROJECTIONS$1);
	addEquivalentProjections(PROJECTIONS);
	addEquivalentTransforms(PROJECTIONS, PROJECTIONS$1, fromEPSG4326, toEPSG4326);
}
addCommon();
//#endregion
//#region node_modules/flatgeobuf/lib/mjs/geojson/geometry.js
function fromGeometry(t, o) {
	let n = o;
	if (n === GeometryType.Unknown && (n = t.type()), n === GeometryType.GeometryCollection) {
		let r = [];
		for (let e = 0; e < t.partsLength(); e++) {
			let o = t.parts(e), n = o.type();
			r.push(fromGeometry(o, n));
		}
		return {
			type: GeometryType[n],
			geometries: r
		};
	}
	if (n === GeometryType.MultiPolygon) {
		let r = [];
		for (let o = 0; o < t.partsLength(); o++) r.push(fromGeometry(t.parts(o), GeometryType.Polygon));
		return {
			type: GeometryType[n],
			coordinates: r.map((e) => e.coordinates)
		};
	}
	let i = function(t, o) {
		let n = t.xyArray(), i = t.zArray();
		switch (o) {
			case GeometryType.Point: {
				let e = Array.from(n);
				return i && e.push(i[0]), e;
			}
			case GeometryType.MultiPoint:
			case GeometryType.LineString: return pairFlatCoordinates(n, i);
			case GeometryType.MultiLineString:
			case GeometryType.Polygon: return function(e, t, o) {
				let n;
				if (!o || 0 === o.length) return [pairFlatCoordinates(e, t)];
				let i = 0, a = Array.from(o).map((t) => e.slice(i, i = t << 1));
				return t && (i = 0, n = Array.from(o).map((e) => t.slice(i, i = e))), a.map((e, t) => pairFlatCoordinates(e, n ? n[t] : void 0));
			}(n, i, t.endsArray());
		}
	}(t, n);
	return {
		type: GeometryType[n],
		coordinates: i
	};
}
//#endregion
//#region node_modules/flatgeobuf/lib/mjs/geojson/feature.js
function fromFeature(t, o, m) {
	let p = m.columns;
	return {
		type: "Feature",
		id: t,
		geometry: fromGeometry(o.geometry(), m.geometryType),
		properties: parseProperties(o, p)
	};
}
//#endregion
//#region node_modules/flatgeobuf/lib/mjs/geojson/featurecollection.js
function deserialize$1(e, t) {
	return {
		type: "FeatureCollection",
		features: deserialize$2(e, fromFeature, t)
	};
}
function deserializeStream(e, t) {
	return deserializeStream$1(e, fromFeature, t);
}
function deserializeFiltered(e, t, r, n = !1) {
	return deserializeFiltered$1(e, t, fromFeature, r, n);
}
//#endregion
//#region node_modules/flatgeobuf/lib/mjs/geojson.js
function deserialize(a, t, s, n = !1) {
	return a instanceof Uint8Array ? deserialize$1(a, s) : a instanceof ReadableStream ? deserializeStream(a, s) : deserializeFiltered(a, t, s, n);
}
//#endregion
//#region src/lib/d2s/client.ts
/** Default D2S instance shown in the UI. */
var DEFAULT_D2S_SERVER = "https://ps2.d2s.org";
/** Default titiler instance used to tile Cloud-Optimized GeoTIFFs. */
var DEFAULT_TITILER_URL = "https://titiler.d2s.org";
/**
* Data product types that are not single rasters and cannot be added to the map
* as raster tiles. Mirrors the QGIS plugin's filter.
*/
var NON_RASTER_TYPES = new Set([
	"panoramic",
	"point_cloud",
	"3dgs"
]);
/**
* Single-band elevation products that render poorly without a rescale, so the
* client applies stretched statistics and a terrain colormap for them.
*/
var ELEVATION_TYPES = new Set(["dem", "dsm"]);
/** Raised when a request fails because the session is missing or expired. */
var D2SAuthError = class extends Error {};
/** Strip a trailing slash so paths can be concatenated predictably. */
function normalizeServerUrl(server) {
	return server.trim().replace(/\/+$/, "");
}
/** Build the `application/x-www-form-urlencoded` body for the login request. */
function loginFormBody(email, password) {
	const params = new URLSearchParams();
	params.set("username", email);
	params.set("password", password);
	return params.toString();
}
/** Append the API key to a data product (COG) URL for authenticated streaming. */
function cogUrlWithKey(dataProductUrl, apiKey) {
	return `${dataProductUrl}${dataProductUrl.includes("?") ? "&" : "?"}API_KEY=${encodeURIComponent(apiKey)}`;
}
/** Build a titiler TileJSON URL for a COG, with optional extra query params. */
function titilerTileJsonUrl(titilerBase, cogUrl, extraParams = {}) {
	return `${normalizeServerUrl(titilerBase)}/cog/WebMercatorQuad/tilejson.json?${new URLSearchParams({
		url: cogUrl,
		...extraParams
	}).toString()}`;
}
/** Build a titiler statistics URL for a COG. */
function titilerStatisticsUrl(titilerBase, cogUrl) {
	return `${normalizeServerUrl(titilerBase)}/cog/statistics?${new URLSearchParams({ url: cogUrl }).toString()}`;
}
/** Build the FlatGeobuf URL for a project vector layer. */
function fgbUrl(server, projectId, layerId, apiKey) {
	return `${normalizeServerUrl(server)}/static/projects/${projectId}/vector/${layerId}/${layerId}.fgb?API_KEY=${encodeURIComponent(apiKey)}`;
}
/** Whether a data product can be rendered as a raster tile layer. */
function isRasterDataType(dataType) {
	return !NON_RASTER_TYPES.has(dataType);
}
/** Layer name for a raster data product: `{flight}_{date}_{sensor}_{type}`. */
function dataProductLayerName(flight, dataType) {
	return [
		flight.name || "Flight",
		flight.acquisition_date,
		flight.sensor,
		dataType
	].filter(Boolean).join("_");
}
/** Layer name for a vector map layer: `{projectTitle}_{layerName}`. */
function vectorLayerName(projectTitle, layerName) {
	return `${projectTitle}_${layerName}`;
}
/**
* Client for one D2S instance. Construct, then call {@link login}; subsequent
* calls reuse the session cookie and the fetched API key.
*/
var D2SClient = class {
	server;
	titilerUrl;
	_apiKey = null;
	constructor(server, titilerUrl = DEFAULT_TITILER_URL) {
		this.server = normalizeServerUrl(server);
		this.titilerUrl = normalizeServerUrl(titilerUrl);
	}
	/** The API key fetched after login, or null when not yet available. */
	get apiKey() {
		return this._apiKey;
	}
	/** Build an absolute API URL for a path beginning with `/api/...`. */
	apiUrl(path) {
		return `${this.server}${path}`;
	}
	/** Credentialed GET returning parsed JSON; maps 401 to {@link D2SAuthError}. */
	async getJson(path) {
		const response = await fetch(this.apiUrl(path), {
			method: "GET",
			credentials: "include",
			headers: { Accept: "application/json" }
		});
		if (response.status === 401) throw new D2SAuthError("Session expired. Please log in again.");
		if (!response.ok) throw new Error(`Request failed (${response.status}): ${path}`);
		return await response.json();
	}
	/**
	* Log in to the D2S instance. On success the JWT session cookie is stored by
	* the browser and the user's API key is fetched (requesting a new one if the
	* account does not have one yet).
	*/
	async login(email, password) {
		const response = await fetch(this.apiUrl("/api/v1/auth/access-token"), {
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: loginFormBody(email, password)
		});
		if (response.status === 401 || response.status === 400) throw new D2SAuthError("Invalid email or password.");
		if (!response.ok) throw new Error(`Login failed (${response.status}).`);
		return this.refreshApiKey();
	}
	/** Fetch the current user, requesting an API key if one is not set yet. */
	async refreshApiKey() {
		let user = await this.getCurrentUser();
		if (!user.api_access_token) {
			await this.requestApiKey();
			user = await this.getCurrentUser();
		}
		this._apiKey = user.api_access_token ?? null;
		return user;
	}
	/** GET the current authenticated user. */
	async getCurrentUser() {
		return this.getJson("/api/v1/users/current");
	}
	/** Ask the server to generate an API key for the current user. */
	async requestApiKey() {
		await this.getJson("/api/v1/auth/request-api-key");
	}
	/** List projects that have at least one raster data product. */
	async getProjects() {
		return this.getJson("/api/v1/projects?has_raster=true");
	}
	/** List flights with rasters for a project. */
	async getFlights(projectId) {
		return this.getJson(`/api/v1/projects/${projectId}/flights?has_raster=true`);
	}
	/** List data products for a flight. */
	async getDataProducts(projectId, flightId) {
		return this.getJson(`/api/v1/projects/${projectId}/flights/${flightId}/data_products`);
	}
	/** List project-level vector map layers. */
	async getVectorLayers(projectId) {
		return this.getJson(`/api/v1/projects/${projectId}/vector_layers`);
	}
	/** Build the FlatGeobuf URL for a vector layer (requires an API key). */
	fgbUrlFor(projectId, layerId) {
		if (!this._apiKey) throw new D2SAuthError("Not authenticated.");
		return fgbUrl(this.server, projectId, layerId, this._apiKey);
	}
	/**
	* Resolve a data product into a renderable raster tile source using titiler.
	* Elevation products (DEM/DSM) are stretched to their 2nd/98th percentiles
	* and given a terrain colormap; other products render with titiler defaults.
	*/
	async getRasterTileSource(dataProduct) {
		if (!this._apiKey) throw new D2SAuthError("Not authenticated.");
		const cogUrl = cogUrlWithKey(dataProduct.url, this._apiKey);
		const extraParams = {};
		if (ELEVATION_TYPES.has(dataProduct.data_type)) {
			const rescale = await this.tryElevationRescale(cogUrl);
			if (rescale) {
				extraParams.rescale = rescale;
				extraParams.colormap_name = "terrain";
			}
		}
		const tileJsonUrl = titilerTileJsonUrl(this.titilerUrl, cogUrl, extraParams);
		const response = await fetch(tileJsonUrl, { headers: { Accept: "application/json" } });
		if (!response.ok) throw new Error(`titiler request failed (${response.status}).`);
		const tileJson = await response.json();
		const bounds = Array.isArray(tileJson.bounds) && tileJson.bounds.length === 4 ? tileJson.bounds : void 0;
		return {
			tiles: tileJson.tiles,
			bounds,
			minzoom: tileJson.minzoom,
			maxzoom: tileJson.maxzoom
		};
	}
	/**
	* Best-effort `min,max` rescale string from titiler band statistics. Returns
	* null if statistics are unavailable, so the caller can render without a
	* rescale rather than fail.
	*/
	async tryElevationRescale(cogUrl) {
		try {
			const response = await fetch(titilerStatisticsUrl(this.titilerUrl, cogUrl), { headers: { Accept: "application/json" } });
			if (!response.ok) return null;
			const stats = await response.json();
			const band = stats.b1 ?? Object.values(stats)[0];
			if (!band) return null;
			const min = band.percentile_2 ?? band.min;
			const max = band.percentile_98 ?? band.max;
			if (typeof min !== "number" || typeof max !== "number" || min === max) return null;
			return `${min},${max}`;
		} catch {
			return null;
		}
	}
};
//#endregion
//#region src/lib/core/PluginControl.ts
/**
* Default options for the PluginControl.
*
* The host-capability callbacks default to safe behaviour so the control works
* as a standalone MapLibre control. The GeoLibre wrapper (`src/geolibre.ts`)
* binds them to the real host APIs when the plugin runs inside GeoLibre.
*/
var DEFAULT_OPTIONS = {
	collapsed: true,
	position: "top-left",
	title: "Data to Science (D2S)",
	panelWidth: 320,
	className: "",
	pickFiles: () => Promise.resolve(null),
	registerNativeLayer: () => void 0,
	unregisterNativeLayer: () => void 0,
	fetchArrayBuffer: async (url) => (await fetch(url)).arrayBuffer(),
	fitBounds: () => void 0,
	serverUrl: DEFAULT_D2S_SERVER,
	titilerUrl: DEFAULT_TITILER_URL
};
/**
* A MapLibre GL control that browses a Data to Science (D2S) instance: log in,
* pick a project and flight, then add raster data products (tiled via titiler)
* and project vector layers (FlatGeobuf) to the map.
*
* @example
* ```typescript
* const control = new PluginControl({ serverUrl: 'https://ps2.d2s.org' });
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
	_client = null;
	_projects = [];
	_flights = [];
	_dataProducts = [];
	_vectorLayers = [];
	_flightsCache = new globalThis.Map();
	_dataProductsCache = new globalThis.Map();
	_vectorLayersCache = new globalThis.Map();
	_serverInput;
	_emailInput;
	_passwordInput;
	_loginButton;
	_browseSection;
	_projectSelect;
	_flightSelect;
	_dataProductsList;
	_dataProductsButton;
	_vectorSection;
	_vectorList;
	_vectorButton;
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
			data: { serverUrl: this._options.serverUrl }
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
		const serverUrl = this._state.data?.serverUrl;
		if (this._serverInput && typeof serverUrl === "string") this._serverInput.value = serverUrl;
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
	* Preset the D2S server URL (satisfies {@link DeepLinkConsumer}). The GeoLibre
	* wrapper routes a `?d2s-server=<url>` URL parameter here.
	*
	* @param value - The D2S server URL
	*/
	setServerUrl(value) {
		this.setState({ data: {
			...this._state.data,
			serverUrl: value
		} });
		if (this._serverInput) this._serverInput.value = value;
	}
	/** Log in to the D2S instance using the values in the auth form. */
	async _handleLogin() {
		const server = this._serverInput?.value.trim() || "https://ps2.d2s.org";
		const email = this._emailInput?.value.trim() ?? "";
		const password = this._passwordInput?.value ?? "";
		if (!email || !password) {
			this._setStatus("Enter your email and password.");
			return;
		}
		this.setState({ data: {
			...this._state.data,
			serverUrl: server
		} });
		this._client = new D2SClient(server, this._options.titilerUrl);
		this._setBusy(true);
		this._setStatus("Signing in...");
		try {
			await this._client.login(email, password);
			if (this._passwordInput) this._passwordInput.value = "";
			this._setStatus("Loading projects...");
			await this._loadProjects();
			this._showBrowseSection(true);
			this._setStatus("Ready");
		} catch (error) {
			this._client = null;
			this._showBrowseSection(false);
			this._setStatus(this._errorMessage(error, "Login failed."));
		} finally {
			this._setBusy(false);
		}
	}
	/** Fetch projects and populate the project select. */
	async _loadProjects() {
		if (!this._client) return;
		this._projects = await this._client.getProjects();
		this._populateSelect(this._projectSelect, this._projects.map((p) => p.title || "(untitled project)"), "Select a project...");
		this._flights = [];
		this._dataProducts = [];
		this._vectorLayers = [];
		this._populateSelect(this._flightSelect, [], "Select a flight...");
		this._renderDataProducts();
		this._renderVectorLayers();
	}
	/** Handle project selection: load its flights and vector layers. */
	async _onProjectChange() {
		const project = this._selectedProject();
		if (!this._client || !project) return;
		this._setBusy(true);
		this._setStatus("Loading flights...");
		try {
			await Promise.all([this._loadFlights(project), this._loadVectorLayers(project)]);
			this._setStatus("Ready");
		} catch (error) {
			this._setStatus(this._errorMessage(error, "Failed to load project."));
		} finally {
			this._setBusy(false);
		}
	}
	/** Fetch (or read cached) flights for a project. */
	async _loadFlights(project) {
		if (!this._client) return;
		let flights = this._flightsCache.get(project.id);
		if (!flights) {
			flights = await this._client.getFlights(project.id);
			this._flightsCache.set(project.id, flights);
		}
		this._flights = flights;
		this._populateSelect(this._flightSelect, flights.map((f) => f.name || `Flight ${f.acquisition_date ?? ""}`.trim()), "Select a flight...");
		this._dataProducts = [];
		this._renderDataProducts();
	}
	/** Handle flight selection: load its data products. */
	async _onFlightChange() {
		const project = this._selectedProject();
		const flight = this._selectedFlight();
		if (!this._client || !project || !flight) return;
		this._setBusy(true);
		this._setStatus("Loading data products...");
		try {
			let products = this._dataProductsCache.get(flight.id);
			if (!products) {
				products = await this._client.getDataProducts(project.id, flight.id);
				this._dataProductsCache.set(flight.id, products);
			}
			this._dataProducts = products.filter((p) => isRasterDataType(p.data_type)).sort((a, b) => a.data_type.localeCompare(b.data_type));
			this._renderDataProducts();
			this._setStatus(this._dataProducts.length > 0 ? "Ready" : "No raster data products found.");
		} catch (error) {
			this._setStatus(this._errorMessage(error, "Failed to load data products."));
		} finally {
			this._setBusy(false);
		}
	}
	/** Fetch (or read cached) vector layers for a project. */
	async _loadVectorLayers(project) {
		if (!this._client) return;
		let layers = this._vectorLayersCache.get(project.id);
		if (!layers) {
			layers = await this._client.getVectorLayers(project.id);
			this._vectorLayersCache.set(project.id, layers);
		}
		this._vectorLayers = layers;
		this._renderVectorLayers();
	}
	/** Add the checked raster data products to the map via titiler tiles. */
	async _addSelectedRasters() {
		const project = this._selectedProject();
		const flight = this._selectedFlight();
		if (!this._client || !flight) return;
		const selected = this._checkedIndices(this._dataProductsList).map((i) => this._dataProducts[i]);
		if (selected.length === 0) {
			this._setStatus("No data products selected.");
			return;
		}
		this._setBusy(true);
		let added = 0;
		let lastBounds;
		for (const product of selected) try {
			this._setStatus(`Adding ${product.data_type}...`);
			const source = await this._client.getRasterTileSource(product);
			const id = `d2s-raster-${product.id}`;
			const name = dataProductLayerName(flight, product.data_type);
			this._registerNativeLayer({
				id,
				name,
				type: "raster",
				source: {
					type: "raster",
					tiles: source.tiles,
					tileSize: 256,
					...source.bounds ? { bounds: source.bounds } : {},
					...source.minzoom != null ? { minzoom: source.minzoom } : {},
					...source.maxzoom != null ? { maxzoom: source.maxzoom } : {}
				},
				sourceId: `${id}-source`,
				nativeLayerIds: [`${id}-layer`],
				opacity: 1,
				metadata: {
					d2sProjectId: project?.id,
					d2sFlightId: flight.id,
					d2sDataProductId: product.id,
					dataType: product.data_type
				}
			});
			lastBounds = source.bounds ?? lastBounds;
			added += 1;
		} catch (error) {
			this._setStatus(this._errorMessage(error, `Failed to add ${product.data_type}.`));
		}
		if (lastBounds) this._options.fitBounds(lastBounds);
		this._setBusy(false);
		this._setStatus(added > 0 ? `Added ${added} layer${added > 1 ? "s" : ""} to map.` : "No layers added.");
	}
	/** Add the checked vector map layers to the map (FlatGeobuf -> GeoJSON). */
	async _addSelectedVectors() {
		const project = this._selectedProject();
		if (!this._client || !project) return;
		const selected = this._checkedIndices(this._vectorList).map((i) => this._vectorLayers[i]);
		if (selected.length === 0) {
			this._setStatus("No vector layers selected.");
			return;
		}
		this._setBusy(true);
		let added = 0;
		let lastBounds;
		for (const layer of selected) try {
			this._setStatus(`Adding ${layer.layer_name}...`);
			const url = this._client.fgbUrlFor(project.id, layer.layer_id);
			const featureCollection = await this._loadFgb(url);
			const id = `d2s-vector-${layer.layer_id}`;
			this._registerNativeLayer({
				id,
				name: vectorLayerName(project.title, layer.layer_name),
				type: "geojson",
				geojson: featureCollection,
				sourceId: `${id}-source`,
				nativeLayerIds: [`${id}-layer`],
				opacity: 1,
				style: {
					fillColor: "#2f7ed8",
					strokeColor: "#1f5fa8",
					strokeWidth: 1,
					fillOpacity: .3,
					circleRadius: 5
				},
				metadata: {
					d2sProjectId: project.id,
					d2sLayerId: layer.layer_id
				}
			});
			lastBounds = geojsonBounds(featureCollection) ?? lastBounds;
			added += 1;
		} catch (error) {
			this._setStatus(this._errorMessage(error, `Failed to add ${layer.layer_name}.`));
		}
		if (lastBounds) this._options.fitBounds(lastBounds);
		this._setBusy(false);
		this._setStatus(added > 0 ? `Added ${added} vector layer${added > 1 ? "s" : ""} to map.` : "No layers added.");
	}
	/** Fetch a FlatGeobuf file and deserialize it to a GeoJSON FeatureCollection. */
	async _loadFgb(url) {
		const buffer = await this._options.fetchArrayBuffer(url);
		return deserialize(new Uint8Array(buffer));
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
			this._setStatus("Failed to register layer with the host.");
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
	_selectedProject() {
		const index = this._projectSelect?.selectedIndex ?? 0;
		return index > 0 ? this._projects[index - 1] : void 0;
	}
	_selectedFlight() {
		const index = this._flightSelect?.selectedIndex ?? 0;
		return index > 0 ? this._flights[index - 1] : void 0;
	}
	/** Indices of checked items within a check-list container. */
	_checkedIndices(container) {
		if (!container) return [];
		const checkboxes = container.querySelectorAll("input[type=\"checkbox\"]");
		const indices = [];
		checkboxes.forEach((checkbox, index) => {
			if (checkbox.checked) indices.push(index);
		});
		return indices;
	}
	/** Populate a select with a placeholder followed by the given option labels. */
	_populateSelect(select, labels, placeholder) {
		if (!select) return;
		select.innerHTML = "";
		const placeholderOption = document.createElement("option");
		placeholderOption.value = "";
		placeholderOption.textContent = placeholder;
		select.appendChild(placeholderOption);
		labels.forEach((label, index) => {
			const option = document.createElement("option");
			option.value = String(index);
			option.textContent = label;
			select.appendChild(option);
		});
		select.disabled = labels.length === 0;
	}
	/** Render the data products check-list and toggle the add button. */
	_renderDataProducts() {
		this._renderCheckList(this._dataProductsList, this._dataProducts.map((p) => p.data_type));
		if (this._dataProductsButton) this._dataProductsButton.disabled = this._dataProducts.length === 0;
	}
	/** Render the vector layers check-list, hiding the section when empty. */
	_renderVectorLayers() {
		const hasLayers = this._vectorLayers.length > 0;
		if (this._vectorSection) this._vectorSection.style.display = hasLayers ? "" : "none";
		this._renderCheckList(this._vectorList, this._vectorLayers.map((l) => l.layer_name || "Unnamed layer"));
		if (this._vectorButton) this._vectorButton.disabled = !hasLayers;
	}
	/** Render labelled checkboxes into a list container. */
	_renderCheckList(container, labels) {
		if (!container) return;
		container.innerHTML = "";
		if (labels.length === 0) {
			const empty = document.createElement("p");
			empty.className = "plugin-control-placeholder";
			empty.textContent = "Nothing to show yet.";
			container.appendChild(empty);
			return;
		}
		for (const label of labels) {
			const row = document.createElement("label");
			row.className = "d2s-check-row";
			const checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			const text = document.createElement("span");
			text.textContent = label;
			row.appendChild(checkbox);
			row.appendChild(text);
			container.appendChild(row);
		}
	}
	/** Show or hide the post-login browse section. */
	_showBrowseSection(visible) {
		if (this._browseSection) this._browseSection.style.display = visible ? "" : "none";
		if (!visible && this._vectorSection) this._vectorSection.style.display = "none";
	}
	/** Enable/disable form controls while a request is in flight. */
	_setBusy(busy) {
		const controls = [
			this._loginButton,
			this._projectSelect,
			this._flightSelect,
			this._dataProductsButton,
			this._vectorButton
		];
		for (const control of controls) if (control) control.disabled = busy;
	}
	/** Extract a human-readable message from a thrown error. */
	_errorMessage(error, fallback) {
		if (error instanceof D2SAuthError) return error.message;
		if (error instanceof Error && error.message) return error.message;
		return fallback;
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
          <circle cx="12" cy="12" r="3"/>
          <circle cx="5" cy="5" r="2"/>
          <circle cx="19" cy="5" r="2"/>
          <circle cx="5" cy="19" r="2"/>
          <circle cx="19" cy="19" r="2"/>
          <line x1="7" y1="7" x2="10" y2="10"/>
          <line x1="17" y1="7" x2="14" y2="10"/>
          <line x1="7" y1="17" x2="10" y2="14"/>
          <line x1="17" y1="17" x2="14" y2="14"/>
        </svg>
      </span>
    `;
		toggleBtn.addEventListener("click", () => this.toggle());
		container.appendChild(toggleBtn);
		return container;
	}
	/**
	* Creates the panel element with the D2S browse UI.
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
		content.appendChild(this._createAuthSection());
		content.appendChild(this._createBrowseSection());
		const status = document.createElement("div");
		status.className = "plugin-control-status";
		this._status = status;
		content.appendChild(status);
		panel.appendChild(header);
		panel.appendChild(content);
		return panel;
	}
	/** Build the authentication section (server, email, password, login). */
	_createAuthSection() {
		const section = document.createElement("div");
		section.className = "d2s-section";
		this._serverInput = this._createInput(section, "Server", "url", this._state.data?.serverUrl?.toString() ?? this._options.serverUrl);
		this._emailInput = this._createInput(section, "Email", "email");
		this._passwordInput = this._createInput(section, "Password", "password");
		this._passwordInput.addEventListener("keydown", (event) => {
			if (event.key === "Enter") this._handleLogin();
		});
		const loginButton = document.createElement("button");
		loginButton.type = "button";
		loginButton.className = "plugin-control-button d2s-full-width";
		loginButton.textContent = "Log in";
		loginButton.addEventListener("click", () => void this._handleLogin());
		section.appendChild(loginButton);
		this._loginButton = loginButton;
		return section;
	}
	/** Build the post-login browse section (project, flight, layer lists). */
	_createBrowseSection() {
		const section = document.createElement("div");
		section.className = "d2s-section";
		section.style.display = "none";
		this._browseSection = section;
		const divider = document.createElement("div");
		divider.className = "plugin-control-divider";
		section.appendChild(divider);
		this._projectSelect = this._createSelect(section, "Project");
		this._projectSelect.addEventListener("change", () => void this._onProjectChange());
		this._flightSelect = this._createSelect(section, "Flight");
		this._flightSelect.addEventListener("change", () => void this._onFlightChange());
		const dataProductsLabel = document.createElement("label");
		dataProductsLabel.className = "plugin-control-label";
		dataProductsLabel.textContent = "Data products";
		section.appendChild(dataProductsLabel);
		this._dataProductsList = document.createElement("div");
		this._dataProductsList.className = "d2s-check-list";
		section.appendChild(this._dataProductsList);
		this._dataProductsButton = this._createAddButton(section, "Add selected to map");
		this._dataProductsButton.addEventListener("click", () => void this._addSelectedRasters());
		const vectorSection = document.createElement("div");
		vectorSection.className = "d2s-subsection";
		vectorSection.style.display = "none";
		this._vectorSection = vectorSection;
		const vectorLabel = document.createElement("label");
		vectorLabel.className = "plugin-control-label";
		vectorLabel.textContent = "Map layers";
		vectorSection.appendChild(vectorLabel);
		this._vectorList = document.createElement("div");
		this._vectorList.className = "d2s-check-list";
		vectorSection.appendChild(this._vectorList);
		this._vectorButton = this._createAddButton(vectorSection, "Add selected to map");
		this._vectorButton.addEventListener("click", () => void this._addSelectedVectors());
		section.appendChild(vectorSection);
		this._renderDataProducts();
		this._renderVectorLayers();
		return section;
	}
	/** Create a labelled text input and append it to a parent. */
	_createInput(parent, label, type, value = "") {
		const group = document.createElement("div");
		group.className = "plugin-control-group";
		const labelEl = document.createElement("label");
		labelEl.className = "plugin-control-label";
		labelEl.textContent = label;
		const input = document.createElement("input");
		input.type = type;
		input.className = "plugin-control-input";
		input.value = value;
		if (type === "email") input.autocomplete = "username";
		if (type === "password") input.autocomplete = "current-password";
		group.appendChild(labelEl);
		group.appendChild(input);
		parent.appendChild(group);
		return input;
	}
	/** Create a labelled select and append it to a parent. */
	_createSelect(parent, label) {
		const group = document.createElement("div");
		group.className = "plugin-control-group";
		const labelEl = document.createElement("label");
		labelEl.className = "plugin-control-label";
		labelEl.textContent = label;
		const select = document.createElement("select");
		select.className = "plugin-control-input";
		select.disabled = true;
		const placeholder = document.createElement("option");
		placeholder.value = "";
		placeholder.textContent = `Select a ${label.toLowerCase()}...`;
		select.appendChild(placeholder);
		group.appendChild(labelEl);
		group.appendChild(select);
		parent.appendChild(group);
		return select;
	}
	/** Create a disabled-by-default full-width "add" button. */
	_createAddButton(parent, text) {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "plugin-control-button d2s-full-width";
		button.textContent = text;
		button.disabled = true;
		parent.appendChild(button);
		return button;
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
		const rightAnchored = position === "top-right" || position === "bottom-right";
		this._panel.classList.toggle("resize-left", rightAnchored);
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
/**
* Compute `[west, south, east, north]` bounds from a GeoJSON FeatureCollection,
* or null when it carries no coordinates. Used to fit the map after adding a
* vector layer.
*/
function geojsonBounds(fc) {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	const visit = (coords) => {
		if (Array.isArray(coords) && typeof coords[0] === "number" && typeof coords[1] === "number") {
			const [x, y] = coords;
			if (x < minX) minX = x;
			if (y < minY) minY = y;
			if (x > maxX) maxX = x;
			if (y > maxY) maxY = y;
			return;
		}
		if (Array.isArray(coords)) for (const child of coords) visit(child);
	};
	for (const feature of fc.features) {
		const geometry = feature.geometry;
		if (geometry && "coordinates" in geometry) visit(geometry.coordinates);
	}
	if (minX === Infinity) return null;
	return [
		minX,
		minY,
		maxX,
		maxY
	];
}
//#endregion
//#region src/lib/utils/deep-link.ts
/**
* Deep-linking support for the GeoLibre integration. The plugin can be opened
* with the D2S server URL preset by adding a query parameter to the GeoLibre
* URL, e.g. `https://geolibre.app/?d2s-server=https://ps2.d2s.org`.
*
* GeoLibre auto-activates a plugin when a URL carries a parameter the plugin
* declared in `urlParameterNames`, then dispatches the parsed query parameters
* to the plugin's `handleUrlParameters(app, params)` hook. These helpers operate
* purely on a `URLSearchParams`, with no DOM or MapLibre imports, so the logic
* can be unit-tested in isolation.
*/
/** Query-parameter name this plugin owns: presets the D2S server URL. */
var D2S_SERVER_PARAM = "d2s-server";
/**
* Extract the D2S server URL from parsed query parameters. Returns the trimmed
* value, or `null` when the parameter is absent or blank.
*/
function getD2sServerValue(params) {
	const trimmed = params.get(D2S_SERVER_PARAM)?.trim();
	return trimmed ? trimmed : null;
}
/**
* If the query parameters carry a {@link D2S_SERVER_PARAM} value, forward it to
* the consumer. No-op when the parameter is absent or blank.
*/
function maybeHandleDeepLink(consumer, params) {
	const value = getD2sServerValue(params);
	if (value) consumer.setServerUrl(value);
}
//#endregion
//#region src/geolibre.ts
var control = null;
var position = "top-left";
var pendingState = null;
function createControl(app) {
	const nextControl = new PluginControl({
		collapsed: pendingState?.collapsed ?? true,
		panelWidth: pendingState?.panelWidth ?? 320,
		title: "Data to Science (D2S)",
		serverUrl: pendingState?.data?.serverUrl ?? void 0,
		registerNativeLayer: (layer) => app.registerExternalNativeLayer?.(layer),
		unregisterNativeLayer: (id) => app.unregisterExternalNativeLayer?.(id),
		fetchArrayBuffer: app.fetchArrayBuffer ? (url) => app.fetchArrayBuffer(url) : void 0,
		fitBounds: makeFitBounds(app)
	});
	if (pendingState) nextControl.setState(pendingState);
	return nextControl;
}
/**
* Resolve a `fitBounds` callback for the control, preferring the host's
* dedicated capability and falling back to the raw MapLibre map.
*
* Many hosts (including the web viewer) do not implement the optional
* `app.fitBounds`, which would leave the "Add selected to map" action unable to
* zoom to freshly added layers. When the host instead exposes `app.getMap`, we
* drive the map's own `fitBounds` directly. The map is resolved lazily inside
* the callback so it is read when the user adds layers (map ready) rather than
* at activation time (map may still be null).
*
* @param app The GeoLibre host API bound to this plugin's control.
* @returns A bounds-fitting callback, or `undefined` when no host capability can
*   move the viewport.
*/
function makeFitBounds(app) {
	if (app.fitBounds) return (bounds) => app.fitBounds(bounds);
	if (app.getMap) return (bounds) => {
		app.getMap()?.fitBounds(bounds, {
			padding: 40,
			duration: 1e3,
			maxZoom: 18
		});
	};
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
	id: "geolibre-d2s",
	name: "GeoLibre D2S",
	version: "0.1.0",
	urlParameterNames: [D2S_SERVER_PARAM],
	activate(app) {
		control = control ?? createControl(app);
		if (!app.addMapControl(control, position)) {
			control = null;
			return false;
		}
	},
	handleUrlParameters(_app, params) {
		if (control) maybeHandleDeepLink(control, params);
	},
	deactivate(app) {
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
