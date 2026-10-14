const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const ROOT = path.resolve(__dirname, '..', '..');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1500, height: 1000 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.goto('file://' + ROOT + '/qa-cur.html');
  const st = fs.readFileSync(path.join(__dirname, 'journey-state.json'), 'utf8'); await p.evaluate(s => localStorage.setItem('aion2-assassin-route-v4', s), st); await p.reload(); await p.waitForTimeout(600);
  const btn = await p.$('text=Quest done'); console.log('btn', !!btn, btn && await btn.isVisible());
  const before = await p.evaluate(() => JSON.stringify([state.quest, state.storyEnd]));
  if (btn) { await btn.click(); await p.waitForTimeout(800); }
  console.log(before, '->', await p.evaluate(() => JSON.stringify([state.quest, state.storyEnd])), 'qs:', await p.evaluate(() => document.getElementById('questSubs').innerText.replace(/\s+/g, ' ').slice(0, 200)));
  await (await p.$('#track') || await p.$('body')).screenshot({ path: path.join(__dirname, 'shots', 'end-rail.png') }).catch(() => {});
  console.log(errs); await b.close(); })();
