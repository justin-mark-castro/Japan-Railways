#!/usr/bin/env python3
"""Snap every line's station-to-station edges onto real track geometry (MLIT N02 sections) and write
js/regions/auto/<owner>-shape.js files:  SHAPE = { "<idLo>|<idHi>|<g>": "<encoded polyline of interior points>" }
(g = j JR/Shinkansen, p private/subway/cable, t tram, m monorail/AGT).  Edges with no plausible route stay straight.

  node tools/import/dump-all.mjs > /tmp/all.json
  python3 tools/import/build-shapes.py --mlit /tmp/ext/mlit-json --all /tmp/all.json
Source of geometry: 国土数値情報 鉄道データ N02 (MLIT) via antfu/mlit-json — see README for terms.
"""
import argparse, json, math, os, collections, sys
import numpy as np
from scipy.sparse import csr_matrix
from scipy.sparse.csgraph import dijkstra
from scipy.spatial import cKDTree

ap = argparse.ArgumentParser()
ap.add_argument('--mlit', required=True); ap.add_argument('--all', required=True)
ap.add_argument('--out', default=os.path.join(os.path.dirname(__file__), '..', '..', 'js', 'regions', 'auto'))
ap.add_argument('--tol', type=float, default=5.0, help='simplification tolerance in metres')
args = ap.parse_args()

KX, KY = 111320 * math.cos(math.radians(36)), 110574.0
def xy(lon, lat): return (np.asarray(lon) * KX, np.asarray(lat) * KY)

# ------------------------------------------------------------ graph from sections
secs = json.load(open(os.path.join(args.mlit, 'data', 'sections.json')))
ops = {};
def opid(o): return ops.setdefault(o, len(ops) + 1)
coords, sec_of = [], []
for si, s in enumerate(secs):
    c = s['coordinates']
    if len(c) < 2: continue
    coords.append(np.asarray(c, dtype=np.float64)); sec_of.append(np.full(len(c), si))
allc = np.concatenate(coords); allsec = np.concatenate(sec_of)
q = np.round(allc * 1e5).astype(np.int64)
keys = q[:, 0] * 10_000_000 + q[:, 1]
uniq, first_idx, inv = np.unique(keys, return_index=True, return_inverse=True)
node_lon = allc[first_idx, 0]; node_lat = allc[first_idx, 1]
N = len(uniq); print('nodes', N, file=sys.stderr)
nx_, ny_ = xy(node_lon, node_lat)
# consecutive-point edges within each section
off = 0; U = []; V = []; SEC = []
for c, so in zip(coords, sec_of):
    n = len(c); ids = inv[off:off + n]; off += n
    U.append(ids[:-1]); V.append(ids[1:]); SEC.append(so[:-1])
U = np.concatenate(U); V = np.concatenate(V); SEC = np.concatenate(SEC)
# N02 sections rarely meet exactly (end points often land mid-way along another section): link every section end point to the nearest
# vertex of a *different* section of the same railway type within BRIDGE m
BRIDGE = 25.0
off = 0; en_list = []; es_list = []
for c, so in zip(coords, sec_of):
    n = len(c); ids = inv[off:off + n]; off += n
    en_list += [ids[0], ids[-1]]; es_list += [so[0], so[-1]]
en_arr = np.array(en_list); es_arr = np.array(es_list)
allsec_type = np.array([s['type'] * 2 + ('新幹線' in s['line']) for s in secs])   # railway type + shinkansen flag
# vertex -> (node, section type): use all raw vertices so a node shared by several types is considered per type
pt_node = inv; pt_type = allsec_type[allsec]
tree_all = cKDTree(np.c_[allc[:, 0] * KX, allc[:, 1] * KY])
ex, ey = nx_[en_arr], ny_[en_arr]
cand = tree_all.query_ball_point(np.c_[ex, ey], BRIDGE)
bu, bv, bs = [], [], []
for k, neigh in enumerate(cand):
    e = en_arr[k]; t = allsec_type[es_arr[k]]; sk = es_arr[k]
    best = None; bd = 1e9
    for j in neigh:
        if allsec[j] == sk or pt_type[j] != t or pt_node[j] == e: continue
        d = math.hypot(allc[j, 0] * KX - ex[k], allc[j, 1] * KY - ey[k])
        if d < bd: bd = d; best = pt_node[j]
    if best is not None: bu.append(e); bv.append(best); bs.append(sk)
print('bridges', len(bu), file=sys.stderr)
U = np.concatenate([U, np.array(bu, dtype=U.dtype)]); V = np.concatenate([V, np.array(bv, dtype=V.dtype)]); SEC = np.concatenate([SEC, np.array(bs, dtype=SEC.dtype)])
keep = U != V; U, V, SEC = U[keep], V[keep], SEC[keep]
W = np.hypot(nx_[U] - nx_[V], ny_[U] - ny_[V])
sec_type = np.array([s['type'] for s in secs]); sec_op = np.array([opid(s['operator']) for s in secs])
sec_shin = np.array(['新幹線' in s['line'] for s in secs])
# group -> (railway types, shinkansen filter: True / False / None=any)
GROUPS = {'j': ({11}, False), 'k': ({11}, True), 'J': ({11}, None), 'p': ({12, 13, 17}, None), 't': ({21}, None), 'm': ({14, 15, 16, 22, 23, 24, 25}, None)}
GROUP_OF_LINE = {'jr': 'j', 'shin': 'k', 'tram': 't', 'mono': 'm'}   # everything else -> 'p'
FALLBACK = {'j': ['j', 'J', 'p'], 'k': ['k', 'J'], 'p': ['p', 't', 'm', 'J'], 't': ['t', 'p', 'm'], 'm': ['m', 't', 'p']}
TYPE_NOTE = collections.Counter(sec_type.tolist()); print('section types', dict(TYPE_NOTE), file=sys.stderr)

def build_group(spec):
    types, shin = spec
    m = np.isin(sec_type[SEC], list(types))
    if shin is not None: m &= (sec_shin[SEC] == shin)
    u, v, w, o = U[m], V[m], W[m], sec_op[SEC[m]]
    # undirected: both directions; dedupe (u,v) keeping the shortest
    uu = np.concatenate([u, v]); vv = np.concatenate([v, u]); ww = np.concatenate([w, w]); oo = np.concatenate([o, o])
    order = np.lexsort((ww, vv, uu)); uu, vv, ww, oo = uu[order], vv[order], ww[order], oo[order]
    first = np.ones(len(uu), bool); first[1:] = (uu[1:] != uu[:-1]) | (vv[1:] != vv[:-1])
    uu, vv, ww, oo = uu[first], vv[first], ww[first], oo[first]
    G = csr_matrix((ww, (uu, vv)), shape=(N, N)); O = csr_matrix((oo.astype(np.float64), (uu, vv)), shape=(N, N))
    G.sort_indices(); O.sort_indices()
    assert np.array_equal(G.indices, O.indices)
    nodes = np.unique(np.concatenate([uu, vv]))
    tree = cKDTree(np.c_[nx_[nodes], ny_[nodes]])
    return dict(G=G, O=O, nodes=nodes, tree=tree)
GR = {g: build_group(t) for g, t in GROUPS.items()}
print('graphs built', {g: len(v['nodes']) for g, v in GR.items()}, file=sys.stderr)

# ------------------------------------------------------------ helpers
def rdp(P, tol):
    n = len(P)
    if n < 3: return list(range(n))
    keep = np.zeros(n, bool); keep[0] = keep[-1] = True
    stack = [(0, n - 1)]
    while stack:
        a, b = stack.pop()
        if b <= a + 1: continue
        A, B = P[a], P[b]; d = B - A; L = math.hypot(*d)
        seg = P[a + 1:b]
        dist = np.hypot(*(seg - A).T) if L < 1e-9 else np.abs(d[0] * (seg[:, 1] - A[1]) - d[1] * (seg[:, 0] - A[0])) / L
        k = int(np.argmax(dist))
        if dist[k] > tol:
            keep[a + 1 + k] = True; stack.append((a, a + 1 + k)); stack.append((a + 1 + k, b))
    return np.nonzero(keep)[0].tolist()
def enc_num(v):
    v = ~(v << 1) if v < 0 else v << 1; s = ''
    while v >= 0x20: s += chr((0x20 | (v & 0x1f)) + 63); v >>= 5
    return s + chr(v + 63)
def encode(latlon):
    out = ''; pl = po = 0
    for la, lo in latlon:
        a, b = int(round(la * 1e5)), int(round(lo * 1e5)); out += enc_num(a - pl) + enc_num(b - po); pl, po = a, b
    return out

# ------------------------------------------------------------ route every edge
data = json.load(open(args.all)); st = data['stations']
MAXD = {'k': 4000.0}   # hand-typed Shinkansen station coordinates can be a few km off; other lines must already be within 450 m
K = 6
def snap(g, lat, lon):
    """up to K nearest track nodes of this group: [(node, distance_m), ...] (nearest first, within MAXD)"""
    x, y = xy(lon, lat); d, i = GR[g]['tree'].query([x, y], k=K, distance_upper_bound=MAXD.get(g, 450.0))
    return [(int(GR[g]['nodes'][j]), float(dd)) for dd, j in zip(np.atleast_1d(d), np.atleast_1d(i)) if np.isfinite(dd)]

FAILS = []
snapped = {}   # station id -> [lat, lon] (Shinkansen-only stations moved onto the track)
shin_only = collections.defaultdict(lambda: True)
for L in data['lines']:
    for i in L['ids']:
        if L['type'] != 'shin': shin_only[i] = False
shapes = collections.defaultdict(dict)   # owner -> key -> encoded
stat = collections.Counter(); cache = {}
for L in data['lines']:
    g = GROUP_OF_LINE.get(L['type'], 'p'); ids = L['ids'] + ([L['ids'][0]] if L.get('loop') else [])
    my_op = ops.get(L['op'], -1)
    weights = {}
    for a, b in zip(ids[:-1], ids[1:]):
        lo, hi = (a, b) if a < b else (b, a); key = '%s|%s|%s' % (lo, hi, g)
        if key in shapes[L['owner']]: continue
        if key in cache:
            if cache[key]: shapes[L['owner']][key] = cache[key]
            continue
        (la, oa), (lb, ob) = st[lo], st[hi]
        straight = math.hypot((la - lb) * KY, (oa - ob) * KX)
        if straight < 180: cache[key] = None; stat['short'] += 1; continue
        res = None
        for gg in FALLBACK[g]:
            ca = snap(gg, la, oa); cb = snap(gg, lb, ob)
            if not ca or not cb: continue
            grp = GR[gg]
            if gg not in weights:
                f = np.where(grp['O'].data == my_op, 1.0, 2.5) if my_op > 0 else np.ones_like(grp['G'].data)
                Gm = grp['G'].copy(); Gm.data = grp['G'].data * f; weights[gg] = Gm
            limit = (1.5 * straight + 500) * 2.5
            dist, pred = dijkstra(weights[gg], directed=True, indices=[n for n, _ in ca], limit=limit, return_predecessors=True)
            best = None
            for ia, (na, da) in enumerate(ca):
                for nb, db in cb:
                    if na == nb: continue
                    c = da + dist[ia][nb] + db
                    if np.isfinite(dist[ia][nb]) and (best is None or c < best[0]): best = (c, ia, na, nb, da, db)
            if best is None: continue
            _, ia, na, nb, da, db = best
            path = [nb]
            while path[-1] != na: path.append(int(pred[ia][path[-1]]))
            path.reverse(); path = np.array(path)
            P = np.c_[nx_[path], ny_[path]]
            plen = float(np.hypot(*np.diff(P, axis=0).T).sum())
            if plen > 1.45 * straight + 200: continue
            res = (path, gg, da, db); break
        if res is None:
            cache[key] = None; stat['fail_' + g] += 1; FAILS.append((L['id'], L['type'], a, b, round(straight), 0, 0)); continue
        path = res[0]; P = np.c_[nx_[path], ny_[path]]
        if res[1] == 'k':
            for sid_, nd, dd in ((lo, path[0], res[2]), (hi, path[-1], res[3])):
                if dd > 150 and shin_only[sid_] and sid_ not in snapped: snapped[sid_] = [round(float(node_lat[nd]), 5), round(float(node_lon[nd]), 5)]
        idx = rdp(P, args.tol)
        inner = [(float(node_lat[path[i]]), float(node_lon[path[i]])) for i in idx]
        enc = encode(inner); cache[key] = enc; shapes[L['owner']][key] = enc
        stat['ok_' + g + ('' if res[1] == g else '_fallback')] += 1
    sys.stderr.write('.' if L['id'].startswith('x') else '#')
print('\n', dict(stat), file=sys.stderr)

if os.environ.get('SHAPE_FAILS'): json.dump(FAILS, open(os.environ['SHAPE_FAILS'], 'w'))
# direction: encoded points run from lo -> hi station id (the path was computed lo -> hi)
HDR = """/* Auto-generated by tools/import/build-shapes.py — DO NOT EDIT BY HAND.
 * Track geometry: 国土数値情報 鉄道データ N02 (MLIT) via antfu/mlit-json, simplified. Keys are "idLo|idHi|group";
 * values are Google-encoded polylines of the points between the two stations (lo -> hi). */
(function (g) {
  'use strict';
"""
for f in os.listdir(args.out):
    if f.endswith('-shape.js'): os.remove(os.path.join(args.out, f))
owner_of_station = {}
for L in data['lines']:
    for i in L['ids']: owner_of_station.setdefault(i, L['owner'])
snapped_by_owner = collections.defaultdict(dict)
for sid_, ll in snapped.items(): snapped_by_owner[owner_of_station[sid_]][sid_] = ll
print('shinkansen stations moved onto track:', len(snapped), file=sys.stderr)
tot = 0
for owner, sh in shapes.items():
    if not sh: continue
    js = HDR + "  g.TRS_REGIONS_DATA = g.TRS_REGIONS_DATA || {};\n  g.TRS_REGIONS_DATA['%s-shape'] = { SHAPE: %s, SNAP: %s };\n})(typeof window !== 'undefined' ? window : globalThis);\n" % (
        owner, json.dumps(sh, separators=(',', ':')), json.dumps(snapped_by_owner.get(owner, {}), separators=(',', ':')))
    open(os.path.join(args.out, owner + '-shape.js'), 'w').write(js); tot += len(js)
    print('%-9s edges=%5d  %5d KB' % (owner, len(sh), len(js) // 1024))
print('total %d KB' % (tot // 1024))
