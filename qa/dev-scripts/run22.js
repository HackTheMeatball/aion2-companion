const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:1400}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]);
 await p.evaluate(() => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k)); s.level=17; localStorage.setItem(k, JSON.stringify(s)); });
 await p.reload(); await p.waitForTimeout(400);
 const el = await p.$('#areas'); await el.screenshot({ path: 'q.png' });
 console.log(await p.evaluate(() => [...document.querySelectorAll('#areaSel option')].map(o=>o.textContent).join(' | ')));
 await b.close(); })();
