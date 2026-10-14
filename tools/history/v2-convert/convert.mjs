#!/usr/bin/env node
/* One-time conversion of the v1 data (data/*.json, tools/gen/snapshots/, the hand-written tables in src/data/*.js)
   into data format v2 (docs/DATA-FORMAT-V2.md, 0.2 step 5b). Kept for provenance, like tools/history/'s E2/E4 scripts:
   it is not part of the build and is never run again.

   Usage: node tools/history/v2-convert/convert.mjs <v1 checkout> <metabot dir>
     <v1 checkout>  a checkout of commit 5a309f3 (the last v1 commit on main)
     <metabot dir>  planner.json (Metabot Daevanion planner, https://metabot.gg/en/aion-2/daevanion/assassin, read
                    2026-10-14, build 0.0.4387.0: every node of the five Assassin boards) and specs.json (specialty
                    choices of Savage Roar, Ambush and Shadowstrike from their Metabot skill pages, read 2026-10-14).
                    Both are facts read from Metabot pages (terms: automated reading allowed with a dofollow credit);
                    the pages themselves are not kept.
   Writes data/sources.json, data/game-builds.json, data/retired.json, data/shared/**, data/classes/** (overwrites).

   Rules it follows: the conversion does not research. Values are carried over as they are; where v2 needs a field the
   v1 data never held (a zone, a game id, a source for hand-written text), the value comes from a repo document that
   already states it (cited in the record) or is labelled (fieldStatus inferred / owner-check, requiresBasis legacy). */
import { build } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const [OLD, MB] = process.argv.slice(2);
if (!OLD || !MB) { console.error('usage: convert.mjs <v1 checkout> <metabot dir>'); process.exit(2); }
const load = p => JSON.parse(readFileSync(join(OLD, p), 'utf8'));
const out = (p, obj) => { const f = join(ROOT, 'data', p); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, JSON.stringify(obj, null, 2) + '\n'); };
const LOG = [];   /* conversion notes: every value that moved between sources of truth, every label added */
const note = (...a) => LOG.push(a.join(' '));

/* ------------------------------------------------------------------ v1 inputs */
const rq = load('data/rq.json'), chains = load('data/rq-chains.json'), story = load('data/story.json'), story45 = load('data/story-40-45.json');
const shJ = load('data/strongholds.json'), dun = load('data/dungeons.json'), bands = load('data/dungeon-bands.json'), buildJ = load('data/build.json');
const claimsJ = load('data/claims.json'), areaOld = load('tools/gen/snapshots/area-loc-v287.json'), srcOld = load('tools/gen/snapshots/sources-v287.json');
const hz = load('tools/gen/snapshots/hideout-area-v288.json');
const LOC1 = load('data/locations.json'), CAQ = load('data/current-areas-quests.json');   /* not read by gen.py; compared below (§12.8) */
const planner = JSON.parse(readFileSync(join(MB, 'planner.json'), 'utf8')), specsMB = JSON.parse(readFileSync(join(MB, 'specs.json'), 'utf8'));

/* The hand-written tables, evaluated with the text helpers replaced by token writers, so `${I("enhance")}` comes out as
   [[item:enhance]] exactly where the source has it (DATA-FORMAT-V2 §7). generated.js is the v1 block. */
const STUB_MARKUP = `
export const seq = (arr) => '<span class="seq">' + arr.map(s => '<span>' + s + '</span>').join('<i>→</i>') + '</span>';
export const EYE = '';
export const I = (key, label) => label ? '[[item:' + key + '|' + label + ']]' : '[[item:' + key + ']]';
export const T = (label, key, name) => { if (name) throw new Error('T with a spoken name in data: ' + label); return '[[tip:' + key + '|' + label + ']]'; };
export const stn = n => '[[stigma:' + n + ']]';
export const eRow = n => '[[erow:' + n + ']]';
export const DAEVA = '[[daeva]]';
export const ASC = '[[asc]]';
export const sub = (label, note) => ({ sub: label, subNote: note });
export const dvNodes = b => [{ __dvNodes: b }];
export const metaSlug = n => n.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const mapSlug = n => n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const hideouts = (names, keyPrefix = "sd") => [{ __hideouts: names, keyPrefix }];
export const mapQ = (id, who) => '[[mapq:' + id + '|' + who + ']]';
`;
const evalModules = async (stubMarkup) => {
  const { genModule } = await import(join(OLD, 'scripts/generated-data.mjs'));
  const plug = { name: 'stubs', setup(b) {
    b.onResolve({ filter: /^\.\/(markup|generated)\.js$/ }, a => ({ path: a.path, namespace: 'stub' }));
    b.onLoad({ filter: /.*/, namespace: 'stub' }, a => ({ contents: a.path === './markup.js' && stubMarkup ? STUB_MARKUP : a.path === './markup.js' ? readFileSync(join(OLD, 'src/data/markup.js'), 'utf8')
      : stubMarkup ? genModule().replace(/^const RQ_STATS = .*$/m, 'const RQ_STATS = { n: "{rqStats.n}", at10: "{rqStats.at10}", story: "{rqStats.story}", chained: "{rqStats.chained}" };') : genModule(), loader: 'js', resolveDir: join(OLD, 'src/data') }));
  } };
  const mods = ['milestones', 'story', 'build', 'tips', 'items', 'areas', 'migrations'];
  const entry = mods.map(m => `export * as ${m} from "./${m}.js";`).join('\n') + '\nexport * as gen from "./generated.js";';
  const r = await build({ stdin: { contents: entry, resolveDir: join(OLD, 'src/data'), sourcefile: 'probe.js' }, bundle: true, write: false, format: 'esm', platform: 'neutral', plugins: [plug], logLevel: 'silent' });
  return import('data:text/javascript;base64,' + Buffer.from(r.outputFiles[0].text).toString('base64'));
};
const TOK = await evalModules(true);    /* tokens */
const V1 = await evalModules(false);    /* the v1 values, for checks */
const G = V1.gen;

/* ------------------------------------------------------------------ helpers */
const mapSlug = n => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');   /* src/data/markup.js mapSlug: the save-key slug */
const slug = s => s.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const zid = name => 'zone:' + slug(name);
const byId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const env = (collection, records, extra = {}) => {
  const depth = (extra.$depth ?? 0); delete extra.$depth;
  const file = { $schema: '../'.repeat(depth) + `schema/${SCHEMA_OF[collection]}.schema.json`, schemaVersion: 2, collection, ...extra, records: records.slice().sort(byId) };
  return file;
};
const SCHEMA_OF = { sources: 'sources', gameBuilds: 'game-builds', storyQuests: 'story-quests', ascensionQuests: 'ascension-quests', regionalQuests: 'regional-quests',
  sealedDungeons: 'sealed-dungeons', strongholds: 'strongholds', zones: 'zones', unlocks: 'unlocks', items: 'items', rules: 'rules', boards: 'boards',
  milestones: 'milestones', steps: 'steps', tips: 'tips', claims: 'claims', confidence: 'confidence', classes: 'classes', builds: 'builds', skills: 'skills',
  boardNodes: 'board-nodes', stigmas: 'stigmas' };
/* "https://x (note)" -> {url, note|section}; plain strings with no URL -> null */
const URL_RE = /https?:\/\/[^\s)\]'"]+/;
const ref = (s, extra = {}) => {
  if (typeof s !== 'string') return s;
  const m = s.match(URL_RE); if (!m) return null;
  const url = m[0].replace(/[.,;]+$/, '');
  const rest = s.replace(m[0], '').trim().replace(/^\(|\)$/g, '').trim();
  const r = { url, ...extra };
  if (rest) {
    if (/^(Required Quests|Dependent quests|Previous quest|Next quest|Unlocks|Prerequisites)$/i.test(rest)) r.section = rest; else r.note = rest;
  }
  return r;
};
const D12 = '2026-10-12', D14 = '2026-10-14';
/* Hand-written guide content has no fetch date; it gets the date of the research pass that re-checked it (git history:
   the V1 claims pass and E2-E4, 12 Oct 2026). */
const DATE_HAND = D12;

/* ------------------------------------------------------------------ zones */
/* Every zone the v1 data names (the same set gen.py checked against), the trace counts (ZONE_TRACES) and the camps
   gen.py's CAMP_ZONE resolved. Kibelisk -> zone: the map-data votes gen.py ran (HIDEOUT_AREA + AREA_LOC Kibelisks,
   dungeons.json, strongholds.json, story steps "<verb> <zone> … (Kibelisk: X)"), majority wins, so a location with a
   Kibelisk and no zone of its own resolves the way the v1 data already implied. */
const ZONES_V1 = new Set([...Object.values(hz), ...shJ.map(s => s.zone), ...dun.filter(x => x.zone).map(x => x.zone)]);
const CAMP_ZONE = { 'Quai Campsite': 'Calderon Canyon', 'Temporary Investigation Base': 'Dredgion Crash Site', 'Safe Haven': 'Dredgion Crash Site',
  "Watcher's Tent": 'Calderon Canyon', 'Forest Hideout': 'Moslan Forest', 'Briskwind Shelter': 'Dranactus', "Zemurru's Tomb": 'Western Gribade Highland' };
const kv = {};
const vote = (k, z) => { if (k && z) { kv[k] = kv[k] || {}; kv[k][z] = (kv[k][z] || 0) + 1; } };
for (const [n, z] of Object.entries(hz)) vote((areaOld[n] || {}).kib, z);
for (const x of dun) if ((areaOld[x.name] || {}).kib !== x.kib || !(x.name in hz)) vote(x.kib, x.zone);
for (const s of shJ) vote(s.kib, s.zone);
for (const s of [...Object.values(story), ...Object.values(story45)]) for (const t of s.steps || []) {
  const mk = t.match(/\(Kibelisk: ([^)]+)\)/), head = t.split('(Kibelisk:')[0];
  const zs = [...ZONES_V1].filter(z => new RegExp('^\\w+ ' + z.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(head));
  if (mk && zs.length === 1) vote(mk[1], zs[0]);
}
/* regional quest givers: gen.py's resolved zone per giver Kibelisk / place */
for (const q of G.RQ) { vote(q.kib, q.zone); }
const KIB_ZONE = {};
for (const [k, v] of Object.entries(kv)) KIB_ZONE[k] = Object.entries(v).sort((a, b) => b[1] - a[1])[0][0];
Object.assign(KIB_ZONE, CAMP_ZONE);
for (const z of ZONES_V1) KIB_ZONE[z] = z;   /* a place named after its zone */
const zoneOfPlace = p => {
  if (!p) return null;
  if (KIB_ZONE[p]) return KIB_ZONE[p];
  const z = [...ZONES_V1].filter(z => p.startsWith(z + ' ')).sort((a, b) => b.length - a.length)[0];
  return z || null;
};
/* Placeholder zones for locations the v1 data never placed (DATA-FORMAT-V2 §9 data task, still open). They keep the
   schema's "every location has a zone" honest: the generator lists every record that uses one as debt. */
const Z_ISHALGEN = 'zone:ishalgen', Z_UNPLACED = 'zone:altgard-unplaced';
const usedZones = new Set();
const placeZone = (place, kib, fallback) => {
  const z = zoneOfPlace(kib) || zoneOfPlace(place);
  if (z) { usedZones.add(z); return [zid(z), true]; }
  return [fallback, false];
};

/* ------------------------------------------------------------------ sources registry (§5.1) */
/* One record per site gen.py's SITE list named (same names: the Sources card's per-site rows use them), plus Game8 (never
   used) and the owner. access / licence from docs/research/2026-10-data-sources.md §4, §10 and 2026-10-source-vetting.md;
   a site nobody has checked is "unchecked" / "unread" (the build warns) and read by a person only until it is. */
const UNCHECKED = { robots: 'unchecked', terms: 'unread', mode: 'human-only', checkedAt: D14 };
const USE = (quotes = 'none') => ({ facts: true, wording: false, quotes, link: 'dofollow' });
const SITES = [
  { id: 'src:metabot', name: 'Metabot', hosts: ['metabot.gg'], kind: 'game-database', independenceGroup: 'metabot', upstream: 'global-client',
    licence: { id: 'custom', conditions: ['attribution-link-to-page', 'dofollow', 'non-commercial', 'no-endorsement'], url: 'https://metabot.gg/en/legal/terms-of-service', checkedAt: D14,
      note: "Terms effective 04/01/2026, 'Data Usage & Attribution (AI Agents & Automated Tools)': reuse with a dofollow link to the page the data came from, no misrepresentation, no implied endorsement, a reasonable request rate (re-read 2026-10-14). Non-commercial: permission needed before any ads, donations or paid features (DECISIONS 2026-10-14)." },
    access: { robots: 'allows', terms: 'allows', termsUrl: 'https://metabot.gg/en/legal/terms-of-service', mode: 'scripted', checkedAt: D14 }, use: USE('short-credited'),
    notes: ['robots.txt allows everything except /api/ and player profiles (read 2026-10-14).'] },
  { id: 'src:aion2-gaming-tools', name: 'aion2.gaming.tools', hosts: ['aion2.gaming.tools'], kind: 'game-database', independenceGroup: 'aion2-gaming-tools', upstream: 'global-client',
    licence: { id: 'unknown' }, access: { robots: 'allows', terms: 'unread', mode: 'human-only', checkedAt: D14 }, use: USE(),
    reach: 'Cloudflare challenge on scripted reads (data-sources §10.1); read by a person in a browser' },
  { id: 'src:aion2-th-gl', name: 'aion2.th.gl', hosts: ['aion2.th.gl'], kind: 'game-database', independenceGroup: 'aion2-th-gl', operator: 'th.gl',
    licence: { id: 'unknown' }, access: { robots: 'ai-excluded', terms: 'unread', mode: 'none', checkedAt: D14 }, use: { facts: false, wording: false, quotes: 'none', link: 'none' },
    withdrawn: { date: D14, reason: 'robots.txt excludes AI agents (owner rule, DECISIONS 2026-10-14). Its citations are re-sourced (Metabot first) or labelled owner-check.' } },
  { id: 'src:allthings-how', name: 'allthings.how', hosts: ['allthings.how'], kind: 'guide', independenceGroup: 'allthings-how', licence: { id: 'unknown' }, access: UNCHECKED, use: USE('short-credited') },
  { id: 'src:thegameswiki', name: 'thegameswiki', hosts: ['thegameswiki.com'], kind: 'wiki', independenceGroup: 'thegameswiki',
    licence: { id: 'CC-BY-NC-SA-4.0', conditions: ['attribution-link-to-page', 'non-commercial', 'share-alike'], note: 'Facts only into the app, never its wording; quotes in claims stay short and credited (CLAUDE.md).' },
    access: { robots: 'unchecked', terms: 'unread', mode: 'human-only', checkedAt: D14 }, use: USE('short-credited'), reach: 'robots.txt answered 429 (Vercel checkpoint) on 2026-10-14 (data-sources §10.1)' },
  { id: 'src:wikily', name: 'Wikily', hosts: ['wikily.gg'], kind: 'wiki', independenceGroup: 'wikily', groupReason: 'NX Software SAS, a different operator from Metabot (data-sources §10.2)', operator: 'NX Software SAS', upstream: 'global-client',
    licence: { id: 'unknown' }, access: { robots: 'allows', terms: 'bans-automation', mode: 'human-only', checkedAt: D14 }, use: USE(),
    notes: ['Terms (16 Aug 2024) bar scraping "by spidering, scraping or any other technological means": read by a person in a browser only (owner decision, Q3).'] },
  { id: 'src:gamesfuze', name: 'GamesFuze', hosts: ['gamesfuze.com'], kind: 'guide', independenceGroup: 'gamesfuze', licence: { id: 'unknown' }, access: UNCHECKED, use: USE() },
  { id: 'src:skycoach', name: 'Skycoach', hosts: ['skycoach.gg'], kind: 'guide', independenceGroup: 'skycoach', licence: { id: 'unknown' }, access: UNCHECKED, use: USE() },
  { id: 'src:games-gg', name: 'games.gg', hosts: ['games.gg'], kind: 'guide', independenceGroup: 'games-gg', licence: { id: 'unknown' }, access: UNCHECKED, use: USE() },
  { id: 'src:keengamer', name: 'KeenGamer', hosts: ['keengamer.com'], kind: 'guide', independenceGroup: 'keengamer', licence: { id: 'unknown' }, access: UNCHECKED, use: USE() },
  { id: 'src:mein-mmo', name: 'MeinMMO', hosts: ['mein-mmo.de'], kind: 'news', independenceGroup: 'mein-mmo', licence: { id: 'unknown' }, access: UNCHECKED, use: USE() },
  { id: 'src:playnews', name: 'PlayNews', hosts: ['playnews.gg'], kind: 'news', independenceGroup: 'playnews', licence: { id: 'unknown' }, access: UNCHECKED, use: USE() },
  { id: 'src:gameplay-tips', name: 'gameplay.tips', hosts: ['gameplay.tips'], kind: 'guide', independenceGroup: 'gameplay-tips', licence: { id: 'unknown' }, access: UNCHECKED, use: USE() },
  { id: 'src:gamewith', name: 'GameWith', hosts: ['gamewith.ai'], kind: 'game-database', independenceGroup: 'gamewith', licence: { id: 'unknown' },
    access: { robots: 'unchecked', terms: 'unread', mode: 'human-only', checkedAt: D14 }, use: USE(), notes: ['No robots.txt (404) and no terms found (data-sources §10.3).'] },
  { id: 'src:expcarry', name: 'ExpCarry', hosts: ['expcarry.com'], kind: 'guide', independenceGroup: 'expcarry', licence: { id: 'unknown' }, access: UNCHECKED, use: USE() },
  { id: 'src:aion2hub', name: 'AION2HUB', hosts: ['aion2hub.com'], kind: 'guide', independenceGroup: 'aion2hub', upstream: 'global-client',
    licence: { id: 'unknown', note: 'No terms page exists (source-vetting §3.2): facts only, credit link, no tables, no images.' },
    access: { robots: 'allows', terms: 'allows', mode: 'scripted', checkedAt: D14 }, use: USE(),
    notes: ['Approved for spot checks as weak corroboration ("single source, pre-launch client" unless confirmed; DECISIONS 2026-10-14). robots.txt disallows /api/ only.'] },
  { id: 'src:fandomwire', name: 'FandomWire', hosts: ['fandomwire.com'], kind: 'news', independenceGroup: 'fandomwire', licence: { id: 'unknown' }, access: UNCHECKED, use: USE() },
  { id: 'src:neonsect', name: 'neonsect', hosts: ['neonsect.com'], kind: 'guide', independenceGroup: 'neonsect', licence: { id: 'unknown' }, access: UNCHECKED, use: USE() },
  { id: 'src:massivelyop', name: 'MassivelyOP', hosts: ['massivelyop.com'], kind: 'news', independenceGroup: 'massivelyop', licence: { id: 'unknown' }, access: UNCHECKED, use: USE() },
  { id: 'src:selphie1999', name: 'Selphie1999', hosts: ['selphie1999gaming.com'], kind: 'guide', independenceGroup: 'selphie1999', licence: { id: 'unknown' }, access: UNCHECKED, use: USE() },
  { id: 'src:exitlag', name: 'ExitLag', hosts: ['exitlag.com'], kind: 'guide', independenceGroup: 'exitlag', licence: { id: 'unknown' }, access: UNCHECKED, use: USE() },
  { id: 'src:metaroad', name: 'Metaroad', hosts: ['metaroad.gg'], kind: 'guide', independenceGroup: 'metaroad', licence: { id: 'unknown' }, access: UNCHECKED, use: USE(),
    reach: 'board page refused (build.json boards.pathCostsNote)' },
  /* cited by v1 data or the Sources card snapshot but not in gen.py's SITE list: named by their host, as the card showed them */
  ...[['shugo.gg', 'community'], ['gamerblurb.com', 'guide'], ['insider-gaming.com', 'news'], ['odealo.com', 'guide'], ['positioniseverything.net', 'guide'],
    ['powerupgaming.co.uk', 'news'], ['videogameschronicle.com', 'news'], ['vortexgaming.io', 'guide']].map(([h, kind]) => (
    { id: 'src:' + h.replace(/\./g, '-'), name: h, hosts: [h], kind, independenceGroup: h.replace(/\./g, '-'), licence: { id: 'unknown' }, access: UNCHECKED, use: USE() })),
  { id: 'src:game8', name: 'Game8', hosts: ['game8.co'], kind: 'guide', independenceGroup: 'game8', licence: { id: 'unknown' },
    access: { robots: 'unchecked', terms: 'unread', mode: 'none', checkedAt: D14 }, use: { facts: false, wording: false, quotes: 'none', link: 'none', banned: true },
    notes: ['Never used (CLAUDE.md). Listed so the build rejects its URLs.'] },
  { id: 'src:owner', name: 'In game (owner)', hosts: ['owner.invalid'], kind: 'owner', independenceGroup: 'owner',
    licence: { id: 'all-rights-reserved', note: 'Screens live in the private repo. Records cite them by short code (owner:YYYY-MM-DD-NN) plus game version; the code-to-file map stays private. Outranks every other source (§5.4).' },
    access: { robots: 'allows', terms: 'allows', mode: 'human-only', checkedAt: D14 }, use: { facts: true, wording: false, quotes: 'none', link: 'none' } },
].map(s => ({ ...s, verifiedAt: D14 }));

/* ------------------------------------------------------------------ story quest ids (needed by regional gates too) */
/* Game ids and the chain from docs/research/2026-10-prereq-gates.md §4 (Metabot "Previous / Next quest"; all 87 quests the
   app lists, in QUESTS order). */
const SQ_IDS = [2100010, 2101010, 2101020, 2101030, 2101040, 2101050, 2101060, 2101070, 2101080, 2101090, 2101100, 2102010, 2102015, 2102020,
  2102030, 2102040, 2102050, 2102060, 2102065, 2102070, 2102080, 2102090, 2102100, 2102105, 2102110, 2102115, 2102120, 2102130, 2102140, 2102150,
  2102160, 2102170, 2102175, 2102180, 2102185, 2102190, 2102200, 2102201, 2102202, 2102210, 2102220, 2102225, 2102230, 2102235, 2102240, 2102250,
  2102255, 2102260, 2102270, 2102280, 2102300, 2102310, 2102320, 2102330, 2102340, 2102345, 2102350, 2102360, 2102370, 2102380, 2102390, 2102400,
  2102450, 2102460, 2102470, 2102480, 2102550, 2102565, 2102575, 2102585, 2102590, 2102600, 2102610, 2102612, 2102615, 2102620, 2102650, 2102660,
  2102670, 2102680, 2102690, 2102750, 2102760, 2102770, 2102780, 2102781, 2102800].map(String);
const QUESTS = V1.story.QUESTS;
if (QUESTS.length !== SQ_IDS.length) throw new Error(`QUESTS ${QUESTS.length} vs ids ${SQ_IDS.length}`);
const SQ_OF = Object.fromEntries(QUESTS.map(([, n], i) => [n, 'sq:' + SQ_IDS[i]]));

/* ------------------------------------------------------------------ regional quests (rq.json + rq-chains.json) */
const RQ_BY_NAME = Object.fromEntries(rq.map(q => [q.name, q]));
const V1RQ = Object.fromEntries(G.RQ.map(x => [x.name, x]));
const chainSrc = c => c.sources.map(s => ref(s)).filter(Boolean);
const regionalQuests = rq.map((q, qi) => {
  const v1 = V1RQ[q.name];
  const regEdges = chains.filter(c => c.kind === 'regional' && c.quest === q.name);
  const stEdge = chains.find(c => c.kind === 'story' && c.quest === q.name);
  const atoms = [{ level: q.unlocksAt, basis: 'sourced', sources: [{ url: q.src, fields: ['unlocksAt'] }] }];
  if (stEdge) {
    const sq = 'sq:' + stEdge.storyId;
    if (SQ_OF[stEdge.after] !== sq) throw new Error(`story gate id mismatch ${q.name}: ${stEdge.after} ${sq}`);
    atoms.push({ story: sq, is: 'reached', basis: 'sourced', sources: chainSrc(stEdge),
      note: [stEdge.note, 'v1 gate meaning kept: the story has reached it (D9; owner check 1 may change it to turnedIn).'].filter(Boolean).join(' ') });
  }
  for (const c of regEdges) atoms.push({ done: 'rq:' + RQ_BY_NAME[c.after].id, basis: 'sourced', sources: chainSrc(c), ...(c.note ? { note: c.note } : {}) });
  if (JSON.stringify(regEdges.map(c => c.after)) !== JSON.stringify(v1.after)) throw new Error('after order ' + q.name);
  const none = q.requiresStory === null && q.requiresRegional === null && !regEdges.length && !stEdge;
  const checkedNone = !none && !regEdges.length && !stEdge;
  if (!!v1.noPre !== none) throw new Error('noPre ' + q.name);
  if (q.prev && JSON.stringify([].concat(q.prev).slice().sort()) !== JSON.stringify(regEdges.map(c => c.after).sort()))
    note('rq prev differs from chains (kept chains):', q.name, JSON.stringify(q.prev));
  const zone = v1.zone;
  const gz = zid(zone); usedZones.add(zone);
  const [tz, tzOk] = placeZone(q.turnin.place, q.turnin.kib, gz);
  const conflicts = [...(q.conflicts || [])];
  if (zone !== q.zone) conflicts.push(`zone: allthings.how files it under "${q.zone}"; the giver's camp / place puts it in ${zone} (E3 CAMP_ZONE / E4 giver-zone rule).`);
  const sources = [{ url: q.src, fields: ['gameId', 'rec', 'unlocksAt', 'giver', 'turnin', 'steps', 'rewards'], checkedAt: q.fetched }];
  if (q.zoneSrc) sources.push({ url: q.zoneSrc, fields: ['zone'] });
  for (const s of q.requiresSrc || []) { const r = ref(s); if (r && !sources.some(x => x.url === r.url)) sources.push({ ...r, fields: ['requires'] }); }
  if (!tzOk) sources.push({ inferred: 'Turn-in zone: no zone for this turn-in place in the v1 data; taken as the giver\'s zone.', fields: ['turnin.zone'] });
  else if (zid(zoneOfPlace(q.turnin.kib) || zoneOfPlace(q.turnin.place)) !== gz || q.turnin.place !== q.giver.place)
    sources.push({ inferred: 'Turn-in zone from its Kibelisk / place through the v1 map-data zone votes (gen.py).', fields: ['turnin.zone'] });
  const poi = (q.app && q.app.poi) || [];
  const known = [q.giver.npc, q.giver.place, q.giver.kib, q.turnin.npc, q.turnin.place, q.turnin.kib, q.zone, zone];
  const lost = poi.filter(p => !known.includes(p)); if (lost.length) note('rq app.poi not derivable:', q.name, JSON.stringify(lost));
  const r = {
    id: 'rq:' + q.id, key: 'rq:' + q.id, name: q.name, faction: 'asmodian', gameId: q.id, metabotSlug: q.slug, rec: q.rec, unlocksAt: q.unlocksAt,
    zone: gz, route: 'core', order: (qi + 1) * 10,
    giver: { npc: q.giver.npc ?? null, place: q.giver.place ?? null, zone: gz, kibelisk: q.giver.kib ?? null, meters: q.giver.m ?? null },
    turnin: { npc: q.turnin.npc ?? null, place: q.turnin.place ?? null, zone: tz, kibelisk: q.turnin.kib ?? null, meters: q.turnin.m ?? null },
    steps: q.steps.map((s, i) => ({ i, text: s.text, kibelisk: s.kib ?? null, meters: s.m ?? null })),
    rewards: q.rewards,
    requires: atoms.length > 1 ? { all: atoms } : atoms[0],
    ...(none ? { requiresBasis: 'unresearched' } : checkedNone ? { requiresBasis: 'verified-none' } : {}),
    completesWith: ['tick'],
    sources, verifiedAt: q.fetched, status: 'verified',
    ...(!tzOk || zid(zoneOfPlace(q.turnin.kib) || zoneOfPlace(q.turnin.place) || '') !== tz ? {} : {}),
  };
  const fs = {}; if (!tzOk || r.sources.some(s => s.inferred && s.fields.includes('turnin.zone'))) fs['turnin.zone'] = 'inferred';
  if (Object.keys(fs).length) r.fieldStatus = fs;
  if (q.notes && q.notes.length) r.notes = q.notes;
  if (conflicts.length) r.conflicts = conflicts;
  return r;
});
/* Spacetime Rift: the "none" chain (5 of 7 gaming.tools pages checked, no Required Quests) */
{
  const c = chains.find(x => x.kind === 'none');
  for (const r of regionalQuests) {
    if (!/^Spacetime Rift/.test(r.name)) continue;
    const mine = c.sources.map(s => ref(s)).filter(x => x.url.endsWith('/' + r.gameId));
    r.sources.push(...mine.map(x => ({ ...x, section: 'Required Quests', fields: ['requires'], note: 'no Required Quests listed' })));
    r.notes = [...(r.notes || []), 'Spacetime Rift series: ' + c.note];
  }
}

/* ------------------------------------------------------------------ story quests */
const QS_HAND = V1.story.QUEST_STEPS, QL = V1.story.QUEST_LOC;
const S_ALL = { ...story, ...story45 };
const hubPage = lv => 'https://aion2hub.com/leveling/asmodian-levels-' + (lv < 10 ? '1-10' : lv < 25 ? '10-25' : '25-40');
for (const r of ['1-10', '10-25', '25-40']) if (!srcOld.some(x => x.url.endsWith(r))) throw new Error('aion2hub page ' + r);
const MB_QUEST = { 2100010: 'ishalgen', 2101010: 'a-village-in-the-fog', 2101020: 'prepare-to-escape', 2101030: 'shadow-forest', 2101040: 'isolated-lake',
  2101050: 'the-being-beneath-the-lake', 2101060: 'spread-your-wings', 2101070: 'signs-of-a-crash-landing', 2101080: 'prison-compound-infiltration-plan',
  2101090: 'brigade-prison-compound-infiltration-operation', 2101100: 'the-longest-night', 2102010: 'finding-nemon', 2102015: 'survival-supplies',
  2102020: 'gathering-essentials', 2102030: 'crash-site-rendezvous', 2102040: 'contaminated-area', 2102050: 'express-daeva-delivery', 2102060: 'veiled-truth',
  2102065: 'urgent-pursuit', 2102070: 'cemetery-cleanup', 2102080: 'back-on-the-scent', 2102090: 'dead-men-tell-no-tales', 2102100: 'buried-atrocities',
  2102105: 'empyrean-monolith-asmodian', 2102110: 'a-new-lead', 2102115: 'malice-laid-bare', 2102120: 'broken-fang', 2102130: 'watchful-eyes',
  2102140: 'imminent-threat', 2102150: 'crossroad', 2102160: 'creeping-shadow', 2102170: 'children-of-the-elim', 2102175: 'in-the-elims-name',
  2102180: 'verdant-melody', 2102185: 'daeva-in-a-dream-asmodian', 2102190: 'disturbed-balance' };
const WRAPS = { 2101060: 'asc:perceives', 2102185: 'asc:hears-the-voice', 2102345: 'asc:dreams' };
const UNL_T = V1.story.STORY_UNLOCKS, UNL_G = V1.story.UNLOCK_GATE;
const storyQuests = QUESTS.map(([lv, name], i) => {
  const id = SQ_IDS[i], s = S_ALL[name], loc = QL[name] || {}, ish = i <= 10;
  const fb = ish ? Z_ISHALGEN : Z_UNPLACED;
  /* locations: the shipped QUEST_LOC wins (it is what the app shows); story.json values it lacks are kept only where
     QUEST_LOC can't show them (giver npc/place), so the compiled QUEST_LOC stays as shipped */
  const pick = (k, sk) => {
    const shipped = loc[k], data = s ? s[sk || k] : undefined;
    if (shipped !== undefined && data !== undefined && data !== null && shipped !== data) note('story loc: QUEST_LOC wins', name, k, JSON.stringify(shipped), 'vs story json', JSON.stringify(data));
    if (shipped === undefined && data !== undefined && data !== null && QL[name]) note('story loc: story json value not shipped, kept as conflict', name, k, JSON.stringify(data));
    return shipped !== undefined ? shipped : null;
  };
  const giverKib = pick('giverKib'), giverM = pick('giverKibM'), tNpc = pick('turnin'), tPlace = pick('turninPlace'), tKib = pick('turninKib'), tM = pick('turninKibM');
  const gNpc = s ? s.giver ?? null : null, gPlace = s ? s.giverPlace ?? null : null;
  const [gz, gzOk] = placeZone(gPlace, giverKib, fb), [tz, tzOk] = placeZone(tPlace, tKib, fb);
  const steps = (QS_HAND[name] || []).map((text, j) => ({ i: j, text }));
  if (s && s.steps && QS_HAND[name] && JSON.stringify(s.steps) !== JSON.stringify(QS_HAND[name]))
    note('story steps: shipped QUEST_STEPS wins over story json for', name, s.steps.map((x, j) => x !== QS_HAND[name][j] ? `#${j}: json ${JSON.stringify(x)} / shipped ${JSON.stringify(QS_HAND[name][j])}` : null).filter(Boolean).join('; ') || `(json ${s.steps.length} lines, shipped ${QS_HAND[name].length})`);
  const conflicts = [];
  if (s) for (const [k, sk] of [['giverKib'], ['giverKibM'], ['turnin'], ['turninPlace'], ['turninKib'], ['turninKibM']]) {
    if (loc[k] === undefined && s[k] != null) conflicts.push(`story.json ${k} "${s[k]}" is not in the shipped route data (QUEST_LOC); left out so the app shows what it showed.`);
  }
  const page = s ? s.src : MB_QUEST[id] ? `https://metabot.gg/en/aion-2/quests/${MB_QUEST[id]}` : null;
  const sources = [];
  if (s) sources.push({ url: s.src, fields: ['steps', 'giver', 'turnin', ...(s.rewards ? ['rewards'] : [])], ...(s.fetched ? { checkedAt: s.fetched } : {}) });
  else sources.push({ url: page, fields: ['gameId', 'next'], note: 'game id and chain order: docs/research/2026-10-prereq-gates.md §4' });
  /* QUESTS 1-40 (names, levels, order): AION2HUB's Asmodian leveling pages (src/data/story.js) */
  if (lv <= 40) sources.push({ url: hubPage(lv), fields: ['name', 'lv'] });
  if (!gzOk || !tzOk) sources.push({ inferred: ish ? 'Zone: the quest is on the Ishalgen starting map (the v1 data has no location for it).' : 'Zone not recorded in the v1 data (DATA-FORMAT-V2 §9 data task): placeholder zone.', fields: [...(!gzOk ? ['giver.zone'] : []), ...(!tzOk ? ['turnin.zone'] : [])] });
  if (gzOk || tzOk) sources.push({ inferred: 'Zone from the Kibelisk / place name through the v1 map-data zone votes (gen.py).', fields: [...(gzOk ? ['giver.zone'] : []), ...(tzOk ? ['turnin.zone'] : [])] });
  const fs = { 'giver.zone': gzOk ? 'inferred' : 'owner-check', 'turnin.zone': tzOk ? 'inferred' : 'owner-check' };
  const prev = i ? 'sq:' + SQ_IDS[i - 1] : null;
  const rec = {
    id: 'sq:' + id, key: name, name, faction: 'asmodian', gameId: id, lv,
    unlocksAt: s && s.unlocksAt ? s.unlocksAt : i <= 10 ? 1 : id === '2102800' ? 45 : 10,
    ...(s && s.type ? { questType: s.type } : {}), ...(s && s.chapter ? { chapter: s.chapter } : {}),
    next: i < QUESTS.length - 1 ? 'sq:' + SQ_IDS[i + 1] : null,
    giver: { npc: gNpc, place: gPlace, zone: gz, kibelisk: giverKib, meters: giverM },
    turnin: { npc: tNpc, place: tPlace, zone: tz, kibelisk: tKib, meters: tM },
    steps,
    ...(s && s.rewards ? { rewards: s.rewards } : {}),
    ...(UNL_G[name] ? { unlocks: { ...(UNL_T[name] ? { text: UNL_T[name] } : {}), milestone: UNL_G[name] } } : {}),
    ...(WRAPS[id] ? { wraps: WRAPS[id] } : {}),
    requires: prev ? { story: prev, is: 'turnedIn', basis: 'sourced', sources: [{ url: page, section: 'Previous quest' }] } : { all: [] },
    completesWith: [{ story: 'sq:' + id, is: 'turnedIn' }],
    sources, verifiedAt: s ? s.fetched || D12 : D14, status: 'verified', fieldStatus: fs,
  };
  if (!s && !steps.length) rec.notes = ['No objectives or route data in the v1 data (story.json starts at Lv 24; QUEST_STEPS at "A New Lead").'];
  if (s && s.notes) rec.notes = [...(rec.notes || []), ...[].concat(s.notes)];
  if (s && s.end) {
    const m = s.steps[s.steps.length - 1].match(/\(([^)]*Reshanta)\)/);
    rec.end = { region: 'Reshanta', regionFull: m[1], note: s.end };
  }
  if (conflicts.length) rec.conflicts = conflicts;
  return rec;
});

/* ------------------------------------------------------------------ Ascension quests (prereq-gates §5) */
const ASC_REQ_NOTE = 'Metabot gives no prerequisite field for Ascension quests (prereq-gates §5).';
const MBQ = s => `https://metabot.gg/en/aion-2/quests/${s}`;
const ascensionQuests = [
  { id: 'asc:perceives', name: 'The One Who Perceives', chapter: 1, lv: 5, unlocksAt: 5, page: 'the-one-who-perceives-asmodian',
    requires: { all: [{ level: 5, basis: 'sourced', sources: [{ url: MBQ('the-one-who-perceives-asmodian'), fields: ['unlocksAt'] }] },
      { story: 'sq:2101050', is: 'reached', basis: 'owner-check', note: 'candidate gate "The Being Beneath the Lake" (intro text hint only); owner check 6' }] },
    completesWith: ['tick', { story: 'sq:2101060', is: 'turnedIn', basis: 'sourced', sources: [{ url: MBQ('spread-your-wings'), note: 'objective 1 is "The One Who Perceives Complete"' }] }] },
  { id: 'asc:hears-the-voice', name: 'The One Who Hears the Voice', chapter: 2, lv: 22, unlocksAt: 10, page: 'the-one-who-hears-the-voice-asmodian',
    requires: { all: [{ story: 'sq:2102185', is: 'reached', basis: 'legacy', note: "today's g22:0 gate" }, { done: 'asc:perceives', basis: 'inferred', note: 'chapter order II after I' },
      { player: 'Ascension Gauge at 100%', playerChecked: true, basis: 'legacy' }] },
    completesWith: ['tick', { story: 'sq:2102185', is: 'turnedIn', basis: 'sourced', sources: [{ url: MBQ('daeva-in-a-dream-asmodian'), note: 'its objective is completing this quest' }] }] },
  { id: 'asc:dreams', name: 'The One Who Dreams', chapter: 3, lv: 32, unlocksAt: 10, page: 'the-one-who-dreams-asmodian', claims: ['C36'],
    requires: { all: [{ story: 'sq:2102345', is: 'reached', basis: 'legacy', note: "today's g32:dreams gate (claim C36)" }, { done: 'asc:hears-the-voice', basis: 'inferred', note: 'chapter order' },
      { player: 'Ascension Gauge at 100%', playerChecked: true, basis: 'legacy' }] },
    completesWith: ['tick', { story: 'sq:2102345', is: 'turnedIn', basis: 'sourced', sources: [{ url: MBQ('a-daeva-dreaming-anew'), note: 'its only objective is completing The One Who Dreams' }] }] },
  { id: 'asc:witnesses', name: 'The One Who Witnesses the Nightmare', chapter: 4, lv: 45, unlocksAt: 10, page: 'the-one-who-witnesses-the-nightmare-asmodian', claims: ['C37'],
    requires: { all: [{ story: 'sq:2102800', is: 'turnedIn', basis: 'legacy', note: "today's g45:0 gate (claim C37)" }, { done: 'asc:dreams', basis: 'inferred', note: 'chapter order' }] },
    completesWith: ['tick'], notes: ['Its wrapper, "Daeva Trapped in a Nightmare" (2102810), is not in the app yet (owner decision Q7: added after the owner\'s check), so completion is the tick only.'] },
  { id: 'asc:oath', name: 'The One Who Swears the Oath', chapter: 5, lv: 49, unlocksAt: 10, page: 'the-one-who-swears-the-oath-asmodian', inCap: false, claims: ['C05'],
    requires: { done: 'asc:witnesses', basis: 'inferred', note: 'chapter V after IV' }, completesWith: ['tick'] },
].map(({ page, notes, ...a }) => ({ ...a, faction: 'asmodian', access: 'teleport',
  sources: [{ url: MBQ(page), fields: ['lv', 'unlocksAt', 'chapter'], checkedAt: D14, note: 'read by Data & Research for prereq-gates §5' }],
  verifiedAt: D14, status: 'verified', notes: ['No map location: unlocks when its prerequisites are met and the player teleports in (Journal → Ascension → Teleport; owner, 2026-10-14). ' + ASC_REQ_NOTE, ...(notes || [])] }));

/* ------------------------------------------------------------------ Sealed Dungeons */
const HIDE = V1.areas.HIDEOUT_AREA;
for (const [n, z] of Object.entries(hz)) if (HIDE[n] !== z) note('HIDEOUT_AREA differs from snapshot v288:', n, JSON.stringify(z), '->', JSON.stringify(HIDE[n]));
for (const n of Object.keys(HIDE)) if (!(n in hz)) note('HIDEOUT_AREA has a dungeon the v288 snapshot lacks:', n);
const SD_GROUPS = [];
for (const g of TOK.milestones.GATES) g.items.forEach(it => { if (it.__hideouts) SD_GROUPS.push({ gid: g.id, band: +g.id.slice(1), names: it.__hideouts, prefix: it.keyPrefix }); });
const DUN = Object.fromEntries(dun.map(x => [x.name, x]));
const sealedDungeons = SD_GROUPS.flatMap(({ band, names, prefix }) => names.map(n => {
  const d = DUN[n], loc = G.AREA_LOC[n], z = HIDE[n];
  if (!z) throw new Error('no zone for ' + n);
  usedZones.add(z);
  const sources = [];
  if (d) {
    sources.push({ url: d.src, fields: ['band', 'zone', 'rewards', ...(d.bosses ? ['bosses'] : [])], checkedAt: d.fetched });
    if (d.kibSrc) sources.push({ url: d.kibSrc, fields: ['entrance.kibelisk', 'entrance.meters', ...(d.xpSrc === d.kibSrc ? ['xp'] : [])], checkedAt: d.fetched });
    if (d.xpSrc && d.xpSrc !== d.kibSrc) sources.push({ url: d.xpSrc, fields: ['xp'], checkedAt: d.fetched });
    if (d.src2) sources.push({ ...ref(d.src2), checkedAt: d.fetched });
  }
  if (!d || !d.src) sources.push({ inferred: "Zone from Metabot's Altgard dungeon table, as carried in v1 HIDEOUT_AREA (src/data/areas.js; the page URL was not recorded); band = the milestone that lists it.", fields: ['band', 'zone'] });
  const fromSnap = loc && !(d && d.kib);
  const l1 = LOC1.areas[n];
  if (fromSnap && l1 && l1.src && l1.kib === loc.kib && l1.m === loc.m) sources.push({ url: l1.src, fields: ['entrance.kibelisk', 'entrance.meters'], ...(l1.note ? { note: l1.note } : {}) });
  else if (fromSnap) sources.push({ inferred: 'Entrance Kibelisk and distance carried over from the page data before E2 (tools/gen/snapshots/area-loc-v287.json: allthings.how map pages; no page URL recorded for this one).', fields: ['entrance.kibelisk', 'entrance.meters'] });
  const xp = d && d.xp != null ? d.xp : (areaOld[n] || {}).xp;
  const rec = {
    id: 'sd:' + mapSlug(n), key: `${prefix}:${mapSlug(n)}`, name: n, faction: 'asmodian', band, zone: zid(z), route: 'core',
    entrance: { npc: null, place: null, zone: zid(z), kibelisk: loc ? loc.kib : null, meters: loc ? loc.m ?? null : null },
    mapSlug: n.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    ...(xp != null ? { xp } : {}),
    ...(d ? { rewards: (({ other, abyssPoints, ...r }) => ({ ...r, items: other || [] }))(d.rewards), rewardBasis: d.rewardBasis } : {}),
    ...(d && d.bosses ? { bosses: d.bosses } : {}), ...(d && d.exploreQid ? { exploreQuestId: String(d.exploreQid) } : {}),
    requires: { level: band, basis: 'rule', note: 'milestone band (the dungeon is listed in milestone g' + band + ')' }, completesWith: ['tick'],
    sources, verifiedAt: d ? d.fetched : D12, status: 'verified',
    ...(fromSnap ? { fieldStatus: { entrance: 'single-source' } } : {}),
  };
  const notes = []; if (d && d.notes) notes.push(d.notes);
  if (d && d.rewards && d.rewards.abyssPoints) notes.push(`Abyss Points ${d.rewards.abyssPoints} (Elyos column only).`);
  if (!loc) notes.push('No entrance Kibelisk in the v1 data.');
  if (notes.length) rec.notes = notes;
  if (d && loc && (d.kib !== loc.kib || d.m !== loc.m)) note('SD entrance: AREA_LOC vs dungeons.json', n);
  return rec;
}));
const SD_NAMES = new Set(sealedDungeons.map(x => x.name));
for (const n of Object.keys(G.AREA_LOC)) if (!SD_NAMES.has(n)) note('AREA_LOC entry that is not a Sealed Dungeon:', n);
if (sealedDungeons.length !== 60) throw new Error('sealed dungeons ' + sealedDungeons.length);

/* ------------------------------------------------------------------ strongholds */
const strongholds = shJ.map(s => {
  usedZones.add(s.zone);
  const r = {
    id: 'sh:' + mapSlug(s.name), key: 'sh:' + mapSlug(s.name), name: s.name, faction: 'asmodian', gameFaction: s.faction, gameId: String(s.qid), type: s.type, questType: s.questType,
    zone: zid(s.zone), route: 'core', levelRange: { lo: s.lo, hi: s.hi }, recLv: s.recLv, unlocksAt: s.unlocksAt,
    location: { npc: null, place: null, zone: zid(s.zone), kibelisk: s.kib ?? null, meters: s.m ?? null },
    steps: s.steps.map((t, i) => ({ i, text: t, meters: (s.stepKibM || [])[i] ?? null })),
    rewards: s.rewards,
    requires: { level: s.lo, basis: 'inferred', sources: [{ url: s.mapSrc }], note: "lo of the map's level range" }, completesWith: ['tick'],
    sources: [{ url: s.src, fields: ['gameId', 'rewards', 'steps'], checkedAt: s.fetched }, { url: s.mapSrc, fields: ['zone', 'levelRange', 'location'], checkedAt: s.fetched, ...(s.kibSrc && !/^https/.test(s.kibSrc) ? { note: 'location: ' + s.kibSrc } : {}) }],
    verifiedAt: s.fetched, status: 'verified', fieldStatus: { levelRange: 'inferred' },
    notes: [...(s.notes || []), ...(s.levelBasis ? [s.levelBasis] : [])],
  };
  return r;
});

/* ------------------------------------------------------------------ zones */
const TRACES = V1.areas.ZONE_TRACES;
const TRACE_URL = 'https://metabot.gg/en/aion-2/map/altgard/empyrean-traces';
const zoneNames = new Set([...ZONES_V1, ...usedZones, ...Object.keys(TRACES)]);
const zones = [...zoneNames].map(n => {
  const camps = Object.entries(CAMP_ZONE).filter(([, z]) => z === n).map(([c]) => c);
  const kibs = Object.entries(KIB_ZONE).filter(([k, z]) => z === n && k !== n && !camps.includes(k)).map(([k]) => k).sort();
  const sources = [];
  if (n in TRACES) sources.push({ url: TRACE_URL, fields: ['traces'] });
  sources.push({ inferred: 'Zone name as the v1 data uses it (allthings.how area guides, Metabot map tables); camps and Kibelisks from the v1 map-data zone votes (gen.py CAMP_ZONE, checked by the build).', fields: ['name', ...(camps.length ? ['camps'] : []), ...(kibs.length ? ['kibelisks'] : [])] });
  return { id: zid(n), name: n, region: 'Altgard', faction: 'asmodian', traces: n in TRACES ? TRACES[n] : null,
    ...(camps.length ? { camps } : {}), ...(kibs.length ? { kibelisks: kibs } : {}), sources, verifiedAt: D12, status: 'verified',
    fieldStatus: { ...(camps.length ? { camps: 'inferred' } : {}), ...(kibs.length ? { kibelisks: 'inferred' } : {}) },
    ...(n === 'Nornir Assembly' ? { notes: ['A camp the v1 data already treats as a zone (gen.py exception for regional quest zones).'] } : {}) };
});
zones.push({ id: Z_ISHALGEN, name: 'Ishalgen', region: 'Ishalgen', faction: 'asmodian', traces: null,
  sources: [{ url: hubPage(1), fields: ['name'] }, { inferred: 'The Lv 1-9 story quests run on the Ishalgen starting map (milestone g6: "Story quests in Ishalgen").', fields: ['region'] }],
  verifiedAt: D12, status: 'verified', notes: ['The starting map. Used as the zone of the Lv 1-9 story quests, whose v1 data has no location.'] });
zones.push({ id: Z_UNPLACED, name: 'Altgard (zone not recorded)', region: 'Altgard', faction: 'asmodian', traces: null,
  sources: [{ inferred: 'Placeholder: the v1 data has no location for these quests (DATA-FORMAT-V2 §9 data task). The generator lists every record that uses it.' }],
  verifiedAt: D14, status: 'owner-check', notes: ['Not a game zone. A record pointing here still needs its zone (Metabot quest page or owner check).'] });
for (const z of zones) if (!Object.keys(z.fieldStatus || {}).length) delete z.fieldStatus;

/* ------------------------------------------------------------------ unlocks (build.json unlocks + VERIFIED_UNLOCKS) */
const VU = V1.story.VERIFIED_UNLOCKS;   /* already filtered in v1: the Lv 30 Sealed Dungeons row (one credit) is not in it */
const VU_ALL = [...VU.slice(0, 10), [30, 'Sealed Dungeons', 'New batch', 'allthings.how'], ...VU.slice(10)];
if (VU_ALL[9][1] !== 'Daily dungeon') throw new Error('VU order');
const BU = Object.fromEntries(buildJ.unlocks.filter(u => u.level !== undefined).map(u => [u.what, u]));
const credited = credit => ({ inferred: `Credited by site name only in v1 (VERIFIED_UNLOCKS: ${credit}); the pages were not recorded. The 0.3 audit resolves each name to a page.` });
const unlocks = VU_ALL.map(([lv, what, detail, credit], i) => {
  const idSlug = { 'Sealed Dungeons': 'sealed-dungeons-' + lv, 'Level cap': 'level-cap', 'Daily dungeon': 'daily-dungeon' }[what] || slug(what);
  const b = BU[what] || (what === 'Daily dungeon' ? null : null);
  const r = { id: 'unlock:' + idSlug, what, ...(detail ? { detail } : {}), at: { level: lv }, credit, order: (i + 1) * 10 };
  const srcs = [];
  if (b) {
    srcs.push(...b.sources.map(s => ref(s)).filter(Boolean));
    if (b.minItemLevel) r.at = { all: [{ level: lv }, { itemLevel: b.minItemLevel, playerChecked: true }] };
    if (b.party) r.party = b.party; if (b.timeLimit) r.timeLimit = b.timeLimit;
    if (b.conquest) r.conquest = { lv: b.conquest.lv, itemLevel: b.conquest.il };
    if (b.storyStep) r.storyStep = b.storyStep;
    const ns = [b.quest ? 'Feature gate: ' + b.quest : null, b.verdict, b.note].filter(Boolean); if (ns.length) r.notes = ns;
  }
  if (what === 'Daily dungeon') {
    const d = buildJ.dailyDungeon;
    srcs.push(...d.src.map(s => ref(s)).filter(Boolean)); r.otherNames = d.otherNamesKRTW; r.entries = d.entries; r.notes = [d.verdict, 'Names: ' + d.names.join(', ')];
  }
  srcs.push(credited(credit));
  r.sources = srcs; r.verifiedAt = D12; r.status = credit.split(',').length >= 2 ? 'verified' : 'single-source';
  return r;
});
{
  const e = buildJ.unlocks.find(u => u.what === 'Expedition feature (Exploration)'), cav = buildJ.unlocks.find(u => u.what === 'Global availability caveat');
  unlocks.push({ id: 'unlock:expedition-feature', what: 'Expedition feature (Exploration)', at: { story: SQ_OF['Daeva in a Dream'], is: 'reached', basis: 'legacy', note: 'v1: feature unlocked by "Daeva in a Dream" (sources + seen in game)' },
    sources: [...e.sources.map(s => ref(s)).filter(Boolean), { inferred: "v1 data: 'in-game (user)': seen in the owner's game; no screen code yet (DATA-FORMAT-V2 §14.2)." }],
    verifiedAt: D12, status: 'verified', notes: [e.verdict, cav.note] });
}

/* ------------------------------------------------------------------ rules */
const SR = buildJ._meta.skillRules, SC = buildJ.stigmaCost, NC = buildJ.boards.nodeCosts, LP = buildJ.levelPoints;
const LEVEL_POINTS = V1.build.LEVEL_POINTS;
for (const [k, v] of Object.entries(LP)) if (/^\d+$/.test(k) && LEVEL_POINTS[+k] !== v) throw new Error('levelPoints ' + k);
const refs = xs => xs.map(s => ref(s)).filter(Boolean);
const ALL = 'all-classes';
const rules = [
  { id: 'rule:level-points', kind: 'levelPoints', appliesTo: ALL, value: LEVEL_POINTS, sources: refs(LP.sources),
    status: 'single-source', notes: [LP.verdict, "LEVEL_POINTS comment: Wikily leveling table; matches the game at Lv 12 = 24, Lv 13 = 28, max 203."] },
  { id: 'rule:skill-point-cost', kind: 'skillPointCost', appliesTo: ALL, value: [{ from: 2, to: 4, cost: 1 }, { from: 5, to: 7, cost: 2 }, { from: 8, to: 10, cost: 4 }],
    sources: refs(SR.sources).slice(0, 1), status: 'verified', notes: [SR.costsPerLevel] },
  { id: 'rule:skill-level-gate', kind: 'skillLevelGate', appliesTo: ALL, value: { stepped: { perLevel: 3 }, maxFromPoints: SR.maxFromPoints, maxLevel: SR.maxLevel },
    sources: refs(SR.sources), status: 'verified', notes: [SR.above10, 'Character level for skill level L = learnLv + 3 × (L − 2) (Metabot skill pages); some passives use a flat gate (skills[].levelGate).'] },
  { id: 'rule:specialty-slots', kind: 'specialtySlots', appliesTo: ALL, value: { slots: [8, 12, 20], levelBasis: 'effective', stigmaSlots: [5, 10, 15, 20] },
    sources: refs(SR.sources), status: 'verified', claims: ['C03'],
    notes: [SR.specialtyOptions, 'Effective skill level = highest ticked sp:<key>:<L> (1 if none) + the adds of every owned board node for the skill (DATA-FORMAT-V2 §8.2). The v1 "learn + 18" gate (bug F3) is not a rule: the 0.2 compiler keeps it internally so the output stays identical; 0.3 replaces it.'] },
  { id: 'rule:stigma-shard-cost', kind: 'stigmaShardCost', appliesTo: ALL, value: [{ from: 1, to: 5, cost: 1 }, { from: 6, to: 10, cost: 2 }, { from: 11, to: 15, cost: 4 }, { from: 16, to: 20, cost: 8 }],
    sources: refs(SC.sources), status: 'verified', notes: [SC.table, SC.verdict, SC.implication] },
  { id: 'rule:stigma-slots', kind: 'stigmaSlots', appliesTo: ALL, value: [22, 27, 32, 37], sources: refs(buildJ.stigmaRules.availability.match(/https?:\/\/\S+/g) || []).concat([{ url: 'https://metabot.gg/en/aion-2/content-unlocks' }]),
    status: 'verified', notes: [buildJ.stigmaRules.slots, buildJ.stigmaRules.availability] },
  { id: 'rule:node-costs', kind: 'nodeCosts', appliesTo: ALL, value: { stat: NC.stat, rareStat: NC.rareStat, passive: NC.passive, active: NC.active, corner: NC.corner, cornerValue: NC.cornerValue },
    sources: [{ url: 'https://metabot.gg/en/aion-2/guides/daevanion-guide' }, { url: 'https://skycoach.gg/blog/aion-2/articles/daevanion-board' }, { url: 'https://gamewith.ai/aion2/en/daevanion-planner/assassin', note: '1/2/3/4 by grade' }],
    status: 'verified', notes: ['v1 sources (by name): ' + NC.sources.join('; ')] },
  { id: 'rule:stigma-points-per-level', kind: 'stigmaPointsPerLevel', appliesTo: ALL,
    value: Array.from({ length: 46 }, (_, L) => Math.max(0, Math.min(L, 39) - 22) + 2 * Math.max(0, L - 39)),
    sources: refs(SC.sources).slice(0, 2), status: 'verified', notes: [SC.shardIncome, 'Cumulative from leveling only (the Ascension point and shops come on top).'] },
  { id: 'rule:crystals-per-level', kind: 'crystalsPerLevel', appliesTo: ALL, value: Array.from({ length: 46 }, (_, L) => Math.max(0, L - 11) * 4),
    sources: [{ inferred: "v1 data: 'Daevanion points: 4 per level past 11 (checked at 16 and 17)', seen in the owner's game (confidence card, claim C28f); no screen code yet (DATA-FORMAT-V2 §14.2)." }],
    status: 'single-source', claims: ['C28f'] },
  { id: 'rule:sd-first-clear-asmodian', kind: 'firstClearReward', appliesTo: { classes: ALL, faction: 'asmodian' },
    value: { target: 'sealedDungeons', rewards: { wisdom: 2, crystal: 2, kina: 15000, enhance: 1250, featherdown: 2 }, text: V1.areas.SD_REWARD,
      evidence: bands.bands.map(b => ({ band: b.band, samples: b.samples, wisdom: b.wisdom, crystal: b.crystal, kina: b.kina, enhance: b.enhance, src: b.src })) },
    sources: [{ url: 'https://metabot.gg/en/aion-2/dungeons/abandoned-ones-grave', note: 'Standard clear reward table; one page per sampled band' }],
    status: 'verified', claims: ['C12'], notes: [bands.answer, ...bands.caveats] },
  { id: 'rule:sh-first-clear-asmodian', kind: 'firstClearReward', appliesTo: { classes: ALL, faction: 'asmodian' },
    value: { target: 'strongholds', text: V1.areas.SH_REWARD }, sources: [{ url: 'https://metabot.gg/en/aion-2/map/altgard/strongholds' }],
    status: 'verified', claims: ['C13'], notes: ['Strongholds pay belt scrolls and Kina, no Wisdom Stones or crystals (Metabot quest pages list EXP only; claim C13 sources).'] },
].map(r => ({ ...r, verifiedAt: D12 }));
for (const r of rules) if (!r.sources.length) throw new Error('rule without sources ' + r.id);

/* ------------------------------------------------------------------ boards, items */
const boards = buildJ.boards.list.map(b => ({ id: 'board:' + slug(b.name), name: b.name, lv: b.lv, currency: b.currency, points: b.points, statNodes: b.statNodes, skillNodes: b.skillNodes,
  ...(b.note ? { note: b.note } : {}), sources: refs(buildJ.boards.listSources), verifiedAt: D12, status: 'verified', claims: ['C22'],
  notes: [buildJ.boards.listVerdict, ...(b.name === 'Nezekan' ? [buildJ.boards.ArielNote, buildJ.boards.skillLevelNote] : [])] }));
const ITEMS = V1.items.ITEMS;
const items = Object.entries(ITEMS).map(([key, [label, slugM, icon, gameName]]) => ({ id: 'item:' + key, key, label, gameName, metabotSlug: slugM, icon: icon || null,
  sources: [{ url: 'https://metabot.gg/en/aion-2/items/' + slugM, label: gameName }], verifiedAt: D12, status: 'verified',
  ...(key === 'wisdom' || key === 'crystal' ? { notes: ['Icon confirmed in game (DECISIONS A1).'] } : {}) }));

/* ------------------------------------------------------------------ class: skills, stigmas, board nodes */
const CLS = 'assassin';
const SP = V1.build.SP_SKILLS, SP_ICONS = V1.build.SP_ICONS;
const skId = n => `skill:${CLS}:${slug(n)}`;
const SPEC_MB = { 'Savage Roar': specsMB['savage-roar'], Ambush: specsMB.ambush, Shadowstrike: specsMB.shadowstrike };
const skills = buildJ.skills.map(s => {
  const core = SP.find(x => x.n === s.name && !x.extra);
  if (core && core.learn !== s.learnLv) throw new Error('learn level ' + s.name);
  let choices = [];
  if (s.specialties) { let n = 0; for (const g of s.specialties) for (const t of g.options) { n++; choices.push({ id: `spec:${CLS}:${slug(s.name)}:${n}`, n, skillLv: g.skillLv, text: t }); } }
  else if (SPEC_MB[s.name]) choices = SPEC_MB[s.name].map(([n, lv, t]) => ({ id: `spec:${CLS}:${slug(s.name)}:${n}`, n, skillLv: lv, text: t }));
  if (core && core.spec) {
    const norm = x => x.toLowerCase().replace(/[^a-z0-9+%]/g, '');
    /* the guide's pick per skill, by choice number (matched by hand against the Metabot texts) */
    const n = { 'Heart Gore': 3, 'Insignia Explosion': 2, 'Savage Roar': 2, 'Quick Slice': 3, Ambush: 1, Shadowstrike: 2 }[s.name];
    const c = choices.find(c => c.n === n);
    if (!c) throw new Error('spec pick ' + s.name);
    if (c.text !== core.spec) { c.label = core.spec; note('specialty label differs from Metabot text:', s.name, `#${c.n}`, JSON.stringify(c.text), '-> shown as', JSON.stringify(core.spec)); }
    core.__pick = c.id;
  }
  const gate = s.gate && String(s.gate).startsWith('flat') ? 'flat' : 'stepped';
  const sources = refs(s.src);
  if (SPEC_MB[s.name]) sources.push({ url: `https://metabot.gg/en/aion-2/skills/${slug(s.name)}`, fields: ['specialtyChoices'], checkedAt: D14, build: { scheme: 'metabot', value: '0.0.4387.0' } });
  const r = { id: skId(s.name), key: s.name, name: s.name, type: s.type, learnLv: s.learnLv, levelGate: gate,
    ...(s.dvNodes ? { boardNodes: { perBoard: Object.fromEntries(Object.entries(s.dvNodes).filter(([k]) => k !== 'cost').map(([k, v]) => ['board:' + slug(k), v])), cost: s.dvNodes.cost } } : {}),
    icon: SP_ICONS[s.name] || null, ...(s.note ? { note: s.note } : {}), ...(choices.length ? { specialtyChoices: choices } : {}),
    sources, verifiedAt: SPEC_MB[s.name] ? D14 : D12, status: 'verified' };
  if (s.gate === null) { r.fieldStatus = { levelGate: 'inferred' }; r.notes = ['levelGate: no gate in the v1 data (skill page not fetched); "stepped" assumed, not used by the guide build.']; }
  if (s.gate && !/^flat/.test(s.gate) && !/learnLv \+ 3\*\(L-2\)/.test(s.gate)) throw new Error('gate ' + s.name);
  return r;
});
for (const x of SP) if (!skills.find(s => s.name === x.n)) throw new Error('SP skill missing in build.json: ' + x.n);
const SKILL_ICON_ONLY = Object.keys(SP_ICONS).filter(n => !skills.find(s => s.name === n)); if (SKILL_ICON_ONLY.length) throw new Error('icons ' + SKILL_ICON_ONLY);
const STIGMA_ICON = V1.build.STIGMA_ICON;
const stId = n => `stigma:${CLS}:${slug(n)}`;
const stigmas = buildJ.stigmas.map(s => ({ id: stId(s.name), key: s.name, name: s.name, availableLv: s.availableLv, icon: STIGMA_ICON[s.name] || null, ...(s.note ? { note: s.note } : {}),
  maxLevel: 40, sources: refs(s.src), verifiedAt: D12, status: 'verified', fieldStatus: { maxLevel: 'single-source' },
  notes: ['maxLevel 40 for Assassin and Ranger, 25 for the other six (Metabot; owner check pending, classes-and-gaps).'] }));

/* board nodes: every node of the five boards (Metabot planner). Legacy dv: keys by written-out mapping (§8.3). */
const LEGACY = {
  nezekan: { 'r4c5': 'dv:hg', 'r13c7': 'dv:ie', 'r9c11': 'dv:qs', 'r11c8': 'dv:amb', 'r5c8': 'dv:ss', 'r3c7': 'dv:ew', 'r11c13': 'dv:ew2', 'r7c10': 'dv:as', 'r11c3': 'dv:as2' },
  zikel: { 'r13c5': 'dv:z:hg', 'r3c11': 'dv:z:ie', 'r5c3': 'dv:z:qs', 'r6c7': 'dv:z:db', 'r12c11': 'dv:z:db2' },
  vaizel: { 'r7c11': 'dv:v:hg', 'r9c5': 'dv:v:ie', 'r8c13': 'dv:v:qs', 'r5c13': 'dv:v:as', 'r6c9': 'dv:v:db' },
  triniel: { 'r9c10': 'dv:t:hg', 'r8c14': 'dv:t:ie', 'r13c12': 'dv:t:qs', 'r9c4': 'dv:t:as', 'r13c7': 'dv:t:db' },
};
const MAP_NOTE = {
  'dv:ew': 'Exploit Weakness 1 of 2 = r3c7 (above the centre): the g12:0 path costs (Heart Gore + it = 11; all five = 27) fit only this assignment on the Metabot grid.',
  'dv:ew2': 'Exploit Weakness 2 of 2 = r11c13: 5 past Quick Slice on the Metabot grid, as g12:0 says.',
  'dv:as': 'Assault Stance 1 of 2 = r7c10: the other node is the one whose path gives Rear Smite (dv:as2).',
  'dv:as2': 'Assault Stance 2 of 2 = r11c3: its cheapest path from Start (10) runs through Rear Smite r9c6, as the plan text says ("its path also gives Rear Smite +1").',
  'dv:z:db': 'Defense Break 1 of 2: which physical node the v1 key means is not stated anywhere; assigned to r6c7 (the cheaper path) for an owner check.',
  'dv:z:db2': 'Defense Break 2 of 2: assigned to r12c11 for an owner check (see dv:z:db).',
};
const MB_BUILD = { scheme: 'metabot', value: planner.build };
const plannerSrc = { url: planner.url, checkedAt: planner.fetched, build: MB_BUILD };
const boardNodes = planner.boards.flatMap(b => b.nodes.map(n => {
  const bs = slug(b.name), rc = `r${n.row}c${n.col}`, legacy = (LEGACY[bs] || {})[rc];
  const type = n.type === 'Start' ? 'start' : n.type === 'SkillLevel' ? 'skill' : n.grade === 'Unique' ? 'unique' : 'stat';
  const r = { id: `node:${CLS}:${bs}:${rc}`, key: legacy || `dv:${bs}:${rc}`, board: 'board:' + bs, row: n.row, col: n.col, type,
    ...(n.grade ? { grade: n.grade.toLowerCase() } : {}), cost: n.cost, label: n.label,
    ...(type === 'skill' ? { skill: skId(n.skillName), adds: n.skillLevels } : {}), gameId: String(n.id),
    sources: [plannerSrc], verifiedAt: planner.fetched, status: 'verified' };
  if (legacy && MAP_NOTE[legacy]) { r.notes = [MAP_NOTE[legacy]]; r.fieldStatus = { key: /z:db/.test(legacy) ? 'owner-check' : 'inferred' }; }
  if (type === 'skill' && !skills.find(s => s.id === r.skill)) throw new Error('node skill ' + n.skillName);
  return r;
}));
for (const [bs, m] of Object.entries(LEGACY)) for (const [rc, k] of Object.entries(m)) {
  const nd = boardNodes.find(x => x.id === `node:${CLS}:${bs}:${rc}`);
  if (!nd || nd.type !== 'skill') throw new Error('legacy map ' + k);
}
const cornersOf = (bs, re) => boardNodes.filter(x => x.board === 'board:' + bs && x.type === 'unique' && re.test(x.label)).map(x => x.id);

/* ------------------------------------------------------------------ the guide build (§8.1) */
const SO = buildJ.spOrderAfterCore;
const INF_ORDER = 'Ranked from the player\'s tooltips and Metabot\'s per-level tables (damage gained per level ÷ cooldown); an inference, not a published build (src/data/build.js).';
const skillOrder = [
  ...SP.filter(x => !x.extra).map(x => ({ skill: skId(x.n), core: true, status: 'inferred', sources: [{ inferred: INF_ORDER }] })),
  ...SO.order.map(n => { const p = SO.perItem[n]; return { skill: skId(n), core: false, status: p.verdict === '2-source' ? 'verified' : 'single-source', basis: p.basis,
    sources: refs(SO.sources).filter(s => p.basis.toLowerCase().includes({ 'gamesfuze.com': 'gamesfuze', 'skycoach.gg': 'skycoach', 'games.gg': 'games.gg', 'metabot.gg': 'metabot' }[new URL(s.url).hostname.replace(/^www\./, '')])) }; }),
];
for (const e of skillOrder) if (!e.sources.length) throw new Error('skill order source ' + e.skill);
const specialtyPicks = Object.fromEntries(SP.filter(x => x.__pick).map(x => [skId(x.n), [x.__pick]]));
/* plan nodes, in milestone order (positions filled in below with the milestones) */
const ST_PLAN = V1.build.STIGMA_PLAN, ST_TGT = V1.build.ST_TARGETS;
const guideTexts = {
  'nezekan-plan': 'Two clusters, from your board: above the centre, Heart Gore with Exploit Weakness 1 branching off its path (11 for both); below the centre, Ambush (7) and Quick Slice (6) share their first two nodes (11 for both), and Exploit Weakness 2 sits 5 past Quick Slice. All five come to 27. Where a node has two routes, take the one with Critical Hit and Attack over HP and Critical Hit resist.',
  opener: 'Q (Shadowstrike)',
};
const RMB = [14, 4, 3, 1].map(minLv => ({ minLv, skills: V1.build.RMB_STACK(minLv).map(skId) }));
for (let lv = 0; lv <= 50; lv++) { const want = JSON.stringify(V1.build.RMB_STACK(lv)), got = RMB.find(x => lv >= x.minLv); if (want !== JSON.stringify(got ? got.skills.map(id => skills.find(s => s.id === id).name) : ['Savage Roar'])) throw new Error('RMB ' + lv); }
const guideBuild = {
  id: `build:${CLS}:guide`, class: CLS, name: 'Guide build', origin: 'guide',
  statPriority: { tiers: V1.build.STAT_TIERS, from: V1.build.STAT_SRC, status: 'verified',
    sources: claimsJ.find(c => c.id === 'C20').sources.slice(0, 3).map(s => ({ url: s.url })), note: 'Only stats at least two of the three rank high (claim C20). from: B = board stat nodes / corners, G = gear.' },
  skillOrder,
  skillOrderNotes: { skip: SO.skip, interleave: SO.interleave, budget: SO.budget, notFetched: SO.notFetched },
  specialtyPicks,
  stigmaSlots: ST_PLAN.map(stId),
  stigmaTargets: ST_TGT.map(([n, level]) => ({ stigma: stId(n), level })),
  boardPlan: [],
  keyStacks: { rightClick: RMB, eOrder: V1.build.E_ORDER.map(stId), status: 'inferred',
    sources: [{ inferred: 'Row order and the E stack (buffs first, then damage) are the guide\'s reasoning; no source gives an order. Insignia Explosion sits above the builders because it scales with Insignia stacks (Metabot).' }] },
  texts: guideTexts,
  sources: [{ url: 'https://gamesfuze.com/guides/aion-2-assassin-build-best-skills-stigmas-and-rotation/' }, { url: 'https://metabot.gg/en/aion-2/guides/stigma-guide' }],
  verifiedAt: D12, status: 'inferred',
  conflicts: ['Stigma equip order: ' + Object.entries(buildJ.stigmaRules.equipOrder).filter(([k]) => ['metabot', 'gamesfuze', 'skycoach'].includes(k)).map(([k, v]) => `${k}: ${v.join(', ')}`).join(' · ') +
    '. The guide follows Metabot and Skycoach for slots 3–4 (Swift Contract before Savage Fang; GamesFuze reverses it) and GamesFuze + Skycoach for the upgrade targets (src/data/build.js).'],
  notes: ['Skill order after the core eight (v1 verdict): ' + SO.verdict, 'v1: SP_SKILLS, SP_EXTRA, STIGMA_PLAN, ST_TARGETS, STAT_TIERS, STAT_SRC, RMB_STACK, E_ORDER and the dv milestone items. Up to two credited community builds may join it (owner decision).',
    'stigmaRules.verdict (v1): ' + buildJ.stigmaRules.equipOrder.verdict, 'Upgrade priority (v1): ' + buildJ.stigmaRules.equipOrder.upgradePriority,
    'v1 board notes: ' + buildJ.boards.pathCostsNote, 'Corner totals by board (Metabot full-board totals): ' + Object.entries(buildJ.boards.cornerTotalsByBoard).filter(([k]) => k !== 'src').map(([k, v]) => `${k}: ${v}`).join('; ') + ' (' + buildJ.boards.cornerTotalsByBoard.src + ')'],
};
const classRec = { id: 'class:' + CLS, class: CLS, name: 'Assassin', release: 'released', defaultBuild: guideBuild.id, sources: refs(buildJ._meta.fullSkillList.sources), verifiedAt: D12, status: 'verified',
  notes: ['Skill list (v1 _meta.fullSkillList): actives ' + buildJ._meta.fullSkillList.actives.join(', ') + '; passives ' + buildJ._meta.fullSkillList.passives.join(', ') + '. ' + buildJ._meta.fullSkillList.verdict] };

/* ------------------------------------------------------------------ milestones, steps, the board plan */
const BUILD_TEXT = [   /* M2: build choices in shared steps become build tokens; the compiler expands them with the guide build */
  ['g12:0', guideTexts['nezekan-plan'], '[[build:text:nezekan-plan]]'],
  ['g27:1', 'Q (Shadowstrike)', '[[build:text:opener]]'],
  ['g22:1', "Plan: Triniel's Dagger, raised to level 10 first.", 'Plan: [[build:stigma:1]], raised to level [[build:stigmaTarget:1]] first.'],
  ['g27:0', "Plan: Illusive Clone, raised toward level 20 once Triniel's Dagger is at 10.", 'Plan: [[build:stigma:2]], raised toward level [[build:stigmaTarget:2]] once [[build:stigma:1]] is at [[build:stigmaTarget:1]].'],
  ['g32:0', 'Plan: Swift Contract.', 'Plan: [[build:stigma:3]].'],
  ['g37:0', 'Plan: Savage Fang.', 'Plan: [[build:stigma:4]].'],
];
const ASC_STEP = { 'g22:0': 'asc:hears-the-voice', 'g32:dreams': 'asc:dreams', 'g45:0': 'asc:witnesses' };
const BOARD_NODE_OF = Object.fromEntries(boardNodes.filter(n => !/^dv:[a-z]+:r/.test(n.key)).map(n => [n.key, n.id]));
const CORNER = { 'dv:corner': ['nezekan', /Cooldown Reduction|Combat Speed/], 'dv:z:corner': ['zikel', /^Damage Boost/], 'dv:v:corner': ['vaizel', /^Critical Damage Boost/], 'dv:t:corner': ['triniel', /^Multi-hit Chance/] };
const planEntry = (it, gid, order) => {
  const e = CORNER[it.k] ? { anyNode: cornersOf(...CORNER[it.k]), key: it.k } : { node: BOARD_NODE_OF[it.k] };
  if (!e.node && !e.anyNode) throw new Error('plan node ' + it.k);
  if (e.anyNode && e.anyNode.length < 2) throw new Error('corner ' + it.k);
  const nd = e.node && boardNodes.find(x => x.id === e.node);
  if (nd && (nd.type !== 'skill' || (skills.find(s => s.id === nd.skill).type === 'passive' ? 'p' : 'a') !== it.ty)) throw new Error('node type ' + it.k);
  return { ...e, label: it.t, ...(it.via ? { via: it.via } : {}), milestone: gid, order,
    requires: { level: it.blv, basis: it.blv === boards.find(b => b.name === it.board).lv ? 'rule' : 'legacy', ...(it.blv !== boards.find(b => b.name === it.board).lv ? { note: "the guide's level for this node (the board opens at " + boards.find(b => b.name === it.board).lv + ')' } : {}) },
    completesWith: ['tick'],
    ...(e.anyNode ? { sources: [{ ...plannerSrc, note: `the ${e.anyNode.length} matching corner (Unique) nodes of ${CORNER[it.k][0]}` }] } : {}),
    ...(/inferred/.test(it.via || '') ? { status: 'inferred' } : {}) };
};
const milestones = [], steps = [];
const splitLoc = t => { const m = t.match(/^(.*)<span class="loc">(.*)<\/span>$/s); return m ? [m[1], m[2]] : [t, null]; };
const stepOf = (it, gid, order, lv, isGate) => {
  let [text, loc] = splitLoc(it.t);
  text = text.replace('<span class="rotseq"></span>', '[[rotseq]]');
  for (const [k, from, to] of BUILD_TEXT) if (k === it.k) { if (!text.includes(from)) throw new Error('build text ' + k); text = text.replace(from, to); }
  const atoms = [];
  if (isGate) atoms.push({ level: lv, basis: 'rule', note: 'milestone level' });
  const sq = n => { if (!SQ_OF[n]) throw new Error('story ' + n); return SQ_OF[n]; };
  if (it.turnedIn) { if (it.story !== it.turnedIn) throw new Error('turnedIn+story ' + it.k); atoms.push({ story: sq(it.turnedIn), is: 'turnedIn', basis: 'legacy' }); }
  else if (it.story) atoms.push({ story: sq(it.story), is: 'reached', basis: it.byStory ? 'rule' : 'legacy', ...(it.byStory ? { note: 'the step is this story quest' } : {}) });
  if (it.after) { if (!it.stig) throw new Error('after on a non-stigma step ' + it.k); atoms.push({ story: sq(it.after), is: 'reached', basis: 'legacy' }); }
  if (ASC_STEP[it.k]) atoms.push({ player: 'Ascension Gauge at 100%', playerChecked: true, basis: 'legacy' });
  const comp = ['tick'];
  if (it.byStory) comp.push({ story: sq(it.story), is: 'turnedIn' });
  if (it.eput) comp.push({ done: null, note: 'E4 (eputSync1): done once stigma slot ' + it.eput + ' is marked equipped', __slot: it.eput });
  const s = { id: it.k, key: it.k, milestone: gid, order, ...(isGate ? { route: it.opt ? 'completionist' : 'core' } : {}),
    ...(it.ns ? { short: it.ns } : {}), text, ...(loc ? { loc } : {}), ...(it.note ? { note: it.note } : {}), ...(it.upsell ? { upsell: it.upsell } : {}),
    ...(it.opt ? { optional: true } : {}), ...(it.adv ? { advancedOnly: true } : {}), ...(it.map ? { mapSlug: it.map } : {}),
    ...(it.byStory ? { storyQuest: sq(it.story) } : {}), ...(it.stig ? { stigmaSlot: it.stig } : {}), ...(it.eput ? { stigmaKeySlot: it.eput } : {}),
    ...(it.bo ? { opensBoard: 'board:' + slug(it.bo) } : {}), ...(ASC_STEP[it.k] ? { ascensionQuest: ASC_STEP[it.k] } : {}),
    requires: atoms.length === 0 ? { all: [] } : atoms.length === 1 ? atoms[0] : { all: atoms }, completesWith: comp };
  const known = new Set(['k', 't', 'ns', 'note', 'upsell', 'opt', 'adv', 'map', 'story', 'after', 'turnedIn', 'byStory', 'stig', 'eput', 'bo']);
  for (const f of Object.keys(it)) if (!known.has(f)) throw new Error(`item field ${f} on ${it.k}`);
  return s;
};
TOK.milestones.GATES.forEach((g, gi) => {
  const m = { id: g.id, kind: 'milestone', order: (gi + 1) * 10, lv: g.lv, title: g.title, blurb: g.blurb };
  const inc = [];
  g.items.forEach((it, j) => {
    const order = (j + 1) * 10;
    if (it.__hideouts) inc.push({ sealedDungeonBand: +g.id.slice(1), order });
    else if (it.__dvNodes) G.DV_BOARDS[it.__dvNodes].nodes.forEach((n, k) => guideBuild.boardPlan.push(planEntry({ ...n, board: it.__dvNodes, blv: G.DV_BOARDS[it.__dvNodes].lv }, g.id, order + (k + 1) / 10)));
    else if (it.dv) guideBuild.boardPlan.push(planEntry(it, g.id, order));
    else steps.push(stepOf(it, g.id, order, g.lv, true));
  });
  if (inc.length) m.includes = inc;
  milestones.push(m);
});
TOK.milestones.STEPS.forEach((r, ri) => {
  milestones.push({ id: r.id, kind: 'routeRule', order: (ri + 1) * 10, title: r.title, blurb: r.blurb, tag: r.tag });
  r.items.forEach((it, j) => steps.push(stepOf(it, r.id, (j + 1) * 10, null, false)));
});
for (const s of steps) for (const c of s.completesWith) if (c && c.__slot) { c.done = steps.find(x => x.stigmaSlot === c.__slot).id; delete c.__slot; }

/* ------------------------------------------------------------------ tips */
const tips = Object.entries(TOK.tips.TIPS).map(([key, t]) => {
  let body = t.b;
  if (key === 'stcost') { const from = "<b>Plan:</b> Triniel's Dagger to 10, then Illusive Clone toward 20 (GamesFuze, Skycoach)", to = '<b>Plan:</b> [[build:stigma:1]] to [[build:stigmaTarget:1]], then [[build:stigma:2]] toward [[build:stigmaTarget:2]] (GamesFuze, Skycoach)';
    if (!body.includes(from)) throw new Error('stcost'); body = body.replace(from, to); }
  return { id: 'tip:' + key, key, title: t.h, body, credit: t.src, verifiedAt: DATE_HAND };
});

/* ------------------------------------------------------------------ confidence card (gen.py CONF, same conditions) */
const CONF_GROUPS = [['verified', 'Verified', 'two or more independent sources, or game data'], ['single-source', 'Single source', "shown, labelled where it's advice"],
  ['inferred', 'Inferred', "the guide's own reasoning; test it in game"], ['disputed', 'Disputed', 'sources disagree; the guide says which way it goes'],
  ['unverified', 'Unverified', 'no source found, so the guide leaves it out'], ['owner', 'From your game', 'seen in game, not in a source']].map(([id, title, sub]) => ({ id, title, sub }));
const CONF_ITEMS = [
  ['verified', 'unlock-levels', 'Unlock levels from the client-data table (Metabot, Wikily): enhancement 9; extraction, crafting, gathering 10; Supply Requests 25; daily dungeon 30; Abyss, Market, Ascension Trial, Conquest 45.', { C28a: 'verified' }],
  ['verified', 'regional', "Regional quests: giver, Kibelisk, rewards, recommended and unlock level from each quest's Metabot page; prerequisites (an earlier regional quest or a story quest) from aion2.gaming.tools and aion2.th.gl, cross-checked with allthings.how ({rqChained} follow-ups, {rqStoryGated} story-gated).", null, ['rqChained', 'rqStoryGated']],
  ['verified', 'story', 'Main story to "{storyEndQuest}" (Lv {storyEndLv}): objectives and Kibelisks from Metabot quest pages.', null, ['storyEndQuest', 'storyEndLv']],
  ['verified', 'stigmas', 'Stigma slots 22 / 27 / 32 / 37; every stigma learnable at 22; shard cost per level (Metabot, allthings.how). Upgrade plan: Triniel\'s Dagger to 10, then Illusive Clone toward 20 (GamesFuze, Skycoach).'],
  ['verified', 'skill-order-two-source', 'Skill points after the core eight: {skillOrderTwoSource} (GamesFuze, Skycoach). Per-level costs and gates from Metabot skill pages.', null, ['skillOrderTwoSource']],
  ['verified', 'boards', 'Five Daevanion boards on global: {boardList}; node costs 1 / 2 / 3 / 4.', { C22: 'verified' }, ['boardList']],
  ['verified', 'specialty-slots', 'Specialty slots at skill level 8 / 12 / 20.', { C03: 'verified' }],
  ['verified', 'sealed-dungeons', 'Sealed Dungeons are solo; every sampled band pays 2 Wisdom Stones + 2 crystals on the first clear (Metabot, allthings.how, AION2HUB).', { C12: 'verified' }],
  ['verified', 'strongholds', 'Strongholds pay belt scrolls and Kina, no Wisdom Stones or crystals (Metabot quest pages, AION2HUB, allthings.how, FandomWire).'],
  ['verified', 'expeditions', 'Expeditions: Urugugu Canyon 28 (item level 300, party 2–5) and Fire Temple 35 (item level 500); Conquest at 45.'],
  ['verified', 'duty', 'Duty Quests open at 45, 5 a day per server; Supply Requests (25) are a separate system.', { C15: 'verified', C28g: 'verified' }],
  ['verified', 'f2p', 'Free-to-play: the Market and the Kina/Quna exchange need the $15 subscription.', { C17: 'verified' }],
  ['verified', 'stat-tiers', 'Stat tiers: only stats that at least two of Metabot, games.gg and GamesFuze rank high (order inside a tier varies).'],
  ['single-source', 'abyss-points', 'Abyss Points: Stigma Shards first (KeenGamer).', { C07: 'single-source' }],
  ['single-source', 'belt-cost', 'Belt +10 (Rare) cost: 232,000 Kina and 9,280 Enhance Stones.', { C23: 'single-source' }],
  ['single-source', 'supply-details', 'Supply Request details (request types, deadlines).', { C16: 'single-source' }],
  ['single-source', 'level-points', 'Skill points per level 30–44 (Wikily; 203 at 45 has two sources).'],
  ['single-source', 'skill-order-single', 'Skill points after the four above: {skillOrderSingle} (games.gg).', null, ['skillOrderSingle']],
  ['inferred', 'core-order', 'Core skill-point order (Heart Gore, Insignia Explosion, Savage Roar, Quick Slice, Ambush, passives, Shadowstrike), ranked from per-level damage and cooldowns.'],
  ['inferred', 'key-stacks', 'Right-click row order and the E stack (buffs first).'],
  ['inferred', 'corners', "Vaizel and Triniel corner stats (Critical Damage Boost, Multi-Hit Chance), from each board's stat totals; Daevanion path costs."],
  ['inferred', 'stronghold-bands', "Stronghold level bands (zone plus the level range on Metabot's map)."],
  ['disputed', 'respec', 'Respec: free while you level; whether it costs Kina after 31 (MeinMMO vs allthings.how, ExitLag).', { C01: 'disputed' }],
  ['disputed', 'expedition-cap', 'Expedition weekly reward cap: 7 per dungeon (Metabot, KeenGamer) vs removed (games.gg; KR/TW).', { C11: 'disputed' }],
  ['disputed', 'stigma-order', 'Stigma slots 3 and 4: Swift Contract before Savage Fang (Metabot, Skycoach); GamesFuze has the reverse.'],
  ['disputed', 'first-nodes', "First Daevanion nodes (Metabot's class build vs its board guide, couga54, GamesFuze); the guide blends them. Which core skill first: Heart Gore (Metabot, GamesFuze) or Quick Slice (games.gg, ExpCarry)."],
  ['disputed', 'cash-shop', 'Cash shop: mostly cosmetic, but consumables and Daeva Pass materials exist (MassivelyOP, games.gg).', { C18: 'disputed' }],
  ['unverified', 'unlock-timing', 'Kibelisk and Command mission unlock levels.'],
  ['owner', 'heart-gore-ambush', '16 points to reach Heart Gore + Ambush on Nezekan.', { C28d: 'verified' }],
  ['owner', 'daevanion-points', 'Daevanion points: 4 per level past 11 (checked at 16 and 17).'],
  ['owner', 'macro-mp', 'Holding left click with the right-click macro keeps MP full.'],
];
const confidence = CONF_ITEMS.map(([group, id, text, when, placeholders], i) => ({ id: 'conf:' + id, group, order: (i + 1) * 10, text, ...(placeholders ? { placeholders } : {}), ...(when ? { when } : {}) }));

/* ------------------------------------------------------------------ claims (lines / edits retired: appliesTo replaces them) */
const plain = h => String(h).replace(/\[\[(?:tip|item|mapq):[^|\]]*\|([^\]]*)\]\]/g, '$1').replace(/\$\{T\("([^"]*)"[^}]*\}/g, '$1').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const TEXTS = [...steps.map(s => [s.id, [s.text, s.loc, s.note, s.upsell, s.short].filter(Boolean).join(' ')]), ...tips.map(t => [t.id, t.body]), ...confidence.map(c => [c.id, c.text]), ...milestones.map(m => [m.id, m.blurb])]
  .map(([id, t]) => [id, plain(t)]);
const claimHits = c => {
  if (!c.newText) return [];
  const nt = plain(c.newText);
  const frags = nt.split(/(?<=[.;:])\s+/).map(x => x.trim()).filter(x => x.length >= 18);
  return TEXTS.filter(([, t]) => frags.some(f => t.includes(f.slice(0, 40)))).map(([id]) => id);
};
for (const c of claimsJ) note('claim text match (review aid):', c.id, JSON.stringify(claimHits(c)));
/* appliesTo: which records (and, as page:<part>, which parts of the page markup in src/) each claim's text governs. Written
   from v1 lines / edits and the text match above; checked by the generator against the records' own claims lists. */
const traceZones = zones.filter(z => z.traces != null).map(z => z.id);
const APPLIES = {
  C01: ['build:2', 'tip:respec', 'conf:respec'], C03: ['build:1', 'tip:specialty', 'conf:specialty-slots', 'rule:specialty-slots'], C04: ['story'],
  C05: ['g45:0', 'asc:oath'], C06: ['g45:3'], C07: ['g45:4', 'conf:abyss-points'], C08: ['g45:5', 'tip:gearscore'], C09: ['tip:shugo'], C10: ['g37:2'],
  C11: ['tip:expedition', 'conf:expedition-cap'], C12: ['tip:hideout', 'conf:sealed-dungeons', 'rule:sd-first-clear-asmodian'],
  C13: ['g9:0', 'tip:stronghold', 'rule:sh-first-clear-asmodian'], C14: ['tip:regional'], C15: ['daily:1', 'tip:duty', 'conf:duty'], C16: ['tip:supply', 'conf:supply-details'],
  C17: ['f2p:0', 'conf:f2p'], C18: ['f2p:1', 'conf:cash-shop'], C19: ['daily:3'], C20: ['build:3', 'conf:stat-tiers', 'page:build-tab'], C21: ['page:rotation'],
  C22: ['g45:2', 'tip:daevanion', 'conf:boards', 'board:nezekan', 'board:zikel', 'board:vaizel', 'board:triniel', 'board:azphel'], C23: ['g16:amulet', 'conf:belt-cost'],
  C24: ['g12:belt'], C25: ['tip:traces'], C26: traceZones, C27: ['conf:daevanion-points'], C28a: ['conf:unlock-levels'], C28b: ['tip:stigma', 'conf:stigmas'],
  C28c: ['page:build-tab'], C28d: ['conf:heart-gore-ambush'], C28e: ['page:build-tab'], C28f: ['conf:daevanion-points', 'rule:crystals-per-level'],
  C28g: ['daily:0', 'conf:duty'], C28h: ['conf:unlock-timing'], C36: ['g32:dreams', 'asc:dreams'], C37: ['g45:0', 'asc:witnesses'],
};
const claims = claimsJ.map(c => {
  const cs = s => {
    if (typeof s === 'string') return ref(s) || { inferred: s };
    const extra = { ...(s.label ? { label: s.label } : {}) };
    const notes = [s.note];
    if (s.quote && s.quote.length > 240) notes.unshift('Quote (longer than a short credited quote): ' + s.quote); else if (s.quote) extra.quote = s.quote;
    let base;
    if (/^in-game/.test(s.url)) base = { inferred: `Seen in the owner's game (v1: "${s.url}"); no screen code yet (DATA-FORMAT-V2 §14.2).` };
    else if (/^data\/story\.json/.test(s.url)) { base = { url: 'https://metabot.gg/en/aion-2/quests/' + s.url.match(/: ([a-z-]+)\)/)[1] }; notes.push('v1 cited it as ' + s.url); }
    else { const r = ref(s.url); base = { url: r.url }; if (r.note || r.section) notes.push(r.note || r.section); }
    const n = notes.filter(Boolean).join(' · ');
    return { ...base, ...extra, ...(n ? { note: n } : {}) };
  };
  const r = { id: c.id, claim: c.claim, verdict: c.verdict, sources: c.sources.map(cs),
    action: c.action, ...(c.newText !== undefined ? { newText: c.newText.replace(/\$\{T\("([^"]*)", "([^"]*)"\)\}/g, '[[tip:$2|$1]]').replace(/\$\{I\("([^"]*)"\)\}/g, '[[item:$1]]') } : {}),   /* v1 template calls -> v2 tokens */ ...(c.note ? { note: c.note } : {}), ...(APPLIES[c.id] ? { appliesTo: APPLIES[c.id] } : {}), verifiedAt: D12 };
  if (c.action !== 'drop' && !APPLIES[c.id]) throw new Error('appliesTo missing ' + c.id);
  for (const s of c.sources) if (typeof s === 'object') for (const k of Object.keys(s)) if (!['url', 'quote', 'label', 'note'].includes(k)) throw new Error('claim source field ' + k);
  return r;
});
/* the claims field on every record a claim names (the generator checks both directions) */
const CLAIMABLE = [...steps, ...tips, ...rules, ...zones, ...boards, ...ascensionQuests];
for (const c of claims) for (const t of c.appliesTo || []) { const rec = CLAIMABLE.find(x => x.id === t); if (rec) rec.claims = [...new Set([...(rec.claims || []), c.id])].sort(); }

/* ------------------------------------------------------------------ retired keys, game builds */
const retired = { $schema: 'schema/retired.schema.json', schemaVersion: 2, keys: [
  { key: 'g45:1', retired: '2026-10-12', note: 'E1: removed milestone step; never reused (docs/ARCHITECTURE.md §1).' },
  { key: 'hold:0', retired: '2026-10-12', note: 'E1: removed route-rule item; never reused.' },
  ...Object.entries(V1.migrations.MIG_V5).map(([k, to]) => ({ key: k, retired: '2026-10-12', note: 'E1 position key; its ticks were copied to ' + to + ' (migV5).' })),
] };
const gameBuilds = [{ id: 'gb:metabot-0-0-4387-0', scheme: 'metabot', value: '0.0.4387.0', region: 'global', firstSeen: D14,
  note: "Shown on Metabot's Daevanion planner and skill pages, 2026-10-14. Mapping to the client's own numbering is open (data-sources T1)." }];

/* ------------------------------------------------------------------ §12.8: v1 files nothing read, compared with the v2 records */
for (const [n, a] of Object.entries(LOC1.areas)) {
  const d = sealedDungeons.find(x => x.name === n), sh = strongholds.find(x => x.name === n);
  const e = d ? d.entrance : sh ? sh.location : null;
  if (!e) { note('§12.8 locations.json areas: no v2 record for', n); continue; }
  if ((a.kib != null && a.kib !== e.kibelisk) || (a.m != null && a.m !== e.meters)) note('§12.8 locations.json areas differs:', n, JSON.stringify({ kib: a.kib, m: a.m }), 'v2', JSON.stringify({ kib: e.kibelisk, m: e.meters }));
  if (d && a.xp != null && d.xp !== a.xp) note('§12.8 locations.json areas xp differs:', n, a.xp, 'v2', d.xp);
}
for (const [n, a] of Object.entries(LOC1.quests)) {
  const q = regionalQuests.find(x => x.name === n);
  if (!q) { note('§12.8 locations.json quests: no v2 regional quest', n); continue; }
  for (const [k, v2] of [['kib', q.giver.kibelisk], ['m', q.giver.meters], ['giver', q.giver.npc], ['place', q.giver.place]]) if (a[k] != null && a[k] !== v2) note('§12.8 locations.json quests differs:', n, k, JSON.stringify(a[k]), 'v2', JSON.stringify(v2));
}
for (const x of CAQ.areas) { const k = V1.migrations.MIG_V5[x.k] || x.k, d = sealedDungeons.find(y => y.key === k); if (!d) { if (!/^sh:/.test(x.k)) note('§12.8 current-areas-quests areas: no v2 record for', x.k); continue; } if (HIDE[d.name] !== x.area) note('§12.8 current-areas-quests area differs:', k, x.area, 'v2', HIDE[d.name]); }
for (const x of CAQ.quests) { const q = regionalQuests.find(y => y.gameId === x.id); if (!q) note('§12.8 current-areas-quests quests: no v2 record for', x.k, x.name); }

/* ------------------------------------------------------------------ write */
const sh = (p, coll, recs, extra) => out(p, env(coll, recs, { ...extra, $depth: p.split('/').length - 1 }));
out('sources.json', env('sources', SITES, { pages: srcOld.map(x => ({ url: x.url, label: x.label, group: 'old' })) }));
out('game-builds.json', env('gameBuilds', gameBuilds));
out('retired.json', retired);
sh('shared/rules.json', 'rules', rules);
sh('shared/boards.json', 'boards', boards);
sh('shared/items.json', 'items', items);
sh('shared/asmodian/story-quests.json', 'storyQuests', storyQuests, { faction: 'asmodian' });
sh('shared/asmodian/ascension-quests.json', 'ascensionQuests', ascensionQuests, { faction: 'asmodian' });
sh('shared/asmodian/regional-quests.json', 'regionalQuests', regionalQuests, { faction: 'asmodian' });
sh('shared/asmodian/sealed-dungeons.json', 'sealedDungeons', sealedDungeons, { faction: 'asmodian' });
sh('shared/asmodian/strongholds.json', 'strongholds', strongholds, { faction: 'asmodian' });
sh('shared/asmodian/zones.json', 'zones', zones, { faction: 'asmodian' });
sh('shared/asmodian/unlocks.json', 'unlocks', unlocks, { faction: 'asmodian' });
sh('shared/asmodian/guide/milestones.json', 'milestones', milestones, { faction: 'asmodian' });
sh('shared/asmodian/guide/steps.json', 'steps', steps, { faction: 'asmodian' });
sh('shared/asmodian/guide/tips.json', 'tips', tips, { faction: 'asmodian' });
sh('shared/asmodian/guide/claims.json', 'claims', claims, { faction: 'asmodian' });
sh('shared/asmodian/guide/confidence.json', 'confidence', confidence, { faction: 'asmodian', groups: CONF_GROUPS });
sh(`classes/${CLS}/class.json`, 'classes', [classRec], { class: CLS });
sh(`classes/${CLS}/skills.json`, 'skills', skills, { class: CLS });
sh(`classes/${CLS}/stigmas.json`, 'stigmas', stigmas, { class: CLS });
sh(`classes/${CLS}/board-nodes.json`, 'boardNodes', boardNodes, { class: CLS });
sh(`classes/${CLS}/builds.json`, 'builds', [guideBuild], { class: CLS });
writeFileSync(join(ROOT, 'tools/history/v2-convert/conversion-log.txt'), LOG.join('\n') + '\n');
console.log(`v2 data written; ${LOG.length} conversion notes in tools/history/v2-convert/conversion-log.txt`);
