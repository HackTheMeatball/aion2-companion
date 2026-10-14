const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); await p.goto('file://' + process.argv[2]);
 const d = await p.evaluate(() => {
   const q = []; GATES.forEach(g => g.items.forEach((it,j) => { if (it.kind==='quest') q.push({ name: it.name, gate: g.id, glv: g.lv, lv: it.lv, where: it.where, reward: it.reward, k: it.k||g.id+':'+j, area: QUEST_AREA[it.name], poi: QUEST_POI[it.name], loc: RQ_LOC[it.name]||null, id: QUEST_ID[it.name], after: QUEST_AFTER[it.name]||null }); }));
   const sd = AREA_ITEMS.map(x => ({ name: x.it.name, kind: x.it.kind, lv: x.lv, band: x.band, area: x.area, k: x.k, loc: AREA_LOC[x.it.name]||null, lo: x.it.lo, hi: x.it.hi }));
   const gates = GATES.map(g => ({ id: g.id, lv: g.lv, title: g.title, blurb: g.blurb, items: g.items.map((it,j)=>({ k: it.k||g.id+':'+j, kind: it.kind, story: it.story, after: it.after, opt: !!it.opt, hidden: !!it.hidden, sub: it.sub, dv: !!it.dv, req: it.req, t: (it.t||'').replace(/<[^>]+>/g,''), note: it.note })) }));
   return { quests: q, areas: sd, gates, sp: SP_STEPS.map(x=>({k:x.k,req:x.req,cost:x.cost,rank:x.rank})), dv: DV_NODES().map(x=>({k:x.k,board:x.board,blv:x.blv,ty:x.ty,t:x.t,via:x.via})) };
 });
 require('fs').writeFileSync('app-data.json', JSON.stringify(d, null, 1)); await b.close(); })();
