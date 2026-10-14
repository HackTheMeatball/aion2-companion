const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1440,height:1000}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]);
 const set = (lv, done, cost, last) => p.evaluate(([lv,done,cost,last]) => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k)); s.level=lv; s.dvTotal=4*(lv-11)+34; Object.keys(s.checks).filter(x=>x.startsWith('dv:')).forEach(x=>delete s.checks[x]); DV_NODES().slice(0,done).forEach(n=>s.checks[n.k]=true); s.dvCost={}; DV_NODES().slice(0,done).forEach(n=>s.dvCost[n.k]=5); const nx=DV_NODES()[done]; if(cost) s.dvCost[nx.k]=cost; s.dvLast=last?DV_NODES()[done-1].k:undefined; localStorage.setItem(k, JSON.stringify(s)); }, [lv,done,cost,last]);
 const states=[['nocost-new',20,8,0,true],['short',20,9,99,true],['ready',20,9,6,true],['allbought',19,8,0,true]];
 for (const [n,lv,d,c,l] of states) { await set(lv,d,c,l); await p.reload(); await p.waitForTimeout(400); await (await p.$('#dvBox')).screenshot({path:`dv-${n}.png`}); }
 await b.close(); })();
