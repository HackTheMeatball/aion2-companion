/* E3 functional checks. node tests/e3test.js  (page at AION_BASE; see tests/config.js) */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const ROOT = path.resolve(__dirname, '..'); const CFG = require('./config');
const { buildFixture } = require('./support/regress-fixture'); const { writeSave } = require('./support/save');
let fail = 0; const ok = (n, c, d) => { console.log((c ? 'ok   ' : 'FAIL ') + n + (!c && d !== undefined ? '  · ' + JSON.stringify(d).slice(0, 500) : '')); if (!c) fail++; };
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1500, height: 1000 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(CFG.CUR);
  const set = async (L, extra = {}, fx = 'clean', mode = 'advanced') => { await writeSave(p, Object.assign(await p.evaluate(buildFixture, { L, mode, fx }), extra)); await p.reload(); await p.waitForTimeout(350); };
  const cards = () => p.evaluate(() => [...document.querySelectorAll('#nowStar .ns-card')].map(c => c.querySelector('h3').innerText.replace(/\s+/g, ' ') + ' | ' + ((c.querySelector('.title > p') || {}).innerText || '') + ' | ' + ((c.querySelector('.meta') || {}).innerText || '')));
  /* P0-1: no-prereq quests open at rec; snooze kept until rec */
  await set(27);
  let r = await p.evaluate(() => ({ herb: rqAvail(RQ_BY['Herb Pouch Heist']).open, favor: rqAvail(RQ_BY['Her Last Favor']).open, favor30: rqAvail(RQ_BY['Her Last Favor'], 30).open, rows: [...document.querySelectorAll('#nowStar .ql a, #nowStar .ql span[title]')].map(x => x.innerText) }));
  ok('P0-1 Herb Pouch Heist / Her Last Favor closed at 27, Her Last Favor open at 30', !r.herb && !r.favor && r.favor30 && !r.rows.includes('Herb Pouch Heist'), r);
  await set(29, { rqSnooze: { 'rq:2202018': 29, 'rq:2202062': 29 } });
  await p.click('#lvlUpBig'); await p.waitForTimeout(400);
  r = await p.evaluate(() => state.rqSnooze || {}); ok('P0-1 Level up 29→30 keeps nothing for quests whose rec is reached, clears others', !r['rq:2202062'] && !r['rq:2202018'], r);
  await set(27, { rqSnooze: { 'rq:2202066': 27, 'rq:2202062': 27 } });
  await p.click('#lvlUpBig'); await p.waitForTimeout(400);
  r = await p.evaluate(() => state.rqSnooze || {}); ok('P0-1 Level up 27→28 keeps Herb Pouch Heist snooze (rec 44), clears Fight Poison', !!r['rq:2202066'] && !r['rq:2202062'], r);
  /* P0-2: locked row: In my game, req line hidden once picked up */
  await set(27, { quest: 'Preparations for Restoration' });
  r = await p.evaluate(() => { const i = document.querySelector('#gates input[data-k="rq:2202062"]'), li = i.closest('li'); return { locked: li.classList.contains('locked'), ig: !li.querySelector('.q-inl').hidden, req: !li.querySelector('.rq-req').hidden }; });
  ok('P0-2 locked row shows "In my game" and its requirement', r.locked && r.ig && r.req, r);
  await p.evaluate(() => { document.querySelector('#gates input[data-k="rq:2202062"]').closest('details').open = true; document.querySelector('#gates [data-ingame="rq:2202062"]').click(); }); await p.waitForTimeout(300);
  r = await p.evaluate(() => { const li = document.querySelector('#gates input[data-k="rq:2202062"]').closest('li'); return { started: (state.started || {})['rq:2202062'], locked: li.classList.contains('locked'), ig: !li.querySelector('.q-inl').hidden, req: !li.querySelector('.rq-req').hidden, inNext: [...document.querySelectorAll('#nowStar .ql')].some(x => /Fight Poison/.test(x.innerText)) }; });
  ok('P0-2 "In my game" = picked up; requirement line and button hide; shows in Next up', r.started === 1 && !r.locked && !r.ig && !r.req && r.inNext, r);
  /* P1-6: 0 shards → Needs 1 shard, disabled; Next up card without button */
  await set(27, { stShards: 0, stLv: { "Triniel's Dagger": 5 } });
  r = await p.evaluate(() => { const bt = document.querySelector('#stCard [data-sttick]'); return { dis: bt.disabled, txt: bt.innerText, small: document.querySelector('#stCard .dvhead small').innerText }; });
  ok('P1-6 0 shards: equip disabled, "Needs 1 shard", "+1 at Lv 28"', r.dis && /Needs 1 shard/.test(r.txt) && /\+1 at Lv 28/.test(r.small), r);
  let cs = await cards(); const eq = cs.find(c => /^Equip /.test(c));
  ok('P1-6 Next up: Equip card waits (tag, no button), after the story', !!eq && /Needs 1 shard/.test(eq) && cs.indexOf(eq) > cs.findIndex(c => /^Story:/.test(c)), cs);
  await set(27, { stShards: 2, stLv: { "Triniel's Dagger": 5 } });
  await p.click('#stCard [data-sttick]'); await p.waitForTimeout(300);
  r = await p.evaluate(() => ({ sh: state.stShards, undo: !!document.querySelector('#rwToast .tu') })); ok('P1-6 with shards: equip −1 with Undo', r.sh === 1 && r.undo, r);
  await p.click('#rwToast .tu'); await p.waitForTimeout(300); r = await p.evaluate(() => state.stShards); ok('P1-6 Undo gives the shard back', r === 2, r);
  /* P2-9: Other… */
  await set(27);
  await p.selectOption('#stCard [data-stpick]', '__other'); await p.waitForTimeout(200);
  await p.fill('#stCard [data-stother]', 'Shadow Fall'); await p.press('#stCard [data-stother]', 'Enter'); await p.waitForTimeout(300);
  r = await p.evaluate(() => ({ pick: state.stPick, name: document.querySelector('#stCard .spname').innerText, ico: document.querySelector('#stCard .dvico').innerText, eRow: [...document.querySelectorAll('.erow')].map(x => x.textContent).join('|') }));
  ok('P2-9 "Other…" records an off-plan stigma; initials icon; no "row -1"', r.pick[2] === 'Shadow Fall' && /Shadow Fall/.test(r.name) && r.ico === 'SF' && !/-1/.test(r.eRow), r);
  /* P1-1/P1-3/P1-4 */
  await set(30, {}, 'messy'); cs = await cards();
  ok('P1-1 story card present (Lv 30 messy)', cs.some(c => /^Story:|^Continue the story/.test(c)), cs);
  ok('P1-3 Vaizel: one card (milestone step), not also a board buy card', cs.filter(c => /Vaizel/.test(c.split(' | ')[0])).length === 1, cs);
  await set(37, { quest: 'Mirror of Greed' }); cs = await cards();
  ok('P1-3 no "Mirror of Greed" milestone card next to the story card', cs.filter(c => /Mirror of Greed/.test(c)).length === 1, cs);
  await p.evaluate(() => document.querySelector('#nowStar [data-now="story"]').click()); await p.waitForTimeout(900);
  r = await p.evaluate(() => ({ q: state.quest, g372: !!state.checks['g37:2'] })); ok('P1-3 Turned in on Mirror of Greed ticks its milestone step', r.g372 && r.q !== 'Mirror of Greed', r);
  await set(45, { pendSt: 0, pendCr: 0, stones: 0 }); cs = await cards();
  const si = cs.findIndex(c => /^Story:|Altgard story/.test(c)), ai = cs.findIndex(c => /Ascension Trial|Abyss Points/.test(c));
  ok('P1-4 Lv 45 advice ranked after the story (or cut)', si >= 0 && (ai < 0 || ai > si), cs);
  await set(45, { pendSt: 0, pendCr: 0, stones: 0 }, 'clean', 'basic'); cs = await cards();
  ok('P1-4 Basic: no advice cards', !cs.some(c => /Ascension Trial|Abyss Points/.test(c)), cs);
  /* P2-4 Later cards: one per skill, next level only */
  await set(30, { stones: 0 }); r = await p.evaluate(() => [...document.querySelectorAll('#nowStar .ns-card.later h3')].map(h => h.innerText));
  const names = r.filter(t => /^Buy /.test(t)).map(t => t.replace(/^Buy (.*) \d+ → \d+$/, '$1')); ok('P2-4 Later: no skill twice', new Set(names).size === names.length, r);
  /* P2-12 / P2-3 wording */
  r = await p.evaluate(() => ({ sp: document.getElementById('spLv').innerText, st: document.getElementById('stLvNote').innerText, hint: (document.querySelector('#spHero .sphint') || {}).innerText || '', bar: ((document.querySelector('#spHero .dvbar-l') || {}).innerText || '').replace(/\s+/g, ' ') }));
  ok('P2-12/P2-3 wording', /earned from levels/.test(r.sp) && /earned from levels/.test(r.st) && (!r.hint || /^(\+\d+ more your points cover|\d+ more unlocked · \d+ pts? left)$/.test(r.hint)) /* E4 #5 wording */ && (!r.bar || / of \d+ pts?$/.test(r.bar)), r);
  /* P2-8 / P2-7 */
  r = await p.evaluate(() => ({ disputed: CONF.find(c => c.g === 'Disputed').items.some(x => /Not verified/.test(x)), unv: (CONF.find(c => c.g === 'Unverified') || { items: [] }).items, rows: [...document.querySelectorAll('#srcBody .srcg > summary .src-site')].map(x => x.textContent) }));
  ok('P2-8 unverified item not under Disputed', !r.disputed && r.unv.length === 1, r);
  ok('P2-7 Sources: one row per site, Metabot first, sites not repeated', r.rows[0] === 'Metabot' && new Set(r.rows).size === r.rows.length, r.rows);
  /* P1-9 zones. A camp is the giver's place or a Kibelisk within 100 m of the giver; a nearest Kibelisk further away may
     lie across a zone border (Pain Unending: Basfelt Waterfall 309 m, Metabot), which is not a camp used as a zone. */
  r = await p.evaluate(() => { const by = {}; RQ.forEach(q => [q.m != null && q.m <= 100 ? q.kib : null, q.place].filter(Boolean).forEach(c => (by[c] = by[c] || new Set()).add(q.zone))); return { multi: Object.entries(by).filter(([, v]) => v.size > 1).map(([k, v]) => [k, [...v]]), camps: RQ.filter(q => ['Quai Campsite', 'Safe Haven'].includes(q.zone)).map(q => q.name) }; });
  ok('P1-9 zones: one zone per camp; no Quai Campsite / Safe Haven zones', !r.multi.length && !r.camps.length, r);
  ok('no page errors', !errs.length, errs);
  console.log(fail ? `E3 CHECKS FAILED (${fail})` : 'E3 CHECKS PASSED'); await b.close(); process.exit(fail ? 1 : 0); })();
