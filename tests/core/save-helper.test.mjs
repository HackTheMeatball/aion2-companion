/* tests/support/save.js (0.4 P3a, v5 since P3c): the tests' one way to write and read saves. toStored() wraps a flat
   test state into a v5 save with one slot; fromStored() gives the flat state back. */
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const S = createRequire(import.meta.url)('../support/save.js');
const clone = o => JSON.parse(JSON.stringify(o));
const flatFiles = readdirSync(new URL('../fixtures/', import.meta.url)).filter(f => f.endsWith('.flat.json')).sort();

export default (test, M) => {
  test('save helper: SAVE_KEY is the key the build stores under (read from src/core/state.js)', () => assert.equal(S.SAVE_KEY, M.KEY));
  test('save helper: :before-import key follows SAVE_KEY', () => assert.equal(S.BEFORE_IMPORT_KEY, M.KEY + ':before-import'));
  const flats = [{}, { checks: { 'g6:0': true, 'rq:2202010': false }, level: 30, quest: 'Dying Light', mode: 'basic', open: { g27: true }, stLv: { "Triniel's Dagger": 4 }, qsub: { 'Dying Light': { 2: [0, 1] } }, started: { 'rq:2202017': 1 }, rotSeen: ['a:1:0'] },
    ...flatFiles.map(S.flatFixture)];
  test('save helper: toStored makes a v5 save that loads (one slot, the test slot current, pack and class set); input unchanged', () => {
    for (const f of flats) {
      const before = JSON.stringify(f), st = S.toStored(f), { state, hadSave } = M.loadState(JSON.stringify(st));
      assert.equal(JSON.stringify(f), before, 'toStored must not change its input');
      assert.ok(hadSave); assert.equal(st.v, 5); assert.deepEqual(Object.keys(st.chars), [S.TEST_SLOT]); assert.equal(st.current, S.TEST_SLOT);
      assert.deepEqual({ ...M.char(state), checks: undefined, level: undefined, quest: undefined, mt: undefined }, { ...M.char(state), id: S.TEST_SLOT, pack: M.PACK, class: M.CLASS, name: '', created: 0, checks: undefined, level: undefined, quest: undefined, mt: undefined });
      for (const k of Object.keys(st)) assert.ok(['v', 'current', 'chars'].includes(k) || !M.charFields().includes(k), k + ' is a character field at the top level');
    }
  });
  test('save helper: the retired one-time flags of pre-0.4 saves are left out', () => {
    const st = S.toStored({ checks: {}, level: 5, seedLv12: true, migV5: true, stampV1: true, schemaVersion: 1, backup1: true, mode: 'basic' });
    for (const f of S.RETIRED_FLAGS) assert.ok(!(f in st) && !(f in st.chars[S.TEST_SLOT]), f);
    assert.equal(st.mode, 'basic');
  });
  test('save helper: a flat state without mt gets every value stamped at 0, exactly as stamp(c, 0) in src/core/sync.js', () => {
    for (const f of flats) {
      const flat = clone(f); delete flat.mt;
      const c = S.toStored(flat).chars[S.TEST_SLOT], ref = clone(c); delete ref.mt; M.stamp(ref, 0);
      assert.deepEqual(c.mt, ref.mt);
    }
    const withMt = S.flatFixture(flatFiles[0]); assert.deepEqual(S.toStored(withMt).chars[S.TEST_SLOT].mt, withMt.mt, 'an mt that is there is kept');
  });
  test('save helper: fromStored(toStored(x)) gives x back (without retired flags); parseStored(null) is no save', () => {
    for (const f of flats) { const want = Object.fromEntries(Object.entries(f).filter(([k]) => !S.RETIRED_FLAGS.includes(k)));
      const back = S.parseStored(S.storedText(f)); delete back.mt; delete want.mt; assert.deepEqual(back, want); }
    assert.equal(S.storedText(null), null); assert.equal(S.parseStored(null), null);
  });
  test('save helper: the flat fixtures carry no backup times (per browser) and load at their level', () => {
    for (const f of flatFiles) {
      const s = S.flatFixture(f), { state, hadSave } = M.loadState(S.storedText(s));
      assert.ok(hadSave, f); assert.ok(!('backup' in s) && !('backup1' in s), f);
      assert.equal(M.char(state).level, s.level, f);
    }
  });
};
