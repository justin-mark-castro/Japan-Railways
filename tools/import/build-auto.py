#!/usr/bin/env python3
"""Build the nationwide 'auto' region files from open data.

Inputs (clone them anywhere, pass the folders in):
  --sdb   Seo-4d696b75/station_database  (ordered stations per line, kana, line colours; from 駅データ.jp, CC BY 4.0)
  --mlit  antfu/mlit-json                (MLIT 国土数値情報 N02 stations: operator + railway type per station)
  --curated  JSON from `node tools/import/dump-curated.mjs`  (hand-authored data to merge with / avoid duplicating)
Outputs:
  js/regions/auto/<region>.js   one file per region (single-region lines)
  js/regions/auto/trunk.js      lines that cross region borders (loaded at start-up)
  js/regions/fixes.js           accurate coordinates for hand-authored stations

Everything produced here is SIMULATION INPUT: timetables are not part of the source data, so speeds and
headways are generated from line type, station spacing and distance to the nearest big city.
"""
import argparse, collections, csv, json, math, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from names_en import OP_EN, PREFIXES, PAREN_WORDS

ap = argparse.ArgumentParser()
ap.add_argument('--sdb', required=True); ap.add_argument('--mlit', required=True); ap.add_argument('--curated', required=True)
ap.add_argument('--out', default=os.path.join(os.path.dirname(__file__), '..', '..', 'js', 'regions'))
args = ap.parse_args()

# ---------------------------------------------------------------- regions (JIS prefecture code -> region)
REGION_OF = {}
for rid, codes in {'hokkaido': [1], 'tohoku': range(2, 8), 'kanto': range(8, 15), 'chubu': range(15, 24), 'kansai': range(24, 31),
                   'chugoku': range(31, 36), 'shikoku': range(36, 40), 'kyushu': range(40, 48)}.items():
    for c in codes: REGION_OF[c] = rid

# ---------------------------------------------------------------- romanisation (kana -> Hepburn, macrons dropped)
HIRA = 'ぁあぃいぅうぇえぉおかがきぎくぐけげこごさざしじすずせぜそぞただちぢっつづてでとどなにぬねのはばぱひびぴふぶぷへべぺほぼぽまみむめもゃやゅゆょよらりるれろゎわゐゑをんゔ'
def kata2hira(s): return ''.join(chr(ord(c) - 0x60) if 'ァ' <= c <= 'ヶ' else c for c in s)
BASE = {'あ':'a','い':'i','う':'u','え':'e','お':'o','か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko','さ':'sa','し':'shi','す':'su','せ':'se','そ':'so',
 'た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to','な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no','は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho',
 'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo','や':'ya','ゆ':'yu','よ':'yo','ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro','わ':'wa','ゐ':'i','ゑ':'e','を':'o',
 'が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go','ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo','だ':'da','ぢ':'ji','づ':'zu','で':'de','ど':'do',
 'ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo','ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po','ゔ':'vu','ぁ':'a','ぃ':'i','ぅ':'u','ぇ':'e','ぉ':'o','ゎ':'wa'}
COMBO = {'ゃ':'a','ゅ':'u','ょ':'o'}
def romaji(kana):
    s = kata2hira(kana or ''); out = []; i = 0; geminate = False
    while i < len(s):
        c = s[i]
        if c == 'っ': geminate = True; i += 1; continue
        if c == 'ー': out.append(out[-1][-1] if out else ''); i += 1; continue
        if c in '・･': out.append('-'); i += 1; continue
        if c == 'ん':
            nxt = s[i + 1] if i + 1 < len(s) else ''
            out.append("n'" if nxt and nxt in 'あいうえおやゆよ' else 'n'); i += 1; continue
        syl = BASE.get(c)
        if syl is None: out.append(c); i += 1; continue
        if i + 1 < len(s) and s[i + 1] in COMBO and c in 'きしちぢにひみりぎじびぴゔ':
            v = COMBO[s[i + 1]]; stem = syl[:-1] if syl.endswith('i') else syl
            if syl in ('shi', 'chi', 'ji'): stem = syl[:-1]; syl = stem + ('' if v == 'i' else v)
            else: syl = stem + 'y' + v
            i += 1
        if geminate and syl[0] not in 'aiueo':
            syl = ('t' if syl.startswith('ch') else syl[0]) + syl
        geminate = False
        out.append(syl); i += 1
    r = ''.join(out)
    r = re.sub(r'oo|ou', 'o', r); r = re.sub(r'uu', 'u', r)
    return r.replace("n'", "n'")
def cap(s): return re.sub(r"(^|[- ])([a-z])", lambda m: m.group(1) + m.group(2).upper(), s)
DIR_PREFIX = {'東': 'ひがし', '西': 'にし', '南': 'みなみ', '北': 'きた', '新': 'しん'}
STATION_EN_OVERRIDE = {'第一イン新湊 クロスベイ前': 'Daiichi Inn Shinminato Cross Bay-mae', '宮島ボートレース場': 'Miyajima Boat Race Course', 'トヨタモビリティ富山 Gスクエア五福前（五福末広町）': 'Toyota Mobility Toyama G Square Gofuku-mae (Gofuku-Suehirocho)', 'オークスカナルパークホテル富山前': 'Oakes Canal Park Hotel Toyama-mae',
                       '鹿島サッカースタジアム（臨）': 'Kashima Soccer Stadium', 'Jヴィレッジ': 'J-Village', 'ガーラ湯沢': 'GALA Yuzawa', '東山・おかでんミュージアム駅': 'Okaden Museum', '計算科学センター（神戸どうぶつ王国・「富岳」前）': 'Computational Science Center (Kobe Animal Kingdom)',
                       '成田空港（成田第１ターミナル）': 'Narita Airport Terminal 1', '空港第２ビル（成田第２・第３ターミナル）': 'Narita Airport Terminals 2・3'.replace('・', '·'),
                       '成田空港': 'Narita Airport', '羽田空港': 'Haneda Airport'}
# katakana loanwords are translated rather than romanised (センター -> Center, not "Sentaa"); longest first
LOAN = [('ボートレース', 'Boat Race'), ('アート', 'Art'), ('セントラル', 'Central'), ('スタジアムシティ', 'Stadium City'), ('ビジネスパーク', 'Business Park'), ('ニュータウン', 'New Town'), ('ポートタウン', 'Port Town'), ('ウッディタウン', 'Woody Town'),
        ('ターミナルビル', 'Terminal Building'), ('ユニバーサルシティ', 'Universal City'), ('ディズニーランド', 'Disneyland'), ('ディズニーシー', 'DisneySea'),
        ('ステーション', 'Station'), ('ターミナル', 'Terminal'), ('センター', 'Center'), ('ケーブル', 'Cable'), ('タウン', 'Town'), ('パーク', 'Park'), ('スタジアム', 'Stadium'),
        ('キャンパス', 'Campus'), ('ホテル', 'Hotel'), ('ガーデン', 'Garden'), ('ビーチ', 'Beach'), ('スキー', 'Ski'), ('サーキット', 'Circuit'), ('プール', 'Pool'), ('サンドーム', 'Sun Dome'),
        ('ドーム', 'Dome'), ('トロッコ', 'Torokko'), ('ミュージアム', 'Museum'), ('フラワー', 'Flower'), ('ワールド', 'World'), ('スクウェア', 'Square'), ('フォーゲル', 'Vogel'),
        ('イングリッシュ', 'English'), ('ハートピア', 'Heartopia'), ('ホール', 'Hall'), ('フルーツ', 'Fruit'), ('ポート', 'Port'), ('ロープウェイ', 'Ropeway'), ('アリーナ', 'Arena'),
        ('ビール', 'Beer'), ('ラベンダー', 'Lavender'), ('アーケード', 'Arcade'), ('モール', 'Mall'), ('プラーザ', 'Plaza'), ('スポーツ', 'Sports'), ('サッカー', 'Soccer'),
        ('リハビリ', 'Rehabilitation'), ('フェリー', 'Ferry'), ('テレポート', 'Teleport'), ('テレコム', 'Telecom'), ('スカイツリー', 'Skytree'), ('ベイサイド', 'Bayside'),
        ('シーサイド', 'Seaside'), ('ゲートウェイ', 'Gateway'), ('リゾート', 'Resort'), ('グリーン', 'Green'), ('ノース', 'North'), ('サウス', 'South'), ('ヴィレッジ', 'Village'),
        ('ガーラ', 'GALA'), ('ノーフォーク', 'Norfolk'), ('ミュージアム', 'Museum'), ('バス', 'Bus'), ('スペース', 'Space'), ('グリーン', 'Green'), ('ブルー', 'Blue'), ('トレード', 'Trade'),
        ('ボート', 'Boat'), ('ガーデン', 'Garden'), ('ビル', 'Building'), ('ハーモニー', 'Harmony'), ('アイランド', 'Island'), ('マリン', 'Marine'), ('フジテック', 'Fujitec'),
        ('インテック', 'Intec'), ('ソシオ', 'Socio'), ('メディカル', 'Medical'), ('ファミリー', 'Family'), ('フェリー', 'Ferry'), ('スクリーン', 'Screen'), ('スクエア', 'Square')]
LOAN.sort(key=lambda x: -len(x[0]))
def loan_split(name, k):
    """split `name` (and its hiragana reading k) at the first katakana loanword and translate it; None if there is none"""
    for w, en in LOAN:
        kw = kata2hira(w)
        if name.count(w) == 1 and k.count(kw) == 1:
            A, B = name.split(w); ka, kb = k.split(kw)
            out = en_station(A, ka) + ' ' if A else ''
            out += en
            if B:
                if B.startswith('前') and kb.startswith('まえ'): out += '-mae' + (' ' + en_station(B[1:], kb[2:]) if len(B) > 1 else '')
                else: out += ' ' + en_station(B, kb)
            return out.strip()
    return None
LINE_EN_OVERRIDE = {31024: 'Kintetsu Nishi-Shigi Cable Line', 31026: 'Kintetsu Ikoma Cable Line', 32008: 'Nankai Koyasan Cable Line', 33005: 'Keihan Iwashimizu-Hachimangu Sando Cable Line',
                    99625: 'Osaka Metro Nanko Port Town Line', 99648: 'Kobe New Transit Port Island Line', 99316: 'Yokohama Subway Blue Line', 99343: 'Yokohama Subway Green Line',
                    99928: 'Heisei Chikuho Railway Mojiko Retro Line'}
DROP_LINES = re.compile(r'^(北近畿タンゴ鉄道|近鉄内部線|近鉄八王子線)')   # superseded operator names that the database still lists next to the current ones (Kyoto Tango Railway, Yokkaichi Asunarou)
def en_station(name, kana):
    if name in STATION_EN_OVERRIDE: return STATION_EN_OVERRIDE[name]
    m = re.match(r'^(.*?)\s*[(（〈](.*)[)）〉]\s*$', name)
    if m:   # "Base (alias)": romanise each part from its own reading when the data has one
        kb, kp = split_paren(kata2hira(kana or ''))
        base = en_station(m.group(1), kb or kata2hira(kana or ''))
        return base + (' (%s)' % en_station(m.group(2), kp) if kp else '')
    k = kata2hira(kana or ''); r = romaji(k)
    if not r: return name
    if re.search(r'[ァ-ヴ]', name):
        ls = loan_split(name, k)
        if ls: return ls
    n = name.replace('ケ', 'ヶ')
    # Higashi-/Nishi-/Minami-/Kita-/Shin- compounds (Higashi-Ikebukuro, Shin-Osaka) but not two-character names (Higashiyama, Shinjuku)
    if len(n) >= 3 and n[0] in DIR_PREFIX and k.startswith(DIR_PREFIX[n[0]]) and not n.startswith('新宿'):
        head = DIR_PREFIX[n[0]]; r = romaji(head) + '-' + romaji(k[len(head):])
    mc = re.search(r'(it?chome|nichome|sanchome|yonchome|gochome|rokuchome|nanachome|hatchome|kyuchome|jutchome)$', r)
    if mc and re.search(r'[一二三四五六七八九十]丁目$', n) and len(n) > 4:   # 西新宿五丁目 -> Nishi-Shinjuku-gochome
        return cap(r[:mc.start()].rstrip('-')) + '-' + mc.group(1)
    for suf_ja, suf_k in (('前', 'まえ'), ('公園', 'こうえん'), ('通', 'どおり'), ('通', 'とおり'), ('通', 'どうり'), ('丁目', 'ちょうめ'), ('中央', 'ちゅうおう')):
        if n.endswith(suf_ja) and k.endswith(suf_k) and len(n) > len(suf_ja) + 1:
            tail = romaji(suf_k)
            if r.endswith(tail):
                head = r[:-len(tail)].rstrip('-')
                r = head + '-' + tail
            break
    return cap(r)
def en_name_kana(kana): return cap(romaji(kana))

FW = str.maketrans('０１２３４５６７８９ＡＢＣＤＥＬ', '0123456789ABCDEL')
def split_paren(t):
    m = re.match(r'^(.*?)[(（〈](.*)[)）〉]\s*$', t or '')
    return (m.group(1), m.group(2)) if m else (t or '', '')
def sim(a, b): return sum(x == y for x, y in zip(a, b)) / max(len(a), len(b), 1)
def en_line(name, kana, st_lookup=None):
    """English line name: operator brand (names_en.py) + romanised remainder + suffix + optional (A-B) section."""
    base, par = split_paren(name); kbase, kpar = split_paren(kata2hira(kana or ''))
    brand, rest_j, rest_k = '', base, kbase
    for pj, pk, en in PREFIXES:
        if base.startswith(pj) and (kbase.startswith(pk) or (len(kbase) >= len(pk) and sim(kbase[:len(pk)], pk) >= 0.7)):
            brand, rest_j, rest_k = en, base[len(pj):], kbase[len(pk):]
            if rest_j == pj + '線' and rest_k.startswith(pk): rest_j, rest_k = '線', 'せん'   # 京王京王線 -> Keio Line
            break
    suffix = ''; body_k = rest_k; route = ''
    m = re.match(r'^([0-9０-９A-ZＡ-Ｚ]+)系統', rest_j)
    if m:
        route = 'Route ' + m.group(1).translate(FW); body_k = ''
        if kpar and par.endswith('線'):
            route += ' (' + en_name_kana(kpar[:-2] if kpar.endswith('せん') else kpar) + ' Line)'; par = ''
    elif rest_j.endswith('新幹線') and body_k.endswith('しんかんせん'): suffix, body_k = ' Shinkansen', body_k[:-6]
    elif rest_j.endswith('本線') and body_k.endswith('ほんせん'): suffix, body_k = ' Main Line', body_k[:-4]
    elif rest_j.endswith('線') and body_k.endswith('せん'): suffix, body_k = ' Line', body_k[:-2]
    elif rest_j.endswith('ライン') and body_k.endswith('らいん'): suffix, body_k = ' Line', body_k[:-3]
    body = en_name_kana(body_k) if body_k else ''
    tail = route or (body + suffix).strip()
    if not route and not body and brand.endswith(('Line', 'Express', 'Rail')): tail = ''
    out = ' '.join(x for x in (brand, tail) if x).strip() or name
    if par:
        ends = [x.strip() for x in re.split(r'[～~〜]', par)]
        if len(ends) >= 2 and st_lookup and norm(ends[0]) in st_lookup and norm(ends[1]) in st_lookup:
            out += ' (%s–%s)' % (st_lookup[norm(ends[0])], st_lookup[norm(ends[1])])
        elif par in PAREN_WORDS: out += ' (%s)' % PAREN_WORDS[par]
    return out

# ---------------------------------------------------------------- classification
JR_GROUP = {'北海道旅客鉄道': 'JR Hokkaido', '東日本旅客鉄道': 'JR East', '東海旅客鉄道': 'JR Central', '西日本旅客鉄道': 'JR West',
            '四国旅客鉄道': 'JR Shikoku', '九州旅客鉄道': 'JR Kyushu'}
SUBWAY_RE = re.compile(r'地下鉄|メトロ|都営|市営|高速鉄道|高速電気軌道|ブルーライン|グリーンライン|ニュートラム|大江戸線|みなとみらい|ポートライナー|横浜市|神戸市|京都市|仙台市|札幌市|名古屋市|福岡市|大阪市')
def classify(name, op, n02type):
    if n02type == 11: return 'jr', JR_GROUP.get(op, 'JR (other)')
    if n02type == 21 and ('OsakaMetro' in (name or '') or 'Osaka Metro' in (name or '') or '高速電気軌道' in (op or '')): return 'metro', 'Subways'  # legally 軌道 but a subway
    if n02type == 21 or (name and ('都電' in name or '路面' in name or '市電' in name)): return 'tram', 'Trams'
    if n02type == 13 or '鋼索' in (name or '') or 'ケーブル' in (name or ''): return 'pvt', 'Cable cars'
    if n02type in (14, 22, 23, 24, 25) or 'モノレール' in (name or ''): return 'mono', 'Monorails & AGT'
    if SUBWAY_RE.search(name or '') or SUBWAY_RE.search(op or '') and n02type in (12, 16): return 'metro', 'Subways'
    if n02type == 15 or n02type == 16: return 'mono', 'Monorails & AGT'
    return 'pvt', 'Private & Others'
CITIES = [(35.68, 139.77), (34.69, 135.50), (35.17, 136.88), (43.06, 141.35), (33.59, 130.42), (34.40, 132.46), (38.26, 140.88), (35.01, 135.76),
          (34.69, 135.19), (35.46, 139.62), (37.91, 139.06), (36.65, 138.19), (35.0, 138.38), (32.79, 130.74), (31.59, 130.55), (34.34, 134.05),
          (33.84, 132.77), (34.66, 133.92), (36.56, 136.65), (39.70, 141.14), (26.21, 127.68)]
def city_km(lat, lon): return min(math.hypot((lat - a) * 111, (lon - b) * 91) for a, b in CITIES)

# ---------------------------------------------------------------- load data
sdb_dir = os.path.join(args.sdb, 'out', 'main')
stations = {s['code']: s for s in json.load(open(os.path.join(sdb_dir, 'station.json')))}
line_meta = json.load(open(os.path.join(sdb_dir, 'line.json')))
symbols = {int(r['code']): r['symbol'] for r in csv.DictReader(open(os.path.join(sdb_dir, 'line.csv'), encoding='utf-8')) if r['symbol'] not in ('', 'NULL')}
n02 = json.load(open(os.path.join(args.mlit, 'data', 'stations.json')))
cur = json.load(open(args.curated))

def norm(n): return re.sub(r'[駅\s・･（）()]', '', re.sub(r'[(（〈][^)）〉]*[)）〉]', '', n or '').replace('ケ', 'ヶ').replace('ヵ', 'ヶ'))   # drops disambiguating parentheses: 三田(東京) = 三田
G = 0.02
def gkey(lat, lon): return (int(lat / G), int(lon / G))
n02_grid = collections.defaultdict(list)
for s in n02: n02_grid[gkey(s['lat'], s['lng'])].append(s)
def near_cells(lat, lon, grid):
    a, b = gkey(lat, lon)
    for da in (-1, 0, 1):
        for db in (-1, 0, 1): yield from grid.get((a + da, b + db), [])

cur_grid = collections.defaultdict(list)
for cid, c in cur['stations'].items(): cur_grid[gkey(c['lat'], c['lon'])].append((cid, c))
def km(lat1, lon1, lat2, lon2): return math.hypot((lat1 - lat2) * 111, (lon1 - lon2) * 91)

# merge: auto station -> curated station id (same normalised name within 3 km, or any station within 60 m)
fixes = {}
merged = {}
def merge_target(s):
    best = None
    a, b = gkey(s['lat'], s['lng'])
    for da in range(-2, 3):
        for db in range(-2, 3):
            for cid, c in cur_grid.get((a + da, b + db), []):
                d = km(s['lat'], s['lng'], c['lat'], c['lon'])
                same = norm(c['ja']) == norm(s['name']) and d < 3.0
                if same or d < 0.06:
                    key = (0 if same else 1, d)   # a same-name station always beats a merely nearby one (Toei Bakuro-Yokoyama sits ~50 m from JR Bakurocho)
                    if best is None or key < best[0]: best = (key, d, cid)
    return (best[1], best[2]) if best else None
for code, s in stations.items():
    t = merge_target(s)
    if t:
        merged[code] = t[1]
        d, cid = t
        if cid not in fixes or d < fixes[cid][2]: fixes[cid] = (round(s['lat'], 5), round(s['lng'], 5), d)

def sid(code): return merged.get(code) or 'a%d' % code

# ---------------------------------------------------------------- lines
out_lines = []; used_stations = {}
dropped = collections.Counter()
cur_sets = {lid: set(l['ids']) for lid, l in cur['lines'].items()}
# Y-shaped lines come as one station list; the part that is a spur is cut off into its own line so no phantom edge joins the spur's end to the other branch
SPURS = {'JR成田線': ('成田', ('空港第２ビル', '成田空港'), 'JR成田線(空港支線)')}   # line: (junction station, spur stations, spur line name)
def jobs():
    for lm in line_meta:
        if lm['closed']: continue
        if DROP_LINES.match(lm['name']): dropped['superseded operator name'] += 1; continue
        d = json.load(open(os.path.join(sdb_dir, 'line', '%d.json' % lm['code'])))
        sl = [s for s in d['station_list'] if not s['closed']]
        sp = SPURS.get(lm['name'])
        if sp and lm['code'] == 11327:
            spur = [x for x in sl if x['name'].startswith(sp[1])]
            junc = [x for x in sl if x['name'] == sp[0]]
            if spur and junc:
                yield lm, d, [x for x in sl if not x['name'].startswith(sp[1])]
                lm2 = dict(lm, code=lm['code'] * 100 + 90, name=sp[2], sym_code=lm['code']); d2 = dict(d, name_kana='なりたせん(くうこうしせん)')
                yield lm2, d2, junc[:1] + spur
                continue
        yield lm, d, sl
# Lines the database lists as one run although a branch is tacked on after the main line's last station: the phantom edge between the two would
# draw a 30-75 km straight line.  Cut at the jump; JUNCTION says which main-line station the branch hangs off (code: (station, prepend|append)).
JUNCTION = {11303: ('尻手', 'prepend'), 11327: ('成田', 'append'), 11807: None}   # 11807 (Yosan/Uchiko): two routes with different symbols (U / S) listed as one run, no shared station
def symbol_of(s):
    for n in (s.get('numbering') or []):
        m = re.match(r'^([A-Za-z]{1,4})', n)
        if m: return m.group(1).upper()
    return None
def split_jumps(lm, d, sl):
    cut = None
    for i in range(1, len(sl)):
        gap = km(sl[i - 1]['lat'], sl[i - 1]['lng'], sl[i]['lat'], sl[i]['lng'])
        if lm['code'] in JUNCTION and gap > 15: cut = i; break   # only the lines listed in JUNCTION (rural gaps and Shinkansen station spacing are real)
    if cut is None: yield lm, d, sl; return
    a, b = sl[:cut], sl[cut:]
    jn = JUNCTION.get(lm['code'])
    if jn:
        j = [x for x in a if x['name'] == jn[0]]
        if j: b = (j[:1] + b) if jn[1] == 'prepend' else (b + j[:1])
    print('  split %s (%s) at %s -> %s (%.0f km)%s' % (lm['name'], lm['code'], sl[cut - 1]['name'], sl[cut]['name'], km(sl[cut - 1]['lat'], sl[cut - 1]['lng'], sl[cut]['lat'], sl[cut]['lng']), ' junction ' + jn[0] if jn else ' (no junction)'), file=sys.stderr)
    yield from split_jumps(lm, d, a)
    lm2 = dict(lm, code=lm['code'] * 100 + 80 + (1 if jn else 2), name=lm['name'] + ('(支線)' if jn else '(別区間)'), sym_code=lm['code'])
    yield from split_jumps(lm2, dict(d, name_kana=(d.get('name_kana') or '') + 'しせん'), b)
def jobs2():
    for lm, d, sl in jobs(): yield from split_jumps(lm, d, sl)
for lm, d, sl in jobs2():
    if len(sl) < 2: continue
    ids = []
    for s in sl:
        i = sid(s['code'])
        if not ids or ids[-1] != i: ids.append(i)
    if len(ids) < 2: continue
    # service patterns that only re-run other lines' tracks (they would draw a second copy on top of them)
    if re.search(r'湘南新宿ライン|上野東京ライン|成田エクスプレス|ライナー', lm['name']): dropped['service pattern'] += 1; continue
    # operator + railway type via N02
    votes = collections.Counter()
    for s in sl:
        for m in near_cells(s['lat'], s['lng'], n02_grid):
            if norm(m['name']) == norm(s['name']) and km(s['lat'], s['lng'], m['lat'], m['lng']) < 0.4: votes[(m['operator'], m['type'])] += 1
    (op, t02) = votes.most_common(1)[0][0] if votes else ('', 12)
    # drop / trim against curated lines
    best_id, best_cnt = None, 0
    for lid, cs in cur_sets.items():
        c = sum(1 for i in ids if i in cs)
        if c > best_cnt: best_id, best_cnt = lid, c
    if best_cnt >= max(2, 0.5 * len(ids)) or (len(ids) <= 3 and best_cnt == len(ids)):
        dropped['dup'] += 1; continue
    if best_cnt >= 3:
        cs = cur_sets[best_id]
        flags = [i in cs for i in ids]
        lead = 0
        while lead < len(ids) and flags[lead]: lead += 1
        trail = 0
        while trail < len(ids) and flags[len(ids) - 1 - trail]: trail += 1
        if lead >= 3: ids = ids[lead - 1:]; sl = sl[lead - 1:]
        elif trail >= 3: ids = ids[:len(ids) - trail + 1]; sl = sl[:len(sl) - trail + 1]
        if len(ids) < 2: dropped['trim'] += 1; continue
    name = lm['name']
    typ, grp = classify(name, op, t02)
    pts = [(stations[s['code']]['lat'], stations[s['code']]['lng']) for s in sl]
    length = sum(km(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]) for i in range(len(pts) - 1))
    spacing = length / max(1, len(pts) - 1)
    mid = pts[len(pts) // 2]; cdist = city_km(*mid)
    # simulated service level
    if typ == 'metro': freq, v, dwell = [3.5, 5, 8], 38, 22
    elif typ == 'tram': freq, v, dwell = [7, 9, 14], 17, 15
    elif typ == 'mono': freq, v, dwell = [5, 7, 10], 40, 20
    elif typ == 'pvt' and grp == 'Cable cars': freq, v, dwell = [15, 20, 30], 12, 30
    else:
        v = max(38, min(88, 32 + 20 * spacing)); dwell = 25
        if cdist < 25: freq = [5, 8, 14]
        elif cdist < 60: freq = [10, 17, 30]
        elif cdist < 150: freq = [20, 30, 50]
        else: freq = [30, 50, 70]
        if len(ids) < 5: freq = [f * 1.5 for f in freq]
    first, last = (5.0, 23.9) if cdist < 40 else (5.6, 22.8)
    # badge code: first two characters of the line name after stripping operator/JR prefixes
    code_src = re.sub(r'^(JR|東京メトロ|都営|東京都交通局|名古屋市営地下鉄|大阪メトロ|京都市営地下鉄|横浜市営地下鉄)', '', name) or name
    code = (op and code_src.startswith(op) and code_src[len(op):] or code_src)[:2] or name[:2]
    ja = name if (len(name) > 3 or op in name) else (op + name if op else name)
    st_lookup = {norm(x['name']): en_station(x['name'], x.get('name_kana')) for x in sl}
    en = en_line(name, d.get('name_kana'), st_lookup)
    if lm['code'] == 1132790: en = 'JR Narita Line (Airport Branch)'
    if lm['name'].endswith('(支線)'): en = en.replace(' Branch', '') + ' (Branch)'
    elif lm['name'].endswith('(別区間)'): en += ' (Other Section)'
    en = LINE_EN_OVERRIDE.get(lm['code'], en)
    if len(name) <= 3 and op in OP_EN and not en.startswith(OP_EN[op].split()[0]): en = (OP_EN[op] + ' ' + en).strip()
    # official station numbering (駅ナンバリング): use it when most stops carry a number with the line's symbol
    NUM_RE = re.compile(r'^([A-Za-z]{1,4})[\s\-]?(\d{1,3})$')
    per = []
    for x in sl:
        ms = [NUM_RE.match(n) for n in (x.get('numbering') or [])]
        per.append([(m.group(1).upper(), int(m.group(2))) for m in ms if m])
    sym = (symbols.get(lm.get('sym_code', lm['code'])) or '').upper()
    if not sym:
        cnt = collections.Counter(pfx for ps in per for pfx, _ in ps)
        sym = cnt.most_common(1)[0][0] if cnt else ''
    picked = [next((n for pfx, n in ps if pfx == sym), None) for ps in per]
    ids_chk = []
    for x in sl:
        i = sid(x['code'])
        if not ids_chk or ids_chk[-1] != i: ids_chk.append(i)
    numbered = bool(sym) and sum(n is not None for n in picked) >= max(2, 0.5 * len(sl)) and ids_chk == ids
    if numbered:
        toks, last_id = [], None
        for x, n in zip(sl, picked):
            i = sid(x['code'])
            if i == last_id: continue
            last_id = i; toks.append('%s:%s' % (i, n if n is not None else '!'))
        code = sym
    regions = {REGION_OF.get(stations[s['code']]['prefecture'], 'kanto') for s in sl}
    color = lm.get('color') or None
    out_lines.append(dict(code=lm['code'], regions=sorted(regions), ids=ids, sl=sl, def_=dict(
        id='x%d' % lm['code'], code=code, type=typ, grp=grp, op=op or '', en=en, ja=ja, color=color, v=round(v), dwell=dwell,
        freq=[round(f, 1) for f in freq], first=first, last=last, **({} if numbered else {'nonum': True}), st=' '.join(toks if numbered else ids), opEn=OP_EN.get(op, ''))))
    for s, i in zip(sl, [sid(s['code']) for s in sl]):
        used_stations[i] = (i, en_station(s['name'], s.get('name_kana')), s['name'], s['lat'], s['lng'])

# colour fallback per group
FALLBACK = {'JR Hokkaido': '#2EA043', 'JR East': '#4BA82E', 'JR Central': '#F28C28', 'JR West': '#1E6FD9', 'JR Shikoku': '#33A7B8', 'JR Kyushu': '#E0402D',
            'JR (other)': '#7A8CA0', 'Subways': '#E8A33D', 'Trams': '#E5508F', 'Monorails & AGT': '#2BB3A3', 'Cable cars': '#A58B6A', 'Private & Others': '#8F76D6'}
for l in out_lines:
    if not l['def_']['color']: l['def_']['color'] = FALLBACK.get(l['def_']['grp'], '#8aa0b4')

# ---------------------------------------------------------------- write
def rows(ids):
    r = []
    for i in dict.fromkeys(ids):
        i, en, ja, lat, lon = used_stations[i]
        if i in cur['stations'] and i in fixes: lat, lon = fixes[i][0], fixes[i][1]
        r.append('|'.join([i, en.replace('|', ' '), ja.replace('|', ' '), '%.5f' % lat, '%.5f' % lon]))
    return '\n'.join(r)
HDR = """/* Auto-generated by tools/import/build-auto.py — DO NOT EDIT BY HAND.
 * Source: 駅データ.jp via Seo-4d696b75/station_database (CC BY 4.0) for stations/line order/colours,
 *         国土数値情報 鉄道データ(N02, MLIT) via antfu/mlit-json for operator and railway type.
 * English names are machine-romanised from kana; timetables/speeds are SIMULATED, not real. */
(function (g) {
  'use strict';
"""
os.makedirs(os.path.join(args.out, 'auto'), exist_ok=True)
by_region = collections.defaultdict(list)
for l in out_lines: by_region[l['regions'][0] if len(l['regions']) == 1 else 'trunk'].append(l)
summary = {}
for key, ls in by_region.items():
    ids = [i for l in ls for i in l['ids']]
    js = HDR + "  const STATION_SRC = `\n%s\n`;\n  const LINE_SRC = %s;\n  g.TRS_REGIONS_DATA = g.TRS_REGIONS_DATA || {};\n  g.TRS_REGIONS_DATA['%s-auto'] = { STATION_SRC, LINE_SRC, POIS: [], WATER: [] };\n})(typeof window !== 'undefined' ? window : globalThis);\n" % (
        rows(ids), json.dumps([l['def_'] for l in ls], ensure_ascii=False, separators=(',', ':')), key)
    open(os.path.join(args.out, 'auto', key + '.js'), 'w').write(js)
    summary[key] = (len(ls), len(set(ids)), len(js) // 1024)
fx = {k: [v[0], v[1]] for k, v in fixes.items()}
open(os.path.join(args.out, 'fixes.js'), 'w').write(HDR.replace('Auto-generated', 'Auto-generated (coordinate fixes for hand-authored stations)') +
    "  g.TRS_GEO_FIX = %s;\n})(typeof window !== 'undefined' ? window : globalThis);\n" % json.dumps(fx, separators=(',', ':')))
print('dropped as duplicates of curated lines:', dict(dropped))
print('coordinate fixes for curated stations:', len(fx), 'of', len(cur['stations']))
for k, v in sorted(summary.items()): print('%-9s lines=%4d stations=%5d size=%5d KB' % ((k,) + v))
print('total lines', len(out_lines), 'stations', len(used_stations))
