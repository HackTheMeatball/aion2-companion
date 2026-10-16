#!/usr/bin/env node
/* Before / after screenshots for the 0.3 E9 part 2 PR (issue #107; 390 px wide; not a suite). "Before" is a build of main in a
   worktree (`git worktree add --detach tests/out/main-wt main`, then `node scripts/build.mjs` inside it: node_modules resolves
   from the repo root above it); "after" is this branch's dist/. Writes tests/out/e9p2-shots/<case>-<before|after>.png.
   Usage: npm run build && node tests/support/e9p2-shots.mjs */
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..'), OUT = join(ROOT, 'tests/out/e9p2-shots');
const DIRS = { before: join(ROOT, 'tests/out/main-wt/dist'), after: join(ROOT, 'dist') };
const KEY = 'aion2-assassin-route-v4', FLAGS = { seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true };
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
mkdirSync(OUT, { recursive: true });
const serve = dir => new Promise(res => { const s = createServer((req, r) => { let f = join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); r.end(readFileSync(f)); }).listen(0, '127.0.0.1', () => res({ s, url: 'http://127.0.0.1:' + s.address().port })); });
const servers = { before: await serve(DIRS.before), after: await serve(DIRS.after) };
const b = await chromium.launch();

const RQ_CARD = ['#nowStar .ns-card', '-nextup', /Regional/];
/* save: the stored state; quest "<name>[+n]" picks the story quest; tickBoards: tick every plan node of these boards (so the
   next board's plan is current); shots: [selector, suffix, text the element must hold] */
const CASES = [
  /* Hugo Mercenaries: Deep Shadow (rec Lv 30): Past and Present ticked, before and after Canyon's Secret is turned in */
  { name: '1-deep-shadow-pp-ticked-on-canyons-secret', save: { level: 30, checks: { 'rq:2202010': true } }, quest: "Canyon's Secret", click: /waiting on the story/, shots: [RQ_CARD] },
  { name: '2-deep-shadow-pp-ticked-canyons-secret-turned-in', save: { level: 30, checks: { 'rq:2202010': true } }, quest: "Canyon's Secret+1", shots: [RQ_CARD] },
  /* Zikel board plan (opens at Lv 20): both Defense Break nodes (dv:z:db r6c7 = owner row 4 col 5; dv:z:db2 r12c11 = row 10 col 9) */
  { name: '3-zikel-board-plan-lv21', save: { level: 21, checks: {}, dvTotal: 200, dvAllOpen: true }, quest: 'Disturbed Balance', tickBoards: ['Nezekan'], shots: [['#dvBoard', '-tile'], ['#dvAllList ul.dv-board', '-list', /Zikel ·/]] },
];
for (const c of CASES) for (const when of ['before', 'after']) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(servers[when].url + '/');
  await p.evaluate(([k, s, q, boards]) => {
    const [n, d] = q.split('+'), quest = QUESTS[QUESTS.findIndex(x => x[1] === n) + (+d || 0)][1];
    const st = { ...s, quest, mode: 'advanced' };
    for (const it of boards ? DV_NODES() : []) if (boards.includes(it.board)) st.checks[it.k] = true;
    localStorage.clear(); localStorage.setItem(k, JSON.stringify(st));
  }, [KEY, { ...FLAGS, open: {}, hideCards: false, ...c.save }, c.quest, c.tickBoards || null]);
  await p.reload(); await p.waitForTimeout(600);
  if (c.click) { const t = p.locator(RQ_CARD[0], { hasText: RQ_CARD[2] }).first().getByText(c.click).first(); if (await t.count()) { await t.click(); await p.waitForTimeout(300); } else console.log('no toggle', c.name, when); }
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
