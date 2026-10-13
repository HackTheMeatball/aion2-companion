#!/usr/bin/env node
/* Build both deliverables from src/index.html (no dependencies beyond Node 20).

   dist/                       GitHub Pages site
     index.html                src/index.html with the build markers removed
     assets/icons/*.png        the icons the page references (src/assets/icons)
     assets/fonts/*            the self-hosted fonts (WOFF2) and their OFL license texts (src/assets/fonts)
     public/*                  CNAME, robots.txt, sitemap.xml, 404.html, favicon.svg, manifest, manifest icons
     sw.js                     src/sw.js with the build id and precache list filled in
   dist-artifact/index.html    single file for publishing to claude.ai: the <!-- @web-only --> blocks removed
                               (document skeleton, SEO/PWA head, service worker), icon paths rewritten to the
                               artifact's /_blob/<id> URLs (scripts/artifact-blobs.json), the fonts' @font-face block
                               replaced by a script that registers each font file once (FontFace API).

   Markers in src/index.html: a line "<!-- @web-only -->" opens a block, "<!-- @end-web-only -->" closes it.
   Placeholders in src/index.html: __APP_VERSION__ becomes package.json's version, __APP_BUILD__ the build's name
   ("site" in dist/, "claude.ai" in dist-artifact/), so the version is never written by hand in the page.
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
const VERSION = JSON.parse(readFileSync(P('package.json'), 'utf8')).version;
if (!/^\d+\.\d+\.\d+$/.test(VERSION || '')) die(`package.json version "${VERSION}" is not X.Y.Z`);
if (!src.includes('__APP_VERSION__') || !src.includes('__APP_BUILD__')) die('src/index.html lacks the __APP_VERSION__ / __APP_BUILD__ placeholders');
const stamp = (html, build) => html.replaceAll('__APP_VERSION__', VERSION).replaceAll('__APP_BUILD__', build);

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

/* fonts (self-hosted since 0.1.5): every referenced file exists, every shipped file is referenced, each family ships its
   OFL text; no request may go to a font service. The claude.ai build must stay one file, so its @font-face block becomes
   a small script holding each file once (base64) and registering the same faces through the FontFace API (as data:
   URLs in CSS, the files shared by several weights would be repeated); they are kept under FONT_INLINE_MAX. */
const FONT_RE = /assets\/fonts\/([\w-]+\.woff2)/g, FONT_INLINE_MAX = 150 * 1024;
const fontsUsed = new Set([...src.matchAll(FONT_RE)].map(m => m[1]));
const fontsShipped = readdirSync(P('src/assets/fonts')).filter(f => f.endsWith('.woff2'));
for (const f of fontsUsed) if (!fontsShipped.includes(f)) die(`src/index.html references assets/fonts/${f}, which is missing`);
for (const f of fontsShipped) if (!fontsUsed.has(f)) die(`src/assets/fonts/${f} is not referenced by src/index.html`);
if (readdirSync(P('src/assets/fonts')).filter(f => /^OFL-.+\.txt$/.test(f)).length < 3) die('src/assets/fonts: an OFL license text is missing');
for (const [f, html] of [['src/index.html', src], ['public/404.html', readFileSync(P('public/404.html'), 'utf8')]])
  if (/fonts\.(googleapis|gstatic)\.com/.test(html)) die(`${f} still requests Google Fonts`);
const fontB64 = Object.fromEntries([...fontsUsed].map(f => [f, readFileSync(P('src/assets/fonts', f)).toString('base64')]));
const fontInline = Object.values(fontB64).reduce((n, b) => n + b.length, 0);
if (fontInline > FONT_INLINE_MAX) die(`inlined fonts are ${(fontInline / 1024).toFixed(0)} KB, over ${FONT_INLINE_MAX / 1024} KB`);

/* web page */
const web = stamp(src.replace(/^[ \t]*<!-- @(end-)?web-only -->\n/gm, ''), 'site');
if (/__APP_(VERSION|BUILD)__/.test(web)) die('dist/index.html still contains a placeholder');
if (!web.startsWith('<!doctype html>')) die('dist/index.html must start with <!doctype html>');

/* artifact page */
let art = src.replace(/^[ \t]*<!-- @web-only -->\n[\s\S]*?^[ \t]*<!-- @end-web-only -->\n/gm, '');
art = stamp(art.replace(ICON_RE, (_, n) => '/_blob/' + blobs[n]), 'claude.ai');
{
  const FACE = /@font-face \{ font-family: "([^"]+)"; font-style: normal; font-weight: (\d+); font-display: swap; src: url\("assets\/fonts\/([\w-]+\.woff2)"\) format\("woff2"\); unicode-range: ([^;]+); \}/g;
  const BLOCK = /<style>\n\/\*[\s\S]*?\*\/\n((?:@font-face [^\n]*\n)+)<\/style>\n/;
  const m = art.match(BLOCK); if (!m) die('src/index.html: the @font-face <style> block was not found');
  const faces = [...m[1].matchAll(FACE)].map(x => x.slice(1)), ranges = [...new Set(faces.map(f => f[3]))];
  if (faces.length !== m[1].trim().split('\n').length) die('src/index.html: an @font-face rule is not in the expected one-line form');
  const js = `<script>
/* claude.ai build (scripts/build.mjs): the self-hosted fonts, each file once, registered with the same family, weight and
   unicode-range as the site's CSS font faces. A face that can't be decoded is skipped (fallback fonts). */
(() => {
  if (!window.FontFace || !document.fonts) return;
  const FILES = ${JSON.stringify(fontB64)};
  const RANGES = ${JSON.stringify(ranges)};
  const FACES = ${JSON.stringify(faces.map(([fam, w, f, r]) => [fam, w, f, ranges.indexOf(r)]))};
  const bytes = {};
  for (const [family, weight, file, r] of FACES) {
    try {
      const b = bytes[file] || (bytes[file] = Uint8Array.from(atob(FILES[file]), c => c.charCodeAt(0)));
      const face = new FontFace(family, b, { style: "normal", weight, unicodeRange: RANGES[r], display: "swap" });
      document.fonts.add(face); face.loaded.catch(() => {});
    } catch (e) { /* skipped */ }
  }
})();
</script>
`;
  art = art.replace(BLOCK, () => js);
  if (art.includes('@font-face')) die('dist-artifact/index.html still has an @font-face rule');
}
for (const bad of ['__APP_VERSION__', '__APP_BUILD__', 'assets/icons/', 'assets/fonts/', 'fonts.googleapis', 'fonts.gstatic', 'serviceWorker', 'manifest.webmanifest', '<!doctype', '<head>', '<body>'])
  if (art.includes(bad)) die(`dist-artifact/index.html still contains "${bad}"`);

/* output */
for (const d of [DIST, ART]) { rmSync(d, { recursive: true, force: true }); mkdirSync(d, { recursive: true }); }
cpSync(P('public'), DIST, { recursive: true });
cpSync(P('src/assets'), join(DIST, 'assets'), { recursive: true });
writeFileSync(join(DIST, 'index.html'), web);
writeFileSync(join(ART, 'index.html'), art);

/* service worker: build id = hash of everything it caches */
const files = walk(DIST).map(f => relative(DIST, f).split('\\').join('/')).sort();
const precache = ['./', ...files.filter(f => f === 'index.html' || f === 'manifest.webmanifest' || f === 'favicon.svg' || /^(assets\/icons|icons)\/.+\.png$/.test(f) || /^assets\/fonts\/.+\.woff2$/.test(f))];
const h = createHash('sha256');
for (const f of files) h.update(f + '\0').update(readFileSync(join(DIST, f)));
h.update(readFileSync(P('src/sw.js')));
const BUILD = h.digest('hex').slice(0, 12);
const sw = readFileSync(P('src/sw.js'), 'utf8').replace('__BUILD__', BUILD).replace('__PRECACHE__', JSON.stringify(precache, null, 1).replace(/\n\s*/g, ' '));
if (/__(BUILD|PRECACHE)__/.test(sw)) die('sw.js placeholders not filled');
writeFileSync(join(DIST, 'sw.js'), sw);
writeFileSync(join(DIST, 'build.json'), JSON.stringify({ build: BUILD }) + '\n');

const kb = f => (statSync(f).size / 1024).toFixed(1) + ' KB';
console.log(`build ${BUILD} · v${VERSION}`);
console.log(`  dist/index.html            ${kb(join(DIST, 'index.html'))} · ${walk(DIST).length} files · precache ${precache.length}`);
console.log(`  dist-artifact/index.html   ${kb(join(ART, 'index.html'))} · ${used.size} icons as /_blob/<id> · ${fontsUsed.size} fonts inlined once each (${(fontInline / 1024).toFixed(1)} KB base64)`);
if (!existsSync(join(DIST, 'CNAME'))) die('dist/CNAME missing');
