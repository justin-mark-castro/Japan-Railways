#!/usr/bin/env node
/* Offline test: build ODPT-shaped sample files, run convert.mjs on them, then load the
 * result into the real schedule engine (js/sim.js) and check trains appear where expected.
 *   node tools/odpt/test.mjs
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..');
const raw = path.join(here, 'fixtures', 'raw');
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'odpt-out-'));
fs.mkdirSync(raw, { recursive: true });

const st = (rw, slug, en, lat, lon) => ({ 'owl:sameAs': `odpt.Station:${rw}.${slug}`, 'odpt:stationTitle': { en, ja: en }, 'geo:lat': lat, 'geo:long': lon });
const tt = (rw, id, cal, stops) => ({
  'owl:sameAs': `odpt.TrainTimetable:${rw}.${id}`, 'odpt:railway': `odpt.Railway:${rw}`, 'odpt:calendar': cal,
  'odpt:trainTimetableObject': stops.map(([s, arr, dep]) => ({ 'odpt:departureStation': `odpt.Station:${rw}.${s}`, ...(dep ? { 'odpt:departureTime': dep } : {}), ...(arr ? { 'odpt:arrivalTime': arr } : {}) }))
});

// Ginza line (sample): Shibuya -> Asakusa, and a return trip
const G = 'TokyoMetro.Ginza';
fs.writeFileSync(path.join(raw, 'odpt.Railway_TokyoMetro.Ginza.stations.json'), JSON.stringify([
  st(G, 'Shibuya', 'Shibuya', 35.6591, 139.7014), st(G, 'Omotesando', 'Omotesando', 35.6654, 139.7121),
  st(G, 'Ginza', 'Ginza', 35.6717, 139.7649), st(G, 'Ueno', 'Ueno', 35.7117, 139.7770), st(G, 'Asakusa', 'Asakusa', 35.7106, 139.7978)
]));
fs.writeFileSync(path.join(raw, 'odpt.Railway_TokyoMetro.Ginza.trains.json'), JSON.stringify([
  tt(G, 'A1', 'odpt.Calendar:Weekday', [['Shibuya', null, '08:00'], ['Omotesando', '08:03', '08:04'], ['Ginza', '08:13', '08:14'], ['Ueno', '08:22', '08:23'], ['Asakusa', '08:27', null]]),
  tt(G, 'A2', 'odpt.Calendar:SaturdayHoliday', [['Asakusa', null, '10:00'], ['Ginza', '10:14', '10:15'], ['Shibuya', '10:30', null]]),
  tt(G, 'A3', 'odpt.Calendar:Weekday', [['Shibuya', null, '00:20'], ['Ginza', '00:34', '00:35'], ['Asakusa', '00:48', null]])  // past midnight
]));

// Yamanote (sample): a trip that crosses the Tokyo seam (Yurakucho -> Tokyo -> Kanda)
const Y = 'JR-East.Yamanote';
fs.writeFileSync(path.join(raw, 'odpt.Railway_JR-East.Yamanote.stations.json'), JSON.stringify([
  st(Y, 'Yurakucho', 'Yurakucho', 35.6750, 139.7628), st(Y, 'Tokyo', 'Tokyo', 35.6812, 139.7671), st(Y, 'Kanda', 'Kanda', 35.6918, 139.7709), st(Y, 'Akihabara', 'Akihabara', 35.6984, 139.7731)
]));
fs.writeFileSync(path.join(raw, 'odpt.Railway_JR-East.Yamanote.trains.json'), JSON.stringify([
  tt(Y, 'L1', 'odpt.Calendar:Weekday', [['Yurakucho', null, '12:00'], ['Tokyo', '12:02', '12:03'], ['Kanda', '12:05', '12:06'], ['Akihabara', '12:08', null]])
]));

execFileSync('node', [path.join(here, 'convert.mjs'), '--raw', raw, '--out', out], { stdio: 'inherit' });

const tt_ = JSON.parse(fs.readFileSync(path.join(out, 'timetable.json'), 'utf8'));
const geo = JSON.parse(fs.readFileSync(path.join(out, 'geometry.json'), 'utf8'));
const man = JSON.parse(fs.readFileSync(path.join(out, 'manifest.json'), 'utf8'));
assert.deepEqual(man, { timetable: true, geometry: true });
assert.equal(tt_.lines.G.weekday.length, 2);
assert.equal(tt_.lines.G.holiday.length, 1);
assert.equal(tt_.lines.G.weekday[1].t0, 24 * 3600 + 20 * 60, 'after-midnight trip becomes 24:20');
assert.deepEqual(tt_.lines.G.weekday[0].a.slice(0, 2), [0, 180]);
assert.deepEqual(tt_.lines.G.holiday[0].d, 1, 'Asakusa->Shibuya runs in direction 1');
assert.ok(geo.stations.shibuya && Math.abs(geo.stations.shibuya[0] - 35.6591) < 1e-9);
// loop seam: trip split in two parts, both inside 0..n
const jy = tt_.lines.JY.weekday;
assert.equal(jy.length, 2, 'seam-crossing loop trip is split in two');
assert.equal(jy[0].v.at(-1), 30); assert.equal(jy[1].v[0], 0);

// Feed into the real engine
const ctx = { console }; ctx.window = ctx; ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of ['data.js', 'data-extra.js', 'sim.js']) vm.runInContext(fs.readFileSync(path.join(root, 'js', f), 'utf8'), ctx);
const net = ctx.TRS.build(ctx.TRS_DATA, { geometry: geo.stations });
const n = ctx.TRS.setRealTrips(net, tt_, 'weekday');
assert.equal(n, 4, "2 Ginza + 2 Yamanote weekday trips");
const at = t => { const o = []; ctx.TRS.activeTrips(net.byId.G, t, o); return o; };
assert.equal(at(8 * 3600 + 10 * 60).length, 1, 'one Ginza train on the road at 08:10');
assert.equal(at(8 * 3600 + 40 * 60).length, 0, 'none at 08:40');
const jyAt = []; ctx.TRS.activeTrips(net.byId.JY, 12 * 3600 + 4 * 60, jyAt);
assert.equal(jyAt.length, 1, 'Yamanote seam trip is active across the seam');
const board = ctx.TRS.board(net, 'ginza', 8 * 3600 + 5 * 60, 3);
assert.ok(board.some(b => b.line.id === 'G' && b.times[0] === 8 * 3600 + 14 * 60), 'departure board shows 08:14 from Ginza');
console.log('\nAll ODPT converter tests passed.');
