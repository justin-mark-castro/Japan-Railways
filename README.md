# 東京 Rail Sim

A schedule-driven simulation of Tokyo's **JR East** and **subway** lines for rail fans.
Open `index.html` (or host on GitHub Pages) — no build step, no dependencies.

## Features
- 17 lines: JR (Yamanote JY, Chūō Rapid JC, Chūō-Sōbu Local JB, Keihin-Tōhoku JK), all 9 Tokyo Metro lines (G M H T C Y Z N F) and 4 Toei lines (A I S E)
- Official line colours, line codes and station numbers (e.g. **JY17** Shinjuku, **G09** Ginza); distinct symbols for JR (rounded square), Metro (circle) and Toei (ringed circle)
- Search stations / lines by English, 日本語 or code (`Shinjuku`, `新宿`, `JY17`, `ginza`)
- Filters: per-operator chips, per-line toggles, line filter box, JR / subway quick filters, interchanges-only, display toggles
- Click a station for interchanges + next-departure board; click a line for stats and station list; click a train for its route and ETAs, or follow it
- Time controls: scrub the day (04:30 → 04:30), 1×–120× speed, rush-hour / daytime / last-train presets, "Now" (JST)
- EN / 日本語 and dark / light themes; works on mobile

## Accuracy
Station positions are hand-authored approximations and the map is schematic. Train movements are generated from each line's headway, speed and dwell time (rapid services skip stops) — **not** from official timetables. Next planned step: import real timetables/geometry from ODPT open data.

## Structure
- `js/data.js` – stations, lines, colours, codes, frequencies
- `js/sim.js` – network builder + stateless schedule engine
- `js/app.js` – canvas renderer, UI, search, interaction
- `URL params`: `?t=8.25` (start time in hours), `?line=JY`, `?stn=shinjuku`
