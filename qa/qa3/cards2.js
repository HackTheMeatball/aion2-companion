const { open } = require('./lib'); const path = require('path');
(async () => { const { b, p } = await open(1500);
  console.log(await p.evaluate(() => document.getElementById('confCard').innerText.split('Disputed')[1]));
  console.log('DRAWER FULL: ' + await p.evaluate(() => document.getElementById('sdPanel').innerText.replace(/\n+/g, ' | ')));
  console.log('drawer inferred mentions: ' + await p.evaluate(() => document.getElementById('sdPanel').innerHTML.match(/infer[^<]{0,120}/gi)));
  await b.close(); })();
