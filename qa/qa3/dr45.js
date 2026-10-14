const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const ROOT = path.resolve(__dirname, '..', '..');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1500, height: 1000 } }); await p.goto('file://' + ROOT + '/qa-cur.html');
  const st = fs.readFileSync(path.join(__dirname, 'journey-state.json'), 'utf8'); await p.evaluate(s => localStorage.setItem('aion2-assassin-route-v4', s), st); await p.reload(); await p.waitForTimeout(600);
  await p.click('#sdTab'); await p.waitForTimeout(600);
  console.log((await p.evaluate(() => document.getElementById('sdPanel').innerText)).replace(/\n+/g, ' | '));
  const ks = await p.$('#sdPanel >> text=Key setup'); if (ks) { await ks.click(); await p.waitForTimeout(500); }
  await p.screenshot({ path: path.join(__dirname, 'shots', 'drawer-45.png') });
  console.log('AFTER KEY: ' + (await p.evaluate(() => document.getElementById('sdPanel').innerText)).replace(/\n+/g, ' | ').slice(-900));
  await b.close(); })();
