import { startServer } from '/home/claude/aion2-companion/scripts/serve.mjs';
import { createRequire } from 'node:module'; const require = createRequire('/home/claude/aion2-companion/package.json');
const { chromium } = require('playwright');
const { server, url } = await startServer({ baselines: true });
const b = await chromium.launch({ args: ['--host-resolver-rules=MAP fonts.googleapis.com ~NOTFOUND, MAP fonts.gstatic.com ~NOTFOUND'] });
for (const [name, u] of [['dist', url + '/'], ['raw', url + '/__baselines/__orig-raw.html'], ['wrapped', url + '/__baselines/__orig-wrapped.html'], ['dist', url + '/'], ['raw', url + '/__baselines/__orig-raw.html']]) {
  const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 } }); const p = await ctx.newPage(); await p.goto(u);
  await p.evaluate(() => { const L = 30; const st = { checks: {}, level: L, quest: 'Dying Light', mode: 'advanced', open: {}, seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, started: {}, stones: 2 * (L - 10), dvTotal: 4 * (L - 11) + 20, stShards: 3 };
    GATES.forEach(g => g.items.forEach(it => { if (g.lv < L && !it.sub && !it.hidden && !it.dv && it.kind !== 'hideout' && it.k) st.checks[it.k] = true; }));
    localStorage.setItem('aion2-assassin-route-v4', JSON.stringify(st)); }); await p.reload(); await p.waitForTimeout(600);
  const r = []; for (const w of [1500, 1100, 390]) { await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(300);
    r.push(await p.evaluate(() => { const ts = []; for (let i = 0; i < 10; i++) { const t0 = performance.now(); update(); ts.push(performance.now() - t0); } ts.sort((a, b) => a - b); return +ts[5].toFixed(1); })); }
  console.log(name, r.join(' / '), await p.evaluate(() => document.compatMode)); await ctx.close();
}
await b.close(); server.close();
