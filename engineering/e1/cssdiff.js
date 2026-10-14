/* Capture screenshots + per-element computed-style hashes over many states. node cssdiff.js <file> <outdir> */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const [,, FILE, OUT, ONLY] = process.argv; fs.mkdirSync(OUT, { recursive: true });
const STATES = [];
for (const w of [1500, 1100, 390]) for (const mode of ['advanced', 'basic']) for (const [L, q] of [[25, 'Voice of Rage'], [30, 'Dying Light'], [37, 'Inevitable Encounter'], [42, 'Symbol of Liberation'], [45, 'Symbol of Liberation']]) STATES.push({ w, mode, L, q });
const EXTRA = ['drawer', 'filter', 'jfilt', 'tipbox', 'foldcards', 'areas-sh', 'dvall', 'sync', 'tippop', 'gatesopen'].map(x => ({ w: 1500, mode: 'advanced', L: 30, q: 'Dying Light', x }))
  .concat(['drawer', 'gatesopen', 'foldcards'].map(x => ({ w: 390, mode: 'advanced', L: 30, q: 'Dying Light', x })));
(async () => {
  const b = await chromium.launch(); const res = {};
  for (const S of [...STATES, ...EXTRA]) {
    const nm0 = `${S.w}-${S.mode}-${S.L}${S.x ? '-' + S.x : ''}`; if (ONLY && !new RegExp(ONLY).test(nm0)) continue;
    const ctx = await b.newContext({ viewport: { width: S.w, height: 900 }, reducedMotion: 'no-preference' }); const p = await ctx.newPage(); await p.route(/^https?:/, r => r.abort());
    await p.goto('file://' + FILE);
    await p.evaluate(({ L, q, mode, x }) => {
      const st = { checks: {}, level: L, quest: q, mode, open: {}, seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, started: {}, stones: 2 * (L - 10), dvTotal: 4 * (L - 11) + 20, stShards: 3, showObj: x === 'jfilt' };
      GATES.forEach(g => g.items.forEach((it, j) => { const k = it.k || g.id + ':' + j; if (g.lv < L && !it.sub && !it.hidden && !it.dv && it.kind !== 'hideout') st.checks[k] = true; }));
      AREA_ITEMS.forEach(y => { if (y.lv != null && y.lv < L - 5) st.checks[y.k] = true; });
      SP_STEPS.forEach(y => { if (y.req <= L - 2) st.checks[y.k] = true; });
      st.checks['g22:0'] = true; st.stLv = { "Triniel's Dagger": 5 };
      const g16 = GATES.find(g => g.id === 'g16'); const qk = g16.items.find(it => it.kind === 'quest'); if (qk) { st.checks[qk.k || 'g16:3'] = false; st.started[qk.k || 'g16:3'] = 1; }
      if (x === 'drawer') st.statOpen = true; if (x === 'foldcards') { st.fold_confCard = true; st.fold_srcCard = true; } if (x === 'areas-sh') st.areaLv = 'sh'; if (x === 'dvall') st.dvAllOpen = true; if (x === 'gatesopen') GATES.forEach(g => st.open[g.id] = true);
      localStorage.setItem('aion2-assassin-route-v4', JSON.stringify(st));
    }, S);
    await p.reload(); await p.waitForTimeout(500);
    if (S.x === 'filter') await p.click('#btnFilter');
    if (S.x === 'jfilt') await p.click('#jFiltBtn');
    if (S.x === 'tipbox') { await p.evaluate(() => { document.getElementById('g30').open = true; }); await p.click('#g30 .tip'); }
    if (S.x === 'sync') { await p.evaluate(() => { const d = document.getElementById('syncBox'); d.open = true; d.dispatchEvent(new Event('toggle')); }); }
    if (S.x === 'tippop') await p.evaluate(() => { const t = document.querySelector('.tipbtn'); if (t) t.click(); });
    if (S.x === 'drawer') await p.evaluate(() => { const d = document.querySelector('#statDrawer details.mini'); if (d) d.open = true; });
    await p.waitForTimeout(1300);
    await p.evaluate(() => document.getAnimations().forEach(a => { try { a.pause(); a.currentTime = 0; } catch (e) {} }));
    const name = `${S.w}-${S.mode}-${S.L}${S.x ? '-' + S.x : ''}`;
    const h = await p.evaluate(() => {
      const hash = str => { let h1 = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h1 ^= str.charCodeAt(i); h1 = Math.imul(h1, 16777619); } return (h1 >>> 0).toString(36); };
      const els = [document.documentElement, ...document.querySelectorAll('*')];
      const out = [];
      const desc = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/).join('.') : '');
      for (const e of els) for (const ps of [null, '::before', '::after']) {
        const cs = getComputedStyle(e, ps); if (ps && cs.content === 'none') continue;
        let s = ''; for (let i = 0; i < cs.length; i++) { const k = cs[i]; s += k + ':' + cs.getPropertyValue(k) + ';'; }
        out.push([desc(e) + (ps || ''), hash(s), s]);
      }
      return out;
    });
    res[name] = h.map(([d, x]) => [d, x]);
    fs.writeFileSync(path.join(OUT, name + '.styles.json'), JSON.stringify(h));
    await p.addStyleTag({ content: '*,*::before,*::after{animation-play-state:paused!important;transition:none!important;caret-color:transparent!important}' });
    await p.screenshot({ path: path.join(OUT, name + '.png'), fullPage: true });
    await ctx.close();
  }
  fs.writeFileSync(path.join(OUT, 'hashes.json'), JSON.stringify(res));
  console.log('states', Object.keys(res).length);
  await b.close();
})();
