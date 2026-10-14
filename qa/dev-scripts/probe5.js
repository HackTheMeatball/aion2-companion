const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1440,height:800}});
 await p.goto('file://' + process.argv[2]); await p.waitForTimeout(400);
 console.log(await p.evaluate(()=>{const h=document.querySelector('.where-head'); return h.clientWidth+' '+[...h.children].map(c=>c.className||c.tagName+':'+Math.round(c.getBoundingClientRect().width)).join(' ')+' | '+[...h.children].map(c=>Math.round(c.getBoundingClientRect().width)).join(',')+' gap '+getComputedStyle(h).gap}));
 await b.close(); })();
