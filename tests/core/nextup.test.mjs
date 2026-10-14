/* Next up ranking: order rules, Basic filter and cap, and a gate sweep (the browser `gates` suite's rules over every
   story position × several levels, in Node). */
import assert from 'node:assert/strict';

const FLAGS = { seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true };
const S = (o = {}) => ({ checks: {}, level: 5, hide: false, open: {}, quest: '', mode: 'advanced', ...FLAGS, ...o });
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
    assert.equal(sk[0].first, true); assert.equal(sk[0].x, M.skillBuy(S({ level: 20 }))); assert.ok(sk.length >= 2 && sk.length <= 4);
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
          if (k === 'g45:0') bad.push(`${tag} oracle ${k}`); /* "Forgotten Commander" isn't turned in (no storyEnd) */
        }
      }
    });
    assert.deepEqual(bad, []);
  });
};
