/* Visual parity: dist/ (served) vs the scratchpad production file (raw and wrapped like an artifact host). */
const { chromium } = require('playwright'); const sharp = require('sharp'); const fs = require('fs'); const path = require('path');
const BASE = process.env.AION_BASE, OUTD = process.argv[2]; fs.mkdirSync(OUTD, { recursive: true });
const R = '/home/claude/aion2-companion';
const src = fs.readFileSync(path.join(R, 'tests/regress.js'), 'utf8'); const buildFixture = eval('(' + src.match(/function buildFixture[\s\S]*?\n}\n/)[0] + ')');
const PAGES = { dist: BASE + '/', wrapped: BASE + '/__baselines/__orig-wrapped.html', raw: BASE + '/__baselines/__orig-raw.html' };
const STATES = [['fresh', null], ['L27-adv-clean', { L: 27, mode: 'advanced', fx: 'clean' }], ['L30-basic-messy', { L: 30, mode: 'basic', fx: 'messy' }], ['L45-adv-clean', { L: 45, mode: 'advanced', fx: 'clean' }]];
const HIDE = () => { const s = document.createElement('style'); s.textContent = '.fanline, #expBtn { display: none !important; }'; document.head.appendChild(s); };
(async () => {
  const b = await chromium.launch({ args: ['--host-resolver-rules=MAP fonts.googleapis.com ~NOTFOUND, MAP fonts.gstatic.com ~NOTFOUND'] });
  const rows = [];
  for (const width of [1500, 390]) for (const [name, fx] of STATES) {
    const shots = {}, errs = {};
    for (const [pg, url] of Object.entries(PAGES)) {
      const ctx = await b.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 }, serviceWorkers: 'block' }); const p = await ctx.newPage();
      errs[pg] = []; p.on('pageerror', e => errs[pg].push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs[pg].push(m.text()); });
      await p.goto(url); await p.waitForTimeout(300);
      if (fx) { await p.evaluate(buildFixture, fx); await p.reload(); }
      await p.waitForTimeout(700); await p.evaluate(HIDE); await p.waitForTimeout(200);
      shots[pg] = { top: await p.screenshot(), full: await p.screenshot({ fullPage: true }) };
      fs.writeFileSync(path.join(OUTD, `${width}-${name}-${pg}-top.png`), shots[pg].top);
      await ctx.close();
    }
    const diff = async (a, c) => { const A = await sharp(a).raw().toBuffer({ resolveWithObject: true }), C = await sharp(c).raw().toBuffer({ resolveWithObject: true });
      if (A.info.width !== C.info.width || A.info.height !== C.info.height) return `size ${A.info.width}x${A.info.height} vs ${C.info.width}x${C.info.height}`;
      let n = 0; for (let i = 0; i < A.data.length; i += A.info.channels) if (A.data[i] !== C.data[i] || A.data[i + 1] !== C.data[i + 1] || A.data[i + 2] !== C.data[i + 2]) n++; return n; };
    rows.push([width, name, 'dist vs wrapped top', await diff(shots.dist.top, shots.wrapped.top), 'full', await diff(shots.dist.full, shots.wrapped.full),
      '| dist vs raw top', await diff(shots.dist.top, shots.raw.top), 'full', await diff(shots.dist.full, shots.raw.full), 'errs', JSON.stringify(errs)]);
    console.log(rows[rows.length - 1].join(' '));
  }
  await b.close();
})();
