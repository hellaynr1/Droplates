(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  $('#y').textContent = new Date().getFullYear();
  const nav = $('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Hero 3D logo: plays on its own, no scrolling needed ---------- */
  const stage = $('#stage'), stack = $('#stack');
  const layers = $$('.layer', stack).sort((a, b) => a.dataset.i - b.dataset.i); // 0 = top
  const labels = $$('#labels li');
  const wires = labels.map(() => { const d = document.createElement('span'); d.className = 'wire'; d.setAttribute('aria-hidden', 'true'); stage.appendChild(d); return d; });
  const STEP = 2600;
  let act = 0, last = performance.now(), held = false, tx = 0, ty = 0, spread = 0;

  function frame(now) {
    const m = innerWidth < 600, t = now / 1000;
    if (!held && !reduce && now - last > STEP) { act = (act + 1) % 3; last = now; }
    // gentle breathing spread + slow quarter-turn sway; layers always stay aligned
    const target = reduce ? 0 : 0.5 - 0.5 * Math.cos(t * 1.1);
    spread += (target - spread) * 0.08;
    const g = (m ? 20 : 38) + (m ? 16 : 30) * spread;
    const rot = reduce ? 0 : 45 * (0.5 - 0.5 * Math.cos(t * 0.35));
    stack.style.setProperty('--rot', rot + 'deg');
    stack.style.setProperty('--tx', tx + 'deg'); stack.style.setProperty('--ty', ty + 'deg');
    layers.forEach((l, k) => { l.style.transform = `translateZ(${(2 - k) * g}px)`; l.classList.toggle('lit', k === act); });

    const s = stage.getBoundingClientRect();
    const pts = layers.map(l => { const b = l.getBoundingClientRect(); return { x: b.left - s.left + 4, y: b.top - s.top + b.height / 2 }; });
    const cy = (pts[0].y + pts[2].y) / 2, S = m ? 58 : 80;
    const startX = Math.min(...pts.map(q => q.x)) - (m ? 20 : 44);
    pts.forEach((q, k) => {
      const li = labels[k], w = wires[k], ly = cy + (k - 1) * S;
      li.style.setProperty('--x', startX + 'px'); li.style.setProperty('--y', ly + 'px');
      const dx = q.x - startX, dy = q.y - ly;
      w.style.left = startX + 'px'; w.style.top = ly + 'px';
      w.style.width = Math.max(0, Math.hypot(dx, dy)) + 'px';
      w.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
      li.classList.toggle('on', k === act); w.classList.toggle('on', k === act);
    });
    if (!document.hidden) requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) requestAnimationFrame(frame); });
  requestAnimationFrame(frame);

  // Hover or tap a step (or a layer) to show it; resumes after leaving
  const pick = k => { act = k; last = performance.now(); };
  labels.forEach((li, k) => {
    const b = $('button', li);
    b.addEventListener('click', () => { pick(k); held = true; });
    b.addEventListener('mouseenter', () => { pick(k); held = true; });
    b.addEventListener('mouseleave', () => { held = false; last = performance.now(); });
    b.addEventListener('focus', () => { pick(k); held = true; });
    b.addEventListener('blur', () => { held = false; });
  });
  if (!reduce && matchMedia('(hover:hover)').matches) {
    stage.addEventListener('pointermove', ev => { const b = stage.getBoundingClientRect(); tx = ((ev.clientX - b.left) / b.width - .5) * 16; ty = ((ev.clientY - b.top) / b.height - .5) * -10; });
    stage.addEventListener('pointerleave', () => { tx = ty = 0; });
  }

  /* ---------- Platform tabs ---------- */
  const tabs = $$('[role="tab"]');
  const select = t => tabs.forEach(x => { const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; $('#' + x.getAttribute('aria-controls')).hidden = !on; });
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
      const n = tabs[(i + d + tabs.length) % tabs.length]; select(n); n.focus();
    });
  });
})();
