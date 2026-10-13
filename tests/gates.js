/* Story-gate regression (0.1.3): Next up must not offer a milestone step before its story prerequisite, nor a story
   step the story is already past. Sweeps every story position at {its quest level, 45} with an empty save, like the
   architecture audit's probe. node tests/gates.js  (page at AION_BASE; see tests/config.js) */
const { chromium } = require('playwright'); const CFG = require('./config');
const KEY = 'aion2-assassin-route-v4';
let fail = 0; const ok = (n, c, d) => { console.log((c ? 'ok   ' : 'FAIL ') + n + (!c && d !== undefined ? '  · ' + JSON.stringify(d).slice(0, 600) : '')); if (!c) fail++; };
const FLAGS = { seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(CFG.CUR); await p.waitForTimeout(300);
  const Q = await p.evaluate(() => QUESTS); const qi = n => Q.findIndex(([, q]) => q === n);
  /* Load a save and return the actionable Next up cards: [{k, h}] (k = milestone key for "tick:" cards). */
  const at = async (lv, quest, extra = {}) => {
    await p.evaluate(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), [KEY, { checks: {}, level: lv, quest, open: {}, mode: 'advanced', ...FLAGS, ...extra }]);
    await p.reload(); await p.waitForLoadState('domcontentloaded');
    return p.evaluate(() => [...document.querySelectorAll('#nsqWrap > .ns-card')].map(c => ({ btn: c.querySelector('.meta .ns-btn.primary'), h: c.querySelector('h3').innerText.replace(/\s+/g, ' ') }))
      .filter(x => x.btn).map(x => ({ k: (x.btn.dataset.now || '').replace(/^tick:/, ''), h: x.h })));
  };
  const has = (cs, k) => cs.some(c => c.k === k);
  ok('story data has the gate quests', ['The Being Beneath the Lake', 'Last of the Destruction Archons', 'A Daeva Dreaming Anew', 'Forgotten Commander'].every(n => qi(n) >= 0) && Q[Q.length - 1][1] === 'Forgotten Commander');

  /* Full sweep: every story position at its quest level and at 45. */
  const iDream = qi('A Daeva Dreaming Anew'), iLake = qi('The Being Beneath the Lake'), bad = { dreams: [], g45: [], g6: [], passed: [] };
  for (let i = 0; i < Q.length; i++) for (const L of [...new Set([Q[i][0], 45])]) {
    const cs = await at(L, Q[i][1]), tag = `Lv${L}@${Q[i][1]}`;
    if (i < iDream && has(cs, 'g32:dreams')) bad.dreams.push(tag);
    if (has(cs, 'g45:0')) bad.g45.push(tag);
    if (i > iLake && has(cs, 'g6:0')) bad.g6.push(tag);
    /* no card asks you to complete a story quest you're already past */
    cs.forEach(c => { const j = Q.findIndex(([, n]) => c.h.includes(`Complete "${n}"`)); if (j >= 0 && j < i) bad.passed.push(`${tag}: ${c.h}`); });
  }
  ok('g32:dreams ("The One Who Dreams") not offered before "A Daeva Dreaming Anew"', !bad.dreams.length, bad.dreams);
  ok('g45:0 not offered before "Forgotten Commander" is turned in (any story position, no storyEnd)', !bad.g45.length, bad.g45);
  ok('g6:0 not offered once the story is past "The Being Beneath the Lake"', !bad.g6.length, bad.g6);
  ok('no "Complete <story quest>" card for a story quest already passed', !bad.passed.length, bad.passed);

  /* Positive controls: the steps still show when their gate is met. */
  let cs = await at(32, 'A Daeva Dreaming Anew');
  ok('g32:dreams offered at Lv 32 on "A Daeva Dreaming Anew"', has(cs, 'g32:dreams'), cs);
  cs = await at(45, 'Forgotten Commander', { storyEnd: 'Forgotten Commander' });
  ok('g45:0 offered at Lv 45 once "Forgotten Commander" is turned in (storyEnd)', has(cs, 'g45:0'), cs);
  cs = await at(6, 'Isolated Lake');
  ok('g6:0 not offered before its story quest either (story gate)', !has(cs, 'g6:0'), cs);

  /* Display only: being past a byStory quest writes no tick. */
  await at(20, 'Daeva in a Dream');
  let r = await p.evaluate(() => ({ g6: !!state.checks['g6:0'], g12: !!state.checks['g12:0'], saved: JSON.parse(localStorage.getItem('aion2-assassin-route-v4')).checks }));
  ok('past byStory steps are not ticked automatically (state and save unchanged)', !r.g6 && !r.g12 && !r.saved['g6:0'] && !r.saved['g12:0'], r);

  /* Turned in on the last quest, in the UI: g45:0 appears; Basic mode too. */
  await at(45, 'Forgotten Commander', { mode: 'basic' });
  r = await p.evaluate(() => [...document.querySelectorAll('#nsqWrap [data-now^="tick:g45:0"]')].length);
  ok('Basic, Lv 45 on "Forgotten Commander" (not turned in): no g45:0 card', r === 0, r);
  await p.evaluate(() => document.querySelector('#nsqWrap [data-now="story"]').click()); await p.waitForTimeout(300);
  r = await p.evaluate(() => ({ end: state.storyEnd, card: !!document.querySelector('#nsqWrap [data-now="tick:g45:0"]') }));
  ok('Basic: "Turned in" on "Forgotten Commander" -> g45:0 card offered', r.end === 'Forgotten Commander' && r.card, r);

  /* Text fixes (claims C36-C38). */
  const t = await p.evaluate(() => ({ g6: itemByK('g6:0').t, g32: itemByK('g32:dreams').t, g45: itemByK('g45:0').t, html: document.documentElement.innerHTML }));
  ok('g6:0 no longer credits Perceives with the first wings; "Dream Crossroad"', !/gives your first wings/.test(t.g6) && /Dream Crossroad;/.test(t.g6), t.g6);
  ok('g32:dreams says Ascension Gauge 100% and "A Daeva Dreaming Anew"', /Ascension Gauge is at 100%/.test(t.g32) && /A Daeva Dreaming Anew/.test(t.g32) && !/Crossroads/.test(t.g32), t.g32);
  ok('g45:0 says it opens after "Forgotten Commander" is turned in', /opens after you turn in "Forgotten Commander"/.test(t.g45), t.g45);
  ok('no "Dream Crossroads" and no bare "One Who Hears the Voice." quest name in the page', !/Dream Crossroads/.test(t.html) && !/quest "One Who Hears the Voice/.test(t.html));

  ok('no page errors', !errs.length, errs);
  await b.close();
  console.log(fail ? `GATES CHECKS FAILED: ${fail}` : 'GATES CHECKS PASSED');
  process.exit(fail ? 1 : 0);
})();
