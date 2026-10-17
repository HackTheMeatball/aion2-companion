#!/usr/bin/env node
/* 0.5 P18 review shots: the character switcher against the S2 mockup (docs/design/0.5-characters-mockup.md), at 390 and
   1500 px, Basic and Advanced, in both builds (dist/ = site, dist-artifact/ = claude.ai). After `npm run build`:
     node docs/reviews/0.5-p18-shots/shoot.mjs
   Writes <build>-<state>-<width>-<mode>.png here. States: noname (fresh browser, assassin-lvl1, closed), name (Zed at
   Lv 27, closed), list (open, Zed current and an unnamed Lv 1 character), new (the New character form, "Quin" typed).
   With the self-hosted web fonts, as a player sees it. */
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from '../../../scripts/serve.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const OUT = dirname(fileURLToPath(import.meta.url));

/* a save with Zed (Lv 27) current and a second, unnamed character at Lv 1 (made with the page's own functions) */
const twoChars = () => {
  let s = JSON.parse(JSON.stringify(state)); const zed = s.current;
  s.chars[zed].name = 'Zed'; s.chars[zed].level = 27;
  s = addChar(s, { name: '', now: 0, id: '00000000-0000-4000-8000-0000000000b2' });
  s.chars[s.current].level = 1; s.current = zed;
  localStorage.setItem(KEY, JSON.stringify(s));
};
const STATES = {
  noname: { setup: null, act: null },
  name: { setup: twoChars, act: null },
  list: { setup: twoChars, act: () => document.getElementById('charBtn').click() },
  new: { setup: twoChars, act: () => { document.getElementById('charBtn').click(); document.getElementById('charNew').click();
    const i = document.getElementById('charName'); i.value = 'Quin'; i.dispatchEvent(new Event('input')); } },
};

const { server, url } = await startServer();
const b = await chromium.launch();
for (const [build, path] of [['site', '/'], ['artifact', '/artifact/']])
  for (const [st, { setup, act }] of Object.entries(STATES))
    for (const w of [390, 1500]) for (const mode of ['basic', 'advanced']) {
      const ctx = await b.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
      const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
      await p.goto(url + path); await p.waitForTimeout(300);
      await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
      if (setup) await p.evaluate(setup);
      await p.evaluate(m => { const s = JSON.parse(localStorage.getItem(KEY)); s.mode = m; localStorage.setItem(KEY, JSON.stringify(s)); }, mode);
      await p.reload(); await p.waitForTimeout(400);
      if (act) await p.evaluate(act);
      await p.waitForTimeout(250);
      await p.screenshot({ path: join(OUT, `${build}-${st}-${w}-${mode}.png`), clip: { x: 0, y: 0, width: w, height: w < 500 ? 680 : 420 } });
      if (errs.length) { console.error(build, st, w, mode, errs); process.exitCode = 1; }
      await ctx.close();
    }
await b.close(); server.close();
console.log('shots written to', OUT);
