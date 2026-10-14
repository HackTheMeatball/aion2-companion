const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1500,height:1000}});
 await p.goto('file://' + process.argv[2]); await p.waitForTimeout(400);
 console.log('sp dataset', await p.evaluate(()=>document.getElementById('spNextBox').dataset.sp));
 console.log('A', (await p.textContent('#nowStar')).includes('Buy'));
 await p.evaluate(()=>update()); console.log('B', (await p.textContent('#nowStar')).includes('Buy'));
 await b.close(); })();
