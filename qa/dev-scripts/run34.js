const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
 for (const w of [1280, 820, 420]) {
 const p = await b.newPage({viewport:{width:w,height:1200}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]);
 await p.evaluate(() => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k)); s.level=17; s.stones=8; s.dvTotal=32; s.dvCost={"dv:hg":9,"dv:ew":2,"dv:amb":7,"dv:qs":4,"dv:ew2":5,"dv:as":3}; ["dv:hg","dv:ew","dv:amb","dv:qs","dv:ew2","dv:as"].forEach(x=>s.checks[x]=true); SP_STEPS.filter(x=>x.req<=17).forEach(x=>s.checks[x.k]=true); localStorage.setItem(k, JSON.stringify(s)); });
 await p.reload(); await p.waitForTimeout(400);
 console.log(w, await p.evaluate(()=>document.getElementById('spCard').innerText.slice(0,400)));
 const tops = await p.evaluate(()=>[...document.querySelectorAll('.tcard')].map(c=>{const h=c.querySelector('.ns-head'); return Math.round(h.nextElementSibling.getBoundingClientRect().top - c.getBoundingClientRect().top)}));
 console.log('content tops', tops);
 const el = await p.$('.top-grid'); await el.screenshot({ path: `y${w}.png` });
 await p.close(); }
 await b.close(); })();
