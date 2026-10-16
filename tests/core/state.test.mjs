/* The saved state: key, defaults, loading. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { V4_KEY } = createRequire(import.meta.url)('../support/save.js');

export default (test, M) => {
  test('storage key is the v4 key (V4_KEY in tests/support/save.js; never changes)', () => assert.equal(M.KEY, V4_KEY));
  test('defaults: Lv 5, no ticks, no quest', () => assert.deepEqual(M.DEFAULT(), { checks: {}, level: 5, hide: false, open: {}, quest: '' }));
  test('DEFAULT() returns a fresh object each time', () => { const a = M.DEFAULT(); a.checks.x = true; assert.deepEqual(M.DEFAULT().checks, {}); });
  test('load: no save → defaults, hadSave false', () => { const r = M.loadState(null); assert.equal(r.hadSave, false); assert.deepEqual(r.state, M.DEFAULT()); });
  test('load: a save is merged over the defaults', () => {
    const r = M.loadState(JSON.stringify({ level: 30, checks: { 'g6:0': true }, mode: 'basic' }));
    assert.equal(r.hadSave, true); assert.deepEqual(r.state, { checks: { 'g6:0': true }, level: 30, hide: false, open: {}, quest: '', mode: 'basic' });
  });
  test('load: unreadable text → defaults, hadSave false', () => { const r = M.loadState('{nope'); assert.equal(r.hadSave, false); assert.deepEqual(r.state, M.DEFAULT()); });
  test('load: "{}" counts as a save (the one-time seeds then run, as before)', () => assert.equal(M.loadState('{}').hadSave, true));
  test('CHAR_FIELDS: the character fields, none of them a view setting or one-time flag', () => {
    for (const f of ['checks', 'level', 'quest', 'storyEnd', 'qsteps', 'qsub', 'started', 'areaRun', 'rqSnooze', 'stLv', 'stShards', 'stPick', 'stones', 'pendSt', 'pendCr', 'dvTotal', 'dvCost', 'dvAdj'])
      assert.ok(M.CHAR_FIELDS.includes(f), f);
    for (const f of ['mode', 'open', 'hide', 'hideCards', 'hideOpt', 'areaLv', 'showObj', 'showTalk', 'seedLv12', 'migV5', 'eputSync1'])
      assert.ok(!M.CHAR_FIELDS.includes(f), f);
  });
};
