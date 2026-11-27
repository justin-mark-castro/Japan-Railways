/* Station facts that are NOT in the open station data (exits, platforms).
 * Hand-researched for a few major stations only; counts differ between sources because stations like Shinjuku are
 * several operators' stations joined together, so each entry says what it counts. Anything missing shows "not in dataset yet". */
(function (g) {
  'use strict';
  g.TRS_FACTS = {
    shinjuku: { exits: '200+', platforms: '36', note: 'Whole complex across JR, Odakyu, Keio, Metro and Toei (sources give 35–36; JR alone has 8 island platforms / 16 tracks). Exit counts range from 178 to 200+ depending on the source.' },
    tokyo: { exits: '10+', platforms: '14 (28 tracks)', note: 'JR East platforms: 10 island platforms above ground plus 2 underground Sōbu/Yokosuka and 2 underground Keiyō platforms. Exits are grouped into Marunouchi (west) and Yaesu (east).' },
    shibuya: { exits: '6 main', platforms: '2 island (4 tracks)', note: 'JR platforms only. The 6 exits are the main JR/Tokyu/Metro complex per Wikipedia and predate the ongoing rebuild, so treat as approximate.' },
    osaka: { exits: '6', platforms: '15 (1–11, 21–24)', note: 'JR Ōsaka Station only; the connected Umeda stations (Hankyu, Hanshin, Metro) are counted separately.' }
  };
})(window);
