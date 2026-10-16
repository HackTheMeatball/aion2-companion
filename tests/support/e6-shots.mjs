#!/usr/bin/env node
/* Before / after screenshots for the 0.3 E6 PR (issue #74; 390 px wide; not a suite). "Before" is a build of main in a
   worktree (`git worktree add --detach tests/out/main-wt main`, then `node tests/out/main-wt/scripts/build.mjs`: node_modules
   resolves from the repo root above it); "after" is this branch's dist/. Writes docs/reviews/0.3-e6-shots/<case>-<before|after>.png
   (kept for the owner's final 0.3 review).
   Usage: npm run build && node tests/support/e6-shots.mjs */
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..'), OUT = join(ROOT, 'docs/reviews/0.3-e6-shots');
const DIRS = { before: join(ROOT, 'tests/out/main-wt/dist'), after: join(ROOT, 'dist') };
const KEY = 'aion2-assassin-route-v4', FLAGS = { seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true };
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
mkdirSync(OUT, { recursive: true });
const serve = dir => new Promise(res => { const s = createServer((req, r) => { let f = join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); r.end(readFileSync(f)); }).listen(0, '127.0.0.1', () => res({ s, url: 'http://127.0.0.1:' + s.address().port })); });
const servers = { before: await serve(DIRS.before), after: await serve(DIRS.after) };
const b = await chromium.launch();

/* save: the stored state; quest "<name>[+n|-n]" picks the story quest; mode; shots: [selector, suffix, text the element must hold] */
const LATER = ['#nowStar', '-nextup'];
const CASES = [
  { name: '1-g12-on-urgent-pursuit', save: { level: 13, open: { g12: true } }, quest: 'Urgent Pursuit', shots: [['#g12', '']] },
  { name: '2-g12-on-cemetery-cleanup', save: { level: 13, open: { g12: true } }, quest: 'Cemetery Cleanup', shots: [['#g12', '']] },
  { name: '3-g12-basic-on-urgent-pursuit', save: { level: 13, open: { g12: true } }, quest: 'Urgent Pursuit', mode: 'basic', shots: [['#g12', '']] },
  { name: '4-g22-stigma-slot-before-daeva-in-a-dream', save: { level: 22, open: { g22: true } }, quest: 'Daeva in a Dream-3', shots: [['#g22', '']] },
  { name: '5-g16-regional-rows-before-buried-atrocities', save: { level: 16, open: { g16: true } }, quest: 'Buried Atrocities-2', shots: [['#g16', '']] },
  { name: '6-later-cards-lv4', save: { level: 4 }, quest: 'first-lv4', shots: [LATER] },
  { name: '7-daevanion-before-urgent-pursuit', save: { level: 15, dvTotal: 16 }, quest: 'Urgent Pursuit-2', shots: [['#dvBox', '-card']] },
  { name: '8-daevanion-basic-before-urgent-pursuit', save: { level: 15, dvTotal: 16 }, quest: 'Urgent Pursuit-2', mode: 'basic', shots: [['#dvBox', '-card']] },
];
for (const c of CASES) for (const when of ['before', 'after']) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(servers[when].url + '/');
  await p.evaluate(([k, s, q, mode]) => {
    let quest;
    if (q === 'first-lv4') quest = QUESTS.find(x => x[0] >= 4)[1];
    else { const m = q.match(/^(.*?)([+-]\d+)?$/); quest = QUESTS[QUESTS.findIndex(x => x[1] === m[1]) + (+m[2] || 0)][1]; }
    localStorage.clear(); localStorage.setItem(k, JSON.stringify({ ...s, quest, mode }));
  }, [KEY, { ...FLAGS, checks: {}, open: {}, hideCards: false, ...c.save }, c.quest, c.mode || 'advanced']);
  await p.reload(); await p.waitForTimeout(600);
  for (const [sel, suf, hasText] of c.shots) {
    const el = p.locator(sel, hasText ? { hasText } : {}).first();
    if (!(await el.count()) || !(await el.isVisible())) { console.log('not shown', c.name, when, sel); continue; }
    await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(150);
    await el.screenshot({ path: join(OUT, `${c.name}${suf}-${when}.png`) });
  }
  await ctx.close();
}
await b.close(); for (const x of Object.values(servers)) x.s.close();
console.log('screenshots: ' + OUT);
