/* Famous Tokyo tourist spots. Positions are approximate. Nearest stations are computed at runtime. */
(function (g) {
  'use strict';
  const CATS = {
    landmark: { en: 'Landmarks', ja: 'ランドマーク', color: '#ff6b6b' },
    shrine: { en: 'Temples & shrines', ja: '寺社', color: '#ffb347' },
    park: { en: 'Parks & gardens', ja: '公園・庭園', color: '#5ccf8a' },
    culture: { en: 'Culture & museums', ja: '文化', color: '#b48cff' },
    shop: { en: 'Shopping & food', ja: '買い物・グルメ', color: '#4fc3f7' },
    fun: { en: 'Entertainment', ja: 'エンタメ', color: '#ff7ac6' }
  };
  // id|English|日本語|lat|lon|cat|emoji|description
  const SRC = `
tokyotower|Tokyo Tower|東京タワー|35.6586|139.7454|landmark|🗼|333 m red-and-white communications tower opened in 1958, with an observatory at 150 m.
skytree|Tokyo Skytree|東京スカイツリー|35.7101|139.8107|landmark|🗼|634 m broadcasting tower opened in 2012, with observation decks at 350 m and 450 m.
tokyostation|Tokyo Station Marunouchi Building|東京駅丸の内駅舎|35.6830|139.7671|landmark|🚉|Red-brick station building dating from 1914, the hub of the Shinkansen network.
imperialpalace|Imperial Palace & East Gardens|皇居・東御苑|35.6852|139.7528|landmark|🏯|Residence of the Emperor; the East Gardens are open to the public.
tmgb|Tokyo Metropolitan Government Building|東京都庁|35.6896|139.6917|landmark|🏙️|Twin-tower building in Shinjuku with free observation decks.
roppongihills|Roppongi Hills (Mori Tower)|六本木ヒルズ|35.6604|139.7292|landmark|🌆|Complex with the Mori Art Museum and a rooftop observation deck.
shibuya|Shibuya Scramble Crossing|渋谷スクランブル交差点|35.6595|139.7005|landmark|🚦|Famous pedestrian crossing beside the Hachiko statue.
odaiba|Odaiba Seaside Park|お台場海浜公園|35.6300|139.7760|fun|🌉|Waterfront on Tokyo Bay with Rainbow Bridge views.
sensoji|Senso-ji|浅草寺|35.7148|139.7967|shrine|⛩️|Tokyo's oldest temple, reached through Kaminarimon gate and Nakamise shopping street.
meijijingu|Meiji Jingu|明治神宮|35.6764|139.6993|shrine|⛩️|Shinto shrine dedicated to Emperor Meiji, set in a large forest beside Harajuku.
yasukuni|Yasukuni Shrine|靖国神社|35.6948|139.7436|shrine|⛩️|Shinto shrine in Kudanshita founded in 1869.
zojoji|Zojo-ji|増上寺|35.6575|139.7482|shrine|🛕|Buddhist temple with Tokyo Tower rising behind the main hall.
gotokuji|Gotokuji|豪徳寺|35.6482|139.6469|shrine|🐱|Temple known for its many maneki-neko (beckoning cat) figurines.
uenopark|Ueno Park|上野恩賜公園|35.7156|139.7745|park|🌸|Large park with museums, Shinobazu Pond and a popular cherry-blossom spot.
uenozoo|Ueno Zoo|上野動物園|35.7167|139.7713|park|🐼|Japan's oldest zoo, opened in 1882.
shinjukugyoen|Shinjuku Gyoen|新宿御苑|35.6852|139.7100|park|🌳|Spacious garden combining Japanese, English and French styles.
yoyogipark|Yoyogi Park|代々木公園|35.6715|139.6949|park|🌳|Big city park next to Meiji Jingu, popular for weekend picnics.
hamarikyu|Hamarikyu Gardens|浜離宮恩賜庭園|35.6602|139.7632|park|🍵|Edo-era tidal garden with a teahouse, surrounded by skyscrapers.
inokashira|Inokashira Park|井の頭恩賜公園|35.6998|139.5740|park|🦢|Pond park in Kichijoji with rowboats and cherry trees.
tokyonationalmuseum|Tokyo National Museum|東京国立博物館|35.7189|139.7766|culture|🏛️|Japan's oldest and largest museum, in Ueno Park.
ghibli|Ghibli Museum, Mitaka|三鷹の森ジブリ美術館|35.6962|139.5704|culture|🎨|Animation museum; tickets must be reserved in advance.
ryogoku|Ryogoku Kokugikan|両国国技館|35.6968|139.7935|culture|🤼|Sumo arena hosting three Tokyo tournaments a year.
tokyodome|Tokyo Dome City|東京ドーム|35.7056|139.7519|fun|⚾|Baseball stadium with an amusement park and spa complex.
kabukicho|Kabukicho|歌舞伎町|35.6950|139.7030|fun|🌃|Neon-lit entertainment district in Shinjuku.
disney|Tokyo Disney Resort|東京ディズニーリゾート|35.6329|139.8804|fun|🎢|Theme-park resort in Urayasu, reached from Maihama station.
akihabara|Akihabara Electric Town|秋葉原電気街|35.6984|139.7710|shop|🎮|Electronics, anime and gaming shops.
takeshita|Takeshita Street|竹下通り|35.6704|139.7054|shop|🛍️|Youth fashion and snack street in Harajuku.
ginza|Ginza|銀座|35.6717|139.7640|shop|🛍️|Upscale shopping district with department stores and boutiques.
tsukiji|Tsukiji Outer Market|築地場外市場|35.6655|139.7707|shop|🍣|Street-food and seafood stalls beside the former wholesale market site.
toyosu|Toyosu Market|豊洲市場|35.6454|139.7847|shop|🐟|Wholesale fish market, with a tuna auction viewing area.
ameyoko|Ameyoko Market|アメ横|35.7099|139.7745|shop|🍡|Bustling market street under the tracks between Ueno and Okachimachi.
yanaka|Yanaka Ginza|谷中銀座|35.7279|139.7667|shop|🏮|Old-town shopping street with traditional snacks.
kappabashi|Kappabashi Kitchen Town|かっぱ橋道具街|35.7144|139.7885|shop|🍳|Street of kitchenware and plastic-food-sample shops.
shimokitazawa|Shimokitazawa|下北沢|35.6613|139.6680|shop|🎸|Vintage shops, cafes and live music venues.
sunshine|Sunshine City Ikebukuro|サンシャインシティ|35.7289|139.7190|fun|🏙️|Shopping complex with an aquarium and observation deck.
nakanobroadway|Nakano Broadway|中野ブロードウェイ|35.7081|139.6657|shop|🎎|Arcade full of manga, anime and collectible shops.
`;
  const POIS = SRC.trim().split('\n').map(r => {
    const [id, en, ja, lat, lon, cat, emoji, desc] = r.split('|');
    return { id, en, ja, lat: +lat, lon: +lon, cat, emoji, desc };
  });
  g.TRS_POI = { CATS, POIS };
})(window);
