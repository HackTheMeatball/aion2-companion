#!/usr/bin/env node
/* Before / after screenshots for the 0.3 E9 PR (issue #69; 390 px wide; not a suite). "Before" is a build of main in a
   worktree (`git worktree add --detach tests/out/main-wt main`, then `node scripts/build.mjs` inside it: node_modules resolves
   from the repo root above it); "after" is this branch's dist/. Writes tests/out/e9-shots/<case>-<before|after>.png.
   Usage: npm run build && node tests/support/e9-shots.mjs */
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..'), OUT = join(ROOT, 'tests/out/e9-shots');
const DIRS = { before: join(ROOT, 'tests/out/main-wt/dist'), after: join(ROOT, 'dist') };
const KEY = 'aion2-assassin-route-v4', FLAGS = { seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true };
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
mkdirSync(OUT, { recursive: true });
const serve = dir => new Promise(res => { const s = createServer((req, r) => { let f = join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); r.end(readFileSync(f)); }).listen(0, '127.0.0.1', () => res({ s, url: 'http://127.0.0.1:' + s.address().port })); });
const servers = { before: await serve(DIRS.before), after: await serve(DIRS.after) };
const b = await chromium.launch();

/* save: the stored state; quest "<name>[+n]" picks the story quest; steps: ticked objectives of that quest; shots: [selector, suffix, text the element must hold] */
const CASES = [
  { name: '1-shugo-after-contaminated-area', save: { level: 12, checks: {}, open: { g12: true } }, quest: 'Contaminated Area', shots: [['#g12', ''], ['#nsqWrap .ns-card', '-nextup', /Regional/]] },
  { name: '2-shugo-contaminated-area-turned-in', save: { level: 12, checks: {}, open: { g12: true } }, quest: 'Contaminated Area+1', shots: [['#g12', ''], ['#nsqWrap .ns-card', '-nextup', /Regional/]] },
  { name: '3-fight-poison-on-a-collective-effort', save: { level: 27, checks: {}, open: { g27: true } }, quest: 'A Collective Effort', shots: [['#nsqWrap .ns-card', '-nextup', /Regional/]] },
  { name: '4-graverobber-den-cemetery-cleanup-step-4', save: { level: 13, checks: {}, showObj: true, showTalk: true, areaLv: 'sh' }, quest: 'Cemetery Cleanup', steps: [0, 1, 2, 3, 4], shots: [['#areas', ''], ['#questSubs', '-journey']] },
  { name: '5-krao-cave-row-and-step-note', save: { level: 22, checks: {}, showObj: true, showTalk: true, open: { g22: true } }, quest: 'Disturbed Balance', steps: [0, 1], shots: [['#g22', ''], ['#questSubs', '-journey']] },
  { name: '6-fire-temple-step-note', save: { level: 37, checks: {}, showObj: true, showTalk: true, open: { g35: true } }, quest: 'Mirror of Greed', steps: [0], shots: [['#g35', ''], ['#questSubs', '-journey']] },
  { name: '7-pet-note-removed', save: { level: 10, checks: {}, open: { g10: true } }, quest: 'Finding Nemon', shots: [['#g10', '']] },
  /* Empyrean Monolith check (owner, 20:12 ET): The Great Curse-Breaking Caper waits for Empyrean Monolith to be turned in, like its 5 neighbours */
  { name: '8-curse-breaking-caper-on-empyrean-monolith', save: { level: 16, checks: {}, open: { g16: true } }, quest: 'Empyrean Monolith', shots: [['#g16', ''], ['#nsqWrap .ns-card', '-nextup', /Regional/]] },
  { name: '9-curse-breaking-caper-monolith-turned-in', save: { level: 16, checks: {}, open: { g16: true } }, quest: 'Empyrean Monolith+1', shots: [['#g16', ''], ['#nsqWrap .ns-card', '-nextup', /Regional/]] },
];
for (const c of CASES) for (const when of ['before', 'after']) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(servers[when].url + '/');
  await p.evaluate(([k, s, q, steps]) => {
    const [n, d] = q.split('+'), quest = QUESTS[QUESTS.findIndex(x => x[1] === n) + (+d || 0)][1];
    const st = { ...s, quest, mode: 'advanced' };
    if (steps) st.qsteps = { [quest]: steps };
    localStorage.clear(); localStorage.setItem(k, JSON.stringify(st));
  }, [KEY, { ...FLAGS, open: {}, ...c.save }, c.quest, c.steps || null]);
  await p.reload(); await p.waitForTimeout(600);
  for (const [sel, suf, hasText] of c.shots) {
    const el = p.locator(sel, hasText ? { hasText } : {}).first();
    if (!(await el.count())) { console.log('missing', c.name, when, sel); continue; }
    await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(150);
    await el.screenshot({ path: join(OUT, `${c.name}${suf}-${when}.png`) });
  }
  await ctx.close();
}
await b.close(); for (const x of Object.values(servers)) x.s.close();
console.log('screenshots: ' + OUT);
