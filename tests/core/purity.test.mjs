/* The rules the core is built on, checked on the source: src/core/ touches no browser API and imports only data modules
   and other core modules; character data is read and written only through char(state) (src/core/state.js). */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '../../src');
const read = f => readFileSync(join(SRC, f), 'utf8');
/* code without comments (block comments, and line comments that aren't part of a URL) */
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'`])\/\/.*$/gm, '$1');
const CORE = readdirSync(join(SRC, 'core')).filter(f => f.endsWith('.js')).map(f => 'core/' + f);
const DATA = readdirSync(join(SRC, 'data')).filter(f => f.endsWith('.js')).map(f => 'data/' + f);

export default (test, M) => {
  test('core: no DOM, storage, timers or other browser globals', () => {
    const BROWSER = /(?<![.\w$])(document|window|globalThis|self|localStorage|sessionStorage|navigator|location|history|requestAnimationFrame|setTimeout|setInterval|matchMedia|getComputedStyle|CSS|Event|CustomEvent|HTMLElement|Element|Node|ResizeObserver|MutationObserver|fetch|alert|confirm|Audio|AudioContext|performance|Date\.now|Math\.random)\b/;
    const bad = CORE.flatMap(f => code(read(f)).split('\n').map((l, i) => [f, i + 1, l]).filter(([, , l]) => BROWSER.test(l)).map(([f, n, l]) => `${f}:${n}: ${l.trim().slice(0, 100)}`));
    assert.deepEqual(bad, []);
  });
  test('core: imports only data modules and other core modules (never main.js)', () => {
    const bad = CORE.flatMap(f => [...read(f).matchAll(/^import .* from "([^"]+)";$/gm)].map(m => m[1]).filter(p => !/^\.\.\/data\/[\w-]+\.js$|^\.\/[\w-]+\.js$/.test(p)).map(p => `${f}: ${p}`));
    assert.deepEqual(bad, []);
  });
  test('data modules never read the state', () => {
    const bad = DATA.filter(f => /\bstate\b|\bchar\(/.test(code(read(f))));
    assert.deepEqual(bad, []);
  });
  test('character data only through char(state): no state.<field> for a CHAR_FIELDS name', () => {
    const F = M.CHAR_FIELDS.join('|');
    const direct = new RegExp(`\\bstate\\s*(\\.\\s*(${F})\\b|\\[\\s*["'\`](${F})["'\`]\\s*\\])`);
    /* in the core, a function's save parameter is `s` or `state`: s.<field> is a direct read too (one-time flags are save data) */
    const directS = new RegExp(`\\bs\\.(${F})\\b`);
    const bad = ['main.js', 'site.js', ...CORE].flatMap(f => code(read(f)).split('\n').map((l, i) => [f, i + 1, l])
      .filter(([f, , l]) => direct.test(l) || (f.startsWith('core/') && f !== 'core/state.js' && directS.test(l))).map(([f, n, l]) => `${f}:${n}: ${l.trim().slice(0, 120)}`));
    assert.deepEqual(bad, []);
  });
  test('char(state) is the current slot of the save (save v5)', () => {
    const s = M.newSave({ id: 'slot-a' }); assert.equal(M.char(s), s.chars['slot-a']);
  });
  /* the label and the name may carry the player's name: never in a storage key, a file name, a URL or a log (P3c) */
  test('labelOf and the character name are used nowhere in src/ outside src/core/state.js', () => {
    const files = ['main.js', 'site.js', 'sw.js', ...CORE, ...readdirSync(join(SRC, 'shell')).filter(f => f.endsWith('.js')).map(f => 'shell/' + f)];
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
