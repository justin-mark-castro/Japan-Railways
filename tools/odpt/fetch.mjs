#!/usr/bin/env node
/* Download raw ODPT data for every railway listed in line-map.json.
 *
 *   ODPT_KEY=xxxxxxxx node tools/odpt/fetch.mjs            # all lines
 *   ODPT_KEY=xxxxxxxx node tools/odpt/fetch.mjs JY G M     # only these site line ids
 *
 * The key is read ONLY from the environment (or a git-ignored .env.local file)
 * and is never written to disk output. Raw dumps go to tools/odpt/raw/ (git-ignored).
 *
 *   ODPT_BASE            default https://api.odpt.org/api/v4
 *   ODPT_BASE_CHALLENGE  default https://api-challenge.odpt.org/api/v4  (used for JR East ids)
 * Check ODPT's developer site for the current endpoint of each operator.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const rawDir = path.join(here, 'raw');

function loadEnvFile() {
  const f = path.join(here, '..', '..', '.env.local');
  if (!fs.existsSync(f)) return;
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
loadEnvFile();

const KEY = process.env.ODPT_KEY;
if (!KEY) { console.error('Set ODPT_KEY in your environment (never commit it).'); process.exit(1); }
const BASE = process.env.ODPT_BASE || 'https://api.odpt.org/api/v4';
const BASE_CH = process.env.ODPT_BASE_CHALLENGE || 'https://api-challenge.odpt.org/api/v4';

const map = JSON.parse(fs.readFileSync(path.join(here, 'line-map.json'), 'utf8'));
delete map._note;
const want = new Set(process.argv.slice(2));
const railways = Object.entries(map).filter(([, id]) => !want.size || want.has(id)).map(([r]) => r);

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function get(base, type, params) {
  const q = new URLSearchParams({ ...params, 'acl:consumerKey': KEY });
  const url = `${base}/${type}?${q}`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 429 || res.status >= 500) throw new Error('HTTP ' + res.status);
      if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + type + ' ' + (params['odpt:railway'] || ''));
      return await res.json();
    } catch (e) {
      if (attempt === 4) throw e;
      await sleep(800 * attempt);
    }
  }
}

fs.mkdirSync(rawDir, { recursive: true });
let failed = 0;
for (const rw of railways) {
  const base = /JR-East/.test(rw) ? BASE_CH : BASE;
  const slug = rw.replace(/[^A-Za-z0-9.-]/g, '_');
  try {
    const stations = await get(base, 'odpt:Station', { 'odpt:railway': rw });
    const trains = await get(base, 'odpt:TrainTimetable', { 'odpt:railway': rw });
    fs.writeFileSync(path.join(rawDir, slug + '.stations.json'), JSON.stringify(stations));
    fs.writeFileSync(path.join(rawDir, slug + '.trains.json'), JSON.stringify(trains));
    console.log(`ok   ${rw}: ${stations.length} stations, ${trains.length} trains`);
  } catch (e) {
    failed++; console.error(`FAIL ${rw}: ${e.message}`);
  }
  await sleep(300);
}
console.log(failed ? `${failed} railway(s) failed — re-run for those ids.` : 'Done. Next: node tools/odpt/convert.mjs');
