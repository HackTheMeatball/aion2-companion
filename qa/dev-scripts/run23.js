const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:1000}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]);
 await p.evaluate(() => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k)); s.level=17; localStorage.setItem(k, JSON.stringify(s)); });
 await p.reload(); await p.waitForTimeout(400);
 await p.evaluate(() => { const d=document.getElementById('g16'); d.open=true; d.scrollIntoView(); });
 const sel='#g16 [data-qs]';
 const t = () => p.evaluate((s) => document.querySelector(s).textContent, sel);
 const r=[await t()]; for (let i=0;i<3;i++){ await p.click(sel); await p.waitForTimeout(80); r.push(await t()); }
 console.log(r.join(' → '));
 await p.click(sel); await p.click(sel); await p.waitForTimeout(80);
 const el = await p.$('#g16'); await el.screenshot({ path: 'p.png' });
 await p.reload(); await p.waitForTimeout(300); console.log('after reload:', await t());
 await b.close(); })();
