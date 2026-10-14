/* The finished catalog: keys unique and in their permanent forms, every regional quest placed once, bands assigned. */
import assert from 'node:assert/strict';

export default (test, M) => {
  const items = [...M.GATES, ...M.STEPS].flatMap(g => g.items);
  test('milestones sorted by level after the skill-only milestones are added', () => {
    const lv = M.GATES.map(g => g.lv); assert.deepEqual(lv, [...lv].sort((a, b) => a - b)); assert.ok(M.GATES.some(g => g.id === 'g19') && M.GATES.some(g => g.id === 'g28'));
  });
  test('item keys are unique across milestones and route rules', () => {
    const ks = items.filter(it => it.k).map(it => it.k), dup = ks.filter((k, i) => ks.indexOf(k) !== i);
    assert.deepEqual(dup, []);
  });
  test('every regional quest is placed once, keyed rq:<id>, at or below its recommended level', () => {
    for (const q of M.RQ) {
      const at = M.GATES.filter(g => g.items.some(it => it.k === 'rq:' + q.id));
      assert.equal(at.length, 1, q.name); assert.ok(at[0].lv <= q.rec || at[0] === M.GATES[0], q.name);
      assert.equal(M.RQ_K('rq:' + q.id).q, q); assert.equal(M.RQ_BY[q.name], q);
    }
  });
  test('Sealed Dungeons keyed sd: (g10h: at Lv 10), Strongholds sh:, each in one band', () => {
    const ks = M.AREA_ITEMS.map(x => x.k); assert.equal(new Set(ks).size, ks.length);
    for (const x of M.AREA_ITEMS) {
      assert.match(x.k, x.it.kind === 'stronghold' ? /^sh:[a-z0-9-]+$/ : /^(sd|g10h):[a-z0-9-]+$/);
      assert.ok(M.AREA_BANDS.includes(M.bandOf(x)), x.k);
    }
    assert.equal(M.AREA_ITEMS.filter(x => x.it.kind === 'stronghold').length, M.SH_DATA.length);
  });
  test('skill upgrades are in the milestone at or after their unlock level, in gi/gj order', () => {
    for (const x of M.SP_STEPS.filter(x => !x.s.extra)) {
      const g = M.GATES[x.gi]; assert.ok(g.items.some(it => it.k === x.k), x.k); assert.ok(g.lv >= x.req && (x.gi === 0 || M.GATES[x.gi - 1].lv < x.req), x.k);
    }
  });
  test('itemByK finds every keyed item; cardRows lists non-quest rows first, never sub-headings, board nodes or dungeons', () => {
    for (const it of items) if (it.k) assert.ok(M.itemByK(it.k), it.k);
    for (const g of M.GATES) {
      const rows = M.cardRows(g), firstQ = rows.findIndex(r => r.it.kind === 'quest');
      assert.ok(firstQ < 0 || rows.slice(firstQ).every(r => r.it.kind === 'quest'), g.id);
      assert.ok(rows.every(r => !r.it.sub && !r.it.dv && r.it.kind !== 'hideout' && !r.it.hidden), g.id);
    }
  });
  test('clear rewards: Sealed Dungeons and regional quests credit, Strongholds nothing', () => {
    const sd = M.AREA_ITEMS.find(x => x.it.kind === 'hideout'), sh = M.AREA_ITEMS.find(x => x.it.kind === 'stronghold');
    assert.ok(M.CLEAR_REWARD(sd.k).st > 0); assert.equal(M.CLEAR_REWARD(sh.k), null);
    const q = M.RQ.find(q => q.rw); assert.deepEqual(M.CLEAR_REWARD('rq:' + q.id), q.rw);
  });
};
