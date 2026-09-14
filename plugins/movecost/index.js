const COST_FUNCTIONS=[{id:"t",label:"Tobler — on-path (default)",group:"Walking time",unit:"time",costUnit:"hours",uses:["N"]},{id:"tofp",label:"Tobler — off-path",group:"Walking time",unit:"time",costUnit:"hours",uses:[]},{id:"mp",label:"Márquez-Pérez et al. — modified Tobler",group:"Walking time",unit:"time",costUnit:"hours",uses:["N"]},{id:"icmonp",label:"Irmischer-Clarke — male, on-path",group:"Walking time",unit:"time",costUnit:"hours",uses:["N"]},{id:"icmoffp",label:"Irmischer-Clarke — male, off-path",group:"Walking time",unit:"time",costUnit:"hours",uses:[]},{id:"icfonp",label:"Irmischer-Clarke — female, on-path",group:"Walking time",unit:"time",costUnit:"hours",uses:["N"]},{id:"icfoffp",label:"Irmischer-Clarke — female, off-path",group:"Walking time",unit:"time",costUnit:"hours",uses:[]},{id:"ug",label:"Uriarte González",group:"Walking time",unit:"time",costUnit:"hours",uses:["N"]},{id:"ma",label:"Marín Arroyo",group:"Walking time",unit:"time",costUnit:"hours",uses:["N"]},{id:"alb",label:"Alberti — pastoral foraging excursions",group:"Walking time",unit:"time",costUnit:"hours",uses:[]},{id:"gkrs",label:"Garmy, Kaddouri, Rozenblat & Schneider",group:"Walking time",unit:"time",costUnit:"hours",uses:["N"]},{id:"r",label:"Rees",group:"Walking time",unit:"time",costUnit:"hours",uses:["N"]},{id:"ks",label:"Kondo-Seino",group:"Walking time",unit:"time",costUnit:"hours",uses:["N"]},{id:"trp",label:"Tripcevich",group:"Walking time",unit:"time",costUnit:"hours",uses:["N"]},{id:"wcs",label:"Wheeled-vehicle critical slope",group:"Wheeled vehicles",unit:"vehicle",costUnit:"abstract cost",uses:["N","slCrit"]},{id:"ree",label:"Relative energetic expenditure",group:"Abstract cost",unit:"abstract",costUnit:"abstract cost",uses:["N"]},{id:"b",label:"Bellavia",group:"Abstract cost",unit:"abstract",costUnit:"abstract cost",uses:["N"]},{id:"e",label:"Eastman",group:"Abstract cost",unit:"abstract",costUnit:"abstract cost",uses:["N"]},{id:"p",label:"Pandolf et al.",group:"Metabolic energy",unit:"energy",costUnit:"Megawatts",uses:["N","W","L","V"]},{id:"pcf",label:"Pandolf et al. — downhill correction",group:"Metabolic energy",unit:"energy",costUnit:"Megawatts",uses:["N","W","L","V"]},{id:"m",label:"Minetti et al.",group:"Metabolic energy",unit:"energy",costUnit:"J/(kg·m)",uses:["N"]},{id:"hrz",label:"Herzog",group:"Metabolic energy",unit:"energy",costUnit:"J/(kg·m)",uses:["N"]},{id:"vl",label:"Van Leusen",group:"Metabolic energy",unit:"energy",costUnit:"Megawatts",uses:["N","W","L","V"]},{id:"ls",label:"Llobera-Sluckin",group:"Metabolic energy",unit:"energy",costUnit:"kJ/m",uses:["N"]},{id:"a",label:"Ardigò et al.",group:"Metabolic energy",unit:"energy",costUnit:"J/(kg·m)",uses:["N","W","L","V"]},{id:"h",label:"Hare",group:"Metabolic energy",unit:"energy",costUnit:"cal/km",uses:["N"]}];const BY_ID=new Map(COST_FUNCTIONS.map(f2=>[f2.id,f2]));function getCostFunction(id){return BY_ID.get(id)??COST_FUNCTIONS[0]}function isTimeFunction(id){return getCostFunction(id).unit==="time"}function costUnitLabel(id,timeUnit){const funct=getCostFunction(id);if(funct.unit==="time")return timeUnit==="h"?"hours":"minutes";return funct.costUnit}var gr=Object.create;var Et=Object.defineProperty;var br=Object.getOwnPropertyDescriptor;var wr=Object.getOwnPropertyNames;var xr=Object.getPrototypeOf,Er=Object.prototype.hasOwnProperty;var g=(r13,e)=>()=>(e||r13((e={exports:{}}).exports,e),e.exports);var vr=(r13,e,t,s)=>{if(e&&typeof e=="object"||typeof e=="function")for(let n of wr(e))!Er.call(r13,n)&&n!==t&&Et(r13,n,{get:()=>e[n],enumerable:!(s=br(e,n))||s.enumerable});return r13};var vt=(r13,e,t)=>(t=r13!=null?gr(xr(r13)):{},vr(!r13||!r13.__esModule?Et(t,"default",{value:r13,enumerable:true}):t,r13));var fe=g(_=>{Object.defineProperty(_,"__esModule",{value:true});_.getUint64=_.getInt64=_.setInt64=_.setUint64=_.UINT32_MAX=void 0;_.UINT32_MAX=4294967295;function Wr(r13,e,t){let s=t/4294967296,n=t;r13.setUint32(e,s),r13.setUint32(e+4,n)}_.setUint64=Wr;function Ar(r13,e,t){let s=Math.floor(t/4294967296),n=t;r13.setUint32(e,s),r13.setUint32(e+4,n)}_.setInt64=Ar;function Dr(r13,e){let t=r13.getInt32(e),s=r13.getUint32(e+4);return t*4294967296+s}_.getInt64=Dr;function Or(r13,e){let t=r13.getUint32(e),s=r13.getUint32(e+4);return t*4294967296+s}_.getUint64=Or});var _e=g(E=>{var Qe,Ye,Ze;Object.defineProperty(E,"__esModule",{value:true});E.utf8DecodeTD=E.TEXT_DECODER_THRESHOLD=E.utf8DecodeJs=E.utf8EncodeTE=E.TEXT_ENCODER_THRESHOLD=E.utf8EncodeJs=E.utf8Count=void 0;var Nt=fe(),ke=(typeof process>"u"||((Qe=process==null?void 0:process.env)===null||Qe===void 0?void 0:Qe.TEXT_ENCODING)!=="never")&&typeof TextEncoder<"u"&&typeof TextDecoder<"u";function Cr(r13){let e=r13.length,t=0,s=0;for(;s<e;){let n=r13.charCodeAt(s++);if((n&4294967168)===0){t++;continue}else if((n&4294965248)===0)t+=2;else{if(n>=55296&&n<=56319&&s<e){let o=r13.charCodeAt(s);(o&64512)===56320&&(++s,n=((n&1023)<<10)+(o&1023)+65536)}(n&4294901760)===0?t+=3:t+=4}}return t}E.utf8Count=Cr;function Ir(r13,e,t){let s=r13.length,n=t,o=0;for(;o<s;){let a=r13.charCodeAt(o++);if((a&4294967168)===0){e[n++]=a;continue}else if((a&4294965248)===0)e[n++]=a>>6&31|192;else{if(a>=55296&&a<=56319&&o<s){let i=r13.charCodeAt(o);(i&64512)===56320&&(++o,a=((a&1023)<<10)+(i&1023)+65536)}(a&4294901760)===0?(e[n++]=a>>12&15|224,e[n++]=a>>6&63|128):(e[n++]=a>>18&7|240,e[n++]=a>>12&63|128,e[n++]=a>>6&63|128)}e[n++]=a&63|128}}E.utf8EncodeJs=Ir;var me=ke?new TextEncoder:void 0;E.TEXT_ENCODER_THRESHOLD=ke?typeof process<"u"&&((Ye=process==null?void 0:process.env)===null||Ye===void 0?void 0:Ye.TEXT_ENCODING)!=="force"?200:0:Nt.UINT32_MAX;function Ur(r13,e,t){e.set(me.encode(r13),t)}function Nr(r13,e,t){me.encodeInto(r13,e.subarray(t))}E.utf8EncodeTE=me?.encodeInto?Nr:Ur;var Br=4096;function jr(r13,e,t){let s=e,n=s+t,o=[],a="";for(;s<n;){let i=r13[s++];if((i&128)===0)o.push(i);else if((i&224)===192){let c=r13[s++]&63;o.push((i&31)<<6|c)}else if((i&240)===224){let c=r13[s++]&63,R=r13[s++]&63;o.push((i&31)<<12|c<<6|R)}else if((i&248)===240){let c=r13[s++]&63,R=r13[s++]&63,d=r13[s++]&63,M=(i&7)<<18|c<<12|R<<6|d;M>65535&&(M-=65536,o.push(M>>>10&1023|55296),M=56320|M&1023),o.push(M)}else o.push(i);o.length>=Br&&(a+=String.fromCharCode(...o),o.length=0)}return o.length>0&&(a+=String.fromCharCode(...o)),a}E.utf8DecodeJs=jr;var Lr=ke?new TextDecoder:null;E.TEXT_DECODER_THRESHOLD=ke?typeof process<"u"&&((Ze=process==null?void 0:process.env)===null||Ze===void 0?void 0:Ze.TEXT_DECODER)!=="force"?200:0:Nt.UINT32_MAX;function Fr(r13,e,t){let s=r13.subarray(e,e+t);return Lr.decode(s)}E.utf8DecodeTD=Fr});var tt=g(Me=>{Object.defineProperty(Me,"__esModule",{value:true});Me.ExtData=void 0;var et=class{constructor(e,t){this.type=e,this.data=t}};Me.ExtData=et});var Ae=g(We=>{Object.defineProperty(We,"__esModule",{value:true});We.DecodeError=void 0;var rt=class r13 extends Error{constructor(e){super(e);let t=Object.create(r13.prototype);Object.setPrototypeOf(this,t),Object.defineProperty(this,"name",{configurable:true,enumerable:false,value:r13.name})}};We.DecodeError=rt});var st=g(w=>{Object.defineProperty(w,"__esModule",{value:true});w.timestampExtension=w.decodeTimestampExtension=w.decodeTimestampToTimeSpec=w.encodeTimestampExtension=w.encodeDateToTimeSpec=w.encodeTimeSpecToTimestamp=w.EXT_TIMESTAMP=void 0;var Vr=Ae(),Bt=fe();w.EXT_TIMESTAMP=-1;var qr=4294967296-1,Jr=17179869184-1;function jt({sec:r13,nsec:e}){if(r13>=0&&e>=0&&r13<=Jr)if(e===0&&r13<=qr){let t=new Uint8Array(4);return new DataView(t.buffer).setUint32(0,r13),t}else{let t=r13/4294967296,s=r13&4294967295,n=new Uint8Array(8),o=new DataView(n.buffer);return o.setUint32(0,e<<2|t&3),o.setUint32(4,s),n}else{let t=new Uint8Array(12),s=new DataView(t.buffer);return s.setUint32(0,e),(0,Bt.setInt64)(s,4,r13),t}}w.encodeTimeSpecToTimestamp=jt;function Lt(r13){let e=r13.getTime(),t=Math.floor(e/1e3),s=(e-t*1e3)*1e6,n=Math.floor(s/1e9);return{sec:t+n,nsec:s-n*1e9}}w.encodeDateToTimeSpec=Lt;function Ft(r13){if(r13 instanceof Date){let e=Lt(r13);return jt(e)}else return null}w.encodeTimestampExtension=Ft;function Vt(r13){let e=new DataView(r13.buffer,r13.byteOffset,r13.byteLength);switch(r13.byteLength){case 4:return{sec:e.getUint32(0),nsec:0};case 8:{let t=e.getUint32(0),s=e.getUint32(4),n=(t&3)*4294967296+s,o=t>>>2;return{sec:n,nsec:o}}case 12:{let t=(0,Bt.getInt64)(e,4),s=e.getUint32(0);return{sec:t,nsec:s}}default:throw new Vr.DecodeError(`Unrecognized data size for timestamp (expected 4, 8, or 12): ${r13.length}`)}}w.decodeTimestampToTimeSpec=Vt;function qt(r13){let e=Vt(r13);return new Date(e.sec*1e3+e.nsec/1e6)}w.decodeTimestampExtension=qt;w.timestampExtension={type:w.EXT_TIMESTAMP,encode:Ft,decode:qt}});var Ce=g(Oe=>{Object.defineProperty(Oe,"__esModule",{value:true});Oe.ExtensionCodec=void 0;var De=tt(),Hr=st(),Re=class{constructor(){this.builtInEncoders=[],this.builtInDecoders=[],this.encoders=[],this.decoders=[],this.register(Hr.timestampExtension)}register({type:e,encode:t,decode:s}){if(e>=0)this.encoders[e]=t,this.decoders[e]=s;else{let n=1+e;this.builtInEncoders[n]=t,this.builtInDecoders[n]=s}}tryToEncode(e,t){for(let s=0;s<this.builtInEncoders.length;s++){let n=this.builtInEncoders[s];if(n!=null){let o=n(e,t);if(o!=null){let a=-1-s;return new De.ExtData(a,o)}}}for(let s=0;s<this.encoders.length;s++){let n=this.encoders[s];if(n!=null){let o=n(e,t);if(o!=null){let a=s;return new De.ExtData(a,o)}}}return e instanceof De.ExtData?e:null}decode(e,t,s){let n=t<0?this.builtInDecoders[-1-t]:this.decoders[t];return n?n(e,t,s):new De.ExtData(t,e)}};Oe.ExtensionCodec=Re;Re.defaultCodec=new Re});var nt=g(te=>{Object.defineProperty(te,"__esModule",{value:true});te.createDataView=te.ensureUint8Array=void 0;function Jt(r13){return r13 instanceof Uint8Array?r13:ArrayBuffer.isView(r13)?new Uint8Array(r13.buffer,r13.byteOffset,r13.byteLength):r13 instanceof ArrayBuffer?new Uint8Array(r13):Uint8Array.from(r13)}te.ensureUint8Array=Jt;function zr(r13){if(r13 instanceof ArrayBuffer)return new DataView(r13);let e=Jt(r13);return new DataView(e.buffer,e.byteOffset,e.byteLength)}te.createDataView=zr});var at=g(O=>{Object.defineProperty(O,"__esModule",{value:true});O.Encoder=O.DEFAULT_INITIAL_BUFFER_SIZE=O.DEFAULT_MAX_DEPTH=void 0;var ge=_e(),Gr=Ce(),Ht=fe(),$r=nt();O.DEFAULT_MAX_DEPTH=100;O.DEFAULT_INITIAL_BUFFER_SIZE=2048;var ot=class{constructor(e=Gr.ExtensionCodec.defaultCodec,t=void 0,s=O.DEFAULT_MAX_DEPTH,n=O.DEFAULT_INITIAL_BUFFER_SIZE,o=false,a=false,i=false,c=false){this.extensionCodec=e,this.context=t,this.maxDepth=s,this.initialBufferSize=n,this.sortKeys=o,this.forceFloat32=a,this.ignoreUndefined=i,this.forceIntegerToFloat=c,this.pos=0,this.view=new DataView(new ArrayBuffer(this.initialBufferSize)),this.bytes=new Uint8Array(this.view.buffer)}reinitializeState(){this.pos=0}encodeSharedRef(e){return this.reinitializeState(),this.doEncode(e,1),this.bytes.subarray(0,this.pos)}encode(e){return this.reinitializeState(),this.doEncode(e,1),this.bytes.slice(0,this.pos)}doEncode(e,t){if(t>this.maxDepth)throw new Error(`Too deep objects in depth ${t}`);e==null?this.encodeNil():typeof e=="boolean"?this.encodeBoolean(e):typeof e=="number"?this.encodeNumber(e):typeof e=="string"?this.encodeString(e):this.encodeObject(e,t)}ensureBufferSizeToWrite(e){let t=this.pos+e;this.view.byteLength<t&&this.resizeBuffer(t*2)}resizeBuffer(e){let t=new ArrayBuffer(e),s=new Uint8Array(t),n=new DataView(t);s.set(this.bytes),this.view=n,this.bytes=s}encodeNil(){this.writeU8(192)}encodeBoolean(e){e===false?this.writeU8(194):this.writeU8(195)}encodeNumber(e){Number.isSafeInteger(e)&&!this.forceIntegerToFloat?e>=0?e<128?this.writeU8(e):e<256?(this.writeU8(204),this.writeU8(e)):e<65536?(this.writeU8(205),this.writeU16(e)):e<4294967296?(this.writeU8(206),this.writeU32(e)):(this.writeU8(207),this.writeU64(e)):e>=-32?this.writeU8(224|e+32):e>=-128?(this.writeU8(208),this.writeI8(e)):e>=-32768?(this.writeU8(209),this.writeI16(e)):e>=-2147483648?(this.writeU8(210),this.writeI32(e)):(this.writeU8(211),this.writeI64(e)):this.forceFloat32?(this.writeU8(202),this.writeF32(e)):(this.writeU8(203),this.writeF64(e))}writeStringHeader(e){if(e<32)this.writeU8(160+e);else if(e<256)this.writeU8(217),this.writeU8(e);else if(e<65536)this.writeU8(218),this.writeU16(e);else if(e<4294967296)this.writeU8(219),this.writeU32(e);else throw new Error(`Too long string: ${e} bytes in UTF-8`)}encodeString(e){if(e.length>ge.TEXT_ENCODER_THRESHOLD){let n=(0,ge.utf8Count)(e);this.ensureBufferSizeToWrite(5+n),this.writeStringHeader(n),(0,ge.utf8EncodeTE)(e,this.bytes,this.pos),this.pos+=n}else{let n=(0,ge.utf8Count)(e);this.ensureBufferSizeToWrite(5+n),this.writeStringHeader(n),(0,ge.utf8EncodeJs)(e,this.bytes,this.pos),this.pos+=n}}encodeObject(e,t){let s=this.extensionCodec.tryToEncode(e,this.context);if(s!=null)this.encodeExtension(s);else if(Array.isArray(e))this.encodeArray(e,t);else if(ArrayBuffer.isView(e))this.encodeBinary(e);else if(typeof e=="object")this.encodeMap(e,t);else throw new Error(`Unrecognized object: ${Object.prototype.toString.apply(e)}`)}encodeBinary(e){let t=e.byteLength;if(t<256)this.writeU8(196),this.writeU8(t);else if(t<65536)this.writeU8(197),this.writeU16(t);else if(t<4294967296)this.writeU8(198),this.writeU32(t);else throw new Error(`Too large binary: ${t}`);let s=(0,$r.ensureUint8Array)(e);this.writeU8a(s)}encodeArray(e,t){let s=e.length;if(s<16)this.writeU8(144+s);else if(s<65536)this.writeU8(220),this.writeU16(s);else if(s<4294967296)this.writeU8(221),this.writeU32(s);else throw new Error(`Too large array: ${s}`);for(let n of e)this.doEncode(n,t+1)}countWithoutUndefined(e,t){let s=0;for(let n of t)e[n]!==void 0&&s++;return s}encodeMap(e,t){let s=Object.keys(e);this.sortKeys&&s.sort();let n=this.ignoreUndefined?this.countWithoutUndefined(e,s):s.length;if(n<16)this.writeU8(128+n);else if(n<65536)this.writeU8(222),this.writeU16(n);else if(n<4294967296)this.writeU8(223),this.writeU32(n);else throw new Error(`Too large map object: ${n}`);for(let o of s){let a=e[o];this.ignoreUndefined&&a===void 0||(this.encodeString(o),this.doEncode(a,t+1))}}encodeExtension(e){let t=e.data.length;if(t===1)this.writeU8(212);else if(t===2)this.writeU8(213);else if(t===4)this.writeU8(214);else if(t===8)this.writeU8(215);else if(t===16)this.writeU8(216);else if(t<256)this.writeU8(199),this.writeU8(t);else if(t<65536)this.writeU8(200),this.writeU16(t);else if(t<4294967296)this.writeU8(201),this.writeU32(t);else throw new Error(`Too large extension object: ${t}`);this.writeI8(e.type),this.writeU8a(e.data)}writeU8(e){this.ensureBufferSizeToWrite(1),this.view.setUint8(this.pos,e),this.pos++}writeU8a(e){let t=e.length;this.ensureBufferSizeToWrite(t),this.bytes.set(e,this.pos),this.pos+=t}writeI8(e){this.ensureBufferSizeToWrite(1),this.view.setInt8(this.pos,e),this.pos++}writeU16(e){this.ensureBufferSizeToWrite(2),this.view.setUint16(this.pos,e),this.pos+=2}writeI16(e){this.ensureBufferSizeToWrite(2),this.view.setInt16(this.pos,e),this.pos+=2}writeU32(e){this.ensureBufferSizeToWrite(4),this.view.setUint32(this.pos,e),this.pos+=4}writeI32(e){this.ensureBufferSizeToWrite(4),this.view.setInt32(this.pos,e),this.pos+=4}writeF32(e){this.ensureBufferSizeToWrite(4),this.view.setFloat32(this.pos,e),this.pos+=4}writeF64(e){this.ensureBufferSizeToWrite(8),this.view.setFloat64(this.pos,e),this.pos+=8}writeU64(e){this.ensureBufferSizeToWrite(8),(0,Ht.setUint64)(this.view,this.pos,e),this.pos+=8}writeI64(e){this.ensureBufferSizeToWrite(8),(0,Ht.setInt64)(this.view,this.pos,e),this.pos+=8}};O.Encoder=ot});var zt=g(Ie=>{Object.defineProperty(Ie,"__esModule",{value:true});Ie.encode=void 0;var Xr=at(),Kr={};function Qr(r13,e=Kr){return new Xr.Encoder(e.extensionCodec,e.context,e.maxDepth,e.initialBufferSize,e.sortKeys,e.forceFloat32,e.ignoreUndefined,e.forceIntegerToFloat).encodeSharedRef(r13)}Ie.encode=Qr});var Gt=g(Ue=>{Object.defineProperty(Ue,"__esModule",{value:true});Ue.prettyByte=void 0;function Yr(r13){return`${r13<0?"-":""}0x${Math.abs(r13).toString(16).padStart(2,"0")}`}Ue.prettyByte=Yr});var $t=g(Ne=>{Object.defineProperty(Ne,"__esModule",{value:true});Ne.CachedKeyDecoder=void 0;var Zr=_e(),es=16,ts=16,it=class{constructor(e=es,t=ts){this.maxKeyLength=e,this.maxLengthPerKey=t,this.hit=0,this.miss=0,this.caches=[];for(let s=0;s<this.maxKeyLength;s++)this.caches.push([])}canBeCached(e){return e>0&&e<=this.maxKeyLength}find(e,t,s){let n=this.caches[s-1];e:for(let o of n){let a=o.bytes;for(let i=0;i<s;i++)if(a[i]!==e[t+i])continue e;return o.str}return null}store(e,t){let s=this.caches[e.length-1],n={bytes:e,str:t};s.length>=this.maxLengthPerKey?s[Math.random()*s.length|0]=n:s.push(n)}decode(e,t,s){let n=this.find(e,t,s);if(n!=null)return this.hit++,n;this.miss++;let o=(0,Zr.utf8DecodeJs)(e,t,s),a=Uint8Array.prototype.slice.call(e,t,t+s);return this.store(a,o),o}};Ne.CachedKeyDecoder=it});var Be=g(j=>{Object.defineProperty(j,"__esModule",{value:true});j.Decoder=j.DataViewIndexOutOfBoundsError=void 0;var lt=Gt(),rs=Ce(),X=fe(),ct=_e(),ut=nt(),ss=$t(),B=Ae(),ns=r13=>{let e=typeof r13;return e==="string"||e==="number"},be=-1,dt=new DataView(new ArrayBuffer(0)),os=new Uint8Array(dt.buffer);j.DataViewIndexOutOfBoundsError=(()=>{try{dt.getInt8(0)}catch(r13){return r13.constructor}throw new Error("never reached")})();var Xt=new j.DataViewIndexOutOfBoundsError("Insufficient data"),as=new ss.CachedKeyDecoder,pt=class{constructor(e=rs.ExtensionCodec.defaultCodec,t=void 0,s=X.UINT32_MAX,n=X.UINT32_MAX,o=X.UINT32_MAX,a=X.UINT32_MAX,i=X.UINT32_MAX,c=as){this.extensionCodec=e,this.context=t,this.maxStrLength=s,this.maxBinLength=n,this.maxArrayLength=o,this.maxMapLength=a,this.maxExtLength=i,this.keyDecoder=c,this.totalPos=0,this.pos=0,this.view=dt,this.bytes=os,this.headByte=be,this.stack=[]}reinitializeState(){this.totalPos=0,this.headByte=be,this.stack.length=0}setBuffer(e){this.bytes=(0,ut.ensureUint8Array)(e),this.view=(0,ut.createDataView)(this.bytes),this.pos=0}appendBuffer(e){if(this.headByte===be&&!this.hasRemaining(1))this.setBuffer(e);else{let t=this.bytes.subarray(this.pos),s=(0,ut.ensureUint8Array)(e),n=new Uint8Array(t.length+s.length);n.set(t),n.set(s,t.length),this.setBuffer(n)}}hasRemaining(e){return this.view.byteLength-this.pos>=e}createExtraByteError(e){let{view:t,pos:s}=this;return new RangeError(`Extra ${t.byteLength-s} of ${t.byteLength} byte(s) found at buffer[${e}]`)}decode(e){this.reinitializeState(),this.setBuffer(e);let t=this.doDecodeSync();if(this.hasRemaining(1))throw this.createExtraByteError(this.pos);return t}*decodeMulti(e){for(this.reinitializeState(),this.setBuffer(e);this.hasRemaining(1);)yield this.doDecodeSync()}async decodeAsync(e){let t=false,s;for await(let i of e){if(t)throw this.createExtraByteError(this.totalPos);this.appendBuffer(i);try{s=this.doDecodeSync(),t=true}catch(c){if(!(c instanceof j.DataViewIndexOutOfBoundsError))throw c}this.totalPos+=this.pos}if(t){if(this.hasRemaining(1))throw this.createExtraByteError(this.totalPos);return s}let{headByte:n,pos:o,totalPos:a}=this;throw new RangeError(`Insufficient data in parsing ${(0,lt.prettyByte)(n)} at ${a} (${o} in the current buffer)`)}decodeArrayStream(e){return this.decodeMultiAsync(e,true)}decodeStream(e){return this.decodeMultiAsync(e,false)}async*decodeMultiAsync(e,t){let s=t,n=-1;for await(let o of e){if(t&&n===0)throw this.createExtraByteError(this.totalPos);this.appendBuffer(o),s&&(n=this.readArraySize(),s=false,this.complete());try{for(;yield this.doDecodeSync(),--n!==0;);}catch(a){if(!(a instanceof j.DataViewIndexOutOfBoundsError))throw a}this.totalPos+=this.pos}}doDecodeSync(){e:for(;;){let e=this.readHeadByte(),t;if(e>=224)t=e-256;else if(e<192)if(e<128)t=e;else if(e<144){let n=e-128;if(n!==0){this.pushMapState(n),this.complete();continue e}else t={}}else if(e<160){let n=e-144;if(n!==0){this.pushArrayState(n),this.complete();continue e}else t=[]}else{let n=e-160;t=this.decodeUtf8String(n,0)}else if(e===192)t=null;else if(e===194)t=false;else if(e===195)t=true;else if(e===202)t=this.readF32();else if(e===203)t=this.readF64();else if(e===204)t=this.readU8();else if(e===205)t=this.readU16();else if(e===206)t=this.readU32();else if(e===207)t=this.readU64();else if(e===208)t=this.readI8();else if(e===209)t=this.readI16();else if(e===210)t=this.readI32();else if(e===211)t=this.readI64();else if(e===217){let n=this.lookU8();t=this.decodeUtf8String(n,1)}else if(e===218){let n=this.lookU16();t=this.decodeUtf8String(n,2)}else if(e===219){let n=this.lookU32();t=this.decodeUtf8String(n,4)}else if(e===220){let n=this.readU16();if(n!==0){this.pushArrayState(n),this.complete();continue e}else t=[]}else if(e===221){let n=this.readU32();if(n!==0){this.pushArrayState(n),this.complete();continue e}else t=[]}else if(e===222){let n=this.readU16();if(n!==0){this.pushMapState(n),this.complete();continue e}else t={}}else if(e===223){let n=this.readU32();if(n!==0){this.pushMapState(n),this.complete();continue e}else t={}}else if(e===196){let n=this.lookU8();t=this.decodeBinary(n,1)}else if(e===197){let n=this.lookU16();t=this.decodeBinary(n,2)}else if(e===198){let n=this.lookU32();t=this.decodeBinary(n,4)}else if(e===212)t=this.decodeExtension(1,0);else if(e===213)t=this.decodeExtension(2,0);else if(e===214)t=this.decodeExtension(4,0);else if(e===215)t=this.decodeExtension(8,0);else if(e===216)t=this.decodeExtension(16,0);else if(e===199){let n=this.lookU8();t=this.decodeExtension(n,1)}else if(e===200){let n=this.lookU16();t=this.decodeExtension(n,2)}else if(e===201){let n=this.lookU32();t=this.decodeExtension(n,4)}else throw new B.DecodeError(`Unrecognized type byte: ${(0,lt.prettyByte)(e)}`);this.complete();let s=this.stack;for(;s.length>0;){let n=s[s.length-1];if(n.type===0)if(n.array[n.position]=t,n.position++,n.position===n.size)s.pop(),t=n.array;else continue e;else if(n.type===1){if(!ns(t))throw new B.DecodeError("The type of key must be string or number but "+typeof t);if(t==="__proto__")throw new B.DecodeError("The key __proto__ is not allowed");n.key=t,n.type=2;continue e}else if(n.map[n.key]=t,n.readCount++,n.readCount===n.size)s.pop(),t=n.map;else{n.key=null,n.type=1;continue e}}return t}}readHeadByte(){return this.headByte===be&&(this.headByte=this.readU8()),this.headByte}complete(){this.headByte=be}readArraySize(){let e=this.readHeadByte();switch(e){case 220:return this.readU16();case 221:return this.readU32();default:{if(e<160)return e-144;throw new B.DecodeError(`Unrecognized array type byte: ${(0,lt.prettyByte)(e)}`)}}}pushMapState(e){if(e>this.maxMapLength)throw new B.DecodeError(`Max length exceeded: map length (${e}) > maxMapLengthLength (${this.maxMapLength})`);this.stack.push({type:1,size:e,key:null,readCount:0,map:{}})}pushArrayState(e){if(e>this.maxArrayLength)throw new B.DecodeError(`Max length exceeded: array length (${e}) > maxArrayLength (${this.maxArrayLength})`);this.stack.push({type:0,size:e,array:new Array(e),position:0})}decodeUtf8String(e,t){var s;if(e>this.maxStrLength)throw new B.DecodeError(`Max length exceeded: UTF-8 byte length (${e}) > maxStrLength (${this.maxStrLength})`);if(this.bytes.byteLength<this.pos+t+e)throw Xt;let n=this.pos+t,o;return this.stateIsMapKey()&&(!((s=this.keyDecoder)===null||s===void 0)&&s.canBeCached(e))?o=this.keyDecoder.decode(this.bytes,n,e):e>ct.TEXT_DECODER_THRESHOLD?o=(0,ct.utf8DecodeTD)(this.bytes,n,e):o=(0,ct.utf8DecodeJs)(this.bytes,n,e),this.pos+=t+e,o}stateIsMapKey(){return this.stack.length>0?this.stack[this.stack.length-1].type===1:false}decodeBinary(e,t){if(e>this.maxBinLength)throw new B.DecodeError(`Max length exceeded: bin length (${e}) > maxBinLength (${this.maxBinLength})`);if(!this.hasRemaining(e+t))throw Xt;let s=this.pos+t,n=this.bytes.subarray(s,s+e);return this.pos+=t+e,n}decodeExtension(e,t){if(e>this.maxExtLength)throw new B.DecodeError(`Max length exceeded: ext length (${e}) > maxExtLength (${this.maxExtLength})`);let s=this.view.getInt8(this.pos+t),n=this.decodeBinary(e,t+1);return this.extensionCodec.decode(n,s,this.context)}lookU8(){return this.view.getUint8(this.pos)}lookU16(){return this.view.getUint16(this.pos)}lookU32(){return this.view.getUint32(this.pos)}readU8(){let e=this.view.getUint8(this.pos);return this.pos++,e}readI8(){let e=this.view.getInt8(this.pos);return this.pos++,e}readU16(){let e=this.view.getUint16(this.pos);return this.pos+=2,e}readI16(){let e=this.view.getInt16(this.pos);return this.pos+=2,e}readU32(){let e=this.view.getUint32(this.pos);return this.pos+=4,e}readI32(){let e=this.view.getInt32(this.pos);return this.pos+=4,e}readU64(){let e=(0,X.getUint64)(this.view,this.pos);return this.pos+=8,e}readI64(){let e=(0,X.getInt64)(this.view,this.pos);return this.pos+=8,e}readF32(){let e=this.view.getFloat32(this.pos);return this.pos+=4,e}readF64(){let e=this.view.getFloat64(this.pos);return this.pos+=8,e}};j.Decoder=pt});var ht=g(C=>{Object.defineProperty(C,"__esModule",{value:true});C.decodeMulti=C.decode=C.defaultDecodeOptions=void 0;var Kt=Be();C.defaultDecodeOptions={};function is(r13,e=C.defaultDecodeOptions){return new Kt.Decoder(e.extensionCodec,e.context,e.maxStrLength,e.maxBinLength,e.maxArrayLength,e.maxMapLength,e.maxExtLength).decode(r13)}C.decode=is;function ls(r13,e=C.defaultDecodeOptions){return new Kt.Decoder(e.extensionCodec,e.context,e.maxStrLength,e.maxBinLength,e.maxArrayLength,e.maxMapLength,e.maxExtLength).decodeMulti(r13)}C.decodeMulti=ls});var Zt=g(q=>{Object.defineProperty(q,"__esModule",{value:true});q.ensureAsyncIterable=q.asyncIterableFromStream=q.isAsyncIterable=void 0;function Qt(r13){return r13[Symbol.asyncIterator]!=null}q.isAsyncIterable=Qt;function cs(r13){if(r13==null)throw new Error("Assertion Failure: value must not be null nor undefined")}async function*Yt(r13){let e=r13.getReader();try{for(;;){let{done:t,value:s}=await e.read();if(t)return;cs(s),yield s}}finally{e.releaseLock()}}q.asyncIterableFromStream=Yt;function us(r13){return Qt(r13)?r13:Yt(r13)}q.ensureAsyncIterable=us});var tr=g(I=>{Object.defineProperty(I,"__esModule",{value:true});I.decodeStream=I.decodeMultiStream=I.decodeArrayStream=I.decodeAsync=void 0;var yt=Be(),ft=Zt(),je=ht();async function ps(r13,e=je.defaultDecodeOptions){let t=(0,ft.ensureAsyncIterable)(r13);return new yt.Decoder(e.extensionCodec,e.context,e.maxStrLength,e.maxBinLength,e.maxArrayLength,e.maxMapLength,e.maxExtLength).decodeAsync(t)}I.decodeAsync=ps;function ds(r13,e=je.defaultDecodeOptions){let t=(0,ft.ensureAsyncIterable)(r13);return new yt.Decoder(e.extensionCodec,e.context,e.maxStrLength,e.maxBinLength,e.maxArrayLength,e.maxMapLength,e.maxExtLength).decodeArrayStream(t)}I.decodeArrayStream=ds;function er(r13,e=je.defaultDecodeOptions){let t=(0,ft.ensureAsyncIterable)(r13);return new yt.Decoder(e.extensionCodec,e.context,e.maxStrLength,e.maxBinLength,e.maxArrayLength,e.maxMapLength,e.maxExtLength).decodeStream(t)}I.decodeMultiStream=er;function hs(r13,e=je.defaultDecodeOptions){return er(r13,e)}I.decodeStream=hs});var nr=g(u=>{Object.defineProperty(u,"__esModule",{value:true});u.decodeTimestampExtension=u.encodeTimestampExtension=u.decodeTimestampToTimeSpec=u.encodeTimeSpecToTimestamp=u.encodeDateToTimeSpec=u.EXT_TIMESTAMP=u.ExtData=u.ExtensionCodec=u.Encoder=u.DataViewIndexOutOfBoundsError=u.DecodeError=u.Decoder=u.decodeStream=u.decodeMultiStream=u.decodeArrayStream=u.decodeAsync=u.decodeMulti=u.decode=u.encode=void 0;var ys=zt();Object.defineProperty(u,"encode",{enumerable:true,get:function(){return ys.encode}});var rr=ht();Object.defineProperty(u,"decode",{enumerable:true,get:function(){return rr.decode}});Object.defineProperty(u,"decodeMulti",{enumerable:true,get:function(){return rr.decodeMulti}});var Le=tr();Object.defineProperty(u,"decodeAsync",{enumerable:true,get:function(){return Le.decodeAsync}});Object.defineProperty(u,"decodeArrayStream",{enumerable:true,get:function(){return Le.decodeArrayStream}});Object.defineProperty(u,"decodeMultiStream",{enumerable:true,get:function(){return Le.decodeMultiStream}});Object.defineProperty(u,"decodeStream",{enumerable:true,get:function(){return Le.decodeStream}});var sr=Be();Object.defineProperty(u,"Decoder",{enumerable:true,get:function(){return sr.Decoder}});Object.defineProperty(u,"DataViewIndexOutOfBoundsError",{enumerable:true,get:function(){return sr.DataViewIndexOutOfBoundsError}});var fs=Ae();Object.defineProperty(u,"DecodeError",{enumerable:true,get:function(){return fs.DecodeError}});var ms=at();Object.defineProperty(u,"Encoder",{enumerable:true,get:function(){return ms.Encoder}});var Rs=Ce();Object.defineProperty(u,"ExtensionCodec",{enumerable:true,get:function(){return Rs.ExtensionCodec}});var gs=tt();Object.defineProperty(u,"ExtData",{enumerable:true,get:function(){return gs.ExtData}});var re=st();Object.defineProperty(u,"EXT_TIMESTAMP",{enumerable:true,get:function(){return re.EXT_TIMESTAMP}});Object.defineProperty(u,"encodeDateToTimeSpec",{enumerable:true,get:function(){return re.encodeDateToTimeSpec}});Object.defineProperty(u,"encodeTimeSpecToTimestamp",{enumerable:true,get:function(){return re.encodeTimeSpecToTimestamp}});Object.defineProperty(u,"decodeTimestampToTimeSpec",{enumerable:true,get:function(){return re.decodeTimestampToTimeSpec}});Object.defineProperty(u,"encodeTimestampExtension",{enumerable:true,get:function(){return re.encodeTimestampExtension}});Object.defineProperty(u,"decodeTimestampExtension",{enumerable:true,get:function(){return re.decodeTimestampExtension}})});var pr=g((Ro,Es)=>{Es.exports={Receiver:"",Sender:"",WebSocket:"",WebSocketServer:"",createWebSocketStream:"",default:""}});var gt=g((So,vs)=>{vs.exports={BroadcastChannel:"",MessageChannel:"",MessagePort:"",SHARE_ENV:"",Worker:"",default:"",getEnvironmentData:"",isMainThread:"",markAsUntransferable:"",moveMessagePortToContext:"",parentPort:"",postMessageToThread:"",receiveMessageOnPort:"",resourceLimits:"",setEnvironmentData:"",threadId:"",workerData:""}});var P=class extends Error{constructor(e){super(e),this.name=this.constructor.name,Object.setPrototypeOf(this,new.target.prototype)}},T=class extends P{},S=class extends P{},L=class extends P{};var h=typeof process<"u"&&process.release&&process.release.name==="node";if(globalThis.document);else if(globalThis.importScripts);else if(h);else throw new P("Cannot determine runtime environment");var W={null:0,symbol:1,pairlist:2,closure:3,environment:4,promise:5,call:6,special:7,builtin:8,string:9,logical:10,integer:13,double:14,complex:15,character:16,dots:17,any:18,list:19,expression:20,bytecode:21,pointer:22,weakref:23,raw:24,s4:25,new:30,free:31,function:99};function oe(r13){return!!r13&&typeof r13=="object"&&Object.keys(W).includes(r13.type)}function H(r13){return!!r13&&typeof r13=="object"&&"re"in r13&&"im"in r13}var l={};function Tt(r13){Object.keys(r13).forEach(e=>l._free(r13[e]))}function ae(r13){return l._Rf_protect(A(r13)),r13}function y(r13,e){return l._Rf_protect(A(r13)),++e.n,r13}function St(r13){let e=l._malloc(4);return l._R_ProtectWithIndex(A(r13),e),{loc:l.getValue(e,"i32"),ptr:e}}function kt(r13){l._Rf_unprotect(1),l._free(r13.ptr)}function _t(r13,e){return l._R_Reprotect(A(r13),e.loc),r13}function b(r13){l._Rf_unprotect(r13)}function Ge(r13,e,t){l._Rf_defineVar(A(e),A(t),A(r13))}function $e(r13,e){let t={},s={n:0};try{let n=new le(e);y(n,s),t.code=l.allocateUTF8(r13);let o=l._R_ParseEvalString(t.code,n.ptr);return p.wrap(o)}finally{Tt(t),b(s.n)}}function ie(r13,e){return l.getWasmTableEntry(l.GOT.ffi_safe_eval.value)(A(r13),A(e))}var Tr=new WeakMap;function Mt(r13,e){return Tr.set(r13,e),r13}var Xe=63;function Q(){let r13=Array.from({length:4},Sr).join("-");if(r13.length!==Xe)throw new Error("comlink internal error: UUID has the wrong length");return r13}function Sr(){let r13=Math.floor(Math.random()*Number.MAX_SAFE_INTEGER).toString(16),e=15-r13.length;return e>0&&(r13=Array.from({length:e},()=>0).join("")+r13),r13}function A(r13){return Te(r13)?r13.ptr:r13}function G(r13,e){if(l._TYPEOF(r13.ptr)!==W[e])throw new Error(`Unexpected object type "${r13.type()}" when expecting type "${e}"`)}function At(r13){if(oe(r13))return new(Dt(r13.type))(r13);if(typeof r13>"u")return new ce;if(r13&&typeof r13=="object"&&"type"in r13&&r13.type==="null")return new ce;if(r13===null)return new z({type:"logical",names:null,values:[null]});if(typeof r13=="boolean")return new z(r13);if(typeof r13=="number")return new ye(r13);if(typeof r13=="string")return new N(r13);if(H(r13))return new ve(r13);if(ArrayBuffer.isView(r13)||r13 instanceof ArrayBuffer)return new Pe(r13);if(Array.isArray(r13))return kr(r13);if(typeof r13=="object")return de.fromObject(r13);throw new Error("R object construction for this JS object is not yet supported.")}function kr(r13){let e={n:0};if(r13.every(s=>s&&typeof s=="object"&&!Te(s)&&!H(s))){let s=r13,n=s.every(a=>Object.keys(a).filter(i=>!Object.keys(s[0]).includes(i)).length===0&&Object.keys(s[0]).filter(i=>!Object.keys(a).includes(i)).length===0),o=s.every(a=>Object.values(a).every(i=>Ct(i)||Ot(i)));if(n&&o)return de.fromD3(s)}if(r13.every(s=>typeof s=="boolean"||s===null))return new z(r13);if(r13.every(s=>typeof s=="number"||s===null))return new ye(r13);if(r13.every(s=>typeof s=="string"||s===null))return new N(r13);try{let s=new F([new k("c"),...r13]);return y(s,e),s.eval()}finally{b(e.n)}}var f=class{constructor(e){this.ptr=e}type(){let e=l._TYPEOF(this.ptr);return Object.keys(W).find(s=>W[s]===e)}},p=class r extends f{constructor(e){if(!(e instanceof f))return At(e);super(e.ptr)}static wrap(e){let t=l._TYPEOF(e),s=Object.keys(W)[Object.values(W).indexOf(t)];return new(Dt(s))(new f(e))}get[Symbol.toStringTag](){return`RObject:${this.type()}`}static getPersistentObject(e){return x[e]}getPropertyValue(e){return this[e]}inspect(){$e(".Internal(inspect(x))",{x:this})}isNull(){return l._TYPEOF(this.ptr)===W.null}isNa(){try{let e=$e("is.na(x)",{x:this});return ae(e),e.toBoolean()}finally{b(1)}}isUnbound(){return this.ptr===x.unboundValue.ptr}attrs(){return ue.wrap(l._ATTRIB(this.ptr))}class(){let e={n:0},t=new F([new k("class"),this]);y(t,e);try{return t.eval()}finally{b(e.n)}}setNames(e){let t;if(e===null)t=x.null;else if(Array.isArray(e)&&e.every(s=>typeof s=="string"||s===null))t=new N(e);else throw new Error("Argument to setNames must be null or an Array of strings or null");return l._Rf_setAttrib(this.ptr,x.namesSymbol.ptr,t.ptr),this}names(){let e=N.wrap(l._Rf_getAttrib(this.ptr,x.namesSymbol.ptr));return e.isNull()?null:e.toArray()}includes(e){let t=this.names();return t&&t.includes(e)}toJs(e={depth:0},t=1){throw new Error("This R object cannot be converted to JS")}subset(e){return this.#e(e,x.bracketSymbol.ptr)}get(e){return this.#e(e,x.bracket2Symbol.ptr)}getDollar(e){return this.#e(e,x.dollarSymbol.ptr)}#e(e,t){let s={n:0};try{let n=new r(e);y(n,s);let o=l._Rf_lang3(t,this.ptr,n.ptr);return y(o,s),r.wrap(ie(o,x.baseEnv))}finally{b(s.n)}}pluck(...e){let t=St(x.null);try{let s=(o,a)=>{let i=o.get(a);return _t(i,t)},n=e.reduce(s,this);return n.isNull()?void 0:n}finally{kt(t)}}set(e,t){let s={n:0};try{let n=new r(e);y(n,s);let o=new r(t);y(o,s);let a=new k("[[<-"),i=l._Rf_lang4(a.ptr,this.ptr,n.ptr,o.ptr);return y(i,s),r.wrap(ie(i,x.baseEnv))}finally{b(s.n)}}static getMethods(e){let t=new Set,s=e;do Object.getOwnPropertyNames(s).map(n=>t.add(n));while(s=Object.getPrototypeOf(s));return[...t.keys()].filter(n=>typeof e[n]=="function")}},ce=class extends p{constructor(){return super(new f(l.getValue(l._R_NilValue,"*"))),this}toJs(){return{type:"null"}}},k=class extends p{constructor(e){if(e instanceof f){G(e,"symbol"),super(e);return}let t=l.allocateUTF8(e);try{super(new f(l._Rf_install(t)))}finally{l._free(t)}}toJs(){let e=this.toObject();return{type:"symbol",printname:e.printname,symvalue:e.symvalue,internal:e.internal}}toObject(){return{printname:this.printname().isUnbound()?null:this.printname().toString(),symvalue:this.symvalue().isUnbound()?null:this.symvalue().ptr,internal:this.internal().isNull()?null:this.internal().ptr}}toString(){return this.printname().toString()}printname(){return he.wrap(l._PRINTNAME(this.ptr))}symvalue(){return p.wrap(l._SYMVALUE(this.ptr))}internal(){return p.wrap(l._INTERNAL(this.ptr))}},ue=class r2 extends p{constructor(e){if(e instanceof f)return G(e,"pairlist"),super(e),this;let t={n:0};try{let{names:s,values:n}=Z(e),o=r2.wrap(l._Rf_allocList(n.length));y(o,t);for(let[a,i]=[0,o];!i.isNull();[a,i]=[a+1,i.cdr()])i.setcar(new p(n[a]));o.setNames(s),super(o)}finally{b(t.n)}}get length(){return this.toArray().length}toArray(e={depth:1}){return this.toJs(e).values}toObject({allowDuplicateKey:e=true,allowEmptyKey:t=false,depth:s=-1}={}){let n=this.entries({depth:s}),o=n.map(([a])=>a);if(!e&&new Set(o).size!==o.length)throw new Error("Duplicate key when converting pairlist without allowDuplicateKey enabled");if(!t&&o.some(a=>!a))throw new Error("Empty or null key when converting pairlist without allowEmptyKey enabled");return Object.fromEntries(n.filter((a,i)=>n.findIndex(c=>c[0]===a[0])===i))}entries(e={depth:1}){let t=this.toJs(e);return t.values.map((s,n)=>[t.names?t.names[n]:null,s])}toJs(e={depth:0},t=1){let s=[],n=false,o=[];for(let i=this;!i.isNull();i=i.cdr()){let c=i.tag();c.isNull()?s.push(""):(n=true,s.push(c.toString())),e.depth&&t>=e.depth?o.push(i.car()):o.push(i.car().toJs(e,t+1))}return{type:"pairlist",names:n?s:null,values:o}}includes(e){return e in this.toObject()}setcar(e){l._SETCAR(this.ptr,e.ptr)}car(){return p.wrap(l._CAR(this.ptr))}cdr(){return p.wrap(l._CDR(this.ptr))}tag(){return p.wrap(l._TAG(this.ptr))}},F=class r3 extends p{constructor(e){if(e instanceof f)return G(e,"call"),super(e),this;let t={n:0};try{let{values:s}=Z(e),n=s.map(a=>y(new p(a),t)),o=r3.wrap(l._Rf_allocVector(W.call,s.length));y(o,t);for(let[a,i]=[0,o];!i.isNull();[a,i]=[a+1,i.cdr()])i.setcar(n[a]);super(o)}finally{b(t.n)}}setcar(e){l._SETCAR(this.ptr,e.ptr)}car(){return p.wrap(l._CAR(this.ptr))}cdr(){return p.wrap(l._CDR(this.ptr))}eval(){return l.webr.evalR(this,{env:x.baseEnv})}capture(e={}){return l.webr.captureR(this,e)}deparse(){let e={n:0};try{let t=l._Rf_lang2(new k("deparse1").ptr,l._Rf_lang2(new k("quote").ptr,this.ptr));y(t,e);let s=N.wrap(ie(t,x.baseEnv));return y(s,e),s.toString()}finally{b(e.n)}}},pe=class r4 extends p{constructor(e,t=null){if(e instanceof f){if(G(e,"list"),super(e),t){if(t.length!==this.length)throw new Error("Can't construct named `RList`. Supplied `names` must be the same length as the list.");this.setNames(t)}return this}let s={n:0};try{let n=Z(e),o=l._Rf_allocVector(W.list,n.values.length);y(o,s),n.values.forEach((i,c)=>{It(i)?l._SET_VECTOR_ELT(o,c,new r4(i).ptr):l._SET_VECTOR_ELT(o,c,new p(i).ptr)});let a=t||n.names;if(a&&a.length!==n.values.length)throw new Error("Can't construct named `RList`. Supplied `names` must be the same length as the list.");p.wrap(o).setNames(a),super(new f(o))}finally{b(s.n)}}get length(){return l._LENGTH(this.ptr)}isDataFrame(){let e=ue.wrap(l._ATTRIB(this.ptr)).get("class");return!e.isNull()&&e.toArray().includes("data.frame")}toArray(e={depth:1}){return this.toJs(e).values}toObject({allowDuplicateKey:e=true,allowEmptyKey:t=false,depth:s=-1}={}){let n=this.entries({depth:s}),o=n.map(([a])=>a);if(!e&&new Set(o).size!==o.length)throw new Error("Duplicate key when converting list without allowDuplicateKey enabled");if(!t&&o.some(a=>!a))throw new Error("Empty or null key when converting list without allowEmptyKey enabled");return Object.fromEntries(n.filter((a,i)=>n.findIndex(c=>c[0]===a[0])===i))}toD3(){if(!this.isDataFrame())throw new Error("Can't convert R list object to D3 format. Object must be of class 'data.frame'.");return this.entries().reduce((t,s)=>(s[1].forEach((n,o)=>t[o]=Object.assign(t[o]||{},{[s[0]]:n})),t),[])}entries(e={depth:-1}){let t=this.toJs(e);return this.isDataFrame()&&e.depth<0&&(t.values=t.values.map(s=>s.toArray())),t.values.map((s,n)=>[t.names?t.names[n]:null,s])}toJs(e={depth:0},t=1){return{type:"list",names:this.names(),values:[...Array(this.length).keys()].map(s=>e.depth&&t>=e.depth?this.get(s+1):this.get(s+1).toJs(e,t+1))}}},de=class r5 extends pe{constructor(e){if(e instanceof f){if(super(e),!this.isDataFrame())throw new Error("Can't construct `RDataFrame`. Supplied R object is not a `data.frame`.");return this}return r5.fromObject(e)}static fromObject(e){let{names:t,values:s}=Z(e),n={n:0};try{let o=!!t&&t.length>0&&t.every(i=>i),a=s.length>0&&s.every(i=>Array.isArray(i)||ArrayBuffer.isView(i)||i instanceof ArrayBuffer);if(o&&a){let i=s,c=i.every(d=>d.length===i[0].length),R=i.every(d=>Ct(d[0])||Ot(d[0]));if(c&&R){let d=new pe({type:"list",names:t,values:i.map(Ee=>At(Ee))});y(d,n);let M=new F([new k("as.data.frame"),d]);return y(M,n),new r5(M.eval())}}}finally{b(n.n)}throw new Error("Can't construct `data.frame`. Source object is not eligible.")}static fromD3(e){return this.fromObject(Object.fromEntries(Object.keys(e[0]).map(t=>[t,e.map(s=>s[t])])))}},Y=class extends p{exec(...e){let t={n:0};try{let s=new F([this,...e]);return y(s,t),s.eval()}finally{b(t.n)}}capture(e={},...t){let s={n:0};try{let n=new F([this,...t]);return y(n,s),n.capture(e)}finally{b(s.n)}}},he=class r6 extends p{static{this.CEType={CE_NATIVE:0,CE_UTF8:1,CE_LATIN1:2,CE_BYTES:3,CE_SYMBOL:5,CE_ANY:99}}constructor(e){if(e instanceof f){G(e,"string"),super(e);return}let t=l.allocateUTF8(e);try{super(new f(l._Rf_mkCharCE(t,r6.CEType.CE_UTF8)))}finally{l._free(t)}}toString(){let e=l._vmaxget();try{return l.UTF8ToString(l._Rf_translateCharUTF8(this.ptr))}finally{l._vmaxset(e)}}toJs(){return{type:"string",value:this.toString()}}},le=class extends p{constructor(e={}){if(e instanceof f)return G(e,"environment"),super(e),this;let t=0;try{let{names:s,values:n}=Z(e),o=ae(l._R_NewEnv(x.globalEnv.ptr,0,0));++t,n.forEach((a,i)=>{let c=s?s[i]:null;if(!c)throw new Error("Can't create object in new environment with empty symbol name");let R=new k(c),d=ae(new p(a));try{Ge(o,R,d)}finally{b(1)}}),super(new f(o))}finally{b(t)}}ls(e=false,t=true){return N.wrap(l._R_lsInternal3(this.ptr,Number(e),Number(t))).toArray()}bind(e,t){let s=new k(e),n=ae(new p(t));try{Ge(this,s,n)}finally{b(1)}}names(){return this.ls(true,true)}frame(){return p.wrap(l._FRAME(this.ptr))}subset(e){if(typeof e=="number")throw new Error("Object of type environment is not subsettable");return this.getDollar(e)}toObject({depth:e=-1}={}){let t=this.names();return Object.fromEntries([...Array(t.length).keys()].map(s=>{let n=this.getDollar(t[s]);return[t[s],e<0?n:n.toJs({depth:e})]}))}toJs(e={depth:0},t=1){let s=this.names(),n=[...Array(s.length).keys()].map(o=>e.depth&&t>=e.depth?this.getDollar(s[o]):this.getDollar(s[o]).toJs(e,t+1));return{type:"environment",names:s,values:n}}},V=class extends p{constructor(e,t,s){if(e instanceof f)return G(e,t),super(e),this;let n={n:0};try{let{names:o,values:a}=Z(e),i=l._Rf_allocVector(W[t],a.length);y(i,n),a.forEach(s(i)),p.wrap(i).setNames(o),super(new f(i))}finally{b(n.n)}}get length(){return l._LENGTH(this.ptr)}get(e){return super.get(e)}subset(e){return super.subset(e)}getDollar(){throw new Error("$ operator is invalid for atomic vectors")}detectMissing(){let e={n:0};try{let t=l._Rf_lang2(new k("is.na").ptr,this.ptr);y(t,e);let s=z.wrap(ie(t,x.baseEnv));y(s,e);let n=s.toTypedArray();return Array.from(n).map(o=>!!o)}finally{b(e.n)}}toArray(){let e=this.toTypedArray();return this.detectMissing().map((t,s)=>t?null:e[s])}toObject({allowDuplicateKey:e=true,allowEmptyKey:t=false}={}){let s=this.entries(),n=s.map(([o])=>o);if(!e&&new Set(n).size!==n.length)throw new Error("Duplicate key when converting atomic vector without allowDuplicateKey enabled");if(!t&&n.some(o=>!o))throw new Error("Empty or null key when converting atomic vector without allowEmptyKey enabled");return Object.fromEntries(s.filter((o,a)=>s.findIndex(i=>i[0]===o[0])===a))}entries(){let e=this.toArray(),t=this.names();return e.map((s,n)=>[t?t[n]:null,s])}toJs(){return{type:this.type(),names:this.names(),values:this.toArray()}}},z=class r7 extends V{constructor(e){super(e,"logical",r7.#e)}static#e=e=>{let t=l._LOGICAL(e),s=l.getValue(l._R_NaInt,"i32");return(n,o)=>{l.setValue(t+4*o,n===null?s:Number(n),"i32")}};getBoolean(e){return this.get(e).toArray()[0]}toBoolean(){if(this.length!==1)throw new Error("Can't convert atomic vector of length > 1 to a scalar JS value");let e=this.getBoolean(1);if(e===null)throw new Error("Can't convert missing value `NA` to a JS boolean");return e}toTypedArray(){return new Int32Array(l.HEAP32.subarray(l._LOGICAL(this.ptr)/4,l._LOGICAL(this.ptr)/4+this.length))}toArray(){let e=this.toTypedArray();return this.detectMissing().map((t,s)=>t?null:!!e[s])}},Ke=class r8 extends V{constructor(e){super(e,"integer",r8.#e)}static#e=e=>{let t=l._INTEGER(e),s=l.getValue(l._R_NaInt,"i32");return(n,o)=>{l.setValue(t+4*o,n===null?s:Math.round(Number(n)),"i32")}};getNumber(e){return this.get(e).toArray()[0]}toNumber(){if(this.length!==1)throw new Error("Can't convert atomic vector of length > 1 to a scalar JS value");let e=this.getNumber(1);if(e===null)throw new Error("Can't convert missing value `NA` to a JS number");return e}toTypedArray(){return new Int32Array(l.HEAP32.subarray(l._INTEGER(this.ptr)/4,l._INTEGER(this.ptr)/4+this.length))}},ye=class r9 extends V{constructor(e){super(e,"double",r9.#e)}static#e=e=>{let t=l._REAL(e),s=l.getValue(l._R_NaReal,"double");return(n,o)=>{l.setValue(t+8*o,n===null?s:n,"double")}};getNumber(e){return this.get(e).toArray()[0]}toNumber(){if(this.length!==1)throw new Error("Can't convert atomic vector of length > 1 to a scalar JS value");let e=this.getNumber(1);if(e===null)throw new Error("Can't convert missing value `NA` to a JS number");return e}toTypedArray(){return new Float64Array(l.HEAPF64.subarray(l._REAL(this.ptr)/8,l._REAL(this.ptr)/8+this.length))}},ve=class r10 extends V{constructor(e){super(e,"complex",r10.#e)}static#e=e=>{let t=l._COMPLEX(e),s=l.getValue(l._R_NaReal,"double");return(n,o)=>{l.setValue(t+8*(2*o),n===null?s:n.re,"double"),l.setValue(t+8*(2*o+1),n===null?s:n.im,"double")}};getComplex(e){return this.get(e).toArray()[0]}toComplex(){if(this.length!==1)throw new Error("Can't convert atomic vector of length > 1 to a scalar JS value");let e=this.getComplex(1);if(e===null)throw new Error("Can't convert missing value `NA` to a JS object");return e}toTypedArray(){return new Float64Array(l.HEAPF64.subarray(l._COMPLEX(this.ptr)/8,l._COMPLEX(this.ptr)/8+2*this.length))}toArray(){let e=this.toTypedArray();return this.detectMissing().map((t,s)=>t?null:{re:e[2*s],im:e[2*s+1]})}},N=class r11 extends V{constructor(e){super(e,"character",r11.#e)}static#e=e=>(t,s)=>{t===null?l._SET_STRING_ELT(e,s,x.naString.ptr):l._SET_STRING_ELT(e,s,new he(t).ptr)};getString(e){return this.get(e).toArray()[0]}toString(){if(this.length!==1)throw new Error("Can't convert atomic vector of length > 1 to a scalar JS value");let e=this.getString(1);if(e===null)throw new Error("Can't convert missing value `NA` to a JS string");return e}toTypedArray(){return new Uint32Array(l.HEAPU32.subarray(l._STRING_PTR(this.ptr)/4,l._STRING_PTR(this.ptr)/4+this.length))}toArray(){let e=l._vmaxget();try{return this.detectMissing().map((t,s)=>t?null:l.UTF8ToString(l._Rf_translateCharUTF8(l._STRING_ELT(this.ptr,s))))}finally{l._vmaxset(e)}}},Pe=class r12 extends V{constructor(e){e instanceof ArrayBuffer&&(e=new Uint8Array(e)),super(e,"raw",r12.#e)}static#e=e=>{let t=l._RAW(e);return(s,n)=>{l.setValue(t+n,Number(s),"i8")}};getNumber(e){return this.get(e).toArray()[0]}toNumber(){if(this.length!==1)throw new Error("Can't convert atomic vector of length > 1 to a scalar JS value");let e=this.getNumber(1);if(e===null)throw new Error("Can't convert missing value `NA` to a JS number");return e}toTypedArray(){return new Uint8Array(l.HEAPU8.subarray(l._RAW(this.ptr),l._RAW(this.ptr)+this.length))}};function Z(r13){return oe(r13)?r13:Array.isArray(r13)||ArrayBuffer.isView(r13)?{names:null,values:r13}:r13&&typeof r13=="object"&&!H(r13)?{names:Object.keys(r13),values:Object.values(r13)}:{names:null,values:[r13]}}function Dt(r13){let e={object:p,null:ce,symbol:k,pairlist:ue,closure:Y,environment:le,call:F,special:Y,builtin:Y,string:he,logical:z,integer:Ke,double:ye,complex:ve,character:N,list:pe,raw:Pe,function:Y,dataframe:de};return r13 in e?e[r13]:p}function Te(r13){return r13 instanceof p}function Ot(r13){let e=["logical","integer","double","complex","character"];return Te(r13)&&e.includes(r13.type())||Te(r13)&&r13.isNa()}function Ct(r13){return r13===null||typeof r13=="number"||typeof r13=="boolean"||typeof r13=="string"||H(r13)}var x;function $(){let r13={resolve:(()=>{}),reject:(()=>{}),promise:Promise.resolve()},e=new Promise((t,s)=>{r13.resolve=t,r13.reject=s});return r13.promise=e,r13}function Ut(r13){return new Promise(e=>setTimeout(e,r13))}function D(r13,e,t,...s){return r13==null||Mr(r13)?r13:r13 instanceof ArrayBuffer?new Uint8Array(r13):e(r13)?t(r13,...s):Array.isArray(r13)||ArrayBuffer.isView(r13)?r13.map(n=>D(n,e,t,...s)):r13 instanceof f?r13:typeof r13=="object"?Object.fromEntries(Object.entries(r13).map(([n,o])=>[n,D(o,e,t,...s)])):r13}function ee(r13,e,t,s,n=true){let o=new XMLHttpRequest;o.open("get",r13,n),o.onload=()=>{if(o.status>=200&&o.status<300)try{let a=new Worker(URL.createObjectURL(new Blob([o.responseText])),s);e(a)}catch(a){if(t)t(a instanceof Error?a:new Error(String(a)));else throw a}else t?t(new Error(`Worker loading error: HTTP ${o.status}`)):console.error(`HTTP Error: ${o.status}`)},o.onerror=()=>{t?t(new Error(`Network error loading ${r13}`)):console.error(`Network error loading ${r13}`)},o.send()}function Se(r13){if(h)return false;let e=new URL(location.href),t=new URL(r13,location.origin);return!(e.host===t.host&&e.port===t.port&&e.protocol===t.protocol)}function Mr(r13){return typeof ImageBitmap<"u"&&r13 instanceof ImageBitmap}function It(r13){return typeof r13=="object"&&r13!==null&&!Array.isArray(r13)&&!ArrayBuffer.isView(r13)&&!H(r13)&&!oe(r13)&&!(r13 instanceof Date)&&!(r13 instanceof RegExp)&&!(r13 instanceof Error)&&!(r13 instanceof f)&&Object.getPrototypeOf(r13)===Object.prototype}var ir=vt(nr());var bs=new TextEncoder;async function K(r13,e,t){try{let{taskId:s,sizeBuffer:n,dataBuffer:o,signalBuffer:a}=e,i=(0,ir.encode)(t),c=i.length<=o.length;if(Atomics.store(n,0,i.length),Atomics.store(n,1,+c),!c){let[R,d]=ws(r13);o.set(bs.encode(R)),await or(a,s),o=(await d).dataBuffer}o.set(i),Atomics.store(n,1,1),await or(a,s)}catch(s){console.warn(s)}}function ws(r13){let e=Q();return[e,new Promise(t=>{h?r13.once("message",s=>{!s.id||s.id!==e||t(s)}):r13.addEventListener("message",function s(n){!n.data||!n.data.id||n.data.id!==e||(r13.removeEventListener("message",s),t(n.data))}),r13.start&&r13.start()})]}async function or(r13,e){let t=(e>>1)%32,s=1;for(;Atomics.compareExchange(r13,t+1,0,e)!==0;)await Ut(s),s<32&&(s*=2);Atomics.or(r13,0,1<<t),Atomics.notify(r13,0)}var se=class{#e;#t;constructor(){this.#t=[],this.#e=[]}reset(){this.#t=[],this.#e=[]}put(e){this.#t.length||this.#r(),this.#t.shift()(e)}async get(){return this.#e.length||this.#r(),this.#e.shift()}isEmpty(){return!this.#e.length}isBlocked(){return!!this.#t.length}get length(){return this.#e.length-this.#t.length}#r(){this.#e.push(new Promise(e=>{this.#t.push(e)}))}};function Rt(r13,e){return cr({type:"request",data:{uuid:Q(),msg:r13}},e)}function lr(r13,e,t){return cr({type:"response",data:{uuid:r13,resp:e}},t)}function cr(r13,e){return e&&Mt(r13,e),r13}function ur(r13){let e=new T(r13.obj.message);return r13.obj.name=="ErrnoError"?e.message=`ErrnoError: ${String(r13.obj.errno)}`:r13.obj.name!=="Error"&&(e.name=r13.obj.name),e.stack=r13.obj.stack,e}function xs(r13){return!!r13&&typeof r13=="object"&&"payloadType"in r13&&"obj"in r13}function Fe(r13){return xs(r13)&&r13.payloadType==="ptr"}var ne=class{constructor(){this.inputQueue=new se;this.outputQueue=new se;this.systemQueue=new se;this.eventQueue=new Array;this.#e=new Map;this.#t=false}#e;#t;async read(){return await this.outputQueue.get()}async flush(){let e=[];for(;!this.outputQueue.isEmpty();)e.push(await this.read());return e}async readSystem(){return await this.systemQueue.get()}write(e){if(this.#t)throw new S("The webR communication channel has been closed.");this.inputQueue.put(e)}async request(e,t){let s=Rt(e,t),{resolve:n,reject:o,promise:a}=$();return this.#e.set(s.data.uuid,{resolve:n,reject:o}),this.write(s),a}putClosedMessage(){this.#t=true,this.outputQueue.put({type:"closed"})}resolveResponse(e){let t=e.data.uuid,s=this.#e.get(t);if(s){let n=e.data.resp.data;this.#e.delete(t),n.payloadType==="err"?s.reject(ur(n)):s.resolve(n)}else console.warn("Can't find request.")}};new TextDecoder("utf-8");var Ve=class{constructor(e){this.chan=e;h?this.WebSocket="WebSocket"in globalThis?globalThis.WebSocket:pr():this.WebSocket=WebSocket}#e=new Map;new(e,t,s){let n=new this.WebSocket(t,s||[]);n.binaryType="arraybuffer",n.addEventListener("open",()=>{this.chan.emit({type:"websocket-open",data:{uuid:e}})}),n.addEventListener("message",o=>{let a=new Uint8Array(o.data);this.chan.emit({type:"websocket-message",data:{uuid:e,data:a}})}),n.addEventListener("close",o=>{this.chan.emit({type:"websocket-close",data:{uuid:e,code:o.code,reason:o.reason}})}),n.addEventListener("error",()=>{this.chan.emit({type:"websocket-error",data:{uuid:e}})}),this.#e.set(e,n)}send(e,t){this.#e.get(e)?.send(t)}close(e,t,s){this.#e.get(e)?.close(t,s),this.#e.delete(e)}};h&&(globalThis.CloseEvent=class extends Event{constructor(e,t={}){super(e,t),this.wasClean=t.wasClean||false,this.code=t.code||0,this.reason=t.reason||""}});var qe=class{constructor(e){this.chan=e}#e=new Map;new(e,t,s){if(h){let n=new Worker(t,s),o=n;o.on("message",a=>{this.chan.emit({type:"worker-message",data:{uuid:e,data:a}})}),o.on("messageerror",a=>{this.chan.emit({type:"worker-messageerror",data:{uuid:e,data:a}})}),o.on("error",()=>{this.chan.emit({type:"worker-error",data:{uuid:e}})}),this.#e.set(e,n)}else ee(t,n=>{n.addEventListener("message",o=>{this.chan.emit({type:"worker-message",data:{uuid:e,data:o.data}})}),n.addEventListener("messageerror",o=>{this.chan.emit({type:"worker-messageerror",data:{uuid:e,data:o.data}})}),n.addEventListener("error",()=>{this.chan.emit({type:"worker-error",data:{uuid:e}})}),this.#e.set(e,n)},n=>{throw n},s,false)}postMessage(e){let{uuid:t,async:s,handles:n,data:o,transfer:a}=e.data,i=this.#e.get(t);if(!i)throw new Error(`Worker with uuid ${t} not found`);if(!s&&n){let c=R=>{let d=R.data.uuid,M=R.data.result,Ee=R.data.error;d===t&&(Ee?n.reject(new Error(Ee)):n.resolve(M),i.removeEventListener("message",c))};i.addEventListener("message",c)}i.postMessage({uuid:t,data:o},{transfer:a})}terminate(e){this.#e.get(e)?.terminate(),this.#e.delete(e)}};h&&(globalThis.Worker=gt().Worker);var we=class extends ne{constructor(t){super();this.close=()=>{};this.#r=async(t2,s2)=>{if(!(!s2||!s2.type))switch(s2.type){case"resolve":this.#e=new Int32Array(s2.data),this.resolve();return;case"response":this.resolveResponse(s2);return;case"system":this.systemQueue.put(s2.data);return;default:this.outputQueue.put(s2);return;case"sync-request":{let n=s2,o=n.data.msg,a=n.data.reqData;switch(o.type){case"read":{let i=await this.inputQueue.get();await K(t2,a,i);break}case"event":{let i=this.eventQueue.shift();await K(t2,a,i);break}case"eval-await":{let i=o.data,c={};try{c.result=await(0,eval)(i),typeof c.result=="function"&&(c.result=String(c.result))}catch(R){let d=R;c.error=d.message}await K(t2,a,{type:"eval-response",data:c});break}case"post-message-worker":{let i=o.data;i.handles=$(),this.systemQueue.put({type:"postMessageWorker",data:i}),i.async?await K(t2,a,{type:"post-message-response"}):i.handles.promise.then(c=>{K(t2,a,{type:"post-message-response",data:{result:c}})},c=>{K(t2,a,{type:"post-message-response",data:{error:String(c)}})});break}default:throw new S(`Unsupported request type '${o.type}'.`)}return}case"request":throw new S("Can't send messages of type 'request' from a worker. Please Use 'sync-request' instead.")}};({resolve:this.resolve,reject:this.reject,promise:this.initialised}=$());let s=n=>{this.#t(n),this.close=()=>{n.terminate(),this.putClosedMessage()};let o={type:"init",data:{config:t,channelType:U.SharedArrayBuffer}};n.postMessage(o)};if(Se(t.baseUrl))ee(`${t.baseUrl}webr-worker.js`,n=>s(n),n=>{this.reject(new T(`Worker loading error: ${n.message}`))});else{let n=new Worker(`${t.baseUrl}webr-worker.js`);s(n)}}#e;emit(t){if(!this.#e)throw new S("Failed attempt to interrupt before initialising interruptBuffer");this.eventQueue.push({type:"event",data:{msg:t}}),this.#e[0]=1}interrupt(){this.inputQueue.reset(),this.emit({type:"interrupt"})}#t(t){h?(t.on("message",s=>{this.#r(t,s)}),t.on("error",s=>{let n=s instanceof Error?s.message:String(s);console.error(n),this.reject(new T(`An error occurred initialising the webR SharedBufferChannel worker: ${n}.`))})):(t.onmessage=s=>this.#r(t,s.data),t.onerror=s=>{let n=s instanceof Error?s.message:String(s);console.error(n),this.reject(new T(`An error occurred initialising the webR SharedBufferChannel worker: ${n}.`))})}#r};h&&(globalThis.Worker=gt().Worker);var xe=class extends ne{constructor(t){super();this.close=()=>{};this.emit=()=>{};this.#r=async(t2,s2)=>{if(!(!s2||!s2.type))switch(s2.type){case"resolve":this.resolve();return;case"response":this.resolveResponse(s2);return;case"system":this.systemQueue.put(s2.data);return;default:this.outputQueue.put(s2);return;case"request":{let n=s2,o=n.data.msg;switch(o.type){case"read":{let a=await this.inputQueue.get();if(this.#e){let i=lr(n.data.uuid,a);this.#e.postMessage(i)}break}default:throw new S(`Unsupported request type '${o.type}'.`)}return}case"sync-request":throw new S("Can't send messages of type 'sync-request' in PostMessage mode. Use 'request' instead.")}};({resolve:this.resolve,reject:this.reject,promise:this.initialised}=$());let s=n=>{this.#e=n,this.#t(n),this.close=()=>{n.terminate(),this.putClosedMessage()};let o={type:"init",data:{config:t,channelType:U.PostMessage}};n.postMessage(o)};if(Se(t.baseUrl))ee(`${t.baseUrl}webr-worker.js`,n=>s(n),n=>{this.reject(new T(`Worker loading error: ${n.message}`))});else{let n=new Worker(`${t.baseUrl}webr-worker.js`);s(n)}}#e;interrupt(){console.error("Interrupting R execution is not available when using the PostMessage channel")}#t(t){h?(t.on("message",s=>{this.#r(t,s)}),t.on("error",s=>{console.error(s),this.reject(new T("An error occurred initialising the webR PostMessageChannel worker."))})):(t.onmessage=s=>this.#r(t,s.data),t.onerror=s=>{console.error(s),this.reject(new T("An error occurred initialising the webR PostMessageChannel worker."))})}#r};var U={Automatic:0,SharedArrayBuffer:1,PostMessage:3};function dr(r13){switch(r13.channelType){case U.SharedArrayBuffer:return new we(r13);case U.PostMessage:return new xe(r13);case U.Automatic:default:return typeof SharedArrayBuffer<"u"?new we(r13):new xe(r13)}}var hr=h?"/":"https://webr.r-wasm.org/v0.6.0/",yr="https://repo.r-wasm.org",bt="0.6.0",wt="4.6.0";function m(r13){return!!r13&&(typeof r13=="object"||typeof r13=="function")&&"payloadType"in r13&&Fe(r13._payload)}function fr(r13){return!!(m(r13)&&r13._payload.obj.methods?.includes("exec"))}function Ps(){}function Ts(r13,e){return async function*(){let t={type:"callRObjectMethod",data:{payload:e._payload,prop:"getPropertyValue",args:[{payloadType:"raw",obj:"length"}],shelter:void 0}},s=await r13.request(t);if(typeof s.obj!="number")throw new P("Cannot iterate over object, unexpected type for length property.");for(let n=1;n<=s.obj;n++)yield e.get(n)}}function mr(r13,e,t){return async(...s)=>{let n=s.map(i=>m(i)?i._payload:{obj:D(i,m,c=>c._payload),payloadType:"raw"}),o={type:"callRObjectMethod",data:{payload:t,prop:e,args:n}},a=await r13.request(o);switch(a.payloadType){case"ptr":return J(r13,a);case"raw":return D(a,Fe,(c,R)=>J(R,c),r13).obj}}}async function Ss(r13,e,t,...s){let n={type:"newRObject",data:{objType:e,args:D(s,m,a=>a._payload),shelter:t}},o=await r13.request(n);switch(o.payloadType){case"raw":throw new L("Unexpected raw payload type returned from newRObject");case"ptr":return J(r13,o)}}function J(r13,e){let t=new Proxy(e.obj.methods?.includes("exec")?Object.assign(Ps,{...e}):e,{get:(s,n)=>{if(n==="_payload")return e;if(n===Symbol.asyncIterator)return Ts(r13,t);if(e.obj.methods?.includes(n.toString()))return mr(r13,n.toString(),e)},apply:async(s,n,o)=>{let a=await J(r13,e).exec(...o);return fr(a)?a:a.toJs()}});return t}function v(r13,e,t){return new Proxy(p,{construct:(s,n)=>Ss(r13,t,e,...n),get:(s,n)=>mr(r13,n.toString())})}var ks={FONTCONFIG_PATH:"/etc/fonts",R_HOME:"/usr/lib/R",R_ENABLE_JIT:"0",ALL_PROXY:"socks5h://localhost:8580",WEBR:"1",WEBR_VERSION:bt,R_VERSION:wt},Rr={RArgs:[],REnv:ks,baseUrl:hr,serviceWorkerUrl:"",repoUrl:yr,homedir:"/home/web_user",interactive:true,channelType:U.Automatic,createLazyFilesystem:true},Je=class{constructor(e={}){this.version=bt;this.versionR=wt;this.FS={analyzePath:async(e2,t2)=>{let s={type:"analyzePath",data:{path:e2,dontResolveLastLink:t2}};return(await this.#e.request(s)).obj},lookupPath:async e2=>{let t2={type:"lookupPath",data:{path:e2}};return(await this.#e.request(t2)).obj},mkdir:async e2=>{let t2={type:"mkdir",data:{path:e2}};return(await this.#e.request(t2)).obj},mount:async(e2,t2,s)=>{let n=[];"blobs"in t2&&t2.blobs&&(n=[...n,...t2.blobs.map(a=>a.data instanceof Blob?a.data.arrayBuffer().then(i=>{a.data=new Uint8Array(i)}):Promise.resolve())]),"packages"in t2&&t2.packages&&(n=[...n,...t2.packages.map(a=>a.blob instanceof Blob?a.blob.arrayBuffer().then(i=>{a.blob=new Uint8Array(i)}):Promise.resolve())]),await Promise.all(n);let o={type:"mount",data:{type:e2,options:t2,mountpoint:s}};await this.#e.request(o)},syncfs:async e2=>{let t2={type:"syncfs",data:{populate:e2}};await this.#e.request(t2)},readFile:async(e2,t2)=>{let s={type:"readFile",data:{path:e2,flags:t2}};return(await this.#e.request(s)).obj},rename:async(e2,t2)=>{let s={type:"rename",data:{oldpath:e2,newpath:t2}};await this.#e.request(s)},rmdir:async e2=>{let t2={type:"rmdir",data:{path:e2}};await this.#e.request(t2)},writeFile:async(e2,t2,s)=>{let n={type:"writeFile",data:{path:e2,data:t2,flags:s}};await this.#e.request(n)},unlink:async e2=>{let t2={type:"unlink",data:{path:e2}};await this.#e.request(t2)},unmount:async e2=>{let t2={type:"unmount",data:{path:e2}};await this.#e.request(t2)}};let t={...Rr,...e,REnv:{...Rr.REnv,...e.REnv}};this.#e=dr(t),this.#t=new Ve(this.#e),this.#r=new qe(this.#e),this.objs={},this.Shelter=_s(this.#e),this.#s=this.#e.initialised.then(async()=>{this.globalShelter=await new this.Shelter,this.RObject=this.globalShelter.RObject,this.RLogical=this.globalShelter.RLogical,this.RInteger=this.globalShelter.RInteger,this.RDouble=this.globalShelter.RDouble,this.RComplex=this.globalShelter.RComplex,this.RCharacter=this.globalShelter.RCharacter,this.RRaw=this.globalShelter.RRaw,this.RList=this.globalShelter.RList,this.RDataFrame=this.globalShelter.RDataFrame,this.RPairlist=this.globalShelter.RPairlist,this.REnvironment=this.globalShelter.REnvironment,this.RSymbol=this.globalShelter.RSymbol,this.RString=this.globalShelter.RString,this.RCall=this.globalShelter.RCall,this.objs={baseEnv:await this.RObject.getPersistentObject("baseEnv"),globalEnv:await this.RObject.getPersistentObject("globalEnv"),null:await this.RObject.getPersistentObject("null"),true:await this.RObject.getPersistentObject("true"),false:await this.RObject.getPersistentObject("false"),na:await this.RObject.getPersistentObject("na")},this.#n()})}#e;#t;#r;#s;async init(){return this.#s}async#n(){for(;;){let e=await this.#e.readSystem();switch(e.type){case"setTimeoutWasm":setTimeout((t,s)=>{this.invokeWasmFunction(t,...s)},e.data.delay,e.data.ptr,e.data.args);break;case"proxyWebSocket":{let t=e;this.#t.new(t.data.uuid,t.data.url,t.data.protocol);break}case"sendWebSocket":{let t=e;this.#t.send(t.data.uuid,t.data.data);break}case"closeWebSocket":{let t=e;this.#t.close(t.data.uuid,t.data.code,t.data.reason);break}case"proxyWorker":{let t=e;this.#r.new(t.data.uuid,t.data.url,t.data.options);break}case"postMessageWorker":{let t=e;this.#r.postMessage(t);break}case"terminateWorker":{let t=e;this.#r.terminate(t.data.uuid);break}case"console.log":console.log(e.data);break;case"console.warn":console.warn(e.data);break;case"console.error":console.error(e.data);break;case"close":this.#e.close();break;default:throw new P("Unknown system message type `"+e.type+"`")}}}close(){this.#e.close()}async read(){return await this.#e.read()}async*stream(){for(;;){let e=await this.#e.read();if(e.type==="closed")return;yield e}}async flush(){return await this.#e.flush()}write(e){this.#e.write(e)}writeConsole(e){this.write({type:"stdin",data:e+`
`})}interrupt(){this.#e.interrupt()}async installPackages(e,t){let s=Object.assign({quiet:false,mount:true},t),n={type:"installPackages",data:{name:e,options:s}};await this.#e.request(n)}async destroy(e){await this.globalShelter.destroy(e)}async evalR(e,t){return this.globalShelter.evalR(e,t)}async evalRVoid(e,t){return this.evalRRaw(e,"void",t)}async evalRBoolean(e,t){return this.evalRRaw(e,"boolean",t)}async evalRNumber(e,t){return this.evalRRaw(e,"number",t)}async evalRString(e,t){return this.evalRRaw(e,"string",t)}async evalRRaw(e,t,s={}){let n=D(s,m,i=>i._payload),o={type:"evalRRaw",data:{code:e,options:n,outputType:t}},a=await this.#e.request(o);switch(a.payloadType){case"raw":return a.obj;case"ptr":throw new L("Unexpected ptr payload type returned from evalRVoid")}}async invokeWasmFunction(e,...t){let s={type:"invokeWasmFunction",data:{ptr:e,args:t}};return(await this.#e.request(s)).obj}},He=class{#e="";#t;#r=false;constructor(e){this.#t=e}async init(){if(this.#r)return;let e={type:"newShelter"},t=await this.#t.request(e);this.#e=t.obj,this.RObject=v(this.#t,this.#e,"object"),this.RLogical=v(this.#t,this.#e,"logical"),this.RInteger=v(this.#t,this.#e,"integer"),this.RDouble=v(this.#t,this.#e,"double"),this.RComplex=v(this.#t,this.#e,"complex"),this.RCharacter=v(this.#t,this.#e,"character"),this.RRaw=v(this.#t,this.#e,"raw"),this.RList=v(this.#t,this.#e,"list"),this.RDataFrame=v(this.#t,this.#e,"dataframe"),this.RPairlist=v(this.#t,this.#e,"pairlist"),this.REnvironment=v(this.#t,this.#e,"environment"),this.RSymbol=v(this.#t,this.#e,"symbol"),this.RString=v(this.#t,this.#e,"string"),this.RCall=v(this.#t,this.#e,"call"),this.#r=true}async purge(){let e={type:"shelterPurge",data:this.#e};await this.#t.request(e)}async destroy(e){let t={type:"shelterDestroy",data:{id:this.#e,obj:e._payload}};await this.#t.request(t)}async size(){let e={type:"shelterSize",data:this.#e};return(await this.#t.request(e)).obj}async evalR(e,t={}){let s=D(t,m,a=>a._payload),n={type:"evalR",data:{code:e,options:s,shelter:this.#e}},o=await this.#t.request(n);switch(o.payloadType){case"raw":throw new L("Unexpected payload type returned from evalR");default:return J(this.#t,o)}}async captureR(e,t={}){let s=D(t,m,a=>a._payload),n={type:"captureR",data:{code:e,options:s,shelter:this.#e}},o=await this.#t.request(n);switch(o.payloadType){case"ptr":throw new L("Unexpected payload type returned from evalR");case"raw":{let a=o.obj,i=J(this.#t,a.result),c=a.output,R=a.images;for(let d=0;d<c.length;++d)c[d].type!=="stdout"&&c[d].type!=="stderr"&&(c[d].data=J(this.#t,c[d].data));return{result:i,output:c,images:R}}}}};function _s(r13){return new Proxy(He,{construct:async()=>{let e=new He(r13);return await e.init(),e}})}const engineSource=`# =============================================================================
# movecost engine for the GeoLibre plugin
# -----------------------------------------------------------------------------
# Runs entirely inside webR (R compiled to WebAssembly) but is deliberately
# plain R so that it can also be executed by a native Rscript for testing:
#
#   Rscript -e 'source("src/engine/movecost-engine.R"); mcx_run("request.json")'
#
# Contract
# --------
#   input : a JSON request file describing the analysis (see docs/ARCHITECTURE.md)
#   output: a JSON response file; vectors are inlined as GeoJSON strings, rasters
#           are inlined as base64 Float32 arrays plus their WGS84 extent so that
#           the JavaScript side can colourise them on a canvas without needing a
#           GeoTIFF reader.
#
# No plotting ever happens here: movecost draws to the active graphics device as
# a side effect, so every call is wrapped in a null device.
# =============================================================================

mcx_env <- new.env(parent = emptyenv())
mcx_env$log <- character(0)
mcx_env$target_crs <- NULL
# DTMs kept in this R session rather than on disk, by handle. Needed under webR,
# where terra::writeRaster() never returns for rasters above a couple of
# thousand cells; the analyses and the preview accept a handle in place of a
# path, so a downloaded DTM never has to become a file there.
mcx_env$dtms <- list()
# The cost graph mc_surface() builds, kept between runs so that changing only
# the points does not rebuild it. One at a time — see mcx_build_surface().
mcx_env$surface <- NULL
mcx_env$surface_key <- NULL

mcx_log <- function(...) {
  msg <- paste0(...)
  mcx_env$log <- c(mcx_env$log, msg)
  invisible(msg)
}

mcx_stop <- function(...) stop(paste0(...), call. = FALSE)

# jsonlite's auto_unbox turns a one-element vector into a bare value, so a run
# that logged exactly one line would send \`log\` as a string and the panel's
# \`log.join()\` would fail. I() marks it as an array whatever its length.
mcx_log_out <- function() I(as.character(mcx_env$log))

# The call stack at the moment an error is signalled. tryCatch unwinds it before
# the handler runs, so the frames have to be captured on the way down. Errors
# raised by this engine already say what to do; the ones worth a stack are the
# ones from inside movecost, terra or sf, where the message alone ("nrow
# dataframe does not match nrow geometry") names no function.
mcx_env$frames <- character(0)

mcx_watch <- function(expr) {
  withCallingHandlers(
    expr,
    error = function(e) {
      calls <- sys.calls()
      named <- vapply(calls, function(cl) {
        head <- tryCatch(deparse(cl[[1]])[1], error = function(...) "<anonymous>")
        substr(head, 1, 60)
      }, character(1))
      named <- named[!grepl("^(withCallingHandlers|tryCatch|try|doTryCatch|mcx_watch|h|value|force)$", named)]
      mcx_env$frames <- utils::tail(named, 14)
    }
  )
}

mcx_frames_out <- function() I(as.character(mcx_env$frames))

# --- environment -------------------------------------------------------------

mcx_version <- function() {
  version_of <- function(pkg) {
    if (requireNamespace(pkg, quietly = TRUE)) {
      as.character(utils::packageVersion(pkg))
    } else {
      NA_character_
    }
  }
  list(
    r = paste0(R.version$major, ".", R.version$minor),
    movecost = version_of("movecost"),
    terra = version_of("terra"),
    sf = version_of("sf"),
    igraph = version_of("igraph")
  )
}

mcx_require <- function() {
  needed <- c("movecost", "sf", "terra", "jsonlite")
  missing <- needed[!vapply(needed, requireNamespace, logical(1), quietly = TRUE)]
  if (length(missing)) {
    mcx_stop("Missing R packages: ", paste(missing, collapse = ", "))
  }
  # movecost 3.0.0 (CRAN, June 2026) replaced the per-analysis functions with a
  # compute-once API: mc_surface() builds the cost graph and mc_paths() and its
  # siblings reuse it. This engine speaks that API, and 2.x has no equivalent,
  # so an old installation is named here rather than left to fail somewhere
  # inside a function that does not exist.
  version <- utils::packageVersion("movecost")
  if (version < "3.0.0") {
    mcx_stop(
      "This plugin needs movecost 3.0.0 or later; the installed version is ",
      as.character(version), '. Update it with: install.packages("movecost")'
    )
  }
  # packageVersion() reads the DESCRIPTION on disk, but the namespace loaded in
  # a long-running R service is whatever was there when it started. Upgrading
  # movecost under a running service therefore looks fine here and then fails
  # deep inside an analysis, which is worth naming.
  if (!exists("mc_surface", envir = asNamespace("movecost"), inherits = FALSE)) {
    mcx_stop(
      "movecost ", as.character(version), " is installed, but the version loaded in ",
      "this R session has no mc_surface(): it was started before the upgrade. ",
      "Restart the R service."
    )
  }
  invisible(TRUE)
}

# Nothing in the mc_* API draws: movecost 3.0 moved plotting into plot()
# methods, so the analyses no longer need a null graphics device around them.
# Start-up chatter would still land in the response, so calls still go through
# here.
mcx_quietly <- function(expr) {
  suppressWarnings(suppressMessages(force(expr)))
}

# --- CRS helpers -------------------------------------------------------------

# movecost derives slope from the DTM, which only makes sense on a projected
# grid whose units are metres. A geographic DTM is reprojected to the UTM zone
# of its own centroid unless the caller asked otherwise.
mcx_is_geographic <- function(r) {
  isTRUE(terra::is.lonlat(r, warn = FALSE))
}

mcx_utm_epsg <- function(lon, lat) {
  zone <- floor((lon + 180) / 6) + 1
  if (lat >= 0) 32600 + zone else 32700 + zone
}

mcx_prepare_dtm <- function(path, reproject = TRUE) {
  if (!file.exists(path)) mcx_stop("DTM file not found: ", path)
  r <- terra::rast(path)
  if (terra::nlyr(r) > 1) r <- r[[1]]
  crs_wkt <- terra::crs(r)
  if (is.na(crs_wkt) || !nzchar(crs_wkt)) {
    mcx_stop("The DTM has no CRS. Assign one before running the analysis.")
  }
  if (mcx_is_geographic(r)) {
    if (!reproject) {
      mcx_stop(
        "The DTM is in geographic coordinates (degrees). movecost needs a ",
        "projected DTM in metres. Enable auto-reprojection or supply a ",
        "projected DTM."
      )
    }
    e <- terra::ext(r)
    epsg <- mcx_utm_epsg((e$xmin + e$xmax) / 2, (e$ymin + e$ymax) / 2)
    mcx_log("Reprojecting DTM from geographic CRS to EPSG:", epsg)
    r <- terra::project(r, paste0("EPSG:", epsg), method = "bilinear")
  }
  names(r) <- "dtm"
  r
}

#' The DTM a request refers to: a kept in-memory raster by handle, or a file.
mcx_resolve_dtm <- function(req, reproject = TRUE) {
  handle <- req$dtmHandle
  if (!is.null(handle) && nzchar(handle)) {
    r <- mcx_env$dtms[[handle]]
    if (is.null(r)) {
      mcx_stop("The DTM '", handle, "' is no longer in this R session. Download it again.")
    }
    return(r)
  }
  if (is.null(req$dtmPath) || !nzchar(req$dtmPath) || !file.exists(req$dtmPath)) {
    return(NULL)
  }
  mcx_prepare_dtm(req$dtmPath, reproject = reproject)
}

# --- vector helpers ----------------------------------------------------------

mcx_read_vector <- function(path, target_crs, what = "layer") {
  if (is.null(path) || is.na(path) || !nzchar(path)) {
    return(NULL)
  }
  if (!file.exists(path)) mcx_stop(what, " file not found: ", path)
  v <- sf::st_read(path, quiet = TRUE)
  if (nrow(v) == 0) mcx_stop(what, " contains no features.")
  if (is.na(sf::st_crs(v))) sf::st_crs(v) <- 4326
  v <- sf::st_transform(v, target_crs)
  v
}

# movecost 3.0 takes sf objects directly, so nothing is coerced to sp any more.
# It does hand them straight to terra::vect(), which is fussier than sf about
# what a layer may contain, so inputs are tidied first.

#' Drop what terra cannot carry: Z/M dimensions, empty geometries, and columns
#' that are not plain vectors. A layer drawn in the host can arrive with a list
#' column (GeoLibre's sketches carry \`__gm_center\`, a coordinate pair per
#' feature), and terra::vect() on such an sf loses rows and then fails with
#' "nrow dataframe does not match nrow geometry".
mcx_tidy_vector <- function(v, what) {
  if (is.null(v)) {
    return(NULL)
  }
  v <- sf::st_zm(v, drop = TRUE, what = "ZM")
  empty <- sf::st_is_empty(v)
  if (any(empty)) {
    mcx_log("Dropping ", sum(empty), " empty geometr", if (sum(empty) == 1) "y" else "ies",
            " from the ", what, " layer")
    v <- v[!empty, , drop = FALSE]
  }
  if (!nrow(v)) mcx_stop("The ", what, " layer has no usable geometry.")
  geom_col <- attr(v, "sf_column")
  keep <- vapply(sf::st_drop_geometry(v), is.atomic, logical(1))
  if (!all(keep)) {
    v <- v[, c(names(keep)[keep], geom_col), drop = FALSE]
  }
  v
}

# The points still need at least one attribute column: it is what the plugin
# labels them with on the map, and what the costs come back attached to.
mcx_ensure_id <- function(v) {
  if (is.null(v)) {
    return(NULL)
  }
  keep <- setdiff(names(v), attr(v, "sf_column"))
  if (!length(keep)) v$mcx_id <- seq_len(nrow(v))
  v
}

#' A barrier terra can turn into a single SpatVector.
#'
#' terra cannot build one from an sf whose features are of mixed geometry type,
#' and movecost passes the barrier straight to terra::vect(): a layer holding
#' both a drawn rectangle and a drawn line — which is exactly what a host's
#' "sketches" layer is — fails with "[as,sf] coercion failed". Buffering by half
#' a cell turns the linear parts into thin polygons covering the same cells the
#' lines would have touched, so the layer becomes one type without changing
#' which cells are blocked.
mcx_prepare_barrier <- function(v, cell_size) {
  v <- mcx_tidy_vector(v, "barrier")
  if (is.null(v)) {
    return(NULL)
  }
  types <- unique(as.character(sf::st_geometry_type(v)))
  if (length(types) > 1) {
    dist <- if (is.finite(cell_size) && cell_size > 0) cell_size / 2 else 1
    mcx_log("Barrier mixes ", paste(types, collapse = " and "),
            "; buffering by ", round(dist, 1), " m so the parts travel as one layer")
    v <- sf::st_buffer(v, dist = dist)
    v <- sf::st_make_valid(v)
  }
  v
}

#' A data frame jsonlite can serialise.
#'
#' movecost 3.0 returns measured columns as \`units\` objects — boundary areas in
#' m^2, path lengths in m — and jsonlite has no method for those. The Rd pages
#' name the unit of every such column, so the class is simply stripped and the
#' number travels plain.
mcx_plain_table <- function(x) {
  if (is.null(x)) {
    return(NULL)
  }
  df <- as.data.frame(x)
  for (i in seq_along(df)) {
    col <- df[[i]]
    if (inherits(col, "units") || inherits(col, "difftime")) {
      df[[i]] <- as.numeric(col)
    } else if (!is.atomic(col)) {
      df[[i]] <- as.character(col)
    }
  }
  df
}

mcx_sf_to_geojson <- function(x, fallback_crs = mcx_env$target_crs) {
  if (is.null(x)) {
    return(NULL)
  }
  v <- if (inherits(x, "sf")) x else sf::st_as_sf(x)
  if (is.null(v) || nrow(v) == 0) {
    return(NULL)
  }
  # movecost hands back sp objects built on raster/sp; round-tripping them
  # through sf sometimes drops the CRS, so restore the one the analysis ran in.
  if (is.na(sf::st_crs(v)) && !is.null(fallback_crs)) {
    sf::st_crs(v) <- fallback_crs
  }
  if (is.na(sf::st_crs(v))) {
    mcx_stop("A result layer came back without a CRS and none could be inferred.")
  }
  v <- sf::st_transform(v, 4326)
  # Drop columns sf cannot serialise (lists, matrices) before writing, and
  # strip the \`units\` class off the measured ones so GeoJSON gets bare numbers.
  drop <- vapply(sf::st_drop_geometry(v), function(col) !is.atomic(col), logical(1))
  if (any(drop)) v <- v[, !c(drop, FALSE), drop = FALSE]
  for (nm in setdiff(names(v), attr(v, "sf_column"))) {
    if (inherits(v[[nm]], "units") || inherits(v[[nm]], "difftime")) {
      v[[nm]] <- as.numeric(v[[nm]])
    }
  }
  tmp <- tempfile(fileext = ".geojson")
  on.exit(unlink(tmp), add = TRUE)
  suppressWarnings(sf::st_write(
    v, tmp,
    driver = "GeoJSON", quiet = TRUE, delete_dsn = TRUE,
    layer_options = c("RFC7946=YES", "WRITE_BBOX=YES")
  ))
  paste(readLines(tmp, warn = FALSE), collapse = "")
}

# --- raster helpers ----------------------------------------------------------

# Rasters travel as a base64 Float32Array plus a WGS84 extent. That keeps the
# payload self-describing and lets the plugin paint it on a canvas overlay
# without pulling a GeoTIFF decoder into the bundle.
mcx_raster_payload <- function(x, name, max_cells = 1.2e6,
                               fallback_crs = mcx_env$target_crs) {
  if (is.null(x)) {
    return(NULL)
  }
  r <- if (inherits(x, "SpatRaster")) x else terra::rast(x)
  if (terra::nlyr(r) > 1) r <- r[[1]]
  crs_now <- terra::crs(r)
  if ((is.na(crs_now) || !nzchar(crs_now)) && !is.null(fallback_crs)) {
    terra::crs(r) <- sf::st_crs(fallback_crs)$wkt
  }
  if (is.na(terra::crs(r)) || !nzchar(terra::crs(r))) {
    mcx_log("Raster '", name, "' has no CRS; skipping it.")
    return(NULL)
  }

  ncell <- terra::ncell(r)
  if (ncell > max_cells) {
    fact <- ceiling(sqrt(ncell / max_cells))
    mcx_log("Downsampling raster '", name, "' by a factor of ", fact, " for transport")
    r <- terra::aggregate(r, fact = fact, fun = "mean", na.rm = TRUE)
  }

  r84 <- if (mcx_is_geographic(r)) r else terra::project(r, "EPSG:4326", method = "bilinear")

  vals <- terra::values(r84, mat = FALSE)
  vals[is.nan(vals) | is.infinite(vals)] <- NA_real_
  finite <- vals[!is.na(vals)]

  e <- terra::ext(r84)
  list(
    name = name,
    width = terra::ncol(r84),
    height = terra::nrow(r84),
    bounds = list(
      west = e$xmin, south = e$ymin, east = e$xmax, north = e$ymax
    ),
    min = if (length(finite)) min(finite) else NA_real_,
    max = if (length(finite)) max(finite) else NA_real_,
    # NA is encoded as NaN, which survives the Float32 round-trip and is easy
    # to test for on the JavaScript side.
    data = jsonlite::base64_enc(
      writeBin(as.numeric(ifelse(is.na(vals), NaN, vals)), raw(), size = 4, endian = "little")
    )
  )
}

# --- parameter plumbing ------------------------------------------------------

mcx_pick <- function(params, name, default) {
  v <- params[[name]]
  if (is.null(v) || (length(v) == 1 && is.na(v))) default else v
}

#' Finite numbers from a parameter that may arrive as a list, a string, or not
#' at all. Returns NULL rather than an empty vector so callers can just test it.
mcx_numeric <- function(params, name) {
  v <- mcx_pick(params, name, NULL)
  if (is.null(v) || !length(v)) {
    return(NULL)
  }
  v <- suppressWarnings(as.numeric(unlist(v)))
  v <- v[is.finite(v)]
  if (!length(v)) NULL else v
}

#' The isoline interval, or NULL for "let movecost pick a tenth of the range".
#' The panel offers a number field, and an empty one arrives as zero.
mcx_breaks <- function(params) {
  v <- mcx_numeric(params, "breaks")
  if (is.null(v) || v[1] <= 0) NULL else v[1]
}

# Everything mc_surface() needs. In movecost 2.x these travelled with every
# analysis call; in 3.0 they define the cost graph, which is built once and
# then read by all the analyses.
mcx_surface_args <- function(params) {
  list(
    funct     = mcx_pick(params, "funct", "t"),
    move      = as.integer(mcx_pick(params, "move", 16)),
    field     = as.numeric(mcx_pick(params, "field", 0)),
    cogn.slp  = isTRUE(mcx_pick(params, "cognSlope", FALSE)),
    topo.dist = isTRUE(mcx_pick(params, "topoDist", FALSE)),
    sl.crit   = as.numeric(mcx_pick(params, "slCrit", 10)),
    W         = as.numeric(mcx_pick(params, "W", 70)),
    L         = as.numeric(mcx_pick(params, "L", 0)),
    N         = as.numeric(mcx_pick(params, "N", 1)),
    V         = as.numeric(mcx_pick(params, "V", 1.2))
  )
}

# Every mc_* function takes \`time\` and ignores it when the cost function is not
# time based, so the engine no longer keeps a table of which ones are.
mcx_time_unit <- function(params) {
  if (identical(mcx_pick(params, "time", "h"), "m")) "m" else "h"
}

mcx_call <- function(fun, args) {
  mcx_quietly(do.call(fun, args))
}

# --- the cost surface --------------------------------------------------------

# The one expensive step. mc_surface() turns the DTM into a directed graph of
# per-cell movement costs, and every analysis reads that graph rather than
# rebuilding it. Runs that differ only in their points — another destination,
# a second cost limit — therefore cost a Dijkstra pass instead of a full
# rebuild, which is the whole reason the 3.0 API is shaped this way.
#
# Exactly one surface is kept. Inside webR the graph is the largest object in
# the heap, so the previous one is dropped and collected before a new one is
# built, never held alongside it.
mcx_surface_signature <- function(source_key, barrier_key, args) {
  paste(
    c(source_key, barrier_key,
      vapply(args, function(v) paste(as.character(v), collapse = ","), character(1))),
    collapse = "|"
  )
}

mcx_forget_surface <- function() {
  mcx_env$surface <- NULL
  mcx_env$surface_key <- NULL
  invisible(NULL)
}

mcx_build_surface <- function(source, barrier, barrier_key, params) {
  args <- mcx_surface_args(params)
  signature <- mcx_surface_signature(source$key, barrier_key, args)
  if (!is.null(mcx_env$surface) && identical(mcx_env$surface_key, signature)) {
    mcx_log("Reusing the cost surface already built for these settings")
    return(mcx_env$surface)
  }
  mcx_forget_surface()
  invisible(gc(full = TRUE))

  call_args <- c(list(dtm = source$dtm), args)
  if (is.null(source$dtm)) {
    call_args$studyplot <- source$studyplot
    call_args$z <- source$zoom
  }
  if (!is.null(barrier)) call_args$barrier <- barrier

  mcx_log("Building the cost surface (", args$funct, ", ", args$move, " directions)")
  surface <- mcx_call(movecost::mc_surface, call_args)
  mcx_env$surface <- surface
  mcx_env$surface_key <- signature
  surface
}

# --- analyses ----------------------------------------------------------------

mcx_analysis_paths <- function(surface, origin, destin, params) {
  time <- mcx_time_unit(params)
  res <- mcx_call(movecost::mc_paths, list(
    surface = surface, origin = origin, destin = destin,
    return.base = isTRUE(mcx_pick(params, "returnBase", FALSE)),
    time = time
  ))
  # The accumulated cost surface and its isolines are a separate call in 3.0.
  # The plugin has always drawn them next to the paths, and with the graph
  # already built the second call is cheap.
  acc_args <- list(surface = surface, origin = origin, time = time)
  breaks <- mcx_breaks(params)
  if (!is.null(breaks)) acc_args$breaks <- breaks
  acc <- mcx_call(movecost::mc_accum, acc_args)

  list(
    vectors = list(
      lcps         = mcx_sf_to_geojson(res$paths),
      lcpsBack     = mcx_sf_to_geojson(res$paths.back),
      isolines     = mcx_sf_to_geojson(acc$isolines),
      destinations = mcx_sf_to_geojson(res$destin)
    ),
    rasters = list(
      accumulated = mcx_raster_payload(acc$accum, "accumulated_cost"),
      costSurface = mcx_raster_payload(surface$cost.raster, "cost_surface")
    ),
    tables = list(
      destinations = mcx_plain_table(
        if (!is.null(res$destin)) sf::st_drop_geometry(res$destin) else NULL
      )
    )
  )
}

mcx_analysis_corridor <- function(surface, a, b, params) {
  method <- mcx_pick(params, "corridorMethod", "reach")
  if (!method %in% c("reach", "through")) method <- "reach"
  res <- mcx_call(movecost::mc_corridor, list(
    surface = surface, a = a, b = b,
    method = method,
    lcp = TRUE,
    rescale = isTRUE(mcx_pick(params, "rescale", FALSE)),
    time = mcx_time_unit(params)
  ))

  list(
    vectors = list(
      lcpAtoB = mcx_sf_to_geojson(res$lcp.AtoB),
      lcpBtoA = mcx_sf_to_geojson(res$lcp.BtoA)
    ),
    rasters = list(
      corridor = mcx_raster_payload(res$corridor, "least_cost_corridor")
    )
  )
}

mcx_analysis_network <- function(surface, nodes, params) {
  type <- mcx_pick(params, "netwType", "allpairs")
  if (!type %in% c("allpairs", "neigh")) type <- "allpairs"
  res <- mcx_call(movecost::mc_network, list(
    surface = surface, nodes = nodes,
    type = type,
    density = isTRUE(mcx_pick(params, "lcpDensity", FALSE)),
    time = mcx_time_unit(params)
  ))

  list(
    vectors = list(
      network = mcx_sf_to_geojson(res$paths),
      nodes = mcx_sf_to_geojson(res$nodes)
    ),
    rasters = list(
      density = mcx_raster_payload(res$density.perc, "lcp_density_percent")
    ),
    tables = list(
      costMatrix = mcx_plain_table(res$cost.matrix)
    )
  )
}

mcx_analysis_allocation <- function(surface, origin, params) {
  args <- list(surface = surface, origin = origin, time = mcx_time_unit(params))
  breaks <- mcx_breaks(params)
  if (!is.null(breaks)) args$breaks <- breaks
  res <- mcx_call(movecost::mc_alloc, args)

  list(
    vectors = list(
      boundaries = mcx_sf_to_geojson(res$zones),
      isolines = if (isTRUE(mcx_pick(params, "isolines", FALSE))) {
        mcx_sf_to_geojson(res$isolines)
      } else {
        NULL
      }
    ),
    rasters = list(
      allocation = mcx_raster_payload(res$alloc, "cost_allocation")
    )
  )
}

mcx_analysis_boundary <- function(surface, origin, params) {
  limits <- mcx_numeric(params, "contValue")
  if (is.null(limits)) {
    mcx_stop("The boundary analysis needs at least one cost limit.")
  }
  time <- mcx_time_unit(params)
  # mc_boundary() takes one limit per call. Several are still worth offering —
  # the one-hour and the two-hour walk on the same map — and with the graph
  # already built each extra limit costs only its own pass over it.
  parts <- lapply(limits, function(limit) {
    mcx_call(movecost::mc_boundary, list(
      surface = surface, origin = origin, limit = limit, time = time
    ))
  })
  boundaries <- do.call(rbind, lapply(parts, function(p) p$boundaries))

  list(
    vectors = list(
      boundaries = mcx_sf_to_geojson(boundaries)
    ),
    rasters = list(
      accumulated = mcx_raster_payload(parts[[1]]$accum, "accumulated_cost")
    ),
    tables = list(
      boundaries = mcx_plain_table(
        if (!is.null(boundaries)) sf::st_drop_geometry(boundaries) else NULL
      )
    )
  )
}

mcx_analysis_rank <- function(surface, origin, destin, params) {
  res <- mcx_call(movecost::mc_rank, list(
    surface = surface, origin = origin, destin = destin,
    k = as.integer(mcx_pick(params, "lcpN", 3)),
    penalty = as.numeric(mcx_pick(params, "penalty", 0.01)),
    time = mcx_time_unit(params)
  ))

  list(
    vectors = list(
      rankedPaths = mcx_sf_to_geojson(res$paths)
    ),
    rasters = list(
      corridor = mcx_raster_payload(res$corridor, "least_cost_corridor")
    ),
    tables = list(
      paths = mcx_plain_table(
        if (!is.null(res$paths)) sf::st_drop_geometry(res$paths) else NULL
      )
    )
  )
}

# --- online elevation --------------------------------------------------------

# Approximate ground resolution of an AWS terrain tile at the equator, per zoom
# level. Used only to describe the download before and after it happens.
mcx_zoom_resolution <- function(z) 156543.03392 / (2^z)

#' Download a DEM for a drawn area.
#'
#' Wraps elevatr's AWS terrain tiles. The area arrives as a WGS84 GeoJSON
#' polygon; the DEM comes back projected to the UTM zone of its centroid, which
#' is what the cost functions need, and clipped to the polygon.
#'
#' @param request_path JSON with \`areaPath\`, \`zoom\`, and an optional \`outPath\`
#' @param response_path where to write the JSON response
mcx_fetch_dem <- function(request_path, response_path = NULL) {
  mcx_env$log <- character(0)
  started <- Sys.time()
  if (is.null(response_path)) {
    response_path <- paste0(tools::file_path_sans_ext(request_path), ".response.json")
  }

  out <- tryCatch(
    {
      if (!requireNamespace("elevatr", quietly = TRUE)) {
        mcx_stop("The R package 'elevatr' is not installed. install.packages(\\"elevatr\\")")
      }
      req <- jsonlite::fromJSON(request_path, simplifyVector = TRUE)
      if (is.null(req$areaPath) || !file.exists(req$areaPath)) {
        mcx_stop("No area polygon was supplied.")
      }
      zoom <- as.integer(mcx_pick(req, "zoom", 12))
      if (is.na(zoom) || zoom < 1 || zoom > 14) {
        mcx_stop("Zoom level must be between 1 and 14.")
      }

      area <- sf::st_read(req$areaPath, quiet = TRUE)
      if (nrow(area) == 0) mcx_stop("The area layer has no features.")
      if (is.na(sf::st_crs(area))) sf::st_crs(area) <- 4326
      area <- sf::st_transform(area, 4326)
      area <- sf::st_make_valid(sf::st_union(area))
      geom_type <- as.character(sf::st_geometry_type(area, by_geometry = FALSE))
      if (!grepl("POLYGON", geom_type)) {
        mcx_stop("The area must be a polygon, not a ", tolower(geom_type), ".")
      }

      centroid <- sf::st_coordinates(sf::st_centroid(area))
      epsg <- mcx_utm_epsg(centroid[1, 1], centroid[1, 2])
      mcx_log("Downloading elevation at zoom ", zoom, "; projecting to EPSG:", epsg)

      area_sf <- sf::st_sf(geometry = sf::st_sfc(area, crs = 4326))
      dem <- suppressWarnings(suppressMessages(
        elevatr::get_elev_raster(
          locations = area_sf, z = zoom, src = "aws",
          clip = "locations", verbose = FALSE, override_size_check = TRUE
        )
      ))

      r <- terra::rast(dem)
      r <- terra::project(r, paste0("EPSG:", epsg), method = "bilinear")
      names(r) <- "dtm"

      out_path <- mcx_pick(req, "outPath", NULL)
      if (is.null(out_path)) {
        out_path <- file.path(dirname(request_path), "dem.tif")
      }
      terra::writeRaster(r, out_path, overwrite = TRUE, gdal = c("COMPRESS=DEFLATE"))

      e <- terra::ext(r)
      e84 <- terra::ext(terra::project(r, "EPSG:4326"))
      values <- terra::values(r, mat = FALSE)
      finite <- values[!is.na(values)]

      list(
        ok = TRUE,
        path = out_path,
        bytes = file.info(out_path)$size,
        crs = paste0("EPSG:", epsg),
        zoom = zoom,
        width = terra::ncol(r),
        height = terra::nrow(r),
        resolution = as.numeric(terra::res(r))[1],
        elevation = list(
          min = if (length(finite)) min(finite) else NA_real_,
          max = if (length(finite)) max(finite) else NA_real_
        ),
        bounds = list(west = e84$xmin, south = e84$ymin, east = e84$xmax, north = e84$ymax),
        extentProjected = list(xmin = e$xmin, ymin = e$ymin, xmax = e$xmax, ymax = e$ymax),
        elapsedSeconds = as.numeric(difftime(Sys.time(), started, units = "secs")),
        log = mcx_log_out()
      )
    },
    error = function(e) {
      list(ok = FALSE, error = conditionMessage(e), log = mcx_log_out())
    }
  )

  jsonlite::write_json(out, response_path, auto_unbox = TRUE, null = "null",
                       na = "null", digits = 8)
  invisible(response_path)
}

#' Turn an elevation grid fetched in the browser into a projected DTM.
#'
#' The JavaScript side downloads AWS Terrarium tiles and decodes them into a
#' Float32 grid in Web Mercator (EPSG:3857). Slope on a Mercator grid would be
#' wrong by 1/cos(latitude), so the grid is reprojected to the UTM zone of its
#' centroid here, optionally masked to the drawn area, and written as a GeoTIFF
#' — after which it is indistinguishable from an uploaded or elevatr-fetched DTM.
#'
#' @param request_path JSON with \`gridPath\` (raw little-endian Float32, row-major
#'   from the top-left), \`width\`, \`height\`, \`xmin\`/\`ymin\`/\`xmax\`/\`ymax\` in the
#'   grid CRS, \`crs\` (default EPSG:3857), optional \`areaPath\` and \`outPath\`
mcx_grid_to_dtm <- function(request_path, response_path = NULL) {
  mcx_env$log <- character(0)
  started <- Sys.time()
  if (is.null(response_path)) {
    response_path <- paste0(tools::file_path_sans_ext(request_path), ".response.json")
  }

  out <- tryCatch(
    {
      req <- jsonlite::fromJSON(request_path, simplifyVector = TRUE)
      width <- as.integer(req$width)
      height <- as.integer(req$height)
      if (is.na(width) || is.na(height) || width < 2 || height < 2) {
        mcx_stop("The elevation grid must be at least 2 x 2 cells.")
      }
      if (is.null(req$gridPath) || !file.exists(req$gridPath)) {
        mcx_stop("The elevation grid file is missing.")
      }
      expected <- as.numeric(width) * height
      n_bytes <- file.info(req$gridPath)$size
      if (n_bytes != expected * 4) {
        mcx_stop("The elevation grid has ", n_bytes, " bytes; expected ",
                 expected * 4, " for ", width, " x ", height, " Float32 cells.")
      }

      values <- readBin(req$gridPath, what = "numeric", n = expected, size = 4,
                        endian = "little")
      values[is.nan(values)] <- NA_real_
      grid_crs <- mcx_pick(req, "crs", "EPSG:3857")

      r <- terra::rast(matrix(values, nrow = height, ncol = width, byrow = TRUE),
                       crs = grid_crs)
      rm(values)
      terra::ext(r) <- terra::ext(req$xmin, req$xmax, req$ymin, req$ymax)

      # Belt and braces behind the panel's own budget: a grid over \`maxCells\`
      # is averaged down before projection, so an oversized request degrades
      # to a coarser DTM instead of exhausting the heap.
      max_cells <- as.numeric(mcx_pick(req, "maxCells", NA_real_))
      if (is.finite(max_cells) && max_cells > 0 && expected > max_cells) {
        fact <- ceiling(sqrt(expected / max_cells))
        mcx_log("Grid of ", expected, " cells exceeds the ", max_cells,
                "-cell budget; aggregating by ", fact)
        r <- terra::aggregate(r, fact = fact, fun = "mean", na.rm = TRUE)
        width <- terra::ncol(r)
        height <- terra::nrow(r)
      }

      centre <- sf::st_sfc(sf::st_point(c((req$xmin + req$xmax) / 2,
                                          (req$ymin + req$ymax) / 2)),
                           crs = sf::st_crs(grid_crs))
      lonlat <- sf::st_coordinates(sf::st_transform(centre, 4326))
      epsg <- mcx_utm_epsg(lonlat[1, 1], lonlat[1, 2])
      mcx_log("Projecting a ", width, " x ", height, " grid from ", grid_crs,
              " to EPSG:", epsg)

      # Keep the cell size the tiles actually had at this latitude, rather than
      # terra's default guess, so the DTM resolution matches the zoom chosen.
      mercator_res <- (req$xmax - req$xmin) / width
      true_res <- mercator_res * cos(lonlat[1, 2] * pi / 180)
      r <- terra::project(r, paste0("EPSG:", epsg), method = "bilinear",
                          res = true_res)

      area_path <- mcx_pick(req, "areaPath", NULL)
      if (!is.null(area_path) && file.exists(area_path)) {
        area <- sf::st_read(area_path, quiet = TRUE)
        if (nrow(area) > 0) {
          if (is.na(sf::st_crs(area))) sf::st_crs(area) <- 4326
          area <- sf::st_transform(sf::st_make_valid(sf::st_union(area)), paste0("EPSG:", epsg))
          area_v <- terra::vect(sf::st_as_sf(sf::st_sfc(area, crs = sf::st_crs(paste0("EPSG:", epsg)))))
          r <- terra::mask(terra::crop(r, area_v), area_v)
        }
      }
      names(r) <- "dtm"

      keep_as <- mcx_pick(req, "keepAs", NULL)
      out_path <- mcx_pick(req, "outPath", NULL)
      if (!is.null(keep_as) && nzchar(keep_as)) {
        # One DTM at a time: inside webR every kept raster stays in the wasm
        # heap, and a handful of downloads over a session is what turns a
        # comfortable run into "cannot allocate". The panel only ever refers
        # to the latest handle.
        mcx_env$dtms <- list()
        mcx_env$dtms[[keep_as]] <- r
        # A new DTM invalidates the cached cost graph, and holding both at once
        # is exactly what exhausts the wasm heap.
        mcx_forget_surface()
        out_bytes <- 0
        out_path <- NULL
      } else {
        if (is.null(out_path)) out_path <- file.path(dirname(request_path), "dem.tif")
        terra::writeRaster(r, out_path, overwrite = TRUE, gdal = c("COMPRESS=DEFLATE"))
        out_bytes <- file.info(out_path)$size
      }

      e84 <- terra::project(terra::ext(r), from = terra::crs(r), to = "EPSG:4326")
      finite <- terra::values(r, mat = FALSE)
      finite <- finite[!is.na(finite)]

      list(
        ok = TRUE,
        path = out_path,
        handle = keep_as,
        bytes = out_bytes,
        crs = paste0("EPSG:", epsg),
        zoom = mcx_pick(req, "zoom", NA_integer_),
        width = terra::ncol(r),
        height = terra::nrow(r),
        resolution = as.numeric(terra::res(r))[1],
        elevation = list(
          min = if (length(finite)) min(finite) else NA_real_,
          max = if (length(finite)) max(finite) else NA_real_
        ),
        bounds = list(west = terra::xmin(e84), south = terra::ymin(e84),
                      east = terra::xmax(e84), north = terra::ymax(e84)),
        elapsedSeconds = as.numeric(difftime(Sys.time(), started, units = "secs")),
        log = mcx_log_out()
      )
    },
    error = function(e) list(ok = FALSE, error = mcx_memory_hint(conditionMessage(e)), log = mcx_log_out())
  )
  invisible(gc(full = TRUE))

  jsonlite::write_json(out, response_path, auto_unbox = TRUE, null = "null",
                       na = "null", digits = 8)
  invisible(response_path)
}

#' Summarise a DTM for display on the map.
#'
#' Returns the same raster payload shape the analyses use, so the plugin can
#' paint the terrain with the machinery it already has instead of decoding a
#' GeoTIFF in the browser. Works for a downloaded DEM and an uploaded one alike.
#'
#' @param request_path JSON with \`dtmPath\` and an optional \`maxCells\`
mcx_preview_dtm <- function(request_path, response_path = NULL) {
  mcx_env$log <- character(0)
  mcx_env$target_crs <- NULL
  if (is.null(response_path)) {
    response_path <- paste0(tools::file_path_sans_ext(request_path), ".response.json")
  }

  out <- tryCatch(
    {
      mcx_require()
      req <- jsonlite::fromJSON(request_path, simplifyVector = TRUE)
      r <- mcx_resolve_dtm(req, reproject = TRUE)
      if (is.null(r)) mcx_stop("No DTM to preview.")
      mcx_env$target_crs <- sf::st_crs(terra::crs(r))

      values <- terra::values(r, mat = FALSE)
      finite <- values[!is.na(values)]
      # A preview only has to look right on screen, so it is capped well below
      # the analysis limit — a 4000 x 4000 DTM would otherwise ship 64 MB.
      payload <- mcx_raster_payload(
        r, "terrain",
        max_cells = as.numeric(mcx_pick(req, "maxCells", 250000))
      )

      list(
        ok = TRUE,
        crs = as.character(mcx_env$target_crs$input),
        width = terra::ncol(r),
        height = terra::nrow(r),
        resolution = as.numeric(terra::res(r))[1],
        elevation = list(
          min = if (length(finite)) min(finite) else NA_real_,
          max = if (length(finite)) max(finite) else NA_real_
        ),
        raster = payload,
        log = mcx_log_out()
      )
    },
    error = function(e) list(ok = FALSE, error = conditionMessage(e), log = mcx_log_out())
  )

  jsonlite::write_json(out, response_path, auto_unbox = TRUE, null = "null",
                       na = "null", digits = 8)
  invisible(response_path)
}

# --- entry point -------------------------------------------------------------

#' Run one movecost analysis described by a JSON request file.
#'
#' @param request_path path to the JSON request
#' @param response_path where to write the JSON response; defaults to
#'   \`<request>.response.json\`
#' @return the response path, invisibly
mcx_run <- function(request_path, response_path = NULL) {
  mcx_env$log <- character(0)
  mcx_env$target_crs <- NULL
  started <- Sys.time()
  if (is.null(response_path)) {
    response_path <- paste0(tools::file_path_sans_ext(request_path), ".response.json")
  }

  mcx_env$frames <- character(0)
  out <- tryCatch(
    mcx_watch({
      mcx_require()
      req <- jsonlite::fromJSON(request_path, simplifyVector = TRUE)
      params <- if (is.null(req$params)) list() else as.list(req$params)
      analysis <- req$analysis
      if (is.null(analysis)) mcx_stop("The request has no 'analysis' field.")

      # Terrain arrives one of two ways: a DTM the caller supplies, or a study
      # area that movecost itself resolves into elevation through elevatr. The
      # second is mc_surface()'s own documented path (\`studyplot\` + \`z\`), so it
      # is passed straight through rather than reimplemented here.
      dtm_rast <- mcx_resolve_dtm(
        req,
        reproject = !identical(mcx_pick(params, "autoReproject", TRUE), FALSE)
      )

      if (!is.null(dtm_rast)) {
        target_crs <- sf::st_crs(terra::crs(dtm_rast))
        mcx_env$target_crs <- target_crs
        # movecost 3.0 takes a SpatRaster directly; the raster/sp round-trip
        # the 2.x engine needed is gone.
        source <- list(
          dtm = dtm_rast,
          key = paste0(
            "dtm:", mcx_pick(req, "dtmHandle", ""), ":", mcx_pick(req, "dtmPath", ""),
            ":", terra::ncol(dtm_rast), "x", terra::nrow(dtm_rast)
          )
        )
      } else {
        if (is.null(req$studyplotPath) || !file.exists(req$studyplotPath)) {
          mcx_stop("Supply either a DTM or a study area to download elevation for.")
        }
        if (!requireNamespace("elevatr", quietly = TRUE)) {
          mcx_stop("Downloading elevation needs the R package 'elevatr'.")
        }
        # Slope must be computed on a grid in metres, so the study area is
        # projected first: elevatr returns elevation in the CRS it is given.
        plot_sf <- sf::st_read(req$studyplotPath, quiet = TRUE)
        if (nrow(plot_sf) == 0) mcx_stop("The study area has no features.")
        if (is.na(sf::st_crs(plot_sf))) sf::st_crs(plot_sf) <- 4326
        plot_sf <- sf::st_transform(plot_sf, 4326)
        centroid <- sf::st_coordinates(sf::st_centroid(sf::st_union(plot_sf)))
        epsg <- mcx_utm_epsg(centroid[1, 1], centroid[1, 2])
        target_crs <- sf::st_crs(epsg)
        mcx_env$target_crs <- target_crs
        zoom <- as.integer(mcx_pick(params, "zoom", 12))
        if (is.na(zoom) || zoom < 1 || zoom > 14) mcx_stop("Zoom level must be between 1 and 14.")
        mcx_log("No DTM supplied; movecost will download elevation at zoom ", zoom,
                " in EPSG:", epsg)
        source <- list(
          dtm = NULL,
          studyplot = sf::st_transform(plot_sf, target_crs),
          zoom = zoom,
          key = paste0("area:", req$studyplotPath, ":", zoom, ":", epsg)
        )
      }

      cell_size <- if (!is.null(source$dtm)) as.numeric(terra::res(source$dtm))[1] else NA_real_
      origin_sf  <- mcx_ensure_id(mcx_tidy_vector(
        mcx_read_vector(req$originPath, target_crs, "Origin"), "origin"))
      destin_sf  <- mcx_ensure_id(mcx_tidy_vector(
        mcx_read_vector(req$destinPath, target_crs, "Destination"), "destination"))
      barrier_sf <- mcx_prepare_barrier(
        mcx_read_vector(req$barrierPath, target_crs, "Barrier"), cell_size)

      if (is.null(origin_sf)) mcx_stop("Every analysis needs at least one origin point.")

      # Written to the log on every run: when something fails on a user's own
      # layers, the shape of those layers is the first thing worth knowing and
      # the last thing anyone thinks to ask for.
      describe <- function(v, name) {
        if (is.null(v)) {
          return(NULL)
        }
        types <- unique(as.character(sf::st_geometry_type(v)))
        paste0(name, " ", nrow(v), " x ", paste(types, collapse = "/"),
               " (", paste(setdiff(names(v), attr(v, "sf_column")), collapse = ", "), ")")
      }
      mcx_log(paste(c(
        if (!is.null(source$dtm)) {
          paste0("DTM ", terra::ncol(source$dtm), "x", terra::nrow(source$dtm),
                 " at ", round(as.numeric(terra::res(source$dtm))[1], 1), " m")
        } else {
          paste0("study area, zoom ", source$zoom)
        },
        describe(origin_sf, "origin"), describe(destin_sf, "destin"),
        describe(barrier_sf, "barrier")
      ), collapse = "; "))

      # Checked before the surface is built: a missing destination should not
      # cost the user a full graph construction first.
      switch(analysis,
        paths = if (is.null(destin_sf)) mcx_stop("The least-cost path analysis needs destination points."),
        corridor = if (is.null(destin_sf)) mcx_stop("The corridor analysis needs a second location."),
        rank = if (is.null(destin_sf)) mcx_stop("The ranking analysis needs a destination point."),
        network = if (nrow(origin_sf) < 2) mcx_stop("The network analysis needs at least two locations."),
        allocation = if (nrow(origin_sf) < 2) mcx_stop("The allocation analysis needs at least two origins."),
        boundary = invisible(NULL),
        mcx_stop("Unknown analysis: ", analysis)
      )

      # Barriers now belong to the surface rather than to each analysis, so
      # every analysis honours them — including allocation and ranking, which
      # movecost 2.x could not.
      barrier_key <- paste0("barrier:", mcx_pick(req, "barrierPath", ""),
                            ":", as.numeric(mcx_pick(params, "field", 0)))
      surface <- mcx_build_surface(source, barrier_sf, barrier_key, params)

      result <- switch(analysis,
        paths = mcx_analysis_paths(surface, origin_sf, destin_sf, params),
        corridor = mcx_analysis_corridor(surface, origin_sf, destin_sf, params),
        network = mcx_analysis_network(surface, origin_sf, params),
        allocation = mcx_analysis_allocation(surface, origin_sf, params),
        boundary = mcx_analysis_boundary(surface, origin_sf, params),
        rank = mcx_analysis_rank(surface, origin_sf, destin_sf, params),
        mcx_stop("Unknown analysis: ", analysis)
      )

      result$rasters <- Filter(Negate(is.null), result$rasters)
      result$vectors <- Filter(Negate(is.null), result$vectors)

      list(
        ok = TRUE,
        analysis = analysis,
        crs = as.character(sf::st_crs(target_crs)$input),
        elapsedSeconds = as.numeric(difftime(Sys.time(), started, units = "secs")),
        versions = mcx_version(),
        log = mcx_log_out(),
        result = result
      )
    }),
    error = function(e) {
      list(
        ok = FALSE,
        error = mcx_memory_hint(conditionMessage(e)),
        where = mcx_frames_out(),
        log = mcx_log_out(),
        elapsedSeconds = as.numeric(difftime(Sys.time(), started, units = "secs"))
      )
    }
  )
  # The transition matrices and cost surfaces are large and out of scope now;
  # inside webR the heap they held is only reusable once R has collected them.
  invisible(gc(full = TRUE))

  jsonlite::write_json(
    out, response_path,
    auto_unbox = TRUE, null = "null", na = "null", digits = 8
  )
  invisible(response_path)
}

# R's out-of-memory errors name the size, never the remedy.
mcx_memory_hint <- function(msg) {
  if (grepl("cannot allocate|memory exhausted|out of memory|Cannot enlarge memory", msg,
            ignore.case = TRUE)) {
    paste0(msg, " (the DTM is too large for the memory available: use a coarser ",
           "detail level or a smaller area, or 8 movement directions instead of 16)")
  } else {
    msg
  }
}
`;const WEBR_VERSION="0.6.0";const WEBR_BASE_URL=readOverride$1("MOVECOST_WEBR_BASE_URL")??`https://cdn.jsdelivr.net/npm/webr@${WEBR_VERSION}/dist/`;const UPSTREAM_WASM_REPO="https://repo.r-wasm.org";const PUBLISHED_WASM_REPO="https://enzococca.github.io/geolibre-movecost/wasm-repo";const WASM_CRAN_REPOS=(()=>{const override=readOverride$1("MOVECOST_WASM_REPO");const repos=[PUBLISHED_WASM_REPO,UPSTREAM_WASM_REPO];return override?[override,...repos]:repos})();const R_PACKAGES=["codetools","jsonlite","terra","sf","igraph","ggplot2","movecost"];const R_PACKAGE_WEIGHTS={codetools:1,jsonlite:1,terra:8,sf:10,igraph:8,ggplot2:6,movecost:2};function readOverride$1(key){try{const value=globalThis.localStorage?.getItem(key);return value&&value.trim()?value.trim():null}catch{return null}}function parseDemSummary(raw){const scalar=value=>Array.isArray(value)?value[0]:value;const elevation=raw.elevation??{};const b2=raw.bounds??{};return{crs:String(scalar(raw.crs)),zoom:Number(scalar(raw.zoom)),width:Number(scalar(raw.width)),height:Number(scalar(raw.height)),resolution:Number(scalar(raw.resolution)),bytes:Number(scalar(raw.bytes)),elapsedSeconds:Number(scalar(raw.elapsedSeconds)),elevation:{min:Number(scalar(elevation.min)),max:Number(scalar(elevation.max))},bounds:{west:Number(scalar(b2.west)),south:Number(scalar(b2.south)),east:Number(scalar(b2.east)),north:Number(scalar(b2.north))}}}const DEFAULT_BACKEND_URL=readOverride("MOVECOST_BACKEND_URL")??"http://127.0.0.1:8787";function readOverride(key){try{const value=globalThis.localStorage?.getItem(key);return value&&value.trim()?value.trim().replace(/\/$/,""):null}catch{return null}}function isMobileDevice(){const ua=navigator.userAgent;if(/Android|iPhone|iPad/i.test(ua))return true;return/Mac/.test(ua)&&navigator.maxTouchPoints>1}async function probeBackend(url=DEFAULT_BACKEND_URL,timeoutMs=1500){if(isMobileDevice())return null;const controller=new AbortController;const timer=setTimeout(()=>controller.abort(),timeoutMs);try{const response=await fetch(`${url}/health`,{signal:controller.signal,cache:"no-store"});if(!response.ok)return null;const health=await response.json();return health?.ok?health:null}catch{return null}finally{clearTimeout(timer)}}class HttpBackend{constructor(url=DEFAULT_BACKEND_URL,versions=null){this.url=url;this.versions=versions}id="local-r";listeners=new Set;get label(){const movecost=this.versions?.movecost;return movecost?`Local R service (movecost ${movecost})`:"Local R service"}onProgress(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener)}emit(phase,message,fraction=null){for(const listener of this.listeners){try{listener({phase,message,fraction})}catch{}}}async run(request,inputs){const form=new FormData;if(inputs.dtm){form.append("dtm",new Blob([inputs.dtm],{type:"image/tiff"}),"dtm.tif")}if(inputs.studyplot)form.append("studyplot",inputs.studyplot);form.append("origin",inputs.origin);if(inputs.destin)form.append("destin",inputs.destin);if(inputs.barrier)form.append("barrier",inputs.barrier);form.append("request",JSON.stringify(request));this.emit("running",inputs.dtm?`Running the ${request.analysis} analysis on the local R service…`:`Downloading elevation, then running the ${request.analysis} analysis…`,null);let response;try{response=await fetch(`${this.url}/run`,{method:"POST",body:form})}catch(error){this.emit("error","The local R service stopped responding.");return{ok:false,error:`Could not reach the local R service at ${this.url}. Start it with "Rscript r-backend/start.R" from the plugin project. (${error instanceof Error?error.message:String(error)})`}}let payload;try{payload=await response.json()}catch{this.emit("error","The local R service returned something that is not JSON.");return{ok:false,error:`The local R service replied with HTTP ${response.status} and a body that is not JSON.`}}this.emit(payload.ok?"done":"error",payload.ok?"Analysis complete.":payload.error,1);return payload}async fetchDem(areaGeoJson,zoom){const form=new FormData;form.append("area",areaGeoJson);form.append("zoom",String(zoom));this.emit("running",`Downloading elevation tiles at zoom ${zoom}…`,null);const response=await fetch(`${this.url}/dem`,{method:"POST",body:form});if(!response.ok){let detail=`HTTP ${response.status}`;try{const body=await response.json();if(body?.error)detail=body.error}catch{}this.emit("error",detail,1);throw new Error(detail)}const header=response.headers.get("X-Movecost-Summary");if(!header){throw new Error("The DEM came back without its summary header. The R service may be an older version.")}const summary=parseDemSummary(JSON.parse(header));const bytes=new Uint8Array(await response.arrayBuffer());this.emit("done",`Downloaded a ${summary.width} x ${summary.height} DEM.`,1);return{bytes,summary}}async dtmFromGrid(grid,areaGeoJson){const form=new FormData;const bytes=new Uint8Array(grid.data.buffer,grid.data.byteOffset,grid.data.byteLength);form.append("grid",new Blob([bytes],{type:"application/octet-stream"}),"grid.bin");form.append("meta",JSON.stringify({width:grid.width,height:grid.height,crs:grid.crs,zoom:grid.zoom,xmin:grid.xmin,ymin:grid.ymin,xmax:grid.xmax,ymax:grid.ymax}));if(areaGeoJson)form.append("area",areaGeoJson);this.emit("running","Projecting the elevation grid…",null);const response=await fetch(`${this.url}/grid`,{method:"POST",body:form});if(!response.ok){let detail=`HTTP ${response.status}`;try{const body=await response.json();if(body?.error)detail=body.error}catch{}this.emit("error",detail,1);throw new Error(detail)}const header=response.headers.get("X-Movecost-Summary");if(!header)throw new Error("The DTM came back without its summary header.");const summary=parseDemSummary(JSON.parse(header));const tif=new Uint8Array(await response.arrayBuffer());this.emit("done",`Built a ${summary.width} x ${summary.height} DTM.`,1);return{bytes:tif,summary}}async previewDtm(dtm,handle){if(handle)throw new Error("The local R service holds no DTM handles; send the GeoTIFF instead.");const form=new FormData;form.append("dtm",new Blob([dtm],{type:"image/tiff"}),"dtm.tif");const response=await fetch(`${this.url}/preview`,{method:"POST",body:form});const payload=await response.json();if(!response.ok||!payload.ok){throw new Error(payload.error??`HTTP ${response.status}`)}return payload}async close(){this.listeners.clear()}}const WORK_DIR="/movecost";const ENGINE_PATH=`${WORK_DIR}/movecost-engine.R`;class MovecostEngine{constructor(baseUrl=WEBR_BASE_URL,extraRepos=[]){this.baseUrl=baseUrl;this.extraRepos=extraRepos}id="webr";get repos(){return[...this.extraRepos,...WASM_CRAN_REPOS.filter(r13=>!this.extraRepos.includes(r13))]}webR=null;booting=null;queue=Promise.resolve();listeners=new Set;requestCounter=0;versions=null;get label(){const movecost=this.versions?.movecost;return movecost?`In-browser R (movecost ${movecost})`:"In-browser R (webR)"}onProgress(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener)}get isReady(){return this.webR!==null}emit(phase,message,fraction=null){const event={phase,message,fraction};for(const listener of this.listeners){try{listener(event)}catch{}}}async boot(){if(this.webR)return this.webR;if(this.booting)return this.booting;this.booting=(async()=>{this.emit("downloading-r","Downloading the R runtime (about 40 MB, once per session)…",null);const webR=new Je({baseUrl:this.baseUrl,repoUrl:this.repos[0],interactive:false});await webR.init();const total=R_PACKAGES.reduce((sum,p2)=>sum+(R_PACKAGE_WEIGHTS[p2]??1),0);let done=0;for(const pkg of R_PACKAGES){this.emit("installing-packages",`Installing R package ${pkg}…`,Math.min(.99,done/total));await installPackage(webR,pkg,this.repos);done+=R_PACKAGE_WEIGHTS[pkg]??1}this.emit("loading-engine","Loading the movecost engine…",1);await ensureDir(webR,WORK_DIR);await webR.FS.writeFile(ENGINE_PATH,new TextEncoder().encode(engineSource));await webR.evalRVoid(`source(${rString(ENGINE_PATH)})`);const versionsJson=await webR.evalRString("jsonlite::toJSON(mcx_version(), auto_unbox = TRUE)");this.versions=JSON.parse(versionsJson);this.webR=webR;this.emit("done","The movecost engine is ready.",1);return webR})();try{return await this.booting}catch(error){this.booting=null;this.emit("error",describeError(error));throw error}}run(request,inputs){const task=this.queue.then(()=>this.runNow(request,inputs),()=>this.runNow(request,inputs));this.queue=task.catch(()=>void 0);return task}async runNow(request,inputs){const webR=await this.boot();const id=++this.requestCounter;const dir=`${WORK_DIR}/run-${id}`;await ensureDir(webR,dir);const encoder=new TextEncoder;const dtmPath=inputs.dtm&&!inputs.dtmHandle?`${dir}/dtm.tif`:null;const studyplotPath=inputs.studyplot?`${dir}/studyplot.geojson`:null;const originPath=`${dir}/origin.geojson`;const destinPath=inputs.destin?`${dir}/destin.geojson`:null;const barrierPath=inputs.barrier?`${dir}/barrier.geojson`:null;const requestPath=`${dir}/request.json`;const responsePath=`${dir}/request.response.json`;this.emit("running","Writing inputs into the R filesystem…",null);if(dtmPath)await webR.FS.writeFile(dtmPath,inputs.dtm);if(studyplotPath){await webR.FS.writeFile(studyplotPath,encoder.encode(inputs.studyplot))}await webR.FS.writeFile(originPath,encoder.encode(inputs.origin));if(destinPath)await webR.FS.writeFile(destinPath,encoder.encode(inputs.destin));if(barrierPath)await webR.FS.writeFile(barrierPath,encoder.encode(inputs.barrier));const fullRequest={...request,dtmPath,dtmHandle:inputs.dtmHandle??null,studyplotPath,originPath,destinPath,barrierPath};await webR.FS.writeFile(requestPath,encoder.encode(JSON.stringify(fullRequest)));this.emit("running",`Running the ${request.analysis} analysis — this can take a while on a large DTM…`,null);await webR.evalRVoid(`mcx_run(${rString(requestPath)})`);this.emit("reading-results","Reading the results back…",null);const raw=await webR.FS.readFile(responsePath);const response=JSON.parse(new TextDecoder().decode(raw));await cleanupDir(webR,dir);this.emit(response.ok?"done":"error",response.ok?"Analysis complete.":response.error,1);return response}dtmFromGrid(grid,areaGeoJson,options={}){const task=this.queue.then(()=>this.gridNow(grid,areaGeoJson,options),()=>this.gridNow(grid,areaGeoJson,options));this.queue=task.catch(()=>void 0);return task}async gridNow(grid,areaGeoJson,options){const webR=await this.boot();const dir=`${WORK_DIR}/grid-${++this.requestCounter}`;await ensureDir(webR,dir);const encoder=new TextEncoder;const gridPath=`${dir}/grid.bin`;const areaPath=areaGeoJson?`${dir}/area.geojson`:null;const handle=`dem-${this.requestCounter}`;const requestPath=`${dir}/grid.json`;const responsePath=`${dir}/grid.response.json`;this.emit("running","Projecting the elevation grid…",null);await webR.FS.writeFile(gridPath,new Uint8Array(grid.data.buffer,grid.data.byteOffset,grid.data.byteLength));if(areaPath)await webR.FS.writeFile(areaPath,encoder.encode(areaGeoJson));await webR.FS.writeFile(requestPath,encoder.encode(JSON.stringify({gridPath,areaPath,keepAs:handle,maxCells:options.maxCells??null,width:grid.width,height:grid.height,crs:grid.crs,zoom:grid.zoom,xmin:grid.xmin,ymin:grid.ymin,xmax:grid.xmax,ymax:grid.ymax})));await webR.evalRVoid(`mcx_grid_to_dtm(${rString(requestPath)})`);const raw=JSON.parse(new TextDecoder().decode(await webR.FS.readFile(responsePath)));if(!raw.ok){await cleanupDir(webR,dir);this.emit("error",raw.error??"The grid could not be projected.",1);throw new Error(raw.error??"The grid could not be projected.")}await cleanupDir(webR,dir);const summary=parseDemSummary(raw);this.emit("done",`Built a ${summary.width} x ${summary.height} DTM.`,1);return{bytes:new Uint8Array(0),handle,summary}}async previewDtm(dtm,handle){const webR=await this.boot();const dir=`${WORK_DIR}/preview-${++this.requestCounter}`;await ensureDir(webR,dir);const dtmPath=handle?null:`${dir}/dtm.tif`;const requestPath=`${dir}/preview.json`;const responsePath=`${dir}/preview.response.json`;if(dtmPath)await webR.FS.writeFile(dtmPath,dtm);await webR.FS.writeFile(requestPath,new TextEncoder().encode(JSON.stringify({dtmPath,dtmHandle:handle??null})));await webR.evalRVoid(`mcx_preview_dtm(${rString(requestPath)})`);const raw=await webR.FS.readFile(responsePath);const payload=JSON.parse(new TextDecoder().decode(raw));await cleanupDir(webR,dir);if(!payload.ok)throw new Error(payload.error??"The DTM preview failed.");return payload}async close(){const webR=this.webR;this.webR=null;this.booting=null;this.versions=null;if(webR){try{await webR.close()}catch{}}}}function rString(value){return`"${value.replace(/\\/g,"\\\\").replace(/"/g,'\\"')}"`}async function ensureDir(webR,path){try{await webR.FS.mkdir(path)}catch{}}async function cleanupDir(webR,dir){await webR.evalRVoid(`unlink(${rString(dir)}, recursive = TRUE, force = TRUE)`).catch(()=>void 0)}async function installPackage(webR,pkg,repos){const install=webR.installPackages.bind(webR);try{await install([pkg],{repos,quiet:true})}catch(error){try{await install([pkg])}catch{throw new Error(`Could not install the R package "${pkg}". Check that ${repos.join(" and ")} are reachable from GeoLibre. Original error: ${describeError(error)}`)}}}function describeError(error){if(error instanceof Error)return error.message;if(typeof error==="string")return error;try{return JSON.stringify(error)}catch{return String(error)}}function emptyPointSet(kind="click",label="None"){return{kind,label,features:[]}}function toFeatureCollection(features){return{type:"FeatureCollection",features}}function pointsToGeoJson(features,idPrefix){const withIds=features.map((feature,index)=>({...feature,properties:{...feature.properties??{},mcx_id:`${idPrefix}${index+1}`}}));return JSON.stringify(toFeatureCollection(withIds))}function isPoint(feature){const type=feature.geometry?.type;return type==="Point"||type==="MultiPoint"}function keepPoints(features){return features.filter(isPoint)}function keepLinesAndPolygons(features){return features.filter(f2=>{const type=f2.geometry?.type??"";return type.includes("Line")||type.includes("Polygon")})}function readSelection(app){try{return app.getSelectedFeatures?.()??[]}catch{return[]}}function readDrawings(app){try{return app.getDrawnFeatures?.()??[]}catch{return[]}}function readLayer(app,layerId){try{return app.getLayerFeatures?.(layerId)??[]}catch{return[]}}function listVectorLayers(app){try{return app.listLayers?.()??[]}catch{return[]}}function startPointPicking(app,onPoint){const map=app.getMap?.()??null;if(!map)return null;const handler=event=>{event.preventDefault?.();onPoint(event.lngLat.lng,event.lngLat.lat)};map.on("click",handler);let cursor="";try{const canvas=map.getCanvas();cursor=canvas.style.cursor;canvas.style.cursor="crosshair"}catch{}return{stop:()=>{map.off("click",handler);try{map.getCanvas().style.cursor=cursor}catch{}}}}function makePointFeature(lng,lat,id){return{type:"Feature",geometry:{type:"Point",coordinates:[lng,lat]},properties:{mcx_id:id}}}function keepPolygons(features){return features.filter(f2=>(f2.geometry?.type??"").includes("Polygon"))}function viewportPolygon(app){let bounds=null;try{bounds=app.getViewBounds?.()??null}catch{bounds=null}if(!bounds){try{const raw=app.getMap?.()?.getBounds?.();const arr=raw?.toArray?.();if(arr&&arr.length===2){bounds=[arr[0][0],arr[0][1],arr[1][0],arr[1][1]]}}catch{bounds=null}}if(!bounds||!bounds.every(v2=>Number.isFinite(v2)))return null;const[west,south,east,north]=bounds;return{bounds,feature:{type:"Feature",geometry:{type:"Polygon",coordinates:[[[west,south],[east,south],[east,north],[west,north],[west,south]]]},properties:{mcx_id:"view"}}}}function boundsOf(features){let west=Number.POSITIVE_INFINITY;let south=Number.POSITIVE_INFINITY;let east=Number.NEGATIVE_INFINITY;let north=Number.NEGATIVE_INFINITY;const visit=coords=>{if(!Array.isArray(coords))return;if(typeof coords[0]==="number"&&typeof coords[1]==="number"){const[x2,y2]=coords;if(x2<west)west=x2;if(x2>east)east=x2;if(y2<south)south=y2;if(y2>north)north=y2;return}for(const child of coords)visit(child)};for(const feature of features)visit(feature.geometry?.coordinates);if(!Number.isFinite(west)||!Number.isFinite(south))return null;return[west,south,east,north]}function unionBounds(a,b2){if(!a)return b2;if(!b2)return a;return[Math.min(a[0],b2[0]),Math.min(a[1],b2[1]),Math.max(a[2],b2[2]),Math.max(a[3],b2[3])]}const TILE_SIZE=256;const EARTH_RADIUS=6378137;const ORIGIN_SHIFT=Math.PI*EARTH_RADIUS;const TILE_URL="https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";const MAX_TILES=64;const CONCURRENCY=6;function lonToPixelX(lon,zoom){return(lon+180)/360*TILE_SIZE*2**zoom}function latToPixelY(lat,zoom){const clamped=Math.max(-85.05112878,Math.min(85.05112878,lat));const r13=clamped*Math.PI/180;return(1-Math.log(Math.tan(r13)+1/Math.cos(r13))/Math.PI)/2*TILE_SIZE*2**zoom}function mercatorResolution(zoom){return 2*ORIGIN_SHIFT/(TILE_SIZE*2**zoom)}function decodeTerrarium(r13,g2,b2){return r13*256+g2+b2/256-32768}async function fetchTile(z2,x2,y2){const url=TILE_URL.replace("{z}",String(z2)).replace("{x}",String(x2)).replace("{y}",String(y2));const response=await fetch(url,{mode:"cors",cache:"force-cache"});if(!response.ok)return null;const blob=await response.blob();return createImageBitmap(blob)}async function fetchTerrariumGrid(features,zoom,onProgress){const bbox=boundsOf(features);if(!bbox)throw new Error("The area has no coordinates.");const[west,south,east,north]=bbox;if(!(east>west&&north>south))throw new Error("The area is degenerate.");const px0=Math.floor(lonToPixelX(west,zoom));const px1=Math.ceil(lonToPixelX(east,zoom));const py0=Math.floor(latToPixelY(north,zoom));const py1=Math.ceil(latToPixelY(south,zoom));const tx0=Math.floor(px0/TILE_SIZE);const tx1=Math.floor((px1-1)/TILE_SIZE);const ty0=Math.floor(py0/TILE_SIZE);const ty1=Math.floor((py1-1)/TILE_SIZE);const tilesX=tx1-tx0+1;const tilesY=ty1-ty0+1;const total=tilesX*tilesY;if(total>MAX_TILES){throw new Error(`That area needs ${total} tiles at this detail level (the limit is ${MAX_TILES}). Choose a coarser level or a smaller area.`)}const width=px1-px0;const height=py1-py0;const data=new Float32Array(width*height).fill(NaN);const canvas=document.createElement("canvas");canvas.width=TILE_SIZE;canvas.height=TILE_SIZE;const ctx=canvas.getContext("2d",{willReadFrequently:true});if(!ctx)throw new Error("This browser refused a 2D canvas context.");const jobs=[];for(let ty=ty0;ty<=ty1;ty+=1){for(let tx=tx0;tx<=tx1;tx+=1)jobs.push({tx,ty})}let done=0;let next=0;const worker=async()=>{while(next<jobs.length){const job=jobs[next];next+=1;const bitmap=await fetchTile(zoom,job.tx,job.ty);if(bitmap){ctx.clearRect(0,0,TILE_SIZE,TILE_SIZE);ctx.drawImage(bitmap,0,0);bitmap.close();const pixels=ctx.getImageData(0,0,TILE_SIZE,TILE_SIZE).data;const originX=job.tx*TILE_SIZE-px0;const originY=job.ty*TILE_SIZE-py0;for(let row=0;row<TILE_SIZE;row+=1){const gy=originY+row;if(gy<0||gy>=height)continue;for(let col=0;col<TILE_SIZE;col+=1){const gx=originX+col;if(gx<0||gx>=width)continue;const o=(row*TILE_SIZE+col)*4;data[gy*width+gx]=decodeTerrarium(pixels[o],pixels[o+1],pixels[o+2])}}}done+=1;onProgress?.(done,total)}};await Promise.all(Array.from({length:Math.min(CONCURRENCY,jobs.length)},worker));const res=mercatorResolution(zoom);return{width,height,data,xmin:-ORIGIN_SHIFT+px0*res,xmax:-ORIGIN_SHIFT+px1*res,ymax:ORIGIN_SHIFT-py0*res,ymin:ORIGIN_SHIFT-py1*res,crs:"EPSG:3857",zoom,tiles:total}}function estimateGrid(features,zoom){const bbox=boundsOf(features);if(!bbox)return null;const[west,south,east,north]=bbox;if(!(east>west&&north>south))return null;const px0=Math.floor(lonToPixelX(west,zoom));const px1=Math.ceil(lonToPixelX(east,zoom));const py0=Math.floor(latToPixelY(north,zoom));const py1=Math.ceil(latToPixelY(south,zoom));const width=Math.max(1,px1-px0);const height=Math.max(1,py1-py0);const tilesX=Math.floor((px1-1)/TILE_SIZE)-Math.floor(px0/TILE_SIZE)+1;const tilesY=Math.floor((py1-1)/TILE_SIZE)-Math.floor(py0/TILE_SIZE)+1;const centreLat=(south+north)/2;return{zoom,width,height,cells:width*height,tiles:tilesX*tilesY,resolution:mercatorResolution(zoom)*Math.cos(centreLat*Math.PI/180)}}function zoomWithinBudget(features,requested,maxCells,floor=6){let estimate=null;for(let zoom=requested;zoom>=floor;zoom-=1){estimate=estimateGrid(features,zoom);if(!estimate)return null;if(estimate.cells<=maxCells&&estimate.tiles<=MAX_TILES)return estimate}return estimate}const COLOUR_RAMPS=[{id:"viridis",label:"Viridis",stops:[[68,1,84],[59,82,139],[33,145,140],[94,201,98],[253,231,37]]},{id:"inferno",label:"Inferno",stops:[[0,0,4],[87,16,110],[188,55,84],[249,142,9],[252,255,164]]},{id:"terrain",label:"Terrain",stops:[[0,97,71],[124,179,89],[232,220,150],[176,132,92],[255,255,255]]},{id:"greyscale",label:"Greyscale",stops:[[20,20,20],[245,245,245]]}];function getRamp(id){return COLOUR_RAMPS.find(r13=>r13.id===id)??COLOUR_RAMPS[0]}function decodeRaster(payload){const binary=atob(payload.data);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i+=1)bytes[i]=binary.charCodeAt(i);const values=new Float32Array(bytes.buffer,bytes.byteOffset,bytes.byteLength/4);let min=Number.POSITIVE_INFINITY;let max=Number.NEGATIVE_INFINITY;for(let i=0;i<values.length;i+=1){const v2=values[i];if(Number.isNaN(v2))continue;if(v2<min)min=v2;if(v2>max)max=v2}if(!Number.isFinite(min)||!Number.isFinite(max)){min=0;max=0}return{values,width:payload.width,height:payload.height,min,max,bounds:payload.bounds}}function sample(ramp,t){const stops=ramp.stops;if(t<=0)return stops[0];if(t>=1)return stops[stops.length-1];const scaled=t*(stops.length-1);const i=Math.floor(scaled);const f2=scaled-i;const a=stops[i];const b2=stops[i+1];return[Math.round(a[0]+(b2[0]-a[0])*f2),Math.round(a[1]+(b2[1]-a[1])*f2),Math.round(a[2]+(b2[2]-a[2])*f2)]}function renderRasterToCanvas(raster,options={}){const ramp=getRamp(options.ramp??"viridis");const alpha=Math.round(255*(options.opacity??1));const lo=options.min??raster.min;const hi=options.max??raster.max;const span=hi-lo||1;const canvas=document.createElement("canvas");canvas.width=raster.width;canvas.height=raster.height;const ctx=canvas.getContext("2d");if(!ctx)throw new Error("This browser refused a 2D canvas context.");const image=ctx.createImageData(raster.width,raster.height);const out=image.data;for(let i=0;i<raster.values.length;i+=1){const v2=raster.values[i];const o=i*4;if(Number.isNaN(v2)){out[o+3]=0;continue}let t=(v2-lo)/span;t=t<0?0:t>1?1:t;const[r13,g2,b2]=sample(ramp,options.reverse?1-t:t);out[o]=r13;out[o+1]=g2;out[o+2]=b2;out[o+3]=alpha}ctx.putImageData(image,0,0);return canvas}let overlaySeq=0;function addRasterOverlay(app,raster,options){const map=app.getMap?.()??null;if(!map)return null;const canvas=renderRasterToCanvas(raster,options);const url=canvas.toDataURL("image/png");const id=`movecost-raster-${overlaySeq+=1}`;const sourceId=`${id}-source`;const{west,south,east,north}=raster.bounds;const coordinates=[[west,north],[east,north],[east,south],[west,south]];let opacity=options.opacity??.75;let visible=true;let removed=false;let applying=false;const ensure=()=>{if(removed||applying)return;applying=true;try{if(!map.getSource(sourceId)){map.addSource(sourceId,{type:"image",url,coordinates})}if(!map.getLayer(id)){map.addLayer({id,type:"raster",source:sourceId,layout:{visibility:visible?"visible":"none"},paint:{"raster-opacity":opacity,"raster-fade-duration":0}})}else{const wantVisibility=visible?"visible":"none";if(map.getLayoutProperty?.(id,"visibility")!==wantVisibility){map.setLayoutProperty?.(id,"visibility",wantVisibility)}if(map.getPaintProperty?.(id,"raster-opacity")!==opacity){map.setPaintProperty?.(id,"raster-opacity",opacity)}}const order=map.getLayersOrder?.();if(order&&order[order.length-1]!==id)map.moveLayer?.(id)}catch{}finally{applying=false}};const watcher=()=>ensure();ensure();map.on("styledata",watcher);map.on("style.load",watcher);const stopWatching=()=>{map.off("styledata",watcher);map.off("style.load",watcher)};return{id,sourceId,layerId:id,bounds:[west,south,east,north],remove:()=>{removed=true;stopWatching();removeOverlay(map,id,sourceId)},release:()=>{removed=true;stopWatching()},setVisible:next=>{visible=next;ensure()},setOpacity:next=>{opacity=next;ensure()}}}function removeOverlay(map,layerId,sourceId){try{if(map.getLayer(layerId))map.removeLayer(layerId)}catch{}try{if(map.getSource(sourceId))map.removeSource(sourceId)}catch{}}function renderRasterThumbnail(raster,options={},maxWidth=160){const full=renderRasterToCanvas(raster,{...options,opacity:1});const scale=Math.min(1,maxWidth/full.width);const thumb=document.createElement("canvas");thumb.width=Math.max(1,Math.round(full.width*scale));thumb.height=Math.max(1,Math.round(full.height*scale));const ctx=thumb.getContext("2d");if(ctx){ctx.imageSmoothingEnabled=scale<1;ctx.drawImage(full,0,0,thumb.width,thumb.height)}return thumb}function renderLegend(ramp,reverse=false){const canvas=document.createElement("canvas");canvas.width=160;canvas.height=10;const ctx=canvas.getContext("2d");if(!ctx)return canvas;for(let x2=0;x2<canvas.width;x2+=1){const t=x2/(canvas.width-1);const[r13,g2,b2]=sample(ramp,reverse?1-t:t);ctx.fillStyle=`rgb(${r13},${g2},${b2})`;ctx.fillRect(x2,0,1,canvas.height)}return canvas}function hostOwnsLayers(app){return typeof app.registerExternalNativeLayer==="function"}let layerSeq=0;function uniqueLayerId(prefix){layerSeq+=1;return`movecost-${prefix}-${Date.now().toString(36)}-${layerSeq}`}function removeHostLayer(app,id){try{if(app.unregisterExternalNativeLayer)app.unregisterExternalNativeLayer(id);else app.removeLayer?.(id)}catch{}}function addHostVectorLayer(app,options){const id=options.id??uniqueLayerId("vector");const collection={type:"FeatureCollection",features:options.features};const bounds=boundsOf(options.features);if(!app.registerExternalNativeLayer){let hostId=null;try{hostId=app.addGeoJsonLayer(options.name,collection)}catch{return null}const fallbackId=hostId;return{id:fallbackId,name:options.name,bounds,remove:()=>removeHostLayer(app,fallbackId),setVisible:()=>{},setOpacity:()=>{}}}const registration={id,name:options.name,type:"geojson",nativeLayerIds:[],geojson:collection,style:options.style,groupId:options.groupId,metadata:{movecost:true}};app.registerExternalNativeLayer(registration);return{id,name:options.name,bounds,remove:()=>removeHostLayer(app,id),setVisible:visible=>{if(visible)app.registerExternalNativeLayer?.(registration);else removeHostLayer(app,id)},setOpacity:opacity=>{app.registerExternalNativeLayer?.({...registration,opacity})}}}function addHostRasterLayer(app,raster,options){const{west,south,east,north}=raster.bounds;const bounds=[west,south,east,north];const opacity=options.opacity??.75;if(!app.registerExternalNativeLayer){const overlay=addRasterOverlay(app,raster,options);if(!overlay)return null;return{id:overlay.id,name:options.name,bounds,remove:overlay.remove,release:overlay.release,setVisible:overlay.setVisible,setOpacity:overlay.setOpacity}}const canvas=renderRasterToCanvas(raster,{...options,opacity:1});const url=canvas.toDataURL("image/png");const id=options.id??uniqueLayerId("raster");const registration={id,name:options.name,type:"image",nativeLayerIds:[],source:{type:"image",url,coordinates:[[west,north],[east,north],[east,south],[west,south]]},opacity,groupId:options.groupId,metadata:{movecost:true,movecostRange:[raster.min,raster.max]}};app.registerExternalNativeLayer(registration);return{id,name:options.name,bounds,remove:()=>removeHostLayer(app,id),setVisible:visible=>{if(visible)app.registerExternalNativeLayer?.(registration);else removeHostLayer(app,id)},setOpacity:value=>{app.registerExternalNativeLayer?.({...registration,opacity:value})}}}function groupHostLayers(app,name,layerIds,existingGroupId,options={}){if(!layerIds.length)return existingGroupId;try{if(options.volatile&&typeof app.moveLayersToGroup!=="function")return null;if(existingGroupId){app.moveLayersToGroup?.(layerIds,existingGroupId);return existingGroupId}if(app.addLayerGroup)return app.addLayerGroup(name,layerIds)??null}catch{}return existingGroupId}function addRawMarkerLayer(map,id,features,colour){const sourceId=`${id}-source`;const data={type:"FeatureCollection",features};const source=map.getSource(sourceId);if(source?.setData){source.setData(data)}else{map.addSource(sourceId,{type:"geojson",data});map.addLayer({id,type:"circle",source:sourceId,paint:{"circle-radius":7,"circle-color":colour,"circle-stroke-color":"#ffffff","circle-stroke-width":2}})}return()=>{try{if(map.getLayer(id))map.removeLayer(id);if(map.getSource(sourceId))map.removeSource(sourceId)}catch{}}}const ORIGIN_STYLE={fillColor:"#16a34a",fillOpacity:1,strokeColor:"#ffffff",strokeWidth:2,circleRadius:8,markerEnabled:false,labels:{enabled:true,field:"mcx_id",size:13,color:"#14532d",haloColor:"#ffffff",haloWidth:2.5,anchor:"top",offsetY:.9,allowOverlap:true}};const DESTINATION_STYLE={fillColor:"#dc2626",fillOpacity:1,strokeColor:"#ffffff",strokeWidth:2,circleRadius:8,markerEnabled:true,markerShape:"triangle",markerColor:"#dc2626",markerSize:22,labels:{enabled:true,field:"mcx_id",size:13,color:"#7f1d1d",haloColor:"#ffffff",haloWidth:2.5,anchor:"top",offsetY:1.1,allowOverlap:true}};const RESULT_STYLES={lcps:{strokeColor:"#e11d48",strokeWidth:3,lineDecoration:"arrow",lineDecorationColor:"#e11d48"},lcpsBack:{strokeColor:"#f97316",strokeWidth:2,lineDecoration:"arrow",lineDecorationColor:"#f97316"},lcpAtoB:{strokeColor:"#e11d48",strokeWidth:3,lineDecoration:"arrow",lineDecorationColor:"#e11d48"},lcpBtoA:{strokeColor:"#f97316",strokeWidth:2,lineDecoration:"arrow",lineDecorationColor:"#f97316"},rankedPaths:{strokeColor:"#7c3aed",strokeWidth:2.5},network:{strokeColor:"#7c3aed",strokeWidth:2.5},nodes:{fillColor:"#7c3aed",fillOpacity:1,strokeColor:"#ffffff",strokeWidth:2,circleRadius:7},isolines:{strokeColor:"#1d4ed8",strokeWidth:1.5},boundaries:{fillColor:"#f59e0b",fillOpacity:.25,strokeColor:"#b45309",strokeWidth:1.5},destinations:{fillColor:"#dc2626",fillOpacity:1,strokeColor:"#ffffff",circleRadius:6},origins:{fillColor:"#16a34a",fillOpacity:1,strokeColor:"#ffffff",circleRadius:6}};const KIND_STYLES={line:{strokeColor:"#e11d48",strokeWidth:2.5},polygon:{fillColor:"#f59e0b",fillOpacity:.25,strokeColor:"#b45309",strokeWidth:1.5},point:{fillColor:"#0f766e",fillOpacity:1,strokeColor:"#ffffff",circleRadius:6}};function resultStyle(key,kind){return RESULT_STYLES[key]??KIND_STYLES[kind]??{}}const PLUGIN_VERSION="0.2.4";const ANALYSES=[{id:"paths",label:"Least-cost paths",description:"Accumulated cost surface around the origin, plus the least-cost path to each destination and the isolines of equal cost.",rFunction:"mc_surface() + mc_paths() + mc_accum()",origin:{label:"Origin",min:1,max:1},destination:{label:"Destinations",min:1},supportsBarrier:true,extras:[{kind:"number",key:"breaks",label:"Isoline interval",min:0,step:.05,hint:"In the cost unit of the chosen function. Leave at 0 to let movecost use a tenth of the range."},{kind:"boolean",key:"returnBase",label:"Also compute the return paths",hint:"Slope-dependent cost is asymmetric, so the way back is rarely the same line."}],layers:{lcps:{label:"Least-cost paths",kind:"line"},lcpsBack:{label:"Return paths",kind:"line"},isolines:{label:"Cost isolines",kind:"line"},destinations:{label:"Destinations with cost",kind:"point"},accumulated:{label:"Accumulated cost",kind:"raster"},costSurface:{label:"Cost surface",kind:"raster"}}},{id:"corridor",label:"Least-cost corridor",description:"The band of terrain whose combined cost from both locations stays low — where movement plausibly happened, rather than one idealised line.",rFunction:"mc_surface() + mc_corridor()",origin:{label:"Location A",min:1,max:1},destination:{label:"Location B",min:1,max:1},supportsBarrier:true,extras:[{kind:"select",key:"corridorMethod",label:"Formulation",options:[{value:"reach",label:"Reach — symmetric, both directions summed"},{value:"through",label:"Through — the A → B near-optimal band"}],hint:'"Reach" is the classic corridor; "through" keeps only routes that actually go from A to B.'},{kind:"boolean",key:"rescale",label:"Rescale the corridor to 0–1",hint:"Makes corridors from different runs comparable."}],layers:{lcpAtoB:{label:"Path A → B",kind:"line"},lcpBtoA:{label:"Path B → A",kind:"line"},corridor:{label:"Least-cost corridor",kind:"raster"}}},{id:"network",label:"Least-cost network",description:"Paths between a set of locations — all pairs, or only neighbours — with the cost matrix between them.",rFunction:"mc_surface() + mc_network()",origin:{label:"Locations",min:2},destination:null,supportsBarrier:true,extras:[{kind:"select",key:"netwType",label:"Network type",options:[{value:"allpairs",label:"All pairs of locations"},{value:"neigh",label:"Neighbouring locations only"}]},{kind:"boolean",key:"lcpDensity",label:"Compute path density",hint:"Counts how many paths cross each cell — slower, but shows the corridors the network converges on."}],layers:{network:{label:"Network paths",kind:"line"},nodes:{label:"Locations (numbered)",kind:"point"},density:{label:"Path density (%)",kind:"raster"}}},{id:"allocation",label:"Cost allocation",description:"Assigns every cell to its cheapest origin — the cost-distance equivalent of Thiessen polygons, and a common first pass at territories.",rFunction:"mc_surface() + mc_alloc()",origin:{label:"Origins",min:2},destination:null,supportsBarrier:true,extras:[{kind:"boolean",key:"isolines",label:"Also draw cost isolines"},{kind:"number",key:"breaks",label:"Isoline interval",min:0,step:.05,hint:"Only used when isolines are enabled. Leave at 0 for a tenth of the range."}],layers:{boundaries:{label:"Allocation zones",kind:"polygon"},isolines:{label:"Cost isolines",kind:"line"},allocation:{label:"Cost allocation",kind:"raster"}}},{id:"boundary",label:"Cost boundaries (isochrones)",description:"The area reachable from each origin within a given cost — an hour's walk, say — returned as a polygon with its area and perimeter.",rFunction:"mc_surface() + mc_boundary()",origin:{label:"Origins",min:1},destination:null,supportsBarrier:true,extras:[{kind:"numberList",key:"contValue",label:"Cost limits",hint:"Required. Comma-separated, in the cost unit of the chosen function (e.g. 1, 2 for one- and two-hour walks)."}],layers:{boundaries:{label:"Cost boundaries",kind:"polygon"},accumulated:{label:"Accumulated cost",kind:"raster"}}},{id:"rank",label:"Ranked alternative paths",description:"Several plausible routes between two points, ranked from optimal to sub-optimal — useful when the single best path is an artefact of the DTM.",rFunction:"mc_surface() + mc_rank()",origin:{label:"Origin",min:1,max:1},destination:{label:"Destination",min:1,max:1},supportsBarrier:true,extras:[{kind:"number",key:"lcpN",label:"Number of paths",min:2,max:8,step:1,defaultValue:3,hint:"The optimal path plus its alternatives."},{kind:"number",key:"penalty",label:"Detour penalty",min:0,max:1,step:.01,defaultValue:.01,hint:"How strongly each alternative is pushed away from the paths already found. Lower means further apart."}],layers:{rankedPaths:{label:"Ranked paths",kind:"line"},corridor:{label:"Least-cost corridor",kind:"raster"}}}];function getAnalysis(id){return ANALYSES.find(a=>a.id===id)??ANALYSES[0]}function el(tag,attrs={},...children){const node=document.createElement(tag);for(const[key,value]of Object.entries(attrs)){if(value===void 0||value===null||value===false)continue;if(key==="class")node.className=String(value);else if(key==="text")node.textContent=String(value);else if(key.startsWith("data-")||key==="role"||key==="aria-label"){node.setAttribute(key,String(value))}else if(key in node){node[key]=value}else{node.setAttribute(key,String(value))}}for(const child of children){if(child===null||child===void 0||child===false)continue;node.append(typeof child==="string"?document.createTextNode(child):child)}return node}function clear(node){while(node.firstChild)node.removeChild(node.firstChild)}function field(label,control2,options={}){const wrapper=el("label",{class:options.inline?"mcx-field mcx-field--inline":"mcx-field"},el("span",{class:"mcx-field__label",text:label}),control2,options.hint?el("span",{class:"mcx-field__hint",text:options.hint}):null);return wrapper}function select(options,value,onChange){const node=el("select",{class:"mcx-select"});const groups=new Map;for(const option of options){const optionNode=el("option",{value:option.value,text:option.label});if(option.group){let group=groups.get(option.group);if(!group){group=el("optgroup",{label:option.group});groups.set(option.group,group);node.append(group)}group.append(optionNode)}else{node.append(optionNode)}}node.value=value;node.addEventListener("change",()=>onChange(node.value));return node}function numberInput(value,onChange,attrs={}){const node=el("input",{class:"mcx-input",type:"number",value:String(value),...attrs});node.addEventListener("change",()=>{const parsed=Number(node.value);if(Number.isFinite(parsed))onChange(parsed);else node.value=String(value)});return node}function textInput(value,onChange,placeholder){const node=el("input",{class:"mcx-input",type:"text",value,placeholder});node.addEventListener("change",()=>onChange(node.value));return node}function checkbox(label,checked,onChange,hint){const input=el("input",{class:"mcx-checkbox",type:"checkbox",checked});input.addEventListener("change",()=>onChange(input.checked));return el("label",{class:"mcx-check"},input,el("span",{text:label}),hint?el("span",{class:"mcx-field__hint",text:hint}):null)}function button(label,onClick,variant="secondary"){const node=el("button",{class:`mcx-button mcx-button--${variant}`,type:"button",text:label});node.addEventListener("click",onClick);return node}function note(text,tone="info"){return el("p",{class:`mcx-note mcx-note--${tone}`,text})}function formatBytes(bytes){if(bytes<1024)return`${bytes} B`;if(bytes<1024*1024)return`${(bytes/1024).toFixed(1)} kB`;return`${(bytes/(1024*1024)).toFixed(1)} MB`}const DEM_ZOOMS=[{value:"9",label:"9 — about 300 m/cell (regional)"},{value:"10",label:"10 — about 150 m/cell"},{value:"11",label:"11 — about 75 m/cell"},{value:"12",label:"12 — about 38 m/cell (default)"},{value:"13",label:"13 — about 19 m/cell"},{value:"14",label:"14 — about 10 m/cell (slow over a large area)"}];const ORIGIN_LAYER_ID="movecost-origin";const DESTINATION_LAYER_ID="movecost-destination";const TERRAIN_LAYER_ID="movecost-terrain";const TERRAIN_GROUP_NAME="movecost · terrain";const LOCATIONS_GROUP_NAME="movecost · locations";const DEFAULT_PARAMS={funct:"t",time:"h",move:16,field:0,cognSlope:false,topoDist:false,slCrit:10,W:70,L:0,N:1,V:1.2,autoReproject:true,netwType:"allpairs",lcpN:3};function withMemoryHint(message,where){if(!/cannot allocate|memory exhausted|out of memory|not enough memory|Cannot enlarge memory/i.test(message)){return message}return`${message} — ${where} ran out of memory. Use a coarser detail level or a smaller area (fewer DEM cells), or 8 movement directions instead of 16.`}function formatValue(value){if(!Number.isFinite(value))return"—";const abs=Math.abs(value);return abs>=100?value.toFixed(0):abs>=10?value.toFixed(1):value.toFixed(2)}class MovecostPanel{constructor(app){this.app=app;if(isMobileDevice())this.params.move=8;void this.resolveBackend()}container=null;backend=null;backendProbe=null;backendNote=null;disposeProgress=null;dtm=null;analysis="paths";params={...DEFAULT_PARAMS};extras={};terrainMode="download";area=null;demZoom=12;downloadingDem=false;useArea=false;terrainOverlay=null;terrainPreview=null;terrainVisible=true;origin=emptyPointSet();destination=emptyPointSet();barrier=emptyPointSet();picking=null;stopPicking=null;markers={origin:null,destination:null};rawMarkerCleanup={origin:null,destination:null};terrainGroupId=null;locationsGroupId=null;runCount=0;rampId="viridis";rasterOpacity=.75;busy=false;progress=null;message=null;lastRun=null;produced=[];cellBudget(){const inBrowser=!this.backend||this.backend.id==="webr";if(!inBrowser)return{cells:4e6,where:"the local R service"};return isMobileDevice()?{cells:15e4,where:"R inside the browser on a tablet"}:{cells:4e5,where:"R inside the browser"}}plannedGrid(){if(!this.area)return null;const budget=this.cellBudget();const requested=Math.min(15,this.demZoom);const wanted=estimateGrid(this.area.features,requested);const fits=zoomWithinBudget(this.area.features,requested,budget.cells);if(!wanted||!fits)return null;return{budget,wanted,fits,reduced:fits.zoom<requested,overBudget:fits.cells>budget.cells}}pluginRepos(){const repo=this.pluginAsset("wasm-repo");return repo?[repo.replace(/\/$/,"")]:[]}pluginAsset(relativePath){try{return this.app.resolvePluginAssetUrl?.("movecost",relativePath)??null}catch{return null}}resolveBackend(force=false){if(force){this.disposeProgress?.();this.disposeProgress=null;void this.backend?.close();this.backend=null;this.backendProbe=null;if(this.dtm?.handle){this.dtm=null;this.clearTerrainOverlay()}}if(this.backend)return Promise.resolve(this.backend);if(this.backendProbe)return this.backendProbe;this.backendProbe=(async()=>{const health=await probeBackend(DEFAULT_BACKEND_URL);const backend=health?new HttpBackend(DEFAULT_BACKEND_URL,health.versions??null):new MovecostEngine(void 0,this.pluginRepos());this.backendNote=health?null:isMobileDevice()?`R runs in the page on this device. The first run downloads about 65 MB and takes a few minutes; after that, a small study area answers in seconds. Keep the area modest.`:`No local R service on ${DEFAULT_BACKEND_URL}, so R runs in the page. That works, but it is roughly a hundred times slower. The first run fetches about 65 MB. For real work, start the R service (r-backend/README.md) and press Recheck.`;this.disposeProgress=backend.onProgress(event=>{this.progress=event.phase==="done"||event.phase==="error"?null:event;this.renderStatus()});this.backend=backend;this.render();return backend})();return this.backendProbe}mount(container){this.container=container;container.classList.add("mcx-panel");this.render();this.watchLayers();return()=>this.unmount()}unmount(){this.cancelPicking();this.container=null;if(this.layerWatch!==null){clearInterval(this.layerWatch);this.layerWatch=null}}layerWatch=null;layerSignature="";watchLayers(){if(this.layerWatch!==null||!this.app.listLayers)return;this.layerSignature=this.layersSignature();this.layerWatch=setInterval(()=>{if(!this.container||this.busy)return;const signature=this.layersSignature();if(signature!==this.layerSignature){this.layerSignature=signature;this.render()}},1500)}layersSignature(){return listVectorLayers(this.app).map(layer=>`${layer.id}:${layer.name??""}`).join("|")}dispose(){this.cancelPicking();this.clearMarkers();this.terrainOverlay?.release?.();this.terrainOverlay=null;this.terrainPreview=null;this.disposeProgress?.();void this.backend?.close()}render(){const root=this.container;if(!root)return;clear(root);root.append(this.renderIntro(),this.renderDtmSection(),this.renderAnalysisSection(),this.renderLocationsSection(),this.renderCostSection(),this.renderDisplaySection(),this.renderRunSection(),this.renderResultsSection())}statusHost=null;terrainStatusHost=null;previewingTerrain=false;setProgress(message,fraction=null){this.progress={phase:"running",message,fraction};this.renderStatus()}renderStatus(){if(this.statusHost)clear(this.statusHost);if(this.terrainStatusHost)clear(this.terrainStatusHost);const terrainBusy=this.downloadingDem||this.previewingTerrain;const progressHost=terrainBusy&&this.terrainStatusHost?this.terrainStatusHost:this.statusHost;if(!progressHost)return;if(this.progress){const bar=el("div",{class:"mcx-progress"});const fill=el("div",{class:"mcx-progress__fill"});if(this.progress.fraction===null){fill.classList.add("mcx-progress__fill--indeterminate")}else{fill.style.width=`${Math.round(this.progress.fraction*100)}%`}bar.append(fill);progressHost.append(el("p",{class:"mcx-status",text:this.progress.message}),bar)}if(this.message&&this.statusHost){this.statusHost.append(note(this.message.text,this.message.tone))}}renderIntro(){const backend=this.backend;const versions=backend?.versions??null;return el("section",{class:"mcx-section mcx-section--intro"},el("p",{class:"mcx-intro",text:`Slope-dependent cost analysis with the movecost R package. Plugin ${PLUGIN_VERSION}.`}),el("div",{class:"mcx-actions"},el("span",{class:"mcx-versions",text:backend?`Backend: ${backend.label}`:"Looking for a backend…"}),button("Recheck",()=>void this.resolveBackend(true),"ghost")),versions?el("p",{class:"mcx-versions",text:[versions.r&&`R ${versions.r}`,versions.terra&&`terra ${versions.terra}`,versions.sf&&`sf ${versions.sf}`].filter(Boolean).join(" · ")}):null,this.backendNote?note(this.backendNote,"warn"):null)}renderDtmSection(){const children=[el("h3",{class:"mcx-section__title",text:"1 · Terrain"}),field("Where the DTM comes from",select([{value:"download",label:"Draw an area and download a DEM"},{value:"upload",label:"Load a GeoTIFF from disk"}],this.terrainMode,value=>{this.terrainMode=value;this.render()}))];children.push(...this.terrainMode==="download"?this.renderDemDownload():this.renderDtmUpload());if(this.dtm){const s=this.dtm.summary;children.push(el("p",{class:"mcx-file-summary",text:s?`${this.dtm.name} — ${s.width} × ${s.height} cells at ${s.resolution.toFixed(1)} m, ${Math.round(s.elevation.min??0)}–${Math.round(s.elevation.max??0)} m, ${s.crs}`:this.dtm.handle?`${this.dtm.name} — held in the R session`:`${this.dtm.name} — ${formatBytes(this.dtm.bytes.byteLength)}`}))}const toggle=this.renderTerrainToggle();if(toggle)children.push(toggle);children.push(checkbox("Reproject a geographic DTM automatically",this.params.autoReproject!==false,checked=>{this.params.autoReproject=checked}));return el("section",{class:"mcx-section"},...children)}renderDemDownload(){const viaService=typeof this.backend?.fetchDem==="function";const viaTiles=typeof this.backend?.dtmFromGrid==="function";const children=[];if(this.backend&&!viaService&&!viaTiles){children.push(note('This backend cannot fetch elevation. Switch to "Load a GeoTIFF from disk" above.',"warn"));return children}const actions=el("div",{class:"mcx-actions"});if(this.app.getDrawnFeatures){actions.append(button("Use drawn polygon",()=>{const polygons=keepPolygons(readDrawings(this.app));if(!polygons.length){this.message={text:"No polygon found. Draw one with GeoLibre's draw tools, then press this again.",tone:"warn"}}else{this.area={features:polygons.slice(0,1),label:"drawn polygon"};this.message=null}this.render()},"primary"))}if(this.app.getViewBounds||this.app.getMap?.()){actions.append(button("Use current view",()=>{const view=viewportPolygon(this.app);if(!view){this.message={text:"This build does not report the map's view bounds.",tone:"warn"}}else{this.area={features:[view.feature],label:"current map view"};this.message=null}this.render()}))}if(this.area){actions.append(button("Clear area",()=>{this.area=null;this.render()},"ghost"))}children.push(actions);const layers=this.candidateLayers();if(layers.length&&this.app.getLayerFeatures){const options=[{value:"",label:"From an existing polygon layer…"}].concat(layers.map(layer=>({value:layer.id,label:layer.name??layer.id})));children.push(select(options,"",layerId=>{if(!layerId)return;const layer=layers.find(l2=>l2.id===layerId);const polygons=keepPolygons(readLayer(this.app,layerId));if(!polygons.length){this.message={text:"That layer has no polygon features.",tone:"warn"}}else{this.area={features:polygons,label:`layer "${layer?.name??layerId}"`};this.message=null}this.render()}))}children.push(el("p",{class:this.area?"mcx-summary":"mcx-summary mcx-summary--empty",text:this.area?`Area taken from the ${this.area.label}.`:"Draw a polygon over the study area, or use the current map view."}),field("Detail",select(DEM_ZOOMS,String(this.demZoom),value=>{this.demZoom=Number(value);this.render()}),{hint:"Elevation comes from the AWS terrain tiles. Finer detail means a much slower analysis."}));const plan=viaTiles&&!viaService?this.plannedGrid():null;if(plan){const{budget,wanted,fits}=plan;const cellsText=g2=>`${g2.width} × ${g2.height} cells (${g2.cells.toLocaleString()}) at about ${Math.round(g2.resolution)} m`;if(plan.overBudget){children.push(note(`Even the coarsest level gives ${cellsText(fits)}, above the ${budget.cells.toLocaleString()}-cell limit for ${budget.where}. Draw a smaller area.`,"error"))}else if(plan.reduced){children.push(note(`${cellsText(wanted)} would not fit ${budget.where} (limit ${budget.cells.toLocaleString()} cells). The download will use level ${fits.zoom} instead: ${cellsText(fits)}. Draw a smaller area for finer detail.`,"warn"))}else{children.push(el("p",{class:"mcx-summary",text:`Expected DEM: ${cellsText(wanted)}.`}))}}else if(viaService&&this.area){const wanted=estimateGrid(this.area.features,this.demZoom);if(wanted&&wanted.cells>2e6){children.push(note(`About ${wanted.cells.toLocaleString()} cells at this level — the analysis will take minutes. A coarser level or a smaller area keeps it interactive.`,"warn"))}}const download=button(this.downloadingDem?"Downloading…":"Download DEM",()=>void this.downloadDem(),"primary");download.disabled=this.downloadingDem||!this.area;const direct=viaService?button(this.useArea?"Downloading per run ✓":"Use area directly",()=>{this.useArea=!this.useArea;if(this.useArea){this.dtm=null;this.clearTerrainOverlay()}this.render()},this.useArea?"primary":"secondary"):null;if(direct){direct.disabled=!this.area;direct.title="Hand the area to movecost as its studyplot. It downloads elevation inside every run, so this is quicker for one analysis and slower for several."}children.push(el("div",{class:"mcx-actions"},download,direct));const terrainStatus=el("div",{class:"mcx-status-host"});this.terrainStatusHost=terrainStatus;children.push(terrainStatus);if(!viaService&&viaTiles){children.push(el("p",{class:"mcx-description",text:"Elevation is fetched tile by tile from the AWS terrain dataset and projected in the page."}))}if(this.useArea){children.push(note("movecost will download elevation on every run. Good for a single analysis; download the DEM once if you plan to compare cost functions.","info"))}return children}renderTerrainToggle(){if(!this.terrainOverlay)return null;const preview=this.terrainPreview;return el("div",{class:"mcx-actions"},button(this.terrainVisible?"Hide terrain":"Show terrain",()=>{this.terrainVisible=!this.terrainVisible;this.terrainOverlay?.setVisible(this.terrainVisible);if(this.terrainVisible)this.groupTerrain();this.render()},"ghost"),preview?el("span",{class:"mcx-versions",text:`${Math.round(preview.elevation.min??0)}–${Math.round(preview.elevation.max??0)} m`}):null)}renderDtmUpload(){const input=el("input",{class:"mcx-file",type:"file",accept:".tif,.tiff,.TIF,.TIFF"});input.addEventListener("change",()=>{const file=input.files?.[0];if(file)void this.loadDtm(file)});return[field("Digital terrain model (GeoTIFF)",input,{hint:"A projected DTM in metres works best. A geographic DTM is reprojected to its own UTM zone automatically."})]}async downloadDem(){if(!this.area)return;const backend=await this.resolveBackend();const viaService=typeof backend.fetchDem==="function";const viaTiles=typeof backend.dtmFromGrid==="function";if(!viaService&&!viaTiles){this.message={text:"This backend cannot fetch elevation.",tone:"warn"};this.render();return}this.downloadingDem=true;this.message=null;this.render();try{const areaGeoJson=JSON.stringify(toFeatureCollection(this.area.features));let result;if(viaService){result=await backend.fetchDem(areaGeoJson,this.demZoom)}else{const plan=this.plannedGrid();if(plan?.overBudget){throw new Error(`The area is too large for ${plan.budget.where}: even at the coarsest level it needs ${plan.fits.cells.toLocaleString()} cells (limit ${plan.budget.cells.toLocaleString()}). Draw a smaller area.`)}const tileZoom=plan?.fits.zoom??Math.min(15,this.demZoom);const reducedTo=plan?.reduced?tileZoom:null;this.setProgress(`Fetching elevation tiles at detail level ${tileZoom}…`,0);const grid=await fetchTerrariumGrid(this.area.features,tileZoom,(done,total)=>{this.setProgress(`Fetching elevation tiles… ${done}/${total}`,total?done/total:null)});result=await backend.dtmFromGrid(grid,areaGeoJson,{maxCells:this.cellBudget().cells});result.summary.zoom=reducedTo??this.demZoom;if(reducedTo!==null){this.message={text:`Detail reduced to level ${reducedTo} (about ${Math.round(result.summary.resolution)} m) so the ${result.summary.width} × ${result.summary.height} DEM fits ${this.cellBudget().where}. Draw a smaller area for finer detail.`,tone:"info"}}}const{bytes,summary,handle}=result;this.dtm={name:`DEM (zoom ${summary.zoom})`,bytes,handle,summary};this.useArea=false;const cells=summary.width*summary.height;if(cells>this.cellBudget().cells){this.message={text:`That is ${cells.toLocaleString()} cells. Cost-distance work grows with the cell count — consider a coarser detail level or a smaller area if the analysis drags or runs out of memory.`,tone:"warn"}}else if(!this.message){this.message=null}const b2=summary.bounds;this.app.fitBounds?.([b2.west,b2.south,b2.east,b2.north]);this.downloadingDem=false;await this.showTerrain();return}catch(error){this.message={text:`DEM download failed: ${describeError(error)}`,tone:"error"}}finally{this.downloadingDem=false;this.progress=null;this.render()}}renderAnalysisSection(){const spec=getAnalysis(this.analysis);return el("section",{class:"mcx-section"},el("h3",{class:"mcx-section__title",text:"2 · Analysis"}),field("Analysis",select(ANALYSES.map(a=>({value:a.id,label:a.label})),this.analysis,value=>{this.analysis=value;this.extras={};const next=getAnalysis(this.analysis);if(next.origin.max&&this.origin.features.length>next.origin.max){this.origin={...this.origin,features:this.origin.features.slice(0,next.origin.max)}}if(!next.destination){this.destination=emptyPointSet()}else if(next.destination.max&&this.destination.features.length>next.destination.max){this.destination={...this.destination,features:this.destination.features.slice(0,next.destination.max)}}this.refreshMarkers("origin");this.refreshMarkers("destination");this.render()})),el("p",{class:"mcx-description",text:spec.description}),el("p",{class:"mcx-rfunc",text:`movecost function: ${spec.rFunction}`}))}renderLocationsSection(){const spec=getAnalysis(this.analysis);const children=[el("h3",{class:"mcx-section__title",text:"3 · Locations"}),this.renderPointPicker("origin",spec.origin.label,spec.origin.min,spec.origin.max)];if(spec.destination){children.push(this.renderPointPicker("destination",spec.destination.label,spec.destination.min,spec.destination.max))}if(spec.supportsBarrier){children.push(this.renderBarrierPicker())}return el("section",{class:"mcx-section"},...children)}renderPointPicker(which,label,min,max){const set=which==="origin"?this.origin:this.destination;const canPick=Boolean(this.app.getMap?.());const layers=this.candidateLayers();const actions=el("div",{class:"mcx-actions"});if(canPick){const active=this.picking===which;actions.append(button(active?"Stop placing":"Click on the map",()=>active?this.cancelPicking():this.startPicking(which),active?"danger":"primary"))}if(this.app.getSelectedFeatures){actions.append(button("Use selection",()=>{const points=keepPoints(readSelection(this.app));this.setPoints(which,{kind:"selection",label:"map selection",features:points},min,max)}))}if(this.app.getDrawnFeatures){actions.append(button("Use drawings",()=>{const points=keepPoints(readDrawings(this.app));this.setPoints(which,{kind:"drawings",label:"drawn features",features:points},min,max)}))}if(set.features.length){actions.append(button("Clear",()=>this.setPoints(which,emptyPointSet(),min,max),"ghost"))}const summary=set.features.length?`${set.features.length} point${set.features.length===1?"":"s"} from ${set.label}`:`No ${label.toLowerCase()} yet — need ${min}${max&&max!==min?` to ${max}`:max===min?"":" or more"}.`;const children=[el("h4",{class:"mcx-subtitle",text:label}),actions,el("p",{class:set.features.length?"mcx-summary":"mcx-summary mcx-summary--empty",text:summary})];if(layers.length&&this.app.getLayerFeatures){const options=[{value:"",label:"From an existing layer…"}].concat(layers.map(layer=>({value:layer.id,label:layer.name??layer.id})));children.push(select(options,"",layerId=>{if(!layerId)return;const layer=layers.find(l2=>l2.id===layerId);const points=keepPoints(readLayer(this.app,layerId));this.setPoints(which,{kind:"layer",label:layer?.name??layerId,features:points},min,max)}))}return el("div",{class:"mcx-picker"},...children)}drawingsAsBarriers(){const key=f2=>String(f2.id??f2.properties?.__gm_id??JSON.stringify(f2.geometry));const used=new Set((this.area?.features??[]).map(key));return keepLinesAndPolygons(readDrawings(this.app)).filter(f2=>!used.has(key(f2)))}renderBarrierPicker(){const layers=this.candidateLayers();const children=[el("h4",{class:"mcx-subtitle",text:"Barriers (optional)"}),el("p",{class:"mcx-description",text:"Lines or polygons that movement cannot cross — a river, a cliff line, a wall."})];const actions=el("div",{class:"mcx-actions"});if(this.app.getDrawnFeatures){actions.append(button("Use drawings",()=>{const features=this.drawingsAsBarriers();this.barrier={kind:"drawings",label:"drawn features",features};this.render()}))}if(this.barrier.features.length){actions.append(button("Clear",()=>{this.barrier=emptyPointSet();this.render()},"ghost"))}children.push(actions);if(layers.length&&this.app.getLayerFeatures){const options=[{value:"",label:"From an existing layer…"}].concat(layers.map(layer=>({value:layer.id,label:layer.name??layer.id})));children.push(select(options,"",layerId=>{if(!layerId)return;const layer=layers.find(l2=>l2.id===layerId);this.barrier={kind:"layer",label:layer?.name??layerId,features:keepLinesAndPolygons(readLayer(this.app,layerId))};this.render()}))}if(this.barrier.features.length){children.push(el("p",{class:"mcx-summary",text:`${this.barrier.features.length} barrier feature(s) from ${this.barrier.label}`}),field("Conductance across barriers",numberInput(this.params.field??0,value=>{this.params.field=value},{step:.1}),{hint:"0 makes barriers impassable; a small positive value makes them merely expensive."}))}return el("div",{class:"mcx-picker"},...children)}renderCostSection(){const fn=getCostFunction(this.params.funct);const children=[el("h3",{class:"mcx-section__title",text:"4 · Cost function"}),field("Function",select(COST_FUNCTIONS.map(f2=>({value:f2.id,label:f2.label,group:f2.group})),this.params.funct,value=>{this.params.funct=value;this.render()})),el("p",{class:"mcx-description",text:`Cost is expressed in ${costUnitLabel(this.params.funct,this.params.time??"h")}.`})];if(isTimeFunction(this.params.funct)){children.push(field("Time unit",select([{value:"h",label:"Hours"},{value:"m",label:"Minutes"}],this.params.time??"h",value=>{this.params.time=value;this.render()}),{inline:true}))}if(fn.uses.includes("W")){children.push(field("Body weight (kg)",numberInput(this.params.W??70,v2=>this.params.W=v2,{min:20,max:250,step:1}),{inline:true}))}if(fn.uses.includes("L")){children.push(field("Carried load (kg)",numberInput(this.params.L??0,v2=>this.params.L=v2,{min:0,max:150,step:1}),{inline:true}))}if(fn.uses.includes("N")){children.push(field("Terrain coefficient",numberInput(this.params.N??1,v2=>this.params.N=v2,{min:.5,max:5,step:.05}),{inline:true,hint:"1 for a paved road, higher for sand, scree or dense undergrowth."}))}if(fn.uses.includes("V")){children.push(field("Speed (m/s)",numberInput(this.params.V??1.2,v2=>this.params.V=v2,{min:0,max:4,step:.1}),{inline:true,hint:"0 derives the speed from Tobler's function instead."}))}if(fn.uses.includes("slCrit")){children.push(field("Critical slope (%)",numberInput(this.params.slCrit??10,v2=>this.params.slCrit=v2,{min:1,max:30,step:1}),{inline:true,hint:"Typically 8–16 for wheeled vehicles."}))}children.push(field("Movement directions",select([{value:"4",label:"4 — rook"},{value:"8",label:"8 — queen"},{value:"16",label:"16 — knight and queen"}],String(this.params.move??16),value=>{this.params.move=Number(value)}),{hint:"More directions give straighter paths but cost roughly twice the time at 16."}),checkbox("Cognitive slope",this.params.cognSlope===true,checked=>this.params.cognSlope=checked,"Uses perceived rather than measured slope (Pingel 2013)."),checkbox("Terrain-based distance",this.params.topoDist===true,checked=>this.params.topoDist=checked,"Measures path length along the surface instead of in plan."));const spec=getAnalysis(this.analysis);for(const extra of spec.extras){children.push(this.renderExtra(extra))}return el("section",{class:"mcx-section"},...children)}renderExtra(extra){switch(extra.kind){case"boolean":return checkbox(extra.label,Boolean(this.extras[extra.key]),checked=>{this.extras[extra.key]=checked;this.render()},extra.hint);case"number":return field(extra.label,numberInput(Number(this.extras[extra.key]??extra.defaultValue??0),value=>{this.extras[extra.key]=value},{min:extra.min,max:extra.max,step:extra.step}),{inline:true,hint:extra.hint});case"select":return field(extra.label,select(extra.options,String(this.extras[extra.key]??extra.options[0].value),value=>{this.extras[extra.key]=value}),{hint:extra.hint});case"numberList":default:return field(extra.label,textInput(String(this.extras[extra.key]??""),value=>{this.extras[extra.key]=value},"e.g. 1, 2, 3"),{hint:extra.hint})}}renderDisplaySection(){const ramp=getRamp(this.rampId);return el("section",{class:"mcx-section"},el("h3",{class:"mcx-section__title",text:"5 · Raster display"}),field("Colour ramp",select(COLOUR_RAMPS.map(r13=>({value:r13.id,label:r13.label})),this.rampId,value=>{this.rampId=value;this.render()}),{inline:true}),el("div",{class:"mcx-legend"},renderLegend(ramp)),field("Opacity",(()=>{const slider=el("input",{class:"mcx-range",type:"range",min:0,max:1,step:.05,value:String(this.rasterOpacity)});slider.addEventListener("input",()=>{this.rasterOpacity=Number(slider.value)});slider.addEventListener("change",()=>{for(const layer of this.produced){if(layer.kind==="raster")layer.handle?.setOpacity(this.rasterOpacity)}});return slider})(),{inline:true}))}renderRunSection(){const status=el("div",{class:"mcx-status-host"});this.statusHost=status;const run=button(this.busy?"Running…":"Run analysis",()=>void this.run(),"primary");run.disabled=this.busy||!this.hasTerrain();const section=el("section",{class:"mcx-section mcx-section--run"},el("div",{class:"mcx-actions"},run),status);this.renderStatus();return section}renderResultsSection(){const children=[el("h3",{class:"mcx-section__title",text:"Results"})];const last=this.lastRun;if(!last){children.push(note("Nothing yet. Results appear here and on the map.","info"));return el("section",{class:"mcx-section"},...children)}if(!last.response.ok){children.push(note(last.response.error,"error"));return el("section",{class:"mcx-section"},...children)}const{response}=last;children.push(el("p",{class:"mcx-summary",text:`${getAnalysis(response.analysis).label} — ${response.elapsedSeconds.toFixed(1)} s in ${response.crs}`}));if(this.produced.length){const list=el("ul",{class:"mcx-layer-list"});for(const layer of this.produced){const item=el("li",{class:"mcx-layer-list__item"},el("span",{text:layer.label}));if(layer.preview){item.append(el("div",{class:layer.handle?"mcx-thumb":"mcx-thumb mcx-thumb--only"},layer.preview.canvas,el("span",{class:"mcx-thumb__range",text:`${formatValue(layer.preview.min)} – ${formatValue(layer.preview.max)}${layer.handle?"":" (not drawn on the map)"}`})))}list.append(item)}children.push(list);children.push(el("div",{class:"mcx-actions"},button("Remove these result layers",()=>{this.clearProduced();this.render()},"ghost"),this.app.exportTextFile?button("Export GeoJSON",()=>this.exportResults(response),"secondary"):null))}const tables=response.result.tables;if(tables){for(const[key,value]of Object.entries(tables)){if(!value)continue;children.push(el("details",{class:"mcx-table"},el("summary",{text:key}),el("pre",{class:"mcx-pre",text:JSON.stringify(value,null,2).slice(0,2e4)})))}}const logLines=Array.isArray(response.log)?response.log:response.log?[String(response.log)]:[];if(logLines.length){children.push(el("details",{class:"mcx-table"},el("summary",{text:"Engine log"}),el("pre",{class:"mcx-pre",text:logLines.join("\n")})))}return el("section",{class:"mcx-section"},...children)}async loadDtm(file){const budget=this.cellBudget();const ceiling=budget.cells*200;if(file.size>ceiling){this.message={text:`${file.name} is ${formatBytes(file.size)}, more than ${formatBytes(ceiling)}, which is as much as ${budget.where} can take. Clip it to the area you need, or coarsen it, and load it again.`,tone:"error"};this.render();return}try{const buffer=await file.arrayBuffer();this.dtm={name:file.name,bytes:new Uint8Array(buffer)};this.useArea=false;this.message=null;this.render();await this.showTerrain()}catch(error){this.message={text:`Could not read the DTM: ${describeError(error)}`,tone:"error"};this.render()}}async showTerrain(){this.clearTerrainOverlay();if(!this.dtm)return;const backend=await this.resolveBackend();if(typeof backend.previewDtm!=="function")return;const size=this.dtm.summary?`${this.dtm.summary.width.toLocaleString()} × ${this.dtm.summary.height.toLocaleString()} cells`:this.dtm.name;this.previewingTerrain=true;this.setProgress(`Drawing ${size} on the map…`);try{const preview=await backend.previewDtm(this.dtm.bytes,this.dtm.handle??null);this.terrainPreview=preview;this.terrainOverlay=addHostRasterLayer(this.app,decodeRaster(preview.raster),{id:TERRAIN_LAYER_ID,name:`DEM — ${this.dtm.name}`,ramp:"terrain",opacity:.85});this.terrainVisible=true;this.groupTerrain();this.raiseMarkers();const b2=preview.raster.bounds;this.app.fitBounds?.([b2.west,b2.south,b2.east,b2.north])}catch(error){this.message={text:`The terrain preview failed (the analysis will still work): ${describeError(error)}`,tone:"warn"}}this.previewingTerrain=false;this.progress=null;this.render()}clearTerrainOverlay(){try{this.terrainOverlay?.remove()}catch{}this.terrainOverlay=null;this.terrainPreview=null}startPicking(which){this.cancelPicking();const session=startPointPicking(this.app,(lng,lat)=>{const set=which==="origin"?this.origin:this.destination;const spec=getAnalysis(this.analysis);const limit=which==="origin"?spec.origin.max:spec.destination?.max;const features=limit&&set.features.length>=limit?[]:set.features.slice();features.push(makePointFeature(lng,lat,`${which[0].toUpperCase()}${features.length+1}`));const next={kind:"click",label:"map clicks",features};if(which==="origin")this.origin=next;else this.destination=next;this.refreshMarkers(which);this.render()});if(!session){this.message={text:"This GeoLibre build does not expose the map to plugins, so click-to-place is unavailable.",tone:"warn"};this.render();return}this.picking=which;this.stopPicking=session.stop;this.render()}cancelPicking(){this.stopPicking?.();this.stopPicking=null;this.picking=null}setPoints(which,set,min,max){let features=set.features;if(max&&features.length>max)features=features.slice(0,max);const next={...set,features};if(which==="origin")this.origin=next;else this.destination=next;if(set.features.length===0){this.message={text:"No point features found in that source.",tone:"warn"}}else if(features.length<min){this.message={text:`That source has ${features.length} point(s); this analysis needs at least ${min}.`,tone:"warn"}}else{this.message=null}this.refreshMarkers(which);this.render()}refreshMarkers(which,raise=false){const set=which==="origin"?this.origin:this.destination;const prefix=which==="origin"?"O":"D";const features=set.features.map((feature,index)=>({...feature,properties:{...feature.properties??{},mcx_id:`${prefix}${index+1}`,mcx_role:which}}));if(!hostOwnsLayers(this.app)){const map=this.app.getMap?.()??null;this.rawMarkerCleanup[which]?.();this.rawMarkerCleanup[which]=null;if(map&&features.length){this.rawMarkerCleanup[which]=addRawMarkerLayer(map,which==="origin"?ORIGIN_LAYER_ID:DESTINATION_LAYER_ID,features,which==="origin"?"#16a34a":"#dc2626")}return}if(!features.length||raise){this.markers[which]?.remove();this.markers[which]=null}if(!features.length)return;const spec=getAnalysis(this.analysis);const label=which==="origin"?spec.origin.label:spec.destination?.label??"Destinations";this.markers[which]=addHostVectorLayer(this.app,{id:which==="origin"?ORIGIN_LAYER_ID:DESTINATION_LAYER_ID,name:`${label} (${features.length})`,features,style:which==="origin"?ORIGIN_STYLE:DESTINATION_STYLE});this.groupLocations()}markersAlreadyOnTop(){const ids=(()=>{try{return this.app.listLayers?.().map(l2=>l2.id)??[]}catch{return[]}})();if(!ids.length)return false;const markerIds=[this.markers.origin?.id,this.markers.destination?.id].filter(id=>Boolean(id));if(!markerIds.length)return true;const positions=markerIds.map(id=>ids.indexOf(id));if(positions.some(i=>i<0))return false;const mine=[this.terrainOverlay?.id,...this.produced.map(p2=>p2.handle?.id)].filter(id=>Boolean(id));const highestOther=Math.max(-1,...mine.map(id=>ids.indexOf(id)));return Math.min(...positions)>highestOther}raiseMarkers(){if(!this.markers.origin&&!this.markers.destination)return;if(this.markersAlreadyOnTop())return;for(const which of["origin","destination"]){this.markers[which]?.remove();this.markers[which]=null}this.refreshMarkers("origin");this.refreshMarkers("destination")}clearMarkers(){for(const which of["origin","destination"]){this.markers[which]?.remove();this.markers[which]=null;this.rawMarkerCleanup[which]?.();this.rawMarkerCleanup[which]=null}}groupTerrain(){if(!this.terrainOverlay)return;this.terrainGroupId=groupHostLayers(this.app,TERRAIN_GROUP_NAME,[this.terrainOverlay.id],this.terrainGroupId)}groupLocations(){const ids=[this.markers.origin,this.markers.destination].filter(h2=>Boolean(h2)).map(h2=>h2.id);this.locationsGroupId=groupHostLayers(this.app,LOCATIONS_GROUP_NAME,ids,this.locationsGroupId,{volatile:true})}candidateLayers(){return listVectorLayers(this.app).filter(layer=>layer.id!==ORIGIN_LAYER_ID&&layer.id!==DESTINATION_LAYER_ID)}collectParams(){const params={...this.params};const writable=params;const spec=getAnalysis(this.analysis);for(const extra of spec.extras){const value=this.extras[extra.key];if(value===void 0||value==="")continue;if(extra.kind==="numberList"){const numbers=String(value).split(/[,;\s]+/).map(part=>Number(part)).filter(n=>Number.isFinite(n));if(numbers.length)writable[extra.key]=numbers}else{writable[extra.key]=value}}if(!isTimeFunction(params.funct))delete params.time;if(!this.dtm&&this.useArea)params.zoom=this.demZoom;return params}hasTerrain(){return Boolean(this.dtm)||Boolean(this.useArea&&this.area)}validate(params){const spec=getAnalysis(this.analysis);if(!this.hasTerrain()){return"Load a DTM, download one for an area, or choose to use the area directly."}if(this.origin.features.length<spec.origin.min){return`${spec.origin.label} needs at least ${spec.origin.min} point(s).`}if(spec.destination&&this.destination.features.length<spec.destination.min){return`${spec.destination.label} needs at least ${spec.destination.min} point(s).`}if(this.analysis==="boundary"&&!params.contValue?.length){return"Enter at least one cost limit for the boundary analysis."}return null}async run(){const params=this.collectParams();const problem=this.validate(params);if(problem){this.message={text:problem,tone:"warn"};this.render();return}this.cancelPicking();this.busy=true;this.message=null;this.render();try{const spec=getAnalysis(this.analysis);const backend=await this.resolveBackend();const response=await backend.run({analysis:this.analysis,params},{dtm:this.dtm&&!this.dtm.handle?this.dtm.bytes:null,dtmHandle:this.dtm?.handle??null,studyplot:!this.dtm&&this.area?JSON.stringify(toFeatureCollection(this.area.features)):null,origin:pointsToGeoJson(this.origin.features,"O"),destin:spec.destination?pointsToGeoJson(this.destination.features,"D"):null,barrier:this.barrier.features.length?JSON.stringify(toFeatureCollection(this.barrier.features)):null});this.produced=[];if(response.ok){this.addResultsToMap(response);this.message=null}else{this.message={text:withMemoryHint(response.error,this.cellBudget().where),tone:"error"}}this.lastRun={response,layers:this.produced}}catch(error){this.message={text:withMemoryHint(describeError(error),this.cellBudget().where),tone:"error"};this.lastRun=null}finally{this.busy=false;this.progress=null;this.render()}}addResultsToMap(response){const spec=getAnalysis(response.analysis);this.runCount+=1;const layerIds=[];let bounds=null;for(const[key,payload]of Object.entries(response.result.rasters)){const meta=spec.layers[key];const label=meta?.label??key;const{handle,preview}=this.addRaster(payload,label);if(handle){layerIds.push(handle.id);bounds=unionBounds(bounds,handle.bounds)}if(handle||preview)this.produced.push({label,kind:"raster",handle,preview})}for(const[key,geojson]of Object.entries(response.result.vectors)){const meta=spec.layers[key];const label=meta?.label??key;try{const collection=JSON.parse(geojson);const features=collection.features??[];if(!features.length)continue;const handle=addHostVectorLayer(this.app,{name:label,features,style:resultStyle(key,meta?.kind??"line")});if(!handle)continue;layerIds.push(handle.id);bounds=unionBounds(bounds,boundsOf(features));this.produced.push({label,kind:"vector",handle})}catch(error){this.message={text:`Could not add "${label}": ${describeError(error)}`,tone:"warn"}}}groupHostLayers(this.app,`movecost · ${spec.label} #${this.runCount}`,layerIds,null);this.raiseMarkers();if(bounds)this.app.fitBounds?.(bounds)}addRaster(payload,label){let decoded;try{decoded=decodeRaster(payload)}catch(error){this.message={text:`Could not decode "${label}": ${describeError(error)}`,tone:"warn"};return{handle:null}}let preview;try{preview={canvas:renderRasterThumbnail(decoded,{ramp:this.rampId}),min:decoded.min,max:decoded.max}}catch{preview=void 0}try{const handle=addHostRasterLayer(this.app,decoded,{name:label,ramp:this.rampId,opacity:this.rasterOpacity});if(!handle){this.message={text:"This GeoLibre build exposes neither a layer registry nor the map to plugins, so raster results are shown here in the panel only. Vector results are unaffected.",tone:"warn"}}return{handle,preview}}catch(error){this.message={text:`Could not draw "${label}": ${describeError(error)}`,tone:"warn"};return{handle:null,preview}}}clearProduced(){for(const layer of this.produced){try{layer.handle?.remove()}catch{}}this.produced=[]}exportResults(response){const features=[];for(const[key,geojson]of Object.entries(response.result.vectors)){try{const parsed=JSON.parse(geojson);for(const feature of parsed.features??[]){features.push({...feature,properties:{...feature.properties??{},mcx_layer:key}})}}catch{}}this.app.exportTextFile?.(`movecost-${response.analysis}.geojson`,JSON.stringify(toFeatureCollection(features)))}}const PLUGIN_ID="movecost";const PANEL_ID="movecost-panel";const VERSION=PLUGIN_VERSION;class MovecostControl{constructor(onToggle){this.onToggle=onToggle}container=null;onAdd(){const container=document.createElement("div");container.className="maplibregl-ctrl maplibregl-ctrl-group mcx-ctrl";const button2=document.createElement("button");button2.type="button";button2.title="movecost — least-cost analysis";button2.setAttribute("aria-label","movecost — least-cost analysis");button2.className="mcx-ctrl__button";button2.innerHTML=ICON_SVG;button2.addEventListener("click",this.onToggle);container.append(button2);this.container=container;return container}onRemove(){this.container?.remove();this.container=null}getDefaultPosition(){return"top-right"}}const ICON_SVG=`
<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
     stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M2 18c3.5 0 4-9 7.5-9S13 18 16.5 18 20 12 22 12" />
  <circle cx="4" cy="18" r="1.6" fill="currentColor" stroke="none" />
  <circle cx="20" cy="12.6" r="1.6" fill="currentColor" stroke="none" />
</svg>`;let panel=null;let control=null;let unregisterPanel=null;let unregisterMenu=null;let floating=null;let panelOpen=false;function openPanel(app){if(app.openRightPanel?.(PANEL_ID)){panelOpen=true;return}mountFloating(app)}function closePanel(app){app.closeRightPanel?.(PANEL_ID);unmountFloating();panelOpen=false}function togglePanel(app){if(panelOpen)closePanel(app);else openPanel(app)}function mountFloating(app){if(floating)return;const map=app.getMap?.();const host=map?map.getCanvas().parentElement:document.body;if(!host)return;const card=document.createElement("div");card.className="mcx-floating";const header=document.createElement("div");header.className="mcx-floating__header";header.textContent="movecost";const close=document.createElement("button");close.type="button";close.className="mcx-floating__close";close.textContent="×";close.addEventListener("click",()=>closePanel(app));header.append(close);const body=document.createElement("div");body.className="mcx-floating__body";card.append(header,body);host.append(card);floating=card;panelOpen=true;panel??=new MovecostPanel(app);panel.mount(body)}function unmountFloating(){floating?.remove();floating=null}const plugin={id:PLUGIN_ID,name:"movecost — least-cost analysis",version:VERSION,activate(app){panel=new MovecostPanel(app);unregisterPanel=app.registerRightPanel?.({id:PANEL_ID,title:"movecost",dock:"replace-style",defaultWidth:360,render:container=>panel.mount(container),onOpen:()=>{panelOpen=true},onClose:()=>{panelOpen=false}})??null;control=new MovecostControl(()=>togglePanel(app));app.addMapControl(control,"top-right");unregisterMenu=app.registerToolbarMenu?.({id:"movecost-menu",label:"movecost",items:[{type:"action",id:"movecost-open",label:"Open the movecost panel",onSelect:()=>openPanel(app)}]})??null;return true},deactivate(app){unmountFloating();if(control){app.removeMapControl(control);control=null}unregisterMenu?.();unregisterMenu=null;unregisterPanel?.();unregisterPanel=null;app.unregisterRightPanel?.(PANEL_ID);panel?.dispose();panel=null;panelOpen=false}};export{MovecostPanel,plugin as default,plugin};
