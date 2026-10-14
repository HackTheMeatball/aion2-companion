#!/usr/bin/env node
/* Test runner: serves dist/ (+ tests/baselines) on a free localhost port and runs every suite against it.
   `npm test` builds first. Usage: node tests/run.mjs [--only e1,mig1,...] [--quick] [--noshots] [--jobs N] [--retries N] [--with-fonts]
   Web fonts (and service workers, except where a suite allows them) are blocked in the browsers unless --with-fonts
   (tests/support/block-web-fonts.cjs), so layouts render with fallback fonts on every machine.
   A failed suite is re-run once (--retries 0 to turn off) because the update() timing checks (< 15 ms) can trip on a
   busy machine; a pass on retry is reported as FLAKY with the first run's failures, so it stays visible.

   Suites (each is a standalone Playwright script; output in tests/out/<name>.out):
     site     standalone site + claude.ai build: head, footer, export, service worker/offline, manifest, 404, artifact build
     e1       E1 functional checks (keys, Next up, stigma pick, snooze, story end, export/import, layout, drawer)
     e2       E2 data checks (regional availability, story 41-45, strongholds, dungeons, build, claims, Sources)
     e3       E3 checks          e4   E4 checks (QA3 findings)
     mig1     v285 save -> current page (4 intended differences pinned in tests/fixtures/e1-migtest-expected.json)
     mig2     v287 save -> current page, rollback to v287
     regress  QA regression matrix: Lv 25-45 x Basic/Advanced x 1500/1100/390 px x clean/messy (+ migration, user save, pop-out)
     gates    story gates: no Next up step before its story prerequisite or after the story passed it (every story position)
     journey  the user's save from Lv 27 to 45 by clicking; fails on any "!!" line except the known harness issue below
     golden   golden master: ~2,000 generated saves, Next up / milestones / Journey / dungeons / stored state vs
              tests/golden/snapshots (tests/golden/README.md; `node tests/golden.js --record` after an intended change)
     core     the pure core (src/core/) in Node, no browser: state, migrations, catalog, requirements, Next up (< 5 s)
     schema   every v2 data file and schema example against data/schema/ (ajv Ajv2020, strict), then the generator's data checks
     a11y     axe-core at 390 / 1500 px (fresh / Lv 27 / Lv 45 x Basic / Advanced; fails on rules outside its allowlist),
              spoken names, reduced motion after Level up, Escape on "i" popovers, hit areas vs neighbours */
import { spawn, execSync } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { cpus } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { startServer } from '../scripts/serve.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'tests', 'out'), FIX = join(ROOT, 'tests', 'fixtures');
const args = process.argv.slice(2), flag = n => args.includes('--' + n), opt = n => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : null; };

if (!existsSync(join(ROOT, 'dist', 'index.html')) || !existsSync(join(ROOT, 'dist-artifact', 'index.html'))) {
  console.error('dist/ is missing: run `npm run build` (or `npm test`, which builds first)'); process.exit(1);
}

/* playwright: the repo's devDependency; fall back to a global install (local machines with browsers preinstalled) */
const env = { ...process.env };
try { createRequire(join(ROOT, 'package.json')).resolve('playwright'); }
catch { const g = execSync('npm root -g').toString().trim(); env.NODE_PATH = [env.NODE_PATH, g].filter(Boolean).join(process.platform === 'win32' ? ';' : ':'); console.log('playwright: using the global install at ' + g); }

const { server, url } = await startServer({ baselines: true });
env.AION_BASE = url;
const CUR = url + '/', V285 = url + '/__baselines/v285.html', V287 = url + '/__baselines/v287.html', FX285 = join(FIX, 'fixture-v285.json');

/* journey.js logs "!!" for anything odd; this one is a known harness limitation from QA3 (it clicks the first [data-ingame]
   pill, which can be hidden), not an app problem. */
const JOURNEY_KNOWN = [/In my game click failed/];

const SUITES = {
  site: { args: ['tests/site.js'], pass: /SITE CHECKS PASSED/ },
  core: { args: ['tests/core.mjs'], pass: /CORE CHECKS PASSED/ },
  schema: { args: ['tests/schema.mjs'], pass: /SCHEMA CHECKS PASSED/ },
  e1: { args: ['tests/e1test.js', CUR, FX285], pass: /E1 CHECKS PASSED/ },
  e2: { args: ['tests/e2test.js', CUR], pass: /E2 CHECKS PASSED/ },
  e3: { args: ['tests/e3test.js'], pass: /E3 CHECKS PASSED/ },
  e4: { args: ['tests/e4test.js'], pass: /E4 CHECKS PASSED/ },
  gates: { args: ['tests/gates.js'], pass: /GATES CHECKS PASSED/ },
  mig1: { args: ['tests/e1-migtest.js', V285, CUR, FX285], pass: /MIGRATION CHECK PASSED/ },
  mig2: { args: ['tests/e2-migtest.js', V287, CUR, FX285], pass: /E2 MIGRATION CHECK PASSED/ },
  regress: { args: ['tests/regress.js', ...(flag('quick') ? ['--quick'] : []), ...(flag('noshots') ? ['--noshots'] : [])], pass: /hard fail 0\b/ },
  golden: { args: ['tests/golden.js'], pass: /GOLDEN VERIFY PASSED/ },
  a11y: { args: ['tests/a11y.js'], pass: /A11Y CHECKS PASSED/ },
  journey: { args: ['tests/journey.js'], check: out => {
    const bad = out.split('\n').filter(l => l.includes('!!') && !JOURNEY_KNOWN.some(r => r.test(l)));
    if (!/===== Lv 45/.test(out)) bad.push('journey did not reach Lv 45');
    return bad; } },
};
const only = opt('only') ? opt('only').split(',') : null;
for (const n of only || []) if (!SUITES[n]) { console.error('unknown suite: ' + n); process.exit(2); }
/* longest first, so the slow ones start right away */
const order = ['regress', 'journey', 'golden', 'e1', 'e2', 'gates', 'a11y', 'mig2', 'mig1', 'e4', 'e3', 'site', 'core', 'schema'].filter(n => !only || only.includes(n));
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
