const { open } = require('./lib');
(async () => { const { b, p } = await open(1500);
  console.log(await p.evaluate(() => { const t = document.getElementById('confCard').textContent; return t.slice(t.indexOf('Disputed')); }));
  await b.close(); })();
