const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
 await p.goto('file://' + process.argv[2]); await p.waitForTimeout(400);
 console.log(await p.evaluate(() => [...document.querySelectorAll('#gates details.gate:not(.now-card) .item .loc')].filter(l=>l.querySelector('a[href*="focus=quest"]')).map(l=>l.closest('.txt').querySelector('b').textContent+' :: '+l.textContent).join('\n')));
 await b.close(); })();
