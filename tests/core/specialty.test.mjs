/* Specialty slots 1–3 on effective skill level (0.3 E7, docs/design/0.3-requirement-engine.md §9, bug F3; rule:specialty-slots).
   Effective level = the highest ticked skill line sp:<skill>:<L> (1 if none) + the adds of every ticked plan board node on
   the skill. Core cases: bought lines only; bought + plan nodes; the cap of 14 (10 from points + 4 board nodes), so slot 3
   (20) never opens and is never offered (Q5). Picks per slot: the build's, only once the choice is open at that level (Q6).
   The switch specialtySlots off gives 0.2's slot 1 (the level of the skill's line 8) and no slots 2 / 3. Nothing is written:
   the keys sp:<skill>:spec2 / :spec3 exist only once the player ticks them. */
import assert from 'node:assert/strict';

const FLAGS = { seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true };
const S = (o = {}) => ({ checks: {}, level: 45, hide: false, open: {}, quest: '', mode: 'advanced', ...FLAGS, ...o });
const deepFreeze = o => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const v of Object.values(o)) deepFreeze(v); } return o; };
const tick = keys => Object.fromEntries(keys.map(k => [k, true]));

/* a hand-made graph: skill k with lines 2–10, two plan nodes on it (one adds 2), slots at 8 / 12 / 20 */
const SK = 'skill:t:k';
const G = { story: [['sq:0', 'Q0']], nodes: {
  ...Object.fromEntries(Array.from({ length: 9 }, (_, i) => i + 2).map(L => [`sp:K:${L}`, { kind: 'skill', key: `sp:K:${L}`, skill: SK, L, req: { level: 1, basis: 'rule' }, done: ['tick'] }])),
  'board:b': { kind: 'board', req: { all: [] }, done: [] },
  'dv:a': { kind: 'plan', key: 'dv:a', board: 'board:b', skill: SK, adds: 1, req: { level: 12, basis: 'rule' }, done: ['tick'] },
  'dv:b': { kind: 'plan', key: 'dv:b', board: 'board:b', skill: SK, adds: 2, req: { level: 12, basis: 'rule' }, done: ['tick'] },
  'dv:other': { kind: 'plan', key: 'dv:other', board: 'board:b', skill: 'skill:t:other', adds: 1, req: { level: 12, basis: 'rule' }, done: ['tick'] },
  ...Object.fromEntries([8, 12, 20].map((lv, i) => [`sp:K:spec${i ? i + 1 : ''}`, { kind: 'spec', key: `sp:K:spec${i ? i + 1 : ''}`, skill: SK, slot: i + 1, req: { skillLv: lv, skill: SK, basis: 'rule' }, done: ['tick'] }])),
} };

export default (test, M) => {
  const ALL = Object.keys(M.GATE_CHANGES);
  const withChanges = (names, fn) => { const on = ALL.filter(M.gateChangeOn); M.setGateChanges(names); try { return fn(); } finally { M.setGateChanges(on); } };
  const e = checks => M.evaluate({ checks, level: 45, quest: 'Q0' }, { graph: G });
  const lines = (n, to) => Array.from({ length: to - 1 }, (_, i) => `sp:${n}:${i + 2}`);

  test('effective level (atom skillLv): bought lines only: the highest ticked line, 1 with none, gaps ignored', () => {
    assert.equal(e({}).skillLv(SK), 1);
    assert.equal(e(tick(lines('K', 7))).skillLv(SK), 7);
    assert.equal(e(tick(['sp:K:8'])).skillLv(SK), 8, 'the highest ticked line, even with lower ones unticked');
    assert.equal(e({ 'sp:K:9': false, 'sp:K:5': true }).skillLv(SK), 5, 'an un-tick (stored false) does not count');
    const r = e(tick(lines('K', 7))).node('sp:K:spec');
    assert.equal(r.open, false);
    assert.deepEqual(r.blockers, [{ kind: 'skill', skill: SK, need: 8, have: 7 }]);
    assert.deepEqual(r.root, r.blockers[0]); assert.deepEqual(r.eta, {}, 'no level or story opens it');
    assert.equal(r.basis, 'rule');
    assert.equal(e(tick(lines('K', 8))).node('sp:K:spec').open, true);
  });

  test('effective level: bought lines + owned plan nodes on the skill (their adds; another skill\'s node never counts)', () => {
    assert.equal(e(tick([...lines('K', 7), 'dv:a'])).skillLv(SK), 8);
    assert.equal(e(tick([...lines('K', 7), 'dv:a'])).node('sp:K:spec').open, true, 'line 7 + one node opens slot 1');
    assert.equal(e(tick([...lines('K', 10), 'dv:a', 'dv:b', 'dv:other'])).skillLv(SK), 13);
    assert.equal(e(tick(['dv:a', 'dv:b'])).skillLv(SK), 4, 'nodes alone: 1 + their adds');
    const r = e(tick([...lines('K', 10), 'dv:b'])); assert.equal(r.node('sp:K:spec2').open, true); assert.equal(r.node('sp:K:spec3').open, false);
    assert.deepEqual(r.node('sp:K:spec3').blockers, [{ kind: 'skill', skill: SK, need: 20, have: 12 }]);
  });

  /* the live data: every specialty skill, its lines and its plan nodes */
  const N = M.GATE_GRAPH.nodes, slot1 = M.SP_STEPS.filter(x => x.slot === 1);
  const skillOf = x => N[x.k].skill, planOf = x => Object.values(N).filter(n => n.kind === 'plan' && n.skill === skillOf(x)).map(n => n.key);

  test('live data: Heart Gore bought only (8 opens slot 1, not slot 2), + 2 plan nodes (12 opens slot 2), all 4 nodes (14, the cap)', () => {
    const x = slot1.find(y => y.s.n === 'Heart Gore'), plan = planOf(x), ev = c => M.evaluate(c);
    assert.equal(plan.length, 4, 'one Heart Gore node per board in the plan');
    const c8 = { checks: tick(lines('Heart Gore', 8)), level: 45 };
    assert.equal(ev(c8).skillLv(skillOf(x)), 8); assert.equal(ev(c8).byKey('sp:Heart Gore:spec').open, true); assert.equal(ev(c8).byKey('sp:Heart Gore:spec2').open, false);
    const c12 = { checks: tick([...lines('Heart Gore', 10), ...plan.slice(0, 2)]), level: 45 };
    assert.equal(ev(c12).skillLv(skillOf(x)), 12); assert.equal(ev(c12).byKey('sp:Heart Gore:spec2').open, true);
    const c14 = { checks: tick([...lines('Heart Gore', 10), ...plan]), level: 45 };
    assert.equal(ev(c14).skillLv(skillOf(x)), 14); assert.equal(ev(c14).byKey('sp:Heart Gore:spec3').open, false);
  });

  test('cap 14: for every specialty skill, every line and every plan node ticked stays below slot 3 (20); slot 3 is never offered (Q5)', () => {
    const all = tick([...M.SP_STEPS.map(x => x.k), ...M.DV_NODES().map(it => it.k)]);
    for (const x of slot1) {
      const eff = M.evaluate({ checks: all, level: 45 }).skillLv(skillOf(x));
      assert.ok(eff >= 10 && eff <= 14, `${x.s.n}: ${eff}`);
      assert.equal(M.openOf(M.char(S({ checks: all })), `${x.k}3`), false, x.s.n);
    }
    const c = M.char(S({ checks: all }));
    assert.ok(!M.skillOpen(c).now.some(x => x.slot === 3));
    assert.ok(M.skillOpen(c).open.some(x => x.slot === 3), 'slot 3 is still listed (Skills card)');
    assert.ok(!M.rankNext(S({ checks: all })).some(a => a.x && a.x.slot === 3));
    /* what the plan reaches per skill (the Skills card lists a slot above it but never makes it the hero) */
    const reach = Object.fromEntries(slot1.map(x => [x.s.n, M.planReachOf(x)]));
    for (const x of slot1) assert.equal(reach[x.s.n], M.evaluate({ checks: all, level: 45 }).skillLv(skillOf(x)), x.s.n);
    assert.ok(Object.values(reach).every(r => r < 20) && Math.max(...Object.values(reach)) === 14, JSON.stringify(reach));
  });

  test('picks per slot (Q6): the build\'s pick once its choice is open at the effective level; else none ("pick a specialty")', () => {
    const row = (n, slot) => [...M.SP_STEPS, ...M.SP_SLOTS].find(x => x.s.n === n && x.slot === slot);
    const at = (n, to, nodes) => { const x = row(n, 1); return M.char(S({ checks: tick([...lines(n, to), ...planOf(x).slice(0, nodes)]) })); };
    assert.equal(M.specPickOf(at('Heart Gore', 10, 2), row('Heart Gore', 2)).t, 'Multi-Hit on hit');
    assert.equal(M.specPickOf(at('Quick Slice', 10, 2), row('Quick Slice', 2)).lv, 12);
    assert.equal(M.specPickOf(at('Heart Gore', 10, 4), row('Heart Gore', 3)), null, 'slot 3 (Reset, needs skill 16) is past the cap of 14');
    assert.equal(row('Heart Gore', 3).s.specs[2].lv, 16);
    /* research #77 at 8dd047d: Insignia Explosion slot 2 is disputed, Savage Roar slot 2 contested: no pick */
    for (const n of ['Insignia Explosion', 'Savage Roar']) {
      assert.equal(row(n, 2).s.specs.length, 1, `${n}: slot 1 pick only`);
      assert.equal(M.specPickOf(at(n, 10, 4), row(n, 2)), null, `${n} slot 2: "pick a specialty"`);
    }
    assert.equal(M.specPickOf(at('Ambush', 10, 1), row('Ambush', 2)), null, 'no 2-source pick: none');
    assert.equal(M.specPickOf(at('Shadowstrike', 10, 1), row('Shadowstrike', 3)), null);
    for (const x of slot1) assert.equal(M.specPickOf(at(x.s.n, 8, 0), x).t, x.s.spec, 'slot 1: today\'s pick');
  });

  test('switch specialtySlots off: slot 1 at the level of the skill\'s line 8 with nothing bought, no slots 2 / 3 (0.2)', () => {
    const others = ALL.filter(n => n !== 'specialtySlots');
    const x = slot1.find(y => y.s.n === 'Heart Gore'), c = lv => M.char(S({ level: lv }));
    withChanges(others, () => {
      assert.equal(M.openOf(c(x.req), x.k), true); assert.equal(M.openOf(c(x.req - 1), x.k), false);
      assert.ok(!M.skillOpen(c(45)).open.some(y => y.slot > 1));
    });
    assert.equal(M.openOf(c(45), x.k), false, 'on: nothing bought, effective 1');
    assert.ok(M.skillOpen(c(45)).open.some(y => y.slot === 2));
  });

  test('keys: Next up offers slot 2 once open (sp:<skill>:spec2), nothing is written, slot 1 untouched', () => {
    const x = slot1.find(y => y.s.n === 'Heart Gore');
    const s = deepFreeze(S({ checks: tick([...M.SP_STEPS.map(y => y.k), ...planOf(x).slice(0, 2)]), stones: 99 }));
    const cards = M.rankNext(s), sk = cards.filter(a => a.kind === 'skill');
    assert.deepEqual(sk.map(a => a.x.k), ['sp:Heart Gore:spec2']);
    assert.equal(sk[0].act, 'skill');
    assert.ok(!('sp:Heart Gore:spec2' in s.checks) && !('sp:Heart Gore:spec3' in s.checks));
    assert.equal(M.skillBuy(M.char(s)).k, 'sp:Heart Gore:spec2');
  });
};
