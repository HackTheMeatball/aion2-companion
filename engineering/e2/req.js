const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); const rs = [];
  p.on('request', r => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:')) rs.push(r.url()); });
  await p.goto('file://' + process.argv[2]); await p.waitForTimeout(800); console.log([...new Set(rs)]); await b.close(); })();
