/* E2 migration check (extends tests/e1-migtest.js). Usage:
     node tests/e2-migtest.js <pre-E2 page URL> <current page URL> <v285 fixture>
   1. Build a realistic v287 state: the v285 fixture loaded and saved by the pre-E2 page (so it carries rq:/sd: keys), plus what the
      player's real save can hold: rq:* ticks and in-progress marks, story objective ticks keyed by quest name (qsteps / qsub),
      stigma picks, snoozes, a dungeon run, and one tick on each key E2 removed (g45:1, hold:0).
   2. Load it in pre-E2 and in E2 and compare everything by name (E2 re-bands quests, so milestone counts may move).
   3. Every key that was ticked stays ticked in E2's save; nothing is deleted; reload is idempotent; the v285 fixture still
      migrates straight into E2; E2's save loads back into pre-E2 with the same progress.
   4. 5c change times (stampV1): on load the save gains schemaVersion 1 and mt with old values stamped 0; the first change
      is stamped with its time and sets savedAt, every other value is kept; reload is idempotent; the 5c save loads
      in pre-E2 with the same progress, an un-tick made there survives the trip back and is re-stamped there. */
const { chromium } = require('playwright'); const fs = require('fs');
const [,, PRE, E2, FIX] = process.argv;
/* the v4 key: this check carries v4-era saves between the v287 baseline and the current page (tests/support/save.js) */
const { V4_KEY: KEY, writeRaw, readRaw } = require('./support/save');
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
    await p.goto(file); await writeRaw(p, initial, { key: KEY }); await p.reload(); await p.waitForTimeout(450);
    const m = await p.evaluate(metrics); const saved = JSON.parse(await readRaw(p, { key: KEY }));
    await p.reload(); await p.waitForTimeout(350); const m2 = await p.evaluate(metrics); const saved2 = JSON.parse(await readRaw(p, { key: KEY }));
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
  fs.mkdirSync(require('./config').OUT, { recursive: true }); fs.writeFileSync(require('path').join(require('./config').OUT, 'fixture-v287.json'), JSON.stringify(S, null, 1));
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
     optional or a "Put on E" step may differ (exact E4 values are checked in tests/e4test.js). */
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
  /* 4. 5c: per-item change times. Pages run with a fixed clock so stamps are predictable. */
  /* the one-time step itself writes nothing; the page's start-up view writes (folds) then store the flag and the time-0 stamps */
  const zeroOnly = o => JSON.stringify(o || {}).match(/\[\d+,/g).every(x => x === '[0,');
  ok('5c: on load, the save gains only stampV1, schemaVersion 1 and mt with every stamp at time 0 (no savedAt)', B.saved.stampV1 === true && B.saved.schemaVersion === 1 && zeroOnly(B.saved.mt) && B.saved.savedAt === undefined, Object.keys(B.saved).filter(k => /stamp|^mt$|schema|savedAt/.test(k)));
  const T1 = Date.parse('2026-10-14T10:00:00Z'), T2 = Date.parse('2026-10-14T12:00:00Z');
  /* load `initial` in `file` at time `now`; act() runs in the page and saves; returns metrics and the stored save after load, after act, after a reload */
  const run5c = async (file, initial, now, act) => {
    const ctx = await b.newContext(); await ctx.addInitScript(t => { Date.now = () => t; }, now);
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(file); await writeRaw(p, initial, { key: KEY }); await p.reload(); await p.waitForTimeout(450);
    const loaded = JSON.parse(await readRaw(p, { key: KEY }));
    if (act) { await p.evaluate(act); await p.waitForTimeout(150); }
    const m = await p.evaluate(metrics), saved = JSON.parse(await readRaw(p, { key: KEY }));
    await p.reload(); await p.waitForTimeout(350); const m2 = await p.evaluate(metrics), saved2 = JSON.parse(await readRaw(p, { key: KEY }));
    await ctx.close(); return { loaded, m, saved, m2, saved2, errs };
  };
  const untick = k => `(() => { state.checks[${JSON.stringify(k)}] = false; save(); update(); })()`;
  const E = await run5c(E2, JSON.stringify(B.saved), T1, untick('rq:2202016'));
  ok('5c: no page errors', !E.errs.length, E.errs);
  const V = E.saved, stamps = [];
  const walk = (o, p) => Object.entries(o || {}).forEach(([k, v]) => Array.isArray(v) && v.length === 2 && typeof v[0] === 'number' ? stamps.push([p + k, v]) : walk(v, p + k + '.'));
  walk(V.mt, '');
  ok('5c: the first progress change sets savedAt and stamps mt', V.stampV1 === true && V.schemaVersion === 1 && V.savedAt === T1 && stamps.length > 100, [V.stampV1, V.schemaVersion, V.savedAt, stamps.length]);
  ok('5c: the un-tick is stamped with its save time; every older value is stamped 0 with its value',
    JSON.stringify(V.mt.checks['rq:2202016']) === JSON.stringify([T1 / 1000, false]) && stamps.every(([k, [t]]) => k === 'checks.rq:2202016' || t === 0) && Object.entries(B.saved.checks).every(([k, v]) => k === 'rq:2202016' || JSON.stringify(V.mt.checks[k]) === JSON.stringify([0, v])),
    stamps.filter(([k, [t]]) => t !== 0));
  const changed = Object.keys({ ...B.saved, ...V }).filter(k => !['savedAt', 'mt', 'checks'].includes(k) && JSON.stringify(canon(B.saved[k])) !== JSON.stringify(canon(V[k])));
  const lostC = Object.entries(B.saved.checks).filter(([k, v]) => k !== 'rq:2202016' && V.checks[k] !== v).map(([k]) => k);
  ok('5c: additive (every other saved value kept; only the un-tick changed)', !changed.length && !lostC.length && V.checks['rq:2202016'] === false, { changed, lostC });
  same('5c: reload writes nothing (saved state)', E.saved, E.saved2);
  same('5c: reload idempotent (metrics)', E.m, E.m2);
  /* rollback: the 5c save into pre-E2 (a build without change times), an un-tick there, then back */
  const R = await run5c(PRE, JSON.stringify(V), T2, untick('rq:2202053'));
  for (const k of ['quests', 'sd', 'sh', 'sp', 'dv', 'qsteps', 'qsub', 'stigma', 'level', 'quest']) if (k !== 'quests') same('5c rollback to pre-E2: ' + k, E.m[k], R.m[k]);
  const qx = o => Object.fromEntries(Object.entries(o).filter(([n]) => n !== 'Nine Wonders of Altgard: 1st Leg'));
  same('5c rollback to pre-E2: quests (except the one un-ticked there)', qx(E.m.quests), qx(R.m.quests));
  ok('5c rollback: pre-E2 keeps mt, stampV1 and schemaVersion in its save', JSON.stringify(R.saved.mt) === JSON.stringify(V.mt) && R.saved.stampV1 === true && R.saved.schemaVersion === 1 && R.saved.checks['rq:2202053'] === false);
  const F = await run5c(E2, JSON.stringify(R.saved), T2 + 60000, '(() => { save(); })()');
  ok('5c back from pre-E2: its un-tick is re-stamped at the next load; other stamps unchanged',
    JSON.stringify(F.saved.mt.checks['rq:2202053']) === JSON.stringify([(T2 + 60000) / 1000, false]) && JSON.stringify(F.saved.mt.checks['rq:2202016']) === JSON.stringify([T1 / 1000, false]) && F.saved.checks['rq:2202053'] === false,
    [F.saved.mt.checks['rq:2202053'], F.saved.mt.checks['rq:2202016']]);
  /* 5. 0.3 E10 (g45Split1): g45:0 ("Witnesses and Oath") is retired and narrowed to g45:witness. A v287 save with g45:0 ticked:
     the current page copies the tick once, keeps g45:0, saves the flag; reload writes nothing; the save rolls back to v287 with
     g45:0 still ticked there. A v287 save without the tick gains neither the key nor the flag. */
  const S10 = JSON.parse(fix287); S10.checks['g45:0'] = true; S10.level = 45; S10.quest = 'Forgotten Commander';
  const G10 = await run(E2, JSON.stringify(S10)), Gpre = await run(PRE, JSON.stringify(S10));
  ok('E10: no page errors', !G10.errs.length && !Gpre.errs.length, [G10.errs, Gpre.errs]);
  ok('E10: g45:0 -> g45:witness ticked once; g45:0 kept; g45Split1 saved', G10.saved.checks['g45:witness'] === true && G10.saved.checks['g45:0'] === true && G10.saved.g45Split1 === true,
    [G10.saved.checks['g45:witness'], G10.saved.checks['g45:0'], G10.saved.g45Split1]);
  const lost10 = Object.entries(S10.checks).filter(([k, v]) => G10.saved.checks[k] !== v).map(([k]) => k);
  ok('E10: additive (every saved tick kept)', !lost10.length, lost10);
  const H10 = await run(E2, JSON.stringify({ ...S10, checks: { ...S10.checks, 'g45:0': undefined } }));   /* the same save without the tick */
  ok('E10: the Lv 45 milestone counts Witnesses as done (one more than the same save without g45:0)', +G10.m.gatesMain.g45.split('/')[0] === +H10.m.gatesMain.g45.split('/')[0] + 1, [H10.m.gatesMain.g45, G10.m.gatesMain.g45]);
  same('E10: reload idempotent (saved state)', G10.saved, G10.saved2);
  const Gback = await run(PRE, JSON.stringify(G10.saved));
  ok('E10: rollback to v287 keeps g45:0 ticked and its Lv 45 count', Gback.saved.checks['g45:0'] === true && Gback.m.gatesMain.g45 === Gpre.m.gatesMain.g45, [Gpre.m.gatesMain.g45, Gback.m.gatesMain.g45]);
  const N10 = await run(E2, fix287);
  ok('E10: a save without g45:0 gains neither g45:witness nor the flag', !('g45:witness' in N10.saved.checks) && N10.saved.g45Split1 === undefined, [N10.saved.checks['g45:witness'], N10.saved.g45Split1]);
  /* Late tick: the flag is already set (ORed in by sync), then an older build ticks g45:0 and syncs it here; g45:witness
     is absent. The current page still copies it; a deliberate untick (false) is left alone. */
  const L10 = await run(E2, JSON.stringify({ ...S10, g45Split1: true }));
  ok('E10 late tick: g45:0 ticked after the flag is set is still copied; g45:0 kept', !L10.errs.length && L10.saved.checks['g45:witness'] === true && L10.saved.checks['g45:0'] === true && L10.saved.g45Split1 === true,
    [L10.errs, L10.saved.checks['g45:witness'], L10.saved.checks['g45:0']]);
  same('E10 late tick: reload idempotent (saved state)', L10.saved, L10.saved2);
  const U10 = await run(E2, JSON.stringify({ ...S10, g45Split1: true, checks: { ...S10.checks, 'g45:witness': false } }));
  ok('E10 late tick: an unticked g45:witness (false) is never overridden', !U10.errs.length && U10.saved.checks['g45:witness'] === false, [U10.errs, U10.saved.checks['g45:witness']]);
  /* 6. 0.2.5 backup1: the v287 save in the current build at a fixed clock gains only backup = { since: the page clock }
     and backup1 (run B, with the real clock, got the same with its own time); a reload changes nothing; pre-E2 keeps both
     through an un-tick there; back in the current build, since has not moved. */
  const T3 = Date.parse('2026-10-16T12:00:00Z'), omitBk = o => { const { backup, backup1, ...r } = o; return r; };
  const G = await run5c(E2, fix287, T3, null);
  ok('backup1: no page errors', !G.errs.length, G.errs);
  ok('backup1: the save gains backup = { since: page clock } and backup1', JSON.stringify(G.loaded.backup) === JSON.stringify({ since: T3 }) && G.loaded.backup1 === true, [G.loaded.backup, G.loaded.backup1]);
  same('backup1: nothing else differs from the same save loaded with the real clock (run B)', omitBk(G.loaded), omitBk(B.saved));
  ok('backup1: run B (real clock) got a real-time baseline', B.saved.backup1 === true && B.saved.backup && B.saved.backup.since > T1 && Object.keys(B.saved.backup).join() === 'since', B.saved.backup);
  const lostG = []; for (const f of ['checks', 'started', 'areaRun', 'rqSnooze']) Object.entries(S[f] || {}).forEach(([k, v]) => { if (JSON.stringify((G.loaded[f] || {})[k]) !== JSON.stringify(v)) lostG.push(f + ':' + k); });
  ok('backup1: every saved key and value of the v287 save kept', !lostG.length, lostG);
  same('backup1: reload writes nothing (saved state)', G.saved, G.saved2);
  const R3 = await run5c(PRE, JSON.stringify(G.saved), T3 + 3600e3, untick('rq:2202053'));
  ok('backup1 rollback: pre-E2 keeps backup and backup1 in its save after an un-tick there',
    JSON.stringify(R3.saved.backup) === JSON.stringify({ since: T3 }) && R3.saved.backup1 === true && R3.saved.checks['rq:2202053'] === false, [R3.saved.backup, R3.saved.backup1]);
  const G2 = await run5c(E2, JSON.stringify(R3.saved), T3 + 7200e3, '(() => { save(); })()');
  ok('backup1 back from pre-E2: since is still the first load\'s clock (not moved by the later one)', JSON.stringify(G2.saved.backup) === JSON.stringify({ since: T3 }) && G2.saved.backup1 === true, G2.saved.backup);
  console.log(fail ? `E2 MIGRATION CHECK FAILED (${fail})` : 'E2 MIGRATION CHECK PASSED');
  await b.close(); process.exit(fail ? 1 : 0);
})();
