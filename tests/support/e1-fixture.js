/* E1's clean saved state at a level (tests/e1test.js; also used by tests/perf.js): built in the page, written through
   tests/support/save.js, then the page reloads. */
const { writeSave } = require('./save');
const clean = (L, q, mode, extra) => ({ L, q, mode, extra: extra || {} });
async function setState(p, spec) {
  const st = await p.evaluate(({ L, q, mode, extra }) => {
    const st = { checks: {}, level: L, quest: q, mode, open: {}, started: {}, stones: 2 * (L - 10), dvTotal: 4 * (L - 11) + 20, stShards: 3 };
    GATES.forEach(g => g.items.forEach(it => { if (g.lv < L && !it.sub && !it.hidden && !it.dv && it.kind !== 'hideout' && it.k) st.checks[it.k] = true; }));
    AREA_ITEMS.forEach(x => { if (x.lv != null && x.lv < L - 5) st.checks[x.k] = true; });
    SP_STEPS.forEach(x => { if (x.req <= L - 2 && !x.s.extra) st.checks[x.k] = true; }); /* E2: the extra skills aren't part of a clean core plan */
    st.checks['g22:0'] = true; st.stLv = { "Triniel's Dagger": 5 };
    Object.assign(st, extra);
    return st;
  }, spec);
  await writeSave(p, st);
  await p.reload(); await p.waitForTimeout(450);
}
module.exports = { clean, setState };
