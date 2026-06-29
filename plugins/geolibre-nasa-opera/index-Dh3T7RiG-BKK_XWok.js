import { f as fromUtf8$2, v as toUtf8 } from "./GeoAgentControl-BK8Q6PEC-QtqA2iOY.js";
//#region node_modules/maplibre-gl-geoagent/dist/index-Dh3T7RiG.js
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var EventStreamSerde = class {
	constructor({ marshaller, serializer, deserializer, serdeContext, defaultContentType }) {
		__publicField(this, "marshaller");
		__publicField(this, "serializer");
		__publicField(this, "deserializer");
		__publicField(this, "serdeContext");
		__publicField(this, "defaultContentType");
		this.marshaller = marshaller;
		this.serializer = serializer;
		this.deserializer = deserializer;
		this.serdeContext = serdeContext;
		this.defaultContentType = defaultContentType;
	}
	async serializeEventStream({ eventStream, requestSchema, initialRequest }) {
		const marshaller = this.marshaller;
		const eventStreamMember = requestSchema.getEventStreamMember();
		const unionSchema = requestSchema.getMemberSchema(eventStreamMember);
		const serializer = this.serializer;
		const defaultContentType = this.defaultContentType;
		const initialRequestMarker = Symbol("initialRequestMarker");
		const eventStreamIterable = { async *[Symbol.asyncIterator]() {
			if (initialRequest) {
				const headers = {
					":event-type": {
						type: "string",
						value: "initial-request"
					},
					":message-type": {
						type: "string",
						value: "event"
					},
					":content-type": {
						type: "string",
						value: defaultContentType
					}
				};
				serializer.write(requestSchema, initialRequest);
				const body = serializer.flush();
				yield {
					[initialRequestMarker]: true,
					headers,
					body
				};
			}
			for await (const page of eventStream) yield page;
		} };
		return marshaller.serialize(eventStreamIterable, (event) => {
			if (event[initialRequestMarker]) return {
				headers: event.headers,
				body: event.body
			};
			let unionMember = "";
			for (const key in event) if (key !== "__type") {
				unionMember = key;
				break;
			}
			const { additionalHeaders, body, eventType, explicitPayloadContentType } = this.writeEventBody(unionMember, unionSchema, event);
			return {
				headers: {
					":event-type": {
						type: "string",
						value: eventType
					},
					":message-type": {
						type: "string",
						value: "event"
					},
					":content-type": {
						type: "string",
						value: explicitPayloadContentType ?? defaultContentType
					},
					...additionalHeaders
				},
				body
			};
		});
	}
	async deserializeEventStream({ response, responseSchema, initialResponseContainer }) {
		var _a;
		const marshaller = this.marshaller;
		const eventStreamMember = responseSchema.getEventStreamMember();
		const memberSchemas = responseSchema.getMemberSchema(eventStreamMember).getMemberSchemas();
		const initialResponseMarker = Symbol("initialResponseMarker");
		const asyncIterable = marshaller.deserialize(response.body, async (event) => {
			var _a2, _b;
			let unionMember = "";
			for (const key in event) if (key !== "__type") {
				unionMember = key;
				break;
			}
			const body = event[unionMember].body;
			if (unionMember === "initial-response") {
				const dataObject = await this.deserializer.read(responseSchema, body);
				delete dataObject[eventStreamMember];
				return {
					[initialResponseMarker]: true,
					...dataObject
				};
			} else if (unionMember in memberSchemas) {
				const eventStreamSchema = memberSchemas[unionMember];
				if (eventStreamSchema.isStructSchema()) {
					const out = {};
					let hasBindings = false;
					for (const [name, member] of eventStreamSchema.structIterator()) {
						const { eventHeader, eventPayload } = member.getMergedTraits();
						hasBindings = hasBindings || Boolean(eventHeader || eventPayload);
						if (eventPayload) {
							if (member.isBlobSchema()) out[name] = body;
							else if (member.isStringSchema()) out[name] = (((_a2 = this.serdeContext) == null ? void 0 : _a2.utf8Encoder) ?? toUtf8)(body);
							else if (member.isStructSchema()) out[name] = await this.deserializer.read(member, body);
						} else if (eventHeader) {
							const value = (_b = event[unionMember].headers[name]) == null ? void 0 : _b.value;
							if (value != null) if (member.isNumericSchema()) if (value && typeof value === "object" && "bytes" in value) out[name] = BigInt(value.toString());
							else out[name] = Number(value);
							else out[name] = value;
						}
					}
					if (hasBindings) return { [unionMember]: out };
					if (body.byteLength === 0) return { [unionMember]: {} };
				}
				return { [unionMember]: await this.deserializer.read(eventStreamSchema, body) };
			} else return { $unknown: event };
		});
		const asyncIterator = asyncIterable[Symbol.asyncIterator]();
		const firstEvent = await asyncIterator.next();
		if (firstEvent.done) return asyncIterable;
		if ((_a = firstEvent.value) == null ? void 0 : _a[initialResponseMarker]) {
			if (!responseSchema) throw new Error("@smithy::core/protocols - initial-response event encountered in event stream but no response schema given.");
			for (const key in firstEvent.value) initialResponseContainer[key] = firstEvent.value[key];
		}
		return { async *[Symbol.asyncIterator]() {
			var _a2;
			if (!((_a2 = firstEvent == null ? void 0 : firstEvent.value) == null ? void 0 : _a2[initialResponseMarker])) yield firstEvent.value;
			while (true) {
				const { done, value } = await asyncIterator.next();
				if (done) break;
				yield value;
			}
		} };
	}
	writeEventBody(unionMember, unionSchema, event) {
		var _a;
		const serializer = this.serializer;
		let eventType = unionMember;
		let explicitPayloadMember = null;
		let explicitPayloadContentType;
		const isKnownSchema = (() => {
			return unionSchema.getSchema()[4].includes(unionMember);
		})();
		const additionalHeaders = {};
		if (!isKnownSchema) {
			const [type, value] = event[unionMember];
			eventType = type;
			serializer.write(15, value);
		} else {
			const eventSchema = unionSchema.getMemberSchema(unionMember);
			if (eventSchema.isStructSchema()) {
				for (const [memberName, memberSchema] of eventSchema.structIterator()) {
					const { eventHeader, eventPayload } = memberSchema.getMergedTraits();
					if (eventPayload) explicitPayloadMember = memberName;
					else if (eventHeader) {
						const value = event[unionMember][memberName];
						let type = "binary";
						if (memberSchema.isNumericSchema()) if ((-2) ** 31 <= value && value <= 2 ** 31 - 1) type = "integer";
						else type = "long";
						else if (memberSchema.isTimestampSchema()) type = "timestamp";
						else if (memberSchema.isStringSchema()) type = "string";
						else if (memberSchema.isBooleanSchema()) type = "boolean";
						if (value != null) {
							additionalHeaders[memberName] = {
								type,
								value
							};
							delete event[unionMember][memberName];
						}
					}
				}
				if (explicitPayloadMember !== null) {
					const payloadSchema = eventSchema.getMemberSchema(explicitPayloadMember);
					if (payloadSchema.isBlobSchema()) explicitPayloadContentType = "application/octet-stream";
					else if (payloadSchema.isStringSchema()) explicitPayloadContentType = "text/plain";
					serializer.write(payloadSchema, event[unionMember][explicitPayloadMember]);
				} else serializer.write(eventSchema, event[unionMember]);
			} else if (eventSchema.isUnitSchema()) serializer.write(eventSchema, {});
			else throw new Error("@smithy/core/event-streams - non-struct member not supported in event stream union.");
		}
		const messageSerialization = serializer.flush() ?? new Uint8Array();
		return {
			body: typeof messageSerialization === "string" ? (((_a = this.serdeContext) == null ? void 0 : _a.utf8Decoder) ?? fromUtf8$2)(messageSerialization) : messageSerialization,
			eventType,
			explicitPayloadContentType,
			additionalHeaders
		};
	}
};
//#endregion
export { EventStreamSerde };
