/* Next up ranking: order rules, Basic filter and cap, and a gate sweep (the browser `gates` suite's rules over every
   story position × several levels, in Node). */
import assert from 'node:assert/strict';

import { createRequire } from 'node:module';
/* a test save in the v5 shape (tests/support/save.js) */
const { toStored } = createRequire(import.meta.url)('../support/save.js');
const S = (o = {}) => toStored({ checks: {}, level: 5, hide: false, open: {}, quest: '', mode: 'advanced', ...o });
const ACTIONABLE = ['step', 'missed', 'adv'];

export default (test, M) => {
  const qi = n => M.storyIdx(n), kinds = cs => cs.map(c => c.kind);
  /* 0.5 P11: the ranking switches of smart Next up (docs/design/0.4-smart-next-up.md §12); P12 ships ascensionFirst and
     placeRank on, P13 catchUp and etaLater, P14 trackFilter and bandLabels, P15 the pack's bindDerived and bindNudge,
     P16 its travelAdvice */
  const SHIPPED_ON = ['ascensionFirst', 'placeRank', 'trackFilter', 'bandLabels', 'catchUp', 'etaLater', 'bindDerived', 'bindNudge', 'travelAdvice'];
  /* in the golden snapshots before this step (--explain keeps them on): P12's, P13's, P14's and P15's */
  const BASELINE = ['ascensionFirst', 'placeRank', 'trackFilter', 'bandLabels', 'catchUp', 'etaLater', 'bindDerived', 'bindNudge'];
  test('ranking switches: the engine\'s and the pack\'s tables, on as shipped exactly ascensionFirst, placeRank, trackFilter, bandLabels, catchUp, etaLater, bindDerived, bindNudge and travelAdvice; setRankChanges picks exactly a set', () => {
    const E = M.RANK_CHANGES, A = M.AION2_RANK_CHANGES;
    assert.deepEqual(Object.keys(E), ['ascensionFirst', 'placeRank', 'trackFilter', 'bandLabels', 'catchUp', 'etaLater']);
    assert.deepEqual(Object.keys(A), ['bindDerived', 'bindNudge', 'travelAdvice']);
    assert.deepEqual(Object.keys(E).filter(n => n in A), [], 'no name in both tables');
    for (const [n, x] of [...Object.entries(E), ...Object.entries(A)]) {
      assert.equal(x.on, SHIPPED_ON.includes(n), n); assert.equal(x.baseline === true, BASELINE.includes(n), n + ' baseline'); assert.ok(typeof x.what === 'string' && x.what.length > 20, n);
      for (const d of x.needs || []) assert.ok(d in E || d in A, `${n} needs ${d}`);
    }
    assert.deepEqual(A.bindNudge.needs, ['bindDerived']); assert.deepEqual(A.travelAdvice.needs, ['bindDerived', 'placeRank']);
    const on = () => [...Object.keys(E).filter(n => M.rankChangeOn(n)), ...Object.keys(A).filter(n => M.rankChangeOn(n, A))];
    assert.deepEqual(on(), SHIPPED_ON);
    try {
      M.setRankChanges(['placeRank', 'bindNudge']); assert.deepEqual(on(), ['placeRank', 'bindNudge']);
      M.setRankChanges([]); assert.deepEqual(on(), []);
    } finally { M.setRankChanges(null); }
    assert.deepEqual(on(), SHIPPED_ON);
    assert.throws(() => M.rankChangeOn('bindNudge'), /unknown ranking change/, 'a pack switch read from the engine table');
  });
  test('no quest set: the story card asks for it', () => {
    const cs = M.rankNext(S());
    assert.deepEqual(cs.filter(c => c.story).map(c => [c.v, c.act]), [['unset', 'setquest']]);
  });
  test('dungeon in progress first, then Cube items', () => {
    const sd = M.AREA_ITEMS.find(x => x.it.kind === 'hideout' && x.lv <= 20);
    const cs = M.rankNext(S({ level: 20, quest: M.QUESTS[30][1], areaRun: { [sd.k]: 1 }, pendSt: 2 }));
    assert.deepEqual(cs.slice(0, 2).map(c => [c.kind, c.act]), [['run', 'tick:' + sd.k], ['cube', 'usecube']]);
  });
  test('skill points to spend: the buy card, then up to 3 queued upgrades the points cover (catchUp off: 0.2\'s rule)', () => {
    const s = S({ level: 20, quest: M.QUESTS[30][1] });
    try { M.setRankChanges(['ascensionFirst', 'placeRank', 'etaLater']); const sk = M.rankNext(s).filter(c => c.kind === 'skill');
      assert.equal(sk[0].first, true); assert.equal(sk[0].x, M.skillBuy(M.char(S({ level: 20 })))); assert.ok(sk.length >= 2 && sk.length <= 4, sk.length);
    } finally { M.setRankChanges(null); }
  });
  /* ---------- catch-up (0.5 P13, catchUp; design §7) ----------
     A save at Lv L on the story, every milestone row below L ticked but the skill buys (so skill points are there to
     spend), minus the given missed steps; stShards gives a second kind of points (a stigma upgrade). */
  const behindAt = (L, { miss = [], shards = 0 } = {}) => {
    const quest = M.QUESTS.find(([l]) => l >= L)[1], below = M.GATES.filter(g => g.lv < L).flatMap(g => g.items.filter(it => it.k && !/^sp:/.test(it.k)));
    const checks = Object.fromEntries(below.filter(it => !miss.includes(it.k)).map(it => [it.k, true]));
    return S({ level: L, quest, checks, ...(shards ? { stShards: shards } : {}) });
  };
  /* the steps below Lv 25 Next up offers as a missed card when only that one is open */
  const missable = L => M.GATES.filter(g => g.lv < L).flatMap(g => g.items.filter(it => it.k && !/^sp:/.test(it.k)).map(it => it.k))
    .filter(k => M.rankNext(behindAt(L, { miss: [k] })).some(c => c.kind === 'missed' && c.x.k === k));
  const missedOf = cs => cs.filter(c => c.kind === 'missed').map(c => c.x.k);
  const withOn = (names, f) => { try { M.setRankChanges(names); return f(); } finally { M.setRankChanges(null); } }, offCatchUp = f => withOn(['ascensionFirst', 'placeRank', 'etaLater'], f);
  test('catch-up thresholds: named constants (3 missed steps, 2 kinds of points, 2 missed steps shown otherwise); behindOf at and around them', () => {
    assert.deepEqual([M.BEHIND_MISSED, M.BEHIND_KINDS, M.MISSED_SHOWN], [3, 2, 2]);
    const pts = (...ks) => ks.map(points => ({ phase: 'spend', points, card: {} }));
    assert.equal(M.behindOf([1, 2], pts('skill')), false, '2 missed, 1 kind');
    assert.equal(M.behindOf([1, 2, 3], []), true, '3 missed, no points');
    assert.equal(M.behindOf([], pts('skill', 'stigma')), true, '2 kinds');
    assert.equal(M.behindOf([1, 2], [...pts('skill', 'skill'), { phase: 'spend', card: {} }]), false, 'one kind twice, an entry without points');
  });
  test('catch-up, missed steps: 2 open (not behind) show 2; 3 and 4 (behind) all show, in catalog order (no location); catchUp off: 2', () => {
    const ks = missable(25); assert.ok(ks.length >= 4, ks.join(' '));
    for (const n of [2, 3, 4]) {
      const s = behindAt(25, { miss: ks.slice(0, n) }), on = M.rankNext(s), off = offCatchUp(() => M.rankNext(s));
      assert.deepEqual(missedOf(on), ks.slice(0, n < M.BEHIND_MISSED ? M.MISSED_SHOWN : n), `${n} missed`);
      assert.deepEqual(missedOf(off), ks.slice(0, 2), `${n} missed, catchUp off`);
      assert.deepEqual(missedOf(M.rankNext(s, { basic: true })), missedOf(on), `${n} missed, Basic shows the same missed steps`);
    }
  });
  test('catch-up, points: one kind (skill points) keeps the queue at 4 spend cards; two (and a stigma upgrade) lift it to what the points cover, never pushing out a step or the story; Basic: one skill card', () => {
    const one = M.rankNext(behindAt(25)), two = M.rankNext(behindAt(25, { shards: 99 })), sk = cs => cs.filter(c => c.kind === 'skill').length;
    assert.equal(sk(one), 4); assert.ok(two.some(c => c.kind === 'stup'));
    assert.ok(sk(two) > 4, `${sk(two)} skill cards`); assert.equal(offCatchUp(() => sk(M.rankNext(behindAt(25, { shards: 99 })))), 4, 'catchUp off: 4 skill cards');
    /* the points cover more upgrades than the cap leaves room for: the previews stop where steps and the story would go */
    const s30 = behindAt(30, { shards: 99 }), at30 = M.rankNext(s30);
    assert.deepEqual(at30.filter(c => c.kind !== 'skill').map(c => c.kind), offCatchUp(() => M.rankNext(s30)).filter(c => c.kind !== 'skill' && !c.later).map(c => c.kind));
    assert.ok(at30.filter(c => !c.story && !c.later && !['rq', 'sd', 'sh', 'stwait'].includes(c.kind)).length <= 8);
    assert.equal(sk(M.rankNext(behindAt(25, { shards: 99 }), { basic: true })), 1, 'Basic');
  });
  test('Later by eta: the Later cards in the order they open (level, then story position); the Later step is the closed step that opens first', () => {
    for (const L of [10, 15, 20, 25, 30, 35, 40]) {
      const s = behindAt(L), c = M.char(s), ev = M.gatesOf(c), cs = M.rankNext(s).filter(x => x.later);
      const at = cs.map(x => { const e = M.etaOf(ev.byKey(x.x.k)); return [Math.max(e.L, x.kind === 'laterStep' ? x.g.lv : x.x.req), e.Q]; });
      assert.deepEqual(at, [...at].sort((a, b) => a[0] - b[0] || a[1] - b[1]), `Lv ${L}: ${cs.map(x => x.x.k)}`);
      for (const x of cs.filter(x => x.kind === 'laterStep')) { const r = ev.byKey(x.x.k); assert.ok(r && !r.open && r.done === false && x.g.lv > L, `Lv ${L} ${x.x.k}`); }
    }
    /* a step that waits on a story quest names itself (0.2's pick, the next milestone's first step open but for its level, had none) */
    const s = behindAt(15), x = M.rankNext(s).find(x => x.kind === 'laterStep');
    assert.equal(x.x.k, 'g16:0'); assert.equal(withOn(['ascensionFirst', 'placeRank', 'catchUp'], () => M.rankNext(s).find(x => x.kind === 'laterStep').x), null, 'etaLater off');
    assert.ok(M.etaOf(M.gatesOf(M.char(s)).byKey('g16:0')).Q >= 0, 'g16:0 waits on a story quest');
  });
  test('story level-gated: regional quests and the Sealed Dungeon card move above the story', () => {
    const q = M.QUESTS.find(([l]) => l >= 25), lv = q[0] - 2;
    const k = kinds(M.rankNext(S({ level: lv, quest: q[1] }))), story = k.indexOf('story');
    assert.ok(M.rankNext(S({ level: lv, quest: q[1] })).find(c => c.story).gated);
    assert.ok(k.indexOf('sd') >= 0 && k.indexOf('sd') < story, k.join(' '));
    const k2 = kinds(M.rankNext(S({ level: q[0], quest: q[1] })));
    assert.ok(k2.indexOf('sd') > k2.indexOf('story'), k2.join(' '));
  });
  test('Basic: no Later or advice cards, one skill card; at most 8 cards plus the story and side-content cards', () => {
    for (const lv of [10, 20, 30, 40, 45]) {
      const s = S({ level: lv, quest: M.QUESTS.find(([l]) => l >= lv)?.[1] || '' }), adv = M.rankNext(s), basic = M.rankNext(s, { basic: true });
      assert.ok(basic.every(c => !c.later && !c.adv), lv); assert.ok(basic.filter(c => c.act === 'skill').length <= 1, lv);
      for (const cs of [adv, basic]) assert.ok(cs.filter(c => !c.story && !['rq', 'sd', 'sh', 'stwait'].includes(c.kind)).length <= 8, lv);
    }
  });
  test('ranking reads the save and never writes it', () => {
    for (const s of [S(), S({ level: 30, quest: M.QUESTS[50][1], rqSnooze: { x: 1 }, stShards: 3, dvTotal: 40 }), S({ level: 45, quest: 'Forgotten Commander', storyEnd: 'Forgotten Commander' })]) {
      const before = JSON.stringify(s); M.rankNext(s); M.rankNext(s, { basic: true }); assert.equal(JSON.stringify(s), before);
    }
  });
  test('story end: "Altgard story complete", no Turned in', () => {
    const q = M.QUESTS[M.QUESTS.length - 1][1], c = M.rankNext(S({ level: 45, quest: q, storyEnd: q })).find(c => c.story);
    assert.deepEqual([c.v, c.act], ['end', '']);
  });
  /* "Near your story step" (PR #47 review finding 1): the story record's own turn-in zone, never a Kibelisk guess.
     atTurnin = the turn-in is the next open step (every objective before it ticked). */
  const atTurnin = (q, lv) => { const n = (M.QUEST_STEPS[q] || []).length;
    return S({ level: lv, quest: q, showTalk: true, qsteps: n ? { [q]: Array.from({ length: n - 1 }, (_, i) => i) } : {} }); };
  const areaAt = s => M.storyAreaOf(M.storyHereOf(s), M.KIB_AREA), cardArea = s => M.rankNext(s).filter(c => ['sd', 'sh', 'rq'].includes(c.kind)).map(c => c.hereArea);
  test('near your story step: a placeholder turn-in zone gives no area, even with a Kibelisk that has a zone vote', () => {
    for (const [q, lv] of [['Empyrean Monolith', 16], ['Verdant Melody', 22], ['Watchful Eyes', 19], ['Farewells', 45]]) {
      const s = atTurnin(q, lv), h = M.storyHereOf(s);
      assert.equal(h.zone, '', q + ' turn-in zone is the placeholder'); assert.ok(M.KIB_AREA[h.kib], q + ' Kibelisk has a vote (the old guess)');
      assert.equal(areaAt(s), null, q); assert.ok(cardArea(s).length && cardArea(s).every(a => a === null), q);
    }
  });
  test('near your story step: a real record zone wins over the Kibelisk vote (Dead Men Tell No Tales: Crypt, not Nameless Cemetery)', () => {
    const s = atTurnin('Dead Men Tell No Tales', 15), h = M.storyHereOf(s);
    assert.deepEqual([h.kib, h.zone, M.KIB_AREA[h.kib]], ['Neglected Crematorium', 'Crypt', 'Nameless Cemetery']);
    assert.equal(areaAt(s), 'Crypt'); assert.ok(cardArea(s).every(a => a === 'Crypt'));
    const sd = M.rankNext(s).find(c => c.kind === 'sd'); assert.notEqual(sd.pick.area, 'Nameless Cemetery');
  });
  test('near your story step: unchanged where the turn-in zone was known before PR #47 (Lv 24+); objectives keep the Kibelisk vote', () => {
    /* Before: KIB_AREA[turninKib] for every quest. Now: the record zone. They differ only where listed here:
       - Lake of Confrontation / An Ill Fate's Resolution turn in at Idun's Lake (a zone with its own dungeon and
         stronghold); the Kibelisk "Idun's Lake" votes Western Gribade Highland;
       - the turn-in Kibelisk has no vote, so there was no area: Preparations for Restoration, Visible Trap, Destruction
         Archon Underground Fortress (zones known before), Voice of Rage (zone added by PR #47);
       - Farewells' turn-in zone is still the placeholder. */
    const CHANGED = { 'Lake of Confrontation': "Idun's Lake", "An Ill Fate's Resolution": "Idun's Lake", 'Preparations for Restoration': 'Purifying Forest',
      'Visible Trap': 'Basfelt Ruins', 'Destruction Archon Underground Fortress': 'Basfelt Ruins', 'Voice of Rage': 'Uruthumheim', Farewells: null }, bad = [];
    M.QUESTS.filter(([l]) => l >= 24).forEach(([l, q]) => { const L = M.QUEST_LOC[q] || {}; if (!L.turninKib) return;
      const want = q in CHANGED ? CHANGED[q] : M.KIB_AREA[L.turninKib] || null, got = areaAt(atTurnin(q, l));
      if (got !== want) bad.push(`${q}: ${got} ≠ ${want}`);
      if (q in CHANGED && want === (M.KIB_AREA[L.turninKib] || null)) bad.push(`${q}: listed as changed but isn't`); });
    assert.deepEqual(bad, []);
    const [l, q] = M.QUESTS.find(([, n]) => (M.QUEST_STEPS[n] || []).some(t => /^(?!Turn in).*\(Kibelisk: /.test(t))), s = S({ level: l, quest: q, showTalk: true });
    const h = M.storyHereOf(s); assert.ok(h && !('zone' in h), q); assert.equal(areaAt(s), M.KIB_AREA[h.kib] || null, q);
  });
  /* 0.4 P2c: the engine ranks, the pack produces its cards. The same pack with no producers: only the engine's cards. */
  test('no pack producers: rankNext returns only the engine\'s cards (step, missed, story, adv, laterStep)', () => {
    const ENGINE = ['step', 'missed', 'story', 'adv', 'laterStep'], bare = M.definePack({ ...M.aion2Pack, nextUpProducers: [] }), seen = new Set();
    const sd = M.AREA_ITEMS.find(x => x.it.kind === 'hideout' && x.lv <= 20);
    const saves = [S(), S({ level: 20, quest: M.QUESTS[30][1], areaRun: { [sd.k]: 1 }, pendSt: 2, stShards: 3, dvTotal: 40 }),
      ...[1, 10, 20, 30, 40, 45].map(lv => S({ level: lv, quest: M.QUESTS.find(([l]) => l >= lv)?.[1] || '' }))];
    const full = saves.map(s => M.rankNext(s));
    try {
      M.usePack(bare);
      saves.forEach((s, i) => { for (const basic of [false, true]) {
        const cs = M.rankNext(s, { basic }); cs.forEach(c => seen.add(c.kind));
        assert.deepEqual(cs.filter(c => !ENGINE.includes(c.kind)).map(c => c.kind), [], `save ${i}`);
        assert.equal(cs.filter(c => c.story).length, 1, `save ${i}: one story card`);
        /* the pack's cards take cap places, so with them the engine's are the same cards in the same order, some cut */
        if (!basic) { const mine = cs.map(c => c.kind + ' ' + c.act), j = { n: 0 };
          const withPack = full[i].filter(c => ENGINE.includes(c.kind)).map(c => c.kind + ' ' + c.act);
          assert.ok(withPack.every(x => { while (j.n < mine.length && mine[j.n] !== x) j.n++; return j.n++ < mine.length; }), `save ${i}: ${withPack} in ${mine}`); }
      } });
    } finally { M.usePack(M.aion2Pack); }
    for (const k of ['step', 'story', 'laterStep']) assert.ok(seen.has(k), k);
    assert.ok(full.some(cs => cs.some(c => !ENGINE.includes(c.kind))), 'with the pack, its cards are there');
  });
  test('a producer entry with an unknown phase throws', () => {
    const bad = M.definePack({ ...M.aion2Pack, nextUpProducers: [{ id: 'x', produce: () => [{ phase: 'soon', card: { kind: 'x', act: '' } }] }] });
    try { M.usePack(bad); assert.throws(() => M.rankNext(S({ level: 10 })), /unknown phase "soon"/); } finally { M.usePack(M.aion2Pack); }
  });
  test('gate sweep: every story position at its level, one below and 45 — exactly one story card; no actionable step before its level or story gate, or after the story passed it', () => {
    const bad = [];
    const gateOf = it => it && (it.story || it.after);
    M.QUESTS.forEach(([ql, name], i) => {
      for (const lv of [...new Set([Math.max(1, ql - 1), ql, 45])]) for (const basic of [false, true]) {
        const s = S({ level: lv, quest: name }), cs = M.rankNext(s, { basic }), tag = `Lv${lv}@${i}${basic ? 'B' : ''}`;
        if (cs.filter(c => c.story).length !== 1) bad.push(tag + ' story cards');
        for (const c of cs) {
          if (c.kind === 'skill' && c.x.req > lv) bad.push(`${tag} skill ${c.x.k}`);
          if (!ACTIONABLE.includes(c.kind)) continue;
          const k = c.x.k, it = c.x.it || c.x.row, need = c.x.row.story || c.x.row.after;
          if (c.g.lv > lv) bad.push(`${tag} level ${k}`);
          if (need && qi(need) > i) bad.push(`${tag} story ${k}`);
          if (it && it.byStory && qi(it.story) <= i) bad.push(`${tag} byStory ${k}`);
          if (k === 'g32:dreams' && i < qi('A Daeva Dreaming Anew')) bad.push(`${tag} oracle ${k}`);
          if (k === 'g45:witness' && i <= qi('Forgotten Commander')) bad.push(`${tag} oracle ${k}`); /* "Forgotten Commander" isn't turned in (no storyEnd); past it from E10 on */
        }
      }
    });
    assert.deepEqual(bad, []);
  });
};
