/* ------------------------------------------------------------------
 * Prefectures and data regions.
 * PREFS lists each prefecture's capital; the "area" under the map centre is the
 * nearest capital — an APPROXIMATION of prefecture borders (good enough for
 * switching the dashboard, wrong within a few km of some borders).
 * REGIONS says which prefectures a data file covers; file:null = no data yet.
 * ------------------------------------------------------------------ */
(function (g) {
  'use strict';
  const PREFS = [
    ['hokkaido', 'Hokkaido', '北海道', 43.0642, 141.3469], ['aomori', 'Aomori', '青森県', 40.8244, 140.7400],
    ['iwate', 'Iwate', '岩手県', 39.7036, 141.1527], ['miyagi', 'Miyagi', '宮城県', 38.2688, 140.8721],
    ['akita', 'Akita', '秋田県', 39.7186, 140.1024], ['yamagata', 'Yamagata', '山形県', 38.2404, 140.3633],
    ['fukushima', 'Fukushima', '福島県', 37.7503, 140.4676], ['ibaraki', 'Ibaraki', '茨城県', 36.3418, 140.4468],
    ['tochigi', 'Tochigi', '栃木県', 36.5658, 139.8836], ['gunma', 'Gunma', '群馬県', 36.3911, 139.0608],
    ['saitama', 'Saitama', '埼玉県', 35.8569, 139.6489], ['chiba', 'Chiba', '千葉県', 35.6073, 140.1063],
    ['tokyo', 'Tokyo', '東京都', 35.6895, 139.6917], ['kanagawa', 'Kanagawa', '神奈川県', 35.4478, 139.6425],
    ['niigata', 'Niigata', '新潟県', 37.9026, 139.0236], ['toyama', 'Toyama', '富山県', 36.6953, 137.2113],
    ['ishikawa', 'Ishikawa', '石川県', 36.5613, 136.6562], ['fukui', 'Fukui', '福井県', 36.0652, 136.2216],
    ['yamanashi', 'Yamanashi', '山梨県', 35.6642, 138.5684], ['nagano', 'Nagano', '長野県', 36.6513, 138.1810],
    ['gifu', 'Gifu', '岐阜県', 35.3912, 136.7223], ['shizuoka', 'Shizuoka', '静岡県', 34.9769, 138.3831],
    ['aichi', 'Aichi', '愛知県', 35.1802, 136.9066], ['mie', 'Mie', '三重県', 34.7303, 136.5086],
    ['shiga', 'Shiga', '滋賀県', 35.0045, 135.8686], ['kyoto', 'Kyoto', '京都府', 35.0116, 135.7681],
    ['osaka', 'Osaka', '大阪府', 34.6937, 135.5023], ['hyogo', 'Hyogo', '兵庫県', 34.6913, 135.1830],
    ['nara', 'Nara', '奈良県', 34.6851, 135.8049], ['wakayama', 'Wakayama', '和歌山県', 34.2260, 135.1675],
    ['tottori', 'Tottori', '鳥取県', 35.5039, 134.2383], ['shimane', 'Shimane', '島根県', 35.4723, 133.0505],
    ['okayama', 'Okayama', '岡山県', 34.6618, 133.9344], ['hiroshima', 'Hiroshima', '広島県', 34.3966, 132.4596],
    ['yamaguchi', 'Yamaguchi', '山口県', 34.1861, 131.4706], ['tokushima', 'Tokushima', '徳島県', 34.0658, 134.5593],
    ['kagawa', 'Kagawa', '香川県', 34.3401, 134.0434], ['ehime', 'Ehime', '愛媛県', 33.8416, 132.7661],
    ['kochi', 'Kochi', '高知県', 33.5597, 133.5311], ['fukuoka', 'Fukuoka', '福岡県', 33.6064, 130.4181],
    ['saga', 'Saga', '佐賀県', 33.2494, 130.2988], ['nagasaki', 'Nagasaki', '長崎県', 32.7503, 129.8777],
    ['kumamoto', 'Kumamoto', '熊本県', 32.7898, 130.7417], ['oita', 'Oita', '大分県', 33.2382, 131.6126],
    ['miyazaki', 'Miyazaki', '宮崎県', 31.9111, 131.4239], ['kagoshima', 'Kagoshima', '鹿児島県', 31.5602, 130.5581],
    ['okinawa', 'Okinawa', '沖縄県', 26.2124, 127.6809]
  ].map(([id, en, ja, lat, lon]) => ({ id, en, ja, lat, lon }));

  // file: script under js/regions/ that fills TRS_REGIONS_DATA[id]; null = not authored/imported yet
  const REGIONS = [
    { id: 'kanto', en: 'Kanto', ja: '関東', prefs: ['tokyo', 'kanagawa', 'saitama', 'chiba'], file: null, builtin: true },
    { id: 'shinkansen', en: 'Shinkansen', ja: '新幹線', prefs: [], file: 'js/regions/shinkansen.js', national: true },
    { id: 'chubu', en: 'Chubu', ja: '中部', prefs: ['aichi', 'gifu', 'shizuoka', 'mie', 'nagano', 'yamanashi', 'niigata', 'toyama', 'ishikawa', 'fukui'], file: 'js/regions/chubu.js' },
    { id: 'tohoku', en: 'Tohoku', ja: '東北', prefs: ['aomori', 'iwate', 'miyagi', 'akita', 'yamagata', 'fukushima'], file: 'js/regions/tohoku.js' },
    { id: 'kyushu', en: 'Kyushu', ja: '九州', prefs: ['fukuoka', 'saga', 'nagasaki', 'kumamoto', 'oita', 'miyazaki', 'kagoshima', 'okinawa'], file: 'js/regions/kyushu.js' },
    { id: 'kansai', en: 'Kansai', ja: '関西', prefs: ['osaka', 'kyoto', 'hyogo', 'nara', 'shiga', 'wakayama'], file: 'js/regions/kansai.js' }
  ];
  const prefById = Object.fromEntries(PREFS.map(p => [p.id, p]));
  const regionOfPref = {};
  REGIONS.forEach(r => r.prefs.forEach(p => { regionOfPref[p] = r; }));

  function nearestPref(lat, lon) {
    const k = Math.cos(lat * Math.PI / 180);
    let best = null, bd = 1e9;
    for (const p of PREFS) {
      const dx = (p.lon - lon) * k, dy = p.lat - lat, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }
  g.TRS_REGIONS = { PREFS, REGIONS, prefById, regionOfPref, nearestPref };
})(typeof window !== 'undefined' ? window : globalThis);
