const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
 await p.goto('file://' + process.argv[2]); await p.waitForTimeout(400);
 console.log(await p.evaluate(() => { const a=[...document.querySelectorAll('a[href*="focus=quest:"]')]; return [a.length, new Set(a.map(x=>x.href)).size, a[0].href]; }));
 await b.close(); })();
