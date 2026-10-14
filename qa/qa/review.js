/* Review screenshots: whole Next up stack unrolled + the current milestone card, per level/mode. */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..'), SH = path.join(__dirname, 'shots'), KEY = 'aion2-assassin-route-v4';
const src = fs.readFileSync(path.join(__dirname, 'regress.js'), 'utf8');
const buildFixture = eval('(' + src.match(/function buildFixture[\s\S]*?\n}\n/)[0] + ')');
(async () => { const b = await chromium.launch();
  const unroll = async (p, name) => {
    const n = await p.evaluate(() => document.querySelectorAll('#nsqWrap > .ns-card').length); const parts = [];
    for (let i = 0; i < n; i++) { await p.evaluate(i => { const w = document.getElementById('nsqWrap'), c = w.children[i]; w.scrollTop = c.offsetTop - w.children[0].offsetTop; w.scrollIntoView({ block: 'center' }); }, i); await p.waitForTimeout(120);
      const f = path.join(SH, `_${name}-${i}.png`); await (await p.$(`#nsqWrap > .ns-card:nth-child(${i + 1})`)).screenshot({ path: f }); parts.push(f); }
    require('child_process').execFileSync('python3', ['-I', '-c', 'import sys\nfrom PIL import Image\nims=[Image.open(f) for f in sys.argv[2:]]\nW=max(i.width for i in ims);H=sum(i.height+6 for i in ims)\nout=Image.new("RGB",(W,H),(40,40,40));y=0\nfor i in ims:\n out.paste(i,(0,y));y+=i.height+6\nout.save(sys.argv[1])', path.join(SH, name + '-nextup.png'), ...parts]); parts.forEach(f => fs.unlinkSync(f));
    const g = await p.$('#gates details.step.upnext, #gates details.step.current'); if (g) { await g.evaluate(d => d.open = true); await g.screenshot({ path: path.join(SH, name + '-milestone.png') }); } };
  for (const width of [1500, 390]) {
    const ctx = await b.newContext({ viewport: { width, height: 1000 } }), p = await ctx.newPage(); await p.goto('file://' + ROOT + '/qa-cur.html');
    for (const mode of ['advanced', 'basic']) for (const L of [27, 30, 32, 37, 40, 45]) { await p.evaluate(buildFixture, { L, mode, fx: 'clean' }); await p.reload(); await p.waitForTimeout(400); await unroll(p, `rv-${width}-${mode}-${L}`); }
    await ctx.close(); }
  /* the user's save */
  const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 } }), p = await ctx.newPage(); const user = fs.readFileSync(path.join(__dirname, 'fixture-user-v285.json'), 'utf8');
  await p.goto('file://' + ROOT + '/qa-v285.html'); await p.evaluate(([k, s]) => localStorage.setItem(k, s), [KEY, user]); await p.reload(); await p.waitForTimeout(400);
  await p.goto('file://' + ROOT + '/qa-cur.html'); await p.waitForTimeout(600); await unroll(p, 'rv-user27');
  for (const id of ['g22', 'g27']) { const g = await p.$('#' + id); await g.evaluate(d => { d.open = true; d.hidden = false; }); await g.screenshot({ path: path.join(SH, `rv-user27-${id}.png`) }); }
  await p.evaluate(() => { document.querySelector('.st-pick').focus(); }); const sel = await p.evaluate(() => [...document.querySelectorAll('.st-pick option')].map(o => o.textContent));
  console.log('stigma pick options', sel);
  /* hover a Next up quest row to reveal "not yet" */
  const row = await p.$('#nowStar .ql.new'); if (row) { await row.hover(); await p.waitForTimeout(200); await (await p.$('#nowStar .ns-card:has(.ns-qgrid)')).screenshot({ path: path.join(SH, 'rv-user27-rqcard-hover.png') }).catch(e => console.log(e.message)); }
  await b.close(); })();
