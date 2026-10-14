const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1100,height:800}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]); await p.waitForTimeout(400);
 for (const y of [0, 1200, 3000]) { await p.evaluate(y=>scrollTo(0,y), y); await p.waitForTimeout(200);
  console.log(y, await p.evaluate(()=>{const r=document.querySelector('aside.rail').getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom), innerHeight, document.querySelector('aside.rail').style.top].join(' ')})); }
 await p.screenshot({path:'railscroll.png'});
 await b.close(); })();
