#!/usr/bin/env node
/* Dump the hand-authored (curated) stations and lines to JSON so build-auto.py can merge against them.
 *   node tools/import/dump-curated.mjs > /tmp/curated.json */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ctx = { console }; ctx.window = ctx; ctx.globalThis = ctx; vm.createContext(ctx);
const withFixes = !process.argv.includes('--no-fixes');   // build-fixes.py needs the lines as they are BEFORE js/data-fixes.js
const files = ['js/data.js', 'js/data-extra.js', ...(withFixes ? ['js/data-fixes.js'] : []), ...fs.readdirSync(path.join(root, 'js/regions')).filter(f => f.endsWith('.js')).map(f => 'js/regions/' + f)];
files.forEach(f => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f }));
const srcs = [ctx.TRS_DATA, ...Object.values(ctx.TRS_REGIONS_DATA)];
const stations = {}, lines = {};
for (const s of srcs) {
  for (const r of s.STATION_SRC.trim().split('\n')) { if (!r.trim()) continue; const [id, en, ja, lat, lon] = r.split('|'); if (!stations[id]) stations[id] = { en, ja, lat: +lat, lon: +lon }; }
  for (const l of s.LINE_SRC) if (!lines[l.id]) lines[l.id] = { ids: l.st.trim().split(/\s+/).map(t => t.split(':')[0]), en: l.en, st: l.st };
}
process.stdout.write(JSON.stringify({ stations, lines }));
