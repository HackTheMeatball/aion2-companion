/* Preloaded into every suite by tests/run.mjs (node --require) unless it runs with --with-fonts.
   Web fonts are blocked so rendering is the same on every machine (fallback fonts, as in the environment the suites were
   written and tuned in), and layout checks don't depend on font files or network access:
   - the self-hosted fonts (assets/fonts/*.woff2, since 0.1.5) are aborted in every browser context, and service workers
     are blocked unless a context sets serviceWorkers itself (a worker would fetch and serve the fonts unrouted);
   - the claude.ai build (/artifact/) inlines them (base64, registered with the FontFace API); the served page gets empty
     strings instead, so every face fails to decode;
   - Google Fonts (still requested by the old baselines in tests/baselines) fails to resolve.
   The requests are still made and fail fast, exactly as when a font can't be loaded. */
const pw = require('playwright');
/* Chromium on Linux takes a proxy from the environment; resolver rules don't apply to proxied hosts, so these two go direct. */
const HOSTS = 'fonts.googleapis.com,fonts.gstatic.com';
for (const k of ['no_proxy', 'NO_PROXY']) process.env[k] = [process.env[k], HOSTS].filter(Boolean).join(',');
const RULES = '--host-resolver-rules=MAP fonts.googleapis.com ~NOTFOUND, MAP fonts.gstatic.com ~NOTFOUND';
const LOCAL_FONT = /\/assets\/fonts\/[^/]+\.woff2$/;
const INLINE_FONT = /("[\w-]+\.woff2"):"[A-Za-z0-9+/=]+"/g;
async function blockFonts(ctx) {
  await ctx.route(u => LOCAL_FONT.test(u.pathname), r => r.abort('blockedbyclient'));
  await ctx.route(u => /^\/artifact\/(index\.html)?$/.test(u.pathname), async r => {
    const res = await r.fetch();
    await r.fulfill({ response: res, body: (await res.text()).replace(INLINE_FONT, '$1:""') });
  });
}
process.env.AION_FONTS_BLOCKED = '1'; /* tests/site.js checks the blocking works */
const launch = pw.chromium.launch.bind(pw.chromium);
pw.chromium.launch = async (opts = {}) => {
  const b = await launch({ ...opts, args: [...(opts.args || []), RULES] });
  /* browser.newPage() goes through browser.newContext(), so this covers both */
  const newContext = b.newContext.bind(b);
  /* Service workers are blocked unless a context asks for them (tests/site.js does): requests a service worker makes
     aren't routed, so a worker would precache the fonts and serve them to the page. */
  b.newContext = async (o = {}) => { const ctx = await newContext({ serviceWorkers: 'block', ...o }); await blockFonts(ctx); return ctx; };
  return b;
};
