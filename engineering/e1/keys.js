const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + process.argv[2]); await p.waitForTimeout(300);
  const r = await p.evaluate(() => {
    const out = [];
    GATES.forEach(g => g.items.forEach((it, j) => out.push({ g: g.id, j, k: it.k || g.id + ':' + j, explicit: !!it.k, kind: it.kind || (it.sub!=null?'sub':'') , name: it.name || '', hidden: !!it.hidden, dv: !!it.dv, sp: /^sp:/.test(it.k||''), t: (it.t||'').replace(/<[^>]+>/g,'').slice(0,60) })));
    STEPS.forEach(g => g.items.forEach((it, j) => out.push({ g: g.id, j, k: it.k || g.id + ':' + j, explicit: !!it.k, kind: 'step', t: (it.t||'').replace(/<[^>]+>/g,'').slice(0,60) })));
    return out;
  });
  console.log(JSON.stringify(r));
  await b.close();
})();
