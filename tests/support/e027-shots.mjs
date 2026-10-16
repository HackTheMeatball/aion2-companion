#!/usr/bin/env node
/* Before / after screenshots for the 0.2.7 Active / Passive tag (issue #100; 390 px wide; not a suite). "Before" is the build
   just before #99 (3e242cf^) in a worktree (`git worktree add --detach tests/out/pre-wt 3e242cf^`, then `node scripts/build.mjs`
   inside it: node_modules resolves from the repo root above it); "after" is this branch's dist/. Shots: the whole Skills card,
   the hero, and a specialty row in Coming up. Writes docs/reviews/0.2.7-shots/<case>-<before|after>.png.
   Usage: npm run build && node tests/support/e027-shots.mjs */
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..'), OUT = join(ROOT, 'docs/reviews/0.2.7-shots');
const DIRS = { before: join(ROOT, 'tests/out/pre-wt/dist'), after: join(ROOT, 'dist') };
const KEY = 'aion2-assassin-route-v4', FLAGS = { seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true };
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
mkdirSync(OUT, { recursive: true });
const serve = dir => new Promise(res => { const s = createServer((req, r) => { let f = join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); r.end(readFileSync(f)); }).listen(0, '127.0.0.1', () => res({ s, url: 'http://127.0.0.1:' + s.address().port })); });
const servers = { before: await serve(DIRS.before), after: await serve(DIRS.after) };
const b = await chromium.launch();

/* tick: skill upgrades below skill Lv 8 are marked spent, which opens the specialty rows; level: the saved character level; shots: [selector, suffix]; the specialty row is the first slot row in Coming up (it carries the .spectag chip) */
const CASES = [
  { name: '1-lv12-skills-card-and-hero', level: 12, shots: [['#spCard', '-card'], ['#spHero', '-hero']] },
  { name: '2-lv20-specialty-row', level: 20, tick: true, shots: [['#spSoon li.isspec', '-row'], ['#spCard', '-card']] },
];
for (const c of CASES) for (const when of ['before', 'after']) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(servers[when].url + '/');
  await p.evaluate(([k, s]) => { localStorage.clear(); localStorage.setItem(k, JSON.stringify(s)); }, [KEY, { ...FLAGS, checks: {}, open: {}, quest: '', mode: 'advanced', level: c.level }]);
  await p.reload(); await p.waitForTimeout(600);
  if (c.tick) await p.evaluate(() => { SP_STEPS.filter(x => !x.spec && x.L < 8.5).forEach(x => { char(state).checks[x.k] = true; }); update(); });
  for (const [sel, suf] of c.shots) {
    const el = p.locator(sel).first();
    if (!(await el.count())) { console.log('missing', c.name, when, sel); continue; }
    await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(150);
    await el.screenshot({ path: join(OUT, `${c.name}${suf}-${when}.png`) });
  }
  /* crowding: the specialty row's name cell must not be clipped (name + chip + spec tag on one 390 px row) */
  if (when === 'after') {
    const m = await p.evaluate(() => [...document.querySelectorAll('#spSoon li')].map(li => { const n = li.querySelector('.sname'); return n && { t: n.textContent.replace(/\s+/g, ' ').trim(), clipped: n.scrollWidth > n.clientWidth, h: Math.round(li.getBoundingClientRect().height) }; }).filter(x => x));
    console.log(c.name, 'rows', m.length, 'clipped', m.filter(x => x.clipped).map(x => x.t), 'heights', [...new Set(m.map(x => x.h))]);
  }
  await ctx.close();
}
await b.close(); for (const x of Object.values(servers)) x.s.close();
console.log('screenshots: ' + OUT);
