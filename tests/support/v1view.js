/* The v1-shaped view of the v2 data (data/**) that the older suites read as their oracle (e2, regress): the same fields
   data/rq.json, rq-chains.json, story-40-45.json, claims.json and build.json gave them before 0.2 step 5b, computed from
   the v2 records (not from the page). Synchronous, no dependencies. */
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const walk = d => fs.readdirSync(d).flatMap(n => { const f = path.join(d, n); return fs.statSync(f).isDirectory() ? walk(f) : [f]; });
const DATA_FILES = walk(path.join(ROOT, 'data')).filter(f => f.endsWith('.json') && !/[\\/]data[\\/](schema|research)[\\/]/.test(f));
const docs = DATA_FILES.map(f => JSON.parse(fs.readFileSync(f, 'utf8')));
const recs = c => docs.filter(d => d.collection === c).flatMap(d => d.records);
const atoms = c => !c ? [] : c.all ? c.all.flatMap(atoms) : c.any ? c.any.flatMap(atoms) : [c];
const zones = Object.fromEntries(recs('zones').map(z => [z.id, z.name]));
const story = recs('storyQuests'), sq = Object.fromEntries(story.map(s => [s.id, s]));
const rqs = recs('regionalQuests').slice().sort((a, b) => a.order - b.order), rqById = Object.fromEntries(rqs.map(q => [q.id, q]));
const rq = rqs.map(q => { const none = q.requiresBasis === 'unresearched';
  return { name: q.name, id: q.gameId, rec: q.rec, unlocksAt: q.unlocksAt, zone: zones[q.zone], requiresStory: none ? null : [], requiresRegional: none ? null : [] }; });
const chains = rqs.flatMap(q => atoms(q.requires).flatMap(a => a.done ? [{ quest: q.name, after: rqById[a.done].name, kind: 'regional' }]
  : a.story ? [{ quest: q.name, after: sq[a.story].name, kind: 'story', storyId: sq[a.story].gameId }] : []));
const story45 = Object.fromEntries(story.filter(s => s.lv > 40).map(s => [s.name, { lv: s.lv, next: s.next && sq[s.next] && sq[s.next].lv > 40 ? sq[s.next].name : null }]));
const edits = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests', 'fixtures', 'claims-v1-edits.json'), 'utf8')).claims;
const claims = recs('claims').map(c => ({ ...c, edits: (edits.find(e => e.id === c.id) || {}).edits || [] }));
const build = recs('builds').find(b => b.origin === 'guide'), skills = Object.fromEntries(recs('skills').map(s => [s.id, s.name]));
const urls = new Set(); const w = v => { if (typeof v === 'string') (v.match(/https?:\/\/[^\s)\]'"]+/g) || []).forEach(u => urls.add(u.replace(/[.,;]+$/, ''))); else if (v && typeof v === 'object') Object.values(v).forEach(w); };
docs.filter(d => d.collection !== 'sources').forEach(d => w(d.records)); docs.filter(d => d.collection === 'sources').forEach(d => w(d.pages || []));
module.exports = { rq, chains, story45, claims, build: { spOrderAfterCore: { order: build.skillOrder.filter(e => !e.core).map(e => skills[e.skill]) } }, dataUrls: urls };
