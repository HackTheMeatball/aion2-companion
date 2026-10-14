const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
 const p = await b.newPage({viewport:{width:1440,height:1000}});
 await p.goto('file://' + process.argv[2]);
 await p.evaluate(() => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k)); s.level=17; s.dvTotal=32; s.dvAllOpen=true; ["dv:hg","dv:ew","dv:amb","dv:qs","dv:ew2","dv:as"].forEach(x=>s.checks[x]=true); localStorage.setItem(k, JSON.stringify(s)); });
 await p.reload(); await p.waitForTimeout(500);
 await (await p.$('#dvBox')).screenshot({path:'dvall.png'});
 await b.close(); })();
