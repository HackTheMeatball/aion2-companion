/* Where the player is (0.5 P10, src/core/place.js; docs/design/0.4-smart-next-up.md §4, §5): whereNow(c) from the change
   times, each row of the design's §4 table on the AION 2 pack, the time tie, merge() in both orders on the sync suite's
   pairs, deep-frozen input, byPlace and placeDistance, and a pack without `place`. */
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { genSave } from './sync.test.mjs';

const { toStored, TEST_SLOT } = createRequire(import.meta.url)('../support/save.js');
const clone = o => JSON.parse(JSON.stringify(o));
const deepFreeze = o => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const v of Object.values(o)) deepFreeze(v); } return o; };
/* a character as the page stores it: flat fields made v5 (every value stamped at time 0) */
const charOf = flat => toStored({ checks: {}, level: 20, quest: '', ...flat }).chars[TEST_SLOT];
/* run fn with pack p active, then put the AION 2 pack back */
const withPack = (M, p, fn) => { M.usePack(p); try { return fn(); } finally { M.usePack(M.aion2Pack); } };
/* a tiny pack with places: two maps, one zone each, a node "a" (giver and turn-in on map A), "b" (entrance on map A), "c" (on map B) */
const tiny = extra => ({ id: 'tiny', data: { graph: { story: [['q:1', 'First']], nodes: {
  'q:1': { kind: 'story', key: 'First', req: { all: [] }, done: [] },
  a: { kind: 'x', key: 'a', req: { all: [] }, done: ['tick'] }, b: { kind: 'x', key: 'b', req: { all: [] }, done: ['tick'] }, c: { kind: 'x', key: 'c', req: { all: [] }, done: ['tick'] } } },
  story: { quests: [[1, 'First']], steps: { First: ['go'] } } }, catalog: { milestones: [], routes: [] }, ...extra });
const PLACES = { nodes: {
  'q:1': { zone: 'z:1', pts: { giver: { map: 'A', x: 0, y: 0 }, turnin: { map: 'A', x: 30, y: 40 } } },
  a: { zone: 'z:1', pts: { giver: { map: 'A', x: 0, y: 0 }, turnin: { map: 'A', x: 3, y: 4 } } },
  b: { zone: 'z:1', pts: { entrance: { map: 'A', x: 6, y: 8 } } },
  c: { zone: 'z:2', pts: { entrance: { map: 'B', x: 3, y: 4 } } } } };

export default (test, M) => {
  const NP = M.NODE_PLACE, N = M.GATE_GRAPH.nodes, pt = p => ({ map: p.map, x: p.x, y: p.y });
  const nodeWith = (kind, side) => Object.keys(NP).find(id => N[id].kind === kind && NP[id].pts[side] && NP[id].pts[side].map && NP[id].zone);
  const rq = nodeWith('rq', 'turnin'), sd = nodeWith('sd', 'entrance'), sh = nodeWith('sh', 'entrance');
  const rqGiver = Object.keys(NP).find(id => N[id].kind === 'rq' && NP[id].pts.giver && NP[id].pts.giver.map && NP[id].pts.turnin && NP[id].pts.turnin.map
    && (NP[id].pts.giver.x !== NP[id].pts.turnin.x || NP[id].pts.giver.y !== NP[id].pts.turnin.y));
  const SS = 'Survival Supplies', ssId = M.GATE_GRAPH.story.find(([, n]) => n === SS)[0];
  /* one dated change on a fresh character: set it, stamp at t */
  const after = (flat, edit, t = 100) => { const c = charOf(flat); edit(c); M.stamp(c, t); return c; };

  test('whereNow: no dated stamp gives null (a fresh character, every value at time 0; a character with no mt)', () => {
    assert.equal(M.whereNow(charOf({ checks: { [N[rq].key]: true }, started: { [N[rqGiver].key]: 1 }, quest: SS, qsteps: { [SS]: [0] } })), null);
    assert.equal(M.whereNow({ checks: { [N[rq].key]: true } }), null);
  });
  test('whereNow §4 row checks: a regional quest at its turn-in, a Sealed Dungeon and a stronghold at their entrance', () => {
    for (const [id, side] of [[rq, 'turnin'], [sd, 'entrance'], [sh, 'entrance']]) {
      const k = N[id].key, w = M.whereNow(after({}, c => { c.checks[k] = true; }));
      assert.deepEqual(w, { via: k, t: 100, zone: NP[id].zone, pt: pt(NP[id].pts[side]) }, id);
    }
  });
  test('whereNow §4 row started: a picked-up regional quest at its giver', () => {
    const k = N[rqGiver].key, w = M.whereNow(after({}, c => { c.started = { [k]: 1 }; }));
    assert.deepEqual(w, { via: 'started:' + k, t: 100, zone: NP[rqGiver].zone, pt: pt(NP[rqGiver].pts.giver) });
  });
  test('whereNow §4 row qsteps: an objective at its Kibelisk (binds fact or "(Kibelisk: X)"), else the quest\'s zone', () => {
    const w = M.whereNow(after({ quest: SS }, c => { c.qsteps = { [SS]: [0] }; }));
    assert.deepEqual(w, { via: `qsteps:${SS}:0`, t: 100, zone: M.KIBELISKS['kib:safe-haven'].zone, pt: null });
    /* an objective that names no Kibelisk: its quest's zone */
    const [q, i] = Object.entries(M.QUEST_STEPS).flatMap(([q, a]) => a.map((t, i) => [q, i, t])).find(([q, , t]) => !/\(Kibelisk: /.test(t) && NP[M.GATE_GRAPH.story.find(([, n]) => n === q)[0]].zone);
    const id = M.GATE_GRAPH.story.find(([, n]) => n === q)[0];
    assert.deepEqual(M.whereNow(after({ quest: q }, c => { c.qsteps = { [q]: [i] }; })), { via: `qsteps:${q}:${i}`, t: 100, zone: NP[id].zone, pt: null });
  });
  test('whereNow §4 row quest: the story position at the quest\'s giver; turned in (storyEnd) at its turn-in', () => {
    assert.deepEqual(M.whereNow(after({}, c => { c.quest = SS; })), { via: 'quest', t: 100, zone: NP[ssId].zone, pt: pt(NP[ssId].pts.giver) });
    assert.deepEqual(M.whereNow(after({ quest: SS }, c => { c.storyEnd = SS; })), { via: 'quest', t: 100, zone: NP[ssId].zone, pt: pt(NP[ssId].pts.turnin) });
  });
  test('whereNow §4 row bind tick: checks["bind:<Kibelisk id>"] at the Kibelisk (its zone, no position in the data)', () => {
    const w = M.whereNow(after({}, c => { c.checks['bind:kib:safe-haven'] = true; }));
    assert.deepEqual(w, { via: 'bind:kib:safe-haven', t: 100, zone: 'zone:dredgion-crash-site', pt: null });
    assert.equal(M.whereNow(after({}, c => { c.checks['bind:kib:no-such-kibelisk'] = true; })), null);
  });
  test('whereNow, the pack\'s own keys: a Sealed Dungeon run started (areaRun) at its entrance', () => {
    const k = N[sd].key, w = M.whereNow(after({}, c => { c.areaRun = { [k]: 1760000000000 }; }));
    assert.deepEqual(w, { via: 'areaRun:' + k, t: 100, zone: NP[sd].zone, pt: pt(NP[sd].pts.entrance) });
  });
  test('whereNow §4 row Ascension: Ascension steps never move it; nor do un-ticks, removals and older stamps', () => {
    const c = after({}, c => { c.checks[N[rq].key] = true; }, 100);
    for (const k of ['g22:0', 'g32:dreams', 'g45:witness']) c.checks[k] = true;
    c.checks[N[sd].key] = false; M.stamp(c, 200);
    delete c.checks[N[rq].key]; M.stamp(c, 300);
    assert.equal(M.whereNow(c), null, 'the regional tick removed at 300: a tombstone, not a place');
    const d = after({}, c => { c.checks[N[sh].key] = true; }, 100);
    for (const k of ['g22:0', 'g32:dreams']) d.checks[k] = true; M.stamp(d, 200);
    assert.equal(M.whereNow(d).via, N[sh].key);
  });
  test('whereNow: the newest stamp wins across fields (tick, pick-up, objective, story position, bind)', () => {
    const c = charOf({ quest: SS });
    c.checks[N[rq].key] = true; M.stamp(c, 100);
    c.started = { [N[rqGiver].key]: 1 }; M.stamp(c, 200); assert.equal(M.whereNow(c).via, 'started:' + N[rqGiver].key);
    c.qsteps = { [SS]: [0] }; M.stamp(c, 300); assert.equal(M.whereNow(c).via, `qsteps:${SS}:0`);
    c.storyEnd = SS; M.stamp(c, 400); assert.equal(M.whereNow(c).via, 'quest');
    c.checks['bind:kib:safe-haven'] = true; M.stamp(c, 500); assert.equal(M.whereNow(c).via, 'bind:kib:safe-haven');
  });
  test('whereNow: a time tie breaks on the key (larger wins), the same answer in both orders', () => {
    const ks = [N[rq].key, N[sd].key, N[sh].key, 'started:' + N[rqGiver].key];
    const a = after({}, c => { c.checks[N[rq].key] = true; c.checks[N[sd].key] = true; c.checks[N[sh].key] = true; c.started = { [N[rqGiver].key]: 1 }; });
    const b = clone(a); b.mt.checks = Object.fromEntries(Object.entries(b.mt.checks).reverse());
    assert.notDeepEqual(Object.keys(a.mt.checks), Object.keys(b.mt.checks));
    assert.deepEqual(M.whereNow(a), M.whereNow(b));
    assert.equal(M.whereNow(a).via, ks.sort()[ks.length - 1]);
  });
  test('whereNow(merge(a, b)) equals whereNow(merge(b, a)) on the sync suite\'s pairs (both slots)', () => {
    const saves = Array.from({ length: 36 }, (_, i) => genSave(M, 1000 + i));
    let placed = 0;
    for (let i = 0; i < saves.length; i++) for (let j = i + 1; j < saves.length; j++) {
      const ab = M.merge(saves[i], saves[j]), ba = M.merge(saves[j], saves[i]);
      for (const id of Object.keys(ab.chars)) { const x = M.whereNow(ab.chars[id]); assert.deepEqual(x, M.whereNow(ba.chars[id]), `${i} × ${j} ${id}`); if (x) placed++; }
    }
    assert.ok(placed > 100, 'the pairs place the player: ' + placed);
  });
  test('whereNow on deep-frozen input: nothing written', () => {
    const c = deepFreeze(after({ quest: SS }, c => { c.checks[N[rq].key] = true; c.qsteps = { [SS]: [0] }; c.checks['bind:kib:safe-haven'] = true; }));
    assert.ok(M.whereNow(c));
    assert.ok(Object.isFrozen(c.mt.checks));
  });

  /* ---------- byPlace, placeDistance (design §5) ---------- */
  test('placeDistance: straight line on one map; another map or no coordinates is unknown (null)', () => {
    assert.equal(M.placeDistance({ map: 'altgard', x: 0, y: 0 }, { map: 'altgard', x: 3, y: 4 }), 5);
    assert.equal(M.placeDistance({ map: 'altgard', x: 0, y: 0 }, { map: 'reshanta', x: 0, y: 0 }), null);
    assert.equal(M.placeDistance({ map: null, x: null, y: null, anchor: 'kib:x', m: 9 }, { map: 'altgard', x: 0, y: 0 }), null);
    assert.equal(M.placeDistance(null, { map: 'altgard', x: 0, y: 0 }), null);
  });
  test('byPlace: the same zone first, then nearer on the same map (another map counts as unknown), then catalog order', () => {
    const here = { zone: 'z:1', pt: { map: 'A', x: 0, y: 0 } };
    const C = [
      { n: 'other zone, near', zone: 'z:2', pt: { map: 'A', x: 1, y: 0 }, catalogIndex: 0 },
      { n: 'same zone, far', zone: 'z:1', pt: { map: 'A', x: 90, y: 0 }, catalogIndex: 1 },
      { n: 'same zone, other map', zone: 'z:1', pt: { map: 'B', x: 0, y: 0 }, catalogIndex: 2 },
      { n: 'same zone, near', zone: 'z:1', pt: { map: 'A', x: 2, y: 0 }, catalogIndex: 3 },
      { n: 'same zone, no point', zone: 'z:1', pt: null, catalogIndex: 4 },
    ];
    assert.deepEqual([...C].sort(M.byPlace(here)).map(x => x.n), ['same zone, near', 'same zone, far', 'same zone, other map', 'same zone, no point', 'other zone, near']);
    assert.deepEqual([...C].reverse().sort(M.byPlace(null)).map(x => x.catalogIndex), [0, 1, 2, 3, 4]);
  });

  /* ---------- the engine on a pack of its own ---------- */
  test('a pack with places: whereNow places checks, pick-ups, objectives and the story position by its tables and hooks', () => {
    const seen = [];
    const p = M.definePack(tiny({ place: { ...PLACES, objective: (id, i) => (seen.push(['objective', id, i]), { zone: 'z:9', pt: null }),
      stamp: (f, k, v) => (seen.push([f, k, v]), k === 'mark' ? { zone: 'z:mark', pt: null } : null) } }));
    withPack(M, p, () => {
      const c = { checks: {}, mt: {} };
      c.checks.a = true; M.stamp(c, 10); assert.deepEqual(M.whereNow(c), { via: 'a', t: 10, zone: 'z:1', pt: { map: 'A', x: 3, y: 4 } });
      c.started = { b: 1 }; M.stamp(c, 20); assert.deepEqual(M.whereNow(c), { via: 'started:b', t: 20, zone: 'z:1', pt: null }, 'no giver: the zone only');
      c.qsteps = { First: [0] }; M.stamp(c, 30); assert.deepEqual(M.whereNow(c), { via: 'qsteps:First:0', t: 30, zone: 'z:9', pt: null });
      c.quest = 'First'; M.stamp(c, 40); assert.deepEqual(M.whereNow(c), { via: 'quest', t: 40, zone: 'z:1', pt: { map: 'A', x: 0, y: 0 } });
      c.storyEnd = 'First'; M.stamp(c, 50); assert.deepEqual(M.whereNow(c), { via: 'quest', t: 50, zone: 'z:1', pt: { map: 'A', x: 30, y: 40 } });
      c.checks.mark = true; M.stamp(c, 60); assert.deepEqual(M.whereNow(c), { via: 'mark', t: 60, zone: 'z:mark', pt: null });
      c.checks.unknown = true; M.stamp(c, 70); assert.equal(M.whereNow(c).via, 'mark', 'a key no table or hook places moves nothing');
      assert.deepEqual([...new Set(seen.filter(s => s[0] === 'checks').map(s => s[1]))].sort(), ['mark', 'unknown'], 'the hook gets only the keys with no node');
    });
  });
  test('a pack without `place` gets null everywhere: whereNow is null, byPlace keeps catalog order', () => {
    const p = M.definePack(tiny());
    assert.equal(p.place, null);
    withPack(M, p, () => {
      const c = { checks: { a: true }, quest: 'First', mt: {} }; M.stamp(c, 10);
      assert.equal(M.whereNow(c), null);
      assert.equal(M.nodePlaceOf('a'), null);
    });
    assert.throws(() => M.definePack(tiny({ place: { nodes: [] } })), /"place" has the wrong type/);
    assert.throws(() => M.definePack(tiny({ place: { nodes: {}, stamp: 'x' } })), /"place" has the wrong type/);
  });
};
