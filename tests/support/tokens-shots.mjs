#!/usr/bin/env node
/* Pixel identity check for CSS-only changes (design tokens, issue #96; not a suite). "Before" is a build of main in a
   worktree (`git worktree add --detach tests/out/main-wt main`, then `node scripts/build.mjs` inside it: node_modules
   resolves from the repo root above it); "after" is this branch's dist/ and dist-artifact/. Full-page screenshots of the
   site and the claude.ai build: Basic and Advanced x 390 / 1100 px x light / dark colour scheme x saves at Lv 12, 27, 45
   and a fresh save, plus the Build drawer open and every <details> open at Lv 27 (96 cases). Any differing pixel fails
   (a mismatch is re-shot first, see RETRIES). Writes tests/out/tokens-shots/<case>-<before|after>.png (and -diff.png).
   Usage: npm run build && node tests/support/tokens-shots.mjs [regex,regex,...  (only the cases whose name matches)] */
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..'), OUT = join(ROOT, 'tests/out/tokens-shots');
const WT = join(ROOT, 'tests/out/main-wt');
const DIRS = { before: { site: join(WT, 'dist'), artifact: join(WT, 'dist-artifact') }, after: { site: join(ROOT, 'dist'), artifact: join(ROOT, 'dist-artifact') } };
for (const w of Object.values(DIRS)) for (const d of Object.values(w)) if (!existsSync(join(d, 'index.html'))) { console.error('missing build: ' + d); process.exit(2); }
const { buildFixture } = createRequire(import.meta.url)('./regress-fixture.js');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webp': 'image/webp' };
mkdirSync(OUT, { recursive: true });
const serve = dir => new Promise(res => { const s = createServer((req, r) => { let f = join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); r.end(readFileSync(f)); }).listen(0, '127.0.0.1', () => res({ s, url: 'http://127.0.0.1:' + s.address().port })); });
const servers = {};
for (const [when, w] of Object.entries(DIRS)) for (const [build, d] of Object.entries(w)) servers[when + ':' + build] = await serve(d);
/* deterministic raster: without these, two shots of the same build differ in a few antialiased pixels (layer tiling) */
const b = await chromium.launch({ args: ['--disable-gpu', '--force-color-profile=srgb', '--disable-partial-raster', '--disable-skia-runtime-opts', '--run-all-compositor-stages-before-draw',
  '--disable-threaded-animation', '--disable-threaded-scrolling', '--disable-checker-imaging', '--disable-image-animation-resync', '--disable-new-content-rendering-timeout', '--disable-lcd-text'] });

const CASES = [];
for (const build of ['site', 'artifact']) for (const width of [390, 1100]) for (const scheme of ['light', 'dark']) for (const mode of ['basic', 'advanced']) {
  for (const L of [12, 27, 45]) CASES.push({ build, width, scheme, mode, L });
  CASES.push({ build, width, scheme, mode, L: 0 });
  CASES.push({ build, width, scheme, mode, L: 27, extra: 'drawer' });
  CASES.push({ build, width, scheme, mode, L: 27, extra: 'open' });
}
const ONLY = process.argv[2] ? new RegExp(process.argv[2].split(',').join('|')) : null; /* argv: comma-separated regexes on the case name: run a subset */
const name = c => `${c.build}-${c.width}-${c.scheme}-${c.mode}-${c.L ? 'lv' + c.L : 'fresh'}${c.extra ? '-' + c.extra : ''}`;

const shoot = async (c, when) => {
  const ctx = await b.newContext({ viewport: { width: c.width, height: c.width === 390 ? 844 : 900 }, colorScheme: c.scheme, reducedMotion: 'reduce', serviceWorkers: 'block' });
  const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(servers[when + ':' + c.build].url + '/');
  if (c.L) await p.evaluate(buildFixture, { L: c.L, mode: c.mode, fx: 'clean' });
  else await p.evaluate(m => { localStorage.clear(); localStorage.setItem('aion2-assassin-route-v4', JSON.stringify({ mode: m })); }, c.mode);
  await p.reload(); await p.waitForTimeout(500);
  if (c.extra === 'drawer') { await p.evaluate(() => document.querySelector('.sd-tab').click()); await p.waitForTimeout(400); }
  if (c.extra === 'open') { await p.evaluate(() => document.querySelectorAll('details').forEach(d => { d.open = true; })); await p.waitForTimeout(300); }
  /* a resize re-runs fitRail(): at load it sometimes measures before layout is final (Basic rail 1228 vs 1173 px at 1100) */
  await p.evaluate(async () => { await document.fonts.ready; scrollTo(0, 0); dispatchEvent(new Event('resize')); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); });
  await p.waitForTimeout(200);
  await p.mouse.move(0, 0);
  /* full page without fullPage: that option resizes the viewport while it shoots, and the page reacts to the resize (Basic
     rail, Next up stack), so the height raced. Grow the viewport to the page height until it holds, then shoot. */
  const frames = () => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  for (let i = 0, h = 0; i < 8; i++) {
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    if (H === h) break;
    h = H; await p.setViewportSize({ width: c.width, height: H }); await p.waitForTimeout(300); await frames();
  }
  /* settle: shoot until two shots in a row match (late layout: images) */
  let png = await p.screenshot({ animations: 'disabled', caret: 'hide' });
  for (let i = 0; i < 6; i++) { await p.waitForTimeout(300); const nx = await p.screenshot({ animations: 'disabled', caret: 'hide' }); if (nx.equals(png)) break; png = nx; }
  await ctx.close();
  if (errs.length) console.log(`  page errors (${when} ${name(c)}): ${errs.join(' | ')}`);
  return png;
};

/* decode both PNGs in a page and count differing pixels; draws a diff image (red = differs) */
const diffPage = await (await b.newContext()).newPage();
const pixelDiff = (a, z) => diffPage.evaluate(async ([a, z]) => {
  const load = async s => { const bm = await createImageBitmap(await (await fetch('data:image/png;base64,' + s)).blob()); const c = new OffscreenCanvas(bm.width, bm.height), g = c.getContext('2d'); g.drawImage(bm, 0, 0); return { w: bm.width, h: bm.height, d: g.getImageData(0, 0, bm.width, bm.height).data }; };
  const A = await load(a), Z = await load(z);
  if (A.w !== Z.w || A.h !== Z.h) return { size: `${A.w}x${A.h} vs ${Z.w}x${Z.h}`, n: -1 };
  const c = new OffscreenCanvas(A.w, A.h), g = c.getContext('2d'), out = g.createImageData(A.w, A.h); let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (let i = 0; i < A.d.length; i += 4) { const same = A.d[i] === Z.d[i] && A.d[i + 1] === Z.d[i + 1] && A.d[i + 2] === Z.d[i + 2] && A.d[i + 3] === Z.d[i + 3];
    if (!same) { n++; const x = (i / 4) % A.w, y = Math.floor(i / 4 / A.w); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } out.data[i] = same ? A.d[i] / 4 : 255; out.data[i + 1] = same ? A.d[i + 1] / 4 : 0; out.data[i + 2] = same ? A.d[i + 2] / 4 : 0; out.data[i + 3] = 255; }
  g.putImageData(out, 0, 0); const r = new FileReader(), blob = await c.convertToBlob();
  const url = await new Promise(res => { r.onload = () => res(r.result); r.readAsDataURL(blob); });
  return { n, size: `${A.w}x${A.h}`, box: `${x0},${y0}-${x1},${y1}`, diff: url.split(',')[1] };
}, [a.toString('base64'), z.toString('base64')]);

/* A mismatch is re-shot (both sides) up to RETRIES times: page loads are not perfectly repeatable (the artifact's /_blob/
   icons 404 off claude.ai and its layout settles at varying moments), so two loads of the same build can differ. A real
   CSS difference differs on every attempt; a case passes only on an exact before/after pair. */
const RETRIES = 3;
let same = 0, retried = 0; const bad = [];
for (const c of CASES) {
  if (ONLY && !ONLY.test(name(c))) continue;
  const n = name(c); let before, after, d = null;
  for (let a = 0; a <= RETRIES; a++) {
    before = await shoot(c, 'before'); after = await shoot(c, 'after');
    if (before.equals(after) || (d = await pixelDiff(before, after)).n === 0) { d = null; if (a) { retried++; console.log(`  ${n}: identical on attempt ${a + 1}`); } break; }
  }
  writeFileSync(join(OUT, n + '-before.png'), before); writeFileSync(join(OUT, n + '-after.png'), after);
  if (!d) { same++; console.log(`  ${n}: identical`); continue; }
  if (d.diff) writeFileSync(join(OUT, n + '-diff.png'), Buffer.from(d.diff, 'base64'));
  console.log(`  ${n}: DIFFERS`);
  bad.push(`${n}: ${d.n < 0 ? 'size ' + d.size : d.n + ' px differ in ' + d.box + ' (' + d.size + ')'}`);
}
await b.close(); for (const x of Object.values(servers)) x.s.close();
console.log(bad.join('\n'));
console.log(`${same + bad.length} cases: ${same} pixel-identical (${retried} after a re-shoot), ${bad.length} differ · screenshots: ${OUT}`);
console.log(bad.length ? 'TOKENS SHOTS DIFFER' : 'TOKENS SHOTS IDENTICAL');
process.exit(bad.length ? 1 : 0);
