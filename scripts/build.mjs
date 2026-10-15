#!/usr/bin/env node
/* Build both deliverables from src/ (dev dependency: esbuild; Node 22).

   Source layout (0.2 P1–P3):
     src/index.html            the page shell: head, markup, and tags naming the files the build inlines
     src/styles/*.css          the styles: fonts.css (the @font-face rules), app.css and brand.css; inlined verbatim
     src/main.js               the app script (ES module entry)
     src/data/*.js             the hand-written data tables (and the text helpers they use), imported by main.js
     src/core/*.js             the pure core (0.2 P3): state, migrations, catalog, requirements, Next up ranking; no DOM
     src/data/generated.js     not a file: the build makes this module from data/** (data format v2) with
                               tools/gen/gen.mjs, in memory, on every build
     src/site.js               the standalone site's own script (persistent storage, service worker); site only
   The shell's <link rel="stylesheet" href="styles/X.css"> lines become <style> elements holding the file as it is, and
   its <script type="module" src="X.js"></script> lines become one classic <script> each holding the esbuild bundle of
   that entry (no minification, no tree shaking, so every top-level name stays a page global, as before modules).
   src/index.html is not runnable on its own: build, then `npm run serve`.

   dist/                       GitHub Pages site
     index.html                the shell with styles and scripts inlined, build markers removed
     assets/icons/*.png        the icons the page references (src/assets/icons)
     assets/fonts/*            the self-hosted fonts (WOFF2) and their OFL license texts (src/assets/fonts)
     public/*                  CNAME, robots.txt, sitemap.xml, 404.html, favicon.svg, manifest, manifest icons
     sw.js                     src/sw.js with the build id and precache list filled in
   dist-artifact/index.html    single file for publishing to claude.ai: the <!-- @web-only --> blocks removed
                               (document skeleton, SEO/PWA head, site.js), icon paths rewritten to the
                               artifact's /_blob/<id> URLs (scripts/artifact-blobs.json), styles/fonts.css
                               replaced by a script that registers each font file once (FontFace API).

   Markers in src/index.html: a line "<!-- @web-only -->" opens a block, "<!-- @end-web-only -->" closes it.
   Placeholders anywhere in the page: __APP_VERSION__ becomes package.json's version, __APP_BUILD__ the build's name
   ("site" in dist/, "claude.ai" in dist-artifact/), so the version is never written by hand in the page.
   Usage: node scripts/build.mjs */
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { genModule, generatedData, generatedNames, staleGenerated } from './generated-data.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const P = (...p) => join(ROOT, ...p);
const DIST = P('dist'), ART = P('dist-artifact');
const OPEN = '<!-- @web-only -->', CLOSE = '<!-- @end-web-only -->';

const die = msg => { console.error('build: ' + msg); process.exit(1); };
const walk = dir => readdirSync(dir).flatMap(n => { const f = join(dir, n); return statSync(f).isDirectory() ? walk(f) : [f]; });

const shell = readFileSync(P('src/index.html'), 'utf8');

/* inlining: styles verbatim, scripts as esbuild bundles. esbuild's CSS printer rewrites values (unquoted url(), one
   unicode-range per line), which the claude.ai font conversion and the test font blocker read, so CSS is not passed
   through it; it can be once the styles are split into @import partials. */
const STYLE_TAG = /^<link rel="stylesheet" href="(styles\/[\w.-]+\.css)">\n/gm;
const SCRIPT_TAG = /^<script type="module" src="([\w.-]+\.js)"><\/script>\n/gm;

/* the generated data module (0.2 step 5b): compiled from data/** by tools/gen/gen.mjs at build time, never stored (a stale
   copy in src/ would shadow nothing but mislead, so the build refuses it). The esbuild plugin is shared with the Node
   core tests. A schema error or a failed data check stops the build. */
if (staleGenerated()) die('src/data/generated.js exists: the build makes that module from data/** (tools/gen/gen.mjs); delete the file');
try { genModule(); } catch (e) { die(e.message); }
const bundleOne = async entry => {
  const r = await build({ absWorkingDir: ROOT, entryPoints: ['src/' + entry], bundle: true, write: false, format: 'esm', platform: 'browser',
    treeShaking: false, minify: false, charset: 'utf8', legalComments: 'inline', logLevel: 'silent', plugins: [generatedData] })
    .catch(e => die(`src/${entry}: ${e.errors ? e.errors.map(x => x.text + (x.location ? ` (${x.location.file}:${x.location.line})` : '')).join('; ') : e.message}`));
  for (const w of r.warnings) console.warn(`build: esbuild warning in src/${entry}: ${w.text}` + (w.location ? ` (${w.location.file}:${w.location.line})` : ''));
  const js = r.outputFiles[0].text;
  if (/^\s*(import|export)\b/m.test(js)) die(`src/${entry}: the bundle still has an import/export statement (it is inlined as a classic script)`);
  if (/<\/script/i.test(js)) die(`src/${entry}: the bundle contains "</script"`);
  return js;
};
/* one global namespace until P3: esbuild would silently rename one of two same-named top-level declarations in different
   modules, breaking the globals the page, site.js and the tests use. Checks every declaration that starts a line
   (the first name of a multi-name declaration). */
{
  const DECL = /^(?:export )?(?:const|let|var|function\*?|async function|class) +([\w$]+)/gm, seen = new Map(generatedNames().map(n => [n, 'the generated data module']));
  for (const f of ['src/main.js', ...['data', 'core'].flatMap(d => readdirSync(P('src', d)).filter(n => n.endsWith('.js')).map(n => `src/${d}/${n}`))])
    for (const m of readFileSync(P(f), 'utf8').matchAll(DECL)) {
      if (seen.has(m[1]) && seen.get(m[1]) !== f) die(`top-level name "${m[1]}" is declared in both ${seen.get(m[1])} and ${f} (the bundle would rename one)`);
      seen.set(m[1], f);
    }
}
const bundles = Object.fromEntries(await Promise.all([...new Set([...shell.matchAll(SCRIPT_TAG)].map(m => m[1]))].map(async e => [e, await bundleOne(e)])));
const bundle = entry => bundles[entry];
const inline = html => html
  .replace(STYLE_TAG, (_, f) => { const css = readFileSync(P('src', f), 'utf8'); if (/<\/style/i.test(css)) die(`src/${f} contains "</style"`); return `<style>\n${css}</style>\n`; })
  .replace(SCRIPT_TAG, (_, f) => `<script>\n${bundle(f)}</script>\n`);
if (!shell.match(STYLE_TAG) || !shell.match(SCRIPT_TAG)) die('src/index.html: no <link rel="stylesheet" href="styles/…"> or <script type="module" src="…"> to inline');
for (const m of shell.matchAll(/<(link rel="stylesheet"|script)[^>]*>/g)) if (!/^<(link rel="stylesheet" href="styles\/[\w.-]+\.css"|script type="module" src="[\w.-]+\.js")>$/.test(m[0]) && m[0] !== '<script>')
  die(`src/index.html: "${m[0]}" is not a tag the build inlines (one per line, styles/X.css or X.js)`);
const src = inline(shell); /* the whole page, markers kept: what the checks below read */
const blobs = JSON.parse(readFileSync(P('scripts/artifact-blobs.json'), 'utf8'));
const VERSION = JSON.parse(readFileSync(P('package.json'), 'utf8')).version;
if (!/^\d+\.\d+\.\d+$/.test(VERSION || '')) die(`package.json version "${VERSION}" is not X.Y.Z`);
if (!src.includes('__APP_VERSION__') || !src.includes('__APP_BUILD__')) die('src/ lacks the __APP_VERSION__ / __APP_BUILD__ placeholders');
const stamp = (html, build) => html.replaceAll('__APP_VERSION__', VERSION).replaceAll('__APP_BUILD__', build);

/* markers: balanced, on their own lines, not nested */
{
  let depth = 0;
  shell.split('\n').forEach((line, i) => {
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
  if (!shipped.includes(n)) die(`src/ references assets/icons/${n}.png, which is missing`);
  if (!(n in blobs)) die(`no artifact blob id for ${n} in scripts/artifact-blobs.json (null = not uploaded yet)`);
}
for (const n of shipped) if (!used.has(n)) die(`src/assets/icons/${n}.png is not referenced by src/`);

/* fonts (self-hosted since 0.1.5): every referenced file exists, every shipped file is referenced, each family ships its
   OFL text; no request may go to a font service. The claude.ai build must stay one file, so its @font-face block becomes
   a small script holding each file once (base64) and registering the same faces through the FontFace API (as data:
   URLs in CSS, the files shared by several weights would be repeated); they are kept under FONT_INLINE_MAX. */
const FONT_RE = /assets\/fonts\/([\w-]+\.woff2)/g, FONT_INLINE_MAX = 150 * 1024;
const fontsUsed = new Set([...src.matchAll(FONT_RE)].map(m => m[1]));
const fontsShipped = readdirSync(P('src/assets/fonts')).filter(f => f.endsWith('.woff2'));
for (const f of fontsUsed) if (!fontsShipped.includes(f)) die(`src/ references assets/fonts/${f}, which is missing`);
for (const f of fontsShipped) if (!fontsUsed.has(f)) die(`src/assets/fonts/${f} is not referenced by src/`);
if (readdirSync(P('src/assets/fonts')).filter(f => /^OFL-.+\.txt$/.test(f)).length < 3) die('src/assets/fonts: an OFL license text is missing');
for (const [f, html] of [['src/', src], ['public/404.html', readFileSync(P('public/404.html'), 'utf8')]])
  if (/fonts\.(googleapis|gstatic)\.com/.test(html)) die(`${f} still requests Google Fonts`);
const fontB64 = Object.fromEntries([...fontsUsed].map(f => [f, readFileSync(P('src/assets/fonts', f)).toString('base64')]));
const fontInline = Object.values(fontB64).reduce((n, b) => n + b.length, 0);
if (fontInline > FONT_INLINE_MAX) die(`inlined fonts are ${(fontInline / 1024).toFixed(0)} KB, over ${FONT_INLINE_MAX / 1024} KB`);

/* web page */
const web = stamp(src.replace(/^[ \t]*<!-- @(end-)?web-only -->\n/gm, ''), 'site');
if (/__APP_(VERSION|BUILD)__/.test(web)) die('dist/index.html still contains a placeholder');
if (!web.startsWith('<!doctype html>')) die('dist/index.html must start with <!doctype html>');

/* artifact page: the web-only blocks go before inlining (site.js is never bundled into it), styles/fonts.css becomes the
   FontFace script */
const FONTS_TAG = '<link rel="stylesheet" href="styles/fonts.css">\n';
let art = shell.replace(/^[ \t]*<!-- @web-only -->\n[\s\S]*?^[ \t]*<!-- @end-web-only -->\n/gm, '');
if (!art.includes(FONTS_TAG)) die('src/index.html: the styles/fonts.css <link> is missing (or web-only)');
{
  const FACE = /^@font-face \{ font-family: "([^"]+)"; font-style: normal; font-weight: (\d+); font-display: swap; src: url\("assets\/fonts\/([\w-]+\.woff2)"\) format\("woff2"\); unicode-range: ([^;]+); \}$/;
  const css = readFileSync(P('src/styles/fonts.css'), 'utf8').replace(/^\/\*[\s\S]*?\*\/\n/, '');
  const lines = css.trimEnd().split('\n');
  if (!lines.length || !lines.every(l => FACE.test(l))) die('src/styles/fonts.css: after its leading comment, every line must be an @font-face rule in the expected one-line form');
  const faces = lines.map(l => l.match(FACE).slice(1)), ranges = [...new Set(faces.map(f => f[3]))];
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
  art = art.replace(FONTS_TAG, () => js);
}
/* An icon added after the claude.ai artifact was frozen (DECISIONS D4) has no blob id until someone uploads it to the
   artifact: null in scripts/artifact-blobs.json. The artifact build drops it (its quoted path becomes ""), so the page
   shows the initials square there, as before the icon existed. Such an icon may only be referenced as a quoted string. */
const NO_BLOB = /(["'])assets\/icons\/([\w-]+)\.png\1/g;
art = stamp(inline(art).replace(NO_BLOB, (m, q, n) => blobs[n] === null ? q + q : m)
  .replace(ICON_RE, (_, n) => blobs[n] ? '/_blob/' + blobs[n] : die(`assets/icons/${n}.png has no blob id and is not a quoted string`)), 'claude.ai');
if (art.includes('@font-face')) die('dist-artifact/index.html still has an @font-face rule');
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
console.log(`  dist-artifact/index.html   ${kb(join(ART, 'index.html'))} · ${[...used].filter(n => blobs[n]).length} icons as /_blob/<id>${[...used].some(n => blobs[n] === null) ? ` · ${[...used].filter(n => blobs[n] === null).length} without a blob id (initials there)` : ''} · ${fontsUsed.size} fonts inlined once each (${(fontInline / 1024).toFixed(1)} KB base64)`);
if (!existsSync(join(DIST, 'CNAME'))) die('dist/CNAME missing');
