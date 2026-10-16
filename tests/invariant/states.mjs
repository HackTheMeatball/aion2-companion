/* The invariant suite's states (0.3 E3, docs/design/0.3-requirement-engine.md §12): 10,000 saves, deterministic.
   1. golden  the golden-master generator (tests/golden/states.js) with --all: its 2,000 core states (edge cases and the
              fixtures included) plus its 6,000 extended random ones (its own fixed seeds);
   2. target  every story position (and unset) × {its level − 1, its level, 45} × {no ticks, all ticks, "kept up" ticks
              with a stored false on every item that can be done by derivation} × Basic / Advanced; the last quest turned
              in (storyEnd); every quest one level under its own with all objectives ticked; "Urgent Pursuit" reached /
              turned in at Lv 11–13 (the Daevanion window); each specialty skill with lines ticked to 7 / 8 / 11 / 12
              around the next line's level, and (E7) with lines plus 0–4 of its plan board nodes (effective level 8 … 14)
              and specialty slots 1 / 2 ticked;
   3. random  seeded recipes (mulberry32(seed)) up to TOTAL: level, story (6 % unset), storyEnd (none / current / last /
              another quest), per-key ticks, picked-up and snoozed regional quests, a dungeon in progress, objectives,
              shards, Cube items, board costs, Basic / Advanced.
   Each state: { id, raw } (raw = the stored text, null = no save). Ids are recipes (golden ones keep the golden id), so
   `--state <id>` with the same seed replays one. */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const { catalogInPage, generate, fnv } = createRequire(import.meta.url)('../golden/states.js');
export const TOTAL = 10000;
const FLAGS = { seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true };
const mulberry32 = a => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pad = (n, w = 2) => String(n).padStart(w, '0');

/* the catalog the golden generator reads, from the core bundle M (as tests/equiv does) */
export const catalogOf = M => new Function('QUESTS', 'QUEST_STEPS', 'GATES', 'STEPS', 'RQ', 'AREA_ITEMS', 'SP_STEPS', 'STIGMA_PLAN', 'STIGMA_SLOTS', 'DV_NODES', `return (${catalogInPage})();`)(
  M.QUESTS, M.QUEST_STEPS, M.GATES, M.STEPS, M.RQ, M.AREA_ITEMS, M.SP_STEPS, M.STIGMA_PLAN, () => M.stigmaSlots({}), M.DV_NODES);

export function makeStates(M, { root, seed }) {
  const C = catalogOf(M), NQ = C.quests.length, out = new Map();
  const fixtures = ['fixture-v285.json', 'fixture-user-v285.json'].map(f => ({ name: f.replace(/\.json$/, ''), raw: JSON.stringify(JSON.parse(readFileSync(join(root, 'tests/fixtures', f), 'utf8'))) }));
  for (const s of generate(C, { fixtures, all: true })) out.set('golden/' + s.id, { id: 'golden/' + s.id, raw: s.raw });

  /* every trackable save key, and the ones whose record can also be done without a tick (a stored false there is the
     "ticked-but-derived-false" case): completesWith beyond "tick", and the Ascension steps (wrapper rule, §5) */
  const steps = JSON.parse(readFileSync(join(root, 'data/shared/asmodian/guide/steps.json'), 'utf8')).records;
  const derivable = steps.filter(s => s.completesWith.some(e => e !== 'tick') || s.ascensionQuest).map(s => s.key);
  const keys = [...new Set([...C.gates.flatMap(g => g.items.filter(it => !it.sub && !it.hidden).map(it => it.k)), ...C.steps.flatMap(s => s.items),
    ...C.rq.map(q => 'rq:' + q.id), ...C.areas.map(x => x.k), ...C.sp.map(x => x.k), ...C.dvNodes.map(x => x.k), ...C.slots.map(x => x.k)])];
  /* "kept up": what a player at (lv, story qi) has done: everything whose level is below lv and whose story is reached */
  const qIdx = n => C.quests.findIndex(q => q[1] === n);
  const levelOf = new Map([...C.gates.flatMap(g => g.items.map(it => [it.k, { lv: it.dv ? it.blv : it.lv, story: it.story }])),
    ...C.rq.map(q => ['rq:' + q.id, { lv: q.rec, story: q.story }]), ...C.areas.map(x => [x.k, { lv: x.lv }]), ...C.sp.map(x => [x.k, { lv: x.req }])]);
  const keptUp = (lv, qi) => Object.fromEntries(keys.filter(k => { const x = levelOf.get(k); return x && x.lv < lv && (!x.story || (qi >= 0 && qi >= qIdx(x.story))); }).map(k => [k, true]));
  const base = (lv, qi, checks, mode) => ({ checks, level: lv, quest: qi >= 0 ? C.quests[qi][1] : '', open: {}, mode, ...FLAGS });
  const add = (id, st) => { if (!out.has(id)) out.set(id, { id, raw: st === null ? null : JSON.stringify(st) }); };
  /* on track: the last quest whose level is ≤ lv */
  const onTrack = lv => C.quests.reduce((a, q, j) => q[0] <= lv ? j : a, -1);
  const qid = qi => qi < 0 ? 'qxx' : 'q' + pad(qi);

  /* 2. targeted */
  for (let qi = -1; qi < NQ; qi++) {
    const ql = qi < 0 ? 12 : C.quests[qi][0];
    for (const lv of [...new Set([Math.max(1, ql - 1), ql, 45])]) for (const t of ['none', 'all', 'dfalse']) for (const mode of ['advanced', 'basic']) {
      const checks = t === 'none' ? {} : t === 'all' ? Object.fromEntries(keys.map(k => [k, true])) : { ...keptUp(lv, qi), ...Object.fromEntries(derivable.map(k => [k, false])) };
      add(`target/story/L${pad(lv)}-${qid(qi)}-${t}-${mode === 'basic' ? 'B' : 'A'}`, base(lv, qi, checks, mode));
    }
    if (qi >= 0) { /* every objective ticked one level under the quest's own (the story card's "Turned in" while level-gated) */
      const n = C.questSteps[C.quests[qi][1]] || 0, lv = Math.max(1, ql - 1);
      add(`target/objs-all/L${pad(lv)}-${qid(qi)}`, { ...base(lv, qi, keptUp(lv, qi), 'advanced'), qsteps: { [C.quests[qi][1]]: Array.from({ length: n }, (_, i) => i) }, showTalk: true });
    }
  }
  for (const lv of [44, 45]) for (const t of ['none', 'all']) {
    const qi = NQ - 1, checks = t === 'none' ? {} : Object.fromEntries(keys.map(k => [k, true]));
    add(`target/story-end/L${lv}-${qid(qi)}-${t}`, { ...base(lv, qi, checks, 'advanced'), storyEnd: C.quests[qi][1] });
  }
  { const up = qIdx('Urgent Pursuit'); if (up < 0) throw new Error('states: "Urgent Pursuit" is not on the chain');
    for (const qi of [up - 1, up, up + 1]) for (const lv of [11, 12, 13]) for (const t of ['none', 'before']) for (const b of ['none', 'dv']) {
      const st = base(lv, qi, t === 'none' ? {} : keptUp(lv, qi), 'advanced');
      if (b === 'dv') { st.dvCost = Object.fromEntries(C.dvNodes.map((n, i) => [n.k, 1 + i % 4])); st.dvTotal = 40; }
      add(`target/daevanion/L${lv}-${qid(qi)}-${t}-${b}`, st);
    } }
  for (const s of [...new Set(C.sp.filter(x => x.spec).map(x => x.n))]) {
    const lines = C.sp.filter(x => x.n === s && !x.spec);
    for (const E of [7, 8, 11, 12]) {
      const next = lines.find(x => x.L === E + 1), nl = next ? next.req : lines[lines.length - 1].req;
      for (const lv of [...new Set([Math.max(1, nl - 1), nl, 45])]) for (const spec of [false, true]) {
        const checks = Object.fromEntries(lines.filter(x => x.L <= E).map(x => [x.k, true])); if (spec) checks[`sp:${s}:spec`] = true;
        add(`target/skill/${s.replace(/\W+/g, '-')}-E${E}-L${pad(lv)}${spec ? '-spec' : ''}`, { ...base(lv, onTrack(lv), checks, 'advanced'), stones: 4 });
      }
    }
    /* 0.3 E7: effective level from lines + the skill's plan board nodes: lines to 7 + 1 node (8 by a node), lines to 10 + 0 … 4
       nodes (10 … 14, the cap), lines to 11 − k + k nodes; with no slot, slot 1, slots 1 + 2 ticked */
    const sid = M.GATE_GRAPH.nodes[lines[0].k].skill, plan = Object.values(M.GATE_GRAPH.nodes).filter(n => n.kind === 'plan' && n.skill === sid).map(n => n.key);
    for (const [E, nN] of [[7, 1], [10, 0], [10, 2], [10, 4], [8, 4]]) if (nN <= plan.length)
      for (const lv of [45]) for (const sp of [0, 1, 2]) {
        const checks = Object.fromEntries([...lines.filter(x => x.L <= E).map(x => x.k), ...plan.slice(0, nN), ...[`sp:${s}:spec`, `sp:${s}:spec2`].slice(0, sp)].map(k => [k, true]));
        add(`target/skill-eff/${s.replace(/\W+/g, '-')}-E${E}+${nN}-L${pad(lv)}-s${sp}`, { ...base(lv, onTrack(lv), checks, 'advanced'), stones: 4 });
      }
  }

  /* 3. seeded random, to TOTAL */
  const R = mulberry32(seed), pick = xs => xs[Math.floor(R() * xs.length)];
  for (let i = 0; out.size < TOTAL; i++) {
    const lv = 1 + Math.floor(R() * 45), qi = R() < 0.06 ? -1 : Math.floor(R() * NQ), p = pick([0, 0.2, 0.5, 0.8, 0.95, 1]), mode = R() < 0.5 ? 'advanced' : 'basic';
    const kept = R() < 0.4, salt = `${seed}|${i}|`;
    const checks = kept ? keptUp(lv, qi) : Object.fromEntries(keys.filter(k => fnv(salt + k) < p).map(k => [k, true]));
    if (R() < 0.2) derivable.forEach(k => { checks[k] = false; });
    const st = base(lv, qi, checks, mode);
    const se = R(); if (qi >= 0 && se < 0.1) st.storyEnd = C.quests[qi][1]; else if (se < 0.15) st.storyEnd = C.quests[NQ - 1][1]; else if (se < 0.2) st.storyEnd = pick(C.quests)[1];
    if (R() < 0.3) { st.started = {}; C.rq.filter(q => !checks['rq:' + q.id] && fnv(salt + 's' + q.id) < 0.3).forEach(q => { st.started['rq:' + q.id] = R() < 0.5 ? 1 : true; }); }
    if (R() < 0.2) { st.rqSnooze = {}; C.rq.filter(q => fnv(salt + 'z' + q.id) < 0.2).forEach(q => { st.rqSnooze['rq:' + q.id] = lv; }); }
    if (R() < 0.15) { const x = pick(C.areas); st.areaRun = { [x.k]: 1760000000000 }; }
    if (qi >= 0 && R() < 0.3) { const n = C.questSteps[C.quests[qi][1]] || 0, all = R() < 0.5; st.qsteps = { [C.quests[qi][1]]: Array.from({ length: all ? n : Math.floor(n / 2) }, (_, j) => j) }; }
    if (R() < 0.3) { st.stShards = Math.floor(R() * 12); st.stLv = Object.fromEntries(C.stigmaPlan.map(n => [n, 1 + Math.floor(R() * 4)])); }
    if (R() < 0.2) { st.pendSt = Math.floor(R() * 3); st.pendCr = Math.floor(R() * 3); st.stones = Math.floor(R() * 6); }
    if (R() < 0.3) { st.dvCost = Object.fromEntries(C.dvNodes.filter(() => R() < 0.7).map(n => [n.k, Math.floor(R() * 6)])); st.dvTotal = Math.floor(R() * 140); }
    if (R() < 0.2) Object.assign(st, { hide: true, hideOpt: R() < 0.5, showTalk: R() < 0.5 });
    add(`random/${i}-L${pad(lv)}-${qid(qi)}-p${Math.round(p * 100)}${kept ? '-kept' : ''}-${mode === 'basic' ? 'B' : 'A'}`, st);
  }
  return [...out.values()];
}
