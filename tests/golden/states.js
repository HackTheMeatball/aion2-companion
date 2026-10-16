/* Golden master: the deterministic save-state generator (see tests/golden/README.md).

   Input: the page's catalog (catalogInPage() below runs in the page once: QUESTS, GATES, RQ, AREA_ITEMS, SP_STEPS, ...).
   Output: [{ id, tier, raw }] sorted by id, where raw is the exact localStorage string for 'aion2-assassin-route-v4' (null = no
   save at all).

   Stability rules (so a data change shows up as a few changed snapshots, not as a reshuffled matrix):
   - Every state has a descriptive id built from its recipe, never from its position in a list.
   - Story positions are referred to by index into QUESTS in ids (q07 = QUESTS[7]); the quest name is in the state itself.
   - "Random" tick subsets are per key: key k is ticked iff hash(seed + k) < p. Adding or removing a key never changes
     whether any other key is ticked. The random states use a seeded PRNG (mulberry32) for their recipes only.
   - Tick rules ("before", "all") are applied to the current catalog, so a new milestone step is ticked by the rules
     that cover it. Such a change shows up as a changed input hash (kind "input") in the verify summary. */
'use strict';

/* ---------- runs in the page (serialised by Playwright; must be self-contained) ---------- */
function catalogInPage() {
  const it2 = (g, it) => ({ k: it.k, lv: g.lv, kind: it.kind || '', story: it.story || '', byStory: !!it.byStory, stig: it.stig || 0, eput: it.eput || 0,
    dv: !!it.dv, blv: it.blv || 0, opt: !!it.opt, adv: !!it.adv, hidden: !!it.hidden, sub: !!it.sub, ns: String(it.ns || '').replace(/<[^>]+>/g, '') });
  return {
    quests: QUESTS.map(([lv, n]) => [lv, n]),
    questSteps: Object.fromEntries(Object.entries(QUEST_STEPS).map(([q, l]) => [q, l.length])),
    gates: GATES.map(g => ({ id: g.id, lv: g.lv, title: g.title, items: g.items.filter(it => it.k).map(it => it2(g, it)) })),
    steps: STEPS.map(s => ({ id: s.id, items: s.items.filter(it => it.k).map(it => it.k) })),
    rq: RQ.map(q => ({ id: String(q.id), name: q.name, rec: q.rec, unlocksAt: q.unlocksAt || 0, story: ['2202044', '2202051', '2202015'].includes(String(q.id)) ? '' : q.story || '' /* E9: Shugo / Spooky / Curse-Breaking Caper gained a story gate; the generated saves stay what they were, so --explain sees only behaviour */, after: q.after || [] })),
    areas: AREA_ITEMS.map(x => ({ k: x.k, kind: x.it.kind, lv: x.lv, lo: x.it.lo || 0, hi: x.it.hi || 45 })),
    sp: SP_STEPS.map(x => ({ k: x.k, req: x.req, cost: x.cost, spec: !!x.spec, extra: !!(x.s && x.s.extra), n: x.s.n, L: x.L })),
    stigmaPlan: STIGMA_PLAN.slice(),
    slots: STIGMA_SLOTS().map(s => ({ k: s.k, n: s.n, lv: s.lv })),
    dvNodes: DV_NODES().map(it => ({ k: it.k, blv: it.blv || 0, board: it.board || '' })),
  };
}

/* ---------- deterministic helpers ---------- */
const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0) / 4294967296; };
const mulberry32 = a => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pad = (n, w = 2) => String(n).padStart(w, '0');
const FLAGS = { seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true };

function makeGen(C) {
  const qIdx = n => C.quests.findIndex(q => q[1] === n);
  const allItems = C.gates.flatMap(g => g.items);
  /* story position "on track" for a level: the last quest whose level is <= L (-1 = before the first one) */
  const onTrack = L => { let i = -1; C.quests.forEach((q, j) => { if (q[0] <= L) i = j; }); return i; };

  /* tick rules. "before": what a player who kept up has done before reaching (lv, story qi): milestone steps of lower
     milestones (story-gated ones only once the story is past them), regional quests below the level whose story gate is
     reached, dungeons/strongholds below, skills bought 2 levels behind, board nodes of earlier boards.
     "lvonly": the same by level only, ignoring the story (a player who set the story back, or skipped it). */
  function ticks(rule, lv, qi) {
    const ch = {};
    if (rule === 'none') return ch;
    const storyOk = n => !n || (qIdx(n) >= 0 && qi >= qIdx(n));
    if (rule === 'before' || rule === 'lvonly' || rule === 'all') {
      const all = rule === 'all', so = n => rule !== 'before' || storyOk(n);
      allItems.forEach(it => {
        if (it.sub || it.hidden) return;
        if (it.kind === 'quest') return;                       /* regional quests: below, by their own level */
        if (it.kind === 'hideout') { if (all || it.lv < lv) ch[it.k] = true; return; }
        if (it.dv) { if (all || it.blv < lv) ch[it.k] = true; return; }
        if (all || (it.lv < lv && so(it.story))) ch[it.k] = true;
      });
      C.rq.forEach(q => { if (all || (q.rec < lv && so(q.story))) ch['rq:' + q.id] = true; });
      C.areas.forEach(x => { if (all || (x.kind === 'hideout' ? x.lv < lv : x.hi < lv)) ch[x.k] = true; });
      C.sp.forEach(x => { if (all || (x.req <= lv - 2 && !x.extra)) ch[x.k] = true; });
      return ch;
    }
    const m = /^rnd(\d+)p(\d+)$/.exec(rule); /* rnd<seed>p<percent>: per-key hash; only keys that exist at or below lv */
    if (m) {
      const seed = m[1], p = +m[2] / 100, pick = k => fnv(seed + '|' + k) < p;
      allItems.forEach(it => { if (!it.sub && !it.hidden && it.kind !== 'quest' && (it.dv ? it.blv : it.lv) <= lv && pick(it.k)) ch[it.k] = true; });
      C.rq.forEach(q => { if (q.rec <= lv && pick('rq:' + q.id)) ch['rq:' + q.id] = true; });
      C.areas.forEach(x => { if (x.lv <= lv && pick(x.k)) ch[x.k] = true; });
      C.sp.forEach(x => { if (x.req <= lv && pick(x.k)) ch[x.k] = true; });
      return ch;
    }
    throw new Error('unknown tick rule ' + rule);
  }

  /* build variants (stigmas, skills, cube, board) layered on top of the ticks */
  function build(st, kind, lv) {
    const slotsOpen = C.slots.filter(s => s.lv <= lv);
    switch (kind) {
      case 'none': return;
      case 'stwait': /* stigmas unlocked (g22:0), every open slot empty, no shards */
        st.checks['g22:0'] = true; slotsOpen.forEach(s => { delete st.checks[s.k]; }); st.stShards = 0; delete st.stLv; return;
      case 'stready': /* stigmas unlocked, first slot equipped, the rest open, 3 shards */
        st.checks['g22:0'] = true; slotsOpen.forEach((s, i) => { if (i === 0) st.checks[s.k] = true; else delete st.checks[s.k]; });
        st.stShards = 3; st.stLv = { [C.stigmaPlan[0]]: 2 }; return;
      case 'stfull': /* every open slot equipped, plenty of shards to upgrade */
        st.checks['g22:0'] = true; slotsOpen.forEach(s => { st.checks[s.k] = true; }); st.stShards = 20;
        st.stLv = Object.fromEntries(C.stigmaPlan.slice(0, slotsOpen.length).map(n => [n, 1])); return;
      case 'sppts': /* skill points to spend: nothing bought, extra Wisdom Stones */
        Object.keys(st.checks).filter(k => k.startsWith('sp:')).forEach(k => delete st.checks[k]); st.stones = 6; return;
      case 'cube': /* Cube items pending + a Sealed Dungeon in progress */
        st.pendSt = 2; st.pendCr = 3; { const sd = C.areas.find(x => x.kind === 'hideout' && x.lv <= lv && !st.checks[x.k]); if (sd) st.areaRun = { [sd.k]: 1760000000000 }; } return;
      case 'dv': /* board crystals: every open node's cost known, enough crystals for the next one */
        { const open = C.dvNodes.filter(n => n.blv <= lv); st.dvCost = {}; open.forEach((n, i) => { st.dvCost[n.k] = 3 + (i % 3); });
          st.dvTotal = open.filter(n => st.checks[n.k]).reduce((t, n) => t + st.dvCost[n.k], 0) + 9; } return;
      case 'rqmix': /* regional quests: two in progress, one snoozed, one "In my game" pick-up */
        { const open = C.rq.filter(q => !st.checks['rq:' + q.id] && q.rec <= lv); st.started = {};
          open.slice(0, 2).forEach(q => { st.started['rq:' + q.id] = 1; }); if (open[2]) st.rqSnooze = { ['rq:' + open[2].id]: lv };
          const w = C.rq.find(q => !st.checks['rq:' + q.id] && q.story && q.rec <= lv && !(st.started['rq:' + q.id])); if (w) st.started['rq:' + w.id] = 1; } return;
      case 'objs': /* story objectives: first half of the current quest's objectives ticked; objectives shown in Journey */
        { const n = C.questSteps[st.quest] || 0; if (n) st.qsteps = { [st.quest]: Array.from({ length: Math.floor(n / 2) }, (_, i) => i) }; st.showObj = true; } return;
      case 'filters': /* view filters on: hide ticked, hide optional, cleared milestones folded, journey track open */
        st.hide = true; st.hideOpt = true; st.hideCards = true; st.trackOpen = true; return;
      default: throw new Error('unknown build ' + kind);
    }
  }

  function state({ lv, qi, ticks: rule, mode, b = 'none' }) {
    const st = { checks: ticks(rule, lv, qi), level: lv, quest: qi >= 0 ? C.quests[qi][1] : '', open: {}, mode, ...FLAGS };
    build(st, b, lv);
    return st;
  }
  const id = r => `L${pad(r.lv)}-q${r.qi < 0 ? 'xx' : pad(r.qi)}-${r.ticks}-${r.mode === 'basic' ? 'B' : 'A'}${r.b && r.b !== 'none' ? '-' + r.b : ''}`;
  return { state, id, onTrack, qIdx };
}

/* The matrix. tier 'core' (CORE states in all) runs by default; 'all' adds EXTENDED random states (--all). */
const CORE = 2000, EXTENDED = 6000, SPECIAL = 6;
function generate(C, { fixtures = [], all = false } = {}) {
  const G = makeGen(C), out = new Map(), NQ = C.quests.length;
  const add = (group, r, tier = 'core') => { const i = group + '/' + G.id(r); if (!out.has(i)) out.set(i, { id: i, tier, raw: JSON.stringify(G.state(r)) }); };

  /* story: every story position at its own level, one level below it (story level-gated), and at Lv 45;
     empty ticks (the audit's sweep) and "kept up" ticks; Basic at the quest's own level */
  for (let qi = 0; qi < NQ; qi++) {
    const ql = C.quests[qi][0];
    for (const lv of [ql, 45]) for (const t of ['none', 'before']) add('story', { lv, qi, ticks: t, mode: 'advanced' });
    if (ql > 1) add('story', { lv: ql - 1, qi, ticks: 'before', mode: 'advanced' });
    add('story', { lv: ql, qi, ticks: 'before', mode: 'basic' });
  }
  /* level: every level, story on track / not set / one quest ahead, several tick subsets, both modes */
  for (let lv = 1; lv <= 45; lv++) {
    const qi = G.onTrack(lv);
    for (const mode of ['advanced', 'basic']) for (const t of ['none', 'before', 'lvonly', 'rnd1p50', 'rnd2p85']) add('level', { lv, qi, ticks: t, mode });
    add('level', { lv, qi: -1, ticks: 'before', mode: 'advanced' });
    if (qi + 1 < NQ) add('level', { lv, qi: qi + 1, ticks: 'before', mode: 'advanced' });
    if (qi > 3) add('level', { lv, qi: qi - 3, ticks: 'lvonly', mode: 'advanced' });
  }
  /* build: stigma / skill / cube / board / regional / objectives / filter variants at the levels where they matter */
  for (const lv of [10, 12, 20, 22, 23, 27, 30, 32, 37, 40, 45]) {
    const qi = G.onTrack(lv);
    for (const b of ['stwait', 'stready', 'stfull', 'sppts', 'cube', 'dv', 'rqmix', 'objs', 'filters'])
      for (const mode of ['advanced', 'basic']) add('build', { lv, qi, ticks: 'before', mode, b });
  }
  /* random: recipes from a seeded PRNG (level, story anywhere, tick subset, mode, build) */
  /* adds random states until the set has `target` states (duplicate recipes are skipped, so it is exact) */
  const rnd = (target, seed, tier) => { const R = mulberry32(seed), pick = xs => xs[Math.floor(R() * xs.length)];
    for (let i = 0; out.size < target; i++) {
      const lv = 1 + Math.floor(R() * 45), qi = R() < 0.06 ? -1 : Math.floor(R() * NQ);
      const t = pick(['none', 'before', 'lvonly', 'all', `rnd${100 + i % 50}p${pick([20, 50, 80, 95])}`]);
      add(tier === 'core' ? 'random' : 'xrandom', { lv, qi, ticks: t, mode: R() < 0.5 ? 'advanced' : 'basic', b: pick(['none', 'none', 'none', 'stwait', 'stready', 'stfull', 'sppts', 'cube', 'dv', 'rqmix', 'objs', 'filters']) }, tier);
    } };
  rnd(CORE - SPECIAL - fixtures.length, 0xA10E2, 'core');
  if (all) rnd(CORE - SPECIAL - fixtures.length + EXTENDED, 0xA10E3, 'all');

  /* special: no save at all, an empty save, a save from before every one-time step (the player seeds and migrations run),
     end of the story data, and the real fixtures (tests/fixtures) */
  const sp = (n, raw) => out.set('special/' + n, { id: 'special/' + n, tier: 'core', raw });
  sp('fresh-no-save', null);
  sp('empty-object', '{}');
  sp('pre-seeds-L12', JSON.stringify({ checks: {}, level: 12, quest: C.quests[G.onTrack(12)][1], open: {} }));
  sp('pre-eput-L30', JSON.stringify({ ...G.state({ lv: 30, qi: G.onTrack(30), ticks: 'before', mode: 'advanced', b: 'stfull' }), eputSync1: undefined }));
  { const last = C.quests[NQ - 1][1]; sp('story-end-turned-in', JSON.stringify({ ...G.state({ lv: 45, qi: NQ - 1, ticks: 'before', mode: 'advanced' }), storyEnd: last })); }
  sp('unknown-quest-name', JSON.stringify({ ...G.state({ lv: 30, qi: -1, ticks: 'before', mode: 'advanced' }), quest: 'A quest renamed in a patch' }));
  for (const f of fixtures) out.set('fixture/' + f.name, { id: 'fixture/' + f.name, tier: 'core', raw: f.raw });

  return [...out.values()].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

module.exports = { catalogInPage, generate, fnv };
