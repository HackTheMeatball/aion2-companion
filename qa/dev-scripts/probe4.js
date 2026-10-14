const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
 for (const w of [1440,1100]) { const p = await b.newPage({viewport:{width:w,height:800}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]); await p.waitForTimeout(400);
 console.log(w, await p.evaluate(()=>{const r=document.querySelector('aside.rail'); const rb=r.getBoundingClientRect();
  return JSON.stringify({railL:rb.left, railR:rb.right, client:r.clientWidth, scrollW:r.scrollWidth, sb:r.offsetWidth-r.clientWidth, cards:[...r.children].map(c=>{const b=c.getBoundingClientRect(); return Math.round(b.left)+'-'+Math.round(b.right)}), whead:document.querySelector('.where-head').getBoundingClientRect().height})}));
 await p.screenshot({path:`rail2-${w}.png`, clip:{x:0,y:180,width:420,height:520}}); await p.close(); }
 await b.close(); })();
