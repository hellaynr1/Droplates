(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  $('#y').textContent = new Date().getFullYear();
  const nav = $('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Scroll scene: Pick / Drop / Launch ---------- */
  const scene = $('#scene'), stage = $('#stage'), stack = $('#stack');
  const layers = $$('.layer', stack).sort((a, b) => a.dataset.i - b.dataset.i); // 0 = top
  const labels = $$('#labels li');
  const clamp = v => Math.max(0, Math.min(1, v));
  const ease = t => 1 - Math.pow(1 - t, 3);
  let tx = 0, ty = 0;

  function render() {
    const m = innerWidth < 600, vh = innerHeight;
    const r = scene.getBoundingClientRect();
    const p = clamp(-r.top / (r.height - vh));
    const e = ease(clamp(p * 1.6));
    const g = (m ? 24 : 42) + ((m ? 48 : 82) - (m ? 24 : 42)) * e;
    const act = p < 0.04 ? -1 : Math.min(2, Math.floor(p * 3.3));
    const lift = m ? 22 : 38;
    stack.style.setProperty('--tx', tx + 'deg'); stack.style.setProperty('--ty', ty + 'deg');
    stack.style.setProperty('--rot', (reduce ? 0 : p * 360) + 'deg');
    layers.forEach((l, k) => {
      let z = (2 - k) * g;
      if (act > -1 && k <= act) z += lift;
      const fan = reduce ? 0 : (k - 1) * -26 * e;
      l.style.transform = `translateZ(${z}px) rotateZ(${fan}deg)`;
      l.classList.toggle('dim', act > -1 && k !== act);
      l.classList.toggle('lit', k === act);
    });
    const s = stage.getBoundingClientRect();
    layers.forEach((l, k) => {
      const b = l.getBoundingClientRect(), li = labels[k];
      const x = b.left - s.left + 4, start = Math.min(m ? 96 : s.width / 2 - 230, x - 24);
      li.style.setProperty('--x', x + 'px');
      li.style.setProperty('--w', Math.max(16, x - start) + 'px');
      li.style.setProperty('--y', b.top - s.top + b.height / 2 + 'px');
      li.classList.toggle('on', k === act);
      li.classList.toggle('past', act > -1 && k < act);
    });
    $('#hint').classList.toggle('gone', p > 0.03);
  }
  let raf = 0;
  const req = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; render(); }); };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  if (!reduce && matchMedia('(hover:hover)').matches) {
    stage.addEventListener('pointermove', ev => { const b = stage.getBoundingClientRect(); tx = ((ev.clientX - b.left) / b.width - .5) * 18; ty = ((ev.clientY - b.top) / b.height - .5) * -10; req(); });
    stage.addEventListener('pointerleave', () => { tx = ty = 0; req(); });
  }
  render();
  if (document.fonts) document.fonts.ready.then(render);

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
