const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1440,height:900}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]); await p.waitForTimeout(400);
 for (const c of [false,true]) { await p.evaluate(c=>{state.areasCollapsed=c; renderAreas();}, c);
 console.log(c, await p.evaluate(()=>{const h=document.querySelector('.areas-head'); return h.getBoundingClientRect().height+' '+[...h.children].map(x=>Math.round(x.getBoundingClientRect().width)).join(',')+' of '+h.clientWidth}));
 const r=await (await p.$('.areas-head')).boundingBox(); await p.screenshot({path:`ahead${c}.png`, clip:{x:r.x-20,y:r.y-20,width:r.width+40,height:r.height+40}}); }
 await b.close(); })();
