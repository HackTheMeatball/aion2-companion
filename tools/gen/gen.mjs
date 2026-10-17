#!/usr/bin/env node
/* Data generator (0.2 step 5b; replaces gen.py): compiles the v2 data (data/**, docs/DATA-FORMAT-V2.md) into the
   generated data module the page imports as src/data/generated.js. The generator compiles, it does not research:
   it validates, joins and reshapes. Presentation stays in code (src/data/markup.js expands the text tokens).

   Used three ways:
     - scripts/generated-data.mjs (esbuild plugin) calls generate() at build time, in memory: the module is never stored.
     - `npm run gen` writes data/DATA_SOURCES.md (committed) and tools/gen/out/ (gen-report.json, generated.js; not
       committed) for review; `npm run gen:check` fails if DATA_SOURCES.md is not current.
     - tests (core, e4) call generate() for the values the page should carry.
   Fails (throws / exit 1) on a schema error, a failed cross-record check or an unknown data major version. */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { ROOT, validateDoc } from './validate.mjs';
import { DEFAULT_PACK, DEFAULT_ROOT, resolvePacks } from './packs.mjs';
const require = createRequire(import.meta.url);

/* ------------------------------------------------------------------ load */
/* dropProposed: strip every `proposed` gate after validation (tests/schema.mjs proves the module is the same without
   them, i.e. nothing compiles a proposal; DATA-FORMAT-V2 §6, docs/design/0.3-requirement-engine.md §7). */
const stripProposed = recs => { for (const r of recs) { delete r.proposed; for (const e of r.boardPlan || []) delete e.proposed; } };   /* where the schema allows it: records, build plan nodes */
/* mutate(rel, doc): tests only, edits a file's doc before validation (negative controls for cross-record checks).
   root, pack: the packs root and the pack to build (packs.mjs); the files are exactly those the pack chain lists. */
const loadBundle = ({ dropProposed = false, mutate = null, root, pack } = {}) => {
  const { chain, files } = resolvePacks({ root, pack }), by = {}, schemaErrors = [];
  let retired = null, sources = null;
  for (const { abs: f, rel } of files) {
    const doc = JSON.parse(readFileSync(f, 'utf8'));
    if (mutate) mutate(rel, doc);
    const errs = validateDoc(f, doc);
    if (errs.length) schemaErrors.push(`${rel}: ${errs.slice(0, 5).join('; ')}${errs.length > 5 ? ` (+${errs.length - 5})` : ''}`);
    if (doc.schemaVersion !== 2) throw new Error(`${rel}: data schemaVersion ${doc.schemaVersion} is not 2 (this generator knows major 2 only)`);
    if (basename(f) === 'retired.json') { retired = doc; continue; }
    if (dropProposed) stripProposed(doc.records);
    if (doc.collection === 'sources') sources = doc;
    (by[doc.collection] = by[doc.collection] || []).push({ file: rel, doc });
  }
  if (schemaErrors.length) throw new Error('schema validation failed:\n  ' + schemaErrors.join('\n  '));
  const recs = c => (by[c] || []).flatMap(x => x.doc.records);
  if (!sources) throw new Error('no sources collection (sources.json) in the pack chain');
  /* pack-declared checks (0.4 P6a): each manifest's optional `checks` module, in chain order. Loaded with require (an
     ES module, Node >= 22.12) so generate() stays synchronous for the build plugin and the tests. */
  const packChecks = chain.filter(m => m.checks).map(m => {
    const mod = require(join(root || DEFAULT_ROOT, ...m.id.split('/'), m.checks));
    if (typeof mod.checks !== 'function') throw new Error(`pack ${m.id}: ${m.checks} exports no checks(ctx, check)`);
    return { pack: m.id, checks: mod.checks };
  });
  return { by, recs, retired, sources, packChecks };
};

/* ------------------------------------------------------------------ helpers */
const URL_RE = /https?:\/\/[^\s)\]'"]+/g;
const urlsIn = v => typeof v === 'string' ? (v.match(URL_RE) || []).map(u => u.replace(/[.,;]+$/, ''))
  : Array.isArray(v) ? v.flatMap(urlsIn) : v && typeof v === 'object' ? Object.values(v).flatMap(urlsIn) : [];
const hostOf = u => u.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
const byNum = k => (a, b) => a[k] - b[k];
const atomsOf = c => !c ? [] : c.all ? c.all.flatMap(atomsOf) : c.any ? c.any.flatMap(atomsOf) : [c];

export function generate(opts = {}) {
  const B = loadBundle(opts), R = B.recs;
  const report = { checks: [], warnings: [], debt: {} };
  const check = (name, ok, detail) => { report.checks.push({ check: name, pass: !!ok, ...(ok ? {} : { detail }) }); };
  const warn = w => report.warnings.push(w);

  const zones = Object.fromEntries(R('zones').map(z => [z.id, z]));
  const zname = id => { if (!zones[id]) throw new Error('unknown zone ' + id); return zones[id].name; };
  const story = R('storyQuests'), sqById = Object.fromEntries(story.map(s => [s.id, s]));
  const rqs = R('regionalQuests'), rqById = Object.fromEntries(rqs.map(q => [q.id, q]));
  const skills = R('skills'), skById = Object.fromEntries(skills.map(s => [s.id, s]));
  const stigmas = R('stigmas'), stById = Object.fromEntries(stigmas.map(s => [s.id, s]));
  const nodes = R('boardNodes'), nodeById = Object.fromEntries(nodes.map(n => [n.id, n]));
  const boards = R('boards'), boardById = Object.fromEntries(boards.map(b => [b.id, b]));
  const sds = R('sealedDungeons'), shs = R('strongholds'), rules = Object.fromEntries(R('rules').map(r => [r.id, r]));
  const claims = R('claims'), claimById = Object.fromEntries(claims.map(c => [c.id, c]));
  /* at most one class per bundle; a pack with none (0.4 P6a, a pack that only checks the engine) compiles an empty build */
  const classes = R('classes'); if (classes.length > 1) throw new Error('one class per bundle in 0.2, got ' + classes.length);
  const cls = classes[0] || null, builds = R('builds');
  const build = cls ? builds.find(b => b.id === cls.defaultBuild) : { id: 'build:none', skillOrder: [], specialtyPicks: {}, stigmaSlots: [], stigmaTargets: [],
    statPriority: { tiers: [], from: null }, keyStacks: { rightClick: [], eOrder: [] }, texts: {}, boardPlan: [] };
  if (!build) throw new Error('default build missing: ' + cls.defaultBuild);
  const ruleValue = id => rules[id] ? rules[id].value : null;
  const milestones = R('milestones'), steps = R('steps'), tips = R('tips'), unlocks = R('unlocks'), items = R('items'), asc = R('ascensionQuests');

  /* ---------------------------------------------------------------- story chain (QUESTS) */
  const hasPrev = new Set(story.map(s => s.next).filter(Boolean));
  const heads = story.filter(s => !hasPrev.has(s.id));
  check('story: one chain start', heads.length === 1, heads.map(h => h.id));
  const chain = []; for (let s = heads[0], seen = new Set(); s; s = s.next ? sqById[s.next] : null) {
    if (seen.has(s.id)) { check('story: chain has no loop', false, s.id); break; } seen.add(s.id); chain.push(s);
    if (s.next && !sqById[s.next]) check('story next resolves: ' + s.id, false, s.next);
  }
  check('story: the chain covers every story quest (one path)', chain.length === story.length, [chain.length, story.length]);
  const last = chain[chain.length - 1];
  check('story: last quest has an end marker and no next', !!last.end && last.next === null);
  for (const s of story) check('story id is sq:<gameId>: ' + s.name, s.id === 'sq:' + s.gameId);
  const QUESTS = chain.map(s => [s.lv, s.name]);
  const sqName = id => { if (!sqById[id]) throw new Error('unknown story quest ' + id); return sqById[id].name; };
  const QUEST_STEPS = Object.fromEntries(chain.filter(s => s.steps.length).map(s => [s.name, s.steps.map(x => x.text)]));
  /* a step's own note (our line about it, e.g. a first Expedition run), by quest name and objective i. Kept out of QUEST_STEPS:
     the objective text is parsed (sub-steps, Kibelisk, talk-only); the page shows the note after it (requirements.js objTextOf). */
  const QUEST_STEP_NOTES = Object.fromEntries(chain.map(s => [s.name, Object.fromEntries(s.steps.filter(x => x.note).map(x => [x.i, x.note]))])
    .filter(([, o]) => Object.keys(o).length));
  for (const s of chain) for (const x of s.steps.filter(x => x.note)) {
    check(`${s.id} #${x.i}: a step note has its basis`, !!x.noteBasis);
    check(`${s.id} #${x.i}: an inferred step note says "probably"`, x.noteBasis !== 'inferred' || /\bprobably\b/i.test(x.note));
  }
  const LOC = s => { const o = {}; const put = (k, v) => { if (v !== null && v !== undefined) o[k] = v; };
    put('giverKib', s.giver.kibelisk); put('giverKibM', s.giver.meters); put('turnin', s.turnin.npc); put('turninPlace', s.turnin.place);
    put('turninKib', s.turnin.kibelisk); put('turninKibM', s.turnin.meters);
    /* the turn-in's own zone for "near your story step"; "" = a placeholder (owner-check), so no area */
    if (s.turnin.zone) o.turninZone = zones[s.turnin.zone].status === 'owner-check' ? '' : zname(s.turnin.zone); return o; };
  const QUEST_LOC = Object.fromEntries(chain.map(s => [s.name, LOC(s)]).filter(([, o]) => Object.keys(o).length));
  const X = chain.filter(s => s.lv > 40);   /* Lv 41-45: the v1 block's separate constants, kept for the page globals */
  const QUESTS_X = X.map(s => [s.lv, s.name]);
  const QUEST_STEPS_X = Object.fromEntries(X.map(s => [s.name, s.steps.map(x => x.text)]));
  const QUEST_LOC_X = Object.fromEntries(X.map(s => [s.name, LOC(s)]));
  const STORY_END = { quest: last.name, lv: last.lv, turnin: last.turnin.npc, place: last.turnin.place || last.turnin.kibelisk, region: last.end.region, regionFull: last.end.regionFull,
    next: last.end.next, nextLv: last.end.nextLv };
  const STORY_UNLOCKS = Object.fromEntries(chain.filter(s => s.unlocks && s.unlocks.text).map(s => [s.name, s.unlocks.text]));
  const UNLOCK_GATE = Object.fromEntries(chain.filter(s => s.unlocks).map(s => [s.name, s.unlocks.milestone]));

  /* ---------------------------------------------------------------- regional quests (RQ) */
  const shortItem = it => {
    if (it.startsWith('Title:')) return null;
    let m = it.match(/^(.*?)\s+x(\d+)$/); if (m) return `${m[1]} ×${m[2]}`;
    m = it.match(/^.*\b(Ring|Earrings|Bracelet|Necklace)$/); if (m) return m[1].toLowerCase();
    if (it.startsWith('Kina Chest: ')) return `${Math.floor(parseInt(it.split(':')[1].replace(/\D/g, ''), 10) / 1000)}k Kina chest`;
    if (it.startsWith('Kisk Summoning Stone: ')) return it.split(': ')[1].toLowerCase() + ' Kisk';
    if (it === 'Key: Hidden Cube') return 'Hidden Cube key';
    if (it.startsWith('Artwork:')) return 'Artwork';
    return it;
  };
  const RQ = rqs.slice().sort(byNum('order')).map(q => {
    const at = atomsOf(q.requires), zone = zname(q.zone);
    const after = at.filter(a => a.done).map(a => { if (!rqById[a.done]) throw new Error(`${q.id}: unknown prerequisite ${a.done}`); return rqById[a.done].name; });
    const st = at.filter(a => a.story);
    const its = (q.rewards.items || []).map(shortItem).filter(Boolean);
    if (q.rewards.ap) its.unshift(`${Math.floor(q.rewards.ap / 1000)}k Abyss Points`);
    let place = q.giver.place || ''; if (place === zone) place = '';
    const row = { name: q.name, id: q.gameId, rec: q.rec, unlocksAt: q.unlocksAt, zone, place, npc: q.giver.npc || '', kib: q.giver.kibelisk, m: q.giver.meters,
      after, story: st.length ? sqName(st[0].story) : null, ...(st.length && st[0].is === 'turnedIn' ? { turnedIn: true } : {}), reward: its.join(' · '), xp: q.rewards.xp ?? null, rw: { st: q.rewards.wisdom || 0, cr: q.rewards.crystal || 0 } };
    if (q.requiresBasis === 'unresearched') row.noPre = 1;
    return row;
  });
  const RQ_STATS = { n: RQ.length, at10: RQ.filter(x => x.unlocksAt === 10).length, story: RQ.filter(x => x.story).length, chained: RQ.filter(x => x.after.length).length, kib: RQ.filter(x => x.kib).length };

  /* ---------------------------------------------------------------- strongholds, Sealed Dungeons, zones */
  const SH_DATA = shs.slice().sort((a, b) => a.levelRange.lo - b.levelRange.lo || (a.name < b.name ? -1 : 1)).map(s => ({ name: s.name, qid: +s.gameId, zone: zname(s.zone),
    lo: s.levelRange.lo, hi: s.levelRange.hi, kib: s.location.kibelisk, m: s.location.meters }));
  const AREA_LOC = Object.fromEntries(sds.filter(d => d.entrance.kibelisk).map(d => [d.name, { kib: d.entrance.kibelisk, m: d.entrance.meters }]));
  const HIDEOUT_AREA = Object.fromEntries(sds.map(d => [d.name, zname(d.zone)]));
  const ZONE_TRACES = Object.fromEntries(Object.values(zones).filter(z => z.traces != null).sort((a, b) => b.traces - a.traces).map(z => [z.name, z.traces]));
  const sdRule = ruleValue('rule:sd-first-clear-asmodian'), shRule = ruleValue('rule:sh-first-clear-asmodian');
  const SD_RW = sdRule ? { st: sdRule.rewards.wisdom, cr: sdRule.rewards.crystal } : null;
  const SD_REWARD = sdRule ? sdRule.text : null, SH_REWARD = shRule ? shRule.text : null;

  /* ---------------------------------------------------------------- the guide build */
  const SP_ICONS = Object.fromEntries(skills.filter(s => s.icon).map(s => [s.name, s.icon]));
  const STIGMA_ICON = Object.fromEntries(stigmas.filter(s => s.icon).map(s => [s.name, s.icon]));
  const choice = id => { for (const s of skills) for (const c of s.specialtyChoices || []) if (c.id === id) return c; throw new Error('unknown specialty choice ' + id); };
  const sk = id => { if (!skById[id]) throw new Error('unknown skill ' + id); return skById[id]; };
  const stg = id => { if (!stById[id]) throw new Error('unknown stigma ' + id); return stById[id]; };
  /* spec: the slot 1 pick's text; specs (0.3 E7): the pick per slot in order, { t: text, lv: the choice's skill level } */
  const SP_SKILLS_CORE = build.skillOrder.filter(e => e.core).map(e => { const s = sk(e.skill), picks = build.specialtyPicks[e.skill] || [], pick = picks[0];
    return { n: s.name, learn: s.learnLv, ...(pick ? { spec: choice(pick).label || choice(pick).text, specs: picks.map(p => ({ t: choice(p).label || choice(p).text, lv: choice(p).skillLv })) } : {}),
      ...(s.type === 'passive' ? { passive: true } : {}) }; });
  const SP_EXTRA = build.skillOrder.filter(e => !e.core).map(e => { const s = sk(e.skill);
    return { n: s.name, learn: s.learnLv, ...(s.type === 'passive' ? { passive: true } : {}), ...(s.levelGate === 'flat' ? { flat: true } : {}), ...(e.status !== 'verified' ? { single: e.basis.split(' (')[0] } : {}) }; });
  const STIGMA_PLAN = build.stigmaSlots.map(id => stg(id).name);
  const ST_TARGETS = build.stigmaTargets.map(t => [stg(t.stigma).name, t.level]);
  const STAT_TIERS = build.statPriority.tiers, STAT_SRC = build.statPriority.from;
  const RMB_ROWS = build.keyStacks.rightClick.map(r => ({ minLv: r.minLv, skills: r.skills.map(id => sk(id).name) })).sort((a, b) => b.minLv - a.minLv);
  const E_ORDER = build.keyStacks.eOrder.map(id => stg(id).name);
  const LEVEL_POINTS = ruleValue('rule:level-points');
  /* game rules the build tables use (0.4 P2a; src/data/build.js spCost, SPEC_SLOT_LV, DV_MIN, ST_COST): cost bands
     [{ from, to, cost }] (the pack checks they run without a gap), slot levels, node costs by node type */
  const bands = id => (ruleValue(id) || []).map(({ from, to, cost }) => ({ from, to, cost }));
  const RULE_SKILL_POINT_COST = bands('rule:skill-point-cost');
  const RULE_SHARD_COST = bands('rule:stigma-shard-cost');
  const RULE_SPEC_SLOTS = ruleValue('rule:specialty-slots') ? ruleValue('rule:specialty-slots').slots : [];
  const nc = ruleValue('rule:node-costs'), RULE_NODE_COSTS = nc ? { passive: nc.passive, active: nc.active, corner: nc.corner } : {};
  /* build tokens in shared text expand with the guide build (0.3 follows the player's build) */
  const buildTok = t => t.replace(/\[\[build:(stigma|stigmaTarget|text|node|skillOrder):([A-Za-z0-9:-]+)\]\]/g, (m, kind, arg) => {
    if (kind === 'stigma') return STIGMA_PLAN[+arg - 1];
    if (kind === 'stigmaTarget') return String(ST_TARGETS[+arg - 1][1]);
    if (kind === 'text') { if (!(arg in build.texts)) throw new Error('unknown build text ' + arg); return build.texts[arg]; }
    if (kind === 'skillOrder') return sk(build.skillOrder[+arg - 1].skill).name;
    throw new Error('build token not supported by the 0.2 compiler: ' + m);
  });

  /* board plan -> dv milestone items and DV_BOARDS */
  const dvItem = e => {
    const board = e.node ? boardById[nodeById[e.node].board] : boardById[nodeById[e.anyNode[0]].board];
    const ty = e.anyNode ? 'c' : sk(nodeById[e.node].skill).type === 'passive' ? 'p' : 'a';
    const k = e.node ? nodeById[e.node].key : e.key;
    return { k, dv: true, board: board.name, blv: e.requires.level, ty, t: e.label, ...(e.via ? { via: e.via } : {}) };
  };
  for (const e of build.boardPlan) for (const n of e.node ? [e.node] : e.anyNode) if (!nodeById[n]) throw new Error('board plan: unknown node ' + n);
  /* DV_BOARDS (v1 constant, kept as a page global): the boards whose plan nodes all open with the board, Vaizel and Triniel */
  const DV_BOARDS = {};
  for (const b of boards.slice().sort(byNum('lv'))) {
    const es = build.boardPlan.filter(e => nodeById[e.node || e.anyNode[0]].board === b.id).sort(byNum('order'));
    if (es.length && es.every(e => e.requires.level === b.lv)) DV_BOARDS[b.name] = { lv: b.lv, nodes: es.map(dvItem).map(({ k, t, ty, via }) => ({ k, t, ty, ...(via ? { via } : {}) })) };
  }

  /* ---------------------------------------------------------------- milestones and route rules (token text) */
  const msOrder = milestones.slice().sort(byNum('order'));
  const sdByBand = band => sds.filter(d => d.band === band).sort((a, b) => (a.name < b.name ? -1 : 1));
  const itemOf = s => {
    const at = atomsOf(s.requires).filter(a => a.story), it = { k: s.key };
    if (s.storyQuest) it.byStory = true;
    if (s.short) it.ns = buildTok(s.short);
    for (const a of at) {
      if (a.is === 'turnedIn') { it.story = sqName(a.story); it.turnedIn = sqName(a.story); }
      else if (s.stigmaSlot) it.after = sqName(a.story);   /* a stigma equip step shows no story chip (v1 "after") */
      else it.story = sqName(a.story);
    }
    if (s.storyQuest) check('byStory step requires its own quest: ' + s.id, it.story === sqName(s.storyQuest));
    if (s.optional) it.opt = true; if (s.advancedOnly) it.adv = true; if (s.mapSlug) it.map = s.mapSlug;
    if (s.stigmaSlot) it.stig = s.stigmaSlot; if (s.stigmaKeySlot) it.eput = s.stigmaKeySlot; if (s.opensBoard) it.bo = boardById[s.opensBoard].name;
    if (s.ascensionQuest) it.ascensionQuest = s.ascensionQuest;   /* no map location: the last-location helper skips it (src/core/sync.js) */
    it.t = buildTok(s.text) + (s.loc ? `<span class="loc">${buildTok(s.loc)}</span>` : '');
    if (s.note) it.note = s.note; if (s.upsell) it.upsell = s.upsell;
    return it;
  };
  /* a milestone's own card-only line (milestones.json items, gateNode: false): the item shape of a step, no gate node */
  const msItemOf = x => ({ k: x.key, ...(x.short ? { ns: buildTok(x.short) } : {}), ...(x.optional ? { opt: true } : {}), ...(x.mapSlug ? { map: x.mapSlug } : {}),
    t: buildTok(x.text) + (x.loc ? `<span class="loc">${buildTok(x.loc)}</span>` : '') });
  const GUIDE = msOrder.map(m => {
    const parts = [
      ...steps.filter(s => s.milestone === m.id).map(s => ({ order: s.order, items: [itemOf(s)] })),
      ...(m.items || []).map(x => ({ order: x.order, items: [msItemOf(x)] })),
      ...(m.includes || []).map(x => { const ds = sdByBand(x.sealedDungeonBand); return { order: x.order, items: [{ hideouts: ds.map(d => d.name), keyPrefix: ds[0].key.split(':')[0] }] }; }),
      ...build.boardPlan.filter(e => e.milestone === m.id).map(e => ({ order: e.order, items: [dvItem(e)] })),
    ].sort(byNum('order'));
    const g = m.kind === 'milestone' ? { id: m.id, lv: m.lv, title: m.title, blurb: m.blurb } : { id: m.id, title: m.title, blurb: m.blurb, tag: m.tag };
    g.items = parts.flatMap(p => p.items);
    return g;
  });
  const GUIDE_GATES = GUIDE.filter((g, i) => msOrder[i].kind === 'milestone'), GUIDE_STEPS = GUIDE.filter((g, i) => msOrder[i].kind === 'routeRule');
  for (const s of steps) check('step key = id: ' + s.id, s.key === s.id && milestones.some(m => m.id === s.milestone));
  /* cards in order are milestones in level order (the catalog no longer sorts them) */
  check('milestones: card order = level order', GUIDE_GATES.every((g, i) => !i || GUIDE_GATES[i - 1].lv <= g.lv), GUIDE_GATES.map(g => g.lv));

  /* ---------------------------------------------------------------- tips, items, unlocks */
  const TIPS = Object.fromEntries(tips.map(t => [t.key, { h: t.title, b: buildTok(t.body).replace(/\{rqStats\.(\w+)\}/g, (m, k) => { if (!(k in RQ_STATS)) throw new Error(m); return RQ_STATS[k]; }), src: t.credit }]));
  const ITEMS = Object.fromEntries(items.map(i => [i.key, [i.label, i.metabotSlug, i.icon || '', i.gameName]]));
  const lvOf = c => (atomsOf(c).find(a => a.level !== undefined) || {}).level;
  const VERIFIED_UNLOCKS = unlocks.filter(u => u.credit && u.status === 'verified').sort(byNum('order')).map(u => [lvOf(u.at), u.what, u.detail || '', u.credit]);
  /* The Ascension chapters in order, for the Journey card's Ascension bar (0.3 E8, design §11): id (its GATE_GRAPH node),
     name, chapter, recommended level, inCap (false: past Lv 45, never a bar segment), step = the guide step whose stored
     tick also completes it (guideStep; a step that names its Ascension quest must be that step). */
  const ASCENSION = asc.slice().sort(byNum('chapter')).map(a => ({ id: a.id, name: a.name, chapter: a.chapter, lv: a.lv, inCap: a.inCap !== false, ...(a.guideStep ? { step: a.guideStep } : {}) }));

  /* ---------------------------------------------------------------- confidence card */
  const conf = (B.by.confidence || [])[0] ? B.by.confidence[0].doc : { groups: [], records: [] };
  const sp2 = SP_EXTRA.filter(x => !x.single).map(x => x.n), sp1 = SP_EXTRA.filter(x => x.single).map(x => x.n);
  const PH = { rqChained: RQ_STATS.chained, rqStoryGated: RQ_STATS.story, storyEndQuest: STORY_END.quest, storyEndLv: STORY_END.lv,
    boardList: boards.slice().sort(byNum('lv')).map(b => `${b.name} ${b.lv}`).join(', '), skillOrderTwoSource: sp2.join(', '), skillOrderSingle: sp1.join(', ') };
  const CONF = conf.groups.map(g => ({ g: g.title, sub: g.sub, items: conf.records.filter(r => r.group === g.id).sort(byNum('order'))
    .filter(r => Object.entries(r.when || {}).every(([cid, v]) => { if (!claimById[cid]) throw new Error('confidence: unknown claim ' + cid); return claimById[cid].verdict === v; }))
    .map(r => r.text.replace(/\{(\w+)\}/g, (m, k) => { if (!(r.placeholders || []).includes(k)) throw new Error(`${r.id}: placeholder ${k} not declared`); return PH[k]; })) }));

  /* ---------------------------------------------------------------- sources: the Sources card, SRC_SITE */
  const sites = B.sources.records;
  const siteOf = u => { const h = hostOf(u); return sites.find(s => s.hosts.some(x => h === x || h.endsWith('.' + x))); };
  const siteName = u => { const s = siteOf(u); return s ? s.name : hostOf(u); };
  const SRC_SITE = Object.fromEntries(sites.filter(s => s.kind !== 'owner' && !s.use.banned && !s.withdrawn).flatMap(s => s.hosts.map(h => [h, s.name])));
  const pages = B.sources.pages || [];
  const OLD_URLS = new Set(pages.map(p => p.url));
  const labelOf = {}, setdef = (u, l) => { if (!(u in labelOf)) labelOf[u] = l; };
  const pageOf = (r, fields) => (r.sources || []).find(s => s.url && (s.fields || []).some(f => fields.includes(f)));
  const nameOfId = {};
  for (const q of rqs) { const p = pageOf(q, ['gameId']); if (p) labelOf[p.url] = q.name; nameOfId[q.gameId] = q.name; }
  for (const q of rqs) for (const a of atomsOf(q.requires)) if (a.story) nameOfId[sqById[a.story].gameId] = sqById[a.story].name;
  for (const s of story) { const p = pageOf(s, ['steps', 'gameId']); if (p) labelOf[p.url] = s.name; }
  /* any other Metabot quest page a quest cites (e.g. the location pass) is labelled with the quest's name, or the ref's own
     label (Daeva Trapped's end.next cites the next quest's page) */
  for (const q of [...rqs, ...story]) for (const s of q.sources || []) if (s.url && /metabot\.gg\/en\/aion-2\/quests\//.test(s.url)) setdef(s.url, s.label || q.name);
  for (const a of asc) { const p = pageOf(a, ['chapter']); if (p) labelOf[p.url] = a.name; }
  for (const s of shs) { const p = pageOf(s, ['gameId']); if (p) labelOf[p.url] = s.name; }
  for (const d of sds) { const p = pageOf(d, ['rewards']); if (p) labelOf[p.url] = d.name; }
  for (const d of sds) { const p = pageOf(d, ['entrance.kibelisk']); if (p) setdef(p.url, d.name + (/metabot\.gg\/en\/aion-2\/quests\//.test(p.url) ? ' (exploration quest)' : '')); }
  for (const p of pages) setdef(p.url, p.label);
  const refLabels = v => { if (Array.isArray(v)) v.forEach(refLabels); else if (v && typeof v === 'object') { if (v.url && v.label) setdef(v.url, v.label); Object.values(v).forEach(refLabels); } };
  refLabels(claims); refLabels([...items, ...skills, ...stigmas, ...unlocks]);
  /* a skill's own Metabot page is labelled with the skill's name (not the URL slug: "Shadow Fall", not "Shadow fall") */
  for (const r of [...skills, ...stigmas]) for (const s of r.sources || []) if (s.url && /metabot\.gg\/en\/aion-2\/skills\//.test(s.url) && s.url.replace(/\/+$/, '').split('/').pop().startsWith(r.id.split(':').pop())) setdef(s.url, r.name);
  const label = u => {
    const s = siteName(u);
    if (u in labelOf) { const l = labelOf[u]; return l.toLowerCase().startsWith(s.toLowerCase()) || OLD_URLS.has(u) ? l : `${s}: ${l}`; }
    let m = u.match(/aion2\.gaming\.tools\/quests\/(\d+)/) || u.match(/aion2\.th\.gl\/db\/quests\/q_(\d+)/);
    if (m) return `${s}: ${nameOfId[m[1]] || m[1]}`;
    m = u.match(/[?&]p=(\d+)/); if (m) return `${s}: article ${m[1]}`;
    const path = u.replace(/^https?:\/\/[^/]+/, '').replace(/^\/+|\/+$/g, '');
    const segs = path ? path.split('/').filter(x => x && !/^\d+$/.test(x)) : [];
    let tail = segs.length ? segs[segs.length - 1] : '';
    tail = tail.replace(/,\d+$/, '').replace(/\.html?$/, '').replace(/-/g, ' ').trim().replace(/^aion ?2 /i, '');
    if (!tail) return s;
    let words = tail.split(/\s+/); if (words.length > 7) words = [...words.slice(0, 7), '…'];
    const t = words.join(' ');
    return `${s}: ${t.slice(0, 1).toUpperCase() + t.slice(1)}`;
  };
  /* card groups: a URL is listed under the first group whose records cite it (v1 order) */
  const ruleRecs = Object.values(rules);
  const GROUPS = [
    ['rq', 'Regional quests', rqs],
    ['story', 'Main story', [...story, ...asc]],
    ['areas', 'Strongholds and Sealed Dungeons', [...shs, ...sds, ...ruleRecs.filter(r => r.kind === 'firstClearReward')]],
    ['build', 'Skills, boards and stigmas', [...skills, ...stigmas, ...boards, ...nodes, ...builds, cls, ...ruleRecs.filter(r => r.kind !== 'firstClearReward'), ...unlocks, ...items]],
    ['claims', 'Tips and rules', [...claims, ...Object.values(zones), ...R('kibelisks')]],
    ['old', 'Leveling guides, build and tips', pages.map(p => p.url)],
  ];
  const SOURCES = [], seen = new Set();
  for (const [id, t, recs] of GROUPS) {
    const links = [];
    for (const u of urlsIn(recs)) { if (seen.has(u)) continue; seen.add(u); links.push([u, label(u)]); }
    links.sort((a, b) => { const ma = siteName(a[0]) !== 'Metabot', mb = siteName(b[0]) !== 'Metabot'; if (ma !== mb) return ma ? 1 : -1; const la = a[1].toLowerCase(), lb = b[1].toLowerCase(); return la < lb ? -1 : la > lb ? 1 : 0; });
    SOURCES.push({ id, t, links });
  }

  /* ---------------------------------------------------------------- cross-record checks (DATA-FORMAT-V2 §15.2) */
  const all = Object.values(B.by).flatMap(xs => xs.flatMap(x => x.doc.records.map(r => ({ r, file: x.file, coll: x.doc.collection }))));
  { const ids = {}; for (const { r, file } of all) { if (r.id in ids) check('id unique repo-wide: ' + r.id, false, [ids[r.id], file]); ids[r.id] = file; } check('ids unique repo-wide', true); }
  { const keys = {}; for (const { r, coll } of all) if (r.key !== undefined && !['items', 'tips', 'skills', 'stigmas'].includes(coll)) { if (r.key in keys) check('save key unique: ' + r.key, false, [keys[r.key], coll]); keys[r.key] = coll; }
    for (const e of build.boardPlan) if (e.key) { if (e.key in keys) check('save key unique: ' + e.key, false); keys[e.key] = 'boardPlan'; }
    for (const m of milestones) for (const x of m.items || []) { if (x.key in keys) check('save key unique: ' + x.key, false); keys[x.key] = 'milestone items'; }
    const ret = new Set((B.retired ? B.retired.keys : []).map(x => x.key));
    for (const k of Object.keys(keys)) check('retired key never reused: ' + k, !ret.has(k)); }
  /* references */
  const known = new Set(all.map(x => x.r.id));
  const refCheck = (where, id) => check(`${where}: reference ${id} resolves`, known.has(id));
  /* every gate a record carries: requires / completesWith / unlock `at`, its 0.3 proposal (`proposed`), and a build's plan nodes */
  const gatesOf = r => [r.requires, ...(r.completesWith || []), r.at, ...(r.proposed ? [r.proposed.requires, ...(r.proposed.completesWith || [])] : [])].filter(x => x && typeof x === 'object');
  const gateHolders = [...all.map(({ r }) => ({ id: r.id, r })), ...builds.flatMap(b => b.boardPlan.map(e => ({ id: `${b.id} boardPlan ${e.node || e.key}`, r: e })))];
  for (const { id, r } of gateHolders) for (const c of gatesOf(r)) for (const a of atomsOf(c)) {
    if (a.story) refCheck(id, a.story);
    if (a.done) { refCheck(id, a.done); check(`${id}: done never names a story quest`, !a.done.startsWith('sq:')); }
    if (a.story) check(`${id}: story atom has "is"`, !!a.is);
    if (a.storyStep) { refCheck(id, a.storyStep); const sq = story.find(s => s.id === a.storyStep); check(`${id}: storyStep ${a.storyStep} #${a.i} is a step of that quest`, !!sq && sq.steps.some(x => x.i === a.i)); }
  }
  /* proposals (0.3 audit): a ready one rests on no owner-check atom; each is listed in the report for the golden-difference list */
  report.proposed = [];
  for (const { id, r } of gateHolders) if (r.proposed) {
    const p = r.proposed, pAtoms = [p.requires, ...(p.completesWith || [])].filter(x => x && typeof x === 'object').flatMap(atomsOf);
    /* ready = applied once the owner approves the golden diff; anything resting on an open in-game check or an unsourced (legacy) atom is owner-check */
    if (p.status === 'ready') check(`${id}: a ready proposal has no owner-check or legacy atom`, !pAtoms.some(a => a.basis === 'owner-check' || a.basis === 'legacy'));
    if (p.requiresBasis === 'verified-none') check(`${id}: proposed verified-none has no prerequisite atoms`, !atomsOf(p.requires).some(a => a.story || a.done));
    report.proposed.push({ id, status: p.status, ...(p.check ? { check: p.check } : {}), basis: p.basis, change: p.change });
  }
  for (const { r } of all) {
    for (const f of ['wraps', 'storyQuest', 'ascensionQuest', 'opensBoard', 'board', 'skill', 'defaultBuild']) if (typeof r[f] === 'string' && r[f].includes(':')) refCheck(r.id, r[f]);
    if (r.zone) refCheck(r.id, r.zone);
    for (const l of [r.giver, r.turnin, r.entrance, r.location].filter(Boolean)) refCheck(r.id, l.zone);
    if (r.unlocks && r.unlocks.milestone) check(`${r.id}: unlock milestone resolves`, milestones.some(m => m.id === r.unlocks.milestone));
  }
  /* every URL: on a registered site, not banned, not withdrawn, not on a mode:none site (withdrawn = PR debt list) */
  const withdrawnHits = [];
  for (const { r, file } of all) for (const u of urlsIn(r)) {
    const s = siteOf(u);
    check(`URL host is in sources.json: ${hostOf(u)}`, !!s, u);
    if (!s) continue;
    check(`URL not on a banned site: ${u}`, !s.use.banned);
    if (s.withdrawn) withdrawnHits.push(`${file} ${r.id}: ${u}`);
    else check(`URL not on a mode:none site: ${u}`, s.access.mode !== 'none');
  }
  /* a bare page reference counts too ("aion2.th.gl q_2202054", "aion2.th.gl/…"); a note that only says the site was withdrawn does not */
  const strsIn = v => typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(strsIn) : v && typeof v === 'object' ? Object.values(v).flatMap(strsIn) : [];
  const refRes = sites.filter(s => s.withdrawn).flatMap(s => s.hosts).map(h => new RegExp('(^|[^\\w.])' + h.replace(/\./g, '\\.') + '(/\\S|\\s+q_\\d)'));
  for (const { r, file, coll } of all) if (coll !== 'sources') for (const t of strsIn(r)) if (refRes.some(re => re.test(t)) && !urlsIn(t).some(u => siteOf(u) && siteOf(u).withdrawn)) withdrawnHits.push(`${file} ${r.id}: "${t.slice(0, 80)}"`);
  /* a withdrawn site (aion2.th.gl) is never cited: re-source it (Metabot first) or label the fact owner-check (§5.1) */
  check('no citation of a withdrawn site', !withdrawnHits.length, withdrawnHits.slice(0, 10));
  for (const s of sites) if (s.access.terms === 'bans-automation') check('bans-automation forces human-only or none: ' + s.id, ['human-only', 'none'].includes(s.access.mode));
  for (const s of sites) if (s.access.robots === 'unchecked' || s.access.terms === 'unread') warn(`${s.id}: robots ${s.access.robots}, terms ${s.access.terms}`);
  /* owner refs never look like a URL or a path (schema pattern); verifiedAt = latest checkedAt */
  for (const { r } of all) {
    const dates = [];
    const walkRefs = v => { if (Array.isArray(v)) v.forEach(walkRefs); else if (v && typeof v === 'object') { if ((v.url || v.owner) && v.checkedAt) dates.push(v.checkedAt); if (v.owner && v.owner.checkedAt) dates.push(v.owner.checkedAt); Object.values(v).forEach(walkRefs); } };
    walkRefs(r.sources);
    if (dates.length && r.verifiedAt) check(`verifiedAt = latest checkedAt: ${r.id}`, r.verifiedAt === dates.sort().slice(-1)[0], [r.verifiedAt, dates.sort().slice(-1)[0]]);
  }
  /* claims <-> appliesTo */
  for (const c of claims) {
    if (c.action !== 'drop') check(`claim ${c.id}: appliesTo present`, (c.appliesTo || []).length > 0);
    for (const t of c.appliesTo || []) if (!t.startsWith('page:') && !t.startsWith('conf:') && !milestones.some(m => m.id === t)) { const x = all.find(y => y.r.id === t); check(`claim ${c.id} -> ${t} resolves and lists it`, x && (x.r.claims || []).includes(c.id)); }
  }
  for (const { r } of all) for (const cid of r.claims || []) check(`${r.id}: claim ${cid} names it in appliesTo`, (claimById[cid] && (claimById[cid].appliesTo || []).includes(r.id)));
  /* i: dense from 0, never renumbered (positions are save indices; a pack checks its own, e.g. AION 2's choice n) */
  for (const { r } of all) if (Array.isArray(r.steps)) check(`${r.id}: objective i = position`, r.steps.every((s, i) => s.i === i));
  /* a location whose place is a village zone's name (Aldelle, Black Claw) sits in that village (0.2.4, issue #98). Villages
     only: a place named after a wider zone (Southern Gribade Highland, Spirit Isle) can sit in a neighbour's zone */
  { const zoneOfName = Object.fromEntries(Object.values(zones).filter(z => / Village$/.test(z.name)).map(z => [z.name, z.id]));
    for (const { r } of all) for (const l of [r.giver, r.turnin, r.entrance, r.location].filter(Boolean))
      if (l.place && zoneOfName[l.place]) check(`${r.id}: place ${l.place} is in ${zoneOfName[l.place]}`, l.zone === zoneOfName[l.place], l.zone); }
  /* gate basis: requiresBasis legacy / unresearched / verified-none never sits on sourced atoms only (N2) */
  for (const { r } of all) if (r.requiresBasis === 'verified-none') check(`${r.id}: verified-none has no prerequisite atoms`, !atomsOf(r.requires).some(a => a.story || a.done));
  /* placeholder zones are debt */
  report.debt.placeholderZone = all.filter(({ r }) => [r.zone, r.giver && r.giver.zone, r.turnin && r.turnin.zone, r.entrance && r.entrance.zone].includes('zone:altgard-unplaced')).map(({ r }) => r.id);
  /* every records file sorted by id */
  for (const xs of Object.values(B.by)) for (const x of xs) { const ids = x.doc.records.map(r => r.id); check(`${x.file}: records sorted by id`, ids.every((id, i) => !i || ids[i - 1] < id)); }

  /* ---------------------------------------------------------------- GATE_GRAPH (0.3 E1; docs/design/0.3-requirement-engine.md §3) */
  /* Every trackable record's live gate for src/core/evaluator.js: { story: [[id, name]…] in chain order, nodes: {id: node} }
     in catalog order. A node is { kind, key?, req, done, … }: req = the compiled `requires` (sources and notes dropped,
     story atoms carry their chain index i), done = the compiled `completesWith`. Live fields only: `proposed` is never
     read, so the graph is identical without proposals (tests/schema.mjs). Skill lines come from rule:skill-level-gate;
     `requiresBasis: unresearched` (noPre) adds its rule level max(unlocksAt, rec); plan nodes name their board (the board's
     gate is inherited). Its own module (gate-graph.js), read by src/core/evaluator.js and requirements.js (since E2).
     GATE_PROPOSED (0.3 E4, design §13): every record's `proposed` gate compiled the same way, { id: { status, req?, done? } },
     in a module of its own (gate-proposed.js) that only src/core/evaluator.js reads, and only for the ids in its
     opts.apply; GATE_GRAPH stays the live gates (identical without proposals, tests/schema.mjs). */
  const { GATE_GRAPH, GATE_PROPOSED } = (() => {
    const sIdx = Object.fromEntries(chain.map((s, i) => [s.id, i])), bas = a => a.basis ? { basis: a.basis } : {};
    const gate = c => {
      if (!c) return { all: [] };
      if (c.all) return { all: c.all.map(gate) };
      if (c.any) return { any: c.any.map(gate) };
      if (c.level !== undefined) return { level: c.level, ...bas(c) };
      if (c.story) return { story: c.story, i: sIdx[c.story] ?? -1, is: c.is, ...bas(c) };
      if (c.storyStep) return { storyStep: c.storyStep, i: c.i, q: sIdx[c.storyStep] ?? -1, ...bas(c) };
      if (c.done) return { done: c.done, ...bas(c) };
      if (c.itemLevel !== undefined) return { itemLevel: c.itemLevel, playerChecked: true, ...bas(c) };
      if (c.player) return { player: c.player, playerChecked: true, ...bas(c) };
      throw new Error('GATE_GRAPH: unknown atom ' + JSON.stringify(c));
    };
    const cw = xs => (xs || []).map(x => x === 'tick' ? 'tick' : gate(x));
    const nodes = {}, add = (id, n) => { check('GATE_GRAPH: node id unique: ' + id, !(id in nodes)); nodes[id] = n; };
    /* a record's proposal, compiled like its live gate (a regional quest's req as the oracle reads it: requires and
       requiresBasis from the proposal, the rule level for "unresearched") */
    const proposed = {}, prop = (id, r, rq) => { const p = r.proposed; if (!p) return;
      const pr = 'requires' in p ? p.requires : r.requires;
      const req = rq ? (p.requiresBasis === 'unresearched' ? { all: [gate(pr), { level: Math.max(r.unlocksAt, r.rec), basis: 'rule' }] } : gate(pr))
        : 'requires' in p ? gate(p.requires) : undefined;
      proposed[id] = { status: p.status, ...(req ? { req } : {}), ...(p.completesWith ? { done: cw(p.completesWith) } : {}) }; };
    for (const s of chain) add(s.id, { kind: 'story', key: s.key, req: gate(s.requires), done: cw(s.completesWith) });
    for (const a of asc.slice().sort(byNum('chapter'))) add(a.id, { kind: 'ascension', req: gate(a.requires), done: cw(a.completesWith) });
    for (const m of msOrder) for (const s of steps.filter(x => x.milestone === m.id).sort(byNum('order'))) { add(s.id, { kind: 'step', key: s.key, ms: m.id, req: gate(s.requires), done: cw(s.completesWith) }); prop(s.id, s); }
    for (const q of rqs.slice().sort(byNum('order'))) {
      const req = q.requiresBasis === 'unresearched' ? { all: [gate(q.requires), { level: Math.max(q.unlocksAt, q.rec), basis: 'rule' }] } : gate(q.requires);
      add(q.id, { kind: 'rq', key: q.key, req, done: cw(q.completesWith), ...(q.requiresBasis ? { rb: q.requiresBasis } : {}) }); prop(q.id, q, true);
    }
    for (const d of sds.slice().sort((a, b) => a.band - b.band || (a.name < b.name ? -1 : 1))) add(d.id, { kind: 'sd', key: d.key, req: gate(d.requires), done: cw(d.completesWith) });
    for (const s of shs.slice().sort((a, b) => a.levelRange.lo - b.levelRange.lo || (a.name < b.name ? -1 : 1))) add(s.id, { kind: 'sh', key: s.key, req: gate(s.requires), done: cw(s.completesWith) });
    for (const u of unlocks.slice().sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9) || (a.id < b.id ? -1 : 1))) add(u.id, { kind: 'unlock', req: gate(u.at), done: [gate(u.at)] });   /* done = its `at` holds (no tick) */
    for (const b of boards.slice().sort(byNum('lv'))) { add(b.id, { kind: 'board', req: gate(b.requires), done: [] }); prop(b.id, b); }
    for (const m of msOrder) for (const e of build.boardPlan.filter(x => x.milestone === m.id).sort(byNum('order'))) {
      const k = e.node ? nodeById[e.node].key : e.key, sn = e.node && nodeById[e.node].skill;
      /* a plan node on a skill names it and what it adds to the skill's effective level (0.3 E7, rule:specialty-slots) */
      add(k, { kind: 'plan', key: k, board: nodeById[e.node || e.anyNode[0]].board, ...(sn ? { skill: sn, adds: nodeById[e.node].adds ?? 1 } : {}), req: gate(e.requires), done: cw(e.completesWith) }); prop(k, e);
    }
    /* no skill gate rule: no skill lines (a pack without skills); a build with skills and no rule throws */
    const slg = ruleValue('rule:skill-level-gate') || { maxFromPoints: 1, stepped: {} }, per = slg.stepped.perLevel, slots = RULE_SPEC_SLOTS;
    if (!ruleValue('rule:skill-level-gate') && build.skillOrder.length) throw new Error('rule:skill-level-gate missing: the build has a skill order');
    /* specialty slot n (0.3 E7, design §9): opens at effective skill level slots[n - 1] (atom skillLv: the highest ticked line,
       1 if none, + the adds of every owned plan node on the skill); keys sp:<skill>:spec, :spec2, :spec3 */
    const slotKey = (s, n) => `sp:${s.key}:spec${n > 1 ? n : ''}`;
    const addSlot = (s, n) => add(slotKey(s, n), { kind: 'spec', key: slotKey(s, n), skill: s.id, slot: n, req: { skillLv: slots[n - 1], skill: s.id, basis: 'rule' }, done: ['tick'] });
    for (const e of [...build.skillOrder.filter(x => x.core), ...build.skillOrder.filter(x => !x.core)]) {
      const s = sk(e.skill), pick = e.core && (build.specialtyPicks[e.skill] || [])[0];
      for (let L = 2; L <= slg.maxFromPoints; L++) {
        add(`sp:${s.key}:${L}`, { kind: 'skill', key: `sp:${s.key}:${L}`, skill: s.id, L, req: { level: s.levelGate === 'flat' ? s.learnLv : s.learnLv + per * (L - 2), basis: 'rule' }, done: ['tick'] });
        if (L === 8 && pick && s.type !== 'passive') addSlot(s, 1);
      }
      if (pick && s.type !== 'passive') for (let n = 2; n <= slots.length; n++) addSlot(s, n);
    }
    /* every done edge resolves to a node, every story atom to the chain, and no node depends on itself */
    const edges = id => { const n = nodes[id]; return [...atomsOf(n.req), ...n.done.filter(x => x !== 'tick').flatMap(atomsOf)].filter(a => a.done).map(a => a.done).concat(n.board ? [n.board] : []); };
    for (const id of Object.keys(nodes)) {
      for (const t of edges(id)) check(`GATE_GRAPH: ${id}: done ${t} is a node`, t in nodes);
      for (const a of [...atomsOf(nodes[id].req), ...nodes[id].done.filter(x => x !== 'tick').flatMap(atomsOf)].filter(a => a.story)) check(`GATE_GRAPH: ${id}: story atom ${a.story} is on the chain, with "is"`, a.i >= 0 && !!a.is);
    }
    const mark = {}, cyc = [];
    const dfs = id => { if (mark[id] === 2) return; if (mark[id] === 1) { cyc.push(id); return; } mark[id] = 1; for (const t of edges(id)) if (t in nodes) dfs(t); mark[id] = 2; };
    Object.keys(nodes).forEach(dfs);
    check('GATE_GRAPH: no cycle', !cyc.length, cyc);
    /* a milestone's own items (gateNode: false) never get a node: openSteps treats a row without one as never offered */
    for (const m of milestones) for (const x of m.items || []) check(`GATE_GRAPH: milestone item ${x.key} has no node`, x.gateNode === false && !Object.values(nodes).some(n => n.key === x.key) && !(x.key in nodes));
    /* every proposal is compiled (none dropped) and resolves: done atoms on nodes, story atoms on the chain */
    check('GATE_PROPOSED: one entry per proposal', Object.keys(proposed).length === report.proposed.length, [Object.keys(proposed).length, report.proposed.length]);
    for (const [id, p] of Object.entries(proposed)) for (const a of [...(p.req ? atomsOf(p.req) : []), ...(p.done || []).filter(x => x !== 'tick').flatMap(atomsOf)].filter(a => a.done || a.story))
      check(`GATE_PROPOSED: ${id}: ${a.done ? `done ${a.done} is a node` : `story atom ${a.story} is on the chain, with "is"`}`, a.done ? a.done in nodes : a.i >= 0 && !!a.is);
    return { GATE_GRAPH: { story: chain.map(s => [s.id, s.key]), nodes }, GATE_PROPOSED: proposed };
  })();

  /* ---------------------------------------------------------------- place tables (0.5 P8; docs/design/0.4-smart-next-up.md §3) */
  /* NODE_PLACE: per GATE_GRAPH node with a place (story, regional quest, Sealed Dungeon, stronghold) { route, zone, pts };
     zone = the record's zone (a story quest: its turn-in's), null on a placeholder zone; pts.giver / .turnin / .entrance are
     points { map, x, y, anchor, m }: the coords (null when none), the anchor's registry id (null when the point names none)
     and the source's metres to it; a story quest's pts.steps (0.5 P9, only when one has a point) lists its objectives' `at`
     points in objective order, each { i, map, x, y, anchor, m } (i = the objective's save index). KIBELISKS: the registry by id { name, zone, map, binds? } (binds: the objectives whose
     `binds` fact names it, [{ node, i, basis }]). Their own module (src/packs/aion2/data/place.js, `placeModule`); nothing
     imports it yet (0.5 P10 does), so neither build carries it. */
  const kibs = R('kibelisks'), kibByName = Object.fromEntries(kibs.map(k => [k.name, k.id]));
  const realZone = z => z && zones[z] && zones[z].status !== 'owner-check' ? z : null;
  const point = l => { if (!l) return null; const anchor = l.kibelisk ? kibByName[l.kibelisk] ?? null : null, c = l.coords || (l.map ? l : null);
    return c || anchor ? { map: c ? c.map : null, x: c ? c.x : null, y: c ? c.y : null, anchor, m: anchor ? l.meters ?? null : null } : null; };
  const placeOf = (r, z, ps) => { const pts = Object.fromEntries(Object.entries(ps).map(([k, l]) => [k, point(l)]).filter(([, p]) => p));
    return { route: r.route || 'core', zone: realZone(z), pts }; };
  const shById = Object.fromEntries(shs.map(s => [s.id, s])), sdById = Object.fromEntries(sds.map(d => [d.id, d]));
  const NODE_PLACE = {};
  for (const [id, n] of Object.entries(GATE_GRAPH.nodes)) {
    if (n.kind === 'story') { const s = sqById[id], at = s.steps.filter(x => x.at).map(x => ({ i: x.i, ...point(x.at) }));
      NODE_PLACE[id] = placeOf(s, s.turnin.zone || s.giver.zone, { giver: s.giver, turnin: s.turnin }); if (at.length) NODE_PLACE[id].pts.steps = at; }
    else if (n.kind === 'rq') { const q = rqById[id]; NODE_PLACE[id] = placeOf(q, q.zone, { giver: q.giver, turnin: q.turnin }); }
    else if (n.kind === 'sd') { const d = sdById[id]; NODE_PLACE[id] = placeOf(d, d.zone, { entrance: d.entrance }); }
    else if (n.kind === 'sh') { const s = shById[id]; NODE_PLACE[id] = placeOf(s, s.zone, { entrance: s.location }); }
  }
  const bindsOf = {};
  for (const s of chain) for (const x of s.steps) if (x.binds) (bindsOf[x.binds.kibelisk] = bindsOf[x.binds.kibelisk] || []).push({ node: s.id, i: x.i, basis: x.binds.basis });
  const KIBELISKS = Object.fromEntries(kibs.map(k => [k.id, { name: k.name, zone: k.zone, map: k.map, ...(bindsOf[k.id] ? { binds: bindsOf[k.id] } : {}) }]));

  /* the bind report (design §8.1, §8.4, §9): per Kibelisk name, the best (smallest) stated metres over the giver / turn-in
     / entrance points and the story objectives' `at` points (0.5 P9); bound at most R, nudge at most the nudge radius,
     else none (a name cited only by markers on objectives without a point has no point: none). For R = 25 / 32 / 35 / 40 m and the working value, over the story quests and over every record; then the
     owner check list: each story Kibelisk the working rules can't bind from the story points or a `binds` fact. */
  const KIB_REPORT = (() => {
    const R0 = ruleValue('rule:kibelisk-bind-radius'), NR = ruleValue('rule:kibelisk-nudge-radius');
    if (R0 == null || NR == null) return null;
    const MARK = /\(Kibelisk: ([^)]+)\)/g;
    const cited = recs => { const ns = new Set(); for (const r of recs) { for (const l of [r.giver, r.turnin, r.entrance, r.location]) if (l && l.kibelisk) ns.add(l.kibelisk);
      for (const x of r.steps || []) { if (x.kibelisk) ns.add(x.kibelisk); if (x.at) ns.add(x.at.kibelisk); for (const m of x.text.matchAll(MARK)) ns.add(m[1]); } } return ns; };
    const pointsOf = recs => recs.flatMap(r => [['giver', r.giver], ['turn-in', r.turnin], ['entrance', r.entrance], ['entrance', r.location], ...(r.steps || []).map(x => ['objective ' + x.i, x.at || x])]
      .filter(([, l]) => l && l.kibelisk && l.meters != null).map(([side, l]) => ({ name: l.kibelisk, m: l.meters, rec: r, side })));
    const best = pts => { const b = {}; for (const p of pts) if (!b[p.name] || p.m < b[p.name].m) b[p.name] = p; return b; };
    const sets = { story: [cited(chain), best(pointsOf(chain))], all: [cited([...chain, ...rqs, ...sds, ...shs]), best(pointsOf([...chain, ...rqs, ...sds, ...shs]))] };
    const classOf = (b, r) => !b ? 'none' : b.m <= r ? 'bound' : b.m <= NR ? 'nudge' : 'none';
    const radii = [...new Set([25, 32, 35, 40, R0])].sort((a, b) => a - b);
    const split = radii.map(r => ({ r, working: r === R0, ...Object.fromEntries(Object.entries(sets).map(([k, [ns, b]]) => {
      const c = { bound: 0, nudge: 0, none: 0 }; for (const n of ns) c[classOf(b[n], r)]++; return [k, { n: ns.size, ...c }]; })) }));
    const first = {}; chain.forEach((s, i) => { for (const n of cited([s])) if (!(n in first)) first[n] = i; });
    const [sNames, sBest] = sets.story;
    const ownerCheck = [...sNames].filter(n => classOf(sBest[n], R0) !== 'bound' && !(bindsOf[kibByName[n]] || []).length)
      .sort((a, b) => first[a] - first[b] || (a < b ? -1 : 1))
      .map(n => { const b = sBest[n]; return { kibelisk: kibByName[n] || null, name: n, class: classOf(b, R0), first: chain[first[n]].name, firstLv: chain[first[n]].lv,
        ...(b ? { best: { m: b.m, quest: b.rec.name, side: b.side } } : {}) }; });
    return { radius: R0, nudge: NR, split, ownerCheck, noPoint: [...sNames].filter(n => !sBest[n]).length };
  })();

  /* ---------------------------------------------------------------- pack-declared checks (0.4 P6a) */
  /* Everything above runs for every pack. A pack's own rules (fixed counts, named records, its game's collections) live in
     the module its manifest names in `checks` (pack.schema.json), called with the bundle and the compiled tables and the
     same check(name, ok, detail); they run after the engine's checks, in chain order. */
  const ctx = { B, R, zones, story, sqById, chain, rqs, rqById, skills, skById, stigmas, stById, nodes, nodeById, boards, boardById, sds, shs, rules, claims,
    cls, builds, build, milestones, steps, tips, unlocks, items, asc, all, RQ, STORY_END, SH_DATA, GATE_GRAPH, kibs, NODE_PLACE, KIBELISKS, atomsOf, byNum, refCheck };
  for (const p of B.packChecks) p.checks(ctx, check);

  const failed = report.checks.filter(c => !c.pass);
  /* ---------------------------------------------------------------- the module */
  const C = { RQ, RQ_STATS, QUESTS_X, QUEST_STEPS_X, QUEST_LOC_X, STORY_END, SH_DATA, AREA_LOC, SD_RW, SP_EXTRA, DV_BOARDS, SOURCES, SRC_SITE, CONF,
    QUESTS, QUEST_STEPS, QUEST_STEP_NOTES, QUEST_LOC, STORY_UNLOCKS, UNLOCK_GATE, VERIFIED_UNLOCKS, ASCENSION, GUIDE_GATES, GUIDE_STEPS, TIPS, ITEMS, HIDEOUT_AREA, ZONE_TRACES, SD_REWARD, SH_REWARD,
    STAT_TIERS, STAT_SRC, STIGMA_PLAN, ST_TARGETS, SP_SKILLS_CORE, LEVEL_POINTS, RMB_ROWS, E_ORDER, SP_ICONS, STIGMA_ICON,
    RULE_SKILL_POINT_COST, RULE_SPEC_SLOTS, RULE_NODE_COSTS, RULE_SHARD_COST };
  const J = v => JSON.stringify(v);
  const module = '/* Generated by tools/gen/gen.mjs from data/** (data format v2). Not stored: the build makes it on every run. */\n' +
    Object.entries(C).map(([k, v]) => `export const ${k} = ${J(v)};`).join('\n') + '\n';
  /* GATE_GRAPH: a module of its own (src/data/gate-graph.js), imported only by src/core/evaluator.js */
  const gateModule = '/* Generated by tools/gen/gen.mjs from data/** (data format v2): GATE_GRAPH, the live gates (0.3 requirement engine). Not stored. */\n' +
    `export const GATE_GRAPH = ${J(GATE_GRAPH)};\n`;
  /* GATE_PROPOSED: the proposals, compiled (src/data/gate-proposed.js), read only by src/core/evaluator.js, per id in opts.apply */
  const proposedModule = '/* Generated by tools/gen/gen.mjs from data/** (data format v2): GATE_PROPOSED, the 0.3 proposals compiled, applied per id (evaluator opts.apply). Not stored. */\n' +
    `export const GATE_PROPOSED = ${J(GATE_PROPOSED)};\n`;
  /* NODE_PLACE and KIBELISKS (0.5 P8): src/packs/aion2/data/place.js, for the pack's travel code (src/packs/aion2/travel.js,
     0.5 P10); TRAVEL_RULES (P10): the bind and nudge radii and the teleport gain in metres, null where the pack has no rule */
  const TRAVEL_RULES = { bindRadius: ruleValue('rule:kibelisk-bind-radius'), nudgeRadius: ruleValue('rule:kibelisk-nudge-radius'), teleportGain: ruleValue('rule:teleport-gain') };
  const placeModule = '/* Generated by tools/gen/gen.mjs from data/** (data format v2): NODE_PLACE (where each node sends the player), KIBELISKS (the registry), 0.5 P8, and TRAVEL_RULES, 0.5 P10. Not stored. */\n' +
    `export const NODE_PLACE = ${J(NODE_PLACE)};\nexport const KIBELISKS = ${J(KIBELISKS)};\nexport const TRAVEL_RULES = ${J(TRAVEL_RULES)};\n`;
  if (KIB_REPORT) report.kibelisks = KIB_REPORT;
  report.stats = { checks: report.checks.length, failed: failed.length, rq: RQ_STATS, sources: Object.fromEntries(SOURCES.map(s => [s.id, s.links.length])), constants: Object.keys(C).length,
    gateNodes: Object.keys(GATE_GRAPH.nodes).length, places: Object.keys(NODE_PLACE).length, kibelisks: kibs.length };
  return { module, gateModule, proposedModule, placeModule, constants: C, gateGraph: GATE_GRAPH, gateProposed: GATE_PROPOSED, nodePlace: NODE_PLACE, kibelisks: KIBELISKS,
    report, failed, sources: SOURCES, siteName, label, all, B };
}

/* ------------------------------------------------------------------ data/DATA_SOURCES.md */
export function dataSourcesMd(g) {
  const used = new Map();
  /* a claim that isn't verified says so (id, verdict, owner-sourced), and a source that backs only part of it says which
     part (its `section`), so a cited page isn't read as confirming the whole claim */
  const claimTag = r => r.claim && r.verdict && r.verdict !== 'verified' ? `[${r.id} · ${r.verdict.replace('-', ' ')}${(r.sources || []).some(s => s.owner) ? ', owner source' : ''}] ` : '';
  const partOf = (r, u) => { const s = r.claim && (r.sources || []).find(x => x.url === u && x.section); return s ? ` (this page: ${s.section})` : ''; };
  for (const { r, file } of g.all) for (const u of urlsIn(r)) { const w = `${file.replace(/^data\//, '')}: ${claimTag(r)}${r.name || r.what || r.title || r.claim || r.label || r.id}${partOf(r, u)}`; if (!used.has(u)) used.set(u, []); if (!used.get(u).includes(w)) used.get(u).push(w); }
  for (const p of g.B.sources.pages || []) if (!used.has(p.url)) used.set(p.url, []);
  const groupOf = new Map(), labelOfU = new Map();
  for (const s of g.sources) for (const [u, l] of s.links) { groupOf.set(u, s.t); labelOfU.set(u, l); }
  const all = [...new Set([...used.keys(), ...groupOf.keys()])];
  const cell = t => String(t).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const out = ['# Data sources', '', 'Generated by `tools/gen/gen.mjs` (`npm run gen`). Do not edit by hand.', '',
    'Every URL cited in the v2 data (`data/**`) or shown in the app\'s **Sources** card, grouped by site. *Backs* lists the data records',
    'that cite the page (`file: record`); *Card group* is where the app lists it. Pages were checked in Oct 2026.',
    'A claim that is not verified is tagged `[id · verdict]` (`owner source`: the owner\'s own check is one of its sources), and',
    '"(this page: …)" says which part of a claim a page backs when it backs only part.', '',
    'Only facts were taken from these pages; the app reproduces no page text. Short quotations in `data/packs/aion2/asmodian/assassin/guide/claims.json`',
    'stay their owners\'; thegameswiki quotations are CC BY-NC-SA 4.0 (shortened). Listing a site implies no endorsement.', '',
    `${all.length} URLs · ${groupOf.size} in the Sources card · ${all.filter(u => !groupOf.has(u)).length} cited only in the data files`, ''];
  const bySite = new Map();
  for (const u of all.sort((a, b) => { const sa = g.siteName(a), sb = g.siteName(b); const ka = [sa !== 'Metabot' ? 1 : 0, sa.toLowerCase(), a], kb = [sb !== 'Metabot' ? 1 : 0, sb.toLowerCase(), b];
    for (let i = 0; i < 3; i++) { if (ka[i] < kb[i]) return -1; if (ka[i] > kb[i]) return 1; } return 0; })) { const s = g.siteName(u); if (!bySite.has(s)) bySite.set(s, []); bySite.get(s).push(u); }
  for (const [s, us] of bySite) {
    out.push(`## ${s} (${us.length})`, '', '| Page | Card group | Backs |', '|---|---|---|');
    for (const u of us) out.push(`| [${cell(labelOfU.get(u) || g.label(u))}](${u}) | ${cell(groupOf.get(u) || '—')} | ${cell((used.get(u) || []).join('; ') || 'Sources card (earlier research snapshot)')} |`);
    out.push('');
  }
  /* the bind report (0.5 P8, gen.mjs KIB_REPORT): numbers for the owner's bind-radius decision, and the in-game check list */
  const k = g.report.kibelisks;
  if (k) {
    out.push('## Kibelisk binding (generated)', '',
      `What the bind rules give on the data (docs/design/0.4-smart-next-up.md §8.1, §8.4). Per Kibelisk, the smallest stated distance over the points that`,
      `carry one: **bound** at most R, **nudge** above R up to ${k.nudge} m (\`rule:kibelisk-nudge-radius\`), **none** beyond that or with no such point. *Story*: the`,
      `Kibelisks the story quests cite, over their giver / turn-in points and their objectives' points (Metabot step markers, 0.5 P9; a Kibelisk cited only by`,
      `markers on objectives without a point is "none"); *all*: with regional quests, Sealed Dungeons and strongholds (their giver, turn-in, entrance and objective points).`,
      `\`binds\` facts are not counted here. The working value is \`rule:kibelisk-bind-radius\` = ${k.radius} m.`, '',
      '| R | Story: bound | nudge | none | All: bound | nudge | none |', '|---|---|---|---|---|---|---|');
    for (const s of k.split) out.push(`| ${s.r} m${s.working ? ' (working value)' : ''} | ${s.story.bound} | ${s.story.nudge} | ${s.story.none} | ${s.all.bound} | ${s.all.nudge} | ${s.all.none} |`);
    out.push('', `${k.split[0].story.n} story Kibelisks, ${k.split[0].all.n} in all; ${k.noPoint} story Kibelisks have no point (cited only by markers on objectives without one).`, '',
      `### Owner check list (${k.ownerCheck.length})`, '',
      `Every story Kibelisk the working rules (${k.radius} m) can't bind from the story's giver / turn-in / objective points or a \`binds\` fact, in story order. In game, when convenient:`,
      'which objective binds it? (A `binds` fact on that objective, basis owner, settles it.)', '',
      '| Kibelisk | First cited in | Nearest point | Class |', '|---|---|---|---|');
    for (const c of k.ownerCheck) out.push(`| ${cell(c.name)} | ${cell(c.first)} (Lv ${c.firstLv}) | ${c.best ? `${c.best.m} m, ${cell(c.best.quest)} ${c.best.side}` : 'none (markers on objectives without a point only)'} | ${c.class} |`);
    out.push('');
  }
  return out.join('\n');
}

/* ------------------------------------------------------------------ CLI */
/* node tools/gen/gen.mjs [--pack <id>] [--root <dir>]: defaults aion2/asmodian/assassin and data/packs. data/DATA_SOURCES.md
   is the default pack's; another pack or root writes its DATA_SOURCES.md to tools/gen/out/ instead. */
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const t0 = Date.now(), args = process.argv.slice(2), opt = { pack: DEFAULT_PACK, root: DEFAULT_ROOT };
  for (let i = 0; i < args.length; i++) {
    const k = args[i].replace(/^--/, '');
    if (!['pack', 'root'].includes(k) || !args[i].startsWith('--') || args[i + 1] === undefined) { console.error('usage: node tools/gen/gen.mjs [--pack <id>] [--root <dir>]'); process.exit(2); }
    opt[k] = k === 'root' ? resolve(args[++i]) : args[++i];
  }
  let g; try { g = generate(opt); } catch (e) { console.error('gen: ' + e.message); process.exit(1); }
  const isDefault = opt.pack === DEFAULT_PACK && opt.root === DEFAULT_ROOT, dsMd = isDefault ? 'data/DATA_SOURCES.md' : 'tools/gen/out/DATA_SOURCES.md';
  mkdirSync(join(ROOT, 'tools/gen/out'), { recursive: true });
  writeFileSync(join(ROOT, 'tools/gen/out/generated.js'), g.module);
  writeFileSync(join(ROOT, 'tools/gen/out/gate-graph.js'), g.gateModule);
  writeFileSync(join(ROOT, 'tools/gen/out/gate-proposed.js'), g.proposedModule);
  writeFileSync(join(ROOT, 'tools/gen/out/place.js'), g.placeModule);
  writeFileSync(join(ROOT, 'tools/gen/out/gen-report.json'), JSON.stringify(g.report, null, 1) + '\n');
  writeFileSync(join(ROOT, dsMd), dataSourcesMd(g));
  for (const c of g.failed) console.error('CHECK FAILED: ' + c.check + (c.detail !== undefined ? ' ' + JSON.stringify(c.detail) : ''));
  for (const w of g.report.warnings.filter(w => !/robots unchecked|terms unread/.test(w))) console.log('  warn: ' + w);
  const pr = g.report.proposed, prN = s => pr.filter(p => p.status === s).length;
  console.log(`gen: ${g.report.checks.length} checks, ${g.failed.length} failed · ${Object.keys(g.constants).length} constants + GATE_GRAPH (${g.report.stats.gateNodes} nodes) · ${pr.length} proposed 0.3 gates (${prN('ready')} ready, ${prN('owner-check')} owner-check; in GATE_PROPOSED, applied per id) · pack ${opt.pack} · ${isDefault ? dsMd + ', ' : ''}tools/gen/out/ written (${Date.now() - t0} ms)`);
  process.exit(g.failed.length ? 1 : 0);
}
