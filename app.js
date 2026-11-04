(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const state = { category: null, style: null, structure: null, sections: new Set() };
  const desc = $('#desc');

  $('#y').textContent = new Date().getFullYear();
  const nav = $('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  desc.addEventListener('input', () => { $('#count').textContent = `${desc.value.length}/500`; $('#err1').textContent = ''; });

  $$('.chip').forEach(c => c.setAttribute('aria-pressed', 'false'));
  $$('[data-single]').forEach(group => {
    const key = group.dataset.single;
    group.addEventListener('click', e => {
      const chip = e.target.closest('.chip'); if (!chip) return;
      const on = chip.getAttribute('aria-pressed') !== 'true';
      $$('.chip', group).forEach(c => c.setAttribute('aria-pressed', 'false'));
      chip.setAttribute('aria-pressed', String(on));
      state[key] = on ? chip.dataset.value : null;
      $('#err1').textContent = '';
    });
  });
  $$('[data-multi]').forEach(group => {
    const set = state[group.dataset.multi];
    group.addEventListener('click', e => {
      const chip = e.target.closest('.chip'); if (!chip) return;
      const on = chip.getAttribute('aria-pressed') !== 'true';
      chip.setAttribute('aria-pressed', String(on));
      on ? set.add(chip.dataset.value) : set.delete(chip.dataset.value);
    });
  });

  const show = n => {
    $$('.panel').forEach(p => { p.hidden = p.dataset.panel !== String(n); });
    $$('.step').forEach(s => {
      const k = +s.dataset.step;
      s.classList.toggle('is-active', k === n);
      s.classList.toggle('is-done', k < n);
      k === n ? s.setAttribute('aria-current', 'step') : s.removeAttribute('aria-current');
    });
    if (n === 3) renderBrief();
    const h = $(`[data-panel="${n}"] h2`); h.tabIndex = -1; h.focus({ preventScroll: true });
    $('#finder').scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  $$('[data-next]').forEach(b => b.addEventListener('click', () => {
    const n = +b.dataset.next;
    if (n === 2 && !desc.value.trim() && !state.category) {
      $('#err1').textContent = 'Add a short description or choose a category.'; return;
    }
    show(n);
  }));

  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function renderBrief() {
    const rows = [
      ['Description', desc.value.trim()],
      ['Category', state.category],
      ['Style', state.style],
      ['Structure', state.structure],
      ['Sections', [...state.sections].join(', ')],
    ].filter(([, v]) => v);
    $('#brief').innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');
  }

  $('#restart').addEventListener('click', () => {
    desc.value = ''; $('#count').textContent = '0/500';
    Object.assign(state, { category: null, style: null, structure: null }); state.sections.clear();
    $$('.chip').forEach(c => c.setAttribute('aria-pressed', 'false'));
    show(1);
  });
})();
