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
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, dataFiles, validateDoc } from './validate.mjs';

/* ------------------------------------------------------------------ load */
const loadBundle = () => {
  const files = dataFiles(), by = {}, schemaErrors = [];
  let retired = null, sources = null;
  for (const f of files) {
    const doc = JSON.parse(readFileSync(f, 'utf8')), rel = relative(ROOT, f);
    const errs = validateDoc(f, doc);
    if (errs.length) schemaErrors.push(`${rel}: ${errs.slice(0, 5).join('; ')}${errs.length > 5 ? ` (+${errs.length - 5})` : ''}`);
    if (doc.schemaVersion !== 2) throw new Error(`${rel}: data schemaVersion ${doc.schemaVersion} is not 2 (this generator knows major 2 only)`);
    if (rel === 'data/retired.json') { retired = doc; continue; }
    if (doc.collection === 'sources') sources = doc;
    (by[doc.collection] = by[doc.collection] || []).push({ file: rel, doc });
  }
  if (schemaErrors.length) throw new Error('schema validation failed:\n  ' + schemaErrors.join('\n  '));
  const recs = c => (by[c] || []).flatMap(x => x.doc.records);
  return { by, recs, retired, sources };
};

/* ------------------------------------------------------------------ helpers */
const URL_RE = /https?:\/\/[^\s)\]'"]+/g;
const urlsIn = v => typeof v === 'string' ? (v.match(URL_RE) || []).map(u => u.replace(/[.,;]+$/, ''))
  : Array.isArray(v) ? v.flatMap(urlsIn) : v && typeof v === 'object' ? Object.values(v).flatMap(urlsIn) : [];
const hostOf = u => u.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
const byNum = k => (a, b) => a[k] - b[k];
const atomsOf = c => !c ? [] : c.all ? c.all.flatMap(atomsOf) : c.any ? c.any.flatMap(atomsOf) : [c];

export function generate() {
  const B = loadBundle(), R = B.recs;
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
  const classes = R('classes'); if (classes.length !== 1) throw new Error('one class per bundle in 0.2, got ' + classes.length);
  const cls = classes[0], builds = R('builds'), build = builds.find(b => b.id === cls.defaultBuild);
  if (!build) throw new Error('default build missing: ' + cls.defaultBuild);
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
  for (const s of chain) if (s.steps.length) check('story steps end with a turn-in: ' + s.name, /^Turn in/.test(s.steps[s.steps.length - 1].text));
  for (const s of story) check('story id is sq:<gameId>: ' + s.name, s.id === 'sq:' + s.gameId);
  const QUESTS = chain.map(s => [s.lv, s.name]);
  const sqName = id => { if (!sqById[id]) throw new Error('unknown story quest ' + id); return sqById[id].name; };
  const QUEST_STEPS = Object.fromEntries(chain.filter(s => s.steps.length).map(s => [s.name, s.steps.map(x => x.text)]));
  const LOC = s => { const o = {}; const put = (k, v) => { if (v !== null && v !== undefined) o[k] = v; };
    put('giverKib', s.giver.kibelisk); put('giverKibM', s.giver.meters); put('turnin', s.turnin.npc); put('turninPlace', s.turnin.place);
    put('turninKib', s.turnin.kibelisk); put('turninKibM', s.turnin.meters); return o; };
  const QUEST_LOC = Object.fromEntries(chain.map(s => [s.name, LOC(s)]).filter(([, o]) => Object.keys(o).length));
  const X = chain.filter(s => s.lv > 40);   /* Lv 41-45: the v1 block's separate constants, kept for the page globals */
  const QUESTS_X = X.map(s => [s.lv, s.name]);
  const QUEST_STEPS_X = Object.fromEntries(X.map(s => [s.name, s.steps.map(x => x.text)]));
  const QUEST_LOC_X = Object.fromEntries(X.map(s => [s.name, LOC(s)]));
  const STORY_END = { quest: last.name, lv: last.lv, turnin: last.turnin.npc, place: last.turnin.place, region: last.end.region, regionFull: last.end.regionFull };
  check('last story quest turns in in Reshanta', STORY_END.region === 'Reshanta');
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
    check('regional: at most one story gate: ' + q.name, st.length <= 1);
    const its = (q.rewards.items || []).map(shortItem).filter(Boolean);
    if (q.rewards.ap) its.unshift(`${Math.floor(q.rewards.ap / 1000)}k Abyss Points`);
    let place = q.giver.place || ''; if (place === zone) place = '';
    const row = { name: q.name, id: q.gameId, rec: q.rec, unlocksAt: q.unlocksAt, zone, place, npc: q.giver.npc || '', kib: q.giver.kibelisk, m: q.giver.meters,
      after, story: st.length ? sqName(st[0].story) : null, reward: its.join(' · '), xp: q.rewards.xp ?? null, rw: { st: q.rewards.wisdom || 0, cr: q.rewards.crystal || 0 } };
    if (q.requiresBasis === 'unresearched') row.noPre = 1;
    check('regional: zone = giver zone: ' + q.name, q.zone === q.giver.zone);
    check('regional: id = key = rq:<gameId>: ' + q.name, q.id === 'rq:' + q.gameId && q.key === q.id);
    return row;
  });
  check('58 regional quests', RQ.length === 58, RQ.length);
  check('every regional quest has unlocksAt and rec', RQ.every(x => x.unlocksAt && x.rec));
  /* a camp (giver place, or a Kibelisk within 100 m of the giver) belongs to one zone; a nearest Kibelisk further away
     may lie across a zone border (Pain Unending: Basfelt Waterfall 309 m) */
  { const cz = {}; for (const q of rqs) for (const a of [q.giver.meters != null && q.giver.meters <= 100 ? q.giver.kibelisk : null, q.giver.place]) if (a) (cz[a] = cz[a] || new Set()).add(q.zone);
    check('same giver camp/Kibelisk -> one zone', Object.values(cz).every(v => v.size === 1), Object.entries(cz).filter(([, v]) => v.size > 1).map(([k, v]) => [k, [...v]])); }
  check('Nine Wonders of Altgard: 2nd Leg is in Battlescar Mound (E4)', RQ.find(x => x.name === 'Nine Wonders of Altgard: 2nd Leg').zone === 'Battlescar Mound');
  const RQ_STATS = { n: RQ.length, at10: RQ.filter(x => x.unlocksAt === 10).length, story: RQ.filter(x => x.story).length, chained: RQ.filter(x => x.after.length).length, kib: RQ.filter(x => x.kib).length };

  /* ---------------------------------------------------------------- strongholds, Sealed Dungeons, zones */
  const SH_DATA = shs.slice().sort((a, b) => a.levelRange.lo - b.levelRange.lo || (a.name < b.name ? -1 : 1)).map(s => ({ name: s.name, qid: +s.gameId, zone: zname(s.zone),
    lo: s.levelRange.lo, hi: s.levelRange.hi, kib: s.location.kibelisk, m: s.location.meters }));
  check('15 strongholds', SH_DATA.length === 15);
  check('every stronghold has zone, range and Kibelisk', SH_DATA.every(x => x.zone && x.lo && x.hi && x.kib));
  for (const s of shs) check('stronghold pays no stones/crystals: ' + s.name, !s.rewards.wisdom && !s.rewards.crystal);
  const mapSlug = n => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  for (const d of sds) check('Sealed Dungeon key = <band prefix>:<slug>: ' + d.name, d.key === `${d.band === 10 ? 'g10h' : 'sd'}:${mapSlug(d.name)}` && d.id === 'sd:' + mapSlug(d.name));
  check('60 Sealed Dungeons', sds.length === 60, sds.length);
  const AREA_LOC = Object.fromEntries(sds.filter(d => d.entrance.kibelisk).map(d => [d.name, { kib: d.entrance.kibelisk, m: d.entrance.meters }]));
  const HIDEOUT_AREA = Object.fromEntries(sds.map(d => [d.name, zname(d.zone)]));
  const ZONE_TRACES = Object.fromEntries(Object.values(zones).filter(z => z.traces != null).sort((a, b) => b.traces - a.traces).map(z => [z.name, z.traces]));
  const sdRule = rules['rule:sd-first-clear-asmodian'], shRule = rules['rule:sh-first-clear-asmodian'];
  check('Sealed Dungeon reward is 2 Wisdom Stones + 2 crystals in every sampled band', sdRule.value.evidence.every(b => b.wisdom === 2 && b.crystal === 2));
  const SD_RW = { st: sdRule.value.rewards.wisdom, cr: sdRule.value.rewards.crystal };
  const SD_REWARD = sdRule.value.text, SH_REWARD = shRule.value.text;
  for (const z of Object.values(zones)) for (const c of [...(z.camps || []), ...(z.kibelisks || [])]) {
    const other = Object.values(zones).find(o => o !== z && [...(o.camps || []), ...(o.kibelisks || [])].includes(c));
    check(`camp/Kibelisk ${c} resolves to one zone`, !other, [z.id, other && other.id]);
  }

  /* ---------------------------------------------------------------- the guide build */
  const SP_ICONS = Object.fromEntries(skills.filter(s => s.icon).map(s => [s.name, s.icon]));
  const STIGMA_ICON = Object.fromEntries(stigmas.filter(s => s.icon).map(s => [s.name, s.icon]));
  const choice = id => { for (const s of skills) for (const c of s.specialtyChoices || []) if (c.id === id) return c; throw new Error('unknown specialty choice ' + id); };
  const sk = id => { if (!skById[id]) throw new Error('unknown skill ' + id); return skById[id]; };
  const stg = id => { if (!stById[id]) throw new Error('unknown stigma ' + id); return stById[id]; };
  const SP_SKILLS_CORE = build.skillOrder.filter(e => e.core).map(e => { const s = sk(e.skill), pick = (build.specialtyPicks[e.skill] || [])[0];
    return { n: s.name, learn: s.learnLv, ...(pick ? { spec: choice(pick).label || choice(pick).text } : {}), ...(s.type === 'passive' ? { passive: true } : {}) }; });
  const SP_EXTRA = build.skillOrder.filter(e => !e.core).map(e => { const s = sk(e.skill);
    return { n: s.name, learn: s.learnLv, ...(s.type === 'passive' ? { passive: true } : {}), ...(s.levelGate === 'flat' ? { flat: true } : {}), ...(e.status !== 'verified' ? { single: e.basis.split(' (')[0] } : {}) }; });
  /* specialties (owner F4, Metabot): every active skill has the 5 choices at effective skill level 8 / 8 / 8 / 12 / 16 */
  for (const s of skills) if (s.type === 'active') check(`specialty choices 8/8/8/12/16: ${s.name}`, JSON.stringify((s.specialtyChoices || []).map(c => c.skillLv)) === '[8,8,8,12,16]', (s.specialtyChoices || []).map(c => c.skillLv));
    else check(`passive skill has no specialty choices: ${s.name}`, !s.specialtyChoices);
  check('specialty slots at effective level 8 / 12 / 20', JSON.stringify(rules['rule:specialty-slots'].value.slots) === '[8,12,20]' && rules['rule:specialty-slots'].value.levelBasis === 'effective');
  for (const [sid, picks] of Object.entries(build.specialtyPicks)) for (const p of picks) check(`specialty pick ${p} is a choice of ${sid}`, (sk(sid).specialtyChoices || []).some(c => c.id === p));
  check('specialty picks: at most 3 slots', Object.values(build.specialtyPicks).every(p => p.length <= rules['rule:specialty-slots'].value.slots.length));
  const STIGMA_PLAN = build.stigmaSlots.map(id => stg(id).name);
  const ST_TARGETS = build.stigmaTargets.map(t => [stg(t.stigma).name, t.level]);
  const STAT_TIERS = build.statPriority.tiers, STAT_SRC = build.statPriority.from;
  const RMB_ROWS = build.keyStacks.rightClick.map(r => ({ minLv: r.minLv, skills: r.skills.map(id => sk(id).name) })).sort((a, b) => b.minLv - a.minLv);
  const E_ORDER = build.keyStacks.eOrder.map(id => stg(id).name);
  const LEVEL_POINTS = rules['rule:level-points'].value;
  check('exactly one guide build, at most two community builds', builds.filter(b => b.origin === 'guide').length === 1 && builds.filter(b => b.origin === 'community').length <= 2);
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
  for (const e of build.boardPlan) {
    for (const n of e.node ? [e.node] : e.anyNode) if (!nodeById[n]) throw new Error('board plan: unknown node ' + n);
    if (e.anyNode) check('board plan any-of nodes on one board: ' + e.key, new Set(e.anyNode.map(n => nodeById[n].board)).size === 1);
  }
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
    it.t = buildTok(s.text) + (s.loc ? `<span class="loc">${buildTok(s.loc)}</span>` : '');
    if (s.note) it.note = s.note; if (s.upsell) it.upsell = s.upsell;
    return it;
  };
  const GUIDE = msOrder.map(m => {
    const parts = [
      ...steps.filter(s => s.milestone === m.id).map(s => ({ order: s.order, items: [itemOf(s)] })),
      ...(m.includes || []).map(x => { const ds = sdByBand(x.sealedDungeonBand); return { order: x.order, items: [{ hideouts: ds.map(d => d.name), keyPrefix: ds[0].key.split(':')[0] }] }; }),
      ...build.boardPlan.filter(e => e.milestone === m.id).map(e => ({ order: e.order, items: [dvItem(e)] })),
    ].sort(byNum('order'));
    const g = m.kind === 'milestone' ? { id: m.id, lv: m.lv, title: m.title, blurb: m.blurb } : { id: m.id, title: m.title, blurb: m.blurb, tag: m.tag };
    g.items = parts.flatMap(p => p.items);
    return g;
  });
  const GUIDE_GATES = GUIDE.filter((g, i) => msOrder[i].kind === 'milestone'), GUIDE_STEPS = GUIDE.filter((g, i) => msOrder[i].kind === 'routeRule');
  for (const s of steps) check('step key = id: ' + s.id, s.key === s.id && milestones.some(m => m.id === s.milestone));

  /* ---------------------------------------------------------------- tips, items, unlocks */
  const TIPS = Object.fromEntries(tips.map(t => [t.key, { h: t.title, b: buildTok(t.body).replace(/\{rqStats\.(\w+)\}/g, (m, k) => { if (!(k in RQ_STATS)) throw new Error(m); return RQ_STATS[k]; }), src: t.credit }]));
  const ITEMS = Object.fromEntries(items.map(i => [i.key, [i.label, i.metabotSlug, i.icon || '', i.gameName]]));
  const lvOf = c => (atomsOf(c).find(a => a.level !== undefined) || {}).level;
  const VERIFIED_UNLOCKS = unlocks.filter(u => u.credit && u.status === 'verified').sort(byNum('order')).map(u => [lvOf(u.at), u.what, u.detail || '', u.credit]);

  /* ---------------------------------------------------------------- confidence card */
  const conf = (B.by.confidence || [])[0].doc;
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
  /* any other Metabot quest page a quest cites (e.g. the location pass) is labelled with the quest's name */
  for (const q of [...rqs, ...story]) for (const s of q.sources || []) if (s.url && /metabot\.gg\/en\/aion-2\/quests\//.test(s.url)) setdef(s.url, q.name);
  for (const a of asc) { const p = pageOf(a, ['chapter']); if (p) labelOf[p.url] = a.name; }
  for (const s of shs) { const p = pageOf(s, ['gameId']); if (p) labelOf[p.url] = s.name; }
  for (const d of sds) { const p = pageOf(d, ['rewards']); if (p) labelOf[p.url] = d.name; }
  for (const d of sds) { const p = pageOf(d, ['entrance.kibelisk']); if (p) setdef(p.url, d.name + (/metabot\.gg\/en\/aion-2\/quests\//.test(p.url) ? ' (exploration quest)' : '')); }
  for (const p of pages) setdef(p.url, p.label);
  const refLabels = v => { if (Array.isArray(v)) v.forEach(refLabels); else if (v && typeof v === 'object') { if (v.url && v.label) setdef(v.url, v.label); Object.values(v).forEach(refLabels); } };
  refLabels(claims); refLabels([...items, ...skills, ...stigmas, ...unlocks]);
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
    ['claims', 'Tips and rules', [...claims, ...Object.values(zones)]],
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
    const ret = new Set((B.retired ? B.retired.keys : []).map(x => x.key));
    for (const k of Object.keys(keys)) check('retired key never reused: ' + k, !ret.has(k)); }
  /* references */
  const known = new Set(all.map(x => x.r.id));
  const refCheck = (where, id) => check(`${where}: reference ${id} resolves`, known.has(id));
  for (const { r } of all) {
    for (const c of [r.requires, ...(r.completesWith || []), r.at].filter(x => x && typeof x === 'object')) for (const a of atomsOf(c)) {
      if (a.story) refCheck(r.id, a.story);
      if (a.done) { refCheck(r.id, a.done); check(`${r.id}: done never names a story quest`, !a.done.startsWith('sq:')); }
      if (a.story) check(`${r.id}: story atom has "is"`, !!a.is);
    }
    for (const f of ['wraps', 'storyQuest', 'ascensionQuest', 'opensBoard', 'board', 'skill', 'defaultBuild']) if (typeof r[f] === 'string' && r[f].includes(':')) refCheck(r.id, r[f]);
    if (r.zone) refCheck(r.id, r.zone);
    for (const l of [r.giver, r.turnin, r.entrance, r.location].filter(Boolean)) refCheck(r.id, l.zone);
    if (r.unlocks && r.unlocks.milestone) check(`${r.id}: unlock milestone resolves`, milestones.some(m => m.id === r.unlocks.milestone));
  }
  for (const e of build.boardPlan) check('board plan milestone resolves: ' + (e.node || e.key), milestones.some(m => m.id === e.milestone));
  for (const s of build.skillOrder) refCheck(build.id, s.skill);
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
  /* i / j / choice n: dense from 0 / 1, never renumbered (positions are save indices) */
  for (const { r } of all) {
    if (Array.isArray(r.steps)) check(`${r.id}: objective i = position`, r.steps.every((s, i) => s.i === i));
    if (r.specialtyChoices) check(`${r.id}: choice n = position + 1`, r.specialtyChoices.every((c, i) => c.n === i + 1));
  }
  /* shared steps carry no class content outside build tokens: no skill or stigma name of this class */
  const classWords = [...stigmas.map(s => s.name)];
  for (const s of steps) for (const w of classWords) check(`shared step ${s.id} names no stigma outside a build token`, !(s.text + (s.loc || '')).includes(w));
  /* zone adjacency symmetric */
  for (const z of Object.values(zones)) for (const n of z.neighbours || []) check(`zone adjacency symmetric: ${z.id} - ${n.zone}`, (zones[n.zone] && (zones[n.zone].neighbours || []).some(x => x.zone === z.id)));
  /* gate basis: requiresBasis legacy / unresearched / verified-none never sits on sourced atoms only (N2) */
  for (const { r } of all) if (r.requiresBasis === 'verified-none') check(`${r.id}: verified-none has no prerequisite atoms`, !atomsOf(r.requires).some(a => a.story || a.done));
  /* placeholder zones are debt */
  report.debt.placeholderZone = all.filter(({ r }) => [r.zone, r.giver && r.giver.zone, r.turnin && r.turnin.zone, r.entrance && r.entrance.zone].includes('zone:altgard-unplaced')).map(({ r }) => r.id);
  /* every records file sorted by id */
  for (const xs of Object.values(B.by)) for (const x of xs) { const ids = x.doc.records.map(r => r.id); check(`${x.file}: records sorted by id`, ids.every((id, i) => !i || ids[i - 1] < id)); }

  const failed = report.checks.filter(c => !c.pass);
  /* ---------------------------------------------------------------- the module */
  const C = { RQ, RQ_STATS, QUESTS_X, QUEST_STEPS_X, QUEST_LOC_X, STORY_END, SH_DATA, AREA_LOC, SD_RW, SP_EXTRA, DV_BOARDS, SOURCES, SRC_SITE, CONF,
    QUESTS, QUEST_STEPS, QUEST_LOC, STORY_UNLOCKS, UNLOCK_GATE, VERIFIED_UNLOCKS, GUIDE_GATES, GUIDE_STEPS, TIPS, ITEMS, HIDEOUT_AREA, ZONE_TRACES, SD_REWARD, SH_REWARD,
    STAT_TIERS, STAT_SRC, STIGMA_PLAN, ST_TARGETS, SP_SKILLS_CORE, LEVEL_POINTS, RMB_ROWS, E_ORDER, SP_ICONS, STIGMA_ICON };
  const J = v => JSON.stringify(v);
  const module = '/* Generated by tools/gen/gen.mjs from data/** (data format v2). Not stored: the build makes it on every run. */\n' +
    Object.entries(C).map(([k, v]) => `export const ${k} = ${J(v)};`).join('\n') + '\n';
  report.stats = { checks: report.checks.length, failed: failed.length, rq: RQ_STATS, sources: Object.fromEntries(SOURCES.map(s => [s.id, s.links.length])), constants: Object.keys(C).length };
  return { module, constants: C, report, failed, sources: SOURCES, siteName, label, all, B };
}

/* ------------------------------------------------------------------ data/DATA_SOURCES.md */
export function dataSourcesMd(g) {
  const used = new Map();
  for (const { r, file } of g.all) for (const u of urlsIn(r)) { const w = `${file.replace(/^data\//, '')}: ${r.name || r.what || r.title || r.claim || r.label || r.id}`; if (!used.has(u)) used.set(u, []); if (!used.get(u).includes(w)) used.get(u).push(w); }
  for (const p of g.B.sources.pages || []) if (!used.has(p.url)) used.set(p.url, []);
  const groupOf = new Map(), labelOfU = new Map();
  for (const s of g.sources) for (const [u, l] of s.links) { groupOf.set(u, s.t); labelOfU.set(u, l); }
  const all = [...new Set([...used.keys(), ...groupOf.keys()])];
  const cell = t => String(t).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const out = ['# Data sources', '', 'Generated by `tools/gen/gen.mjs` (`npm run gen`). Do not edit by hand.', '',
    'Every URL cited in the v2 data (`data/**`) or shown in the app\'s **Sources** card, grouped by site. *Backs* lists the data records',
    'that cite the page (`file: record`); *Card group* is where the app lists it. Pages were checked in Oct 2026.', '',
    'Only facts were taken from these pages; the app reproduces no page text. Short quotations in `data/shared/asmodian/guide/claims.json`',
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
  return out.join('\n');
}

/* ------------------------------------------------------------------ CLI */
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const t0 = Date.now();
  let g; try { g = generate(); } catch (e) { console.error('gen: ' + e.message); process.exit(1); }
  mkdirSync(join(ROOT, 'tools/gen/out'), { recursive: true });
  writeFileSync(join(ROOT, 'tools/gen/out/generated.js'), g.module);
  writeFileSync(join(ROOT, 'tools/gen/out/gen-report.json'), JSON.stringify(g.report, null, 1) + '\n');
  writeFileSync(join(ROOT, 'data/DATA_SOURCES.md'), dataSourcesMd(g));
  for (const c of g.failed) console.error('CHECK FAILED: ' + c.check + (c.detail !== undefined ? ' ' + JSON.stringify(c.detail) : ''));
  for (const w of g.report.warnings.filter(w => !/robots unchecked|terms unread/.test(w))) console.log('  warn: ' + w);
  console.log(`gen: ${g.report.checks.length} checks, ${g.failed.length} failed · ${Object.keys(g.constants).length} constants · data/DATA_SOURCES.md, tools/gen/out/ written (${Date.now() - t0} ms)`);
  process.exit(g.failed.length ? 1 : 0);
}
