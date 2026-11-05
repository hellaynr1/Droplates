// Droplates end-to-end checks. Usage: python3 -m http.server 8766 (repo root), then: node tests/run.js
// Requires Playwright (available in dev environment; not shipped to customers).
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const BASE = process.env.BASE || 'http://localhost:8766/';
const ROOT = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/templates.json')));
const FREE = data.templates.filter(t => t.status === 'released');
let pass = 0, fail = 0;
const ok = (cond, msg) => { cond ? pass++ : fail++; console.log((cond ? '  ✓ ' : '  ✗ ') + msg); };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const p = await ctx.newPage(); const errors = []; p.on('pageerror', e => errors.push(p.url() + ' ' + e.message));

  console.log('Product metadata');
  for (const t of FREE) {
    const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'products', t.slug, 'manifest.json')));
    ok(m.presets.length === 3 && t.presets.length === 3, `${t.slug}: 3 presets`);
    ok(m.pages.length === t.pages.length, `${t.slug}: pages match catalog (${t.pages.length})`);
    ok(m.files.every(f => fs.existsSync(path.join(ROOT, 'products', t.slug, f))), `${t.slug}: all manifest files exist`);
    ok(m.edition === 'free' && m.editions.premium.status === 'planned' && m.editions.pro.status === 'planned', `${t.slug}: edition model (free released, premium/pro planned)`);
    ok(!m.files.some(f => /premium|pro\//i.test(f)), `${t.slug}: no paid files in free package`);
  }

  console.log('Site crawl (internal links)');
  const seen = new Set(), queue = [''];
  while (queue.length) {
    const u = queue.shift(); if (seen.has(u)) continue; seen.add(u);
    const r = await p.goto(BASE + u); if (!r || r.status() !== 200) { ok(false, 'route ' + u + ' → ' + (r && r.status())); continue; }
    const links = await p.evaluate(() => [...document.querySelectorAll('a[href]')].map(a => a.href).filter(h => h.startsWith(location.origin)));
    for (const l of links) { const rel = l.replace(/^https?:\/\/[^/]+\//, '').split('#')[0].split('?')[0]; if (!seen.has(rel) && !rel.startsWith('studio') && !rel.startsWith('preview')) queue.push(rel); }
  }
  ok(seen.size > 30, `crawled ${seen.size} pages, all returned 200`);

  console.log('Catalog');
  await p.goto(BASE + 'templates/'); await p.fill('#q', 'portfolio'); await p.waitForTimeout(200);
  ok(await p.locator('.tcard:visible').count() >= 1, 'search finds portfolio');
  await p.goto(BASE + 'templates/?tier=free'); await p.waitForTimeout(200);
  ok(await p.locator('.tcard:visible').count() === 3, 'free filter shows 3 templates');

  console.log('Customer journey: catalog → product → Studio → ZIP');
  for (const t of FREE) {
    await p.goto(BASE + 'templates/'); await p.click(`.tcard[data-slug="${t.slug}"]`); await p.waitForLoadState();
    ok(p.url().includes('/templates/' + t.slug + '/'), `${t.slug}: product page opens`);
    await p.click('text=Customize'); await p.waitForSelector('#form fieldset');
    ok(p.url().includes('studio/?t=' + t.slug), `${t.slug}: Customize opens Studio`);
    await p.click(`#form .chips button:text-is("${t.presets[1].toLowerCase()}")`); await p.waitForTimeout(300);
    ok(await p.evaluate(() => document.getElementById('frame').contentDocument.documentElement.dataset.preset) === t.presets[1].toLowerCase(), `${t.slug}: preset applies in preview`);
    await p.click('#form .chips button:text-is("dark")'); await p.waitForTimeout(200);
    ok(await p.evaluate(() => document.getElementById('frame').contentDocument.documentElement.dataset.theme) === 'dark', `${t.slug}: theme switch`);
    const invalid = await p.evaluate(() => document.getElementById('frame').contentWindow.SITE.validate({ preset: 'nope', theme: 'x', style: { accent: 'red;}body{', font: 'Comic' }, hero: { ctaUrl: 'javascript:alert(1)' } }));
    ok(invalid.preset !== 'nope' && invalid.style.accent !== 'red;}body{' && !/javascript/.test(invalid.hero ? invalid.hero.ctaUrl || '' : ''), `${t.slug}: config validation rejects invalid values`);
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#download')]);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dz-')); const zp = path.join(dir, 'x.zip'); await dl.saveAs(zp);
    execFileSync('python3', ['-c', 'import zipfile,sys;zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])', zp, dir]);
    const site = path.join(dir, 'droplates-' + t.slug);
    ok(['README.md', 'LICENSE.txt', 'config.js', 'index.html'].every(f => fs.existsSync(path.join(site, f))), `${t.slug}: ZIP has README, LICENSE, config, pages`);
    const q = await ctx.newPage(); await q.goto('file://' + site + '/index.html');
    ok(await q.evaluate(() => document.documentElement.dataset.preset + '/' + document.documentElement.dataset.theme) === t.presets[1].toLowerCase() + '/dark', `${t.slug}: exported site keeps settings without Droplates`);
    for (const f of fs.readdirSync(site).filter(f => f.endsWith('.html'))) { await q.goto('file://' + site + '/' + f); if (!await q.evaluate(() => !!window.SITE)) ok(false, `${t.slug}: exported ${f} loads`); }
    await q.close();
    // product page Download free button
    await p.goto(BASE + 'templates/' + t.slug + '/');
    const [dl2] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.click('text=Download free')]);
    ok(!!dl2, `${t.slug}: Download free on product page delivers a ZIP`);
  }

  console.log('Mobile');
  const m = await b.newContext({ ...devices['iPhone 13'] }); const mp = await m.newPage();
  for (const u of ['', 'templates/', 'templates/saas/', 'studio/?t=saas', ...FREE.map(t => 'products/' + t.slug + '/index.html')]) {
    await mp.goto(BASE + u); await mp.waitForTimeout(400);
    ok(await mp.evaluate(() => document.documentElement.scrollWidth) <= 390, 'no horizontal scroll: /' + u);
  }
  ok(errors.length === 0, 'no JavaScript errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  console.log(`\n${pass} passed, ${fail} failed`);
  await b.close(); process.exit(fail ? 1 : 0);
})();
