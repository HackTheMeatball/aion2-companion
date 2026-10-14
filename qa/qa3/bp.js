const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const ROOT = path.resolve(__dirname, '..', '..');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1500, height: 1000 } }); await p.goto('file://' + ROOT + '/qa-cur.html');
  const st = fs.readFileSync(path.join(__dirname, 'journey-state.json'), 'utf8'); await p.evaluate(s => localStorage.setItem('aion2-assassin-route-v4', s), st); await p.reload(); await p.waitForTimeout(600);
  const y0 = await p.evaluate(() => scrollY); await p.click('#spCard a[data-gogate="build"]'); await p.waitForTimeout(800);
  console.log('scroll', y0, '->', await p.evaluate(() => scrollY), 'hash', await p.evaluate(() => location.hash), 'drawer open', await p.evaluate(() => { const d = document.getElementById('statDrawer') || document.getElementById('sdPanel'); return d && (d.className + ' ' + getComputedStyle(d).transform); }));
  await p.screenshot({ path: path.join(__dirname, 'shots', 'buildplan-click.png') });
  await b.close(); })();
