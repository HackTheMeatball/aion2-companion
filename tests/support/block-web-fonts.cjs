/* Preloaded into every suite by tests/run.mjs (node --require) unless it runs with --with-fonts.
   Web fonts are blocked so rendering is the same on every machine (fallback fonts, as in the environment the suites were
   written and tuned in), and layout checks don't depend on font files or network access:
   - pages from the test server (the site, its 404 page, the claude.ai build) are served with their fonts taken out: the
     self-hosted @font-face rules lose their src (an @font-face without src is ignored) and the claude.ai build's inlined
     font data is emptied (its FontFace registrations fail quietly). Rewriting the page rather than aborting the font
     requests matters for the pop-out: a window.open('') window that copies the styles never gets its font requests
     answered under interception, and a screenshot then waits for fonts forever.
   - requests for assets/fonts/*.woff2 are aborted as well, in case anything still asks for one;
   - service workers are blocked unless a context sets serviceWorkers itself (tests/site.js does): a worker's own
     requests aren't routed, so it would precache the fonts and serve them to the page;
   - Google Fonts (still requested by the old baselines in tests/baselines) fails to resolve. */
const pw = require('playwright');
/* Chromium on Linux takes a proxy from the environment; resolver rules don't apply to proxied hosts, so these two go direct. */
const HOSTS = 'fonts.googleapis.com,fonts.gstatic.com';
for (const k of ['no_proxy', 'NO_PROXY']) process.env[k] = [process.env[k], HOSTS].filter(Boolean).join(',');
const RULES = '--host-resolver-rules=MAP fonts.googleapis.com ~NOTFOUND, MAP fonts.gstatic.com ~NOTFOUND';
process.env.AION_FONTS_BLOCKED = '1'; /* tests/site.js checks that the blocking works */
const BASE = process.env.AION_BASE ? new URL(process.env.AION_BASE).origin : null;
const LOCAL_FONT = /\/assets\/fonts\/[^/]+\.woff2$/;
const FACE_SRC = /src: url\("\/?assets\/fonts\/[\w-]+\.woff2"\) format\("woff2"\);/g;
const INLINE_FONT = /("[\w-]+\.woff2"):"[A-Za-z0-9+/=]+"/g;
const isPage = u => (!BASE || u.origin === BASE) && (u.pathname.endsWith('/') || u.pathname.endsWith('.html') || !/\.[\w]+$/.test(u.pathname));
async function blockFonts(ctx) {
  await ctx.route(u => LOCAL_FONT.test(u.pathname), r => r.abort('blockedbyclient'));
  await ctx.route(isPage, async r => {
    if (r.request().resourceType() !== 'document') return r.fallback();
    const res = await r.fetch();
    if (!/text\/html/.test(res.headers()['content-type'] || '')) return r.fulfill({ response: res });
    await r.fulfill({ response: res, body: (await res.text()).replace(FACE_SRC, '').replace(INLINE_FONT, '$1:""') });
  });
}
const launch = pw.chromium.launch.bind(pw.chromium);
pw.chromium.launch = async (opts = {}) => {
  const b = await launch({ ...opts, args: [...(opts.args || []), RULES] });
  /* browser.newPage() goes through browser.newContext(), so this covers both */
  b.newContext = (newContext => async (o = {}) => { const ctx = await newContext({ serviceWorkers: 'block', ...o }); await blockFonts(ctx); return ctx; })(b.newContext.bind(b));
  return b;
};
