#!/usr/bin/env node
/* DOM snapshot (0.4 P4a; not a suite): the proof that a card move changes no DOM. P4b, P4c and P5a–d paste its
   comparison of main's build vs their branch ("identical" for every state).

   write: loads a build (default dist/; served here on a free port, service worker and web fonts blocked as in the suites)
   in a fixed list of states (fresh; Lv 13, 27, 30, 45; Basic and Advanced; 390 and 1500 px) and writes, per state:
     <state>.body.html   document.body.outerHTML, with the text of <script> elements emptied (the inlined bundle is code,
                         not DOM: a verbatim move changes it)
     <state>.form.json   what outerHTML doesn't carry: every input / select / textarea's checked, value and disabled
     <state>.save.json   localStorage as stored (every key)
   The page clock is fixed and crypto.randomUUID returns one id, so the same build writes the same files.
   compare: compares two folders file by file and prints "identical" or each difference; exit 1 on any difference.

   Usage:
     git worktree add --detach tests/out/main-wt main && node tests/out/main-wt/scripts/build.mjs
     npm run build
     node tests/support/dom-snapshot.mjs write tests/out/dom/main --dist tests/out/main-wt/dist
     node tests/support/dom-snapshot.mjs write tests/out/dom/branch
     node tests/support/dom-snapshot.mjs compare tests/out/dom/main tests/out/dom/branch */
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);

/* the states: [name, width, mode, how the save is made] */
const LEVELS = [['fresh', null], ['lv13', 13], ['lv27', 'user'], ['lv30', 30], ['lv45', 45]];
export const STATES = LEVELS.flatMap(([n, how]) => ['basic', 'advanced'].flatMap(mode => [390, 1500].map(w => ({ name: `${n}-${mode}-${w}`, w, mode, how }))));
const NOW = Date.parse('2026-10-17T12:00:00Z'), UUID = '00000000-0000-4000-8000-0000000d0e00';

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain', '.xml': 'application/xml' };
const serve = dir => new Promise(res => {
  const s = createServer((req, r) => {
    let f = normalize(join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
    if (f !== dir && !f.startsWith(dir + sep)) f = null;
    else if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
    if (!f || !existsSync(f)) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); r.end(readFileSync(f));
  }).listen(0, '127.0.0.1', () => res({ s, url: `http://127.0.0.1:${s.address().port}/` }));
});

async function write(out, dist) {
  if (!existsSync(join(dist, 'index.html'))) throw new Error(`${dist}/index.html is missing: build first`);
  const srv = await serve(dist);
  process.env.AION_BASE = srv.url; /* the font blocker rewrites pages from this origin only */
  require('./block-web-fonts.cjs');
  const { chromium } = require('playwright');
  const { writeSave, clearSave, flatFixture } = require('./save.js');
  const { writeFixture } = require('./regress-fixture.js');
  const USER = flatFixture('fixture-user-v285.flat.json');
  rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
  const b = await chromium.launch(), errs = [];
  for (const st of STATES) {
    const ctx = await b.newContext({ viewport: { width: st.w, height: 1000 } });
    await ctx.clock.setFixedTime(NOW);
    await ctx.addInitScript(id => { if (self.crypto && crypto.randomUUID) crypto.randomUUID = () => id; }, UUID);
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(`${st.name}: ${e.message}`));
    await p.goto(srv.url);
    if (st.how === null) await clearSave(p);
    else if (st.how === 'user') await writeSave(p, { ...USER, mode: st.mode }, { fresh: true });
    else await writeFixture(p, { L: st.how, mode: st.mode, fx: 'clean' });
    await p.reload(); await p.waitForTimeout(400);
    if (st.how === null) await p.evaluate(m => { if (document.body.classList.contains('basic') !== (m === 'basic')) document.querySelector(`.modeseg [data-mode="${m}"]`).click(); }, st.mode);
    await p.waitForTimeout(400);
    await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const snap = await p.evaluate(() => {
      const body = document.body.cloneNode(true);
      body.querySelectorAll('script').forEach(s => { s.textContent = ''; });
      const path = e => { const a = []; for (; e && e !== document.body; e = e.parentElement) a.unshift(e.id ? '#' + e.id : `${e.tagName.toLowerCase()}:${[...e.parentElement.children].indexOf(e)}`); return a.join(' > '); };
      const form = [...document.querySelectorAll('input, select, textarea')].map(e => [path(e), e.type, e.checked, e.value, e.disabled]);
      const store = Object.fromEntries(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)]));
      return { html: body.outerHTML, form, store };
    });
    writeFileSync(join(out, `${st.name}.body.html`), snap.html + '\n');
    writeFileSync(join(out, `${st.name}.form.json`), JSON.stringify(snap.form, null, 1) + '\n');
    writeFileSync(join(out, `${st.name}.save.json`), JSON.stringify(snap.store, null, 1) + '\n');
    await ctx.close();
  }
  await b.close(); srv.s.close();
  console.log(`wrote ${STATES.length} states × 3 files to ${out}${errs.length ? `\npage errors:\n  ${errs.join('\n  ')}` : ''}`);
  return errs.length ? 1 : 0;
}

/* the first difference of two texts, with a little context */
const firstDiff = (a, b) => { let i = 0; while (i < a.length && a[i] === b[i]) i++;
  const cut = (s) => JSON.stringify(s.slice(Math.max(0, i - 60), i + 100));
  return `at char ${i}:\n      a: ${cut(a)}\n      b: ${cut(b)}`; };

function compare(a, b) {
  const files = [...new Set([...readdirSync(a), ...readdirSync(b)])].sort();
  let bad = 0;
  for (const st of STATES) {
    const own = files.filter(f => f.startsWith(st.name + '.'));
    const diffs = [];
    for (const kind of ['body.html', 'form.json', 'save.json']) {
      const f = `${st.name}.${kind}`, fa = join(a, f), fb = join(b, f);
      if (!existsSync(fa) || !existsSync(fb)) { diffs.push(`${kind}: missing in ${existsSync(fa) ? b : a}`); continue; }
      const ta = readFileSync(fa, 'utf8'), tb = readFileSync(fb, 'utf8');
      if (ta !== tb) diffs.push(`${kind} differs ${firstDiff(ta, tb)}`);
    }
    if (own.length !== 3 && !diffs.length) diffs.push(`unexpected files: ${own.join(', ')}`);
    if (diffs.length) bad++;
    console.log(`${st.name.padEnd(22)} ${diffs.length ? 'DIFFERENT\n    ' + diffs.join('\n    ') : 'identical'}`);
  }
  const extra = files.filter(f => !STATES.some(st => f.startsWith(st.name + '.')));
  if (extra.length) { bad++; console.log(`files of no state: ${extra.join(', ')}`); }
  console.log(bad ? `DOM SNAPSHOTS DIFFER: ${bad} of ${STATES.length} states` : `DOM SNAPSHOTS IDENTICAL: all ${STATES.length} states (body, form state, stored save)`);
  return bad ? 1 : 0;
}

const [cmd, ...rest] = process.argv.slice(2);
const opt = n => { const i = rest.indexOf(n); return i >= 0 ? rest.splice(i, 2)[1] : null; };
if (cmd === 'write' && rest.length) { const dist = resolve(opt('--dist') || join(ROOT, 'dist')); process.exitCode = await write(resolve(rest[0]), dist); }
else if (cmd === 'compare' && rest.length === 2) process.exitCode = compare(resolve(rest[0]), resolve(rest[1]));
else { console.error('usage: dom-snapshot.mjs write <out dir> [--dist <build dir>] | compare <dir a> <dir b>'); process.exitCode = 2; }
