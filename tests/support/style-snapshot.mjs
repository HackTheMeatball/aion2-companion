#!/usr/bin/env node
/* Style snapshot (0.4 P4d; not a suite): the proof that a stylesheet move changes no computed style. P4d (one stylesheet
   per card) and any later move of CSS rules paste its comparison of main's build vs their branch ("identical" for every
   state).

   write: loads a build (default dist/; served here on a free port, service worker and web fonts blocked as in the suites)
   in P4a's fixed states (tests/support/dom-snapshot.mjs: fresh; Lv 13, 27, 30, 45; Basic and Advanced; 390 and 1500 px)
   and writes, per state, <state>.style.txt: getComputedStyle of every element of the page (html, head's none, body and
   everything in it) and of its ::before / ::after where one is drawn (content not "none"), for the fixed list PROPS
   (box, font, colour, display, position, grid / flex, and a few more the styles set). Every running animation and
   transition is paused at its start first, so a pulse or a fade can't make two runs differ. The page clock is fixed and
   crypto.randomUUID returns one id, as in the DOM snapshot, so the same build writes the same files.
   File format: a table of the distinct value lists ("#<n> <json>"), then one line per element "<path>\t<n>".
   compare: compares two folders state by state and prints "identical" or, per differing element, its path and each
   property that differs (a, b); exit 1 on any difference.

   Usage:
     git worktree add --detach tests/out/main-wt main && node tests/out/main-wt/scripts/build.mjs
     npm run build
     node tests/support/style-snapshot.mjs write tests/out/style/main --dist tests/out/main-wt/dist
     node tests/support/style-snapshot.mjs write tests/out/style/branch
     node tests/support/style-snapshot.mjs compare tests/out/style/main tests/out/style/branch */
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);

/* the states of tests/support/dom-snapshot.mjs (not imported: that file runs its command line on import) */
const LEVELS = [['fresh', null], ['lv13', 13], ['lv27', 'user'], ['lv30', 30], ['lv45', 45]];
export const STATES = LEVELS.flatMap(([n, how]) => ['basic', 'advanced'].flatMap(mode => [390, 1500].map(w => ({ name: `${n}-${mode}-${w}`, w, mode, how }))));
const NOW = Date.parse('2026-10-17T12:00:00Z'), UUID = '00000000-0000-4000-8000-0000000d0e00';

/* the computed properties compared (longhands: a shorthand's computed value is not always serialised) */
const SIDES = ['top', 'right', 'bottom', 'left'];
export const PROPS = [
  /* box */
  'display', 'position', ...SIDES, 'z-index', 'float', 'box-sizing', 'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
  ...SIDES.map(s => `margin-${s}`), ...SIDES.map(s => `padding-${s}`),
  ...SIDES.flatMap(s => [`border-${s}-width`, `border-${s}-style`, `border-${s}-color`]),
  'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius',
  'overflow-x', 'overflow-y', 'box-shadow', 'opacity', 'visibility', 'transform', 'transform-origin', 'filter', 'mask-image', 'clip-path',
  'outline-style', 'outline-width', 'outline-color', 'outline-offset', 'container-type', 'scrollbar-width', 'scrollbar-gutter', 'columns',
  /* font and text */
  'font-family', 'font-size', 'font-weight', 'font-style', 'font-variant-numeric', 'line-height', 'letter-spacing', 'text-transform', 'text-align',
  'text-decoration-line', 'text-decoration-style', 'text-decoration-color', 'text-underline-offset', 'white-space', 'text-overflow', 'text-wrap',
  'overflow-wrap', 'hyphens', 'vertical-align', 'writing-mode', 'list-style-type', '-webkit-line-clamp',
  /* colour */
  'color', 'background-color', 'background-image', 'background-position', 'background-size', 'background-repeat', 'background-attachment',
  'fill', 'stroke', 'stroke-width', 'accent-color', 'color-scheme', 'appearance',
  /* grid and flex */
  'grid-template-columns', 'grid-template-rows', 'grid-template-areas', 'grid-auto-flow', 'grid-column-start', 'grid-column-end',
  'grid-row-start', 'grid-row-end', 'grid-area', 'row-gap', 'column-gap', 'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis',
  'order', 'justify-content', 'justify-items', 'justify-self', 'align-content', 'align-items', 'align-self',
  /* behaviour */
  'cursor', 'pointer-events', 'user-select', 'touch-action', 'content', 'animation-name', 'animation-duration', 'animation-timing-function',
  'animation-delay', 'animation-iteration-count', 'transition-property', 'transition-duration', 'transition-delay', 'perspective',
  'scroll-snap-type', 'scroll-snap-align', 'scroll-margin-top', 'overscroll-behavior-y', 'break-inside', 'counter-reset', 'object-fit',
];

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

/* opens every state of a build in turn, as dom-snapshot.mjs does, and calls visit(page, state) once it has settled */
export async function eachState(dist, visit) {
  if (!existsSync(join(dist, 'index.html'))) throw new Error(`${dist}/index.html is missing: build first`);
  const srv = await serve(dist);
  process.env.AION_BASE = srv.url; /* the font blocker rewrites pages from this origin only */
  require('./block-web-fonts.cjs');
  const { chromium } = require('playwright');
  const { writeSave, clearSave, flatFixture } = require('./save.js');
  const { writeFixture } = require('./regress-fixture.js');
  const USER = flatFixture('fixture-user-v285.flat.json');
  const b = await chromium.launch(), errs = [];
  try {
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
      await visit(p, st);
      await ctx.close();
    }
  } finally { await b.close(); srv.s.close(); }
  return errs;
}

async function write(out, dist) {
  rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
  const errs = await eachState(dist, async (p, st) => {
    const rows = await p.evaluate(props => {
      for (const a of document.getAnimations()) { a.pause(); a.currentTime = 0; }
      const path = e => { const a = []; for (; e && e !== document.documentElement; e = e.parentElement) a.unshift(e.id ? '#' + e.id : `${e.tagName.toLowerCase()}:${[...e.parentElement.children].indexOf(e)}`); return a.join(' > ') || 'html'; };
      const values = cs => props.map(n => cs.getPropertyValue(n));
      const rows = [];
      for (const e of [document.documentElement, ...document.documentElement.querySelectorAll('*')]) {
        const p = path(e);
        rows.push([p, values(getComputedStyle(e))]);
        for (const pe of ['::before', '::after']) { const cs = getComputedStyle(e, pe); if (cs.getPropertyValue('content') !== 'none') rows.push([p + ' ' + pe, values(cs)]); }
      }
      return rows;
    }, PROPS);
    const ids = new Map(), lines = [];
    for (const [path, v] of rows) { const k = JSON.stringify(v); if (!ids.has(k)) ids.set(k, ids.size); lines.push(`${path}\t${ids.get(k)}`); }
    writeFileSync(join(out, `${st.name}.style.txt`), `props ${JSON.stringify(PROPS)}\n` + [...ids.keys()].map((k, i) => `#${i} ${k}`).join('\n') + '\n' + lines.join('\n') + '\n');
  });
  console.log(`wrote ${STATES.length} states to ${out}${errs.length ? `\npage errors:\n  ${errs.join('\n  ')}` : ''}`);
  return errs.length ? 1 : 0;
}

/* reads a .style.txt file: { props, els: Map(path → values) } */
const read = f => {
  const [head, ...rest] = readFileSync(f, 'utf8').trimEnd().split('\n');
  const props = JSON.parse(head.slice(6)), table = [], els = new Map();
  for (const l of rest) {
    if (l.startsWith('#')) { const sp = l.indexOf(' '); table[+l.slice(1, sp)] = JSON.parse(l.slice(sp + 1)); }
    else { const t = l.lastIndexOf('\t'); els.set(l.slice(0, t), table[+l.slice(t + 1)]); }
  }
  return { props, els };
};

function compare(a, b, max = 12) {
  let bad = 0;
  for (const st of STATES) {
    const f = `${st.name}.style.txt`, fa = join(a, f), fb = join(b, f), diffs = [];
    if (!existsSync(fa) || !existsSync(fb)) diffs.push(`missing in ${existsSync(fa) ? b : a}`);
    else {
      const A = read(fa), B = read(fb);
      if (JSON.stringify(A.props) !== JSON.stringify(B.props)) diffs.push('different property lists (written by different versions of this script)');
      else {
        for (const p of new Set([...A.els.keys(), ...B.els.keys()])) {
          const va = A.els.get(p), vb = B.els.get(p);
          if (!va || !vb) { diffs.push(`${p}: only in ${va ? a : b}`); continue; }
          const props = A.props.flatMap((n, i) => va[i] === vb[i] ? [] : [`${n}: ${JSON.stringify(va[i])} → ${JSON.stringify(vb[i])}`]);
          if (props.length) diffs.push(`${p}\n        ${props.join('\n        ')}`);
        }
      }
    }
    if (diffs.length) bad++;
    console.log(`${st.name.padEnd(22)} ${diffs.length ? `DIFFERENT (${diffs.length} element${diffs.length > 1 ? 's' : ''})\n    ` + diffs.slice(0, max).join('\n    ') + (diffs.length > max ? `\n    … ${diffs.length - max} more` : '') : 'identical'}`);
  }
  const extra = readdirSync(a).concat(readdirSync(b)).filter(f => !STATES.some(st => f === `${st.name}.style.txt`));
  if (extra.length) { bad++; console.log(`files of no state: ${[...new Set(extra)].join(', ')}`); }
  console.log(bad ? `STYLE SNAPSHOTS DIFFER: ${bad} of ${STATES.length} states` : `STYLE SNAPSHOTS IDENTICAL: all ${STATES.length} states (${PROPS.length} computed properties of every element and drawn ::before / ::after)`);
  return bad ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, ...rest] = process.argv.slice(2);
  const opt = n => { const i = rest.indexOf(n); return i >= 0 ? rest.splice(i, 2)[1] : null; };
  if (cmd === 'write' && rest.length) { const dist = resolve(opt('--dist') || join(ROOT, 'dist')); process.exitCode = await write(resolve(rest[0]), dist); }
  else if (cmd === 'compare' && rest.length === 2) process.exitCode = compare(resolve(rest[0]), resolve(rest[1]));
  else { console.error('usage: style-snapshot.mjs write <out dir> [--dist <build dir>] | compare <dir a> <dir b>'); process.exitCode = 2; }
}
