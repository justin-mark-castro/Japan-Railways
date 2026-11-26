/* ------------------------------------------------------------------
 * Station-number badges in the Japanese signage style.
 *   JR lines      : dark rounded square, 3-letter station code on top (when known),
 *                   white inner square framed in the line colour, line code + number.
 *   Everything else (Metro, Toei, private, tram, monorail):
 *                   line-coloured ring, white centre, line code over number.
 * Two renderers share the same geometry: svg() for the DOM, draw() for the map canvas.
 * ------------------------------------------------------------------ */
(function (g) {
  'use strict';
  const INK = '#231F20';
  const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, 'Noto Sans JP', sans-serif";

  // Official JR East 3-letter station codes, keyed by station id.
  // Hand-entered from memory — stations missing here simply show the badge without the header.
  const ABBR = {
    tokyo: 'TYO', kanda: 'KDA', akihabara: 'AKB', ueno: 'UEN', nippori: 'NPR', otsuka: 'OTK',
    ikebukuro: 'IKB', shinjuku: 'SJK', shibuya: 'SBY', ebisu: 'EBS', meguro: 'MGR',
    shinagawa: 'SGW', hamamatsucho: 'HMC', shimbashi: 'SMB'
  };
  const abbr = id => ABBR[id] || '';

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad2 = n => String(n).padStart(2, '0');
  // font size (in a 100-unit box) for the line code, by its length
  const codeFont = (len, big) => big ? (len <= 1 ? 30 : len === 2 ? 25 : 19) : (len <= 1 ? 44 : len === 2 ? 36 : 28);

  /* ---------- DOM (inline SVG) ---------- */
  // opts: { size: px, code: 'TYO' (JR only, shown when size >= 34) }
  function svg(L, num, opts) {
    opts = opts || {};
    const size = opts.size || 32;
    const hasNum = num != null && num !== '';
    const n = hasNum ? pad2(num) : '';
    const label = `${L.code}${n} – ${L.en}`;
    const head = `<svg class="stn-badge stn-badge--${L.type === 'jr' ? 'jr' : 'ring'}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title>`;
    const T = (y, fs, wt, txt) => `<text x="50" y="${y}" text-anchor="middle" font-family="${FONT}" font-weight="${wt}" font-size="${fs}" fill="${INK}">${esc(txt)}</text>`;

    if (L.type === 'jr') {
      const sc = size >= 34 ? String(opts.code || '').toUpperCase().slice(0, 3) : '';
      const iy = sc ? 27 : 12, ih = sc ? 62 : 76;
      return head +
        `<rect x="2" y="2" width="96" height="96" rx="16" fill="${INK}" stroke="rgba(255,255,255,.3)" stroke-width="2"/>` +
        (sc ? `<text x="50" y="22" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="22" letter-spacing="1" fill="#fff">${esc(sc)}</text>` : '') +
        `<rect x="11" y="${iy}" width="78" height="${ih}" rx="7" fill="#fff" stroke="${L.color}" stroke-width="8"/>` +
        (hasNum
          ? T(sc ? 52 : 38, sc ? 21 : 24, 700, L.code) + T(sc ? 82 : 76, sc ? 33 : 38, 800, n)
          : T(sc ? 69 : 66, 34, 800, L.code)) +
        '</svg>';
    }
    return head +
      `<circle cx="50" cy="50" r="44" fill="#fff" stroke="${L.color}" stroke-width="12"/>` +
      (hasNum
        ? T(44, codeFont(L.code.length, true), 700, L.code) + T(76, 34, 800, n)
        : T(50 + codeFont(L.code.length, false) * .36, codeFont(L.code.length, false), 800, L.code)) +
      '</svg>';
  }

  /* ---------- Canvas ---------- */
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  // Draws a badge with its top-left corner at (x, y), s px square. num may be '' / null.
  function draw(ctx, L, num, x, y, s) {
    const hasNum = num != null && num !== '';
    const cx = x + s / 2, cy = y + s / 2, fn = 'Inter, system-ui, sans-serif';
    ctx.save();
    if (L.type === 'jr') {
      ctx.fillStyle = INK; rr(ctx, x, y, s, s, s * .16); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.strokeStyle = L.color; ctx.lineWidth = s * .08;
      rr(ctx, x + s * .15, y + s * .15, s * .70, s * .70, s * .07); ctx.fill(); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(cx, cy, s * .44 - s * .06, 0, 7); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.lineWidth = s * .12; ctx.strokeStyle = L.color; ctx.stroke();
    }
    ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const len = L.code.length, k = len <= 1 ? .3 : len === 2 ? .25 : .19;
    if (hasNum) {
      ctx.font = `700 ${s * k}px ${fn}`; ctx.fillText(L.code, cx, cy - s * .14);
      ctx.font = `800 ${s * .3}px ${fn}`; ctx.fillText(pad2(num), cx, cy + s * .15);
    } else {
      ctx.font = `800 ${s * (k + .12)}px ${fn}`; ctx.fillText(L.code, cx, cy + s * .02);
    }
    ctx.restore();
  }

  g.StationBadge = { svg, draw, abbr, ABBR };
})(window);
