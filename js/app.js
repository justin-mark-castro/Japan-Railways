/* ------------------------------------------------------------------
 * Tokyo Rail Sim — UI, rendering and interaction
 * ------------------------------------------------------------------ */
(async function () {
  'use strict';
  async function loadJSON(url) { try { const r = await fetch(url, { cache: 'no-cache' }); return r.ok ? await r.json() : null; } catch (_) { return null; } }
  const manifest = (await loadJSON('data/manifest.json')) || {};
  const geoData = manifest.geometry ? await loadJSON('data/geometry.json') : null;
  const ttData = manifest.timetable ? await loadJSON('data/timetable.json') : null;
  const RG = TRS_REGIONS;
  const ALL = { STATION_SRC: TRS_DATA.STATION_SRC, LINE_SRC: TRS_DATA.LINE_SRC.slice() };
  let net, stations, lines, byId;
  function buildNet() {
    net = TRS.build(ALL, { geometry: geoData && geoData.stations });
    ({ stations, lines, byId } = net);
    Object.values(stations).forEach(st => { st.pref = RG.nearestPref(st.lat, st.lon).id; });
    lines.forEach(L => { L.prefs = new Set(L.ids.map(id => stations[id].pref)); });
  }
  buildNet();
  const $ = id => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------------- state ---------------- */
  const S = {
    lang: 'en', theme: 'dark', t: 8 * 3600, speed: 10, playing: true,
    hidden: new Set(), ops: { 'JR East': true, 'Tokyo Metro': true, 'Toei Subway': true, 'Private & Others': true, 'Trams': true, 'Monorails & AGT': true },
    sel: null,            // {type:'station'|'line'|'train', id}
    follow: null,
    opts: { trains: true, names: true, badges: true, inter: false, water: true, poi: true },
    poiCats: {}, dataMode: 'sim', countsOpen: false, area: null, scope: 'area',
    cam: { x: -2600, y: 500, s: 0.06 }, W: 800, H: 600, dpr: 1, ui: 1,
    anim: null, trains: [], trainIdx: {}, stScreen: [], hover: null, dragging: false
  };
  const MIN_S = 0.0004, MAX_S = 2.4;

  /* ---------------- helpers ---------------- */
  const nm = o => (S.lang === 'ja' ? o.ja : o.en);
  const nm2 = o => (S.lang === 'ja' ? o.en : o.ja);
  const pad2 = n => String(n).padStart(2, '0');
  function hms(sec, withSec) {
    sec = Math.round(sec) % 86400; if (sec < 0) sec += 86400;
    const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, s = sec % 60;
    return pad2(h) + ':' + pad2(m) + (withSec ? ':' + pad2(s) : '');
  }
  const sym = (L, sm) => `<span class="sym ${L.type} ${sm ? 'sm' : ''}" style="--c:${L.color};--tc:${L.textColor}">${L.type === 'jr' ? L.code : L.code}</span>`;
  // Station-number badge (JR square / Metro-style ring) when num is given, otherwise the plain line symbol.
  const bdg = (L, num, sm) => num == null
    ? `<span class="bdg">${sym(L, sm)}</span>`
    : `<span class="bdg">${StationBadge.svg(L, num, { size: sm ? 28 : 48 })}</span>`;
  const lineName = L => nm(L);
  const normQ = s => s.toLowerCase().replace(/[\s\-・'’.,]/g, '');

  /* ---------------- tourist spots ---------------- */
  const POI = TRS_POI.POIS.slice(), POI_CATS = TRS_POI.CATS, poiById = {};
  S.poiHidden = new Set();
  function prepPois() {
    const sts = Object.values(stations);
    POI.forEach(p => {
      const q = TRS.proj(p.lat, p.lon); p.x = q.x; p.y = q.y; poiById[p.id] = p;
      const cand = sts.filter(st => Math.abs(st.x - p.x) < 60000 && Math.abs(st.y - p.y) < 60000 && st.lines.some(x => !x.skipped))
        .map(st => ({ st, d: Math.hypot(st.x - p.x, st.y - p.y) })).sort((x, y) => x.d - y.d);
      const mk = o => ({ st: o.st, d: o.d, walk: Math.max(1, Math.round(o.d * 1.3 / 80)) });
      p.near = cand.filter(o => o.d < 1600).slice(0, 3).map(mk);
      if (!p.near.length && cand.length) p.near = [mk(cand[0])];
    });
  }
  prepPois();

  /* ---------------- canvas ---------------- */
  const cv = $('map'), ctx = cv.getContext('2d');
  const THEME = {
    dark: { bg: '#0c1117', water: '#0f2233', river: '#12293d', park: 'rgba(60,120,80,.18)', grid: 'rgba(255,255,255,.035)', casing: 'rgba(5,9,14,.85)', stFill: '#f4f7fa', stStroke: '#0a0f15', label: '#e8eef5', halo: 'rgba(12,17,23,.9)', sub: '#8fa1b5' },
    light: { bg: '#eef2f6', water: '#cfe3f3', river: '#c4dcef', park: 'rgba(90,170,110,.22)', grid: 'rgba(0,0,0,.04)', casing: 'rgba(255,255,255,.9)', stFill: '#ffffff', stStroke: '#26323f', label: '#14202c', halo: 'rgba(238,242,246,.95)', sub: '#5d6f82' }
  };
  const T = () => THEME[S.theme];

  function resize() {
    const r = $('stage').getBoundingClientRect();
    S.dpr = Math.min(window.devicePixelRatio || 1, 2);
    S.W = r.width; S.H = r.height;
    // UI scale for everything drawn on the canvas: smaller on phones
    S.ui = Math.min(window.innerWidth, window.innerHeight) <= 560 || window.innerWidth <= 860 ? 0.7 : 0.85;
    cv.width = Math.round(S.W * S.dpr); cv.height = Math.round(S.H * S.dpr);
  }
  const sx = x => (x - S.cam.x) * S.cam.s + S.W / 2;
  const sy = y => (y - S.cam.y) * S.cam.s + S.H / 2;
  const wx = px => (px - S.W / 2) / S.cam.s + S.cam.x;
  const wy = py => (py - S.H / 2) / S.cam.s + S.cam.y;

  function fitAll(animate) {
    const s = Math.min(S.W / 17000, S.H / 12500);
    flyTo(-2600, 500, s, animate ? 700 : 0);
  }
  function flyTo(x, y, s, dur) {
    s = clamp(s, MIN_S, MAX_S);
    if (!dur) { S.cam.x = x; S.cam.y = y; S.cam.s = s; S.anim = null; return; }
    S.anim = { t0: performance.now(), dur, from: { ...S.cam }, to: { x, y, s } };
  }
  function fitBounds(pts, pad) {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    pts.forEach(p => { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); });
    const w = Math.max(x1 - x0, 1500), h = Math.max(y1 - y0, 1500);
    const rightPad = (!$('panel').hidden && window.innerWidth > 860) ? 380 : 0;
    const s = Math.min((S.W - rightPad) / (w * (1 + pad)), S.H / (h * (1 + pad)));
    flyTo((x0 + x1) / 2 + (rightPad / 2) / s, (y0 + y1) / 2, s, 800);
  }

  /* ---------------- per-frame geometry ---------------- */
  function lineScreen(L, spacing) {
    const P = L.pts.map(p => ({ x: sx(p.x), y: sy(p.y) }));
    const n = P.length, out = new Array(n);
    const nrm = (a, b) => { const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1; return { x: -dy / l, y: dx / l }; };
    for (let i = 0; i < n; i++) {
      const a = i > 0 ? nrm(P[i - 1], P[i]) : null, b = i < n - 1 ? nrm(P[i], P[i + 1]) : null;
      let vx, vy;
      if (a && b) {
        const k = 1 + a.x * b.x + a.y * b.y;
        vx = (a.x + b.x) / Math.max(k, 0.55); vy = (a.y + b.y) / Math.max(k, 0.55);
      } else { const q = a || b; vx = q.x; vy = q.y; }
      const o = L.lane[i] * spacing;
      out[i] = { x: P[i].x + vx * o, y: P[i].y + vy * o };
    }
    return out;
  }
  function segAt(L, d) {
    let i = TRS.lowerBound(L.cum, d) - 1; i = clamp(i, 0, L.V - 2);
    const span = L.cum[i + 1] - L.cum[i] || 1;
    return { i, u: clamp((d - L.cum[i]) / span, 0, 1) };
  }
  function posScreen(L, ss, d) {
    const { i, u } = segAt(L, d);
    const a = ss[i], b = ss[i + 1];
    return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), ang: Math.atan2(b.y - a.y, b.x - a.x) };
  }
  function posWorld(L, d) {
    const { i, u } = segAt(L, d);
    const a = L.pts[i], b = L.pts[i + 1];
    return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) };
  }

  /* ---------------- visibility ---------------- */
  const isVisible = L => !S.hidden.has(L.id);
  function inView(L) {
    const b = L.bbox, m = 80 / S.cam.s;
    return b.x1 > wx(0) - m && b.x0 < wx(S.W) + m && b.y1 > wy(0) - m && b.y0 < wy(S.H) + m;
  }
  const drawn = L => isVisible(L) && (inView(L) || L === selectedLine());
  function selectedLine() {
    if (!S.sel) return null;
    if (S.sel.type === 'line') return byId[S.sel.id];
    if (S.sel.type === 'train') { const t = S.trainIdx[S.sel.id]; return t ? t.line : null; }
    return null;
  }

  /* ---------------- drawing ---------------- */
  function drawBackground() {
    const c = T();
    ctx.fillStyle = c.bg; ctx.fillRect(0, 0, S.W, S.H);
    // faint grid
    const step = S.cam.s > 0.12 ? 1000 : S.cam.s > 0.04 ? 2000 : 5000;
    ctx.strokeStyle = c.grid; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = Math.floor(wx(0) / step) * step; x < wx(S.W); x += step) { const X = Math.round(sx(x)) + .5; ctx.moveTo(X, 0); ctx.lineTo(X, S.H); }
    for (let y = Math.floor(wy(0) / step) * step; y < wy(S.H); y += step) { const Y = Math.round(sy(y)) + .5; ctx.moveTo(0, Y); ctx.lineTo(S.W, Y); }
    ctx.stroke();
    if (!S.opts.water) return;
    // parks
    ctx.fillStyle = c.park;
    PARKS.forEach(p => { ctx.beginPath(); ctx.ellipse(sx(p.x), sy(p.y), p.rx * S.cam.s, p.ry * S.cam.s, 0, 0, 7); ctx.fill(); });
    // bay
    ctx.fillStyle = c.water;
    WATER_POLYS.forEach(poly => { ctx.beginPath(); poly.forEach((p, i) => (i ? ctx.lineTo(sx(p.x), sy(p.y)) : ctx.moveTo(sx(p.x), sy(p.y)))); ctx.closePath(); ctx.fill(); });
    ctx.fillStyle = c.bg;
    LAND_PTS.forEach(poly => { ctx.beginPath(); poly.forEach((p, i) => (i ? ctx.lineTo(sx(p.x), sy(p.y)) : ctx.moveTo(sx(p.x), sy(p.y)))); ctx.closePath(); ctx.fill(); });
    ctx.strokeStyle = c.river; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    RIVER_PTS.forEach(r => {
      ctx.lineWidth = Math.max(1.5, r.w * S.cam.s * 55);
      ctx.beginPath(); r.pts.forEach((p, i) => (i ? ctx.lineTo(sx(p.x), sy(p.y)) : ctx.moveTo(sx(p.x), sy(p.y)))); ctx.stroke();
    });
  }
  const PARKS = [
    { lat: 35.6852, lon: 139.7528, rx: 800, ry: 620 }, { lat: 35.6852, lon: 139.7100, rx: 560, ry: 380 },
    { lat: 35.6715, lon: 139.6949, rx: 650, ry: 430 }, { lat: 35.7156, lon: 139.7745, rx: 520, ry: 330 },
    { lat: 35.6676, lon: 139.7195, rx: 480, ry: 320 }, { lat: 35.6485, lon: 139.7140, rx: 380, ry: 260 }
  ].map(p => Object.assign(p, TRS.proj(p.lat, p.lon)));
  const LAND_PTS = (TRS_DATA.LAND || []).map(poly => poly.map(p => TRS.proj(p[0], p[1])));
  const WATER_POLYS = [TRS_DATA.WATER.map(p => TRS.proj(p[0], p[1]))];
  const RIVER_PTS = TRS_DATA.RIVERS.map(r => ({ w: r.w, pts: r.pts.map(p => TRS.proj(p[0], p[1])) }));

  let lineSS = {};
  function drawLines() {
    const c = T(), s = S.cam.s;
    const u = S.ui, w = clamp(1.6 + 38 * s, s < 0.01 ? 1.1 : 2.4, 8.5) * u, spacing = w + 1.2 * u;
    const focus = selectedLine();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    lineSS = {};
    // draw subways first, JR on top
    const rail = L => (L.type === 'jr' || L.type === 'shin') + (L.type === 'shin');
    const order = lines.filter(drawn).sort((a, b) => rail(a) - rail(b));
    order.forEach(L => {
      const ss = lineSS[L.id] = lineScreen(L, spacing);
      const lw = L.type === 'shin' ? Math.max(w * 1.25, s < 0.006 ? 2.4 : 0) : L.type === 'jr' ? w * 1.12 : w * 0.92;
      ctx.globalAlpha = focus && focus !== L ? 0.16 : 1;
      ctx.beginPath(); ss.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.strokeStyle = c.casing; ctx.lineWidth = lw + 2.6 * u; ctx.stroke();
      ctx.strokeStyle = L.color; ctx.lineWidth = lw; ctx.stroke();
      if ((L.type === 'jr' || L.type === 'shin') && lw >= 4) {
        ctx.setLineDash([lw * 1.3, lw * 1.3]); ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = Math.max(1, lw * 0.22); ctx.stroke(); ctx.setLineDash([]);
      }
    });
    ctx.globalAlpha = 1;
    // focus highlight: route ahead for selected train
    if (S.sel && S.sel.type === 'train') {
      const t = S.trainIdx[S.sel.id];
      if (t && lineSS[t.line.id]) {
        const L = t.line, ss = lineSS[L.id], tpl = t.tpl;
        const dEnd = tpl.cumAt[tpl.cumAt.length - 1];
        const a = Math.min(t.d, dEnd), b = Math.max(t.d, dEnd);
        ctx.beginPath();
        const pa = posScreen(L, ss, t.d); ctx.moveTo(pa.x, pa.y);
        const ia = segAt(L, t.d).i, ib = segAt(L, dEnd).i;
        if (tpl.dir === 0) { for (let i = ia + 1; i <= ib; i++) ctx.lineTo(ss[i].x, ss[i].y); }
        else { for (let i = ia; i > ib; i--) ctx.lineTo(ss[i].x, ss[i].y); }
        const pe = posScreen(L, ss, dEnd); ctx.lineTo(pe.x, pe.y);
        ctx.strokeStyle = '#fff'; ctx.globalAlpha = .85; ctx.lineWidth = Math.max(1.5, w * 0.35); ctx.setLineDash([2, 5]); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      }
    }
    return w;
  }

  function stationVisibleLines(st) { return st.lines.filter(x => isVisible(x.line) && !x.skipped); }

  function drawStations(w) {
    const c = T(), s = S.cam.s, focus = selectedLine();
    const base = clamp(1.6 + 16 * s, 2.4, 7.5) * S.ui * (s < 0.006 ? 0.85 : 1);
    S.stScreen = [];
    const natl = s < 0.006, margin = 40;
    Object.values(stations).forEach(st => {
      let vl = stationVisibleLines(st);
      if (!vl.length) return;
      if (natl && !vl.every(v => v.line.type === 'shin')) return;
      if (S.opts.inter && vl.length < 2) return;
      const x = sx(st.x), y = sy(st.y);
      if (x < -margin || y < -margin || x > S.W + margin || y > S.H + margin) return;
      const inFocus = !focus || vl.some(v => v.line === focus);
      const n = vl.length, r = base * (n > 1 ? 1.28 : 0.95) + (n > 3 ? 1 : 0);
      S.stScreen.push({ st, x, y, r, vl, inFocus });
      ctx.globalAlpha = inFocus ? 1 : 0.25;
      ctx.beginPath(); ctx.arc(x, y, r + 1.4, 0, 7); ctx.fillStyle = c.stStroke; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = c.stFill; ctx.fill();
      if (n > 1 && r >= 4) {
        // interchange ring: one arc per line colour
        const seg = Math.PI * 2 / n; ctx.lineWidth = Math.max(1.6, r * .42);
        vl.forEach((v, i) => { ctx.beginPath(); ctx.arc(x, y, r - ctx.lineWidth / 2, -Math.PI / 2 + i * seg, -Math.PI / 2 + (i + 1) * seg - 0.04); ctx.strokeStyle = v.line.color; ctx.stroke(); });
      } else if (n === 1) {
        ctx.beginPath(); ctx.arc(x, y, r * .55, 0, 7); ctx.fillStyle = vl[0].line.color; ctx.fill();
      }
      if (S.sel && S.sel.type === 'station' && S.sel.id === st.id) {
        ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(x, y, r + 7, 0, 7); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, r + 11, 0, 7); ctx.strokeStyle = 'rgba(124,196,255,.7)'; ctx.lineWidth = 2; ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;
  }

  function drawLabels() {
    if (!S.opts.names) return;
    const c = T(), s = S.cam.s, focus = selectedLine();
    const showBadges = S.opts.badges && (s >= 0.2 || (focus && s >= 0.07));
    const u = S.ui, fs = clamp(11 + s * 14, 11, 14) * u, FN = 'Inter, "Hiragino Sans", "Noto Sans JP", system-ui, sans-serif';
    const placed = [];
    const items = S.stScreen.map(o => {
      let pri = o.vl.length * 10 + (o.vl.some(v => v.line.type === 'jr') ? 4 : 0) + o.vl.filter(v => v.line.type === 'shin').length * 8;
      if (focus && o.vl.some(v => v.line === focus)) pri += 100;
      if (S.sel && S.sel.type === 'station' && S.sel.id === o.st.id) pri += 1000;
      return { o, pri };
    }).sort((a, b) => b.pri - a.pri);
    const hit = (r) => placed.some(p => r.x < p.x + p.w && r.x + r.w > p.x && r.y < p.y + p.h && r.y + r.h > p.y);
    ctx.textBaseline = 'alphabetic';
    let count = 0;
    for (const { o, pri } of items) {
      if (count > 260) break;
      if (o.x < -10 || o.y < -10 || o.x > S.W + 10 || o.y > S.H + 10) continue;
      if (s < 0.045 && pri < 20) continue;
      if (s < 0.09 && pri < 10) continue;
      const text = nm(o.st);
      ctx.font = `600 ${fs}px Inter, "Hiragino Sans", "Noto Sans JP", system-ui, sans-serif`;
      const tw = ctx.measureText(text).width;
      let badges = [];
      if (showBadges) {
        const vl = focus ? o.vl.filter(v => v.line === focus) : o.vl;
        badges = vl.map(v => ({ v, label: v.line.label(v.idx) }));
      }
      // badges sit beside the name, before it: [badge grid][name / local name]
      const BS = 32 * u, BG = 3 * u;           // station-number badge size (square) and gap
      const showSub = s >= 0.3;
      let subW = 0;
      if (showSub) { ctx.font = `500 ${10.5 * u}px ${FN}`; subW = ctx.measureText(nm2(o.st)).width; }
      const textW = Math.max(tw, subW), textH = fs + 3 + (showSub ? 12 * u : 0);
      const bCols = Math.min(badges.length, 4), bRows = Math.ceil(badges.length / (bCols || 1));
      const bW = badges.length ? bCols * (BS + BG) - BG : 0, bH = badges.length ? bRows * (BS + BG) - BG : 0;
      const tgap = badges.length ? 7 * u : 0;
      const blockW = bW + tgap + textW, blockH = Math.max(textH, bH);
      const gap = o.r + 5 * u;
      const cand = [
        { x: o.x + gap, y: o.y - blockH / 2, a: 'l' }, { x: o.x - gap - blockW, y: o.y - blockH / 2, a: 'r' },
        { x: o.x - blockW / 2, y: o.y - gap - blockH, a: 'c' }, { x: o.x - blockW / 2, y: o.y + gap, a: 'c' }
      ];
      let pick = null;
      for (const k of cand) { const r = { x: k.x - 2, y: k.y - 1, w: blockW + 4, h: blockH + 2 }; if (!hit(r)) { pick = { k, r }; break; } }
      if (!pick) continue;
      placed.push(pick.r); count++;
      const { k } = pick;
      const dim = focus && !o.inFocus;
      ctx.globalAlpha = dim ? 0.3 : 1;
      ctx.textAlign = 'left';
      const tx = k.x + bW + tgap, ty = k.y + (blockH - textH) / 2 + fs;
      ctx.font = `600 ${fs}px Inter, "Hiragino Sans", "Noto Sans JP", system-ui, sans-serif`;
      ctx.lineWidth = 3.5 * u; ctx.strokeStyle = c.halo; ctx.lineJoin = 'round'; ctx.strokeText(text, tx, ty);
      ctx.fillStyle = c.label; ctx.fillText(text, tx, ty);
      if (showSub) {
        const yy = ty + 12 * u;
        ctx.font = `500 ${10.5 * u}px ${FN}`;
        ctx.lineWidth = 3; ctx.strokeText(nm2(o.st), tx, yy); ctx.fillStyle = c.sub; ctx.fillText(nm2(o.st), tx, yy);
      }
      badges.forEach((b, i) => {
        const L = b.v.line, col = i % bCols, row = Math.floor(i / bCols);
        StationBadge.draw(ctx, L, b.label.slice(L.code.length), k.x + col * (BS + BG), k.y + (blockH - bH) / 2 + row * (BS + BG), BS);
      });
      ctx.globalAlpha = 1;
    }
    ctx.textAlign = 'left';
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function updateTrains() {
    const arr = [];
    lines.forEach(L => { if (drawn(L)) TRS.activeTrips(L, S.t, arr); });
    S.trains = arr; S.trainIdx = {};
    arr.forEach(t => { S.trainIdx[t.key] = t; });
  }
  function badgePath(L, r) {
    if (L.type === 'jr') roundRect(-r, -r, r * 2, r * 2, r * .36);
    else if (L.type === 'shin') { ctx.beginPath(); ctx.moveTo(-r * 1.15, -r * .9); ctx.lineTo(r * 1.4, -r * .9); ctx.lineTo(r * 1.15, r * .9); ctx.lineTo(-r * 1.4, r * .9); ctx.closePath(); }
    else if (L.type === 'pvt') roundRect(-r * 1.25, -r * .85, r * 2.5, r * 1.7, r * .85);
    else if (L.type === 'mono') { ctx.beginPath(); for (let k = 0; k < 6; k++) { const an = Math.PI / 3 * k + Math.PI / 6; ctx[k ? 'lineTo' : 'moveTo'](Math.cos(an) * r * 1.08, Math.sin(an) * r * 1.08); } ctx.closePath(); }
    else if (L.type === 'tram') roundRect(-r * 1.2, -r * .9, r * 2.4, r * 1.8, r * .28);
    else { ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); }
  }
  function drawTrains() {
    S.trainScreen = [];
    if (!S.opts.trains) return;
    const s = S.cam.s, focus = selectedLine(), c = T();
    const R = clamp(0.6 + 72 * s, 3.6, 12.5) * S.ui;
    S.trains.forEach(t => {
      if (S.cam.s < 0.006 && t.line.type !== 'shin') return;
      const ss = lineSS[t.line.id]; if (!ss) return;
      const p = posScreen(t.line, ss, t.d);
      if (p.x < -40 || p.y < -40 || p.x > S.W + 40 || p.y > S.H + 40) return;
      t.sx = p.x; t.sy = p.y; t.ang = p.ang + (t.dir === 1 ? Math.PI : 0); t.R = R;
      S.trainScreen.push(t);
    });
    const selKey = S.sel && S.sel.type === 'train' ? S.sel.id : null;
    S.trainScreen.sort((a, b) => (a.key === selKey) - (b.key === selKey));
    const dark = S.theme === 'dark';
    S.trainScreen.forEach(t => {
      const L = t.line;
      ctx.globalAlpha = focus && focus !== L ? 0.22 : 1;
      ctx.save(); ctx.translate(t.sx, t.sy);
      // ---- train body (two cars), drawn along heading ----
      ctx.save(); ctx.rotate(t.ang);
      const cl = R * 1.75, gap = R * 0.16, hw = R * 0.78;
      const rear = -(cl + gap / 2), mid = gap / 2;
      const body = dark ? '#f1f5f9' : '#ffffff';
      const edge = dark ? 'rgba(4,8,12,.9)' : 'rgba(20,32,44,.85)';
      ctx.lineWidth = Math.max(1, R * .16);
      const car = (x0, x1, rf, rr) => {
        ctx.beginPath();
        ctx.moveTo(x0 + rr, -hw); ctx.lineTo(x1 - rf, -hw); ctx.quadraticCurveTo(x1, -hw, x1, -hw + rf);
        ctx.lineTo(x1, hw - rf); ctx.quadraticCurveTo(x1, hw, x1 - rf, hw); ctx.lineTo(x0 + rr, hw);
        ctx.quadraticCurveTo(x0, hw, x0, hw - rr); ctx.lineTo(x0, -hw + rr); ctx.quadraticCurveTo(x0, -hw, x0 + rr, -hw);
        ctx.closePath();
      };
      (L.type === 'tram' ? [[-cl * .72, cl * .72, R * .9, R * .8]] : [[rear, -gap / 2, R * .3, R * .45], [mid, cl + gap / 2, R * 1.05, R * .3]]).forEach(([x0, x1, rf, rr], i) => {
        car(x0, x1, rf, rr); ctx.fillStyle = body; ctx.fill(); ctx.strokeStyle = edge; ctx.stroke();
        // coloured side stripe
        ctx.save(); car(x0, x1, rf, rr); ctx.clip();
        ctx.fillStyle = L.color; ctx.fillRect(x0, hw * .28, x1 - x0, hw * .72);
        ctx.restore();
        if (R >= 5.5) { // windows
          ctx.fillStyle = 'rgba(20,38,58,.82)';
          const n = L.type === 'tram' ? 4 : 3, w = (x1 - x0 - R * .5 - (i || L.type === 'tram' ? R * .5 : 0)) / n;
          for (let k = 0; k < n; k++) ctx.fillRect(x0 + R * .3 + k * w + w * .12, -hw * .62, w * .76, hw * .5);
        }
      });
      // nose: windscreen + headlight
      const nose = L.type === 'tram' ? cl * .72 : cl + gap / 2;
      if (R >= 5.5) { ctx.fillStyle = 'rgba(20,38,58,.9)'; ctx.fillRect(nose - R * .42, -hw * .55, R * .22, hw * 1.1 * .55); }
      ctx.beginPath(); ctx.arc(nose - R * .06, 0, Math.max(1, R * .17), 0, 7); ctx.fillStyle = '#ffd24a'; ctx.fill();
      ctx.restore();
      // ---- line badge on top of the train (upright) ----
      const br = Math.max(3.4, R * .72);
      ctx.save(); ctx.translate(0, -R * .05);
      badgePath(L, br); ctx.fillStyle = L.color; ctx.fill();
      ctx.lineWidth = Math.max(1, R * .17); ctx.strokeStyle = '#fff'; ctx.stroke();
      if (L.type === 'toei') { ctx.beginPath(); ctx.arc(0, 0, br * .68, 0, 7); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.stroke(); }
      if (br >= 6.3) {
        ctx.fillStyle = L.textColor; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const two = L.code.length > 1;
        ctx.font = `800 ${(two ? br * 0.98 : br * 1.2)}px Inter, system-ui, sans-serif`;
        ctx.fillText(L.code, 0, br * .06);
      }
      ctx.restore();
      // ---- loop direction pill (inner/outer, clockwise/counter-clockwise) ----
      if (L.loop) {
        const ccw = (t.dir === 0) === !!L.ccw0, big = R >= 7;
        const label = (ccw ? '↺' : '↻') + (big ? L.pill[t.dir] : '');
        const fs = Math.max(8, R * .98);
        ctx.font = `800 ${fs}px Inter, "Hiragino Sans", "Noto Sans JP", system-ui, sans-serif`;
        const w = ctx.measureText(label).width + fs * .7, h = fs * 1.28, y = -R * 2.55;
        ctx.fillStyle = t.dir === 0 ? '#ffffff' : '#10161d';
        ctx.strokeStyle = t.dir === 0 ? '#10161d' : '#ffffff'; ctx.lineWidth = 1.2;
        roundRect(-w / 2, y - h / 2, w, h, h / 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = t.dir === 0 ? '#10161d' : '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label, 0, y + fs * .05);
      }
      if (t.dwell) { // stopped at a station
        ctx.beginPath(); ctx.arc(R * 1.5, -R * 1.0, Math.max(1.8, R * .26), 0, 7); ctx.fillStyle = '#ffb020'; ctx.fill();
      }
      if (t.key === selKey) {
        ctx.beginPath(); ctx.arc(0, 0, R * 2.4, 0, 7); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, R * 2.4 + 4 + 2 * Math.sin(performance.now() / 250), 0, 7); ctx.strokeStyle = 'rgba(124,196,255,.8)'; ctx.stroke();
      }
      ctx.restore();
    });
    ctx.globalAlpha = 1; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  function drawPois() {
    S.poiScreen = [];
    if (S.cam.s < 0.012) return;
    S.poiScreen = [];
    if (!S.opts.poi) return;
    const c = T(), s = S.cam.s, Rp = clamp(8 + 22 * s, 9, 16) * S.ui;
    const selId = S.sel && S.sel.type === 'poi' ? S.sel.id : null;
    const hovId = S.hover && S.hover.type === 'poi' ? S.hover.id : null;
    const focus = selectedLine();
    POI.forEach(p => {
      if (S.poiHidden.has(p.cat)) return;
      const x = sx(p.x), y = sy(p.y);
      if (x < -30 || y < -30 || x > S.W + 30 || y > S.H + 30) return;
      S.poiScreen.push({ p, x, y, r: Rp });
      ctx.globalAlpha = focus ? 0.55 : 1;
      const col = POI_CATS[p.cat].color;
      ctx.beginPath(); ctx.arc(x, y + 1.5, Rp + 1.5, 0, 7); ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, Rp, 0, 7); ctx.fillStyle = S.theme === 'dark' ? '#1b2633' : '#ffffff'; ctx.fill();
      ctx.lineWidth = 2.4; ctx.strokeStyle = col; ctx.stroke();
      ctx.font = `${Rp * 1.12}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000';
      ctx.fillText(p.emoji, x, y + Rp * .08);
      if (p.id === selId) { ctx.beginPath(); ctx.arc(x, y, Rp + 6, 0, 7); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }
      if (s >= 0.1 || p.id === selId || p.id === hovId) {
        const txt = nm(p);
        ctx.font = `700 ${11.5 * S.ui}px Inter, "Hiragino Sans", "Noto Sans JP", system-ui, sans-serif`;
        ctx.textBaseline = 'alphabetic';
        ctx.lineWidth = 3.5; ctx.strokeStyle = c.halo; ctx.lineJoin = 'round'; ctx.strokeText(txt, x, y + Rp + 13 * S.ui);
        ctx.fillStyle = col; ctx.fillText(txt, x, y + Rp + 13 * S.ui);
      }
    });
    ctx.globalAlpha = 1; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  function frame(now) {
    const dt = Math.min((now - (frame.last || now)) / 1000, 0.1); frame.last = now;
    // time
    if (S.playing) {
      S.t += dt * S.speed;
      if (S.t >= TRS.SERVICE_END) S.t = TRS.SERVICE_START + (S.t - TRS.SERVICE_END);
    }
    // camera animation / follow
    if (S.anim) {
      const k = clamp((now - S.anim.t0) / S.anim.dur, 0, 1), e = 1 - Math.pow(1 - k, 3), a = S.anim;
      S.cam.x = lerp(a.from.x, a.to.x, e); S.cam.y = lerp(a.from.y, a.to.y, e);
      S.cam.s = Math.exp(lerp(Math.log(a.from.s), Math.log(a.to.s), e));
      if (k >= 1) S.anim = null;
    }
    updateTrains();
    if (S.follow) {
      const t = S.trainIdx[S.follow];
      if (t) { const p = posWorld(t.line, t.d); S.cam.x = lerp(S.cam.x, p.x + (rightPadWorld()), 0.12); S.cam.y = lerp(S.cam.y, p.y, 0.12); }
      else { S.follow = null; }
    }
    ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    drawBackground();
    const w = drawLines();
    drawStations(w);
    drawPois();
    drawPrefs();
    drawTrains();
    drawLabels();
    uiTick(now);
    requestAnimationFrame(frame);
  }
  function rightPadWorld() { return (!$('panel').hidden && window.innerWidth > 860) ? 170 / S.cam.s : 0; }

  /* ---------------- UI tick (low frequency) ---------------- */
  let lastUi = 0, lastScrub = 0;
  function uiTick(now) {
    // clock
    const tt = S.t % 86400;
    $('clock').textContent = hms(tt).slice(0, 5);
    $('clockSec').textContent = ':' + pad2(Math.floor(tt) % 60);
    if (document.activeElement !== $('scrub') || !scrubbing) $('scrub').value = Math.round(S.t);
    if (now - lastUi < 250) return; lastUi = now;
    updateArea();
    const n = S.trains.filter(t => inScope(t.line)).length;
    $('hudTrains').textContent = n + (n === 1 ? ' train running' : ' trains running');
    $('hudPeriod').textContent = (S.dataMode === 'sim' ? TRS.PERIOD_LABEL[TRS.periodOf(S.t)] : 'Real timetable · ' + S.dataMode) + (n === 0 ? ' · out of service' : '');
    // line counts
    const counts = {}; S.trains.forEach(t => { counts[t.line.id] = (counts[t.line.id] || 0) + 1; });
    document.querySelectorAll('.lrow .cnt').forEach(el => { el.textContent = counts[el.dataset.l] || 0; });
    renderCounts();
    refreshPanel();
  }

  /* ---------------- sidebar ---------------- */
  const GRP_COL = { 'JR East': '#9ACD32', 'JR West': '#E8453C', 'Tokyo Metro': '#FF9500', 'Toei Subway': '#6CBB5A', 'Osaka Metro': '#E5171F', 'Private & Others': '#8F76D6', 'Trams': '#E5508F', 'Monorails & AGT': '#2BB3A3', 'Shinkansen': '#4F8DF5' };
  const GRP_ORDER = ['JR East', 'JR West', 'Tokyo Metro', 'Toei Subway', 'Osaka Metro', 'Private & Others', 'Trams', 'Monorails & AGT', 'Shinkansen'];
  let OPS = [];
  function computeOps() {
    const seen = []; lines.forEach(L => { if (!seen.includes(L.grp)) seen.push(L.grp); });
    const rank = g => { const i = GRP_ORDER.indexOf(g); return i < 0 ? 99 : i; };
    seen.sort((x, y) => rank(x) - rank(y));
    OPS = seen.map(g => [g, GRP_COL[g] || '#8aa0b4']);
    OPS.forEach(([g]) => { if (!(g in S.ops)) S.ops[g] = true; });
  }
  const inScope = L => S.scope === 'all' || !S.area || L.prefs.has(S.area.id);
  const areaLabel = () => (S.area ? (S.lang === 'ja' ? S.area.ja : S.area.en) : (S.lang === 'ja' ? '日本' : 'Japan'));
  function renderOpChips() {
    const ops = OPS.filter(([op]) => lines.some(L => L.grp === op && inScope(L)));
    $('opChips').innerHTML = ops.map(([op, col]) => `<button class="chip ${S.ops[op] ? 'on' : ''}" data-op="${op}"><i style="background:${col}"></i>${op}</button>`).join('');
  }
  function buildSidebar() {
    renderOpChips();
    $('opChips').onclick = e => {
      const b = e.target.closest('.chip'); if (!b) return;
      const op = b.dataset.op; S.ops[op] = !S.ops[op];
      lines.filter(L => L.grp === op).forEach(L => (S.ops[op] ? S.hidden.delete(L.id) : S.hidden.add(L.id)));
      syncSidebar();
    };
    renderLineList();
    document.querySelector('.quick').onclick = e => {
      const q = e.target.dataset.q; if (!q) return;
      S.hidden.clear();
      lines.forEach(L => {
        if (q === 'none' || (q === 'jr' && L.type !== 'jr') || (q === 'subway' && L.type !== 'metro' && L.type !== 'toei') || (q === 'pvt' && L.type !== 'pvt' && L.type !== 'tram' && L.type !== 'mono')) S.hidden.add(L.id);
      });
      syncSidebar();
    };
    $('lineFilter').oninput = renderLineList;
  }
  function renderLineList() {
    const f = normQ($('lineFilter').value || '');
    let html = '';
    OPS.forEach(([op]) => {
      const ls = lines.filter(L => L.grp === op && inScope(L) && (!f || normQ(L.en + L.ja + L.code + L.op + L.id).includes(f)));
      if (!ls.length) return;
      html += `<div class="grp">${op}</div>`;
      ls.forEach(L => {
        html += `<div class="lrow ${S.hidden.has(L.id) ? 'off' : ''} ${S.sel && S.sel.type === 'line' && S.sel.id === L.id ? 'active' : ''}" data-id="${L.id}" style="--c:${L.color};--tc:${L.textColor}">
          <button class="eye" data-eye="${L.id}" aria-label="Toggle ${L.en}">${S.hidden.has(L.id) ? '' : '✓'}</button>
          ${bdg(L)}
          <div class="nm"><b>${lineName(L)}</b><small>${L.type === 'pvt' || L.type === 'tram' || L.type === 'mono' || L.type === 'shin' ? L.op + ' · ' : ''}${nm2(L)} · ${L.n} stn</small></div>
          <span class="cnt" data-l="${L.id}" title="trains running">0</span></div>`;
      });
    });
    if (!html) {
      const noData = S.area && !f && !lines.some(L => L.prefs.has(S.area.id));
      html = noData ? `<div class="empty-note" style="padding:14px">No line data for <b>${areaLabel()}</b> yet.<br>Add a region file or run the nationwide import (see README).<br><button class="linkbtn" data-scope="all">Show all loaded lines</button></div>` : '<div class="empty-note" style="padding:14px">No matching lines.</div>';
    }
    $('lineList').innerHTML = html;
    updateScopeUi();
  }
  $('lineList').addEventListener('click', e => {
    const sc = e.target.closest('[data-scope]'); if (sc) { S.scope = sc.dataset.scope; refreshScope(); return; }
    const eye = e.target.closest('[data-eye]');
    if (eye) { toggleLine(eye.dataset.eye); e.stopPropagation(); return; }
    const row = e.target.closest('.lrow'); if (!row) return;
    selectItem('line', row.dataset.id, true);
    document.body.classList.remove('menu'); $('scrim').hidden = true;
  });
  function toggleLine(id) {
    S.hidden.has(id) ? S.hidden.delete(id) : S.hidden.add(id);
    syncSidebar();
  }
  function syncSidebar() {
    OPS.forEach(([op]) => { S.ops[op] = lines.some(L => L.grp === op && !S.hidden.has(L.id)); });
    renderOpChips();
    renderLineList();
  }

  /* ---------------- selection + panel ---------------- */
  function selectItem(type, id, fly) {
    S.follow = null;
    S.sel = { type, id };
    if (type === 'line') { S.hidden.delete(id); syncSidebar(); }
    else if (type === 'station') { stations[id].lines.forEach(x => S.hidden.delete(x.line.id)); syncSidebar(); }
    else if (type === 'poi') { S.opts.poi = true; $('optPoi').checked = true; S.poiHidden.delete(poiById[id].cat); renderPoiChips(); }
    renderPanel(true);
    renderLineList();
    if (!fly) return;
    if (type === 'line') fitBounds(byId[id].pts, 0.25);
    else if (type === 'station') {
      const st = stations[id], s = Math.max(S.cam.s, 0.32);
      flyTo(st.x + (window.innerWidth > 860 ? 170 / s : 0), st.y, s, 700);
    } else if (type === 'poi') {
      const p = poiById[id], s = Math.max(S.cam.s, 0.2);
      flyTo(p.x + (window.innerWidth > 860 ? 170 / s : 0), p.y, s, 700);
    }
  }
  function clearSel() { S.sel = null; S.follow = null; $('panel').hidden = true; renderLineList(); }

  function renderPanel(reset) {
    const P = $('panel');
    if (!S.sel) { P.hidden = true; return; }
    P.hidden = false;
    const top = P.scrollTop;
    if (S.sel.type === 'station') P.innerHTML = stationHTML(stations[S.sel.id]);
    else if (S.sel.type === 'poi') P.innerHTML = poiHTML(poiById[S.sel.id]);
    else if (S.sel.type === 'line') P.innerHTML = lineHTML(byId[S.sel.id]);
    else { const t = S.trainIdx[S.sel.id]; if (!t) { clearSel(); return; } P.innerHTML = trainHTML(t); }
    if (!reset) P.scrollTop = top; else P.scrollTop = 0;
  }
  let lastPanelSig = '';
  function refreshPanel() {
    if (!S.sel || $('panel').hidden) return;
    if (S.sel.type === 'train' && !S.trainIdx[S.sel.id]) { clearSel(); return; }
    if (S.sel.type === 'station') { const b = $('boardBox'); if (b) b.innerHTML = boardHTML(S.sel.id); }
    else if (S.sel.type === 'line') { const el = $('lineLive'); if (el) el.innerHTML = lineLiveHTML(byId[S.sel.id]); }
    else if (performance.now() - (refreshPanel.last || 0) > 1000) { refreshPanel.last = performance.now(); renderPanel(false); }
  }
  const closeBtn = '<button class="p-close" data-act="close" aria-label="Close">✕</button>';

  function poiHTML(p) {
    const cat = POI_CATS[p.cat];
    return `<div class="p-head">${closeBtn}
      <div class="bdg"><span class="poi-ic" style="--c:${cat.color}">${p.emoji}</span><span class="poi-cat" style="--c:${cat.color}">${cat[S.lang]}</span></div>
      <div class="p-title">${nm(p)}</div><div class="p-sub">${nm2(p)}</div></div>
      <div class="p-body"><div style="font-size:14px;line-height:1.5">${p.desc}</div>
        <div class="p-sec">Nearest stations</div>
        ${p.near.map(n => `<div class="brow clickable" data-st="${n.st.id}"><div class="dest"><b>${nm(n.st)}</b><small>~${n.walk} min walk · ${Math.round(n.d / 10) * 10} m</small></div>
          <span class="xfer" style="gap:4px;justify-content:flex-end">${n.st.lines.filter(x => !x.skipped).slice(0, 6).map(x => bdg(x.line, x.num, true)).join('')}</span></div>`).join('')}
        <div class="btn-row"><button class="btn primary" data-act="zoompoi">Zoom to spot</button></div></div>`;
  }
  function stationHTML(st) {
    const xfers = st.lines.filter(x => !x.skipped);
    return `<div class="p-head">${closeBtn}
      <div class="xfer" style="gap:8px">${st.lines.filter(x => !x.skipped).map(x => bdg(x.line, x.num)).join('')}</div>
      <div class="p-title">${nm(st)}</div><div class="p-sub">${nm2(st)}${st.lines.filter(x => !x.skipped).length > 1 ? ` · ${st.lines.filter(x => !x.skipped).length} lines` : ''}</div></div>
      <div class="p-body">
        <div class="p-sec">Lines <span class="live" style="margin-left:8px;text-transform:none;letter-spacing:0">simulated</span></div>
        <div class="xfer">${xfers.map(x => `<div class="xf" data-line="${x.line.id}">${bdg(x.line, x.num, true)}<span>${lineName(x.line)}</span></div>`).join('')}</div>
        <div class="p-sec">Next departures</div>
        <div id="boardBox">${boardHTML(st.id)}</div>
        <div class="btn-row"><button class="btn primary" data-act="zoomst">Zoom to station</button></div>
      </div>`;
  }
  function boardHTML(id) {
    const rows = TRS.board(net, id, S.t, 2).filter(b => isVisible(b.line) && b.times.length);
    if (!rows.length) return '<div class="empty-note">No trains scheduled right now (out of service hours or lines hidden).</div>';
    return rows.slice(0, 14).map(b => {
      const L = b.line, st = stations[id], idx = st.lines.find(x => x.line === L).idx;
      const dest = L.loop ? TRS.destName(L, b.dir, stations, S.lang) : (S.lang === 'ja' ? stations[b.destId].ja : stations[b.destId].en);
      const inMin = Math.max(0, Math.round((b.times[0] - S.t) / 60));
      return `<div class="brow" data-line="${L.id}">${bdg(L, L.nums[idx], true)}
        <div class="dest"><b>${L.loop ? dest : (S.lang === 'ja' ? '' : 'For ') + dest + (S.lang === 'ja' ? ' 方面' : '')}</b><small>${lineName(L)}</small></div>
        <div class="tms"><b>${inMin <= 0 ? 'now' : inMin + ' min'}</b><span>${b.times.map(t => hms(t)).join(' · ')}</span></div></div>`;
    }).join('');
  }
  function lineHTML(L) {
    const stopsHtml = L.ids.map((id, i) => {
      const st = stations[id], skip = L.skip.has(id);
      return `<div class="stp ${skip ? 'skip' : ''}" data-st="${id}" style="--c:${L.color}"><i></i><span class="nm">${nm(st)}</span>
        <span class="ic">${st.lines.filter(x => x.line !== L && !x.skipped).slice(0, 5).map(x => sym(x.line, true)).join('')}</span>
        <span class="tm">${skip ? 'pass' : L.label(i)}</span></div>`;
    }).join('');
    return `<div class="p-head" style="--c:${L.color}">${closeBtn}
      <div class="bdg">${sym(L)}<span class="p-sub">${L.op}</span></div>
      <div class="p-title">${nm(L)}</div><div class="p-sub">${nm2(L)}</div><div class="hero-bar"></div></div>
      <div class="p-body" style="--c:${L.color}">
        <div id="lineLive">${lineLiveHTML(L)}</div>
        <div class="p-sec">Stations${L.skip.size ? ' <span style="text-transform:none;letter-spacing:0;font-weight:500">(faded = rapid passes)</span>' : ''}</div>
        <div class="stops">${stopsHtml}</div></div>`;
  }
  function lineLiveHTML(L) {
    const n = S.trains.filter(t => t.line === L).length;
    const hw = TRS.headwayAt(L, S.t);
    const inn = S.trains.filter(t => t.line === L && t.dir === 0).length;
    const split = L.loop && !L.oneway ? `<div class="p-sub" style="margin:8px 0 0">↺ ${L.ccw0 ? L.dirNames[0] : L.dirNames[1]}: <b>${L.ccw0 ? inn : n - inn}</b> &nbsp;·&nbsp; ↻ ${L.ccw0 ? L.dirNames[1] : L.dirNames[0]}: <b>${L.ccw0 ? n - inn : inn}</b></div>` : '';
    return `<div class="kv"><div><b>${n}</b><small>trains now</small></div><div><b>${hw}′</b><small>headway</small></div><div><b>${(L.len / 1000).toFixed(1)} km</b><small>${L.n} stations</small></div></div>` + split;
  }
  function trainHTML(t) {
    const L = t.line, tpl = t.tpl, dest = TRS.destName(L, t.dir, stations, S.lang, tpl);
    const local = S.t - t.start;
    const stopId = k => L.ids[tpl.stops[k] % L.n];
    const nextK = t.dwell ? t.k : t.next, nextSt = stations[stopId(Math.min(nextK, tpl.stops.length - 1))];
    const status = t.dwell
      ? (t.k === tpl.stops.length - 1 ? `Arrived at <b>${nm(nextSt)}</b>` : `Stopped at <b>${nm(nextSt)}</b> · departs ${hms(t.start + tpl.dep[t.k], true)}`)
      : `Heading to <b>${nm(nextSt)}</b> · arr ${hms(t.start + tpl.arr[t.next], true)} (${Math.max(0, Math.round(tpl.arr[t.next] - local))}s)`;
    // full stop list (include passed stations of rapid lines as faded)
    const seq = []; const all = [];
    for (let i = 0; i < L.V; i++) all.push(i); if (t.dir === 1) all.reverse();
    const stopSet = new Map(); tpl.stops.forEach((vi, k) => stopSet.set(vi, k));
    const rows = all.map(vi => {
      const k = stopSet.get(vi), id = L.ids[vi % L.n], st = stations[id];
      if (k === undefined) return `<div class="stp skip" data-st="${id}" style="--c:${L.color}"><i></i><span class="nm">${nm(st)}</span><span class="tm">pass</span></div>`;
      const passed = k < (t.dwell ? t.k : t.next);
      const here = t.dwell && k === t.k;
      return `<div class="stp ${passed ? 'pass' : ''} ${here ? 'here' : ''}" data-st="${id}" style="--c:${L.color}"><i></i><span class="nm">${nm(st)}</span>
        <span class="ic">${st.lines.filter(x => x.line !== L && !x.skipped).slice(0, 4).map(x => sym(x.line, true)).join('')}</span><span class="tm">${hms(t.start + tpl.arr[k])}</span></div>`;
    }).join('');
    return `<div class="p-head" style="--c:${L.color}">${closeBtn}
      <div class="bdg">${sym(L)}<span class="live">${S.follow === t.key ? 'following' : 'live (simulated)'}</span></div>
      <div class="p-title">${L.loop ? dest : (S.lang === 'ja' ? dest + ' 行き' : 'To ' + dest)}</div>
      <div class="p-sub">${nm(L)} · ${L.op}</div><div class="hero-bar"></div></div>
      <div class="p-body" style="--c:${L.color}">
        <div style="font-size:14px;line-height:1.5">${status}</div>
        <div class="btn-row"><button class="btn primary" data-act="follow">${S.follow === t.key ? 'Stop following' : 'Follow this train'}</button><button class="btn" data-act="line">Show line</button></div>
        <div class="p-sec">Stops</div><div class="stops">${rows}</div></div>`;
  }
  $('panel').addEventListener('click', e => {
    const act = e.target.closest('[data-act]');
    if (act) {
      const a = act.dataset.act;
      if (a === 'close') clearSel();
      else if (a === 'zoomst') { const st = stations[S.sel.id]; flyTo(st.x + (window.innerWidth > 860 ? 170 / 0.5 : 0), st.y, 0.5, 700); }
      else if (a === 'follow') { S.follow = S.follow === S.sel.id ? null : S.sel.id; if (S.follow) { if (S.cam.s < 0.25) S.cam.s = 0.28; S.anim = null; } renderPanel(false); }
      else if (a === 'zoompoi') { const p = poiById[S.sel.id]; flyTo(p.x + (window.innerWidth > 860 ? 170 / 0.5 : 0), p.y, 0.5, 700); }
      else if (a === 'line') { const t = S.trainIdx[S.sel.id]; if (t) selectItem('line', t.line.id, true); }
      return;
    }
    const l = e.target.closest('[data-line]'); if (l) { selectItem('line', l.dataset.line, true); return; }
    const st = e.target.closest('[data-st]'); if (st) { selectItem('station', st.dataset.st, true); }
  });

  /* ---------------- search ---------------- */
  let index = [];
  function buildIndex() {
    index = [];
    Object.values(stations).forEach(st => {
      const codes = st.lines.filter(x => !x.skipped).map(x => normQ(x.line.label(x.idx)));
      index.push({ type: 'station', id: st.id, en: normQ(st.en), ja: st.ja, codes, st });
    });
    POI.forEach(p => index.push({ type: 'spot', id: p.id, en: normQ(p.en), ja: p.ja, codes: [], p }));
    lines.forEach(L => index.push({ type: 'line', id: L.id, en: normQ(L.en), ja: L.ja, codes: [normQ(L.code), normQ(L.id)], L }));
    RG.PREFS.forEach(pf => index.push({ type: 'pref', id: pf.id, en: normQ(pf.en), ja: pf.ja, codes: [], pf }));
  }
  let resItems = [], resSel = 0;
  function runSearch(q) {
    const nq = normQ(q); if (!nq) return [];
    const out = [];
    index.forEach(it => {
      let sc = 0;
      if (it.en === nq || it.ja === q.trim()) sc = 100;
      else if (it.codes.some(c => c === nq)) sc = it.type === 'line' ? 95 : 90;
      else if (it.en.startsWith(nq) || it.ja.startsWith(q.trim())) sc = 70;
      else if (it.codes.some(c => c.startsWith(nq)) && nq.length >= 2 && /\d/.test(nq)) sc = 65;
      else if (it.en.includes(nq) || it.ja.includes(q.trim())) sc = 40;
      else if (it.type === 'line' && it.codes[0] === nq) sc = 60;
      if (sc) out.push({ it, sc: sc + (it.type === 'station' ? it.st.lines.length * 0.5 : 0) });
    });
    return out.sort((a, b) => b.sc - a.sc).slice(0, 12).map(x => x.it);
  }
  function renderResults() {
    const box = $('results');
    if (!$('q').value.trim()) { box.hidden = true; return; }
    box.hidden = false;
    if (!resItems.length) { box.innerHTML = '<div class="res-empty">No matches. Try “Shinjuku”, “新宿”, “JY17” or “Ginza”.</div>'; return; }
    box.innerHTML = resItems.map((it, i) => {
      if (it.type === 'station') {
        const st = it.st;
        return `<div class="res ${i === resSel ? 'sel' : ''}" data-i="${i}">
          <div class="t"><b>${nm(st)}</b><small>${nm2(st)}</small></div>
          <span class="xfer" style="margin-left:6px;gap:4px">${st.lines.slice(0, 6).map(x => bdg(x.line, x.num, true)).join('')}</span><span class="kind">station</span></div>`;
      }
      if (it.type === 'spot') {
        const p = it.p;
        return `<div class="res ${i === resSel ? 'sel' : ''}" data-i="${i}"><span class="poi-ic" style="--c:${POI_CATS[p.cat].color}">${p.emoji}</span>
          <div class="t"><b>${nm(p)}</b><small>${nm2(p)}</small></div><span class="kind">spot</span></div>`;
      }
      if (it.type === 'pref') {
        return `<div class="res ${i === resSel ? 'sel' : ''}" data-i="${i}"><span class="poi-ic" style="--c:#7cc4ff">📍</span>
          <div class="t"><b>${nm(it.pf)}</b><small>${nm2(it.pf)} · ${regionHasData(it.pf.id) ? 'line data available' : 'no line data yet'}</small></div><span class="kind">area</span></div>`;
      }
      const L = it.L;
      return `<div class="res ${i === resSel ? 'sel' : ''}" data-i="${i}">${bdg(L)}<div class="t"><b>${nm(L)}</b><small>${nm2(L)} · ${L.op}</small></div><span class="kind">line</span></div>`;
    }).join('');
  }
  function pickResult(i) {
    const it = resItems[i]; if (!it) return;
    $('results').hidden = true; $('q').blur();
    if (it.type === 'pref') { flyToPref(it.id); return; }
    selectItem(it.type === 'spot' ? 'poi' : it.type, it.id, true);
  }
  $('q').addEventListener('input', () => { resItems = runSearch($('q').value); resSel = 0; renderResults(); });
  $('q').addEventListener('focus', () => { if ($('q').value) { resItems = runSearch($('q').value); renderResults(); } });
  $('q').addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { resSel = Math.min(resSel + 1, resItems.length - 1); renderResults(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { resSel = Math.max(resSel - 1, 0); renderResults(); e.preventDefault(); }
    else if (e.key === 'Enter') { pickResult(resSel); }
    else if (e.key === 'Escape') { $('q').value = ''; $('results').hidden = true; $('q').blur(); }
  });
  $('results').addEventListener('mousedown', e => { const r = e.target.closest('.res'); if (r) { e.preventDefault(); pickResult(+r.dataset.i); } });
  document.addEventListener('click', e => { if (!e.target.closest('.search')) $('results').hidden = true; });
  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); $('q').focus(); $('q').select(); }
    else if (e.key === 'Escape' && document.activeElement.tagName !== 'INPUT') clearSel();
    else if (e.key === ' ' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'BUTTON') { e.preventDefault(); togglePlay(); }
  });

  /* ---------------- map interaction ---------------- */
  const ptrs = new Map(); let downPos = null, pinch0 = null;
  cv.addEventListener('pointerdown', e => {
    cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
    if (ptrs.size === 1) { downPos = { x: e.offsetX, y: e.offsetY, moved: false }; S.anim = null; }
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), s: S.cam.s }; downPos = null; }
  });
  cv.addEventListener('pointermove', e => {
    const p = ptrs.get(e.pointerId);
    if (p) {
      const dx = e.offsetX - p.x, dy = e.offsetY - p.y; p.x = e.offsetX; p.y = e.offsetY;
      if (ptrs.size === 1) {
        if (downPos && Math.hypot(e.offsetX - downPos.x, e.offsetY - downPos.y) > 4) { downPos.moved = true; cv.classList.add('drag'); S.follow = null; }
        if (downPos && downPos.moved) { S.cam.x -= dx / S.cam.s; S.cam.y -= dy / S.cam.s; }
      } else if (ptrs.size === 2 && pinch0) {
        const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
        zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, clamp(pinch0.s * d / pinch0.d, MIN_S, MAX_S));
      }
    } else hoverAt(e.offsetX, e.offsetY, e);
  });
  const endPtr = e => {
    const had = ptrs.delete(e.pointerId); cv.classList.remove('drag');
    if (ptrs.size < 2) pinch0 = null;
    if (had && downPos && !downPos.moved && ptrs.size === 0) clickAt(e.offsetX, e.offsetY);
    if (ptrs.size === 0) downPos = null;
  };
  cv.addEventListener('pointerup', endPtr); cv.addEventListener('pointercancel', endPtr);
  cv.addEventListener('pointerleave', () => { $('tip').hidden = true; });
  cv.addEventListener('wheel', e => {
    e.preventDefault(); S.anim = null;
    zoomAt(e.offsetX, e.offsetY, clamp(S.cam.s * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0016)), MIN_S, MAX_S));
  }, { passive: false });
  cv.addEventListener('dblclick', e => zoomAt(e.offsetX, e.offsetY, clamp(S.cam.s * 1.8, MIN_S, MAX_S)));
  function zoomAt(px, py, ns) {
    const x = wx(px), y = wy(py); S.cam.s = ns;
    S.cam.x = x - (px - S.W / 2) / ns; S.cam.y = y - (py - S.H / 2) / ns;
  }
  $('zin').onclick = () => zoomAt(S.W / 2, S.H / 2, clamp(S.cam.s * 1.5, MIN_S, MAX_S));
  $('zout').onclick = () => zoomAt(S.W / 2, S.H / 2, clamp(S.cam.s / 1.5, MIN_S, MAX_S));
  $('zfit').onclick = () => { S.follow = null; fitAll(true); };

  function pickAt(px, py) {
    let best = null, bd = 1e9;
    (S.trainScreen || []).forEach(t => { const d = Math.hypot(t.sx - px, t.sy - py); if (d < Math.max(t.R * 2.1 + 3, 12) && d < bd) { bd = d; best = { type: 'train', t }; } });
    if (best) return best;
    S.stScreen.forEach(o => { const d = Math.hypot(o.x - px, o.y - py); if (d < Math.max(o.r + 5, 11) && d < bd) { bd = d; best = { type: 'station', o }; } });
    if (best) return best;
    (S.poiScreen || []).forEach(o => { const d = Math.hypot(o.x - px, o.y - py); if (d < o.r + 4 && d < bd) { bd = d; best = { type: 'poi', o }; } });
    if (best) return best;
    (S.prefScreen || []).forEach(o => { const d = Math.hypot(o.x - px, o.y - py); if (d < 14 && d < bd) { bd = d; best = { type: 'pref', o }; } });
    return best;
  }
  function clickAt(px, py) {
    const h = pickAt(px, py);
    if (!h) { clearSel(); return; }
    if (h.type === 'train') { selectItem('train', h.t.key, false); }
    else if (h.type === 'poi') selectItem('poi', h.o.p.id, false);
    else if (h.type === 'pref') flyToPref(h.o.p.id);
    else selectItem('station', h.o.st.id, false);
  }
  function hoverAt(px, py, e) {
    const h = pickAt(px, py), tip = $('tip');
    S.hover = h && h.type === 'poi' ? { type: 'poi', id: h.o.p.id } : null;
    if (!h) { tip.hidden = true; cv.style.cursor = ''; return; }
    cv.style.cursor = 'pointer';
    let html;
    if (h.type === 'train') {
      const t = h.t, L = t.line, tpl = t.tpl, k = t.dwell ? t.k : t.next;
      const stn = stations[L.ids[tpl.stops[Math.min(k, tpl.stops.length - 1)] % L.n]];
      html = `<div class="row">${bdg(L)}</div><b>${L.loop ? TRS.destName(L, t.dir, stations, S.lang) : (S.lang === 'ja' ? TRS.destName(L, t.dir, stations, 'ja', tpl) + ' 行き' : 'To ' + TRS.destName(L, t.dir, stations, 'en', tpl))}</b>
        <span style="color:var(--muted)">${t.dwell ? 'Stopped at' : 'Next:'} ${nm(stn)}</span>`;
    } else if (h.type === 'pref') {
      const p = h.o.p;
      html = `<b>📍 ${nm(p)}</b><span style="color:var(--muted)">${nm2(p)} · ${regionHasData(p.id) ? 'click to zoom in' : 'no line data yet'}</span>`;
    } else if (h.type === 'poi') {
      const p = h.o.p;
      html = `<b>${p.emoji} ${nm(p)}</b><span style="color:var(--muted)">${nm2(p)} · ${POI_CATS[p.cat][S.lang]}</span>`;
    } else {
      const st = h.o.st;
      html = `<b>${nm(st)} <span style="color:var(--muted);font-weight:500">${nm2(st)}</span></b><div class="row">${h.o.vl.map(x => bdg(x.line, x.num, true)).join('')}</div>`;
    }
    tip.innerHTML = html; tip.hidden = false;
    const r = $('stage').getBoundingClientRect();
    tip.style.left = Math.min(px + 16, r.width - 270) + 'px'; tip.style.top = Math.min(py + 16, r.height - 90) + 'px';
  }

  /* ---------------- clock controls ---------------- */
  let scrubbing = false;
  function togglePlay() { S.playing = !S.playing; $('play').textContent = S.playing ? '❚❚' : '▶'; }
  $('play').onclick = togglePlay;
  $('scrub').addEventListener('input', () => { S.t = +$('scrub').value; scrubbing = true; });
  $('scrub').addEventListener('change', () => { scrubbing = false; });
  const SPEEDS = [1, 5, 10, 30, 60, 120];
  $('speeds').innerHTML = SPEEDS.map(v => `<button data-v="${v}" class="${v === S.speed ? 'on' : ''}">${v}×</button>`).join('');
  $('speeds').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.speed = +b.dataset.v; [...$('speeds').children].forEach(c => c.classList.toggle('on', c === b)); };
  function jstNow() {
    const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(new Date());
    const g = k => +p.find(x => x.type === k).value;
    let t = (g('hour') % 24) * 3600 + g('minute') * 60 + g('second');
    if (t < TRS.SERVICE_START) t += 86400; return t;
  }
  const PRESETS = [['Now', null], ['Morning rush', 8 * 3600 + 15 * 60], ['Daytime', 13 * 3600], ['Evening rush', 18 * 3600 + 10 * 60], ['Last trains', 24 * 3600 + 15 * 60]];
  $('presets').innerHTML = PRESETS.map(([n], i) => `<button data-i="${i}">${n}</button>`).join('');
  $('presets').onclick = e => { const b = e.target.closest('button'); if (!b) return; const v = PRESETS[+b.dataset.i][1]; S.t = v == null ? jstNow() : v; if (v == null) { S.speed = 1; [...$('speeds').children].forEach(c => c.classList.toggle('on', c.dataset.v === '1')); } };

  /* ---------------- misc controls ---------------- */
  ['Trains', 'Names', 'Badges', 'Inter', 'Water', 'Poi'].forEach(k => {
    $('opt' + k).addEventListener('change', e => { S.opts[k.toLowerCase()] = e.target.checked; });
  });
  $('langBtn').onclick = () => { renderPoiChips(); updateAreaLabel();  S.lang = S.lang === 'en' ? 'ja' : 'en'; $('langBtn').textContent = S.lang === 'en' ? 'EN' : '日本語'; document.documentElement.lang = S.lang; renderLineList(); renderPanel(false); };
  $('themeBtn').onclick = () => { S.theme = S.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = S.theme; try { localStorage.setItem('trs-theme', S.theme); } catch (_) { } };
  $('menuBtn').onclick = () => { document.body.classList.toggle('menu'); $('scrim').hidden = !document.body.classList.contains('menu'); };
  $('scrim').onclick = () => { document.body.classList.remove('menu'); $('scrim').hidden = true; };
  window.addEventListener('resize', () => { resize(); });


  /* ---------------- tourist-spot category chips ---------------- */
  function renderPoiChips() {
    $('poiChips').innerHTML = Object.entries(POI_CATS).map(([k, c]) =>
      `<button class="chip ${S.poiHidden.has(k) ? '' : 'on'}" data-cat="${k}"><i style="background:${c.color}"></i>${c[S.lang]}</button>`).join('');
  }
  $('poiChips').addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    const k = b.dataset.cat; S.poiHidden.has(k) ? S.poiHidden.delete(k) : S.poiHidden.add(k); renderPoiChips();
  });

  /* ---------------- live "trains per line" card ---------------- */
  function renderCounts() {
    const card = $('countCard');
    card.hidden = !S.countsOpen;
    $('btnCounts').classList.toggle('on', S.countsOpen);
    if (!S.countsOpen) return;
    const cnt = {}, inner = {};
    const trains = S.trains.filter(t => inScope(t.line));
    trains.forEach(t => { cnt[t.line.id] = (cnt[t.line.id] || 0) + 1; if (t.dir === 0) inner[t.line.id] = (inner[t.line.id] || 0) + 1; });
    const grp = {}; trains.forEach(t => { grp[t.line.grp] = (grp[t.line.grp] || 0) + 1; });
    const rows = lines.filter(inScope).sort((a, b) => (cnt[b.id] || 0) - (cnt[a.id] || 0) || a.order - b.order);
    const max = Math.max(1, ...Object.values(cnt));
    $('countHead').innerHTML = `<b>${trains.length}</b> trains running <span class="muted">· ${S.scope === 'all' || !S.area ? (S.lang === 'ja' ? '読み込み済み全域' : 'all loaded') : areaLabel()}</span>`;
    $('countGrp').innerHTML = OPS.filter(([op]) => grp[op]).map(([op, col]) => `<span class="gchip"><i style="background:${col}"></i>${op.replace(' Subway', '').replace(' & Others', '').replace(' & AGT', '')} <b>${grp[op] || 0}</b></span>`).join('');
    if (!rows.length) { $('countRows').innerHTML = '<div class="empty-note" style="padding:10px 6px">No line data for this area yet.</div>'; return; }
    $('countRows').innerHTML = rows.map(L => {
      const n = cnt[L.id] || 0, off = S.hidden.has(L.id);
      const split = L.loop && !L.oneway && n ? `<small class="split">↺${L.ccw0 ? (inner[L.id] || 0) : n - (inner[L.id] || 0)} ↻${L.ccw0 ? n - (inner[L.id] || 0) : (inner[L.id] || 0)}</small>` : '';
      return `<div class="crow ${off ? 'off' : ''}" data-line="${L.id}" style="--c:${L.color}">${bdg(L, null, true)}
        <span class="cn">${nm(L)}${split}</span><span class="bar"><i style="width:${(n / max * 100).toFixed(1)}%"></i></span><b class="cc">${n}</b></div>`;
    }).join('');
  }
  $('btnCounts').onclick = () => { S.countsOpen = !S.countsOpen; renderCounts(); };
  $('countClose').onclick = () => { S.countsOpen = false; renderCounts(); };
  $('countRows').addEventListener('click', e => { const r = e.target.closest('.crow'); if (r) selectItem('line', r.dataset.line, true); });

  /* ---------------- real timetable (optional, from data/timetable.json) ---------------- */
  function setDataMode(mode) {
    S.dataMode = mode;
    if (mode === 'sim' || !ttData) { lines.forEach(L => { L.real = null; }); }
    else TRS.setRealTrips(net, ttData, mode);
    const real = lines.filter(L => L.real).length;
    document.querySelectorAll('#ttBtns button').forEach(b => b.classList.toggle('on', b.dataset.m === mode));
    $('ttNote').textContent = mode === 'sim' ? 'Generated from line frequency, speed and dwell time.' : `Real trips on ${real}/${lines.length} lines (others simulated). Source: ODPT — ${ttData.meta && ttData.meta.generated || ''}`;
  }
  if (ttData) {
    $('ttSection').hidden = false;
    $('ttBtns').onclick = e => { const b = e.target.closest('button'); if (b) setDataMode(b.dataset.m); };
    setDataMode(ttData.lines && Object.values(ttData.lines).some(x => x.weekday) ? 'weekday' : 'sim');
  }

  /* ---------------- areas (prefecture under the map centre) + lazy region loading ---------------- */
  const loadedRegions = new Set(RG.REGIONS.filter(r => r.builtin).map(r => r.id)), loadingRegions = new Set();
  const regionHasData = prefId => { const r = RG.regionOfPref[prefId]; return !!r && (r.builtin || !!r.file); };
  const regionIsLoaded = prefId => { const r = RG.regionOfPref[prefId]; return !!r && loadedRegions.has(r.id); };
  let toastT = 0;
  function toast(msg, ms) { const el = $('toast'); el.textContent = msg; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, ms || 2400); }

  function addRegionData(id, d) {
    const have = new Set(Object.keys(stations));
    const rows = d.STATION_SRC.trim().split('\n').filter(r => r.trim() && !have.has(r.split('|')[0]));
    ALL.STATION_SRC += '\n' + rows.join('\n') + '\n';
    const lineIds = new Set(ALL.LINE_SRC.map(l => l.id));
    d.LINE_SRC.forEach(l => { if (!lineIds.has(l.id)) ALL.LINE_SRC.push(l); });
    (d.POIS || []).forEach(p => { if (!poiById[p.id]) POI.push(p); });
    (d.WATER || []).forEach(poly => WATER_POLYS.push(poly.map(q => TRS.proj(q[0], q[1]))));
    buildNet(); prepPois(); computeOps();
    if (S.dataMode !== 'sim' && ttData) TRS.setRealTrips(net, ttData, S.dataMode);
    buildIndex(); buildSidebar(); updateScopeUi();
    if (window.__TRS) window.__TRS.net = net;
  }
  function loadRegion(r) {
    if (!r || !r.file || loadedRegions.has(r.id) || loadingRegions.has(r.id)) return;
    loadingRegions.add(r.id); toast('Loading ' + r.en + ' lines…', 6000);
    const sc = document.createElement('script'); sc.src = r.file;
    sc.onload = () => {
      loadingRegions.delete(r.id);
      const d = (window.TRS_REGIONS_DATA || {})[r.id];
      if (!d) { toast('Region data for ' + r.en + ' is empty'); return; }
      addRegionData(r.id, d); loadedRegions.add(r.id);
      toast(r.en + ' loaded: ' + d.LINE_SRC.length + ' lines');
    };
    sc.onerror = () => { loadingRegions.delete(r.id); toast('Could not load ' + r.en + ' data'); };
    document.head.appendChild(sc);
  }
  function updateArea() {
    const c = TRS.unproj(S.cam.x, S.cam.y);
    const area = S.cam.s >= 0.0012 ? RG.nearestPref(c.lat, c.lon) : null;
    if ((area && area.id) === (S.area && S.area.id)) return;
    S.area = area;
    if (area) { const r = RG.regionOfPref[area.id]; if (r && r.file && S.cam.s >= 0.004) loadRegion(r); }
    updateAreaLabel(); refreshScope();
  }
  function updateAreaLabel() { $('areaName').textContent = areaLabel(); }
  function updateScopeUi() {
    document.querySelectorAll('#scopeBtns button').forEach(b => b.classList.toggle('on', b.dataset.s === S.scope));
    const a = S.area, note = $('areaNote'); if (!note) return;
    if (!a) note.textContent = 'Zoomed out — showing every loaded line. Zoom into a prefecture to scope the dashboard.';
    else if (!lines.some(L => L.prefs.has(a.id))) note.textContent = 'No line data for ' + areaLabel() + ' yet.' + (regionHasData(a.id) ? ' (loading…)' : '');
    else if (S.scope === 'area') note.textContent = lines.filter(inScope).length + ' lines serve ' + areaLabel() + ' (nearest-capital approximation of the border).';
    else note.textContent = 'Showing all ' + lines.length + ' loaded lines.';
  }
  function refreshScope() { renderOpChips(); renderLineList(); renderCounts(); updateScopeUi(); }
  $('scopeBtns').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.scope = b.dataset.s; refreshScope(); };
  function flyToPref(id) {
    const pf = RG.prefById[id]; if (!pf) return;
    const q = TRS.proj(pf.lat, pf.lon); S.follow = null; clearSel();
    flyTo(q.x + rightPadWorld(), q.y, 0.045, 1000);
    closeAreaMenu();
  }
  // area menu
  function renderAreaMenu() {
    const f = normQ($('areaQ').value || '');
    const rows = RG.PREFS.filter(p => !f || normQ(p.en + p.ja).includes(f));
    const sorted = rows.slice().sort((x, y) => (regionHasData(y.id) - regionHasData(x.id)));
    $('areaList').innerHTML = sorted.map(p => {
      const has = regionHasData(p.id), reg = RG.regionOfPref[p.id];
      return `<div class="amrow ${has ? '' : 'nodata'} ${S.area && S.area.id === p.id ? 'cur' : ''}" data-p="${p.id}"><span><b>${nm(p)}</b> <small>${nm2(p)}</small></span><em>${has ? reg.en : 'no data yet'}</em></div>`;
    }).join('') || '<div class="empty-note" style="padding:10px">No match</div>';
  }
  function closeAreaMenu() { $('areaMenu').hidden = true; $('areaChip').classList.remove('on'); }
  $('areaChip').onclick = e => {
    e.stopPropagation(); const open = $('areaMenu').hidden;
    if (open) { $('areaMenu').hidden = false; $('areaChip').classList.add('on'); $('areaQ').value = ''; renderAreaMenu(); $('areaQ').focus(); } else closeAreaMenu();
  };
  $('areaQ').oninput = renderAreaMenu;
  $('areaMenu').addEventListener('click', e => { e.stopPropagation(); const r = e.target.closest('.amrow'); if (r) flyToPref(r.dataset.p); });
  document.addEventListener('click', e => { if (!e.target.closest('#areaMenu') && !e.target.closest('#areaChip')) closeAreaMenu(); });

  // prefecture markers when zoomed out
  function drawPrefs() {
    S.prefScreen = [];
    const s = S.cam.s; if (s >= 0.012) return;
    const c = T(), placed = [];
    ctx.font = '600 11.5px Inter, "Hiragino Sans", "Noto Sans JP", system-ui, sans-serif'; ctx.textBaseline = 'middle';
    RG.PREFS.forEach(p => {
      const q = TRS.proj(p.lat, p.lon), x = sx(q.x), y = sy(q.y);
      if (x < -40 || y < -20 || x > S.W + 40 || y > S.H + 20) return;
      S.prefScreen.push({ p, x, y });
    });
    S.prefScreen.forEach(o => {
      const has = regionHasData(o.p.id), cur = S.area && S.area.id === o.p.id;
      ctx.beginPath(); ctx.arc(o.x, o.y, cur ? 6 : 4.2, 0, 7);
      if (has) { ctx.fillStyle = '#7cc4ff'; ctx.fill(); } else { ctx.lineWidth = 1.6; ctx.strokeStyle = c.label; ctx.globalAlpha = .45; ctx.stroke(); ctx.globalAlpha = 1; }
      if (cur) { ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke(); }
      const label = nm(o.p), w = ctx.measureText(label).width, r = { x: o.x + 8, y: o.y - 7, w, h: 14 };
      if (placed.some(q => r.x < q.x + q.w && r.x + r.w > q.x && r.y < q.y + q.h && r.y + r.h > q.y)) return;
      placed.push(r);
      ctx.globalAlpha = has ? 1 : .55; ctx.lineWidth = 3; ctx.strokeStyle = c.halo; ctx.strokeText(label, r.x, o.y); ctx.fillStyle = c.label; ctx.fillText(label, r.x, o.y); ctx.globalAlpha = 1;
    });
  }

  /* ---------------- boot ---------------- */
  try { const th = localStorage.getItem('trs-theme'); if (th) { S.theme = th; document.documentElement.dataset.theme = th; } } catch (_) { }
  resize(); if (S.ui < 0.8) $('q').placeholder = 'Search station, line, spot…';
  fitAll(false); computeOps(); buildIndex(); buildSidebar(); renderPoiChips(); updateArea(); updateAreaLabel();
  RG.REGIONS.filter(r => r.national).forEach(loadRegion);
  const q0 = new URLSearchParams(location.search);
  if (q0.get('t')) S.t = clamp(+q0.get('t') * 3600, TRS.SERVICE_START, TRS.SERVICE_END - 1);
  if (q0.get('line') && byId[q0.get('line')]) selectItem('line', q0.get('line'), true);
  if (q0.get('stn') && stations[q0.get('stn')]) selectItem('station', q0.get('stn'), true);
  window.__TRS = { S, net, flyTo, selectItem, flyToPref, TRS };
  requestAnimationFrame(frame);
})();
