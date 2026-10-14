/* E2 migration check (extends polish/e1/migtest.js). Usage:
     node migtest-e2.js <pre-E2 page> <E2 page> <v285 fixture>
   1. Build a realistic v287 state: the v285 fixture loaded and saved by the pre-E2 page (so it carries rq:/sd: keys), plus what the
      player's real save can hold: rq:* ticks and in-progress marks, story objective ticks keyed by quest name (qsteps / qsub),
      stigma picks, snoozes, a dungeon run, and one tick on each key E2 removed (g45:1, hold:0).
   2. Load it in pre-E2 and in E2 and compare everything by name (E2 re-bands quests, so milestone counts may move).
   3. Every key that was ticked stays ticked in E2's save; nothing is deleted; reload is idempotent; the v285 fixture still
      migrates straight into E2; E2's save loads back into pre-E2 with the same progress. */
const { chromium } = require('playwright'); const fs = require('fs');
const [,, PRE, E2, FIX] = process.argv; const KEY = 'aion2-assassin-route-v4';
const metrics = () => {
  const out = { quests: {}, sd: {}, sh: {}, sp: [], dv: [], gatesMain: {}, gateTags: {} };
  GATES.forEach(g => { out.gatesMain[g.id] = mainCounts(g).join('/'); const d = document.getElementById(g.id); out.gateTags[g.id] = d.querySelector('.tag').textContent;
    g.items.forEach(it => { if (it.kind === 'quest') out.quests[it.name] = { done: !!state.checks[it.k], started: (state.started || {})[it.k] ?? null, snz: (state.rqSnooze || {})[it.k] ?? null };
      if (it.kind === 'hideout') out.sd[it.name] = { done: !!state.checks[it.k], run: (state.areaRun || {})[it.k] ?? null }; }); });
  AREA_ITEMS.filter(x => x.it.kind === 'stronghold').forEach(x => { out.sh[x.it.name] = !!state.checks[x.k]; });
  Object.keys(state.checks).filter(k => k.startsWith('sp:') && state.checks[k]).sort().forEach(k => out.sp.push(k));
  Object.keys(state.checks).filter(k => k.startsWith('dv:') && state.checks[k]).sort().forEach(k => out.dv.push(k));
  out.stigma = STIGMA_SLOTS().filter(x => state.checks[x.k]).map(x => [x.n, x.name]);
  for (const f of ['qsteps', 'qsub', 'level', 'quest', 'stones', 'dvTotal', 'pendSt', 'pendCr', 'stLv', 'stShards', 'stPick', 'rotSeen', 'mode', 'hideCards', 'storyEnd']) out[f] = state[f] ?? null;
  out.questObjDone = (QUEST_STEPS[state.quest] || []).map((_, i) => ((state.qsteps || {})[state.quest] || []).includes(i));
  return out;
};
(async () => {
  const b = await chromium.launch(); let fail = 0;
  const ok = (name, cond, detail) => { console.log((cond ? 'ok   ' : 'FAIL ') + name + (detail !== undefined && !cond ? '\n   ' + JSON.stringify(detail).slice(0, 600) : '')); if (!cond) fail++; };
  const run = async (file, initial) => {
    const ctx = await b.newContext(); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + file); await p.evaluate(([k, s]) => localStorage.setItem(k, s), [KEY, initial]); await p.reload(); await p.waitForTimeout(450);
    const m = await p.evaluate(metrics); const saved = JSON.parse(await p.evaluate(k => localStorage.getItem(k), KEY));
    await p.reload(); await p.waitForTimeout(350); const m2 = await p.evaluate(metrics); const saved2 = JSON.parse(await p.evaluate(k => localStorage.getItem(k), KEY));
    await ctx.close(); return { m, m2, saved, saved2, errs };
  };
  /* 1. realistic v287 state */
  const base = await run(PRE, fs.readFileSync(FIX, 'utf8'));
  const S = base.saved;
  Object.assign(S, { level: 27, quest: 'Preparations for Restoration', stShards: 4, stPick: { 1: "Triniel's Dagger", 2: 'Illusive Clone' }, stLv: { "Triniel's Dagger": 4, 'Illusive Clone': 1 } });
  S.checks['g27:0'] = true; S.checks['g45:1'] = true; S.checks['hold:0'] = true;
  S.started = Object.assign(S.started || {}, { 'rq:2202062': 1, 'rq:2202018': 1 });        // Fight Poison with Poison, Her Last Favor: in progress
  S.checks['rq:2202016'] = true; S.checks['rq:2202053'] = true;                             // Blade of Vengeance, Nine Wonders 1st Leg: turned in
  S.rqSnooze = { 'rq:2202040': 26 };                                                        // Pain Unending snoozed at 26
  S.qsteps = Object.assign(S.qsteps || {}, { 'Preparations for Restoration': [0, 1, 2], 'Tangled Past': [0, 1, 2, 3, 4] });
  S.qsub = Object.assign(S.qsub || {}, { 'Preparations for Restoration': { 6: [0] } });
  S.areaRun = Object.assign(S.areaRun || {}, { 'sd:twisted-pit': 1760000000000 });
  const fix287 = JSON.stringify(S);
  fs.writeFileSync(__dirname + '/fixture-v287.json', JSON.stringify(S, null, 1));
  const A = await run(PRE, fix287), B = await run(E2, fix287);
  ok('no page errors (pre-E2, E2)', !A.errs.length && !B.errs.length, [A.errs, B.errs]);
  /* order-insensitive for object keys (E2 re-bands quests and reorders strongholds) */
  const canon = v => Array.isArray(v) ? v.map(canon) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])])) : v;
  const same = (name, x, y) => { const a = JSON.stringify(canon(x)), c = JSON.stringify(canon(y)); let d; if (a !== c && x && typeof x === 'object' && !Array.isArray(x)) d = Object.keys({ ...x, ...y }).filter(k => JSON.stringify(canon(x[k])) !== JSON.stringify(canon((y || {})[k]))).map(k => [k, x[k], (y || {})[k]]); ok(name, a === c, d || { pre: x, e2: y }); };
  same('regional quests by name: done / in progress / snooze', A.m.quests, B.m.quests);
  same('Sealed Dungeons by name: cleared / run', A.m.sd, B.m.sd);
  same('strongholds by name', A.m.sh, B.m.sh);
  same('skill lines ticked', A.m.sp, B.m.sp);
  same('board nodes ticked', A.m.dv, B.m.dv);
  same('equipped stigmas (slot, name)', A.m.stigma, B.m.stigma);
  for (const f of ['qsteps', 'qsub', 'questObjDone', 'level', 'quest', 'stones', 'dvTotal', 'pendSt', 'pendCr', 'stLv', 'stShards', 'stPick', 'rotSeen', 'mode', 'hideCards', 'storyEnd']) same(f, A.m[f], B.m[f]);
  /* main tasks of every milestone keep their done/total (quests moved, but quests aren't main tasks) */
  const mainDiff = Object.keys(A.m.gatesMain).filter(g => A.m.gatesMain[g] !== B.m.gatesMain[g]);
  /* E4: unticked optional steps no longer count, and equipped slots tick their "Put X on E" step: only milestones holding an
     optional or a "Put on E" step may differ (exact E4 values are checked in polish/e4/e4test.js). */
  const E4G = ['g22', 'g25', 'g27', 'g28', 'g32', 'g35', 'g37'];
  ok('milestone main tasks unchanged except where E2 dropped an item (g45:1) or E4 rules apply (optional / Put on E)', mainDiff.every(g => g === 'g45' || E4G.includes(g)), mainDiff.map(g => [g, A.m.gatesMain[g], B.m.gatesMain[g]]));
  const tagDiff = Object.keys(A.m.gateTags).filter(g => A.m.gateTags[g] !== B.m.gateTags[g]).map(g => `${g}: ${A.m.gateTags[g]} → ${B.m.gateTags[g]}`);
  console.log('     milestone tags that changed (re-banded quests):', tagDiff.length ? tagDiff.join('; ') : 'none');
  ok('no cleared milestone turns "Missed"', Object.keys(A.m.gateTags).every(g => !(A.m.gateTags[g] === 'Cleared' && B.m.gateTags[g] === 'Missed')), tagDiff);
  /* saved state: every ticked key, start mark and run survives; no key deleted */
  const T = B.saved, lost = [];
  for (const f of ['checks', 'started', 'areaRun', 'rqSnooze']) Object.entries(S[f] || {}).forEach(([k, v]) => { if (JSON.stringify((T[f] || {})[k]) !== JSON.stringify(v)) lost.push(f + ':' + k); });
  ok('every saved key and value kept (incl. removed items g45:1, hold:0)', !lost.length, lost);
  ok('localStorage key unchanged, migV5 kept', !!T.checks && T.migV5 === true);
  /* E4 one-time migration: equipped slot 2 gets its "Put on E" step (g27:1); slots not equipped (3, 4) don't; flag saved. */
  ok('E4: equipped slot 2 -> g27:1 ticked; g32:1 / g37:1 untouched; eputSync1 saved', T.checks['g27:1'] === true && !T.checks['g32:1'] && !T.checks['g37:1'] && T.eputSync1 === true && !(S.checks || {})['g27:1'], [T.checks['g27:1'], T.checks['g32:1'], T.checks['g37:1'], T.eputSync1]);
  ok('E4: the Lv 27 milestone is not "Missed" after the migration', B.m.gateTags.g27 !== 'Missed', B.m.gateTags.g27);
  same('E2 reload idempotent (metrics)', B.m, B.m2);
  same('E2 reload idempotent (saved state)', B.saved, B.saved2);
  /* 2. the v285 fixture straight into E2 (E1's migration still runs) */
  const C = await run(E2, fs.readFileSync(FIX, 'utf8'));
  same('v285 fixture → E2: quests by name equal v285 → pre-E2', base.m.quests, C.m.quests);
  same('v285 fixture → E2: Sealed Dungeons equal', base.m.sd, C.m.sd);
  same('v285 fixture → E2: story ticks equal', [base.m.qsteps, base.m.qsub], [C.m.qsteps, C.m.qsub]);
  /* 3. rollback: E2's save back into pre-E2 */
  const D = await run(PRE, JSON.stringify(B.saved));
  for (const k of ['quests', 'sd', 'sh', 'sp', 'dv', 'qsteps', 'stigma']) same('rollback to pre-E2: ' + k, A.m[k], D.m[k]);
  console.log(fail ? `E2 MIGRATION CHECK FAILED (${fail})` : 'E2 MIGRATION CHECK PASSED');
  await b.close(); process.exit(fail ? 1 : 0);
})();
