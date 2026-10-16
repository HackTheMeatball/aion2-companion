/* tests/support/save.js (0.4 P3a): the tests' one way to write and read saves. Today toStored() is the identity for the
   flat shape (character fields at the top level), so the stored text is exactly what the suites wrote before. */
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const S = createRequire(import.meta.url)('../support/save.js');

export default (test, M) => {
  test('save helper: SAVE_KEY is the key the build stores under (read from src/core/state.js)', () => assert.equal(S.SAVE_KEY, M.KEY));
  test('save helper: :before-import key follows SAVE_KEY', () => assert.equal(S.BEFORE_IMPORT_KEY, M.KEY + ':before-import'));
  const flats = [{}, M.DEFAULT(), { checks: { 'g6:0': true, 'rq:2202010': false }, level: 30, quest: 'Dying Light', mode: 'basic', open: { g27: true }, seedLv12: true, migV5: true, stLv: { "Triniel's Dagger": 4 }, qsub: { 'Dying Light': { 2: [0, 1] } } },
    ...readdirSync(new URL('../fixtures/', import.meta.url)).filter(f => f.endsWith('.flat.json')).sort().map(S.flatFixture)];
  test('save helper: toStored is the identity for today\'s flat shape (same object, same text)', () => {
    for (const f of flats) { const before = JSON.stringify(f); assert.equal(S.toStored(f), f); assert.equal(JSON.stringify(f), before, 'toStored must not change its input'); assert.equal(S.storedText(f), before); }
  });
  test('save helper: fromStored(toStored(x)) gives x back; parseStored(null) is no save', () => {
    for (const f of flats) assert.deepEqual(S.parseStored(S.storedText(f)), f);
    assert.equal(S.storedText(null), null); assert.equal(S.parseStored(null), null);
  });
  test('save helper: the flat fixtures load as saves with today\'s fields (no old-shape keys left to migrate)', () => {
    for (const f of readdirSync(new URL('../fixtures/', import.meta.url)).filter(f => f.endsWith('.flat.json'))) {
      const s = S.flatFixture(f), { state, hadSave } = M.loadState(S.storedText(s));
      assert.ok(hadSave && s.migV5 === true && s.stampV1 === true && s.schemaVersion === 1, f);
      assert.ok(!('backup' in s) && !('backup1' in s), f + ': backup times are per browser and left out');
      assert.equal(M.char(state).level, s.level, f);
    }
  });
};
