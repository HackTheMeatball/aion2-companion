/* AION 2 travel (0.5 P10, src/packs/aion2/travel.js; docs/design/0.4-smart-next-up.md §8): bound Kibelisks (§8.1), the
   one-time "Bind X" row (§8.2) and teleport vs walk (§8.3), from the save and the rules (TRAVEL_RULES). Not wired. */
import assert from 'node:assert/strict';

const deepFreeze = o => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.values(o).forEach(deepFreeze); Object.freeze(o); } return o; };
/* deterministic PRNG (mulberry32) */
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

export default (test, M) => {
  const N = M.GATE_GRAPH.nodes, NP = M.NODE_PLACE, K = M.KIBELISKS, S = M.GATE_GRAPH.story, TR = M.TRAVEL_RULES;
  const qi = name => S.findIndex(([, n]) => n === name);
  const ch = o => ({ level: 45, checks: {}, quest: '', qsteps: {}, qsub: {}, started: {}, areaRun: {}, ...o });
  /* the story with every quest before `name` turned in (the current quest is name), or all of it turned in */
  const at = (name, o) => ch({ quest: name, ...o });
  const atEnd = o => ch({ quest: S[S.length - 1][1], storyEnd: S[S.length - 1][1], ...o });
  const allDone = () => Object.fromEntries(Object.entries(N).filter(([, n]) => ['rq', 'sd', 'sh'].includes(n.kind)).map(([, n]) => [n.key, true]));
  const noBinds = id => ({ ...K, [id]: { ...K[id], binds: undefined } });

  test('rules: the working values come from rules.json (bind 25 m, nudge 150 m, teleport gain 400 m)', () => {
    assert.deepEqual(TR, { bindRadius: 25, nudgeRadius: 150, teleportGain: 400 });
  });

  /* ---------- §8.1 bound ---------- */
  test('bound: Safe Haven by its binds fact at R = 25 m (Survival Supplies objective 0), not by distance', () => {
    const ss = 'Survival Supplies', T = NP[S[qi(ss)][0]].pts.turnin;
    assert.deepEqual([T.anchor, T.m], ['kib:safe-haven', 32]);
    assert.equal(M.bound(at(ss), 'kib:safe-haven'), false, 'on the quest, objective 0 not ticked');
    assert.equal(M.bound(at(ss, { qsteps: { [ss]: [0] } }), 'kib:safe-haven'), true, 'objective 0 ticked');
    assert.equal(M.bound(at(S[qi(ss) + 1][1]), 'kib:safe-haven'), true, 'the quest turned in');
    /* with the fact taken away: the whole story and every regional quest, dungeon and stronghold done never comes within 25 m */
    const all = atEnd({ checks: allDone() });
    assert.equal(M.bound(all, 'kib:safe-haven', { kibs: noBinds('kib:safe-haven') }), false, 'no point within 25 m');
    assert.equal(M.bound(all, 'kib:safe-haven', { R: 32, kibs: noBinds('kib:safe-haven') }), true, 'VeKauf binds it at R = 32 m');
  });
  test('bound: Abandoned Barracks Site at 9 m (the turn-in of Signs of a Crash Landing)', () => {
    const q = 'Signs of a Crash Landing', T = NP[S[qi(q)][0]].pts.turnin;
    assert.deepEqual([T.anchor, T.m], ['kib:abandoned-barracks-site', 9]);
    assert.equal(M.bound(at(q), 'kib:abandoned-barracks-site'), false, 'on the quest');
    assert.equal(M.bound(at(q, { storyEnd: q }), 'kib:abandoned-barracks-site'), true, 'turned in (storyEnd)');
    assert.equal(M.bound(at(S[qi(q) + 1][1]), 'kib:abandoned-barracks-site'), true, 'turned in (the next quest current)');
    assert.equal(M.bound(at(S[qi(q) + 1][1]), 'kib:abandoned-barracks-site', { R: 8 }), false, 'not at R = 8 m');
  });
  test('bound: Aldelle Village by its step-text fact (A Village in the Fog objective 1); a "bind:" tick binds; nothing ticked binds nothing', () => {
    assert.equal(M.boundSet(ch({})).size, 0);
    assert.equal(M.bound(at('A Village in the Fog', { qsteps: { 'A Village in the Fog': [1] } }), 'kib:aldelle-village', { R: 0 }), true);
    assert.equal(M.bound(at('A Village in the Fog'), 'kib:aldelle-village', { R: 0 }), false);
    assert.equal(M.bound(ch({ checks: { 'bind:kib:quai-campsite': true } }), 'kib:quai-campsite'), true);
    assert.equal(M.bound(ch({ checks: { 'bind:kib:quai-campsite': false } }), 'kib:quai-campsite'), false);
  });
  test('bound: a regional quest\'s giver counts once picked up, its turn-in once done; an entrance once done or run', () => {
    /* a node whose point w is within R of a Kibelisk no other point of it comes within R of (so only w can bind it) */
    const pick = (kind, w, R = 25) => Object.entries(N).find(([id, n]) => n.kind === kind && NP[id] && (NP[id].pts[w] || {}).m <= R
      && !Object.entries(NP[id].pts).some(([x, p]) => x !== w && p.anchor === NP[id].pts[w].anchor && p.m <= R)) || [];
    const [gid, g] = pick('rq', 'giver'), [tid, t] = pick('rq', 'turnin');
    assert.ok(g && t, 'a regional quest giver and one turn-in that bind on their own');
    const gk = NP[gid].pts.giver.anchor, tk = NP[tid].pts.turnin.anchor;
    assert.equal(M.bound(ch({}), gk), false);
    assert.equal(M.bound(ch({ started: { [g.key]: 1 } }), gk), true, 'picked up');
    assert.equal(M.bound(ch({ started: { [t.key]: 1 } }), tk), false, 'picked up only: the turn-in not visited');
    assert.equal(M.bound(ch({ checks: { [t.key]: true } }), tk), true, 'turned in');
    /* no Sealed Dungeon entrance is within 25 m of its Kibelisk (data), so the entrance clause is shown at its own metres */
    const [eid, e] = Object.entries(N).find(([id, n]) => n.kind === 'sd' && NP[id] && (NP[id].pts.entrance || {}).anchor), ep = NP[eid].pts.entrance;
    assert.equal(M.bound(ch({}), ep.anchor, { R: ep.m }), false);
    assert.equal(M.bound(ch({ areaRun: { [e.key]: 1700000000000 } }), ep.anchor, { R: ep.m }), true, 'run');
    assert.equal(M.bound(ch({ checks: { [e.key]: true } }), ep.anchor, { R: ep.m }), true, 'done');
    assert.equal(M.bound(ch({ checks: { [e.key]: true } }), ep.anchor, { R: ep.m - 1 }), false, 'just outside R');
  });
  test('bound: a cross-map pair gives an unknown distance (null), the same map a straight line', () => {
    const pts = Object.values(NP).flatMap(p => Object.values(p.pts));
    const a = pts.find(p => p.map === 'altgard'), a2 = pts.find(p => p.map === 'altgard' && (p.x !== a.x || p.y !== a.y));
    const ish = pts.find(p => !p.map && K[p.anchor] && K[p.anchor].map === 'ishalgen');
    assert.ok(a && a2 && ish);
    assert.equal(M.placeDist(a, ish), null, 'an Ishalgen point (no coordinates in our data) from an Altgard one');
    assert.equal(M.placeDist(a, { map: 'ishalgen', x: a.x, y: a.y }), null, 'the same numbers on another map');
    assert.equal(M.placeDist(a, a2), Math.hypot(a.x - a2.x, a.y - a2.y));
  });
  test('bound: ticking more never unbinds (random tick, pick-up, objective and story sequences)', () => {
    const keys = Object.values(N).filter(n => ['rq', 'sd', 'sh'].includes(n.kind)).map(n => n.key), kibs = Object.keys(K);
    for (let seed = 1; seed <= 12; seed++) {
      const r = rng(seed), pick = a => a[Math.floor(r() * a.length)];
      let c = ch({ level: 10 + Math.floor(r() * 36) }), qn = 0, prev = M.boundSet(c);
      for (let step = 0; step < 40; step++) {
        c = JSON.parse(JSON.stringify(c)); const x = r();
        if (x < 0.3) c.checks[pick(keys)] = true;
        else if (x < 0.45) c.started[pick(keys)] = 1;
        else if (x < 0.55) c.areaRun[pick(keys)] = 1;
        else if (x < 0.65) c.checks['bind:' + pick(kibs)] = true;
        else if (x < 0.8 && c.quest) { const s = new Set(c.qsteps[c.quest] || []); s.add(Math.floor(r() * 6)); c.qsteps[c.quest] = [...s]; }
        else if (qn < S.length) { qn = Math.min(S.length, qn + 1 + Math.floor(r() * 6)); if (qn === S.length) { c.quest = S[S.length - 1][1]; c.storyEnd = c.quest; } else c.quest = S[qn][1]; }
        const now = M.boundSet(c);
        for (const k of prev) assert.ok(now.has(k), `seed ${seed} step ${step}: ${k} unbound`);
        prev = now;
      }
    }
  });
  test('bound: deep-frozen input', () => {
    const c = deepFreeze(atEnd({ checks: { 'bind:kib:quai-campsite': true, ...allDone() }, qsteps: { 'Survival Supplies': [0] }, started: {}, areaRun: {} }));
    const b = M.boundSet(c); assert.ok(b.has('kib:quai-campsite') && b.has('kib:safe-haven') && b.has('kib:abandoned-barracks-site'));
    assert.equal(M.nudgeOf(c), null);
  });

  /* ---------- §8.2 nudge ---------- */
  test('nudge: walking the story, each Kibelisk gets the row at most once, only in (R, 150] m and never when bound', () => {
    const seen = new Map();
    for (let i = 0; i < S.length; i++) {
      const c = at(S[i][1]), n = M.nudgeOf(c); if (!n) continue;
      const T = NP[S[i][0]].pts.turnin;
      assert.ok(!seen.has(n.kib), `${n.kib} twice: ${seen.get(n.kib)} and ${S[i][1]}`); seen.set(n.kib, S[i][1]);
      /* npc (0.5 P15): the turn-in's NPC, which the row names ("32 m from VeKauf") */
      assert.deepEqual(n, { kib: T.anchor, name: K[T.anchor].name, m: T.m, key: 'bind:' + T.anchor, via: S[i][0], npc: n.npc });
      assert.ok(typeof n.npc === 'string' && n.npc.length > 1, `${S[i][1]}: the turn-in NPC`);
      assert.ok(T.m > TR.bindRadius && T.m <= TR.nudgeRadius);
      assert.equal(M.bound(c, n.kib), false);
      assert.equal(M.nudgeOf({ ...c, checks: { [n.key]: true } }), null, 'ticking the row ends it');
      assert.equal(M.nudgeOf({ ...c, storyEnd: c.quest }), null, 'turned in: no target');
    }
    assert.ok(seen.size >= 5, 'some rows: ' + [...seen.keys()]);
    /* Safe Haven's first in-band point is Finding Nemon's turn-in (96 m), not VeKauf (32 m) */
    assert.equal(seen.get('kib:safe-haven'), 'Finding Nemon');
    assert.equal(M.nudgeOf(at('Survival Supplies')), null);
    assert.equal(M.nudgeOf(ch({})), null);
  });

  /* ---------- §8.3 teleport vs walk ---------- */
  test('teleport: bound and far (walk − run ≥ 400 m) → teleport; near, not bound, Prefer running or "I\'ll walk" → none', () => {
    const id = Object.keys(NP).find(k => { const t = NP[k].pts.turnin || NP[k].pts.entrance; return t && t.map === 'altgard' && t.anchor && t.m != null && t.m < 100; });
    const T = NP[id].pts.turnin || NP[id].pts.entrance, target = { zone: NP[id].zone, pt: T }, c = ch({ checks: { ['bind:' + T.anchor]: true } });
    const far = { zone: 'zone:elsewhere', pt: { map: 'altgard', x: T.x + 600 + T.m, y: T.y } }, near = { zone: NP[id].zone, pt: { map: 'altgard', x: T.x + 100, y: T.y } };
    assert.deepEqual(M.teleportOf(c, target, far), { kib: T.anchor, name: K[T.anchor].name, m: T.m, walk: 600 + T.m });
    assert.equal(M.teleportOf(c, target, near), null);
    assert.equal(M.teleportOf(ch({}), target, far), null, 'not bound');
    assert.equal(M.teleportOf(c, target, far, { preferRun: true }), null);
    assert.equal(M.teleportOf(c, target, far, { walk: true }), null);
    assert.equal(M.teleportOf(c, target, null), null, 'no start');
    assert.equal(M.teleportOf(c, { zone: target.zone, pt: null }, far), null, 'no point');
    assert.equal(M.teleportOf(c, target, far, { gain: 601 }), null, 'gain not reached');
    /* another map: the distance is unknown, so the zone decides */
    const other = { zone: 'zone:ishalgen', pt: { map: 'ishalgen', x: T.x, y: T.y } };
    assert.equal(M.teleportOf(c, target, other).walk, null);
    assert.equal(M.teleportOf(c, target, { zone: target.zone, pt: other.pt }), null, 'another map, the same zone');
    assert.equal(M.teleportOf(c, target, { zone: null, pt: other.pt }), null, 'another map, no zone');
  });
};
