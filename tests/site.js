/* Standalone-site checks (the parts of the repo build that the single-file suites don't cover).
   node tests/site.js  (page at AION_BASE; see tests/config.js) */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const CFG = require('./config');
let fail = 0, n = 0; const ok = (name, c, d) => { n++; console.log((c ? 'ok   ' : 'FAIL ') + name + (!c && d !== undefined ? '  · ' + JSON.stringify(d).slice(0, 600) : '')); if (!c) fail++; };
/* fonts are self-hosted since 0.1.5; the suites block them (tests/support/block-web-fonts.cjs), so their requests fail */
const FONT_LOCAL = /\/assets\/fonts\/[^/]+\.woff2$/;
const FONT_FAMILIES = ['Marcellus SC', 'Figtree', 'JetBrains Mono'];
const FONT_FILES = ['figtree-latin', 'figtree-latin-ext', 'jetbrains-mono-latin', 'jetbrains-mono-latin-ext', 'marcellus-sc-latin', 'marcellus-sc-latin-ext'].map(f => f + '.woff2');
/* the families whose faces actually loaded, after waiting for the fonts the page uses */
const loadedFamilies = p => p.evaluate(async () => { await document.fonts.ready; await new Promise(r => setTimeout(r, 300)); await document.fonts.ready;
  return [...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/"/g, '')))].sort(); });
const KEY = 'aion2-assassin-route-v4';
const blobs = JSON.parse(fs.readFileSync(path.join(CFG.ROOT, 'scripts', 'artifact-blobs.json'), 'utf8'));
const VERSION = JSON.parse(fs.readFileSync(path.join(CFG.ROOT, 'package.json'), 'utf8')).version;
const REPO = 'https://github.com/hackthemeatball/aion2-companion';
/* footer version link + "Report a problem" link: the version comes from package.json; the report URL carries exactly these
   issue-form fields and nothing else from the save */
const REPORT_FIELDS = ['template', 'version', 'level', 'quest', 'mode', 'build', 'browser'];
const footerMeta = p => p.evaluate(() => { const v = document.getElementById('verLink'), r = document.getElementById('reportLink');
  r.dispatchEvent(new Event('focus'));
  return { vText: v && v.textContent, vHref: v && v.getAttribute('href'), vPrev: v && v.previousElementSibling && v.previousElementSibling.textContent,
    rText: r && r.textContent, rHref: r && r.href, rTarget: r && r.target, ua: navigator.userAgent }; });
const checkReport = (label, m, want) => {
  let u = null; try { u = new URL(m.rHref); } catch (e) { /* bad URL */ }
  const keys = u ? [...u.searchParams.keys()] : [], got = u ? Object.fromEntries(u.searchParams) : {};
  ok(`${label}: "Report a problem" opens the GitHub bug form in a new tab`, m.rText === 'Report a problem' && u && u.origin + u.pathname === REPO + '/issues/new' && m.rTarget === '_blank', m);
  ok(`${label}: report link carries only version, level, story quest, mode, build and browser`,
    JSON.stringify(keys) === JSON.stringify(REPORT_FIELDS) && Object.entries({ ...want, browser: m.ua }).every(([k, v]) => got[k] === v), { keys, got, want });
  ok(`${label}: report link has nothing else from the save`, !/g22|checks|seedLv12|migV5|stTriniel|dvReset/.test(decodeURIComponent(m.rHref)), m.rHref);
};

(async () => {
  const b = await chromium.launch();

  /* 1. standalone page: head, footer, no errors, export as a Blob download, service worker + offline */
  {
    const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 }, acceptDownloads: true, serviceWorkers: 'allow' }); const p = await ctx.newPage();
    const errs = [], bad = [], reqs = [];
    p.on('request', r => reqs.push(r.url()));
    p.on('pageerror', e => errs.push(e.message));
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
    p.on('requestfailed', r => { if (!FONT_LOCAL.test(new URL(r.url()).pathname)) bad.push(r.url() + ' ' + (r.failure() || {}).errorText); });
    p.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
    await p.goto(CFG.CUR); await p.waitForTimeout(600);
    /* first load, before the service worker controls the page (this context allows workers; the others block them) */
    if (process.env.AION_FONTS_BLOCKED) ok('fonts: blocked in the suites (fallback fonts render; --with-fonts lifts this)', !(await loadedFamilies(p)).length);
    const head = await p.evaluate(() => ({
      mode: document.compatMode, charset: document.characterSet, title: document.title,
      viewport: (document.querySelector('meta[name=viewport]') || {}).content, desc: !!(document.querySelector('meta[name=description]') || {}).content,
      canonical: (document.querySelector('link[rel=canonical]') || {}).href, manifest: (document.querySelector('link[rel=manifest]') || {}).href,
      icon: (document.querySelector('link[rel=icon]') || {}).href, theme: (document.querySelector('meta[name=theme-color]') || {}).content,
      og: ['og:title', 'og:description', 'og:url', 'og:image', 'og:type'].every(k => !!(document.querySelector(`meta[property="${k}"]`) || {}).content),
      lang: document.documentElement.lang }));
    ok('head: standards mode, UTF-8, title, viewport, description, canonical, theme-color, favicon, manifest, Open Graph, lang',
      head.mode === 'CSS1Compat' && head.charset === 'UTF-8' && head.title === 'Asmodian Assassin Route' && /width=device-width/.test(head.viewport) && head.desc &&
      head.canonical === 'https://aion2.ishkabytes.com/' && head.theme === '#110c13' && /favicon\.svg$/.test(head.icon) && /manifest\.webmanifest$/.test(head.manifest) && head.og && head.lang === 'en', head);
    const foot = await p.evaluate(() => { const f = document.querySelector('.fanline'), links = f ? [...f.querySelectorAll('a')] : [];
      return { text: f ? f.innerText : '', links: links.map(a => [a.textContent, a.getAttribute('href'), a.getAttribute('rel')]) }; });
    const mb = foot.links.find(l => l[0] === 'Metabot');
    ok('footer: fan-made / not affiliated with NCSoft line', /not affiliated with or endorsed by NCSoft/.test(foot.text), foot);
    ok('footer: Sources link + plain (dofollow) Metabot link', foot.links.some(l => l[0] === 'Sources' && l[1] === '#srcCard') && mb && /^https:\/\/metabot\.gg\//.test(mb[1]) && !/nofollow/.test(mb[2] || ''), foot.links);
    await p.click('#srcLink'); await p.waitForTimeout(150);
    ok('footer: the Sources link opens the Sources card', await p.evaluate(() => document.getElementById('srcCard').open));
    ok('all icons load (no broken images)', await p.evaluate(() => [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).map(i => i.getAttribute('src'))).then(x => !x.length), await p.evaluate(() => [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src'))));
    /* export without window.claude: visible button, plain Blob download of the saved state */
    await p.evaluate(k => localStorage.setItem(k, JSON.stringify({ checks: { 'g22:0': true }, level: 27, open: {}, quest: 'Preparations for Restoration', seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true })), KEY);
    await p.reload(); await p.waitForTimeout(500);
    const fm = await footerMeta(p);
    ok('footer: version after the Privacy link equals package.json, links to the CHANGELOG', fm.vText === 'v' + VERSION && fm.vPrev === 'Privacy' && fm.vHref === REPO + '/blob/main/CHANGELOG.md', { fm, VERSION });
    checkReport('footer', fm, { template: 'bug.yml', version: VERSION, level: '27', quest: 'Preparations for Restoration', mode: 'Advanced', build: 'site' });
    await p.click('.modeseg [data-mode=basic]'); await p.click('#lvlUp'); await p.waitForTimeout(100);
    const fm2 = await footerMeta(p), lv2 = await p.evaluate(() => String(state.level));
    checkReport('footer after a change', fm2, { template: 'bug.yml', version: VERSION, level: lv2, quest: 'Preparations for Restoration', mode: 'Basic', build: 'site' });
    await p.click('.modeseg [data-mode=advanced]'); await p.click('#lvlDown'); await p.waitForTimeout(100);
    ok('export: button visible outside claude.ai', await p.evaluate(() => !document.getElementById('expBtn').hidden));
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#expBtn')]);
    const exported = JSON.parse(fs.readFileSync(await dl.path(), 'utf8')), live = await p.evaluate(() => state);
    ok('export: Blob download equals the saved state', JSON.stringify(exported) === JSON.stringify(live) && exported.level === 27, dl.suggestedFilename());
    /* service worker */
    const sw = await p.evaluate(async () => { const r = await Promise.race([navigator.serviceWorker.ready, new Promise(res => setTimeout(() => res(null), 8000))]);
      return { ok: !!r, scope: r && r.scope, keys: await caches.keys(), build: await fetch('build.json').then(x => x.json()).then(x => x.build).catch(() => null) }; });
    ok('service worker registers on localhost (scope = site root)', sw.ok && sw.scope === CFG.BASE + '/', sw);
    ok('service worker cache is named after the build', sw.build && sw.keys.includes('aion2-route-' + sw.build), sw);
    await p.reload(); await p.waitForTimeout(400);
    ok('page is controlled by the service worker after a reload', await p.evaluate(() => !!navigator.serviceWorker.controller));
    await ctx.setOffline(true);
    await p.reload(); await p.waitForTimeout(700);
    const off = await p.evaluate(() => ({ cards: document.querySelectorAll('#nowStar .ns-card').length, lv: state.level, broken: [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).length }));
    ok('offline: the app shell, icons and saved progress load from the cache', off.cards > 0 && off.lv === 27 && off.broken === 0, off);
    await ctx.setOffline(false);
    ok('no page errors, failed requests or 4xx/5xx (the blocked font files aside)', !errs.length && !bad.length, { errs, bad });
    const third = reqs.filter(u => !u.startsWith(CFG.BASE + '/') && !/^(data|blob):/.test(u));
    ok('no third-party requests (fonts come from this site)', !third.length && reqs.some(u => FONT_LOCAL.test(new URL(u).pathname)), third);
    await ctx.close();
  }

  /* 2. manifest, 404, robots, CNAME */
  {
    const ctx = await b.newContext(), p = await ctx.newPage();
    const m = await (await p.request.get(CFG.BASE + '/manifest.webmanifest')).json();
    const icons = await Promise.all(m.icons.map(async i => [i.src, (await p.request.get(CFG.BASE + '/' + i.src)).status()]));
    ok('manifest: name, start_url, standalone, colors, 192/512 icons all served', m.name && m.short_name && m.start_url && m.display === 'standalone' && m.theme_color === '#110c13' &&
      ['192x192', '512x512'].every(s => m.icons.some(i => i.sizes === s)) && icons.every(([, s]) => s === 200), { m, icons });
    const r404 = await p.goto(CFG.BASE + '/no-such-page');
    ok('404: status 404 with the styled page and a link home', r404.status() === 404 && /Off the route/.test(await p.innerText('h1')) && await p.getAttribute('a.btn', 'href') === '/');
    const robots = await (await p.request.get(CFG.BASE + '/robots.txt')).text(), cname = await (await p.request.get(CFG.BASE + '/CNAME')).text();
    ok('robots.txt allows all + sitemap; CNAME is aion2.ishkabytes.com', /Allow: \//.test(robots) && /Sitemap: https:\/\/aion2\.ishkabytes\.com\/sitemap\.xml/.test(robots) && cname.trim() === 'aion2.ishkabytes.com', { robots, cname });
    await ctx.close();
  }

  /* 2b. self-hosted fonts: no Google Fonts anywhere in the built files; files + OFL texts shipped, served and precached;
     with the blocker lifted, all three families load in the site, the claude.ai build (inlined) and the 404 page */
  {
    const D = path.join(CFG.ROOT, 'dist'), rd = f => fs.readFileSync(path.join(CFG.ROOT, f), 'utf8');
    const built = { 'dist/index.html': rd('dist/index.html'), 'dist/404.html': rd('dist/404.html'), 'dist/sw.js': rd('dist/sw.js'), 'dist-artifact/index.html': rd('dist-artifact/index.html') };
    const google = Object.keys(built).filter(f => /fonts\.(googleapis|gstatic)\.com/.test(built[f]));
    ok('fonts: no fonts.googleapis.com / fonts.gstatic.com in the built HTML or service worker', !google.length, google);
    const shipped = fs.readdirSync(path.join(D, 'assets', 'fonts')).sort();
    ok('fonts: six WOFF2 files and three OFL license texts shipped in dist/assets/fonts', JSON.stringify(shipped) === JSON.stringify([...['OFL-Figtree.txt', 'OFL-JetBrainsMono.txt', 'OFL-MarcellusSC.txt'], ...FONT_FILES].sort()), shipped);
    ok('fonts: every font file is in the service worker precache', FONT_FILES.every(f => built['dist/sw.js'].includes(`"assets/fonts/${f}"`)));
    const artFiles = [...built['dist-artifact/index.html'].matchAll(/"([\w-]+\.woff2)":"[A-Za-z0-9+/=]{1000,}"/g)].map(x => x[1]).sort();
    ok('fonts: the claude.ai build inlines each font file once (no font URL, no @font-face)', !/assets\/fonts\/|@font-face/.test(built['dist-artifact/index.html']) && JSON.stringify(artFiles) === JSON.stringify([...FONT_FILES].sort()), artFiles);
    const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 } }); await ctx.unrouteAll(); const p = await ctx.newPage();
    const served = await Promise.all(FONT_FILES.map(async f => { const r = await p.request.get(CFG.BASE + '/assets/fonts/' + f); return [f, r.status(), r.headers()['content-type']]; }));
    ok('fonts: served as font/woff2', served.every(([, s, t]) => s === 200 && t === 'font/woff2'), served);
    await p.goto(CFG.CUR); const site = await loadedFamilies(p);
    await p.goto(CFG.BASE + '/artifact/'); const art = await loadedFamilies(p);
    await p.goto(CFG.BASE + '/no-such-page'); const nf = await loadedFamilies(p);
    ok('fonts: Marcellus SC, Figtree and JetBrains Mono load in the site, the claude.ai build and the 404 page', [site, art, nf].every(x => JSON.stringify(x) === JSON.stringify([...FONT_FAMILIES].sort())), { site, art, nf });
    await ctx.close();
  }

  /* 2c. persistent storage: asked on the standalone site only, only with saved progress, at most once a week, never in claude.ai */
  {
    const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 } });
    await ctx.addInitScript(() => { if (!navigator.storage) return;
      navigator.storage.persisted = async () => false;
      navigator.storage.persist = async () => { localStorage.setItem('__test:persistCalls', String(+(localStorage.getItem('__test:persistCalls') || 0) + 1)); return false; }; });
    const p = await ctx.newPage(), calls = () => p.evaluate(() => +(localStorage.getItem('__test:persistCalls') || 0));
    await p.goto(CFG.CUR); await p.waitForTimeout(400);
    const fresh = await calls();
    await p.evaluate(k => localStorage.setItem(k, JSON.stringify({ checks: {}, level: 12, open: {}, quest: '', seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true })), KEY);
    await p.reload(); await p.waitForTimeout(400); const first = await calls();
    await p.reload(); await p.waitForTimeout(400); const again = await calls();
    await p.evaluate(k => localStorage.setItem(k + ':persist-asked', String(Date.now() - 8 * 864e5)), KEY);
    await p.reload(); await p.waitForTimeout(400); const week = await calls();
    await p.goto(CFG.BASE + '/artifact/'); await p.waitForTimeout(400); const art = await calls();
    ok('persistent storage: not asked without saved progress; asked once with it; not again on reload; again after a week; never in the claude.ai build',
      fresh === 0 && first === 1 && again === 1 && week === 2 && art === 2, { fresh, first, again, week, art });
    await ctx.close();
  }

  /* 2d. a save that throws shows the warning banner with Export; the next save that works hides it; the data is unchanged */
  {
    const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 }, acceptDownloads: true });
    await ctx.addInitScript(k => { const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, v) { if (key === k && sessionStorage.getItem('__test:failSave') === '1') throw new DOMException('The quota has been exceeded.', 'QuotaExceededError'); return set.call(this, key, v); }; }, KEY);
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(CFG.CUR);
    await p.evaluate(k => localStorage.setItem(k, JSON.stringify({ checks: { 'g22:0': true }, level: 27, open: {}, quest: 'Preparations for Restoration', seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true })), KEY);
    await p.reload(); await p.waitForTimeout(400);
    const vis = () => p.evaluate(() => { const w = document.getElementById('saveWarn'), r = w.getBoundingClientRect();
      return { shown: !w.hidden && r.height > 0, text: w.innerText.trim(), exp: !document.getElementById('saveWarnExp').hidden, role: w.getAttribute('role') }; });
    await p.click('#lvlUp'); await p.waitForTimeout(100);
    const before = await vis();
    ok('save warning: hidden while saving works', !before.shown, before);
    await p.evaluate(() => sessionStorage.setItem('__test:failSave', '1'));
    await p.click('#lvlUp'); await p.waitForTimeout(100);
    const failed = await vis(), stored = await p.evaluate(k => JSON.parse(localStorage.getItem(k)).level, KEY);
    ok('save warning: shown when localStorage.setItem throws, with the Export action', failed.shown && failed.exp && failed.role === 'alert' && /^Your progress couldn.t be saved in this browser\. Export a backup\./.test(failed.text) && stored === 28, { failed, stored });
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#saveWarnExp')]);
    const exported = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
    ok('save warning: its Export button downloads the current (unsaved) progress', exported.level === 29 && JSON.stringify(exported) === JSON.stringify(await p.evaluate(() => state)), exported.level);
    await p.evaluate(() => sessionStorage.setItem('__test:failSave', '0'));
    await p.click('#lvlDown'); await p.waitForTimeout(100);
    const back = await vis(), saved = await p.evaluate(k => localStorage.getItem(k) === JSON.stringify(state), KEY);
    ok('save warning: hidden after the next successful save; saved data is exactly the state, under the same key', !back.shown && saved, { back, saved });
    ok('save warning: no page errors', !errs.length, errs);
    await ctx.close();
  }

  /* 3. claude.ai build: single file, icons as /_blob/<id>, no service worker / manifest; export through window.claude when present */
  {
    const art = fs.readFileSync(path.join(CFG.ROOT, 'dist-artifact', 'index.html'), 'utf8');
    const ids = [...art.matchAll(/\/_blob\/([0-9a-f]{32})/g)].map(x => x[1]), known = new Set(Object.values(blobs));
    ok('artifact build: every icon is a known /_blob/ id, no relative icon paths', ids.length >= Object.keys(blobs).length && ids.every(i => known.has(i)) && !/assets\/icons\//.test(art), ids.length);
    ok('artifact build: no service worker, manifest, canonical or document skeleton', !/serviceWorker|manifest\.webmanifest|rel="canonical"|<!doctype|<head>|<body>/i.test(art) && art.startsWith('<title>'));
    const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 } });
    await ctx.addInitScript(() => { window.__saved = []; window.claude = { use: async name => name === 'downloads' ? { save: async o => { window.__saved.push(o); } } : null }; });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(CFG.BASE + '/artifact/'); await p.waitForTimeout(600);
    await p.click('#expBtn'); await p.waitForTimeout(200);
    const r = await p.evaluate(() => ({ saved: window.__saved.map(o => [o.filename, JSON.parse(o.data).checks !== undefined]), sw: !!navigator.serviceWorker.controller, broken: [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).length }));
    ok('artifact build: Export goes through window.claude.use("downloads")', r.saved.length === 1 && /^aion2-assassin-progress-\d{4}-\d\d-\d\d\.json$/.test(r.saved[0][0]) && r.saved[0][1], r);
    if (process.env.AION_FONTS_BLOCKED) ok('artifact build: inlined fonts are blocked in the suites too', !(await loadedFamilies(p)).length);
    const am = await footerMeta(p);
    ok('artifact build: footer version equals package.json', am.vText === 'v' + VERSION && am.vHref === REPO + '/blob/main/CHANGELOG.md', am);
    checkReport('artifact build', am, { template: 'bug.yml', version: VERSION, level: '5', quest: '(not set)', mode: 'Advanced', build: 'claude.ai' });
    ok('artifact build: icons load, no service worker, no page errors', !r.broken && !r.sw && !errs.length, { r, errs });
    await ctx.close();
  }

  console.log(`${n - fail} ok, ${fail} failed`); console.log(fail ? `SITE CHECKS FAILED (${fail})` : 'SITE CHECKS PASSED');
  await b.close(); process.exit(fail ? 1 : 0);
})();
