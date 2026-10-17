/* The pack holder (src/core/pack.js, 0.4 P2b; docs/design/0.4-engine-contract.md §2): definePack validates a spec and fills
   every hook's default, usePack / activePack hold the one pack the engine reads, and the AION 2 pack hands the engine
   the tables it used to import. */
import assert from 'node:assert/strict';

/* the smallest pack: only the required keys (P6's fake game starts here) */
const tiny = () => ({ id: 'tiny', data: { graph: { story: [['q:1', 'First']], nodes: { 'a': { kind: 'step', key: 'a', req: { all: [] }, done: ['tick'] } } }, story: { quests: [[1, 'First']], steps: {} } },
  catalog: { milestones: [{ id: 'm1', lv: 1, items: [{ k: 'a', t: '<b>Do A</b>' }] }], routes: [] } });
/* run fn with pack p active, then put the AION 2 pack back (the rest of the suite reads it) */
const withPack = (M, p, fn) => { M.usePack(p); try { return fn(); } finally { M.usePack(M.aion2Pack); } };

export default (test, M) => {
  test('definePack: only id, data and catalog are required; every hook gets its "none" default; the pack is frozen', () => {
    const p = M.definePack(tiny());
    assert.ok(Object.isFrozen(p));
    assert.deepEqual([p.charFields, p.keptRules, p.gateChanges, p.graphTransforms, p.nextUpProducers, p.cards, p.nowRenderers, p.rowRenderers, p.rowHooks, p.text], [{}, {}, {}, [], [], [], {}, {}, {}, {}]);
    assert.deepEqual(p.character, { pack: 'tiny', class: '' });
    assert.deepEqual(p.data.proposed, {}); assert.deepEqual(p.data.story.notes, {});
    assert.equal(p.catalog.rowKind({}), 'main'); assert.equal(p.catalog.offered({}, 'a'), true);
    assert.deepEqual(p.story.levelGate({ level: 1 }), { gated: false, gateLv: 0 });
    assert.deepEqual([p.story.isTalkOnly('x'), p.story.subs('x'), p.story.here({}), p.story.meanwhile({}, {})], [false, [], null, null]);
    assert.deepEqual([p.hopName, p.locate('a'), p.skipLocation('a')], [null, null, false]);
  });
  test('definePack: an unknown key, a missing required key or a hook of the wrong type throws', () => {
    assert.throws(() => M.definePack({ ...tiny(), nextUpProducer: [] }), /unknown key "nextUpProducer"/);
    for (const k of ['id', 'data', 'catalog']) { const s = tiny(); delete s[k]; assert.throws(() => M.definePack(s), new RegExp(`"${k}" is required`)); }
    assert.throws(() => M.definePack({ ...tiny(), onLoad: {} }), /"onLoad" has the wrong type/);
    assert.throws(() => M.definePack({ ...tiny(), charFields: { x: 'sometimes' } }), /"charFields" has the wrong type/);
    assert.throws(() => M.definePack({ ...tiny(), graphTransforms: [{ id: 't', when: 'sometimes', apply: g => g }] }), /"graphTransforms" has the wrong type/);
    assert.throws(() => M.definePack({ ...tiny(), story: { here: 1 } }), /"story.here"/);
    assert.throws(() => M.definePack({ ...tiny(), story: { hre: () => null } }), /"story.hre"/);
    assert.throws(() => M.definePack({ ...tiny(), catalog: { ...tiny().catalog, rowKind: 'main' } }), /"catalog.rowKind"/);
    assert.throws(() => M.definePack({ ...tiny(), rowRenderers: { quest: '<li>' } }), /"rowRenderers" has the wrong type/);
    assert.throws(() => M.definePack({ ...tiny(), rowHooks: { sync: true } }), /"rowHooks" has the wrong type/);
  });
  test('usePack / activePack: the active pack; usePack refuses a spec that is not a defined pack', () => {
    assert.equal(M.activePack(), M.aion2Pack);
    assert.throws(() => M.usePack(tiny()), /not a pack/);
    const p = M.definePack(tiny());
    withPack(M, p, () => assert.equal(M.activePack(), p));
    assert.equal(M.activePack(), M.aion2Pack);
  });
  test('the engine on a pack with no hooks: its graph, its story, every row a main row, hops named by their row', () => {
    const p = M.definePack(tiny());
    withPack(M, p, () => {
      const s = M.newSave({ id: 'slot-t' }), c = M.char(s);
      assert.deepEqual([c.pack, c.class], ['tiny', '']);
      M.migrate(s, false, () => {}, 0);
      assert.deepEqual([c.level, c.quest], [1, 'First']);
      assert.deepEqual(M.charFields(), M.ENGINE_FIELDS);
      assert.equal(M.gatesOf(c).byKey('a').open, true);
      assert.deepEqual(M.countsOf(s, p.catalog.milestones[0]), [0, 1]);
      assert.deepEqual(M.openSteps(s, p.catalog.milestones[0]).map(x => x.k), ['a']);
      assert.equal(M.itemByK('a'), p.catalog.milestones[0].items[0]);
      assert.equal(M.gateChangeOn('derived'), true, 'a switch the pack does not declare reads as on');
      assert.equal(M.storyIdx('First'), 0);
    });
  });
  test('the AION 2 pack hands the engine its compiled data and tables (no engine module imports them)', () => {
    const p = M.aion2Pack;
    assert.equal(p.id, 'aion2');
    assert.equal(p.data.graph, M.GATE_GRAPH); assert.equal(p.data.proposed, M.GATE_PROPOSED);
    assert.equal(p.data.story.quests, M.QUESTS); assert.equal(p.data.story.steps, M.QUEST_STEPS); assert.equal(p.data.story.notes, M.QUEST_STEP_NOTES);
    assert.equal(p.catalog.milestones, M.GATES); assert.equal(p.catalog.routes, M.STEPS);
    assert.equal(p.gateChanges, M.GATE_CHANGES); assert.equal(p.keptRules, M.KEPT_RULES);
    assert.deepEqual(p.character, { pack: M.PACK, class: M.CLASS });
    /* the transforms in P0's order: the three always-on ones, then one per switch they stand in for */
    assert.deepEqual(p.graphTransforms.map(t => t.when === 'always' ? t.id : `${t.id} (off: ${t.when.off})`), ['stronghold-band', 'stigma-slot-1-after-g22:0', 'skill-line-level',
      'regional-0.2 (off: regionalTurnedIn)', 'story-step (off: storyStepDerived)', 'e5-merchantGate (off: merchantGate)', 'e5-lestWeForgetGate (off: lestWeForgetGate)',
      'e5-beltGate (off: beltGate)', 'e5-amuletGate (off: amuletGate)', 'e5-daevanionGate (off: daevanionGate)', 'specialty-slots (off: specialtySlots)']);
    for (const t of p.graphTransforms) if (t.when !== 'always') assert.ok(p.gateChanges[t.when.off], t.id + ': its switch is in the table');
  });
};
