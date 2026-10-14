const { chromium } = require('playwright'); const path = require('path'); const ROOT = path.resolve(__dirname, '..', '..');
(async () => { const b = await chromium.launch();
  for (const w of [390, 600, 800, 1100]) { const ctx = await b.newContext({ viewport: { width: w, height: 700 } }), p = await ctx.newPage(); await p.goto('file://' + ROOT + '/' + (process.argv[2] || 'qa-cur.html')); await p.waitForTimeout(400);
    const r = await p.evaluate(() => { const h = document.querySelector('h1'), boxes = [...document.querySelectorAll('header *')].filter(e => e.children.length === 0 && e.innerText && e.innerText.trim()).map(e => ({ t: e.innerText.slice(0, 30), r: e.getBoundingClientRect() }));
      const ov = []; for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) { const a = boxes[i].r, c = boxes[j].r; if (a.left < c.right - 2 && c.left < a.right - 2 && a.top < c.bottom - 2 && c.top < a.bottom - 2) ov.push(boxes[i].t + ' × ' + boxes[j].t); }
      return { h1: h && h.getBoundingClientRect().toJSON(), ov }; });
    console.log(w, JSON.stringify(r.ov));
    await p.screenshot({ path: path.join(__dirname, 'shots', `hdr-${process.argv[2] ? 'v285-' : ''}${w}.png`), clip: { x: 0, y: 0, width: w, height: 200 } }); await ctx.close(); }
  await b.close(); })();
