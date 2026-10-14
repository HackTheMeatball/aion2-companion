const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const ROOT = path.resolve(__dirname, '..', '..');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1500, height: 1000 } }); await p.goto('file://' + ROOT + '/qa-cur.html');
  const st = fs.readFileSync(path.join(__dirname, 'journey-state.json'), 'utf8'); await p.evaluate(s => localStorage.setItem('aion2-assassin-route-v4', s), st); await p.reload(); await p.waitForTimeout(600);
  const c = () => p.evaluate(() => ['g27:1', 'g32:1', 'g37:1'].map(k => k + '=' + !!state.checks[k]).join(' ') + ' | tags ' + ['g27', 'g32', 'g37'].map(id => id + ':' + (document.querySelector('#' + id + ' .tag, #' + id + ' .gtag') || {}).innerText).join(' '));
  console.log('before', await c()); await p.click('#sdTab'); await p.waitForTimeout(500); await p.click('#sdClose'); await p.waitForTimeout(800); console.log('after close', await c());
  await b.close(); })();
