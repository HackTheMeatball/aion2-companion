const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
 for (const [w,h] of [[1440,900],[1100,800]]) {
 const p = await b.newPage({viewport:{width:w,height:h}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]); await p.waitForTimeout(500);
 console.log(w, await p.evaluate(()=>{ const r=document.querySelector('aside.rail'); return ['rail',r.clientWidth,r.scrollWidth, 'cards', [...r.children].map(c=>Math.round(c.getBoundingClientRect().width)).join(','), 'drawerTop', document.getElementById('statDrawer').style.top, 'gridTop', Math.round(document.querySelector('#main .top-grid').getBoundingClientRect().top)].join(' ')}));
 await p.screenshot({path:`rail${w}.png`});
 await p.mouse.wheel(0,600); await p.waitForTimeout(300);
 console.log(' after scroll drawerTop', await p.evaluate(()=>document.getElementById('statDrawer').style.top));
 await p.close(); }
 await b.close(); })();
