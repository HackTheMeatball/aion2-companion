#!/usr/bin/env node
/* Before / after screenshots for the 0.3 E7 PR (issue #75, specialty slots; 390 px wide; not a suite). "Before" is a build of
   main in a worktree (`git worktree add --detach tests/out/main-wt origin/main`, then `node tests/out/main-wt/scripts/build.mjs`:
   node_modules resolves from the repo root above it); "after" is this branch's dist/. Writes
   tests/out/e7-shots/<case>-<before|after>.png (or the folder given). Usage: npm run build && node tests/support/e7-shots.mjs
   [docs/reviews/0.3-e7-shots] */
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..'), OUT = join(ROOT, process.argv[2] || 'tests/out/e7-shots');
const DIRS = { before: join(ROOT, 'tests/out/main-wt/dist'), after: join(ROOT, 'dist') };
const { writeSave } = createRequire(import.meta.url)('./save.js');
const FLAGS ={ seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true };
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
mkdirSync(OUT, { recursive: true });
const serve = dir => new Promise(res => { const s = createServer((req, r) => { let f = join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); r.end(readFileSync(f)); }).listen(0, '127.0.0.1', () => res({ s, url: 'http://127.0.0.1:' + s.address().port })); });
const servers = { before: await serve(DIRS.before), after: await serve(DIRS.after) };
const b = await chromium.launch();

/* save: a player who kept up (every core skill line and slot 1 the plan opens at or below the level, every plan node of a board
   at or below it), then `off` keys unticked and `on` keys ticked; the story quest is the last one at or below the level (so
   "Urgent Pursuit" is turned in); stones cover the lines */
const NOW = ['#nowStar', '-nextup'], SKILLS = ['#spCard', '-skills'];
const CASES = [
  { name: '1-heart-gore-line-7-plus-board-node-lv21', lv: 21, off: ['sp:Heart Gore:8', 'sp:Heart Gore:spec'], on: ['dv:hg'], shots: [NOW, SKILLS] },
  { name: '2-heart-gore-line-8-not-bought-lv22', lv: 22, off: ['sp:Heart Gore:8', 'sp:Heart Gore:spec', 'dv:hg', 'dv:z:hg'], shots: [NOW, SKILLS] },
  { name: '3-quick-slice-slot-2-lv27', lv: 27, shots: [NOW, SKILLS] },
  { name: '4-insignia-explosion-slot-2-no-pick-lv40', lv: 40, on: ['sp:Quick Slice:spec2', 'sp:Heart Gore:spec2'], shots: [NOW, SKILLS] },
  /* every line, extras too (315 pts): stones cover them past Lv 45's 203, so no "Ticked lines cost …" warning */
  { name: '5-lv45-all-bought-slot-3-listed', lv: 45, extra: true, stones: 120, on: ['sp:Quick Slice:spec2', 'sp:Heart Gore:spec2', 'sp:Insignia Explosion:spec2'], shots: [SKILLS] },
];
for (const c of CASES) for (const when of ['before', 'after']) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(servers[when].url + '/');
  await writeSave(p, await p.evaluate(([c, flags]) => {
    const quest = QUESTS.filter(q => q[0] <= c.lv).pop()[1], checks = {};
    SP_STEPS.filter(x => (c.extra || !x.s.extra) && x.req <= c.lv).forEach(x => { checks[x.k] = true; });
    DV_NODES().filter(it => it.blv <= c.lv && GATES.find(g => g.items.includes(it)).lv <= c.lv).forEach(it => { checks[it.k] = true; });
    (c.off || []).forEach(x => { delete checks[x]; }); (c.on || []).forEach(x => { checks[x] = true; });
    return { ...flags, open: {}, level: c.lv, quest, checks, stones: c.stones || 60, mode: 'advanced' };
  }, [c, FLAGS]), { fresh: true });
  await p.reload(); await p.waitForTimeout(600);
  for (const [sel, suf] of c.shots) {
    const el = p.locator(sel).first();
    if (!(await el.count()) || !(await el.isVisible())) { console.log('not shown', c.name, when, sel); continue; }
    await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(150);
    await el.screenshot({ path: join(OUT, `${c.name}${suf}-${when}.png`) });
  }
  await ctx.close();
}
await b.close(); for (const x of Object.values(servers)) x.s.close();
console.log('screenshots: ' + OUT);
