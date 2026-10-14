const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
 const p = await b.newPage({viewport:{width:1440,height:1000}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]);
 const setup = async (mode) => {
  await p.evaluate((mode) => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k)); s.level=18; s.stones=mode==='short'?0:8; s.dvTotal=36; s.dvCost={"dv:hg":9,"dv:ew":2,"dv:amb":7,"dv:qs":4,"dv:ew2":5,"dv:as":3,"dv:as2":9}; ["dv:hg","dv:ew","dv:amb","dv:qs","dv:ew2","dv:as"].forEach(x=>s.checks[x]=true);
    Object.keys(s.checks).filter(x=>x.startsWith('sp:')).forEach(x=>delete s.checks[x]);
    SP_STEPS.filter(x=>x.req<=18).forEach(x=>s.checks[x.k]=true);
    if (mode!=='done') { const last=SP_STEPS.filter(x=>x.req<=18&&!x.spec).sort((a,b)=>b.req-a.req)[0]; delete s.checks[last.k]; if(mode==='short'){ SP_STEPS.filter(x=>x.req<=18&&!x.spec).slice(0,40).forEach(x=>{}); } }
    localStorage.setItem(k, JSON.stringify(s)); }, mode);
  await p.reload(); await p.waitForTimeout(500);
 };
 for (const m of ['done','buy']) {
  await setup(m);
  console.log(m, await p.evaluate(()=>document.getElementById('spBuy')?.textContent+' | rows shown '+[...document.querySelectorAll('#spSoon li')].filter(l=>!l.hidden).length));
  await (await p.$('.top-grid')).screenshot({path:`sk-${m}.png`});
 }
 await p.click('#spBuy'); await p.waitForTimeout(300);
 console.log('after buy', await p.evaluate(()=>document.getElementById('spBuy')?.textContent));
 await b.close(); })();
