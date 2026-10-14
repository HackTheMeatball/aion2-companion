const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1440,height:1100}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]);
 await p.evaluate(() => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k)); s.level=19; s.quest="A New Lead"; localStorage.setItem(k, JSON.stringify(s)); });
 await p.reload(); await p.waitForTimeout(400);
 console.log(await p.evaluate(()=>{const el=document.getElementById('questSubs'); const r=el.getBoundingClientRect(); return el.innerHTML.length+' '+JSON.stringify([r.x,r.y,r.width,r.height])}));
 for (const i of [0,1,2,3]) { try { await p.click(`[data-qs="${i}"]`, {timeout:3000}); console.log('clicked',i, await p.evaluate(()=>JSON.stringify(state.qsteps))); } catch(e) { console.log('fail',i,e.message.split('\n')[0]); } }
 console.log(await p.evaluate(()=>!!document.getElementById('qsNext')));
 await b.close(); })();
