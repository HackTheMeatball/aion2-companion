/* Load-time steps: additive, idempotent, behind their flags, writing the save exactly where they always did. */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const FIX = join(dirname(fileURLToPath(import.meta.url)), '../fixtures');
const fixture = f => JSON.parse(readFileSync(join(FIX, f), 'utf8'));
const clone = o => JSON.parse(JSON.stringify(o));
const FLAGS = { seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true };
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
    assert.deepEqual({ ...state, checks: undefined }, { ...M.DEFAULT(), checks: undefined, hideCards: true, ...FLAGS });
    assert.deepEqual(C(state).checks, {});
  });
  for (const f of ['fixture-v285.json', 'fixture-user-v285.json']) {
    const saved = fixture(f);
    test(`${f}: only adds (every old value kept)`, () => assert.deepEqual(kept(saved, run(M, saved).state), []));
    test(`${f}: E1 copies each old position key to its rq: / sd: key`, () => {
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
