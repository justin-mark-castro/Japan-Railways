/* ------------------------------------------------------------------
 * Tokyo Rail Sim — network data
 * Station coordinates are approximate (hand-authored) and the map is
 * schematic. Train movements are generated from line parameters
 * (headway / speed / dwell), NOT from the official timetables.
 * ------------------------------------------------------------------ */
(function (g) {
  'use strict';

  // id|English|Japanese|lat|lon
  const STATION_SRC = `
tokyo|Tokyo|東京|35.6812|139.7671
kanda|Kanda|神田|35.6918|139.7709
akihabara|Akihabara|秋葉原|35.6984|139.7731
okachimachi|Okachimachi|御徒町|35.7076|139.7747
ueno|Ueno|上野|35.7141|139.7774
uguisudani|Uguisudani|鶯谷|35.7206|139.7780
nippori|Nippori|日暮里|35.7281|139.7708
nishinippori|Nishi-Nippori|西日暮里|35.7320|139.7668
tabata|Tabata|田端|35.7381|139.7608
komagome|Komagome|駒込|35.7368|139.7469
sugamo|Sugamo|巣鴨|35.7336|139.7392
otsuka|Otsuka|大塚|35.7314|139.7287
ikebukuro|Ikebukuro|池袋|35.7295|139.7109
mejiro|Mejiro|目白|35.7211|139.7066
takadanobaba|Takadanobaba|高田馬場|35.7126|139.7038
shinokubo|Shin-Okubo|新大久保|35.7010|139.7002
shinjuku|Shinjuku|新宿|35.6896|139.7006
yoyogi|Yoyogi|代々木|35.6833|139.7020
harajuku|Harajuku|原宿|35.6702|139.7027
shibuya|Shibuya|渋谷|35.6580|139.7016
ebisu|Ebisu|恵比寿|35.6467|139.7101
meguro|Meguro|目黒|35.6339|139.7158
gotanda|Gotanda|五反田|35.6262|139.7237
osaki|Osaki|大崎|35.6197|139.7286
shinagawa|Shinagawa|品川|35.6285|139.7388
takanawagw|Takanawa Gateway|高輪ゲートウェイ|35.6355|139.7409
tamachi|Tamachi|田町|35.6456|139.7476
hamamatsucho|Hamamatsucho|浜松町|35.6555|139.7570
shimbashi|Shimbashi|新橋|35.6666|139.7583
yurakucho|Yurakucho|有楽町|35.6750|139.7633
ochanomizu|Ochanomizu|御茶ノ水|35.6996|139.7653
yotsuya|Yotsuya|四ツ谷|35.6866|139.7300
nakano|Nakano|中野|35.7058|139.6659
koenji|Koenji|高円寺|35.7054|139.6495
asagaya|Asagaya|阿佐ケ谷|35.7048|139.6355
ogikubo|Ogikubo|荻窪|35.7046|139.6200
nishiogikubo|Nishi-Ogikubo|西荻窪|35.7034|139.5993
kichijoji|Kichijoji|吉祥寺|35.7030|139.5798
mitaka|Mitaka|三鷹|35.7022|139.5611
musashisakai|Musashi-Sakai|武蔵境|35.7026|139.5521
higashikoganei|Higashi-Koganei|東小金井|35.7012|139.5222
musashikoganei|Musashi-Koganei|武蔵小金井|35.7003|139.5112
kokubunji|Kokubunji|国分寺|35.7007|139.4806
nishikokubunji|Nishi-Kokubunji|西国分寺|35.7000|139.4608
kunitachi|Kunitachi|国立|35.6990|139.4421
tachikawa|Tachikawa|立川|35.6980|139.4137
higashinakano|Higashi-Nakano|東中野|35.7055|139.6827
okubo|Okubo|大久保|35.7009|139.6972
sendagaya|Sendagaya|千駄ケ谷|35.6811|139.7117
shinanomachi|Shinanomachi|信濃町|35.6803|139.7202
ichigaya|Ichigaya|市ケ谷|35.6914|139.7355
iidabashi|Iidabashi|飯田橋|35.7020|139.7450
suidobashi|Suidobashi|水道橋|35.7020|139.7536
asakusabashi|Asakusabashi|浅草橋|35.6975|139.7866
ryogoku|Ryogoku|両国|35.6962|139.7932
kinshicho|Kinshicho|錦糸町|35.6967|139.8143
kameido|Kameido|亀戸|35.6977|139.8262
hirai|Hirai|平井|35.7030|139.8420
shinkoiwa|Shin-Koiwa|新小岩|35.7165|139.8579
koiwa|Koiwa|小岩|35.7332|139.8805
ichikawa|Ichikawa|市川|35.7283|139.9076
motoyawata|Motoyawata|本八幡|35.7230|139.9279
shimosanakayama|Shimosa-Nakayama|下総中山|35.7227|139.9498
nishifunabashi|Nishi-Funabashi|西船橋|35.7071|139.9577
funabashi|Funabashi|船橋|35.7016|139.9856
oimachi|Oimachi|大井町|35.6068|139.7344
omori|Omori|大森|35.5883|139.7279
kamata|Kamata|蒲田|35.5625|139.7164
kawasaki|Kawasaki|川崎|35.5311|139.6967
tsurumi|Tsurumi|鶴見|35.5084|139.6767
shinkoyasu|Shin-Koyasu|新子安|35.4871|139.6431
higashikanagawa|Higashi-Kanagawa|東神奈川|35.4766|139.6330
yokohama|Yokohama|横浜|35.4658|139.6224
kaminakazato|Kami-Nakazato|上中里|35.7478|139.7377
oji|Oji|王子|35.7538|139.7381
higashijujo|Higashi-Jujo|東十条|35.7640|139.7208
akabane|Akabane|赤羽|35.7779|139.7209
kawaguchi|Kawaguchi|川口|35.8021|139.7240
nishikawaguchi|Nishi-Kawaguchi|西川口|35.8094|139.7078
warabi|Warabi|蕨|35.8266|139.6806
minamiurawa|Minami-Urawa|南浦和|35.8486|139.6756
urawa|Urawa|浦和|35.8581|139.6569
kitaurawa|Kita-Urawa|北浦和|35.8753|139.6405
yono|Yono|与野|35.8859|139.6285
saitamashintoshin|Saitama-Shintoshin|さいたま新都心|35.8940|139.6316
omiya|Omiya|大宮|35.9063|139.6240
omotesando|Omotesando|表参道|35.6653|139.7125
gaiemmae|Gaiemmae|外苑前|35.6706|139.7178
aoyamaitchome|Aoyama-itchome|青山一丁目|35.6728|139.7243
akasakamitsuke|Akasaka-mitsuke|赤坂見附|35.6770|139.7370
tameikesanno|Tameike-sanno|溜池山王|35.6738|139.7411
toranomon|Toranomon|虎ノ門|35.6704|139.7497
ginza|Ginza|銀座|35.6717|139.7640
kyobashi|Kyobashi|京橋|35.6770|139.7706
nihombashi|Nihombashi|日本橋|35.6823|139.7735
mitsukoshimae|Mitsukoshimae|三越前|35.6870|139.7735
suehirocho|Suehirocho|末広町|35.6954|139.7724
uenohirokoji|Ueno-hirokoji|上野広小路|35.7072|139.7728
inaricho|Inaricho|稲荷町|35.7107|139.7826
tawaramachi|Tawaramachi|田原町|35.7105|139.7916
asakusa|Asakusa|浅草|35.7107|139.7976
minamiasagaya|Minami-Asagaya|南阿佐ケ谷|35.6978|139.6350
shinkoenji|Shin-Koenji|新高円寺|35.6978|139.6495
higashikoenji|Higashi-Koenji|東高円寺|35.6980|139.6578
shinnakano|Shin-Nakano|新中野|35.6970|139.6663
nakanosakaue|Nakano-Sakaue|中野坂上|35.6975|139.6824
nishishinjuku|Nishi-Shinjuku|西新宿|35.6938|139.6924
shinjukusanchome|Shinjuku-sanchome|新宿三丁目|35.6905|139.7060
shinjukugyoemmae|Shinjuku-gyoemmae|新宿御苑前|35.6873|139.7107
yotsuyasanchome|Yotsuya-sanchome|四谷三丁目|35.6877|139.7198
kokkaigijidomae|Kokkai-gijidomae|国会議事堂前|35.6742|139.7451
kasumigaseki|Kasumigaseki|霞ケ関|35.6733|139.7503
otemachi|Otemachi|大手町|35.6867|139.7662
awajicho|Awajicho|淡路町|35.6963|139.7677
hongosanchome|Hongo-sanchome|本郷三丁目|35.7078|139.7600
korakuen|Korakuen|後楽園|35.7078|139.7519
myogadani|Myogadani|茗荷谷|35.7170|139.7367
shinotsuka|Shin-Otsuka|新大塚|35.7258|139.7298
nakameguro|Naka-Meguro|中目黒|35.6440|139.6990
hiroo|Hiroo|広尾|35.6513|139.7223
roppongi|Roppongi|六本木|35.6628|139.7314
kamiyacho|Kamiyacho|神谷町|35.6633|139.7447
hibiya|Hibiya|日比谷|35.6745|139.7600
higashiginza|Higashi-ginza|東銀座|35.6693|139.7676
tsukiji|Tsukiji|築地|35.6672|139.7721
hatchobori|Hatchobori|八丁堀|35.6742|139.7771
kayabacho|Kayabacho|茅場町|35.6803|139.7798
ningyocho|Ningyocho|人形町|35.6862|139.7825
kodemmacho|Kodemmacho|小伝馬町|35.6903|139.7807
nakaokachimachi|Naka-Okachimachi|仲御徒町|35.7061|139.7783
iriya|Iriya|入谷|35.7203|139.7833
minowa|Minowa|三ノ輪|35.7279|139.7915
mikawashima|Mikawashima|三河島|35.7319|139.7894
minamisenju|Minami-Senju|南千住|35.7324|139.7992
kitasenju|Kita-Senju|北千住|35.7494|139.8049
ochiai|Ochiai|落合|35.7109|139.6870
waseda|Waseda|早稲田|35.7059|139.7211
kagurazaka|Kagurazaka|神楽坂|35.7020|139.7381
kudanshita|Kudanshita|九段下|35.6957|139.7517
takebashi|Takebashi|竹橋|35.6899|139.7581
monzennakacho|Monzen-Nakacho|門前仲町|35.6720|139.7956
kiba|Kiba|木場|35.6696|139.8070
toyocho|Toyocho|東陽町|35.6688|139.8171
minamisunamachi|Minami-Sunamachi|南砂町|35.6694|139.8312
nishikasai|Nishi-Kasai|西葛西|35.6652|139.8590
kasai|Kasai|葛西|35.6648|139.8731
urayasu|Urayasu|浦安|35.6649|139.8957
minamigyotoku|Minami-Gyotoku|南行徳|35.6772|139.9174
gyotoku|Gyotoku|行徳|35.6860|139.9300
myoden|Myoden|妙典|35.6936|139.9441
barakinakayama|Baraki-Nakayama|原木中山|35.7027|139.9540
yoyogiuehara|Yoyogi-Uehara|代々木上原|35.6692|139.6797
yoyogikoen|Yoyogi-koen|代々木公園|35.6695|139.6903
meijijingumae|Meiji-jingumae|明治神宮前〈原宿〉|35.6688|139.7062
nogizaka|Nogizaka|乃木坂|35.6667|139.7260
akasaka|Akasaka|赤坂|35.6727|139.7365
nijubashimae|Nijubashimae|二重橋前|35.6803|139.7601
shinochanomizu|Shin-Ochanomizu|新御茶ノ水|35.6968|139.7652
yushima|Yushima|湯島|35.7076|139.7699
nezu|Nezu|根津|35.7160|139.7660
sendagi|Sendagi|千駄木|35.7255|139.7655
machiya|Machiya|町屋|35.7469|139.7834
ayase|Ayase|綾瀬|35.7627|139.8250
higashiikebukuro|Higashi-Ikebukuro|東池袋|35.7288|139.7195
gokokuji|Gokokuji|護国寺|35.7189|139.7289
edogawabashi|Edogawabashi|江戸川橋|35.7085|139.7326
kojimachi|Kojimachi|麹町|35.6838|139.7415
nagatacho|Nagatacho|永田町|35.6789|139.7403
sakuradamon|Sakuradamon|桜田門|35.6772|139.7513
ginzaitchome|Ginza-itchome|銀座一丁目|35.6738|139.7672
shintomicho|Shintomicho|新富町|35.6717|139.7770
tsukishima|Tsukishima|月島|35.6643|139.7848
toyosu|Toyosu|豊洲|35.6551|139.7959
tatsumi|Tatsumi|辰巳|35.6484|139.8085
shinkiba|Shin-Kiba|新木場|35.6459|139.8266
hanzomon|Hanzomon|半蔵門|35.6853|139.7444
jimbocho|Jimbocho|神保町|35.6959|139.7578
suitengumae|Suitengumae|水天宮前|35.6828|139.7856
kiyosumi|Kiyosumi-Shirakawa|清澄白河|35.6807|139.7990
sumiyoshi|Sumiyoshi|住吉|35.6892|139.8147
oshiage|Oshiage|押上|35.7107|139.8130
shirokanedai|Shirokanedai|白金台|35.6371|139.7253
shirokanetakanawa|Shirokane-Takanawa|白金高輪|35.6428|139.7343
azabujuban|Azabu-juban|麻布十番|35.6552|139.7365
roppongiitchome|Roppongi-itchome|六本木一丁目|35.6657|139.7415
todaimae|Todai-mae|東大前|35.7174|139.7579
honkomagome|Hon-Komagome|本駒込|35.7257|139.7513
nishigahara|Nishigahara|西ケ原|35.7440|139.7430
ojikamiya|Oji-Kamiya|王子神谷|35.7611|139.7313
shimo|Shimo|志茂|35.7690|139.7260
akabaneiwabuchi|Akabane-Iwabuchi|赤羽岩淵|35.7790|139.7220
zoshigaya|Zoshigaya|雑司が谷|35.7140|139.7144
nishiwaseda|Nishi-Waseda|西早稲田|35.7058|139.7081
higashishinjuku|Higashi-Shinjuku|東新宿|35.6979|139.7068
kitasando|Kita-Sando|北参道|35.6788|139.7052
nishimagome|Nishi-Magome|西馬込|35.5853|139.7012
magome|Magome|馬込|35.5945|139.7110
nakanobu|Nakanobu|中延|35.6065|139.7137
togoshi|Togoshi|戸越|35.6148|139.7160
takanawadai|Takanawadai|高輪台|35.6358|139.7330
sengakuji|Sengakuji|泉岳寺|35.6383|139.7391
mita|Mita|三田|35.6482|139.7478
daimon|Daimon|大門|35.6563|139.7551
takaracho|Takaracho|宝町|35.6761|139.7745
higashinihombashi|Higashi-Nihombashi|東日本橋|35.6900|139.7877
kuramae|Kuramae|蔵前|35.7037|139.7906
honjoazumabashi|Honjo-Azumabashi|本所吾妻橋|35.7060|139.8031
shibakoen|Shiba-koen|芝公園|35.6535|139.7497
onarimon|Onarimon|御成門|35.6578|139.7552
uchisaiwaicho|Uchisaiwaicho|内幸町|35.6663|139.7554
kasuga|Kasuga|春日|35.7079|139.7517
hakusan|Hakusan|白山|35.7215|139.7512
sengoku|Sengoku|千石|35.7268|139.7424
akebonobashi|Akebonobashi|曙橋|35.6930|139.7227
ogawamachi|Ogawamachi|小川町|35.6957|139.7659
iwamotocho|Iwamotocho|岩本町|35.6945|139.7767
bakuroyokoyama|Bakuro-Yokoyama|馬喰横山|35.6918|139.7850
hamacho|Hamacho|浜町|35.6875|139.7881
morishita|Morishita|森下|35.6880|139.7990
kikukawa|Kikukawa|菊川|35.6870|139.8058
nishiojima|Nishi-Ojima|西大島|35.6906|139.8225
ojima|Ojima|大島|35.6906|139.8280
higashiojima|Higashi-Ojima|東大島|35.6931|139.8370
funabori|Funabori|船堀|35.6912|139.8639
tochomae|Tochomae|都庁前|35.6903|139.6921
shinjukunishiguchi|Shinjuku-nishiguchi|新宿西口|35.6940|139.6990
wakamatsukawada|Wakamatsu-Kawada|若松河田|35.6985|139.7199
ushigomeyanagicho|Ushigome-Yanagicho|牛込柳町|35.6991|139.7239
ushigomekagurazaka|Ushigome-Kagurazaka|牛込神楽坂|35.7011|139.7283
uenookachimachi|Ueno-Okachimachi|上野御徒町|35.7078|139.7745
shinokachimachi|Shin-Okachimachi|新御徒町|35.7068|139.7824
kachidoki|Kachidoki|勝どき|35.6590|139.7766
tsukijishijo|Tsukijishijo|築地市場|35.6643|139.7701
shiodome|Shiodome|汐留|35.6615|139.7584
akabanebashi|Akabanebashi|赤羽橋|35.6552|139.7447
kokuritsukyogijo|Kokuritsu-Kyogijo|国立競技場|35.6800|139.7141
`;

  // Station list per line: "id" or "id:number" (numbers auto-increment from previous)
  // type: jr | metro | toei
  const LINE_SRC = [
    { id: 'JY', code: 'JY', type: 'jr', op: 'JR East', en: 'Yamanote Line', ja: '山手線', color: '#9ACD32', loop: true,
      dirs: ['Inner loop 内回り', 'Outer loop 外回り'], v: 46, dwell: 25, freq: [2.5, 4, 6], first: 4.6, last: 24.9,
      st: 'tokyo:1 kanda akihabara okachimachi ueno uguisudani nippori nishinippori tabata komagome sugamo otsuka ikebukuro mejiro takadanobaba shinokubo shinjuku yoyogi harajuku shibuya ebisu meguro gotanda osaki shinagawa takanawagw tamachi hamamatsucho shimbashi yurakucho' },
    { id: 'JC', code: 'JC', type: 'jr', op: 'JR East', en: 'Chuo Line (Rapid)', ja: '中央線(快速)', color: '#F15A22', v: 62, dwell: 28, freq: [3, 5, 9], first: 4.7, last: 24.6,
      skip: 'musashisakai higashikoganei musashikoganei',
      st: 'tokyo:1 kanda ochanomizu yotsuya shinjuku nakano koenji asagaya ogikubo nishiogikubo kichijoji mitaka musashisakai higashikoganei musashikoganei kokubunji nishikokubunji kunitachi tachikawa' },
    { id: 'JB', code: 'JB', type: 'jr', op: 'JR East', en: 'Chuo-Sobu Line (Local)', ja: '中央・総武線(各駅停車)', color: '#FFD400', v: 48, dwell: 25, freq: [3, 5, 9], first: 4.7, last: 24.7,
      st: 'mitaka:1 kichijoji nishiogikubo ogikubo asagaya koenji nakano higashinakano okubo shinjuku yoyogi sendagaya shinanomachi yotsuya ichigaya iidabashi suidobashi ochanomizu akihabara asakusabashi ryogoku kinshicho kameido hirai shinkoiwa koiwa ichikawa motoyawata shimosanakayama nishifunabashi funabashi' },
    { id: 'JK', code: 'JK', type: 'jr', op: 'JR East', en: 'Keihin-Tohoku Line', ja: '京浜東北線', color: '#00B2E5', v: 52, dwell: 25, freq: [3, 4.5, 8], first: 4.6, last: 24.8,
      st: 'yokohama:12 higashikanagawa shinkoyasu tsurumi kawasaki kamata omori oimachi shinagawa takanawagw tamachi hamamatsucho shimbashi yurakucho tokyo kanda akihabara okachimachi ueno uguisudani nippori nishinippori tabata kaminakazato oji higashijujo akabane kawaguchi nishikawaguchi warabi minamiurawa urawa kitaurawa yono saitamashintoshin omiya' },

    { id: 'G', code: 'G', type: 'metro', op: 'Tokyo Metro', en: 'Ginza Line', ja: '銀座線', color: '#FF9500', v: 36, dwell: 22, freq: [2.5, 3.5, 6], first: 5.0, last: 24.5,
      st: 'shibuya:1 omotesando gaiemmae aoyamaitchome akasakamitsuke tameikesanno toranomon shimbashi ginza kyobashi nihombashi mitsukoshimae kanda suehirocho uenohirokoji ueno inaricho tawaramachi asakusa' },
    { id: 'M', code: 'M', type: 'metro', op: 'Tokyo Metro', en: 'Marunouchi Line', ja: '丸ノ内線', color: '#F62E36', v: 38, dwell: 22, freq: [3, 4, 7], first: 5.0, last: 24.6,
      st: 'ogikubo:1 minamiasagaya shinkoenji higashikoenji shinnakano nakanosakaue nishishinjuku shinjuku shinjukusanchome shinjukugyoemmae yotsuyasanchome yotsuya akasakamitsuke kokkaigijidomae kasumigaseki ginza tokyo otemachi awajicho ochanomizu hongosanchome korakuen myogadani shinotsuka ikebukuro' },
    { id: 'H', code: 'H', type: 'metro', op: 'Tokyo Metro', en: 'Hibiya Line', ja: '日比谷線', color: '#B5B5AC', v: 38, dwell: 22, freq: [3, 4, 7], first: 5.0, last: 24.6,
      st: 'nakameguro:1 ebisu hiroo roppongi kamiyacho kasumigaseki hibiya ginza higashiginza tsukiji hatchobori kayabacho ningyocho kodemmacho akihabara nakaokachimachi ueno iriya minowa mikawashima minamisenju kitasenju:22' },
    { id: 'T', code: 'T', type: 'metro', op: 'Tokyo Metro', en: 'Tozai Line', ja: '東西線', color: '#009BBF', v: 48, dwell: 22, freq: [2.5, 4, 7], first: 5.0, last: 24.6,
      st: 'nakano:1 ochiai takadanobaba waseda kagurazaka iidabashi kudanshita takebashi otemachi nihombashi kayabacho monzennakacho kiba toyocho minamisunamachi nishikasai kasai urayasu minamigyotoku gyotoku myoden barakinakayama nishifunabashi' },
    { id: 'C', code: 'C', type: 'metro', op: 'Tokyo Metro', en: 'Chiyoda Line', ja: '千代田線', color: '#00BB85', v: 42, dwell: 22, freq: [3, 5, 8], first: 5.0, last: 24.6,
      st: 'yoyogiuehara:1 yoyogikoen meijijingumae omotesando nogizaka akasaka kokkaigijidomae kasumigaseki hibiya nijubashimae otemachi shinochanomizu yushima nezu sendagi nishinippori machiya kitasenju ayase:19' },
    { id: 'Y', code: 'Y', type: 'metro', op: 'Tokyo Metro', en: 'Yurakucho Line', ja: '有楽町線', color: '#C1A470', v: 42, dwell: 22, freq: [3, 5, 8], first: 5.0, last: 24.5,
      st: 'ikebukuro:9 higashiikebukuro gokokuji edogawabashi iidabashi ichigaya kojimachi nagatacho sakuradamon yurakucho ginzaitchome shintomicho tsukishima toyosu tatsumi shinkiba' },
    { id: 'Z', code: 'Z', type: 'metro', op: 'Tokyo Metro', en: 'Hanzomon Line', ja: '半蔵門線', color: '#8F76D6', v: 42, dwell: 22, freq: [3, 5, 8], first: 5.0, last: 24.5,
      st: 'shibuya:1 omotesando aoyamaitchome nagatacho hanzomon kudanshita jimbocho otemachi mitsukoshimae suitengumae kiyosumi sumiyoshi kinshicho oshiage' },
    { id: 'N', code: 'N', type: 'metro', op: 'Tokyo Metro', en: 'Namboku Line', ja: '南北線', color: '#00AC9B', v: 42, dwell: 22, freq: [3, 5, 8], first: 5.0, last: 24.5,
      st: 'meguro:1 shirokanedai shirokanetakanawa azabujuban roppongiitchome tameikesanno nagatacho yotsuya ichigaya iidabashi korakuen todaimae honkomagome komagome nishigahara oji ojikamiya shimo akabaneiwabuchi' },
    { id: 'F', code: 'F', type: 'metro', op: 'Tokyo Metro', en: 'Fukutoshin Line', ja: '副都心線', color: '#9C5E31', v: 46, dwell: 22, freq: [3, 5, 8], first: 5.0, last: 24.5,
      st: 'ikebukuro:9 zoshigaya nishiwaseda higashishinjuku shinjukusanchome kitasando meijijingumae shibuya' },

    { id: 'A', code: 'A', type: 'toei', op: 'Toei Subway', en: 'Asakusa Line', ja: '浅草線', color: '#E85298', v: 42, dwell: 22, freq: [4, 6, 9], first: 5.0, last: 24.4,
      st: 'nishimagome:1 magome nakanobu togoshi gotanda takanawadai sengakuji mita daimon shimbashi higashiginza takaracho nihombashi ningyocho higashinihombashi asakusabashi kuramae asakusa honjoazumabashi oshiage' },
    { id: 'I', code: 'I', type: 'toei', op: 'Toei Subway', en: 'Mita Line', ja: '三田線', color: '#0079C2', v: 42, dwell: 22, freq: [4, 6, 9], first: 5.0, last: 24.4,
      st: 'meguro:1 shirokanedai shirokanetakanawa mita shibakoen onarimon uchisaiwaicho hibiya otemachi jimbocho suidobashi kasuga hakusan sengoku sugamo' },
    { id: 'S', code: 'S', type: 'toei', op: 'Toei Subway', en: 'Shinjuku Line', ja: '新宿線', color: '#6CBB5A', v: 44, dwell: 22, freq: [4, 6, 9], first: 5.0, last: 24.4,
      st: 'shinjuku:1 shinjukusanchome akebonobashi ichigaya kudanshita jimbocho ogawamachi iwamotocho bakuroyokoyama hamacho morishita kikukawa sumiyoshi nishiojima ojima higashiojima funabori' },
    { id: 'E', code: 'E', type: 'toei', op: 'Toei Subway', en: 'Oedo Line', ja: '大江戸線', color: '#B6007A', loop: true,
      dirs: ['Ring (via Iidabashi) 右回り', 'Ring (via Roppongi) 左回り'], v: 40, dwell: 22, freq: [4, 6, 9], first: 5.0, last: 24.4,
      st: 'tochomae:28 shinjukunishiguchi:1 higashishinjuku wakamatsukawada ushigomeyanagicho ushigomekagurazaka iidabashi kasuga hongosanchome uenookachimachi shinokachimachi kuramae ryogoku morishita kiyosumi monzennakacho tsukishima kachidoki tsukijishijo shiodome daimon akabanebashi azabujuban roppongi aoyamaitchome kokuritsukyogijo yoyogi shinjuku:27' }
  ];

  // Rough Tokyo Bay / river sketches for the backdrop  [lat, lon]
  const WATER = [
    [35.715, 140.030], [35.700, 139.990], [35.672, 139.935], [35.652, 139.885], [35.645, 139.835],
    [35.636, 139.805], [35.627, 139.785], [35.610, 139.780], [35.590, 139.795], [35.575, 139.790],
    [35.562, 139.765], [35.530, 139.755], [35.505, 139.730], [35.480, 139.685], [35.450, 139.655],
    [35.400, 139.645], [35.300, 139.640], [35.300, 140.200], [35.560, 140.200], [35.560, 140.110],
    [35.610, 140.090], [35.650, 140.050], [35.685, 140.040]
  ];
  const RIVERS = [
    { name: 'Arakawa', w: 5, pts: [[35.800, 139.715], [35.790, 139.725], [35.772, 139.765], [35.752, 139.800], [35.730, 139.842], [35.700, 139.858], [35.668, 139.867], [35.645, 139.872]] },
    { name: 'Sumida', w: 4, pts: [[35.755, 139.790], [35.745, 139.805], [35.725, 139.806], [35.710, 139.801], [35.690, 139.795], [35.668, 139.786], [35.652, 139.780]] },
    { name: 'Tama', w: 5, pts: [[35.640, 139.560], [35.620, 139.630], [35.592, 139.680], [35.556, 139.735], [35.535, 139.772]] },
    { name: 'Kanda', w: 2, pts: [[35.705, 139.625], [35.703, 139.690], [35.708, 139.722], [35.700, 139.752], [35.695, 139.775]] }
  ];

  g.TRS_DATA = { STATION_SRC, LINE_SRC, WATER, RIVERS };
})(window);
