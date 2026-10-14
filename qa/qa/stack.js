const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..'), SH = path.join(__dirname, 'shots'), KEY = 'aion2-assassin-route-v4';
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 } }), p = await ctx.newPage();
  const user = fs.readFileSync(path.join(__dirname, 'fixture-user-v285.json'), 'utf8');
  await p.goto('file://' + ROOT + '/qa-v285.html'); await p.evaluate(([k, s]) => localStorage.setItem(k, s), [KEY, user]); await p.reload(); await p.waitForTimeout(400);
  await p.goto('file://' + ROOT + '/qa-cur.html'); await p.waitForTimeout(600);
  await p.evaluate(() => document.getElementById('nowStar').scrollIntoView({ block: 'start' })); await p.waitForTimeout(200);
  for (const want of ['Story:', 'Regional quests']) {
    const r = await p.evaluate(want => { const w = document.getElementById('nsqWrap'), cs = [...w.children], i = cs.findIndex(c => c.querySelector('h3').innerText.startsWith(want)); w.style.scrollBehavior = 'auto'; w.scrollTop = cs[i].offsetTop - cs[0].offsetTop; return { i, h: w.clientHeight, cardH: cs[i].offsetHeight, first: cs[0].offsetHeight }; }, want);
    console.log(want, r); await p.waitForTimeout(300);
    const box = await (await p.$('#nowStar')).boundingBox(); await p.screenshot({ path: path.join(SH, 'stack-user27-' + want.replace(/\W/g, '') + '.png'), clip: { x: box.x - 10, y: box.y - 10, width: box.width + 20, height: box.height + 60 } });
  }
  await b.close(); })();
