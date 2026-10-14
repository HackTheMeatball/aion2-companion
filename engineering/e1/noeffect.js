/* For every CSS style rule: in each state, if its media applies and its selector (minus user-action pseudo-classes) matches
   elements, disable the rule and compare those elements' computed styles (incl. ::before/::after). Output per rule:
   observed count and effect count. node noeffect.js <file> <out.json> */
const { chromium } = require('playwright'); const fs = require('fs');
const [,, FILE, OUT] = process.argv;
const STATES = [];
for (const w of [1500, 1100, 700, 390]) for (const mode of ['advanced', 'basic']) for (const [L, q] of [[13, 'Urgent Pursuit'], [25, 'Voice of Rage'], [30, 'Dying Light'], [40, 'Symbol of Liberation'], [45, 'Symbol of Liberation']]) STATES.push({ w, mode, L, q });
['drawer', 'filter', 'jfilt', 'tipbox', 'foldcards', 'areas-sh', 'dvall', 'sync', 'tippop', 'gatesopen', 'hide', 'qsubs'].forEach(x => { STATES.push({ w: 1500, mode: 'advanced', L: 30, q: 'Dying Light', x }); STATES.push({ w: 390, mode: 'advanced', L: 30, q: 'Dying Light', x }); STATES.push({ w: 1500, mode: 'basic', L: 25, q: 'Voice of Rage', x }); });
(async () => {
  const b = await chromium.launch(); const agg = {};
  for (const S of STATES) {
    const ctx = await b.newContext({ viewport: { width: S.w, height: 900 } }); const p = await ctx.newPage(); await p.route(/^https?:/, r => r.abort());
    await p.goto('file://' + FILE);
    await p.evaluate(({ L, q, mode, x }) => {
      const st = { checks: {}, level: L, quest: q, mode, open: {}, seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, started: {}, stones: 2 * (L - 10), dvTotal: 4 * (L - 11) + 20, stShards: 3, showObj: x === 'jfilt' || x === 'qsubs', qsShowDone: x === 'qsubs', hide: x === 'hide', areaDone: x === 'hide' ? false : undefined, pendSt: 2, pendCr: 2 };
      GATES.forEach(g => g.items.forEach((it, j) => { const k = it.k || g.id + ':' + j; if (g.lv < L - 3 && !it.sub && !it.hidden && !it.dv && it.kind !== 'hideout') st.checks[k] = true; }));
      AREA_ITEMS.forEach(y => { if (y.lv != null && y.lv < L - 5) st.checks[y.k] = true; });
      SP_STEPS.forEach(y => { if (y.req <= L - 4) st.checks[y.k] = true; });
      st.checks['g22:0'] = L >= 22; st.stLv = { "Triniel's Dagger": 5 };
      const qs = GATES.flatMap(g => g.items.filter(it => it.kind === 'quest' && g.lv <= L)); if (qs[0]) { st.checks[qs[0].k] = false; st.started[qs[0].k] = 1; } if (qs[1]) { st.rqSnooze = { [qs[1].k]: L }; }
      const sd = AREA_ITEMS.find(y => y.lv != null && y.lv <= L && !st.checks[y.k]); if (sd) st.areaRun = { [sd.k]: 1 };
      if (x === 'drawer') st.statOpen = true; if (x === 'foldcards') { st.fold_confCard = true; st.fold_srcCard = true; } if (x === 'areas-sh') st.areaLv = 'sh'; if (x === 'dvall') st.dvAllOpen = true; if (x === 'gatesopen' || x === 'hide') GATES.forEach(g => st.open[g.id] = true);
      if (x === 'qsubs') st.qsteps = { [q]: [0] };
      localStorage.setItem('aion2-assassin-route-v4', JSON.stringify(st));
    }, S);
    await p.reload(); await p.waitForTimeout(500);
    if (S.x === 'filter') await p.evaluate(() => document.getElementById('btnFilter').click());
    if (S.x === 'jfilt') await p.evaluate(() => document.getElementById('jFiltBtn').click());
    if (S.x === 'tipbox') await p.evaluate(() => { const g = [...document.querySelectorAll('#gates details.step')].find(d => !d.hidden && d.querySelector('.tip')); if (g) { g.open = true; g.querySelector('.tip').click(); } });
    if (S.x === 'sync') await p.evaluate(() => { const d = document.getElementById('syncBox'); d.open = true; d.dispatchEvent(new Event('toggle')); document.querySelectorAll('#spCard details, #stCard details, #dvBox details').forEach(x => x.open = true); });
    if (S.x === 'tippop') await p.evaluate(() => { const t = document.querySelector('.tipbtn'); if (t) t.click(); const i = document.querySelector('.nsinfo'); if (i) i.click(); });
    if (S.x === 'drawer') await p.evaluate(() => { const d = document.querySelector('#statDrawer details.mini'); if (d) d.open = true; });
    await p.waitForTimeout(900);
    await p.addStyleTag({ content: '*,*::before,*::after{transition:none!important}' });
    const r = await p.evaluate(() => {
      document.getAnimations().forEach(a => { try { a.pause(); a.currentTime = 0; } catch (e) {} });
      const sheet = document.styleSheets[[...document.styleSheets].findIndex(s => { try { return s.ownerNode && s.ownerNode.tagName === 'STYLE'; } catch (e) { return false; } })];
      const out = {}; let n = 0;
      const visit = (rules, media) => { for (const rule of rules) {
        if (rule.type === 4) { visit(rule.cssRules, matchMedia(rule.media.mediaText).matches); continue; }
        if (rule.type !== 1) continue;
        const id = (rule.parentRule ? rule.parentRule.media.mediaText + ' :: ' : '') + rule.selectorText + ' {' + rule.style.cssText.slice(0, 40) + ' #' + (n++);
        const o = out[id] = { obs: 0, eff: 0 };
        if (!media) continue;
        const props = [...rule.style]; if (props.some(x => x.startsWith('--') || /^(transition|animation)/.test(x)) || /(^|;)\s*all\s*:/.test(rule.cssText.split('{')[1] || '')) { o.skip = 1; continue; }
        if (/:(hover|focus|focus-visible|focus-within|active)\b/.test(rule.selectorText)) { o.skip = 1; continue; }
        /* each comma part separately: element part + pseudo-element */
        const parts = []; let depth = 0, cur = ''; for (const ch of rule.selectorText) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && !depth) { parts.push(cur); cur = ''; } else cur += ch; } parts.push(cur);
        const targets = [];
        for (const part of parts) { const m = part.match(/::?(before|after|placeholder|marker|selection|-webkit-[\w-]+)\s*$/); const base = m ? part.slice(0, m.index) : part; const ps = m ? '::' + m[1] : null;
          let els; try { els = document.querySelectorAll(base.trim() || '*'); } catch (e) { o.skip = 1; break; } els.forEach(e => targets.push([e, ps && /before|after/.test(ps) ? ps : (ps ? 'X' : null)])); }
        if (o.skip) continue; const tg = targets.filter(t => t[1] !== 'X').slice(0, 300); if (!tg.length) { if (targets.length) o.skip = 1; continue; }
        o.obs = 1; o.keys = []; tg.forEach(([e, ps]) => { if (!e.__id) e.__id = 'e' + (++window.__n || (window.__n = 1)); props.forEach(p => o.keys.push(e.__id + (ps || '') + '|' + p)); }); const read = () => tg.map(([e, ps]) => { const cs = getComputedStyle(e, ps); return props.map(p => cs.getPropertyValue(p)).join(';'); });
        const before = read(); const txt = rule.style.cssText; rule.style.cssText = ''; const after = read(); rule.style.cssText = txt;
        if (before.some((x, i) => x !== after[i])) o.eff = 1;
      } };
      visit(sheet.cssRules, true); return out;
    });
    for (const [k, v] of Object.entries(r)) { const a = agg[k] = agg[k] || { obs: 0, eff: 0, skip: 0, keys: [] }; a.obs += v.obs; a.eff += v.eff; a.skip += v.skip || 0; if (v.keys) a.keys.push(...v.keys.map(x => STATES.indexOf(S) + ':' + x)); }
    await ctx.close(); process.stdout.write('.');
  }
  fs.writeFileSync(OUT, JSON.stringify(agg, null, 0)); console.log('\nrules', Object.keys(agg).length);
  const ne = Object.entries(agg).filter(([, v]) => v.obs && !v.eff && !v.skip); console.log('observed, never any effect:', ne.length);
  await b.close();
})();
