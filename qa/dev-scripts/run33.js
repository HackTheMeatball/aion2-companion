const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
 for (const w of [1280, 420]) {
 const p = await b.newPage({viewport:{width:w,height:1200}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]);
 await p.evaluate(() => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k)); s.level=17; s.stones=8; s.dvTotal=32; s.dvCost={"dv:hg":9,"dv:ew":2,"dv:amb":7,"dv:qs":4,"dv:ew2":5,"dv:as":3}; ["dv:hg","dv:ew","dv:amb","dv:qs","dv:ew2","dv:as"].forEach(x=>s.checks[x]=true); localStorage.setItem(k, JSON.stringify(s)); });
 await p.reload(); await p.waitForTimeout(400);
 if (w===1280) {
   await p.click('[data-step="spPts"][data-d="1"]'); await p.waitForTimeout(100); console.log('stones', await p.evaluate(()=>state.stones));
   await p.click('[data-step="spPts"][data-d="-1"]');
   await p.fill('#dvNextList input.dvc', '2'); await p.waitForTimeout(100);
   console.log('focus', await p.evaluate(()=>document.activeElement.classList.contains('dvc')), await p.evaluate(()=>document.querySelector('#dvNextList .dvst').textContent), await p.evaluate(()=>document.getElementById('dvBox').classList.contains('act')));
   await p.fill('#dvNextList input.dvc', ''); 
 }
 const el = await p.$('.top-grid'); await el.screenshot({ path: `x${w}.png` });
 await p.close(); }
 await b.close(); })();
