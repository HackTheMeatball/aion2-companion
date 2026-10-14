const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:900}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]);
 await p.evaluate(() => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k)); s.level=14; localStorage.setItem(k, JSON.stringify(s)); });
 await p.reload(); await p.waitForTimeout(500);
 await p.evaluate(() => { const d=document.getElementById('g12'); d.open=true; d.scrollIntoView(); });
 await p.waitForTimeout(200); await p.screenshot({ path: 'e.png', clip:{x:390,y:0,width:830,height:900} });
 await b.close(); })();
