const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]);
 await p.evaluate(() => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k)); s.level=16; s.stones=8;
   const lv={"Quick Slice":7,"Savage Roar":7,"Shadowstrike":7,"Ambush":6,"Heart Gore":6,"Insignia Explosion":2,"Exploit Weakness":5,"Rear Smite":3};
   Object.entries(lv).forEach(([n,v])=>{for(let L=2;L<=10;L++) s.checks[`sp:${n}:${L}`]=L<=v;}); localStorage.setItem(k, JSON.stringify(s)); });
 await p.reload(); await p.waitForTimeout(400);
 console.log(await p.evaluate(() => document.getElementById('spNext').innerText.replace(/\n/g,' / ') + ' || ' + document.getElementById('spAfter').innerText));
 for (const lv of [17,18,19]) { await p.evaluate((lv)=>{const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k)); s.level=lv; localStorage.setItem(k, JSON.stringify(s));}, lv); await p.reload(); await p.waitForTimeout(300);
   console.log(lv, await p.evaluate(() => SP_STEPS.filter(x=>!state.checks[x.k] && x.req<=state.level).sort((a,b)=>a.gi-b.gi||a.gj-b.gj).map(x=>x.s.n+(x.spec?' spec':' '+x.L)+'('+x.cost+')').join(', '))); }
 await b.close(); })();
