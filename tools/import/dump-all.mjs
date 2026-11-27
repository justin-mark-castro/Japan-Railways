#!/usr/bin/env node
/* Dump every station + line currently shipped (hand-authored + auto, with coordinate fixes applied) for build-shapes.py.
 *   node tools/import/dump-all.mjs > /tmp/all.json
 * `owner` = the region file key the line lives in (its track shapes are written to js/regions/auto/<owner>-shape.js). */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ctx = { console }; ctx.window = ctx; ctx.globalThis = ctx; vm.createContext(ctx);
const run = f => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
['js/data.js', 'js/data-extra.js', 'js/data-fixes.js', 'js/regions/fixes.js'].forEach(run);
const sets = [{ owner: 'kanto', d: ctx.TRS_DATA }];
const reg = fs.readdirSync(path.join(root, 'js/regions')).filter(f => f.endsWith('.js'));
reg.forEach(f => { run('js/regions/' + f); });
fs.readdirSync(path.join(root, 'js/regions/auto')).filter(f => f.endsWith('.js') && !f.endsWith('-shape.js')).forEach(f => run('js/regions/auto/' + f));
const ownerOf = k => k === 'shinkansen' ? 'trunk' : k;
for (const [k, d] of Object.entries(ctx.TRS_REGIONS_DATA)) if (!k.endsWith('-shape')) sets.push({ owner: ownerOf(k.replace(/-auto$/, '')), d });
const fix = ctx.TRS_GEO_FIX || {};
const stations = {}, lines = [], seen = new Set();
for (const { owner, d } of sets) {
  for (const r of d.STATION_SRC.trim().split('\n')) {
    if (!r.trim()) continue;
    const [id, , , lat, lon] = r.split('|');
    if (!stations[id]) stations[id] = fix[id] ? [fix[id][0], fix[id][1]] : [+lat, +lon];
  }
  for (const l of d.LINE_SRC) {
    if (seen.has(l.id)) continue; seen.add(l.id);
    lines.push({ id: l.id, type: l.type, op: l.op || '', loop: !!l.loop, owner, ids: l.st.trim().split(/\s+/).map(t => t.split(':')[0]) });
  }
}
process.stdout.write(JSON.stringify({ stations, lines }));
