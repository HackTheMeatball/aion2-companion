/* The saved state (save v5, 0.4 P3c): key, shape, char(), labelOf, loading, the import check. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const { V4_KEY, storedText, TEST_SLOT } = createRequire(import.meta.url)('../support/save.js');
const json = p => JSON.parse(readFileSync(new URL('../../' + p, import.meta.url), 'utf8'));

export default (test, M) => {
  const ids = () => { let n = 0; return () => `slot-${++n}`; };
  test('storage key: companion-save-v5, not the v4 key, no game, class or player name in it', () => {
    assert.equal(M.KEY, 'companion-save-v5'); assert.notEqual(M.KEY, V4_KEY); assert.equal(M.SAVE_V, 5);
  });
  test('pack and class ids are the guide pack\'s and its class\'s (data/packs)', () => {
    assert.equal(M.PACK, json('data/packs/aion2/asmodian/assassin/pack.json').id);
    assert.ok(json('data/packs/aion2/asmodian/assassin/pack.json').uses.includes('aion2/classes/' + M.CLASS));
    assert.equal(M.CLASS, json('data/packs/aion2/classes/assassin/class.json').class);
  });
  test('new save: v 5, one slot (current), the character\'s identity, the defaults; the id from newId', () => {
    const s = M.newSave({ now: 1234, id: 'slot-a' });
    assert.deepEqual(s, { v: 5, current: 'slot-a', chars: { 'slot-a': { id: 'slot-a', pack: M.PACK, class: M.CLASS, name: '', created: 1234, checks: {}, level: 5, quest: '' } }, hide: false, open: {} });
    assert.throws(() => M.newSave({}), /slot id/);
  });
  test('char(state) is state.chars[state.current]', () => {
    const s = M.newSave({ id: 'a' }); s.chars.b = { ...M.newChar({ id: 'b' }), level: 30 };
    assert.equal(M.char(s), s.chars.a); s.current = 'b'; assert.equal(M.char(s), s.chars.b); assert.equal(M.char(s).level, 30);
  });
  test('labelOf: <name>-<class>-lvl<level>; the name part left out while empty; never stored', () => {
    const c = M.newChar({ id: 'x' }); c.level = 30;
    assert.equal(M.labelOf(c), 'assassin-lvl30');
    assert.equal(M.labelOf({ ...c, name: 'Zed' }), 'Zed-assassin-lvl30');
    assert.ok(!Object.values(c).includes('assassin-lvl30') && !('label' in c));
  });
  test('Level up changes the label, never the slot id', () => {
    const s = M.newSave({ id: 'slot-a' }), c = M.char(s), before = M.labelOf(c);
    c.level += 1; assert.notEqual(M.labelOf(c), before); assert.equal(c.id, 'slot-a'); assert.equal(s.current, 'slot-a');
  });
  test('load: no save → a new save from newId (called once), hadSave false', () => {
    const r = M.loadState(null, { now: 5, newId: ids() });
    assert.equal(r.hadSave, false); assert.deepEqual(r.state, M.newSave({ now: 5, id: 'slot-1' }));
  });
  test('load: a v5 save is laid over the defaults (view and character); newId is not called', () => {
    const raw = JSON.stringify({ v: 5, current: 'k', chars: { k: { id: 'k', pack: M.PACK, class: M.CLASS, name: '', created: 1, level: 30, checks: { 'g6:0': true } } }, mode: 'basic' });
    const r = M.loadState(raw, { newId: () => { throw new Error('called'); } });
    assert.equal(r.hadSave, true);
    assert.deepEqual(r.state, { hide: false, open: {}, v: 5, current: 'k', chars: { k: { checks: { 'g6:0': true }, level: 30, quest: '', id: 'k', pack: M.PACK, class: M.CLASS, name: '', created: 1 } }, mode: 'basic' });
  });
  test('load: anything that isn\'t a v5 save starts fresh (v4 shape, wrong v, no current slot, unreadable text)', () => {
    const v4 = JSON.stringify({ checks: { 'g6:0': true }, level: 30, quest: 'Dying Light', seedLv12: true, migV5: true });
    for (const raw of [v4, '{}', '[]', 'null', '{nope', '7', JSON.stringify({ v: 4, current: 'a', chars: { a: {} } }), JSON.stringify({ v: 5, current: 'b', chars: { a: {} } }), JSON.stringify({ v: 5, current: 'a', chars: { a: 3 } })]) {
      const r = M.loadState(raw, { newId: () => 'fresh' });
      assert.equal(r.hadSave, false, raw); assert.deepEqual(r.state, M.newSave({ id: 'fresh' }), raw);
    }
  });
  test('load: a slot that isn\'t an object is dropped; the others load', () => {
    const r = M.loadState(JSON.stringify({ v: 5, current: 'a', chars: { a: { id: 'a', level: 3 }, b: 'x' } }));
    assert.deepEqual(Object.keys(r.state.chars), ['a']);
  });
  test('the tests\' v5 saves (toStored) load as saves with the test slot current', () => {
    const r = M.loadState(storedText({ checks: { 'g6:0': true }, level: 20, quest: '', mode: 'basic' }));
    assert.equal(r.hadSave, true); assert.equal(r.state.current, TEST_SLOT); assert.equal(M.char(r.state).level, 20); assert.equal(r.state.mode, 'basic');
  });
  test('import: parseExport accepts a v5 export only (a v4 export, other JSON and non-JSON give null)', () => {
    const v5 = storedText({ checks: { 'g6:0': true }, level: 20, quest: '' });
    assert.deepEqual(M.parseExport(v5), JSON.parse(v5));
    for (const raw of [JSON.stringify({ checks: { 'g6:0': true }, level: 20 }), '{}', 'not json', '', JSON.stringify({ v: 5, chars: {} })]) assert.equal(M.parseExport(raw), null, raw);
  });
  test('CHAR_FIELDS: the character fields, none of them a view setting; CHAR_META the identity', () => {
    for (const f of ['checks', 'level', 'quest', 'storyEnd', 'qsteps', 'qsub', 'started', 'areaRun', 'rqSnooze', 'stLv', 'stShards', 'stPick', 'stones', 'pendSt', 'pendCr', 'dvTotal', 'dvCost', 'dvAdj', 'mt'])
      assert.ok(M.CHAR_FIELDS.includes(f), f);
    for (const f of ['mode', 'open', 'hide', 'hideCards', 'hideOpt', 'areaLv', 'showObj', 'showTalk', 'backup', 'v', 'current', 'chars', 'savedAt'])
      assert.ok(!M.CHAR_FIELDS.includes(f), f);
    assert.deepEqual(M.CHAR_META, ['id', 'pack', 'class', 'name', 'created']);
  });
};
