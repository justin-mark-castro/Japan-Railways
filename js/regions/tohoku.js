/* ------------------------------------------------------------------
 * Region data: Tohoku (Sendai subway)
 * Station lists/numbers: public line articles (Wikipedia). COORDINATES ARE
 * APPROXIMATE: a few anchor stations per line were entered by hand and the
 * rest are interpolated along the line, so individual stations can be off by
 * ~0.5-2 km. Frequencies/speeds are typical values, not the real timetable.
 * Lines not listed here are not mapped yet.
 * ------------------------------------------------------------------ */
(function (g) {
  'use strict';
  const STATION_SRC = `
izumichuo|Izumi-Chuo|泉中央|38.319|140.8815
yaotome|Yaotome|八乙女|38.311|140.8774
kuromatsu|Kuromatsu|黒松|38.3023|140.8729
asahigaoka|Asahigaoka|旭ヶ丘|38.297|140.8702
dainohara|Dainohara|台原|38.2903|140.8668
kitasendai|Kita-Sendai|北仙台|38.283|140.863
kitayobancho|Kita-Yobancho|北四番丁|38.2738|140.8674
kotodaikoen|Kotodai-Koen|勾当台公園|38.2685|140.87
hirosedori|Hirose-dori|広瀬通|38.2643|140.8761
sendait|Sendai|仙台|38.2601|140.8821
itsutsubashi|Itsutsubashi|五橋|38.2529|140.8823
atagobashi|Atagobashi|愛宕橋|38.2481|140.8824
kawaramachi|Kawaramachi|河原町|38.241|140.8827
nagamachiitchome|Nagamachi-Itchome|長町一丁目|38.2346|140.8828
nagamachi|Nagamachi|長町|38.229|140.883
nagamachiminami|Nagamachi-Minami|長町南|38.2238|140.8762
tomizawa|Tomizawa|富沢|38.215|140.865
`;
  const LINE_SRC = [];
  LINE_SRC.push({"id": "SN", "code": "N", "type": "metro", "grp": "Sendai Subway", "op": "Sendai City Subway", "en": "Sendai Subway Namboku Line", "ja": "仙台市地下鉄南北線", "color": "#00A06A", "v": 40, "dwell": 22, "freq": [4, 6, 10], "first": 5.5, "last": 23.6, "st": "izumichuo:1 yaotome kuromatsu asahigaoka dainohara kitasendai kitayobancho kotodaikoen hirosedori sendait itsutsubashi atagobashi kawaramachi nagamachiitchome nagamachi nagamachiminami tomizawa"});
  g.TRS_REGIONS_DATA = g.TRS_REGIONS_DATA || {};
  g.TRS_REGIONS_DATA.tohoku = { STATION_SRC, LINE_SRC, POIS: [], WATER: [] };
})(typeof window !== 'undefined' ? window : globalThis);
