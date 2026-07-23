const jt = /* @__PURE__ */ new WeakMap(), $t = /* @__PURE__ */ new WeakMap();
function te(n) {
  return n == null || n === "" || /^<?null>?$/i.test(String(n)) ? "—" : typeof n == "object" ? JSON.stringify(n) : String(n);
}
function Pe(n) {
  return n.replace(/_/g, " ").replace(/\s+/g, " ").trim();
}
function le(n) {
  const l = Object.entries(n);
  for (const t of ["name", "site_name", "title", "fid"]) {
    const s = l.find(([e, r]) => e.toLowerCase() === t && te(r) !== "—");
    if (s) return te(s[1]);
  }
  return "KML feature";
}
function Re(n) {
  const l = te(n);
  if (/^https?:\/\/\S+$/i.test(l)) {
    const s = document.createElement("a");
    return s.href = l, s.target = "_blank", s.rel = "noopener noreferrer", s.textContent = l, s;
  }
  const t = document.createElement("span");
  return t.textContent = l, t;
}
function Be(n, l) {
  const t = document.createElement("section");
  t.className = "kml-feature-card", t.setAttribute("role", "dialog"), t.setAttribute("aria-label", `KML feature: ${le(n)}`);
  const s = document.createElement("header"), e = document.createElement("strong");
  e.textContent = le(n);
  const r = document.createElement("button");
  r.type = "button", r.className = "kml-feature-card-close", r.setAttribute("aria-label", "Close feature information"), r.textContent = "×", s.append(e, r);
  const i = document.createElement("table"), a = document.createElement("tbody");
  for (const [m, b] of Object.entries(n)) {
    if (m === "name" || m.startsWith("__")) continue;
    const _ = document.createElement("tr"), g = document.createElement("th");
    g.scope = "row", g.textContent = Pe(m);
    const d = document.createElement("td");
    d.append(Re(b)), _.append(g, d), a.append(_);
  }
  i.append(a);
  const u = document.createElement("footer");
  return u.textContent = l, t.append(s, i, u), r.addEventListener("click", () => t.remove()), t;
}
function Fe(n, l, t) {
  const s = l.features?.[0];
  s?.properties && ge(n, l.point, s.properties, t);
}
function ge(n, l, t, s) {
  const e = n.getContainer?.();
  if (!e || n.getCanvas?.().style.cursor === "crosshair") return;
  jt.get(n)?.remove();
  const r = Be(t, s);
  r.style.visibility = "hidden", e.append(r);
  const i = 12, a = l.x + i, u = l.y + i;
  r.style.left = `${Math.max(i, Math.min(a, e.clientWidth - r.offsetWidth - i))}px`, r.style.top = `${Math.max(i, Math.min(u, e.clientHeight - r.offsetHeight - i))}px`, r.style.visibility = "visible", jt.set(n, r);
}
function De(n, l, t) {
  if (!n.on || !n.getContainer) return;
  const s = $t.get(n) ?? [];
  for (const e of l) {
    const r = (i) => Fe(n, i, t);
    n.on("click", e, r), s.push({ layerId: e, handler: r });
  }
  $t.set(n, s);
}
function Ue(n) {
  if (n) {
    for (const l of $t.get(n) ?? []) n.off?.("click", l.layerId, l.handler);
    $t.delete(n), jt.get(n)?.remove(), jt.delete(n);
  }
}
const je = 127, $e = 3, ce = 1, Ze = 2, Zt = /* @__PURE__ */ new Set();
function We(n, l, t, s, e) {
  return e !== 0 ? [l, t] : s !== 0 ? [n - 1 - t, n - 1 - l] : [t, l];
}
function Ge(n, l, t) {
  if (!Number.isInteger(n) || n < 0 || n > 26) throw new Error("PMTiles zoom must be an integer from 0 through 26");
  const s = 2 ** n;
  if (!Number.isInteger(l) || !Number.isInteger(t) || l < 0 || t < 0 || l >= s || t >= s)
    throw new Error(`Tile ${n}/${l}/${t} is outside its zoom-level bounds`);
  let e = (s * s - 1) / 3, r = l, i = t, a = n - 1;
  for (let u = n === 0 ? 0 : 2 ** a; u > 0; u >>= 1) {
    const m = r & u, b = i & u;
    e += (3 * m ^ b) * 2 ** a, [r, i] = We(u, r, i, m, b), a -= 1;
  }
  return e;
}
function At(n, l) {
  if (!Number.isSafeInteger(l) || l < 0) throw new Error(`Invalid PMTiles varint value: ${l}`);
  let t = l;
  for (; t >= 128; )
    n.push(t % 128 + 128), t = Math.floor(t / 128);
  n.push(t);
}
function Ke(n) {
  const l = [];
  At(l, n.length);
  let t = 0;
  for (const s of n)
    At(l, s.tileId - t), t = s.tileId;
  for (let s = 0; s < n.length; s += 1) At(l, 1);
  for (const s of n) At(l, s.length);
  for (let s = 0; s < n.length; s += 1) {
    const e = n[s], r = n[s - 1];
    At(l, r && e.offset === r.offset + r.length ? 0 : e.offset + 1);
  }
  return Uint8Array.from(l);
}
function He(n) {
  const l = /^data:image\/png(?:;[^,]*)?;base64,([A-Za-z0-9+/=\s]+)$/i.exec(n);
  if (!l) throw new Error("Raster conversion produced a non-PNG tile");
  const t = globalThis.atob(l[1].replace(/\s/g, "")), s = new Uint8Array(t.length);
  for (let e = 0; e < t.length; e += 1) s[e] = t.charCodeAt(e);
  return s;
}
function mt(n, l, t) {
  if (!Number.isSafeInteger(t) || t < 0) throw new Error(`PMTiles offset is outside JavaScript's safe range: ${t}`);
  n.setUint32(l, t % 2 ** 32, !0), n.setUint32(l + 4, Math.floor(t / 2 ** 32), !0);
}
function xt(n) {
  return Math.max(-2147483648, Math.min(2147483647, Math.round(n * 1e7)));
}
function Ye(n) {
  return { tileId: Ge(n.z, n.x, n.y), bytes: He(n.imageUrl) };
}
function Xe(n, l) {
  if (!n.tiles.length) throw new Error("Cannot create an empty PMTiles raster archive");
  const t = n.tiles.map(Ye).sort((y, x) => y.tileId - x.tileId);
  for (let y = 1; y < t.length; y += 1)
    if (t[y - 1].tileId === t[y].tileId) throw new Error("Raster conversion produced duplicate PMTiles tile coordinates");
  let s = 0;
  const e = t.map((y) => {
    const x = { tileId: y.tileId, offset: s, length: y.bytes.byteLength };
    return s += y.bytes.byteLength, x;
  }), r = Ke(e), i = new TextEncoder().encode(JSON.stringify({ name: l, format: "png", type: "overlay" })), a = je, u = a + r.byteLength, m = u + i.byteLength, b = new Uint8Array(m + s);
  b.set(r, a), b.set(i, u);
  let _ = m;
  for (const y of t)
    b.set(y.bytes, _), _ += y.bytes.byteLength;
  b.set(new TextEncoder().encode("PMTiles"), 0);
  const g = new DataView(b.buffer);
  g.setUint8(7, $e), mt(g, 8, a), mt(g, 16, r.byteLength), mt(g, 24, u), mt(g, 32, i.byteLength), mt(g, 40, m), mt(g, 48, 0), mt(g, 56, m), mt(g, 64, s), mt(g, 72, e.length), mt(g, 80, e.length), mt(g, 88, e.length), g.setUint8(96, 1), g.setUint8(97, ce), g.setUint8(98, ce), g.setUint8(99, Ze);
  const d = n.tiles.map((y) => y.z);
  g.setUint8(100, Math.min(...d)), g.setUint8(101, Math.max(...d));
  const [v, c, p, h] = n.bounds;
  return g.setInt32(102, xt(v), !0), g.setInt32(106, xt(c), !0), g.setInt32(110, xt(p), !0), g.setInt32(114, xt(h), !0), g.setUint8(118, Math.min(n.targetZoom, 255)), g.setInt32(119, xt((v + p) / 2), !0), g.setInt32(123, xt((c + h) / 2), !0), b;
}
function Ve(n, l) {
  const t = Xe(n, l), s = new ArrayBuffer(t.byteLength);
  new Uint8Array(s).set(t);
  const e = URL.createObjectURL(new Blob([s], { type: "application/vnd.pmtiles" }));
  return Zt.add(e), { url: e, byteLength: t.byteLength };
}
function Je(n) {
  URL.revokeObjectURL(n), Zt.delete(n);
}
function qe() {
  for (const n of Zt) URL.revokeObjectURL(n);
  Zt.clear();
}
class Qe {
  constructor(l) {
    this.onOpen = l;
  }
  onOpen;
  container = null;
  onAdd() {
    const l = document.createElement("div");
    l.className = "maplibregl-ctrl maplibregl-ctrl-group kml-import-control";
    const t = document.createElement("button");
    return t.type = "button", t.title = "Import KML / KMZ", t.setAttribute("aria-label", "Import KML / KMZ"), t.textContent = "KML", t.addEventListener("click", this.onOpen), l.appendChild(t), this.container = l, l;
  }
  onRemove() {
    this.container?.remove(), this.container = null;
  }
}
function Dt(n, l = "") {
  const t = n.replace(/\\/g, "/").split(/[?#]/, 1)[0] ?? "";
  if (!t || t.startsWith("/") || /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(t)) return;
  const s = l.replace(/\\/g, "/").split("/").filter(Boolean);
  s.length > 0 && !l.endsWith("/") && s.pop();
  const e = [...s];
  for (const r of t.split("/"))
    if (!(!r || r === "."))
      if (r === "..") {
        if (e.length === 0) return;
        e.pop();
      } else
        e.push(r);
  return e.join("/");
}
function tr(n) {
  const l = n.toLowerCase().split(".").at(-1);
  return { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", svg: "image/svg+xml", kml: "application/vnd.google-earth.kml+xml", kmz: "application/vnd.google-earth.kmz" }[l ?? ""] ?? "application/octet-stream";
}
function er(n, l) {
  let t = "";
  for (let e = 0; e < n.length; e += 32768)
    t += String.fromCharCode(...n.subarray(e, e + 32768));
  return `data:${l};base64,${btoa(t)}`;
}
class rr {
  async resolve(l) {
    try {
      const t = new URL(l);
      return ["https:", "http:"].includes(t.protocol) ? t.href : void 0;
    } catch {
      return;
    }
  }
}
function nr(n) {
  return Array.from(n.childNodes).filter((l) => l.nodeType === 1);
}
function _t(n) {
  return n.localName || n.nodeName.split(":").at(-1) || n.nodeName;
}
function bt(n, l) {
  return nr(n).filter((t) => _t(t) === l);
}
function st(n, l) {
  return bt(n, l)[0];
}
function ue(n, l) {
  return Array.from(n.querySelectorAll("*")).filter((t) => _t(t) === l);
}
function et(n, l) {
  return st(n, l)?.textContent?.trim() || void 0;
}
function ut(n, l) {
  const t = Number(et(n, l));
  return Number.isFinite(t) ? t : void 0;
}
function de(n, l) {
  const t = et(n, l);
  if (t !== void 0)
    return t === "1" || t.toLowerCase() === "true";
}
function ir(n) {
  if (n.length === 0) throw new Error("The KML file is empty.");
  if (/<!DOCTYPE|<!ENTITY/i.test(n))
    throw new Error("KML containing DOCTYPE or entity declarations is not accepted for security reasons.");
  const l = new DOMParser().parseFromString(n, "application/xml"), t = l.querySelector("parsererror");
  if (t) throw new Error(`Invalid KML XML: ${t.textContent?.trim() || "parser error"}`);
  const s = l.documentElement;
  if (!s || _t(s) !== "kml") throw new Error("The XML document does not have a KML root element.");
  return l;
}
function or(n) {
  const l = n.trim().split(",").map(Number);
  if (l.length < 2 || l.some((r) => !Number.isFinite(r))) return;
  const [t, s, e] = l;
  if (!(t === void 0 || s === void 0))
    return e === void 0 ? [t, s] : [t, s, e];
}
function Wt(n) {
  return n ? n.trim().split(/\s+/).map(or).filter((l) => !!l) : [];
}
const ye = /* @__PURE__ */ new Set(["clampToGround", "relativeToGround", "absolute", "clampToSeaFloor", "relativeToSeaFloor"]);
function Ot(n, l, t) {
  const [s, e, r] = n;
  if (s === void 0 || e === void 0) return n;
  const i = ye.has(l ?? "") ? l : "clampToGround", a = r !== void 0;
  if (i === "clampToGround" || i === "clampToSeaFloor")
    return !a || r === 0 ? n : [s, e, 0];
  if (t === 0 && (r === void 0 || Number.isFinite(r))) return n;
  const u = (Number.isFinite(r) ? r : 0) + t;
  return a || t !== 0 ? [s, e, u] : [s, e];
}
function Ht(n) {
  const l = {};
  for (const t of Array.from(n.children)) {
    const s = _t(t);
    if (!["altitudeMode", "altitudeOffset", "extrude", "tessellate"].includes(s)) continue;
    const e = t.textContent?.trim();
    if (e)
      if (s === "altitudeMode") l.altitudeMode = e;
      else if (s === "altitudeOffset") {
        const r = Number(e);
        Number.isFinite(r) && (l.altitudeOffset = r);
      } else s === "extrude" ? l.extrude = e === "1" || e.toLowerCase() === "true" : s === "tessellate" && (l.tessellate = e === "1" || e.toLowerCase() === "true");
  }
  return l;
}
function sr(n) {
  const l = Wt(et(n, "coordinates"))[0], t = Ht(n);
  return { geometry: l ? { type: "Point", coordinates: Ot(l, t.altitudeMode, t.altitudeOffset ?? 0) } : void 0, ...t };
}
function ar(n) {
  const l = Ht(n), t = Wt(et(n, "coordinates")).map((s) => Ot(s, l.altitudeMode, l.altitudeOffset ?? 0));
  return { geometry: t.length >= 2 ? { type: "LineString", coordinates: t } : void 0, ...l };
}
function lr(n) {
  const l = Ht(n), t = st(n, "outerBoundaryIs"), s = t ? st(t, "LinearRing") : void 0, e = s ? Wt(et(s, "coordinates")).map((i) => Ot(i, l.altitudeMode, l.altitudeOffset ?? 0)) : [];
  if (e.length < 4) return l;
  const r = bt(n, "innerBoundaryIs").map((i) => st(i, "LinearRing")).filter((i) => !!i).map((i) => Wt(et(i, "coordinates")).map((a) => Ot(a, l.altitudeMode, l.altitudeOffset ?? 0))).filter((i) => i.length >= 4);
  return { geometry: { type: "Polygon", coordinates: [e, ...r] }, ...l };
}
function cr(n) {
  const l = Ht(n), t = bt(n, "coord").map((e) => e.textContent?.trim().split(/\s+/).map(Number) ?? []).filter((e) => e.length >= 2 && e.every(Number.isFinite)).map((e) => Ot(e, l.altitudeMode, l.altitudeOffset ?? 0)), s = bt(n, "when").map((e) => e.textContent?.trim() ?? "");
  return {
    geometry: t.length >= 2 ? { type: "LineString", coordinates: t } : void 0,
    ...l,
    trackWhen: s
  };
}
function ur(n, l) {
  const t = [], s = (e) => {
    const r = _t(e);
    if (r === "MultiGeometry" || r === "MultiTrack") {
      for (const a of Array.from(e.children)) s(a);
      return;
    }
    let i;
    r === "Point" && (i = sr(e)), r === "LineString" && (i = ar(e)), r === "Polygon" && (i = lr(e)), r === "Track" && (i = cr(e)), i && (i.altitudeMode && !ye.has(i.altitudeMode) && l.push({ code: "partial-support", message: `Unknown altitudeMode “${i.altitudeMode}” was treated as clampToGround.` }), i.geometry ? t.push(i) : l.push({ code: "invalid-geometry", message: `A malformed ${r} geometry was skipped.` }));
  };
  for (const e of Array.from(n.children)) s(e);
  return t;
}
function dr(n) {
  if (n.length < 2 || n.some((i) => i.trackWhen) || new Set(n.map((i) => i.geometry.type)).size !== 1 || new Set(n.map((i) => JSON.stringify([
    i.altitudeMode,
    i.altitudeOffset,
    i.extrude,
    i.tessellate
  ]))).size !== 1) return n;
  const s = n.find((i) => i.altitudeMode || i.altitudeOffset !== void 0 || i.extrude !== void 0 || i.tessellate !== void 0), e = s ? {
    altitudeMode: s.altitudeMode,
    altitudeOffset: s.altitudeOffset,
    extrude: s.extrude,
    tessellate: s.tessellate
  } : {}, r = n[0]?.geometry.type;
  return r === "Point" ? [{ geometry: { type: "MultiPoint", coordinates: n.map((i) => i.geometry.coordinates) }, ...e }] : r === "LineString" ? [{ geometry: { type: "MultiLineString", coordinates: n.map((i) => i.geometry.coordinates) }, ...e }] : r === "Polygon" ? [{ geometry: { type: "MultiPolygon", coordinates: n.map((i) => i.geometry.coordinates) }, ...e }] : n;
}
function ve(n) {
  switch (n.type) {
    case "Point":
    case "MultiPoint":
      return { points: n.type === "Point" ? 1 : n.coordinates.length, lines: 0, polygons: 0 };
    case "LineString":
    case "MultiLineString":
      return { points: 0, lines: n.type === "LineString" ? 1 : n.coordinates.length, polygons: 0 };
    case "Polygon":
    case "MultiPolygon":
      return { points: 0, lines: 0, polygons: n.type === "Polygon" ? 1 : n.coordinates.length };
    case "GeometryCollection":
      return n.geometries.reduce((l, t) => {
        const s = ve(t);
        return { points: l.points + s.points, lines: l.lines + s.lines, polygons: l.polygons + s.polygons };
      }, { points: 0, lines: 0, polygons: 0 });
  }
}
function _e(n) {
  const l = [], t = (s) => {
    if (Array.isArray(s))
      if (typeof s[0] == "number" && typeof s[1] == "number") l.push(s);
      else for (const e of s) t(e);
  };
  if (n.type === "GeometryCollection" ? n.geometries.forEach((s) => {
    const e = _e(s);
    e && l.push([e[0], e[1]], [e[2], e[3]]);
  }) : t(n.coordinates), l.length !== 0)
    return l.reduce((s, e) => [
      Math.min(s[0], e[0] ?? s[0]),
      Math.min(s[1], e[1] ?? s[1]),
      Math.max(s[2], e[0] ?? s[2]),
      Math.max(s[3], e[1] ?? s[3])
    ], [1 / 0, 1 / 0, -1 / 0, -1 / 0]);
}
function fr(n) {
  const l = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"'
  };
  let t = n;
  for (let s = 0; s < 2; s += 1) {
    const e = t.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (r, i) => {
      if (i.startsWith("#x") || i.startsWith("#X")) {
        const a = Number.parseInt(i.slice(2), 16);
        return Number.isFinite(a) ? String.fromCodePoint(a) : r;
      }
      if (i.startsWith("#")) {
        const a = Number.parseInt(i.slice(1), 10);
        return Number.isFinite(a) ? String.fromCodePoint(a) : r;
      }
      return l[i.toLowerCase()] ?? r;
    });
    if (e === t) break;
    t = e;
  }
  return t;
}
function Xt(n) {
  const l = n.replace(/<br\s*\/?\s*>/gi, `
`).replace(/<[^>]+>/g, " ").replace(/[\t\r ]+/g, " ").replace(/ *\n */g, `
`).trim();
  return fr(l);
}
function hr(n) {
  const l = {}, t = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let s;
  for (; s = t.exec(n); ) {
    const e = [...s[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)];
    if (e.length < 2) continue;
    const r = Xt(e[0][1] ?? ""), i = Xt(e.slice(1).map((m) => m[1] ?? "").join(" "));
    if (!r) continue;
    let a = r, u = 2;
    for (; Object.hasOwn(l, a); ) a = `${r} (${u++})`;
    l[a] = i;
  }
  if (Object.keys(l).length === 0)
    for (const e of n.matchAll(/<b\b[^>]*>([\s\S]*?)<\/b>/gi)) {
      const r = Xt(e[1] ?? ""), i = r.indexOf(":");
      if (i < 1) continue;
      const a = r.slice(0, i).trim(), u = r.slice(i + 1).trim();
      a && u && (l[a] = u);
    }
  return Object.keys(l).length ? l : void 0;
}
function Lt(n) {
  if (!n) return;
  const l = n.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{8}$/.test(l)) return;
  const t = Number.parseInt(l.slice(0, 2), 16), s = l.slice(2, 4), e = l.slice(4, 6), r = l.slice(6, 8), i = `#${r}${e}${s}`.toLowerCase();
  return { raw: n, hex: i, opacity: t / 255, css: `rgba(${Number.parseInt(r, 16)}, ${Number.parseInt(e, 16)}, ${Number.parseInt(s, 16)}, ${(t / 255).toFixed(3)})` };
}
function be(n) {
  const l = st(n, "IconStyle"), t = st(n, "LabelStyle"), s = st(n, "LineStyle"), e = st(n, "PolyStyle");
  return {
    id: n.getAttribute("id") || void 0,
    iconHref: l ? et(st(l, "Icon") ?? l, "href") : void 0,
    iconColor: l ? Lt(et(l, "color")) : void 0,
    iconScale: l ? ut(l, "scale") : void 0,
    iconHeading: l ? ut(l, "heading") : void 0,
    labelColor: t ? Lt(et(t, "color")) : void 0,
    labelScale: t ? ut(t, "scale") : void 0,
    lineColor: s ? Lt(et(s, "color")) : void 0,
    lineWidth: s ? ut(s, "width") : void 0,
    polyColor: e ? Lt(et(e, "color")) : void 0,
    fill: e ? de(e, "fill") : void 0,
    outline: e ? de(e, "outline") : void 0
  };
}
function pr(n) {
  const l = /* @__PURE__ */ new Map(), t = /* @__PURE__ */ new Map();
  for (const s of Array.from(n.querySelectorAll("[id]"))) {
    const e = s.getAttribute("id");
    if (e && (s.localName === "Style" && l.set(`#${e}`, be(s)), s.localName === "StyleMap")) {
      const r = bt(s, "Pair"), i = r.find((u) => et(u, "key") === "normal") ?? r[0], a = i ? et(i, "styleUrl") : void 0;
      a && t.set(`#${e}`, a);
    }
  }
  return { styles: l, styleMaps: t };
}
function mr(n, l, t) {
  const s = l ? be(l) : void 0;
  let e = n;
  const r = /* @__PURE__ */ new Set();
  for (; e && t.styleMaps.has(e) && !r.has(e); )
    r.add(e), e = t.styleMaps.get(e);
  const i = e ? t.styles.get(e) : void 0;
  return i || s ? { ...i, ...s } : void 0;
}
function gr(n, l) {
  const [t, s, e, r] = n, i = (t + e) / 2, a = (s + r) / 2, u = l * Math.PI / 180, m = Math.cos(u), b = Math.sin(u), _ = ([g, d]) => {
    const v = g - i, c = d - a;
    return [i + v * m - c * b, a + v * b + c * m];
  };
  return [_([t, r]), _([e, r]), _([e, s]), _([t, s])];
}
function yr(n) {
  const l = et(n, "coordinates")?.trim().split(/\s+/).map((i) => i.split(",").slice(0, 2).map(Number));
  if (!l || l.length !== 4 || l.some((i) => i.some((a) => !Number.isFinite(a)))) return;
  const [t, s, e, r] = l;
  return r && e && s && t ? [r, e, s, t] : void 0;
}
async function vr(n, l, t, s, e = !0) {
  const r = st(n, "Icon"), i = r ? et(r, "href") : void 0, a = st(n, "LatLonBox"), u = a ? ut(a, "west") : void 0, m = a ? ut(a, "south") : void 0, b = a ? ut(a, "east") : void 0, _ = a ? ut(a, "north") : void 0, g = [u, m, b, _].every((y) => y !== void 0) ? [u, m, b, _] : void 0, d = a ? ut(a, "rotation") ?? 0 : 0, v = bt(n, "LatLonQuad")[0] ?? Array.from(n.querySelectorAll("*")).find((y) => y.localName === "LatLonQuad");
  let c = v ? yr(v) : void 0;
  !c && g && (c = gr(g, d)), !g && !c && s.push({ code: "invalid-geometry", message: `GroundOverlay “${et(n, "name") ?? "Unnamed overlay"}” has no valid LatLonBox or gx:LatLonQuad.` });
  const p = i ? await t.assetResolver?.resolve(i, t.basePath) : void 0;
  i && !p && s.push({ code: "missing-asset", message: `GroundOverlay image could not be resolved: ${i}` }), i || s.push({ code: "missing-asset", message: "A GroundOverlay has no image href." });
  const h = Lt(et(n, "color"));
  return {
    name: et(n, "name") ?? "Ground overlay",
    href: i,
    imageUrl: p,
    bounds: g,
    coordinates: c,
    rotation: d,
    drawOrder: ut(n, "drawOrder") ?? 0,
    opacity: h?.opacity ?? 1,
    folderPath: l,
    visible: e && et(n, "visibility") !== "0" && et(n, "visibility")?.toLowerCase() !== "false"
  };
}
function _r(n, l) {
  const t = st(n, "Link") ?? st(n, "Url"), s = t ? et(t, "href") : void 0;
  let e = "missing";
  if (s)
    try {
      const r = new URL(s);
      e = r.protocol === "https:" || r.protocol === "http:" ? "https" : "unsafe";
    } catch {
      e = /\.(?:kml|kmz)(?:[?#].*)?$/i.test(s) ? "archive" : "unsafe";
    }
  return { name: et(n, "name") ?? "Network link", href: s, folderPath: l, kind: e };
}
const br = /* @__PURE__ */ new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "span",
  "strong",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "u",
  "ul"
]), wr = /* @__PURE__ */ new Set(["script", "style", "iframe", "object", "embed", "form", "svg", "math"]);
function kr(n) {
  try {
    const l = new URL(n, "https://invalid.local/");
    return ["https:", "http:"].includes(l.protocol);
  } catch {
    return !1;
  }
}
function xr(n) {
  const l = document.createElement("div");
  l.innerHTML = n;
  for (const t of Array.from(l.querySelectorAll("*"))) {
    const s = t.localName.toLowerCase();
    if (wr.has(s)) {
      t.remove();
      continue;
    }
    if (!br.has(s)) {
      t.replaceWith(...Array.from(t.childNodes));
      continue;
    }
    for (const e of Array.from(t.attributes)) {
      const r = e.name.toLowerCase();
      (!(s === "a" && ["href", "title"].includes(r) || s === "img" && ["src", "alt", "title", "width", "height"].includes(r)) || r.startsWith("on")) && t.removeAttribute(e.name);
    }
    for (const e of ["href", "src"]) {
      const r = t.getAttribute(e);
      r && !kr(r) && !r.startsWith("data:image/") && t.removeAttribute(e);
    }
    s === "a" && t.hasAttribute("href") && (t.setAttribute("rel", "noopener noreferrer"), t.setAttribute("target", "_blank"));
  }
  return l.innerHTML;
}
function Cr(n) {
  return n.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function Er(n, l, t, s) {
  const e = { folderPath: l, sourceFilename: t.sourceFilename };
  for (const m of ["name", "address", "phoneNumber", "visibility", "open", "snippet"]) {
    const b = et(n, m);
    b !== void 0 && (e[m] = b);
  }
  const r = et(n, "description");
  if (r) {
    const m = hr(r);
    m ? Object.assign(e, m) : (e.description = s ? Cr(r) : xr(r), s && (e.descriptionFormat = "escaped-text"));
  }
  const i = st(n, "ExtendedData");
  if (i) {
    const m = {};
    for (const b of bt(i, "Data")) {
      const _ = b.getAttribute("name");
      _ && (m[_] = et(b, "value") ?? "");
    }
    for (const b of bt(i, "SchemaData")) {
      const _ = b.getAttribute("schemaUrl");
      _ && (e.schemaUrl = _);
      for (const g of bt(b, "SimpleData")) {
        const d = g.getAttribute("name");
        d && (m[d] = g.textContent?.trim() ?? "");
      }
    }
    e.extendedData = m, Object.assign(e, m);
  }
  const a = st(n, "TimeStamp"), u = st(n, "TimeSpan");
  a && (e.when = et(a, "when")), u && (e.begin = et(u, "begin"), e.end = et(u, "end"));
  for (const m of ["LookAt", "Camera", "Region"]) {
    const b = st(n, m);
    b && (e[m.toLowerCase()] = Object.fromEntries(Array.from(b.children).map((_) => [_t(_), _.textContent?.trim()])));
  }
  return e;
}
function Sr(n, l, t) {
  const s = st(n, "Location"), e = st(n, "Orientation"), r = st(n, "Scale"), i = st(n, "Link");
  return {
    name: et(l, "name") ?? "3D model",
    folderPath: t,
    href: i ? et(i, "href") : void 0,
    longitude: s ? ut(s, "longitude") : void 0,
    latitude: s ? ut(s, "latitude") : void 0,
    altitude: s ? ut(s, "altitude") : void 0,
    altitudeMode: et(n, "altitudeMode"),
    heading: e ? ut(e, "heading") : void 0,
    tilt: e ? ut(e, "tilt") : void 0,
    roll: e ? ut(e, "roll") : void 0,
    scaleX: r ? ut(r, "x") : void 0,
    scaleY: r ? ut(r, "y") : void 0,
    scaleZ: r ? ut(r, "z") : void 0
  };
}
function Ir(n) {
  const l = /* @__PURE__ */ new Map();
  for (const t of n) {
    const s = `${t.code}\0${t.message}`, e = l.get(s);
    e ? e.count = (e.count ?? 1) + 1 : l.set(s, { ...t, count: t.count ?? 1 });
  }
  return [...l.values()];
}
async function ee(n, l) {
  const t = ir(n), s = pr(t), e = [], r = [], i = [], a = [], u = [], m = /* @__PURE__ */ new Set(), b = t.documentElement, _ = Array.from(b.children).find((y) => ["Document", "Folder"].includes(_t(y))) ?? b, g = et(_, "name"), d = n.length > 5 * 1024 * 1024;
  d && ue(b, "description").length > 0 && e.push({ code: "partial-support", message: "Non-tabular descriptions in this large KML use escaped plain text to keep importing responsive; two-column attribute tables are retained as fields." });
  const v = (y) => y !== "0" && y?.toLowerCase() !== "false", c = async (y, x, E) => {
    const S = ["Document", "Folder"].includes(_t(y)) ? et(y, "name") : void 0, N = S ? [...x, S] : x, T = N.join(" / "), U = E && v(et(y, "visibility"));
    _t(y) === "Folder" && T && m.add(T);
    for (const z of Array.from(y.children)) {
      const j = _t(z);
      if (j === "Document" || j === "Folder")
        await c(z, N, U);
      else if (j === "Placemark") {
        const X = Er(z, T, l, d);
        X.__kmlVisible = U && v(et(z, "visibility"));
        const C = et(z, "styleUrl"), R = mr(C, st(z, "Style"), s);
        if (C && (X.styleUrl = C), R?.iconHref && l.assetResolver) {
          const P = await l.assetResolver.resolve(R.iconHref, l.basePath);
          P ? R.iconHref = P : e.push({ code: "missing-asset", message: `Marker icon could not be resolved: ${R.iconHref}` });
        }
        R && (X.__kmlStyle = R);
        const f = dr(ur(z, e));
        for (const P of f) {
          const J = { ...X };
          P.altitudeMode && (J.altitudeMode = P.altitudeMode), P.altitudeOffset !== void 0 && (J.altitudeOffset = P.altitudeOffset), P.extrude !== void 0 && (J.extrude = P.extrude), P.tessellate !== void 0 && (J.tessellate = P.tessellate), P.trackWhen && (J.trackWhen = P.trackWhen), r.push({ type: "Feature", geometry: P.geometry, properties: J });
        }
        for (const P of bt(z, "Model")) u.push(Sr(P, z, T));
      } else j === "GroundOverlay" ? i.push(await vr(z, T, l, e, U)) : j === "NetworkLink" && a.push(_r(z, T));
    }
  };
  await c(_, [], !0);
  const p = [
    ["ScreenOverlay", "ScreenOverlay"],
    ["PhotoOverlay", "PhotoOverlay"],
    ["Tour", "gx:Tour"],
    ["NetworkLinkControl", "NetworkLinkControl"],
    ["Model", "COLLADA Model"]
  ];
  for (const [y, x] of p) {
    const E = ue(b, y).length;
    E && e.push({ code: "unsupported-feature", message: `${E} ${x}${E === 1 ? " was" : "s were"} detected but cannot be displayed as 2D GeoJSON.`, count: E });
  }
  for (const y of a) {
    const x = y.kind === "unsafe" ? "uses an unsafe or unsupported URL" : "was detected; linked content is not loaded unless the user enables NetworkLink loading";
    e.push({ code: "network-link", message: `NetworkLink “${y.name}” ${x}.` });
  }
  const h = { points: 0, lines: 0, polygons: 0, groundOverlays: i.length, folders: m.size, styles: s.styles.size + s.styleMaps.size, models: u.length, networkLinks: a.length, features: r.length };
  for (const y of r) {
    const x = ve(y.geometry);
    h.points += x.points, h.lines += x.lines, h.polygons += x.polygons;
  }
  return {
    featureCollection: { type: "FeatureCollection", features: r },
    overlays: i,
    networkLinks: a,
    models: u,
    warnings: Ir(e),
    summary: h,
    documentName: g
  };
}
var Nt = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function Ar(n) {
  return n && n.__esModule && Object.prototype.hasOwnProperty.call(n, "default") ? n.default : n;
}
function Pt(n) {
  throw new Error('Could not dynamically require "' + n + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}
var Vt = { exports: {} };
var fe;
function Lr() {
  return fe || (fe = 1, (function(n, l) {
    (function(t) {
      n.exports = t();
    })(function() {
      return (function t(s, e, r) {
        function i(m, b) {
          if (!e[m]) {
            if (!s[m]) {
              var _ = typeof Pt == "function" && Pt;
              if (!b && _) return _(m, !0);
              if (a) return a(m, !0);
              var g = new Error("Cannot find module '" + m + "'");
              throw g.code = "MODULE_NOT_FOUND", g;
            }
            var d = e[m] = { exports: {} };
            s[m][0].call(d.exports, function(v) {
              var c = s[m][1][v];
              return i(c || v);
            }, d, d.exports, t, s, e, r);
          }
          return e[m].exports;
        }
        for (var a = typeof Pt == "function" && Pt, u = 0; u < r.length; u++) i(r[u]);
        return i;
      })({ 1: [function(t, s, e) {
        var r = t("./utils"), i = t("./support"), a = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        e.encode = function(u) {
          for (var m, b, _, g, d, v, c, p = [], h = 0, y = u.length, x = y, E = r.getTypeOf(u) !== "string"; h < u.length; ) x = y - h, _ = E ? (m = u[h++], b = h < y ? u[h++] : 0, h < y ? u[h++] : 0) : (m = u.charCodeAt(h++), b = h < y ? u.charCodeAt(h++) : 0, h < y ? u.charCodeAt(h++) : 0), g = m >> 2, d = (3 & m) << 4 | b >> 4, v = 1 < x ? (15 & b) << 2 | _ >> 6 : 64, c = 2 < x ? 63 & _ : 64, p.push(a.charAt(g) + a.charAt(d) + a.charAt(v) + a.charAt(c));
          return p.join("");
        }, e.decode = function(u) {
          var m, b, _, g, d, v, c = 0, p = 0, h = "data:";
          if (u.substr(0, h.length) === h) throw new Error("Invalid base64 input, it looks like a data url.");
          var y, x = 3 * (u = u.replace(/[^A-Za-z0-9+/=]/g, "")).length / 4;
          if (u.charAt(u.length - 1) === a.charAt(64) && x--, u.charAt(u.length - 2) === a.charAt(64) && x--, x % 1 != 0) throw new Error("Invalid base64 input, bad content length.");
          for (y = i.uint8array ? new Uint8Array(0 | x) : new Array(0 | x); c < u.length; ) m = a.indexOf(u.charAt(c++)) << 2 | (g = a.indexOf(u.charAt(c++))) >> 4, b = (15 & g) << 4 | (d = a.indexOf(u.charAt(c++))) >> 2, _ = (3 & d) << 6 | (v = a.indexOf(u.charAt(c++))), y[p++] = m, d !== 64 && (y[p++] = b), v !== 64 && (y[p++] = _);
          return y;
        };
      }, { "./support": 30, "./utils": 32 }], 2: [function(t, s, e) {
        var r = t("./external"), i = t("./stream/DataWorker"), a = t("./stream/Crc32Probe"), u = t("./stream/DataLengthProbe");
        function m(b, _, g, d, v) {
          this.compressedSize = b, this.uncompressedSize = _, this.crc32 = g, this.compression = d, this.compressedContent = v;
        }
        m.prototype = { getContentWorker: function() {
          var b = new i(r.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new u("data_length")), _ = this;
          return b.on("end", function() {
            if (this.streamInfo.data_length !== _.uncompressedSize) throw new Error("Bug : uncompressed data size mismatch");
          }), b;
        }, getCompressedWorker: function() {
          return new i(r.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize", this.compressedSize).withStreamInfo("uncompressedSize", this.uncompressedSize).withStreamInfo("crc32", this.crc32).withStreamInfo("compression", this.compression);
        } }, m.createWorkerFrom = function(b, _, g) {
          return b.pipe(new a()).pipe(new u("uncompressedSize")).pipe(_.compressWorker(g)).pipe(new u("compressedSize")).withStreamInfo("compression", _);
        }, s.exports = m;
      }, { "./external": 6, "./stream/Crc32Probe": 25, "./stream/DataLengthProbe": 26, "./stream/DataWorker": 27 }], 3: [function(t, s, e) {
        var r = t("./stream/GenericWorker");
        e.STORE = { magic: "\0\0", compressWorker: function() {
          return new r("STORE compression");
        }, uncompressWorker: function() {
          return new r("STORE decompression");
        } }, e.DEFLATE = t("./flate");
      }, { "./flate": 7, "./stream/GenericWorker": 28 }], 4: [function(t, s, e) {
        var r = t("./utils"), i = (function() {
          for (var a, u = [], m = 0; m < 256; m++) {
            a = m;
            for (var b = 0; b < 8; b++) a = 1 & a ? 3988292384 ^ a >>> 1 : a >>> 1;
            u[m] = a;
          }
          return u;
        })();
        s.exports = function(a, u) {
          return a !== void 0 && a.length ? r.getTypeOf(a) !== "string" ? (function(m, b, _, g) {
            var d = i, v = g + _;
            m ^= -1;
            for (var c = g; c < v; c++) m = m >>> 8 ^ d[255 & (m ^ b[c])];
            return -1 ^ m;
          })(0 | u, a, a.length, 0) : (function(m, b, _, g) {
            var d = i, v = g + _;
            m ^= -1;
            for (var c = g; c < v; c++) m = m >>> 8 ^ d[255 & (m ^ b.charCodeAt(c))];
            return -1 ^ m;
          })(0 | u, a, a.length, 0) : 0;
        };
      }, { "./utils": 32 }], 5: [function(t, s, e) {
        e.base64 = !1, e.binary = !1, e.dir = !1, e.createFolders = !0, e.date = null, e.compression = null, e.compressionOptions = null, e.comment = null, e.unixPermissions = null, e.dosPermissions = null;
      }, {}], 6: [function(t, s, e) {
        var r = null;
        r = typeof Promise < "u" ? Promise : t("lie"), s.exports = { Promise: r };
      }, { lie: 37 }], 7: [function(t, s, e) {
        var r = typeof Uint8Array < "u" && typeof Uint16Array < "u" && typeof Uint32Array < "u", i = t("pako"), a = t("./utils"), u = t("./stream/GenericWorker"), m = r ? "uint8array" : "array";
        function b(_, g) {
          u.call(this, "FlateWorker/" + _), this._pako = null, this._pakoAction = _, this._pakoOptions = g, this.meta = {};
        }
        e.magic = "\b\0", a.inherits(b, u), b.prototype.processChunk = function(_) {
          this.meta = _.meta, this._pako === null && this._createPako(), this._pako.push(a.transformTo(m, _.data), !1);
        }, b.prototype.flush = function() {
          u.prototype.flush.call(this), this._pako === null && this._createPako(), this._pako.push([], !0);
        }, b.prototype.cleanUp = function() {
          u.prototype.cleanUp.call(this), this._pako = null;
        }, b.prototype._createPako = function() {
          this._pako = new i[this._pakoAction]({ raw: !0, level: this._pakoOptions.level || -1 });
          var _ = this;
          this._pako.onData = function(g) {
            _.push({ data: g, meta: _.meta });
          };
        }, e.compressWorker = function(_) {
          return new b("Deflate", _);
        }, e.uncompressWorker = function() {
          return new b("Inflate", {});
        };
      }, { "./stream/GenericWorker": 28, "./utils": 32, pako: 38 }], 8: [function(t, s, e) {
        function r(d, v) {
          var c, p = "";
          for (c = 0; c < v; c++) p += String.fromCharCode(255 & d), d >>>= 8;
          return p;
        }
        function i(d, v, c, p, h, y) {
          var x, E, S = d.file, N = d.compression, T = y !== m.utf8encode, U = a.transformTo("string", y(S.name)), z = a.transformTo("string", m.utf8encode(S.name)), j = S.comment, X = a.transformTo("string", y(j)), C = a.transformTo("string", m.utf8encode(j)), R = z.length !== S.name.length, f = C.length !== j.length, P = "", J = "", $ = "", tt = S.dir, Z = S.date, Q = { crc32: 0, compressedSize: 0, uncompressedSize: 0 };
          v && !c || (Q.crc32 = d.crc32, Q.compressedSize = d.compressedSize, Q.uncompressedSize = d.uncompressedSize);
          var O = 0;
          v && (O |= 8), T || !R && !f || (O |= 2048);
          var L = 0, q = 0;
          tt && (L |= 16), h === "UNIX" ? (q = 798, L |= (function(K, at) {
            var ft = K;
            return K || (ft = at ? 16893 : 33204), (65535 & ft) << 16;
          })(S.unixPermissions, tt)) : (q = 20, L |= (function(K) {
            return 63 & (K || 0);
          })(S.dosPermissions)), x = Z.getUTCHours(), x <<= 6, x |= Z.getUTCMinutes(), x <<= 5, x |= Z.getUTCSeconds() / 2, E = Z.getUTCFullYear() - 1980, E <<= 4, E |= Z.getUTCMonth() + 1, E <<= 5, E |= Z.getUTCDate(), R && (J = r(1, 1) + r(b(U), 4) + z, P += "up" + r(J.length, 2) + J), f && ($ = r(1, 1) + r(b(X), 4) + C, P += "uc" + r($.length, 2) + $);
          var H = "";
          return H += `
\0`, H += r(O, 2), H += N.magic, H += r(x, 2), H += r(E, 2), H += r(Q.crc32, 4), H += r(Q.compressedSize, 4), H += r(Q.uncompressedSize, 4), H += r(U.length, 2), H += r(P.length, 2), { fileRecord: _.LOCAL_FILE_HEADER + H + U + P, dirRecord: _.CENTRAL_FILE_HEADER + r(q, 2) + H + r(X.length, 2) + "\0\0\0\0" + r(L, 4) + r(p, 4) + U + P + X };
        }
        var a = t("../utils"), u = t("../stream/GenericWorker"), m = t("../utf8"), b = t("../crc32"), _ = t("../signature");
        function g(d, v, c, p) {
          u.call(this, "ZipFileWorker"), this.bytesWritten = 0, this.zipComment = v, this.zipPlatform = c, this.encodeFileName = p, this.streamFiles = d, this.accumulate = !1, this.contentBuffer = [], this.dirRecords = [], this.currentSourceOffset = 0, this.entriesCount = 0, this.currentFile = null, this._sources = [];
        }
        a.inherits(g, u), g.prototype.push = function(d) {
          var v = d.meta.percent || 0, c = this.entriesCount, p = this._sources.length;
          this.accumulate ? this.contentBuffer.push(d) : (this.bytesWritten += d.data.length, u.prototype.push.call(this, { data: d.data, meta: { currentFile: this.currentFile, percent: c ? (v + 100 * (c - p - 1)) / c : 100 } }));
        }, g.prototype.openedSource = function(d) {
          this.currentSourceOffset = this.bytesWritten, this.currentFile = d.file.name;
          var v = this.streamFiles && !d.file.dir;
          if (v) {
            var c = i(d, v, !1, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
            this.push({ data: c.fileRecord, meta: { percent: 0 } });
          } else this.accumulate = !0;
        }, g.prototype.closedSource = function(d) {
          this.accumulate = !1;
          var v = this.streamFiles && !d.file.dir, c = i(d, v, !0, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
          if (this.dirRecords.push(c.dirRecord), v) this.push({ data: (function(p) {
            return _.DATA_DESCRIPTOR + r(p.crc32, 4) + r(p.compressedSize, 4) + r(p.uncompressedSize, 4);
          })(d), meta: { percent: 100 } });
          else for (this.push({ data: c.fileRecord, meta: { percent: 0 } }); this.contentBuffer.length; ) this.push(this.contentBuffer.shift());
          this.currentFile = null;
        }, g.prototype.flush = function() {
          for (var d = this.bytesWritten, v = 0; v < this.dirRecords.length; v++) this.push({ data: this.dirRecords[v], meta: { percent: 100 } });
          var c = this.bytesWritten - d, p = (function(h, y, x, E, S) {
            var N = a.transformTo("string", S(E));
            return _.CENTRAL_DIRECTORY_END + "\0\0\0\0" + r(h, 2) + r(h, 2) + r(y, 4) + r(x, 4) + r(N.length, 2) + N;
          })(this.dirRecords.length, c, d, this.zipComment, this.encodeFileName);
          this.push({ data: p, meta: { percent: 100 } });
        }, g.prototype.prepareNextSource = function() {
          this.previous = this._sources.shift(), this.openedSource(this.previous.streamInfo), this.isPaused ? this.previous.pause() : this.previous.resume();
        }, g.prototype.registerPrevious = function(d) {
          this._sources.push(d);
          var v = this;
          return d.on("data", function(c) {
            v.processChunk(c);
          }), d.on("end", function() {
            v.closedSource(v.previous.streamInfo), v._sources.length ? v.prepareNextSource() : v.end();
          }), d.on("error", function(c) {
            v.error(c);
          }), this;
        }, g.prototype.resume = function() {
          return !!u.prototype.resume.call(this) && (!this.previous && this._sources.length ? (this.prepareNextSource(), !0) : this.previous || this._sources.length || this.generatedError ? void 0 : (this.end(), !0));
        }, g.prototype.error = function(d) {
          var v = this._sources;
          if (!u.prototype.error.call(this, d)) return !1;
          for (var c = 0; c < v.length; c++) try {
            v[c].error(d);
          } catch {
          }
          return !0;
        }, g.prototype.lock = function() {
          u.prototype.lock.call(this);
          for (var d = this._sources, v = 0; v < d.length; v++) d[v].lock();
        }, s.exports = g;
      }, { "../crc32": 4, "../signature": 23, "../stream/GenericWorker": 28, "../utf8": 31, "../utils": 32 }], 9: [function(t, s, e) {
        var r = t("../compressions"), i = t("./ZipFileWorker");
        e.generateWorker = function(a, u, m) {
          var b = new i(u.streamFiles, m, u.platform, u.encodeFileName), _ = 0;
          try {
            a.forEach(function(g, d) {
              _++;
              var v = (function(y, x) {
                var E = y || x, S = r[E];
                if (!S) throw new Error(E + " is not a valid compression method !");
                return S;
              })(d.options.compression, u.compression), c = d.options.compressionOptions || u.compressionOptions || {}, p = d.dir, h = d.date;
              d._compressWorker(v, c).withStreamInfo("file", { name: g, dir: p, date: h, comment: d.comment || "", unixPermissions: d.unixPermissions, dosPermissions: d.dosPermissions }).pipe(b);
            }), b.entriesCount = _;
          } catch (g) {
            b.error(g);
          }
          return b;
        };
      }, { "../compressions": 3, "./ZipFileWorker": 8 }], 10: [function(t, s, e) {
        function r() {
          if (!(this instanceof r)) return new r();
          if (arguments.length) throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
          this.files = /* @__PURE__ */ Object.create(null), this.comment = null, this.root = "", this.clone = function() {
            var i = new r();
            for (var a in this) typeof this[a] != "function" && (i[a] = this[a]);
            return i;
          };
        }
        (r.prototype = t("./object")).loadAsync = t("./load"), r.support = t("./support"), r.defaults = t("./defaults"), r.version = "3.10.1", r.loadAsync = function(i, a) {
          return new r().loadAsync(i, a);
        }, r.external = t("./external"), s.exports = r;
      }, { "./defaults": 5, "./external": 6, "./load": 11, "./object": 15, "./support": 30 }], 11: [function(t, s, e) {
        var r = t("./utils"), i = t("./external"), a = t("./utf8"), u = t("./zipEntries"), m = t("./stream/Crc32Probe"), b = t("./nodejsUtils");
        function _(g) {
          return new i.Promise(function(d, v) {
            var c = g.decompressed.getContentWorker().pipe(new m());
            c.on("error", function(p) {
              v(p);
            }).on("end", function() {
              c.streamInfo.crc32 !== g.decompressed.crc32 ? v(new Error("Corrupted zip : CRC32 mismatch")) : d();
            }).resume();
          });
        }
        s.exports = function(g, d) {
          var v = this;
          return d = r.extend(d || {}, { base64: !1, checkCRC32: !1, optimizedBinaryString: !1, createFolders: !1, decodeFileName: a.utf8decode }), b.isNode && b.isStream(g) ? i.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")) : r.prepareContent("the loaded zip file", g, !0, d.optimizedBinaryString, d.base64).then(function(c) {
            var p = new u(d);
            return p.load(c), p;
          }).then(function(c) {
            var p = [i.Promise.resolve(c)], h = c.files;
            if (d.checkCRC32) for (var y = 0; y < h.length; y++) p.push(_(h[y]));
            return i.Promise.all(p);
          }).then(function(c) {
            for (var p = c.shift(), h = p.files, y = 0; y < h.length; y++) {
              var x = h[y], E = x.fileNameStr, S = r.resolve(x.fileNameStr);
              v.file(S, x.decompressed, { binary: !0, optimizedBinaryString: !0, date: x.date, dir: x.dir, comment: x.fileCommentStr.length ? x.fileCommentStr : null, unixPermissions: x.unixPermissions, dosPermissions: x.dosPermissions, createFolders: d.createFolders }), x.dir || (v.file(S).unsafeOriginalName = E);
            }
            return p.zipComment.length && (v.comment = p.zipComment), v;
          });
        };
      }, { "./external": 6, "./nodejsUtils": 14, "./stream/Crc32Probe": 25, "./utf8": 31, "./utils": 32, "./zipEntries": 33 }], 12: [function(t, s, e) {
        var r = t("../utils"), i = t("../stream/GenericWorker");
        function a(u, m) {
          i.call(this, "Nodejs stream input adapter for " + u), this._upstreamEnded = !1, this._bindStream(m);
        }
        r.inherits(a, i), a.prototype._bindStream = function(u) {
          var m = this;
          (this._stream = u).pause(), u.on("data", function(b) {
            m.push({ data: b, meta: { percent: 0 } });
          }).on("error", function(b) {
            m.isPaused ? this.generatedError = b : m.error(b);
          }).on("end", function() {
            m.isPaused ? m._upstreamEnded = !0 : m.end();
          });
        }, a.prototype.pause = function() {
          return !!i.prototype.pause.call(this) && (this._stream.pause(), !0);
        }, a.prototype.resume = function() {
          return !!i.prototype.resume.call(this) && (this._upstreamEnded ? this.end() : this._stream.resume(), !0);
        }, s.exports = a;
      }, { "../stream/GenericWorker": 28, "../utils": 32 }], 13: [function(t, s, e) {
        var r = t("readable-stream").Readable;
        function i(a, u, m) {
          r.call(this, u), this._helper = a;
          var b = this;
          a.on("data", function(_, g) {
            b.push(_) || b._helper.pause(), m && m(g);
          }).on("error", function(_) {
            b.emit("error", _);
          }).on("end", function() {
            b.push(null);
          });
        }
        t("../utils").inherits(i, r), i.prototype._read = function() {
          this._helper.resume();
        }, s.exports = i;
      }, { "../utils": 32, "readable-stream": 16 }], 14: [function(t, s, e) {
        s.exports = { isNode: typeof Buffer < "u", newBufferFrom: function(r, i) {
          if (Buffer.from && Buffer.from !== Uint8Array.from) return Buffer.from(r, i);
          if (typeof r == "number") throw new Error('The "data" argument must not be a number');
          return new Buffer(r, i);
        }, allocBuffer: function(r) {
          if (Buffer.alloc) return Buffer.alloc(r);
          var i = new Buffer(r);
          return i.fill(0), i;
        }, isBuffer: function(r) {
          return Buffer.isBuffer(r);
        }, isStream: function(r) {
          return r && typeof r.on == "function" && typeof r.pause == "function" && typeof r.resume == "function";
        } };
      }, {}], 15: [function(t, s, e) {
        function r(S, N, T) {
          var U, z = a.getTypeOf(N), j = a.extend(T || {}, b);
          j.date = j.date || /* @__PURE__ */ new Date(), j.compression !== null && (j.compression = j.compression.toUpperCase()), typeof j.unixPermissions == "string" && (j.unixPermissions = parseInt(j.unixPermissions, 8)), j.unixPermissions && 16384 & j.unixPermissions && (j.dir = !0), j.dosPermissions && 16 & j.dosPermissions && (j.dir = !0), j.dir && (S = h(S)), j.createFolders && (U = p(S)) && y.call(this, U, !0);
          var X = z === "string" && j.binary === !1 && j.base64 === !1;
          T && T.binary !== void 0 || (j.binary = !X), (N instanceof _ && N.uncompressedSize === 0 || j.dir || !N || N.length === 0) && (j.base64 = !1, j.binary = !0, N = "", j.compression = "STORE", z = "string");
          var C = null;
          C = N instanceof _ || N instanceof u ? N : v.isNode && v.isStream(N) ? new c(S, N) : a.prepareContent(S, N, j.binary, j.optimizedBinaryString, j.base64);
          var R = new g(S, C, j);
          this.files[S] = R;
        }
        var i = t("./utf8"), a = t("./utils"), u = t("./stream/GenericWorker"), m = t("./stream/StreamHelper"), b = t("./defaults"), _ = t("./compressedObject"), g = t("./zipObject"), d = t("./generate"), v = t("./nodejsUtils"), c = t("./nodejs/NodejsStreamInputAdapter"), p = function(S) {
          S.slice(-1) === "/" && (S = S.substring(0, S.length - 1));
          var N = S.lastIndexOf("/");
          return 0 < N ? S.substring(0, N) : "";
        }, h = function(S) {
          return S.slice(-1) !== "/" && (S += "/"), S;
        }, y = function(S, N) {
          return N = N !== void 0 ? N : b.createFolders, S = h(S), this.files[S] || r.call(this, S, null, { dir: !0, createFolders: N }), this.files[S];
        };
        function x(S) {
          return Object.prototype.toString.call(S) === "[object RegExp]";
        }
        var E = { load: function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, forEach: function(S) {
          var N, T, U;
          for (N in this.files) U = this.files[N], (T = N.slice(this.root.length, N.length)) && N.slice(0, this.root.length) === this.root && S(T, U);
        }, filter: function(S) {
          var N = [];
          return this.forEach(function(T, U) {
            S(T, U) && N.push(U);
          }), N;
        }, file: function(S, N, T) {
          if (arguments.length !== 1) return S = this.root + S, r.call(this, S, N, T), this;
          if (x(S)) {
            var U = S;
            return this.filter(function(j, X) {
              return !X.dir && U.test(j);
            });
          }
          var z = this.files[this.root + S];
          return z && !z.dir ? z : null;
        }, folder: function(S) {
          if (!S) return this;
          if (x(S)) return this.filter(function(z, j) {
            return j.dir && S.test(z);
          });
          var N = this.root + S, T = y.call(this, N), U = this.clone();
          return U.root = T.name, U;
        }, remove: function(S) {
          S = this.root + S;
          var N = this.files[S];
          if (N || (S.slice(-1) !== "/" && (S += "/"), N = this.files[S]), N && !N.dir) delete this.files[S];
          else for (var T = this.filter(function(z, j) {
            return j.name.slice(0, S.length) === S;
          }), U = 0; U < T.length; U++) delete this.files[T[U].name];
          return this;
        }, generate: function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, generateInternalStream: function(S) {
          var N, T = {};
          try {
            if ((T = a.extend(S || {}, { streamFiles: !1, compression: "STORE", compressionOptions: null, type: "", platform: "DOS", comment: null, mimeType: "application/zip", encodeFileName: i.utf8encode })).type = T.type.toLowerCase(), T.compression = T.compression.toUpperCase(), T.type === "binarystring" && (T.type = "string"), !T.type) throw new Error("No output type specified.");
            a.checkSupport(T.type), T.platform !== "darwin" && T.platform !== "freebsd" && T.platform !== "linux" && T.platform !== "sunos" || (T.platform = "UNIX"), T.platform === "win32" && (T.platform = "DOS");
            var U = T.comment || this.comment || "";
            N = d.generateWorker(this, T, U);
          } catch (z) {
            (N = new u("error")).error(z);
          }
          return new m(N, T.type || "string", T.mimeType);
        }, generateAsync: function(S, N) {
          return this.generateInternalStream(S).accumulate(N);
        }, generateNodeStream: function(S, N) {
          return (S = S || {}).type || (S.type = "nodebuffer"), this.generateInternalStream(S).toNodejsStream(N);
        } };
        s.exports = E;
      }, { "./compressedObject": 2, "./defaults": 5, "./generate": 9, "./nodejs/NodejsStreamInputAdapter": 12, "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31, "./utils": 32, "./zipObject": 35 }], 16: [function(t, s, e) {
        s.exports = t("stream");
      }, { stream: void 0 }], 17: [function(t, s, e) {
        var r = t("./DataReader");
        function i(a) {
          r.call(this, a);
          for (var u = 0; u < this.data.length; u++) a[u] = 255 & a[u];
        }
        t("../utils").inherits(i, r), i.prototype.byteAt = function(a) {
          return this.data[this.zero + a];
        }, i.prototype.lastIndexOfSignature = function(a) {
          for (var u = a.charCodeAt(0), m = a.charCodeAt(1), b = a.charCodeAt(2), _ = a.charCodeAt(3), g = this.length - 4; 0 <= g; --g) if (this.data[g] === u && this.data[g + 1] === m && this.data[g + 2] === b && this.data[g + 3] === _) return g - this.zero;
          return -1;
        }, i.prototype.readAndCheckSignature = function(a) {
          var u = a.charCodeAt(0), m = a.charCodeAt(1), b = a.charCodeAt(2), _ = a.charCodeAt(3), g = this.readData(4);
          return u === g[0] && m === g[1] && b === g[2] && _ === g[3];
        }, i.prototype.readData = function(a) {
          if (this.checkOffset(a), a === 0) return [];
          var u = this.data.slice(this.zero + this.index, this.zero + this.index + a);
          return this.index += a, u;
        }, s.exports = i;
      }, { "../utils": 32, "./DataReader": 18 }], 18: [function(t, s, e) {
        var r = t("../utils");
        function i(a) {
          this.data = a, this.length = a.length, this.index = 0, this.zero = 0;
        }
        i.prototype = { checkOffset: function(a) {
          this.checkIndex(this.index + a);
        }, checkIndex: function(a) {
          if (this.length < this.zero + a || a < 0) throw new Error("End of data reached (data length = " + this.length + ", asked index = " + a + "). Corrupted zip ?");
        }, setIndex: function(a) {
          this.checkIndex(a), this.index = a;
        }, skip: function(a) {
          this.setIndex(this.index + a);
        }, byteAt: function() {
        }, readInt: function(a) {
          var u, m = 0;
          for (this.checkOffset(a), u = this.index + a - 1; u >= this.index; u--) m = (m << 8) + this.byteAt(u);
          return this.index += a, m;
        }, readString: function(a) {
          return r.transformTo("string", this.readData(a));
        }, readData: function() {
        }, lastIndexOfSignature: function() {
        }, readAndCheckSignature: function() {
        }, readDate: function() {
          var a = this.readInt(4);
          return new Date(Date.UTC(1980 + (a >> 25 & 127), (a >> 21 & 15) - 1, a >> 16 & 31, a >> 11 & 31, a >> 5 & 63, (31 & a) << 1));
        } }, s.exports = i;
      }, { "../utils": 32 }], 19: [function(t, s, e) {
        var r = t("./Uint8ArrayReader");
        function i(a) {
          r.call(this, a);
        }
        t("../utils").inherits(i, r), i.prototype.readData = function(a) {
          this.checkOffset(a);
          var u = this.data.slice(this.zero + this.index, this.zero + this.index + a);
          return this.index += a, u;
        }, s.exports = i;
      }, { "../utils": 32, "./Uint8ArrayReader": 21 }], 20: [function(t, s, e) {
        var r = t("./DataReader");
        function i(a) {
          r.call(this, a);
        }
        t("../utils").inherits(i, r), i.prototype.byteAt = function(a) {
          return this.data.charCodeAt(this.zero + a);
        }, i.prototype.lastIndexOfSignature = function(a) {
          return this.data.lastIndexOf(a) - this.zero;
        }, i.prototype.readAndCheckSignature = function(a) {
          return a === this.readData(4);
        }, i.prototype.readData = function(a) {
          this.checkOffset(a);
          var u = this.data.slice(this.zero + this.index, this.zero + this.index + a);
          return this.index += a, u;
        }, s.exports = i;
      }, { "../utils": 32, "./DataReader": 18 }], 21: [function(t, s, e) {
        var r = t("./ArrayReader");
        function i(a) {
          r.call(this, a);
        }
        t("../utils").inherits(i, r), i.prototype.readData = function(a) {
          if (this.checkOffset(a), a === 0) return new Uint8Array(0);
          var u = this.data.subarray(this.zero + this.index, this.zero + this.index + a);
          return this.index += a, u;
        }, s.exports = i;
      }, { "../utils": 32, "./ArrayReader": 17 }], 22: [function(t, s, e) {
        var r = t("../utils"), i = t("../support"), a = t("./ArrayReader"), u = t("./StringReader"), m = t("./NodeBufferReader"), b = t("./Uint8ArrayReader");
        s.exports = function(_) {
          var g = r.getTypeOf(_);
          return r.checkSupport(g), g !== "string" || i.uint8array ? g === "nodebuffer" ? new m(_) : i.uint8array ? new b(r.transformTo("uint8array", _)) : new a(r.transformTo("array", _)) : new u(_);
        };
      }, { "../support": 30, "../utils": 32, "./ArrayReader": 17, "./NodeBufferReader": 19, "./StringReader": 20, "./Uint8ArrayReader": 21 }], 23: [function(t, s, e) {
        e.LOCAL_FILE_HEADER = "PK", e.CENTRAL_FILE_HEADER = "PK", e.CENTRAL_DIRECTORY_END = "PK", e.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x07", e.ZIP64_CENTRAL_DIRECTORY_END = "PK", e.DATA_DESCRIPTOR = "PK\x07\b";
      }, {}], 24: [function(t, s, e) {
        var r = t("./GenericWorker"), i = t("../utils");
        function a(u) {
          r.call(this, "ConvertWorker to " + u), this.destType = u;
        }
        i.inherits(a, r), a.prototype.processChunk = function(u) {
          this.push({ data: i.transformTo(this.destType, u.data), meta: u.meta });
        }, s.exports = a;
      }, { "../utils": 32, "./GenericWorker": 28 }], 25: [function(t, s, e) {
        var r = t("./GenericWorker"), i = t("../crc32");
        function a() {
          r.call(this, "Crc32Probe"), this.withStreamInfo("crc32", 0);
        }
        t("../utils").inherits(a, r), a.prototype.processChunk = function(u) {
          this.streamInfo.crc32 = i(u.data, this.streamInfo.crc32 || 0), this.push(u);
        }, s.exports = a;
      }, { "../crc32": 4, "../utils": 32, "./GenericWorker": 28 }], 26: [function(t, s, e) {
        var r = t("../utils"), i = t("./GenericWorker");
        function a(u) {
          i.call(this, "DataLengthProbe for " + u), this.propName = u, this.withStreamInfo(u, 0);
        }
        r.inherits(a, i), a.prototype.processChunk = function(u) {
          if (u) {
            var m = this.streamInfo[this.propName] || 0;
            this.streamInfo[this.propName] = m + u.data.length;
          }
          i.prototype.processChunk.call(this, u);
        }, s.exports = a;
      }, { "../utils": 32, "./GenericWorker": 28 }], 27: [function(t, s, e) {
        var r = t("../utils"), i = t("./GenericWorker");
        function a(u) {
          i.call(this, "DataWorker");
          var m = this;
          this.dataIsReady = !1, this.index = 0, this.max = 0, this.data = null, this.type = "", this._tickScheduled = !1, u.then(function(b) {
            m.dataIsReady = !0, m.data = b, m.max = b && b.length || 0, m.type = r.getTypeOf(b), m.isPaused || m._tickAndRepeat();
          }, function(b) {
            m.error(b);
          });
        }
        r.inherits(a, i), a.prototype.cleanUp = function() {
          i.prototype.cleanUp.call(this), this.data = null;
        }, a.prototype.resume = function() {
          return !!i.prototype.resume.call(this) && (!this._tickScheduled && this.dataIsReady && (this._tickScheduled = !0, r.delay(this._tickAndRepeat, [], this)), !0);
        }, a.prototype._tickAndRepeat = function() {
          this._tickScheduled = !1, this.isPaused || this.isFinished || (this._tick(), this.isFinished || (r.delay(this._tickAndRepeat, [], this), this._tickScheduled = !0));
        }, a.prototype._tick = function() {
          if (this.isPaused || this.isFinished) return !1;
          var u = null, m = Math.min(this.max, this.index + 16384);
          if (this.index >= this.max) return this.end();
          switch (this.type) {
            case "string":
              u = this.data.substring(this.index, m);
              break;
            case "uint8array":
              u = this.data.subarray(this.index, m);
              break;
            case "array":
            case "nodebuffer":
              u = this.data.slice(this.index, m);
          }
          return this.index = m, this.push({ data: u, meta: { percent: this.max ? this.index / this.max * 100 : 0 } });
        }, s.exports = a;
      }, { "../utils": 32, "./GenericWorker": 28 }], 28: [function(t, s, e) {
        function r(i) {
          this.name = i || "default", this.streamInfo = {}, this.generatedError = null, this.extraStreamInfo = {}, this.isPaused = !0, this.isFinished = !1, this.isLocked = !1, this._listeners = { data: [], end: [], error: [] }, this.previous = null;
        }
        r.prototype = { push: function(i) {
          this.emit("data", i);
        }, end: function() {
          if (this.isFinished) return !1;
          this.flush();
          try {
            this.emit("end"), this.cleanUp(), this.isFinished = !0;
          } catch (i) {
            this.emit("error", i);
          }
          return !0;
        }, error: function(i) {
          return !this.isFinished && (this.isPaused ? this.generatedError = i : (this.isFinished = !0, this.emit("error", i), this.previous && this.previous.error(i), this.cleanUp()), !0);
        }, on: function(i, a) {
          return this._listeners[i].push(a), this;
        }, cleanUp: function() {
          this.streamInfo = this.generatedError = this.extraStreamInfo = null, this._listeners = [];
        }, emit: function(i, a) {
          if (this._listeners[i]) for (var u = 0; u < this._listeners[i].length; u++) this._listeners[i][u].call(this, a);
        }, pipe: function(i) {
          return i.registerPrevious(this);
        }, registerPrevious: function(i) {
          if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
          this.streamInfo = i.streamInfo, this.mergeStreamInfo(), this.previous = i;
          var a = this;
          return i.on("data", function(u) {
            a.processChunk(u);
          }), i.on("end", function() {
            a.end();
          }), i.on("error", function(u) {
            a.error(u);
          }), this;
        }, pause: function() {
          return !this.isPaused && !this.isFinished && (this.isPaused = !0, this.previous && this.previous.pause(), !0);
        }, resume: function() {
          if (!this.isPaused || this.isFinished) return !1;
          var i = this.isPaused = !1;
          return this.generatedError && (this.error(this.generatedError), i = !0), this.previous && this.previous.resume(), !i;
        }, flush: function() {
        }, processChunk: function(i) {
          this.push(i);
        }, withStreamInfo: function(i, a) {
          return this.extraStreamInfo[i] = a, this.mergeStreamInfo(), this;
        }, mergeStreamInfo: function() {
          for (var i in this.extraStreamInfo) Object.prototype.hasOwnProperty.call(this.extraStreamInfo, i) && (this.streamInfo[i] = this.extraStreamInfo[i]);
        }, lock: function() {
          if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
          this.isLocked = !0, this.previous && this.previous.lock();
        }, toString: function() {
          var i = "Worker " + this.name;
          return this.previous ? this.previous + " -> " + i : i;
        } }, s.exports = r;
      }, {}], 29: [function(t, s, e) {
        var r = t("../utils"), i = t("./ConvertWorker"), a = t("./GenericWorker"), u = t("../base64"), m = t("../support"), b = t("../external"), _ = null;
        if (m.nodestream) try {
          _ = t("../nodejs/NodejsStreamOutputAdapter");
        } catch {
        }
        function g(v, c) {
          return new b.Promise(function(p, h) {
            var y = [], x = v._internalType, E = v._outputType, S = v._mimeType;
            v.on("data", function(N, T) {
              y.push(N), c && c(T);
            }).on("error", function(N) {
              y = [], h(N);
            }).on("end", function() {
              try {
                var N = (function(T, U, z) {
                  switch (T) {
                    case "blob":
                      return r.newBlob(r.transformTo("arraybuffer", U), z);
                    case "base64":
                      return u.encode(U);
                    default:
                      return r.transformTo(T, U);
                  }
                })(E, (function(T, U) {
                  var z, j = 0, X = null, C = 0;
                  for (z = 0; z < U.length; z++) C += U[z].length;
                  switch (T) {
                    case "string":
                      return U.join("");
                    case "array":
                      return Array.prototype.concat.apply([], U);
                    case "uint8array":
                      for (X = new Uint8Array(C), z = 0; z < U.length; z++) X.set(U[z], j), j += U[z].length;
                      return X;
                    case "nodebuffer":
                      return Buffer.concat(U);
                    default:
                      throw new Error("concat : unsupported type '" + T + "'");
                  }
                })(x, y), S);
                p(N);
              } catch (T) {
                h(T);
              }
              y = [];
            }).resume();
          });
        }
        function d(v, c, p) {
          var h = c;
          switch (c) {
            case "blob":
            case "arraybuffer":
              h = "uint8array";
              break;
            case "base64":
              h = "string";
          }
          try {
            this._internalType = h, this._outputType = c, this._mimeType = p, r.checkSupport(h), this._worker = v.pipe(new i(h)), v.lock();
          } catch (y) {
            this._worker = new a("error"), this._worker.error(y);
          }
        }
        d.prototype = { accumulate: function(v) {
          return g(this, v);
        }, on: function(v, c) {
          var p = this;
          return v === "data" ? this._worker.on(v, function(h) {
            c.call(p, h.data, h.meta);
          }) : this._worker.on(v, function() {
            r.delay(c, arguments, p);
          }), this;
        }, resume: function() {
          return r.delay(this._worker.resume, [], this._worker), this;
        }, pause: function() {
          return this._worker.pause(), this;
        }, toNodejsStream: function(v) {
          if (r.checkSupport("nodestream"), this._outputType !== "nodebuffer") throw new Error(this._outputType + " is not supported by this method");
          return new _(this, { objectMode: this._outputType !== "nodebuffer" }, v);
        } }, s.exports = d;
      }, { "../base64": 1, "../external": 6, "../nodejs/NodejsStreamOutputAdapter": 13, "../support": 30, "../utils": 32, "./ConvertWorker": 24, "./GenericWorker": 28 }], 30: [function(t, s, e) {
        if (e.base64 = !0, e.array = !0, e.string = !0, e.arraybuffer = typeof ArrayBuffer < "u" && typeof Uint8Array < "u", e.nodebuffer = typeof Buffer < "u", e.uint8array = typeof Uint8Array < "u", typeof ArrayBuffer > "u") e.blob = !1;
        else {
          var r = new ArrayBuffer(0);
          try {
            e.blob = new Blob([r], { type: "application/zip" }).size === 0;
          } catch {
            try {
              var i = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
              i.append(r), e.blob = i.getBlob("application/zip").size === 0;
            } catch {
              e.blob = !1;
            }
          }
        }
        try {
          e.nodestream = !!t("readable-stream").Readable;
        } catch {
          e.nodestream = !1;
        }
      }, { "readable-stream": 16 }], 31: [function(t, s, e) {
        for (var r = t("./utils"), i = t("./support"), a = t("./nodejsUtils"), u = t("./stream/GenericWorker"), m = new Array(256), b = 0; b < 256; b++) m[b] = 252 <= b ? 6 : 248 <= b ? 5 : 240 <= b ? 4 : 224 <= b ? 3 : 192 <= b ? 2 : 1;
        m[254] = m[254] = 1;
        function _() {
          u.call(this, "utf-8 decode"), this.leftOver = null;
        }
        function g() {
          u.call(this, "utf-8 encode");
        }
        e.utf8encode = function(d) {
          return i.nodebuffer ? a.newBufferFrom(d, "utf-8") : (function(v) {
            var c, p, h, y, x, E = v.length, S = 0;
            for (y = 0; y < E; y++) (64512 & (p = v.charCodeAt(y))) == 55296 && y + 1 < E && (64512 & (h = v.charCodeAt(y + 1))) == 56320 && (p = 65536 + (p - 55296 << 10) + (h - 56320), y++), S += p < 128 ? 1 : p < 2048 ? 2 : p < 65536 ? 3 : 4;
            for (c = i.uint8array ? new Uint8Array(S) : new Array(S), y = x = 0; x < S; y++) (64512 & (p = v.charCodeAt(y))) == 55296 && y + 1 < E && (64512 & (h = v.charCodeAt(y + 1))) == 56320 && (p = 65536 + (p - 55296 << 10) + (h - 56320), y++), p < 128 ? c[x++] = p : (p < 2048 ? c[x++] = 192 | p >>> 6 : (p < 65536 ? c[x++] = 224 | p >>> 12 : (c[x++] = 240 | p >>> 18, c[x++] = 128 | p >>> 12 & 63), c[x++] = 128 | p >>> 6 & 63), c[x++] = 128 | 63 & p);
            return c;
          })(d);
        }, e.utf8decode = function(d) {
          return i.nodebuffer ? r.transformTo("nodebuffer", d).toString("utf-8") : (function(v) {
            var c, p, h, y, x = v.length, E = new Array(2 * x);
            for (c = p = 0; c < x; ) if ((h = v[c++]) < 128) E[p++] = h;
            else if (4 < (y = m[h])) E[p++] = 65533, c += y - 1;
            else {
              for (h &= y === 2 ? 31 : y === 3 ? 15 : 7; 1 < y && c < x; ) h = h << 6 | 63 & v[c++], y--;
              1 < y ? E[p++] = 65533 : h < 65536 ? E[p++] = h : (h -= 65536, E[p++] = 55296 | h >> 10 & 1023, E[p++] = 56320 | 1023 & h);
            }
            return E.length !== p && (E.subarray ? E = E.subarray(0, p) : E.length = p), r.applyFromCharCode(E);
          })(d = r.transformTo(i.uint8array ? "uint8array" : "array", d));
        }, r.inherits(_, u), _.prototype.processChunk = function(d) {
          var v = r.transformTo(i.uint8array ? "uint8array" : "array", d.data);
          if (this.leftOver && this.leftOver.length) {
            if (i.uint8array) {
              var c = v;
              (v = new Uint8Array(c.length + this.leftOver.length)).set(this.leftOver, 0), v.set(c, this.leftOver.length);
            } else v = this.leftOver.concat(v);
            this.leftOver = null;
          }
          var p = (function(y, x) {
            var E;
            for ((x = x || y.length) > y.length && (x = y.length), E = x - 1; 0 <= E && (192 & y[E]) == 128; ) E--;
            return E < 0 || E === 0 ? x : E + m[y[E]] > x ? E : x;
          })(v), h = v;
          p !== v.length && (i.uint8array ? (h = v.subarray(0, p), this.leftOver = v.subarray(p, v.length)) : (h = v.slice(0, p), this.leftOver = v.slice(p, v.length))), this.push({ data: e.utf8decode(h), meta: d.meta });
        }, _.prototype.flush = function() {
          this.leftOver && this.leftOver.length && (this.push({ data: e.utf8decode(this.leftOver), meta: {} }), this.leftOver = null);
        }, e.Utf8DecodeWorker = _, r.inherits(g, u), g.prototype.processChunk = function(d) {
          this.push({ data: e.utf8encode(d.data), meta: d.meta });
        }, e.Utf8EncodeWorker = g;
      }, { "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./support": 30, "./utils": 32 }], 32: [function(t, s, e) {
        var r = t("./support"), i = t("./base64"), a = t("./nodejsUtils"), u = t("./external");
        function m(c) {
          return c;
        }
        function b(c, p) {
          for (var h = 0; h < c.length; ++h) p[h] = 255 & c.charCodeAt(h);
          return p;
        }
        t("setimmediate"), e.newBlob = function(c, p) {
          e.checkSupport("blob");
          try {
            return new Blob([c], { type: p });
          } catch {
            try {
              var h = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
              return h.append(c), h.getBlob(p);
            } catch {
              throw new Error("Bug : can't construct the Blob.");
            }
          }
        };
        var _ = { stringifyByChunk: function(c, p, h) {
          var y = [], x = 0, E = c.length;
          if (E <= h) return String.fromCharCode.apply(null, c);
          for (; x < E; ) p === "array" || p === "nodebuffer" ? y.push(String.fromCharCode.apply(null, c.slice(x, Math.min(x + h, E)))) : y.push(String.fromCharCode.apply(null, c.subarray(x, Math.min(x + h, E)))), x += h;
          return y.join("");
        }, stringifyByChar: function(c) {
          for (var p = "", h = 0; h < c.length; h++) p += String.fromCharCode(c[h]);
          return p;
        }, applyCanBeUsed: { uint8array: (function() {
          try {
            return r.uint8array && String.fromCharCode.apply(null, new Uint8Array(1)).length === 1;
          } catch {
            return !1;
          }
        })(), nodebuffer: (function() {
          try {
            return r.nodebuffer && String.fromCharCode.apply(null, a.allocBuffer(1)).length === 1;
          } catch {
            return !1;
          }
        })() } };
        function g(c) {
          var p = 65536, h = e.getTypeOf(c), y = !0;
          if (h === "uint8array" ? y = _.applyCanBeUsed.uint8array : h === "nodebuffer" && (y = _.applyCanBeUsed.nodebuffer), y) for (; 1 < p; ) try {
            return _.stringifyByChunk(c, h, p);
          } catch {
            p = Math.floor(p / 2);
          }
          return _.stringifyByChar(c);
        }
        function d(c, p) {
          for (var h = 0; h < c.length; h++) p[h] = c[h];
          return p;
        }
        e.applyFromCharCode = g;
        var v = {};
        v.string = { string: m, array: function(c) {
          return b(c, new Array(c.length));
        }, arraybuffer: function(c) {
          return v.string.uint8array(c).buffer;
        }, uint8array: function(c) {
          return b(c, new Uint8Array(c.length));
        }, nodebuffer: function(c) {
          return b(c, a.allocBuffer(c.length));
        } }, v.array = { string: g, array: m, arraybuffer: function(c) {
          return new Uint8Array(c).buffer;
        }, uint8array: function(c) {
          return new Uint8Array(c);
        }, nodebuffer: function(c) {
          return a.newBufferFrom(c);
        } }, v.arraybuffer = { string: function(c) {
          return g(new Uint8Array(c));
        }, array: function(c) {
          return d(new Uint8Array(c), new Array(c.byteLength));
        }, arraybuffer: m, uint8array: function(c) {
          return new Uint8Array(c);
        }, nodebuffer: function(c) {
          return a.newBufferFrom(new Uint8Array(c));
        } }, v.uint8array = { string: g, array: function(c) {
          return d(c, new Array(c.length));
        }, arraybuffer: function(c) {
          return c.buffer;
        }, uint8array: m, nodebuffer: function(c) {
          return a.newBufferFrom(c);
        } }, v.nodebuffer = { string: g, array: function(c) {
          return d(c, new Array(c.length));
        }, arraybuffer: function(c) {
          return v.nodebuffer.uint8array(c).buffer;
        }, uint8array: function(c) {
          return d(c, new Uint8Array(c.length));
        }, nodebuffer: m }, e.transformTo = function(c, p) {
          if (p = p || "", !c) return p;
          e.checkSupport(c);
          var h = e.getTypeOf(p);
          return v[h][c](p);
        }, e.resolve = function(c) {
          for (var p = c.split("/"), h = [], y = 0; y < p.length; y++) {
            var x = p[y];
            x === "." || x === "" && y !== 0 && y !== p.length - 1 || (x === ".." ? h.pop() : h.push(x));
          }
          return h.join("/");
        }, e.getTypeOf = function(c) {
          return typeof c == "string" ? "string" : Object.prototype.toString.call(c) === "[object Array]" ? "array" : r.nodebuffer && a.isBuffer(c) ? "nodebuffer" : r.uint8array && c instanceof Uint8Array ? "uint8array" : r.arraybuffer && c instanceof ArrayBuffer ? "arraybuffer" : void 0;
        }, e.checkSupport = function(c) {
          if (!r[c.toLowerCase()]) throw new Error(c + " is not supported by this platform");
        }, e.MAX_VALUE_16BITS = 65535, e.MAX_VALUE_32BITS = -1, e.pretty = function(c) {
          var p, h, y = "";
          for (h = 0; h < (c || "").length; h++) y += "\\x" + ((p = c.charCodeAt(h)) < 16 ? "0" : "") + p.toString(16).toUpperCase();
          return y;
        }, e.delay = function(c, p, h) {
          setImmediate(function() {
            c.apply(h || null, p || []);
          });
        }, e.inherits = function(c, p) {
          function h() {
          }
          h.prototype = p.prototype, c.prototype = new h();
        }, e.extend = function() {
          var c, p, h = {};
          for (c = 0; c < arguments.length; c++) for (p in arguments[c]) Object.prototype.hasOwnProperty.call(arguments[c], p) && h[p] === void 0 && (h[p] = arguments[c][p]);
          return h;
        }, e.prepareContent = function(c, p, h, y, x) {
          return u.Promise.resolve(p).then(function(E) {
            return r.blob && (E instanceof Blob || ["[object File]", "[object Blob]"].indexOf(Object.prototype.toString.call(E)) !== -1) && typeof FileReader < "u" ? new u.Promise(function(S, N) {
              var T = new FileReader();
              T.onload = function(U) {
                S(U.target.result);
              }, T.onerror = function(U) {
                N(U.target.error);
              }, T.readAsArrayBuffer(E);
            }) : E;
          }).then(function(E) {
            var S = e.getTypeOf(E);
            return S ? (S === "arraybuffer" ? E = e.transformTo("uint8array", E) : S === "string" && (x ? E = i.decode(E) : h && y !== !0 && (E = (function(N) {
              return b(N, r.uint8array ? new Uint8Array(N.length) : new Array(N.length));
            })(E))), E) : u.Promise.reject(new Error("Can't read the data of '" + c + "'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"));
          });
        };
      }, { "./base64": 1, "./external": 6, "./nodejsUtils": 14, "./support": 30, setimmediate: 54 }], 33: [function(t, s, e) {
        var r = t("./reader/readerFor"), i = t("./utils"), a = t("./signature"), u = t("./zipEntry"), m = t("./support");
        function b(_) {
          this.files = [], this.loadOptions = _;
        }
        b.prototype = { checkSignature: function(_) {
          if (!this.reader.readAndCheckSignature(_)) {
            this.reader.index -= 4;
            var g = this.reader.readString(4);
            throw new Error("Corrupted zip or bug: unexpected signature (" + i.pretty(g) + ", expected " + i.pretty(_) + ")");
          }
        }, isSignature: function(_, g) {
          var d = this.reader.index;
          this.reader.setIndex(_);
          var v = this.reader.readString(4) === g;
          return this.reader.setIndex(d), v;
        }, readBlockEndOfCentral: function() {
          this.diskNumber = this.reader.readInt(2), this.diskWithCentralDirStart = this.reader.readInt(2), this.centralDirRecordsOnThisDisk = this.reader.readInt(2), this.centralDirRecords = this.reader.readInt(2), this.centralDirSize = this.reader.readInt(4), this.centralDirOffset = this.reader.readInt(4), this.zipCommentLength = this.reader.readInt(2);
          var _ = this.reader.readData(this.zipCommentLength), g = m.uint8array ? "uint8array" : "array", d = i.transformTo(g, _);
          this.zipComment = this.loadOptions.decodeFileName(d);
        }, readBlockZip64EndOfCentral: function() {
          this.zip64EndOfCentralSize = this.reader.readInt(8), this.reader.skip(4), this.diskNumber = this.reader.readInt(4), this.diskWithCentralDirStart = this.reader.readInt(4), this.centralDirRecordsOnThisDisk = this.reader.readInt(8), this.centralDirRecords = this.reader.readInt(8), this.centralDirSize = this.reader.readInt(8), this.centralDirOffset = this.reader.readInt(8), this.zip64ExtensibleData = {};
          for (var _, g, d, v = this.zip64EndOfCentralSize - 44; 0 < v; ) _ = this.reader.readInt(2), g = this.reader.readInt(4), d = this.reader.readData(g), this.zip64ExtensibleData[_] = { id: _, length: g, value: d };
        }, readBlockZip64EndOfCentralLocator: function() {
          if (this.diskWithZip64CentralDirStart = this.reader.readInt(4), this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8), this.disksCount = this.reader.readInt(4), 1 < this.disksCount) throw new Error("Multi-volumes zip are not supported");
        }, readLocalFiles: function() {
          var _, g;
          for (_ = 0; _ < this.files.length; _++) g = this.files[_], this.reader.setIndex(g.localHeaderOffset), this.checkSignature(a.LOCAL_FILE_HEADER), g.readLocalPart(this.reader), g.handleUTF8(), g.processAttributes();
        }, readCentralDir: function() {
          var _;
          for (this.reader.setIndex(this.centralDirOffset); this.reader.readAndCheckSignature(a.CENTRAL_FILE_HEADER); ) (_ = new u({ zip64: this.zip64 }, this.loadOptions)).readCentralPart(this.reader), this.files.push(_);
          if (this.centralDirRecords !== this.files.length && this.centralDirRecords !== 0 && this.files.length === 0) throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
        }, readEndOfCentral: function() {
          var _ = this.reader.lastIndexOfSignature(a.CENTRAL_DIRECTORY_END);
          if (_ < 0) throw this.isSignature(0, a.LOCAL_FILE_HEADER) ? new Error("Corrupted zip: can't find end of central directory") : new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html");
          this.reader.setIndex(_);
          var g = _;
          if (this.checkSignature(a.CENTRAL_DIRECTORY_END), this.readBlockEndOfCentral(), this.diskNumber === i.MAX_VALUE_16BITS || this.diskWithCentralDirStart === i.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === i.MAX_VALUE_16BITS || this.centralDirRecords === i.MAX_VALUE_16BITS || this.centralDirSize === i.MAX_VALUE_32BITS || this.centralDirOffset === i.MAX_VALUE_32BITS) {
            if (this.zip64 = !0, (_ = this.reader.lastIndexOfSignature(a.ZIP64_CENTRAL_DIRECTORY_LOCATOR)) < 0) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");
            if (this.reader.setIndex(_), this.checkSignature(a.ZIP64_CENTRAL_DIRECTORY_LOCATOR), this.readBlockZip64EndOfCentralLocator(), !this.isSignature(this.relativeOffsetEndOfZip64CentralDir, a.ZIP64_CENTRAL_DIRECTORY_END) && (this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(a.ZIP64_CENTRAL_DIRECTORY_END), this.relativeOffsetEndOfZip64CentralDir < 0)) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");
            this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir), this.checkSignature(a.ZIP64_CENTRAL_DIRECTORY_END), this.readBlockZip64EndOfCentral();
          }
          var d = this.centralDirOffset + this.centralDirSize;
          this.zip64 && (d += 20, d += 12 + this.zip64EndOfCentralSize);
          var v = g - d;
          if (0 < v) this.isSignature(g, a.CENTRAL_FILE_HEADER) || (this.reader.zero = v);
          else if (v < 0) throw new Error("Corrupted zip: missing " + Math.abs(v) + " bytes.");
        }, prepareReader: function(_) {
          this.reader = r(_);
        }, load: function(_) {
          this.prepareReader(_), this.readEndOfCentral(), this.readCentralDir(), this.readLocalFiles();
        } }, s.exports = b;
      }, { "./reader/readerFor": 22, "./signature": 23, "./support": 30, "./utils": 32, "./zipEntry": 34 }], 34: [function(t, s, e) {
        var r = t("./reader/readerFor"), i = t("./utils"), a = t("./compressedObject"), u = t("./crc32"), m = t("./utf8"), b = t("./compressions"), _ = t("./support");
        function g(d, v) {
          this.options = d, this.loadOptions = v;
        }
        g.prototype = { isEncrypted: function() {
          return (1 & this.bitFlag) == 1;
        }, useUTF8: function() {
          return (2048 & this.bitFlag) == 2048;
        }, readLocalPart: function(d) {
          var v, c;
          if (d.skip(22), this.fileNameLength = d.readInt(2), c = d.readInt(2), this.fileName = d.readData(this.fileNameLength), d.skip(c), this.compressedSize === -1 || this.uncompressedSize === -1) throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");
          if ((v = (function(p) {
            for (var h in b) if (Object.prototype.hasOwnProperty.call(b, h) && b[h].magic === p) return b[h];
            return null;
          })(this.compressionMethod)) === null) throw new Error("Corrupted zip : compression " + i.pretty(this.compressionMethod) + " unknown (inner file : " + i.transformTo("string", this.fileName) + ")");
          this.decompressed = new a(this.compressedSize, this.uncompressedSize, this.crc32, v, d.readData(this.compressedSize));
        }, readCentralPart: function(d) {
          this.versionMadeBy = d.readInt(2), d.skip(2), this.bitFlag = d.readInt(2), this.compressionMethod = d.readString(2), this.date = d.readDate(), this.crc32 = d.readInt(4), this.compressedSize = d.readInt(4), this.uncompressedSize = d.readInt(4);
          var v = d.readInt(2);
          if (this.extraFieldsLength = d.readInt(2), this.fileCommentLength = d.readInt(2), this.diskNumberStart = d.readInt(2), this.internalFileAttributes = d.readInt(2), this.externalFileAttributes = d.readInt(4), this.localHeaderOffset = d.readInt(4), this.isEncrypted()) throw new Error("Encrypted zip are not supported");
          d.skip(v), this.readExtraFields(d), this.parseZIP64ExtraField(d), this.fileComment = d.readData(this.fileCommentLength);
        }, processAttributes: function() {
          this.unixPermissions = null, this.dosPermissions = null;
          var d = this.versionMadeBy >> 8;
          this.dir = !!(16 & this.externalFileAttributes), d == 0 && (this.dosPermissions = 63 & this.externalFileAttributes), d == 3 && (this.unixPermissions = this.externalFileAttributes >> 16 & 65535), this.dir || this.fileNameStr.slice(-1) !== "/" || (this.dir = !0);
        }, parseZIP64ExtraField: function() {
          if (this.extraFields[1]) {
            var d = r(this.extraFields[1].value);
            this.uncompressedSize === i.MAX_VALUE_32BITS && (this.uncompressedSize = d.readInt(8)), this.compressedSize === i.MAX_VALUE_32BITS && (this.compressedSize = d.readInt(8)), this.localHeaderOffset === i.MAX_VALUE_32BITS && (this.localHeaderOffset = d.readInt(8)), this.diskNumberStart === i.MAX_VALUE_32BITS && (this.diskNumberStart = d.readInt(4));
          }
        }, readExtraFields: function(d) {
          var v, c, p, h = d.index + this.extraFieldsLength;
          for (this.extraFields || (this.extraFields = {}); d.index + 4 < h; ) v = d.readInt(2), c = d.readInt(2), p = d.readData(c), this.extraFields[v] = { id: v, length: c, value: p };
          d.setIndex(h);
        }, handleUTF8: function() {
          var d = _.uint8array ? "uint8array" : "array";
          if (this.useUTF8()) this.fileNameStr = m.utf8decode(this.fileName), this.fileCommentStr = m.utf8decode(this.fileComment);
          else {
            var v = this.findExtraFieldUnicodePath();
            if (v !== null) this.fileNameStr = v;
            else {
              var c = i.transformTo(d, this.fileName);
              this.fileNameStr = this.loadOptions.decodeFileName(c);
            }
            var p = this.findExtraFieldUnicodeComment();
            if (p !== null) this.fileCommentStr = p;
            else {
              var h = i.transformTo(d, this.fileComment);
              this.fileCommentStr = this.loadOptions.decodeFileName(h);
            }
          }
        }, findExtraFieldUnicodePath: function() {
          var d = this.extraFields[28789];
          if (d) {
            var v = r(d.value);
            return v.readInt(1) !== 1 || u(this.fileName) !== v.readInt(4) ? null : m.utf8decode(v.readData(d.length - 5));
          }
          return null;
        }, findExtraFieldUnicodeComment: function() {
          var d = this.extraFields[25461];
          if (d) {
            var v = r(d.value);
            return v.readInt(1) !== 1 || u(this.fileComment) !== v.readInt(4) ? null : m.utf8decode(v.readData(d.length - 5));
          }
          return null;
        } }, s.exports = g;
      }, { "./compressedObject": 2, "./compressions": 3, "./crc32": 4, "./reader/readerFor": 22, "./support": 30, "./utf8": 31, "./utils": 32 }], 35: [function(t, s, e) {
        function r(v, c, p) {
          this.name = v, this.dir = p.dir, this.date = p.date, this.comment = p.comment, this.unixPermissions = p.unixPermissions, this.dosPermissions = p.dosPermissions, this._data = c, this._dataBinary = p.binary, this.options = { compression: p.compression, compressionOptions: p.compressionOptions };
        }
        var i = t("./stream/StreamHelper"), a = t("./stream/DataWorker"), u = t("./utf8"), m = t("./compressedObject"), b = t("./stream/GenericWorker");
        r.prototype = { internalStream: function(v) {
          var c = null, p = "string";
          try {
            if (!v) throw new Error("No output type specified.");
            var h = (p = v.toLowerCase()) === "string" || p === "text";
            p !== "binarystring" && p !== "text" || (p = "string"), c = this._decompressWorker();
            var y = !this._dataBinary;
            y && !h && (c = c.pipe(new u.Utf8EncodeWorker())), !y && h && (c = c.pipe(new u.Utf8DecodeWorker()));
          } catch (x) {
            (c = new b("error")).error(x);
          }
          return new i(c, p, "");
        }, async: function(v, c) {
          return this.internalStream(v).accumulate(c);
        }, nodeStream: function(v, c) {
          return this.internalStream(v || "nodebuffer").toNodejsStream(c);
        }, _compressWorker: function(v, c) {
          if (this._data instanceof m && this._data.compression.magic === v.magic) return this._data.getCompressedWorker();
          var p = this._decompressWorker();
          return this._dataBinary || (p = p.pipe(new u.Utf8EncodeWorker())), m.createWorkerFrom(p, v, c);
        }, _decompressWorker: function() {
          return this._data instanceof m ? this._data.getContentWorker() : this._data instanceof b ? this._data : new a(this._data);
        } };
        for (var _ = ["asText", "asBinary", "asNodeBuffer", "asUint8Array", "asArrayBuffer"], g = function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, d = 0; d < _.length; d++) r.prototype[_[d]] = g;
        s.exports = r;
      }, { "./compressedObject": 2, "./stream/DataWorker": 27, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31 }], 36: [function(t, s, e) {
        (function(r) {
          var i, a, u = r.MutationObserver || r.WebKitMutationObserver;
          if (u) {
            var m = 0, b = new u(v), _ = r.document.createTextNode("");
            b.observe(_, { characterData: !0 }), i = function() {
              _.data = m = ++m % 2;
            };
          } else if (r.setImmediate || r.MessageChannel === void 0) i = "document" in r && "onreadystatechange" in r.document.createElement("script") ? function() {
            var c = r.document.createElement("script");
            c.onreadystatechange = function() {
              v(), c.onreadystatechange = null, c.parentNode.removeChild(c), c = null;
            }, r.document.documentElement.appendChild(c);
          } : function() {
            setTimeout(v, 0);
          };
          else {
            var g = new r.MessageChannel();
            g.port1.onmessage = v, i = function() {
              g.port2.postMessage(0);
            };
          }
          var d = [];
          function v() {
            var c, p;
            a = !0;
            for (var h = d.length; h; ) {
              for (p = d, d = [], c = -1; ++c < h; ) p[c]();
              h = d.length;
            }
            a = !1;
          }
          s.exports = function(c) {
            d.push(c) !== 1 || a || i();
          };
        }).call(this, typeof Nt < "u" ? Nt : typeof self < "u" ? self : typeof window < "u" ? window : {});
      }, {}], 37: [function(t, s, e) {
        var r = t("immediate");
        function i() {
        }
        var a = {}, u = ["REJECTED"], m = ["FULFILLED"], b = ["PENDING"];
        function _(h) {
          if (typeof h != "function") throw new TypeError("resolver must be a function");
          this.state = b, this.queue = [], this.outcome = void 0, h !== i && c(this, h);
        }
        function g(h, y, x) {
          this.promise = h, typeof y == "function" && (this.onFulfilled = y, this.callFulfilled = this.otherCallFulfilled), typeof x == "function" && (this.onRejected = x, this.callRejected = this.otherCallRejected);
        }
        function d(h, y, x) {
          r(function() {
            var E;
            try {
              E = y(x);
            } catch (S) {
              return a.reject(h, S);
            }
            E === h ? a.reject(h, new TypeError("Cannot resolve promise with itself")) : a.resolve(h, E);
          });
        }
        function v(h) {
          var y = h && h.then;
          if (h && (typeof h == "object" || typeof h == "function") && typeof y == "function") return function() {
            y.apply(h, arguments);
          };
        }
        function c(h, y) {
          var x = !1;
          function E(T) {
            x || (x = !0, a.reject(h, T));
          }
          function S(T) {
            x || (x = !0, a.resolve(h, T));
          }
          var N = p(function() {
            y(S, E);
          });
          N.status === "error" && E(N.value);
        }
        function p(h, y) {
          var x = {};
          try {
            x.value = h(y), x.status = "success";
          } catch (E) {
            x.status = "error", x.value = E;
          }
          return x;
        }
        (s.exports = _).prototype.finally = function(h) {
          if (typeof h != "function") return this;
          var y = this.constructor;
          return this.then(function(x) {
            return y.resolve(h()).then(function() {
              return x;
            });
          }, function(x) {
            return y.resolve(h()).then(function() {
              throw x;
            });
          });
        }, _.prototype.catch = function(h) {
          return this.then(null, h);
        }, _.prototype.then = function(h, y) {
          if (typeof h != "function" && this.state === m || typeof y != "function" && this.state === u) return this;
          var x = new this.constructor(i);
          return this.state !== b ? d(x, this.state === m ? h : y, this.outcome) : this.queue.push(new g(x, h, y)), x;
        }, g.prototype.callFulfilled = function(h) {
          a.resolve(this.promise, h);
        }, g.prototype.otherCallFulfilled = function(h) {
          d(this.promise, this.onFulfilled, h);
        }, g.prototype.callRejected = function(h) {
          a.reject(this.promise, h);
        }, g.prototype.otherCallRejected = function(h) {
          d(this.promise, this.onRejected, h);
        }, a.resolve = function(h, y) {
          var x = p(v, y);
          if (x.status === "error") return a.reject(h, x.value);
          var E = x.value;
          if (E) c(h, E);
          else {
            h.state = m, h.outcome = y;
            for (var S = -1, N = h.queue.length; ++S < N; ) h.queue[S].callFulfilled(y);
          }
          return h;
        }, a.reject = function(h, y) {
          h.state = u, h.outcome = y;
          for (var x = -1, E = h.queue.length; ++x < E; ) h.queue[x].callRejected(y);
          return h;
        }, _.resolve = function(h) {
          return h instanceof this ? h : a.resolve(new this(i), h);
        }, _.reject = function(h) {
          var y = new this(i);
          return a.reject(y, h);
        }, _.all = function(h) {
          var y = this;
          if (Object.prototype.toString.call(h) !== "[object Array]") return this.reject(new TypeError("must be an array"));
          var x = h.length, E = !1;
          if (!x) return this.resolve([]);
          for (var S = new Array(x), N = 0, T = -1, U = new this(i); ++T < x; ) z(h[T], T);
          return U;
          function z(j, X) {
            y.resolve(j).then(function(C) {
              S[X] = C, ++N !== x || E || (E = !0, a.resolve(U, S));
            }, function(C) {
              E || (E = !0, a.reject(U, C));
            });
          }
        }, _.race = function(h) {
          var y = this;
          if (Object.prototype.toString.call(h) !== "[object Array]") return this.reject(new TypeError("must be an array"));
          var x = h.length, E = !1;
          if (!x) return this.resolve([]);
          for (var S = -1, N = new this(i); ++S < x; ) T = h[S], y.resolve(T).then(function(U) {
            E || (E = !0, a.resolve(N, U));
          }, function(U) {
            E || (E = !0, a.reject(N, U));
          });
          var T;
          return N;
        };
      }, { immediate: 36 }], 38: [function(t, s, e) {
        var r = {};
        (0, t("./lib/utils/common").assign)(r, t("./lib/deflate"), t("./lib/inflate"), t("./lib/zlib/constants")), s.exports = r;
      }, { "./lib/deflate": 39, "./lib/inflate": 40, "./lib/utils/common": 41, "./lib/zlib/constants": 44 }], 39: [function(t, s, e) {
        var r = t("./zlib/deflate"), i = t("./utils/common"), a = t("./utils/strings"), u = t("./zlib/messages"), m = t("./zlib/zstream"), b = Object.prototype.toString, _ = 0, g = -1, d = 0, v = 8;
        function c(h) {
          if (!(this instanceof c)) return new c(h);
          this.options = i.assign({ level: g, method: v, chunkSize: 16384, windowBits: 15, memLevel: 8, strategy: d, to: "" }, h || {});
          var y = this.options;
          y.raw && 0 < y.windowBits ? y.windowBits = -y.windowBits : y.gzip && 0 < y.windowBits && y.windowBits < 16 && (y.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new m(), this.strm.avail_out = 0;
          var x = r.deflateInit2(this.strm, y.level, y.method, y.windowBits, y.memLevel, y.strategy);
          if (x !== _) throw new Error(u[x]);
          if (y.header && r.deflateSetHeader(this.strm, y.header), y.dictionary) {
            var E;
            if (E = typeof y.dictionary == "string" ? a.string2buf(y.dictionary) : b.call(y.dictionary) === "[object ArrayBuffer]" ? new Uint8Array(y.dictionary) : y.dictionary, (x = r.deflateSetDictionary(this.strm, E)) !== _) throw new Error(u[x]);
            this._dict_set = !0;
          }
        }
        function p(h, y) {
          var x = new c(y);
          if (x.push(h, !0), x.err) throw x.msg || u[x.err];
          return x.result;
        }
        c.prototype.push = function(h, y) {
          var x, E, S = this.strm, N = this.options.chunkSize;
          if (this.ended) return !1;
          E = y === ~~y ? y : y === !0 ? 4 : 0, typeof h == "string" ? S.input = a.string2buf(h) : b.call(h) === "[object ArrayBuffer]" ? S.input = new Uint8Array(h) : S.input = h, S.next_in = 0, S.avail_in = S.input.length;
          do {
            if (S.avail_out === 0 && (S.output = new i.Buf8(N), S.next_out = 0, S.avail_out = N), (x = r.deflate(S, E)) !== 1 && x !== _) return this.onEnd(x), !(this.ended = !0);
            S.avail_out !== 0 && (S.avail_in !== 0 || E !== 4 && E !== 2) || (this.options.to === "string" ? this.onData(a.buf2binstring(i.shrinkBuf(S.output, S.next_out))) : this.onData(i.shrinkBuf(S.output, S.next_out)));
          } while ((0 < S.avail_in || S.avail_out === 0) && x !== 1);
          return E === 4 ? (x = r.deflateEnd(this.strm), this.onEnd(x), this.ended = !0, x === _) : E !== 2 || (this.onEnd(_), !(S.avail_out = 0));
        }, c.prototype.onData = function(h) {
          this.chunks.push(h);
        }, c.prototype.onEnd = function(h) {
          h === _ && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = i.flattenChunks(this.chunks)), this.chunks = [], this.err = h, this.msg = this.strm.msg;
        }, e.Deflate = c, e.deflate = p, e.deflateRaw = function(h, y) {
          return (y = y || {}).raw = !0, p(h, y);
        }, e.gzip = function(h, y) {
          return (y = y || {}).gzip = !0, p(h, y);
        };
      }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/deflate": 46, "./zlib/messages": 51, "./zlib/zstream": 53 }], 40: [function(t, s, e) {
        var r = t("./zlib/inflate"), i = t("./utils/common"), a = t("./utils/strings"), u = t("./zlib/constants"), m = t("./zlib/messages"), b = t("./zlib/zstream"), _ = t("./zlib/gzheader"), g = Object.prototype.toString;
        function d(c) {
          if (!(this instanceof d)) return new d(c);
          this.options = i.assign({ chunkSize: 16384, windowBits: 0, to: "" }, c || {});
          var p = this.options;
          p.raw && 0 <= p.windowBits && p.windowBits < 16 && (p.windowBits = -p.windowBits, p.windowBits === 0 && (p.windowBits = -15)), !(0 <= p.windowBits && p.windowBits < 16) || c && c.windowBits || (p.windowBits += 32), 15 < p.windowBits && p.windowBits < 48 && (15 & p.windowBits) == 0 && (p.windowBits |= 15), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new b(), this.strm.avail_out = 0;
          var h = r.inflateInit2(this.strm, p.windowBits);
          if (h !== u.Z_OK) throw new Error(m[h]);
          this.header = new _(), r.inflateGetHeader(this.strm, this.header);
        }
        function v(c, p) {
          var h = new d(p);
          if (h.push(c, !0), h.err) throw h.msg || m[h.err];
          return h.result;
        }
        d.prototype.push = function(c, p) {
          var h, y, x, E, S, N, T = this.strm, U = this.options.chunkSize, z = this.options.dictionary, j = !1;
          if (this.ended) return !1;
          y = p === ~~p ? p : p === !0 ? u.Z_FINISH : u.Z_NO_FLUSH, typeof c == "string" ? T.input = a.binstring2buf(c) : g.call(c) === "[object ArrayBuffer]" ? T.input = new Uint8Array(c) : T.input = c, T.next_in = 0, T.avail_in = T.input.length;
          do {
            if (T.avail_out === 0 && (T.output = new i.Buf8(U), T.next_out = 0, T.avail_out = U), (h = r.inflate(T, u.Z_NO_FLUSH)) === u.Z_NEED_DICT && z && (N = typeof z == "string" ? a.string2buf(z) : g.call(z) === "[object ArrayBuffer]" ? new Uint8Array(z) : z, h = r.inflateSetDictionary(this.strm, N)), h === u.Z_BUF_ERROR && j === !0 && (h = u.Z_OK, j = !1), h !== u.Z_STREAM_END && h !== u.Z_OK) return this.onEnd(h), !(this.ended = !0);
            T.next_out && (T.avail_out !== 0 && h !== u.Z_STREAM_END && (T.avail_in !== 0 || y !== u.Z_FINISH && y !== u.Z_SYNC_FLUSH) || (this.options.to === "string" ? (x = a.utf8border(T.output, T.next_out), E = T.next_out - x, S = a.buf2string(T.output, x), T.next_out = E, T.avail_out = U - E, E && i.arraySet(T.output, T.output, x, E, 0), this.onData(S)) : this.onData(i.shrinkBuf(T.output, T.next_out)))), T.avail_in === 0 && T.avail_out === 0 && (j = !0);
          } while ((0 < T.avail_in || T.avail_out === 0) && h !== u.Z_STREAM_END);
          return h === u.Z_STREAM_END && (y = u.Z_FINISH), y === u.Z_FINISH ? (h = r.inflateEnd(this.strm), this.onEnd(h), this.ended = !0, h === u.Z_OK) : y !== u.Z_SYNC_FLUSH || (this.onEnd(u.Z_OK), !(T.avail_out = 0));
        }, d.prototype.onData = function(c) {
          this.chunks.push(c);
        }, d.prototype.onEnd = function(c) {
          c === u.Z_OK && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = i.flattenChunks(this.chunks)), this.chunks = [], this.err = c, this.msg = this.strm.msg;
        }, e.Inflate = d, e.inflate = v, e.inflateRaw = function(c, p) {
          return (p = p || {}).raw = !0, v(c, p);
        }, e.ungzip = v;
      }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/constants": 44, "./zlib/gzheader": 47, "./zlib/inflate": 49, "./zlib/messages": 51, "./zlib/zstream": 53 }], 41: [function(t, s, e) {
        var r = typeof Uint8Array < "u" && typeof Uint16Array < "u" && typeof Int32Array < "u";
        e.assign = function(u) {
          for (var m = Array.prototype.slice.call(arguments, 1); m.length; ) {
            var b = m.shift();
            if (b) {
              if (typeof b != "object") throw new TypeError(b + "must be non-object");
              for (var _ in b) b.hasOwnProperty(_) && (u[_] = b[_]);
            }
          }
          return u;
        }, e.shrinkBuf = function(u, m) {
          return u.length === m ? u : u.subarray ? u.subarray(0, m) : (u.length = m, u);
        };
        var i = { arraySet: function(u, m, b, _, g) {
          if (m.subarray && u.subarray) u.set(m.subarray(b, b + _), g);
          else for (var d = 0; d < _; d++) u[g + d] = m[b + d];
        }, flattenChunks: function(u) {
          var m, b, _, g, d, v;
          for (m = _ = 0, b = u.length; m < b; m++) _ += u[m].length;
          for (v = new Uint8Array(_), m = g = 0, b = u.length; m < b; m++) d = u[m], v.set(d, g), g += d.length;
          return v;
        } }, a = { arraySet: function(u, m, b, _, g) {
          for (var d = 0; d < _; d++) u[g + d] = m[b + d];
        }, flattenChunks: function(u) {
          return [].concat.apply([], u);
        } };
        e.setTyped = function(u) {
          u ? (e.Buf8 = Uint8Array, e.Buf16 = Uint16Array, e.Buf32 = Int32Array, e.assign(e, i)) : (e.Buf8 = Array, e.Buf16 = Array, e.Buf32 = Array, e.assign(e, a));
        }, e.setTyped(r);
      }, {}], 42: [function(t, s, e) {
        var r = t("./common"), i = !0, a = !0;
        try {
          String.fromCharCode.apply(null, [0]);
        } catch {
          i = !1;
        }
        try {
          String.fromCharCode.apply(null, new Uint8Array(1));
        } catch {
          a = !1;
        }
        for (var u = new r.Buf8(256), m = 0; m < 256; m++) u[m] = 252 <= m ? 6 : 248 <= m ? 5 : 240 <= m ? 4 : 224 <= m ? 3 : 192 <= m ? 2 : 1;
        function b(_, g) {
          if (g < 65537 && (_.subarray && a || !_.subarray && i)) return String.fromCharCode.apply(null, r.shrinkBuf(_, g));
          for (var d = "", v = 0; v < g; v++) d += String.fromCharCode(_[v]);
          return d;
        }
        u[254] = u[254] = 1, e.string2buf = function(_) {
          var g, d, v, c, p, h = _.length, y = 0;
          for (c = 0; c < h; c++) (64512 & (d = _.charCodeAt(c))) == 55296 && c + 1 < h && (64512 & (v = _.charCodeAt(c + 1))) == 56320 && (d = 65536 + (d - 55296 << 10) + (v - 56320), c++), y += d < 128 ? 1 : d < 2048 ? 2 : d < 65536 ? 3 : 4;
          for (g = new r.Buf8(y), c = p = 0; p < y; c++) (64512 & (d = _.charCodeAt(c))) == 55296 && c + 1 < h && (64512 & (v = _.charCodeAt(c + 1))) == 56320 && (d = 65536 + (d - 55296 << 10) + (v - 56320), c++), d < 128 ? g[p++] = d : (d < 2048 ? g[p++] = 192 | d >>> 6 : (d < 65536 ? g[p++] = 224 | d >>> 12 : (g[p++] = 240 | d >>> 18, g[p++] = 128 | d >>> 12 & 63), g[p++] = 128 | d >>> 6 & 63), g[p++] = 128 | 63 & d);
          return g;
        }, e.buf2binstring = function(_) {
          return b(_, _.length);
        }, e.binstring2buf = function(_) {
          for (var g = new r.Buf8(_.length), d = 0, v = g.length; d < v; d++) g[d] = _.charCodeAt(d);
          return g;
        }, e.buf2string = function(_, g) {
          var d, v, c, p, h = g || _.length, y = new Array(2 * h);
          for (d = v = 0; d < h; ) if ((c = _[d++]) < 128) y[v++] = c;
          else if (4 < (p = u[c])) y[v++] = 65533, d += p - 1;
          else {
            for (c &= p === 2 ? 31 : p === 3 ? 15 : 7; 1 < p && d < h; ) c = c << 6 | 63 & _[d++], p--;
            1 < p ? y[v++] = 65533 : c < 65536 ? y[v++] = c : (c -= 65536, y[v++] = 55296 | c >> 10 & 1023, y[v++] = 56320 | 1023 & c);
          }
          return b(y, v);
        }, e.utf8border = function(_, g) {
          var d;
          for ((g = g || _.length) > _.length && (g = _.length), d = g - 1; 0 <= d && (192 & _[d]) == 128; ) d--;
          return d < 0 || d === 0 ? g : d + u[_[d]] > g ? d : g;
        };
      }, { "./common": 41 }], 43: [function(t, s, e) {
        s.exports = function(r, i, a, u) {
          for (var m = 65535 & r | 0, b = r >>> 16 & 65535 | 0, _ = 0; a !== 0; ) {
            for (a -= _ = 2e3 < a ? 2e3 : a; b = b + (m = m + i[u++] | 0) | 0, --_; ) ;
            m %= 65521, b %= 65521;
          }
          return m | b << 16 | 0;
        };
      }, {}], 44: [function(t, s, e) {
        s.exports = { Z_NO_FLUSH: 0, Z_PARTIAL_FLUSH: 1, Z_SYNC_FLUSH: 2, Z_FULL_FLUSH: 3, Z_FINISH: 4, Z_BLOCK: 5, Z_TREES: 6, Z_OK: 0, Z_STREAM_END: 1, Z_NEED_DICT: 2, Z_ERRNO: -1, Z_STREAM_ERROR: -2, Z_DATA_ERROR: -3, Z_BUF_ERROR: -5, Z_NO_COMPRESSION: 0, Z_BEST_SPEED: 1, Z_BEST_COMPRESSION: 9, Z_DEFAULT_COMPRESSION: -1, Z_FILTERED: 1, Z_HUFFMAN_ONLY: 2, Z_RLE: 3, Z_FIXED: 4, Z_DEFAULT_STRATEGY: 0, Z_BINARY: 0, Z_TEXT: 1, Z_UNKNOWN: 2, Z_DEFLATED: 8 };
      }, {}], 45: [function(t, s, e) {
        var r = (function() {
          for (var i, a = [], u = 0; u < 256; u++) {
            i = u;
            for (var m = 0; m < 8; m++) i = 1 & i ? 3988292384 ^ i >>> 1 : i >>> 1;
            a[u] = i;
          }
          return a;
        })();
        s.exports = function(i, a, u, m) {
          var b = r, _ = m + u;
          i ^= -1;
          for (var g = m; g < _; g++) i = i >>> 8 ^ b[255 & (i ^ a[g])];
          return -1 ^ i;
        };
      }, {}], 46: [function(t, s, e) {
        var r, i = t("../utils/common"), a = t("./trees"), u = t("./adler32"), m = t("./crc32"), b = t("./messages"), _ = 0, g = 4, d = 0, v = -2, c = -1, p = 4, h = 2, y = 8, x = 9, E = 286, S = 30, N = 19, T = 2 * E + 1, U = 15, z = 3, j = 258, X = j + z + 1, C = 42, R = 113, f = 1, P = 2, J = 3, $ = 4;
        function tt(o, B) {
          return o.msg = b[B], B;
        }
        function Z(o) {
          return (o << 1) - (4 < o ? 9 : 0);
        }
        function Q(o) {
          for (var B = o.length; 0 <= --B; ) o[B] = 0;
        }
        function O(o) {
          var B = o.state, M = B.pending;
          M > o.avail_out && (M = o.avail_out), M !== 0 && (i.arraySet(o.output, B.pending_buf, B.pending_out, M, o.next_out), o.next_out += M, B.pending_out += M, o.total_out += M, o.avail_out -= M, B.pending -= M, B.pending === 0 && (B.pending_out = 0));
        }
        function L(o, B) {
          a._tr_flush_block(o, 0 <= o.block_start ? o.block_start : -1, o.strstart - o.block_start, B), o.block_start = o.strstart, O(o.strm);
        }
        function q(o, B) {
          o.pending_buf[o.pending++] = B;
        }
        function H(o, B) {
          o.pending_buf[o.pending++] = B >>> 8 & 255, o.pending_buf[o.pending++] = 255 & B;
        }
        function K(o, B) {
          var M, k, w = o.max_chain_length, I = o.strstart, F = o.prev_length, D = o.nice_match, A = o.strstart > o.w_size - X ? o.strstart - (o.w_size - X) : 0, W = o.window, Y = o.w_mask, G = o.prev, V = o.strstart + j, ot = W[I + F - 1], nt = W[I + F];
          o.prev_length >= o.good_match && (w >>= 2), D > o.lookahead && (D = o.lookahead);
          do
            if (W[(M = B) + F] === nt && W[M + F - 1] === ot && W[M] === W[I] && W[++M] === W[I + 1]) {
              I += 2, M++;
              do
                ;
              while (W[++I] === W[++M] && W[++I] === W[++M] && W[++I] === W[++M] && W[++I] === W[++M] && W[++I] === W[++M] && W[++I] === W[++M] && W[++I] === W[++M] && W[++I] === W[++M] && I < V);
              if (k = j - (V - I), I = V - j, F < k) {
                if (o.match_start = B, D <= (F = k)) break;
                ot = W[I + F - 1], nt = W[I + F];
              }
            }
          while ((B = G[B & Y]) > A && --w != 0);
          return F <= o.lookahead ? F : o.lookahead;
        }
        function at(o) {
          var B, M, k, w, I, F, D, A, W, Y, G = o.w_size;
          do {
            if (w = o.window_size - o.lookahead - o.strstart, o.strstart >= G + (G - X)) {
              for (i.arraySet(o.window, o.window, G, G, 0), o.match_start -= G, o.strstart -= G, o.block_start -= G, B = M = o.hash_size; k = o.head[--B], o.head[B] = G <= k ? k - G : 0, --M; ) ;
              for (B = M = G; k = o.prev[--B], o.prev[B] = G <= k ? k - G : 0, --M; ) ;
              w += G;
            }
            if (o.strm.avail_in === 0) break;
            if (F = o.strm, D = o.window, A = o.strstart + o.lookahead, W = w, Y = void 0, Y = F.avail_in, W < Y && (Y = W), M = Y === 0 ? 0 : (F.avail_in -= Y, i.arraySet(D, F.input, F.next_in, Y, A), F.state.wrap === 1 ? F.adler = u(F.adler, D, Y, A) : F.state.wrap === 2 && (F.adler = m(F.adler, D, Y, A)), F.next_in += Y, F.total_in += Y, Y), o.lookahead += M, o.lookahead + o.insert >= z) for (I = o.strstart - o.insert, o.ins_h = o.window[I], o.ins_h = (o.ins_h << o.hash_shift ^ o.window[I + 1]) & o.hash_mask; o.insert && (o.ins_h = (o.ins_h << o.hash_shift ^ o.window[I + z - 1]) & o.hash_mask, o.prev[I & o.w_mask] = o.head[o.ins_h], o.head[o.ins_h] = I, I++, o.insert--, !(o.lookahead + o.insert < z)); ) ;
          } while (o.lookahead < X && o.strm.avail_in !== 0);
        }
        function ft(o, B) {
          for (var M, k; ; ) {
            if (o.lookahead < X) {
              if (at(o), o.lookahead < X && B === _) return f;
              if (o.lookahead === 0) break;
            }
            if (M = 0, o.lookahead >= z && (o.ins_h = (o.ins_h << o.hash_shift ^ o.window[o.strstart + z - 1]) & o.hash_mask, M = o.prev[o.strstart & o.w_mask] = o.head[o.ins_h], o.head[o.ins_h] = o.strstart), M !== 0 && o.strstart - M <= o.w_size - X && (o.match_length = K(o, M)), o.match_length >= z) if (k = a._tr_tally(o, o.strstart - o.match_start, o.match_length - z), o.lookahead -= o.match_length, o.match_length <= o.max_lazy_match && o.lookahead >= z) {
              for (o.match_length--; o.strstart++, o.ins_h = (o.ins_h << o.hash_shift ^ o.window[o.strstart + z - 1]) & o.hash_mask, M = o.prev[o.strstart & o.w_mask] = o.head[o.ins_h], o.head[o.ins_h] = o.strstart, --o.match_length != 0; ) ;
              o.strstart++;
            } else o.strstart += o.match_length, o.match_length = 0, o.ins_h = o.window[o.strstart], o.ins_h = (o.ins_h << o.hash_shift ^ o.window[o.strstart + 1]) & o.hash_mask;
            else k = a._tr_tally(o, 0, o.window[o.strstart]), o.lookahead--, o.strstart++;
            if (k && (L(o, !1), o.strm.avail_out === 0)) return f;
          }
          return o.insert = o.strstart < z - 1 ? o.strstart : z - 1, B === g ? (L(o, !0), o.strm.avail_out === 0 ? J : $) : o.last_lit && (L(o, !1), o.strm.avail_out === 0) ? f : P;
        }
        function rt(o, B) {
          for (var M, k, w; ; ) {
            if (o.lookahead < X) {
              if (at(o), o.lookahead < X && B === _) return f;
              if (o.lookahead === 0) break;
            }
            if (M = 0, o.lookahead >= z && (o.ins_h = (o.ins_h << o.hash_shift ^ o.window[o.strstart + z - 1]) & o.hash_mask, M = o.prev[o.strstart & o.w_mask] = o.head[o.ins_h], o.head[o.ins_h] = o.strstart), o.prev_length = o.match_length, o.prev_match = o.match_start, o.match_length = z - 1, M !== 0 && o.prev_length < o.max_lazy_match && o.strstart - M <= o.w_size - X && (o.match_length = K(o, M), o.match_length <= 5 && (o.strategy === 1 || o.match_length === z && 4096 < o.strstart - o.match_start) && (o.match_length = z - 1)), o.prev_length >= z && o.match_length <= o.prev_length) {
              for (w = o.strstart + o.lookahead - z, k = a._tr_tally(o, o.strstart - 1 - o.prev_match, o.prev_length - z), o.lookahead -= o.prev_length - 1, o.prev_length -= 2; ++o.strstart <= w && (o.ins_h = (o.ins_h << o.hash_shift ^ o.window[o.strstart + z - 1]) & o.hash_mask, M = o.prev[o.strstart & o.w_mask] = o.head[o.ins_h], o.head[o.ins_h] = o.strstart), --o.prev_length != 0; ) ;
              if (o.match_available = 0, o.match_length = z - 1, o.strstart++, k && (L(o, !1), o.strm.avail_out === 0)) return f;
            } else if (o.match_available) {
              if ((k = a._tr_tally(o, 0, o.window[o.strstart - 1])) && L(o, !1), o.strstart++, o.lookahead--, o.strm.avail_out === 0) return f;
            } else o.match_available = 1, o.strstart++, o.lookahead--;
          }
          return o.match_available && (k = a._tr_tally(o, 0, o.window[o.strstart - 1]), o.match_available = 0), o.insert = o.strstart < z - 1 ? o.strstart : z - 1, B === g ? (L(o, !0), o.strm.avail_out === 0 ? J : $) : o.last_lit && (L(o, !1), o.strm.avail_out === 0) ? f : P;
        }
        function it(o, B, M, k, w) {
          this.good_length = o, this.max_lazy = B, this.nice_length = M, this.max_chain = k, this.func = w;
        }
        function dt() {
          this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = y, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new i.Buf16(2 * T), this.dyn_dtree = new i.Buf16(2 * (2 * S + 1)), this.bl_tree = new i.Buf16(2 * (2 * N + 1)), Q(this.dyn_ltree), Q(this.dyn_dtree), Q(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new i.Buf16(U + 1), this.heap = new i.Buf16(2 * E + 1), Q(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new i.Buf16(2 * E + 1), Q(this.depth), this.l_buf = 0, this.lit_bufsize = 0, this.last_lit = 0, this.d_buf = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
        }
        function lt(o) {
          var B;
          return o && o.state ? (o.total_in = o.total_out = 0, o.data_type = h, (B = o.state).pending = 0, B.pending_out = 0, B.wrap < 0 && (B.wrap = -B.wrap), B.status = B.wrap ? C : R, o.adler = B.wrap === 2 ? 0 : 1, B.last_flush = _, a._tr_init(B), d) : tt(o, v);
        }
        function gt(o) {
          var B = lt(o);
          return B === d && (function(M) {
            M.window_size = 2 * M.w_size, Q(M.head), M.max_lazy_match = r[M.level].max_lazy, M.good_match = r[M.level].good_length, M.nice_match = r[M.level].nice_length, M.max_chain_length = r[M.level].max_chain, M.strstart = 0, M.block_start = 0, M.lookahead = 0, M.insert = 0, M.match_length = M.prev_length = z - 1, M.match_available = 0, M.ins_h = 0;
          })(o.state), B;
        }
        function pt(o, B, M, k, w, I) {
          if (!o) return v;
          var F = 1;
          if (B === c && (B = 6), k < 0 ? (F = 0, k = -k) : 15 < k && (F = 2, k -= 16), w < 1 || x < w || M !== y || k < 8 || 15 < k || B < 0 || 9 < B || I < 0 || p < I) return tt(o, v);
          k === 8 && (k = 9);
          var D = new dt();
          return (o.state = D).strm = o, D.wrap = F, D.gzhead = null, D.w_bits = k, D.w_size = 1 << D.w_bits, D.w_mask = D.w_size - 1, D.hash_bits = w + 7, D.hash_size = 1 << D.hash_bits, D.hash_mask = D.hash_size - 1, D.hash_shift = ~~((D.hash_bits + z - 1) / z), D.window = new i.Buf8(2 * D.w_size), D.head = new i.Buf16(D.hash_size), D.prev = new i.Buf16(D.w_size), D.lit_bufsize = 1 << w + 6, D.pending_buf_size = 4 * D.lit_bufsize, D.pending_buf = new i.Buf8(D.pending_buf_size), D.d_buf = 1 * D.lit_bufsize, D.l_buf = 3 * D.lit_bufsize, D.level = B, D.strategy = I, D.method = M, gt(o);
        }
        r = [new it(0, 0, 0, 0, function(o, B) {
          var M = 65535;
          for (M > o.pending_buf_size - 5 && (M = o.pending_buf_size - 5); ; ) {
            if (o.lookahead <= 1) {
              if (at(o), o.lookahead === 0 && B === _) return f;
              if (o.lookahead === 0) break;
            }
            o.strstart += o.lookahead, o.lookahead = 0;
            var k = o.block_start + M;
            if ((o.strstart === 0 || o.strstart >= k) && (o.lookahead = o.strstart - k, o.strstart = k, L(o, !1), o.strm.avail_out === 0) || o.strstart - o.block_start >= o.w_size - X && (L(o, !1), o.strm.avail_out === 0)) return f;
          }
          return o.insert = 0, B === g ? (L(o, !0), o.strm.avail_out === 0 ? J : $) : (o.strstart > o.block_start && (L(o, !1), o.strm.avail_out), f);
        }), new it(4, 4, 8, 4, ft), new it(4, 5, 16, 8, ft), new it(4, 6, 32, 32, ft), new it(4, 4, 16, 16, rt), new it(8, 16, 32, 32, rt), new it(8, 16, 128, 128, rt), new it(8, 32, 128, 256, rt), new it(32, 128, 258, 1024, rt), new it(32, 258, 258, 4096, rt)], e.deflateInit = function(o, B) {
          return pt(o, B, y, 15, 8, 0);
        }, e.deflateInit2 = pt, e.deflateReset = gt, e.deflateResetKeep = lt, e.deflateSetHeader = function(o, B) {
          return o && o.state ? o.state.wrap !== 2 ? v : (o.state.gzhead = B, d) : v;
        }, e.deflate = function(o, B) {
          var M, k, w, I;
          if (!o || !o.state || 5 < B || B < 0) return o ? tt(o, v) : v;
          if (k = o.state, !o.output || !o.input && o.avail_in !== 0 || k.status === 666 && B !== g) return tt(o, o.avail_out === 0 ? -5 : v);
          if (k.strm = o, M = k.last_flush, k.last_flush = B, k.status === C) if (k.wrap === 2) o.adler = 0, q(k, 31), q(k, 139), q(k, 8), k.gzhead ? (q(k, (k.gzhead.text ? 1 : 0) + (k.gzhead.hcrc ? 2 : 0) + (k.gzhead.extra ? 4 : 0) + (k.gzhead.name ? 8 : 0) + (k.gzhead.comment ? 16 : 0)), q(k, 255 & k.gzhead.time), q(k, k.gzhead.time >> 8 & 255), q(k, k.gzhead.time >> 16 & 255), q(k, k.gzhead.time >> 24 & 255), q(k, k.level === 9 ? 2 : 2 <= k.strategy || k.level < 2 ? 4 : 0), q(k, 255 & k.gzhead.os), k.gzhead.extra && k.gzhead.extra.length && (q(k, 255 & k.gzhead.extra.length), q(k, k.gzhead.extra.length >> 8 & 255)), k.gzhead.hcrc && (o.adler = m(o.adler, k.pending_buf, k.pending, 0)), k.gzindex = 0, k.status = 69) : (q(k, 0), q(k, 0), q(k, 0), q(k, 0), q(k, 0), q(k, k.level === 9 ? 2 : 2 <= k.strategy || k.level < 2 ? 4 : 0), q(k, 3), k.status = R);
          else {
            var F = y + (k.w_bits - 8 << 4) << 8;
            F |= (2 <= k.strategy || k.level < 2 ? 0 : k.level < 6 ? 1 : k.level === 6 ? 2 : 3) << 6, k.strstart !== 0 && (F |= 32), F += 31 - F % 31, k.status = R, H(k, F), k.strstart !== 0 && (H(k, o.adler >>> 16), H(k, 65535 & o.adler)), o.adler = 1;
          }
          if (k.status === 69) if (k.gzhead.extra) {
            for (w = k.pending; k.gzindex < (65535 & k.gzhead.extra.length) && (k.pending !== k.pending_buf_size || (k.gzhead.hcrc && k.pending > w && (o.adler = m(o.adler, k.pending_buf, k.pending - w, w)), O(o), w = k.pending, k.pending !== k.pending_buf_size)); ) q(k, 255 & k.gzhead.extra[k.gzindex]), k.gzindex++;
            k.gzhead.hcrc && k.pending > w && (o.adler = m(o.adler, k.pending_buf, k.pending - w, w)), k.gzindex === k.gzhead.extra.length && (k.gzindex = 0, k.status = 73);
          } else k.status = 73;
          if (k.status === 73) if (k.gzhead.name) {
            w = k.pending;
            do {
              if (k.pending === k.pending_buf_size && (k.gzhead.hcrc && k.pending > w && (o.adler = m(o.adler, k.pending_buf, k.pending - w, w)), O(o), w = k.pending, k.pending === k.pending_buf_size)) {
                I = 1;
                break;
              }
              I = k.gzindex < k.gzhead.name.length ? 255 & k.gzhead.name.charCodeAt(k.gzindex++) : 0, q(k, I);
            } while (I !== 0);
            k.gzhead.hcrc && k.pending > w && (o.adler = m(o.adler, k.pending_buf, k.pending - w, w)), I === 0 && (k.gzindex = 0, k.status = 91);
          } else k.status = 91;
          if (k.status === 91) if (k.gzhead.comment) {
            w = k.pending;
            do {
              if (k.pending === k.pending_buf_size && (k.gzhead.hcrc && k.pending > w && (o.adler = m(o.adler, k.pending_buf, k.pending - w, w)), O(o), w = k.pending, k.pending === k.pending_buf_size)) {
                I = 1;
                break;
              }
              I = k.gzindex < k.gzhead.comment.length ? 255 & k.gzhead.comment.charCodeAt(k.gzindex++) : 0, q(k, I);
            } while (I !== 0);
            k.gzhead.hcrc && k.pending > w && (o.adler = m(o.adler, k.pending_buf, k.pending - w, w)), I === 0 && (k.status = 103);
          } else k.status = 103;
          if (k.status === 103 && (k.gzhead.hcrc ? (k.pending + 2 > k.pending_buf_size && O(o), k.pending + 2 <= k.pending_buf_size && (q(k, 255 & o.adler), q(k, o.adler >> 8 & 255), o.adler = 0, k.status = R)) : k.status = R), k.pending !== 0) {
            if (O(o), o.avail_out === 0) return k.last_flush = -1, d;
          } else if (o.avail_in === 0 && Z(B) <= Z(M) && B !== g) return tt(o, -5);
          if (k.status === 666 && o.avail_in !== 0) return tt(o, -5);
          if (o.avail_in !== 0 || k.lookahead !== 0 || B !== _ && k.status !== 666) {
            var D = k.strategy === 2 ? (function(A, W) {
              for (var Y; ; ) {
                if (A.lookahead === 0 && (at(A), A.lookahead === 0)) {
                  if (W === _) return f;
                  break;
                }
                if (A.match_length = 0, Y = a._tr_tally(A, 0, A.window[A.strstart]), A.lookahead--, A.strstart++, Y && (L(A, !1), A.strm.avail_out === 0)) return f;
              }
              return A.insert = 0, W === g ? (L(A, !0), A.strm.avail_out === 0 ? J : $) : A.last_lit && (L(A, !1), A.strm.avail_out === 0) ? f : P;
            })(k, B) : k.strategy === 3 ? (function(A, W) {
              for (var Y, G, V, ot, nt = A.window; ; ) {
                if (A.lookahead <= j) {
                  if (at(A), A.lookahead <= j && W === _) return f;
                  if (A.lookahead === 0) break;
                }
                if (A.match_length = 0, A.lookahead >= z && 0 < A.strstart && (G = nt[V = A.strstart - 1]) === nt[++V] && G === nt[++V] && G === nt[++V]) {
                  ot = A.strstart + j;
                  do
                    ;
                  while (G === nt[++V] && G === nt[++V] && G === nt[++V] && G === nt[++V] && G === nt[++V] && G === nt[++V] && G === nt[++V] && G === nt[++V] && V < ot);
                  A.match_length = j - (ot - V), A.match_length > A.lookahead && (A.match_length = A.lookahead);
                }
                if (A.match_length >= z ? (Y = a._tr_tally(A, 1, A.match_length - z), A.lookahead -= A.match_length, A.strstart += A.match_length, A.match_length = 0) : (Y = a._tr_tally(A, 0, A.window[A.strstart]), A.lookahead--, A.strstart++), Y && (L(A, !1), A.strm.avail_out === 0)) return f;
              }
              return A.insert = 0, W === g ? (L(A, !0), A.strm.avail_out === 0 ? J : $) : A.last_lit && (L(A, !1), A.strm.avail_out === 0) ? f : P;
            })(k, B) : r[k.level].func(k, B);
            if (D !== J && D !== $ || (k.status = 666), D === f || D === J) return o.avail_out === 0 && (k.last_flush = -1), d;
            if (D === P && (B === 1 ? a._tr_align(k) : B !== 5 && (a._tr_stored_block(k, 0, 0, !1), B === 3 && (Q(k.head), k.lookahead === 0 && (k.strstart = 0, k.block_start = 0, k.insert = 0))), O(o), o.avail_out === 0)) return k.last_flush = -1, d;
          }
          return B !== g ? d : k.wrap <= 0 ? 1 : (k.wrap === 2 ? (q(k, 255 & o.adler), q(k, o.adler >> 8 & 255), q(k, o.adler >> 16 & 255), q(k, o.adler >> 24 & 255), q(k, 255 & o.total_in), q(k, o.total_in >> 8 & 255), q(k, o.total_in >> 16 & 255), q(k, o.total_in >> 24 & 255)) : (H(k, o.adler >>> 16), H(k, 65535 & o.adler)), O(o), 0 < k.wrap && (k.wrap = -k.wrap), k.pending !== 0 ? d : 1);
        }, e.deflateEnd = function(o) {
          var B;
          return o && o.state ? (B = o.state.status) !== C && B !== 69 && B !== 73 && B !== 91 && B !== 103 && B !== R && B !== 666 ? tt(o, v) : (o.state = null, B === R ? tt(o, -3) : d) : v;
        }, e.deflateSetDictionary = function(o, B) {
          var M, k, w, I, F, D, A, W, Y = B.length;
          if (!o || !o.state || (I = (M = o.state).wrap) === 2 || I === 1 && M.status !== C || M.lookahead) return v;
          for (I === 1 && (o.adler = u(o.adler, B, Y, 0)), M.wrap = 0, Y >= M.w_size && (I === 0 && (Q(M.head), M.strstart = 0, M.block_start = 0, M.insert = 0), W = new i.Buf8(M.w_size), i.arraySet(W, B, Y - M.w_size, M.w_size, 0), B = W, Y = M.w_size), F = o.avail_in, D = o.next_in, A = o.input, o.avail_in = Y, o.next_in = 0, o.input = B, at(M); M.lookahead >= z; ) {
            for (k = M.strstart, w = M.lookahead - (z - 1); M.ins_h = (M.ins_h << M.hash_shift ^ M.window[k + z - 1]) & M.hash_mask, M.prev[k & M.w_mask] = M.head[M.ins_h], M.head[M.ins_h] = k, k++, --w; ) ;
            M.strstart = k, M.lookahead = z - 1, at(M);
          }
          return M.strstart += M.lookahead, M.block_start = M.strstart, M.insert = M.lookahead, M.lookahead = 0, M.match_length = M.prev_length = z - 1, M.match_available = 0, o.next_in = D, o.input = A, o.avail_in = F, M.wrap = I, d;
        }, e.deflateInfo = "pako deflate (from Nodeca project)";
      }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./messages": 51, "./trees": 52 }], 47: [function(t, s, e) {
        s.exports = function() {
          this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
        };
      }, {}], 48: [function(t, s, e) {
        s.exports = function(r, i) {
          var a, u, m, b, _, g, d, v, c, p, h, y, x, E, S, N, T, U, z, j, X, C, R, f, P;
          a = r.state, u = r.next_in, f = r.input, m = u + (r.avail_in - 5), b = r.next_out, P = r.output, _ = b - (i - r.avail_out), g = b + (r.avail_out - 257), d = a.dmax, v = a.wsize, c = a.whave, p = a.wnext, h = a.window, y = a.hold, x = a.bits, E = a.lencode, S = a.distcode, N = (1 << a.lenbits) - 1, T = (1 << a.distbits) - 1;
          t: do {
            x < 15 && (y += f[u++] << x, x += 8, y += f[u++] << x, x += 8), U = E[y & N];
            e: for (; ; ) {
              if (y >>>= z = U >>> 24, x -= z, (z = U >>> 16 & 255) === 0) P[b++] = 65535 & U;
              else {
                if (!(16 & z)) {
                  if ((64 & z) == 0) {
                    U = E[(65535 & U) + (y & (1 << z) - 1)];
                    continue e;
                  }
                  if (32 & z) {
                    a.mode = 12;
                    break t;
                  }
                  r.msg = "invalid literal/length code", a.mode = 30;
                  break t;
                }
                j = 65535 & U, (z &= 15) && (x < z && (y += f[u++] << x, x += 8), j += y & (1 << z) - 1, y >>>= z, x -= z), x < 15 && (y += f[u++] << x, x += 8, y += f[u++] << x, x += 8), U = S[y & T];
                r: for (; ; ) {
                  if (y >>>= z = U >>> 24, x -= z, !(16 & (z = U >>> 16 & 255))) {
                    if ((64 & z) == 0) {
                      U = S[(65535 & U) + (y & (1 << z) - 1)];
                      continue r;
                    }
                    r.msg = "invalid distance code", a.mode = 30;
                    break t;
                  }
                  if (X = 65535 & U, x < (z &= 15) && (y += f[u++] << x, (x += 8) < z && (y += f[u++] << x, x += 8)), d < (X += y & (1 << z) - 1)) {
                    r.msg = "invalid distance too far back", a.mode = 30;
                    break t;
                  }
                  if (y >>>= z, x -= z, (z = b - _) < X) {
                    if (c < (z = X - z) && a.sane) {
                      r.msg = "invalid distance too far back", a.mode = 30;
                      break t;
                    }
                    if (R = h, (C = 0) === p) {
                      if (C += v - z, z < j) {
                        for (j -= z; P[b++] = h[C++], --z; ) ;
                        C = b - X, R = P;
                      }
                    } else if (p < z) {
                      if (C += v + p - z, (z -= p) < j) {
                        for (j -= z; P[b++] = h[C++], --z; ) ;
                        if (C = 0, p < j) {
                          for (j -= z = p; P[b++] = h[C++], --z; ) ;
                          C = b - X, R = P;
                        }
                      }
                    } else if (C += p - z, z < j) {
                      for (j -= z; P[b++] = h[C++], --z; ) ;
                      C = b - X, R = P;
                    }
                    for (; 2 < j; ) P[b++] = R[C++], P[b++] = R[C++], P[b++] = R[C++], j -= 3;
                    j && (P[b++] = R[C++], 1 < j && (P[b++] = R[C++]));
                  } else {
                    for (C = b - X; P[b++] = P[C++], P[b++] = P[C++], P[b++] = P[C++], 2 < (j -= 3); ) ;
                    j && (P[b++] = P[C++], 1 < j && (P[b++] = P[C++]));
                  }
                  break;
                }
              }
              break;
            }
          } while (u < m && b < g);
          u -= j = x >> 3, y &= (1 << (x -= j << 3)) - 1, r.next_in = u, r.next_out = b, r.avail_in = u < m ? m - u + 5 : 5 - (u - m), r.avail_out = b < g ? g - b + 257 : 257 - (b - g), a.hold = y, a.bits = x;
        };
      }, {}], 49: [function(t, s, e) {
        var r = t("../utils/common"), i = t("./adler32"), a = t("./crc32"), u = t("./inffast"), m = t("./inftrees"), b = 1, _ = 2, g = 0, d = -2, v = 1, c = 852, p = 592;
        function h(C) {
          return (C >>> 24 & 255) + (C >>> 8 & 65280) + ((65280 & C) << 8) + ((255 & C) << 24);
        }
        function y() {
          this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new r.Buf16(320), this.work = new r.Buf16(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
        }
        function x(C) {
          var R;
          return C && C.state ? (R = C.state, C.total_in = C.total_out = R.total = 0, C.msg = "", R.wrap && (C.adler = 1 & R.wrap), R.mode = v, R.last = 0, R.havedict = 0, R.dmax = 32768, R.head = null, R.hold = 0, R.bits = 0, R.lencode = R.lendyn = new r.Buf32(c), R.distcode = R.distdyn = new r.Buf32(p), R.sane = 1, R.back = -1, g) : d;
        }
        function E(C) {
          var R;
          return C && C.state ? ((R = C.state).wsize = 0, R.whave = 0, R.wnext = 0, x(C)) : d;
        }
        function S(C, R) {
          var f, P;
          return C && C.state ? (P = C.state, R < 0 ? (f = 0, R = -R) : (f = 1 + (R >> 4), R < 48 && (R &= 15)), R && (R < 8 || 15 < R) ? d : (P.window !== null && P.wbits !== R && (P.window = null), P.wrap = f, P.wbits = R, E(C))) : d;
        }
        function N(C, R) {
          var f, P;
          return C ? (P = new y(), (C.state = P).window = null, (f = S(C, R)) !== g && (C.state = null), f) : d;
        }
        var T, U, z = !0;
        function j(C) {
          if (z) {
            var R;
            for (T = new r.Buf32(512), U = new r.Buf32(32), R = 0; R < 144; ) C.lens[R++] = 8;
            for (; R < 256; ) C.lens[R++] = 9;
            for (; R < 280; ) C.lens[R++] = 7;
            for (; R < 288; ) C.lens[R++] = 8;
            for (m(b, C.lens, 0, 288, T, 0, C.work, { bits: 9 }), R = 0; R < 32; ) C.lens[R++] = 5;
            m(_, C.lens, 0, 32, U, 0, C.work, { bits: 5 }), z = !1;
          }
          C.lencode = T, C.lenbits = 9, C.distcode = U, C.distbits = 5;
        }
        function X(C, R, f, P) {
          var J, $ = C.state;
          return $.window === null && ($.wsize = 1 << $.wbits, $.wnext = 0, $.whave = 0, $.window = new r.Buf8($.wsize)), P >= $.wsize ? (r.arraySet($.window, R, f - $.wsize, $.wsize, 0), $.wnext = 0, $.whave = $.wsize) : (P < (J = $.wsize - $.wnext) && (J = P), r.arraySet($.window, R, f - P, J, $.wnext), (P -= J) ? (r.arraySet($.window, R, f - P, P, 0), $.wnext = P, $.whave = $.wsize) : ($.wnext += J, $.wnext === $.wsize && ($.wnext = 0), $.whave < $.wsize && ($.whave += J))), 0;
        }
        e.inflateReset = E, e.inflateReset2 = S, e.inflateResetKeep = x, e.inflateInit = function(C) {
          return N(C, 15);
        }, e.inflateInit2 = N, e.inflate = function(C, R) {
          var f, P, J, $, tt, Z, Q, O, L, q, H, K, at, ft, rt, it, dt, lt, gt, pt, o, B, M, k, w = 0, I = new r.Buf8(4), F = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
          if (!C || !C.state || !C.output || !C.input && C.avail_in !== 0) return d;
          (f = C.state).mode === 12 && (f.mode = 13), tt = C.next_out, J = C.output, Q = C.avail_out, $ = C.next_in, P = C.input, Z = C.avail_in, O = f.hold, L = f.bits, q = Z, H = Q, B = g;
          t: for (; ; ) switch (f.mode) {
            case v:
              if (f.wrap === 0) {
                f.mode = 13;
                break;
              }
              for (; L < 16; ) {
                if (Z === 0) break t;
                Z--, O += P[$++] << L, L += 8;
              }
              if (2 & f.wrap && O === 35615) {
                I[f.check = 0] = 255 & O, I[1] = O >>> 8 & 255, f.check = a(f.check, I, 2, 0), L = O = 0, f.mode = 2;
                break;
              }
              if (f.flags = 0, f.head && (f.head.done = !1), !(1 & f.wrap) || (((255 & O) << 8) + (O >> 8)) % 31) {
                C.msg = "incorrect header check", f.mode = 30;
                break;
              }
              if ((15 & O) != 8) {
                C.msg = "unknown compression method", f.mode = 30;
                break;
              }
              if (L -= 4, o = 8 + (15 & (O >>>= 4)), f.wbits === 0) f.wbits = o;
              else if (o > f.wbits) {
                C.msg = "invalid window size", f.mode = 30;
                break;
              }
              f.dmax = 1 << o, C.adler = f.check = 1, f.mode = 512 & O ? 10 : 12, L = O = 0;
              break;
            case 2:
              for (; L < 16; ) {
                if (Z === 0) break t;
                Z--, O += P[$++] << L, L += 8;
              }
              if (f.flags = O, (255 & f.flags) != 8) {
                C.msg = "unknown compression method", f.mode = 30;
                break;
              }
              if (57344 & f.flags) {
                C.msg = "unknown header flags set", f.mode = 30;
                break;
              }
              f.head && (f.head.text = O >> 8 & 1), 512 & f.flags && (I[0] = 255 & O, I[1] = O >>> 8 & 255, f.check = a(f.check, I, 2, 0)), L = O = 0, f.mode = 3;
            case 3:
              for (; L < 32; ) {
                if (Z === 0) break t;
                Z--, O += P[$++] << L, L += 8;
              }
              f.head && (f.head.time = O), 512 & f.flags && (I[0] = 255 & O, I[1] = O >>> 8 & 255, I[2] = O >>> 16 & 255, I[3] = O >>> 24 & 255, f.check = a(f.check, I, 4, 0)), L = O = 0, f.mode = 4;
            case 4:
              for (; L < 16; ) {
                if (Z === 0) break t;
                Z--, O += P[$++] << L, L += 8;
              }
              f.head && (f.head.xflags = 255 & O, f.head.os = O >> 8), 512 & f.flags && (I[0] = 255 & O, I[1] = O >>> 8 & 255, f.check = a(f.check, I, 2, 0)), L = O = 0, f.mode = 5;
            case 5:
              if (1024 & f.flags) {
                for (; L < 16; ) {
                  if (Z === 0) break t;
                  Z--, O += P[$++] << L, L += 8;
                }
                f.length = O, f.head && (f.head.extra_len = O), 512 & f.flags && (I[0] = 255 & O, I[1] = O >>> 8 & 255, f.check = a(f.check, I, 2, 0)), L = O = 0;
              } else f.head && (f.head.extra = null);
              f.mode = 6;
            case 6:
              if (1024 & f.flags && (Z < (K = f.length) && (K = Z), K && (f.head && (o = f.head.extra_len - f.length, f.head.extra || (f.head.extra = new Array(f.head.extra_len)), r.arraySet(f.head.extra, P, $, K, o)), 512 & f.flags && (f.check = a(f.check, P, K, $)), Z -= K, $ += K, f.length -= K), f.length)) break t;
              f.length = 0, f.mode = 7;
            case 7:
              if (2048 & f.flags) {
                if (Z === 0) break t;
                for (K = 0; o = P[$ + K++], f.head && o && f.length < 65536 && (f.head.name += String.fromCharCode(o)), o && K < Z; ) ;
                if (512 & f.flags && (f.check = a(f.check, P, K, $)), Z -= K, $ += K, o) break t;
              } else f.head && (f.head.name = null);
              f.length = 0, f.mode = 8;
            case 8:
              if (4096 & f.flags) {
                if (Z === 0) break t;
                for (K = 0; o = P[$ + K++], f.head && o && f.length < 65536 && (f.head.comment += String.fromCharCode(o)), o && K < Z; ) ;
                if (512 & f.flags && (f.check = a(f.check, P, K, $)), Z -= K, $ += K, o) break t;
              } else f.head && (f.head.comment = null);
              f.mode = 9;
            case 9:
              if (512 & f.flags) {
                for (; L < 16; ) {
                  if (Z === 0) break t;
                  Z--, O += P[$++] << L, L += 8;
                }
                if (O !== (65535 & f.check)) {
                  C.msg = "header crc mismatch", f.mode = 30;
                  break;
                }
                L = O = 0;
              }
              f.head && (f.head.hcrc = f.flags >> 9 & 1, f.head.done = !0), C.adler = f.check = 0, f.mode = 12;
              break;
            case 10:
              for (; L < 32; ) {
                if (Z === 0) break t;
                Z--, O += P[$++] << L, L += 8;
              }
              C.adler = f.check = h(O), L = O = 0, f.mode = 11;
            case 11:
              if (f.havedict === 0) return C.next_out = tt, C.avail_out = Q, C.next_in = $, C.avail_in = Z, f.hold = O, f.bits = L, 2;
              C.adler = f.check = 1, f.mode = 12;
            case 12:
              if (R === 5 || R === 6) break t;
            case 13:
              if (f.last) {
                O >>>= 7 & L, L -= 7 & L, f.mode = 27;
                break;
              }
              for (; L < 3; ) {
                if (Z === 0) break t;
                Z--, O += P[$++] << L, L += 8;
              }
              switch (f.last = 1 & O, L -= 1, 3 & (O >>>= 1)) {
                case 0:
                  f.mode = 14;
                  break;
                case 1:
                  if (j(f), f.mode = 20, R !== 6) break;
                  O >>>= 2, L -= 2;
                  break t;
                case 2:
                  f.mode = 17;
                  break;
                case 3:
                  C.msg = "invalid block type", f.mode = 30;
              }
              O >>>= 2, L -= 2;
              break;
            case 14:
              for (O >>>= 7 & L, L -= 7 & L; L < 32; ) {
                if (Z === 0) break t;
                Z--, O += P[$++] << L, L += 8;
              }
              if ((65535 & O) != (O >>> 16 ^ 65535)) {
                C.msg = "invalid stored block lengths", f.mode = 30;
                break;
              }
              if (f.length = 65535 & O, L = O = 0, f.mode = 15, R === 6) break t;
            case 15:
              f.mode = 16;
            case 16:
              if (K = f.length) {
                if (Z < K && (K = Z), Q < K && (K = Q), K === 0) break t;
                r.arraySet(J, P, $, K, tt), Z -= K, $ += K, Q -= K, tt += K, f.length -= K;
                break;
              }
              f.mode = 12;
              break;
            case 17:
              for (; L < 14; ) {
                if (Z === 0) break t;
                Z--, O += P[$++] << L, L += 8;
              }
              if (f.nlen = 257 + (31 & O), O >>>= 5, L -= 5, f.ndist = 1 + (31 & O), O >>>= 5, L -= 5, f.ncode = 4 + (15 & O), O >>>= 4, L -= 4, 286 < f.nlen || 30 < f.ndist) {
                C.msg = "too many length or distance symbols", f.mode = 30;
                break;
              }
              f.have = 0, f.mode = 18;
            case 18:
              for (; f.have < f.ncode; ) {
                for (; L < 3; ) {
                  if (Z === 0) break t;
                  Z--, O += P[$++] << L, L += 8;
                }
                f.lens[F[f.have++]] = 7 & O, O >>>= 3, L -= 3;
              }
              for (; f.have < 19; ) f.lens[F[f.have++]] = 0;
              if (f.lencode = f.lendyn, f.lenbits = 7, M = { bits: f.lenbits }, B = m(0, f.lens, 0, 19, f.lencode, 0, f.work, M), f.lenbits = M.bits, B) {
                C.msg = "invalid code lengths set", f.mode = 30;
                break;
              }
              f.have = 0, f.mode = 19;
            case 19:
              for (; f.have < f.nlen + f.ndist; ) {
                for (; it = (w = f.lencode[O & (1 << f.lenbits) - 1]) >>> 16 & 255, dt = 65535 & w, !((rt = w >>> 24) <= L); ) {
                  if (Z === 0) break t;
                  Z--, O += P[$++] << L, L += 8;
                }
                if (dt < 16) O >>>= rt, L -= rt, f.lens[f.have++] = dt;
                else {
                  if (dt === 16) {
                    for (k = rt + 2; L < k; ) {
                      if (Z === 0) break t;
                      Z--, O += P[$++] << L, L += 8;
                    }
                    if (O >>>= rt, L -= rt, f.have === 0) {
                      C.msg = "invalid bit length repeat", f.mode = 30;
                      break;
                    }
                    o = f.lens[f.have - 1], K = 3 + (3 & O), O >>>= 2, L -= 2;
                  } else if (dt === 17) {
                    for (k = rt + 3; L < k; ) {
                      if (Z === 0) break t;
                      Z--, O += P[$++] << L, L += 8;
                    }
                    L -= rt, o = 0, K = 3 + (7 & (O >>>= rt)), O >>>= 3, L -= 3;
                  } else {
                    for (k = rt + 7; L < k; ) {
                      if (Z === 0) break t;
                      Z--, O += P[$++] << L, L += 8;
                    }
                    L -= rt, o = 0, K = 11 + (127 & (O >>>= rt)), O >>>= 7, L -= 7;
                  }
                  if (f.have + K > f.nlen + f.ndist) {
                    C.msg = "invalid bit length repeat", f.mode = 30;
                    break;
                  }
                  for (; K--; ) f.lens[f.have++] = o;
                }
              }
              if (f.mode === 30) break;
              if (f.lens[256] === 0) {
                C.msg = "invalid code -- missing end-of-block", f.mode = 30;
                break;
              }
              if (f.lenbits = 9, M = { bits: f.lenbits }, B = m(b, f.lens, 0, f.nlen, f.lencode, 0, f.work, M), f.lenbits = M.bits, B) {
                C.msg = "invalid literal/lengths set", f.mode = 30;
                break;
              }
              if (f.distbits = 6, f.distcode = f.distdyn, M = { bits: f.distbits }, B = m(_, f.lens, f.nlen, f.ndist, f.distcode, 0, f.work, M), f.distbits = M.bits, B) {
                C.msg = "invalid distances set", f.mode = 30;
                break;
              }
              if (f.mode = 20, R === 6) break t;
            case 20:
              f.mode = 21;
            case 21:
              if (6 <= Z && 258 <= Q) {
                C.next_out = tt, C.avail_out = Q, C.next_in = $, C.avail_in = Z, f.hold = O, f.bits = L, u(C, H), tt = C.next_out, J = C.output, Q = C.avail_out, $ = C.next_in, P = C.input, Z = C.avail_in, O = f.hold, L = f.bits, f.mode === 12 && (f.back = -1);
                break;
              }
              for (f.back = 0; it = (w = f.lencode[O & (1 << f.lenbits) - 1]) >>> 16 & 255, dt = 65535 & w, !((rt = w >>> 24) <= L); ) {
                if (Z === 0) break t;
                Z--, O += P[$++] << L, L += 8;
              }
              if (it && (240 & it) == 0) {
                for (lt = rt, gt = it, pt = dt; it = (w = f.lencode[pt + ((O & (1 << lt + gt) - 1) >> lt)]) >>> 16 & 255, dt = 65535 & w, !(lt + (rt = w >>> 24) <= L); ) {
                  if (Z === 0) break t;
                  Z--, O += P[$++] << L, L += 8;
                }
                O >>>= lt, L -= lt, f.back += lt;
              }
              if (O >>>= rt, L -= rt, f.back += rt, f.length = dt, it === 0) {
                f.mode = 26;
                break;
              }
              if (32 & it) {
                f.back = -1, f.mode = 12;
                break;
              }
              if (64 & it) {
                C.msg = "invalid literal/length code", f.mode = 30;
                break;
              }
              f.extra = 15 & it, f.mode = 22;
            case 22:
              if (f.extra) {
                for (k = f.extra; L < k; ) {
                  if (Z === 0) break t;
                  Z--, O += P[$++] << L, L += 8;
                }
                f.length += O & (1 << f.extra) - 1, O >>>= f.extra, L -= f.extra, f.back += f.extra;
              }
              f.was = f.length, f.mode = 23;
            case 23:
              for (; it = (w = f.distcode[O & (1 << f.distbits) - 1]) >>> 16 & 255, dt = 65535 & w, !((rt = w >>> 24) <= L); ) {
                if (Z === 0) break t;
                Z--, O += P[$++] << L, L += 8;
              }
              if ((240 & it) == 0) {
                for (lt = rt, gt = it, pt = dt; it = (w = f.distcode[pt + ((O & (1 << lt + gt) - 1) >> lt)]) >>> 16 & 255, dt = 65535 & w, !(lt + (rt = w >>> 24) <= L); ) {
                  if (Z === 0) break t;
                  Z--, O += P[$++] << L, L += 8;
                }
                O >>>= lt, L -= lt, f.back += lt;
              }
              if (O >>>= rt, L -= rt, f.back += rt, 64 & it) {
                C.msg = "invalid distance code", f.mode = 30;
                break;
              }
              f.offset = dt, f.extra = 15 & it, f.mode = 24;
            case 24:
              if (f.extra) {
                for (k = f.extra; L < k; ) {
                  if (Z === 0) break t;
                  Z--, O += P[$++] << L, L += 8;
                }
                f.offset += O & (1 << f.extra) - 1, O >>>= f.extra, L -= f.extra, f.back += f.extra;
              }
              if (f.offset > f.dmax) {
                C.msg = "invalid distance too far back", f.mode = 30;
                break;
              }
              f.mode = 25;
            case 25:
              if (Q === 0) break t;
              if (K = H - Q, f.offset > K) {
                if ((K = f.offset - K) > f.whave && f.sane) {
                  C.msg = "invalid distance too far back", f.mode = 30;
                  break;
                }
                at = K > f.wnext ? (K -= f.wnext, f.wsize - K) : f.wnext - K, K > f.length && (K = f.length), ft = f.window;
              } else ft = J, at = tt - f.offset, K = f.length;
              for (Q < K && (K = Q), Q -= K, f.length -= K; J[tt++] = ft[at++], --K; ) ;
              f.length === 0 && (f.mode = 21);
              break;
            case 26:
              if (Q === 0) break t;
              J[tt++] = f.length, Q--, f.mode = 21;
              break;
            case 27:
              if (f.wrap) {
                for (; L < 32; ) {
                  if (Z === 0) break t;
                  Z--, O |= P[$++] << L, L += 8;
                }
                if (H -= Q, C.total_out += H, f.total += H, H && (C.adler = f.check = f.flags ? a(f.check, J, H, tt - H) : i(f.check, J, H, tt - H)), H = Q, (f.flags ? O : h(O)) !== f.check) {
                  C.msg = "incorrect data check", f.mode = 30;
                  break;
                }
                L = O = 0;
              }
              f.mode = 28;
            case 28:
              if (f.wrap && f.flags) {
                for (; L < 32; ) {
                  if (Z === 0) break t;
                  Z--, O += P[$++] << L, L += 8;
                }
                if (O !== (4294967295 & f.total)) {
                  C.msg = "incorrect length check", f.mode = 30;
                  break;
                }
                L = O = 0;
              }
              f.mode = 29;
            case 29:
              B = 1;
              break t;
            case 30:
              B = -3;
              break t;
            case 31:
              return -4;
            default:
              return d;
          }
          return C.next_out = tt, C.avail_out = Q, C.next_in = $, C.avail_in = Z, f.hold = O, f.bits = L, (f.wsize || H !== C.avail_out && f.mode < 30 && (f.mode < 27 || R !== 4)) && X(C, C.output, C.next_out, H - C.avail_out) ? (f.mode = 31, -4) : (q -= C.avail_in, H -= C.avail_out, C.total_in += q, C.total_out += H, f.total += H, f.wrap && H && (C.adler = f.check = f.flags ? a(f.check, J, H, C.next_out - H) : i(f.check, J, H, C.next_out - H)), C.data_type = f.bits + (f.last ? 64 : 0) + (f.mode === 12 ? 128 : 0) + (f.mode === 20 || f.mode === 15 ? 256 : 0), (q == 0 && H === 0 || R === 4) && B === g && (B = -5), B);
        }, e.inflateEnd = function(C) {
          if (!C || !C.state) return d;
          var R = C.state;
          return R.window && (R.window = null), C.state = null, g;
        }, e.inflateGetHeader = function(C, R) {
          var f;
          return C && C.state ? (2 & (f = C.state).wrap) == 0 ? d : ((f.head = R).done = !1, g) : d;
        }, e.inflateSetDictionary = function(C, R) {
          var f, P = R.length;
          return C && C.state ? (f = C.state).wrap !== 0 && f.mode !== 11 ? d : f.mode === 11 && i(1, R, P, 0) !== f.check ? -3 : X(C, R, P, P) ? (f.mode = 31, -4) : (f.havedict = 1, g) : d;
        }, e.inflateInfo = "pako inflate (from Nodeca project)";
      }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./inffast": 48, "./inftrees": 50 }], 50: [function(t, s, e) {
        var r = t("../utils/common"), i = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0], a = [16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78], u = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0], m = [16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64];
        s.exports = function(b, _, g, d, v, c, p, h) {
          var y, x, E, S, N, T, U, z, j, X = h.bits, C = 0, R = 0, f = 0, P = 0, J = 0, $ = 0, tt = 0, Z = 0, Q = 0, O = 0, L = null, q = 0, H = new r.Buf16(16), K = new r.Buf16(16), at = null, ft = 0;
          for (C = 0; C <= 15; C++) H[C] = 0;
          for (R = 0; R < d; R++) H[_[g + R]]++;
          for (J = X, P = 15; 1 <= P && H[P] === 0; P--) ;
          if (P < J && (J = P), P === 0) return v[c++] = 20971520, v[c++] = 20971520, h.bits = 1, 0;
          for (f = 1; f < P && H[f] === 0; f++) ;
          for (J < f && (J = f), C = Z = 1; C <= 15; C++) if (Z <<= 1, (Z -= H[C]) < 0) return -1;
          if (0 < Z && (b === 0 || P !== 1)) return -1;
          for (K[1] = 0, C = 1; C < 15; C++) K[C + 1] = K[C] + H[C];
          for (R = 0; R < d; R++) _[g + R] !== 0 && (p[K[_[g + R]]++] = R);
          if (T = b === 0 ? (L = at = p, 19) : b === 1 ? (L = i, q -= 257, at = a, ft -= 257, 256) : (L = u, at = m, -1), C = f, N = c, tt = R = O = 0, E = -1, S = (Q = 1 << ($ = J)) - 1, b === 1 && 852 < Q || b === 2 && 592 < Q) return 1;
          for (; ; ) {
            for (U = C - tt, j = p[R] < T ? (z = 0, p[R]) : p[R] > T ? (z = at[ft + p[R]], L[q + p[R]]) : (z = 96, 0), y = 1 << C - tt, f = x = 1 << $; v[N + (O >> tt) + (x -= y)] = U << 24 | z << 16 | j | 0, x !== 0; ) ;
            for (y = 1 << C - 1; O & y; ) y >>= 1;
            if (y !== 0 ? (O &= y - 1, O += y) : O = 0, R++, --H[C] == 0) {
              if (C === P) break;
              C = _[g + p[R]];
            }
            if (J < C && (O & S) !== E) {
              for (tt === 0 && (tt = J), N += f, Z = 1 << ($ = C - tt); $ + tt < P && !((Z -= H[$ + tt]) <= 0); ) $++, Z <<= 1;
              if (Q += 1 << $, b === 1 && 852 < Q || b === 2 && 592 < Q) return 1;
              v[E = O & S] = J << 24 | $ << 16 | N - c | 0;
            }
          }
          return O !== 0 && (v[N + O] = C - tt << 24 | 64 << 16 | 0), h.bits = J, 0;
        };
      }, { "../utils/common": 41 }], 51: [function(t, s, e) {
        s.exports = { 2: "need dictionary", 1: "stream end", 0: "", "-1": "file error", "-2": "stream error", "-3": "data error", "-4": "insufficient memory", "-5": "buffer error", "-6": "incompatible version" };
      }, {}], 52: [function(t, s, e) {
        var r = t("../utils/common"), i = 0, a = 1;
        function u(w) {
          for (var I = w.length; 0 <= --I; ) w[I] = 0;
        }
        var m = 0, b = 29, _ = 256, g = _ + 1 + b, d = 30, v = 19, c = 2 * g + 1, p = 15, h = 16, y = 7, x = 256, E = 16, S = 17, N = 18, T = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0], U = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13], z = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7], j = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15], X = new Array(2 * (g + 2));
        u(X);
        var C = new Array(2 * d);
        u(C);
        var R = new Array(512);
        u(R);
        var f = new Array(256);
        u(f);
        var P = new Array(b);
        u(P);
        var J, $, tt, Z = new Array(d);
        function Q(w, I, F, D, A) {
          this.static_tree = w, this.extra_bits = I, this.extra_base = F, this.elems = D, this.max_length = A, this.has_stree = w && w.length;
        }
        function O(w, I) {
          this.dyn_tree = w, this.max_code = 0, this.stat_desc = I;
        }
        function L(w) {
          return w < 256 ? R[w] : R[256 + (w >>> 7)];
        }
        function q(w, I) {
          w.pending_buf[w.pending++] = 255 & I, w.pending_buf[w.pending++] = I >>> 8 & 255;
        }
        function H(w, I, F) {
          w.bi_valid > h - F ? (w.bi_buf |= I << w.bi_valid & 65535, q(w, w.bi_buf), w.bi_buf = I >> h - w.bi_valid, w.bi_valid += F - h) : (w.bi_buf |= I << w.bi_valid & 65535, w.bi_valid += F);
        }
        function K(w, I, F) {
          H(w, F[2 * I], F[2 * I + 1]);
        }
        function at(w, I) {
          for (var F = 0; F |= 1 & w, w >>>= 1, F <<= 1, 0 < --I; ) ;
          return F >>> 1;
        }
        function ft(w, I, F) {
          var D, A, W = new Array(p + 1), Y = 0;
          for (D = 1; D <= p; D++) W[D] = Y = Y + F[D - 1] << 1;
          for (A = 0; A <= I; A++) {
            var G = w[2 * A + 1];
            G !== 0 && (w[2 * A] = at(W[G]++, G));
          }
        }
        function rt(w) {
          var I;
          for (I = 0; I < g; I++) w.dyn_ltree[2 * I] = 0;
          for (I = 0; I < d; I++) w.dyn_dtree[2 * I] = 0;
          for (I = 0; I < v; I++) w.bl_tree[2 * I] = 0;
          w.dyn_ltree[2 * x] = 1, w.opt_len = w.static_len = 0, w.last_lit = w.matches = 0;
        }
        function it(w) {
          8 < w.bi_valid ? q(w, w.bi_buf) : 0 < w.bi_valid && (w.pending_buf[w.pending++] = w.bi_buf), w.bi_buf = 0, w.bi_valid = 0;
        }
        function dt(w, I, F, D) {
          var A = 2 * I, W = 2 * F;
          return w[A] < w[W] || w[A] === w[W] && D[I] <= D[F];
        }
        function lt(w, I, F) {
          for (var D = w.heap[F], A = F << 1; A <= w.heap_len && (A < w.heap_len && dt(I, w.heap[A + 1], w.heap[A], w.depth) && A++, !dt(I, D, w.heap[A], w.depth)); ) w.heap[F] = w.heap[A], F = A, A <<= 1;
          w.heap[F] = D;
        }
        function gt(w, I, F) {
          var D, A, W, Y, G = 0;
          if (w.last_lit !== 0) for (; D = w.pending_buf[w.d_buf + 2 * G] << 8 | w.pending_buf[w.d_buf + 2 * G + 1], A = w.pending_buf[w.l_buf + G], G++, D === 0 ? K(w, A, I) : (K(w, (W = f[A]) + _ + 1, I), (Y = T[W]) !== 0 && H(w, A -= P[W], Y), K(w, W = L(--D), F), (Y = U[W]) !== 0 && H(w, D -= Z[W], Y)), G < w.last_lit; ) ;
          K(w, x, I);
        }
        function pt(w, I) {
          var F, D, A, W = I.dyn_tree, Y = I.stat_desc.static_tree, G = I.stat_desc.has_stree, V = I.stat_desc.elems, ot = -1;
          for (w.heap_len = 0, w.heap_max = c, F = 0; F < V; F++) W[2 * F] !== 0 ? (w.heap[++w.heap_len] = ot = F, w.depth[F] = 0) : W[2 * F + 1] = 0;
          for (; w.heap_len < 2; ) W[2 * (A = w.heap[++w.heap_len] = ot < 2 ? ++ot : 0)] = 1, w.depth[A] = 0, w.opt_len--, G && (w.static_len -= Y[2 * A + 1]);
          for (I.max_code = ot, F = w.heap_len >> 1; 1 <= F; F--) lt(w, W, F);
          for (A = V; F = w.heap[1], w.heap[1] = w.heap[w.heap_len--], lt(w, W, 1), D = w.heap[1], w.heap[--w.heap_max] = F, w.heap[--w.heap_max] = D, W[2 * A] = W[2 * F] + W[2 * D], w.depth[A] = (w.depth[F] >= w.depth[D] ? w.depth[F] : w.depth[D]) + 1, W[2 * F + 1] = W[2 * D + 1] = A, w.heap[1] = A++, lt(w, W, 1), 2 <= w.heap_len; ) ;
          w.heap[--w.heap_max] = w.heap[1], (function(nt, ht) {
            var Et, yt, St, ct, Mt, Yt, wt = ht.dyn_tree, se = ht.max_code, Me = ht.stat_desc.static_tree, Te = ht.stat_desc.has_stree, Ne = ht.stat_desc.extra_bits, ae = ht.stat_desc.extra_base, It = ht.stat_desc.max_length, Tt = 0;
            for (ct = 0; ct <= p; ct++) nt.bl_count[ct] = 0;
            for (wt[2 * nt.heap[nt.heap_max] + 1] = 0, Et = nt.heap_max + 1; Et < c; Et++) It < (ct = wt[2 * wt[2 * (yt = nt.heap[Et]) + 1] + 1] + 1) && (ct = It, Tt++), wt[2 * yt + 1] = ct, se < yt || (nt.bl_count[ct]++, Mt = 0, ae <= yt && (Mt = Ne[yt - ae]), Yt = wt[2 * yt], nt.opt_len += Yt * (ct + Mt), Te && (nt.static_len += Yt * (Me[2 * yt + 1] + Mt)));
            if (Tt !== 0) {
              do {
                for (ct = It - 1; nt.bl_count[ct] === 0; ) ct--;
                nt.bl_count[ct]--, nt.bl_count[ct + 1] += 2, nt.bl_count[It]--, Tt -= 2;
              } while (0 < Tt);
              for (ct = It; ct !== 0; ct--) for (yt = nt.bl_count[ct]; yt !== 0; ) se < (St = nt.heap[--Et]) || (wt[2 * St + 1] !== ct && (nt.opt_len += (ct - wt[2 * St + 1]) * wt[2 * St], wt[2 * St + 1] = ct), yt--);
            }
          })(w, I), ft(W, ot, w.bl_count);
        }
        function o(w, I, F) {
          var D, A, W = -1, Y = I[1], G = 0, V = 7, ot = 4;
          for (Y === 0 && (V = 138, ot = 3), I[2 * (F + 1) + 1] = 65535, D = 0; D <= F; D++) A = Y, Y = I[2 * (D + 1) + 1], ++G < V && A === Y || (G < ot ? w.bl_tree[2 * A] += G : A !== 0 ? (A !== W && w.bl_tree[2 * A]++, w.bl_tree[2 * E]++) : G <= 10 ? w.bl_tree[2 * S]++ : w.bl_tree[2 * N]++, W = A, ot = (G = 0) === Y ? (V = 138, 3) : A === Y ? (V = 6, 3) : (V = 7, 4));
        }
        function B(w, I, F) {
          var D, A, W = -1, Y = I[1], G = 0, V = 7, ot = 4;
          for (Y === 0 && (V = 138, ot = 3), D = 0; D <= F; D++) if (A = Y, Y = I[2 * (D + 1) + 1], !(++G < V && A === Y)) {
            if (G < ot) for (; K(w, A, w.bl_tree), --G != 0; ) ;
            else A !== 0 ? (A !== W && (K(w, A, w.bl_tree), G--), K(w, E, w.bl_tree), H(w, G - 3, 2)) : G <= 10 ? (K(w, S, w.bl_tree), H(w, G - 3, 3)) : (K(w, N, w.bl_tree), H(w, G - 11, 7));
            W = A, ot = (G = 0) === Y ? (V = 138, 3) : A === Y ? (V = 6, 3) : (V = 7, 4);
          }
        }
        u(Z);
        var M = !1;
        function k(w, I, F, D) {
          H(w, (m << 1) + (D ? 1 : 0), 3), (function(A, W, Y, G) {
            it(A), q(A, Y), q(A, ~Y), r.arraySet(A.pending_buf, A.window, W, Y, A.pending), A.pending += Y;
          })(w, I, F);
        }
        e._tr_init = function(w) {
          M || ((function() {
            var I, F, D, A, W, Y = new Array(p + 1);
            for (A = D = 0; A < b - 1; A++) for (P[A] = D, I = 0; I < 1 << T[A]; I++) f[D++] = A;
            for (f[D - 1] = A, A = W = 0; A < 16; A++) for (Z[A] = W, I = 0; I < 1 << U[A]; I++) R[W++] = A;
            for (W >>= 7; A < d; A++) for (Z[A] = W << 7, I = 0; I < 1 << U[A] - 7; I++) R[256 + W++] = A;
            for (F = 0; F <= p; F++) Y[F] = 0;
            for (I = 0; I <= 143; ) X[2 * I + 1] = 8, I++, Y[8]++;
            for (; I <= 255; ) X[2 * I + 1] = 9, I++, Y[9]++;
            for (; I <= 279; ) X[2 * I + 1] = 7, I++, Y[7]++;
            for (; I <= 287; ) X[2 * I + 1] = 8, I++, Y[8]++;
            for (ft(X, g + 1, Y), I = 0; I < d; I++) C[2 * I + 1] = 5, C[2 * I] = at(I, 5);
            J = new Q(X, T, _ + 1, g, p), $ = new Q(C, U, 0, d, p), tt = new Q(new Array(0), z, 0, v, y);
          })(), M = !0), w.l_desc = new O(w.dyn_ltree, J), w.d_desc = new O(w.dyn_dtree, $), w.bl_desc = new O(w.bl_tree, tt), w.bi_buf = 0, w.bi_valid = 0, rt(w);
        }, e._tr_stored_block = k, e._tr_flush_block = function(w, I, F, D) {
          var A, W, Y = 0;
          0 < w.level ? (w.strm.data_type === 2 && (w.strm.data_type = (function(G) {
            var V, ot = 4093624447;
            for (V = 0; V <= 31; V++, ot >>>= 1) if (1 & ot && G.dyn_ltree[2 * V] !== 0) return i;
            if (G.dyn_ltree[18] !== 0 || G.dyn_ltree[20] !== 0 || G.dyn_ltree[26] !== 0) return a;
            for (V = 32; V < _; V++) if (G.dyn_ltree[2 * V] !== 0) return a;
            return i;
          })(w)), pt(w, w.l_desc), pt(w, w.d_desc), Y = (function(G) {
            var V;
            for (o(G, G.dyn_ltree, G.l_desc.max_code), o(G, G.dyn_dtree, G.d_desc.max_code), pt(G, G.bl_desc), V = v - 1; 3 <= V && G.bl_tree[2 * j[V] + 1] === 0; V--) ;
            return G.opt_len += 3 * (V + 1) + 5 + 5 + 4, V;
          })(w), A = w.opt_len + 3 + 7 >>> 3, (W = w.static_len + 3 + 7 >>> 3) <= A && (A = W)) : A = W = F + 5, F + 4 <= A && I !== -1 ? k(w, I, F, D) : w.strategy === 4 || W === A ? (H(w, 2 + (D ? 1 : 0), 3), gt(w, X, C)) : (H(w, 4 + (D ? 1 : 0), 3), (function(G, V, ot, nt) {
            var ht;
            for (H(G, V - 257, 5), H(G, ot - 1, 5), H(G, nt - 4, 4), ht = 0; ht < nt; ht++) H(G, G.bl_tree[2 * j[ht] + 1], 3);
            B(G, G.dyn_ltree, V - 1), B(G, G.dyn_dtree, ot - 1);
          })(w, w.l_desc.max_code + 1, w.d_desc.max_code + 1, Y + 1), gt(w, w.dyn_ltree, w.dyn_dtree)), rt(w), D && it(w);
        }, e._tr_tally = function(w, I, F) {
          return w.pending_buf[w.d_buf + 2 * w.last_lit] = I >>> 8 & 255, w.pending_buf[w.d_buf + 2 * w.last_lit + 1] = 255 & I, w.pending_buf[w.l_buf + w.last_lit] = 255 & F, w.last_lit++, I === 0 ? w.dyn_ltree[2 * F]++ : (w.matches++, I--, w.dyn_ltree[2 * (f[F] + _ + 1)]++, w.dyn_dtree[2 * L(I)]++), w.last_lit === w.lit_bufsize - 1;
        }, e._tr_align = function(w) {
          H(w, 2, 3), K(w, x, X), (function(I) {
            I.bi_valid === 16 ? (q(I, I.bi_buf), I.bi_buf = 0, I.bi_valid = 0) : 8 <= I.bi_valid && (I.pending_buf[I.pending++] = 255 & I.bi_buf, I.bi_buf >>= 8, I.bi_valid -= 8);
          })(w);
        };
      }, { "../utils/common": 41 }], 53: [function(t, s, e) {
        s.exports = function() {
          this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
        };
      }, {}], 54: [function(t, s, e) {
        (function(r) {
          (function(i, a) {
            if (!i.setImmediate) {
              var u, m, b, _, g = 1, d = {}, v = !1, c = i.document, p = Object.getPrototypeOf && Object.getPrototypeOf(i);
              p = p && p.setTimeout ? p : i, u = {}.toString.call(i.process) === "[object process]" ? function(E) {
                process.nextTick(function() {
                  y(E);
                });
              } : (function() {
                if (i.postMessage && !i.importScripts) {
                  var E = !0, S = i.onmessage;
                  return i.onmessage = function() {
                    E = !1;
                  }, i.postMessage("", "*"), i.onmessage = S, E;
                }
              })() ? (_ = "setImmediate$" + Math.random() + "$", i.addEventListener ? i.addEventListener("message", x, !1) : i.attachEvent("onmessage", x), function(E) {
                i.postMessage(_ + E, "*");
              }) : i.MessageChannel ? ((b = new MessageChannel()).port1.onmessage = function(E) {
                y(E.data);
              }, function(E) {
                b.port2.postMessage(E);
              }) : c && "onreadystatechange" in c.createElement("script") ? (m = c.documentElement, function(E) {
                var S = c.createElement("script");
                S.onreadystatechange = function() {
                  y(E), S.onreadystatechange = null, m.removeChild(S), S = null;
                }, m.appendChild(S);
              }) : function(E) {
                setTimeout(y, 0, E);
              }, p.setImmediate = function(E) {
                typeof E != "function" && (E = new Function("" + E));
                for (var S = new Array(arguments.length - 1), N = 0; N < S.length; N++) S[N] = arguments[N + 1];
                var T = { callback: E, args: S };
                return d[g] = T, u(g), g++;
              }, p.clearImmediate = h;
            }
            function h(E) {
              delete d[E];
            }
            function y(E) {
              if (v) setTimeout(y, 0, E);
              else {
                var S = d[E];
                if (S) {
                  v = !0;
                  try {
                    (function(N) {
                      var T = N.callback, U = N.args;
                      switch (U.length) {
                        case 0:
                          T();
                          break;
                        case 1:
                          T(U[0]);
                          break;
                        case 2:
                          T(U[0], U[1]);
                          break;
                        case 3:
                          T(U[0], U[1], U[2]);
                          break;
                        default:
                          T.apply(a, U);
                      }
                    })(S);
                  } finally {
                    h(E), v = !1;
                  }
                }
              }
            }
            function x(E) {
              E.source === i && typeof E.data == "string" && E.data.indexOf(_) === 0 && y(+E.data.slice(_.length));
            }
          })(typeof self > "u" ? r === void 0 ? this : r : self);
        }).call(this, typeof Nt < "u" ? Nt : typeof self < "u" ? self : typeof window < "u" ? window : {});
      }, {}] }, {}, [10])(10);
    });
  })(Vt)), Vt.exports;
}
var zr = Lr();
const Or = /* @__PURE__ */ Ar(zr), kt = {
  maxCompressedBytes: 100 * 1024 * 1024,
  maxEntries: 2e3,
  maxEntryBytes: 100 * 1024 * 1024,
  maxTotalUncompressedBytes: 250 * 1024 * 1024,
  maxCompressionRatio: 1e3,
  maxAssetBytes: 10 * 1024 * 1024
};
function he(n) {
  return n._data ?? {};
}
class ie {
  zip;
  files;
  primaryKmlPath;
  assetCache = /* @__PURE__ */ new Map();
  constructor(l, t, s) {
    this.zip = l, this.files = t, this.primaryKmlPath = s;
  }
  static async open(l) {
    if (l.byteLength > kt.maxCompressedBytes) throw new Error(`KMZ exceeds the ${kt.maxCompressedBytes / 1024 / 1024} MB compressed-size limit.`);
    let s;
    try {
      s = await Or.loadAsync(l, { checkCRC32: !1, createFolders: !1 });
    } catch (u) {
      throw new Error(`The KMZ archive is corrupted or unsupported: ${u instanceof Error ? u.message : String(u)}`);
    }
    const e = Object.values(s.files).filter((u) => !u.dir);
    if (e.length > kt.maxEntries) throw new Error(`KMZ contains ${e.length} files; the limit is ${kt.maxEntries}.`);
    const r = /* @__PURE__ */ new Map();
    let i = 0;
    for (const u of e) {
      const m = u.unsafeOriginalName ?? u.name, b = Dt(m);
      if (!b || b !== m.replace(/\\/g, "/")) throw new Error(`KMZ contains an unsafe archive path: ${m}`);
      const _ = he(u), g = _.uncompressedSize ?? 0, d = _.compressedSize ?? 0;
      if (g > kt.maxEntryBytes) throw new Error(`KMZ entry ${u.name} exceeds the per-file extraction limit.`);
      if (d > 0 && g / d > kt.maxCompressionRatio) throw new Error(`KMZ entry ${u.name} exceeds the compression-ratio limit.`);
      if (i += g, i > kt.maxTotalUncompressedBytes) throw new Error("KMZ exceeds the total uncompressed-size limit.");
      r.set(u.name.toLowerCase(), u);
    }
    const a = e.filter((u) => u.name.toLowerCase().endsWith(".kml"));
    if (a.length === 0) throw new Error("The KMZ archive does not contain a KML document.");
    return a.sort((u, m) => {
      const b = u.name.toLowerCase() === "doc.kml" ? -1 : 0, _ = m.name.toLowerCase() === "doc.kml" ? -1 : 0;
      return b - _ || u.name.split("/").length - m.name.split("/").length || u.name.localeCompare(m.name);
    }), new ie(s, r, a[0].name);
  }
  has(l, t = this.primaryKmlPath) {
    const s = Dt(l, t);
    return s ? this.files.has(s.toLowerCase()) : !1;
  }
  async readText(l = this.primaryKmlPath) {
    const t = this.files.get(l.toLowerCase());
    if (!t) throw new Error(`Archive file not found: ${l}`);
    const s = await t.async("uint8array");
    return new TextDecoder("utf-8", { fatal: !1 }).decode(s);
  }
  async readBytes(l) {
    const t = this.files.get(l.toLowerCase());
    if (!t) throw new Error(`Archive file not found: ${l}`);
    return t.async("uint8array");
  }
  async resolve(l, t = this.primaryKmlPath) {
    try {
      const s = new URL(l);
      return ["https:", "http:"].includes(s.protocol) ? s.href : void 0;
    } catch {
      const s = Dt(l, t);
      if (!s) return;
      const e = s.toLowerCase(), r = this.assetCache.get(e);
      if (r) return r;
      const i = this.resolveArchiveAsset(s, e);
      return this.assetCache.set(e, i), i;
    }
  }
  async resolveArchiveAsset(l, t) {
    const s = this.files.get(t);
    if (!s || (he(s).uncompressedSize ?? 0) > kt.maxAssetBytes) return;
    const r = await s.async("uint8array");
    if (!(r.byteLength > kt.maxAssetBytes))
      return er(r, tr(l));
  }
}
function Mr(n) {
  return n[0] === 80 && n[1] === 75;
}
function Tr(n, l) {
  n.featureCollection.features.push(...l.featureCollection.features), n.overlays.push(...l.overlays), n.networkLinks.push(...l.networkLinks), n.models.push(...l.models), n.warnings.push(...l.warnings);
  for (const t of Object.keys(n.summary)) n.summary[t] += l.summary[t];
}
async function Jt(n, l) {
  if (Mr(n) || l.toLowerCase().endsWith(".kmz")) {
    const s = await ie.open(n);
    return { parsed: await ee(await s.readText(), { sourceFilename: l, basePath: s.primaryKmlPath, assetResolver: s }), archive: s };
  }
  const t = new TextDecoder("utf-8", { fatal: !1 }).decode(n);
  return { parsed: await ee(t, { sourceFilename: l, assetResolver: new rr() }) };
}
async function Nr(n, l = {}) {
  if (!/\.(?:kml|kmz)$/i.test(n.name)) throw new Error("Choose a .kml or .kmz file.");
  if (n.size > 100 * 1024 * 1024) throw new Error("The selected file exceeds the 100 MB input limit.");
  l.onStatus?.(`Reading ${n.name}…`);
  const t = await Jt(new Uint8Array(await n.arrayBuffer()), n.name), s = t.parsed;
  if (!l.loadNetworkLinks || s.networkLinks.length === 0) return s;
  const e = Math.min(5, Math.max(0, l.maxNetworkDepth ?? 2)), r = Math.min(50, Math.max(1, l.maxNetworkResources ?? 10)), i = /* @__PURE__ */ new Set();
  let a = 0;
  const u = async (m, b, _, g) => {
    if (!(g >= e))
      for (const d of m.networkLinks) {
        if (!d.href || a >= r) break;
        let v;
        try {
          if (d.kind === "archive" && b) {
            const c = Dt(d.href, _ ?? b.primaryKmlPath);
            if (!c || !b.has(c, "")) continue;
            const p = `archive:${c.toLowerCase()}`;
            if (i.has(p)) continue;
            i.add(p), a += 1, l.onStatus?.(`Loading linked archive resource ${c}…`), c.toLowerCase().endsWith(".kml") ? v = { parsed: await ee(await b.readText(c), { sourceFilename: c.split("/").at(-1) ?? c, basePath: c, assetResolver: b }), archive: b } : v = await Jt(await b.readBytes(c), c.split("/").at(-1) ?? c);
          } else if (d.kind === "https") {
            const c = new URL(d.href);
            if (c.protocol !== "https:") {
              s.warnings.push({ code: "network-link", message: `NetworkLink was not fetched because only HTTPS is allowed: ${d.href}` });
              continue;
            }
            const p = c.href;
            if (i.has(p)) continue;
            i.add(p), a += 1, l.onStatus?.(`Loading linked KML resource ${c.hostname}…`);
            const h = await fetch(c.href, { credentials: "omit", redirect: "follow" });
            if (!h.ok) throw new Error(`HTTP ${h.status}`);
            if (Number(h.headers.get("content-length") ?? 0) > 20 * 1024 * 1024) throw new Error("linked resource exceeds the 20 MB limit");
            const x = new Uint8Array(await h.arrayBuffer());
            if (x.byteLength > 20 * 1024 * 1024) throw new Error("linked resource exceeds the 20 MB limit");
            v = await Jt(x, c.pathname.split("/").at(-1) || "linked.kml");
          }
          v && (Tr(s, v.parsed), await u(v.parsed, v.archive, v.archive?.primaryKmlPath, g + 1));
        } catch (c) {
          s.warnings.push({ code: "network-link", message: `NetworkLink “${d.name}” could not be loaded: ${c instanceof Error ? c.message : String(c)}` });
        }
      }
  };
  return await u(t.parsed, t.archive, t.archive?.primaryKmlPath, 0), a >= r && s.warnings.push({ code: "security-limit", message: `NetworkLink loading stopped at the ${r}-resource safety limit.` }), s;
}
const Gt = 85.0511287798066, we = 512, Pr = 14, Rr = 128;
function Ut(n) {
  return Math.max(-Gt, Math.min(Gt, n));
}
function Br(n, l) {
  let t = n;
  for (; t - l > 180; ) t -= 360;
  for (; t - l < -180; ) t += 360;
  return t;
}
function ke(n, l) {
  let t = l;
  for (; t < n; ) t += 360;
  return Math.min(t, n + 360);
}
function xe(n) {
  if (!n.coordinates) return;
  const l = n.coordinates[0][0];
  return n.coordinates.map((t) => [Br(t[0], l), t[1]]);
}
function Ce(n) {
  if (n.bounds && n.rotation === 0) {
    const [r, i, a, u] = n.bounds, m = ke(r, a);
    return ![r, i, m, u].every(Number.isFinite) || m <= r || u <= i ? void 0 : [r, Ut(i), m, Ut(u)];
  }
  const l = xe(n);
  if (!l) return;
  const t = l.map((r) => r[0]), s = l.map((r) => Ut(r[1])), e = [Math.min(...t), Math.min(...s), Math.max(...t), Math.max(...s)];
  return e[2] > e[0] && e[3] > e[1] ? e : void 0;
}
function Kt(n) {
  const l = Ut(n) * Math.PI / 180;
  return (1 - Math.asinh(Math.tan(l)) / Math.PI) / 2;
}
function re(n) {
  return Math.atan(Math.sinh(Math.PI * (1 - 2 * n))) * 180 / Math.PI;
}
function Fr(n, l, t) {
  const s = 2 ** t;
  return [
    n / s * 360 - 180,
    re((l + 1) / s),
    (n + 1) / s * 360 - 180,
    re(l / s)
  ];
}
function Dr(n, l, t) {
  const s = Fr(n, l, t), e = Math.max(1e-10, (s[2] - s[0]) * 1e-9), r = Math.max(1e-10, (s[3] - s[1]) * 1e-9);
  return [s[0] + e, s[1] + r, s[2] - e, s[3] - r];
}
function Ee(n, l) {
  const [t, s, e, r] = n, i = 2 ** l, a = Math.floor((t + 180) / 360 * i), u = Math.ceil((e + 180) / 360 * i) - 1, m = Math.max(0, Math.floor(Kt(r) * i)), b = Math.min(i - 1, Math.ceil(Kt(s) * i) - 1);
  return { minX: a, maxX: u, minY: m, maxY: b };
}
function Ur(n) {
  return Math.max(0, n.maxX - n.minX + 1) * Math.max(0, n.maxY - n.minY + 1);
}
function jr(n, l, t, s) {
  const e = n[2] - n[0], r = Math.max(Number.EPSILON, Kt(n[1]) - Kt(n[3])), i = l * 360 / e, a = t / r;
  let u = Math.max(0, Math.min(Pr, Math.ceil(Math.log2(Math.max(i, a) / s))));
  for (; u > 0 && Ur(Ee(n, u)) > Rr; ) u -= 1;
  return u;
}
function $r(n, l, t, s = we) {
  const e = Ce(n);
  if (!e || l <= 0 || t <= 0 || s <= 0) return { targetZoom: 0, tiles: [] };
  const r = jr(e, l, t, s), i = [];
  for (let a = 0; a <= r; a += 1) {
    const u = 2 ** a, m = Ee(e, a);
    for (let b = m.minY; b <= m.maxY; b += 1)
      for (let _ = m.minX; _ <= m.maxX; _ += 1) {
        const g = (_ % u + u) % u;
        i.push({ z: a, x: g, y: b, rawX: _, bounds: Dr(g, b, a) });
      }
  }
  return { targetZoom: r, tiles: i };
}
function Zr(n, l, t) {
  if (!n.bounds || n.rotation !== 0) return;
  const [s, e, r, i] = n.bounds, a = ke(s, r);
  let u = l;
  const m = (s + a) / 2;
  for (; u - m > 180; ) u -= 360;
  for (; u - m < -180; ) u += 360;
  return [(u - s) / (a - s), (i - t) / (i - e)];
}
function qt(n, l, t) {
  const s = n[0][0] + (n[1][0] - n[0][0]) * l, e = n[0][1] + (n[1][1] - n[0][1]) * l, r = n[3][0] + (n[2][0] - n[3][0]) * l, i = n[3][1] + (n[2][1] - n[3][1]) * l;
  return [s + (r - s) * t, e + (i - e) * t];
}
function Wr(n, l, t) {
  const s = n.map((m) => m[0]), e = n.map((m) => m[1]);
  let r = l;
  const i = (Math.min(...s) + Math.max(...s)) / 2;
  for (; r - i > 180; ) r -= 360;
  for (; r - i < -180; ) r += 360;
  let a = (r - Math.min(...s)) / Math.max(Number.EPSILON, Math.max(...s) - Math.min(...s)), u = (Math.max(...e) - t) / Math.max(Number.EPSILON, Math.max(...e) - Math.min(...e));
  for (let m = 0; m < 6; m += 1) {
    const b = qt(n, a, u), _ = 1e-5, g = qt(n, a + _, u), d = qt(n, a, u + _), v = b[0] - r, c = b[1] - t, p = (g[0] - b[0]) / _, h = (g[1] - b[1]) / _, y = (d[0] - b[0]) / _, x = (d[1] - b[1]) / _, E = p * x - y * h;
    if (Math.abs(E) < 1e-12) return;
    a -= (v * x - c * y) / E, u -= (p * c - h * v) / E;
  }
  return Number.isFinite(a) && Number.isFinite(u) ? [a, u] : void 0;
}
function Gr(n, l, t, s) {
  return Zr(n, t, s) ?? (l ? Wr(l, t, s) : void 0);
}
async function Kr(n, l, t = we) {
  const s = Ce(n), e = s && s[0] >= -180 && s[2] <= 180 ? s : [-180, s?.[1] ?? -Gt, 180, s?.[3] ?? Gt];
  if (!n.imageUrl) return { tileSize: t, targetZoom: 0, bounds: e, tiles: [] };
  const r = await l(n.imageUrl);
  if (!r || r.width <= 0 || r.height <= 0) throw new Error("the overlay image could not be decoded for raster conversion");
  const i = $r(n, r.width, r.height, t);
  if (!i.tiles.length) return { tileSize: t, targetZoom: i.targetZoom, bounds: e, tiles: [] };
  const a = document.createElement("canvas");
  a.width = r.width, a.height = r.height;
  const u = a.getContext("2d", { willReadFrequently: !0 });
  if (!u) throw new Error("the browser could not create a source canvas for raster conversion");
  u.drawImage(r, 0, 0);
  const m = u.getImageData(0, 0, r.width, r.height).data, b = n.rotation !== 0 || !n.bounds ? xe(n) : void 0, _ = [];
  for (const g of i.tiles) {
    const d = document.createElement("canvas");
    d.width = t, d.height = t;
    const v = d.getContext("2d");
    if (!v) throw new Error("the browser could not create an XYZ tile canvas");
    const c = v.createImageData(t, t);
    let p = !1;
    const h = 2 ** g.z;
    for (let y = 0; y < t; y += 1) {
      const x = re((g.y + (y + 0.5) / t) / h);
      for (let E = 0; E < t; E += 1) {
        const S = (g.rawX + (E + 0.5) / t) / h * 360 - 180, N = Gr(n, b, S, x);
        if (!N || N[0] < 0 || N[0] > 1 || N[1] < 0 || N[1] > 1) continue;
        const T = Math.min(r.width - 1, Math.max(0, Math.floor(N[0] * r.width))), z = (Math.min(r.height - 1, Math.max(0, Math.floor(N[1] * r.height))) * r.width + T) * 4, j = (y * t + E) * 4;
        c.data[j] = m[z] ?? 0, c.data[j + 1] = m[z + 1] ?? 0, c.data[j + 2] = m[z + 2] ?? 0, c.data[j + 3] = m[z + 3] ?? 0, (m[z + 3] ?? 0) > 0 && (p = !0);
      }
    }
    p && (v.putImageData(c, 0, 0), _.push({ ...g, imageUrl: d.toDataURL("image/png") }));
  }
  return { tileSize: t, targetZoom: i.targetZoom, bounds: e, tiles: _ };
}
let Hr = 0;
function Yr(n) {
  return n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "layer";
}
function Xr(n) {
  return /* @__PURE__ */ new Map([["Features", n]]);
}
async function oe(n) {
  if (typeof createImageBitmap == "function")
    try {
      return await createImageBitmap(await (await fetch(n)).blob());
    } catch {
    }
  try {
    const l = new Image();
    return l.src = n, await l.decode(), l;
  } catch {
    return;
  }
}
async function Se(n) {
  if (!n) return;
  const l = await oe(n);
  if (l)
    try {
      const t = document.createElement("canvas");
      t.width = Math.max(1, Math.min(128, l.width)), t.height = Math.max(1, Math.min(128, l.height));
      const s = t.getContext("2d", { willReadFrequently: !0 });
      if (!s) return;
      s.drawImage(l, 0, 0, t.width, t.height);
      const e = s.getImageData(0, 0, t.width, t.height).data;
      let r = 0, i = 0, a = 0, u = 0;
      for (let m = 0; m < e.length; m += 4) {
        const b = e[m] ?? 0, _ = e[m + 1] ?? 0, g = e[m + 2] ?? 0, d = e[m + 3] ?? 0;
        if (d < 32) continue;
        const v = Math.max(b, _, g) - Math.min(b, _, g), c = d / 255 * (1 + v / 255);
        r += b * c, i += _ * c, a += g * c, u += c;
      }
      return u ? `#${[r, i, a].map((m) => Math.round(m / u).toString(16).padStart(2, "0")).join("")}` : void 0;
    } catch {
      return;
    }
}
function Qt(n, l = 1, t = "#e5df67") {
  const s = /^#[0-9a-f]{6}$/i.test(n ?? "") ? n : t;
  return [
    Number.parseInt(s.slice(1, 3), 16),
    Number.parseInt(s.slice(3, 5), 16),
    Number.parseInt(s.slice(5, 7), 16),
    Math.round(Math.max(0, Math.min(1, l)) * 255)
  ];
}
const Ct = 64, Vr = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${Ct}" height="${Ct}" viewBox="0 0 ${Ct} ${Ct}"><circle cx="32" cy="32" r="29" fill="white" stroke="white" stroke-width="2"/></svg>`
)}`, Jr = {
  dot: { x: 0, y: 0, width: Ct, height: Ct, anchorX: 32, anchorY: 32, mask: !0 }
};
function Ie(n) {
  if (n.type === "GeometryCollection") return n.geometries.some(Ie);
  let l = !1;
  const t = (s) => {
    if (!(l || !Array.isArray(s))) {
      if (typeof s[0] == "number" && typeof s[1] == "number") {
        l = typeof s[2] == "number" && Number.isFinite(s[2]) && s[2] !== 0;
        return;
      }
      for (const e of s) t(e);
    }
  };
  return t(n.coordinates), l;
}
const qr = /* @__PURE__ */ new Set(["descriptionFormat", "extendedData", "folderPath", "sourceFilename", "styleUrl"]);
function Qr(n) {
  const l = {};
  n.name !== void 0 && (l.name = n.name);
  for (const [t, s] of Object.entries(n))
    t === "name" || t.startsWith("__") || qr.has(t) || s === void 0 || (l[t] = s);
  return n.folderPath && (l.Folder = n.folderPath), l;
}
function tn(n) {
  return n.map((l, t) => {
    const s = l.properties.__kmlStyle;
    return {
      feature: {
        ...l,
        id: l.id ?? t,
        properties: Qr(l.properties)
      },
      style: s,
      state: {
        fillColor: s?.polyColor?.hex ?? "#3b82f6",
        fillOpacity: s?.fill === !1 ? 0 : s?.polyColor?.opacity ?? 0.35,
        lineColor: s?.lineColor?.hex ?? "#2563eb",
        lineOpacity: s?.lineColor?.opacity ?? 1,
        lineWidth: s?.lineWidth ?? 2,
        pointColor: s?.iconColor?.hex ?? "#e5df67",
        pointOpacity: s?.iconColor?.opacity ?? 0.9,
        pointRadius: Math.max(3, 6 * (s?.iconScale ?? 1))
      }
    };
  });
}
async function en(n) {
  const l = n.find((e) => ["Point", "MultiPoint"].includes(e.feature.geometry.type)), t = n.find((e) => ["LineString", "MultiLineString"].includes(e.feature.geometry.type)), s = l?.style?.iconColor?.hex ?? await Se(l?.style?.iconHref) ?? "#e5df67";
  return {
    fillColor: s,
    fillOpacity: l?.style?.iconColor?.opacity ?? 0.95,
    strokeColor: t?.style?.lineColor?.hex ?? s,
    strokeWidth: t?.style?.lineWidth ?? 1,
    circleRadius: Math.max(3, 6 * (l?.style?.iconScale ?? 1)),
    elevation3dEnabled: !0,
    elevation3dVerticalScale: 1,
    elevation3dOffset: 0
  };
}
function Ae(n, l, t) {
  const s = n.queryTerrainElevation?.([l, t], { exaggerated: !1 });
  return Number.isFinite(s) ? s : 0;
}
function rn(n, l, t) {
  const [s = 0, e = 0, r = 0] = n, i = Ae(t, s, e);
  return l === "absolute" ? [s, e, Number.isFinite(r) ? r : 0] : l === "relativeToGround" || l === "relativeToSeaFloor" ? [s, e, i + (Number.isFinite(r) ? r : 0)] : [s, e, i];
}
function Le(n, l, t) {
  if (n.type === "GeometryCollection")
    return { ...n, geometries: n.geometries.map((e) => Le(e, l, t)) };
  const s = (e) => Array.isArray(e) ? typeof e[0] == "number" && typeof e[1] == "number" ? rn(e, l, t) : e.map(s) : e;
  return { ...n, coordinates: s(n.coordinates) };
}
function nn(n, l) {
  const t = [], s = (e) => {
    if (e.type === "Point") {
      const [r = 0, i = 0, a = 0] = e.coordinates, u = Ae(l, r, i);
      a !== u && t.push([[r, i, u], [r, i, a]]);
    } else if (e.type === "MultiPoint")
      for (const r of e.coordinates) s({ type: "Point", coordinates: r });
    else if (e.type === "GeometryCollection")
      for (const r of e.geometries) s(r);
  };
  return s(n), t.length ? t.length === 1 ? { type: "LineString", coordinates: t[0] } : { type: "MultiLineString", coordinates: t } : null;
}
function ze(n) {
  if (n.type === "Point" || n.type === "MultiPoint") return null;
  if (n.type !== "GeometryCollection") return n;
  const l = n.geometries.map(ze).filter((t) => t !== null);
  return l.length ? l.length === 1 ? l[0] : { type: "GeometryCollection", geometries: l } : null;
}
function Oe(n, l, t, s, e) {
  const r = (i) => {
    const [a = 0, u = 0, m = 0] = i;
    e.push({
      position: [a, u, Number.isFinite(m) ? m : 0],
      properties: l,
      color: t,
      size: s
    });
  };
  if (n.type === "Point") r(n.coordinates);
  else if (n.type === "MultiPoint") n.coordinates.forEach(r);
  else if (n.type === "GeometryCollection")
    for (const i of n.geometries) Oe(i, l, t, s, e);
}
function pe(n, l, t) {
  const s = l.object?.properties;
  return !s || !Number.isFinite(l.x) || !Number.isFinite(l.y) ? !1 : (ge(n, { x: l.x, y: l.y }, s, t), !0);
}
async function on(n, l, t, s, e) {
  const r = await n.getDeckGL(), i = new Map(s.map((d) => [d.feature.id, d.style])), a = [], u = [], m = /* @__PURE__ */ new Map(), b = new Set(
    s.filter((d) => !d.style?.iconColor?.hex && d.style?.iconHref).map((d) => d.style.iconHref)
  );
  await Promise.all([...b].map(async (d) => {
    m.set(d, await Se(d));
  }));
  for (const d of s) {
    const v = Le(d.feature.geometry, d.feature.properties.altitudeMode, l), c = ze(v);
    if (c && a.push({ ...d.feature, geometry: c }), d.feature.properties.extrude === !0) {
      const h = nn(v, l);
      h && a.push({ ...d.feature, geometry: h });
    }
    let p = d.style?.iconColor?.hex;
    !p && d.style?.iconHref && (p = m.get(d.style.iconHref)), Oe(
      v,
      d.feature.properties,
      Qt(p, d.style?.iconColor?.opacity ?? 0.95),
      Math.max(4, 12 * (d.style?.iconScale ?? 1)),
      u
    );
  }
  const _ = [], g = (d) => {
    const v = d?.id;
    return i.get(v);
  };
  if (a.length) {
    const d = `${t}-3d-geometry`, v = new r.mapbox.MapboxLayer({
      id: d,
      type: r.layers.GeoJsonLayer,
      data: { type: "FeatureCollection", features: a },
      filled: !0,
      stroked: !0,
      extruded: !1,
      getFillColor: (c) => {
        const p = g(c);
        return Qt(p?.polyColor?.hex, p?.fill === !1 ? 0 : p?.polyColor?.opacity ?? 0.35, "#3b82f6");
      },
      getLineColor: (c) => {
        const p = g(c);
        return Qt(p?.lineColor?.hex, p?.lineColor?.opacity ?? 1, "#2563eb");
      },
      getLineWidth: (c) => g(c)?.lineWidth ?? 2,
      lineWidthUnits: "pixels",
      lineWidthMinPixels: 1,
      lineBillboard: !0,
      pickable: !0,
      autoHighlight: !0,
      onClick: (c) => pe(l, c, e)
    });
    l.addLayer(v), _.push(d);
  }
  if (u.length) {
    const d = `${t}-3d-points`, v = new r.mapbox.MapboxLayer({
      id: d,
      type: r.layers.IconLayer,
      data: u,
      getPosition: (c) => c.position,
      getIcon: () => "dot",
      iconAtlas: Vr,
      iconMapping: Jr,
      getSize: (c) => c.size,
      getColor: (c) => c.color,
      sizeUnits: "pixels",
      sizeMinPixels: 4,
      billboard: !0,
      pickable: !0,
      autoHighlight: !0,
      onClick: (c) => pe(l, c, e)
    });
    l.addLayer(v), _.push(d);
  }
  return _;
}
async function sn(n, l, t, s) {
  const e = `${l}-source`, r = { type: "FeatureCollection", features: t.map((g) => g.feature) }, i = [], a = [e];
  n.addSource(e, { type: "geojson", data: r });
  const u = [
    {
      id: `${l}-fill`,
      type: "fill",
      source: e,
      filter: ["match", ["geometry-type"], ["Polygon", "MultiPolygon"], !0, !1],
      paint: {
        "fill-color": ["coalesce", ["feature-state", "fillColor"], "#3b82f6"],
        "fill-opacity": ["coalesce", ["feature-state", "fillOpacity"], 0.35]
      }
    },
    {
      id: `${l}-line`,
      type: "line",
      source: e,
      filter: ["match", ["geometry-type"], ["LineString", "MultiLineString", "Polygon", "MultiPolygon"], !0, !1],
      paint: {
        "line-color": ["coalesce", ["feature-state", "lineColor"], "#2563eb"],
        "line-opacity": ["coalesce", ["feature-state", "lineOpacity"], 1],
        "line-width": ["coalesce", ["feature-state", "lineWidth"], 2]
      }
    },
    {
      id: `${l}-point`,
      type: "circle",
      source: e,
      // Always draw a circle fallback. Remote icons may be blocked by CORS or
      // the Tauri CSP; hiding the circle made point-only KMZ files look empty.
      filter: ["match", ["geometry-type"], ["Point", "MultiPoint"], !0, !1],
      paint: {
        "circle-color": ["coalesce", ["feature-state", "pointColor"], "#e5df67"],
        "circle-opacity": ["coalesce", ["feature-state", "pointOpacity"], 0.9],
        "circle-radius": ["coalesce", ["feature-state", "pointRadius"], 6],
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1
      }
    }
  ];
  for (const g of u)
    n.addLayer(g), i.push(String(g.id));
  for (const g of t)
    g.feature.id !== void 0 && n.setFeatureState?.({ source: e, id: g.feature.id }, g.state);
  const m = /* @__PURE__ */ new Map();
  for (const g of t) {
    if (!g.style?.iconHref || !["Point", "MultiPoint"].includes(g.feature.geometry.type)) continue;
    const d = g.style.iconScale ?? 1, v = g.style.iconHeading ?? 0, c = `${g.style.iconHref}\0${d}\0${v}`, p = m.get(c) ?? { href: g.style.iconHref, scale: d, heading: v, features: [] };
    p.features.push(g.feature), m.set(c, p);
  }
  const b = [...m.values()].slice(0, 50);
  m.size > b.length && s.push({ code: "partial-support", message: `Only the first ${b.length} distinct marker styles were rendered; ${m.size - b.length} additional styles use visible circle fallbacks.` }), b.length && (!n.addImage || !n.hasImage) && s.push({ code: "partial-support", message: "Custom marker icons were resolved but this GeoLibre host cannot register MapLibre images; circle markers were used." });
  let _ = 0;
  for (let g = 0; g < b.length; g += 1) {
    const d = b[g], v = `${l}-icon-${g}`, c = await oe(d.href);
    if (!c || !n.addImage) {
      _ += 1;
      continue;
    }
    n.hasImage?.(v) || n.addImage(v, c);
    const p = `${l}-icon-source-${g}`;
    n.addSource(p, { type: "geojson", data: { type: "FeatureCollection", features: d.features } }), a.push(p);
    const h = `${l}-symbol-${g}`;
    n.addLayer({
      id: h,
      type: "symbol",
      source: p,
      layout: {
        "icon-image": v,
        "icon-size": d.scale,
        "icon-allow-overlap": !0,
        "icon-rotation-alignment": "map",
        "icon-rotate": d.heading
      }
    }), i.push(h);
  }
  return _ && s.push({ code: "missing-asset", message: `${_} marker icon style${_ === 1 ? "" : "s"} could not be decoded; visible circle fallbacks were used.`, count: _ }), { layerIds: i, sourceIds: a, sourceId: e };
}
async function an(n, l, t, s = {}) {
  const e = [...l.warnings], r = n.getMap?.() ?? null, i = [], a = `kml-${Date.now()}-${++Hr}`, u = l.featureCollection.features, m = s.includeHiddenFeatures ? u : u.filter((p) => p.properties.__kmlVisible !== !1), b = u.length - m.length;
  b && e.push({
    code: "partial-support",
    message: `${b.toLocaleString()} feature${b === 1 ? " was" : "s were"} marked hidden by the KML and not drawn. Enable “Include features marked hidden” to import them too.`
  });
  const _ = !!(n.getDeckGL && n.registerExternalNativeLayer && m.some((p) => Ie(p.geometry))), g = Xr(m);
  let d = 0;
  for (const [p, h] of g) {
    const y = tn(h), x = { type: "FeatureCollection", features: y.map((S) => S.feature) }, E = `${a}-${d++}-${Yr(p)}`;
    if (_ && n.registerExternalNativeLayer)
      try {
        const S = r ? await on(n, r, E, y, t) : [];
        n.registerExternalNativeLayer({
          id: E,
          name: t,
          type: "geojson",
          geojson: x,
          nativeLayerIds: S,
          opacity: 1,
          style: await en(y),
          metadata: {
            sourceKind: "kml-kmz-import-3d",
            controlOwnsPaint: S.length > 0,
            kmlDocumentName: l.documentName,
            kmlFeatureCount: h.length,
            kmlAltitudeMode: "native-z"
          }
        }), i.push(E);
        continue;
      } catch (S) {
        for (const N of ["3d-points", "3d-geometry"]) {
          const T = `${E}-${N}`;
          r?.getLayer(T) && r.removeLayer(T);
        }
        e.push({ code: "partial-support", message: `GeoLibre's native 3D Z-value renderer could not register this file; flat styling was used (${S instanceof Error ? S.message : String(S)}).` });
      }
    if (r && n.registerExternalNativeLayer)
      try {
        const S = await sn(r, E, y, e);
        n.registerExternalNativeLayer({
          id: E,
          name: t,
          type: "geojson",
          geojson: x,
          nativeLayerIds: S.layerIds,
          sourceIds: S.sourceIds,
          opacity: 1,
          metadata: { sourceKind: "kml-kmz-import", controlOwnsPaint: !0, kmlDocumentName: l.documentName, kmlFeatureCount: h.length }
        });
        for (const N of y)
          N.feature.id !== void 0 && r.setFeatureState?.({ source: S.sourceId, id: N.feature.id }, N.state);
        De(r, S.layerIds, t), i.push(E);
      } catch (S) {
        e.push({ code: "partial-support", message: `Styled layer creation failed; GeoLibre default styling was used (${S instanceof Error ? S.message : String(S)}).` }), i.push(n.addGeoJsonLayer(t, x));
      }
    else
      i.push(n.addGeoJsonLayer(t, x)), n.registerExternalNativeLayer || e.push({ code: "partial-support", message: "This GeoLibre host does not expose styled external-layer registration; default vector styling was used." });
  }
  const v = [...l.overlays].sort((p, h) => p.drawOrder - h.drawOrder);
  for (let p = 0; p < v.length; p += 1) {
    const h = v[p];
    if (!r || !h.imageUrl || !h.coordinates) {
      e.push({ code: "partial-support", message: `GroundOverlay “${h.name}” could not be rendered because the host lacks map/PMTiles access or the image bounds are invalid.` });
      continue;
    }
    const y = `${a}-overlay-${p}`;
    let x;
    try {
      const E = await Kr(h, oe);
      if (!E.tiles.length) throw new Error("the image or geographic bounds are invalid, or the converted raster is fully transparent");
      if (!n.registerExternalNativeLayer) throw new Error("this GeoLibre host does not expose native PMTiles layer registration");
      const S = Ve(E, h.name);
      x = S.url;
      const N = `${y}-source`, T = `${y}-raster`;
      n.registerExternalNativeLayer({
        id: y,
        name: `${t} / ${h.name}`,
        type: "pmtiles",
        sourcePath: S.url,
        source: { type: "raster", url: S.url, sourceId: N, tileSize: E.tileSize },
        nativeLayerIds: [T],
        sourceIds: [N],
        opacity: h.opacity,
        metadata: {
          sourceKind: "pmtiles-url",
          externalNativeLayer: !0,
          tileType: "raster",
          controlOwnsPaint: !0,
          kmlSourceKind: "ground-overlay",
          rotation: h.rotation,
          drawOrder: h.drawOrder,
          tileCount: E.tiles.length,
          targetZoom: E.targetZoom,
          convertedFormat: "pmtiles-png",
          archiveBytes: S.byteLength,
          originalVisibility: h.visible
        }
      }), i.push(y);
    } catch (E) {
      x && Je(x), e.push({ code: "partial-support", message: `GroundOverlay “${h.name}” could not be added: ${E instanceof Error ? E.message : String(E)}` });
    }
  }
  const c = m.map((p) => _e(p.geometry)).filter((p) => !!p);
  for (const p of l.overlays) p.bounds && c.push(p.bounds);
  if (c.length) {
    const p = c.reduce((h, y) => [Math.min(h[0], y[0]), Math.min(h[1], y[1]), Math.max(h[2], y[2]), Math.max(h[3], y[3])], [1 / 0, 1 / 0, -1 / 0, -1 / 0]);
    n.fitBounds?.(p);
  }
  return i.length > 1 && (n.addLayerGroup ? n.addLayerGroup(t, i) : e.push({
    code: "partial-support",
    message: `GeoLibre's external-plugin API cannot create layer groups yet. “${t}” vector and overlay components remain adjacent in the Layers panel.`
  })), { layerIds: i, warnings: e };
}
class ln {
  constructor(l) {
    this.app = l;
  }
  app;
  status = null;
  results = null;
  input = null;
  networkLinks = !1;
  includeHiddenFeatures = !1;
  render(l) {
    const t = document.createElement("div");
    t.className = "kml-import-panel";
    const s = document.createElement("p");
    s.textContent = "Import KML or KMZ as styled, usable GeoLibre layers. Files are parsed locally in your browser or desktop app.";
    const e = document.createElement("button");
    e.type = "button", e.className = "kml-import-dropzone", e.textContent = "Choose or drop a .kml / .kmz file", e.addEventListener("click", () => this.openFilePicker());
    for (const b of ["dragenter", "dragover"]) e.addEventListener(b, (_) => {
      _.preventDefault(), e.classList.add("is-dragging");
    });
    for (const b of ["dragleave", "drop"]) e.addEventListener(b, (_) => {
      _.preventDefault(), e.classList.remove("is-dragging");
    });
    e.addEventListener("drop", (b) => {
      const _ = b.dataTransfer?.files[0];
      _ && this.handleFile(_);
    });
    const r = document.createElement("label");
    r.className = "kml-import-option";
    const i = document.createElement("input");
    i.type = "checkbox", i.addEventListener("change", () => {
      this.networkLinks = i.checked;
    }), r.append(i, document.createTextNode(" Load linked HTTPS and in-archive KML resources (maximum depth 2)"));
    const a = document.createElement("label");
    a.className = "kml-import-option";
    const u = document.createElement("input");
    u.type = "checkbox", u.addEventListener("change", () => {
      this.includeHiddenFeatures = u.checked;
    }), a.append(u, document.createTextNode(" Include vector features marked hidden in the KML"));
    const m = document.createElement("p");
    return m.className = "kml-import-note", m.textContent = "Safety limits: 100 MB input, 2,000 archive files, 250 MB extracted, no scripts or unsafe URL schemes.", this.status = document.createElement("div"), this.status.className = "kml-import-status", this.status.setAttribute("role", "status"), this.results = document.createElement("div"), this.results.className = "kml-import-results", t.append(s, e, r, a, m, this.status, this.results), l.appendChild(t), () => {
      t.remove(), this.status = null, this.results = null, this.input?.remove(), this.input = null;
    };
  }
  openFilePicker() {
    const l = document.createElement("input");
    l.type = "file", l.accept = ".kml,.kmz,application/vnd.google-earth.kml+xml,application/vnd.google-earth.kmz", l.hidden = !0, l.addEventListener("change", () => {
      const t = l.files?.[0];
      t && this.handleFile(t), l.remove(), this.input === l && (this.input = null);
    }, { once: !0 }), document.body.appendChild(l), this.input = l, l.click();
  }
  setStatus(l, t = "working") {
    this.status && (this.status.textContent = l, this.status.dataset.kind = t);
  }
  async handleFile(l) {
    this.results?.replaceChildren(), this.setStatus(`Reading ${l.name}…`);
    try {
      const t = await Nr(l, { loadNetworkLinks: this.networkLinks, onStatus: (e) => this.setStatus(e) });
      if (t.summary.features === 0 && t.summary.groundOverlays === 0) throw new Error("No supported geographic features or GroundOverlays were found.");
      this.setStatus(`Adding ${l.name} to GeoLibre…`);
      const s = await an(this.app, t, l.name, { includeHiddenFeatures: this.includeHiddenFeatures });
      this.setStatus(`${l.name} imported into ${s.layerIds.length} layer${s.layerIds.length === 1 ? "" : "s"}.`, "success"), this.renderSummary(t.summary, s.warnings);
    } catch (t) {
      this.setStatus(t instanceof Error ? t.message : String(t), "error");
    }
  }
  renderSummary(l, t) {
    if (!this.results) return;
    const s = document.createElement("h3");
    s.textContent = "Import summary";
    const e = document.createElement("ul"), r = [
      ["points", l.points],
      ["lines", l.lines],
      ["polygons", l.polygons],
      ["ground overlays", l.groundOverlays],
      ["folders", l.folders],
      ["shared styles / maps", l.styles],
      ["unsupported 3D models", l.models]
    ];
    for (const [i, a] of r) {
      if (a === 0) continue;
      const u = document.createElement("li");
      u.textContent = `${a.toLocaleString()} ${i}`, e.appendChild(u);
    }
    if (this.results.append(s, e), t.length) {
      const i = document.createElement("details"), a = document.createElement("summary");
      a.textContent = `${t.length} warning${t.length === 1 ? "" : "s"}`;
      const u = document.createElement("ul");
      for (const m of t) {
        const b = document.createElement("li");
        b.textContent = `${m.count && m.count > 1 ? `${m.count}× ` : ""}${m.message}`, u.appendChild(b);
      }
      i.append(a, u), this.results.appendChild(i);
    }
  }
}
const ne = "kml-kmz-import-panel", cn = "kml-kmz-import-menu";
let vt = null, zt = null, Rt = "top-right", Bt = null, Ft = null;
function me(n) {
  n.openRightPanel?.(ne) || zt?.openFilePicker();
}
const un = {
  id: "kml-kmz-import",
  name: "KML / KMZ Import",
  version: "0.3.1",
  activate(n) {
    if (zt = new ln(n), Bt = n.registerRightPanel?.({
      id: ne,
      title: "Import KML / KMZ",
      dock: "replace-style",
      defaultWidth: 360,
      render: (l) => zt?.render(l)
    }) ?? null, Ft = n.registerToolbarMenu?.({
      id: cn,
      label: "KML / KMZ",
      items: [{ id: "import", label: "Import KML / KMZ…", onSelect: () => me(n) }]
    }) ?? null, vt = new Qe(() => me(n)), !n.addMapControl(vt, Rt))
      return Ft?.(), Bt?.(), zt = null, vt = null, !1;
  },
  deactivate(n) {
    Ue(n.getMap?.()), qe(), Ft?.(), Ft = null, Bt?.(), Bt = null, n.closeRightPanel?.(ne), vt && n.removeMapControl(vt), vt = null, zt = null;
  },
  getMapControlPosition: () => Rt,
  setMapControlPosition(n, l) {
    if (Rt = l, !!vt && (n.removeMapControl(vt), !n.addMapControl(vt, Rt)))
      return vt = null, !1;
  }
};
export {
  un as default,
  un as plugin
};
//# sourceMappingURL=index.js.map
