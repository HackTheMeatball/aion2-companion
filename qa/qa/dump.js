const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
 for (const f of process.argv.slice(2)) { await p.goto('file://' + f); await p.waitForTimeout(300);
  console.log(f, JSON.stringify(await p.evaluate(() => ({ dv: DV_NODES().map(n => [n.k, n.board, n.blv, n.t]), stig: GATES.flatMap(g => g.items.map((it,j)=>[it.k||g.id+':'+j, it.stig, g.lv])).filter(x=>x[1]), sp: SP_STEPS.filter(x=>x.req<=27).length, spAll: SP_STEPS.length, quests: QUESTS.filter(q=>q[0]>=25&&q[0]<=28) }))));
 } await b.close(); })();
