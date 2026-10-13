#!/usr/bin/env node
/* Build both deliverables from src/index.html (no dependencies beyond Node 20).

   dist/                       GitHub Pages site
     index.html                src/index.html with the build markers removed
     assets/icons/*.png        the icons the page references (src/assets/icons)
     public/*                  CNAME, robots.txt, sitemap.xml, 404.html, favicon.svg, manifest, manifest icons
     sw.js                     src/sw.js with the build id and precache list filled in
   dist-artifact/index.html    single file for publishing to claude.ai: the <!-- @web-only --> blocks removed
                               (document skeleton, SEO/PWA head, service worker), icon paths rewritten to the
                               artifact's /_blob/<id> URLs (scripts/artifact-blobs.json).

   Markers in src/index.html: a line "<!-- @web-only -->" opens a block, "<!-- @end-web-only -->" closes it.
   Usage: node scripts/build.mjs */
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const P = (...p) => join(ROOT, ...p);
const DIST = P('dist'), ART = P('dist-artifact');
const OPEN = '<!-- @web-only -->', CLOSE = '<!-- @end-web-only -->';

const die = msg => { console.error('build: ' + msg); process.exit(1); };
const walk = dir => readdirSync(dir).flatMap(n => { const f = join(dir, n); return statSync(f).isDirectory() ? walk(f) : [f]; });

const src = readFileSync(P('src/index.html'), 'utf8');
const blobs = JSON.parse(readFileSync(P('scripts/artifact-blobs.json'), 'utf8'));

/* markers: balanced, on their own lines, not nested */
{
  let depth = 0;
  src.split('\n').forEach((line, i) => {
    const t = line.trim();
    if (t.includes('@web-only') || t.includes('@end-web-only')) {
      if (t !== OPEN && t !== CLOSE) die(`line ${i + 1}: marker must be alone on its line`);
      depth += t === OPEN ? 1 : -1;
      if (depth < 0 || depth > 1) die(`line ${i + 1}: unbalanced or nested @web-only marker`);
    }
  });
  if (depth) die('unclosed @web-only block');
}

/* icons: every referenced icon exists and has an artifact blob id; every shipped icon is referenced */
const ICON_RE = /assets\/icons\/([\w-]+)\.png/g;
const used = new Set([...src.matchAll(ICON_RE)].map(m => m[1]));
const shipped = readdirSync(P('src/assets/icons')).filter(f => f.endsWith('.png')).map(f => f.slice(0, -4));
for (const n of used) {
  if (!shipped.includes(n)) die(`src/index.html references assets/icons/${n}.png, which is missing`);
  if (!blobs[n]) die(`no artifact blob id for ${n} in scripts/artifact-blobs.json`);
}
for (const n of shipped) if (!used.has(n)) die(`src/assets/icons/${n}.png is not referenced by src/index.html`);

/* web page */
const web = src.replace(/^[ \t]*<!-- @(end-)?web-only -->\n/gm, '');
if (!web.startsWith('<!doctype html>')) die('dist/index.html must start with <!doctype html>');

/* artifact page */
let art = src.replace(/^[ \t]*<!-- @web-only -->\n[\s\S]*?^[ \t]*<!-- @end-web-only -->\n/gm, '');
art = art.replace(ICON_RE, (_, n) => '/_blob/' + blobs[n]);
for (const bad of ['assets/icons/', 'serviceWorker', 'manifest.webmanifest', '<!doctype', '<head>', '<body>'])
  if (art.includes(bad)) die(`dist-artifact/index.html still contains "${bad}"`);

/* output */
for (const d of [DIST, ART]) { rmSync(d, { recursive: true, force: true }); mkdirSync(d, { recursive: true }); }
cpSync(P('public'), DIST, { recursive: true });
cpSync(P('src/assets'), join(DIST, 'assets'), { recursive: true });
writeFileSync(join(DIST, 'index.html'), web);
writeFileSync(join(ART, 'index.html'), art);

/* service worker: build id = hash of everything it caches */
const files = walk(DIST).map(f => relative(DIST, f).split('\\').join('/')).sort();
const precache = ['./', ...files.filter(f => f === 'index.html' || f === 'manifest.webmanifest' || f === 'favicon.svg' || /^(assets\/icons|icons)\/.+\.png$/.test(f))];
const h = createHash('sha256');
for (const f of files) h.update(f + '\0').update(readFileSync(join(DIST, f)));
h.update(readFileSync(P('src/sw.js')));
const BUILD = h.digest('hex').slice(0, 12);
const sw = readFileSync(P('src/sw.js'), 'utf8').replace('__BUILD__', BUILD).replace('__PRECACHE__', JSON.stringify(precache, null, 1).replace(/\n\s*/g, ' '));
if (/__(BUILD|PRECACHE)__/.test(sw)) die('sw.js placeholders not filled');
writeFileSync(join(DIST, 'sw.js'), sw);
writeFileSync(join(DIST, 'build.json'), JSON.stringify({ build: BUILD }) + '\n');

const kb = f => (statSync(f).size / 1024).toFixed(1) + ' KB';
console.log(`build ${BUILD}`);
console.log(`  dist/index.html            ${kb(join(DIST, 'index.html'))} · ${walk(DIST).length} files · precache ${precache.length}`);
console.log(`  dist-artifact/index.html   ${kb(join(ART, 'index.html'))} · ${used.size} icons as /_blob/<id>`);
if (!existsSync(join(DIST, 'CNAME'))) die('dist/CNAME missing');
