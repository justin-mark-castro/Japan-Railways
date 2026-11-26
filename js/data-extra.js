/* ------------------------------------------------------------------
 * Additional lines (JR East extras, private railways, Yurikamome, Monorail)
 * Hand-authored from memory: coordinates, colours and station numbers are
 * approximate and should be replaced/verified with ODPT data.
 * Station token "id:-" = line passes through without stopping.
 * ------------------------------------------------------------------ */
(function (g) {
  'use strict';
  const D = g.TRS_DATA;

  D.STATION_SRC += `
itabashi|Itabashi|板橋|35.7459|139.7185
jujo|Jujo|十条|35.7626|139.7203
kitaakabane|Kita-Akabane|北赤羽|35.7872|139.7135
ukimafunado|Ukima-Funado|浮間舟渡|35.7915|139.7000
todakoen|Toda-koen|戸田公園|35.7985|139.6790
toda|Toda|戸田|35.8076|139.6670
kitatoda|Kita-Toda|北戸田|35.8165|139.6540
musashiurawa|Musashi-Urawa|武蔵浦和|35.8470|139.6385
kameari|Kameari|亀有|35.7681|139.8473
kanamachi|Kanamachi|金町|35.7692|139.8668
matsudo|Matsudo|松戸|35.7843|139.9019
nishioi|Nishi-Oi|西大井|35.6029|139.7231
musashikosugi|Musashi-Kosugi|武蔵小杉|35.5761|139.6597
shinkawasaki|Shin-Kawasaki|新川崎|35.5560|139.6560
shinnihombashi|Shin-Nihombashi|新日本橋|35.6877|139.7745
bakurocho|Bakurocho|馬喰町|35.6920|139.7833
etchujima|Etchujima|越中島|35.6667|139.7928
shiomi|Shiomi|潮見|35.6538|139.8168
kasairinkaikoen|Kasai-Rinkai-Koen|葛西臨海公園|35.6438|139.8603
maihama|Maihama|舞浜|35.6362|139.8836
shinurayasu|Shin-Urayasu|新浦安|35.6516|139.9086
ichikawashiohama|Ichikawa-Shiohama|市川塩浜|35.6633|139.9313
futamatashimmachi|Futamata-Shimmachi|二俣新町|35.6685|139.9560
minamifunabashi|Minami-Funabashi|南船橋|35.6810|139.9795
shinnarashino|Shin-Narashino|新習志野|35.6645|140.0245
kaihinmakuhari|Kaihin-Makuhari|海浜幕張|35.6486|140.0397
sasazuka|Sasazuka|笹塚|35.6733|139.6670
daitabashi|Daitabashi|代田橋|35.6718|139.6597
meidaimae|Meidaimae|明大前|35.6690|139.6500
shimotakaido|Shimo-Takaido|下高井戸|35.6674|139.6407
sakurajosui|Sakurajosui|桜上水|35.6667|139.6320
kamikitazawa|Kami-Kitazawa|上北沢|35.6670|139.6230
hachimanyama|Hachimanyama|八幡山|35.6670|139.6120
rokakoen|Roka-koen|芦花公園|35.6670|139.6030
chitosekarasuyama|Chitose-Karasuyama|千歳烏山|35.6665|139.5965
sengawa|Sengawa|仙川|35.6615|139.5850
tsutsujigaoka|Tsutsujigaoka|つつじヶ丘|35.6590|139.5735
shibasaki|Shibasaki|柴崎|35.6558|139.5610
kokuryo|Kokuryo|国領|35.6525|139.5520
chofu|Chofu|調布|35.6519|139.5442
shinsen|Shinsen|神泉|35.6563|139.6930
komabatodaimae|Komaba-Todaimae|駒場東大前|35.6583|139.6832
ikenoue|Ikenoue|池ノ上|35.6618|139.6763
shimokitazawa|Shimo-Kitazawa|下北沢|35.6613|139.6680
shindaita|Shin-Daita|新代田|35.6640|139.6610
higashimatsubara|Higashi-Matsubara|東松原|35.6674|139.6551
hamadayama|Hamadayama|浜田山|35.6720|139.6440
eifukucho|Eifukucho|永福町|35.6760|139.6390
nishieifuku|Nishi-Eifuku|西永福|35.6790|139.6320
takaido|Takaido|高井戸|35.6820|139.6230
fujimigaoka|Fujimigaoka|富士見ヶ丘|35.6850|139.6120
kugayama|Kugayama|久我山|35.6880|139.6030
mitakadai|Mitakadai|三鷹台|35.6910|139.5930
inokashirakoen|Inokashira-koen|井の頭公園|35.6970|139.5830
minamishinjuku|Minami-Shinjuku|南新宿|35.6845|139.6985
sangubashi|Sangubashi|参宮橋|35.6806|139.6933
yoyogihachiman|Yoyogi-Hachiman|代々木八幡|35.6710|139.6860
higashikitazawa|Higashi-Kitazawa|東北沢|35.6640|139.6740
setagayadaita|Setagaya-Daita|世田谷代田|35.6600|139.6600
umegaoka|Umegaoka|梅ヶ丘|35.6525|139.6520
gotokuji|Gotokuji|豪徳寺|35.6482|139.6469
kyodo|Kyodo|経堂|35.6466|139.6392
soshigayaokura|Soshigaya-Okura|祖師ヶ谷大蔵|35.6439|139.6240
seijogakuenmae|Seijogakuen-mae|成城学園前|35.6429|139.6060
kitami|Kitami|喜多見|35.6400|139.5920
komae|Komae|狛江|35.6350|139.5780
izumitamagawa|Izumi-Tamagawa|和泉多摩川|35.6326|139.5700
daikanyama|Daikanyama|代官山|35.6488|139.7030
yutenji|Yutenji|祐天寺|35.6379|139.6914
gakugeidaigaku|Gakugei-daigaku|学芸大学|35.6285|139.6849
toritsudaigaku|Toritsu-daigaku|都立大学|35.6174|139.6783
jiyugaoka|Jiyugaoka|自由が丘|35.6075|139.6697
denenchofu|Denen-chofu|田園調布|35.5966|139.6685
tamagawa|Tamagawa|多摩川|35.5906|139.6687
shinmaruko|Shin-Maruko|新丸子|35.5816|139.6640
motosumiyoshi|Motosumiyoshi|元住吉|35.5655|139.6563
hiyoshi|Hiyoshi|日吉|35.5537|139.6465
tsunashima|Tsunashima|綱島|35.5375|139.6344
okurayama|Okurayama|大倉山|35.5170|139.6307
kikuna|Kikuna|菊名|35.5095|139.6325
myorenji|Myorenji|妙蓮寺|35.4953|139.6277
hakuraku|Hakuraku|白楽|35.4830|139.6190
higashihakuraku|Higashi-Hakuraku|東白楽|35.4780|139.6205
ikejiriohashi|Ikejiri-Ohashi|池尻大橋|35.6504|139.6852
sangenjaya|Sangenjaya|三軒茶屋|35.6435|139.6700
komazawadaigaku|Komazawa-Daigaku|駒沢大学|35.6337|139.6620
sakurashimmachi|Sakura-Shimmachi|桜新町|35.6310|139.6483
yoga|Yoga|用賀|35.6268|139.6340
futakotamagawa|Futako-Tamagawa|二子玉川|35.6115|139.6269
futakoshinchi|Futako-Shinchi|二子新地|35.6090|139.6190
takatsu|Takatsu|高津|35.6030|139.6130
mizonokuchi|Mizonokuchi|溝の口|35.5999|139.6090
kajigaya|Kajigaya|梶が谷|35.5918|139.5995
miyazakidai|Miyazakidai|宮崎台|35.5865|139.5865
miyamaedaira|Miyamaedaira|宮前平|35.5810|139.5750
saginuma|Saginuma|鷺沼|35.5745|139.5651
tamaplaza|Tama-Plaza|たまプラーザ|35.5754|139.5525
fudomae|Fudomae|不動前|35.6260|139.7075
musashikoyama|Musashi-Koyama|武蔵小山|35.6205|139.7042
nishikoyama|Nishi-Koyama|西小山|35.6154|139.6992
senzoku|Senzoku|洗足|35.6122|139.6925
okayama|Okayama|大岡山|35.6075|139.6845
okusawa|Okusawa|奥沢|35.6030|139.6760
kitashinagawa|Kita-Shinagawa|北品川|35.6196|139.7388
shimbamba|Shimbamba|新馬場|35.6140|139.7402
aomonoyokocho|Aomono-Yokocho|青物横丁|35.6060|139.7385
samezu|Samezu|鮫洲|35.6000|139.7390
tachiaigawa|Tachiaigawa|立会川|35.5942|139.7385
omorikaigan|Omori-Kaigan|大森海岸|35.5885|139.7370
heiwajima|Heiwajima|平和島|35.5826|139.7345
omorimachi|Omorimachi|大森町|35.5748|139.7347
umeyashiki|Umeyashiki|梅屋敷|35.5693|139.7320
keikyukamata|Keikyu-Kamata|京急蒲田|35.5620|139.7287
kojiya|Kojiya|糀谷|35.5610|139.7380
otorii|Otorii|大鳥居|35.5570|139.7480
anamoriinari|Anamori-Inari|穴守稲荷|35.5532|139.7545
tenkubashi|Tenkubashi|天空橋|35.5490|139.7600
hanedat3|Haneda Airport Terminal 3|羽田空港第3ターミナル|35.5481|139.7681
hanedat12|Haneda Airport Terminal 1・2|羽田空港第1・第2ターミナル|35.5496|139.7855
tokyoskytree|Tokyo Skytree|とうきょうスカイツリー|35.7103|139.8095
hikifune|Hikifune|曳舟|35.7181|139.8165
higashimukojima|Higashi-Mukojima|東向島|35.7222|139.8200
kanegafuchi|Kanegafuchi|鐘ヶ淵|35.7300|139.8190
horikiri|Horikiri|堀切|35.7370|139.8200
ushida|Ushida|牛田|35.7410|139.8130
kosuge|Kosuge|小菅|35.7570|139.8105
gotanno|Gotanno|五反野|35.7650|139.8060
umejima|Umejima|梅島|35.7712|139.7985
nishiarai|Nishiarai|西新井|35.7771|139.7903
aoi|Aoi|青井|35.7836|139.8226
rokucho|Rokucho|六町|35.7943|139.8288
yashio|Yashio|八潮|35.8063|139.8397
kitaikebukuro|Kita-Ikebukuro|北池袋|35.7403|139.7115
shimoitabashi|Shimo-Itabashi|下板橋|35.7455|139.7035
oyama|Oyama|大山|35.7500|139.6970
nakaitabashi|Naka-Itabashi|中板橋|35.7540|139.6870
tokiwadai|Tokiwadai|ときわ台|35.7563|139.6781
kamiitabashi|Kami-Itabashi|上板橋|35.7620|139.6660
tobunerima|Tobu-Nerima|東武練馬|35.7692|139.6540
shimoakatsuka|Shimo-Akatsuka|下赤塚|35.7765|139.6420
narimasu|Narimasu|成増|35.7760|139.6300
wakoshi|Wakoshi|和光市|35.7886|139.6125
seibushinjuku|Seibu-Shinjuku|西武新宿|35.6962|139.7003
shimoochiai|Shimo-Ochiai|下落合|35.7165|139.6875
nakai|Nakai|中井|35.7180|139.6830
araiyakushimae|Arai-yakushi-mae|新井薬師前|35.7165|139.6700
numabukuro|Numabukuro|沼袋|35.7160|139.6550
nogata|Nogata|野方|35.7185|139.6430
toritsukasei|Toritsu-Kasei|都立家政|35.7190|139.6330
saginomiya|Saginomiya|鷺ノ宮|35.7195|139.6230
shimoigusa|Shimo-Igusa|下井草|35.7195|139.6120
igusa|Igusa|井荻|35.7195|139.6020
shiinamachi|Shiinamachi|椎名町|35.7289|139.6968
higashinagasaki|Higashi-Nagasaki|東長崎|35.7300|139.6860
ekoda|Ekoda|江古田|35.7366|139.6714
sakuradai|Sakuradai|桜台|35.7380|139.6600
nerima|Nerima|練馬|35.7378|139.6541
nakamurabashi|Nakamurabashi|中村橋|35.7370|139.6430
fujimidai|Fujimidai|富士見台|35.7370|139.6320
nerimatakanodai|Nerima-Takanodai|練馬高野台|35.7370|139.6180
shakujiikoen|Shakujii-koen|石神井公園|35.7370|139.6015
takeshiba|Takeshiba|竹芝|35.6552|139.7625
hinode|Hinode|日の出|35.6490|139.7640
shibaurafuto|Shibaura-futo|芝浦ふ頭|35.6440|139.7625
odaibakaihinkoen|Odaiba-kaihinkoen|お台場海浜公園|35.6300|139.7750
daiba|Daiba|台場|35.6275|139.7790
tokyoteleport|Tokyo Teleport|東京テレポート|35.6270|139.7840
aomi|Aomi|青海|35.6255|139.7895
telecomcenter|Telecom Center|テレコムセンター|35.6258|139.7935
kokusaitenjijo|Kokusai-Tenjijo|国際展示場|35.6300|139.7970
ariake|Ariake|有明|35.6350|139.7930
ariaketennisnomori|Ariake-Tennis-no-Mori|有明テニスの森|35.6400|139.7930
shijomae|Shijo-mae|市場前|35.6450|139.7905
shintoyosu|Shin-Toyosu|新豊洲|35.6480|139.7915
tennozuisle|Tennozu Isle|天王洲アイル|35.6218|139.7458
oikeibajomae|Oi-Keibajo-mae|大井競馬場前|35.5925|139.7472
showajima|Showajima|昭和島|35.5810|139.7490
seibijomae|Seibijo-mae|整備場|35.5560|139.7570
`;

  const J = (o) => D.LINE_SRC.push(o);
  const PV = { type: 'pvt', grp: 'Private & Others' };

  // ---- JR East extras ----
  J({ id: 'JA', code: 'JA', type: 'jr', op: 'JR East', en: 'Saikyo Line', ja: '埼京線', color: '#00AC9A', v: 60, dwell: 28, freq: [3.5, 6, 10], first: 4.8, last: 24.5,
    st: 'osaki:8 gotanda:- meguro:- ebisu:9 shibuya:10 harajuku:- yoyogi:- shinjuku:11 shinokubo:- takadanobaba:- mejiro:- ikebukuro:12 itabashi:13 jujo:14 akabane:15 kitaakabane:16 ukimafunado:17 todakoen:18 toda:19 kitatoda:20 musashiurawa:21' });
  J({ id: 'JJ', code: 'JJ', type: 'jr', op: 'JR East', en: 'Joban Line (Rapid)', ja: '常磐線(快速)', color: '#00B261', v: 65, dwell: 28, freq: [4, 6, 10], first: 4.9, last: 24.4,
    st: 'ueno:1 nippori:2 mikawashima:- minamisenju:4 kitasenju:5 ayase:6 kameari:7 kanamachi:8 matsudo:9' });
  J({ id: 'JT', code: 'JT', type: 'jr', op: 'JR East', en: 'Tokaido Line', ja: '東海道線', color: '#F68B1E', v: 75, dwell: 30, freq: [5, 9, 14], first: 5.0, last: 24.3,
    st: 'tokyo:1 yurakucho:- shimbashi:2 hamamatsucho:- tamachi:- takanawagw:- shinagawa:3 kawasaki:4 yokohama:5' });
  J({ id: 'JOY', code: 'JO', type: 'jr', op: 'JR East', en: 'Yokosuka Line', ja: '横須賀線', color: '#0067C0', v: 70, dwell: 28, freq: [6, 10, 15], first: 5.0, last: 24.3,
    st: 'tokyo:19 yurakucho:- shimbashi:18 hamamatsucho:- tamachi:- takanawagw:- shinagawa:17 nishioi:16 musashikosugi:15 shinkawasaki:14 yokohama:13' });
  J({ id: 'JOS', code: 'JO', type: 'jr', op: 'JR East', en: 'Sobu Line (Rapid)', ja: '総武線(快速)', color: '#1478CC', v: 65, dwell: 28, freq: [4, 7, 12], first: 4.9, last: 24.4,
    st: 'tokyo:19 shinnihombashi:20 bakurocho:21 kinshicho:22 kameido:- hirai:- shinkoiwa:23 koiwa:- ichikawa:24 motoyawata:- shimosanakayama:- nishifunabashi:- funabashi:25' });
  J({ id: 'JE', code: 'JE', type: 'jr', op: 'JR East', en: 'Keiyo Line', ja: '京葉線', color: '#C9242F', v: 70, dwell: 28, freq: [4, 7, 11], first: 5.0, last: 24.4,
    st: 'tokyo:1 hatchobori:2 etchujima:3 shiomi:4 shinkiba:5 kasairinkaikoen:6 maihama:7 shinurayasu:8 ichikawashiohama:9 futamatashimmachi:10 minamifunabashi:11 shinnarashino:12 kaihinmakuhari:13' });

  // ---- Private railways & others ----
  J(Object.assign({ id: 'KO', code: 'KO', op: 'Keio', en: 'Keio Line', ja: '京王線', color: '#DD0077', v: 55, dwell: 24, freq: [3.5, 6, 10], first: 4.9, last: 24.5,
    st: 'shinjuku:1 sasazuka daitabashi meidaimae shimotakaido sakurajosui kamikitazawa hachimanyama rokakoen chitosekarasuyama sengawa tsutsujigaoka shibasaki kokuryo chofu' }, PV));
  J(Object.assign({ id: 'IN', code: 'IN', op: 'Keio', en: 'Keio Inokashira Line', ja: '京王井の頭線', color: '#00A0DE', v: 45, dwell: 22, freq: [3, 5, 9], first: 4.9, last: 24.5,
    st: 'shibuya:1 shinsen komabatodaimae ikenoue shimokitazawa shindaita higashimatsubara meidaimae hamadayama eifukucho nishieifuku takaido fujimigaoka kugayama mitakadai inokashirakoen kichijoji' }, PV));
  J(Object.assign({ id: 'OH', code: 'OH', op: 'Odakyu', en: 'Odakyu Odawara Line', ja: '小田急小田原線', color: '#1B6FB5', v: 58, dwell: 24, freq: [3.5, 6, 10], first: 4.9, last: 24.5,
    st: 'shinjuku:1 minamishinjuku sangubashi yoyogihachiman yoyogiuehara higashikitazawa shimokitazawa setagayadaita umegaoka gotokuji kyodo soshigayaokura seijogakuenmae kitami komae izumitamagawa' }, PV));
  J(Object.assign({ id: 'TY', code: 'TY', op: 'Tokyu', en: 'Tokyu Toyoko Line', ja: '東急東横線', color: '#DA0442', v: 55, dwell: 24, freq: [3, 5, 9], first: 4.9, last: 24.5,
    st: 'shibuya:1 daikanyama nakameguro yutenji gakugeidaigaku toritsudaigaku jiyugaoka denenchofu tamagawa shinmaruko musashikosugi motosumiyoshi hiyoshi tsunashima okurayama kikuna myorenji hakuraku higashihakuraku yokohama:21' }, PV));
  J(Object.assign({ id: 'DT', code: 'DT', op: 'Tokyu', en: 'Tokyu Den-en-toshi Line', ja: '東急田園都市線', color: '#00A040', v: 55, dwell: 24, freq: [3, 5, 9], first: 4.9, last: 24.5,
    st: 'shibuya:1 ikejiriohashi sangenjaya komazawadaigaku sakurashimmachi yoga futakotamagawa futakoshinchi takatsu mizonokuchi kajigaya miyazakidai miyamaedaira saginuma tamaplaza' }, PV));
  J(Object.assign({ id: 'MG', code: 'MG', op: 'Tokyu', en: 'Tokyu Meguro Line', ja: '東急目黒線', color: '#009CD2', v: 50, dwell: 22, freq: [3.5, 6, 10], first: 4.9, last: 24.5,
    st: 'meguro:1 fudomae musashikoyama nishikoyama senzoku okayama okusawa denenchofu tamagawa shinmaruko musashikosugi motosumiyoshi hiyoshi' }, PV));
  J(Object.assign({ id: 'KK', code: 'KK', op: 'Keikyu', en: 'Keikyu Line (Airport)', ja: '京急線(空港線)', color: '#E60012', v: 62, dwell: 24, freq: [4, 7, 12], first: 4.9, last: 24.5,
    st: 'shinagawa:1 kitashinagawa shimbamba aomonoyokocho samezu tachiaigawa omorikaigan heiwajima omorimachi umeyashiki keikyukamata kojiya:12 otorii anamoriinari tenkubashi hanedat3:16 hanedat12:17' }, PV));
  J(Object.assign({ id: 'TS', code: 'TS', op: 'Tobu', en: 'Tobu Skytree Line', ja: '東武スカイツリーライン', color: '#0F6CB6', v: 55, dwell: 24, freq: [4, 7, 11], first: 4.9, last: 24.5,
    st: 'asakusa:1 tokyoskytree hikifune higashimukojima kanegafuchi horikiri ushida kitasenju kosuge gotanno umejima nishiarai' }, PV));
  J(Object.assign({ id: 'TJ', code: 'TJ', op: 'Tobu', en: 'Tobu Tojo Line', ja: '東武東上線', color: '#0A5CA8', v: 55, dwell: 24, freq: [4, 7, 11], first: 4.9, last: 24.5,
    st: 'ikebukuro:1 kitaikebukuro shimoitabashi oyama nakaitabashi tokiwadai kamiitabashi tobunerima shimoakatsuka narimasu wakoshi' }, PV));
  J(Object.assign({ id: 'SS', code: 'SS', op: 'Seibu', en: 'Seibu Shinjuku Line', ja: '西武新宿線', color: '#00A0E9', v: 50, dwell: 22, freq: [4, 7, 11], first: 4.9, last: 24.5,
    st: 'seibushinjuku:1 takadanobaba shimoochiai nakai araiyakushimae numabukuro nogata toritsukasei saginomiya shimoigusa igusa' }, PV));
  J(Object.assign({ id: 'SI', code: 'SI', op: 'Seibu', en: 'Seibu Ikebukuro Line', ja: '西武池袋線', color: '#F08300', v: 52, dwell: 22, freq: [4, 7, 11], first: 4.9, last: 24.5,
    st: 'ikebukuro:1 shiinamachi higashinagasaki ekoda sakuradai nerima nakamurabashi fujimidai nerimatakanodai shakujiikoen' }, PV));
  J(Object.assign({ id: 'TX', code: 'TX', op: 'Tsukuba Express', en: 'Tsukuba Express', ja: 'つくばエクスプレス', color: '#E5006D', v: 70, dwell: 24, freq: [5, 8, 12], first: 5.0, last: 24.3,
    st: 'akihabara:1 shinokachimachi:2 asakusa:3 minamisenju:4 kitasenju:5 aoi:6 rokucho:7 yashio:8' }, PV));
  J(Object.assign({ id: 'U', code: 'U', op: 'Yurikamome', en: 'Yurikamome', ja: 'ゆりかもめ', color: '#00A5DB', v: 30, dwell: 20, freq: [4, 6, 9], first: 5.0, last: 24.3,
    st: 'shimbashi:1 shiodome takeshiba hinode shibaurafuto odaibakaihinkoen daiba tokyoteleport aomi telecomcenter kokusaitenjijo ariake ariaketennisnomori shijomae shintoyosu toyosu' }, PV));
  J(Object.assign({ id: 'MO', code: 'MO', op: 'Tokyo Monorail', en: 'Tokyo Monorail', ja: '東京モノレール', color: '#009EE0', v: 55, dwell: 22, freq: [4, 6, 10], first: 4.9, last: 24.3,
    st: 'hamamatsucho:1 tennozuisle oikeibajomae showajima seibijomae tenkubashi hanedat3 hanedat12' }, PV));
})(window);
