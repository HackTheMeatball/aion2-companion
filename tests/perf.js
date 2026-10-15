/* Performance: update() (the full re-render after every change) median of 10 runs stays under 15 ms.
   Non-blocking: wall-clock timing trips on a busy machine (docs/ISSUES.md), so CI runs this in its own `perf` job that
   only warns, and it is not part of `ci-ok` or the default `npm test`. Run it locally: `npm run test:perf`
   (or `node tests/run.mjs --only perf` after `npm run build`). Same states the checks used before they moved here:
     e1       Lv 30 "Dying Light", Advanced, clean save, at 1500 / 1100 / 390 px (median = 6th of 10 sorted)
     regress  Lv 25-45 (--quick: 8 levels) x clean / messy, Advanced, 1500 px (median = mean of 5th and 6th of 10)
   Writes tests/out/perf/results.json. */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const CFG = require('./config');
const { clean, setState: setE1 } = require('./support/e1-fixture');
const { buildFixture } = require('./support/regress-fixture');
const OUT = path.join(CFG.OUT, 'perf'), LIMIT = 15, QUICK = process.argv.includes('--quick');
const LEVELS = QUICK ? [25, 27, 30, 32, 37, 40, 44, 45] : Array.from({ length: 21 }, (_, i) => 25 + i);
fs.mkdirSync(OUT, { recursive: true });
let fail = 0; const results = [];
const ok = (name, ms) => { const pass = ms < LIMIT; results.push({ name, ms: +ms.toFixed(1), pass }); console.log((pass ? 'ok   ' : 'FAIL ') + name + '  · ' + ms.toFixed(1) + ' ms'); if (!pass) fail++; };
const times = p => p.evaluate(() => { const t = []; for (let i = 0; i < 10; i++) { const a = performance.now(); update(); t.push(performance.now() - a); } return t.sort((a, b) => a - b); });
(async () => {
  const b = await chromium.launch(); const errs = [];
  { /* e1 */
    const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 } }), p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(CFG.CUR); await p.waitForTimeout(300);
    for (const [w, h] of [[1500, 1000], [1100, 900], [390, 850]]) {
      await p.setViewportSize({ width: w, height: h }); await setE1(p, clean(30, 'Dying Light', 'advanced'));
      ok(`e1 ${w}px Lv 30: update() median < ${LIMIT} ms`, (await times(p))[5]);
    }
    await ctx.close();
  }
  { /* regress */
    const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 } }), p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(CFG.CUR); await p.waitForTimeout(300);
    for (const fx of ['clean', 'messy']) for (const L of LEVELS) {
      await p.evaluate(buildFixture, { L, mode: 'advanced', fx }); await p.reload(); await p.waitForTimeout(350);
      const t = await times(p); ok(`regress 1500px advanced ${fx} Lv ${L}: update() median of 10 under ${LIMIT} ms`, (t[4] + t[5]) / 2);
    }
    await ctx.close();
  }
  if (errs.length) { console.log('FAIL no page errors  · ' + errs.join(' | ')); fail++; }
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 1));
  const ms = results.map(r => r.ms).sort((a, b) => a - b);
  console.log(`update() over ${results.length} states: median ${ms[ms.length >> 1]} ms, max ${ms[ms.length - 1]} ms`);
  console.log(fail ? `PERF CHECKS FAILED (${fail})` : 'PERF CHECKS PASSED');
  await b.close(); process.exit(fail ? 1 : 0);
})();
