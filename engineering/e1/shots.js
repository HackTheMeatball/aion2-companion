const { chromium } = require('playwright');
const [,, FILE, OUT] = process.argv;
async function setState(p, L, q, mode, extra) {
  await p.evaluate(({ L, q, mode, extra }) => {
    const st = { checks: {}, level: L, quest: q, mode, open: {}, seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, started: {}, stones: 2 * (L - 10), dvTotal: 4 * (L - 11) + 20, stShards: 3 };
    GATES.forEach(g => g.items.forEach((it, j) => { const k = it.k || g.id + ':' + j; if (g.lv < L && !it.sub && !it.hidden && !it.dv && it.kind !== 'hideout') st.checks[k] = true; }));
    AREA_ITEMS.forEach(x => { if (x.lv != null && x.lv < L - 5) st.checks[x.k] = true; });
    SP_STEPS.forEach(x => { if (x.req <= L - 2) st.checks[x.k] = true; });
    st.checks['g22:0'] = true; st.stLv = { "Triniel's Dagger": 5 }; Object.assign(st, extra || {});
    localStorage.setItem('aion2-assassin-route-v4', JSON.stringify(st));
  }, { L, q, mode, extra });
  await p.reload(); await p.waitForTimeout(600);
}
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
  await p.goto('file://' + FILE);
  await setState(p, 27, 'Preparations for Restoration', 'advanced');
  await (await p.$('#main .top-grid')).screenshot({ path: OUT + '-27-top.png' });
  await (await p.$('#nowStar')).screenshot({ path: OUT + '-27-ns.png' });
  await setState(p, 30, 'Dying Light', 'advanced', { open: { g30: true } });
  await p.hover('#nowStar .ns-qgrid .ql'); await p.waitForTimeout(150);
  const cs = await p.$$('#nowStar .ns-card'); for (const c of cs) { if (/Regional/.test(await c.innerText())) { await p.evaluate(e => e.scrollIntoView(), c); await c.screenshot({ path: OUT + '-30-rq.png' }); break; } }
  const g = await p.$('#g30'); await g.screenshot({ path: OUT + '-30-g30.png' });
  await setState(p, 42, 'Symbol of Liberation', 'basic');
  await (await p.$('#main .top-grid')).screenshot({ path: OUT + '-42-basic-top.png' });
  await p.evaluate(() => document.querySelector('footer.foot').scrollIntoView());
  await (await p.$('footer.foot')).screenshot({ path: OUT + '-foot.png' });
  await p.setViewportSize({ width: 390, height: 850 });
  await setState(p, 30, 'Dying Light', 'advanced');
  await p.evaluate(() => window.scrollTo(0, document.getElementById('nowStar').getBoundingClientRect().top + scrollY - 20)); await p.waitForTimeout(200);
  await p.screenshot({ path: OUT + '-390-ns.png' });
  await b.close();
})();
