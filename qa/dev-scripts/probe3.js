const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1100,height:800}});
 await p.goto('file://' + process.argv[2]); await p.waitForTimeout(400);
 console.log(await p.evaluate(()=>{const r=document.querySelector('aside.rail'), c=r.children[0]; const rb=r.getBoundingClientRect(), cb=c.getBoundingClientRect(); const cs=getComputedStyle(r);
 return JSON.stringify({rail:[rb.left,rb.right,r.clientWidth,r.offsetWidth], card:[cb.left,cb.right], pad:[cs.paddingLeft,cs.paddingRight], gutter: cs.scrollbarGutter, sw: r.offsetWidth - r.clientWidth, cardW: getComputedStyle(c).width});}));
 await b.close(); })();
