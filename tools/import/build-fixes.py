#!/usr/bin/env python3
"""Generate js/data-fixes.js: completes hand-authored lines that were shorter than the real line, from the same open station
database the importer uses.  Run BEFORE build-auto.py (which then treats the extended lines as curated and drops its own duplicates).

  python3 tools/import/build-fixes.py --sdb /tmp/ext/station_database

Three kinds of edit (see EXTEND / NEW_LINES below):
  full  - replace the line's station list by the database's list for the same line (fixes missing stations and station numbers)
  tail  - append the database's stations after the line's last station, up to `until`
  new   - add a branch as its own line (Marunouchi Honancho branch, Chiyoda Kita-Ayase branch, Oedo Hikarigaoka stem)
"""
import argparse, json, math, os, re, sys, collections
sys.path.insert(0, os.path.dirname(__file__))

ap = argparse.ArgumentParser()
ap.add_argument('--sdb', required=True)
ap.add_argument('--out', default=os.path.join(os.path.dirname(__file__), '..', '..', 'js', 'data-fixes.js'))
args = ap.parse_args()
ROOT = os.path.join(os.path.dirname(__file__), '..', '..')

# --- reuse the importer's romaniser (everything between the romanisation header and the classification header)
src = open(os.path.join(os.path.dirname(__file__), 'build-auto.py'), encoding='utf-8').read()
a = src.index('# ---------------------------------------------------------------- romanisation')
b = src.index('# ---------------------------------------------------------------- classification')
ns = {'re': re, 'collections': collections, 'math': math, 'os': os, 'sys': sys}
exec('from names_en import OP_EN, PREFIXES, PAREN_WORDS\n' + src[a:b] + '', ns)
def norm(n): return re.sub(r'[駅\s・･（）()]', '', re.sub(r'[(（〈][^)）〉]*[)）〉]', '', n or '').replace('ケ', 'ヶ').replace('ヵ', 'ヶ'))
en_station = ns['en_station']

# --- curated data (stations + lines as shipped, before this fix layer)
import subprocess
cur = json.loads(subprocess.check_output(['node', os.path.join(ROOT, 'tools', 'import', 'dump-curated.mjs'), '--no-fixes'], cwd=ROOT))
cur_st, cur_ln = cur['stations'], cur['lines']

def km(la1, lo1, la2, lo2): return math.hypot((la1 - la2) * 111, (lo1 - lo2) * 91)
G = 0.02
grid = collections.defaultdict(list)
for cid, c in cur_st.items(): grid[(int(c['lat'] / G), int(c['lon'] / G))].append((cid, c))
def merge_target(s):
    best = None
    a, b = int(s['lat'] / G), int(s['lng'] / G)
    for da in range(-2, 3):
        for db in range(-2, 3):
            for cid, c in grid.get((a + da, b + db), []):
                d = km(s['lat'], s['lng'], c['lat'], c['lon'])
                same = norm(c['ja']) == norm(s['name']) and d < 3.0
                if same or d < 0.06:
                    key = (0 if same else 1, d)   # a same-name station always beats a merely nearby one
                    if best is None or key < best[0]: best = (key, cid)
    return best[1] if best else None

def load_line(code):
    d = json.load(open(os.path.join(args.sdb, 'out', 'main', 'line', '%d.json' % code), encoding='utf-8'))
    return d, [s for s in d['station_list'] if not s['closed']]

NUM_RE = re.compile(r'^([A-Za-z]{1,4})[\s\-]?(\d{1,3})$')
new_stations = collections.OrderedDict()
def station_id(s):
    cid = merge_target(s)
    if cid: return cid
    i = 'f%d' % s['code']
    new_stations[i] = (i, en_station(s['name'], s.get('name_kana')), s['name'], s['lat'], s['lng'])
    return i
def number_of(s, sym):
    for n in (s.get('numbering') or []):
        m = NUM_RE.match(n)
        if m and (not sym or m.group(1).upper() == sym.upper()): return int(m.group(2))
    return None

def tokens(sl, sym, keep=None):
    """station tokens 'id:num' using the database's official numbering; `keep` maps id -> original suffix (e.g. '-' for pass-through)"""
    out, last = [], None
    for s in sl:
        i = station_id(s)
        if i == last: continue
        last = i
        if keep and keep.get(i) == '-': out.append(i + ':-'); continue
        n = number_of(s, sym)
        out.append('%s:%s' % (i, n) if n is not None else i)   # unnumbered in the database: keep counting from the previous number
    if out and ':' not in out[0]: out[0] += ':1'
    return out

def parse_tokens(st):
    r = []
    for t in st.split():
        i, _, n = t.partition(':')
        r.append((i, n))
    return r

def idx_of(sl, ja):
    for k, s in enumerate(sl):
        if norm(s['name']) == norm(ja) or s['name'].split('(')[0].split('〈')[0] == ja: return k
    raise SystemExit('station not found in database line: ' + ja)

# ---------------------------------------------------------------------------- edits
# (curated line id, database line code, mode, until station (ja) or None)
EXTEND = [
    ('KO', 24001, 'full', None, None),        # Keio Line: adds Hatsudai/Hatagaya, runs on to Keio-Hachioji, correct KO numbers
    ('OH', 25001, 'full', None, None),        # Odakyu Odawara Line: Shinjuku - Odawara
    ('TJ', 21001, 'full', None, None),        # Tobu Tojo Line: Ikebukuro - Yorii
    ('SI', 22001, 'full', None, None),        # Seibu Ikebukuro Line: Ikebukuro - Agano
    ('SS', 22007, 'full', None, None),        # Seibu Shinjuku Line: Seibu-Shinjuku - Hon-Kawagoe
    ('TX', 99309, 'full', None, None),        # Tsukuba Express: Akihabara - Tsukuba
    ('TS', 21002, 'full', None, None),        # Tobu Skytree/Isesaki Line: Asakusa - Isesaki
    ('I', 99303, 'full', None, None),         # Toei Mita Line: Meguro - Nishi-Takashimadaira
    ('S', 99304, 'full', None, None),         # Toei Shinjuku Line: Shinjuku - Motoyawata
    ('Y', 28006, 'full', None, None),         # Tokyo Metro Yurakucho Line: Wakoshi - Shin-Kiba
    ('F', 28010, 'full', None, None),         # Tokyo Metro Fukutoshin Line: Wakoshi - Shibuya
    ('JC', 11312, 'full', None, None),        # Chuo Line Rapid: Tokyo - Takao
    ('JB', 11313, 'full', None, None),        # Chuo-Sobu Local: Mitaka - Chiba
    ('JOS', 11314, 'tail', '千葉', 'JO'),      # Sobu Line Rapid: on to Chiba (rapid stops carry JO numbers)
    ('JJ', 11320, 'tail', '取手', 'JJ'),       # Joban Line Rapid: on to Toride (rapid stops carry JJ numbers)
]
# new branch lines: (id, name, ja, base line id to copy style from, database line, stations ja list, symbol, junction (curated id or None))
NEW_LINES = [
    dict(id='Mb', base='M', en='Marunouchi Line (Honancho Branch)', ja='丸ノ内線(方南町支線)', db=28002, code='m', names=['中野坂上', '中野新橋', '中野富士見町', '方南町'], sym=None, junction='nakanosakaue', junction_num=6,
         numbers={'中野新橋': 5, '中野富士見町': 4, '方南町': 3}),
    dict(id='JL', base='JJ', en='Joban Line (Local)', ja='常磐線(各駅停車)', db=11320, code='JL', first='綾瀬', last='取手', sym='JL', junction='ayase', junction_num=19),
    dict(id='Cb', base='C', en='Chiyoda Line (Kita-Ayase Branch)', ja='千代田線(北綾瀬支線)', db=28005, code='C', first='綾瀬', last='北綾瀬', sym='C', junction='ayase', junction_num=19),
    dict(id='Es', base='E', en='Oedo Line (Hikarigaoka Branch)', ja='大江戸線(光が丘方面)', db=99301, code='E', first='都庁前', last='光が丘', sym='E', junction='tochomae', junction_num=28),
]

RENAME = {'TS': {'en': 'Tobu Skytree Line / Isesaki Line', 'ja': '東武スカイツリーライン・伊勢崎線'}}
lines_out = []   # line-id -> new st
replaced = {}
for lid, code, mode, until, symo in EXTEND:
    d, sl = load_line(code)
    sym = symo or d.get('symbol') or ''
    old = parse_tokens(cur_ln[lid]['st'])
    keep = {i: n for i, n in old if n == '-'}
    old_ids = [i for i, _ in old]
    if mode == 'full':
        # the database list must contain every station the curated line has, in the same direction
        ids = []
        for s in sl:
            i = station_id(s)
            if not ids or ids[-1] != i: ids.append(i)
        missing = [i for i in old_ids if i not in ids]
        if missing: print('  note: %s keeps stations not in database line %d: %s' % (lid, code, missing), file=sys.stderr)
        pos = [ids.index(i) for i in old_ids if i in ids]
        if pos != sorted(pos):
            sl = list(reversed(sl)); ids = list(reversed(ids))
        toks = tokens(sl, sym, keep)
    else:
        sl_ids = []
        for s in sl:
            i = station_id(s)
            if not sl_ids or sl_ids[-1] != i: sl_ids.append(i)
        last = old_ids[-1]
        if last not in sl_ids: raise SystemExit('%s: last station %s not on database line %d' % (lid, last, code))
        k0 = sl_ids.index(last)
        k1 = idx_of(sl, until)
        # re-derive from the station objects, de-duplicated the same way
        flat, lastid = [], None
        for s in sl:
            i = station_id(s)
            if i == lastid: continue
            lastid = i; flat.append((i, s))
        seg = [(i, s) for i, s in flat[k0 + 1:k1 + 1]]
        add = []
        for i, s in seg:
            n = number_of(s, sym)
            if symo and n is None: continue          # not a stop of this service (no number with its symbol)
            add.append('%s:%s' % (i, n) if n is not None else i)
        toks = ['%s:%s' % (i, n) if n else i for i, n in old] + add
    replaced[lid] = ' '.join(toks)
    print('%-4s %-26s %2d -> %2d stations' % (lid, cur_ln[lid]['en'], len(old), len(toks)), file=sys.stderr)

new_defs = []
for nl in NEW_LINES:
    d, sl = load_line(nl['db'])
    sym = nl['sym']
    if nl.get('names'):
        seg = [sl[idx_of(sl, n)] for n in nl['names']]
    else:
        k0 = idx_of(sl, nl['first']); k1 = idx_of(sl, nl['last'])
        seg = sl[min(k0, k1):max(k0, k1) + 1]
        if k0 > k1: seg = list(reversed(seg))
        if sym == 'JL': seg = [x for x in seg if number_of(x, 'JL') is not None]
    toks = []
    for s in seg:
        i = station_id(s)
        if s is seg[0]: toks.append('%s:%d' % (nl['junction'], nl['junction_num'])); continue
        n = (nl.get('numbers') or {}).get(s['name'].split('(')[0]) or number_of(s, sym)
        toks.append('%s:%s' % (i, n if n is not None else '!'))
    new_defs.append(dict(id=nl['id'], base=nl['base'], en=nl['en'], ja=nl['ja'], code=nl['code'], st=' '.join(toks)))
    print('new  %-4s %-40s %d stations' % (nl['id'], nl['en'], len(toks)), file=sys.stderr)

# Oedo: the Hikarigaoka stem starts at Tochomae, goes through the stations after Shinjuku (E29..E38)
d, sl = load_line(99301)
stem = [s for s in sl if (number_of(s, 'E') or 0) >= 28]
stem.sort(key=lambda s: number_of(s, 'E'))
for nd in new_defs:
    if nd['id'] == 'Es':
        nd['st'] = ' '.join('%s:%s' % (station_id(s), number_of(s, 'E')) for s in stem)
        print('     Oedo stem: ' + ', '.join(s['name'] for s in stem), file=sys.stderr)

rows = '\n'.join('|'.join([i, en.replace('|', ' '), ja.replace('|', ' '), '%.5f' % la, '%.5f' % lo]) for i, en, ja, la, lo in new_stations.values())
js = """/* Generated by tools/import/build-fixes.py — DO NOT EDIT BY HAND.
 * Completes hand-authored lines that stopped short of the real line (and corrects their station numbers) from the open station
 * database (駅データ.jp via Seo-4d696b75/station_database, CC BY 4.0), and adds three branches as lines of their own.
 * Loaded after data-extra.js; applied to TRS_DATA in place. */
(function (g) {
  'use strict';
  const D = g.TRS_DATA;
  D.STATION_SRC += `
%s
`;
  const ST = %s;
  const NAMES = %s;
  D.LINE_SRC.forEach(l => { if (ST[l.id]) l.st = ST[l.id]; if (NAMES[l.id]) Object.assign(l, NAMES[l.id]); });
  const NEW = %s;
  NEW.forEach(n => {
    const b = D.LINE_SRC.find(l => l.id === n.base);
    const l = Object.assign({}, b, { id: n.id, en: n.en, ja: n.ja, code: n.code, st: n.st });
    delete l.loop; delete l.skip; delete l.ccw0; delete l.pill; l.dirs = null;
    D.LINE_SRC.push(l);
  });
})(typeof window !== 'undefined' ? window : globalThis);
""" % (rows, json.dumps(replaced, ensure_ascii=False, indent=2), json.dumps(RENAME, ensure_ascii=False), json.dumps(new_defs, ensure_ascii=False, indent=2))
open(args.out, 'w', encoding='utf-8').write(js)
print('wrote %s: %d new stations, %d lines extended, %d branch lines' % (os.path.relpath(args.out, ROOT), len(new_stations), len(replaced), len(new_defs)), file=sys.stderr)
