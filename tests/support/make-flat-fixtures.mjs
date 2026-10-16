#!/usr/bin/env node
/* Makes the flat fixtures (tests/fixtures/*.flat.json, 0.4 P3a) from the pre-0.3 saves in tests/fixtures. Each one is
   made the way its suite loaded the old save before P3a: straight into the current page (golden's fixed clock) or
   through the v285 baseline first, then the current page; the fixture is the save the current build stores after its
   load steps (migrations included). The suites seed from these through tests/support/save.js, so they no longer rely
   on the app's migrations (P3c removes them). mig1 / mig2 keep loading the old saves into the old baselines.

   Usage (after `npm run build`): node tests/support/make-flat-fixtures.mjs           write the fixtures
                                  node tests/support/make-flat-fixtures.mjs --check   write nothing: for every fixture
     and every way a suite seeds from it, the page's in-memory state from the old route must equal the one from the
     fixture (the backup baseline `backup.since` is the load time either way and is compared as "set"), and a fixture
     that is already committed must equal a fresh one.

   `backup` and `backup1` are left out of every fixture: they are this browser's backup times (0.2.5), which the page
   sets again on load (backup1) exactly as it did for the old save. Kept, they would freeze the export nudge's 14-day
   baseline at the day the fixture was made, and suites on the real clock would show the nudge two weeks later. */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { startServer } from '../../scripts/serve.mjs';

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..'), FIX = join(ROOT, 'tests', 'fixtures');
const { V4_KEY, writeSave, writeRaw, readRaw, readSave, clearSave } = require('./save');
const { installProbe } = require('../golden/probe');
const { migMetrics } = require('./regress-fixture');
const CHECK = process.argv.includes('--check');
const GOLDEN_NOW = new Date('2026-10-01T12:00:00Z'); /* tests/golden.js FIXED_NOW */
const old = f => readFileSync(join(FIX, f), 'utf8');

/* tests/regress.js "user-realistic": the v285 fixture made into the user's Lv 27 save, on a given story quest */
function regressUser(quest) {
  const user = JSON.parse(old('fixture-v285.json'));
  Object.assign(user, { level: 27, quest: 'Preparations for Restoration', stShards: 0, stones: 58, dvTotal: 114, stLv: { "Triniel's Dagger": 4 }, pendSt: 0, pendCr: 0, open: {}, areaRun: {} });
  Object.assign(user.checks, { 'g22:3': true, 'g22:4': false, 'g22:5': true, 'g22:6': false, 'g22:7': false, 'g27:3': false, 'g22:1': true, 'g22:0': true });
  user.started = { ...user.started, 'g22:4': 1, 'g22:6': 1, 'g22:7': 1 }; delete user.started['g30:13']; /* base fixture's Lv 30 quest in progress isn't his */
  ['dv:ew2', 'dv:as', 'dv:as2', 'dv:corner', 'dv:ie', 'dv:ss', 'dv:z:ie', 'dv:z:qs', 'dv:z:db', 'dv:z:db2', 'dv:z:corner'].forEach(k => { user.checks[k] = true; user.dvCost[k] = 7; });
  return JSON.stringify({ ...user, quest });
}

/* route 'direct': into the current page as tests/golden.js loads a state (fixed clock, probe: the stored state once the
   start-up's toggle saves have drained). route 'v285': into the v285 baseline, reload, then the current page (journey,
   regress, tests/lib.js). `uses`: how the suites seed from the fixture (mod: changes made to the save first; mode:
   a11y sets it), each checked by --check against the old route with the same change. */
const FIXTURES = [
  { file: 'fixture-v285.flat.json', raw: () => JSON.stringify(JSON.parse(old('fixture-v285.json'))), route: 'direct',
    suites: 'golden, equiv, invariant (fixture/fixture-v285), e1 (import), tests/support/e10-golden-check.cjs', uses: [{}] },
  { file: 'fixture-user-v285.flat.json', raw: () => JSON.stringify(JSON.parse(old('fixture-user-v285.json'))), route: 'direct',
    suites: 'golden, equiv, invariant (fixture/fixture-user-v285), a11y (Lv 27 user), tests/support/e10-golden-check.cjs',
    uses: [{}, { mode: 'advanced' }, { mode: 'basic' }, { mode: 'advanced', mod: { level: 35, stones: 0, dvTotal: 10 } }] },
  { file: 'fixture-user-v285.via-v285.flat.json', raw: () => old('fixture-user-v285.json'), route: 'v285', suites: 'journey, tests/lib.js', uses: [{}] },
  { file: 'fixture-v285.via-v285.flat.json', raw: () => old('fixture-v285.json'), route: 'v285', metrics: 'fixture-v285.v285-metrics.json',
    suites: 'regress (migration: v285 fixture → current)', uses: [{}] },
  { file: 'regress-user-prep.via-v285.flat.json', raw: () => regressUser('Preparations for Restoration'), route: 'v285', suites: 'regress (user-prep)', uses: [{}] },
  { file: 'regress-user-collective.via-v285.flat.json', raw: () => regressUser('A Collective Effort'), route: 'v285', suites: 'regress (user-collective)', uses: [{}] },
];

const { server, url } = await startServer({ baselines: true });
const CUR = url + '/', V285 = url + '/__baselines/v285.html';
const b = await chromium.launch();
const ctxFor = async route => {
  const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 }, serviceWorkers: 'block' });
  if (route === 'direct') { await ctx.clock.setFixedTime(GOLDEN_NOW); await ctx.addInitScript(installProbe, [V4_KEY, true]); }
  return ctx;
};
/* the old route: the pre-0.3 text in, the current page's stored save and in-memory state out (v4 key: that is what
   these saves and the baseline use; the current page reads the same key today) */
async function oldRoute(fx, use = {}) {
  const ctx = await ctxFor(fx.route), p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
  let raw = fx.raw(), metrics = null, stored;
  if (use.mod || use.mode) raw = JSON.stringify({ ...JSON.parse(raw), ...use.mod, ...(use.mode ? { mode: use.mode } : {}) });
  if (fx.route === 'direct') {
    await p.goto(CUR, { waitUntil: 'domcontentloaded' }); await writeRaw(p, raw, { key: V4_KEY, fresh: true });
    await p.reload({ waitUntil: 'commit' }); const o = await p.evaluate(() => window.__golden); if (o.err.length) errs.push(...o.err);
    stored = o.stored;
  } else {
    await p.goto(V285); await writeRaw(p, raw, { key: V4_KEY }); await p.reload(); await p.waitForTimeout(400);
    if (fx.metrics) metrics = await p.evaluate(migMetrics);
    await p.goto(CUR); await p.waitForTimeout(700);
    stored = await readRaw(p, { key: V4_KEY });
  }
  const mem = await p.evaluate(() => JSON.stringify(state));
  await ctx.close();
  if (errs.length) throw new Error(`${fx.file}: page errors on the old route: ${errs.join(' | ')}`);
  return { stored: JSON.parse(stored), mem: JSON.parse(mem), metrics };
}
/* the new route: the flat fixture (plus the use's change) written through save.js into the current page */
async function newRoute(fx, flat, use = {}) {
  const ctx = await ctxFor(fx.route), p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(CUR, { waitUntil: 'domcontentloaded' }); await clearSave(p);
  await writeSave(p, { ...flat, ...use.mod, ...(use.mode ? { mode: use.mode } : {}) });
  if (fx.route === 'direct') { await p.reload({ waitUntil: 'commit' }); await p.evaluate(() => window.__golden); }
  else { await p.reload(); await p.waitForTimeout(700); }
  const mem = JSON.parse(await p.evaluate(() => JSON.stringify(state))), stored = await readSave(p);
  await ctx.close();
  if (errs.length) throw new Error(`${fx.file}: page errors with the flat fixture: ${errs.join(' | ')}`);
  return { mem, stored };
}
const flatOf = stored => { const s = { ...stored }; delete s.backup; delete s.backup1; return s; };
/* backup.since is the load time: compared as present / absent. With a change made to the save first (use.mod), the
   change times of the changed fields differ by design: the old route stamps them at 0 with everything else (stampV1 on
   the first load), the fixture route with the load time (the re-stamp of a change made outside the app). They are
   compared as present; every other stamp must be equal. The page doesn't read mt (src/core/sync.js). */
const norm = (st, use = {}) => { const s = { ...st };
  if (s.backup) s.backup = { ...s.backup, ...(s.backup.since ? { since: 'set' } : {}) };
  if (use.mod && s.mt) { s.mt = { ...s.mt }; for (const k of Object.keys(use.mod)) if (k in s.mt) s.mt[k] = 'stamped'; }
  return JSON.stringify(s); };

let bad = 0;
for (const fx of FIXTURES) {
  const o = await oldRoute(fx), flat = flatOf(o.stored), text = JSON.stringify(flat, null, 1) + '\n';
  if (!CHECK) {
    writeFileSync(join(FIX, fx.file), text);
    if (fx.metrics) writeFileSync(join(FIX, fx.metrics), JSON.stringify(o.metrics, null, 1) + '\n');
    console.log(`wrote tests/fixtures/${fx.file}${fx.metrics ? ' and ' + fx.metrics : ''} (${fx.suites})`);
    continue;
  }
  const committed = existsSync(join(FIX, fx.file)) ? readFileSync(join(FIX, fx.file), 'utf8') : null;
  if (committed !== text) { bad++; console.log(`FAIL ${fx.file}: the committed fixture differs from a fresh one`); }
  if (fx.metrics && (!existsSync(join(FIX, fx.metrics)) || readFileSync(join(FIX, fx.metrics), 'utf8') !== JSON.stringify(o.metrics, null, 1) + '\n')) { bad++; console.log(`FAIL ${fx.metrics}: differs from the v285 page's metrics`); }
  for (const use of fx.uses) {
    const a = (use.mod || use.mode) ? await oldRoute(fx, use) : o, n = await newRoute(fx, JSON.parse(committed || text), use);
    const same = norm(a.mem, use) === norm(n.mem, use);
    if (!same) bad++;
    console.log(`${same ? 'ok  ' : 'FAIL'} ${fx.file} ${JSON.stringify(use)}: in-memory state ${same ? 'equals' : 'differs from'} the old route's (${fx.suites})`);
    if (!same) for (const k of new Set([...Object.keys(a.mem), ...Object.keys(n.mem)])) if (JSON.stringify(a.mem[k]) !== JSON.stringify(n.mem[k])) console.log(`     ${k}: ${JSON.stringify(a.mem[k]).slice(0, 200)} -> ${JSON.stringify(n.mem[k]).slice(0, 200)}`);
  }
}
await b.close(); server.close();
if (CHECK) console.log(bad ? `FLAT FIXTURES CHECK FAILED (${bad})` : 'FLAT FIXTURES CHECK PASSED');
process.exit(bad ? 1 : 0);
