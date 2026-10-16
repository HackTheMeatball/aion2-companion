#!/usr/bin/env node
/* Before / after screenshots for the 0.3 E5 PR (issue #72; 390 px wide; not a suite). "Before" is a build of main in a
   worktree (`git worktree add --detach tests/out/main-wt main`, then `node scripts/build.mjs` inside it: node_modules resolves
   from the repo root above it); "after" is this branch's dist/. Writes tests/out/e5-shots/<case>-<before|after>.png.
   Usage: npm run build && node tests/support/e5-shots.mjs */
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..'), OUT = join(ROOT, 'tests/out/e5-shots');
const DIRS = { before: join(ROOT, 'tests/out/main-wt/dist'), after: join(ROOT, 'dist') };
const { writeSave } = createRequire(import.meta.url)('./save.js');
const FLAGS ={ seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true };
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
mkdirSync(OUT, { recursive: true });
const serve = dir => new Promise(res => { const s = createServer((req, r) => { let f = join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); r.end(readFileSync(f)); }).listen(0, '127.0.0.1', () => res({ s, url: 'http://127.0.0.1:' + s.address().port })); });
const servers = { before: await serve(DIRS.before), after: await serve(DIRS.after) };
const b = await chromium.launch();

/* save: the stored state; quest "<name>[+n]" picks the story quest; steps: ticked objectives of that quest; shots: [selector, suffix, text the element must hold] */
const RQ_CARD = ['#nowStar .ns-card', '-nextup', /Regional/];
const CASES = [
  { name: '1-traveling-merchant-on-blood-monument', save: { level: 33, checks: {} }, quest: 'Blood Monument', shots: [RQ_CARD] },
  { name: '2-traveling-merchant-blood-monument-turned-in', save: { level: 33, checks: {} }, quest: 'Blood Monument+1', shots: [RQ_CARD] },
  { name: '3-lest-we-forget-on-zikels-core', save: { level: 45, checks: {} }, quest: "Zikel's Core", shots: [RQ_CARD] },
  { name: '4-noble-belt-on-urgent-pursuit', save: { level: 13, checks: {}, open: { g12: true } }, quest: 'Urgent Pursuit', shots: [['#g12', ''], ['#nowStar', '-nextup']] },
  { name: '5-noble-belt-urgent-pursuit-turned-in', save: { level: 13, checks: {}, open: { g12: true } }, quest: 'Urgent Pursuit+1', shots: [['#g12', ''], ['#nowStar', '-nextup']] },
  { name: '6-revelation-amulet-on-buried-atrocities', save: { level: 16, checks: {}, open: { g16: true } }, quest: 'Buried Atrocities', shots: [['#g16', ''], ['#nowStar', '-nextup']] },
  /* Daevanion: Lv 15 with the story before "Urgent Pursuit" (level and story are independent in the app); the card is hidden after */
  { name: '7-daevanion-before-urgent-pursuit', save: { level: 15, checks: {}, dvTotal: 16 }, quest: 'Veiled Truth', shots: [['#nowStar', '-nextup'], ['#dvBox', '-card']] },
  { name: '8-draupnir-step-note', save: { level: 45, checks: {}, showObj: true, showTalk: true }, quest: 'Forgotten Commander', steps: [0], shots: [['#questSubs', '-journey'], ['#nowStar .ns-card', '-nextup', /Forgotten Commander/]] },
];
for (const c of CASES) for (const when of ['before', 'after']) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(servers[when].url + '/');
  await writeSave(p, await p.evaluate(([s, q, steps]) => {
    const [n, d] = q.split('+'), quest = QUESTS[QUESTS.findIndex(x => x[1] === n) + (+d || 0)][1];
    const st = { ...s, quest, mode: 'advanced' };
    if (steps) st.qsteps = { [quest]: steps };
    return st;
  }, [{ ...FLAGS, open: {}, ...c.save }, c.quest, c.steps || null]), { fresh: true });
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
