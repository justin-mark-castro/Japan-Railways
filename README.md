# 東京 Rail Sim

A schedule-driven simulation of Tokyo's **JR**, **subway** and **private railway** lines for rail fans.
Open `index.html` (or host on GitHub Pages) — no build step, no dependencies.

## Features
- **39 lines**: JR East (Yamanote JY, Chūō Rapid JC, Chūō-Sōbu JB, Keihin-Tōhoku JK, Saikyō JA, Jōban Rapid JJ, Tōkaidō JT, Yokosuka JOY, Sōbu Rapid JOS, Keiyō JE), all 9 Tokyo Metro lines, 4 Toei lines, and private lines (Keiō, Inokashira, Odakyū, Tōkyū ×3, Keikyū, Tōbu ×2, Seibu ×2, Tsukuba Express, Yurikamome, Tokyo Monorail) and both Tokyo **trams** — the Tokyo Sakura Tram (Toden Arakawa, SA01–SA30, via Ōtsuka) and the Tōkyū Setagaya Line (SG01–SG10), drawn as single-car trams
- **Train markers look like trains** (white two-car body, line-coloured stripe, headlight) and carry the line badge above them, in the line's symbol shape
- **Inner / outer loop**: Yamanote (内回り ↺ / 外回り ↻) and Ōedo (右回り / 左回り) trains wear a direction pill (white = first direction, dark = second)
- **Trains running per line**: click the "📊 N trains running" chip for a live, sorted bar chart by line and by operator group, with the loop split for Yamanote / Ōedo; click a row to focus that line
- **Tourist spots**: 34 famous places (Tokyo Tower, Skytree, Sensō-ji, Meiji Jingu, Shibuya Crossing, Tsukiji, Akihabara, …) as icons on the map, by category; click one for the nearest stations with walking time and a zoom button
- Official line colours, codes and station numbers (e.g. **JY17** Shinjuku, **G09** Ginza)
- Search stations, lines, spots or codes by English, 日本語 or code (`Shinjuku`, `新宿`, `JY17`, `Skytree`)
- Filters: operator chips, per-line toggles, quick filters (All / None / JR / Subway / Private), interchanges-only
- Click a station for interchanges + departure board; a line for stats; a train for route and ETAs
- Time controls: scrub the day, 1×–120×, rush-hour / daytime / last-train presets, "Now" (JST)
- EN / 日本語, dark / light, mobile friendly

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

- `tools/odpt/line-map.json` maps ODPT railway ids to this site's line ids — check them against your dataset. JR East data may be on a different endpoint (`ODPT_BASE_CHALLENGE`) or only available as GTFS (no GTFS converter yet).
- Unmatched station names are listed by `convert.mjs`; map them in `tools/odpt/station-overrides.json` (`{"odpt.Station:…": "siteStationId"}`).
- Stops outside the site's line definitions are dropped, so through-running trips are truncated at the line boundary; Ōedo's loop-plus-stem shape is not modelled exactly.
- `node tools/odpt/test.mjs` runs an offline test on sample files (convert → load into the engine → check trains and departure board).
- The ODPT endpoints and field names in `fetch.mjs` follow the documented v4 API but were **not tested against the live service** (no network access when written).

**Attribution:** if you publish generated data, credit "Public Transportation Open Data Center (ODPT)" and follow the licence of each dataset.

## Structure
- `js/data.js`, `js/data-extra.js` – stations, lines, colours, codes, frequencies
- `js/poi.js` – tourist spots
- `js/sim.js` – network builder + stateless schedule engine (simulated or real trips)
- `js/app.js` – canvas renderer, UI, search, interaction
- `data/` – optional real data (`manifest.json` flags which files to load)
- `tools/odpt/` – fetch / convert / test scripts
- URL params: `?t=8.25` (start hour), `?line=JY`, `?stn=shinjuku`
