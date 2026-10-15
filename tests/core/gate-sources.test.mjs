/* §8 source check (0.3 E2, docs/design/0.3-requirement-engine.md §8): no file outside src/core/evaluator.js decides
   whether something is open. The page's gate questions go through src/core/requirements.js (gatesOf and the functions
   on it); the 0.2 rules the data doesn't hold yet are the named KEPT_RULES there, pinned below.

   Each pattern is the shape a gate written by hand took in 0.2 (comparing story positions, board / skill / stigma /
   dungeon / stronghold levels with yours, reading "g22:0" as a gate). A match outside its allowance fails, and so does
   an allowance that no longer matches (so it is removed with the code). Level comparisons that only rank or group
   (milestone `g.lv`: here / missed / later, Sealed Dungeon band headings in the Areas card, the verified-unlock timeline)
   are not gates and not matched here. */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FILES = ['src/main.js', 'src/site.js', ...readdirSync(join(ROOT, 'src/core')).filter(f => f.endsWith('.js') && f !== 'evaluator.js').map(f => 'src/core/' + f),
  ...readdirSync(join(ROOT, 'src/data')).filter(f => f.endsWith('.js')).map(f => 'src/data/' + f)];

/* a comparison operator (<, <=, >, >=; not the arrow =>) on either side of `field` */
const cmpRe = field => new RegExp(String.raw`${field}\s*(\|\|\s*0\)\s*)?[<>]|(?<![=\-])[<>]=?\s*[\w.()]*${field}\b`, 'g');
/* name → { re, allow: { file: count }, why } */
const PATTERNS = {
  'story position lookup (QUESTS.findIndex)': { re: /QUESTS\.findIndex\(/g,
    allow: { 'src/core/requirements.js': 1, 'src/main.js': 1, 'src/core/migrations.js': 1, 'src/core/sync.js': 1 },
    why: 'storyIdx (the position, for display); main.js findQuest (the quest search box matches typed text); migrations.js moves ' +
      'a turned-in last quest on to the next one (a save step, untouched by E2); sync.js ranks two story positions when merging saves' },
  'story gate by a quest name in code (storyIdx("…"))': { re: /storyIdx\(\s*["'`]/g, allow: {} },
  'plan node / board level compared (.blv)': { re: cmpRe(String.raw`\.blv`), allow: {} },
  'skill line level compared (.req)': { re: cmpRe(String.raw`\.req`), allow: { 'src/core/catalog.js': 2 },
    why: 'catalog.js files each skill line under the first milestone at or after its unlock level (placement, not a gate)' },
  'stronghold lowest level compared (.lo)': { re: cmpRe(String.raw`\.lo`), allow: {} },
  'area band compared (bandOf(…) vs a level)': { re: /bandOf\([^)]*\)\s*[<>]|(?<![=\-])[<>]=?\s*bandOf\(/g, allow: {} },
  'stigma slot / Sealed Dungeon level compared (x.lv, nx.lv, …)': { re: cmpRe(String.raw`\b(?:x|y|it|nx|next|sl|s)\.lv`), allow: { 'src/core/catalog.js': 1 },
    why: 'catalog.js files each regional quest under the highest milestone at or below its recommended level (placement)' },
  '"g22:0" read as a gate (a write, as in a migration, is not)': { re: /checks\s*\[\s*["'`]g22:0["'`]\s*\](?!\s*=(?!=))/g, allow: {} },
  'unlock level by hand (rqOpenLv)': { re: /\brqOpenLv\b/g, allow: {} },
  'Daevanion window by level (level < 12)': { re: /level\s*<\s*12\b/g, allow: {} },
};

export default (test, M) => {
  const src = Object.fromEntries(FILES.map(f => [f, readFileSync(join(ROOT, f), 'utf8')]));
  test('§8 source check: no gate decided outside the evaluator (patterns and their allowances)', () => {
    const bad = [];
    for (const [name, { re, allow }] of Object.entries(PATTERNS)) for (const f of FILES) {
      const lines = src[f].split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => l.match(re));
      const n = lines.reduce((t, [, l]) => t + l.match(re).length, 0), want = allow[f] || 0;
      if (n !== want) bad.push(`${name}: ${f} has ${n}, allowed ${want}${lines.length ? ' · ' + lines.slice(0, 3).map(([i, l]) => `${i}: ${l.trim().slice(0, 100)}`).join(' | ') : ''}`);
    }
    assert.deepEqual(bad, []);
  });
  test('§8 source check: the evaluator is imported by requirements.js only (the one place the page asks it)', () => {
    const importers = FILES.filter(f => /from\s+["'][^"']*evaluator\.js["']/.test(src[f]));
    assert.deepEqual(importers, ['src/core/requirements.js']);
    assert.deepEqual(FILES.filter(f => /from\s+["'][^"']*gate-graph\.js["']/.test(src[f])), ['src/core/requirements.js'], 'GATE_GRAPH: the evaluator and requirements.js only');
  });
  test('§8 source check: the kept 0.2 rules are exactly the named list (each in the PR body and tests/equiv)', () => {
    assert.deepEqual(Object.keys(M.KEPT_RULES), ['stronghold-band', 'stigma-slot-1-after-g22:0', 'stigma-equip-after-g22:0', 'stigma-rotation-slot-level', 'story-card-recommended-level']);
    for (const r of Object.keys(M.KEPT_RULES)) assert.ok(src['src/core/requirements.js'].split(`"${r}"`).length >= 3, `${r}: named where it is applied, not only in the list`);
  });
};
