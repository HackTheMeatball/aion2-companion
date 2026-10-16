#!/usr/bin/env node
/* Data format v2 checks in Node, no browser, no build (0.2 step 5b): every data file and every schema example against
   data/schema/ with ajv 8 Ajv2020 { strict: true, allErrors: true }; broken copies of real records must be rejected
   (so a relaxed schema can't pass silently); then the generator's cross-record checks, and data/DATA_SOURCES.md must be
   what the generator writes. node tests/schema.mjs  (also in `npm test` and the fast CI job) */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, validateAll, validateDoc } from '../tools/gen/validate.mjs';
import { dataSourcesMd, generate } from '../tools/gen/gen.mjs';

let n = 0, fail = 0;
const ok = (name, c, d) => { n++; console.log((c ? 'ok   ' : 'FAIL ') + name + (!c && d !== undefined ? '  · ' + JSON.stringify(d).slice(0, 900) : '')); if (!c) fail++; };
const t0 = Date.now();

const { files, bad } = validateAll();
ok(`every data file and schema example validates (${files} files)`, !bad.length, bad.map(b => `${b.file}: ${b.errors.slice(0, 3).join('; ')}`));

/* negative controls on real records: each broken copy must fail validation */
const read = p => JSON.parse(readFileSync(join(ROOT, 'data', p), 'utf8'));
const broken = (label, p, mutate) => {
  const doc = read(p); mutate(doc.records[0], doc);
  ok('rejects: ' + label, validateDoc(join(ROOT, 'data', p), doc).length > 0);
};
broken('unknown field on a regional quest', 'shared/asmodian/regional-quests.json', r => { r.bogus = 1; });
broken('location without a zone', 'shared/asmodian/regional-quests.json', r => { delete r.giver.zone; });
broken('story atom without "is"', 'shared/asmodian/regional-quests.json', r => { r.requires = { story: 'sq:2102105' }; });
broken('done on a story quest', 'shared/asmodian/guide/steps.json', r => { r.completesWith = ['tick', { done: 'sq:2102105' }]; });
broken('http:// source URL', 'shared/asmodian/strongholds.json', r => { r.sources[0].url = r.sources[0].url.replace('https', 'http'); });
broken('owner ref that is a URL', 'shared/asmodian/strongholds.json', r => { r.sources.push({ owner: { ref: 'https://example.com/x.png', checkedAt: '2026-10-14', build: { scheme: 'client', value: 'unrecorded' }, what: 'x' } }); });
broken('story id as a slug', 'shared/asmodian/story-quests.json', r => { r.id = 'sq:ishalgen'; });
broken('<span> in guide text', 'shared/asmodian/guide/steps.json', r => { r.text += '<span class="loc">x</span>'; });
broken('unknown text token', 'shared/asmodian/guide/steps.json', r => { r.text += ' [[bogus:1]]'; });
broken('schemaVersion 3', 'shared/rules.json', (r, d) => { d.schemaVersion = 3; });
broken('stigma without maxLevel', 'classes/assassin/stigmas.json', r => { delete r.maxLevel; });
broken('skill node without its skill', 'classes/assassin/board-nodes.json', (r, d) => { const x = d.records.find(y => y.type === 'skill'); delete x.skill; });
broken('specialty pick that is not a choice id', 'classes/assassin/builds.json', r => { r.specialtyPicks['skill:assassin:heart-gore'] = ['Up to +20% Critical Hit']; });
broken('Ascension quest with a giver', 'shared/asmodian/ascension-quests.json', r => { r.giver = { zone: 'zone:moslan-forest' }; });
broken('site that bans automation read by script', 'sources.json', r => { r.access = { ...r.access, terms: 'bans-automation', mode: 'scripted' }; });
/* 0.3 proposals (`proposed`, docs/design/0.3-requirement-engine.md §7) */
const P = { requires: { level: 10 }, status: 'ready', change: 'x', basis: 'prereq-gates §6' };
broken('proposal without status', 'shared/asmodian/regional-quests.json', r => { r.proposed = { ...P, status: undefined }; delete r.proposed.status; });
broken('owner-check proposal without its check number', 'shared/asmodian/regional-quests.json', r => { r.proposed = { ...P, status: 'owner-check' }; });
broken('proposal with neither requires nor completesWith', 'shared/asmodian/regional-quests.json', r => { r.proposed = { status: 'ready', change: 'x', basis: 'y' }; });
broken('proposal naming a story quest in done', 'shared/asmodian/guide/steps.json', r => { r.proposed = { ...P, completesWith: ['tick', { done: 'sq:2102105' }] }; });
broken('unknown field in a proposal', 'classes/assassin/builds.json', r => { r.boardPlan[0].proposed = { ...P, apply: true }; });

/* the generator: cross-record checks pass, and the committed DATA_SOURCES.md is current */
let g = null;
try { g = generate(); } catch (e) { ok('generator runs', false, e.message); }
if (g) {
  ok(`generator: ${g.report.checks.length} cross-record checks pass`, !g.failed.length, g.failed.slice(0, 10));
  ok('data/DATA_SOURCES.md is current (npm run gen)', readFileSync(join(ROOT, 'data/DATA_SOURCES.md'), 'utf8') === dataSourcesMd(g));
  /* proposals never reach the page's data module: it is byte-identical without them (0.2 behaviour unchanged) */
  let g0 = null; try { g0 = generate({ dropProposed: true }); } catch (e) { ok('generator runs without proposals', false, e.message); }
  if (g0) ok(`proposed 0.3 gates are not in the data module: identical without the ${g.report.proposed.length} proposals`, g0.module === g.module && g.report.proposed.length > 0);
  /* GATE_GRAPH (0.3 E1) compiles the live gates only: proposals off */
  if (g0) ok('GATE_GRAPH identical without the proposals (live requires / completesWith only)', g0.gateModule === g.gateModule);
  /* GATE_PROPOSED (0.3 E4) holds exactly the proposals, compiled (the evaluator applies one only when asked, per id) */
  if (g0) ok('GATE_PROPOSED: one entry per proposal, empty without them', Object.keys(g.gateProposed).sort().join() === g.report.proposed.map(p => p.id).sort().join() && Object.keys(g0.gateProposed).length === 0,
    [Object.keys(g.gateProposed).length, g.report.proposed.length, Object.keys(g0.gateProposed).length]);
  /* 0.3 E7 guard: a specialty pick beyond slot 1 needs a 2+ source slot witness in specialtyEvidence (owner on #75) */
  const genFails = (label, mutate, re) => { let g1 = null; try { g1 = generate({ mutate: (rel, d) => rel === 'data/classes/assassin/builds.json' && mutate(d.records[0]) }); } catch (e) { ok('generator runs: ' + label, false, e.message); return; }
    ok('generator rejects: ' + label, g1.failed.some(x => re.test(x.check)), g1.failed.map(x => x.check)); };
  genFails('slot 2 pick without evidence (Savage Roar 4, contested)', r => { r.specialtyPicks['skill:assassin:savage-roar'].push('spec:assassin:savage-roar:4'); }, /savage-roar:4 \(slot 2\) has 2\+ source/);
  genFails('slot witness not cited for specialtyPicks (GamesFuze)', r => { r.specialtyEvidence['spec:assassin:quick-slice:4'].sources[0] = 'https://gamesfuze.com/guides/aion-2-assassin-build-best-skills-stigmas-and-rotation/'; }, /quick-slice:4 \(slot 2\) has 2\+ source/);
  genFails('evidence from one publisher only', r => { r.specialtyEvidence['spec:assassin:heart-gore:5'].sources = ['https://skycoach.gg/blog/aion-2/articles/assassin-guide', 'https://skycoach.gg/blog/aion-2/articles/assassin-guide']; }, /heart-gore:5 \(slot 3\) has 2\+ source/);
  genFails('evidence for the wrong slot', r => { r.specialtyEvidence['spec:assassin:heart-gore:5'].slot = 2; }, /heart-gore:5 \(slot 3\) has 2\+ source/);
  const c = g.constants;
  ok('compiled: 87 story quests (Ishalgen is the starting map, not a quest; E10 added Daeva Trapped in a Nightmare), 58 regional quests, 15 strongholds, 60 Sealed Dungeons', c.QUESTS.length === 87 && c.RQ.length === 58 && c.SH_DATA.length === 15 && Object.keys(c.HIDEOUT_AREA).length === 60,
    [c.QUESTS.length, c.RQ.length, c.SH_DATA.length, Object.keys(c.HIDEOUT_AREA).length]);
}
console.log(`${n - fail} ok, ${fail} failed (${Date.now() - t0} ms)`);
console.log(fail ? `SCHEMA CHECKS FAILED (${fail})` : 'SCHEMA CHECKS PASSED');
process.exit(fail ? 1 : 0);
