/* Land / coast / prefecture-border layer under the lines.
 * Data: js/geo/land*.js (built by tools/import/build-land.py from 地球地図日本, 国土地理院). Three levels of detail; the finer ones
 * are fetched only when the zoom needs them, and the coarser one keeps drawing until they arrive. */
(function (g) {
  'use strict';
  const FILES = ['js/geo/land.js', 'js/geo/land-mid.js', 'js/geo/land-hi.js'];
  const levels = [null, null, null], loading = {};
  let version = 0;

  function decode(str) {
    const out = []; let i = 0, lat = 0, lon = 0;
    while (i < str.length) {
      for (let k = 0; k < 2; k++) {
        let r = 0, sh = 0, b;
        do { b = str.charCodeAt(i++) - 63; r |= (b & 0x1f) << sh; sh += 5; } while (b >= 0x20);
        const d = (r & 1) ? ~(r >> 1) : (r >> 1);
        if (k === 0) lat += d; else lon += d;
      }
      out.push(lat / 1e5, lon / 1e5);
    }
    return out;
  }
  function prepare(lv) {
    const conv = strs => strs.map(s => {
      const ll = decode(s), n = ll.length / 2, a = new Float64Array(n * 2);
      let x0 = 1e18, x1 = -1e18, y0 = 1e18, y1 = -1e18;
      for (let i = 0; i < n; i++) {
        const p = g.TRS.proj(ll[2 * i], ll[2 * i + 1]);
        a[2 * i] = p.x; a[2 * i + 1] = p.y;
        if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x; if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y;
      }
      return { a, n, x0, x1, y0, y1 };
    });
    return { rings: conv(lv.rings), borders: conv(lv.borders) };
  }
  function adopt(i) { if (!levels[i] && g.TRS_LAND && g.TRS_LAND[i]) { levels[i] = prepare(g.TRS_LAND[i]); version++; } }
  function ensure(i) {
    adopt(i);
    if (levels[i] || loading[i]) return;
    loading[i] = true;
    const sc = document.createElement('script');
    sc.src = FILES[i] + '?v=' + (g.TRS_VERSION || '0');
    sc.onload = () => { adopt(i); };
    sc.onerror = () => { /* keep drawing the coarser level */ };
    document.head.appendChild(sc);
  }
  const levelFor = s => (s < 0.002 ? 0 : s < 0.008 ? 1 : 2);

  // path through the polylines that touch the screen, skipping points that would land on the same pixel
  function trace(ctx, list, v, close) {
    for (const r of list) {
      if (r.x1 < v.x0 || r.x0 > v.x1 || r.y1 < v.y0 || r.y0 > v.y1) continue;
      let px = 0, py = 0;
      for (let i = 0; i < r.n; i++) {
        const x = (r.a[2 * i] - v.cx) * v.s + v.W / 2, y = (r.a[2 * i + 1] - v.cy) * v.s + v.H / 2;
        if (i === 0) { ctx.moveTo(x, y); px = x; py = y; continue; }
        if (Math.abs(x - px) < 1.2 && Math.abs(y - py) < 1.2 && i < r.n - 1) continue;
        ctx.lineTo(x, y); px = x; py = y;
      }
      if (close) ctx.closePath();
    }
  }

  /* v: { cx, cy, s, W, H } camera (world units, px per unit); c: colours. Returns false when nothing is loaded yet. */
  function draw(ctx, v, c) {
    const want = levelFor(v.s);
    ensure(want);
    let have = want; while (have >= 0 && !levels[have]) have--;
    if (have < 0) return false;
    const L = levels[have], hw = v.W / 2 / v.s, hh = v.H / 2 / v.s;
    const vv = { cx: v.cx, cy: v.cy, s: v.s, W: v.W, H: v.H, x0: v.cx - hw - 50, x1: v.cx + hw + 50, y0: v.cy - hh - 50, y1: v.cy + hh + 50 };
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // trace once, paint several times
    const path = new Path2D(); trace(path, L.rings, vv, true);
    ctx.fillStyle = c.land; ctx.fill(path);
    // a hairline of the land colour hides the seams between neighbouring prefectures at coarse levels
    if (have < 2) { ctx.strokeStyle = c.land; ctx.lineWidth = 1.2; ctx.stroke(path); }
    // coast: soft halo, then a crisp line; both fade out when zoomed far in, where this outline is coarser than the tracks
    const fade = Math.max(0, Math.min(1, 1 - (v.s - 0.02) / 0.05));
    if (fade > 0) {
      ctx.globalAlpha = fade;
      ctx.strokeStyle = c.coast; ctx.lineWidth = 1.3; ctx.stroke(path);
      ctx.globalAlpha = 1;
    }
    if (L.borders.length && v.s < 0.02) {
      ctx.strokeStyle = c.border; ctx.lineWidth = 1;
      const bp = new Path2D(); trace(bp, L.borders, vv, false); ctx.stroke(bp);
    }
    return true;
  }
  g.TRS_LANDVIEW = { draw, version: () => version };
})(typeof window !== 'undefined' ? window : globalThis);
