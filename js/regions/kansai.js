/* ------------------------------------------------------------------
 * Region data: Kansai (Osaka core, Kyoto–Kobe JR corridor)
 * Hand-authored from memory — station coordinates, colours, numbering
 * and station lists are APPROXIMATE and some lines are missing
 * (e.g. Imazatosuji Line, Hankyu, Hanshin, Keihan, Nankai, Kintetsu).
 * Replace with imported data (see README → nationwide import).
 * ------------------------------------------------------------------ */
(function (g) {
  'use strict';
  const STATION_SRC = `
osaka|Osaka|大阪|34.7015|135.4960
fukushima|Fukushima|福島|34.6971|135.4863
noda|Noda|野田|34.6931|135.4735
nishikujo|Nishikujo|西九条|34.6828|135.4690
bentencho|Bentencho|弁天町|34.6665|135.4627
taisho|Taisho|大正|34.6623|135.4817
ashiharabashi|Ashiharabashi|芦原橋|34.6590|135.4890
imamiya|Imamiya|今宮|34.6545|135.4930
shinimamiya|Shin-Imamiya|新今宮|34.6498|135.5001
tennoji|Tennoji|天王寺|34.6466|135.5140
teradacho|Teradacho|寺田町|34.6521|135.5195
momodani|Momodani|桃谷|34.6577|135.5260
tsuruhashi|Tsuruhashi|鶴橋|34.6655|135.5300
tamatsukuri|Tamatsukuri|玉造|34.6740|135.5320
morinomiya|Morinomiya|森ノ宮|34.6807|135.5330
osakajokoen|Osakajo-koen|大阪城公園|34.6895|135.5340
okyobashi|Kyobashi|京橋|34.6968|135.5345
sakuranomiya|Sakuranomiya|桜ノ宮|34.7050|135.5222
temma|Temma|天満|34.7050|135.5115
esaka|Esaka|江坂|34.7589|135.4978
higashimikuni|Higashi-Mikuni|東三国|34.7439|135.4985
shinosaka|Shin-Osaka|新大阪|34.7334|135.5002
nishinakajimaminamigata|Nishinakajima-Minamigata|西中島南方|34.7245|135.4970
nakatsu|Nakatsu|中津|34.7118|135.4953
umeda|Umeda|梅田|34.7050|135.4990
yodoyabashi|Yodoyabashi|淀屋橋|34.6925|135.5013
hommachi|Hommachi|本町|34.6838|135.5008
shinsaibashi|Shinsaibashi|心斎橋|34.6746|135.5013
namba|Namba|なんば|34.6659|135.5010
daikokucho|Daikokucho|大国町|34.6545|135.4967
dobutsuenmae|Dobutsuen-mae|動物園前|34.6475|135.5066
showacho|Showacho|昭和町|34.6352|135.5170
nishitanabe|Nishitanabe|西田辺|34.6280|135.5190
nagai|Nagai|長居|34.6118|135.5230
abiko|Abiko|あびこ|34.6000|135.5255
kitahanada|Kitahanada|北花田|34.5900|135.5220
shinkanaoka|Shin-Kanaoka|新金岡|34.5700|135.5160
nakamozu|Nakamozu|中百舌鳥|34.5530|135.5090
dainichi|Dainichi|大日|34.7425|135.5665
moriguchi|Moriguchi|守口|34.7345|135.5645
taishibashiimaike|Taishibashi-Imaike|太子橋今市|34.7285|135.5555
sembayashiomiya|Sembayashi-Omiya|千林大宮|34.7220|135.5490
sekimeseiiku|Sekime-Seiiku|関目成育|34.7170|135.5430
noeuchindai|Noe-Uchindai|野江内代|34.7117|135.5382
miyakojima|Miyakojima|都島|34.7090|135.5300
tenroku|Tenjimbashisuji-rokuchome|天神橋筋六丁目|34.7075|135.5200
nakazakicho|Nakazakicho|中崎町|34.7066|135.5100
higashiumeda|Higashi-Umeda|東梅田|34.7013|135.5006
minamimorimachi|Minamimorimachi|南森町|34.6973|135.5126
tenmabashi|Tenmabashi|天満橋|34.6923|135.5213
tanimachi4|Tanimachi-Yonchome|谷町四丁目|34.6818|135.5224
tanimachi6|Tanimachi-Rokuchome|谷町六丁目|34.6743|135.5222
tanimachi9|Tanimachi-Kyuchome|谷町九丁目|34.6669|135.5228
shitennojimae|Shitennoji-mae Yuhigaoka|四天王寺前夕陽ヶ丘|34.6598|135.5195
abeno|Abeno|阿倍野|34.6390|135.5140
fuminosato|Fuminosato|文の里|34.6320|135.5150
tanabe|Tanabe|田辺|34.6250|135.5190
komagawanakano|Komagawa-Nakano|駒川中野|34.6165|135.5225
hirano|Hirano|平野|34.6130|135.5400
kireuriwari|Kire-Uriwari|喜連瓜破|34.6030|135.5530
deto|Deto|出戸|34.5930|135.5640
nagahara|Nagahara|長原|34.5870|135.5720
yaominami|Yao-minami|八尾南|34.5805|135.5840
nishiumeda|Nishi-Umeda|西梅田|34.6985|135.4950
higobashi|Higobashi|肥後橋|34.6918|135.4950
yotsubashi|Yotsubashi|四ツ橋|34.6755|135.4975
hanazonocho|Hanazonocho|花園町|34.6476|135.4912
kishinosato|Kishinosato|岸里|34.6393|135.4900
tamade|Tamade|玉出|34.6288|135.4883
kitakagaya|Kitakagaya|北加賀屋|34.6197|135.4770
suminoekoen|Suminoekoen|住之江公園|34.6097|135.4660
cosmosquare|Cosmosquare|コスモスクエア|34.6395|135.4125
osakako|Osakako|大阪港|34.6545|135.4285
asashiobashi|Asashiobashi|朝潮橋|34.6590|135.4455
kujo|Kujo|九条|34.6764|135.4770
awaza|Awaza|阿波座|34.6800|135.4905
sakaisujihommachi|Sakaisuji-Hommachi|堺筋本町|34.6830|135.5100
midoribashi|Midoribashi|緑橋|34.6835|135.5440
fukaebashi|Fukaebashi|深江橋|34.6850|135.5530
takaida|Takaida|高井田|34.6860|135.5630
nagata|Nagata|長田|34.6865|135.5760
nodahanshin|Noda-Hanshin|野田阪神|34.6930|135.4770
otamagawa|Tamagawa|玉川|34.6870|135.4840
nishinagahori|Nishinagahori|西長堀|34.6740|135.4880
sakuragawa|Sakuragawa|桜川|34.6690|135.4915
onihombashi|Nippombashi|日本橋|34.6660|135.5063
imazato|Imazato|今里|34.6710|135.5400
shinfukae|Shin-Fukae|新深江|34.6730|135.5480
shoji|Shoji|小路|34.6735|135.5560
kitatatsumi|Kita-Tatsumi|北巽|34.6690|135.5640
minamitatsumi|Minami-Tatsumi|南巽|34.6640|135.5650
ogimachi|Ogimachi|扇町|34.7040|135.5130
kitahama|Kitahama|北浜|34.6900|135.5180
nagahoribashi|Nagahoribashi|長堀橋|34.6755|135.5100
ebisucho|Ebisucho|恵美須町|34.6554|135.5060
tengachaya|Tengachaya|天下茶屋|34.6370|135.4985
domemaechiyozaki|Dome-mae Chiyozaki|ドーム前千代崎|34.6665|135.4855
nishiohashi|Nishi-Ohashi|西大橋|34.6750|135.4955
matsuyamachi|Matsuyamachi|松屋町|34.6765|135.5140
osakabusinesspark|Osaka Business Park|大阪ビジネスパーク|34.6905|135.5375
gamoyonchome|Gamo-Yonchome|蒲生四丁目|34.7010|135.5450
imafukutsurumi|Imafuku-Tsurumi|今福鶴見|34.7050|135.5560
yokozutsumi|Yokozutsumi|横堤|34.7075|135.5640
tsurumiryokuchi|Tsurumi-ryokuchi|鶴見緑地|34.7110|135.5755
kadomaminami|Kadoma-minami|門真南|34.7120|135.5860
kyoto|Kyoto|京都|34.9858|135.7588
takatsuki|Takatsuki|高槻|34.8510|135.6165
ibaraki|Ibaraki|茨木|34.8160|135.5680
amagasaki|Amagasaki|尼崎|34.7240|135.4170
nishinomiya|Nishinomiya|西宮|34.7386|135.3405
ashiya|Ashiya|芦屋|34.7295|135.3040
osumiyoshi|Sumiyoshi|住吉|34.7236|135.2650
rokkomichi|Rokkomichi|六甲道|34.7260|135.2380
sannomiya|Sannomiya|三ノ宮|34.6945|135.1950
kobe|Kobe|神戸|34.6790|135.1790
`;
  const LINE_SRC = [];
  const J = o => LINE_SRC.push(o);
  const JW = { type: 'jr', grp: 'JR West', op: 'JR West' };
  const OM = { type: 'metro', grp: 'Osaka Metro', op: 'Osaka Metro' };

  J(Object.assign({ id: 'OJ', code: 'O', en: 'Osaka Loop Line', ja: '大阪環状線', color: '#F2602F', loop: true, dirs: ['Inner loop 内回り', 'Outer loop 外回り'], pill: ['内', '外'], ccw0: false,
    v: 44, dwell: 25, freq: [3, 4.5, 7], first: 4.9, last: 24.4,
    st: 'osaka:1 fukushima noda nishikujo bentencho taisho ashiharabashi imamiya shinimamiya tennoji teradacho momodani tsuruhashi tamatsukuri morinomiya osakajokoen okyobashi sakuranomiya temma' }, JW));
  J(Object.assign({ id: 'JKY', code: 'A', en: 'JR Kyoto/Kobe Line (Rapid)', ja: 'JR京都線・神戸線(新快速)', color: '#0072BC', v: 95, dwell: 25, freq: [5, 8, 12], first: 5.0, last: 24.3,
    st: 'kyoto:1 takatsuki ibaraki shinosaka osaka amagasaki nishinomiya ashiya osumiyoshi rokkomichi sannomiya kobe' }, JW));
  J(Object.assign({ id: 'OM', code: 'M', en: 'Osaka Metro Midosuji Line', ja: '大阪メトロ御堂筋線', color: '#E5171F', v: 42, dwell: 25, freq: [2.5, 4, 6], first: 5.0, last: 24.4,
    st: 'esaka:11 higashimikuni shinosaka nishinakajimaminamigata nakatsu umeda yodoyabashi hommachi shinsaibashi namba daikokucho dobutsuenmae tennoji showacho nishitanabe nagai abiko kitahanada shinkanaoka nakamozu' }, OM));
  J(Object.assign({ id: 'OT', code: 'T', en: 'Osaka Metro Tanimachi Line', ja: '大阪メトロ谷町線', color: '#522886', v: 40, dwell: 22, freq: [3, 5, 8], first: 5.0, last: 24.3,
    st: 'dainichi:11 moriguchi taishibashiimaike sembayashiomiya sekimeseiiku noeuchindai miyakojima tenroku nakazakicho higashiumeda minamimorimachi tenmabashi tanimachi4 tanimachi6 tanimachi9 shitennojimae tennoji abeno fuminosato tanabe komagawanakano hirano kireuriwari deto nagahara yaominami' }, OM));
  J(Object.assign({ id: 'OY', code: 'Y', en: 'Osaka Metro Yotsubashi Line', ja: '大阪メトロ四つ橋線', color: '#0078BA', v: 38, dwell: 22, freq: [4, 6, 9], first: 5.1, last: 24.3,
    st: 'nishiumeda:11 higobashi hommachi yotsubashi namba daikokucho hanazonocho kishinosato tamade kitakagaya suminoekoen' }, OM));
  J(Object.assign({ id: 'OC', code: 'C', en: 'Osaka Metro Chuo Line', ja: '大阪メトロ中央線', color: '#019A66', v: 42, dwell: 22, freq: [3.5, 5, 8], first: 5.0, last: 24.3,
    st: 'cosmosquare:10 osakako asashiobashi bentencho kujo awaza hommachi sakaisujihommachi tanimachi4 morinomiya midoribashi fukaebashi takaida nagata' }, OM));
  J(Object.assign({ id: 'OS', code: 'S', en: 'Osaka Metro Sennichimae Line', ja: '大阪メトロ千日前線', color: '#E44D93', v: 38, dwell: 22, freq: [4, 6, 9], first: 5.1, last: 24.2,
    st: 'nodahanshin:11 otamagawa awaza nishinagahori sakuragawa namba onihombashi tanimachi9 tsuruhashi imazato shinfukae shoji kitatatsumi minamitatsumi' }, OM));
  J(Object.assign({ id: 'OK', code: 'K', en: 'Osaka Metro Sakaisuji Line', ja: '大阪メトロ堺筋線', color: '#814721', v: 40, dwell: 22, freq: [5, 7, 10], first: 5.1, last: 24.2,
    st: 'tenroku:11 ogimachi minamimorimachi kitahama sakaisujihommachi nagahoribashi onihombashi ebisucho dobutsuenmae tengachaya' }, OM));
  J(Object.assign({ id: 'ON', code: 'N', en: 'Osaka Metro Nagahori Tsurumi-ryokuchi Line', ja: '大阪メトロ長堀鶴見緑地線', color: '#A9CC51', v: 38, dwell: 22, freq: [4, 6, 9], first: 5.1, last: 24.2,
    st: 'taisho:11 domemaechiyozaki nishinagahori nishiohashi shinsaibashi nagahoribashi matsuyamachi tanimachi6 tamatsukuri morinomiya osakabusinesspark okyobashi gamoyonchome imafukutsurumi yokozutsumi tsurumiryokuchi kadomaminami' }, OM));

  const POIS = [
    { id: 'osakajo', en: 'Osaka Castle', ja: '大阪城', lat: 34.6873, lon: 135.5262, cat: 'landmark', emoji: '🏯', desc: 'Reconstructed 16th-century castle with a museum and a large moated park.' },
    { id: 'dotonbori', en: 'Dotonbori', ja: '道頓堀', lat: 34.6687, lon: 135.5013, cat: 'shop', emoji: '🦀', desc: 'Neon canal-side food street — takoyaki, okonomiyaki and the Glico sign.' },
    { id: 'tsutenkaku', en: 'Tsutenkaku Tower', ja: '通天閣', lat: 34.6525, lon: 135.5063, cat: 'landmark', emoji: '🗼', desc: 'Retro tower in the Shinsekai district.' },
    { id: 'harukas', en: 'Abeno Harukas', ja: 'あべのハルカス', lat: 34.6460, lon: 135.5139, cat: 'landmark', emoji: '🏙️', desc: 'One of Japan’s tallest skyscrapers, with an observation deck.' },
    { id: 'umedasky', en: 'Umeda Sky Building', ja: '梅田スカイビル', lat: 34.7054, lon: 135.4900, cat: 'landmark', emoji: '🌇', desc: 'Twin towers joined by a floating garden observatory.' },
    { id: 'kaiyukan', en: 'Osaka Aquarium Kaiyukan', ja: '海遊館', lat: 34.6545, lon: 135.4290, cat: 'fun', emoji: '🐋', desc: 'Huge aquarium centred on a whale-shark tank.' },
    { id: 'usj', en: 'Universal Studios Japan', ja: 'ユニバーサル・スタジオ・ジャパン', lat: 34.6654, lon: 135.4323, cat: 'fun', emoji: '🎢', desc: 'Theme park on the Osaka bay front (reached via the JR Yumesaki Line, not yet on this map).' },
    { id: 'shitennoji', en: 'Shitenno-ji', ja: '四天王寺', lat: 34.6544, lon: 135.5167, cat: 'shrine', emoji: '⛩️', desc: 'One of Japan’s oldest Buddhist temples, founded in 593.' },
    { id: 'kyototower', en: 'Kyoto Tower', ja: '京都タワー', lat: 34.9875, lon: 135.7590, cat: 'landmark', emoji: '🗼', desc: 'Lighthouse-shaped tower opposite Kyoto Station.' },
    { id: 'fushimiinari', en: 'Fushimi Inari Taisha', ja: '伏見稲荷大社', lat: 34.9671, lon: 135.7727, cat: 'shrine', emoji: '⛩️', desc: 'Thousands of vermilion torii gates up the mountain (JR Nara Line, not yet on this map).' },
    { id: 'kobeport', en: 'Kobe Port Tower', ja: '神戸ポートタワー', lat: 34.6821, lon: 135.1868, cat: 'landmark', emoji: '🗼', desc: 'Red lattice tower on the Kobe waterfront.' },
    { id: 'harborland', en: 'Kobe Harborland', ja: '神戸ハーバーランド', lat: 34.6780, lon: 135.1840, cat: 'fun', emoji: '🎡', desc: 'Waterfront shopping and dining district.' }
  ];

  // very rough Osaka Bay outline [lat, lon]
  const WATER = [[[34.700, 135.350], [34.670, 135.420], [34.650, 135.425], [34.620, 135.425], [34.580, 135.440], [34.540, 135.410], [34.500, 135.350], [34.440, 135.270], [34.380, 135.190], [34.320, 135.120], [34.300, 135.050], [34.450, 135.000], [34.560, 134.990], [34.640, 135.000], [34.655, 135.100], [34.668, 135.190], [34.690, 135.280]]];

  g.TRS_REGIONS_DATA = g.TRS_REGIONS_DATA || {};
  g.TRS_REGIONS_DATA.kansai = { STATION_SRC, LINE_SRC, POIS, WATER };
})(typeof window !== 'undefined' ? window : globalThis);
