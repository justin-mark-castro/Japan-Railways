#!/usr/bin/env node
/* Convert raw ODPT dumps (tools/odpt/raw) into the site's data files:
 *   data/timetable.json  real per-train stop times
 *   data/geometry.json   real station coordinates (ids that exist on the site)
 *   data/manifest.json   flags that make the site load the files above
 *
 *   node tools/odpt/convert.mjs [--raw DIR] [--out DIR]
 *
 * Station matching: ODPT station title (en) -> site station id by normalised English name,
 * with optional overrides in tools/odpt/station-overrides.json  { "odpt.Station:...": "siteId" }.
 * Requires the site's data files (they are plain JS, loaded here in a sandboxed vm).
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const rawDir = path.resolve(arg('--raw', path.join(here, 'raw')));
const outDir = path.resolve(arg('--out', path.join(root, 'data')));

export function loadSiteData() {
  const ctx = { window: {}, console };
  ctx.globalThis = ctx; ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of ['data.js', 'data-extra.js']) vm.runInContext(fs.readFileSync(path.join(root, 'js', f), 'utf8'), ctx, { filename: f });
  return ctx.TRS_DATA;
}

const norm = s => String(s || '').toLowerCase().replace(/ station$/, '').replace(/[^a-z0-9]/g, '');
const tsec = (hhmm, prev) => {           // "HH:MM" -> service seconds (day runs to ~28:30)
  const [h, m] = hhmm.split(':').map(Number);
  let t = h * 3600 + m * 60;
  if (h < 4) t += 86400;
  if (prev != null && t < prev) t += 86400;
  return t;
};
const calKind = c => {
  const s = String(c || '');
  if (/Weekday/i.test(s)) return 'weekday';
  if (/Holiday|Saturday|Sunday/i.test(s)) return 'holiday';
  return null;
};

/** Convert the objects of ONE railway into trips for a site line. Pure; exported for tests. */
export function convertLine(lineDef, trains, odptStationToSite) {
  const ids = lineDef.st.trim().split(/\s+/).map(t => t.split(':')[0]);
  const n = ids.length, loop = !!lineDef.loop;
  const idx = new Map(ids.map((id, i) => [id, i]));
  const out = { weekday: [], holiday: [] }, warn = { noCal: 0, short: 0, broken: 0 };

  for (const tr of trains) {
    const kind = calKind(tr['odpt:calendar']);
    if (!kind) { warn.noCal++; continue; }
    // collect (siteStation, arr, dep) in order
    const pts = []; let prev = null;
    for (const o of tr['odpt:trainTimetableObject'] || []) {
      const sid = odptStationToSite(o['odpt:departureStation'] || o['odpt:arrivalStation']);
      const dep = o['odpt:departureTime'], arr = o['odpt:arrivalTime'];
      if (!sid || !idx.has(sid) || !(dep || arr)) continue;
      const a = tsec(arr || dep, prev); prev = a;
      const d = tsec(dep || arr, prev); prev = d;
      pts.push({ i: idx.get(sid), a, d });
    }
    if (pts.length < 2) { warn.short++; continue; }

    // direction from the first move; non-loop lines must stay monotone
    let dir = pts[1].i > pts[0].i ? 0 : 1;
    if (loop) { const fwd = (pts[1].i - pts[0].i + n) % n; dir = fwd <= n / 2 ? 0 : 1; }
    const chain = [pts[0]];
    for (let k = 1; k < pts.length; k++) {
      const p = pts[k], q = chain[chain.length - 1];
      if (loop) { if (p.i !== q.i) chain.push(p); }
      else if ((dir === 0 && p.i > q.i) || (dir === 1 && p.i < q.i)) chain.push(p);
    }
    if (chain.length < 2) { warn.broken++; continue; }

    // vertices: loops are unwrapped, then cut at the closing vertex so indices stay within 0..n
    let segs = [];
    if (!loop) segs = [chain.map(p => ({ v: p.i, a: p.a, d: p.d }))];
    else {
      let cur = [], vAbs = chain[0].i, last = chain[0].i;
      cur.push({ v: vAbs, a: chain[0].a, d: chain[0].d });
      for (let k = 1; k < chain.length; k++) {
        const step = dir === 0 ? (chain[k].i - last + n) % n : -((last - chain[k].i + n) % n);
        let nv = vAbs + step;
        if (dir === 0 && nv > n) {                    // crossed the seam: close this part at vertex n, restart at 0
          const f = (n - vAbs) / (nv - vAbs), tm = Math.round(chain[k - 1].d + f * (chain[k].a - chain[k - 1].d));
          cur.push({ v: n, a: tm, d: tm }); segs.push(cur);
          nv -= n; cur = [{ v: 0, a: tm, d: tm }];
        } else if (dir === 1 && nv < 0) {
          const f = vAbs / (vAbs - nv), tm = Math.round(chain[k - 1].d + f * (chain[k].a - chain[k - 1].d));
          cur.push({ v: 0, a: tm, d: tm }); segs.push(cur);
          nv += n; cur = [{ v: n, a: tm, d: tm }];
        }
        cur.push({ v: nv, a: chain[k].a, d: chain[k].d });
        vAbs = nv; last = chain[k].i;
      }
      segs.push(cur);
    }
    for (const seg of segs) {
      if (seg.length < 2) continue;
      const t0 = seg[0].d;
      out[kind].push({
        d: dir, t0,
        v: seg.map(s => s.v),
        a: seg.map((s, j) => j === 0 ? 0 : s.a - t0),
        p: seg.map((s, j) => j === 0 ? 0 : (j === seg.length - 1 ? s.a - t0 : s.d - t0))
      });
    }
  }
  for (const k of ['weekday', 'holiday']) out[k].sort((x, y) => x.t0 - y.t0);
  return { trips: out, warn };
}

function main() {
  const site = loadSiteData();
  const map = JSON.parse(fs.readFileSync(path.join(here, 'line-map.json'), 'utf8')); delete map._note;
  const ovrFile = path.join(here, 'station-overrides.json');
  const overrides = fs.existsSync(ovrFile) ? JSON.parse(fs.readFileSync(ovrFile, 'utf8')) : {};

  const byNorm = {};
  site.STATION_SRC.trim().split('\n').forEach(r => { const [id, en] = r.split('|'); if (id) (byNorm[norm(en)] = byNorm[norm(en)] || []).push(id); });
  const lineById = Object.fromEntries(site.LINE_SRC.map(l => [l.id, l]));

  const timetable = { meta: { generated: new Date().toISOString(), source: 'ODPT (Open Data Challenge for Public Transportation in Tokyo)' }, lines: {} };
  const geometry = { stations: {} };
  const unmatched = {};
  let total = 0;

  for (const [rw, lid] of Object.entries(map)) {
    const slug = rw.replace(/[^A-Za-z0-9.-]/g, '_');
    const sf = path.join(rawDir, slug + '.stations.json'), tf = path.join(rawDir, slug + '.trains.json');
    if (!fs.existsSync(tf)) continue;
    const def = lineById[lid];
    const lineIds = new Set(def.st.trim().split(/\s+/).map(t => t.split(':')[0]));
    const stations = fs.existsSync(sf) ? JSON.parse(fs.readFileSync(sf, 'utf8')) : [];
    const lookup = {};
    for (const s of stations) {
      const oid = s['owl:sameAs'];
      let sid = overrides[oid];
      if (!sid) {
        const cands = (byNorm[norm((s['odpt:stationTitle'] || {}).en)] || []);
        sid = cands.find(c => lineIds.has(c)) || (cands.length === 1 ? cands[0] : null);
      }
      if (sid) {
        lookup[oid] = sid;
        if (typeof s['geo:lat'] === 'number' && typeof s['geo:long'] === 'number' && lineIds.has(sid)) geometry.stations[sid] = [s['geo:lat'], s['geo:long']];
      } else (unmatched[lid] = unmatched[lid] || new Set()).add((s['odpt:stationTitle'] || {}).en || oid);
    }
    const trains = JSON.parse(fs.readFileSync(tf, 'utf8'));
    const { trips, warn } = convertLine(def, trains, oid => lookup[oid]);
    const cnt = trips.weekday.length + trips.holiday.length;
    total += cnt;
    if (cnt) timetable.lines[lid] = trips;
    console.log(`${lid.padEnd(4)} ${trips.weekday.length} weekday / ${trips.holiday.length} holiday trips` +
      (warn.noCal + warn.short + warn.broken ? `  (skipped: ${warn.noCal} calendar, ${warn.short} <2 known stops, ${warn.broken} non-monotone)` : ''));
  }
  for (const [lid, set] of Object.entries(unmatched)) console.log(`  unmatched on ${lid}: ${[...set].join(', ')}  -> add to station-overrides.json`);

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'timetable.json'), JSON.stringify(timetable));
  fs.writeFileSync(path.join(outDir, 'geometry.json'), JSON.stringify(geometry));
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify({ timetable: total > 0, geometry: Object.keys(geometry.stations).length > 0 }, null, 2) + '\n');
  console.log(`Wrote ${total} trips, ${Object.keys(geometry.stations).length} station coordinates to ${outDir}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
