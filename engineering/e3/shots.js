/* E3 screenshots: node polish/e3/shots.js [tag] [L,...] [widths] [modes] [fx] → polish/e3/shots/<tag>-<w>-<mode>-<L>.png (viewport) */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const ROOT = path.resolve(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'polish/qa/regress.js'), 'utf8'); const buildFixture = eval('(' + src.match(/function buildFixture[\s\S]*?\n}\n/)[0] + ')');
const tag = process.argv[2] || 'cur', Ls = (process.argv[3] || '27,30,37,45').split(',').map(Number), Ws = (process.argv[4] || '1500,1100,390').split(',').map(Number), Ms = (process.argv[5] || 'advanced,basic').split(','), fx = process.argv[6] || 'clean';
const OUT = path.join(__dirname, 'shots'); fs.mkdirSync(OUT, { recursive: true });
(async () => { const b = await chromium.launch(); const errs = [];
  for (const w of Ws) { const ctx = await b.newContext({ viewport: { width: w, height: w === 390 ? 844 : 1000 } }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + ROOT + '/qa-cur.html');
    for (const mode of Ms) for (const L of Ls) { await p.evaluate(buildFixture, { L, mode, fx }); await p.reload(); await p.waitForTimeout(450); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(100);
      await p.screenshot({ path: path.join(OUT, `${tag}-${w}-${mode}-${L}.png`) });
      if (w === 390) { await p.evaluate(() => document.getElementById('stCard').scrollIntoView()); await p.waitForTimeout(150); await p.screenshot({ path: path.join(OUT, `${tag}-${w}-${mode}-${L}-b.png`) });
        await p.evaluate(() => document.getElementById('nowStar').scrollIntoView()); await p.waitForTimeout(150); await p.screenshot({ path: path.join(OUT, `${tag}-${w}-${mode}-${L}-c.png`) }); }
      else { await p.evaluate(() => document.getElementById('nowStar').scrollIntoView({ block: 'start' })); await p.waitForTimeout(150); await p.screenshot({ path: path.join(OUT, `${tag}-${w}-${mode}-${L}-ns.png`) }); } }
    await ctx.close(); }
  console.log('errors', errs); await b.close(); })();
