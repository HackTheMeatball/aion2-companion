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
const REPO = 'https://github.com/hackthemeatball/daeva-companion';
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
      lang: document.documentElement.lang, touch: (document.querySelector('link[rel=apple-touch-icon]') || {}).href,
      brand: !!document.querySelector('header.top .brand-name[role=img][aria-label="Daeva Companion"]') }));
    ok('head: standards mode, UTF-8, title, viewport, description, canonical, theme-color, favicon, manifest, Open Graph, lang',
      head.mode === 'CSS1Compat' && head.charset === 'UTF-8' && head.title === 'Daeva Companion · Asmodian Assassin' && /width=device-width/.test(head.viewport) && head.desc &&
      head.canonical === 'https://daevacompanion.com/' && head.theme === '#110c13' && /favicon\.svg$/.test(head.icon) && /manifest\.webmanifest$/.test(head.manifest) && head.og && head.lang === 'en', head);
    ok('brand: apple-touch-icon link, Daeva Companion lockup in the header', /icons\/apple-touch-icon\.png$/.test(head.touch) && head.brand, head);
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
    ok('manifest: name, start_url, standalone, colors, 192/512 icons all served', m.name && m.short_name && m.start_url && m.display === 'standalone' && m.theme_color === '#0b1b1e' && m.background_color === '#110c13' &&
      ['192x192', '512x512'].every(s => m.icons.some(i => i.sizes === s)) && icons.every(([, s]) => s === 200), { m, icons });
    ok('manifest: Daeva Companion; separate "any" and "maskable" PNGs at 192 and 512 (no "any maskable")', /^Daeva Companion/.test(m.name) && m.short_name.length <= 12 &&
      ['any', 'maskable'].every(pu => ['192x192', '512x512'].every(s => m.icons.some(i => i.sizes === s && i.purpose === pu && /\.png$/.test(i.src)))) &&
      m.icons.every(i => !/ /.test(i.purpose)) && new Set(m.icons.map(i => i.src)).size === m.icons.length, m.icons);
    const touch = await p.request.get(CFG.BASE + '/icons/apple-touch-icon.png');
    ok('apple-touch-icon: 180 px PNG served', touch.status() === 200 && touch.headers()['content-type'] === 'image/png' && (await touch.body()).readUInt32BE(16) === 180);
    const r404 = await p.goto(CFG.BASE + '/no-such-page');
    ok('404: status 404 with the styled page and a link home', r404.status() === 404 && /Off the route/.test(await p.innerText('h1')) && await p.getAttribute('a.btn', 'href') === '/');
    const robots = await (await p.request.get(CFG.BASE + '/robots.txt')).text(), cname = await (await p.request.get(CFG.BASE + '/CNAME')).text();
    ok('robots.txt allows all + sitemap; CNAME is daevacompanion.com', /Allow: \//.test(robots) && /Sitemap: https:\/\/daevacompanion\.com\/sitemap\.xml/.test(robots) && cname.trim() === 'daevacompanion.com', { robots, cname });
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

  /* 2c. persistent storage: asked on the standalone site only, only with saved progress, once per browser session, never in
     claude.ai; nothing is added to localStorage */
  {
    const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 } });
    await ctx.addInitScript(() => { if (!navigator.storage) return;
      navigator.storage.persisted = async () => false;
      navigator.storage.persist = async () => { window.name = String(+(window.name || 0) + 1); return false; }; });
    const p = await ctx.newPage(), calls = () => p.evaluate(() => +(window.name || 0));
    await p.goto(CFG.CUR); await p.waitForTimeout(400);
    const fresh = await calls();
    await p.evaluate(k => localStorage.setItem(k, JSON.stringify({ checks: {}, level: 12, open: {}, quest: '', seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true })), KEY);
    await p.reload(); await p.waitForTimeout(400); const first = await calls();
    await p.reload(); await p.waitForTimeout(400); const again = await calls();
    const lsKeys = await p.evaluate(() => Object.keys(localStorage).sort());
    await p.evaluate(k => sessionStorage.removeItem(k + ':persist-asked'), KEY);
    await p.reload(); await p.waitForTimeout(400); const session = await calls();
    await p.goto(CFG.BASE + '/artifact/'); await p.waitForTimeout(400); const art = await calls();
    ok('persistent storage: not asked without saved progress; asked once with it; not again in the same session; again in a new session; never in the claude.ai build',
      fresh === 0 && first === 1 && again === 1 && session === 2 && art === 2, { fresh, first, again, session, art });
    ok('persistent storage: nothing added to localStorage', JSON.stringify(lsKeys) === JSON.stringify([KEY]), lsKeys);
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

  /* 2e. save safety (0.2.5, docs/design/0.2.5-save-safety.md §6): the "Last backup" line, the 14-day export nudge, the
     import rule and the one-time iPhone Safari Home Screen hint, with a fixed clock in a fixed time zone (noon, New York,
     no clock change in the days used) */
  {
    const T = Date.parse('2026-09-30T16:00:00Z'), DAY = 864e5, TZ = 'America/New_York';
    const SAVED = { checks: { 'g22:0': true }, level: 27, open: {}, quest: 'Preparations for Restoration', seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true };
    const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
    const page = async (opts = {}, init) => {
      const ctx = await b.newContext({ viewport: { width: opts.w || 1500, height: 1000 }, acceptDownloads: true, timezoneId: TZ, ...(opts.ua ? { userAgent: opts.ua } : {}) });
      if (init) await ctx.addInitScript(init);
      const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
      await p.clock.setFixedTime(T); await p.goto(CFG.CUR); await p.waitForTimeout(300);
      return { ctx, p, errs };
    };
    const load = async (p, save) => { await p.evaluate(([k, s]) => { localStorage.clear(); localStorage.setItem(k, JSON.stringify(s)); }, [KEY, save]); await p.reload(); await p.waitForTimeout(400); };
    const ui = p => p.evaluate(k => { const vis = id => { const e = document.getElementById(id); return !!e && !e.hidden && e.getBoundingClientRect().height > 0; };
      const l = document.getElementById('backupLine'), s = JSON.parse(localStorage.getItem(k) || 'null');
      return { line: l && l.textContent, stale: !!l && l.classList.contains('stale'), nudge: vis('nudge'), nudgeTxt: (document.getElementById('nudgeTxt') || {}).textContent,
        hint: vis('a2hs'), backup: s && s.backup, backup1: s && s.backup1, keys: Object.keys(localStorage).sort() }; }, KEY);

    /* line + export */
    {
      const { ctx, p, errs } = await page();
      await load(p, { ...SAVED, backup: { since: T - 3 * DAY } });
      const a = await ui(p);
      ok('backup line: "No backup yet." in the export row before any export; no nudge (baseline 3 days old)', a.line === 'No backup yet.' && !a.stale && !a.nudge && !a.hint, a);
      const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#expBtn')]); await p.waitForTimeout(100);
      const file = JSON.parse(fs.readFileSync(await dl.path(), 'utf8')), c = await ui(p), stored = await p.evaluate(k => localStorage.getItem(k), KEY);
      ok('backup line: after Export it reads "Last backup: today." and the save has backup.lastExportAt (no reload)', c.line === 'Last backup: today.' && c.backup && c.backup.lastExportAt === T && c.backup.since === T - 3 * DAY, c);
      ok('backup line: the export added no localStorage key; the save is still under ' + KEY, JSON.stringify(c.keys) === JSON.stringify(a.keys) && c.keys.includes(KEY), { before: a.keys, after: c.keys });
      ok('backup line: the exported file equals the stored save, lastExportAt included (stored before the file is built)', JSON.stringify(file) === JSON.stringify(JSON.parse(stored)) && file.backup.lastExportAt === T && file.backup.since === T - 3 * DAY, { file: file.backup, stored });
      for (const [n, text, stale] of [[1, 'Last backup: yesterday.', false], [13, 'Last backup: 13 days ago.', false], [14, 'Last backup: 14 days ago.', true]]) {
        await load(p, { ...SAVED, backup1: true, backup: { since: T - 99 * DAY, lastExportAt: T - n * DAY } }); const u = await ui(p);
        ok(`backup line: ${n} day(s) after an export: "${text}"${stale ? ', amber' : ''}`, u.line === text && u.stale === stale, u);
      }
      ok('backup line: no page errors', !errs.length, errs);
      await ctx.close();
    }
    /* nudge */
    {
      const { ctx, p, errs } = await page();
      await load(p, { ...SAVED, backup1: true, backup: { lastExportAt: T - 13 * DAY } });
      ok('nudge: not shown 13 days after an export', !(await ui(p)).nudge);
      await load(p, { ...SAVED, backup1: true, backup: { lastExportAt: T - 14 * DAY } });
      const n14 = await ui(p);
      ok('nudge: shown on day 14, same N as the line', n14.nudge && n14.nudgeTxt === "You haven't exported a backup in 14 days. Progress lives in this browser only." && n14.line === 'Last backup: 14 days ago.', n14);
      await load(p, { ...SAVED, backup1: true, backup: { lastExportAt: T - 15 * DAY } });
      const role = await p.evaluate(() => { const c = document.getElementById('nudge'); return c.closest('[role=status]') && c.closest('[role=status]').id; });
      ok('nudge: shown at 15 days in the full view, inside the role=status slot', (await ui(p)).nudge && role === 'bkNote', role);
      await p.click('.modeseg [data-mode=basic]'); await p.waitForTimeout(100);
      ok('nudge: shown in Basic mode too', (await ui(p)).nudge);
      await p.evaluate(() => setSaveWarn(true));
      const sw = (await ui(p)).nudge; await p.evaluate(() => setSaveWarn(false));
      ok('nudge: hidden while the save-failed banner shows, back when it goes', !sw && (await ui(p)).nudge, sw);
      await p.click('#nudgeNo'); await p.waitForTimeout(100);
      const no = await ui(p); await p.reload(); await p.waitForTimeout(400); const no2 = await ui(p);
      ok('nudge: Not now hides it, records nudgeAt and it stays gone after a reload', !no.nudge && no.backup.nudgeAt === T && !no2.nudge && !no2.hint, { no, no2 });
      await load(p, { ...SAVED, backup1: true, backup: { since: T - 30 * DAY } });
      const yet = await ui(p);
      ok('nudge: never exported, baseline 30 days old: the "yet" text', yet.nudge && yet.nudgeTxt === "You haven't exported a backup yet. Progress lives in this browser only." && yet.line === 'No backup yet.', yet);
      const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#nudgeExp')]); await p.waitForTimeout(100);
      const ex = await ui(p);
      ok('nudge: its Export downloads the progress, hides the card and updates the line', !!dl && !ex.nudge && ex.line === 'Last backup: today.' && ex.backup.lastExportAt === T, ex);
      await load(p, { checks: {}, level: 1, open: {}, quest: '', seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true, backup1: true, backup: { since: T - 30 * DAY } });
      ok('nudge: no progress (Lv 1, no ticks) = no nudge', !(await ui(p)).nudge);
      ok('nudge: no page errors', !errs.length, errs);
      await ctx.close();
    }
    /* import */
    {
      const { ctx, p, errs } = await page();
      await load(p, { ...SAVED, backup1: true, backup: { lastExportAt: T - 2 * DAY } });
      const file = { ...SAVED, level: 30, backup1: true, backup: { since: T - 40 * DAY, lastExportAt: T - 20 * DAY, nudgeAt: T - 30 * DAY, a2hsAt: T - 30 * DAY } };
      await p.setInputFiles('#impIn', { name: 'progress.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(file)) });
      await Promise.all([p.waitForEvent('load'), p.click('#impGo')]); await p.waitForTimeout(400);
      const u = await ui(p);
      ok('import: the file\'s backup is replaced by { since, lastExportAt } = the import time; backup1 set; no nudge; line "today"',
        JSON.stringify(u.backup) === JSON.stringify({ since: T, lastExportAt: T }) && u.backup1 === true && !u.nudge && u.line === 'Last backup: today.' && await p.evaluate(() => state.level === 30), u);
      ok('import: no page errors', !errs.length, errs);
      await ctx.close();
    }
    /* Home Screen hint */
    {
      const { ctx, p, errs } = await page({ ua: IPHONE, w: 390 });
      await load(p, { ...SAVED, backup1: true, backup: { since: T - 2 * DAY } });
      const h = await ui(p), txt = await p.evaluate(() => document.querySelector('#a2hs span').textContent);
      ok('hint: shown in iPhone Safari with progress, in the same role=status slot', h.hint && !h.nudge && /^Safari can clear a site's saved data/.test(txt) && await p.evaluate(() => document.getElementById('a2hs').closest('[role=status]').id === 'bkNote'), { h, txt });
      await Promise.all([p.waitForEvent('download'), p.click('#a2hsExp')]); await p.waitForTimeout(100);
      ok('hint: its Export keeps the card (Share and Add to Home Screen come next)', (await ui(p)).hint);
      await p.click('#a2hsOk'); await p.waitForTimeout(100);
      const ok1 = await ui(p); await p.reload(); await p.waitForTimeout(400); const ok2 = await ui(p);
      ok('hint: Got it hides it for good (a2hsAt stored; gone after a reload)', !ok1.hint && ok1.backup.a2hsAt === T && !ok2.hint, { ok1, ok2 });
      await load(p, { ...SAVED, backup1: true, backup: { since: T - 20 * DAY } });
      const both = await ui(p);
      ok('hint: when the nudge is due too, only the nudge shows', both.nudge && !both.hint, both);
      ok('hint: no page errors', !errs.length, errs);
      await ctx.close();
      const absent = {};
      for (const [name, ua, init] of [['desktop', null], ['Chrome on iOS', IPHONE.replace('Version/18.0', 'CriOS/130.0.0.0')], ['in-app WebView', IPHONE.replace(' Safari/604.1', ' Instagram 350.0')],
        ['opened from the Home Screen', IPHONE, () => Object.defineProperty(navigator, 'standalone', { get: () => true })]]) {
        const x = await page({ ua, w: 390 }, init); await load(x.p, { ...SAVED, backup1: true, backup: { since: T - 2 * DAY } });
        absent[name] = (await ui(x.p)).hint; await x.ctx.close();
      }
      ok('hint: absent on desktop, Chrome on iOS, an in-app WebView and when opened from the Home Screen', Object.values(absent).every(v => !v), absent);
    }
  }

  /* 3. claude.ai build: single file, icons as /_blob/<id>, no service worker / manifest; export through window.claude when present */
  {
    const art = fs.readFileSync(path.join(CFG.ROOT, 'dist-artifact', 'index.html'), 'utf8');
    const ids = [...art.matchAll(/\/_blob\/([0-9a-f]{32})/g)].map(x => x[1]), known = new Set(Object.values(blobs).filter(Boolean));
    ok('artifact build: every icon is a known /_blob/ id, no relative icon paths', ids.length >= known.size && ids.every(i => known.has(i)) && [...known].every(i => ids.includes(i)) && !/assets\/icons\//.test(art), ids.length);
    /* Icons with no blob id yet (null: added after the artifact was frozen) ship on the site only; the artifact shows initials. */
    const noBlob = Object.keys(blobs).filter(n => blobs[n] === null), web = fs.readFileSync(path.join(CFG.ROOT, 'dist', 'index.html'), 'utf8');
    ok('artifact build: icons without a blob id are on the site build and in dist/assets/icons, absent from the artifact', noBlob.every(n => web.includes(`assets/icons/${n}.png`) && fs.existsSync(path.join(CFG.ROOT, 'dist', 'assets', 'icons', n + '.png')) && !art.includes(n + '.png')), noBlob);
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
    checkReport('artifact build', am, { template: 'bug.yml', version: VERSION, level: '1', quest: 'A Village in the Fog', mode: 'Advanced', build: 'claude.ai' });   /* 0.2.1: fresh browser = Lv 1, first quest */
    ok('artifact build: icons load, no service worker, no page errors', !r.broken && !r.sw && !errs.length, { r, errs });
    /* 0.2.5 save safety: none of its UI in the claude.ai build (with or without downloads), while the shared storage side
       still gives the save its backup baseline */
    const SAFETY_UI = ['bkNote', 'nudge', 'a2hs', 'backupLine', 'nudgeTxt', 'nudgeExp', 'nudgeNo', 'a2hsExp', 'a2hsOk'];
    /* (the line's wording is in the shared core module, src/core/backup.js, which nothing calls in this build) */
    ok('artifact build: no save-safety markup in the file', SAFETY_UI.every(id => !art.includes(`id="${id}"`)) && !/class="(card nudge|backup-line)"|Add to Home Screen|Not now|Got it/.test(art));
    const noUI = pg => pg.evaluate(ids => ids.filter(id => document.getElementById(id)).concat([...document.querySelectorAll('.nudge, .backup-line')].map(e => e.className)), SAFETY_UI);
    const withDl = await noUI(p);
    const ctx2 = await b.newContext({ viewport: { width: 1500, height: 1000 } });
    await ctx2.addInitScript(() => { window.claude = { use: async () => null }; });
    const p2 = await ctx2.newPage(); await p2.goto(CFG.BASE + '/artifact/'); await p2.waitForTimeout(500);
    const noDl = await noUI(p2); await p2.click('#lvlUp'); await p2.waitForTimeout(100);
    const st = await p2.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), KEY);
    ok('artifact build: no save-safety UI in the DOM with or without the downloads permission; the save still gains backup',
      !withDl.length && !noDl.length && st && st.backup1 === true && st.backup && typeof st.backup.since === 'number' && st.backup.since > 0, { withDl, noDl, backup: st && st.backup });
    await ctx2.close();
    const ini = await p.evaluate(() => Object.entries(SP_ICONS).filter(([, v]) => !v).map(([n]) => [n, /class="spmini ini"/.test(spMini(n))]));
    ok('artifact build: a skill whose icon has no blob id gets the initials square, not a broken image', ini.length === noBlob.filter(n => n.startsWith('sk-')).length && ini.every(x => x[1]), ini);
    await ctx.close();
  }

  console.log(`${n - fail} ok, ${fail} failed`); console.log(fail ? `SITE CHECKS FAILED (${fail})` : 'SITE CHECKS PASSED');
  await b.close(); process.exit(fail ? 1 : 0);
})();
