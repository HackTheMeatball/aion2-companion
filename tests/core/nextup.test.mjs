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
  test('no quest set: the story card asks for it', () => {
    const cs = M.rankNext(S());
    assert.deepEqual(cs.filter(c => c.story).map(c => [c.v, c.act]), [['unset', 'setquest']]);
  });
  test('dungeon in progress first, then Cube items', () => {
    const sd = M.AREA_ITEMS.find(x => x.it.kind === 'hideout' && x.lv <= 20);
    const cs = M.rankNext(S({ level: 20, quest: M.QUESTS[30][1], areaRun: { [sd.k]: 1 }, pendSt: 2 }));
    assert.deepEqual(cs.slice(0, 2).map(c => [c.kind, c.act]), [['run', 'tick:' + sd.k], ['cube', 'usecube']]);
  });
  test('skill points to spend: the buy card, then up to 3 queued upgrades the points cover', () => {
    const cs = M.rankNext(S({ level: 20, quest: M.QUESTS[30][1] })), sk = cs.filter(c => c.kind === 'skill');
    assert.equal(sk[0].first, true); assert.equal(sk[0].x, M.skillBuy(M.char(S({ level: 20 })))); assert.ok(sk.length >= 2 && sk.length <= 4);
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
