const { open, dump } = require('./lib'); const path = require('path');
(async () => { const { b, p, errs } = await open(1500);
  const k = 'rq:2202062';
  await p.evaluate(k => { const bt = document.querySelector(`#gates [data-ingame="${k}"]`); const d = bt.closest('details'); d.open = true; bt.scrollIntoView({ block: 'center' }); }, k); await p.waitForTimeout(300);
  const row = await p.$(`#gates li.qrow:has([data-ingame="${k}"])`); await row.screenshot({ path: path.join(__dirname, 'shots', 'sc-ingame-before.png') });
  await p.click(`#gates [data-ingame="${k}"]`); await p.waitForTimeout(500);
  console.log('started', await p.evaluate(k => (state.started || {})[k], k));
  const row2 = await p.$(`#gates li.qrow:has(input[data-k="${k}"])`); await row2.screenshot({ path: path.join(__dirname, 'shots', 'sc-ingame-after.png') }); console.log('row after:', (await row2.innerText()).replace(/\s+/g, ' '));
  const d = await dump(p); console.log(d.cards.filter(c => /Regional/.test(c.h)).map(c => c.all));
  // click it in Next up -> done
  await p.click(`#nsqWrap [data-rqk="${k}"]`); await p.waitForTimeout(600); console.log('checked', await p.evaluate(k => state.checks[k], k), 'pend', await p.evaluate(() => [state.pendSt, state.pendCr]));
  // Spot: Next up rq card hover reveals snooze? check quest lines at Lv 45 later; check stigma 0-shard card in stigma card
  console.log('stCard:', (await p.evaluate(() => document.getElementById('stCard').innerText)).replace(/\s+/g, ' ').slice(0, 300));
  const btn = await p.$('#stCard button[disabled]'); console.log('disabled st btn:', btn && await btn.innerText());
  console.log('errs', errs.filter(e => !/ERR_/.test(e)));
  await b.close(); })();
