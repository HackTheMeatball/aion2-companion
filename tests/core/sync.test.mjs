/* 5c sync groundwork: per-item change times (stamp, the stampV1 step, the rollback re-stamp), merge(a, b), and the last
   confirmed location derived from the change times (docs/DATA-FORMAT-V2.md §9, §13). */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const FIX = join(dirname(fileURLToPath(import.meta.url)), '../fixtures');
const fixture = f => JSON.parse(readFileSync(join(FIX, f), 'utf8'));
const clone = o => JSON.parse(JSON.stringify(o));
const SEEDS = { seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true };
/* load as the page does: migrations (with the page's time) on a copy; returns the state and the writes */
const load = (M, saved, now, hadSave = true) => { const state = clone(saved), writes = []; M.migrate(state, hadSave, () => writes.push(clone(state)), now); return { state, writes }; };
/* a save as the page writes it: storeState() stamps with the time of the write */
const save = (M, state, sec) => { M.stampSave(state, sec * 1000); return clone(state); };

/* deterministic PRNG (mulberry32) */
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const VIEW = ['mode', 'open', 'hide', 'hideCards', 'hideOpt', 'areaLv', 'zoneOpen', 'showObj', 'showTalk', 'qsShowDone', 'trackOpen', 'trackLater', 'sound', 'dvAllOpen', 'areaDone', 'statOpen', 'areaSh', 'areasCollapsed'];
/* A device's save after a few sessions of random edits, each session saved at a time from a small range (so equal
   times and equal values happen and the tie-breaks are exercised). Some saves are never stamped (an old build). */
function genSave(M, seed) {
  const r = rng(seed), pick = a => a[Math.floor(r() * a.length)], C = M.char;
  const KEYS = ['g6:0', 'g22:0', 'g22:1', 'g32:dreams', 'build:0', 'sd:twisted-pit', 'sh:blades-temporary-outpost', ...M.RQ.slice(0, 6).map(q => 'rq:' + q.id)];
  const QS = ['Land of Rifts', 'Tangled Past'];
  const st = { checks: {}, level: 5, hide: false, open: {}, quest: '' };
  if (r() < 0.85) { M.migrate(st, true, () => {}, 0); }
  for (let session = 0, t = Math.floor(r() * 3); session < 1 + Math.floor(r() * 3); session++, t += 1 + Math.floor(r() * 2)) {
    const c = C(st);
    for (let e = 0; e < 1 + Math.floor(r() * 6); e++) {
      const x = r();
      if (x < 0.35) c.checks[pick(KEYS)] = r() < 0.7;
      else if (x < 0.45) { c.started = c.started || {}; const k = pick(KEYS); if (r() < 0.6) c.started[k] = 1; else delete c.started[k]; }
      else if (x < 0.55) { c.qsteps = c.qsteps || {}; const q = pick(QS), s = new Set(c.qsteps[q] || []), i = Math.floor(r() * 4); r() < 0.7 ? s.add(i) : s.delete(i); c.qsteps[q] = [...s].sort((a, b) => a - b); }
      else if (x < 0.6) { c.qsub = c.qsub || {}; const q = c.qsub[pick(QS)] = c.qsub[pick(QS)] || {}; q[1] = r() < 0.5 ? [0] : [0, 1]; }
      else if (x < 0.68) c.level = 5 + Math.floor(r() * 40);
      else if (x < 0.76) { c.quest = pick(['', ...QS]); if (r() < 0.3) c.storyEnd = c.quest; else delete c.storyEnd; }
      else if (x < 0.82) { c.stLv = c.stLv || {}; c.stLv["Triniel's Dagger"] = 1 + Math.floor(r() * 5); }
      else if (x < 0.87) c.stones = Math.floor(r() * 4);
      else if (x < 0.9) c.rotSeen = [pick(['a:1:0', 'b:2:1'])];
      else if (x < 0.95) c.buildId = pick(['build:assassin:guide', 'build:assassin:unknown-from-a-newer-build']);
      else { c.dvTotal = Math.floor(r() * 30); c.dvLast = 'dv:x'; }
    }
    if (r() < 0.5) st.mode = pick(['basic', 'advanced']);
    if (r() < 0.3) st.open = { g22: r() < 0.5 };
    M.stampSave(st, t * 1000);
  }
  return clone(st);
}

export default (test, M) => {
  const C = M.char, S = M.syncedPart;
  const merge = (...xs) => xs.reduce((a, b) => M.merge(a, b));

  /* ---------- stamps ---------- */
  test('stamps: a tick, an un-tick, a removal (tombstone) and an objective each carry the time they were saved', () => {
    const st = load(M, { ...SEEDS, checks: { 'g6:0': true }, level: 20, quest: 'Land of Rifts', started: { 'rq:2202017': 1 } }, 100).state;
    assert.deepEqual(C(st).mt.checks, { 'g6:0': [0, true] }); assert.deepEqual(C(st).mt.level, [0, 20]);
    C(st).checks['g6:0'] = false; C(st).checks['g22:1'] = true; delete C(st).started['rq:2202017'];
    C(st).qsteps = { 'Land of Rifts': [2] };
    const s1 = save(M, st, 1000);
    assert.deepEqual(C(s1).mt.checks, { 'g6:0': [1000, false], 'g22:1': [1000, true] });
    assert.deepEqual(C(s1).mt.started, { 'rq:2202017': [1000, null] });
    assert.deepEqual(C(s1).mt.qsteps, { 'Land of Rifts': { 2: [1000, true] } });
    assert.deepEqual(C(s1).mt.level, [0, 20]);
    assert.equal(s1.savedAt, 1000000); assert.equal(s1.schemaVersion, 1);
    C(st).qsteps['Land of Rifts'] = []; C(st).level = 21; C(st).storyEnd = 'Land of Rifts';
    const s2 = save(M, st, 1010);
    assert.deepEqual(C(s2).mt.qsteps, { 'Land of Rifts': { 2: [1010, null] } }); assert.deepEqual(C(s2).mt.level, [1010, 21]);
    assert.deepEqual(C(s2).mt.quest, [1010, ['Land of Rifts', 'Land of Rifts']]);
  });
  test('stamps: a save without the stampV1 flag is stored as it is (the load steps before 5c write those)', () => {
    const st = { ...SEEDS, checks: { 'g6:0': true }, level: 5, quest: '' }, before = clone(st);
    M.stampSave(st, 5000); assert.deepEqual(st, before);
  });
  test('stampV1 step: flag, schemaVersion 1, every value stamped at time 0; nothing written; a second load changes nothing', () => {
    const saved = { ...SEEDS, checks: { 'g6:0': true, 'g22:1': false }, level: 27, quest: 'Tangled Past', stLv: { "Triniel's Dagger": 3 }, mode: 'basic' };
    const { state, writes } = load(M, saved, 2000);
    assert.deepEqual(writes, []);
    assert.equal(state.stampV1, true); assert.equal(state.schemaVersion, 1); assert.equal(state.mode, 'basic');
    assert.deepEqual(C(state).mt, { checks: { 'g6:0': [0, true], 'g22:1': [0, false] }, level: [0, 27], quest: [0, ['Tangled Past', null]], stLv: { "Triniel's Dagger": [0, 3] } });
    const again = load(M, state, 3000); assert.deepEqual(again.state, state); assert.deepEqual(again.writes, []);
  });
  test('rollback re-stamp: values a build without times changed are stamped with the load time; the rest keep theirs', () => {
    const st = load(M, { ...SEEDS, checks: { 'g6:0': true, 'g22:1': true }, level: 22, quest: '' }, 100).state;
    C(st).checks['g27:0'] = true; const s5c = save(M, st, 500);
    /* the old build: loads (Object.assign over its defaults), changes values, saves the whole object (mt untouched) */
    const old = Object.assign({ checks: {}, level: 5, hide: false, open: {}, quest: '' }, clone(s5c));
    C(old).checks['g22:1'] = false; C(old).level = 23; delete C(old).checks['g6:0'];
    const back = load(M, clone(old), 900).state, mt = C(back).mt;
    assert.deepEqual(mt.checks, { 'g6:0': [900, null], 'g22:1': [900, false], 'g27:0': [500, true] });
    assert.deepEqual(mt.level, [900, 23]);
  });
  test('rollback: a 5c save loads in an old build with the same progress (unknown fields are only carried along)', () => {
    const st = load(M, fixture('fixture-user-2026-10-14-lv39.json'), 100).state; C(st).checks['g40:0'] = true;
    const s5c = save(M, st, 200), old = Object.assign({ checks: {}, level: 5, hide: false, open: {}, quest: '' }, clone(s5c));
    for (const f of M.CHAR_FIELDS) assert.deepEqual(C(old)[f], C(s5c)[f], f);
    assert.ok(Array.isArray(M.rankNext(old, { basic: false })));
  });

  /* ---------- merge ---------- */
  const saves = Array.from({ length: 36 }, (_, i) => genSave(M, 1000 + i));
  test('merge: generated saves are varied (ticks, un-ticks, tombstones, unstamped saves, equal times)', () => {
    const all = saves.map(s => JSON.stringify(C(s).mt || null));
    assert.deepEqual([all.some(x => x.includes(',false]')), all.some(x => x.includes(',null]')), saves.some(s => !C(s).mt), new Set(saves.map(s => JSON.stringify(S(s)))).size], [true, true, true, saves.length]);
  });
  test('merge: commutative (synced part) over generated save pairs', () => {
    for (let i = 0; i < saves.length; i++) for (let j = i + 1; j < saves.length; j++)
      assert.deepEqual(S(M.merge(saves[i], saves[j])), S(M.merge(saves[j], saves[i])), `${i} × ${j}`);
  });
  test('merge: associative (synced part) over generated save triples', () => {
    for (let i = 0; i + 2 < saves.length; i++) for (const [a, b, c] of [[i, i + 1, i + 2], [i + 2, i, i + 1]])
      assert.deepEqual(S(M.merge(M.merge(saves[a], saves[b]), saves[c])), S(M.merge(saves[a], M.merge(saves[b], saves[c]))), `${a} ${b} ${c}`);
  });
  test('merge: idempotent: merge(a, a) = a for a stamped save, merge(m, m) = m and merge(m, a) = m for any merge result', () => {
    saves.filter(s => s.stampV1).forEach((a, i) => assert.deepEqual(M.merge(a, a), a, `save ${i}`));
    for (let i = 0; i + 1 < saves.length; i++) { const m = M.merge(saves[i], saves[i + 1]);
      assert.deepEqual(M.merge(m, m), m, `m ${i}`); assert.deepEqual(S(M.merge(m, saves[i])), S(m), `m+a ${i}`); assert.deepEqual(S(M.merge(m, saves[i + 1])), S(m), `m+b ${i}`); }
  });
  test('merge: inputs are not changed', () => {
    const a = clone(saves[0]), b = clone(saves[1]); M.merge(a, b); assert.deepEqual([a, b], [saves[0], saves[1]]);
  });
  test('merge: a newer un-tick beats an older tick, a newer tick beats an older un-tick (either order)', () => {
    const A = load(M, { ...SEEDS, checks: {}, level: 20, quest: '' }, 0).state, B = clone(A);
    C(A).checks['g22:1'] = true; C(A).checks['g6:0'] = true; const a = save(M, A, 100);
    C(B).checks['g22:1'] = true; C(B).checks['g6:0'] = true; save(M, B, 50);
    C(B).checks['g22:1'] = false; const b = save(M, B, 200);
    for (const m of [M.merge(a, b), M.merge(b, a)]) { assert.equal(C(m).checks['g22:1'], false); assert.equal(C(m).checks['g6:0'], true); assert.deepEqual(C(m).mt.checks['g22:1'], [200, false]); }
    const m = M.merge(a, b); C(m).checks['g22:1'] = true; const a2 = save(M, m, 300);
    assert.equal(C(M.merge(a2, b)).checks['g22:1'], true); assert.equal(C(M.merge(b, a2)).checks['g22:1'], true);
  });
  /* clock skew: B takes A's tick through a merge, then un-ticks with a clock earlier than A's tick time */
  const skew = (label, tTick, tUntick) => test(`merge: ${label}: the un-tick still survives, in both orders`, () => {
    const A = load(M, { ...SEEDS, checks: {}, level: 20, quest: '' }, 0).state;
    C(A).checks['g22:1'] = true; C(A).started = { 'rq:2202017': 1 }; const a = save(M, A, tTick);
    const B = M.merge(load(M, { ...SEEDS, checks: {}, level: 20, quest: '' }, 0).state, a);
    C(B).checks['g22:1'] = false; delete C(B).started['rq:2202017']; const b = save(M, B, tUntick);
    assert.ok(C(b).mt.checks['g22:1'][0] > tTick && C(b).mt.started['rq:2202017'][0] > tTick, 'stamps bumped past the tick');
    for (const m of [M.merge(a, b), M.merge(b, a)]) { assert.equal(C(m).checks['g22:1'], false); assert.deepEqual(C(m).started, {}); }
  });
  skew('clock set back on one device', 1760440000, 1760000000);
  skew('device running 1 h behind', 1760440000, 1760440000 - 3600 + 60);
  test('stamps: time-0 stamps stay 0 (no bump for unknown times)', () => {
    const st = load(M, { ...SEEDS, checks: { 'g6:0': true }, level: 5, quest: '' }, 0).state;
    C(st).checks['g6:0'] = false; M.stamp(C(st), 0); assert.deepEqual(C(st).mt.checks['g6:0'], [0, false]);
  });
  test('merge: the result shares no objects with its inputs', () => {
    const A = load(M, { ...SEEDS, checks: {}, level: 30, quest: '' }, 0).state, B = clone(A);
    C(B).customBuild = { base: 'build:assassin:guide', nodes: ['n1'] }; C(B).rotSeen = ['a:1:0']; C(B).qsteps = { 'Land of Rifts': [1] };
    const b = save(M, B, 100), a = save(M, A, 50), bCopy = clone(b), aCopy = clone(a);
    for (const m of [M.merge(a, b), M.merge(b, a)]) {
      C(m).customBuild.nodes.push('x'); C(m).rotSeen.push('y'); C(m).qsteps['Land of Rifts'].push(9); C(m).mt.level[0] = -1; C(m).mt.customBuild[1].nodes.push('z'); C(m).checks.zz = true;
    }
    assert.deepEqual([a, b], [aCopy, bCopy]);
  });
  test('merge: a removal is a dated tombstone (started, snooze, objective)', () => {
    const A = load(M, { ...SEEDS, checks: {}, level: 20, quest: 'Land of Rifts', started: { 'rq:2202017': 1 }, rqSnooze: { 'rq:2202040': 26 }, qsteps: { 'Land of Rifts': [0, 1] } }, 0).state, B = clone(A);
    delete C(A).started['rq:2202017']; C(A).qsteps['Land of Rifts'] = [0]; const a = save(M, A, 100);
    delete C(B).rqSnooze['rq:2202040']; C(B).started['rq:2202018'] = 1; const b = save(M, B, 90);
    for (const m of [M.merge(a, b), M.merge(b, a)]) {
      assert.deepEqual(C(m).started, { 'rq:2202018': 1 }); assert.deepEqual(C(m).rqSnooze, {}); assert.deepEqual(C(m).qsteps, { 'Land of Rifts': [0] });
    }
  });
  test('merge: registers (level, story position, stones) take the latest change; equal times break on the value', () => {
    const A = load(M, { ...SEEDS, checks: {}, level: 20, quest: 'Land of Rifts' }, 0).state, B = clone(A);
    C(A).level = 24; C(A).stones = 3; const a = save(M, A, 100);
    C(B).quest = 'Tangled Past'; C(B).storyEnd = 'Tangled Past'; C(B).level = 23; const b = save(M, B, 150);
    for (const m of [M.merge(a, b), M.merge(b, a)]) { assert.equal(C(m).level, 23); assert.equal(C(m).quest, 'Tangled Past'); assert.equal(C(m).storyEnd, 'Tangled Past'); assert.equal(C(m).stones, 3); }
    C(B).level = 26; const b2 = save(M, B, 100);
    assert.equal(C(M.merge(a, b2)).level, 26); assert.equal(C(M.merge(b2, a)).level, 26);
  });
  test('merge: one-time flags OR; schemaVersion and savedAt the larger', () => {
    const a = { checks: {}, level: 5, quest: '', migV5: true, seedDv2: true, savedAt: 10 }, b = { checks: {}, level: 5, quest: '', eputSync1: true, stampV1: true, schemaVersion: 1, savedAt: 20 };
    for (const m of [M.merge(a, b), M.merge(b, a)]) { for (const f of ['migV5', 'seedDv2', 'eputSync1', 'stampV1']) assert.equal(m[f], true, f); assert.equal(m.schemaVersion, 1); assert.equal(m.savedAt, 20); }
  });
  test('merge: view settings, the local undo (dvLast) and unknown top-level fields stay the local save\'s', () => {
    const A = load(M, { ...SEEDS, checks: {}, level: 20, quest: '' }, 0).state, B = clone(A);
    Object.assign(A, { mode: 'basic', open: { g22: true }, hideCards: true, areaLv: '30', fold_srcCard: true, someFutureView: 1 }); C(A).dvLast = 'dv:a'; C(A).dvLastAt = 5;
    Object.assign(B, { mode: 'advanced', open: { g27: true }, showObj: true, sound: false }); C(B).dvLast = 'dv:b'; C(B).checks['g6:0'] = true;
    const a = save(M, A, 100), b = save(M, B, 100), m = M.merge(a, b);
    for (const f of [...VIEW, 'fold_srcCard', 'someFutureView']) assert.deepEqual(m[f], a[f], f);
    assert.equal(C(m).dvLast, 'dv:a'); assert.equal(C(m).dvLastAt, 5); assert.equal(C(m).checks['g6:0'], true);
  });
  test('merge: buildId / customBuild are registers; an id this build doesn\'t know is kept, never dropped', () => {
    const A = load(M, { ...SEEDS, checks: {}, level: 30, quest: '' }, 0).state, B = clone(A);
    C(A).buildId = 'build:assassin:guide'; const a = save(M, A, 100);
    C(B).buildId = 'build:assassin:from-a-newer-build'; C(B).customBuild = { base: 'build:assassin:guide', nodes: ['node:assassin:nezekan:r9c9', 'node:assassin:unknown:r1c1'] }; const b = save(M, B, 200);
    for (const m of [M.merge(a, b), M.merge(b, a)]) { assert.equal(C(m).buildId, 'build:assassin:from-a-newer-build'); assert.deepEqual(C(m).customBuild, C(b).customBuild); }
  });
  test('merge N1: a stale import never outranks newer progress (export at T0, tick on B at T1, import the T0 export on A)', () => {
    /* old-build export (no mt, no savedAt): stamped 0 on the reload after the import */
    const old = { ...SEEDS, checks: { 'g22:1': true }, level: 22, quest: '' };
    /* 5c export at T0 */
    const T0 = 1000, dev = load(M, { ...SEEDS, checks: { 'g22:1': true }, level: 22, quest: '' }, 0).state; C(dev).checks['g27:0'] = true;
    const exp5c = save(M, dev, T0);
    for (const [label, exported] of [['old export', old], ['5c export', exp5c]]) {
      const B = load(M, exported, T0 + 1).state; C(B).checks['g22:1'] = false; C(B).checks['g32:0'] = true; const b = save(M, B, T0 + 50);
      /* the import: the file replaces the save, the seeds are marked done, then the page reloads */
      const A = load(M, Object.assign(clone(exported), { seedLv12: true, stTriniel1: true, dvReset1: true }), T0 + 100).state;
      for (const m of [M.merge(A, b), M.merge(b, A)]) { assert.equal(C(m).checks['g22:1'], false, label + ': B\'s un-tick survives'); assert.equal(C(m).checks['g32:0'], true, label + ': B\'s tick survives'); }
    }
    for (const bad of ['1760000000000', -5, null, true, { t: 1 }, 1e400 * 0])
      assert.deepEqual(C(load(M, { ...old, savedAt: bad }, 5000).state).mt.checks, { 'g22:1': [0, true] }, 'invalid savedAt ' + JSON.stringify(bad) + ' → stamps at 0');
    assert.equal(M.merge({ checks: {}, savedAt: 'x' }, { checks: {}, savedAt: 5 }).savedAt, 5);
    const withSavedAt = load(M, { ...old, savedAt: 777000 }, 5000).state;
    assert.deepEqual(C(withSavedAt).mt.checks, { 'g22:1': [777, true] }, 'an export with savedAt but no mt: stamped with savedAt');
  });
  test('owner save 2026-10-14 (Lv 39): migrates once (stampV1), then merges with itself and with a later copy cleanly', () => {
    const saved = fixture('fixture-user-2026-10-14-lv39.json'), { state, writes } = load(M, saved, 1760440000);
    assert.deepEqual(writes, []);
    const again = load(M, state, 1760450000); assert.deepEqual(again.state, state); assert.deepEqual(again.writes, []);
    const s0 = save(M, clone(state), 1760440000), later = clone(s0);
    C(later).checks['g40:0'] = !C(later).checks['g40:0']; C(later).level = 40; const s1 = save(M, later, 1760441000);
    assert.deepEqual(M.merge(s0, s0), s0);
    for (const m of [M.merge(s0, s1), M.merge(s1, s0)]) { assert.equal(C(m).level, 40); assert.equal(C(m).checks['g40:0'], C(later).checks['g40:0']); }
    assert.deepEqual(S(M.merge(s0, s1)), S(M.merge(s1, s0)));
    for (const f of M.CHAR_FIELDS.filter(f => f !== 'mt')) assert.deepEqual(C(M.merge(s1, s0))[f], C(s1)[f], 'merged = later copy: ' + f);
  });

  /* ---------- last confirmed location ---------- */
  const rq0 = M.RQ.find(q => q.zone), rq1 = M.RQ.find(q => q.zone && q.zone !== rq0.zone);
  test('last location: none without dated ticks (old saves: Next up keeps today\'s order)', () => {
    const st = load(M, fixture('fixture-user-2026-10-14-lv39.json'), 1760440000).state;
    assert.equal(M.lastConfirmedLocation(C(st)), null);
  });
  test('last location: the newest dated tick of a located item (regional quest, Sealed Dungeon, stronghold)', () => {
    const st = load(M, { ...SEEDS, checks: {}, level: 20, quest: '' }, 0).state;
    C(st).checks['rq:' + rq0.id] = true; save(M, st, 100);
    assert.deepEqual(M.lastConfirmedLocation(C(st)), { key: 'rq:' + rq0.id, t: 100, zone: rq0.zone });
    C(st).checks['rq:' + rq1.id] = true; save(M, st, 200);
    assert.equal(M.lastConfirmedLocation(C(st)).zone, rq1.zone);
    const sd = M.AREA_ITEMS.find(x => x.k.startsWith('sd:') && x.area !== 'Area not documented yet'), sh = M.AREA_ITEMS.find(x => x.k.startsWith('sh:'));
    C(st).checks[sd.k] = true; save(M, st, 300); assert.deepEqual(M.lastConfirmedLocation(C(st)), { key: sd.k, t: 300, zone: sd.area });
    C(st).checks[sh.k] = true; save(M, st, 400); assert.deepEqual(M.lastConfirmedLocation(C(st)), { key: sh.k, t: 400, zone: sh.area });
  });
  test('last location: Ascension steps, unlocated steps and un-ticks never move it', () => {
    const st = load(M, { ...SEEDS, checks: {}, level: 20, quest: '' }, 0).state;
    C(st).checks['rq:' + rq0.id] = true; save(M, st, 100);
    for (const k of ['g22:0', 'g32:dreams', 'g45:0']) { assert.ok(M.isAscensionKey(k), k); C(st).checks[k] = true; }
    save(M, st, 200);
    C(st).checks['g6:0'] = true; C(st).checks['rq:' + rq1.id] = false; save(M, st, 300);
    assert.deepEqual(M.lastConfirmedLocation(C(st)), { key: 'rq:' + rq0.id, t: 100, zone: rq0.zone });
    assert.ok(!M.isAscensionKey('g22:1') && !M.isAscensionKey('rq:' + rq0.id));
  });
  test('last location: ties on time break on the key; both devices derive the same answer after a merge', () => {
    const A = load(M, { ...SEEDS, checks: {}, level: 20, quest: '' }, 0).state, B = clone(A);
    C(A).checks['rq:' + rq0.id] = true; const a = save(M, A, 100);
    C(B).checks['rq:' + rq1.id] = true; const b = save(M, B, 100);
    const ab = M.lastConfirmedLocation(C(M.merge(a, b))), ba = M.lastConfirmedLocation(C(M.merge(b, a)));
    assert.deepEqual(ab, ba); assert.equal(ab.key, ['rq:' + rq0.id, 'rq:' + rq1.id].sort()[1]);
  });
  test('last location: the locator can be swapped (v2 zones)', () => {
    const st = load(M, { ...SEEDS, checks: {}, level: 20, quest: '' }, 0).state; C(st).checks['g6:0'] = true; save(M, st, 100);
    assert.deepEqual(M.lastConfirmedLocation(C(st), k => k === 'g6:0' ? 'zone:ishalgen' : null), { key: 'g6:0', t: 100, zone: 'zone:ishalgen' });
  });
  test('fresh browser (Lv 1, first quest) never resets another device\'s story position in merge()', () => {
    const fresh = load(M, M.DEFAULT(), 0, false).state;
    assert.equal(C(fresh).quest, M.QUESTS[0][1]);
    /* the review's cases: quests whose names sort before the first quest's, an unset quest, and a later quest */
    const names = ['A New Lead', 'A Collective Effort', 'A Daeva Dreaming Anew', M.QUESTS[10][1]];
    names.forEach(n => assert.ok(M.QUESTS.some(([, q]) => q === n), n));
    for (const q of [...names, '']) {
      const legacy = load(M, { ...SEEDS, checks: {}, level: 30, quest: q }, 0).state;   /* pre-change-times save: all t = 0 */
      const want = q;   /* the untouched default ranks below an unset quest too: an unset Lv 30 save stays unset */
      for (const m of [M.merge(fresh, legacy), M.merge(legacy, fresh)]) { assert.equal(C(m).quest, want, `${q || '(unset)'}`); assert.equal(C(m).level, 30); }
    }
  });
  test('fresh default never clears a turned-in marker, a no-quest save or an unknown (renamed) quest', () => {
    const fresh = load(M, M.DEFAULT(), 0, false).state, last = M.QUESTS[M.QUESTS.length - 1][1];
    const cases = [{ quest: '', storyEnd: last }, { quest: 'A Quest That Was Renamed' }, {}];
    for (const extra of cases) {
      /* through loadState, as the page loads a save: a save stored without a quest field gets DEFAULT()'s "" */
      const legacy = load(M, M.loadState(JSON.stringify({ ...SEEDS, checks: {}, level: 30, ...extra })).state, 0).state;
      for (const m of [M.merge(fresh, legacy), M.merge(legacy, fresh)]) {
        assert.equal(C(m).quest ?? '', extra.quest ?? '', JSON.stringify(extra));
        assert.equal(C(m).storyEnd ?? null, extra.storyEnd ?? null, JSON.stringify(extra));
      }
    }
  });
  test('quest tie-break: a turned-in position beats the same quest not turned in; a dated change still beats time 0', () => {
    const q = M.QUESTS[M.QUESTS.length - 1][1], a = load(M, { ...SEEDS, checks: {}, level: 20, quest: q }, 0).state, b = load(M, { ...SEEDS, checks: {}, level: 20, quest: q, storyEnd: q }, 0).state;
    for (const m of [M.merge(a, b), M.merge(b, a)]) assert.equal(C(m).storyEnd, q);
    const c = load(M, { ...SEEDS, checks: {}, level: 20, quest: M.QUESTS[2][1] }, 0).state; C(c).quest = M.QUESTS[1][1]; save(M, c, 500);   /* a dated move back */
    for (const m of [M.merge(c, b), M.merge(b, c)]) assert.equal(C(m).quest, M.QUESTS[1][1]);
  });
};
