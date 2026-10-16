#!/usr/bin/env node
/* Screenshots for the 0.2.4 PR (villages as zones, issue #98; 390 px wide; not a suite). A data change has no switch, so
   "before" and "after" are two builds: run it on the base commit with `before`, then on the change with `after`.
   Writes tests/out/v024-shots/<case>-<tag>.png. Usage: npm run build && node tests/support/v024-shots.mjs before|after */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { startServer } from '../../scripts/serve.mjs';

const tag = process.argv[2];
if (!['before', 'after'].includes(tag)) { console.error('usage: v024-shots.mjs before|after'); process.exit(2); }
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..'), OUT = join(ROOT, 'tests/out/v024-shots');
const KEY = 'aion2-assassin-route-v4', FLAGS = { seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true };
mkdirSync(OUT, { recursive: true });
const { server, url } = await startServer({});
const b = await chromium.launch();

/* story quests whose giver or turn-in is in Aldelle Village: the story step the route shows */
const CASES = [
  { name: '1-village-in-the-fog', save: { level: 2, checks: {} }, quest: 'A Village in the Fog' },
  { name: '2-isolated-lake', save: { level: 4, checks: {} }, quest: 'Isolated Lake' },
  { name: '3-brigade-prison-compound', save: { level: 7, checks: {} }, quest: 'Brigade Prison Compound Infiltration Operation' },
];
for (const c of CASES) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(url + '/');
  await p.evaluate(([k, s]) => { localStorage.clear(); localStorage.setItem(k, JSON.stringify(s)); }, [KEY, { ...FLAGS, open: {}, ...c.save, quest: c.quest, mode: 'advanced' }]);
  await p.reload(); await p.waitForTimeout(600);
  await p.screenshot({ path: join(OUT, `${c.name}-${tag}.png`), fullPage: false });
  const el = p.locator('section.card.where').first(); await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(150);
  await el.screenshot({ path: join(OUT, `${c.name}-journey-${tag}.png`) });
  await ctx.close();
}
await b.close(); server.close();
console.log('screenshots: ' + OUT);
