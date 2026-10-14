const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]);
 await p.evaluate(() => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k)); s.level=13; localStorage.setItem(k, JSON.stringify(s)); });
 await p.reload(); await p.waitForTimeout(600);
 console.log(await p.evaluate(() => [...document.querySelectorAll('#gates details.step')].map(d => d.querySelector('.num').textContent.trim()+' '+d.querySelector('.count').textContent+' '+d.querySelector('.tag').textContent).slice(0,12).join('\n')));
 await b.close(); })();
