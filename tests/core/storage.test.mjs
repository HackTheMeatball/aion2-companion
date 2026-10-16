/* The storage interface (0.4 P3b, src/core/storage.js): memoryStorage() as Node tests use it, and the browser adapter
   (src/shell/storage-web.js) as the only place in src/ that touches localStorage. */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '../../src');
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'`])\/\/.*$/gm, '$1');
const walk = d => readdirSync(d).flatMap(f => statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]);

export default (test, M) => {
  test('memoryStorage: get / set / remove; a missing key reads as null', () => {
    const s = M.memoryStorage();
    assert.equal(s.get('k'), null);
    assert.equal(s.set('k', '{"level":3}'), true);
    assert.equal(s.get('k'), '{"level":3}');
    assert.equal(s.set('k', '{"level":4}'), true, 'overwrite');
    assert.equal(s.get('k'), '{"level":4}');
    assert.equal(s.set('k:before-import', 'x'), true);
    s.remove('k');
    assert.equal(s.get('k'), null);
    assert.equal(s.get('k:before-import'), 'x', 'remove touches only its key');
    s.remove('absent');
  });
  test('memoryStorage: set returns false when full and keeps the old text', () => {
    const s = M.memoryStorage(10);
    assert.equal(s.set('k', '12345'), true);         /* 1 + 5 = 6 */
    assert.equal(s.set('k', '123456789'), true);     /* 1 + 9 = 10: replacing frees the old text first */
    assert.equal(s.set('j', '1'), false, 'over the quota');
    assert.equal(s.get('j'), null);
    assert.equal(s.set('k', '1234567890'), false);
    assert.equal(s.get('k'), '123456789', 'a failed set changes nothing');
    s.remove('k');
    assert.equal(s.set('j', '1'), true, 'room again after remove');
  });
  test('only src/shell/storage-web.js touches localStorage (comments aside)', () => {
    const bad = walk(SRC).filter(f => f.endsWith('.js') && /\blocalStorage\b/.test(code(readFileSync(f, 'utf8')))).map(f => relative(SRC, f));
    assert.deepEqual(bad, ['shell/storage-web.js']);
  });
};
