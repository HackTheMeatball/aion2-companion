#!/usr/bin/env node
/* Before / after screenshots for the 0.3 E4 PR (390 px wide; not a suite). "Before" is the same build with every E4
   change off (window.__gateChanges = [], which tests/golden.js --explain shows equals the snapshots of main); "after" is
   the page as it ships. Writes tests/out/e4-shots/<case>-<before|after>.png. Usage: npm run build && node tests/support/e4-shots.mjs */
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { startServer } from '../../scripts/serve.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..'), OUT = join(ROOT, 'tests/out/e4-shots');
const { writeSave } = createRequire(import.meta.url)('./save.js');
const FLAGS ={ seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true };
mkdirSync(OUT, { recursive: true });
const { server, url } = await startServer({});
const b = await chromium.launch();

/* save: the stored state; quest(QUESTS) picks the story quest in the page; shots: [selector, file suffix, text the element must hold] */
const CASES = [
  { name: '1-milestone-derived', save: { level: 22, checks: { 'g16:amulet': true }, open: { g16: true } }, quest: 'Daeva in a Dream+1', shots: [['#g16', '']] },
  { name: '2-regional-follow-up', save: { level: 22, checks: {}, started: { 'rq:2202017': 1 }, open: { g22: true } }, quest: 'Daeva in a Dream+1', shots: [['#g22', ''], ['#nsqWrap .ns-card', '-nextup', /Regional/]] },
  { name: '3-lv44-forgotten-commander', save: { level: 44, checks: {}, showObj: true, showTalk: true, qsShowDone: true }, quest: 'Forgotten Commander', objs: true, shots: [['#nsqWrap .ns-card', '-nextup', /Forgotten Commander/], ['#questSubs', '-journey']] },
];
for (const c of CASES) for (const when of ['before', 'after']) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', reducedMotion: 'reduce' });
  if (when === 'before') await ctx.addInitScript(() => { window.__gateChanges = []; });
  const p = await ctx.newPage();
  await p.goto(url + '/');
  await writeSave(p, await p.evaluate(([s, q, objs]) => {
    const [n, d] = q.split('+'), quest = QUESTS[QUESTS.findIndex(x => x[1] === n) + (+d || 0)][1];
    const st = { ...s, quest, mode: 'advanced' };
    if (objs) st.qsteps = { [quest]: QUEST_STEPS[quest].map((_, i) => i) };
    return st;
  }, [{ ...FLAGS, open: {}, ...c.save }, c.quest, !!c.objs]), { fresh: true });
  await p.reload(); await p.waitForTimeout(600);
  for (const [sel, suf, hasText] of c.shots) {
    const el = p.locator(sel, hasText ? { hasText } : {}).first(); await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(150);
    await el.screenshot({ path: join(OUT, `${c.name}${suf}-${when}.png`) });
  }
  await ctx.close();
}
await b.close(); server.close();
console.log('screenshots: ' + OUT);
