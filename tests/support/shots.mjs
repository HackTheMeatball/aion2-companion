#!/usr/bin/env node
/* Before / after screenshots for any PR that changes what a player sees (CLAUDE.md "Screens that change"; the folder
   layout and scrapbook.json are in docs/reviews/README.md). One script for every item, so a build only writes its cases.
   Usage: npm run build && node tests/support/shots.mjs docs/reviews/<minor>-<item>-shots [--base <ref>] [--after-only]
   Reads <dir>/cases.mjs (default export: an array of cases, below) and writes <dir>/<case><suffix>-before.png and
   -after.png, or <case><suffix>.png for a case with `afterOnly` (a screen that didn't exist before) or with --after-only.
   "After" is this branch's dist/. "Before" is <ref> (default origin/main) built in a worktree at tests/out/shots-base
   (made, or moved to <ref>, on each run; its build resolves node_modules from the repo root above it).
   A case: { name, save, before, after, act, afterOnly, width = 390, height = 844, mode = 'basic', shots }
     save          a flat test save (tests/support/save.js) for both builds; before / after override it per build;
                   with none, a fresh browser (mode then stays the app's default)
     act           a function run in the page after load (opens a menu, types a name); same for both builds
     shots         [{ sel, suffix = '', text }]: element screenshots (first match, holding text if given);
                   omitted = the top of the viewport (width x height)
   Fails (exit 1) on a page error or a selector that matches nothing, so a missing shot is never silent. */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const { writeSave } = require('./save.js');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2), opt = n => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : null; };
const dirArg = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--base');
if (!dirArg) { console.error('usage: node tests/support/shots.mjs docs/reviews/<minor>-<item>-shots [--base <ref>] [--after-only]'); process.exit(2); }
const DIR = resolve(dirArg), CASES = (await import(pathToFileURL(join(DIR, 'cases.mjs')).href)).default;
const afterOnly = args.includes('--after-only') || CASES.every(c => c.afterOnly);

/* the base build: a detached worktree at <ref>, built with its own scripts/build.mjs */
const BASE = join(ROOT, 'tests/out/shots-base');
if (!afterOnly) {
  const ref = opt('base') || 'origin/main', git = (...a) => execFileSync('git', a, { cwd: ROOT, stdio: 'inherit' });
  if (existsSync(BASE)) git('-C', BASE, 'checkout', '--detach', '--quiet', ref); else git('worktree', 'add', '--detach', BASE, ref);
  execFileSync(process.execPath, [join(BASE, 'scripts/build.mjs')], { cwd: BASE, stdio: 'inherit' });
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
const serve = dir => new Promise(res => { const s = createServer((req, r) => { let f = join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); r.end(readFileSync(f)); }).listen(0, '127.0.0.1', () => res({ s, url: 'http://127.0.0.1:' + s.address().port })); });
const servers = { after: await serve(join(ROOT, 'dist')) };
if (!afterOnly) servers.before = await serve(join(BASE, 'dist'));

mkdirSync(DIR, { recursive: true });
const b = await chromium.launch();
let bad = 0;
for (const c of CASES) for (const when of (afterOnly || c.afterOnly) ? ['after'] : ['before', 'after']) {
  const w = c.width || 390, h = c.height || 844, tag = (afterOnly || c.afterOnly) ? '' : '-' + when;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, serviceWorkers: 'block', reducedMotion: 'reduce' });
  const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(servers[when].url + '/'); await p.waitForTimeout(300);
  const save = c[when] || c.save;
  if (save) await writeSave(p, { open: {}, hideCards: false, mode: c.mode || 'basic', ...save }, { fresh: true });
  else await p.evaluate(() => localStorage.clear());
  await p.reload(); await p.waitForTimeout(500);
  if (c.act) { await p.evaluate(c.act); await p.waitForTimeout(250); }
  for (const { sel, suffix = '', text } of c.shots || [{}]) {
    const path = join(DIR, `${c.name}${suffix}${tag}.png`);
    if (!sel) { await p.screenshot({ path, clip: { x: 0, y: 0, width: w, height: h } }); continue; }
    const el = p.locator(sel, text ? { hasText: text } : {}).first();
    if (!(await el.count())) { console.error(`MISSING ${c.name} ${when}: ${sel}${text ? ` holding "${text}"` : ''}`); bad++; continue; }
    await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(150);
    await el.screenshot({ path });
  }
  if (errs.length) { console.error(`PAGE ERROR ${c.name} ${when}:`, errs.join(' | ')); bad++; }
  await ctx.close();
}
await b.close(); for (const x of Object.values(servers)) x.s.close();
console.log(`shots written to ${DIR}${bad ? `; ${bad} problem(s) above` : ''}`);
if (bad) process.exitCode = 1;
