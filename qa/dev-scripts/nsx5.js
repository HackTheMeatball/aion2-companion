const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:900}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]);
 await p.evaluate(() => localStorage.setItem('aion2-assassin-route-v4', JSON.stringify({level:23, quest:'Disturbed Balance', mode:'basic'})));
 await p.reload(); await p.waitForTimeout(500);
 await p.evaluate(()=>{ SP_STEPS.forEach(x=>state.checks[x.k]=true); save(); update(); });
 for (let i=0;i<6;i++){ const r = await p.$eval('#nowStar .ns-card.first', e=>e.querySelector('h3').textContent+' | '+(e.querySelector('.meta button')||{}).outerHTML); console.log(r);
   if (r.startsWith('Story')) break; await p.click('#nowStar .ns-card.first .meta button'); await p.waitForTimeout(1300);
   const k = await p.$eval('#nowStar .ns-card.first .meta button', e=>e.dataset.now).catch(()=>null); console.log('  next act', k); }
 await b.close(); })();
