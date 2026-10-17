/* Load-time steps on save v5 (0.4 P3c): the fresh start, the stigma pick pinning, the story-end move-on. The steps for
   pre-0.4 saves (migV5, the player seeds, eputSync1, g45Split1, stampV1, backup1) are gone with the clean break: no
   pre-0.4 save is ever read again, so their cases were removed with them. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { toStored } = createRequire(import.meta.url)('../support/save.js');

const clone = o => JSON.parse(JSON.stringify(o));
/* run the load steps on a v5 save made from a flat test state; returns the state and what each write stored */
const run = (M, flat, now = 0) => { const state = toStored(flat), writes = []; M.migrate(state, true, () => writes.push(clone(state)), now); return { state, writes }; };
const NOW = 1760000000;   /* seconds, as main.js passes it */

export default (test, M) => {
  const C = M.char;
  test('fresh start: Lv 1 on the first story quest, cleared milestones folded, backup.since, defaults stamped at 0; nothing written', () => {
    const { state, hadSave } = M.loadState(null, { now: NOW * 1000, newId: () => 'slot-new' }), writes = [];
    M.migrate(state, hadSave, () => writes.push(1), NOW);
    assert.deepEqual(writes, []);
    const q0 = M.QUESTS[0][1];
    assert.equal(q0, 'A Village in the Fog');
    assert.deepEqual(state, { v: 5, current: 'slot-new', hide: false, open: {}, hideCards: true, backup: { since: NOW * 1000 },
      chars: { 'slot-new': { id: 'slot-new', pack: M.PACK, class: M.CLASS, name: '', created: NOW * 1000, checks: {}, level: 1, quest: q0, mt: { level: [0, 1], quest: [0, [q0, null]] } } } });
  });
  test('a stored save is never re-defaulted: its level, quest, filters and backup stay', () => {
    for (const flat of [{ checks: {}, level: 5, quest: '' }, { checks: {}, level: 23, quest: M.QUESTS[10][1], hideCards: false }, { checks: { 'g6:0': true }, level: 1, quest: '', backup: { lastExportAt: 9 } }]) {
      const { state, writes } = run(M, flat, NOW);
      assert.equal(C(state).level, flat.level); assert.equal(C(state).quest, flat.quest); assert.equal(state.hideCards, flat.hideCards); assert.deepEqual(state.backup, flat.backup);
      assert.deepEqual(writes, []); assert.deepEqual(state, toStored(flat), 'nothing changed');
    }
  });
  test('no one-time flags are added and the player seeds never run (a Lv 5 save stays Lv 5 with no skill ticks)', () => {
    const { state } = run(M, { checks: {}, level: 5, quest: '' });
    for (const f of ['seedLv12', 'stTriniel1', 'dvReset1', 'migV5', 'eputSync1', 'g45Split1', 'stampV1', 'schemaVersion', 'backup1']) assert.ok(!(f in state) && !(f in C(state)), f);
    assert.equal(C(state).level, 5); assert.deepEqual(C(state).checks, {}); assert.equal(C(state).stones, undefined);
  });
  test('stigma pick: an equipped slot keeps the stigma it was equipped with; written with the next save', () => {
    const slot1 = M.GATES.flatMap(g => g.items).find(it => it.stig === 1);
    const { state, writes } = run(M, { checks: { [slot1.k]: true }, level: 22, quest: '' });
    assert.deepEqual(C(state).stPick, { 1: M.STIGMA_PLAN[0] }); assert.deepEqual(writes, []);
    const kept = run(M, { checks: { [slot1.k]: true }, level: 22, quest: '', stPick: { 1: 'Something else' } });
    assert.deepEqual(C(kept.state).stPick, { 1: 'Something else' });
  });
  test('story end: once later quests exist, "Turned in" on the old last quest moves on to the next', () => {
    const q = M.QUESTS[3][1], { state, writes } = run(M, { checks: {}, level: 5, quest: q, storyEnd: q });
    assert.equal(C(state).quest, M.QUESTS[4][1]); assert.equal(C(state).storyEnd, undefined); assert.equal(writes.length, 1);
    const last = M.QUESTS[M.QUESTS.length - 1][1], end = run(M, { checks: {}, level: 45, quest: last, storyEnd: last });
    assert.equal(C(end.state).quest, last); assert.equal(C(end.state).storyEnd, last); assert.deepEqual(end.writes, []);
    /* 0.3 E10: the data used to end at Forgotten Commander; such a save moves on to Daeva Trapped in a Nightmare */
    const fc = run(M, { checks: {}, level: 45, quest: 'Forgotten Commander', storyEnd: 'Forgotten Commander' });
    assert.equal(C(fc.state).quest, 'Daeva Trapped in a Nightmare'); assert.equal(C(fc.state).storyEnd, undefined); assert.equal(fc.writes.length, 1);
  });
  test('the steps touch only the current slot', () => {
    const q = M.QUESTS[3][1], s = toStored({ checks: {}, level: 5, quest: '' });
    s.chars.other = { ...clone(M.char(s)), id: 'other', quest: q, storyEnd: q };
    const before = clone(s.chars.other); M.migrate(s, true, () => {}, 0);
    assert.deepEqual(s.chars.other, before);
  });
  test('idempotent: a second load changes and writes nothing', () => {
    for (const flat of [{ checks: {}, level: 5, quest: M.QUESTS[3][1], storyEnd: M.QUESTS[3][1] }, { checks: { 'g22:1': true }, level: 22, quest: '' }]) {
      const once = run(M, flat).state, again = clone(once), writes = [];
      M.migrate(again, true, () => writes.push(1), NOW); assert.deepEqual(again, once); assert.deepEqual(writes, []);
    }
  });
  test('owner save 2026-10-14 (Lv 39) as a v5 save: Next up ranks in Basic and Advanced without throwing', () => {
    const { state } = run(M, JSON.parse(JSON.stringify(createRequire(import.meta.url)('../fixtures/fixture-user-2026-10-14-lv39.json'))));
    for (const basic of [true, false]) assert.ok(Array.isArray(M.rankNext(state, { basic })), `basic=${basic}`);
  });
};
