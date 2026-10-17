/* The AION 2 term scan over the engine (docs/design/0.4-engine-contract.md §5, 0.4 P2b): src/core/, code and comments,
   names no AION 2 term. Case-insensitive; a match must not touch a letter, digit or _ on either side (a hyphen or a slash
   is a boundary). Since 0.4 P2c (Next up producers in the pack) no file has an exception. Since 0.4 P5c src/cards/journey.js too. P8 widens the scan to src/cards/, src/shell/ and main.js. */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '../../src');
/* P0 §5, group by group */
const TERMS = [
  String.raw`aion(?:[\s-]?2)?`, 'ncsoft', 'asmodians?', 'elyos', 'daeva',
  'assassin', 'gladiator', 'templar', 'ranger', 'sorcerer', 'spiritmaster', 'cleric', 'chanter',
  'daevanion', 'stigmas?', 'shards?', 'kibelisks?', 'cube', 'wisdom stones?', 'crystals?', 'kina', 'specialty', 'specialties', 'ascension', 'abyss', 'empyrean',
  'sealed dungeons?', 'hideouts?', 'strongholds?', 'expeditions?', 'regional',
  'altgard', 'ishalgen', 'asahr', 'nezekan', 'zikel', 'vaizel', 'triniel', 'azphel',
  'balaur', 'draconute', 'dratona', 'shugo',
  'metabot', 'thegameswiki', String.raw`gaming\.tools`, String.raw`th\.gl`,
  'kib', 'stig', 'eput', 'blv',
];
/* a save key in a string: a quote, then rq: / sd: / sh: / dv: / sp: / gN: */
const SAVE_KEY = /["'`](?:rq|sd|sh|dv|sp|g\d+):/;
/* allowed (P0 §5 exception 1): the product name */
const PRODUCT = /Daeva Companion/g;
const termRe = fields => new RegExp(`(?<![A-Za-z0-9_])(?:${[...TERMS, ...fields].join('|')})(?![A-Za-z0-9_])`, 'i');
/* ["file:line: text"] for every line of { file: source } with a term */
const hitsOf = (files, fields) => { const re = termRe(fields);
  return Object.entries(files).flatMap(([f, s]) => s.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => { const x = l.replace(PRODUCT, ''); return re.test(x) || SAVE_KEY.test(x); })
    .map(([n, l]) => `${f}:${n}: ${l.trim().slice(0, 120)}`)); };

export default (test, M) => {
  /* the pack's own field names count as terms (P0 §5 "Pack field names") */
  const fields = Object.keys(M.aion2Pack.charFields);
  const core = Object.fromEntries(readdirSync(join(SRC, 'core')).filter(f => f.endsWith('.js')).sort().map(f => ['core/' + f, readFileSync(join(SRC, 'core', f), 'utf8')]));
  test('term scan: src/core/ names no AION 2 term (code and comments)', () => {
    assert.deepEqual(hitsOf(core, fields), []);
  });
  /* the engine cards done so far (0.4 P5b, P5c); P8 scans all of src/cards/ */
  const cards = Object.fromEntries(['milestones.js', 'route.js', 'journey.js'].map(f => ['cards/' + f, readFileSync(join(SRC, 'cards', f), 'utf8')]));
  test('term scan: the milestone, Route rules and Journey cards name no AION 2 term (code and comments)', () => {
    assert.deepEqual(hitsOf(cards, fields), []);
  });
  test('term scan: planted terms are caught, the product name and neutral words are not (negative control)', () => {
    const planted = { a: '/* Sealed Dungeons */', b: 'const k = "rq:" + id;', c: 'x.stLv[n]', d: 'see src/packs/aion2/rules.js', e: 'it.eput === n', f: 'ascension', g: 'stigma-slot' };
    assert.deepEqual(hitsOf(planted, fields).map(h => h.split(':')[0]), Object.keys(planted));
    assert.deepEqual(hitsOf({ ok: '/* Daeva Companion: quest, story, level, skill, board, milestone, dungeon, route; { rq: 1 }; daevacompanion.com */' }, fields), []);
  });
};
