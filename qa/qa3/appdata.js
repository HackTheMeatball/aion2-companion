const { chromium } = require('playwright'); const path = require('path'); const ROOT = path.resolve(__dirname, '..', '..');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); await p.goto('file://' + ROOT + '/qa-cur.html'); await p.waitForTimeout(500);
  const names = process.argv.slice(2);
  console.log(JSON.stringify(await p.evaluate(names => ({ rq: RQ.filter(q => names.includes(q.name)), qs: QUESTS.filter(q => names.includes(q[1])), steps: Object.fromEntries(names.filter(n => QUEST_STEPS[n]).map(n => [n, QUEST_STEPS[n]])), loc: Object.fromEntries(names.filter(n => typeof QUEST_LOC !== 'undefined' && QUEST_LOC[n]).map(n => [n, QUEST_LOC[n]])), areas: AREA_ITEMS.filter(x => names.includes(x.it.name)).map(x => ({ ...x.it, area: x.area, lv: x.lv, aloc: AREA_LOC[x.it.name] })) }), names), null, 0));
  await b.close(); })();
