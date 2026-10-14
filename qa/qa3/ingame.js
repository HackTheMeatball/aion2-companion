const { open } = require('./lib'); const path = require('path');
(async () => { const { b, p } = await open(1500);
  const info = await p.evaluate(() => [...document.querySelectorAll('#gates li.qrow [data-ingame]')].map(b => { const d = b.closest('details'), li = b.closest('li'); const cs = getComputedStyle(b); return { k: b.dataset.ingame, name: RQ_K(b.dataset.ingame) && RQ_K(b.dataset.ingame).name, gate: d.id, open: d.open, hidden: d.hidden, disp: cs.display, vis: cs.visibility, op: cs.opacity, w: b.offsetWidth, liCls: li.className, txt: li.innerText.replace(/\s+/g, ' ').slice(0, 200) }; }));
  console.log(JSON.stringify(info, null, 1));
  const k = info[0] && info[0].k; if (k) { await p.evaluate(k => { const b = document.querySelector(`#gates [data-ingame="${k}"]`); const d = b.closest('details'); d.open = true; d.hidden = false; b.scrollIntoView({ block: 'center' }); }, k); await p.waitForTimeout(400);
    const li = await p.$(`#gates li.qrow:has([data-ingame="${k}"])`); await li.screenshot({ path: path.join(__dirname, 'shots', 'ingame-row.png') }); await li.hover(); await p.waitForTimeout(300); await li.screenshot({ path: path.join(__dirname, 'shots', 'ingame-row-hover.png') });
    console.log('visible after hover', await (await p.$(`#gates [data-ingame="${k}"]`)).isVisible());
    try { await p.click(`#gates [data-ingame="${k}"]`, { timeout: 2000 }); console.log('clicked; started=', await p.evaluate(k => (state.started || {})[k], k)); } catch (e) { console.log('click fail', e.message.split('\n').slice(0, 6).join(' / ')); } }
  await b.close(); })();
