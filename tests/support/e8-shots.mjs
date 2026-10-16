#!/usr/bin/env node
/* Before / after screenshots for the 0.3 E8 PR (Ascension bar, issue #76; 390 px wide; not a suite). "Before" is the same
   build with every change on except ascensionBar (window.__gateChanges), "after" is the page as it ships. Writes
   tests/out/e8-shots/<case>-<before|after>.png. Usage: npm run build && node tests/support/e8-shots.mjs */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { startServer } from '../../scripts/serve.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..'), OUT = join(ROOT, 'tests/out/e8-shots');
const KEY = 'aion2-assassin-route-v4', FLAGS = { seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true };
mkdirSync(OUT, { recursive: true });
const { server, url } = await startServer({});
const b = await chromium.launch();
const names = await (async () => { const ctx = await b.newContext({ serviceWorkers: 'block' }), p = await ctx.newPage(); await p.goto(url + '/');
  const n = await p.evaluate(() => Object.keys(GATE_CHANGES)); await ctx.close(); return n; })();

/* save: the stored state; quest "<name>[+n]" picks the story quest ('' = unset) */
const CASES = [
  { name: '1-fresh-0of4', save: { level: 1, checks: {} }, quest: '' },
  { name: '2-verdant-melody-1of4', save: { level: 22, checks: {} }, quest: 'Verdant Melody' },
  { name: '3-daeva-in-a-dream-turned-in-2of4', save: { level: 24, checks: {} }, quest: 'Daeva in a Dream+1' },
  { name: '4-dreams-turned-in-3of4', save: { level: 33, checks: {} }, quest: 'A Daeva Dreaming Anew+1' },
  { name: '5-witnesses-ticked-4of4', save: { level: 45, checks: { 'g45:0': true }, storyEnd: 'Forgotten Commander' }, quest: 'Forgotten Commander' },
  { name: '6-basic-2of4', save: { level: 24, checks: {} }, quest: 'Daeva in a Dream+1', mode: 'basic' },
];
for (const c of CASES) for (const when of ['before', 'after']) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', reducedMotion: 'reduce' });
  if (when === 'before') await ctx.addInitScript(n => { window.__gateChanges = n; }, names.filter(n => n !== 'ascensionBar'));
  const p = await ctx.newPage();
  await p.goto(url + '/');
  await p.evaluate(([k, s, q, mode]) => {
    const [n, d] = q.split('+'), quest = q ? QUESTS[QUESTS.findIndex(x => x[1] === n) + (+d || 0)][1] : '';
    localStorage.clear(); localStorage.setItem(k, JSON.stringify({ ...s, quest, mode }));
  }, [KEY, { ...FLAGS, open: {}, ...c.save }, c.quest, c.mode || 'advanced']);
  await p.reload(); await p.waitForTimeout(600);
  const el = p.locator('section.card.where').first(); await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(150);
  await el.screenshot({ path: join(OUT, `${c.name}-${when}.png`) });
  await ctx.close();
}
await b.close(); server.close();
console.log('screenshots: ' + OUT);
