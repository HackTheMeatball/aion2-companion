const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('file://' + process.argv[2]); await p.waitForTimeout(500);
  const r = await p.evaluate(() => ({ q: QUESTS.length, last: QUESTS[QUESTS.length-1], gates: GATES.map(g => g.id + ':' + g.items.filter(i => i.kind === 'quest').length).join(' '), sp: SP_SKILLS.length, conf: document.getElementById('confBody').innerText.slice(0, 200), src: document.querySelectorAll('#srcBody a').length }));
  console.log(JSON.stringify(r, null, 1)); console.log('ERR', errs);
  await b.close();
})();
