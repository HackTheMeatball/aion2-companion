#!/usr/bin/env node
/* Test runner: serves dist/ on a free localhost port and runs every suite against it.
   `npm test` builds first. Usage: node tests/run.mjs [--only e1,save,... | --shard <name>] [--quick] [--noshots] [--jobs N] [--retries N] [--with-fonts]
   With neither --only nor --shard it runs every suite except `perf` (non-blocking; `npm run test:perf` or --only perf).
   --shard <name> runs one CI shard (SHARDS below; .github/workflows/ci.yml runs one job per shard in parallel).
   `node tests/run.mjs --check-shards` (no build needed) fails unless every blocking suite is in exactly one shard and
   the shard names equal the `shard:` matrix list in ci.yml, and a ci.yml step runs each browser-free suite (core,
   schema); the CI data job runs it, so a suite can't be left out.
   Web fonts (and service workers, except where a suite allows them) are blocked in the browsers unless --with-fonts
   (tests/support/block-web-fonts.cjs), so layouts render with fallback fonts on every machine.
   A failed suite is re-run once (--retries 0 to turn off); a pass on retry is reported as FLAKY with the first run's
   failures, so it stays visible. (The update() < 15 ms timing checks that used to need this live in `perf` now.)

   Suites (each is a standalone Playwright script; output in tests/out/<name>.out):
     site     standalone site + claude.ai build: head, footer, export, service worker/offline, manifest, 404, artifact build
     e1       E1 functional checks (keys, Next up, stigma pick, snooze, story end, export/import, layout, drawer)
     e2       E2 data checks (regional availability, story 41-45, strongholds, dungeons, build, claims, Sources)
     e3       E3 checks          e4   E4 checks (QA3 findings)
     save     save v5 (0.4 P3c): fresh start, a v4 save never read, round trip, import (v5 only), label vs slot id
     regress  QA regression matrix: Lv 25-45 x Basic/Advanced x 1500/1100/390 px x clean/messy (+ migration, user save, pop-out)
     gates    story gates: no Next up step before its story prerequisite or after the story passed it (every story position)
     journey  the user's save from Lv 27 to 45 by clicking; fails on any "!!" line except the known harness issue below
     golden   golden master: ~2,000 generated saves, Next up / milestones / Journey / dungeons / stored state vs
              tests/golden/snapshots (tests/golden/README.md; `node tests/golden.js --record` after an intended change)
     core     the pure core (src/core/) in Node, no browser: state, migrations, catalog, requirements, Next up (< 5 s)
     equiv    Node, no browser: the requirement evaluator and the page's gate functions vs the frozen 0.2 gate rules over the
              2,000 golden states (< 30 s; tests/equiv.mjs). In the `checks` shard (ci.yml has no step of its own for it)
     invariant Node, no browser: over 10,000 seeded states, Next up never offers a blocked or done node, judged by an
              independent oracle from the raw data (tests/support/oracle.mjs); evaluator = oracle on every node (~20 s, warns > 30 s, fails > 60 s;
              tests/invariant.mjs). In the `checks` shard like equiv (the app can't edit ci.yml to give it a step)
     tokens   Node, no browser: no raw colour in any .css under src/styles/ outside the :root token definitions; radius, spacing and
              shadows use tokens; every var() is defined (tests/tokens.mjs, docs/design-system.md; < 1 s). In the `checks` shard
     schema   every v2 data file and schema example against data/schema/ (ajv Ajv2020, strict), then the generator's data checks
     a11y     axe-core at 390 / 1500 px (fresh / Lv 27 / Lv 45 x Basic / Advanced; fails on rules outside its allowlist),
              spoken names, reduced motion after Level up, Escape on "i" popovers, hit areas vs neighbours
     perf     update() median < 15 ms at e1's and regress's states (non-blocking: not in the default run or ci-ok) */
import { spawn, execSync } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { startServer } from '../scripts/serve.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'tests', 'out'), FIX = join(ROOT, 'tests', 'fixtures');
const args = process.argv.slice(2), flag = n => args.includes('--' + n), opt = n => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : null; };

/* Every suite and how it is selected. NONBLOCKING suites never run by default and are in no shard. */
const ALL = ['site', 'core', 'schema', 'equiv', 'invariant', 'tokens', 'e1', 'e2', 'e3', 'e4', 'gates', 'save', 'regress', 'golden', 'a11y', 'journey', 'perf'];
const NONBLOCKING = ['perf'];
/* CI shards for the browser suites, balanced by CI time (a 4-vCPU runner runs 2 suites at a time). core and schema have no
   browser: the CI data job runs them (tests/core.mjs, tests/schema.mjs) before any shard finishes. */
const SHARDS = {
  journey: ['journey'],
  regress: ['regress'],
  golden: ['golden', 'a11y', 'save', 'site'],
  checks: ['e1', 'e2', 'gates', 'e4', 'e3', 'equiv', 'invariant', 'tokens'],
};
/* ...and the CI data job must really run them (checked below against ci.yml's text). */
const SHARD_FREE = { core: /npm run test:core|node tests\/core\.mjs/, schema: /npm run test:data|node tests\/schema\.mjs/ };
if (flag('check-shards')) {
  const bad = [], seen = Object.values(SHARDS).flat().concat(Object.keys(SHARD_FREE));
  for (const n of ALL.filter(n => !NONBLOCKING.includes(n))) { const c = seen.filter(x => x === n).length; if (c !== 1) bad.push(`${n} is in ${c} shards (needs exactly 1)`); }
  for (const n of seen) if (!ALL.includes(n) || NONBLOCKING.includes(n)) bad.push(`${n} in a shard is not a blocking suite`);
  const yml = readFileSync(join(ROOT, '.github', 'workflows', 'ci.yml'), 'utf8'), m = yml.match(/^\s*shard:\s*\[([^\]]*)\]/m);
  const ci = m ? m[1].split(',').map(x => x.trim()).filter(Boolean) : null;
  for (const [n, re] of Object.entries(SHARD_FREE)) if (!yml.split('\n').some(l => /^\s*(- )?run:/.test(l) && re.test(l))) bad.push(`${n} is in no shard, but no ci.yml step runs it (${re})`);
  if (!ci) bad.push('no `shard: [...]` matrix list in .github/workflows/ci.yml');
  else if (ci.slice().sort().join() !== Object.keys(SHARDS).sort().join()) bad.push(`ci.yml shards [${ci}] != tests/run.mjs SHARDS [${Object.keys(SHARDS)}]`);
  console.log(bad.length ? 'SHARD CHECK FAILED\n' + bad.join('\n') : `SHARD CHECK PASSED (${Object.keys(SHARDS).length} shards: ${Object.entries(SHARDS).map(([k, v]) => k + '=' + v.join('+')).join(' ')})`);
  process.exit(bad.length ? 1 : 0);
}

if (!existsSync(join(ROOT, 'dist', 'index.html')) || !existsSync(join(ROOT, 'dist-artifact', 'index.html'))) {
  console.error('dist/ is missing: run `npm run build` (or `npm test`, which builds first)'); process.exit(1);
}

/* playwright: the repo's devDependency; fall back to a global install (local machines with browsers preinstalled) */
const env = { ...process.env };
try { createRequire(join(ROOT, 'package.json')).resolve('playwright'); }
catch { const g = execSync('npm root -g').toString().trim(); env.NODE_PATH = [env.NODE_PATH, g].filter(Boolean).join(process.platform === 'win32' ? ';' : ':'); console.log('playwright: using the global install at ' + g); }

const { server, url } = await startServer();
env.AION_BASE = url;
const CUR = url + '/';
/* the v285 fixture as the 0.3 build stored it (a flat fixture): e1 imports it as a v5 export */
const FLAT285 = join(FIX, 'fixture-v285.flat.json');

/* journey.js logs "!!" for anything odd; this one is a known harness limitation from QA3 (it clicks the first [data-ingame]
   pill, which can be hidden), not an app problem. */
const JOURNEY_KNOWN = [/In my game click failed/];

const SUITES = {
  site: { args: ['tests/site.js'], pass: /SITE CHECKS PASSED/ },
  core: { args: ['tests/core.mjs'], pass: /CORE CHECKS PASSED/ },
  schema: { args: ['tests/schema.mjs'], pass: /SCHEMA CHECKS PASSED/ },
  equiv: { args: ['tests/equiv.mjs'], pass: /EQUIV CHECKS PASSED/ },
  invariant: { args: ['tests/invariant.mjs'], pass: /INVARIANT CHECKS PASSED/ },
  tokens: { args: ['tests/tokens.mjs'], pass: /TOKENS CHECKS PASSED/ },
  e1: { args: ['tests/e1test.js', CUR, FLAT285], pass: /E1 CHECKS PASSED/ },
  e2: { args: ['tests/e2test.js', CUR], pass: /E2 CHECKS PASSED/ },
  e3: { args: ['tests/e3test.js'], pass: /E3 CHECKS PASSED/ },
  e4: { args: ['tests/e4test.js'], pass: /E4 CHECKS PASSED/ },
  gates: { args: ['tests/gates.js'], pass: /GATES CHECKS PASSED/ },
  save: { args: ['tests/save.js'], pass: /SAVE CHECKS PASSED/ },
  regress: { args: ['tests/regress.js', ...(flag('quick') ? ['--quick'] : []), ...(flag('noshots') ? ['--noshots'] : [])], pass: /hard fail 0\b/ },
  golden: { args: ['tests/golden.js'], pass: /GOLDEN VERIFY PASSED/ },
  a11y: { args: ['tests/a11y.js'], pass: /A11Y CHECKS PASSED/ },
  perf: { args: ['tests/perf.js', ...(flag('quick') ? ['--quick'] : [])], pass: /PERF CHECKS PASSED/ },
  journey: { args: ['tests/journey.js'], check: out => {
    const bad = out.split('\n').filter(l => l.includes('!!') && !JOURNEY_KNOWN.some(r => r.test(l)));
    if (!/===== Lv 45/.test(out)) bad.push('journey did not reach Lv 45');
    if (!/Lv 44 edge: reachable by a real save: yes/.test(out)) bad.push('journey: the Lv 44 "Forgotten Commander" case did not run or did not reach its state');
    return bad; } },
};
if (opt('shard') && !SHARDS[opt('shard')]) { console.error(`unknown shard: ${opt('shard')} (${Object.keys(SHARDS).join(', ')})`); process.exit(2); }
if (opt('shard') && opt('only')) { console.error('use --only or --shard, not both'); process.exit(2); }
const only = opt('shard') ? SHARDS[opt('shard')] : opt('only') ? opt('only').split(',') : ALL.filter(n => !NONBLOCKING.includes(n));
for (const n of only) if (!SUITES[n]) { console.error('unknown suite: ' + n); process.exit(2); }
/* longest first, so the slow ones start right away */
const ORDER = ['regress', 'journey', 'golden', 'e1', 'e2', 'gates', 'a11y', 'perf', 'invariant', 'equiv', 'save', 'e4', 'e3', 'site', 'tokens', 'core', 'schema'];
if (Object.keys(SUITES).sort().join() !== ALL.slice().sort().join() || ORDER.slice().sort().join() !== ALL.slice().sort().join()) { console.error('tests/run.mjs: SUITES, ALL and ORDER must list the same suites'); process.exit(2); }
const order = ORDER.filter(n => only.includes(n));
const jobs = Math.max(1, +(opt('jobs') || process.env.TEST_JOBS || Math.min(4, Math.max(1, Math.floor(cpus().length / 2)))));

mkdirSync(OUT, { recursive: true });
console.log(`serving dist/ at ${url} · ${order.length} suites · ${jobs} at a time · output in tests/out/`);
const t0 = Date.now(), results = {};
const retries = Math.max(0, +(opt('retries') ?? 1));
const runOne = (name, attempt = 0) => new Promise(resolve => {
  const s = SUITES[name], file = join(OUT, name + (attempt ? `.retry${attempt}` : '') + '.out'), log = createWriteStream(file), t = Date.now();
  const pre = flag('with-fonts') ? [] : ['--require', join(ROOT, 'tests', 'support', 'block-web-fonts.cjs')];
  const child = spawn(process.execPath, [...pre, ...s.args], { cwd: ROOT, env });
  let out = '';
  for (const st of [child.stdout, child.stderr]) st.on('data', d => { out += d; log.write(d); });
  child.on('close', code => {
    log.end();
    const problems = s.check ? s.check(out) : [];
    const ok = code === 0 && (!s.pass || s.pass.test(out)) && !problems.length;
    const nOk = (out.match(/^ok\b/gm) || []).length, nFail = (out.match(/^FAIL\b/gm) || []).length;
    const last = out.trim().split('\n').filter(l => !/^\s*$/.test(l)).slice(name === 'regress' ? 0 : -1)[0] || '';
    const firstFails = attempt ? (results[name].fails || []) : [];
    if (!ok && attempt < retries) { results[name] = { fails: (out.match(/^FAIL .*/gm) || []).concat(problems).map(l => l.slice(0, 160)) }; console.log(`retry ${name} (failed: ${results[name].fails.slice(0, 3).join(' | ') || 'exit ' + code})`); return resolve(runOne(name, attempt + 1)); }
    results[name] = { ok, line: `${ok ? (attempt ? 'FLAKY' : 'PASS ') : 'FAIL '} ${name.padEnd(8)} ${((Date.now() - t) / 1000).toFixed(0).padStart(4)} s  ${nOk || nFail ? `${nOk} ok, ${nFail} FAIL · ` : ''}${last.slice(0, 120)}${problems.length ? ' · ' + problems.slice(0, 3).join(' | ') : ''}${ok && attempt ? ' · first run: ' + firstFails.slice(0, 3).join(' | ') : ''}` };
    console.log(results[name].line);
    resolve();
  });
});
const queue = [...order];
await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, async () => { while (queue.length) await runOne(queue.shift()); }));
server.close();

const failed = order.filter(n => !results[n].ok);
console.log(`\n${order.length - failed.length}/${order.length} suites passed in ${((Date.now() - t0) / 1000).toFixed(0)} s` + (failed.length ? ` · FAILED: ${failed.join(', ')} (see tests/out/<name>.out)` : ''));
process.exit(failed.length ? 1 : 0);
