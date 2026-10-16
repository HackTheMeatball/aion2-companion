#!/usr/bin/env node
/* Golden review helper for the 0.3 E10 PR (issue #108; not a suite). E10 changes the catalog (a 87th story quest, g45:0 ->
   g45:witness), so the generated saves change and golden --explain, which treats any input change as an error, can't
   attribute them. This checks the states directly, base build (the branch's merge base with main, in tests/out/main-wt:
   `git worktree add --detach tests/out/main-wt $(git merge-base origin/main HEAD)`, then
   `node tests/out/main-wt/scripts/build.mjs`) against this branch's dist/ and recorded snapshots:
     0. behaviour changes, from the snapshots (base tests/golden/snapshots vs this branch's): same id, same input hash,
        different output. All must be on "Forgotten Commander" (the quest that now has a next quest), with no store diff;
     1. same state id, new input: the two saves differ only by checks["g45:0"] (base) <-> checks["g45:witness"] (branch),
        and the stored saves after load are equal once g45:witness is renamed back (checks and mt.checks); the one expected
        exception is special/story-end-turned-in (the last quest is Daeva Trapped now);
     2. ids that moved one story index (the Lv 45 states sit on the last quest, and random recipes draw from 87 quests):
        each pair writes the same paths after load, apart from open.<milestone> view flags (auto-open of a milestone that is
        next / Missed: a view setting, not progress; golden/explain.js allows the same class).
   Each category's count is asserted against EXPECT (the numbers in PR #113); any mismatch or bad state exits 1.
   Usage: npm run build && node tests/support/e10-golden-check.cjs */
const path = require('path'), fs = require('fs'), http = require('http');
const ROOT = path.join(__dirname, '../..');
const { chromium } = require('playwright');
const { catalogInPage, generate } = require('../golden/states.js');
const { installProbe, storeDiff } = require('../golden/probe.js');
const KEY = 'aion2-assassin-route-v4', NOW = new Date('2026-10-01T12:00:00Z');
const EXPECTED_INPUT = ['special/story-end-turned-in'];
/* behaviour: same input, new output; rename: new input that is only the g45 rename; storyEnd: EXPECTED_INPUT;
   indexShift: ids moved one story index (86 -> 87 quests); storeDiffs: same-input states whose stored save changed */
const EXPECT = { behaviour: 4, rename: 70, storyEnd: 1, indexShift: 343, newQuest: 4, displaced: 4, storeDiffs: 0 };
const BEHAVIOUR_QUEST = 'Forgotten Commander';
const loadSnaps = d => Object.assign({}, ...fs.readdirSync(d).filter(f => f.endsWith('.json')).sort().map(f => JSON.parse(fs.readFileSync(path.join(d, f), 'utf8'))));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const serve = dir => new Promise(res => { const s = http.createServer((q, r) => { let f = path.join(dir, decodeURIComponent(new URL(q.url, 'http://x').pathname)); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); r.end(fs.readFileSync(f)); }).listen(0, '127.0.0.1', () => res({ s, url: `http://127.0.0.1:${s.address().port}/` })); });
const isO = x => x && typeof x === 'object' && !Array.isArray(x);
const C = x => JSON.stringify(x, (k, v) => isO(v) ? Object.fromEntries(Object.keys(v).sort().map(j => [j, v[j]])) : v);
const renameBack = o => { if (!o) return o; o = JSON.parse(JSON.stringify(o));
  for (const m of [o.checks, o.mt && o.mt.checks]) if (m && 'g45:witness' in m) { m['g45:0'] = m['g45:witness']; delete m['g45:witness']; } return o; };

(async () => {
  const srv = { base: await serve(path.join(ROOT, 'tests/out/main-wt/dist')), branch: await serve(path.join(ROOT, 'dist')) };
  const b = await chromium.launch();
  const fixtures = ['fixture-v285.json', 'fixture-user-v285.json'].map(f => ({ name: f.replace(/\.json$/, ''), raw: JSON.stringify(JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/fixtures', f), 'utf8'))) }));
  const states = {}, pages = {}, cats = {};
  for (const w of ['base', 'branch']) {
    const ctx = await b.newContext({ serviceWorkers: 'block' }); await ctx.clock.setFixedTime(NOW); await ctx.addInitScript(installProbe, [KEY, true]);
    const p = await ctx.newPage(); await p.goto(srv[w].url); cats[w] = await p.evaluate(catalogInPage);
    states[w] = Object.fromEntries(generate(cats[w], { fixtures }).map(s => [s.id, s.raw])); pages[w] = p;
  }
  const load = async (w, raw) => { const p = pages[w];
    await p.evaluate(([k, r]) => { localStorage.clear(); if (r !== null) localStorage.setItem(k, r); }, [KEY, raw]);
    await p.reload({ waitUntil: 'commit' }); return p.evaluate(() => window.__golden); };
  const bad = [], got = {};

  /* 0. behaviour changes (same input), from the recorded snapshots */
  const snapA = loadSnaps(path.join(ROOT, 'tests/out/main-wt/tests/golden/snapshots')), snapB = loadSnaps(path.join(ROOT, 'tests/golden/snapshots'));
  const beh = Object.keys(snapB).filter(id => id in snapA && snapA[id].in === snapB[id].in && C(snapA[id]) !== C(snapB[id]));
  const storeD = beh.filter(id => C(snapA[id].store) !== C(snapB[id].store));
  for (const id of beh) { const q = states.branch[id] ? (JSON.parse(states.branch[id]) || {}).quest : undefined;
    if (q !== BEHAVIOUR_QUEST) bad.push(`${id}: behaviour change on "${q}", not "${BEHAVIOUR_QUEST}"`); }
  got.behaviour = beh.length; got.storeDiffs = storeD.length;
  console.log(`0. behaviour changes (same input): ${beh.length} states (${beh.join(', ')}); with a stored-state diff: ${storeD.length}`);

  /* 1. same id, new input */
  const same = Object.keys(states.branch).filter(id => id in states.base && states.base[id] !== states.branch[id]);
  let renamed = 0, storedEq = 0;
  for (const id of same) {
    if (EXPECTED_INPUT.includes(id)) continue;
    if (C(renameBack(JSON.parse(states.branch[id]))) !== C(JSON.parse(states.base[id]))) { bad.push(`${id}: inputs differ beyond the g45 rename`); continue; }
    renamed++;
    const oa = await load('base', states.base[id]), ob = await load('branch', states.branch[id]);
    const sa = oa.stored == null ? null : JSON.parse(oa.stored), sb = ob.stored == null ? null : JSON.parse(ob.stored);
    if (C(renameBack(sb)) === C(sa)) storedEq++; else bad.push(`${id}: stored save after load differs beyond the rename: ${JSON.stringify(storeDiff(JSON.stringify(sa), JSON.stringify(renameBack(sb)))).slice(0, 300)}`);
  }
  const storyEnd = same.filter(id => EXPECTED_INPUT.includes(id));
  if (storyEnd.length !== EXPECTED_INPUT.length) bad.push(`expected new input in ${EXPECTED_INPUT.join(', ')}, found it in ${storyEnd.join(', ') || 'none'}`);
  if (storedEq !== renamed) bad.push(`stored save equal up to the rename in ${storedEq} of ${renamed} renamed states`);
  got.rename = renamed; got.storyEnd = storyEnd.length;
  console.log(`1. same id, new input: ${same.length} states (${EXPECTED_INPUT.length} expected: ${EXPECTED_INPUT.join(', ')}); ` +
    `inputs differ only by g45:0 -> g45:witness: ${renamed}; stored save after load equal up to that rename: ${storedEq}`);

  /* 2. ids moved one story index */
  const up = id => id.replace(/-q(\d+)-/, (m, n) => `-q${String(+n + 1).padStart(n.length, '0')}-`);
  const moved = Object.keys(states.base).filter(id => !(id in states.branch)).map(id => [id, up(id)]).filter(([, n]) => n in states.branch);
  const gone = Object.keys(states.base).filter(id => !(id in states.branch) && !(up(id) in states.branch));
  const added = Object.keys(states.branch).filter(id => !(id in states.base) && !moved.some(([, n]) => n === id));
  let samePaths = 0; const flags = [];
  for (const [o, n] of moved) {
    const oa = await load('base', states.base[o]), ob = await load('branch', states.branch[n]);
    const pa = Object.keys(storeDiff(states.base[o], oa.stored) || {}), pb = Object.keys(storeDiff(states.branch[n], ob.stored) || {});
    if (pa.sort().join() === pb.sort().join()) { samePaths++; continue; }
    const only = [...pa.filter(x => !pb.includes(x)), ...pb.filter(x => !pa.includes(x))];
    if (only.every(x => /^open\.g\d+$/.test(x))) flags.push(`${o} -> ${n}: ${only.join(', ')}`); else bad.push(`${o} -> ${n}: written paths differ: ${only.join(', ')}`);
  }
  console.log(`2. ids moved one story index: ${moved.length} pairs (unpaired: ${gone.length} removed, ${added.length} added); same written paths after load in ` +
    `${samePaths}; view flags only (open.<milestone>) in ${flags.length}`);
  flags.forEach(x => console.log('   view flag: ' + x));
  [...gone.map(x => 'removed ' + x), ...added.map(x => 'added ' + x)].forEach(x => console.log('   unpaired ' + x));
  /* the set is filled with random states up to a fixed size, so each new story state on the new last quest (q86) displaces
     one of the last random recipes. The base set made with that many extra (dummy) fixtures has exactly those removed. */
  const pad = Array.from({ length: added.length }, (_, i) => ({ name: 'e10-pad-' + i, raw: '{}' }));
  const short = new Set(generate(cats.base, { fixtures: [...fixtures, ...pad] }).map(s => s.id));
  const tail = Object.keys(states.base).filter(id => id.startsWith('random/') && !short.has(id));
  if (!added.every(id => /^story\/L4[45]-q86-/.test(id))) bad.push(`added states not all story states on the new quest: ${added.join(', ')}`);
  if (C(gone.slice().sort()) !== C(tail.sort())) bad.push(`removed states are not the last ${added.length} random recipes: ${gone.join(', ')} vs ${tail.join(', ')}`);
  got.indexShift = moved.length; got.newQuest = added.length; got.displaced = gone.length;
  if (samePaths + flags.length !== moved.length) bad.push(`index shift: ${moved.length - samePaths - flags.length} pairs write different paths`);

  /* the stated counts */
  for (const k of Object.keys(EXPECT)) { const ok = got[k] === EXPECT[k]; console.log(`   ${ok ? 'ok  ' : 'FAIL'} ${k}: ${got[k]} (expected ${EXPECT[k]})`); if (!ok) bad.push(`${k}: ${got[k]}, expected ${EXPECT[k]}`); }
  bad.forEach(x => console.log('   ' + x));
  console.log(bad.length ? `E10 GOLDEN CHECK FAILED (${bad.length})` : 'E10 GOLDEN CHECK PASSED');
  await b.close(); Object.values(srv).forEach(x => x.s.close());
  process.exit(bad.length ? 1 : 0);
})();
