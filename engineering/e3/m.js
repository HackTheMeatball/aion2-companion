const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const ROOT = path.resolve(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'polish/qa/regress.js'), 'utf8'); const buildFixture = eval('(' + src.match(/function buildFixture[\s\S]*?\n}\n/)[0] + ')');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +(process.argv[2] || 1100), height: 1000 } });
  await p.goto('file://' + ROOT + '/qa-cur.html'); await p.evaluate(buildFixture, { L: +(process.argv[3] || 27), mode: process.argv[4] || 'advanced', fx: 'clean' }); await p.reload(); await p.waitForTimeout(400);
  console.log(await p.evaluate(new Function('return (' + process.argv[5] + ')()')));
  await b.close(); })();
