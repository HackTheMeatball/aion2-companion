const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + process.argv[2]); await p.waitForTimeout(300);
  const r = await p.evaluate(() => {
    const rq = [], mig = {};
    GATES.forEach(g => g.items.forEach((it, j) => {
      const k = it.k || g.id + ':' + j;
      if (it.kind === 'hideout' && !it.k) mig[k] = 'sd:' + mapSlug(it.name);
      if (it.kind !== 'quest') return;
      const n = it.name, id = QUEST_ID[n]; mig[k] = 'rq:' + id;
      const [w0, w1] = it.where.split(' · '), poi = QUEST_POI[n] || ['', ''], loc = RQ_LOC[n] || {}, zone = QUEST_AREA[n];
      let place = poi[0] || loc.place || (w0 !== zone ? w0 : '');
      if (place === zone) place = '';
      rq.push({ name: n, id, rec: it.lv, unlocksAt: null, zone, place, npc: poi[1] || w1 || '', kib: loc.kib || null, m: loc.m || null,
        after: QUEST_AFTER[n] || null, afterBasis: QUEST_AFTER[n] ? (n === "In the Fang Legion's Name" ? 'source-text' : n === "A Guardian's Sacrifice" ? 'turnin-npc' : 'name-pattern') : null,
        reward: it.reward || '', rw: { st: 1, cr: 1 }, _g: g.id, _old: { where: it.where, qmap: qMap(n, it.where) } });
    }));
    return { rq, mig };
  });
  require('fs').writeFileSync(process.argv[3], JSON.stringify(r, null, 1));
  await b.close();
})();
