/* Japan land mass + prefecture borders.
 * Fetched at runtime from the open dataofjapan/land GeoJSON (no data is bundled), projected with the same
 * projection as the rail network so the coast lines up with the tracks, and pre-decimated into several levels
 * of detail so drawing the whole country stays cheap at any zoom. */
(function (g) {
  'use strict';
  const URL = 'https://raw.githubusercontent.com/dataofjapan/land/master/japan.geojson';
  const TOLS = [0, 120, 700, 3500, 14000];   // decimation tolerance in metres per level of detail
  const T = g.TRS_TERRAIN = { ready: false, failed: false, ver: 0, rings: [], tols: TOLS, onload: null };

  function decimate(a, tol) {
    if (!tol) return a;
    const n = a.length / 2, out = [a[0], a[1]]; let lx = a[0], ly = a[1];
    const t2 = tol * tol;
    for (let i = 1; i < n - 1; i++) {
      const x = a[2 * i], y = a[2 * i + 1], dx = x - lx, dy = y - ly;
      if (dx * dx + dy * dy >= t2) { out.push(x, y); lx = x; ly = y; }
    }
    out.push(a[2 * n - 2], a[2 * n - 1]);
    return Float32Array.from(out);
  }
  function addRing(coords) {
    if (!coords || coords.length < 4) return;
    const a = new Float32Array(coords.length * 2);
    let x0 = 1e12, y0 = 1e12, x1 = -1e12, y1 = -1e12;
    for (let i = 0; i < coords.length; i++) {
      const p = g.TRS.proj(coords[i][1], coords[i][0]);   // GeoJSON is [lon, lat]
      a[2 * i] = p.x; a[2 * i + 1] = p.y;
      if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x; if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y;
    }
    T.rings.push({ x0, y0, x1, y1, lods: TOLS.map(t => decimate(a, t)) });
  }
  function ingest(gj) {
    (gj.features || []).forEach(f => {
      const geo = f.geometry; if (!geo) return;
      const polys = geo.type === 'Polygon' ? [geo.coordinates] : geo.type === 'MultiPolygon' ? geo.coordinates : [];
      polys.forEach(poly => poly.forEach(addRing));
    });
  }
  fetch(URL).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(gj => { ingest(gj); T.ready = T.rings.length > 0; T.ver++; if (T.onload) T.onload(); })
    .catch(() => { T.failed = true; });

  // level of detail for a zoom (px per metre): the coarsest level whose tolerance is still about a pixel
  T.lodFor = s => { const want = 1.1 / s; let k = 0; for (let i = 0; i < TOLS.length; i++) if (TOLS[i] <= want) k = i; return k; };
})(typeof window !== 'undefined' ? window : globalThis);
