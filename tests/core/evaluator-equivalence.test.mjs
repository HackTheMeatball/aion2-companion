/* Evaluator equivalence (0.3 E1, docs/design/0.3-requirement-engine.md §15): for every golden-master state (the 2,000 core
   saves of tests/golden/states.js, loaded and migrated as the page does), `open` / `done` of every guide step, regional
   quest, plan node and skill line from evaluate() (proposals off, derived off) against today's gate code:

     step         open = milestone level ≤ level and openSteps' story gates (story / after / turnedIn; the byStory, Optional,
                  stigma-equip and "put on E" filters are display rules, so the probe lifts them; route rules have no gate)
     regional     open = rqStatus().ok; story + level part = rqStatus().open; its `pre` = the unmet done atoms
     plan node    open = blv ≤ level (dvNext), and dvNext() = the first open, unticked plan node
     skill line   open = SP_STEPS req ≤ level (skillOpen().now)
     all          done = the tick (today's ticks; derived completion is E4)

   Also, beyond the issue's list, today's other gate rules the evaluator will replace in E2 (§8): the stigma equip rule
   (slot level + "g22:0" ticked, rankNext), Sealed Dungeons (band ≤ level) and strongholds (band and lowest level ≤ level).

   A difference is never fixed here by changing today's code: each one is pinned in KNOWN with its cause (listed in the
   E1 PR for the owner), and the test fails on any difference not in KNOWN, and on a KNOWN one that no longer occurs.
   The full table goes to tests/out/evaluator-equivalence.md. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const { catalogInPage, generate } = createRequire(import.meta.url)('../golden/states.js');

/* difference key → cause. Key: "<kind> <save key> <field>: today <value> / evaluator <value>". */
const SH = 'live gate {level: levelRange.lo} (basis inferred); today the app files each stronghold under a Sealed Dungeon band ' +
  '(src/core/catalog.js AREA_BANDS, inferred placement) and offers it from max(band, lo). E2 decision: band into the data, or lo';
const ST_G22 = 'today\'s equip rule (rankNext: slot level + "g22:0" ticked) is code; in the data it is the owner-check proposal of check 3, ' +
  'so the live gate is the slot level only';
const KNOWN = {
  ...Object.fromEntries(['blades-temporary-outpost', 'corrupted-forester-ruins', 'forest-marauder-campsite', 'granach-s-hideout', 'graverobber-den',
    'latrima-outpost', 'logger-s-rest-ruins', 'rubek-thieves-occupied-territory', 'sanctum-outskirts-watch'].map(s => [`sh sh:${s} open: today false / evaluator true`, SH])),
  'stigma g22:1 open: today false / evaluator true': ST_G22 + ' plus "Daeva in a Dream" reached (legacy atom): the story is there but "g22:0" is not ticked',
  'stigma g22:1 open: today true / evaluator false': 'live gate has "Daeva in a Dream" reached (legacy atom); today\'s equip rule reads only the slot level and "g22:0" ' +
    'ticked: "g22:0" ticked with the story before "Daeva in a Dream" or unset',
  'stigma g27:0 open: today false / evaluator true': ST_G22,
  'stigma g32:0 open: today false / evaluator true': ST_G22,
  'stigma g37:0 open: today false / evaluator true': ST_G22,
};

export default (test, M) => {
  /* the golden states, built from the catalog the page would hand catalogInPage() (same data, same core) */
  const C = new Function('QUESTS', 'QUEST_STEPS', 'GATES', 'STEPS', 'RQ', 'AREA_ITEMS', 'SP_STEPS', 'STIGMA_PLAN', 'STIGMA_SLOTS', 'DV_NODES', `return (${catalogInPage})();`)(
    M.QUESTS, M.QUEST_STEPS, M.GATES, M.STEPS, M.RQ, M.AREA_ITEMS, M.SP_STEPS, M.STIGMA_PLAN, () => M.stigmaSlots({}), M.DV_NODES);
  const fixtures = ['fixture-v285.json', 'fixture-user-v285.json'].map(f => ({ name: f.replace(/\.json$/, ''), raw: JSON.stringify(JSON.parse(readFileSync(join(ROOT, 'tests/fixtures', f), 'utf8'))) }));
  const states = generate(C, { fixtures }).map(({ id, raw }) => { const { state, hadSave } = M.loadState(raw); M.migrate(state, hadSave, () => {}, 0); return { id, s: state, c: M.char(state) }; });
  const N = M.GATE_GRAPH.nodes;
  const diffs = new Map(), seen = { step: new Set(), rq: new Set(), plan: new Set(), skill: new Set() };
  const cmp = (kind, k, field, today, ev, id) => { if (today === ev) return; const d = `${kind} ${k} ${field}: today ${today} / evaluator ${ev}`;
    const x = diffs.get(d) || { n: 0, ex: id }; x.n++; diffs.set(d, x); };
  let evs = null;

  test(`equivalence: ${states.length} golden states (2,000 core saves) loaded and migrated`, () => {
    assert.equal(states.length, 2000);
    evs = states.map(({ c }) => M.evaluate(c));
  });

  test('equivalence: guide steps (open = milestone level + openSteps story gates, done = tick)', () => {
    /* lift the display filters on the registered items for the probe; restored below */
    const items = [...M.GATES, ...M.STEPS].flatMap(g => g.items).filter(it => it.k && N[it.k] && N[it.k].kind === 'step');
    const FLAGS = ['opt', 'stig', 'eput', 'byStory'], saved = new Map();
    for (const it of [...items, ...items.map(it => M.itemByK(it.k))]) if (!saved.has(it)) saved.set(it, Object.fromEntries(FLAGS.filter(f => f in it).map(f => [f, it[f]])));
    const notInGraph = [...new Set([...M.GATES, ...M.STEPS].flatMap(g => g.items).filter(it => it.k && !it.dv && it.kind !== 'quest' && it.kind !== 'hideout' && !/^sp:/.test(it.k) && !N[it.k]).map(it => it.k))];
    try {
      for (const it of saved.keys()) for (const f of FLAGS) delete it[f];
      states.forEach(({ id, s, c }, i) => {
        const ev = evs[i], probe = { ...s, checks: {} };
        for (const g of M.GATES) for (const it of g.items) {
          if (!it.k || !N[it.k] || N[it.k].kind !== 'step') continue;
          seen.step.add(it.k);
          const r = ev.byKey(it.k), open = g.lv <= c.level && M.openSteps(probe, { id: g.id, items: [it] }).length === 1;
          cmp('step', it.k, 'open', open, r.open, id); cmp('step', it.k, 'done', !!c.checks[it.k], r.done !== false, id);
        }
        for (const g of M.STEPS) for (const it of g.items) {
          if (!it.k) continue; seen.step.add(it.k);
          const r = ev.byKey(it.k); cmp('step', it.k, 'open', true, r.open, id); cmp('step', it.k, 'done', !!c.checks[it.k], r.done !== false, id);
        }
      });
    } finally { for (const [it, v] of saved) Object.assign(it, v); }
    assert.deepEqual([...seen.step].sort(), Object.keys(N).filter(k => N[k].kind === 'step').sort(), 'every step node is compared');
    assert.deepEqual(notInGraph, ['g28:exp'], 'the only milestone row without a data record (code in src/core/catalog.js) is Urugugu Canyon');
  });

  test('equivalence: regional quests (open = rqStatus ok, story + level part = rqStatus open, pre, done = tick)', () => {
    states.forEach(({ id, c }, i) => {
      const ev = evs[i];
      for (const q of M.RQ) {
        const k = 'rq:' + q.id, r = ev.byKey(k), st = M.rqStatus(c, q); seen.rq.add(k);
        cmp('rq', k, 'open', st.ok, r.open, id);
        cmp('rq', k, 'open without regional prerequisites', st.open, r.blockers.every(b => b.kind === 'done'), id);
        if (st.open) cmp('rq', k, 'pre', st.pre.map(n => 'rq:' + M.RQ_BY[n].id).join(','), r.blockers.filter(b => b.kind === 'done').map(b => b.of).join(','), id);
        cmp('rq', k, 'done', !!c.checks[k], r.done !== false, id);
      }
    });
    assert.equal(seen.rq.size, 58);
  });

  test('equivalence: plan nodes (open = blv ≤ level, dvNext = first open unticked, done = tick)', () => {
    const DV = M.DV_NODES();
    states.forEach(({ id, c }, i) => {
      const ev = evs[i];
      for (const it of DV) { const r = ev.byKey(it.k); seen.plan.add(it.k);
        cmp('plan', it.k, 'open', it.blv <= c.level, r.open, id); cmp('plan', it.k, 'done', !!c.checks[it.k], r.done !== false, id); }
      const dn = M.dvNext(c, c.level), first = DV.find(it => { const r = ev.byKey(it.k); return r.open && r.done === false; });
      cmp('plan', '(dvNext)', 'node', dn ? dn.k : 'none', first ? first.k : 'none', id);
    });
    assert.deepEqual([...seen.plan], M.DV_NODES().map(it => it.k));
    assert.deepEqual(M.evaluate({ checks: {}, level: 1 }).list(r => r.kind === 'plan').map(r => r.id), M.DV_NODES().map(it => it.k), 'plan nodes in the milestones\' order');
  });

  test('equivalence: skill lines (open = SP_STEPS req ≤ level, done = tick)', () => {
    states.forEach(({ id, c }, i) => {
      const ev = evs[i];
      for (const x of M.SP_STEPS) { const r = ev.byKey(x.k); seen.skill.add(x.k);
        cmp('skill', x.k, 'open', x.req <= c.level, r.open, id); cmp('skill', x.k, 'done', !!c.checks[x.k], r.done !== false, id); }
      const so = M.skillOpen(c);
      cmp('skill', '(skillOpen now)', 'keys', so.now.map(x => x.k).join(','), so.open.filter(x => ev.byKey(x.k).open).map(x => x.k).join(','), id);
    });
    assert.equal(seen.skill.size, M.SP_STEPS.length);
  });

  test('equivalence (beyond §15): stigma equip rule, Sealed Dungeons, strongholds', () => {
    states.forEach(({ id, c }, i) => {
      const ev = evs[i];
      for (const sl of M.stigmaSlots(c)) cmp('stigma', sl.k, 'open', sl.lv <= c.level && !!c.checks['g22:0'], ev.byKey(sl.k).open, id);
      for (const x of M.AREA_ITEMS) {
        const r = ev.byKey(x.k), today = x.it.kind === 'hideout' ? x.lv <= c.level : M.bandOf(x) <= c.level && (x.it.lo || 0) <= c.level;
        cmp(x.it.kind === 'hideout' ? 'sd' : 'sh', x.k, 'open', today, r.open, id); cmp(x.it.kind === 'hideout' ? 'sd' : 'sh', x.k, 'done', !!c.checks[x.k], r.done !== false, id);
      }
    });
  });

  test('equivalence: every difference from today is a known one (KNOWN, with its cause), and every known one still occurs', () => {
    const rows = [...diffs].sort((a, b) => a[0] < b[0] ? -1 : 1);
    mkdirSync(join(ROOT, 'tests/out'), { recursive: true });
    writeFileSync(join(ROOT, 'tests/out/evaluator-equivalence.md'), ['# Evaluator vs today (golden states, proposals off, derived off)', '',
      `${states.length} states. ${rows.length} difference(s).`, '', '| Difference | States | Example | Cause |', '|---|---|---|---|',
      ...rows.map(([d, x]) => `| ${d} | ${x.n} | ${x.ex} | ${KNOWN[d] || '**unknown**'} |`), ''].join('\n'));
    for (const [d, x] of rows) console.log(`     ${KNOWN[d] ? 'known' : 'NEW  '} ${d} · ${x.n} states, e.g. ${x.ex}`);
    assert.deepEqual(rows.filter(([d]) => !KNOWN[d]).map(([d]) => d), [], 'differences not in KNOWN');
    assert.deepEqual(Object.keys(KNOWN).filter(d => !diffs.has(d)), [], 'KNOWN differences that no longer occur');
  });
};
