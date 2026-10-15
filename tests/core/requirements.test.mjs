/* Requirements: what is open, done, affordable or next. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const FLAGS = { seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true };
const S = (o = {}) => ({ checks: {}, level: 5, hide: false, open: {}, quest: '', ...FLAGS, ...o });

export default (test, M) => {
  const qAt = n => M.QUESTS[M.storyIdx(n)][1], qBefore = n => M.QUESTS[M.storyIdx(n) - 1][1];
  test('story index and current quest', () => {
    assert.equal(M.storyIdx(M.QUESTS[7][1]), 7); assert.equal(M.questIdx(S()), -1); assert.equal(M.questIdx(S({ quest: M.QUESTS[7][1] })), 7);
    assert.equal(M.questIdx(S({ quest: 'Not a quest' })), -1);
  });
  /* the level a regional quest opens at: its unlock level, or with no prerequisite data (noPre) its recommended level */
  const openLv = q => q.noPre ? Math.max(q.unlocksAt || 0, q.rec) : (q.unlocksAt || q.rec);
  test('regional quest: closed below its unlock level and before its story quest, open at it', () => {
    const q = M.RQ.find(q => q.story && !q.after.length && M.storyIdx(q.story) > 0);
    assert.equal(M.rqStatus(S({ level: 45 }), q).open, false);
    assert.equal(M.rqStatus(S({ level: 45, quest: qBefore(q.story) }), q).open, false);
    assert.deepEqual(M.rqStatus(S({ level: 45, quest: qAt(q.story) }), q), { open: true, ok: true, pre: [] });
    assert.equal(M.rqStatus(S({ level: openLv(q) - 1, quest: qAt(q.story) }), q).open, false);
    assert.equal(M.rqStatus(S({ level: 5, quest: qAt(q.story) }), q, openLv(q)).open, true, 'lv argument: the gate at that level');
  });
  test('regional quest follow-up: open but not ok until the quests before it are turned in', () => {
    const q = M.RQ.find(q => q.after.length), quest = M.QUESTS[M.QUESTS.length - 1][1];
    assert.deepEqual(M.rqStatus(S({ level: 45, quest }), q), { open: true, ok: false, pre: q.after });
    const checks = Object.fromEntries(q.after.map(n => ['rq:' + M.RQ_BY[n].id, true]));
    assert.deepEqual(M.rqStatus(S({ level: 45, quest, checks }), q), { open: true, ok: true, pre: [] });
  });
  test('no prerequisite data (noPre): open from the recommended level', () => {
    const end = M.QUESTS[M.QUESTS.length - 1][1], qs = M.RQ.filter(q => q.noPre);
    assert.ok(qs.length > 0);
    for (const q of qs) {
      const s = lv => S({ level: lv, quest: end, storyEnd: end, checks: Object.fromEntries(q.after.map(n => ['rq:' + M.RQ_BY[n].id, true])) });
      assert.equal(M.rqStatus(s(openLv(q) - 1), q).open, false, `${q.name} below Lv ${openLv(q)}`);
      assert.equal(M.rqStatus(s(openLv(q)), q).ok, true, `${q.name} at Lv ${openLv(q)}`);
    }
  });
  test('quest progress: true from old saves counts as in progress', () => {
    assert.equal(M.qProgOf(S({ started: { a: true, b: 1 } }), 'a'), 1); assert.equal(M.qProgOf(S(), 'a'), 0);
  });
  test('optional tasks count once ticked; the Optional filter hides them', () => {
    const g = { id: 't', items: [{ k: 't:0', t: '' }, { k: 't:opt', opt: true, t: '' }] };
    assert.deepEqual(M.countsOf(S(), g), [0, 1]);
    assert.deepEqual(M.countsOf(S({ checks: { 't:opt': true } }), g), [1, 2]);
    assert.deepEqual(M.countsOf(S({ checks: { 't:opt': true }, hideOpt: true }), g), [0, 1]);
  });
  test('open steps: a story-gated step waits for the story; a turned-in gate waits for "Turned in"', () => {
    const g22 = M.GATES.find(g => g.id === 'g22'), g45 = M.GATES.find(g => g.id === 'g45'), ks = (s, g) => M.openSteps(s, g).map(x => x.k);
    assert.ok(!ks(S({ level: 22, quest: qBefore('Daeva in a Dream') }), g22).includes('g22:0'));
    assert.ok(ks(S({ level: 22, quest: 'Daeva in a Dream' }), g22).includes('g22:0'));
    assert.ok(!ks(S({ level: 45, quest: 'Forgotten Commander' }), g45).includes('g45:0'));
    assert.ok(ks(S({ level: 45, quest: 'Forgotten Commander', storyEnd: 'Forgotten Commander' }), g45).includes('g45:0'));
  });
  test('open steps: a step that is a story quest (byStory) is never offered (the story card and "Turned in" cover it)', () => {
    const g6 = M.GATES.find(g => g.id === 'g6'), q = 'The Being Beneath the Lake';
    for (const quest of [qBefore(q), q, M.QUESTS[M.storyIdx(q) + 1][1]]) assert.ok(!M.openSteps(S({ level: 6, quest }), g6).some(x => x.k === 'g6:0'), quest);
  });
  test('skill points: level table + Wisdom Stones − ticked lines', () => {
    assert.deepEqual(M.skillPoints(S({ level: 12 })), { fromLevels: 24, stones: 0, spent: 0, pts: 24 });
    const x = M.SP_STEPS.find(x => x.cost === 4), p = M.skillPoints(S({ level: 12, stones: 3, checks: { [x.k]: true } }));
    assert.deepEqual(p, { fromLevels: 24, stones: 3, spent: 4, pts: 23 });
    assert.equal(M.skillPoints(S({ level: 4, checks: { [x.k]: true } })).pts, 0);
  });
  test('skill to buy: the first open upgrade at your level, only with the points for it', () => {
    const s = S({ level: 12 }), { now } = M.skillOpen(s);
    assert.equal(M.skillBuy(s), now[0]); assert.equal(M.skillBuy(S({ level: 1 })), null);
  });
  test('shards and board points from levels', () => {
    assert.deepEqual([22, 23, 39, 40, 45].map(M.shardsFromLv), [0, 1, 17, 19, 29]);
    assert.deepEqual([11, 12, 45].map(M.dvFromLv), [0, 4, 136]);
  });
  test('board: a node ticks only with its cost logged and the points for it', () => {
    const n = M.DV_NODES()[0];
    assert.deepEqual(M.dvGateOf(S({ dvTotal: 10 }), n.k), { off: true, warn: '' });
    assert.deepEqual(M.dvGateOf(S({ dvTotal: 2, dvCost: { [n.k]: 3 } }), n.k), { off: true, warn: 'needs 3, 2 left' });
    assert.deepEqual(M.dvGateOf(S({ dvTotal: 5, dvCost: { [n.k]: 3 } }), n.k), { off: false, warn: '' });
    assert.equal(M.dvSpent(S({ dvAdj: 2, dvCost: { [n.k]: 3 }, checks: { [n.k]: true } })), 5);
    assert.equal(M.dvNeed(S(), n), { p: 2, a: 3, c: 4 }[n.ty]);
    assert.equal(M.dvNext(S(), 11), undefined); assert.equal(M.dvNext(S(), 12), n);
  });
  test('stigma slots: picks, duplicates fall back to the plan', () => {
    const P = M.STIGMA_PLAN;
    assert.deepEqual(M.slotNames(S()), P);
    assert.deepEqual(M.slotNames(S({ stPick: { 1: P[1], 2: P[1] } })), [P[1], P[0], P[2], P[3]]);
    assert.deepEqual(M.stigmaSlots(S()).map(x => [x.n, x.lv]), [[1, 22], [2, 27], [3, 32], [4, 37]]);
  });
  test('stigma plan: equipped stigmas up to their targets, shard cost per level', () => {
    const s = S({ checks: { 'g22:1': true }, stLv: { [M.STIGMA_PLAN[0]]: 8 } });
    assert.deepEqual(M.stigmaPlan(s).map(x => [x.x.name, x.L, x.cost]), [[M.STIGMA_PLAN[0], 9, 2], [M.STIGMA_PLAN[0], 10, 2]]);
  });
  test('F5: learning a stigma is its level 1 and costs 1 point; the plan counts it (owner-confirmed)', () => {
    /* docs/feedback/2026-10-14-owner.md F5: unlocking costs 1 point and the stigma starts at Lv 1. ST_COST(1) is that
       learn cost, it matches rule:stigma-shard-cost, upgrades start at Lv 2, and the plan total includes one learn per
       planned stigma. */
    const rule = JSON.parse(readFileSync(new URL('../../data/shared/rules.json', import.meta.url), 'utf8')).records.find(r => r.id === 'rule:stigma-shard-cost');
    for (const { from, to, cost } of rule.value) for (let L = from; L <= to; L++) assert.equal(M.ST_COST(L), cost, `ST_COST(${L})`);
    assert.equal(M.ST_COST(1), 1);
    const n = M.STIGMA_PLAN[0], s = S({ checks: { 'g22:1': true } });
    assert.equal(M.stLvOfC(s, n), 1, 'an equipped stigma starts at Lv 1');
    const T = M.ST_TARGETS.find(([m]) => m === n)[1], up = M.stigmaPlan(s).filter(x => x.x.name === n);
    assert.deepEqual(up.map(x => x.L), Array.from({ length: T - 1 }, (_, i) => i + 2), 'upgrades run Lv 2 .. target; Lv 1 is the learn');
    const stC = t => { let c = 0; for (let L = 1; L <= t; L++) c += M.ST_COST(L); return c; };
    assert.equal(up.reduce((t, x) => t + x.cost, 0) + M.ST_COST(1), stC(T), 'learn + upgrades = cost to reach the target');
    const tgt = nm => (M.ST_TARGETS.find(([m]) => m === nm) || [nm, 1])[1];
    assert.equal(M.STIGMA_PLAN.reduce((t, nm) => t + stC(tgt(nm)), 0), 92, 'plan: Triniel 10 (15) + Illusive Clone 20 (75) + two learned at Lv 1 (1 + 1)');
  });
  test('objectives: talk-only steps hidden unless shown; multi-part steps split', () => {
    assert.equal(M.objLow('Report — talk to Hadala'), true); assert.equal(M.objLow('Turn in — talk to Hadala'), false);
    assert.deepEqual(M.objSubs('Collect — collect A, B, C (Kibelisk: X)'), ['collect A', 'collect B', 'collect C']);
    const list = ['Report — talk to Hadala', 'Go — kill 3 wolves'];
    assert.deepEqual(M.objIdxOf(S(), list), [1]); assert.deepEqual(M.objIdxOf(S({ showTalk: true }), list), [0, 1]);
  });
  /* F7: the Build drawer's rotation lists only what the guide says you have at your level. */
  const learnLv = n => M.SP_STEPS.find(x => x.s.n === n && x.L === 2).req, all = k => [...k.rmb, ...k.q, ...k.e];
  test('rotation: a skill is absent below its learn level and present from it (Ambush 3, Heart Gore 4, Insignia Explosion 14)', () => {
    for (const n of ['Ambush', 'Heart Gore', 'Insignia Explosion']) {
      const L = learnLv(n);
      assert.ok(!M.rotKeys(S({ level: L - 1 }), L - 1).rmb.includes(n), `${n} listed at Lv ${L - 1}`);
      assert.ok(M.rotKeys(S({ level: L }), L).rmb.includes(n), `${n} missing at Lv ${L}`);
    }
    assert.deepEqual(M.rotKeys(S({ level: 1 }), 1), { rmb: ['Savage Roar'], q: ['Shadowstrike'], e: [] });
  });
  test('rotation: uses the Skills card unlock rule (the skill line\'s gate), not the key-stack rows', () => {
    /* since E2 both read the evaluator's gate of the skill's first line (GATE_GRAPH, rule:skill-level-gate), so the
       0.2 version of this check (moving SP_STEPS req) no longer reaches it; instead: at every level, the right-click
       row is the stack minus every skill whose first line the Skills card doesn't offer yet */
    for (let lv = 1; lv <= 45; lv++) {
      const now = M.skillOpen(S({ level: lv })).now, card = n => now.some(x => x.s.n === n && x.L === 2);
      assert.deepEqual(M.rotKeys(S({ level: lv }), lv).rmb, M.RMB_STACK(lv).filter(card), `Lv ${lv}`);
    }
    for (const x of M.SP_STEPS.filter(x => x.L === 2)) for (let lv = 1; lv <= 45; lv++)
      assert.equal(M.skillLearned(x.s.n, lv), M.openOf(S({ level: lv }), x.k), `${x.s.n} at Lv ${lv}: skillLearned = the first line's gate`);
    assert.equal(M.skillLearned('Not a skill', 45), false);
  });
  test('rotation: at every level, every listed skill is one the Skills card has unlocked; stigmas only from their slot level', () => {
    for (let lv = 1; lv <= 45; lv++) {
      const k = M.rotKeys(S({ level: lv }), lv);
      for (const n of [...k.rmb, ...k.q]) assert.ok(learnLv(n) <= lv, `${n} at Lv ${lv}`);
      const open = M.stigmaSlots(S()).filter(x => lv >= x.lv).map(x => x.name);
      assert.deepEqual(k.e, M.E_ORDER.filter(n => open.includes(n)), `E at Lv ${lv}`);
    }
  });
  test('rotation: an equipped stigma waits for its slot level; equipped ones replace the open-slot fallback', () => {
    const sl = M.stigmaSlots(S()), s2 = sl.find(x => x.n === 2), s1 = sl.find(x => x.n === 1);
    const c = S({ checks: { [s1.k]: true, [s2.k]: true } });
    assert.deepEqual(M.rotKeys(c, s2.lv - 1).e, [s1.name]);
    assert.deepEqual(new Set(M.rotKeys(c, s2.lv).e), new Set([s1.name, s2.name]));
    assert.ok(!all(M.rotKeys(c, s1.lv - 1)).includes(s1.name));
  });
};
