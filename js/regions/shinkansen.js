/* ------------------------------------------------------------------
 * National layer: Shinkansen (all lines in service)
 * Station order, km spacing and typical journey times were taken from
 * public references (Wikipedia line articles, JR Central). Coordinates
 * are hand-entered and APPROXIMATE (±~1 km). Frequencies are rounded
 * headways, NOT the official timetable. Through-running services
 * (e.g. Komachi / Tsubasa / Nasuno from Tokyo) are not modelled as one
 * train: the mini-shinkansen branches run as their own lines.
 * Station codes are intentionally omitted (nonum).
 * ------------------------------------------------------------------ */
(function (g) {
  'use strict';
  const STATION_SRC = `
tokyo|Tokyo|東京|35.6812|139.7671
shinagawa|Shinagawa|品川|35.6285|139.7387
shinyokohama|Shin-Yokohama|新横浜|35.5071|139.6176
odawara|Odawara|小田原|35.2563|139.1550
atami|Atami|熱海|35.1039|139.0777
mishima|Mishima|三島|35.1268|138.9108
shinfuji|Shin-Fuji|新富士|35.1411|138.6643
shizuoka|Shizuoka|静岡|34.9717|138.3890
kakegawa|Kakegawa|掛川|34.7694|138.0136
hamamatsu|Hamamatsu|浜松|34.7039|137.7352
toyohashi|Toyohashi|豊橋|34.7627|137.3814
mikawaanjo|Mikawa-Anjo|三河安城|34.9590|137.0805
nagoya|Nagoya|名古屋|35.1706|136.8816
gifuhashima|Gifu-Hashima|岐阜羽島|35.3150|136.6858
maibara|Maibara|米原|35.3144|136.2900
kyoto|Kyoto|京都|34.9858|135.7588
shinosaka|Shin-Osaka|新大阪|34.7334|135.5002
shinkobe|Shin-Kobe|新神戸|34.7077|135.1960
nishiakashi|Nishi-Akashi|西明石|34.6758|134.9600
himeji|Himeji|姫路|34.8268|134.6900
aioi|Aioi|相生|34.8035|134.4650
okayamask|Okayama|岡山|34.6667|133.9181
shinkurashiki|Shin-Kurashiki|新倉敷|34.5857|133.7202
fukuyama|Fukuyama|福山|34.4893|133.3622
shinonomichi|Shin-Onomichi|新尾道|34.4326|133.2004
mihara|Mihara|三原|34.4015|133.0708
higashihiroshima|Higashi-Hiroshima|東広島|34.4290|132.7108
hiroshima|Hiroshima|広島|34.3979|132.4757
shiniwakuni|Shin-Iwakuni|新岩国|34.1708|132.1964
tokuyama|Tokuyama|徳山|34.0480|131.8095
shinyamaguchi|Shin-Yamaguchi|新山口|34.0905|131.3985
asa|Asa|厚狭|34.0233|131.1692
shinshimonoseki|Shin-Shimonoseki|新下関|34.0003|130.9391
kokura|Kokura|小倉|33.8868|130.8827
hakata|Hakata|博多|33.5897|130.4207
shintosu|Shin-Tosu|新鳥栖|33.3800|130.5140
kurume|Kurume|久留米|33.3060|130.5160
chikugofunagoya|Chikugo-Funagoya|筑後船小屋|33.1940|130.4860
shinomuta|Shin-Omuta|新大牟田|33.0500|130.4690
shintamana|Shin-Tamana|新玉名|32.9360|130.5680
kumamoto|Kumamoto|熊本|32.7897|130.6892
shinyatsushiro|Shin-Yatsushiro|新八代|32.5100|130.6200
shinminamata|Shin-Minamata|新水俣|32.2080|130.4030
izumi|Izumi|出水|32.0870|130.3600
satsumasendai|Sendai (Kagoshima)|川内|31.8150|130.3040
kagoshimachuo|Kagoshima-Chuo|鹿児島中央|31.5840|130.5414
takeoonsen|Takeo-Onsen|武雄温泉|33.1940|130.0190
ureshinoonsen|Ureshino-Onsen|嬉野温泉|33.1100|129.9990
shinomura|Shin-Omura|新大村|32.9230|129.9540
isahaya|Isahaya|諫早|32.8430|130.0380
nagasaki|Nagasaki|長崎|32.7523|129.8695
ueno|Ueno|上野|35.7141|139.7774
omiya|Omiya|大宮|35.9066|139.6240
oyamash|Oyama|小山|36.3128|139.8061
utsunomiya|Utsunomiya|宇都宮|36.5594|139.8985
nasushiobara|Nasu-Shiobara|那須塩原|36.9648|140.0404
shinshirakawa|Shin-Shirakawa|新白河|37.1256|140.2219
koriyama|Koriyama|郡山|37.3979|140.3880
fukushimat|Fukushima|福島|37.7541|140.4592
shiroishizao|Shiroishi-Zao|白石蔵王|37.9998|140.6177
sendait|Sendai|仙台|38.2601|140.8821
furukawa|Furukawa|古川|38.5720|140.9564
kurikomakogen|Kurikoma-Kogen|くりこま高原|38.7395|141.0380
ichinoseki|Ichinoseki|一ノ関|38.9346|141.1343
mizusawaesashi|Mizusawa-Esashi|水沢江刺|39.1317|141.1674
kitakami|Kitakami|北上|39.2886|141.1111
shinhanamaki|Shin-Hanamaki|新花巻|39.3920|141.1100
morioka|Morioka|盛岡|39.7017|141.1364
iwatenumakunai|Iwate-Numakunai|いわて沼宮内|40.1700|141.2800
ninohe|Ninohe|二戸|40.2670|141.3073
hachinohe|Hachinohe|八戸|40.5128|141.4372
shichinohetowada|Shichinohe-Towada|七戸十和田|40.6900|141.1900
shinaomori|Shin-Aomori|新青森|40.8272|140.6937
okutsugaruimabetsu|Okutsugaru-Imabetsu|奥津軽いまべつ|41.1552|140.4358
kikonai|Kikonai|木古内|41.4199|140.4382
shinhakodatehokuto|Shin-Hakodate-Hokuto|新函館北斗|41.9055|140.6490
kumagaya|Kumagaya|熊谷|36.1397|139.3880
honjowaseda|Honjo-Waseda|本庄早稲田|36.2302|139.1951
takasaki|Takasaki|高崎|36.3222|139.0128
jomokogen|Jomo-Kogen|上毛高原|36.7210|138.9990
echigoyuzawa|Echigo-Yuzawa|越後湯沢|36.9353|138.8103
urasa|Urasa|浦佐|37.1850|138.8800
nagaoka|Nagaoka|長岡|37.4482|138.8537
tsubamesanjo|Tsubame-Sanjo|燕三条|37.6563|138.9418
niigata|Niigata|新潟|37.9121|139.0616
annakaharuna|Annaka-Haruna|安中榛名|36.3350|138.8570
karuizawa|Karuizawa|軽井沢|36.3426|138.6350
sakudaira|Sakudaira|佐久平|36.2770|138.4730
ueda|Ueda|上田|36.3970|138.2530
nagano|Nagano|長野|36.6431|138.1886
iiyama|Iiyama|飯山|36.8510|138.3660
joetsumyoko|Joetsu-Myoko|上越妙高|37.0370|138.2420
itoigawa|Itoigawa|糸魚川|37.0460|137.8620
kurobeunazuki|Kurobe-Unazukionsen|黒部宇奈月温泉|36.8130|137.4400
toyama|Toyama|富山|36.7014|137.2133
shintakaoka|Shin-Takaoka|新高岡|36.7230|136.9640
kanazawa|Kanazawa|金沢|36.5780|136.6480
komatsu|Komatsu|小松|36.4020|136.4440
kagaonsen|Kaga-Onsen|加賀温泉|36.3280|136.3350
awaraonsen|Awara-Onsen|あわら温泉|36.2150|136.2300
fukui|Fukui|福井|36.0620|136.2230
echizentakefu|Echizen-Takefu|越前たけふ|35.9040|136.1730
tsuruga|Tsuruga|敦賀|35.6540|136.0720
shizukuishi|Shizukuishi|雫石|39.6880|140.9780
tazawako|Tazawako|田沢湖|39.7010|140.6860
kakunodate|Kakunodate|角館|39.5970|140.5640
omagari|Omagari|大曲|39.4590|140.4820
akita|Akita|秋田|39.7172|140.1290
yonezawa|Yonezawa|米沢|37.9120|140.1160
takahata|Takahata|高畠|38.0050|140.1880
akayu|Akayu|赤湯|38.0540|140.1330
kaminoyamaonsen|Kaminoyama-Onsen|かみのやま温泉|38.1460|140.2780
yamagata|Yamagata|山形|38.2480|140.3280
tendo|Tendo|天童|38.3640|140.3770
sakuramboHigashine|Sakurambo-Higashine|さくらんぼ東根|38.4300|140.3930
murayama|Murayama|村山|38.4840|140.3960
oishida|Oishida|大石田|38.5980|140.3790
shinjo|Shinjo|新庄|38.7620|140.3040
`;

  const LINE_SRC = [];
  const SH = (def, stops) => {
    const all = def.st.trim().split(/\s+/), keep = new Set(stops.trim().split(/\s+/));
    const skip = all.filter(id => !keep.has(id)).join(' ');
    LINE_SRC.push(Object.assign({ type: 'shin', grp: 'Shinkansen', nonum: true, dwell: 60 }, def, { skip }));
  };

  const TOK = 'tokyo shinagawa shinyokohama odawara atami mishima shinfuji shizuoka kakegawa hamamatsu toyohashi mikawaanjo nagoya gifuhashima maibara kyoto shinosaka';
  const SAN = 'shinkobe nishiakashi himeji aioi okayamask shinkurashiki fukuyama shinonomichi mihara higashihiroshima hiroshima shiniwakuni tokuyama shinyamaguchi asa shinshimonoseki kokura hakata';
  const KYU = 'shintosu kurume chikugofunagoya shinomuta shintamana kumamoto shinyatsushiro shinminamata izumi satsumasendai kagoshimachuo';
  const TOH = 'tokyo ueno omiya oyamash utsunomiya nasushiobara shinshirakawa koriyama fukushimat shiroishizao sendait furukawa kurikomakogen ichinoseki mizusawaesashi kitakami shinhanamaki morioka';

  // Tokaido / Sanyo / Kyushu
  SH({ id: 'SH_NZ', code: 'NZ', en: 'Nozomi (Tokaido / Sanyo)', ja: 'のぞみ', op: 'JR Central / JR West', color: '#1F6FC8', v: 207, freq: [6, 9, 15], first: 6.0, last: 22.6, dwell: 75,
    st: TOK + ' ' + SAN }, 'tokyo shinagawa shinyokohama nagoya kyoto shinosaka shinkobe okayamask hiroshima kokura hakata');
  SH({ id: 'SH_HI', code: 'HI', en: 'Hikari (Tokyo – Okayama)', ja: 'ひかり', op: 'JR Central / JR West', color: '#6FB1EA', v: 185, freq: [30, 30, 45], first: 6.1, last: 22.0,
    st: TOK + ' shinkobe nishiakashi himeji aioi okayamask' }, 'tokyo shinagawa shinyokohama mishima shizuoka hamamatsu nagoya maibara kyoto shinosaka shinkobe himeji okayamask');
  SH({ id: 'SH_KO', code: 'KD', en: 'Kodama (Tokyo – Shin-Osaka)', ja: 'こだま', op: 'JR Central', color: '#A7CBEA', v: 134, freq: [30, 30, 45], first: 6.0, last: 22.3,
    st: TOK }, TOK);
  SH({ id: 'SH_SK', code: 'KD', en: 'Kodama (Sanyo)', ja: 'こだま(山陽)', op: 'JR West', color: '#C9A64F', v: 143, freq: [30, 30, 60], first: 6.0, last: 22.0,
    st: 'shinosaka ' + SAN }, 'shinosaka ' + SAN);
  SH({ id: 'SH_MZ', code: 'SK', en: 'Mizuho / Sakura (Shin-Osaka – Kagoshima)', ja: 'みずほ・さくら', op: 'JR West / JR Kyushu', color: '#E27A9B', v: 189, freq: [30, 40, 60], first: 6.2, last: 21.0,
    st: 'shinosaka ' + SAN + ' ' + KYU }, 'shinosaka shinkobe himeji okayamask hiroshima kokura hakata shintosu kurume kumamoto satsumasendai kagoshimachuo');
  SH({ id: 'SH_TB', code: 'TB', en: 'Tsubame (Hakata – Kagoshima)', ja: 'つばめ', op: 'JR Kyushu', color: '#D9534F', v: 149, freq: [20, 30, 60], first: 6.0, last: 22.5, dwell: 50,
    st: 'hakata ' + KYU }, 'hakata ' + KYU);
  SH({ id: 'SH_KM', code: 'KM', en: 'Kamome (Nishi-Kyushu)', ja: 'かもめ(西九州)', op: 'JR Kyushu', color: '#B83A3A', v: 124, freq: [30, 60, 60], first: 6.5, last: 21.8, dwell: 45,
    st: 'takeoonsen ureshinoonsen shinomura isahaya nagasaki' }, 'takeoonsen isahaya nagasaki');

  // Tohoku / Hokkaido / Joetsu / Hokuriku / mini-shinkansen branches
  SH({ id: 'SH_HY', code: 'HY', en: 'Hayabusa (Tokyo – Shin-Aomori)', ja: 'はやぶさ', op: 'JR East', color: '#1E9E5A', v: 223, freq: [20, 30, 60], first: 6.0, last: 20.5,
    st: TOH + ' iwatenumakunai ninohe hachinohe shichinohetowada shinaomori' }, 'tokyo ueno omiya utsunomiya sendait morioka hachinohe shinaomori');
  SH({ id: 'SH_YB', code: 'YB', en: 'Yamabiko (Tokyo – Morioka)', ja: 'やまびこ', op: 'JR East', color: '#8FD08B', v: 155, freq: [30, 40, 60], first: 6.0, last: 21.0,
    st: TOH }, 'tokyo ueno omiya utsunomiya koriyama fukushimat sendait furukawa ichinoseki kitakami shinhanamaki morioka');
  SH({ id: 'SH_HD', code: 'HD', en: 'Hokkaido Shinkansen (Hayabusa / Hayate)', ja: '北海道新幹線', op: 'JR Hokkaido', color: '#27A58F', v: 134, freq: [90, 90, 120], first: 6.5, last: 21.0, dwell: 70,
    st: 'shinaomori okutsugaruimabetsu kikonai shinhakodatehokuto' }, 'shinaomori kikonai shinhakodatehokuto');
  SH({ id: 'SH_TK', code: 'TK', en: 'Joetsu Shinkansen (Toki / Tanigawa)', ja: '上越新幹線', op: 'JR East', color: '#E8731F', v: 188, freq: [20, 30, 60], first: 6.0, last: 21.5,
    st: 'tokyo ueno omiya kumagaya honjowaseda takasaki jomokogen echigoyuzawa urasa nagaoka tsubamesanjo niigata' }, 'tokyo ueno omiya takasaki echigoyuzawa nagaoka niigata');
  SH({ id: 'SH_KG', code: 'KG', en: 'Hokuriku Shinkansen (Kagayaki / Hakutaka)', ja: '北陸新幹線', op: 'JR East / JR West', color: '#B8793A', v: 185, freq: [30, 30, 60], first: 6.0, last: 21.5,
    st: 'tokyo ueno omiya kumagaya honjowaseda takasaki annakaharuna karuizawa sakudaira ueda nagano iiyama joetsumyoko itoigawa kurobeunazuki toyama shintakaoka kanazawa komatsu kagaonsen awaraonsen fukui echizentakefu tsuruga' },
    'tokyo ueno omiya takasaki karuizawa ueda nagano toyama kanazawa komatsu fukui tsuruga');
  SH({ id: 'SH_KR', code: 'KR', en: 'Akita Shinkansen (Komachi)', ja: '秋田新幹線', op: 'JR East', color: '#E5304A', v: 88, freq: [60, 60, 90], first: 6.3, last: 20.5, dwell: 60,
    st: 'morioka shizukuishi tazawako kakunodate omagari akita' }, 'morioka tazawako kakunodate omagari akita');
  SH({ id: 'SH_TS', code: 'TS', en: 'Yamagata Shinkansen (Tsubasa)', ja: '山形新幹線', op: 'JR East', color: '#8E5AC6', v: 117, freq: [60, 60, 90], first: 6.3, last: 21.0, dwell: 50,
    st: 'fukushimat yonezawa takahata akayu kaminoyamaonsen yamagata tendo sakuramboHigashine murayama oishida shinjo' }, 'fukushimat yonezawa kaminoyamaonsen yamagata tendo shinjo');

  const POIS = [];
  g.TRS_REGIONS_DATA = g.TRS_REGIONS_DATA || {};
  g.TRS_REGIONS_DATA.shinkansen = { STATION_SRC, LINE_SRC, POIS, WATER: [] };
})(typeof window !== 'undefined' ? window : globalThis);
