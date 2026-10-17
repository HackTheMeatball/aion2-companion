/* The rules the engine is built on, checked on the source: src/core/ touches no browser API; every folder imports only
   what docs/design/0.4-engine-contract.md §1 allows it (0.4 P2b: the engine never imports a pack, src/data/ or main.js;
   a pack imports the engine and itself, never another pack); character data is read and written only through
   char(state) (src/core/state.js). */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '../../src');
const read = f => readFileSync(join(SRC, f), 'utf8');
/* code without comments (block comments, and line comments that aren't part of a URL) */
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'`])\/\/.*$/gm, '$1');
/* every .js file under a folder of src/ (paths relative to src/), [] when the folder doesn't exist yet */
const walk = d => !existsSync(join(SRC, d)) ? [] : readdirSync(join(SRC, d), { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(d + '/' + e.name) : e.name.endsWith('.js') ? [d + '/' + e.name] : []).sort();
const CORE = readdirSync(join(SRC, 'core')).filter(f => f.endsWith('.js')).map(f => 'core/' + f);
const PACKS = walk('packs');
const DATA = PACKS.filter(f => f.startsWith('packs/aion2/data/'));

/* ---------- The import rule (P0 §1) ---------- */
/* every module path a source imports or re-exports from (single- or multi-line), resolved to a path relative to src/ */
const importsOf = (f, s) => [...s.matchAll(/^\s*(?:import|export)\s[^;]*?\bfrom\s*["']([^"']+)["']|^\s*import\s*["']([^"']+)["']/gm)]
  .map(m => m[1] || m[2]).map(p => p.startsWith('.') ? posix.normalize(posix.join(posix.dirname(f), p)) : p);
/* the folder a src/ path belongs to: core, cards, shell, packs/<game>, data (pre-0.4), main.js, or the path itself */
const areaOf = p => { const m = /^(core|cards|shell|data)\//.exec(p) || /^(packs\/[\w-]+)\//.exec(p); return m ? m[1] : p; };
/* what each folder may import (P0 §1); a pack: the engine and itself */
const ALLOWED = { core: ['core'], cards: ['core', 'cards'], shell: ['core', 'shell'] };
const allowedFor = from => from.startsWith('packs/') ? ['core', 'cards', from] : ALLOWED[from];
/* imports that break the rule: ["file: path"] for files { path: source } */
const badImports = files => Object.entries(files).flatMap(([f, s]) => { const ok = allowedFor(areaOf(f));
  return importsOf(f, s).filter(p => !ok.includes(areaOf(p))).map(p => `${f}: ${p}`); });
export default (test, M) => {
  test('core: no DOM, storage, timers or other browser globals', () => {
    const BROWSER = /(?<![.\w$])(document|window|globalThis|self|localStorage|sessionStorage|navigator|location|history|requestAnimationFrame|setTimeout|setInterval|matchMedia|getComputedStyle|CSS|Event|CustomEvent|HTMLElement|Element|Node|ResizeObserver|MutationObserver|fetch|alert|confirm|Audio|AudioContext|performance|Date\.now|Math\.random)\b/;
    const bad = CORE.flatMap(f => code(read(f)).split('\n').map((l, i) => [f, i + 1, l]).filter(([, , l]) => BROWSER.test(l)).map(([f, n, l]) => `${f}:${n}: ${l.trim().slice(0, 100)}`));
    assert.deepEqual(bad, []);
  });
  test('import rule: src/core/ imports only src/core/ (never a pack, src/cards/, src/shell/, src/data/ or main.js)', () => {
    assert.deepEqual(badImports(Object.fromEntries(CORE.map(f => [f, read(f)]))), []);
  });
  test('import rule: src/cards/ imports only src/core/ and src/cards/; src/shell/ only src/core/ and src/shell/', () => {
    assert.deepEqual(badImports(Object.fromEntries([...walk('cards'), ...walk('shell')].map(f => [f, read(f)]))), []);
  });
  test('import rule: a pack imports the engine and itself (never another pack, src/shell/, src/data/ or main.js)', () => {
    assert.ok(PACKS.includes('packs/aion2/pack.js'), 'the AION 2 pack is in src/packs/aion2/');
    assert.deepEqual(badImports(Object.fromEntries(PACKS.map(f => [f, read(f)]))), []);
  });
  test('import rule: nothing is left in src/data/ (0.4 P2b moved it into src/packs/aion2/data/)', () => assert.deepEqual(walk('data'), []));
  /* negative controls: the same checker on planted imports (one per rule above) must report each of them */
  test('import rule: planted imports are caught (negative control)', () => {
    const planted = {
      'core/x.js': 'import { GATES } from "../packs/aion2/data/milestones.js";\nimport { a } from "../cards/a.js";\nimport { b } from "../shell/ids.js";\nimport {\n  c } from "../data/story.js";\nexport { d } from "../main.js";',
      'cards/y.js': 'import { e } from "../packs/aion2/pack.js";',
      'shell/z.js': 'import { f } from "../cards/a.js";',
      'packs/aion2/w.js': 'import { g } from "../other/pack.js";\nimport "../../main.js";\nimport { h } from "../../shell/ids.js";',
    };
    assert.deepEqual(badImports(planted), ['core/x.js: packs/aion2/data/milestones.js', 'core/x.js: cards/a.js', 'core/x.js: shell/ids.js', 'core/x.js: data/story.js',
      'core/x.js: main.js', 'cards/y.js: packs/aion2/pack.js', 'shell/z.js: cards/a.js', 'packs/aion2/w.js: packs/other/pack.js', 'packs/aion2/w.js: main.js', 'packs/aion2/w.js: shell/ids.js']);
    assert.deepEqual(badImports({ 'core/ok.js': 'import { x } from "./pack.js";', 'packs/aion2/ok.js': 'import { y } from "../../core/pack.js";\nimport { z } from "./data/build.js";' }), []);
  });
  /* ---------- The term scan (P0 §5, P8): no AION 2 term in the engine, engine cards or shell ---------- */
  test('no AION 2 term in src/core/, src/cards/, src/shell/ or main.js (code and comments)', () => {
    const TERMS = ['aion(?:[\\s-]?2)?', 'ncsoft', 'asmodians?', 'elyos', 'daeva',
      'assassin', 'gladiator', 'templar', 'ranger', 'sorcerer', 'spiritmaster', 'cleric', 'chanter',
      'daevanion', 'stigmas?', 'shards?', 'kibelisks?', 'cube', 'wisdom stones?', 'crystals?', 'kina', 'specialty', 'specialties', 'ascension', 'abyss', 'empyrean',
      'sealed dungeons?', 'hideouts?', 'strongholds?', 'expeditions?', 'regional',
      'altgard', 'ishalgen', 'asahr', 'nezekan', 'zikel', 'vaizel', 'triniel', 'azphel',
      'balaur', 'draconute', 'dratona', 'shugo',
      'metabot', 'thegameswiki', 'gaming\\.tools', 'th\\.gl',
      'kib', 'stig', 'eput', 'blv', ...Object.keys(M.aion2Pack.charFields)];
    /* a word not touching a letter, digit or _; or a quote, then a save-key prefix */
    const TERM = new RegExp(`(?<![A-Za-z0-9_])(?:${TERMS.join('|')})(?![A-Za-z0-9_])|["'\`](?:rq|sd|sh|dv|sp|g\\d+):`, 'gi');
    /* the only exceptions (P0 §5): the product name; the legal sentence; DOM / CSS names (class values, classList.*(),
       querySelector*(), closest(), getElementById() arguments) */
    const EXCEPT = [/Daeva Companion/g, /not affiliated with or endorsed by NCSoft/g, /\bclass(?:Name)?\s*=\s*(?:"[^"]*"|'[^']*')/g,
      /\b(?:classList\.\w+|querySelector(?:All)?|closest|getElementById)\([^)]*\)/g];
    const files = ['main.js', ...CORE, ...walk('cards'), ...walk('shell')];
    const bad = files.flatMap(f => read(f).split('\n').flatMap((l, i) => {
      const t = EXCEPT.reduce((x, r) => x.replace(r, m => ' '.repeat(m.length)), l);
      return [...new Set([...t.matchAll(TERM)].map(m => m[0].toLowerCase()))].map(w => `${f}:${i + 1}: ${w}`);
    }));
    if (bad.length) console.log(bad.join("\n")); assert.deepEqual(bad, [], `${bad.length} hits in ${files.length} files`);
    console.log(`  term scan: ${files.length} files, ${TERMS.length} term patterns, ${bad.length} hits`);
  });
  test('data modules never read the state', () => {
    const bad = DATA.filter(f => /\bstate\b|\bchar\(/.test(code(read(f))));
    assert.deepEqual(bad, []);
  });
  test('character data only through char(state): no state.<field> for a charFields() name (engine and pack fields)', () => {
    const F = M.charFields().join('|');
    const direct = new RegExp(`\\bstate\\s*(\\.\\s*(${F})\\b|\\[\\s*["'\`](${F})["'\`]\\s*\\])`);
    /* in the core and the pack, a function's save parameter is `s`, `save` or `state`: s.<field> is a direct read too
       (one-time flags are save data) */
    const directS = new RegExp(`\\b(s|save)\\.(${F})\\b`);
    const bad = ['main.js', 'site.js', ...CORE, ...walk('cards'), ...PACKS].flatMap(f => code(read(f)).split('\n').map((l, i) => [f, i + 1, l])
      .filter(([f, , l]) => direct.test(l) || (/^(core|packs)\//.test(f) && f !== 'core/state.js' && directS.test(l))).map(([f, n, l]) => `${f}:${n}: ${l.trim().slice(0, 120)}`));
    assert.deepEqual(bad, []);
  });
  test('charFields(): the engine fields plus the pack\'s, none twice', () => {
    const f = M.charFields();
    assert.deepEqual(f.slice(0, M.ENGINE_FIELDS.length), M.ENGINE_FIELDS);
    assert.deepEqual(f.slice(M.ENGINE_FIELDS.length), Object.keys(M.aion2Pack.charFields));
    assert.equal(new Set(f).size, f.length);
  });
  test('char(state) is the current slot of the save (save v5)', () => {
    const s = M.newSave({ id: 'slot-a' }); assert.equal(M.char(s), s.chars['slot-a']);
  });
  /* the label and the name may carry the player's name: never in a storage key, a file name, a URL or a log (P3c) */
  test('labelOf and the character name are used nowhere in src/ outside src/core/state.js', () => {
    const files = ['main.js', 'site.js', 'sw.js', ...CORE, ...walk('shell'), ...walk('cards'), ...PACKS];
    const bad = files.filter(f => f !== 'core/state.js').flatMap(f => code(read(f)).split('\n').map((l, i) => [f, i + 1, l])
      .filter(([, , l]) => /\blabelOf\b|char\([^)]*\)\.name\b|\bc\.name\b/.test(l)).map(([f, n, l]) => `${f}:${n}: ${l.trim().slice(0, 120)}`));
    assert.deepEqual(bad, []);
  });
  test('the storage key and the export file name carry no game, class or player name', () => {
    assert.equal(M.KEY, 'companion-save-v5');
    const main = code(read('main.js')), fname = /const fname = \(\) => `([^`]*)`/.exec(main);
    assert.ok(fname, 'the export file name is built in main.js as `const fname = () => `...``');
    assert.equal(fname[1], 'companion-save-${new Date().toISOString().slice(0, 10)}.json');
    for (const w of ['aion', 'assassin', 'asmodian', 'name', 'label', 'char(']) assert.ok(!M.KEY.toLowerCase().includes(w) && !fname[1].toLowerCase().includes(w), w);
  });
};
