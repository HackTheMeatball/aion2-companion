const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:1000}});
 await p.goto('file://' + process.argv[2]);
 for (const lv of [13,14]) {
 await p.evaluate((lv) => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k)); s.level=lv; localStorage.setItem(k, JSON.stringify(s)); }, lv);
 await p.reload(); await p.waitForTimeout(500);
 console.log('LV', lv, '| card:', await p.evaluate(() => document.getElementById('spNext').innerText.replace(/\n/g,' / ')));
 console.log(await p.evaluate(() => SP_STEPS.filter(x=>x.req<=16).sort((a,b)=>a.gi-b.gi||a.gj-b.gj).map(x=>`${GATES[x.gi].lv}:${x.s.n}${x.spec?' spec':' '+x.L}(req${x.req})${state.checks[x.k]?'✓':''}`).join(', ')));
 }
 await b.close(); })();
