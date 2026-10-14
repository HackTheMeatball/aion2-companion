const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
 p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => m.type()==='error' && console.log('CON', m.text()));
 await p.goto('file://' + process.argv[2]); await p.waitForTimeout(800);
 console.log(await p.evaluate(() => document.querySelectorAll('.gate, .card').length));
 await p.screenshot({ path: process.argv[3], fullPage: false }); await b.close(); })();
