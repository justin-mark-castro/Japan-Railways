/* Station facts that are NOT in the open station data (exits, platforms).
 * Hand-researched for a few major stations only; counts differ between sources because stations like Shinjuku are
 * several operators' stations joined together, so each entry says what it counts. Anything missing shows "not in dataset yet". */
(function (g) {
  'use strict';
  g.TRS_FACTS = {
    shinjuku: { exits: '200+', platforms: '36', note: 'Whole complex across JR, Odakyu, Keio, Metro and Toei (sources give 35–36; JR alone has 8 island platforms / 16 tracks). Exit counts range from 178 to 200+ depending on the source.' },
    tokyo: { exits: '10+', platforms: '14 (28 tracks)', note: 'JR East platforms: 10 island platforms above ground plus 2 underground Sōbu/Yokosuka and 2 underground Keiyō platforms. Exits are grouped into Marunouchi (west) and Yaesu (east).' },
    shibuya: { exits: '6 main', platforms: '2 island (4 tracks)', note: 'JR platforms only. The 6 exits are the main JR/Tokyu/Metro complex per Wikipedia and predate the ongoing rebuild, so treat as approximate.' },
    osaka: { exits: '6', platforms: '15 (1–11, 21–24)', note: 'JR Ōsaka Station only; the connected Umeda stations (Hankyu, Hanshin, Metro) are counted separately.' },
    // Researched from Japanese Wikipedia 駅構造 sections: counts are 面 (platform faces) / 線 (tracks) per operator. Exits only where stated.
    ueno: { exits: null, platforms: '9–10 JR + 4 Metro (21–22 JR tracks)', note: 'per Japanese Wikipedia 駅構造. JR East: elevated 6 platforms / 12 tracks (1–12), ground-level terminal 3–4 platforms / 5 tracks (13–17; the article gives both 3 and 4), underground Shinkansen 2 / 4 (19–22); Ginza and Hibiya lines 2 / 2 each. The article names 9 JR exits but states no exit total.' },
    nagoya: { exits: '13 (subway-signed only)', platforms: '11 (22 tracks)', note: 'per Japanese Wikipedia 駅構造. JR Central conventional 6 / 12, Shinkansen 2 / 4, Aonami 1 / 2, Higashiyama 1 / 2, Sakura-dori 1 / 2. Exits are the subway-signed ones only (Higashiyama 10 + Sakura-dori 3); no JR exit count is stated. Meitetsu and Kintetsu are separate stations and not counted.' },
    yokohama: { exits: '6 (underground passages)', platforms: '12 (17 tracks)', note: 'per Japanese Wikipedia 駅構造. JR East 4 / 8, Tokyu + Minatomirai shared 1 / 2, Keikyu 2 / 2, Sotetsu 4 / 3, Blue Line 1 / 2. The 6 exits are the B1 underground-passage exits; the article states no per-operator exit counts.' },
    tachikawa: { exits: null, platforms: '4 (8 tracks)', note: 'per Japanese Wikipedia 駅構造. JR East island platforms 4 / 8 (Chuo 2 / 4, Ome nos. 1–2, Nambu nos. 7–8). The article lists 5 ticket gates but no exit count. Tama Monorail stations are separate.' },
    shimbashi: { exits: null, platforms: '9 (14 tracks)', note: 'per Japanese Wikipedia 駅構造. Derived sum: JR East 4 / 8 (3 / 6 elevated + 1 / 2 underground), Ginza Line 2 / 2, Asakusa Line 2 / 2, Yurikamome 1 / 2. No exit count is stated.' },
    sannomiya: { exits: null, platforms: '2 JR (4 tracks)', note: 'per Japanese Wikipedia 駅構造. JR West only, elevated island platforms 2 / 4 (nos. 1–4). Hankyu, Hanshin, subway and Port Liner stations are separate and not counted. No exit count is stated (3 ticket gates).' },
    kumamoto: { exits: null, platforms: '4 (10 tracks)', note: 'per Japanese Wikipedia 駅構造. JR Kyushu: Kyushu Shinkansen 2 / 4 plus conventional 2 / 6. No exit count is stated.' },
    kagoshimachuo: { exits: '2 (named)', platforms: '5 (10 tracks)', note: 'per Japanese Wikipedia 駅構造. JR Kyushu: conventional 3 / 6 plus Kyushu Shinkansen 2 / 4. The article names two exits (Sakurajima-guchi, West); no total is stated.' },
    niigata: { exits: '2 main', platforms: '6 (9 tracks, partly derived)', note: 'per Japanese Wikipedia 駅構造. JR East: Joetsu Shinkansen 2 / 4 plus a transfer platform, conventional nos. 1–5 (planning text says 3 / 5). Two large entrances (Bandai-guchi, South); the face count is partly derived.' },
    kokura: { exits: null, platforms: '7 (14 tracks)', note: 'per Japanese Wikipedia 駅構造. JR Kyushu 4 / 8, JR West Sanyo Shinkansen 2 / 4, Kitakyushu Monorail 1 / 2. No exit count is stated (north and south sides).' },
    utsunomiya: { exits: null, platforms: '5 (7 tracks)', note: 'per Japanese Wikipedia 駅構造. JR East: Tohoku Shinkansen 2 / 2 plus conventional 3 / 5. No exit count is stated.' },
    shizuoka: { exits: null, platforms: '4 (6 tracks)', note: 'per Japanese Wikipedia 駅構造. JR Central: conventional island platforms 2 / 4 (plus a through track), Tokaido Shinkansen 2 / 2 on nos. 5–6. The article lists 5 ticket gates but no exit count.' },
    nagano: { exits: '2 (JR)', platforms: '5 JR (9 tracks)', note: 'per Japanese Wikipedia 駅構造. JR East 5 / 9 (conventional 3 / 5, Hokuriku Shinkansen 2 / 4); Nagano Electric Railway is a separate underground station with 2 / 3. JR exits are Zenkoji-guchi and East.' },
    ikebukuro: { exits: null, platforms: '14 (21 tracks)', note: 'per Japanese Wikipedia 駅構造. Across JR East, Seibu, Tobu, Metro and Tokyo Metro; Seibu side has 3 named exits. No station-wide exit total is stated.' },
    shinagawa: { exits: null, platforms: '12 (21 tracks)', note: 'per Japanese Wikipedia 駅構造. Combined JR East (incl. Shinkansen) and Keikyu platforms. No exit total is stated.' },
    hakata: { exits: '24 (subway)', platforms: '9 (19 tracks incl. storage)', note: 'per Japanese Wikipedia 駅構造. JR Kyushu / JR West plus subway; the 24 exits are the subway-side count.' },
    a1110315: { exits: null, platforms: '6 (10 tracks)', note: 'per Japanese Wikipedia 駅構造. JR Hokkaido only; no exit count is stated.' },
    sendait: { exits: '20 (subway)', platforms: '9 (18 tracks)', note: 'per Japanese Wikipedia 駅構造. JR East plus Sendai subway; the 20 exits are the subway-side count.' },
    omiya: { exits: null, platforms: '12 (23 tracks)', note: 'per Japanese Wikipedia 駅構造. JR East, with the Tobu and New Shuttle platforms; the text also mentions 25 numbered tracks. No exit count is stated.' },
    akihabara: { exits: null, platforms: '7 (10 tracks)', note: 'per Japanese Wikipedia 駅構造. JR East plus Tsukuba Express (TX has 3 exits); Metro Hibiya Line is a separate station.' },
    tennoji: { exits: null, platforms: 'JR 9 + Metro 4', note: 'per Japanese Wikipedia 駅構造. JR West 9 / 12 and Osaka Metro 4 / 5. The infobox and body disagree on the Metro figures.' },
    shinyokohama: { exits: null, platforms: '6 (11 tracks)', note: 'per Japanese Wikipedia 駅構造. Shinkansen and JR East Yokohama Line plus Blue Line; the infobox and body differ slightly.' },
    hiroshima: { exits: null, platforms: '10', note: 'per Japanese Wikipedia 駅構造. JR West 6 / 12 plus Hiroden 4 / 3 (streetcar).' },
    okayamask: { exits: null, platforms: '6 (14 tracks)', note: 'per Japanese Wikipedia 駅構造. JR West and JR Central Shinkansen plus conventional lines; no exit count is stated.' },
    kanazawa: { exits: null, platforms: '6 (13 tracks)', note: 'per Japanese Wikipedia 駅構造. JR West / JR East; no exit count is stated.' },
    kyoto: { exits: null, platforms: '16 (24 tracks)', note: 'per Japanese Wikipedia 駅構造. Japanese Wikipedia: JR West 9 / 14, Shinkansen 2 / 4, Kintetsu 4 / 4, subway 1 / 2. English Wikipedia gives 17 / 25. No exit count is stated.' },
    shinosaka: { exits: '6 (Metro)', platforms: '11 (20 tracks)', note: 'per Japanese Wikipedia 駅構造. JR West conventional 5 / 10, Shinkansen 5 / 8, Midosuji Line 1 / 2. The 6 exits listed are Osaka Metro exits only.' }
  };
})(window);
