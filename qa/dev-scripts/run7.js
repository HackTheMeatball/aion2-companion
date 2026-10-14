const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:1000}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]);
 for (const lv of [14, 13, 17]) {
 await p.evaluate((lv) => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k)); s.level=lv; localStorage.setItem(k, JSON.stringify(s)); }, lv);
 await p.reload(); await p.waitForTimeout(500);
 const has = await p.evaluate(() => !!document.getElementById('nowCard'));
 console.log('lv', lv, 'now card:', has);
 if (has && lv===14) { await p.evaluate(() => document.getElementById('nowCard').scrollIntoView());
   await p.screenshot({ path: 'f.png', fullPage: false });
   await p.click('#nowCard input[data-k]'); await p.waitForTimeout(200);
   console.log('synced:', await p.evaluate(() => { const k=document.querySelector('#nowCard input[data-k]').dataset.k; return [...document.querySelectorAll(`input[data-k="${k}"]`)].map(i=>i.checked); }));
 }
 }
 await b.close(); })();
