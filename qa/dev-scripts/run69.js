const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1440,height:900}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]);
 await p.evaluate(() => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k)); s.level=19; s.quest="A New Lead"; s.hide=true; s.hideCards=true; s.hidePaid=true; localStorage.setItem(k, JSON.stringify(s)); });
 await p.reload(); await p.waitForTimeout(400);
 await p.click('#btnFilter'); await p.click('#btnReset'); await p.waitForTimeout(200);
 console.log(await p.evaluate(()=>[state.hideCards,state.hide,state.hidePaid,state.level,state.quest].join(',')), JSON.stringify(await p.textContent('#filtN')));
 await b.close(); })();
