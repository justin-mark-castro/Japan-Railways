# 東京 Rail Sim

A schedule-driven simulation of Tokyo's **JR**, **subway** and **private railway** lines for rail fans.
Open `index.html` (or host on GitHub Pages) — no build step, no dependencies.

## Features
- **47 lines**: JR East (Yamanote JY, Chūō Rapid JC, Chūō-Sōbu JB, Keihin-Tōhoku JK, Saikyō JA, Jōban Rapid JJ, Tōkaidō JT, Yokosuka JOY, Sōbu Rapid JOS, Keiyō JE), all 9 Tokyo Metro lines, 4 Toei lines, and private lines (Keiō, Inokashira, Odakyū, Tōkyū ×3, Keikyū, Tōbu ×2, Seibu ×2, Tsukuba Express, Yurikamome, Tokyo Monorail) and both Tokyo **trams** — the Tokyo Sakura Tram (Toden Arakawa, SA01–SA30, via Ōtsuka) and the Tōkyū Setagaya Line (SG01–SG10), drawn as single-car trams. Also the **monorails and automated guideway lines**: Tokyo Monorail, Yurikamome, Nippori-Toneri Liner, Tama Monorail, Shonan Monorail, Chiba Monorail (lines 1 & 2), Yokohama Seaside Line and the Disney Resort Line (one-way loop), plus the tram-like Enoden (Fujisawa–Kamakura). Tokyo has no other trams
- **Train markers look like trains** (white two-car body, line-coloured stripe, headlight) and carry the line badge above them, in the line's symbol shape
- **Inner / outer loop**: Yamanote (内回り ↺ / 外回り ↻) and Ōedo (右回り / 左回り) trains wear a direction pill (white = first direction, dark = second)
- **Trains running per line**: click the "📊 N trains running" chip for a live, sorted bar chart by line and by operator group, with the loop split for Yamanote / Ōedo; click a row to focus that line
- **Tourist spots**: 34 famous places (Tokyo Tower, Skytree, Sensō-ji, Meiji Jingu, Shibuya Crossing, Tsukiji, Akihabara, …) as icons on the map, by category; click one for the nearest stations with walking time and a zoom button
- Official line colours, codes and station numbers (e.g. **JY17** Shinjuku, **G09** Ginza)
- Search stations, lines, spots or codes by English, 日本語 or code (`Shinjuku`, `新宿`, `JY17`, `Skytree`)
- Filters: operator chips, per-line toggles, quick filters (All / None / JR / Subway / Private), interchanges-only
- Sidebar sections collapse, and the divider above Display can be dragged (double-click to reset); the layout is remembered
- Click a station for interchanges + departure board; a line for stats; a train for route and ETAs
- Time controls: scrub the day, 1×–120×, rush-hour / daytime / last-train presets, "Now" (JST)
- EN / 日本語, dark / light, mobile friendly
- **Shinkansen (whole network)**: 14 lines — Nozomi (Tokyo–Hakata), Hikari, Kodama (Tokaido and Sanyo), Mizuho/Sakura, Tsubame, Kamome (Nishi-Kyushu), Hayabusa, Yamabiko, Hokkaido, Joetsu, Hokuriku, and the Akita and Yamagata mini-shinkansen branches. They load at start-up as a national layer, so trains and station names are visible even with the whole of Japan on screen
- **Beyond Tokyo (phase 1)**: zoom out to see all of Japan with prefecture markers. The dashboard follows the map — the 📍 area chip (top-left) shows the prefecture under the view centre, and the line list, operator chips and train counts are scoped to it ("This area") or to everything loaded ("All loaded"). Click the chip to jump to any of the 47 prefectures. Each region loads on demand when you zoom into it

## Accuracy — please read
Everything on the map is **hand-authored and approximate**: line colours, station numbers and coordinates (especially for the added JR and private lines) were entered from memory and the map is schematic. Some Tokyo lines and branches are still missing. By default train movements are **generated** from each line's headway, speed and dwell (rapid services skip stops) — **not** from official timetables. Use the ODPT tools below to replace this with real data.

## Real timetables and coordinates (ODPT)
Needs a free developer key from the [ODPT Challenge](https://developer.odpt.org/). **Never commit your key.**

```bash
export ODPT_KEY=your_key_here        # or put ODPT_KEY=... in a git-ignored .env.local
node tools/odpt/fetch.mjs            # downloads stations + train timetables to tools/odpt/raw/ (git-ignored)
node tools/odpt/convert.mjs          # writes data/timetable.json, data/geometry.json, data/manifest.json
```

Reload the site: a **Timetable** section appears in the sidebar (Simulated / Weekday / Holiday). Lines without real data keep the simulation.

- The ODPT ids for Nippori-Toneri Liner and Tama Monorail in `line-map.json` are guesses, and ODPT may not cover Chiba, Shonan, Seaside, Resort Line or Enoden at all (those keep the simulation).
- `tools/odpt/line-map.json` maps ODPT railway ids to this site's line ids — check them against your dataset. JR East data may be on a different endpoint (`ODPT_BASE_CHALLENGE`) or only available as GTFS (no GTFS converter yet).
- Unmatched station names are listed by `convert.mjs`; map them in `tools/odpt/station-overrides.json` (`{"odpt.Station:…": "siteStationId"}`).
- Stops outside the site's line definitions are dropped, so through-running trips are truncated at the line boundary; Ōedo's loop-plus-stem shape is not modelled exactly.
- `node tools/odpt/test.mjs` runs an offline test on sample files (convert → load into the engine → check trains and departure board).
- The ODPT endpoints and field names in `fetch.mjs` follow the documented v4 API but were **not tested against the live service** (no network access when written).

**Attribution:** if you publish generated data, credit "Public Transportation Open Data Center (ODPT)" and follow the licence of each dataset.

## Regions (whole-of-Japan architecture)
The map uses a Mercator projection (metres around Tokyo), so it scales from a single station out to the whole country. `js/regions.js` lists the 47 prefectures and the regions; Kanto is built in, other regions are lazy-loaded scripts in `js/regions/`. A region loads automatically when you zoom in on one of its prefectures.

To add a region, create `js/regions/<id>.js` and add `{id, file, prefs:[…]}` to `REGIONS` in `js/regions.js`:
```js
window.TRS_REGIONS_DATA = window.TRS_REGIONS_DATA || {};
TRS_REGIONS_DATA.kansai = { STATION_SRC: [...], LINE_SRC: [...], POIS: [...], WATER: [...] };
```
Use the same row formats as `js/data.js` / `js/data-extra.js`, give lines a `grp` (operator group), and keep station ids unique across regions (Kansai prefixes clashing ids with `o`).

Caveats: the "area" is the prefecture whose capital is nearest the view centre — an approximation of real borders. The Kansai file is hand-authored, approximate and incomplete (9 lines, ~110 stations); only the Tokyo Bay and Osaka Bay outlines are drawn, there is no national coastline yet; and outside Tokyo trains are simulated. The Shinkansen layer (`js/regions/shinkansen.js`) is the exception: station order and km spacing come from public line articles, journey times are calibrated to published fastest/typical times (e.g. Tokyo–Shin-Osaka 2h21 Nozomi, Tokyo–Shin-Aomori ~3h10), but coordinates are hand-entered (±~1 km), frequencies are rounded headways rather than the real timetable, services that run through between lines (Komachi, Tsubasa, Nasuno, Hayate, Asama, Tsurugi) are not modelled as through trains, and Shinkansen station codes are omitted. The Sapporo extension is not included (under construction). 

## Nationwide import (all railways, trams, monorails)
Every region has two parts: a hand-curated file (`js/regions/<id>.js`, higher quality) and an **auto-generated** file (`js/regions/auto/<id>.js`) built from open data. `js/regions/auto/trunk.js` holds lines that cross region borders and loads at start-up with the Shinkansen layer; Kanto's auto file also loads at start-up, the rest load when you zoom into their prefectures. Currently ~620 lines and ~9,000 stations: JR, private railways, subways, trams (Sapporo, Hakodate, Toyama, Fukui, Kyoto's Randen, Hiroshima, Matsuyama, Kochi, Kumamoto, Nagasaki, Kagoshima, Okinawa's monorail…), monorails, AGT and cable lines.

Regenerate (needs Python 3 with numpy/scipy, and Node, plus two open-data clones). Run `build-fixes.py` first: it extends the hand-made lines, and `build-auto.py` then treats them as curated and drops its own duplicates:
```bash
git clone --depth 1 https://github.com/Seo-4d696b75/station_database /tmp/ext/station_database
git clone --depth 1 https://github.com/antfu/mlit-json /tmp/ext/mlit-json
python3 tools/import/build-fixes.py --sdb /tmp/ext/station_database                                                        # js/data-fixes.js
node tools/import/dump-curated.mjs > /tmp/curated.json
python3 tools/import/build-auto.py --sdb /tmp/ext/station_database --mlit /tmp/ext/mlit-json --curated /tmp/curated.json   # lines, stations, names, codes
node tools/import/dump-all.mjs > /tmp/all.json
python3 tools/import/build-shapes.py --mlit /tmp/ext/mlit-json --all /tmp/all.json                                      # real track shapes
```
- **Merging with hand-made data:** stations match by normalised Japanese name (within 3 km, or <60 m); hand-made lines win, imported lines that duplicate one are dropped or trimmed, and service patterns that only re-run other lines (Shonan-Shinjuku Line, Narita Express…) are skipped. `js/regions/fixes.js` (`TRS_GEO_FIX`) snaps hand-typed station coordinates to the accurate open-data positions.
- **Base map:** `build-land.py` turns the prefecture polygons of 地球地図日本 (see attribution) into `js/geo/land.js`, `land-mid.js` and `land-hi.js` — land, coast and prefecture borders at three levels of detail. The small base file loads at start-up; the finer levels are fetched only when you zoom in, and the coarser one keeps drawing until they arrive. The coast fades out at street zoom, where this 1:1,000,000-scale outline is coarser than the tracks. Lakes (e.g. Lake Biwa) are not cut out of the land.
  ```bash
  git clone --depth 1 https://github.com/dataofjapan/land /tmp/geo/land
  python3 tools/import/build-land.py --geojson /tmp/geo/land/japan.geojson
  ```
- **Track shapes:** `build-shapes.py` routes every station-to-station edge over the MLIT N02 railway sections (shortest path on a graph per railway type, preferring the line's own operator; ends are bridged where sections don't quite meet) and writes `js/regions/auto/<region>-shape.js` as simplified encoded polylines. Edges with no plausible route (about 1%) stay straight. A few Shinkansen stations whose hand-typed position was km off are moved onto the track. Trains run along the same curves, so line lengths and journey times use real path length.
- **Official codes:** the station database carries station numbering and line symbols (JY17, S01, M08…) for about half of the imported lines; those lines show real codes and station numbers. Other lines get a Latin badge derived from the English name (for example "KA" for Kagoshima Main Line) and no station numbers.
- **English names:** `tools/import/names_en.py` holds a hand-written table of ~150 operators (English name, line-name prefix and its kana reading). Line names are operator + romanised remainder + suffix (and an A–B section where the source splits a line); station names are romanised from kana with Higashi-/Nishi-/Shin- and -mae/-koen/-dori hyphenation. Japanese stays available (switch to 日本語, or see the secondary line).

**Limitations (honest list)**
- **Movements are simulated, not real timetables.** Speed and headway come from the railway type, station spacing and distance to the nearest big city (so a Tokyo-area line runs far more often than a rural one). Use the ODPT tools for real Tokyo data.
- English names are machine-romanised: expect odd results for unusual readings, compounds and some long-vowel cases, and the operator table may contain mistakes. Operators missing from the table keep Japanese names.
- Station dots use their own coordinates, so a few hand-typed stations sit slightly off their track.
- Centre Tokyo is dense; hand-made and imported lines can still run side by side. Some lines, branches, through-running services and recent openings/closures may be missing or out of date. Shinkansen extensions under construction are not included.
- Region detection uses the nearest prefectural capital plus extra anchor points for Hokkaido and the islands, not real borders.

## Data sources and attribution
- Stations, line order, kana and line colours: [station_database](https://github.com/Seo-4d696b75/station_database) by Seo-4d696b75, derived from 駅データ.jp — **CC BY 4.0**.
- Operator and railway-type data: MLIT 国土数値情報 (National Land Numerical Information) railway data N02, via [antfu/mlit-json](https://github.com/antfu/mlit-json) — follow the MLIT terms of use and credit "国土交通省 国土数値情報".
- Track geometry: the same MLIT railway data (sections).
- Land outline and prefecture borders: 地球地図日本 (Global Map Japan), 国土地理院 / Geospatial Information Authority of Japan, via [dataofjapan/land](https://github.com/dataofjapan/land) — credit GSI per its terms of use.
- Optional real timetables: [Public Transportation Open Data Center (ODPT)](https://www.odpt.org/) — follow each dataset's licence.

## Structure
- `js/regions/shinkansen.js` – national Shinkansen layer (loads at start-up)
- `js/regions/auto/`, `js/regions/fixes.js` – generated nationwide data (see *Nationwide import*)
- `tools/import/` – open-data importer (`build-auto.py`, `build-shapes.py`, `build-land.py`, `names_en.py`, `dump-curated.mjs`, `dump-all.mjs`)
- `js/land.js`, `js/geo/` – base-map layer and its generated data
- `js/regions.js`, `js/regions/` – prefectures, region loader and lazy region data
- `js/data.js`, `js/data-extra.js` – stations, lines, colours, codes, frequencies
- `js/data-fixes.js` – generated by `tools/import/build-fixes.py`: completes hand-made lines that stopped short (Keio, Odakyu, Tobu, Seibu, Tsukuba Express, Toei Mita/Shinjuku, Metro Yurakucho/Fukutoshin, Chuo/Sobu/Joban) with correct station numbers, and adds the Honancho, Kita-Ayase, Oedo (Hikarigaoka) and Joban Local lines
- `js/station-badge.js` – station-number badges in Japanese signage style (JR rounded square, ring for Metro/Toei/private); SVG for the UI, canvas for map labels
- `js/poi.js` – tourist spots
- `js/sim.js` – network builder + stateless schedule engine (simulated or real trips)
- `js/app.js` – canvas renderer, UI, search, interaction
- `data/` – optional real data (`manifest.json` flags which files to load)
- `tools/odpt/` – fetch / convert / test scripts
- URL params: `?t=8.25` (start hour), `?line=JY`, `?stn=shinjuku`
