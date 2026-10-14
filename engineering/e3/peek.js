/* E3 quick look: Next up cards + top-card texts for a few fixtures. node polish/e3/peek.js [L,...] [mode] [fx] */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const ROOT = path.resolve(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'polish/qa/regress.js'), 'utf8'); const buildFixture = eval('(' + src.match(/function buildFixture[\s\S]*?\n}\n/)[0] + ')');
const Ls = (process.argv[2] || '27,30,37,45').split(',').map(Number), modes = (process.argv[3] || 'advanced').split(','), fxs = (process.argv[4] || 'clean,messy').split(',');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1500, height: 1000 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + ROOT + '/qa-cur.html');
  for (const fx of fxs) for (const mode of modes) for (const L of Ls) { await p.evaluate(buildFixture, { L, mode, fx }); await p.reload(); await p.waitForTimeout(300);
    const r = await p.evaluate(() => ({ cards: [...document.querySelectorAll('#nowStar .ns-card')].map(c => c.querySelector('h3').innerText.replace(/\s+/g, ' ') + ' | ' + (c.querySelector('.title > p') || {}).innerText), sp: document.getElementById('spHero').innerText.replace(/\s+/g, ' '), dv: document.getElementById('dvNextList').innerText.replace(/\s+/g, ' ').slice(0, 200), st: document.getElementById('stBody').innerText.replace(/\s+/g, ' ').slice(0, 300) }));
    console.log(`== ${fx} ${mode} ${L}`); r.cards.forEach(c => console.log('  ' + c)); console.log('  SP: ' + r.sp + '\n  DV: ' + r.dv + '\n  ST: ' + r.st); }
  console.log('errors', errs); await b.close(); })();
