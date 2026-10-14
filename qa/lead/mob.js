const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w,h] of [[390,850],[1100,900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage();
    await p.goto('file://' + process.argv[2]);
    await p.evaluate(() => { const st={checks:{},level:30,quest:"Dying Light",mode:"advanced",open:{},seedLv12:true,stTriniel1:true,dvReset1:true,stones:20,dvTotal:96,stShards:5};
      GATES.forEach(g=>g.items.forEach((it,j)=>{ if(g.lv<30&&!it.sub&&!it.hidden&&!it.dv&&it.kind!=='hideout') st.checks[it.k||g.id+':'+j]=true;})); st.checks['g22:0']=true;
      localStorage.setItem('aion2-assassin-route-v4', JSON.stringify(st)); });
    await p.reload(); await p.waitForTimeout(600);
    const m = await p.evaluate(() => {
      const over = [...document.querySelectorAll('body *')].filter(e => { const r=e.getBoundingClientRect(); return r.width>0 && r.right > innerWidth + 1 && getComputedStyle(e).position!=='fixed'; }).slice(0,12).map(e => e.tagName+'.'+e.className+' r='+Math.round(e.getBoundingClientRect().right));
      const t0=performance.now(); for(let i=0;i<10;i++) update(); const dt=(performance.now()-t0)/10;
      const small=[...document.querySelectorAll('button, a, input')].filter(e=>{const r=e.getBoundingClientRect(); return r.width>0&&(r.height<24||r.width<24);}).length;
      return { sw: document.documentElement.scrollWidth, iw: innerWidth, over, updateMs: dt.toFixed(1), nodes: document.querySelectorAll('*').length, smallTargets: small, h: document.documentElement.scrollHeight };
    });
    console.log(w, JSON.stringify(m, null, 1));
    await p.screenshot({ path: `mob-${w}.png`, fullPage: false });
    if (w===390) { await p.evaluate(()=>window.scrollTo(0, document.getElementById('nowStar').getBoundingClientRect().top+scrollY-20)); await p.screenshot({ path: `mob-${w}-ns.png` }); }
    await ctx.close();
  }
  await b.close();
})();
