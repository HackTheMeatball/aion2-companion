/* Game rules from pack data (0.4 P2a, #141): src/data/build.js builds spCost, SPEC_SLOT_LV, DV_MIN and ST_COST from the
   compiled rules (rule:skill-point-cost, rule:specialty-slots, rule:node-costs, rule:stigma-shard-cost) instead of writing
   them out. The values are pinned here as main returned them before the move (7d17146), for every input the app gives:
   skill levels 2–10, stigma levels 1–21 (21 = past the cap: null). The milestones g19 and g28 come from the guide pack. */
import assert from 'node:assert/strict';

export default (test, M) => {
  test('spCost(L), L 2–10: as on main', () => {
    assert.deepEqual([2, 3, 4, 5, 6, 7, 8, 9, 10].map(M.spCost), [1, 1, 1, 2, 2, 2, 4, 4, 4]);
  });
  test('ST_COST(L), L 1–21: as on main', () => {
    assert.deepEqual(Array.from({ length: 21 }, (_, i) => M.ST_COST(i + 1)), [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 4, 4, 4, 4, 4, 8, 8, 8, 8, 8, null]);
  });
  test('SPEC_SLOT_LV and DV_MIN: as on main', () => {
    assert.deepEqual(M.SPEC_SLOT_LV, [8, 12, 20]);
    assert.deepEqual(M.DV_MIN, { p: 2, a: 3, c: 4 });
  });
  test('milestones g19 and g28 from the guide pack, in level order; g28:exp has no gate node', () => {
    const at = id => M.GATES.findIndex(g => g.id === id), lvs = M.GATES.map(g => g.lv);
    assert.ok(at('g19') > at('g16') && at('g19') < at('g20') && at('g28') > at('g27') && at('g28') < at('g30'));
    assert.deepEqual(lvs, lvs.slice().sort((a, b) => a - b));
    const g19 = M.GATES[at('g19')], g28 = M.GATES[at('g28')];
    assert.deepEqual([g19.lv, g19.title, g28.lv, g28.title], [19, 'Skill tier: level 8', 28, 'Heart Gore 10 and Urugugu Canyon']);
    const exp = g28.items.find(it => it.k === 'g28:exp');
    assert.ok(exp && exp.opt && exp.map === 'urugugu-canyon' && exp.t.includes('data-tip="expedition"'));
    assert.equal(Object.values(M.GATE_GRAPH.nodes).some(n => n.key === 'g28:exp') || 'g28:exp' in M.GATE_GRAPH.nodes, false);
  });
};
