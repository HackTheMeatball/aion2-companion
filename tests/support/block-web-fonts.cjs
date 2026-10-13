/* Preloaded into every suite by tests/run.mjs (node --require) unless it runs with --with-fonts.
   Google Fonts is the page's only external request. Blocking it makes rendering the same on every machine (fallback fonts,
   as in the environment the suites were written and tuned in), so layout checks don't depend on network access.
   The request is still made and fails fast, exactly as on a machine without access to fonts.googleapis.com. */
const pw = require('playwright');
/* Chromium on Linux takes a proxy from the environment; resolver rules don't apply to proxied hosts, so these two go direct. */
const HOSTS = 'fonts.googleapis.com,fonts.gstatic.com';
for (const k of ['no_proxy', 'NO_PROXY']) process.env[k] = [process.env[k], HOSTS].filter(Boolean).join(',');
const RULES = '--host-resolver-rules=MAP fonts.googleapis.com ~NOTFOUND, MAP fonts.gstatic.com ~NOTFOUND';
const launch = pw.chromium.launch.bind(pw.chromium);
pw.chromium.launch = (opts = {}) => launch({ ...opts, args: [...(opts.args || []), RULES] });
