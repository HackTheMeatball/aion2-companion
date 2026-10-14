const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const ROOT = path.resolve(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'polish/qa/regress.js'), 'utf8'); const buildFixture = eval('(' + src.match(/function buildFixture[\s\S]*?\n}\n/)[0] + ')');
(async () => { const b = await chromium.launch();
  for (const [w, L, fx] of [[1500, 45, 'clean'], [390, 33, 'messy'], [1100, 37, 'messy']]) { const p = await b.newPage({ viewport: { width: w, height: 900 } }); await p.goto('file://' + ROOT + '/qa-cur.html');
    await p.evaluate(buildFixture, { L, mode: 'advanced', fx }); await p.reload(); await p.waitForTimeout(400);
    await p.evaluate(() => { const ww = document.getElementById('nsqWrap'), cs = [...ww.children], i = cs.findIndex(c => /Regional quests/.test(c.querySelector('h3').innerText)); ww.style.scrollBehavior = 'auto'; ww.scrollTop = cs[i].offsetTop - cs[0].offsetTop; document.getElementById('nowStar').scrollIntoView(); });
    await p.waitForTimeout(700); const q = await p.$('#nowStar .ns-qgrid .ql.new'); if (q) await q.hover(); await p.waitForTimeout(250);
    const box = await (await p.$('#nowStar')).boundingBox(); await p.screenshot({ path: path.join(__dirname, 'shots', `rq-${w}-${L}.png`), clip: { x: 0, y: Math.max(0, box.y - 10), width: w, height: Math.min(700, box.height + 60) } }); await p.close(); }
  await b.close(); })();
