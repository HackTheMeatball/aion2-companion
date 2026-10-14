const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
 for (const [w,lv] of [[1280,16],[1280,27],[420,16]]) {
 const p = await b.newPage({viewport:{width:w,height:1000}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]);
 await p.evaluate((lv) => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k)); s.level=lv; localStorage.setItem(k, JSON.stringify(s)); }, lv);
 await p.reload(); await p.waitForTimeout(400);
 await p.evaluate(()=>document.querySelector('#stackViz').closest('details').open=true); const el = await p.$('#rotPlay'); const card = await el.evaluateHandle(e => e.closest('section'));
 await card.asElement().screenshot({ path: `o${w}_${lv}.png` });
 await p.close(); }
 await b.close(); })();
