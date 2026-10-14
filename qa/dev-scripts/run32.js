const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); 
 for (const [w,q] of [[1280,"A New Lead"],[1280,""],[420,"A New Lead"]]) {
 const p = await b.newPage({viewport:{width:w,height:1100}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]);
 await p.evaluate((q) => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k)); s.level=17; s.quest=q; s.hideCards=true; localStorage.setItem(k, JSON.stringify(s)); }, q);
 await p.reload(); await p.waitForTimeout(400);
 if (w===1280 && q) { await p.click('#lvlUp'); await p.waitForTimeout(100); console.log('lv', await p.evaluate(()=>state.level)); await p.click('#lvlDown'); await p.click('#questUnlock .tip'); await p.waitForTimeout(100); }
 const el = await p.$('section.where'); await el.screenshot({ path: `w${w}${q?'q':'n'}.png` });
 await p.close(); }
 await b.close(); })();
