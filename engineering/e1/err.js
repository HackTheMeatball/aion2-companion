const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message, e.stack.split('\n').slice(0,3).join(' | ')));
  if (process.argv[3]) await p.addInitScript(s => { localStorage.setItem('aion2-assassin-route-v4', s); }, require('fs').readFileSync(process.argv[3],'utf8'));
  await p.goto('file://' + process.argv[2]); await p.waitForTimeout(500);
  console.log('loaded', await p.evaluate(() => typeof GATES));
  await b.close();
})();
