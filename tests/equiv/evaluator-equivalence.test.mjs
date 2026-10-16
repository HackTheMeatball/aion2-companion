/* Evaluator equivalence (0.3 E1 / E2, docs/design/0.3-requirement-engine.md §15), suite `equiv`. For every golden-master
   state (the 2,000 core saves of tests/golden/states.js, loaded and migrated as the page does), two comparisons against
   the 0.2 gate rules, frozen in tests/support/gates-0.2.mjs (L below):

   A. the bare evaluator (GATE_GRAPH as the data has it, proposals off, derived off) against 0.2: `open` / `done` of every
      guide step, regional quest, plan node and skill line, plus the stigma equip rule and Sealed Dungeons / strongholds:
        step         open = milestone level ≤ level and openSteps' story gates (story / after / turnedIn; the byStory,
                     Optional, stigma-equip and "put on E" filters are display rules, so the probe lifts them)
        regional     open = rqStatus().ok; story + level part = rqStatus().open; its `pre` = the unmet done atoms
        plan node    open = blv ≤ level (dvNext), and dvNext() = the first open, unticked plan node
        skill line   open = SP_STEPS req ≤ level (skillOpen().now)
        all          done = the tick (derived completion is E4)
      A difference is never fixed by changing the 0.2 rules: each one is pinned in KNOWN with its cause and the kept rule
      (src/core/requirements.js KEPT_RULES) that holds 0.2's behaviour on screen until the data takes it over. The test
      fails on a difference not in KNOWN and on a KNOWN one that no longer occurs. Table: tests/out/evaluator-equivalence.md.

   B. what the page runs since E2 (the requirements.js functions main.js and nextup.js call: the evaluator plus the kept
      rules) against 0.2, with no difference allowed: E2 changes nothing a player sees. Run with the 0.3 E4 changes off
      (setGateChanges([])): what they change is reviewed per change by tests/golden.js --explain and judged by the
      invariant suite; with them off the wiring must still be exactly 0.2.

   The 0.2 rules from main.js (stronghold band, stigma rows, Daevanion board, story chips) are reimplemented in
   gates-0.2.mjs because main.js doesn't run in Node: drift there would not be seen by A. B calls the app's own
   requirements.js functions; what main.js does with their answers is checked by the browser suites (golden, gates), and an
   inline gate comparison in main.js that bypasses them by the source check (tests/core/gate-sources.test.mjs). */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gates02 } from '../support/gates-0.2.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const { catalogInPage, generate } = createRequire(import.meta.url)('../golden/states.js');

/* difference key → cause [kept rule]. Key: "<kind> <save key> <field>: 0.2 <value> / evaluator <value>". */
const SH = 'live gate {level: levelRange.lo} (basis inferred); 0.2 files each stronghold under a Sealed Dungeon band ' +
  '(src/core/catalog.js AREA_BANDS, inferred placement) and offers it from max(band, lo) [kept rule "stronghold-band"]';
const ST_G22 = '0.2\'s equip rule (rankNext: slot level + "g22:0" ticked) is code; in the data it is the owner-check proposal of check 3, ' +
  'so the live gate is the slot level only';
const KNOWN = {
  ...Object.fromEntries(['blades-temporary-outpost', 'corrupted-forester-ruins', 'forest-marauder-campsite', 'granach-s-hideout', 'graverobber-den',
    'latrima-outpost', 'logger-s-rest-ruins', 'rubek-thieves-occupied-territory', 'sanctum-outskirts-watch'].map(s => [`sh sh:${s} open: 0.2 false / evaluator true`, SH])),
  'stigma g22:1 open: 0.2 false / evaluator true': ST_G22 + ' plus "Daeva in a Dream" reached (legacy atom): the story is there but "g22:0" is not ticked ' +
    '[kept rules "stigma-slot-1-after-g22:0", "stigma-equip-after-g22:0"]',
  'stigma g22:1 open: 0.2 true / evaluator false': 'live gate has "Daeva in a Dream" reached (legacy atom); 0.2\'s equip rule reads only the slot level and "g22:0" ' +
    'ticked: "g22:0" ticked with the story before "Daeva in a Dream" or unset [kept rule "stigma-slot-1-after-g22:0"]',
  'stigma g27:0 open: 0.2 false / evaluator true': ST_G22 + ' [kept rule "stigma-equip-after-g22:0"]',
  'stigma g32:0 open: 0.2 false / evaluator true': ST_G22 + ' [kept rule "stigma-equip-after-g22:0"]',
  'stigma g37:0 open: 0.2 false / evaluator true': ST_G22 + ' [kept rule "stigma-equip-after-g22:0"]',
};

/* E9 (2026-10-15, owner check 1): every regional quest's story gate is "turned in" (the quest after the gate's quest), not "reached"; Shugo-of-All-Trades
   and Spooky Specters also gained a story gate (they were open from their recommended level). The 0.2 form is the page's with the switch regionalTurnedIn
   off, held to the frozen rules by B; here the live data is compared with 0.2 and each regional quest that differs is known by its record. */
const RQ_TURNED_IN = 'live story gate is "turned in" (owner check 1, 2026-10-15; data/packs/aion2/asmodian/regional-quests.json); 0.2 opened the quest when the story ' +
  'reached it [switch "regionalTurnedIn", held to 0.2 by B]';
const regionalKnown = M => {
  const out = {}, atoms = g => g.all ? g.all.flatMap(atoms) : g.any ? g.any.flatMap(atoms) : [g];
  for (const [id, n] of Object.entries(M.GATE_GRAPH.nodes)) if (n.kind === 'rq' && atoms(n.req).some(a => a.story && a.is === 'turnedIn'))
    for (const f of ['open', 'open without regional prerequisites']) for (const d of ['true / evaluator false', 'false / evaluator true']) out[`rq ${id} ${f}: 0.2 ${d}`] = RQ_TURNED_IN;
  return out;
};

/* E5 (2026-10-16): the ready proposals of design §7 are live. The two regional quests are in regionalKnown (their gate is "turned in");
   the Noble Belt / Revelation Amulet steps wait for the quest that gives the item, and every plan node for the Daevanion gate
   ("Urgent Pursuit" turned in), so each can only be closed where 0.2 had it open (and dvNext then finds none). Held to 0.2 by B with the
   switches off. */
const E5 = 'live gate since E5 (ready proposal applied, design §7; switches "beltGate" / "amuletGate" / "daevanionGate", held to 0.2 by B)';
const e5Known = M => ({
  'step g12:belt open: 0.2 true / evaluator false': E5 + ': offered once "Urgent Pursuit" is turned in',
  'step g16:amulet open: 0.2 true / evaluator false': E5 + ': offered once "Buried Atrocities" is turned in',
  ...Object.fromEntries(M.DV_NODES().flatMap(it => [[`plan ${it.k} open: 0.2 true / evaluator false`, E5 + ': the board waits for "Urgent Pursuit" turned in'],
    [`plan (dvNext) node: 0.2 ${it.k} / evaluator none`, E5 + ': every board waits for "Urgent Pursuit" turned in']])),
});

/* E7 (bug F3, design §9): a specialty slot opens on effective skill level (lines bought + plan nodes owned), not at the
   character level of its skill's line 8, so slot 1 differs from 0.2 both ways. Held to 0.2 by B with the switch off. */
const E7 = 'live gate since E7: effective skill level ≥ 8 (rule:specialty-slots; switch "specialtySlots", held to 0.2 by B)';
const e7Known = M => Object.fromEntries(M.SP_STEPS.filter(x => x.spec).flatMap(x => ['true / evaluator false', 'false / evaluator true'].map(d => [`skill ${x.k} open: 0.2 ${d}`, E7])));

export default (test, M) => {
  const L = gates02(M);
  const ALLOWED = { ...regionalKnown(M), ...e5Known(M), ...e7Known(M) };   /* allowed by record, not pinned state by state: the gate differs only where a level or the story position puts the two readings apart */
  /* the golden states, built from the catalog the page would hand catalogInPage() (same data, same core) */
  const C = new Function('QUESTS', 'QUEST_STEPS', 'GATES', 'STEPS', 'RQ', 'AREA_ITEMS', 'SP_STEPS', 'STIGMA_PLAN', 'STIGMA_SLOTS', 'DV_NODES', `return (${catalogInPage})();`)(
    M.QUESTS, M.QUEST_STEPS, M.GATES, M.STEPS, M.RQ, M.AREA_ITEMS, M.SP_STEPS, M.STIGMA_PLAN, () => M.stigmaSlots({}), M.DV_NODES);
  const fixtures = ['fixture-v285.json', 'fixture-user-v285.json'].map(f => ({ name: f.replace(/\.json$/, ''), raw: JSON.stringify(JSON.parse(readFileSync(join(ROOT, 'tests/fixtures', f), 'utf8'))) }));
  const states = generate(C, { fixtures }).map(({ id, raw }) => { const { state, hadSave } = M.loadState(raw); M.migrate(state, hadSave, () => {}, 0); return { id, s: state, c: M.char(state) }; });
  const N = M.GATE_GRAPH.nodes;
  const diffs = new Map(), seen = { step: new Set(), rq: new Set(), plan: new Set(), skill: new Set() };
  const cmp = (kind, k, field, old, ev, id) => { if (old === ev) return; const d = `${kind} ${k} ${field}: 0.2 ${old} / evaluator ${ev}`;
    const x = diffs.get(d) || { n: 0, ex: id }; x.n++; diffs.set(d, x); };
  /* B: app (since E2) vs 0.2; every difference fails */
  const appDiffs = new Map();
  const same = (what, old, app, id) => { const a = JSON.stringify(old), b = JSON.stringify(app); if (a === b) return;
    const x = appDiffs.get(what) || { n: 0, ex: `${id}: 0.2 ${a.slice(0, 160)} / app ${b.slice(0, 160)}` }; x.n++; appDiffs.set(what, x); };
  const testB = (name, fn) => test(name, () => { appDiffs.clear(); const on = Object.keys(M.GATE_CHANGES).filter(M.gateChangeOn); M.setGateChanges([]);
    try { fn(); } finally { M.setGateChanges(on); } assert.deepEqual([...appDiffs].map(([w, x]) => `${w} · ${x.n} states, e.g. ${x.ex}`), [], 'app differs from 0.2'); });
  let evs = null;

  test(`equivalence: ${states.length} golden states (2,000 core saves) loaded and migrated`, () => {
    assert.equal(states.length, 2000);
    evs = states.map(({ c }) => M.evaluate(c));
  });

  /* ---------- A: the bare evaluator vs 0.2 ---------- */
  test('A. guide steps (open = milestone level + openSteps story gates, done = tick)', () => {
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
          const r = ev.byKey(it.k), open = g.lv <= c.level && L.openSteps(probe, { id: g.id, items: [it] }).length === 1;
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

  test('A. regional quests (open = rqStatus ok, story + level part = rqStatus open, pre, done = tick)', () => {
    states.forEach(({ id, c }, i) => {
      const ev = evs[i];
      for (const q of M.RQ) {
        const k = 'rq:' + q.id, r = ev.byKey(k), st = L.rqStatus(c, q); seen.rq.add(k);
        cmp('rq', k, 'open', st.ok, r.open, id);
        cmp('rq', k, 'open without regional prerequisites', st.open, r.blockers.every(b => b.kind === 'done'), id);
        if (st.open) cmp('rq', k, 'pre', st.pre.map(n => 'rq:' + M.RQ_BY[n].id).join(','), r.blockers.filter(b => b.kind === 'done').map(b => b.of).join(','), id);
        cmp('rq', k, 'done', !!c.checks[k], r.done !== false, id);
      }
    });
    assert.equal(seen.rq.size, 58);
  });

  test('A. plan nodes (open = blv ≤ level, dvNext = first open unticked, done = tick)', () => {
    const DV = M.DV_NODES();
    states.forEach(({ id, c }, i) => {
      const ev = evs[i];
      for (const it of DV) { const r = ev.byKey(it.k); seen.plan.add(it.k);
        cmp('plan', it.k, 'open', it.blv <= c.level, r.open, id); cmp('plan', it.k, 'done', !!c.checks[it.k], r.done !== false, id); }
      const dn = L.dvNext(c, c.level), first = DV.find(it => { const r = ev.byKey(it.k); return r.open && r.done === false; });
      cmp('plan', '(dvNext)', 'node', dn ? dn.k : 'none', first ? first.k : 'none', id);
    });
    assert.deepEqual([...seen.plan], M.DV_NODES().map(it => it.k));
    assert.deepEqual(M.evaluate({ checks: {}, level: 1 }).list(r => r.kind === 'plan').map(r => r.id), M.DV_NODES().map(it => it.k), 'plan nodes in the milestones\' order');
  });

  test('A. skill lines (open = SP_STEPS req ≤ level, done = tick)', () => {
    states.forEach(({ id, c }, i) => {
      const ev = evs[i];
      for (const x of M.SP_STEPS) { const r = ev.byKey(x.k); seen.skill.add(x.k);
        cmp('skill', x.k, 'open', x.req <= c.level, r.open, id); cmp('skill', x.k, 'done', !!c.checks[x.k], r.done !== false, id); }
      /* the specialty slots are compared one by one above (E7, allowed by record) */
      const so = L.skillOpen(c), line = x => !x.spec;
      cmp('skill', '(skillOpen now)', 'keys', so.now.filter(line).map(x => x.k).join(','), so.open.filter(x => line(x) && ev.byKey(x.k).open).map(x => x.k).join(','), id);
    });
    assert.equal(seen.skill.size, M.SP_STEPS.length);
  });

  test('A. (beyond §15) stigma equip rule, Sealed Dungeons, strongholds', () => {
    states.forEach(({ id, c }, i) => {
      const ev = evs[i];
      for (const sl of M.stigmaSlots(c)) cmp('stigma', sl.k, 'open', L.stigmaEquip(c, sl), ev.byKey(sl.k).open, id);
      for (const x of M.AREA_ITEMS) {
        const r = ev.byKey(x.k), kind = x.it.kind === 'hideout' ? 'sd' : 'sh';
        cmp(kind, x.k, 'open', L.areaOpen(c, x), r.open, id); cmp(kind, x.k, 'done', !!c.checks[x.k], r.done !== false, id);
      }
    });
  });

  test('A. every difference from 0.2 is a known one (KNOWN, with its cause), and every known one still occurs', () => {
    const rows = [...diffs].sort((a, b) => a[0] < b[0] ? -1 : 1);
    mkdirSync(join(ROOT, 'tests/out'), { recursive: true });
    writeFileSync(join(ROOT, 'tests/out/evaluator-equivalence.md'), ['# Evaluator vs 0.2 (golden states, proposals off, derived off)', '',
      `${states.length} states. ${rows.length} difference(s), each kept on screen by the named rule.`, '', '| Difference | States | Example | Cause |', '|---|---|---|---|',
      ...rows.map(([d, x]) => `| ${d} | ${x.n} | ${x.ex} | ${KNOWN[d] || ALLOWED[d] || '**unknown**'} |`), ''].join('\n'));
    for (const [d, x] of rows) console.log(`     ${KNOWN[d] || ALLOWED[d] ? 'known' : 'NEW  '} ${d} · ${x.n} states, e.g. ${x.ex}`);
    assert.deepEqual(rows.filter(([d]) => !KNOWN[d] && !ALLOWED[d]).map(([d]) => d), [], 'differences not in KNOWN');
    assert.ok(rows.some(([d]) => ALLOWED[d]), 'the regional "turned in" gates do differ from 0.2 somewhere');
    assert.deepEqual(Object.keys(KNOWN).filter(d => !diffs.has(d)), [], 'KNOWN differences that no longer occur');
    const named = new Set(Object.values(KNOWN).flatMap(v => [...v.matchAll(/"([a-z0-9:-]+)"/g)].map(m => m[1])).filter(r => r in M.KEPT_RULES));
    assert.deepEqual([...named].sort(), ['stigma-equip-after-g22:0', 'stigma-slot-1-after-g22:0', 'stronghold-band'], 'each difference names the kept rule that covers it');
  });

  /* ---------- B: what the page runs since E2 vs 0.2 (no difference allowed) ---------- */
  testB('B. Next up steps: openSteps on every milestone, for every state', () => {
    states.forEach(({ id, s }) => {
      for (const g of M.GATES) same(`openSteps ${g.id}`, L.openSteps(s, g).map(x => x.k), M.openSteps(s, g).map(x => x.k), id);
    });
  });

  testB('B. regional quests: rqStatus (open, ok, pre) for every quest, at another level too; waiting on the story', () => {
    states.forEach(({ id, c }) => {
      for (const q of M.RQ) { same(`rqStatus ${q.id}`, L.rqStatus(c, q), M.rqStatus(c, q), id);
        const lv = Math.min(45, c.level + 3); same(`rqStatus ${q.id} at lv + 3`, L.rqStatus(c, q, lv), M.rqStatus(c, q, lv), id);
        same(`rq waiting on the story ${q.id}`, L.rqWait(c, q), M.rqWaitsOnStory(c, q), id); }
    });
  });

  testB('B. Daevanion: dvNext, the window, every board, every plan node', () => {
    const boards = [...new Set(M.DV_NODES().map(it => it.board))];
    states.forEach(({ id, c }) => {
      same('dvNext', (L.dvNext(c, c.level) || {}).k, (M.dvNext(c) || {}).k, id);
      for (const lv of [11, 12, 20]) same(`dvNext at Lv ${lv}`, (L.dvNext(c, lv) || {}).k, (M.dvNext(c, lv) || {}).k, id);
      same('Daevanion window open', L.dvWindow(c), M.dvOpen(c), id);
      for (const b of boards) same(`board ${b} open`, L.dvBoardOpen(c, b), M.dvOpen(c, b), id);
      for (const it of M.DV_NODES()) same(`plan node ${it.k} open`, L.planOpen(c, it), M.openOf(c, it.k), id);
    });
  });

  testB('B. skills: skillOpen (open, now), each line\'s lock; skillLearned at every level', () => {
    states.forEach(({ id, c }) => {
      const a = L.skillOpen(c), b = M.skillOpen(c);
      same('skillOpen open', a.open.map(x => x.k), b.open.map(x => x.k), id); same('skillOpen now', a.now.map(x => x.k), b.now.map(x => x.k), id);
      for (const x of M.SP_STEPS) same(`skill line ${x.k} locked`, L.skillLineLocked(c, x), !M.openOf(c, x.k), id);
      for (const x of M.SP_STEPS) same(`skill line ${x.k} later (Next up)`, L.skillLater(c, x), !M.gatesOf(c).byKey(x.k).open, id);
    });
    for (const n of new Set(M.SP_STEPS.map(x => x.s.n))) for (let lv = 0; lv <= 46; lv++) same(`skillLearned ${n} at Lv ${lv}`, L.skillLearned(n, lv), M.skillLearned(n, lv), 'level ' + lv);
  });

  /* 0.2 read one number (SP_STEPS req) for the Skills card and the Build drawer; the graph compiles its own copy. Move each
     skill's learn level (its Lv 1 → 2 line, as tests/e4test.js #15 does in the page) and the app must follow it like 0.2. */
  testB('B. skills: a moved learn level moves the Skills card, the line locks and the drawer with it (F7)', () => {
    const c0 = { checks: {}, level: 1 };
    for (const x of M.SP_STEPS.filter(x => x.L === 2)) {
      const was = x.req;
      try {
        for (const req of [was - 1, was + 1, was + 12]) { x.req = req;
          for (const lv of [was - 1, was, req - 1, req]) { const c = { ...c0, level: lv }, at = `${x.k} req ${req}, Lv ${lv}`;
            same('skillLearned', L.skillLearned(x.s.n, lv), M.skillLearned(x.s.n, lv), at);
            same('skillOpen now', L.skillOpen(c).now.map(y => y.k), M.skillOpen(c).now.map(y => y.k), at);
            same(`skill line ${x.k} locked`, L.skillLineLocked(c, x), !M.openOf(c, x.k), at);
            same('rotation (right click, Q)', { rmb: M.RMB_STACK(lv).filter(n => L.skillLearned(n, lv)), q: ['Shadowstrike'].filter(n => L.skillLearned(n, lv)) },
              (({ rmb, q }) => ({ rmb, q }))(M.rotKeys(c, lv)), at); }
        }
      } finally { x.req = was; }
    }
  });

  testB('B. stigmas: equip offer, slot rows, unlocked, the hero\'s "opens Lv", rotation slots at every level', () => {
    states.forEach(({ id, c }) => {
      const ev = M.gatesOf(c);
      same('stigmas unlocked', L.stigmaUnlocked(c), M.stigmaUnlocked(c), id);
      for (const sl of M.stigmaSlots(c)) {
        same(`equip ${sl.k}`, L.stigmaEquip(c, sl), M.stigmaEquipOpen(c, sl), id);
        same(`slot row ${sl.k}`, L.stigmaRow(c, sl), ev.byKey(sl.k).open, id);
        same(`slot level ${sl.k}`, sl.lv <= c.level, M.slotLevelMet(ev, sl), id);
        for (let lv = 1; lv <= 45; lv += 4) same(`rotation slot ${sl.k} at Lv ${lv}`, L.slotAt(sl, lv), M.slotLevelMet(M.gatesOf(c, lv), sl), id);
      }
    });
  });

  testB('B. Sealed Dungeons and strongholds: open (Next up, Areas "behind", Progress), the Areas "later" tag', () => {
    assert.ok(M.AREA_ITEMS.filter(x => x.it.kind === 'stronghold').every(x => typeof x.it.lo === 'number'), 'every stronghold has a lowest level (main.js read it without "|| 0")');
    states.forEach(({ id, c }) => {
      for (const x of M.AREA_ITEMS) { same(`area ${x.k} open`, L.areaOpen(c, x), M.areaOpen(c, x), id); same(`area ${x.k} later`, L.areaLater(c, x), M.areaLater(c, x), id); }
    });
  });

  testB('B. story: the story card\'s level gate, Krao Cave in "Meanwhile", the "Reach …" rows, the story chips', () => {
    const named = [...new Set([...M.GATES.flatMap(g => g.items.map(it => it.story || it.after)), ...M.RQ.map(q => q.story)].filter(Boolean))];
    /* main.js renderStoryChips maps storyGate to the chip text like this (mirrored: main.js can't run here) */
    const chipOf = (c, n) => { const sg = M.storyGate(c, n); if (!sg || (!sg.ok && sg.ahead == null)) return '';
      return sg.ok && n !== c.quest ? 'story: passed' : sg.ok ? 'your current quest' : `${sg.ahead} story quest${sg.ahead === 1 ? '' : 's'} ahead`; };
    states.forEach(({ id, c }) => {
      same('story card gate', L.storyGated(c), M.storyRecGate(c), id);
      if (M.questIdx(c) >= 0) same('Krao Cave story gate', L.kraoStory(c), M.openBut(M.gatesOf(c).byKey('g20:exp'), 'level'), id);
      for (const n of named) {
        const r = L.reachRow(c, n), g = M.storyGate(c, n);
        same(`"Reach ${n}"`, r, { ok: g.ok, d: g.ok ? r.d : g.ahead }, id);   /* d is shown only when not reached */
        same(`chip ${n}`, L.chip(c, n), chipOf(c, n), id);
      }
    });
    assert.equal(M.storyGate({ quest: '', checks: {}, level: 1 }, 'Not a quest'), null);
    assert.deepEqual(M.GATE_GRAPH.story.map(([, n]) => n), M.QUESTS.map(([, n]) => n), 'the evaluator\'s story chain is QUESTS');
  });
};
