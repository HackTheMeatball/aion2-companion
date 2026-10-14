const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
 await p.goto('file://' + process.argv[2]); await p.waitForTimeout(300);
 console.log(await p.evaluate(()=>AREA_ITEMS.filter(x=>x.area===NO_AREA).map(x=>x.it.kind+': '+x.it.name+' (Lv '+(x.lv??x.band)+')').join('\n'))); await b.close(); })();
