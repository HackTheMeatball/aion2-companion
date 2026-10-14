const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]);
 for (const lv of [17,19]) { await p.evaluate((lv) => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k)); s.level=lv; localStorage.setItem(k, JSON.stringify(s)); }, lv);
 await p.reload(); await p.waitForTimeout(300);
 console.log(lv, await p.evaluate(() => [document.getElementById('g19').classList.contains('current'), document.querySelector('#g19 .tag').className, document.querySelector('#g19 .tag').textContent, !!document.getElementById('nowCard')])); }
 await b.close(); })();
