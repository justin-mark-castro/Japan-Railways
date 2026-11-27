/* ------------------------------------------------------------------
 * Tokyo Rail Sim — network builder + schedule engine
 * The simulation is stateless: given a "service time" (seconds, 4:30 → 28:30)
 * the position of every train is computed analytically from departure lists.
 * ------------------------------------------------------------------ */
(function (g) {
  'use strict';

  const LAT0 = 35.6812, LON0 = 139.7671;
  // Mercator scaled to metres at Tokyo: conformal, so shapes stay right from Hokkaido to Okinawa
  const RAD = Math.PI / 180, ER = 6378137, K0 = Math.cos(LAT0 * RAD);
  const merc = lat => Math.log(Math.tan(Math.PI / 4 + lat * RAD / 2));
  const MY0 = merc(LAT0);
  const proj = (lat, lon) => ({ x: (lon - LON0) * RAD * ER * K0, y: -(merc(lat) - MY0) * ER * K0 });
  const unproj = (x, y) => ({ lat: (2 * Math.atan(Math.exp(-y / (ER * K0) + MY0)) - Math.PI / 2) / RAD, lon: LON0 + x / (ER * K0) / RAD });

  const SERVICE_START = 4.5 * 3600, SERVICE_END = 28.5 * 3600;

  function lum(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, gg = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * gg + 0.114 * b) / 255;
  }

  // Google-polyline decoder (precision 1e5) -> projected world points, cached per encoded string
  const shapeCache = new Map();
  function decodeShape(enc) {
    let hit = shapeCache.get(enc);
    if (hit) return hit;
    const out = []; let i = 0, la = 0, lo = 0;
    while (i < enc.length) {
      let sh = 0, r = 0, b;
      do { b = enc.charCodeAt(i++) - 63; r |= (b & 31) << sh; sh += 5; } while (b >= 32);
      la += (r & 1) ? ~(r >> 1) : r >> 1; sh = 0; r = 0;
      do { b = enc.charCodeAt(i++) - 63; r |= (b & 31) << sh; sh += 5; } while (b >= 32);
      lo += (r & 1) ? ~(r >> 1) : r >> 1;
      out.push(proj(la / 1e5, lo / 1e5));
    }
    shapeCache.set(enc, out);
    return out;
  }
  const SHAPE_GROUP = { jr: 'j', shin: 'k', tram: 't', mono: 'm' };   // everything else 'p' (see tools/import/build-shapes.py)

  // Badge codes must be Latin: lines imported without an official symbol get letters derived from their English name
  const CODE_SKIP = /^(JR|Line|Main|Railway|Railroad|Electric|Tram|Subway|Route|Shinkansen|Monorail|Rapid|Express|Metro|Transit|Rail|Tokyo|Osaka|Kobe|Nagoya|Kyoto|Sapporo|Fukuoka|Sendai|Yokohama|City|Municipal|Kotsu|Tetsudo|Dentetsu|Tramway)$/i;
  function latinCodes(defs) {
    const used = new Set(defs.map(d => d.code).filter(c => /^[\x20-\x7e]+$/.test(c)));
    defs.forEach(d => {
      if (/^[\x20-\x7e]+$/.test(d.code || '')) return;
      const words = String(d.en || '').replace(/\(.*?\)/g, ' ').split(/[^A-Za-z]+/).filter(Boolean);
      const w = (words.find(x => !CODE_SKIP.test(x)) || words[0] || 'X').toUpperCase();
      const cands = [];
      for (let k = 1; k < w.length; k++) cands.push(w[0] + w[k]);
      cands.push(w.slice(0, 2), w[0]);
      d.code = cands.find(c => c && !used.has(c)) || cands[0] || 'X';
      used.add(d.code);
    });
  }

  function build(src, opts) {
    latinCodes(src.LINE_SRC);
    opts = opts || {};
    const geo = opts.geometry || {};
    const stations = {};
    src.STATION_SRC.trim().split('\n').forEach(row => {
      if (!row.trim()) return;
      const [id, en, ja, lat0, lon0] = row.split('|');
      let lat = +lat0, lon = +lon0;
      if (geo[id]) { lat = geo[id][0]; lon = geo[id][1]; }
      const p = proj(lat, lon);
      stations[id] = { id, en, ja, lat, lon, x: p.x, y: p.y, lines: [] };
    });

    const lines = src.LINE_SRC.map((def, order) => {
      const ids = [], nums = [], passSet = [];
      let num = 0;
      def.st.trim().split(/\s+/).forEach(tok => {
        const [id, n] = tok.split(':');
        if (!stations[id]) throw new Error('Unknown station ' + id + ' in ' + def.id);
        if (n === '-') { nums.push(null); passSet.push(id); }
        else if (n === '!') nums.push(null);   // a stop without a station number
        else { num = n !== undefined ? +n : num + 1; nums.push(num); }
        ids.push(id);
      });
      const n = ids.length;
      const V = def.loop ? n + 1 : n;
      const pts = [];
      for (let i = 0; i < V; i++) { const s = stations[ids[i % n]]; pts.push({ x: s.x, y: s.y }); }
      // optional real track shape between consecutive stations: chain[i] = world points incl. both stations, ecum[i] = cumulative metres
      const shp = opts.shapes, gl = SHAPE_GROUP[def.type] || 'p';
      const chain = new Array(V - 1).fill(null), ecum = new Array(V - 1).fill(null), ebox = new Array(V - 1).fill(null);
      const cum = [0];
      let bx0 = 1e12, bx1 = -1e12, by0 = 1e12, by1 = -1e12;
      pts.forEach(p => { bx0 = Math.min(bx0, p.x); bx1 = Math.max(bx1, p.x); by0 = Math.min(by0, p.y); by1 = Math.max(by1, p.y); });
      for (let i = 1; i < V; i++) {
        const a = ids[(i - 1) % n], b = ids[i % n], p0 = pts[i - 1], p1 = pts[i];
        let len = Math.hypot(p1.x - p0.x, p1.y - p0.y);
        const enc = shp && shp[(a < b ? a + '|' + b : b + '|' + a) + '|' + gl];
        if (enc) {
          let inner = decodeShape(enc);
          if (inner.length) {
            if (a > b) inner = inner.slice().reverse();
            const ch = [p0].concat(inner, [p1]), ec = [0];
            let x0 = 1e12, x1 = -1e12, y0 = 1e12, y1 = -1e12;
            for (let k = 1; k < ch.length; k++) ec.push(ec[k - 1] + Math.hypot(ch[k].x - ch[k - 1].x, ch[k].y - ch[k - 1].y));
            ch.forEach(q => { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); });
            chain[i - 1] = ch; ecum[i - 1] = ec; ebox[i - 1] = { x0, x1, y0, y1 }; len = ec[ec.length - 1];
            bx0 = Math.min(bx0, x0); bx1 = Math.max(bx1, x1); by0 = Math.min(by0, y0); by1 = Math.max(by1, y1);
          }
        }
        cum.push(cum[i - 1] + len);
      }
      const skip = new Set((def.skip || '').split(/\s+/).filter(Boolean).concat(passSet));
      const L = Object.assign({}, def, {
        order, ids, nums, n, V, pts, cum, chain, ecum, ebox, hasShape: chain.some(Boolean), len: cum[V - 1], skip, bbox: { x0: bx0, x1: bx1, y0: by0, y1: by1 },
        textColor: lum(def.color) > 0.62 ? '#111' : '#fff',
        grp: def.grp || def.op,
        label: i => (def.nonum || nums[i % n] == null ? '' : def.code + String(nums[i % n]).padStart(2, '0')),
        dirNames: def.dirs || null
      });
      ids.forEach((id, i) => stations[id].lines.push({ line: L, idx: i, num: nums[i], skipped: skip.has(id) }));
      return L;
    });

    // lane offsets for lines that share the same station-to-station edge
    const edgeMap = {};
    lines.forEach(L => {
      for (let i = 0; i < L.V - 1; i++) {
        const a = L.ids[i % L.n], b = L.ids[(i + 1) % L.n];
        const key = a < b ? a + '|' + b : b + '|' + a;
        (edgeMap[key] = edgeMap[key] || []).push(L);
      }
    });
    lines.forEach(L => {
      const edgeLane = [];
      for (let i = 0; i < L.V - 1; i++) {
        const a = L.ids[i % L.n], b = L.ids[(i + 1) % L.n];
        const key = a < b ? a + '|' + b : b + '|' + a;
        const grp = edgeMap[key];
        edgeLane.push(grp.indexOf(L) - (grp.length - 1) / 2);
      }
      L.lane = [];
      for (let i = 0; i < L.V; i++) {
        const l0 = i > 0 ? edgeLane[i - 1] : edgeLane[0];
        const l1 = i < L.V - 1 ? edgeLane[i] : edgeLane[L.V - 2];
        L.lane.push((l0 + l1) / 2);
      }
    });

    // trip templates + departure lists
    lines.forEach(L => {
      L.tpl = [0, 1].map(dir => {
        const all = [];
        for (let i = 0; i < L.V; i++) all.push(i);
        if (dir === 1) all.reverse();
        const stops = all.filter(i => !L.skip.has(L.ids[i % L.n]));
        const sp = L.v / 3.6, arr = [], dep = [], cumAt = [];
        stops.forEach((vi, k) => {
          cumAt.push(L.cum[vi]);
          if (k === 0) { arr.push(0); dep.push(0); return; }
          const dist = Math.abs(L.cum[vi] - L.cum[stops[k - 1]]);
          const a = dep[k - 1] + dist / sp + 18;
          arr.push(a); dep.push(k === stops.length - 1 ? a : a + L.dwell);
        });
        const starts = [];
        let t = L.first * 3600 + dir * 100;
        if (L.oneway && dir === 1) t = Infinity;
        while (t < L.last * 3600) { starts.push(t); t += headwayAt(L, t) * 60; }
        return { dir, stops, arr, dep, cumAt, T: arr[arr.length - 1], starts };
      });
    });

    return { stations, lines, byId: Object.fromEntries(lines.map(l => [l.id, l])) };
  }

  function periodOf(st) {
    const h = (st / 3600) % 24;
    if (h >= 7 && h < 9.75) return 'pk';
    if (h >= 17 && h < 20) return 'pk';
    if (h >= 22.5 || h < 6) return 'ni';
    return 'dy';
  }
  function headwayAt(L, st) {
    const p = periodOf(st);
    return p === 'pk' ? L.freq[0] : p === 'dy' ? L.freq[1] : L.freq[2];
  }
  const PERIOD_LABEL = { pk: 'Rush hour', dy: 'Daytime', ni: 'Night / early' };

  function lowerBound(arr, x) {
    let lo = 0, hi = arr.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m] < x) lo = m + 1; else hi = m; }
    return lo;
  }

  // State of one trip at service time st, or null
  function tripState(L, tpl, start, st) {
    const local = st - start;
    if (local < 0 || local > tpl.T) return null;
    const { arr, dep, cumAt } = tpl;
    let k = lowerBound(arr, local + 1e-6) - 1; // last stop with arr<=local
    if (k < 0) k = 0;
    if (local <= dep[k] || k === arr.length - 1) {
      return { k, dwell: true, d: cumAt[k], f: 0, next: Math.min(k + 1, arr.length - 1), prev: k };
    }
    const f = (local - dep[k]) / (arr[k + 1] - dep[k]);
    const e = f * f * (3 - 2 * f);
    return { k, dwell: false, d: cumAt[k] + (cumAt[k + 1] - cumAt[k]) * e, f, next: k + 1, prev: k };
  }

  function activeTrips(L, st, out) {
    if (L.real) {
      const R = L.real, s0 = lowerBound(R.starts, st - R.maxT - 1);
      for (let i = s0; i < R.trips.length && R.trips[i].start <= st; i++) {
        const tr = R.trips[i], ts = tripState(L, tr.tpl, tr.start, st);
        if (ts) { ts.line = L; ts.dir = tr.tpl.dir; ts.start = tr.start; ts.tpl = tr.tpl; ts.key = L.id + 'r' + i; out.push(ts); }
      }
      return out;
    }
    for (let dir = 0; dir < 2; dir++) {
      const tpl = L.tpl[dir];
      const s0 = lowerBound(tpl.starts, st - tpl.T - 1);
      for (let i = s0; i < tpl.starts.length && tpl.starts[i] <= st; i++) {
        const ts = tripState(L, tpl, tpl.starts[i], st);
        if (ts) { ts.line = L; ts.dir = dir; ts.start = tpl.starts[i]; ts.tpl = tpl; ts.key = L.id + dir + '@' + tpl.starts[i]; out.push(ts); }
      }
    }
    return out;
  }

  // Install explicit (real) trips: data = {lines:{ID:{weekday:[{d,t0,v,a,p}],holiday:[...]}}}
  function setRealTrips(net, data, dayType) {
    let n = 0;
    net.lines.forEach(L => {
      const arr = data && data.lines && data.lines[L.id] && data.lines[L.id][dayType];
      if (!arr || !arr.length) { L.real = null; return; }
      const trips = arr.map(t => {
        const cumAt = t.v.map(vi => L.cum[vi]);
        return { start: t.t0, tpl: { dir: t.d, stops: t.v, arr: t.a, dep: t.p, cumAt, T: t.a[t.a.length - 1] } };
      }).sort((x, y) => x.start - y.start);
      L.real = { trips, starts: trips.map(t => t.start), maxT: Math.max.apply(null, trips.map(t => t.tpl.T)) };
      n += trips.length;
    });
    return n;
  }

  function destName(L, dir, stations, lang, tplIn) {
    if (L.loop) return L.dirNames[dir];
    const tpl = tplIn || L.tpl[dir];
    const s = stations[L.ids[tpl.stops[tpl.stops.length - 1] % L.n]];
    return lang === 'ja' ? s.ja : s.en;
  }

  // First and last departure of the day at a station, per line and direction (from the simulated or real trips in use)
  function serviceSpan(net, stationId) {
    const S = net.stations[stationId], rows = [];
    S.lines.forEach(({ line: L, idx, skipped }) => {
      if (skipped) return;
      const per = {};   // dir -> {first,last,destId}
      const note = (tp, start, k) => {
        if (!L.loop && k === tp.stops.length - 1) return;   // terminus: nothing departs
        const t = start + tp.dep[k], r = per[tp.dir] || (per[tp.dir] = { first: 1e12, last: -1e12, destId: L.ids[tp.stops[tp.stops.length - 1] % L.n] });
        if (t < r.first) r.first = t; if (t > r.last) r.last = t;
      };
      const stopIdx = tp => { for (let j = 0; j < tp.stops.length; j++) if (tp.stops[j] % L.n === idx) return j; return -1; };
      if (L.real) { L.real.trips.forEach(tr => { const k = stopIdx(tr.tpl); if (k >= 0) note(tr.tpl, tr.start, k); }); }
      else for (let dir = 0; dir < 2; dir++) {
        const tpl = L.tpl[dir], k = stopIdx(tpl);
        if (k < 0 || !tpl.starts.length) continue;
        note(tpl, tpl.starts[0], k); note(tpl, tpl.starts[tpl.starts.length - 1], k);
      }
      Object.keys(per).forEach(d => rows.push({ line: L, dir: +d, first: per[d].first, last: per[d].last, destId: per[d].destId }));
    });
    return rows;
  }

  // Upcoming departures for a station
  function board(net, stationId, st, perDir) {
    const S = net.stations[stationId], res = [], per = perDir || 3;
    S.lines.forEach(({ line: L, idx, skipped }) => {
      if (skipped) return;
      if (L.real) {
        const R = L.real, groups = {};
        const s0 = lowerBound(R.starts, st - R.maxT - 1);
        for (let i = s0; i < R.trips.length && R.trips[i].start < st + 4 * 3600; i++) {
          const tr = R.trips[i], tp = tr.tpl;
          let k = -1;
          for (let j = 0; j < tp.stops.length; j++) if (tp.stops[j] % L.n === idx) { k = j; break; }
          if (k < 0 || (!L.loop && k === tp.stops.length - 1)) continue;
          const t = tr.start + tp.dep[k];
          if (t < st - 5) continue;
          const dest = tp.stops[tp.stops.length - 1] % L.n, key = tp.dir + '|' + dest;
          const g = groups[key] || (groups[key] = { line: L, dir: tp.dir, times: [], destId: L.ids[dest], tpl: tp });
          if (g.times.length < per) g.times.push(t);
        }
        Object.keys(groups).forEach(k => res.push(groups[k]));
        return;
      }
      for (let dir = 0; dir < 2; dir++) {
        const tpl = L.tpl[dir];
        let k = -1;
        tpl.stops.forEach((vi, i) => { if (k < 0 && vi % L.n === idx) k = i; });
        if (k < 0) continue;
        if (!L.loop && k === tpl.stops.length - 1) continue; // terminus: no departures
        const off = tpl.dep[k];
        const i0 = lowerBound(tpl.starts, st - off - 5);
        const times = [];
        for (let i = i0; i < tpl.starts.length && times.length < per; i++) times.push(tpl.starts[i] + off);
        res.push({ line: L, dir, times, tpl, destId: L.ids[tpl.stops[tpl.stops.length - 1] % L.n] });
      }
    });
    return res.sort((a, b) => (a.times[0] ?? 1e9) - (b.times[0] ?? 1e9));
  }

  g.TRS = { build, setRealTrips, proj, unproj, tripState, activeTrips, board, serviceSpan, headwayAt, periodOf, PERIOD_LABEL, destName, lowerBound, SERVICE_START, SERVICE_END, LAT0, LON0 };
})(typeof window !== 'undefined' ? window : globalThis);
