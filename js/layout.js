/* Sidebar layout: remembers which sections are open and lets the user drag the
 * divider between the line list and the Display / Spots / Timetable panels. */
(function () {
  'use strict';
  const KEY = 'trs.ui.v1';
  let st = {};
  try { st = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { st = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* ignore */ } };

  // collapsible sections
  document.querySelectorAll('#sidebar details.sec[id]').forEach(d => {
    if (typeof st[d.id] === 'boolean') d.open = st[d.id];
    d.addEventListener('toggle', () => { st[d.id] = d.open; save(); });
  });

  // draggable divider (controls the height of the lower panel)
  const foot = document.getElementById('sideFoot'), sp = document.getElementById('splitter'), side = document.getElementById('sidebar');
  if (!foot || !sp) return;
  const apply = h => {
    if (h == null) { foot.style.removeProperty('--footH'); foot.style.maxHeight = ''; return; }
    foot.style.setProperty('--footH', h + 'px'); foot.style.maxHeight = 'none';
  };
  const clampH = h => Math.max(38, Math.min(h, side.clientHeight - 240));
  if (typeof st.footH === 'number') apply(clampH(st.footH));

  let startY = 0, startH = 0;
  const move = e => { apply(clampH(startH + (startY - e.clientY))); };
  const up = () => {
    sp.classList.remove('drag'); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
    st.footH = foot.getBoundingClientRect().height; save();
  };
  sp.addEventListener('pointerdown', e => {
    e.preventDefault(); sp.classList.add('drag'); startY = e.clientY; startH = foot.getBoundingClientRect().height;
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  });
  sp.addEventListener('dblclick', () => { apply(null); delete st.footH; save(); });
  sp.addEventListener('keydown', e => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const h = foot.getBoundingClientRect().height + (e.key === 'ArrowUp' ? 30 : -30);
    apply(clampH(h)); st.footH = foot.getBoundingClientRect().height; save();
  });
  window.addEventListener('resize', () => { if (typeof st.footH === 'number') apply(clampH(st.footH)); });
})();
