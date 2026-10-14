const { chromium } = require('playwright');
const FILE = process.argv[2];
const scen = [
  [25,"Voice of Rage"],[25,"Tangled Past"],[27,"Preparations for Restoration"],[28,"Land of Rifts"],[30,"Dying Light"],[30,"Canyon's Secret"],[32,"Bitter Reality"],
  [33,"Last Refuge"],[35,"Enemy Territory"],[37,"Inevitable Encounter"],[37,"Mirror of Greed"],[38,"Fafnite's Whereabouts"],[40,"Fafnite's Whereabouts"],[40,"Symbol of Liberation"],[42,"Symbol of Liberation"],[45,"Symbol of Liberation"]];
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type()==='error') errs.push('console:'+m.text()); });
  await p.goto('file://' + FILE); await p.waitForTimeout(300);
  for (const mode of ['advanced','basic']) for (const [L, q] of scen) {
    // "clean" player: everything below current level done (milestone tasks, regional quests with g.lv<L, dungeons lv<L, skills req<=L as far as points allow), stigmas equipped for slots < L
    await p.evaluate(({L,q,mode}) => {
      const st = { checks:{}, level:L, quest:q, mode, open:{}, seedLv12:true, stTriniel1:true, dvReset1:true, started:{}, stones: 2*(L-10), dvTotal: 4*(L-11)+20, stShards: 3 };
      GATES.forEach(g => g.items.forEach((it,j) => { const k = it.k || g.id+':'+j; if (g.lv < L && !it.sub && !it.hidden && !it.dv && it.kind!=='hideout') st.checks[k]=true; }));
      AREA_ITEMS.forEach(x => { if (x.lv != null && x.lv < L - 5) st.checks[x.k] = true; });
      SP_STEPS.forEach(x => { if (x.req <= L - 2 && !(x.s && x.s.extra)) st.checks[x.k] = true; }); // E2: extra skills aren't in the clean core plan
      st.checks['g22:0'] = true; st.stLv = { "Triniel's Dagger": 5 };
      localStorage.setItem('aion2-assassin-route-v4', JSON.stringify(st));
    }, {L,q,mode});
    await p.reload(); await p.waitForTimeout(500);
    const r = await p.evaluate(() => {
      const t = s => { const e = document.querySelector(s); return e ? e.innerText.replace(/\s+/g,' ').trim() : '-'; };
      const cards = [...document.querySelectorAll('#nowStar .ns-card')].map(c => { const h=c.querySelector('h3'), pp=c.querySelector('.title > p'), m=c.querySelector('.meta'); return '['+(h?h.innerText.replace(/\s+/g,' '):'')+' | '+(pp?pp.innerText.replace(/\s+/g,' '):'')+' | '+(m?m.innerText.replace(/\s+/g,' '):'')+']'; });
      const gates = [...document.querySelectorAll('#gates details.step')].filter(d=>!d.hidden).map(d => d.id+':'+d.querySelector('.tag').textContent+':'+d.querySelector('.count').textContent);
      return { hint: t('#gateHint'), ahead: t('#ahead'), story: t('#questStatus'), track: t('#track'), sp: t('#spHero'), spBig: t('#spBig'), dv: t('#dvNextList'), st: t('#stBody').slice(0,200), cards, gates, areaSel: document.getElementById('areaSel').selectedOptions[0]?.textContent };
    });
    console.log(`\n===== ${mode} Lv ${L} quest="${q}"`);
    for (const [k,v] of Object.entries(r)) console.log(k.padEnd(7), Array.isArray(v) ? '\n   '+v.join('\n   ') : v);
    if ([25,32,37,40,45].includes(L) ) await p.screenshot({ path: `shot-${mode}-${L}-${q.replace(/\W+/g,'')}.png`, fullPage: false });
  }
  console.log('ERRORS', errs);
  await b.close();
})();
