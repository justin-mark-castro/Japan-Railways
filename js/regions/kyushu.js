/* ------------------------------------------------------------------
 * Region data: Kyushu (Fukuoka subway)
 * Station lists/numbers: public line articles (Wikipedia). COORDINATES ARE
 * APPROXIMATE: a few anchor stations per line were entered by hand and the
 * rest are interpolated along the line, so individual stations can be off by
 * ~0.5-2 km. Frequencies/speeds are typical values, not the real timetable.
 * Lines not listed here are not mapped yet.
 * ------------------------------------------------------------------ */
(function (g) {
  'use strict';
  const STATION_SRC = `
meinohama|Meinohama|姪浜|33.584|130.323
muromi|Muromi|室見|33.5825|130.3345
fujisaki|Fujisaki|藤崎|33.5839|130.3452
nishijin|Nishijin|西新|33.5853|130.356
tojinmachi|Tojinmachi|唐人町|33.5868|130.3667
ohorikoen|Ohori-Koen|大濠公園|33.5882|130.3775
fk_akasaka|Akasaka|赤坂|33.5896|130.3882
tenjin|Tenjin|天神|33.591|130.399
nakasukawabata|Nakasu-Kawabata|中洲川端|33.593|130.407
gion|Gion|祇園|33.5914|130.4139
hakata|Hakata|博多|33.5897|130.4207
higashihie|Higashi-Hie|東比恵|33.5931|130.4332
fukuokakuko|Fukuoka Airport|福岡空港|33.5964|130.4457
gofukumachi|Gofukumachi|呉服町|33.5955|130.4135
chiyokenchoguchi|Chiyo-Kenchoguchi|千代県庁口|33.6012|130.4168
maidashikyudaibyoinmae|Maidashi Kyudai-Byoin-mae|馬出九大病院前|33.6069|130.4201
hakozakimiyamae|Hakozakigu-mae|箱崎宮前|33.6126|130.4234
hakozakikyudaimae|Hakozaki-Kyudai-mae|箱崎九大前|33.6183|130.4267
kaizuka|Kaizuka|貝塚|33.624|130.43
`;
  const LINE_SRC = [];
  LINE_SRC.push({"id": "FK", "code": "K", "type": "metro", "grp": "Fukuoka Subway", "op": "Fukuoka City Subway", "en": "Fukuoka Subway Kuko (Airport) Line", "ja": "福岡市地下鉄空港線", "color": "#E5171F", "v": 40, "dwell": 22, "freq": [3, 4.5, 8], "first": 5.3, "last": 24.0, "st": "meinohama:1 muromi fujisaki nishijin tojinmachi ohorikoen fk_akasaka tenjin nakasukawabata gion hakata higashihie fukuokakuko"});
  LINE_SRC.push({"id": "FH", "code": "H", "type": "metro", "grp": "Fukuoka Subway", "op": "Fukuoka City Subway", "en": "Fukuoka Subway Hakozaki Line", "ja": "福岡市地下鉄箱崎線", "color": "#0079C2", "v": 36, "dwell": 22, "freq": [4, 6, 10], "first": 5.5, "last": 23.8, "st": "nakasukawabata:1 gofukumachi chiyokenchoguchi maidashikyudaibyoinmae hakozakimiyamae hakozakikyudaimae kaizuka"});
  g.TRS_REGIONS_DATA = g.TRS_REGIONS_DATA || {};
  g.TRS_REGIONS_DATA.kyushu = { STATION_SRC, LINE_SRC, POIS: [], WATER: [] };
})(typeof window !== 'undefined' ? window : globalThis);
