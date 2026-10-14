const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
  await p.goto('file://' + process.argv[2]);
  await p.evaluate(() => { const L = 30; const st = { checks: {}, level: L, quest: 'Dying Light', mode: 'advanced', open: {}, seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, stones: 40, dvTotal: 96, stShards: 3 };
    GATES.forEach(g => g.items.forEach(it => { if (g.lv < L && !it.sub && !it.dv && it.kind !== 'hideout' && it.k) st.checks[it.k] = true; })); st.checks['g22:0'] = true; localStorage.setItem('aion2-assassin-route-v4', JSON.stringify(st)); });
  await p.reload(); await p.waitForTimeout(500);
  const r = await p.evaluate(() => {
    const names = ['renderAreas', 'renderNext', 'renderCube', 'renderStigma', 'fillStigmaText', 'syncQRun', 'renderNow', 'fitSkills', 'dedupeNow', 'renderCollection', 'renderRotation', 'renderQuest', 'renderStoryChips', 'renderStoryReqs', 'renderDaevanion', 'renderAhead', 'renderQuestSubs', 'fitQuestIn', 'syncHeroRows', 'fitRail'];
    const acc = {}; names.forEach(n => { const f = window[n]; if (typeof f !== 'function') return; acc[n] = 0; window[n] = function (...a) { const t = performance.now(); const r = f.apply(this, a); acc[n] += performance.now() - t; return r; }; });
    // functions are declared with function keyword -> global bindings replaced; consts not
    const T = []; for (let i = 0; i < 10; i++) { const t = performance.now(); update(); T.push(performance.now() - t); }
    T.sort((a,b)=>a-b); Object.keys(acc).forEach(k => acc[k] = +(acc[k] / 10).toFixed(2)); return { med: T[5], acc };
  });
  console.log(JSON.stringify(r, null, 1)); await b.close();
})();
