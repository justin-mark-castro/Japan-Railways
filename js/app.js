/* ------------------------------------------------------------------
 * Tokyo Rail Sim — UI, rendering and interaction
 * ------------------------------------------------------------------ */
(async function () {
  'use strict';
  async function loadJSON(url) { try { const r = await fetch(url, { cache: 'no-cache' }); return r.ok ? await r.json() : null; } catch (_) { return null; } }
  const manifest = (await loadJSON('data/manifest.json')) || {};
  const geoData = manifest.geometry ? await loadJSON('data/geometry.json') : null;
  const ttData = manifest.timetable ? await loadJSON('data/timetable.json') : null;
  const net = TRS.build(TRS_DATA, { geometry: geoData && geoData.stations });
  const { stations, lines, byId } = net;
  const $ = id => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------------- state ---------------- */
  const S = {
    lang: 'en', theme: 'dark', t: 8 * 3600, speed: 10, playing: true,
    hidden: new Set(), ops: { 'JR East': true, 'Tokyo Metro': true, 'Toei Subway': true, 'Private & Others': true },
    sel: null,            // {type:'station'|'line'|'train', id}
    follow: null,
    opts: { trains: true, names: true, badges: true, inter: false, water: true, poi: true },
    poiCats: {}, dataMode: 'sim', countsOpen: false,
    cam: { x: -2600, y: 500, s: 0.06 }, W: 800, H: 600, dpr: 1,
    anim: null, trains: [], trainIdx: {}, stScreen: [], hover: null, dragging: false
  };
  const MIN_S = 0.012, MAX_S = 2.4;

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
  const bdg = (L, num, sm) => `<span class="bdg">${sym(L, sm)}${num != null ? `<span class="no" style="--c:${L.color}">${pad2(num)}</span>` : ''}</span>`;
  const lineName = L => nm(L);
  const normQ = s => s.toLowerCase().replace(/[\s\-・'’.,]/g, '');

  /* ---------------- tourist spots ---------------- */
  const POI = TRS_POI.POIS, POI_CATS = TRS_POI.CATS, poiById = {};
  S.poiHidden = new Set();
  POI.forEach(p => {
    const q = TRS.proj(p.lat, p.lon); p.x = q.x; p.y = q.y; poiById[p.id] = p;
    p.near = Object.values(stations).map(st => ({ st, d: Math.hypot(st.x - p.x, st.y - p.y) }))
      .filter(o => o.st.lines.some(x => !x.skipped)).sort((a, b) => a.d - b.d)
      .filter(o => o.d < 1600).slice(0, 3)
      .map(o => ({ st: o.st, d: o.d, walk: Math.max(1, Math.round(o.d * 1.3 / 80)) }));
    if (!p.near.length) { const o = Object.values(stations).map(st => ({ st, d: Math.hypot(st.x - p.x, st.y - p.y) })).sort((a, b) => a.d - b.d)[0]; p.near = [{ st: o.st, d: o.d, walk: Math.round(o.d * 1.3 / 80) }]; }
  });

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
    ctx.fillStyle = c.water; ctx.beginPath();
    WATER_PTS.forEach((p, i) => (i ? ctx.lineTo(sx(p.x), sy(p.y)) : ctx.moveTo(sx(p.x), sy(p.y))));
    ctx.closePath(); ctx.fill();
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
  const WATER_PTS = TRS_DATA.WATER.map(p => TRS.proj(p[0], p[1]));
  const RIVER_PTS = TRS_DATA.RIVERS.map(r => ({ w: r.w, pts: r.pts.map(p => TRS.proj(p[0], p[1])) }));

  let lineSS = {};
  function drawLines() {
    const c = T(), s = S.cam.s;
    const w = clamp(1.6 + 38 * s, 2.4, 8.5), spacing = w + 1.2;
    const focus = selectedLine();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    lineSS = {};
    // draw subways first, JR on top
    const order = lines.filter(isVisible).sort((a, b) => (a.type === 'jr') - (b.type === 'jr'));
    order.forEach(L => {
      const ss = lineSS[L.id] = lineScreen(L, spacing);
      const lw = L.type === 'jr' ? w * 1.12 : w * 0.92;
      ctx.globalAlpha = focus && focus !== L ? 0.16 : 1;
      ctx.beginPath(); ss.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.strokeStyle = c.casing; ctx.lineWidth = lw + 2.6; ctx.stroke();
      ctx.strokeStyle = L.color; ctx.lineWidth = lw; ctx.stroke();
      if (L.type === 'jr' && lw >= 4) {
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
    const base = clamp(1.6 + 16 * s, 2.4, 7.5);
    S.stScreen = [];
    const margin = 40;
    Object.values(stations).forEach(st => {
      let vl = stationVisibleLines(st);
      if (!vl.length) return;
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
    const fs = clamp(11 + s * 14, 11, 14);
    const placed = [];
    const items = S.stScreen.map(o => {
      let pri = o.vl.length * 10 + (o.vl.some(v => v.line.type === 'jr') ? 4 : 0);
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
      ctx.font = '700 9.5px Inter, system-ui, sans-serif';
      const bw = badges.map(b => ctx.measureText(b.label).width + 8);
      const rowW = bw.reduce((a, b) => a + b + 3, 0);
      const showSub = s >= 0.3;
      const blockW = Math.max(tw, rowW), blockH = fs + 3 + (showSub ? 12 : 0) + (badges.length ? 16 : 0);
      const gap = o.r + 5;
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
      const alignX = k.a === 'r' ? k.x + blockW : k.a === 'c' ? k.x + blockW / 2 : k.x;
      ctx.textAlign = k.a === 'r' ? 'right' : k.a === 'c' ? 'center' : 'left';
      ctx.font = `600 ${fs}px Inter, "Hiragino Sans", "Noto Sans JP", system-ui, sans-serif`;
      const ty = k.y + fs;
      ctx.lineWidth = 3.5; ctx.strokeStyle = c.halo; ctx.lineJoin = 'round'; ctx.strokeText(text, alignX, ty);
      ctx.fillStyle = c.label; ctx.fillText(text, alignX, ty);
      let yy = ty;
      if (showSub) {
        ctx.font = '500 10.5px Inter, "Hiragino Sans", "Noto Sans JP", system-ui, sans-serif';
        yy += 12; ctx.lineWidth = 3; ctx.strokeText(nm2(o.st), alignX, yy); ctx.fillStyle = c.sub; ctx.fillText(nm2(o.st), alignX, yy);
      }
      if (badges.length) {
        yy += 5;
        let bx = k.a === 'r' ? k.x + blockW - rowW + 3 : k.a === 'c' ? k.x + blockW / 2 - rowW / 2 : k.x;
        ctx.textAlign = 'center'; ctx.font = '700 9.5px Inter, system-ui, sans-serif';
        badges.forEach((b, i) => {
          const L = b.v.line;
          ctx.fillStyle = L.color; roundRect(bx, yy, bw[i], 13, L.type === 'jr' ? 3.5 : 6.5); ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1; ctx.stroke();
          ctx.fillStyle = L.textColor; ctx.fillText(b.label, bx + bw[i] / 2, yy + 9.8);
          bx += bw[i] + 3;
        });
      }
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
    lines.forEach(L => { if (isVisible(L)) TRS.activeTrips(L, S.t, arr); });
    S.trains = arr; S.trainIdx = {};
    arr.forEach(t => { S.trainIdx[t.key] = t; });
  }
  function badgePath(L, r) {
    if (L.type === 'jr') roundRect(-r, -r, r * 2, r * 2, r * .36);
    else if (L.type === 'pvt') roundRect(-r * 1.25, -r * .85, r * 2.5, r * 1.7, r * .85);
    else if (L.type === 'tram') roundRect(-r * 1.2, -r * .9, r * 2.4, r * 1.8, r * .28);
    else { ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); }
  }
  function drawTrains() {
    S.trainScreen = [];
    if (!S.opts.trains) return;
    const s = S.cam.s, focus = selectedLine(), c = T();
    const R = clamp(0.6 + 72 * s, 3.6, 12.5);
    S.trains.forEach(t => {
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
    if (!S.opts.poi) return;
    const c = T(), s = S.cam.s, Rp = clamp(8 + 22 * s, 9, 16);
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
        ctx.font = '700 11.5px Inter, "Hiragino Sans", "Noto Sans JP", system-ui, sans-serif';
        ctx.textBaseline = 'alphabetic';
        ctx.lineWidth = 3.5; ctx.strokeStyle = c.halo; ctx.lineJoin = 'round'; ctx.strokeText(txt, x, y + Rp + 13);
        ctx.fillStyle = col; ctx.fillText(txt, x, y + Rp + 13);
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
    const n = S.trains.length;
    $('hudTrains').textContent = n + (n === 1 ? ' train running' : ' trains running');
    $('hudPeriod').textContent = (S.dataMode === 'sim' ? TRS.PERIOD_LABEL[TRS.periodOf(S.t)] : 'Real timetable · ' + S.dataMode) + (n === 0 ? ' · out of service' : '');
    // line counts
    const counts = {}; S.trains.forEach(t => { counts[t.line.id] = (counts[t.line.id] || 0) + 1; });
    document.querySelectorAll('.lrow .cnt').forEach(el => { el.textContent = counts[el.dataset.l] || 0; });
    renderCounts();
    refreshPanel();
  }

  /* ---------------- sidebar ---------------- */
  const OPS = [['JR East', '#9ACD32'], ['Tokyo Metro', '#FF9500'], ['Toei Subway', '#6CBB5A'], ['Private & Others', '#8F76D6'], ['Trams', '#E5508F']];
  function buildSidebar() {
    $('opChips').innerHTML = OPS.map(([op, col]) => `<button class="chip ${S.ops[op] ? 'on' : ''}" data-op="${op}"><i style="background:${col}"></i>${op}</button>`).join('');
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
        if (q === 'none' || (q === 'jr' && L.type !== 'jr') || (q === 'subway' && L.type !== 'metro' && L.type !== 'toei') || (q === 'pvt' && L.type !== 'pvt' && L.type !== 'tram')) S.hidden.add(L.id);
      });
      syncSidebar();
    };
    $('lineFilter').oninput = renderLineList;
  }
  function renderLineList() {
    const f = normQ($('lineFilter').value || '');
    let html = '';
    OPS.forEach(([op]) => {
      const ls = lines.filter(L => L.grp === op && (!f || normQ(L.en + L.ja + L.code + L.op + L.id).includes(f)));
      if (!ls.length) return;
      html += `<div class="grp">${op}</div>`;
      ls.forEach(L => {
        html += `<div class="lrow ${S.hidden.has(L.id) ? 'off' : ''} ${S.sel && S.sel.type === 'line' && S.sel.id === L.id ? 'active' : ''}" data-id="${L.id}" style="--c:${L.color};--tc:${L.textColor}">
          <button class="eye" data-eye="${L.id}" aria-label="Toggle ${L.en}">${S.hidden.has(L.id) ? '' : '✓'}</button>
          ${bdg(L)}
          <div class="nm"><b>${lineName(L)}</b><small>${L.type === 'pvt' || L.type === 'tram' ? L.op + ' · ' : ''}${nm2(L)} · ${L.n} stn</small></div>
          <span class="cnt" data-l="${L.id}" title="trains running">0</span></div>`;
      });
    });
    $('lineList').innerHTML = html || '<div class="empty-note" style="padding:14px">No matching lines.</div>';
  }
  $('lineList').addEventListener('click', e => {
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
    $('opChips').querySelectorAll('.chip').forEach(c => c.classList.toggle('on', S.ops[c.dataset.op]));
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
    const split = L.loop ? `<div class="p-sub" style="margin:8px 0 0">↺ ${L.ccw0 ? L.dirNames[0] : L.dirNames[1]}: <b>${L.ccw0 ? inn : n - inn}</b> &nbsp;·&nbsp; ↻ ${L.ccw0 ? L.dirNames[1] : L.dirNames[0]}: <b>${L.ccw0 ? n - inn : inn}</b></div>` : '';
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
  const index = [];
  Object.values(stations).forEach(st => {
    const codes = st.lines.filter(x => !x.skipped).map(x => normQ(x.line.label(x.idx)));
    index.push({ type: 'station', id: st.id, en: normQ(st.en), ja: st.ja, codes, st });
  });
  POI.forEach(p => index.push({ type: 'spot', id: p.id, en: normQ(p.en), ja: p.ja, codes: [], p }));
  lines.forEach(L => index.push({ type: 'line', id: L.id, en: normQ(L.en), ja: L.ja, codes: [normQ(L.code), normQ(L.id)], L }));
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
      const L = it.L;
      return `<div class="res ${i === resSel ? 'sel' : ''}" data-i="${i}">${bdg(L)}<div class="t"><b>${nm(L)}</b><small>${nm2(L)} · ${L.op}</small></div><span class="kind">line</span></div>`;
    }).join('');
  }
  function pickResult(i) {
    const it = resItems[i]; if (!it) return;
    $('results').hidden = true; $('q').blur();
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
    return best;
  }
  function clickAt(px, py) {
    const h = pickAt(px, py);
    if (!h) { clearSel(); return; }
    if (h.type === 'train') { selectItem('train', h.t.key, false); }
    else if (h.type === 'poi') selectItem('poi', h.o.p.id, false);
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
  $('langBtn').onclick = () => { renderPoiChips();  S.lang = S.lang === 'en' ? 'ja' : 'en'; $('langBtn').textContent = S.lang === 'en' ? 'EN' : '日本語'; document.documentElement.lang = S.lang; renderLineList(); renderPanel(false); };
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
    S.trains.forEach(t => { cnt[t.line.id] = (cnt[t.line.id] || 0) + 1; if (t.dir === 0) inner[t.line.id] = (inner[t.line.id] || 0) + 1; });
    const grp = {}; S.trains.forEach(t => { grp[t.line.grp] = (grp[t.line.grp] || 0) + 1; });
    const rows = lines.slice().sort((a, b) => (cnt[b.id] || 0) - (cnt[a.id] || 0) || a.order - b.order);
    const max = Math.max(1, ...Object.values(cnt));
    $('countHead').innerHTML = `<b>${S.trains.length}</b> trains running <span class="muted">· ${S.lang === 'ja' ? '路線別' : 'by line'}</span>`;
    $('countGrp').innerHTML = OPS.map(([op, col]) => `<span class="gchip"><i style="background:${col}"></i>${op.replace(' Subway', '').replace(' & Others', '').replace('Private', 'Private')} <b>${grp[op] || 0}</b></span>`).join('');
    $('countRows').innerHTML = rows.map(L => {
      const n = cnt[L.id] || 0, off = S.hidden.has(L.id);
      const split = L.loop && n ? `<small class="split">↺${L.ccw0 ? (inner[L.id] || 0) : n - (inner[L.id] || 0)} ↻${L.ccw0 ? n - (inner[L.id] || 0) : (inner[L.id] || 0)}</small>` : '';
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

  /* ---------------- boot ---------------- */
  try { const th = localStorage.getItem('trs-theme'); if (th) { S.theme = th; document.documentElement.dataset.theme = th; } } catch (_) { }
  resize(); fitAll(false); buildSidebar(); renderPoiChips();
  const q0 = new URLSearchParams(location.search);
  if (q0.get('t')) S.t = clamp(+q0.get('t') * 3600, TRS.SERVICE_START, TRS.SERVICE_END - 1);
  if (q0.get('line') && byId[q0.get('line')]) selectItem('line', q0.get('line'), true);
  if (q0.get('stn') && stations[q0.get('stn')]) selectItem('station', q0.get('stn'), true);
  window.__TRS = { S, net, flyTo, selectItem };
  requestAnimationFrame(frame);
})();
