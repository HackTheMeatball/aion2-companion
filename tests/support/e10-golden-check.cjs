#!/usr/bin/env node
/* Golden review helper for the 0.3 E10 PR (issue #108; not a suite). E10 changes the catalog (a 87th story quest, g45:0 ->
   g45:witness), so the generated saves change and golden --explain, which treats any input change as an error, can't
   attribute them. This checks the input-changed states directly, base build (main, in tests/out/main-wt: `git worktree add
   --detach tests/out/main-wt main`, then `node tests/out/main-wt/scripts/build.mjs`) against this branch's dist/:
     1. same state id, new input: the two saves differ only by checks["g45:0"] (base) <-> checks["g45:witness"] (branch),
        and the stored saves after load are equal once g45:witness is renamed back (checks and mt.checks); the one expected
        exception is special/story-end-turned-in (the last quest is Daeva Trapped now);
     2. ids that moved one story index (the Lv 45 states sit on the last quest, and random recipes draw from 87 quests):
        each pair writes the same paths after load, apart from open.<milestone> view flags (auto-open of a milestone that is
        next / Missed: a view setting, not progress; golden/explain.js allows the same class).
   Usage: npm run build && node tests/support/e10-golden-check.cjs */
const path = require('path'), fs = require('fs'), http = require('http');
const ROOT = path.join(__dirname, '../..');
const { chromium } = require('playwright');
const { catalogInPage, generate } = require('../golden/states.js');
const { installProbe, storeDiff } = require('../golden/probe.js');
const KEY = 'aion2-assassin-route-v4', NOW = new Date('2026-10-01T12:00:00Z');
const EXPECTED_INPUT = ['special/story-end-turned-in'];
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
  const states = {}, pages = {};
  for (const w of ['base', 'branch']) {
    const ctx = await b.newContext({ serviceWorkers: 'block' }); await ctx.clock.setFixedTime(NOW); await ctx.addInitScript(installProbe, [KEY, true]);
    const p = await ctx.newPage(); await p.goto(srv[w].url);
    states[w] = Object.fromEntries(generate(await p.evaluate(catalogInPage), { fixtures }).map(s => [s.id, s.raw])); pages[w] = p;
  }
  const load = async (w, raw) => { const p = pages[w];
    await p.evaluate(([k, r]) => { localStorage.clear(); if (r !== null) localStorage.setItem(k, r); }, [KEY, raw]);
    await p.reload({ waitUntil: 'commit' }); return p.evaluate(() => window.__golden); };
  const bad = [];

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
  console.log(`1. same id, new input: ${same.length} states (${EXPECTED_INPUT.length} expected: ${EXPECTED_INPUT.join(', ')}); ` +
    `inputs differ only by g45:0 -> g45:witness: ${renamed}; stored save after load equal up to that rename: ${storedEq}`);

  /* 2. ids moved one story index */
  const up = id => id.replace(/-q(\d+)-/, (m, n) => `-q${+n + 1}-`);
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
  bad.forEach(x => console.log('   ' + x));
  console.log(bad.length ? `E10 GOLDEN CHECK FAILED (${bad.length})` : 'E10 GOLDEN CHECK PASSED');
  await b.close(); Object.values(srv).forEach(x => x.s.close());
  process.exit(bad.length ? 1 : 0);
})();
