const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--host-resolver-rules=MAP fonts.googleapis.com ~NOTFOUND'] });
for (const w of [1500, 390]) { const p = await b.newPage({ viewport: { width: w, height: 900 } }); await p.goto(process.env.AION_BASE + '/'); await p.waitForTimeout(800);
  await (await p.$('footer.foot')).screenshot({ path: process.argv[2] + `/foot-${w}.png` }); }
await b.close(); })();
