/* Where the player is (0.5 P10, src/core/place.js; docs/design/0.4-smart-next-up.md §4, §5): whereNow over every kind of
   dated stamp the design's §4 table names, its tie-break, merge() symmetry on the sync suite's generated save pairs,
   and the byPlace comparator. Not wired: nothing on the page calls them yet. */
import assert from 'node:assert/strict';
import { genSave } from './sync.test.mjs';

const clone = o => JSON.parse(JSON.stringify(o));
const deepFreeze = o => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.values(o).forEach(deepFreeze); Object.freeze(o); } return o; };

export default (test, M) => {
  const N = M.GATE_GRAPH.nodes, NP = M.NODE_PLACE, K = M.KIBELISKS;
  const nodeOf = kind => Object.entries(N).find(([id, n]) => n.kind === kind && NP[id] && Object.values(NP[id].pts).some(p => p.map))[0];
  const rqId = nodeOf('rq'), sdId = nodeOf('sd'), shId = nodeOf('sh');
  const rqK = N[rqId].key, sdK = N[sdId].key, shK = N[shId].key;
  const xy = p => p && p.map ? { map: p.map, x: p.x, y: p.y } : null;
  const S = M.GATE_GRAPH.story, signs = S.findIndex(([, n]) => n === 'Signs of a Crash Landing');
  const W = mt => M.whereNow({ mt });

  /* ---------- §4: each row of the table moves it ---------- */
  test('whereNow: a done regional quest is at its turn-in (the turn-in Kibelisk\'s zone)', () => {
    const P = NP[rqId], w = W({ checks: { [rqK]: [100, true] } });
    assert.deepEqual(w, { via: rqK, t: 100, zone: K[P.pts.turnin.anchor].zone, pt: xy(P.pts.turnin) });
  });
  test('whereNow: a done Sealed Dungeon and a done stronghold are at their entrance (the record\'s zone)', () => {
    assert.deepEqual(W({ checks: { [sdK]: [100, true] } }), { via: sdK, t: 100, zone: NP[sdId].zone, pt: xy(NP[sdId].pts.entrance) });
    assert.deepEqual(W({ checks: { [shK]: [100, true] } }), { via: shK, t: 100, zone: NP[shId].zone, pt: xy(NP[shId].pts.entrance) });
  });
  test('whereNow: a picked-up regional quest (started) is at its giver', () => {
    assert.deepEqual(W({ started: { [rqK]: [100, 1] } }), { via: 'started:' + rqK, t: 100, zone: NP[rqId].zone, pt: xy(NP[rqId].pts.giver) });
  });
  test('whereNow: an objective tick (qsteps) is in its Kibelisk\'s zone, with no point (no objective points before S1)', () => {
    const q = S[signs][1], w = W({ qsteps: { [q]: { 1: [100, true] } } });
    assert.match(M.QUEST_STEPS[q][1], /\(Kibelisk: Witch's Cabin\)/);
    assert.deepEqual(w, { via: `qsteps:${q}:1`, t: 100, zone: K['kib:witchs-cabin'].zone, pt: null });
    /* an objective whose Kibelisk lies outside the quest's own zone goes by the Kibelisk; one with no marker by the quest */
    const byName = Object.fromEntries(Object.entries(K).map(([id, k]) => [k.name, id]));
    const hit = S.flatMap(([id, n]) => (M.QUEST_STEPS[n] || []).map((t, i) => ({ id, n, i, kib: byName[(t.match(/\(Kibelisk: ([^)]+)\)/) || [])[1]] })))
      .find(x => x.kib && NP[x.id] && NP[x.id].zone && K[x.kib].zone !== NP[x.id].zone);
    assert.ok(hit, 'an objective Kibelisk outside its quest\'s zone');
    assert.equal(W({ qsteps: { [hit.n]: { [hit.i]: [100, true] } } }).zone, K[hit.kib].zone);
    const bare = S.flatMap(([id, n]) => (M.QUEST_STEPS[n] || []).map((t, i) => ({ id, n, i, t }))).find(x => !/\(Kibelisk:/.test(x.t) && NP[x.id] && NP[x.id].zone);
    assert.deepEqual(W({ qsteps: { [bare.n]: { [bare.i]: [100, true] } } }), { via: `qsteps:${bare.n}:${bare.i}`, t: 100, zone: NP[bare.id].zone, pt: null });
  });
  test('whereNow: the story position (quest) is at the quest\'s giver; with storyEnd = the quest, at its turn-in', () => {
    const [id, q] = S[signs], P = NP[id];
    assert.deepEqual(W({ quest: [100, [q, null]] }), { via: 'quest', t: 100, zone: NP[S[signs - 1][0]].zone, pt: xy(P.pts.giver) });
    assert.deepEqual(W({ quest: [100, [q, q]] }), { via: 'quest', t: 100, zone: P.zone, pt: xy(P.pts.turnin) });
  });
  test('whereNow: a "bind:" tick is in that Kibelisk\'s zone; a Sealed Dungeon run (areaRun, the pack\'s field) at its entrance', () => {
    assert.deepEqual(W({ checks: { 'bind:kib:safe-haven': [100, true] } }), { via: 'bind:kib:safe-haven', t: 100, zone: K['kib:safe-haven'].zone, pt: null });
    assert.deepEqual(W({ areaRun: { [sdK]: [100, 1700000000000] } }), { via: 'areaRun:' + sdK, t: 100, zone: NP[sdId].zone, pt: xy(NP[sdId].pts.entrance) });
  });
  test('whereNow: Ascension steps, unlocated steps, un-ticks, removals and time-0 stamps never move it', () => {
    const asc = M.GATES.flatMap(g => g.items || []).find(it => it.ascensionQuest).k;
    assert.ok(M.isAscensionKey(asc));
    const base = { checks: { [rqK]: [100, true] } }, want = W(base);
    for (const extra of [{ [asc]: [200, true] }, { 'g6:0': [200, true] }, { [sdK]: [200, false] }, { [shK]: [200, null] }, { 'bind:kib:no-such-place': [200, true] }])
      assert.deepEqual(W({ checks: { ...base.checks, ...extra } }), want, JSON.stringify(extra));
    assert.deepEqual(W({ ...base, started: { [rqK]: [300, null] }, qsteps: { 'Land of Rifts': { 0: [300, null] } }, quest: [300, null] }), want);
    assert.equal(W({ checks: { [rqK]: [0, true] }, quest: [0, ['Land of Rifts', null]] }), null);
  });
  test('whereNow: the newest stamp wins across kinds', () => {
    const q = S[signs][1], mt = { checks: { [rqK]: [100, true], [sdK]: [300, true] }, started: { [rqK]: [200, 1] }, qsteps: { [q]: { 1: [400, true] } }, quest: [250, [q, null]] };
    assert.equal(W(mt).via, `qsteps:${q}:1`);
    mt.quest = [500, [q, q]]; assert.equal(W(mt).via, 'quest');
    mt.areaRun = { [shK]: [600, 1] }; assert.equal(W(mt).via, 'areaRun:' + shK);
  });
  test('whereNow: a time tie gives the same answer in both orders (larger key wins)', () => {
    const a = { [rqK]: [100, true] }, b = { [sdK]: [100, true] };
    const x = W({ checks: { ...a, ...b } }), y = W({ checks: { ...b, ...a } });
    assert.deepEqual(x, y); assert.equal(x.via, [rqK, sdK].sort()[1]);
    const q = S[signs][1], m1 = { started: { [rqK]: [100, 1] }, quest: [100, [q, null]], qsteps: { [q]: { 1: [100, true] } } };
    const m2 = { qsteps: m1.qsteps, quest: m1.quest, started: m1.started };
    assert.deepEqual(W(m1), W(m2)); assert.equal(W(m1).via, ['started:' + rqK, 'quest', `qsteps:${q}:1`].sort()[2]);
  });
  test('whereNow: no dated stamp gives null (a fresh save, no mt, an empty mt)', () => {
    const { state } = M.loadState(null, { now: 0, newId: () => 'p' }); M.migrate(state, false, () => {}, 0);
    assert.equal(M.whereNow(M.char(state)), null); assert.equal(M.whereNow({}), null); assert.equal(W({}), null);
  });
  test('whereNow: deep-frozen input (a frozen save is read, never written)', () => {
    const q = S[signs][1], c = deepFreeze({ checks: { [rqK]: true }, quest: q, mt: { checks: { [rqK]: [100, true] }, quest: [200, [q, q]], qsteps: { [q]: { 0: [150, true] } } } });
    assert.equal(M.whereNow(c).via, 'quest');
  });
  test('whereNow: merge(a, b) and merge(b, a) give the same answer on the sync suite\'s save pairs', () => {
    const saves = Array.from({ length: 36 }, (_, i) => genSave(M, 1000 + i));
    let placed = 0;
    for (let i = 0; i < saves.length; i++) for (let j = i + 1; j < saves.length; j++) {
      const ab = M.merge(saves[i], saves[j]), ba = M.merge(saves[j], saves[i]);
      for (const id of Object.keys(ab.chars)) { const x = M.whereNow(ab.chars[id]); assert.deepEqual(x, M.whereNow(ba.chars[id]), `${i} × ${j} ${id}`); if (x) placed++; }
    }
    assert.ok(placed > 100, 'most merged pairs place the player: ' + placed);
  });

  /* ---------- §5: byPlace ---------- */
  test('byPlace: same zone first, then straight-line distance on the same map (another map = unknown, last), then catalog order', () => {
    const here = { zone: 'z:a', pt: { map: 'm1', x: 0, y: 0 } };
    const it = (id, zone, pt, order) => ({ id, zone, pt, order });
    const xs = [it('far', 'z:b', { map: 'm1', x: 300, y: 400 }, 0), it('other-map', 'z:b', { map: 'm2', x: 1, y: 1 }, 1), it('near', 'z:b', { map: 'm1', x: 3, y: 4 }, 2),
      it('here-late', 'z:a', null, 5), it('here-early', 'z:a', null, 4), it('nowhere', null, null, 3)];
    assert.deepEqual([...xs].sort(M.byPlace(here)).map(x => x.id), ['here-early', 'here-late', 'near', 'far', 'other-map', 'nowhere']);
    assert.deepEqual([...xs].sort(M.byPlace(null)).map(x => x.id), ['far', 'other-map', 'near', 'nowhere', 'here-early', 'here-late']);
    assert.equal(M.placeDist({ map: 'm1', x: 0, y: 0 }, { map: 'm1', x: 3, y: 4 }), 5);
    assert.equal(M.placeDist({ map: 'm1', x: 0, y: 0 }, { map: 'm2', x: 0, y: 0 }), null);
    assert.equal(M.placeDist(null, { map: 'm1', x: 0, y: 0 }), null);
    const of = x => ({ zone: x.z, pt: null, order: x.o });
    assert.deepEqual([{ z: 'z:b', o: 0 }, { z: 'z:a', o: 1 }].sort(M.byPlace(here, of)).map(x => x.o), [1, 0]);
  });

  /* ---------- the pack field ---------- */
  test('pack: place is optional (a pack without it: whereNow null) and type-checked', () => {
    const min = { id: 'x', data: { graph: { nodes: {} }, story: { quests: [], steps: {} } }, catalog: { milestones: [], routes: [] } };
    const p = M.definePack(min);
    assert.equal(p.place, null);
    assert.equal(M.whereNow({ mt: { checks: { [rqK]: [100, true] } } }, p), null);
    assert.throws(() => M.definePack({ ...min, place: { fields: [] } }), /"place" has the wrong type/);
    assert.throws(() => M.definePack({ ...min, place: { at: () => null, fields: [1] } }), /"place" has the wrong type/);
    const q = M.definePack({ ...min, place: { at: (path, v) => path[0] === 'checks' ? { zone: 'z:' + path[1], pt: { map: 'm', x: 1, y: 2 } } : null } });
    assert.deepEqual(q.place.fields, []);
    assert.deepEqual(M.whereNow({ mt: { checks: { a: [5, true], b: [5, true] }, started: { c: [9, 1] } } }, q), { via: 'b', t: 5, zone: 'z:b', pt: { map: 'm', x: 1, y: 2 } });
    assert.equal(M.aion2Pack.place.at, M.aion2Place.at); assert.deepEqual(M.aion2Pack.place.fields, ['areaRun']);
  });
};
