#!/usr/bin/env node
/* Data format v2 checks in Node, no browser, no build (0.2 step 5b): every data file and every schema example against
   data/schema/ with ajv 8 Ajv2020 { strict: true, allErrors: true }; broken copies of real records must be rejected
   (so a relaxed schema can't pass silently); then the generator's cross-record checks, and data/DATA_SOURCES.md must be
   what the generator writes. node tests/schema.mjs  (also in `npm test` and the fast CI job) */
import { cpSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
broken('unknown field on a regional quest', 'packs/aion2/asmodian/regional-quests.json', r => { r.bogus = 1; });
broken('location without a zone', 'packs/aion2/asmodian/regional-quests.json', r => { delete r.giver.zone; });
broken('story atom without "is"', 'packs/aion2/asmodian/regional-quests.json', r => { r.requires = { story: 'sq:2102105' }; });
broken('done on a story quest', 'packs/aion2/asmodian/assassin/guide/steps.json', r => { r.completesWith = ['tick', { done: 'sq:2102105' }]; });
broken('http:// source URL', 'packs/aion2/asmodian/strongholds.json', r => { r.sources[0].url = r.sources[0].url.replace('https', 'http'); });
broken('owner ref that is a URL', 'packs/aion2/asmodian/strongholds.json', r => { r.sources.push({ owner: { ref: 'https://example.com/x.png', checkedAt: '2026-10-14', build: { scheme: 'client', value: 'unrecorded' }, what: 'x' } }); });
broken('story id as a slug', 'packs/aion2/asmodian/story-quests.json', r => { r.id = 'sq:ishalgen'; });
broken('<span> in guide text', 'packs/aion2/asmodian/assassin/guide/steps.json', r => { r.text += '<span class="loc">x</span>'; });
broken('unknown text token', 'packs/aion2/asmodian/assassin/guide/steps.json', r => { r.text += ' [[bogus:1]]'; });
broken('schemaVersion 3', 'packs/aion2/rules.json', (r, d) => { d.schemaVersion = 3; });
broken('stigma without maxLevel', 'packs/aion2/classes/assassin/stigmas.json', r => { delete r.maxLevel; });
broken('skill node without its skill', 'packs/aion2/classes/assassin/board-nodes.json', (r, d) => { const x = d.records.find(y => y.type === 'skill'); delete x.skill; });
broken('specialty pick that is not a choice id', 'packs/aion2/asmodian/assassin/builds.json', r => { r.specialtyPicks['skill:assassin:heart-gore'] = ['Up to +20% Critical Hit']; });
/* a milestone's own items never get a gate node (0.4 P2a; openSteps relies on it) */
broken('milestone item with a gate node', 'packs/aion2/asmodian/assassin/guide/milestones.json', (r, d) => { d.records.find(x => x.items).items[0].gateNode = true; });
broken('milestone item with requires', 'packs/aion2/asmodian/assassin/guide/milestones.json', (r, d) => { d.records.find(x => x.items).items[0].requires = { level: 28 }; });
broken('Ascension quest with a giver', 'packs/aion2/asmodian/ascension-quests.json', r => { r.giver = { zone: 'zone:moslan-forest' }; });
/* zone records (0.2.4 villages as zones: records[0] is zone:aldelle-village) */
broken('zone id that is a name, not zone:<slug>', 'packs/aion2/asmodian/zones.json', r => { r.id = 'Aldelle Village'; });
broken('zone without a region', 'packs/aion2/asmodian/zones.json', r => { delete r.region; });
broken('zone with an unknown field (parent)', 'packs/aion2/asmodian/zones.json', r => { r.parent = 'zone:ishalgen'; });
broken('zone with a Kibelisk listed twice', 'packs/aion2/asmodian/zones.json', r => { r.kibelisks.push(r.kibelisks[0]); });
broken('site that bans automation read by script', 'packs/aion2/sources.json', r => { r.access = { ...r.access, terms: 'bans-automation', mode: 'scripted' }; });
/* 0.3 proposals (`proposed`, docs/design/0.3-requirement-engine.md §7) */
const P = { requires: { level: 10 }, status: 'ready', change: 'x', basis: 'prereq-gates §6' };
broken('proposal without status', 'packs/aion2/asmodian/regional-quests.json', r => { r.proposed = { ...P, status: undefined }; delete r.proposed.status; });
broken('owner-check proposal without its check number', 'packs/aion2/asmodian/regional-quests.json', r => { r.proposed = { ...P, status: 'owner-check' }; });
broken('proposal with neither requires nor completesWith', 'packs/aion2/asmodian/regional-quests.json', r => { r.proposed = { status: 'ready', change: 'x', basis: 'y' }; });
broken('proposal naming a story quest in done', 'packs/aion2/asmodian/assassin/guide/steps.json', r => { r.proposed = { ...P, completesWith: ['tick', { done: 'sq:2102105' }] }; });
broken('unknown field in a proposal', 'packs/aion2/asmodian/assassin/builds.json', r => { r.boardPlan[0].proposed = { ...P, apply: true }; });

/* 0.5 P8: the Kibelisk registry, binds facts and the travel rules */
const stepWith = (d, f) => d.records.flatMap(r => r.steps).find(f);
broken('binds without basis', 'packs/aion2/asmodian/story-quests.json', (r, d) => { delete stepWith(d, x => x.binds).binds.basis; });
broken('owner binds without its note', 'packs/aion2/asmodian/story-quests.json', (r, d) => { delete stepWith(d, x => x.binds && x.binds.basis === 'owner').binds.note; });
broken('binds naming a Kibelisk by name, not kib:<slug>', 'packs/aion2/asmodian/story-quests.json', (r, d) => { stepWith(d, x => x.binds).binds.kibelisk = 'Safe Haven'; });
broken('bind radius out of range (0 m)', 'packs/aion2/rules.json', (r, d) => { d.records.find(x => x.id === 'rule:kibelisk-bind-radius').value = 0; });
broken('nudge radius out of range (5000 m)', 'packs/aion2/rules.json', (r, d) => { d.records.find(x => x.id === 'rule:kibelisk-nudge-radius').value = 5000; });
broken('teleport gain that is not a number', 'packs/aion2/rules.json', (r, d) => { d.records.find(x => x.id === 'rule:teleport-gain').value = '400 m'; });
broken('Kibelisk id that is not kib:<slug>', 'packs/aion2/asmodian/kibelisks.json', r => { r.id = 'kib:Safe Haven'; });
broken('Kibelisk without a zone field', 'packs/aion2/asmodian/kibelisks.json', r => { delete r.zone; });
broken('Kibelisk with an unknown field', 'packs/aion2/asmodian/kibelisks.json', r => { r.pos = { x: 1, y: 2 }; });

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
  const genFails = (label, mutate, re) => { let g1 = null; try { g1 = generate({ mutate: (rel, d) => rel === 'data/packs/aion2/asmodian/assassin/builds.json' && mutate(d.records[0]) }); } catch (e) { ok('generator runs: ' + label, false, e.message); return; }
    ok('generator rejects: ' + label, g1.failed.some(x => re.test(x.check)), g1.failed.map(x => x.check)); };
  genFails('slot 2 pick without evidence (Savage Roar 4, contested)', r => { r.specialtyPicks['skill:assassin:savage-roar'].push('spec:assassin:savage-roar:4'); }, /savage-roar:4 \(slot 2\) has 2\+ source/);
  genFails('slot witness not cited for specialtyPicks (GamesFuze)', r => { r.specialtyEvidence['spec:assassin:quick-slice:4'].sources[0] = 'https://gamesfuze.com/guides/aion-2-assassin-build-best-skills-stigmas-and-rotation/'; }, /quick-slice:4 \(slot 2\) has 2\+ source/);
  genFails('evidence from one publisher only', r => { r.specialtyEvidence['spec:assassin:heart-gore:5'].sources = ['https://skycoach.gg/blog/aion-2/articles/assassin-guide', 'https://skycoach.gg/blog/aion-2/articles/assassin-guide']; }, /heart-gore:5 \(slot 3\) has 2\+ source/);
  genFails('evidence for the wrong slot', r => { r.specialtyEvidence['spec:assassin:heart-gore:5'].slot = 2; }, /heart-gore:5 \(slot 3\) has 2\+ source/);
  /* 0.2.4 villages as zones (issue #98): the village zone record, and the checks that keep places and Kibelisks in it */
  const zs = read('packs/aion2/asmodian/zones.json').records, av = zs.find(z => z.id === 'zone:aldelle-village');
  ok('zone:aldelle-village: Aldelle Village, region Ishalgen, verified, its Kibelisk, no trace count', !!av && av.name === 'Aldelle Village' && av.region === 'Ishalgen' && av.status === 'verified'
    && av.kibelisks.join() === 'Aldelle Village' && av.traces === null, av);
  ok('zone:aldelle-village: a Metabot quest-page ref and an owner screen (two independent sources)', !!av && av.sources.some(s => /^https:\/\/metabot\.gg\/en\/aion-2\/quests\//.test(s.url || '') && s.checkedAt && s.build)
    && av.sources.some(s => s.owner && /^owner:/.test(s.owner.ref)), av && av.sources);
  ok('zone:ishalgen no longer lists the Aldelle Village Kibelisk', !(zs.find(z => z.id === 'zone:ishalgen').kibelisks || []).includes('Aldelle Village'));
  const sq = read('packs/aion2/asmodian/story-quests.json').records, sides = sq.flatMap(r => ['giver', 'turnin'].map(k => ({ id: r.id, k, l: r[k] })));
  ok('story: every giver / turn-in placed in Aldelle Village is in zone:aldelle-village (10 sides), and only those', sides.filter(x => x.l.zone === 'zone:aldelle-village').length === 10
    && sides.every(x => (x.l.place === 'Aldelle Village') === (x.l.zone === 'zone:aldelle-village')), sides.filter(x => x.l.place === 'Aldelle Village' || x.l.zone === 'zone:aldelle-village').map(x => `${x.id} ${x.k} ${x.l.zone}`));
  ok('story: a re-pointed village side cites the Metabot quest page for its zone, with no owner-check label left', sq.every(r => ['giver', 'turnin'].every(k => r[k].zone !== 'zone:aldelle-village'
    || (r.sources.some(s => (s.url || '').includes('metabot.gg') && (s.fields || []).includes(k + '.zone')) && !(r.fieldStatus || {})[k + '.zone']))));
  const genFailsIn = (label, rel, mutate, re) => { let g1 = null; try { g1 = generate({ mutate: (p, d) => p === rel && mutate(d) }); } catch (e) { ok('generator runs: ' + label, false, e.message); return; }
    ok('generator rejects: ' + label, g1.failed.some(x => re.test(x.check)), g1.failed.map(x => x.check)); };
  genFailsIn('Aldelle Village Kibelisk in two zones', 'data/packs/aion2/asmodian/zones.json', d => { d.records.find(z => z.id === 'zone:ishalgen').kibelisks = ['Aldelle Village']; }, /Kibelisk Aldelle Village resolves to one zone/);
  genFailsIn('a giver placed in Aldelle Village but zoned Ishalgen', 'data/packs/aion2/asmodian/story-quests.json', d => { d.records.find(r => r.id === 'sq:2101010').giver.zone = 'zone:ishalgen'; }, /sq:2101010: place Aldelle Village is in zone:aldelle-village/);
  genFailsIn('a giver placed in Black Claw Village but zoned elsewhere', 'data/packs/aion2/asmodian/story-quests.json', d => { d.records.find(r => r.id === 'sq:2102781').giver.zone = 'zone:impetusium-square'; }, /sq:2102781: place Black Claw Village is in zone:black-claw-village/);
  /* 0.5 P8: every Kibelisk name resolves to one registry record; ids, zones, binds and rules are checked */
  const KIB = 'data/packs/aion2/asmodian/kibelisks.json', SQ = 'data/packs/aion2/asmodian/story-quests.json';
  genFailsIn('an unknown Kibelisk name on a story giver', SQ, d => { d.records.find(r => r.id === 'sq:2102015').giver.kibelisk = 'Safe Haven Plaza'; }, /Kibelisk "Safe Haven Plaza" resolves to a registry record/);
  genFailsIn('an unknown Kibelisk name in an objective marker', SQ, d => { d.records.find(r => r.id === 'sq:2102015').steps[0].text = 'Receive additional supplies — go to VeKauf (Kibelisk: Safe Havn)'; }, /Kibelisk "Safe Havn" resolves/);
  genFailsIn('a duplicate Kibelisk id', KIB, d => { d.records.splice(1, 0, { ...d.records[0], name: 'Abandoned Barracks Site 2' }); }, /id unique repo-wide: kib:abandoned-barracks-site/);
  genFailsIn('a Kibelisk name twice in the registry', KIB, d => { d.records.push({ ...d.records[0], id: 'kib:zz-copy' }); }, /Kibelisk name unique in the registry: Abandoned Barracks Site/);
  genFailsIn('a registry zone against the points\' majority', KIB, d => { d.records.find(k => k.id === 'kib:safe-haven').zone = 'zone:crypt'; }, /kib:safe-haven: zone zone:crypt is the majority zone zone:dredgion-crash-site/);
  genFailsIn('zones[].kibelisks naming a Kibelisk filed elsewhere', 'data/packs/aion2/asmodian/zones.json', d => { d.records.find(z => z.id === 'zone:crypt').kibelisks.push('Safe Haven'); }, /zone:crypt: Kibelisk Safe Haven is a registry record filed in this zone/);
  genFailsIn('binds naming an id not in the registry', SQ, d => { stepWith(d, x => x.binds).binds.kibelisk = 'kib:safe-haven-plaza'; }, /binds kib:safe-haven-plaza is a registry id/);
  genFailsIn('a step-text bind whose text does not say bind', SQ, d => { const x = stepWith(d, x => x.binds && x.binds.basis === 'step-text'); x.text = 'Remember Aldelle Village'; }, /a step-text bind says "bind"/);
  genFailsIn('binds on a regional quest objective', 'data/packs/aion2/asmodian/regional-quests.json', d => { d.records.find(r => (r.steps || []).length).steps[0].binds = { kibelisk: 'kib:safe-haven', basis: 'step-text' }; }, /binds only on story objectives/);
  genFailsIn('a bind radius not inside the nudge radius', 'data/packs/aion2/rules.json', d => { d.records.find(x => x.id === 'rule:kibelisk-bind-radius').value = 100; d.records.find(x => x.id === 'rule:kibelisk-nudge-radius').value = 100; }, /rule:kibelisk-bind-radius < rule:kibelisk-nudge-radius/);
  /* the compiled tables (src/packs/aion2/data/place.js): one place per story / regional / dungeon / stronghold node */
  const np = g.nodePlace, kb = g.kibelisks, nodes = Object.entries(g.gateGraph.nodes);
  ok('NODE_PLACE: 87 story + 58 regional + 60 Sealed Dungeon + 15 stronghold nodes, keyed by GATE_GRAPH id', Object.keys(np).length === 220
    && nodes.filter(([, n]) => ['story', 'rq', 'sd', 'sh'].includes(n.kind)).every(([id]) => id in np), Object.keys(np).length);
  ok('NODE_PLACE: Survival Supplies turn-in is VeKauf\'s point, 32 m from Safe Haven', JSON.stringify(np['sq:2102015'].pts.turnin) === JSON.stringify({ map: 'altgard', x: 3183, y: 2881, anchor: 'kib:safe-haven', m: 32 })
    && np['sq:2102015'].route === 'core' && np['sq:2102015'].zone === 'zone:dredgion-crash-site', np['sq:2102015']);
  ok('NODE_PLACE: a point with no Kibelisk and no coords is left out; a placeholder zone is null', Object.values(np).every(p => Object.values(p.pts).every(x => x.anchor || x.map))
    && Object.values(np).every(p => p.zone !== 'zone:altgard-unplaced'));
  ok('KIBELISKS: 72 records; binds facts Survival Supplies #0 → Safe Haven (owner), A Village in the Fog #1 → Aldelle Village (step text)', Object.keys(kb).length === 72
    && JSON.stringify(kb['kib:safe-haven'].binds) === JSON.stringify([{ node: 'sq:2102015', i: 0, basis: 'owner' }])
    && JSON.stringify(kb['kib:aldelle-village'].binds) === JSON.stringify([{ node: 'sq:2101010', i: 1, basis: 'step-text' }])
    && Object.values(kb).filter(k => k.binds).length === 2, Object.keys(kb).length);
  ok('place module: NODE_PLACE and KIBELISKS only, not in the page\'s data module', /^export const NODE_PLACE = /m.test(g.placeModule) && /^export const KIBELISKS = /m.test(g.placeModule)
    && !/NODE_PLACE|KIBELISKS/.test(g.module));
  const kr = g.report.kibelisks;
  ok('bind report: R = 25 (working value) / 32 / 35 / 40 m over 53 story and 69 cited Kibelisks; the owner check list is the story ones not bound at 25 m and with no binds fact',
    !!kr && kr.split.map(s => s.r).join() === '25,32,35,40' && kr.split[0].working && kr.split.every(s => s.story.n === 53 && s.all.n === 69 && s.story.bound + s.story.nudge + s.story.none === 53)
    && kr.ownerCheck.length === kr.split[0].story.nudge + kr.split[0].story.none - 1 && !kr.ownerCheck.some(c => c.name === 'Safe Haven'), kr && kr.split);
  /* 0.4 P1 pack manifests: a broken copy of data/packs (tests/out/, not committed) must stop the generator (packs.mjs) */
  const packsCopy = (label, mutate) => { const root = join(ROOT, 'tests/out/packs-' + label); rmSync(root, { recursive: true, force: true });
    cpSync(join(ROOT, 'data/packs'), root, { recursive: true }); mutate(root); return root; };
  const editManifest = (root, id, f) => { const p = join(root, id, 'pack.json'), m = JSON.parse(readFileSync(p, 'utf8')); f(m); writeFileSync(p, JSON.stringify(m)); };
  const packFails = (label, mutate, re) => { let msg = null; try { generate({ root: packsCopy(label, mutate) }); } catch (e) { msg = e.message; }
    ok('generator rejects: ' + label, !!msg && re.test(msg), msg); };
  const guide = 'aion2/asmodian/assassin', manifest = id => JSON.parse(readFileSync(join(ROOT, 'data/packs', id, 'pack.json'), 'utf8'));
  ok('rejects: pack manifest without id (pack.schema.json)', validateDoc(join(ROOT, 'data/packs', guide, 'pack.json'), (m => (delete m.id, m))(manifest(guide))).length > 0);
  ok('rejects: a faction pack without a parent (pack.schema.json)', validateDoc(join(ROOT, 'data/packs/aion2/asmodian/pack.json'), (m => (delete m.parent, m))(manifest('aion2/asmodian'))).length > 0);
  ok('rejects: a game pack with a parent (pack.schema.json)', validateDoc(join(ROOT, 'data/packs/aion2/pack.json'), { ...manifest('aion2'), parent: 'aion2' }).length > 0);
  packFails('manifest without id', r => editManifest(r, guide, m => { delete m.id; }), /pack manifest fails pack\.schema\.json/);
  packFails('manifest id that is not its folder', r => editManifest(r, 'aion2/asmodian', m => { m.id = 'aion2/elyos'; }), /id "aion2\/elyos" is not its folder/);
  packFails('a listed file that does not exist', r => rmSync(join(r, 'aion2/items.json')), /pack aion2: listed file items\.json does not exist/);
  packFails('a JSON file in a pack folder that is not listed', r => writeFileSync(join(r, 'aion2/asmodian/extra.json'), '{}'), /pack aion2\/asmodian: .*not listed in pack\.json: extra\.json/);
  packFails('an unknown parent', r => editManifest(r, guide, m => { m.parent = 'aion2/elyos'; }), /aion2\/asmodian\/assassin parent: unknown pack "aion2\/elyos"/);
  packFails('an unknown pack in uses', r => editManifest(r, guide, m => { m.uses = ['aion2/classes/gladiator']; }), /uses: unknown pack "aion2\/classes\/gladiator"/);
  packFails('a cycle (the class uses the guide that uses it)', r => editManifest(r, 'aion2/classes/assassin', m => { m.uses = [guide]; }), /pack cycle: /);
  let gc = null; try { gc = generate({ root: packsCopy('copy', () => {}), pack: guide }); } catch (e) { ok('generator runs on a copied packs root', false, e.message); }
  if (gc) ok('--root / --pack: an unchanged copy of data/packs, pack ' + guide + ', compiles the same modules', gc.module === g.module && gc.gateModule === g.gateModule && gc.proposedModule === g.proposedModule);
  const c = g.constants;
  ok('compiled: story turn-in zones: Aldelle Village where the turn-in is in the village, else Ishalgen', c.QUEST_LOC['A Village in the Fog'].turninZone === 'Aldelle Village'
    && c.QUEST_LOC['Brigade Prison Compound Infiltration Operation'].turninZone === 'Aldelle Village' && c.QUEST_LOC['Isolated Lake'].turninZone === 'Ishalgen',
    ['A Village in the Fog', 'Brigade Prison Compound Infiltration Operation', 'Isolated Lake'].map(n => (c.QUEST_LOC[n] || {}).turninZone));
  ok('compiled: 87 story quests (Ishalgen is the starting map, not a quest; E10 added Daeva Trapped in a Nightmare), 58 regional quests, 15 strongholds, 60 Sealed Dungeons', c.QUESTS.length === 87 && c.RQ.length === 58 && c.SH_DATA.length === 15 && Object.keys(c.HIDEOUT_AREA).length === 60,
    [c.QUESTS.length, c.RQ.length, c.SH_DATA.length, Object.keys(c.HIDEOUT_AREA).length]);
}
console.log(`${n - fail} ok, ${fail} failed (${Date.now() - t0} ms)`);
console.log(fail ? `SCHEMA CHECKS FAILED (${fail})` : 'SCHEMA CHECKS PASSED');
process.exit(fail ? 1 : 0);
