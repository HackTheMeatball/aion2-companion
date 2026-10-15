/* The regression matrix's saved-state fixture (tests/regress.js; also used by tests/perf.js). buildFixture runs in the page
   via page.evaluate, so it may only use the page's globals and its argument. */
/* built in the page from its own GATES / RQ / AREA_ITEMS / SP_STEPS */
function buildFixture({ L, mode, fx }) {
  const st = { checks: {}, level: L, mode, open: {}, seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, started: {}, areaRun: {}, hideCards: true };
  const qAt = QUESTS.filter(q => q[0] <= L), qAbove = QUESTS.find(q => q[0] > L);
  st.quest = fx === 'messy' && qAbove ? qAbove[1] : qAt[qAt.length - 1][1];
  let n = 0;
  GATES.forEach(g => g.items.forEach(it => { if (!it.k || it.sub || it.hidden) return;
    if (it.kind === 'quest') return;
    if (it.dv) { if (it.blv < L) st.checks[it.k] = true; return; }
    if (g.lv < L) { n++; if (fx === 'clean' || n % 4) st.checks[it.k] = true; } }));
  RQ.forEach((q, i) => { const k = 'rq:' + q.id; if (q.rec < L - (fx === 'messy' ? 3 : 0) && !(fx === 'messy' && i % 7 === 3)) st.checks[k] = true; });
  AREA_ITEMS.forEach(x => { if (x.it.kind === 'hideout' ? x.lv < L : (x.it.hi || 45) < L) st.checks[x.k] = true; });
  SP_STEPS.forEach(x => { if (x.req <= L - 2 && !(x.s && x.s.extra)) st.checks[x.k] = true; });
  st.stones = 2 * (L - 10); st.stShards = fx === 'messy' ? 7 : 3; st.stLv = { "Triniel's Dagger": fx === 'messy' ? 6 : 5 };
  st.checks['g22:0'] = true;
  st.dvCost = {}; DV_NODES().forEach(it => { if (st.checks[it.k]) st.dvCost[it.k] = 5; }); st.dvTotal = Object.keys(st.dvCost).length * 5 + 4;
  if (fx === 'messy') {
    st.pendSt = 3; st.pendCr = 2;
    const sd = AREA_ITEMS.find(x => x.it.kind === 'hideout' && x.lv <= L && !st.checks[x.k]); if (sd) st.areaRun[sd.k] = Date.now() - 6e5;
    const open = RQ.filter(q => !st.checks['rq:' + q.id] && q.unlocksAt <= L && !q.after.length);
    open.slice(0, 2).forEach(q => { st.started['rq:' + q.id] = 1; });
    const sz = open[2]; if (sz) st.rqSnooze = { ['rq:' + sz.id]: L };
  }
  localStorage.setItem('aion2-assassin-route-v4', JSON.stringify(st));
}
module.exports = { buildFixture };
