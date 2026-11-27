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
    // The entries below come from the English Wikipedia station articles (platform/track counts as stated there); those articles give no exit counts.
    ueno: { exits: null, platforms: '25 tracks', note: 'Tracks, not platforms: JR East 12 above ground (1–12) + 5 on the lower deck (13–17) + 4 Shinkansen (19–22), plus 2 Ginza Line and 2 Hibiya Line tracks. Exit count not researched yet.' },
    nagoya: { exits: null, platforms: '11 (22 tracks)', note: 'JR Central conventional 6 platforms / 12 tracks, Shinkansen 2 / 4, Aonami Line 1 / 2, subway 2 / 4. Meitetsu, Kintetsu and Linimo are not counted. Exit count not researched yet.' },
    kyoto: { exits: null, platforms: '17 (25 tracks)', note: 'JR West 10 platforms / 15 tracks (Tōkaidō etc. 5/8, Sanin/Sagano 3/4, two further dead-end platforms 2/3), JR Central Shinkansen 2 / 4, Kintetsu 4 / 4, subway 1 / 2. Exit count not researched yet.' },
    shinosaka: { exits: null, platforms: '11 (20 tracks)', note: 'JR West conventional 5 platforms / 10 tracks, JR Central Shinkansen 5 / 8, Osaka Metro Midōsuji 1 / 2. Exit count not researched yet.' },
    yokohama: { exits: null, platforms: '8 JR (nos. 3–10)', note: 'JR East platforms 3–10 and Keikyu platforms 1–2 only; Tokyu, Minatomirai, Sotetsu and the subway are not counted. Exit count not researched yet.' }
  };
})(window);
