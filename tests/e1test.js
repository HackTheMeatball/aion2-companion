/* E1 functional checks. Usage: node tests/e1test.js <page URL> <flat fixture to import> (tests/run.mjs passes both:
   tests/fixtures/fixture-v285.flat.json, the v285 fixture as the current build stores it) */
const { chromium } = require('playwright'); const fs = require('fs');
const FILE = process.argv[2];
const { writeSave, readSave, clearSave, liveState, toStored, BEFORE_IMPORT_KEY } = require('./support/save');
let fail = 0; const ok = (name, cond, detail) => { console.log((cond ? 'ok   ' : 'FAIL ') + name + (detail !== undefined ? '  · ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)).replace(/\s+/g, ' ') : '')); if (!cond) fail++; };
const { clean, setState } = require('./support/e1-fixture');
const cards = p => p.evaluate(() => [...document.querySelectorAll('#nowStar .ns-card')].map(c => ({ t: (c.querySelector('h3') || {}).innerText || '', ctl: (c.querySelector('.meta') || {}).innerText || '', act: (c.querySelector('.meta [data-now]') || { dataset: {} }).dataset.now || '' })));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 }, acceptDownloads: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(FILE);
  /* 1. Fresh browser: Lv 1 on the first quest, nothing seeded */
  await clearSave(p); await p.reload(); await p.waitForTimeout(400);
  let st = await liveState(p);
  ok('fresh: seeds not applied (level, sp ticks, stigma, stones)', st.level === 1 && st.quest === 'A Village in the Fog' && !Object.keys(st.checks).some(k => k.startsWith('sp:')) && !st.stLv && !st.stones, { level: st.level, stLv: st.stLv, stones: st.stones });
  ok('fresh: cleared milestones folded, no one-time flags (save v5)', st.hideCards === true && !['seedLv12', 'stTriniel1', 'dvReset1', 'migV5', 'eputSync1', 'stampV1'].some(f => f in st));
  /* 2. A saved state: loaded as it is (the pre-0.4 player seeds are gone with the clean break, 0.4 P3c) */
  await writeSave(p, { checks: {}, level: 9, open: {}, quest: '' }); await p.reload(); await p.waitForTimeout(300);
  st = await liveState(p);
  ok('saved Lv 9, no ticks: loads as Lv 9 with no ticks (nothing seeded)', st.level === 9 && !Object.values(st.checks).some(Boolean) && !st.stLv && st.hideCards !== true, { level: st.level });
  const userLike = { checks: { 'g22:0': true, 'g22:1': true, 'sp:Ambush:2': true }, level: 25, open: {}, quest: 'Voice of Rage', stones: 7, stLv: { "Triniel's Dagger": 3 }, stShards: 4 };
  await writeSave(p, userLike); await p.reload(); await p.waitForTimeout(300);
  st = await liveState(p);
  ok('saved progress: kept as it is', st.level === 25 && st.stones === 7 && st.stLv["Triniel's Dagger"] === 3 && st.stShards === 4 && !st.checks['sp:Ambush:5'] && st.hideCards === undefined);
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
  let t = await p.evaluate(() => ({ shards: char(state).stShards, eq: char(state).checks['g27:0'], lv: char(state).stLv['Savage Fang'], toast: (document.getElementById('rwToast') || {}).innerText, estack: E_STACK(char(state).level) }));
  ok('equip: −1 shard, toast with Undo', t.shards === 2 && t.eq === true && t.lv === 1 && /−1 shard/.test(t.toast) && /Undo/.test(t.toast), t);
  ok('equip: E stack uses the pick', JSON.stringify(t.estack) === JSON.stringify(["Triniel's Dagger*", 'Savage Fang*']), t.estack);
  await p.click('#rwToast .tu'); await p.waitForTimeout(200);
  ok('undo gives the shard back, stays equipped', (await p.evaluate(() => [char(state).stShards, char(state).checks['g27:0']])).join() === '3,true');
  /* 6. Snooze (E3: at "Canyon's Secret" so more than one quest is open; quests without prerequisite data open at their rec) */
  await setState(p, clean(30, "Canyon's Secret", 'advanced'));
  const before = await p.evaluate(() => [...document.querySelectorAll('#nowStar .ns-qgrid .ql')].map(x => x.innerText));
  const zk = await p.evaluate(() => document.querySelector('#nowStar [data-snz]').dataset.snz);
  await p.click(`#nowStar [data-snz="${zk}"]`, { force: true }); await p.waitForTimeout(300);
  let z = await p.evaluate(k => ({ snz: char(state).rqSnooze, rows: [...document.querySelectorAll('#nowStar .ns-qgrid [data-rqk]')].map(x => x.dataset.rqk), sub: [...document.querySelectorAll('#nowStar .ns-card')].map(c => c.innerText).find(t => /Regional quests/.test(t)), ms: document.querySelector(`#gates li.qrow [data-snz="${k}"]`).textContent, cls: document.querySelector(`#gates li.qrow [data-snz="${k}"]`).closest('li').className }), zk);
  ok('snooze: hidden from Next up, counted, milestone shows undo', z.snz[zk] === 30 && !z.rows.includes(zk) && /1 not in game yet/.test(z.sub) && /undo/.test(z.ms) && /snoozed/.test(z.cls), { zk, sub: z.sub, ms: z.ms });
  await p.click('#lvlUpBig'); await p.waitForTimeout(300);
  ok('snooze: cleared by Level up', await p.evaluate(k => !(char(state).rqSnooze || {})[k], zk));
  // prerequisite turned in clears the follow-up's snooze
  await setState(p, clean(30, 'Dying Light', 'advanced'));
  const pre = await p.evaluate(() => { const b = GATES.flatMap(g => g.items).find(it => it.name === 'An Invitation to the Past: Part 2'), a = GATES.flatMap(g => g.items).find(it => it.name === 'An Invitation to the Past: Part 1'); return [a.k, b.k]; });
  await p.evaluate(k => { const zb = document.querySelector(`#gates li.qrow [data-snz="${k}"]`); document.getElementById('g30').open = true; zb.click(); }, pre[1]); await p.waitForTimeout(200);
  ok('snooze set from milestone row', await p.evaluate(k => !!(char(state).rqSnooze || {})[k], pre[1]));
  await p.evaluate(k => { const i = document.querySelector(`#gates input[data-k="${k}"]`); i.click(); i.click(); }, pre[0]); await p.waitForTimeout(1500);
  ok('snooze: cleared when the quest before it is turned in', await p.evaluate(([a, b]) => char(state).checks[a] === true && !(char(state).rqSnooze || {})[b], pre));
  /* 7. Story end (0.3 E10: the data now ends at Daeva Trapped in a Nightmare, Lv 45; the game's next story quest unlocks at 46) */
  await setState(p, clean(45, 'Daeva Trapped in a Nightmare', 'advanced'));
  await p.evaluate(() => { const c = [...document.querySelectorAll('#nowStar .ns-card')].find(c => /Daeva Trapped in a Nightmare/.test(c.innerText)); c.querySelector('[data-now="story"]').click(); }); await p.waitForTimeout(800);
  let se = await p.evaluate(() => ({ end: char(state).storyEnd, card: [...document.querySelectorAll('#nowStar .ns-card')].map(c => c.innerText).find(t => /story/i.test(t)), hasBtn: !!document.querySelector('#nowStar [data-now="story"]'), status: document.getElementById('questStatus').innerText }));
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
  ok('export: file equals the saved state', JSON.stringify(exported) === JSON.stringify(live) && /^companion-save-\d{4}-\d\d-\d\d\.json$/.test(dl.suggestedFilename()), dl.suggestedFilename());
  /* the flat fixture as a v5 export (an export from another browser: its own slot id) */
  const other = JSON.parse(fs.readFileSync(process.argv[3] || '/dev/null', 'utf8') || '{}'), otherFile = toStored(other);
  const tmp = require('path').join(require('os').tmpdir(), 'imp.json'); fs.writeFileSync(tmp, JSON.stringify(otherFile));
  await p.setInputFiles('#impIn', tmp); await p.waitForTimeout(200);
  ok('import: asks before replacing', /Replace your progress/.test(await p.innerText('#xferMsg')));
  await Promise.all([p.waitForNavigation(), p.click('#impGo')]); await p.waitForTimeout(400);
  const after = [await liveState(p), await readSave(p, { key: BEFORE_IMPORT_KEY })];
  ok('import: state replaced, previous kept under :before-import', after[0].level === other.level && JSON.stringify(after[0].checks) === JSON.stringify(other.checks) && after[1].level === 33, { lv: after[0].level });
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
  /* Card order (0.5 P2): at <= 860 px Next up, Journey, Progress lead #main and Dungeons & Strongholds / The map come after it
     (phone-layout 3.1); above 860 px the markup order stands. Crossing 860 px either way gives the markup a fresh load has. */
  const order = () => p.evaluate(() => { const t = e => e.getBoundingClientRect().top + scrollY, q = s => document.querySelector(s);
    return { dom: [...document.querySelectorAll('.layout > main > *, .layout > aside > *')].map(e => e.id || e.className.split(' ')[0]).join(' '), landmarks: !!q('aside.rail') && !!q('main#main'),
      y: ['#nowStar', 'section.where', '.progress-row', '#spCard', '#gates', '#areas'].map(s => Math.round(t(q(s)))) }; });
  const layoutHtml = () => p.evaluate(() => document.querySelector('.layout').innerHTML);
  await p.setViewportSize({ width: 1100, height: 900 }); await p.reload(); await p.waitForTimeout(400);
  const wideFresh = await layoutHtml(), wideOrder = await order();
  await p.setViewportSize({ width: 390, height: 850 }); await p.waitForTimeout(400);
  const narrow = await order(), narrowHtml = await layoutHtml();
  ok('390px: Next up, Journey, Progress, Skills, Milestones, Dungeons & Strongholds in that order, both landmarks present', narrow.landmarks && narrow.y.every((v, i) => !i || v > narrow.y[i - 1]) && narrow.y[0] < 500, narrow);
  ok('390px: Basic keeps The map hidden', await p.evaluate(() => { document.body.classList.add('basic'); const n = document.querySelector('aside.rail > section.notes'); const h = getComputedStyle(n).display === 'none'; document.body.classList.remove('basic'); return h; }));
  await p.setViewportSize({ width: 1100, height: 900 }); await p.waitForTimeout(400);
  ok('crossing 860 px up: same markup as a fresh load at 1100', (await layoutHtml()) === wideFresh && (await order()).dom === wideOrder.dom);
  await p.setViewportSize({ width: 390, height: 850 }); await p.waitForTimeout(400);
  ok('crossing 860 px down: same markup as the first load at 390', (await layoutHtml()) === narrowHtml);
  /* 12b. Sticky level bar (0.5 P4): at 390 px the one #lvlUpBig sits in the bar, stays visible when scrolled, and works */
  await setState(p, clean(20, 'Symbol of Liberation', 'advanced'));
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(200);
  const lb = await p.evaluate(() => { const bs = document.querySelectorAll('#lvlUpBig'), b = bs[0], r = b.getBoundingClientRect(); return { n: bs.length, inBar: !!b.closest('#lvlBar'), top: r.top, h: r.height, lv: document.getElementById('lvlBarLv').textContent, barH: getComputedStyle(document.documentElement).getPropertyValue('--lvlbar-h') }; });
  ok('390px: one #lvlUpBig, in the sticky bar, visible at the page bottom, >= 44 px', lb.n === 1 && lb.inBar && lb.top >= 0 && lb.top < 100 && lb.h >= 44 && lb.lv === 'LV 20' && parseInt(lb.barH) > 40, lb);
  await p.click('#lvlUpBig'); await p.waitForTimeout(300);
  ok('390px: Level up in the bar raises the level and the bar label', await p.evaluate(() => char(state).level === 21 && document.getElementById('lvlBarLv').textContent === 'LV 21'));
  await setState(p, clean(45, 'Symbol of Liberation', 'advanced'));
  ok('390px Lv 45: disabled in the bar with the cap title', await p.evaluate(() => { const b = document.getElementById('lvlUpBig'); return !!b.closest('#lvlBar') && b.disabled && b.title === 'Level cap (45)'; }));
  await p.setViewportSize({ width: 1100, height: 900 }); await p.waitForTimeout(400);
  ok('1100px: #lvlUpBig back in Journey, bar hidden, --lvlbar-h 0', await p.evaluate(() => { const b = document.getElementById('lvlUpBig'); return document.querySelectorAll('#lvlUpBig').length === 1 && !!b.closest('.where-head') && b.disabled && getComputedStyle(document.getElementById('lvlBar')).display === 'none' && parseInt(getComputedStyle(document.documentElement).getPropertyValue('--lvlbar-h')) === 0; }));
  await setState(p, clean(20, 'Symbol of Liberation', 'advanced'));
  await p.click('#lvlUpBig'); await p.waitForTimeout(300);
  ok('1100px: Level up in Journey still works after the round trip', await p.evaluate(() => char(state).level === 21));
  await p.setViewportSize({ width: 390, height: 850 }); await p.waitForTimeout(400);
  ok('back at 390px: in the bar again, handler works', await (async () => { const inBar = await p.evaluate(() => !!document.getElementById('lvlUpBig').closest('#lvlBar')); await p.click('#lvlUpBig'); await p.waitForTimeout(300); return inBar && await p.evaluate(() => char(state).level === 22); })());
  /* 12c. Next up on phones (0.5 P3, phone-layout 3.4): at 390 px with touch, the owner's Lv 27 save. The featured card's
     actions are full width and 44 px, the "i" never follows the title, there is no nested scroll, and in Advanced the
     "1 of N" pager reaches every card by button and by keyboard; Basic has no pager. Above 600 px none of it. */
  {
    const { flatFixture } = require('./support/save');
    const pctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }), pp = await pctx.newPage(); pp.on('pageerror', e => errs.push('phone: ' + e.message));
    await pp.goto(FILE);
    const load = async mode => { await writeSave(pp, { ...flatFixture('fixture-user-v285.flat.json'), mode }, { fresh: true }); await pp.reload(); await pp.waitForTimeout(450); };
    const look = () => pp.evaluate(() => { const r = e => e.getBoundingClientRect(), w = document.getElementById('nsqWrap'), cs = [...w.children], f = w.querySelector('.ns-card.first'), fr = r(f), pad = parseFloat(getComputedStyle(f.querySelector('.ns-mhead')).paddingLeft);
      const btns = [...f.querySelectorAll('.meta button, .meta a')].filter(x => x.offsetParent).map(x => ({ h: Math.round(r(x).height), w: Math.round(r(x).width) }));
      const h3 = f.querySelector('h3'), ib = f.querySelector('.nsinfo');
      return { n: cs.length, cur: cs.indexOf(f), firsts: w.querySelectorAll('.ns-card.first').length, phone: w.classList.contains('ns-phone'), pg: (document.querySelector('#nowStar .ns-pgn') || {}).textContent || null,
        inner: Math.round(fr.width - 2 * pad - 2), btns, iInTitle: document.querySelectorAll('#nowStar h3 .nsinfo').length, iLine: ib && ib.offsetParent ? { iTop: Math.round(r(ib).top), h3Bottom: Math.round(r(h3).bottom) } : null,
        nested: w.scrollHeight > w.clientHeight + 1 || getComputedStyle(w).overflowY !== 'visible', compactActs: cs.filter(c => c !== f).some(c => [...c.querySelectorAll('.meta button, .ns-extra button')].some(x => x.offsetParent)),
        sw: document.documentElement.scrollWidth, iw: innerWidth }; });
    await load('advanced');
    let m = await look();
    ok('phone Advanced Lv 27: featured card first, its actions >= 44 px tall and as wide as the card', m.phone && m.cur === 0 && m.btns.length > 0 && m.btns.every(x => x.h >= 44 && x.w >= m.inner - 1), m);
    ok('phone Advanced Lv 27: no "i" after a title, no nested scroll, no actions on compact cards, no sideways scroll', !m.iInTitle && !m.nested && !m.compactActs && m.sw <= m.iw, m);
    ok(`phone Advanced Lv 27: pager says "1 of ${m.n}"`, m.n > 1 && m.pg === `1 of ${m.n}`, m.pg);
    const names = await pp.evaluate(() => ({ group: document.querySelector('#nowStar .ns-pg').getAttribute('aria-label'), b: [...document.querySelectorAll('#nowStar [data-nspg]')].map(x => x.getAttribute('aria-label')), live: document.querySelector('#nowStar .ns-pgn').getAttribute('aria-live') }));
    ok('phone pager: spoken names (group, Previous card, Next card), the count is announced', names.group === 'Next up cards' && names.b.join() === 'Previous card,Next card' && names.live === 'polite', names);
    const seen = [], bad = [];
    for (let i = 0; i < m.n; i++) { const x = await look(); seen.push(x.cur);
      if (x.pg !== `${i + 1} of ${m.n}` || x.firsts !== 1 || x.iInTitle || (x.iLine && x.iLine.iTop < x.iLine.h3Bottom) || !x.btns.every(y => y.h >= 44 && y.w >= x.inner - 1)) bad.push({ i, ...x });
      await pp.click('#nowStar [data-nspg="1"]'); await pp.waitForTimeout(80); }
    m = await look();
    ok('phone pager: "Next card" reaches every card in order, then wraps to the first', seen.join() === [...Array(m.n).keys()].join() && m.cur === 0 && !bad.length, { seen, bad: bad.slice(0, 3) });
    await pp.click('#nowStar [data-nspg="-1"]'); await pp.waitForTimeout(80);
    ok('phone pager: "Previous card" from the first goes to the last', (await look()).cur === m.n - 1);
    await pp.focus('#nowStar [data-nspg="1"]'); await pp.keyboard.press('ArrowRight'); await pp.waitForTimeout(80);
    const k1 = await look(), kf = await pp.evaluate(() => document.activeElement.dataset.nspg);
    await pp.keyboard.press('ArrowLeft'); await pp.keyboard.press('ArrowLeft'); await pp.waitForTimeout(80);
    const k2 = await look();
    ok('phone pager: arrow keys move it, focus stays on the pager', k1.cur === 0 && k2.cur === m.n - 2 && kf === '1' && await pp.evaluate(() => !!document.activeElement.closest('#nowStar .ns-pg')), { k1: k1.cur, k2: k2.cur, kf });
    /* the featured card's action works where the pager put it: "Spent" on the first skill card buys the points */
    await load('advanced');
    const st0 = await pp.evaluate(() => JSON.stringify(char(state).checks));
    await pp.click('#nowStar .ns-card.first .meta button'); await pp.waitForTimeout(800);
    ok('phone: the featured card\'s action completes it', await pp.evaluate(() => JSON.stringify(char(state).checks)) !== st0);
    await load('basic');
    m = await look();
    ok('phone Basic Lv 27: no pager, the first card featured with full-width 44 px actions, no nested scroll', m.phone && m.pg === null && m.cur === 0 && m.btns.length > 0 && m.btns.every(x => x.h >= 44 && x.w >= m.inner - 1) && !m.nested, m);
    await pp.setViewportSize({ width: 601, height: 844 }); await pp.waitForTimeout(300);
    ok('601 px: the desktop stack (no pager, no phone layout)', await pp.evaluate(() => !document.querySelector('#nowStar .ns-pg, #nowStar .ns-phone') && !!document.querySelector('#nowStar h3 .nsinfo, #nowStar .ns-stack')));
    await pctx.close();
  }
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
