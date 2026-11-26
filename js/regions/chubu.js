/* ------------------------------------------------------------------
 * Region data: Chubu (Nagoya subway)
 * Station lists/numbers: public line articles (Wikipedia). COORDINATES ARE
 * APPROXIMATE: a few anchor stations per line were entered by hand and the
 * rest are interpolated along the line, so individual stations can be off by
 * ~0.5-2 km. Frequencies/speeds are typical values, not the real timetable.
 * Lines not listed here are not mapped yet.
 * ------------------------------------------------------------------ */
(function (g) {
  'use strict';
  const STATION_SRC = `
takabata|Takabata|高畑|35.133|136.857
hatta|Hatta|八田|35.1381|136.8604
iwatsuka|Iwatsuka|岩塚|35.1444|136.8645
nakamurakoen|Nakamura-Koen|中村公園|35.1507|136.8686
nakamuranisseki|Nakamura-Nisseki|中村日赤|35.1552|136.8715
honjin|Honjin|本陣|35.1592|136.8741
kamejima|Kamejima|亀島|35.1643|136.8775
nagoya|Nagoya|名古屋|35.1706|136.8816
fushimi|Fushimi|伏見|35.169|136.897
sakae|Sakae|栄|35.1699|136.9086
shinsakaemachi|Shinsakae-machi|新栄町|35.1695|136.9197
chikusa|Chikusa|千種|35.1692|136.9287
imaike|Imaike|今池|35.1689|136.9358
ikeshita|Ikeshita|池下|35.1701|136.9462
kakuozan|Kakuozan|覚王山|35.1709|136.9532
motoyama|Motoyama|本山|35.1722|136.9648
higashiyamakoen|Higashiyama-Koen|東山公園|35.1692|136.975
hoshigaoka|Hoshigaoka|星ヶ丘|35.1655|136.9875
issha|Issha|一社|35.1707|137.0015
kamiyashiro|Kamiyashiro|上社|35.175|137.0134
hongo|Hongo|本郷|35.1778|137.021
fujigaoka|Fujigaoka|藤が丘|35.183|137.035
kanayama|Kanayama|金山|35.1432|136.9004
higashibetsuin|Higashi-Betsuin|東別院|35.15|136.902
kamimaezu|Kamimaezu|上前津|35.1595|136.9034
yabacho|Yabacho|矢場町|35.165|136.9065
hisayaodori|Hisaya-odori|久屋大通|35.174|136.91
nagoyajo|Nagoya-jo|名古屋城|35.1862|136.899
meijokoen|Meijo-Koen|名城公園|35.192|136.901
kurokawa|Kurokawa|黒川|35.2|136.906
shigahondori|Shiga-Hondori|志賀本通|35.205|136.915
heiandori|Heian-dori|平安通|35.202|136.926
ozone|Ozone|大曽根|35.19|136.94
nagoyadomemaeyada|Nagoya Dome-mae Yada|ナゴヤドーム前矢田|35.1865|136.9525
sunadabashi|Sunadabashi|砂田橋|35.186|136.961
chayagasaka|Chayagasaka|茶屋ヶ坂|35.18|136.965
ng_jiyugaoka|Jiyugaoka|自由ヶ丘|35.176|136.97
nagoyadaigaku|Nagoya-Daigaku|名古屋大学|35.156|136.966
yagotonisseki|Yagoto-Nisseki|八事日赤|35.141|136.97
yagoto|Yagoto|八事|35.1364|136.976
sogorihabiricenter|Sogo Rehabilitation Center|総合リハビリセンター|35.1255|136.966
mizuhoundojohigashi|Mizuho Undojo Higashi|瑞穂運動場東|35.1195|136.949
aratamabashi|Aratama-bashi|新瑞橋|35.1186|136.9345
myoondori|Myoon-dori|妙音通|35.116|136.926
horita|Horita|堀田|35.1135|136.9138
atsutajingutemmacho|Atsuta Jingu Temma-cho|熱田神宮伝馬町|35.1274|136.9071
atsutajingunishi|Atsuta Jingu Nishi|熱田神宮西|35.131|136.8995
nishitakakura|Nishi-Takakura|西高蔵|35.1385|136.896
hibino|Hibino|日比野|35.137|136.8975
rokubancho|Rokuban-cho|六番町|35.1308|136.8946
tokaidori|Tokai-dori|東海通|35.1246|136.8917
minatokuyakusho|Minato Kuyakusho|港区役所|35.1184|136.8888
tsukijiguchi|Tsukiji-guchi|築地口|35.1122|136.8859
nagoyako|Nagoyako|名古屋港|35.106|136.883
kamiotai|Kami-Otai|上小田井|35.2095|136.8645
shonairyokuchikoen|Shonai Ryokuchi Koen|庄内緑地公園|35.2007|136.8737
shonaidori|Shonai-dori|庄内通|35.1918|136.8828
joshin|Joshin|浄心|35.183|136.892
sengencho|Sengen-cho|浅間町|35.1783|136.8945
marunouchi|Marunouchi|丸の内|35.1737|136.897
osukannon|Osu Kannon|大須観音|35.1642|136.9002
tsurumai|Tsurumai|鶴舞|35.1584|136.921
arahata|Arahata|荒畑|35.1523|136.9271
gokiso|Gokiso|御器所|35.1463|136.9332
kawana|Kawana|川名|35.143|136.9475
irinaka|Irinaka|いりなか|35.1397|136.9617
shiogamaguchi|Shiogama-guchi|塩釜口|35.1293|136.9868
ng_ueda|Ueda|植田|35.1222|136.9976
ng_hara|Hara|原|35.1152|137.0084
hirabari|Hirabari|平針|35.1081|137.0192
akaike|Akaike|赤池|35.101|137.03
taikodori|Taiko-dori|太閤通|35.174|136.864
kokusaicenter|Kokusai Center|国際センター|35.1706|136.887
takaoka|Takaoka|高岳|35.1745|136.917
kurumamichi|Kurumamichi|車道|35.1715|136.9275
fukiage|Fukiage|吹上|35.159|136.9335
sakurayama|Sakurayama|桜山|35.1335|136.932
mizuhokuyakusho|Mizuho Kuyakusho|瑞穂区役所|35.1285|136.9328
mizuhoundojonishi|Mizuho Undojo Nishi|瑞穂運動場西|35.1236|136.9337
sakurahommachi|Sakura-Hommachi|桜本町|35.1111|136.941
tsurusato|Tsurusato|鶴里|35.1036|136.9475
nonami|Nonami|野並|35.0961|136.954
narukokita|Naruko-Kita|鳴子北|35.0885|136.9605
aioiyama|Aioiyama|相生山|35.081|136.967
kamisawa|Kamisawa|神沢|35.0735|136.9735
tokushige|Tokushige|徳重|35.066|136.98
`;
  const LINE_SRC = [];
  LINE_SRC.push({"id": "NGH", "code": "H", "type": "metro", "grp": "Nagoya Subway", "op": "Nagoya Municipal Subway", "en": "Nagoya Subway Higashiyama Line", "ja": "名古屋市営地下鉄東山線", "color": "#F4B400", "v": 42, "dwell": 22, "freq": [3, 4.5, 7], "first": 5.2, "last": 24.0, "st": "takabata:1 hatta iwatsuka nakamurakoen nakamuranisseki honjin kamejima nagoya fushimi sakae shinsakaemachi chikusa imaike ikeshita kakuozan motoyama higashiyamakoen hoshigaoka issha kamiyashiro hongo fujigaoka"});
  LINE_SRC.push({"id": "NGM", "code": "M", "type": "metro", "grp": "Nagoya Subway", "op": "Nagoya Municipal Subway", "en": "Nagoya Subway Meijo Line", "ja": "名古屋市営地下鉄名城線", "color": "#8E4A9B", "v": 56, "dwell": 22, "freq": [3.5, 5, 8], "first": 5.3, "last": 23.9, "st": "kanayama:1 higashibetsuin kamimaezu yabacho sakae hisayaodori nagoyajo meijokoen kurokawa shigahondori heiandori ozone nagoyadomemaeyada sunadabashi chayagasaka ng_jiyugaoka motoyama nagoyadaigaku yagotonisseki yagoto sogorihabiricenter mizuhoundojohigashi aratamabashi myoondori horita atsutajingutemmacho atsutajingunishi nishitakakura", "loop": true, "dirs": ["Clockwise 右回り", "Anticlockwise 左回り"], "pill": ["右", "左"], "ccw0": false});
  LINE_SRC.push({"id": "NGE", "code": "E", "type": "metro", "grp": "Nagoya Subway", "op": "Nagoya Municipal Subway", "en": "Nagoya Subway Meiko Line", "ja": "名古屋市営地下鉄名港線", "color": "#BFA6D6", "v": 36, "dwell": 22, "freq": [6, 8, 12], "first": 5.3, "last": 23.8, "st": "kanayama:1 hibino rokubancho tokaidori minatokuyakusho tsukijiguchi nagoyako"});
  LINE_SRC.push({"id": "NGT", "code": "T", "type": "metro", "grp": "Nagoya Subway", "op": "Nagoya Municipal Subway", "en": "Nagoya Subway Tsurumai Line", "ja": "名古屋市営地下鉄鶴舞線", "color": "#0078BE", "v": 52, "dwell": 22, "freq": [3.5, 5, 8], "first": 5.3, "last": 23.9, "st": "kamiotai:1 shonairyokuchikoen shonaidori joshin sengencho marunouchi fushimi osukannon kamimaezu tsurumai arahata gokiso kawana irinaka yagoto shiogamaguchi ng_ueda ng_hara hirabari akaike"});
  LINE_SRC.push({"id": "NGS", "code": "S", "type": "metro", "grp": "Nagoya Subway", "op": "Nagoya Municipal Subway", "en": "Nagoya Subway Sakura-dori Line", "ja": "名古屋市営地下鉄桜通線", "color": "#D6232A", "v": 44, "dwell": 22, "freq": [4, 5.5, 9], "first": 5.3, "last": 23.9, "st": "taikodori:1 nagoya kokusaicenter marunouchi hisayaodori takaoka kurumamichi imaike fukiage gokiso sakurayama mizuhokuyakusho mizuhoundojonishi aratamabashi sakurahommachi tsurusato nonami narukokita aioiyama kamisawa tokushige"});
  g.TRS_REGIONS_DATA = g.TRS_REGIONS_DATA || {};
  g.TRS_REGIONS_DATA.chubu = { STATION_SRC, LINE_SRC, POIS: [], WATER: [] };
})(typeof window !== 'undefined' ? window : globalThis);
