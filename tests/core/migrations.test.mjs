/* Load-time steps: additive, idempotent, behind their flags, writing the save exactly where they always did. */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const FIX = join(dirname(fileURLToPath(import.meta.url)), '../fixtures');
const fixture = f => JSON.parse(readFileSync(join(FIX, f), 'utf8'));
const clone = o => JSON.parse(JSON.stringify(o));
const FLAGS = { seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true };
const STAMP = { stampV1: true, schemaVersion: 1 };   /* 5c: set on load, written with the next save */
/* run the load steps; returns the state and what each write stored */
const run = (M, saved, hadSave = true) => { const state = clone(saved), writes = []; M.migrate(state, hadSave, () => writes.push(clone(state))); return { state, writes }; };
/* every value of `before` is still in `after` (migrations only add) */
const kept = (before, after, path = '') => Object.entries(before).flatMap(([k, v]) =>
  v && typeof v === 'object' && !Array.isArray(v) ? (after[k] && typeof after[k] === 'object' ? kept(v, after[k], path + k + '.') : [path + k])
    : JSON.stringify(after[k]) === JSON.stringify(v) ? [] : [path + k]);

export default (test, M) => {
  const C = M.char;
  test('fresh browser: seeds marked done without running, cleared milestones folded, nothing written', () => {
    const { state, writes } = run(M, M.DEFAULT(), false);
    assert.deepEqual(writes, []);
    /* 0.2.1 (owner, 2026-10-15): a fresh browser starts at Lv 1 on the first story quest.
       5c: stampV1 also runs (schemaVersion 1; the defaults stamped at time 0; merge() breaks time-0 quest ties by story
       position, so the default first quest never outranks another device's progress: sync.test.mjs) */
    const q0 = M.QUESTS[0][1];
    assert.equal(q0, 'A Village in the Fog');
    assert.deepEqual({ ...state, checks: undefined }, { ...M.DEFAULT(), checks: undefined, level: 1, quest: q0, hideCards: true, ...FLAGS, ...STAMP, mt: { level: [0, 1], quest: [0, [q0, null]] } });
    assert.deepEqual(C(state).checks, {});
  });
  test('a stored save without level or quest is not re-defaulted (loadState + migrate)', () => {
    for (const raw of ['{}', '{"checks":{}}', JSON.stringify({ ...FLAGS, checks: {} })]) {
      const { state, hadSave } = M.loadState(raw); assert.equal(hadSave, true, raw);
      const { state: s2 } = run(M, state, hadSave);
      assert.equal(C(s2).quest, '', raw); assert.equal(C(s2).level, JSON.parse(raw).seedLv12 ? 5 : 12, raw);   /* DEFAULT() Lv 5; the old Lv 12 seed runs on flagless saves */
    }
  });
  test('saved progress keeps its level and quest (fresh-browser defaults never apply to a save)', () => {
    for (const saved of [{ checks: {}, level: 5, quest: '' }, { ...FLAGS, checks: {}, level: 5, quest: '' }, { ...FLAGS, checks: {}, level: 23, quest: M.QUESTS[10][1] }]) {
      const { state } = run(M, Object.assign(M.DEFAULT(), clone(saved)), true);
      assert.equal(C(state).quest, saved.quest);
      assert.equal(C(state).level, saved.seedLv12 ? saved.level : Math.max(saved.level, 12));   /* the old Lv 12 seed still runs on flagless saves */
    }
  });
  for (const f of ['fixture-v285.json', 'fixture-user-v285.json', 'fixture-user-2026-10-14-lv39.json']) {
    const saved = fixture(f);
    test(`${f}: only adds (every old value kept)`, () => assert.deepEqual(kept(saved, run(M, saved).state), []));
    if (!saved.migV5) test(`${f}: E1 copies each old position key to its rq: / sd: key`, () => {
      const { state } = run(M, saved);
      for (const fld of ['checks', 'started', 'areaRun']) for (const [a, b] of Object.entries(M.MIG_V5))
        if (saved[fld] && a in saved[fld] && !(b in saved[fld])) assert.deepEqual(C(state)[fld][b], saved[fld][a], `${fld} ${a} → ${b}`);
      assert.equal(state.migV5, true);
    });
    test(`${f}: idempotent (a second load changes and writes nothing)`, () => {
      const once = run(M, saved).state, twice = run(M, once);
      assert.deepEqual(twice.state, once); assert.deepEqual(twice.writes, []);
    });
  }
  test('owner save 2026-10-14 (Lv 39, current build): loads with only the 5c stamps added (all at time 0) and writes nothing', () => {
    const saved = fixture('fixture-user-2026-10-14-lv39.json'), { state, writes } = run(M, saved);
    assert.deepEqual(writes, []);
    const { mt, ...rest } = state; assert.deepEqual(rest, { ...saved, ...STAMP });
    const stamps = JSON.stringify(mt).match(/\[\d+,/g); assert.ok(stamps.length > 300 && stamps.every(x => x === '[0,'), 'every stamp at time 0');
    assert.deepEqual(M.merge(state, saved).checks, saved.checks);
  });
  test('owner save 2026-10-14: Next up ranks in Basic and Advanced without throwing', () => {
    const { state } = run(M, fixture('fixture-user-2026-10-14-lv39.json'));
    for (const basic of [true, false]) assert.ok(Array.isArray(M.rankNext(state, { basic })) , `basic=${basic}`);
  });
  test('pre-seed save: every one-time step runs, in order, each writing once', () => {
    const { state, writes } = run(M, { checks: {}, level: 5 });
    assert.deepEqual(writes.map(w => Object.keys(FLAGS).filter(k => w[k])), [['migV5'], ['seedLv12', 'migV5'], ['seedLv12', 'stTriniel1', 'migV5'],
      ['seedLv12', 'stTriniel1', 'dvReset1', 'migV5'], ['seedLv12', 'stTriniel1', 'dvReset1', 'migV5', 'eputSync1']]);
    const c = C(state);
    assert.equal(c.level, 12); assert.equal(c.stones, 2);
    assert.equal(c.checks['sp:Ambush:5'], true); assert.equal(c.checks['sp:Ambush:6'], false);
    assert.equal(c.checks['g22:0'], true); assert.equal(c.checks['g22:1'], true);
    assert.deepEqual(c.stLv, { "Triniel's Dagger": 1 }); assert.deepEqual(c.stPick, { 1: M.STIGMA_PLAN[0] });
  });
  test('E4 sync: an equipped slot gets its "Put X on E" step ticked; the slot keeps its stigma', () => {
    const { state, writes } = run(M, { ...FLAGS, eputSync1: undefined, checks: { 'g27:0': true }, level: 27 });
    assert.equal(C(state).checks['g27:1'], true); assert.deepEqual(C(state).stPick, { 2: M.STIGMA_PLAN[1] }); assert.equal(writes.length, 1);
  });
  test('board reset (dvReset1) clears board data once and keeps everything else', () => {
    const { state } = run(M, { ...FLAGS, dvReset1: undefined, checks: { 'dv:hg': true, 'g6:0': true }, level: 20, dvTotal: 30, dvCost: { 'dv:hg': 3 } });
    assert.deepEqual(C(state).checks, { 'g6:0': true }); assert.equal(C(state).dvTotal, undefined); assert.equal(C(state).dvCost, undefined);
  });
  test('story end: once later quests exist, "Turned in" on the old last quest moves on to the next', () => {
    const q = M.QUESTS[3][1], { state, writes } = run(M, { ...FLAGS, checks: {}, level: 5, quest: q, storyEnd: q });
    assert.equal(C(state).quest, M.QUESTS[4][1]); assert.equal(C(state).storyEnd, undefined); assert.equal(writes.length, 1);
    const last = M.QUESTS[M.QUESTS.length - 1][1], end = run(M, { ...FLAGS, checks: {}, level: 45, quest: last, storyEnd: last });
    assert.equal(C(end.state).quest, last); assert.equal(C(end.state).storyEnd, last); assert.deepEqual(end.writes, []);
  });
};
