const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
 await p.goto('file://' + process.argv[2]); await p.waitForTimeout(300);
 console.log(JSON.stringify(await p.evaluate(()=>AREA_ITEMS.map(x=>[x.it.kind, metaSlug(x.it.name)]))));
 await b.close(); })();
