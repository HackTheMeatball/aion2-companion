/* E1 functional checks. Usage: node tests/e1test.js <page URL> <v285 fixture> (tests/run.mjs passes both) */
const { chromium } = require('playwright'); const fs = require('fs');
const FILE = process.argv[2], KEY = 'aion2-assassin-route-v4';
let fail = 0; const ok = (name, cond, detail) => { console.log((cond ? 'ok   ' : 'FAIL ') + name + (detail !== undefined ? '  · ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)).replace(/\s+/g, ' ') : '')); if (!cond) fail++; };
const { clean, setState } = require('./support/e1-fixture');
const cards = p => p.evaluate(() => [...document.querySelectorAll('#nowStar .ns-card')].map(c => ({ t: (c.querySelector('h3') || {}).innerText || '', ctl: (c.querySelector('.meta') || {}).innerText || '', act: (c.querySelector('.meta [data-now]') || { dataset: {} }).dataset.now || '' })));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 }, acceptDownloads: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(FILE);
  /* 1. Fresh browser: seeds don't run */
  await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
  let st = await p.evaluate(() => state);
  ok('fresh: seeds not applied (level, sp ticks, stigma, stones)', st.level === 1 && st.quest === 'A Village in the Fog' && !Object.keys(st.checks).some(k => k.startsWith('sp:')) && !st.stLv && !st.stones, { level: st.level, stLv: st.stLv, stones: st.stones });
  ok('fresh: seed flags + migV5 set, cleared milestones folded', st.seedLv12 && st.stTriniel1 && st.dvReset1 && st.migV5 && st.hideCards === true);
  /* 2. Saved state without flags: seeds still run (old behaviour); with flags: no-op */
  await p.evaluate(k => localStorage.setItem(k, JSON.stringify({ checks: {}, level: 9, open: {}, quest: '' })), KEY); await p.reload(); await p.waitForTimeout(300);
  st = await p.evaluate(() => state);
  ok('saved w/o flags: seeds run as in v285', st.level === 12 && st.checks['sp:Ambush:5'] === true && st.checks['g22:1'] === true && st.stLv["Triniel's Dagger"] === 1 && st.hideCards !== true);
  const userLike = { checks: { 'g22:0': true, 'g22:1': true, 'sp:Ambush:2': true }, level: 25, open: {}, quest: 'Voice of Rage', seedLv12: true, stTriniel1: true, dvReset1: true, stones: 7, stLv: { "Triniel's Dagger": 3 }, stShards: 4 };
  await p.evaluate(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), [KEY, userLike]); await p.reload(); await p.waitForTimeout(300);
  st = await p.evaluate(() => state);
  ok('saved with flags: seeds are no-ops', st.level === 25 && st.stones === 7 && st.stLv["Triniel's Dagger"] === 3 && st.stShards === 4 && !st.checks['sp:Ambush:5'] && st.hideCards === undefined);
  ok('equipped slot 1 pinned to its stigma', st.stPick && st.stPick[1] === "Triniel's Dagger");
  /* 3. Keys: every checkable item has an explicit, unique key */
  const keys = await p.evaluate(() => { const ks = [], miss = []; [...GATES, ...STEPS].forEach(g => g.items.forEach((it, j) => { if (it.sub != null || it.hidden || it.group) return; if (!it.k) miss.push(g.id + ':' + j); else ks.push(it.k); })); AREA_ITEMS.filter(x => x.it.kind === 'stronghold').forEach(x => ks.push(x.k)); return { miss, dup: ks.filter((k, i) => ks.indexOf(k) !== i) }; });
  ok('every item has an explicit key', !keys.miss.length, keys.miss);
  ok('keys unique', !keys.dup.length, [...new Set(keys.dup)]);
  /* 4. Next up at stigma levels: one card, titles clean, no duplicates */
  for (const mode of ['advanced', 'basic']) for (const [L, q] of [[22, 'Daeva in a Dream'], [25, 'Voice of Rage'], [27, 'Preparations for Restoration'], [30, 'Dying Light'], [32, 'Bitter Reality'], [35, 'Enemy Territory'], [37, 'Inevitable Encounter'], [40, 'Symbol of Liberation'], [42, 'Symbol of Liberation'], [45, 'Symbol of Liberation']]) {
    await setState(p, clean(L, q, mode));
    const cs = await cards(p);
    const acts = cs.map(c => c.act).filter(a => a && !/^(areas|rqgo|gate)/.test(a));
    ok(`${mode} Lv ${L}: no duplicate Next up actions`, new Set(acts).size === acts.length, acts);
    ok(`${mode} Lv ${L}: one Equip card at most`, cs.filter(c => /^Equip\b/.test(c.t)).length <= 1, cs.filter(c => /Equip|on E/.test(c.t)).map(c => c.t));
    ok(`${mode} Lv ${L}: no title ends in ':' or '.'`, cs.every(c => !/[:.]\s*$/.test(c.t.replace(/\s*i$/, ''))), cs.map(c => c.t).filter(t => /[:.]\s*$/.test(t)));
    if (mode === 'basic') ok(`basic Lv ${L}: no Later / queued cards`, cs.every(c => !/Later|After the one above/.test(c.ctl)), cs.map(c => c.ctl));
    const r = await p.evaluate(() => ({ sp: document.getElementById('spHero').offsetHeight, spTxt: document.getElementById('spHero').innerText.trim(), st: document.getElementById('stBody').innerText.trim().length, dv: document.getElementById('dvBox').hidden || document.getElementById('dvNextList').innerText.trim().length, story: [...document.querySelectorAll('#nowStar .ns-card h3')].some(h => /Story|story|main quest/.test(h.innerText)) }));
    ok(`${mode} Lv ${L}: Skills / Daevanion / Stigmas cards not empty`, r.sp > 20 && r.spTxt && r.st > 0 && r.dv, r.spTxt.slice(0, 60));
    ok(`${mode} Lv ${L}: a story card exists`, r.story);
  }
  /* 5. Stigma pick + visible shard deduction with undo */
  await setState(p, clean(27, 'Preparations for Restoration', 'advanced'));
  const opts = await p.evaluate(() => [...document.querySelectorAll('#stCard [data-stpick] option')].map(o => o.textContent));
  ok('pick offers the free stigmas (not slot 1\'s)', JSON.stringify(opts) === JSON.stringify(["Illusive Clone", "Swift Contract", "Savage Fang", "Other…"]) /* E2: plan order IC, SC, SF; E3: + "Other…" */, opts);
  await p.selectOption('#stCard [data-stpick]', 'Savage Fang'); await p.waitForTimeout(200);
  let s2 = await p.evaluate(() => ({ names: stNames(), ms: [...document.querySelectorAll('#g27 .stn')].map(x => x.textContent), erow: (document.querySelector('#g27 .erow') || {}).textContent, btn: document.querySelector('#stCard [data-sttick]').textContent, eq: (document.querySelector('#nowStar .ns-card h3') ? [...document.querySelectorAll('#nowStar .ns-card h3')].map(h => h.innerText).find(t => /^Equip/.test(t)) : '') }));
  ok('pick: names follow (slot 2 = Savage Fang, slot 4 falls to Illusive Clone)', s2.names.join('|') === "Triniel's Dagger|Savage Fang|Swift Contract|Illusive Clone", s2.names); /* E2 plan order */
  ok('pick: milestone lines and E row follow', s2.ms.every(x => x === 'Savage Fang') && s2.erow === ', row 1', s2);
  ok('pick: Next up card and button show −1 shard', /Savage Fang/.test(s2.eq) && /−1 shard/.test(s2.btn), s2);
  await p.click('#stCard [data-sttick]'); await p.waitForTimeout(300);
  let t = await p.evaluate(() => ({ shards: state.stShards, eq: state.checks['g27:0'], lv: state.stLv['Savage Fang'], toast: (document.getElementById('rwToast') || {}).innerText, estack: E_STACK(state.level) }));
  ok('equip: −1 shard, toast with Undo', t.shards === 2 && t.eq === true && t.lv === 1 && /−1 shard/.test(t.toast) && /Undo/.test(t.toast), t);
  ok('equip: E stack uses the pick', JSON.stringify(t.estack) === JSON.stringify(["Triniel's Dagger*", 'Savage Fang*']), t.estack);
  await p.click('#rwToast .tu'); await p.waitForTimeout(200);
  ok('undo gives the shard back, stays equipped', (await p.evaluate(() => [state.stShards, state.checks['g27:0']])).join() === '3,true');
  /* 6. Snooze (E3: at "Canyon's Secret" so more than one quest is open; quests without prerequisite data open at their rec) */
  await setState(p, clean(30, "Canyon's Secret", 'advanced'));
  const before = await p.evaluate(() => [...document.querySelectorAll('#nowStar .ns-qgrid .ql')].map(x => x.innerText));
  const zk = await p.evaluate(() => document.querySelector('#nowStar [data-snz]').dataset.snz);
  await p.click(`#nowStar [data-snz="${zk}"]`, { force: true }); await p.waitForTimeout(300);
  let z = await p.evaluate(k => ({ snz: state.rqSnooze, rows: [...document.querySelectorAll('#nowStar .ns-qgrid [data-rqk]')].map(x => x.dataset.rqk), sub: [...document.querySelectorAll('#nowStar .ns-card')].map(c => c.innerText).find(t => /Regional quests/.test(t)), ms: document.querySelector(`#gates li.qrow [data-snz="${k}"]`).textContent, cls: document.querySelector(`#gates li.qrow [data-snz="${k}"]`).closest('li').className }), zk);
  ok('snooze: hidden from Next up, counted, milestone shows undo', z.snz[zk] === 30 && !z.rows.includes(zk) && /1 not in game yet/.test(z.sub) && /undo/.test(z.ms) && /snoozed/.test(z.cls), { zk, sub: z.sub, ms: z.ms });
  await p.click('#lvlUpBig'); await p.waitForTimeout(300);
  ok('snooze: cleared by Level up', await p.evaluate(k => !(state.rqSnooze || {})[k], zk));
  // prerequisite turned in clears the follow-up's snooze
  await setState(p, clean(30, 'Dying Light', 'advanced'));
  const pre = await p.evaluate(() => { const b = GATES.flatMap(g => g.items).find(it => it.name === 'An Invitation to the Past: Part 2'), a = GATES.flatMap(g => g.items).find(it => it.name === 'An Invitation to the Past: Part 1'); return [a.k, b.k]; });
  await p.evaluate(k => { const zb = document.querySelector(`#gates li.qrow [data-snz="${k}"]`); document.getElementById('g30').open = true; zb.click(); }, pre[1]); await p.waitForTimeout(200);
  ok('snooze set from milestone row', await p.evaluate(k => !!(state.rqSnooze || {})[k], pre[1]));
  await p.evaluate(k => { const i = document.querySelector(`#gates input[data-k="${k}"]`); i.click(); i.click(); }, pre[0]); await p.waitForTimeout(1500);
  ok('snooze: cleared when the quest before it is turned in', await p.evaluate(([a, b]) => state.checks[a] === true && !(state.rqSnooze || {})[b], pre));
  /* 7. Story end (0.3 E10: the data now ends at Daeva Trapped in a Nightmare, Lv 45; the game's next story quest unlocks at 46) */
  await setState(p, clean(45, 'Daeva Trapped in a Nightmare', 'advanced'));
  await p.evaluate(() => { const c = [...document.querySelectorAll('#nowStar .ns-card')].find(c => /Daeva Trapped in a Nightmare/.test(c.innerText)); c.querySelector('[data-now="story"]').click(); }); await p.waitForTimeout(800);
  let se = await p.evaluate(() => ({ end: state.storyEnd, card: [...document.querySelectorAll('#nowStar .ns-card')].map(c => c.innerText).find(t => /story/i.test(t)), hasBtn: !!document.querySelector('#nowStar [data-now="story"]'), status: document.getElementById('questStatus').innerText }));
  ok('story end: "Lv 45 story complete", names the next quest in game, no dead Turned in', se.end === 'Daeva Trapped in a Nightmare' && /Lv 45 story complete/.test(se.card) && /Next in game: "Waiting for the Next Journey" at Lv 46/.test(se.card) && !se.hasBtn, se);
  ok('story end: Journey says the Lv 45 story is complete', /Lv 45 story complete — next in game: "Waiting for the Next Journey" at Lv 46/.test(se.status), se.status);
  await p.fill('#questIn', 'Waiting for the Next Journey'); await p.dispatchEvent('#questIn', 'change'); await p.waitForTimeout(100);
  ok('story input message names the last covered quest', /story ends at "Daeva Trapped in a Nightmare" \(Lv 45\)/.test(await p.innerText('#questStatus')));
  /* 8. Level cap */
  await setState(p, clean(45, 'Symbol of Liberation', 'advanced'));
  const cap = await p.evaluate(() => ({ ahead: document.getElementById('ahead').innerText, dis: document.getElementById('lvlUpBig').disabled }));
  ok('Lv 45: Ahead shows the cap, Level up disabled', /Level cap reached/.test(cap.ahead) && cap.dis, cap);
  /* 9. Paid filter gone; default band */
  ok('Paid tasks filter removed', await p.evaluate(() => !document.getElementById('fPaid') && !/Paid tasks/.test(document.getElementById('filtMenu').innerText)));
  await setState(p, clean(32, 'Bitter Reality', 'advanced'));
  ok('Dungeons & Strongholds defaults to the band with your level', /^Lv 30–34/.test(await p.evaluate(() => areaSel.selectedOptions[0].textContent)), await p.evaluate(() => areaSel.selectedOptions[0].textContent));
  /* 10. Zones match between milestone rows and Next up / RQ table */
  const zm = await p.evaluate(() => GATES.flatMap(g => g.items.filter(it => it.kind === 'quest').map(it => { const li = document.querySelector(`#gates input[data-k="${it.k}"]`).closest('li'); const z = li.querySelector('.loc').textContent.split(' · ')[0]; return [it.name, z, it.q.zone]; })).filter(([, a, b]) => a !== b));
  ok('every regional quest row shows its RQ zone', !zm.length, zm);
  /* 11. Export / import */
  await setState(p, clean(33, 'Last Refuge', 'advanced', { stShards: 9, rqSnooze: {} }));
  /* Export: outside claude.ai (no window.claude.use) it is a plain Blob download (the check from before the downloads-capability version). */
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#expBtn')]);
  const exported = JSON.parse(fs.readFileSync(await dl.path(), 'utf8')), live = await p.evaluate(() => state);
  ok('export: file equals the saved state', JSON.stringify(exported) === JSON.stringify(live) && /^aion2-assassin-progress-\d{4}-\d\d-\d\d\.json$/.test(dl.suggestedFilename()), dl.suggestedFilename());
  const other = JSON.parse(fs.readFileSync(process.argv[3] || '/dev/null', 'utf8') || '{}');
  const tmp = require('path').join(require('os').tmpdir(), 'imp.json'); fs.writeFileSync(tmp, JSON.stringify(other));
  await p.setInputFiles('#impIn', tmp); await p.waitForTimeout(200);
  ok('import: asks before replacing', /Replace your progress/.test(await p.innerText('#xferMsg')));
  await Promise.all([p.waitForNavigation(), p.click('#impGo')]); await p.waitForTimeout(400);
  const after = await p.evaluate(k => [state, JSON.parse(localStorage.getItem(k + ':before-import'))], KEY);
  ok('import: state replaced (and migrated), previous kept under :before-import', after[0].level === other.level && after[0].migV5 && after[0].checks['rq:2202017'] === other.checks['g22:4'] && after[1].level === 33, { lv: after[0].level });
  /* 12. Layout (update() timing: tests/perf.js) */
  for (const [w, h] of [[1500, 1000], [1100, 900], [390, 850]]) {
    await p.setViewportSize({ width: w, height: h }); await setState(p, clean(30, 'Dying Light', 'advanced'));
    const m = await p.evaluate(() => { const ts = []; for (let i = 0; i < 10; i++) { const t0 = performance.now(); update(); ts.push(performance.now() - t0); } ts.sort((a, b) => a - b); return { med: ts[5], sw: document.documentElement.scrollWidth, iw: innerWidth }; });
    ok(`${w}px: no horizontal scroll`, m.sw <= m.iw, m);
    console.log(`info ${w}px: update() median ${m.med.toFixed(1)} ms (the < 15 ms check is in tests/perf.js, non-blocking)`);
  }
  /* Build tab vs Next up at 390 */
  const ov = await p.evaluate(() => { const t = document.getElementById('sdTab').getBoundingClientRect(), c = document.querySelector('#nowStar .ns-card').getBoundingClientRect(); return { tabL: Math.round(t.left), cardR: Math.round(c.right) }; });
  ok('390px: Build tab clears the Next up card', ov.tabL >= ov.cardR, ov);
  /* 13. Drawer focus */
  await p.setViewportSize({ width: 1500, height: 1000 }); await p.reload(); await p.waitForTimeout(300);
  await p.click('#sdTab'); await p.waitForTimeout(100);
  ok('drawer: focus moves to Close on open', await p.evaluate(() => document.activeElement.id === 'sdClose'));
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  ok('drawer: focus back on the tab on close', await p.evaluate(() => document.activeElement.id === 'sdTab'));
  ok('no page errors', !errs.length, errs);
  console.log(fail ? `E1 CHECKS FAILED (${fail})` : 'E1 CHECKS PASSED');
  await b.close(); process.exit(fail ? 1 : 0);
})();
