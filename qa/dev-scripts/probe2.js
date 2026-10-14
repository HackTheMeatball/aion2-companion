const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
 await p.goto('file://' + process.argv[2]); await p.waitForTimeout(300);
 console.log(await p.evaluate(()=>DV_NODES().map(it=>it.board+': '+it.t).join('\n'))); await b.close(); })();
