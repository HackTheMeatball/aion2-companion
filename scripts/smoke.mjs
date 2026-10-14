#!/usr/bin/env node
/* Post-deploy smoke test for the live site (CI "smoke" job, after "deploy"; "release" needs it).

   1. Polls <url>/build.json, bypassing caches, until it equals the build.json the deploy job built (dist/build.json),
      for up to --timeout seconds. GitHub Pages can take a while to serve a new deployment, and its CDN caches.
   2. Fetches <url>/ the same way and checks the footer version link (#verLink) reads "v<package.json version>".

   Failures are printed as GitHub ::error annotations (readable without log access) and exit 1.
   No dependencies (Node 22 fetch).

   Usage: node scripts/smoke.mjs --expect '{"build":"…"}' [--url https://daevacompanion.com] [--version X.Y.Z]
                                 [--timeout 300] [--interval 10]
     --expect    the expected build.json: its JSON text, or a path to the file (default: dist/build.json)
     --version   the expected footer version (default: package.json's)
   Locally, against `npm run serve`: node scripts/smoke.mjs --url http://localhost:8080 --timeout 0 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf('--' + name); return i >= 0 && i + 1 < args.length ? args[i + 1] : def; };

/* annotation text: GitHub's workflow-command escaping, so a multi-line message stays one annotation */
const esc = s => String(s).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
const fail = (title, msg) => { console.log(`::error title=${esc(title)}::${esc(msg)}`); process.exit(1); };

const BASE = opt('url', 'https://daevacompanion.com').replace(/\/+$/, '');
const TIMEOUT = Number(opt('timeout', '300')), INTERVAL = Number(opt('interval', '10'));
if (!(TIMEOUT >= 0) || !(INTERVAL > 0)) fail('Smoke: bad arguments', `--timeout ${TIMEOUT} / --interval ${INTERVAL}`);
const VERSION = opt('version', JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version);
if (!/^\d+\.\d+\.\d+$/.test(VERSION || '')) fail('Smoke: bad version', `expected version "${VERSION}" is not X.Y.Z`);

/* expected build.json: compared as parsed JSON with sorted keys, so whitespace or a trailing newline don't matter */
const canon = v => v && typeof v === 'object' && !Array.isArray(v)
  ? '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}'
  : Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : JSON.stringify(v);
let expectText = opt('expect', join(ROOT, 'dist', 'build.json'));
if (!expectText.trim().startsWith('{')) {
  if (!existsSync(expectText)) fail('Smoke: no expected build', `--expect "${expectText}" is neither JSON nor an existing file`);
  expectText = readFileSync(expectText, 'utf8');
}
let expected;
try { expected = JSON.parse(expectText); } catch (e) { fail('Smoke: bad expected build', `--expect is not JSON: ${e.message}`); }
if (!expected || typeof expected.build !== 'string' || !expected.build) fail('Smoke: bad expected build', `expected build.json has no "build" id: ${expectText.trim()}`);
const EXPECT = canon(expected);

/* every request gets a fresh query string (the CDN caches per URL) and no-cache headers */
const why = e => e.cause?.code || e.cause?.errors?.[0]?.code || e.cause?.message || e.message;
const get = async path => {
  const u = `${BASE}${path}${path.includes('?') ? '&' : '?'}smoke=${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const r = await fetch(u, { cache: 'no-store', redirect: 'follow', signal: AbortSignal.timeout(20000),
    headers: { 'cache-control': 'no-cache', pragma: 'no-cache', 'user-agent': 'daeva-companion-smoke' } });
  return { status: r.status, text: await r.text() };
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

console.log(`smoke: ${BASE} · expecting build.json ${EXPECT} and footer v${VERSION} (polling up to ${TIMEOUT}s)`);

/* 1. build.json */
const t0 = Date.now();
let last = 'no response';
for (let n = 1; ; n++) {
  try {
    const { status, text } = await get('/build.json');
    if (status !== 200) last = `HTTP ${status}`;
    else {
      let got;
      try { got = canon(JSON.parse(text)); } catch { got = null; }
      if (got === EXPECT) { console.log(`smoke: build.json matches after ${Math.round((Date.now() - t0) / 1000)}s (attempt ${n})`); break; }
      last = got === null ? `not JSON: ${text.slice(0, 120)}` : got;
    }
  } catch (e) { last = `no response (${why(e)})`; }
  const waited = (Date.now() - t0) / 1000;
  if (waited + INTERVAL > TIMEOUT) fail('Smoke: live build.json is not the deployed build',
    `${BASE}/build.json still serves ${last} after ${Math.round(waited)}s (${n} attempts); the deploy job built ${EXPECT}. ` +
    'The deploy may not have gone live, or the CDN is serving a stale copy.');
  console.log(`smoke: attempt ${n}: ${last}; retrying in ${INTERVAL}s`);
  await sleep(INTERVAL * 1000);
}

/* 2. footer version (written into the page at build time, so the static HTML carries it) */
let page;
try { page = await get('/'); } catch (e) { fail('Smoke: live page unreachable', `${BASE}/: ${why(e)}`); }
if (page.status !== 200) fail('Smoke: live page error', `${BASE}/ returned HTTP ${page.status}`);
const link = page.text.match(/<a\b[^>]*\bid="verLink"[^>]*>([^<]*)<\/a>/);
if (!link) fail('Smoke: footer version missing', `${BASE}/ has no footer version link (#verLink)`);
if (link[1].trim() !== `v${VERSION}`) fail('Smoke: wrong footer version', `${BASE}/ footer shows "${link[1].trim()}", expected "v${VERSION}" (package.json)`);
console.log(`smoke: footer shows v${VERSION}`);
console.log('smoke: ok');
