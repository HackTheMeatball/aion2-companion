const { open } = require('./lib'); const path = require('path');
(async () => { const { b, p, errs } = await open(1500);
  for (const mode of ['advanced', 'basic']) { await p.click(`.modeseg [data-mode="${mode}"]`); await p.waitForTimeout(300);
    for (const id of ['confCard', 'srcCard']) { const vis = await p.evaluate(id => { const e = document.getElementById(id); if (!e) return 'missing'; if (e.tagName === 'DETAILS') e.open = true; const s = e.querySelector('summary, .sec, h2'); return e.offsetParent ? 'visible' : 'hidden'; }, id);
      console.log(mode, id, vis); if (vis === 'visible') { await p.evaluate(id => { const e = document.getElementById(id); e.querySelectorAll('details').forEach(d => d.open = false); const t = e.querySelector('[aria-expanded="false"], .fold-btn, summary'); }, id);
        const el = await p.$('#' + id); await el.scrollIntoViewIfNeeded(); await el.screenshot({ path: path.join(__dirname, 'shots', `${id}-${mode}.png`) }); console.log((await el.innerText()).replace(/\n+/g, ' | ').slice(0, 3000)); } }
  }
  await p.click(`.modeseg [data-mode="advanced"]`);
  const tab = await p.$('#sdTab'); console.log('drawer tab', !!tab); if (tab) { await tab.click(); await p.waitForTimeout(600); await p.screenshot({ path: path.join(__dirname, 'shots', 'drawer-advanced.png') }); console.log('DRAWER: ' + (await p.evaluate(() => document.getElementById('sdPanel').innerText)).replace(/\n+/g, ' | ').slice(0, 4000)); }
  await p.click('#sdClose').catch(() => {}); await p.click(`.modeseg [data-mode="basic"]`); await p.waitForTimeout(300);
  if (tab && await tab.isVisible()) { await tab.click(); await p.waitForTimeout(600); await p.screenshot({ path: path.join(__dirname, 'shots', 'drawer-basic.png') }); console.log('DRAWER basic: ' + (await p.evaluate(() => document.getElementById('sdPanel').innerText)).replace(/\n+/g, ' | ').slice(0, 1500)); } else console.log('drawer tab not visible in basic');
  console.log('errs', errs.filter(e => !/ERR_/.test(e))); await b.close(); })();
