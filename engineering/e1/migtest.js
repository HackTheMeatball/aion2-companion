/* Migration check: a v285-shaped state must give identical tick counts, in-progress marks, dungeon runs and story
   ticks in v285 and E1 (compared by name, since E1's keys differ), and E1 must keep the old keys. */
const { chromium } = require('playwright'); const fs = require('fs');
const [,, V285, E1, FIX] = process.argv; const fix = fs.readFileSync(FIX, 'utf8');
const KEY = 'aion2-assassin-route-v4';
const metrics = () => {
  const keyOf = (g, it, j) => it.k || g.id + ':' + j, out = { gates: {}, quests: {}, sd: {}, sh: {}, sp: [], dv: [], steps: {} };
  GATES.forEach(g => { out.gates[g.id] = counts(g); g.items.forEach((it, j) => { const k = keyOf(g, it, j);
    if (it.kind === 'quest') out.quests[it.name] = { done: !!state.checks[k], started: (state.started || {})[k] ?? null };
    if (it.kind === 'hideout') out.sd[it.name] = { done: !!state.checks[k], run: (state.areaRun || {})[k] ?? null }; }); });
  STEPS.forEach(s => { out.steps[s.id] = counts(s); });
  AREA_ITEMS.filter(x => x.it.kind === 'stronghold').forEach(x => { out.sh[x.it.name] = !!state.checks[x.k]; });
  SP_STEPS.forEach(x => { if (state.checks[x.k]) out.sp.push(x.k); });
  Object.keys(state.checks).filter(k => k.startsWith('dv:') && state.checks[k]).sort().forEach(k => out.dv.push(k));
  out.ring = document.getElementById('progBig').textContent; out.prog = [...document.querySelectorAll('#progRows .prow-n')].map(e => e.textContent);
  out.stigma = STIGMA_SLOTS().map(x => [x.n, x.name, !!state.checks[x.k]]); out.stLv = state.stLv; out.stShards = state.stShards;
  out.rotSeen = state.rotSeen; out.qsteps = state.qsteps; out.qsub = state.qsub; out.level = state.level; out.quest = state.quest; out.stones = state.stones; out.dvTotal = state.dvTotal; out.pend = [state.pendSt, state.pendCr];
  out.gateTags = [...document.querySelectorAll('#gates details.step')].map(d => d.id + ':' + d.querySelector('.tag').textContent + ':' + d.querySelector('.count').textContent);
  return out;
};
(async () => {
  const b = await chromium.launch(); let fail = 0;
  const run = async (file, label, initial) => {
    const ctx = await b.newContext(); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + file); await p.evaluate(([k, s]) => localStorage.setItem(k, s), [KEY, initial]); await p.reload(); await p.waitForTimeout(400);
    const m = await p.evaluate(metrics); const saved = await p.evaluate(k => localStorage.getItem(k), KEY);
    // second load: idempotent
    await p.reload(); await p.waitForTimeout(300); const m2 = await p.evaluate(metrics); const saved2 = await p.evaluate(k => localStorage.getItem(k), KEY);
    await ctx.close(); if (errs.length) { console.log(label, 'PAGE ERRORS', errs); fail++; }
    return { m, m2, saved: JSON.parse(saved), saved2: JSON.parse(saved2) };
  };
  const A = await run(V285, 'v285', fix), B = await run(E1, 'E1', fix);
  /* E2: object key order doesn't matter (quests are placed by level at runtime, strongholds come from data) */
  const canon = v => Array.isArray(v) ? v.map(canon) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])])) : v;
  const cmp = (name, x, y) => { const ok = JSON.stringify(canon(x)) === JSON.stringify(canon(y)); if (!ok) { fail++; console.log('FAIL', name, '\n  v285:', JSON.stringify(x), '\n  E1:  ', JSON.stringify(y)); } else console.log('ok  ', name); };
  for (const k of ['gates', 'steps', 'quests', 'sd', 'sh', 'sp', 'dv', 'ring', 'prog', 'stigma', 'stLv', 'stShards', 'rotSeen', 'qsteps', 'qsub', 'level', 'quest', 'stones', 'dvTotal', 'pend', 'gateTags']) cmp(k, A.m[k], B.m[k]);
  cmp('E1 reload idempotent', B.m, B.m2);
  const f = JSON.parse(fix), S = B.saved;
  const oldKept = Object.entries(f.checks).every(([k, v]) => S.checks[k] === v) && Object.entries(f.started).every(([k, v]) => S.started[k] === v) && Object.entries(f.areaRun).every(([k, v]) => S.areaRun[k] === v);
  cmp('old keys left in place', true, oldKept);
  cmp('migV5 flag saved', true, S.migV5 === true);
  cmp('localStorage key unchanged (state saved under v4 key)', true, !!S.checks);
  const nTicks = o => Object.values(o.checks).filter(Boolean).length;
  console.log('ticked keys: fixture', nTicks(f), '· E1 saved', nTicks(S), '(old + copied new keys) · copied:', Object.keys(S.checks).filter(k => /^(rq|sd):/.test(k)).length, 'checks,', Object.keys(S.started).filter(k => k.startsWith('rq:')).length, 'started,', Object.keys(S.areaRun).filter(k => k.startsWith('sd:')).length, 'areaRun');
  // the v285 page itself must not be affected by E1's leftovers: load E1-saved state back into v285
  const C = await run(V285, 'v285-after-E1', JSON.stringify(S));
  for (const k of ['gates', 'quests', 'sd', 'sh', 'ring']) cmp('rollback to v285 ' + k, A.m[k], C.m[k]);
  console.log(fail ? `MIGRATION CHECK FAILED (${fail})` : 'MIGRATION CHECK PASSED');
  await b.close(); process.exit(fail ? 1 : 0);
})();
