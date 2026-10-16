#!/usr/bin/env node
/* Before / after screenshots for the 0.3 E10 PR (issue #108; 390 px wide; not a suite). "Before" is a build of main in a
   worktree (`git worktree add --detach tests/out/main-wt main`, then `node tests/out/main-wt/scripts/build.mjs`); "after" is
   this branch's dist/. Writes tests/out/e10-shots/<case><suffix>-<before|after>.png.
   Usage: npm run build && node tests/support/e10-shots.mjs */
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..'), OUT = join(ROOT, 'tests/out/e10-shots');
const DIRS = { before: join(ROOT, 'tests/out/main-wt/dist'), after: join(ROOT, 'dist') };
const KEY = 'aion2-assassin-route-v4', FLAGS = { seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true };
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
mkdirSync(OUT, { recursive: true });
const serve = dir => new Promise(res => { const s = createServer((req, r) => { let f = join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); r.end(readFileSync(f)); }).listen(0, '127.0.0.1', () => res({ s, url: 'http://127.0.0.1:' + s.address().port })); });
const servers = { before: await serve(DIRS.before), after: await serve(DIRS.after) };
const b = await chromium.launch();

const FC = 'Forgotten Commander', DT = 'Daeva Trapped in a Nightmare';
const JOURNEY = ['section.card.where', '-journey'], STORY = ['#nowStar .ns-card', '-nextup-story', /Story: |story complete/];
const WITNESS = ['#nowStar .ns-card', '-nextup-witnesses', /Witnesses the Nightmare|Hero and Ascension/];
const row = k => [`#gates li:has(input[data-k="${k}"])`, '-g45-row'];
/* save: the stored state (both builds unless before / after give their own); shots: [selector, suffix, text the element must hold] */
const CASES = [
  /* on Forgotten Commander, not turned in: the Journey's next row and the story card's subline now name Daeva Trapped */
  { name: '1-on-forgotten-commander', save: { level: 45, quest: FC, checks: {} }, shots: [JOURNEY, STORY] },
  /* a save that turned in Forgotten Commander when it was the end of the data: it moves on to Daeva Trapped at load */
  { name: '2-forgotten-commander-turned-in', save: { level: 45, quest: FC, storyEnd: FC, checks: {} }, shots: [JOURNEY, STORY, WITNESS] },
  /* the end of the guide's story: before = Forgotten Commander turned in (main's end), after = Daeva Trapped turned in */
  { name: '3-story-end', before: { level: 45, quest: FC, storyEnd: FC, checks: {} }, after: { level: 45, quest: DT, storyEnd: DT, checks: {} }, shots: [JOURNEY, STORY, WITNESS] },
  /* g45:0 ticked (Witnesses and Oath) in an older save: copied to g45:witness once (g45Split1); the Lv 45 milestone row */
  { name: '4-g45-ticked', save: { level: 45, quest: FC, checks: { 'g45:0': true }, open: { g45: true } }, rowKey: { before: 'g45:0', after: 'g45:witness' } },
  /* the Lv 45 milestone row, open and not ticked: before on Forgotten Commander turned in (main's end), after on Daeva Trapped */
  { name: '5-g45-open', before: { level: 45, quest: FC, storyEnd: FC, checks: {}, open: { g45: true } }, after: { level: 45, quest: DT, checks: {}, open: { g45: true } }, rowKey: { before: 'g45:0', after: 'g45:witness' } },
  /* ... and once Daeva Trapped is turned in: done by the wrapper rule, not ticked ("done in the story") */
  { name: '6-g45-derived', before: { level: 45, quest: FC, storyEnd: FC, checks: {}, open: { g45: true } }, after: { level: 45, quest: DT, storyEnd: DT, checks: {}, open: { g45: true } }, rowKey: { before: 'g45:0', after: 'g45:witness' } },
];
for (const c of CASES) for (const when of ['before', 'after']) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(servers[when].url + '/');
  await p.evaluate(([k, s]) => { localStorage.clear(); localStorage.setItem(k, JSON.stringify(s)); }, [KEY, { ...FLAGS, open: {}, hideCards: false, mode: 'advanced', ...(c[when] || c.save) }]);
  await p.reload(); await p.waitForTimeout(600);
  for (const [sel, suf, hasText] of c.rowKey ? [row(c.rowKey[when])] : c.shots) {
    const el = p.locator(sel, hasText ? { hasText } : {}).first();
    if (!(await el.count())) { console.log('missing', c.name, when, sel); continue; }
    await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(150);
    await el.screenshot({ path: join(OUT, `${c.name}${suf}-${when}.png`) });
  }
  await ctx.close();
}
await b.close(); for (const x of Object.values(servers)) x.s.close();
console.log('screenshots: ' + OUT);
