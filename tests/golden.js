/* Golden master harness (architecture audit phase P0). See tests/golden/README.md.

   Loads dist/index.html once per generated save state (~2,000 states, tests/golden/states.js) and records what the app
   decides: the Next up stack, milestone headers, the Journey card, the Dungeons & Strongholds card and the stored state
   after load (tests/golden/probe.js). Snapshots live in tests/golden/snapshots/<card>/<shard>.json, one directory per card.

   Usage (after `npm run build`; tests/run.mjs runs it as suite `golden`):
     node tests/golden.js              verify: diff against the snapshots, print a summary grouped by kind of change, exit 1 on any
     node tests/golden.js --record     write the snapshots and tests/golden/KNOWN-VIOLATIONS.md (prints the same summary first)
     node tests/golden.js --record --card nu   re-record only that card's shards; fails, writing nothing, if another card changed
     options: --all (also the extended random set, ~6,000 more states) · --jobs N (parallel pages, default 3)
              --filter <regex> (only states whose id matches; verify ignores the rest) · --limit N (first N states, smoke runs)
              --render (let the page render; slower. The default hides the page so no layout runs; --render must give
              identical snapshots, which shows the recorded state doesn't depend on layout)
     node tests/golden.js --explain    attribute every difference to the 0.3 changes behind it (design §13; tests/golden/explain.js):
              the page with every change on (as it ships) against the snapshots, then the changed states again with every
              change off, each change alone (with the rules it needs) and each pair; each changed state goes to the smallest
              set that reproduces it. Fails on a difference no set reproduces, on one that "all off" doesn't undo, and on a
              stored-state (store) difference. Writes tests/out/golden/explain.md / explain.json; never records.
   Output: tests/out/golden/diff.md and diff.json (every changed state, before/after per field). */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { chromium } = require('playwright');
const CFG = require('./config');
const { catalogInPage, generate, fixtureStates } = require('./golden/states');
const { installProbe, storeDiff } = require('./golden/probe');
const { findViolations, renderReport } = require('./golden/violations');
const { SAVE_KEY: KEY, writeRaw } = require('./support/save');
const DIR = path.join(CFG.ROOT, 'tests', 'golden'), SNAP = path.join(DIR, 'snapshots'), OUT = path.join(CFG.OUT, 'golden');
const VIOL = path.join(DIR, 'KNOWN-VIOLATIONS.md');
const args = process.argv.slice(2), flag = n => args.includes('--' + n), opt = n => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : null; };
const RECORD = flag('record'), EXPLAIN = flag('explain'), ALL = flag('all'), JOBS = Math.max(1, +(opt('jobs') || process.env.GOLDEN_JOBS || 3));
const RENDER = flag('render');
/* --card nu / --card nextup: with --record, re-record only that card (a probe key or its snapshot directory) */
const CARD = opt('card');
const FILTER = opt('filter') ? new RegExp(opt('filter')) : null, LIMIT = opt('limit') ? +opt('limit') : 0;
const RECYCLE = 150;
/* the ranking changes' names (--explain reads them from the page with its switch tables) */
const RANK_NAMES = new Set();
const FIXED_NOW = new Date('2026-10-01T12:00:00Z'); /* the page sees this as "now" (Date.now / new Date) */

/* ---------- serialisation: canonical (sorted keys) for hashing/comparing; line-oriented pretty form for the files ---------- */
const canon = x => JSON.stringify(x, (k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(j => [j, v[j]])) : v);
const hash = s => crypto.createHash('sha1').update(s == null ? '(no save)' : canon(JSON.parse(s))).digest('hex').slice(0, 12);
/* objects/arrays are expanded down to depth `max` (state -> field -> entry in a _state shard, state -> entry in a card
   shard); anything deeper stays on one line, so each entry sits on one line as in the pre-P4e combined files */
function pretty(x, max = 2, d = 0) {
  const ind = '  '.repeat(d + 1), end = '  '.repeat(d);
  if (d > max || x === null || typeof x !== 'object') return JSON.stringify(x);
  if (Array.isArray(x)) return x.length ? '[\n' + x.map(v => ind + pretty(v, max, d >= max ? max + 1 : d + 1)).join(',\n') + '\n' + end + ']' : '[]';
  const ks = Object.keys(x); return ks.length ? '{\n' + ks.map(k => ind + JSON.stringify(k) + ': ' + pretty(x[k], max, d + 1)).join(',\n') + '\n' + end + '}' : '{}';
}
/* shard file per group and level band, so adding a state never moves other states between files */
const shardOf = id => { const [g, rest] = id.split('/'); const m = /^L(\d+)/.exec(rest || ''); if (!m) return g; const b = Math.floor((+m[1] - 1) / 5) * 5 + 1; return `${g}-L${String(b).padStart(2, '0')}-${String(b + 4).padStart(2, '0')}`; };
const FIELD_ORDER = ['in', 'probeError', 'nu', 'ms', 'rt', 'jr', 'reg', 'store', 'keys', 'err', 'mode'];
/* stored per card (0.4 P4e): snapshots/<card>/<shard>.json, one directory per top-level field of a state's record, so a
   change to one card re-records only that card's files. The input hash and the page-level fields (stored state, other
   keys, errors, mode) aren't cards: they share snapshots/_state/. A field the probe adds later gets a directory named
   after its key. */
const CARD_DIR = { nu: 'nextup', ms: 'milestones', rt: 'route', jr: 'journey', reg: 'regional' };
const STATE_FIELDS = ['in', 'probeError', 'store', 'keys', 'err', 'mode'], STATE_DIR = '_state';
const dirOf = k => CARD_DIR[k] || (STATE_FIELDS.includes(k) ? STATE_DIR : k);
const keyOfDir = Object.fromEntries(Object.entries(CARD_DIR).map(([k, d]) => [d, k]));
const cardLabel = d => d === STATE_DIR ? `${STATE_DIR}/ (input, stored state, keys, errors, mode)` : `${keyOfDir[d] || d} (${d}/)`;
/* a record split into its parts: { dir: value } (the _state part is an object of its fields) */
function partsOf(r) {
  const out = {};
  for (const [k, v] of Object.entries(r || {})) { const d = dirOf(k); if (d === STATE_DIR) (out[d] = out[d] || {})[k] = v; else out[d] = v; }
  return out;
}
const fieldRank = k => { const i = FIELD_ORDER.indexOf(k); return i < 0 ? FIELD_ORDER.length : i; };
const ordered = r => Object.fromEntries(Object.keys(r).sort((a, b) => fieldRank(a) - fieldRank(b)).map(k => [k, r[k]]));

function loadSnapshots() {
  const snaps = {};
  if (!fs.existsSync(SNAP)) return snaps;
  for (const d of fs.readdirSync(SNAP, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name).sort())
    for (const f of fs.readdirSync(path.join(SNAP, d)).filter(f => f.endsWith('.json')).sort())
      for (const [id, v] of Object.entries(JSON.parse(fs.readFileSync(path.join(SNAP, d, f), 'utf8')))) {
        const r = snaps[id] = snaps[id] || {};
        if (d === STATE_DIR) Object.assign(r, v); else r[keyOfDir[d] || d] = v;
      }
  for (const id of Object.keys(snaps)) snaps[id] = ordered(snaps[id]);
  return snaps;
}
/* only = a card directory (--record --card): write that card's shards, leave every other file alone */
function writeSnapshots(results, ids, only = null) {
  fs.mkdirSync(SNAP, { recursive: true });
  const shards = {}; /* dir -> shard -> { id: value } */
  for (const id of ids) for (const [d, v] of Object.entries(partsOf(results[id]))) {
    if (only && d !== only) continue;
    const s = shards[d] = shards[d] || {}, n = shardOf(id); (s[n] = s[n] || {})[id] = v;
  }
  /* a full core run replaces every core shard; extended (xrandom) shards are only replaced by an --all run. A full run
     also drops the pre-P4e combined files (snapshots/*.json). */
  const replaced = f => ALL || !f.startsWith('xrandom');
  if (!only) for (const f of fs.readdirSync(SNAP).filter(f => f.endsWith('.json'))) fs.unlinkSync(path.join(SNAP, f));
  for (const d of fs.readdirSync(SNAP, { withFileTypes: true }).filter(e => e.isDirectory() && (!only || e.name === only)).map(e => e.name)) {
    for (const f of fs.readdirSync(path.join(SNAP, d)).filter(f => f.endsWith('.json'))) if (!(shards[d] || {})[f.slice(0, -5)] && replaced(f)) fs.unlinkSync(path.join(SNAP, d, f));
    if (!fs.readdirSync(path.join(SNAP, d)).length) fs.rmdirSync(path.join(SNAP, d));
  }
  let bytes = 0, files = 0;
  for (const [d, byShard] of Object.entries(shards)) {
    fs.mkdirSync(path.join(SNAP, d), { recursive: true });
    for (const [name, obj] of Object.entries(byShard)) { const s = pretty(obj, d === STATE_DIR ? 2 : 1) + '\n'; bytes += s.length; files++; fs.writeFileSync(path.join(SNAP, d, name + '.json'), s); }
  }
  return { files, bytes };
}
/* which card shards a difference touches: dir -> { files: Set, ids: [] } */
function changedCards(before, after, ids) {
  const out = {};
  for (const id of ids) {
    const A = partsOf(before[id]), B = partsOf(after[id]);
    for (const d of new Set([...Object.keys(A), ...Object.keys(B)])) if (canon(A[d]) !== canon(B[d])) {
      const c = out[d] = out[d] || { files: new Set(), ids: [] }; c.files.add(`${d}/${shardOf(id)}.json`); c.ids.push(id);
    }
  }
  return out;
}
function printCards(cards) {
  const ds = Object.keys(cards).sort(); if (!ds.length) return;
  console.log(`  changed shards (${ds.length} of the card directories):`);
  for (const d of ds) { const fl = [...cards[d].files].sort();
    console.log(`    ${cardLabel(d)}: ${cards[d].ids.length} states in ${fl.length} files: ${fl.slice(0, 6).join(' ')}${fl.length > 6 ? ' …' : ''}`); }
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
    if (ta[0] !== tb[0]) out.push([`Next up: top card changed from ${norm(ta[0] || '(none)')}`, `-> ${tb[0] || '(none)'}`]);
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
  /* a state whose generated save changed: its other changes follow from the new input, so they are grouped apart from
     the behaviour changes (states with the same input) that a reviewer has to explain */
  return a.in !== b.in ? out.map(([d, x], i) => [i ? '(new input) ' + d : d, x]) : out;
}
function diffReport(before, after, ids) {
  const groups = new Map(), changed = [];
  for (const id of ids) {
    const a = before[id], b = after[id];
    if (a && b && canon(a) === canon(b)) continue;
    changed.push(id);
    for (const [d, detail] of describe(a, b)) { if (!groups.has(d)) groups.set(d, { d, ids: [], detail }); groups.get(d).ids.push(id); }
  }
  /* behaviour changes first (most states first), then the state-set and input changes and what follows from them */
  const rank = g => /^(\(new input\)|input:|state (added|removed))/.test(g.d) ? 1 : 0;
  return { changed, groups: [...groups.values()].sort((x, y) => rank(x) - rank(y) || y.ids.length - x.ids.length || (x.d < y.d ? -1 : 1)) };
}
function printReport(rep, nIds, label) {
  if (!rep.changed.length) { console.log(`${label}: all ${nIds} states identical`); return; }
  console.log(`${label}: ${rep.changed.length} of ${nIds} states differ · ${rep.groups.length} kinds of change (most states first):`);
  let sec = -1;
  rep.groups.slice(0, 60).forEach(g => { const r = /^(\(new input\)|input:|state (added|removed))/.test(g.d) ? 1 : 0;
    if (r !== sec) { sec = r; console.log(r ? '  -- generated saves added / removed / changed (their other changes follow from the new input):' : '  -- behaviour changes (same input):'); }
    console.log(`  ${String(g.ids.length).padStart(5)}  ${g.d.slice(0, 150)}\n         e.g. ${g.ids.slice(0, 3).join(', ')}${g.detail ? `\n         ${g.detail.slice(0, 220)}` : ''}`); });
  if (rep.groups.length > 60) console.log(`  … ${rep.groups.length - 60} more kinds in tests/out/golden/diff.md`);
}
function writeDiffFiles(rep, before, after, cards) {
  fs.mkdirSync(OUT, { recursive: true });
  const md = ['# Golden diff', '', `${rep.changed.length} states differ.`, '', '## Changed shards', '', '| Card | States | Files |', '|---|---:|---|',
    ...Object.keys(cards).sort().map(d => `| ${cardLabel(d)} | ${cards[d].ids.length} | ${[...cards[d].files].sort().map(f => '`' + f + '`').join(' ')} |`),
    '', '## By kind of change', '', '| States | Change | Examples |', '|---:|---|---|',
    ...rep.groups.map(g => `| ${g.ids.length} | ${g.d.replace(/\|/g, '\\|')} | ${g.ids.slice(0, 4).map(i => '`' + i + '`').join(' ')} |`), '', '## Per state', ''];
  for (const id of rep.changed) { md.push(`### ${id}`, ''); for (const [d, detail] of describe(before[id], after[id])) md.push(`- ${d}${detail ? `: \`${detail.slice(0, 600).replace(/`/g, "'")}\`` : ''}`); md.push(''); }
  fs.writeFileSync(path.join(OUT, 'diff.md'), md.join('\n'));
  fs.writeFileSync(path.join(OUT, 'diff.json'), JSON.stringify(rep.changed.map(id => ({ id, before: before[id] || null, after: after[id] || null })), null, 1));
}

/* ---------- run ---------- */
(async () => {
  const t0 = Date.now();
  if (!fs.existsSync(CFG.PAGE)) { console.error('dist/ is missing: run `npm run build` first'); process.exit(2); }
  if (CARD && (!RECORD || !(CARD in CARD_DIR || CARD in keyOfDir || CARD === STATE_DIR))) {
    console.error(`--card goes with --record and names a card: ${[...Object.entries(CARD_DIR).map(([k, d]) => `${k} (${d})`), STATE_DIR].join(', ')}`); process.exit(2); }
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
  /* changes: null = the page as it ships; else the names of the 0.3 changes to run with (window.__gateChanges, --explain) */
  const newCtx = async (changes = null) => {
    const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
    await ctx.clock.setFixedTime(FIXED_NOW);
    /* a fixed slot id for a fresh save (save v5: crypto.randomUUID, src/shell/ids.js), like the fixed clock */
    await ctx.addInitScript(() => { crypto.randomUUID = () => '00000000-0000-4000-8000-0000000f7e57'; });
    /* the ranking changes (RANK_NAMES, from the page's switch tables) go to their own hook (window.__rankChanges) */
    if (changes) await ctx.addInitScript(([g, r]) => { window.__gateChanges = g; window.__rankChanges = r; },
      [changes.filter(n => !RANK_NAMES.has(n)), changes.filter(n => RANK_NAMES.has(n))]);
    await ctx.addInitScript(installProbe, [KEY, !RENDER]);
    return ctx;
  };

  /* 1. catalog from the page itself, then the states */
  const c0 = await newCtx(), p0 = await c0.newPage();
  await p0.goto(PAGE); const C = await p0.evaluate(catalogInPage); await c0.close();
  /* the fixture states load their flat fixture as the current build stores it (tests/golden/states.js) */
  const fixtures = fixtureStates();
  let states = generate(C, { fixtures, all: ALL });
  if (FILTER) states = states.filter(s => FILTER.test(s.id));
  if (LIMIT) states = states.slice(0, LIMIT);
  const tGen = Date.now();
  console.log(`golden: ${states.length} states (${ALL ? 'core + extended' : 'core'}${FILTER ? ', filtered' : ''}) · ${JOBS} pages · ${RECORD ? 'record' : EXPLAIN ? 'explain' : 'verify'}`);

  /* 2. one browser, JOBS contexts (own localStorage each), each pulling states off a shared queue */
  const runStates = async (states, changes = null) => {
    const results = {}; let next = 0, done = 0, lastLog = Date.now();
    await Promise.all(Array.from({ length: Math.min(JOBS, states.length) }, async () => {
      /* a renderer that reloads the page hundreds of times grows by gigabytes: a fresh context every RECYCLE states */
      let ctx = null, page = null, used = 0;
      const fresh = async () => { if (ctx) await ctx.close().catch(() => {}); ctx = await newCtx(changes); page = await ctx.newPage(); used = 0;
        await page.goto(PAGE, { waitUntil: 'domcontentloaded' }); };
      const load = async raw => {
        await writeRaw(page, raw, { fresh: true });
        await page.reload({ waitUntil: 'commit' });
        return page.evaluate(() => window.__golden);
      };
      while (next < states.length) {
        if (!ctx || used++ >= RECYCLE) await fresh();
        const s = states[next++];
        /* a crashed or hung page (a busy CI machine) gets one retry in a fresh context; the state itself is the same */
        let o; try { o = await load(s.raw); } catch (e) { console.log(`  retry ${s.id}: ${String(e.message).split('\n')[0]}`); await fresh(); o = await load(s.raw); }
        const src = s.raw, r = { in: hash(src) };
        if (o.probeError) r.probeError = o.probeError;
        for (const f of ['nu', 'ms', 'rt', 'jr', 'reg']) if (o[f] !== undefined) r[f] = o[f];
        const sd = storeDiff(src, o.stored); if (sd) r.store = sd;
        if (o.keys && o.keys.length) r.keys = o.keys;
        if (o.err && o.err.length) r.err = [...new Set(o.err)];
        r.mode = o.mode;
        Object.defineProperty(r, 'storedRaw', { value: o.stored, enumerable: false }); /* for the violations report, not saved */
        results[s.id] = r; done++;
        if (Date.now() - lastLog > 15000) { lastLog = Date.now(); console.log(`  … ${done}/${states.length} (${((Date.now() - tGen) / 1000).toFixed(0)} s)`); }
      }
      await ctx.close();
    }));
    return results;
  };
  const results = await runStates(states);
  if (EXPLAIN) {
    if (FILTER || LIMIT || ALL) console.log('--explain: attributing the states run (filtered / limited / extended)');
    /* the gate changes (on as the page ships) and the ranking changes of smart Next up (the engine's RANK_CHANGES and the
       pack's AION2_RANK_CHANGES, marked rank: shipped on or off by their own `on`; 0.5 P11) */
    const meta = await (async () => { const cx = await newCtx(), pg = await cx.newPage(); await pg.goto(PAGE);
      const m = await pg.evaluate(() => JSON.parse(JSON.stringify({ gate: GATE_CHANGES, rank: { ...RANK_CHANGES, ...AION2_RANK_CHANGES } }))); await cx.close();
      for (const n of Object.keys(m.rank)) { if (n in m.gate) throw new Error(`--explain: "${n}" is both a gate and a ranking change`); RANK_NAMES.add(n); }
      return { ...m.gate, ...Object.fromEntries(Object.entries(m.rank).map(([n, x]) => [n, { ...x, rank: true }])) }; })();
    const code = await require('./golden/explain').explain({ states, shipped: results, before: loadSnapshots(), meta, run: runStates, canon, describe, out: OUT, root: CFG.ROOT });
    await browser.close(); if (server) server.close();
    console.log(`${states.length} states in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    process.exit(code);
  }
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
  const cards = changedCards(before, results, allIds);
  printCards(cards);
  if (rep.changed.length) { writeDiffFiles(rep, before, results, cards); console.log('  full diff: tests/out/golden/diff.md, diff.json'); }
  const timing = `${states.length} states in ${((tRun - t0) / 1000).toFixed(1)} s (${((tRun - tGen) / states.length).toFixed(0)} ms/state wall, ${JOBS} pages)`;

  if (RECORD) {
    if (FILTER || LIMIT) { console.log('--record with --filter/--limit would drop states: not writing'); process.exit(2); }
    let only = null;
    if (CARD) {
      only = dirOf(keyOfDir[CARD] || CARD);
      const others = Object.keys(cards).filter(d => d !== only).sort();
      if (others.length) {
        console.log(`--record --card ${CARD}: other cards changed too: ${others.map(d => `${cardLabel(d)} in ${cards[d].ids.length} states, e.g. ${cards[d].ids[0]}`).join('; ')}`);
        console.log('GOLDEN RECORD FAILED (nothing written: a --card re-record must change only that card; re-record all with --record if every change is intended)');
        process.exit(1);
      }
    }
    const w = writeSnapshots(results, ids, only);
    fs.writeFileSync(VIOL, report);
    console.log(`recorded ${ids.length} states${only ? ` (card ${cardLabel(only)} only)` : ''} in ${w.files} files (${(w.bytes / 1048576).toFixed(2)} MB) · ${vCount(report)} (was ${vCount(oldReport)}) · ${timing}`);
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
