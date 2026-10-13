/* Golden master harness (architecture audit phase P0). See tests/golden/README.md.

   Loads dist/index.html once per generated save state (~2,000 states, tests/golden/states.js) and records what the app
   decides: the Next up stack, milestone headers, the Journey card, the Dungeons & Strongholds card and the stored state
   after load (tests/golden/probe.js). Snapshots live in tests/golden/snapshots/*.json.

   Usage (after `npm run build`; tests/run.mjs runs it as suite `golden`):
     node tests/golden.js              verify: diff against the snapshots, print a summary grouped by kind of change, exit 1 on any
     node tests/golden.js --record     write the snapshots and tests/golden/KNOWN-VIOLATIONS.md (prints the same summary first)
     options: --all (also the extended random set, ~6,000 more states) · --jobs N (parallel pages, default 3)
              --filter <regex> (only states whose id matches; verify ignores the rest) · --limit N (first N states, smoke runs)
              --render (let the page render; slower. The default hides the page so no layout runs; --render must give
              identical snapshots, which shows the recorded state doesn't depend on layout)
   Output: tests/out/golden/diff.md and diff.json (every changed state, before/after per field). */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { chromium } = require('playwright');
const CFG = require('./config');
const { catalogInPage, generate } = require('./golden/states');
const { installProbe, storeDiff } = require('./golden/probe');
const { findViolations, renderReport } = require('./golden/violations');

const KEY = 'aion2-assassin-route-v4';
const DIR = path.join(CFG.ROOT, 'tests', 'golden'), SNAP = path.join(DIR, 'snapshots'), OUT = path.join(CFG.OUT, 'golden');
const VIOL = path.join(DIR, 'KNOWN-VIOLATIONS.md');
const args = process.argv.slice(2), flag = n => args.includes('--' + n), opt = n => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : null; };
const RECORD = flag('record'), ALL = flag('all'), JOBS = Math.max(1, +(opt('jobs') || process.env.GOLDEN_JOBS || 3));
const RENDER = flag('render');
const FILTER = opt('filter') ? new RegExp(opt('filter')) : null, LIMIT = opt('limit') ? +opt('limit') : 0;
const RECYCLE = 150;
const FIXED_NOW = new Date('2026-10-01T12:00:00Z'); /* the page sees this as "now" (Date.now / new Date) */

/* ---------- serialisation: canonical (sorted keys) for hashing/comparing; line-oriented pretty form for the files ---------- */
const canon = x => JSON.stringify(x, (k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(j => [j, v[j]])) : v);
const hash = s => crypto.createHash('sha1').update(s == null ? '(no save)' : canon(JSON.parse(s))).digest('hex').slice(0, 12);
/* objects/arrays are expanded down to depth 2 (state -> field -> entry); anything deeper stays on one line */
function pretty(x, d = 0) {
  const ind = '  '.repeat(d + 1), end = '  '.repeat(d);
  if (d > 2 || x === null || typeof x !== 'object') return JSON.stringify(x);
  if (Array.isArray(x)) return x.length ? '[\n' + x.map(v => ind + pretty(v, d >= 2 ? 3 : d + 1)).join(',\n') + '\n' + end + ']' : '[]';
  const ks = Object.keys(x); return ks.length ? '{\n' + ks.map(k => ind + JSON.stringify(k) + ': ' + pretty(x[k], d + 1)).join(',\n') + '\n' + end + '}' : '{}';
}
/* shard file per group and level band, so adding a state never moves other states between files */
const shardOf = id => { const [g, rest] = id.split('/'); const m = /^L(\d+)/.exec(rest || ''); if (!m) return g; const b = Math.floor((+m[1] - 1) / 5) * 5 + 1; return `${g}-L${String(b).padStart(2, '0')}-${String(b + 4).padStart(2, '0')}`; };
const FIELD_ORDER = ['in', 'nu', 'ms', 'rt', 'jr', 'reg', 'store', 'keys', 'err', 'mode'];

function loadSnapshots() {
  const snaps = {};
  if (!fs.existsSync(SNAP)) return snaps;
  for (const f of fs.readdirSync(SNAP).filter(f => f.endsWith('.json')).sort()) Object.assign(snaps, JSON.parse(fs.readFileSync(path.join(SNAP, f), 'utf8')));
  return snaps;
}
function writeSnapshots(results, ids) {
  fs.mkdirSync(SNAP, { recursive: true });
  const shards = {};
  for (const id of ids) (shards[shardOf(id)] = shards[shardOf(id)] || {})[id] = results[id];
  /* a full core run replaces every core shard; extended (xrandom) shards are only replaced by an --all run */
  for (const f of fs.readdirSync(SNAP).filter(f => f.endsWith('.json'))) if (!shards[f.slice(0, -5)] && (ALL || !f.startsWith('xrandom'))) fs.unlinkSync(path.join(SNAP, f));
  let bytes = 0;
  for (const [name, obj] of Object.entries(shards)) { const s = pretty(obj) + '\n'; bytes += s.length; fs.writeFileSync(path.join(SNAP, name + '.json'), s); }
  return { files: Object.keys(shards).length, bytes };
}

/* ---------- diff, grouped by kind of change ---------- */
const norm = s => String(s).replace(/\d+/g, '#');
function describe(a, b) {
  const out = []; /* [descriptor, detail] */
  if (!a) return [['state added (new in the generator)', '']];
  if (!b) return [['state removed from the generator', '']];
  if (a.in !== b.in) out.push(['input: generated save changed (catalog or generator)', `${a.in} -> ${b.in}`]);
  if (canon(a.nu) !== canon(b.nu)) {
    const ta = (a.nu || []).map(c => c.t), tb = (b.nu || []).map(c => c.t);
    const gone = ta.filter(t => !tb.includes(t)), added = tb.filter(t => !ta.includes(t));
    gone.forEach(t => out.push([`Next up: card removed: ${norm(t)}`, t]));
    added.forEach(t => out.push([`Next up: card added: ${norm(t)}`, t]));
    (b.nu || []).forEach(cb => { const ca = (a.nu || []).find(c => c.t === cb.t); if (!ca || canon(ca) === canon(cb)) return;
      for (const f of ['s', 'c', 'f', 'i', 'x', 'o']) if (canon(ca[f]) !== canon(cb[f])) out.push([`Next up: card "${norm(cb.t)}" field ${f} changed`, `${JSON.stringify(ca[f])} -> ${JSON.stringify(cb[f])}`]); });
    const common = ta.filter(t => tb.includes(t)), commonB = tb.filter(t => ta.includes(t));
    if (!gone.length && !added.length && canon(common) !== canon(commonB)) out.push(['Next up: same cards, new order', `${ta.join(' / ')} -> ${tb.join(' / ')}`]);
    if (ta[0] !== tb[0]) out.push([`Next up: top card ${norm(ta[0] || '(none)')} -> ${norm(tb[0] || '(none)')}`, '']);
  }
  const byId = xs => Object.fromEntries((xs || []).map(s => [s.split(' | ')[0], s.split(' | ')]));
  for (const f of ['ms', 'rt']) if (canon(a[f]) !== canon(b[f])) {
    const A = byId(a[f]), B = byId(b[f]);
    for (const id of [...new Set([...Object.keys(A), ...Object.keys(B)])]) {
      const x = A[id], y = B[id]; if (canon(x) === canon(y)) continue;
      if (!x || !y) { out.push([`${f === 'ms' ? 'milestone' : 'route rule'} ${id} ${x ? 'removed' : 'added'}`, '']); continue; }
      const names = f === 'ms' ? ['id', 'tag', 'count', 'classes'] : ['id', 'count'];
      names.forEach((n, i) => { if (i && x[i] !== y[i]) out.push([`${f === 'ms' ? 'milestone' : 'route rule'} ${id} ${n}${n === 'tag' || n === 'classes' ? `: ${x[i]} -> ${y[i]}` : ' changed'}`, `${x[i]} -> ${y[i]}`]); });
      if (x.slice(names.length).join() !== y.slice(names.length).join()) out.push([`${f === 'ms' ? 'milestone' : 'route rule'} ${id} open/hidden changed`, `${x.slice(names.length)} -> ${y.slice(names.length)}`]);
    }
  }
  for (const f of ['jr', 'reg']) if (canon(a[f]) !== canon(b[f])) for (const k of [...new Set([...Object.keys(a[f] || {}), ...Object.keys(b[f] || {})])])
    if (canon((a[f] || {})[k]) !== canon((b[f] || {})[k])) out.push([`${f === 'jr' ? 'Journey' : 'Dungeons & Strongholds'}: ${k} changed`, `${JSON.stringify((a[f] || {})[k])} -> ${JSON.stringify((b[f] || {})[k])}`]);
  if (canon(a.store) !== canon(b.store)) { const A = a.store || {}, B = b.store || {};
    for (const p of [...new Set([...Object.keys(A), ...Object.keys(B)])]) if (canon(A[p]) !== canon(B[p])) out.push([`stored state after load: ${p.replace(/^checks\..*/, 'checks.<key>')} written differently`, `${p}: ${JSON.stringify(A[p] || null)} -> ${JSON.stringify(B[p] || null)}`]); }
  for (const f of ['keys', 'err', 'mode', 'probeError']) if (canon(a[f]) !== canon(b[f])) out.push([`${f} changed`, `${JSON.stringify(a[f])} -> ${JSON.stringify(b[f])}`]);
  if (!out.length) out.push(['other change', '']);
  return out;
}
function diffReport(before, after, ids) {
  const groups = new Map(), changed = [];
  for (const id of ids) {
    const a = before[id], b = after[id];
    if (a && b && canon(a) === canon(b)) continue;
    changed.push(id);
    for (const [d, detail] of describe(a, b)) { if (!groups.has(d)) groups.set(d, { d, ids: [], detail }); groups.get(d).ids.push(id); }
  }
  return { changed, groups: [...groups.values()].sort((x, y) => y.ids.length - x.ids.length || (x.d < y.d ? -1 : 1)) };
}
function printReport(rep, nIds, label) {
  if (!rep.changed.length) { console.log(`${label}: all ${nIds} states identical`); return; }
  console.log(`${label}: ${rep.changed.length} of ${nIds} states differ · ${rep.groups.length} kinds of change (most states first):`);
  rep.groups.slice(0, 60).forEach(g => console.log(`  ${String(g.ids.length).padStart(5)}  ${g.d.slice(0, 150)}\n         e.g. ${g.ids.slice(0, 3).join(', ')}${g.detail ? `\n         ${g.detail.slice(0, 220)}` : ''}`));
  if (rep.groups.length > 60) console.log(`  … ${rep.groups.length - 60} more kinds in tests/out/golden/diff.md`);
}
function writeDiffFiles(rep, before, after) {
  fs.mkdirSync(OUT, { recursive: true });
  const md = ['# Golden diff', '', `${rep.changed.length} states differ.`, '', '## By kind of change', '', '| States | Change | Examples |', '|---:|---|---|',
    ...rep.groups.map(g => `| ${g.ids.length} | ${g.d.replace(/\|/g, '\\|')} | ${g.ids.slice(0, 4).map(i => '`' + i + '`').join(' ')} |`), '', '## Per state', ''];
  for (const id of rep.changed) { md.push(`### ${id}`, ''); for (const [d, detail] of describe(before[id], after[id])) md.push(`- ${d}${detail ? `: \`${detail.slice(0, 600).replace(/`/g, "'")}\`` : ''}`); md.push(''); }
  fs.writeFileSync(path.join(OUT, 'diff.md'), md.join('\n'));
  fs.writeFileSync(path.join(OUT, 'diff.json'), JSON.stringify(rep.changed.map(id => ({ id, before: before[id] || null, after: after[id] || null })), null, 1));
}

/* ---------- run ---------- */
(async () => {
  const t0 = Date.now();
  if (!fs.existsSync(CFG.PAGE)) { console.error('dist/ is missing: run `npm run build` first'); process.exit(2); }
  let base = process.env.AION_BASE, server = null;
  if (!base) { const { startServer } = await import(path.join(CFG.ROOT, 'scripts', 'serve.mjs')); ({ server, url: base } = await startServer({})); }
  const PAGE = base.replace(/\/$/, '') + '/';
  /* Google Fonts never loads (the same rule as tests/support/block-web-fonts.cjs; no request interception, which would
     route every request through Node) */
  for (const k of ['no_proxy', 'NO_PROXY']) process.env[k] = [process.env[k], 'fonts.googleapis.com,fonts.gstatic.com'].filter(Boolean).join(',');
  /* images off (icons don't change what is recorded; ~15% of the CPU per state). The other --blink-settings values are
     Playwright's own defaults, repeated because the last --blink-settings switch wins. */
  const browser = await chromium.launch({ args: ['--host-resolver-rules=MAP fonts.googleapis.com ~NOTFOUND, MAP fonts.gstatic.com ~NOTFOUND',
    ...(RENDER ? [] : ['--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4,imagesEnabled=false'])] });
  const newCtx = async () => {
    const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
    await ctx.clock.setFixedTime(FIXED_NOW);
    await ctx.addInitScript(installProbe, [KEY, !RENDER]);
    return ctx;
  };

  /* 1. catalog from the page itself, then the states */
  const c0 = await newCtx(), p0 = await c0.newPage();
  await p0.goto(PAGE); const C = await p0.evaluate(catalogInPage); await c0.close();
  const fixtures = ['fixture-v285.json', 'fixture-user-v285.json'].map(f => ({ name: f.replace(/\.json$/, ''), raw: JSON.stringify(JSON.parse(fs.readFileSync(path.join(CFG.FIX, f), 'utf8'))) }));
  let states = generate(C, { fixtures, all: ALL });
  if (FILTER) states = states.filter(s => FILTER.test(s.id));
  if (LIMIT) states = states.slice(0, LIMIT);
  const tGen = Date.now();
  console.log(`golden: ${states.length} states (${ALL ? 'core + extended' : 'core'}${FILTER ? ', filtered' : ''}) · ${JOBS} pages · ${RECORD ? 'record' : 'verify'}`);

  /* 2. one browser, JOBS contexts (own localStorage each), each pulling states off a shared queue */
  const results = {}; let next = 0, done = 0, lastLog = Date.now();
  await Promise.all(Array.from({ length: Math.min(JOBS, states.length) }, async () => {
    /* a renderer that reloads the page hundreds of times grows by gigabytes: a fresh context every RECYCLE states */
    let ctx = null, page = null, used = 0;
    const fresh = async () => { if (ctx) await ctx.close().catch(() => {}); ctx = await newCtx(); page = await ctx.newPage(); used = 0;
      await page.goto(PAGE, { waitUntil: 'domcontentloaded' }); };
    const load = async raw => {
      await page.evaluate(([k, raw]) => { localStorage.clear(); if (raw !== null) localStorage.setItem(k, raw); }, [KEY, raw]);
      await page.reload({ waitUntil: 'commit' });
      return page.evaluate(() => window.__golden);
    };
    while (next < states.length) {
      if (!ctx || used++ >= RECYCLE) await fresh();
      const s = states[next++];
      /* a crashed or hung page (a busy CI machine) gets one retry in a fresh context; the state itself is the same */
      let o; try { o = await load(s.raw); } catch (e) { console.log(`  retry ${s.id}: ${String(e.message).split('\n')[0]}`); await fresh(); o = await load(s.raw); }
      const r = { in: hash(s.raw) };
      if (o.probeError) r.probeError = o.probeError;
      for (const f of ['nu', 'ms', 'rt', 'jr', 'reg']) if (o[f] !== undefined) r[f] = o[f];
      const sd = storeDiff(s.raw, o.stored); if (sd) r.store = sd;
      if (o.keys && o.keys.length) r.keys = o.keys;
      if (o.err && o.err.length) r.err = [...new Set(o.err)];
      r.mode = o.mode;
      Object.defineProperty(r, 'storedRaw', { value: o.stored, enumerable: false }); /* for the violations report, not saved */
      results[s.id] = r; done++;
      if (Date.now() - lastLog > 15000) { lastLog = Date.now(); console.log(`  … ${done}/${states.length} (${((Date.now() - tGen) / 1000).toFixed(0)} s)`); }
    }
    await ctx.close();
  }));
  await browser.close(); if (server) server.close();
  const tRun = Date.now();

  /* 3. compare (record prints the same summary, so a re-record can be reviewed from its output) */
  const ids = states.map(s => s.id), before = loadSnapshots();
  const known = new Set(Object.keys(before));
  const runTier = id => ALL || !id.startsWith('xrandom/');
  const removed = FILTER || LIMIT ? [] : [...known].filter(id => runTier(id) && !results[id]);
  const allIds = [...ids, ...removed].sort();
  const rep = diffReport(before, results, allIds);
  /* the report covers the core set only, so an --all run doesn't change it */
  const core = states.filter(s => s.tier === 'core'), viol = findViolations(C, core, results);
  const report = renderReport(C, viol, core.length);
  if (ALL) { const vx = findViolations(C, states.filter(s => s.tier !== 'core'), results); console.log(`extended set: ${vx.length} violations in ${new Set(vx.map(v => v.id)).size} states (not in KNOWN-VIOLATIONS.md)`); }
  const oldReport = fs.existsSync(VIOL) ? fs.readFileSync(VIOL, 'utf8') : '';
  const vCount = s => { const m = /^(\d+) violations in (\d+) of/m.exec(s); return m ? `${m[1]} violations in ${m[2]} states` : 'none recorded'; };
  printReport(rep, allIds.length, RECORD ? 'golden (vs the previous snapshots)' : 'golden');
  if (rep.changed.length) { writeDiffFiles(rep, before, results); console.log('  full diff: tests/out/golden/diff.md, diff.json'); }
  const timing = `${states.length} states in ${((tRun - t0) / 1000).toFixed(1)} s (${((tRun - tGen) / states.length).toFixed(0)} ms/state wall, ${JOBS} pages)`;

  if (RECORD) {
    if (FILTER || LIMIT) { console.log('--record with --filter/--limit would drop states: not writing'); process.exit(2); }
    const w = writeSnapshots(results, ids);
    fs.writeFileSync(VIOL, report);
    console.log(`recorded ${ids.length} states in ${w.files} files (${(w.bytes / 1048576).toFixed(2)} MB) · ${vCount(report)} (was ${vCount(oldReport)}) · ${timing}`);
    console.log('GOLDEN RECORDED');
    return;
  }
  const full = !FILTER && !LIMIT;
  const vStale = full && report !== oldReport;
  if (vStale) console.log(`KNOWN-VIOLATIONS.md is out of date: ${vCount(oldReport)} -> ${vCount(report)} (re-record)`);
  const errStates = ids.filter(id => results[id].probeError);
  if (errStates.length) console.log(`probe errors in ${errStates.length} states, e.g. ${errStates[0]}: ${results[errStates[0]].probeError.slice(0, 200)}`);
  console.log(timing);
  if (rep.changed.length || vStale) { console.log('GOLDEN VERIFY FAILED (if the change is intended: node tests/golden.js --record, review, commit; see tests/golden/README.md)'); process.exit(1); }
  console.log('GOLDEN VERIFY PASSED');
})().catch(e => { console.error(e); process.exit(2); });
