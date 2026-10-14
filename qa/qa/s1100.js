const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const ROOT = path.resolve(__dirname, '..', '..');
const src = fs.readFileSync(path.join(__dirname, 'regress.js'), 'utf8'); const buildFixture = eval('(' + src.match(/function buildFixture[\s\S]*?\n}\n/)[0] + ')');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1100, height: 900 } }); await p.goto('file://' + ROOT + '/qa-cur.html');
  for (const [L, mode] of [[32, 'advanced'], [40, 'basic']]) { await p.evaluate(buildFixture, { L, mode, fx: 'clean' }); await p.reload(); await p.waitForTimeout(400); await p.screenshot({ path: path.join(__dirname, 'shots', `1100-${mode}-${L}-top.png`) }); }
  await b.close(); })();
