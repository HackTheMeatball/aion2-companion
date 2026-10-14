const { open } = require('./lib');
(async () => { const { b, p } = await open(1500, { stayV285: true });
 console.log(await p.evaluate(() => { const t = id => (document.getElementById(id) || {}).innerText; return ['spCard', 'stCard', 'dvBox', 'nowStar'].map(i => i + ': ' + (t(i) || '').replace(/\s+/g, ' ').slice(0, 700)).join('\n'); }));
 console.log(JSON.stringify(await p.evaluate(() => ({ stones: state.stones, dvTotal: state.dvTotal, spent: state.spSpent, keys: Object.keys(state).join(',') }))));
 await p.screenshot({ path: __dirname + '/v285-user27.png', fullPage: false });
 await b.close(); })();
