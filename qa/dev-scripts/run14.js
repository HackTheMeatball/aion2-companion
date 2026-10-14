const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); 
 for (const w of [1280, 420]) {
 const p = await b.newPage({viewport:{width:w,height:1000}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]);
 await p.evaluate(() => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k)); s.level=16; s.dvTotal=28; s.stones=8; localStorage.setItem(k, JSON.stringify(s)); });
 await p.reload(); await p.waitForTimeout(500);
 const el = await p.$('.top-grid'); await el.screenshot({ path: `k${w}.png` });
 await p.close(); }
 await b.close(); })();
