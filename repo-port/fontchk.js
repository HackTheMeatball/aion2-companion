const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); p.on('requestfailed', r => console.log('failed', r.url().slice(0, 60), r.failure().errorText));
await p.goto(process.env.AION_BASE + '/'); await p.waitForTimeout(1500); await b.close(); })();
