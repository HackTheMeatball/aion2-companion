/* E4 screenshots of the changed bits. node polish/e4/shots.js */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const ROOT = path.resolve(__dirname, '..', '..'); const KEY = 'aion2-assassin-route-v4';
const src = fs.readFileSync(path.join(ROOT, 'polish/qa/regress.js'), 'utf8'); const buildFixture = eval('(' + src.match(/function buildFixture[\s\S]*?\n}\n/)[0] + ')');
(async () => { const b = await chromium.launch();
  for (const w of [1500, 390]) { const p = await b.newPage({ viewport: { width: w, height: 1000 } }); await p.goto('file://' + ROOT + '/qa-cur.html');
    const set = async (L, mod, mode = 'advanced') => { await p.evaluate(buildFixture, { L, mode, fx: 'clean' }); await p.evaluate(([k, m]) => { const s = JSON.parse(localStorage.getItem(k)); (new Function('s', m))(s); localStorage.setItem(k, JSON.stringify(s)); }, [KEY, mod]); await p.reload(); await p.waitForTimeout(500); };
    const shot = async name => { const el = await p.$('#nowStar'); await el.scrollIntoViewIfNeeded(); await el.screenshot({ path: path.join(__dirname, 'shots', `${name}-${w}.png`) }); };
    await set(38, `s.quest = "Fafnite's Whereabouts";`); await p.evaluate(() => { const c = [...document.querySelectorAll('#nowStar .ns-card')].findIndex(c => /Story/.test(c.innerText)); const w = document.getElementById('nsqWrap'); w.scrollTop = w.children[c].offsetTop - w.children[0].offsetTop; }); await p.waitForTimeout(400); await shot('meanwhile-38');
    await set(27, `s.quest = 'Preparations for Restoration';`); await p.evaluate(() => { const c = [...document.querySelectorAll('#nowStar .ns-card')].findIndex(c => /Regional/.test(c.innerText)); const w = document.getElementById('nsqWrap'); w.scrollTop = w.children[c].offsetTop - w.children[0].offsetTop; }); await p.waitForTimeout(300);
    await p.click('#nowStar .rq-wait summary'); await p.waitForTimeout(400); await shot('rq-wait-27');
    await set(30, `s.quest = 'Dying Light'; s.rqSnooze = { 'rq:2202018': 30 };`); await p.evaluate(() => { const c = [...document.querySelectorAll('#nowStar .ns-card')].findIndex(c => /Regional/.test(c.innerText)); const w = document.getElementById('nsqWrap'); w.scrollTop = w.children[c].offsetTop - w.children[0].offsetTop; }); await p.waitForTimeout(400); await shot('rq-snz-30');
    await set(40, `s.stones = 300; SP_STEPS.forEach(x => { s.checks[x.k] = !x.s.single; });`); await shot('single-40');
    await set(45, `s.stones = 100; SP_STEPS.forEach(x => { s.checks[x.k] = true; });`); const sp = await p.$('#spCard'); await sp.screenshot({ path: path.join(__dirname, 'shots', `spdone-45-${w}.png`) });
    await set(38, `['g20:exp','g25:0','g28:exp','g35:exp'].forEach(k => s.checks[k] = false);`, 'basic'); await p.screenshot({ path: path.join(__dirname, 'shots', `basic-38-${w}.png`) });
    await p.close(); }
  await b.close(); })();
