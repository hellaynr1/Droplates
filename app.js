(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  $('#y').textContent = new Date().getFullYear();
  const nav = $('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- 3D logo: hover to reveal Pick / Drop / Launch ---------- */
  const stage = $('#stage'), stack = $('#stack');
  const layers = $$('.layer', stack).sort((a, b) => a.dataset.i - b.dataset.i); // 0 = top
  const calls = $$('#callouts li');
  const canHover = matchMedia('(hover:hover)').matches;
  $('#hint-txt').textContent = canHover ? 'Hover the logo' : 'Tap the logo';
  let open = false, active = -1;

  const gap = () => { const m = innerWidth < 600; return open ? (m ? 46 : 78) : (m ? 26 : 44); };
  function layout() {
    const g = gap();
    layers.forEach((l, k) => l.style.setProperty('--z', (2 - k) * g + 'px'));
    stage.classList.toggle('open', open);
    stage.classList.toggle('has-active', open && active > -1);
    layers.forEach((l, k) => l.classList.toggle('is-active', k === active));
    calls.forEach((c, k) => c.classList.toggle('is-active', k === active));
    track();
  }

  // Pin each callout line to the left corner of its layer, following the 3D movement
  let until = 0, raf = 0;
  function place() {
    const s = stage.getBoundingClientRect();
    const labelEdge = innerWidth < 600 ? 108 : 260;
    layers.forEach((l, k) => {
      const r = l.getBoundingClientRect();
      const x = r.left - s.left + 4, y = r.top - s.top + r.height * 0.5;
      const startX = Math.min(labelEdge, x - 24);
      const c = calls[k];
      c.style.setProperty('--y', y + 'px');
      c.style.setProperty('--x', x + 'px');
      c.style.setProperty('--w', Math.max(16, x - startX) + 'px');
    });
  }
  function track() {
    until = performance.now() + 450;
    if (!raf) raf = requestAnimationFrame(function f(t) { place(); raf = t < until ? requestAnimationFrame(f) : 0; });
  }
  const setOpen = v => {
    if (open === v) return;
    open = v; if (!v) active = -1;
    $('#hint').classList.toggle('gone', v);
    layout();
  };

  if (canHover) {
    stage.addEventListener('pointerenter', () => setOpen(true));
    stage.addEventListener('pointerleave', () => setOpen(false));
    layers.forEach((l, k) => {
      l.addEventListener('pointerenter', () => { active = k; layout(); });
      l.addEventListener('pointerleave', () => { active = -1; layout(); });
    });
  } else {
    stage.addEventListener('click', e => {
      const l = e.target.closest('.layer');
      if (!open) { setOpen(true); return; }
      if (l) { active = active === +l.dataset.i ? -1 : +l.dataset.i; layout(); } else setOpen(false);
    });
  }
  stage.addEventListener('focus', () => setOpen(true));
  stage.addEventListener('blur', () => setOpen(false));
  stage.addEventListener('keydown', e => {
    if (!open) return;
    const d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0; if (!d) return;
    e.preventDefault(); active = (active + d + 3) % 3; layout();
  });

  // Tilt toward the pointer
  if (!reduce) {
    let tr = 0, tx = 0, ty = 0;
    const apply = () => { tr = 0; stack.style.setProperty('--tx', tx + 'deg'); stack.style.setProperty('--ty', ty + 'deg'); track(); };
    stage.addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 22;
      ty = ((e.clientY - r.top) / r.height - 0.5) * -12;
      if (!tr) tr = requestAnimationFrame(apply);
    });
    stage.addEventListener('pointerleave', () => { tx = ty = 0; if (!tr) tr = requestAnimationFrame(apply); });
  }
  layout();
  addEventListener('resize', layout);
  if (document.fonts) document.fonts.ready.then(place);

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
