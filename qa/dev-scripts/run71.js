const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1440,height:1400}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]);
 await p.evaluate(() => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k)); s.level=20; s.dvTotal=70; s.dvAllOpen=true; Object.keys(s.checks).filter(x=>x.startsWith('dv:')).forEach(x=>delete s.checks[x]); DV_NODES().slice(0,8).forEach(n=>s.checks[n.k]=true); localStorage.setItem(k, JSON.stringify(s)); });
 await p.reload(); await p.waitForTimeout(500);
 await (await p.$('#dvBox')).screenshot({path:'dv-icons.png'});
 await b.close(); })();
