/* ------------------------------------------------------------------
 * Station-number badges in the Japanese signage style.
 *   JR lines      : white rounded square framed in the line colour, line code over number.
 *   Everything else (Metro, Toei, private, tram, monorail):
 *                   line-coloured ring, white centre, line code over number.
 * Two renderers share the same geometry: svg() for the DOM, draw() for the map canvas.
 * ------------------------------------------------------------------ */
(function (g) {
  'use strict';
  const INK = '#231F20';
  const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, 'Noto Sans JP', sans-serif";

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad2 = n => String(n).padStart(2, '0');
  // font size (in a 100-unit box) for the line code, by its length
  const codeFont = (len, big) => big ? (len <= 1 ? 30 : len === 2 ? 25 : 19) : (len <= 1 ? 44 : len === 2 ? 36 : 28);

  /* ---------- DOM (inline SVG) ---------- */
  // opts: { size: px }
  function svg(L, num, opts) {
    opts = opts || {};
    const size = opts.size || 32;
    const hasNum = num != null && num !== '';
    const n = hasNum ? pad2(num) : '';
    const label = `${L.code}${n} – ${L.en}`;
    const head = `<svg class="stn-badge stn-badge--${L.type === 'jr' ? 'jr' : 'ring'}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title>`;
    const T = (y, fs, wt, txt) => `<text x="50" y="${y}" text-anchor="middle" font-family="${FONT}" font-weight="${wt}" font-size="${fs}" fill="${INK}">${esc(txt)}</text>`;

    if (L.type === 'jr') {
      return head +
        `<rect x="7" y="7" width="86" height="86" rx="14" fill="#fff" stroke="${L.color}" stroke-width="14"/>` +
        (hasNum ? T(43, 27, 700, L.code) + T(80, 40, 800, n) : T(66, 36, 800, L.code)) +
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
      ctx.fillStyle = '#fff'; ctx.strokeStyle = L.color; ctx.lineWidth = s * .14;
      rr(ctx, x + s * .07, y + s * .07, s * .86, s * .86, s * .14); ctx.fill(); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(cx, cy, s * .44 - s * .06, 0, 7); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.lineWidth = s * .12; ctx.strokeStyle = L.color; ctx.stroke();
    }
    ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const len = L.code.length, k = len <= 1 ? .36 : len === 2 ? .3 : .23;
    if (hasNum) {
      ctx.font = `700 ${s * k}px ${fn}`; ctx.fillText(L.code, cx, cy - s * .16);
      ctx.font = `800 ${s * .38}px ${fn}`; ctx.fillText(pad2(num), cx, cy + s * .17);
    } else {
      ctx.font = `800 ${s * (k + .12)}px ${fn}`; ctx.fillText(L.code, cx, cy + s * .02);
    }
    ctx.restore();
  }

  g.StationBadge = { svg, draw };
})(window);
