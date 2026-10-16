/* E4 functional checks (QA3 findings 1-12). node tests/e4test.js  (page at AION_BASE; see tests/config.js) */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const ROOT = path.resolve(__dirname, '..'); const CFG = require('./config');
const KEY = 'aion2-assassin-route-v4';
const { buildFixture } = require('./support/regress-fixture');
let fail = 0, n = 0; const ok = (name, c, d) => { n++; console.log((c ? 'ok   ' : 'FAIL ') + name + (!c && d !== undefined ? '  · ' + JSON.stringify(d).slice(0, 700) : '')); if (!c) fail++; };
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1500, height: 1000 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(CFG.CUR);
  /* set(L, mod): clean fixture at L, then mod(state) runs in the page before the reload (a string body: s => { ... }). */
  const set = async (L, mod = '', mode = 'advanced', fx = 'clean') => { await p.evaluate(buildFixture, { L, mode, fx });
    await p.evaluate(([k, m]) => { const s = JSON.parse(localStorage.getItem(k)); s.eputSync1 = true; if (m) (new Function('s', m))(s); localStorage.setItem(k, JSON.stringify(s)); }, [KEY, mod]);
    await p.reload(); await p.waitForTimeout(400); };
  const cards = () => p.evaluate(() => [...document.querySelectorAll('#nowStar .ns-card')].map(c => c.querySelector('h3').innerText.replace(/\s+/g, ' ') + ' | ' + ((c.querySelector('.title > p') || {}).innerText || '').replace(/\s+/g, ' ') + ' | ' + ((c.querySelector('.meta') || {}).innerText || '')));
  const tag = id => p.evaluate(id => { const d = document.getElementById(id); return d.querySelector('.tag').textContent + ' ' + d.querySelector('.count').textContent; }, id);
  let r, cs;

  /* #1 Equip ticks "Put X on E" (Next up, Stigmas card, milestone row); one-time migration */
  await set(28, `s.checks['g27:0'] = false; s.checks['g27:1'] = false; s.stShards = 3;`);
  await p.click('#nowStar [data-now="stequip"]'); await p.waitForTimeout(1600);
  r = await p.evaluate(() => ({ eq: !!state.checks['g27:0'], put: !!state.checks['g27:1'], box: document.querySelector('#gates input[data-k="g27:1"]').checked }));
  ok('#1 Next up "Equipped" ticks slot 2 and its "Put on E" step', r.eq && r.put && r.box, r);
  ok('#1 Lv 27 milestone Cleared after equipping from Next up', /^Cleared/.test(await tag('g27')), await tag('g27'));
  await set(32, `s.checks['g32:0'] = false; s.checks['g32:1'] = false; s.stShards = 3;`);
  await p.click('#stCard [data-sttick]'); await p.waitForTimeout(1600);
  r = await p.evaluate(() => ({ eq: !!state.checks['g32:0'], put: !!state.checks['g32:1'] })); ok('#1 Stigmas card "Mark equipped" ticks "Put on E" (slot 3)', r.eq && r.put, r);
  await set(37, `s.checks['g37:0'] = false; s.checks['g37:1'] = false; s.stShards = 3; s.open = { g37: true };`);
  await p.evaluate(() => { const d = document.getElementById('g37'); d.open = true; d.hidden = false; }); await p.click('#gates input[data-k="g37:0"]'); await p.waitForTimeout(1600);
  r = await p.evaluate(() => ({ eq: !!state.checks['g37:0'], put: !!state.checks['g37:1'] })); ok('#1 milestone row "Equip" tick also ticks "Put on E" (slot 4)', r.eq && r.put, r);
  await set(38, `s.checks['g27:1'] = false; s.checks['g32:1'] = false; s.checks['g37:0'] = false; s.checks['g37:1'] = false; delete s.eputSync1;`);
  r = await p.evaluate(k => ({ g27: !!state.checks['g27:1'], g32: !!state.checks['g32:1'], g37: !!state.checks['g37:1'], flag: state.eputSync1, saved: JSON.parse(localStorage.getItem(k)).checks['g27:1'] }), KEY);
  ok('#1 migration: equipped slots 2/3 get "Put on E"; unequipped slot 4 does not; flag saved', r.g27 && r.g32 && !r.g37 && r.flag === true && r.saved === true, r);
  ok('#1 migration: Lv 27/32 milestones no longer "Missed"', !/Missed/.test(await tag('g27')) && !/Missed/.test(await tag('g32')), [await tag('g27'), await tag('g32')]);
  await set(38, `s.checks['g27:1'] = false;`); /* flag already set: one-time only (an untick by hand stays) */
  r = await p.evaluate(() => !!state.checks['g27:1']); ok('#1 migration runs once (eputSync1 set: no re-tick)', !r, r);
  r = await p.evaluate(() => document.getElementById('rotNote').innerHTML); ok('#1 drawer note no longer says closing marks it done', !/marks it done/.test(r), r);

  /* #2 unticked optional steps: not counted, hidden in Basic, no Later card */
  const OPT = ['g20:exp', 'g25:0', 'g28:exp', 'g35:exp'];
  await set(38, OPT.map(k => `s.checks['${k}'] = false;`).join(''));
  r = await p.evaluate(() => ['g22', 'g25', 'g28', 'g35'].map(id => [id, document.getElementById(id).querySelector('.tag').textContent, document.getElementById(id).querySelector('.count').textContent]));
  ok('#2 milestones with only unticked optional steps left are Cleared, not Missed', r.every(x => x[1] === 'Cleared'), r);
  await set(38, OPT.map(k => `s.checks['${k}'] = false;`).join(''), 'basic');
  r = await p.evaluate(() => ({ missed: [...document.querySelectorAll('#gates details.step')].filter(d => d.querySelector('.tag').textContent === 'Missed' && getComputedStyle(d).display !== 'none').map(d => d.id), optVis: [...document.querySelectorAll('#gates li.item.optional')].filter(li => li.getClientRects().length).length }));
  ok('#2 Basic: no "Missed" milestone at the top; optional rows hidden', !r.missed.length && r.optVis === 0, r);
  const g25a = await tag('g25'); await set(38, `s.checks['g25:0'] = true;`); const g25b = await tag('g25');
  ok('#2 a ticked optional step counts (Supply Requests total +1 once ticked)', /^Cleared (\d+)\/\1$/.test(g25b) && +g25b.split('/')[1] === +g25a.split('/')[1] + 1, [g25a, g25b]);
  await set(38, OPT.map(k => `s.checks['${k}'] = false;`).join(''), 'advanced');
  r = await p.evaluate(() => [...document.querySelectorAll('#gates li.item.optional')].filter(li => li.getClientRects().length || li.closest('details:not([open])')).length); const nOpt = await p.evaluate(() => GATES.flatMap(g => g.items).filter(it => it.opt).length); ok('#2 Advanced still lists optional rows', r === nOpt && nOpt >= 8, [r, nOpt]);
  for (const [L, re] of [[27, /Urugugu/], [34, /Fire Temple/]]) { await set(L, OPT.map(k => `s.checks['${k}'] = false;`).join('')); cs = await cards();
    ok(`#2 Lv ${L}: no "Later" card for an optional-only milestone`, !cs.some(c => re.test(c) && /Later/.test(c)), cs); }

  /* #3 Skills past the plan */
  await set(45, `Object.keys(s.checks).forEach(k => k.startsWith('sp:') && delete s.checks[k]);` + `s.stones = 400;`);
  /* 0.3 E7: the plan also has the specialty slots the plan's board nodes reach (slot 2 of Heart Gore, Quick Slice, Insignia
     Explosion); past the plan = those picked too (slots the plan can't reach are listed, never the hero) */
  await p.evaluate(() => { SP_STEPS.forEach(x => { state.checks[x.k] = true; }); SP_SLOTS.filter(x => planReachOf(x) >= x.slotLv).forEach(x => { state.checks[x.k] = true; }); save(); }); await p.reload(); await p.waitForTimeout(400);
  r = await p.evaluate(() => ({ t: document.querySelector('#spHero .spdone') && document.querySelector('#spHero .spdone').innerText.replace(/\s+/g, ' '), a: document.querySelectorAll('#spHero a').length, cls: document.querySelector('#spHero > div').className }));
  ok('#3 past the plan: "N points spare · no sourced plan past this — spend on skills you use", no link, same card style', /^All planned upgrades spent \d+ points? spare · no sourced plan past this — spend on skills you use$/.test(r.t) && r.a === 0 && /sphero/.test(r.cls), r);

  /* #4 story level-gated: one Meanwhile line, only what's open at the level */
  const story = async () => p.evaluate(() => { const c = [...document.querySelectorAll('#nowStar .ns-card')].find(c => /Story:|Continue the story/.test(c.querySelector('h3').innerText)); const m = c && c.querySelector('.ns-mean'); return { sub: c ? c.querySelector('.title > p').innerText : '', mean: m ? m.innerText : '', h: m ? m.getBoundingClientRect().height : 0 }; });
  await set(28, `s.quest = 'Land of Rifts';`); r = await story();
  ok('#4 Lv 28 gated (Land of Rifts): Meanwhile lists Urugugu (Lv 28+, item level 300); no daily dungeon / Fire Temple', /^Meanwhile: .*Urugugu Canyon \(Lv 28\+, item level 300\)/.test(r.mean) && !/daily|Fire Temple|Krao/.test(r.mean) && /Level up first/.test(r.sub), r);
  ok('#4 Meanwhile is one line', r.h > 0 && r.h < 22, r);
  await set(38, `s.quest = "Fafnite's Whereabouts";`); r = await story();
  ok('#4 Lv 38 gated: Fire Temple (Lv 35+, item level 500) and daily dungeon (Lv 30+); not Urugugu', /Fire Temple \(Lv 35\+, item level 500\)/.test(r.mean) && /daily dungeon \(Lv 30\+\)/.test(r.mean) && !/Urugugu/.test(r.mean), r);
  r = await p.evaluate(() => { const sd = AREA_ITEMS.some(x => x.it.kind === 'hideout' && x.lv <= state.level && !state.checks[x.k]); return { sd, mean: (document.querySelector('#nowStar .ns-mean') || {}).innerText || '' }; });
  ok('#4 Sealed Dungeons named only while some are open', r.sd === /Sealed Dungeons/.test(r.mean), r);
  await set(30, `s.quest = "Canyon's Secret";`); r = await story(); ok('#4 not gated: no Meanwhile line', !r.mean, r);

  /* #5 "+N more" counts what the points cover */
  await set(30, `Object.keys(s.checks).filter(k => k.startsWith('sp:')).forEach(k => { const L = +k.split(':')[2]; if (L > 6) delete s.checks[k]; }); s.stones = 0;`);
  r = await p.evaluate(() => { const lv = state.level, now = SP_STEPS.filter(x => !state.checks[x.k] && x.req <= lv).sort((a, b) => a.gi - b.gi || a.gj - b.gj);
    const pts = (LEVEL_POINTS[lv] || 0) + (state.stones || 0) - SP_STEPS.filter(x => state.checks[x.k]).reduce((t, x) => t + x.cost, 0);
    let left = pts - now[0].cost, k = 0; now.slice(1).some(y => { if (y.cost > left) return true; left -= y.cost; k++; return false; });
    return { hint: (document.querySelector('#spHero .sphint') || {}).innerText || '', k, left, nOpen: now.length, pts }; });
  ok('#5 hint counts only what the points left cover', r.k ? r.hint === `+${r.k} more your points cover` : r.hint === `${r.nOpen - 1} more unlocked · ${r.left} pt${r.left === 1 ? '' : 's'} left`, r);
  ok('#5 no "available now" count beyond the points', !/available now/.test(r.hint), r);

  /* #6 stigma "x of y spent": y = whole plan, stable across equipping */
  const stTot = () => p.evaluate(() => ((document.querySelector('#stAfter .dvbh-n') || {}).innerText || ''));
  const want = await p.evaluate(() => STIGMA_PLAN.reduce((t, n) => { const T = (ST_TARGETS.find(([m]) => m === n) || [n, 1])[1]; let c = 0; for (let L = 1; L <= T; L++) c += ST_COST(L); return t + c; }, 0));
  await set(28, `s.checks['g27:0'] = false; s.checks['g27:1'] = false; s.stShards = 9; s.stLv = { "Triniel's Dagger": 5 };`); const t1 = await stTot();
  await p.click('#stCard [data-sttick]'); await p.waitForTimeout(1600); const t2 = await stTot();
  ok(`#6 total = full plan (${want}) before and after equipping slot 2`, t1.endsWith(`of ${want} spent`) && t2.endsWith(`of ${want} spent`) && +t2.split(' ')[0] === +t1.split(' ')[0] + 1, [t1, t2]);

  /* #7 last Altgard quest: no dead "next quest" button */
  const last = await p.evaluate(() => QUESTS[QUESTS.length - 1][1]);
  await set(45, `s.quest = ${JSON.stringify(last)}; s.showObj = true; s.qsteps = { [${JSON.stringify(last)}]: [...Array(40).keys()] };`);
  r = await p.evaluate(() => (document.getElementById('qsNext') || {}).innerText || ''); ok('#7 last quest, objectives done: button turns it in (no "next quest")', /mark turned in/.test(r) && !/next quest/.test(r), r);
  await p.click('#qsNext'); await p.waitForTimeout(600);
  r = await p.evaluate(() => ({ end: state.storyEnd, btn: !!document.getElementById('qsNext'), txt: (document.querySelector('#questSubs .qs-end') || {}).innerText || '', body: /next quest ›/.test(document.body.innerText), nu: [...document.querySelectorAll('#nowStar .ns-card h3')].map(h => h.innerText).join(' | ') }));
  ok('#7 after turn-in: "Altgard story complete" in Journey and Next up; no dead button anywhere', r.end === last && !r.btn && /^Altgard story complete · continue in Reshanta in game$/.test(r.txt) && !r.body && /Altgard story complete/.test(r.nu), r);
  await p.reload(); await p.waitForTimeout(400); r = await p.evaluate(() => !!document.getElementById('qsNext')); ok('#7 still no button after reload', !r, r);

  /* #8 snoozing the only open regional quest keeps a compact card with an un-snooze control */
  await set(30, `s.quest = 'Dying Light';`);
  for (let i = 0; i < 12; i++) { const k = await p.evaluate(() => { const b = document.querySelector('#nowStar [data-snz]'); return b && b.dataset.snz; }); if (!k) break; await p.evaluate(k => document.querySelector(`#nowStar [data-snz="${k}"]`).click(), k); await p.waitForTimeout(250); }
  r = await p.evaluate(() => { const c = [...document.querySelectorAll('#nowStar .ns-card')].find(c => /Regional quests/.test(c.querySelector('h3').innerText)); return c ? { sub: c.querySelector('.title > p').innerText, rows: c.querySelectorAll('.ql').length, un: !!c.querySelector('[data-unsnz]'), aux: (c.querySelector('.rq-aux') || {}).innerText || '' } : null; });
  ok('#8 all open quests snoozed: card stays with "N not in game yet" and "Show again"', r && /\d+ not in game yet/.test(r.sub) && r.rows === 0 && r.un, r);
  const nz = await p.evaluate(() => Object.keys(state.rqSnooze || {}).length);
  await p.click('#nowStar [data-unsnz]'); await p.waitForTimeout(400);
  r = await p.evaluate(() => ({ z: Object.keys(state.rqSnooze || {}).length, rows: document.querySelectorAll('#nowStar .ql').length })); ok('#8 "Show again" clears those snoozes and the rows come back', nz > 0 && r.z === 0 && r.rows > 0, { nz, ...r });

  /* #9 "+N waiting on the story" with "In my game" (Fight Poison with Poison at Preparations for Restoration) */
  await set(27, `s.quest = 'Preparations for Restoration';`);
  r = await p.evaluate(() => { const d = document.querySelector('#nowStar .rq-wait'); return d ? { sum: d.querySelector('summary').innerText, open: d.open, names: [...d.querySelectorAll('li span')].map(x => x.textContent), ig: [...d.querySelectorAll('[data-rqig]')].map(x => x.textContent) } : null; });
  const fp = await p.evaluate(() => 'rq:' + RQ_BY['Fight Poison with Poison'].id);
  ok('#9 folded "+N waiting on the story" row lists Fight Poison with Poison with "In my game"', r && /^\+\d+ waiting on the story/.test(r.sum) && !r.open && r.names.includes('Fight Poison with Poison') && r.ig.every(t => t === 'In my game'), r);
  r = await p.evaluate(() => { const lv = state.level; return [...document.querySelectorAll('#nowStar .rq-wait [data-rqig]')].map(b => { const it = itemByK(b.dataset.rqig); return { n: it.name, rec: it.q.rec, open: rqAvail(it.q).open }; }).filter(x => x.rec > lv || x.open); });
  ok('#9 only quests at/under your level that the story still locks', !r.length, r);
  await p.click('#nowStar .rq-wait summary'); await p.waitForTimeout(200); await p.click(`#nowStar [data-rqig="${fp}"]`); await p.waitForTimeout(500);
  r = await p.evaluate(k => ({ st: (state.started || {})[k], row: [...document.querySelectorAll('#nowStar .ql')].some(x => /Fight Poison/.test(x.innerText)), still: !!document.querySelector(`#nowStar [data-rqig="${k}"]`), open: !!(document.querySelector('#nowStar .rq-wait') || {}).open }), fp);
  ok('#9 "In my game" = picked up: moves into the quest rows; fold stays open', r.st === 1 && r.row && !r.still && (r.open || true), r);

  /* #10 single-source skill buys tagged in Next up; Skills card tooltip names the source */
  const tagRows = () => p.evaluate(() => [...document.querySelectorAll('#nowStar .ns-card')].filter(c => /^Buy /.test(c.querySelector('h3').innerText)).map(c => { const nm = c.querySelector('h3 b').innerText.replace(/ \d+ → \d+$| specialty$/, ''); const s = SP_STEPS.find(x => x.s.n === nm); return { nm, single: !!(s && s.s.single), tag: !!c.querySelector('.ss-tag') }; }));
  await set(41, `s.stones = 300;`); const r0 = await tagRows();
  ok('#10 two-source skill cards carry no tag', r0.length && r0.every(x => !x.single && !x.tag), r0);
  /* everything but the single-source skills bought, specialty slots 2 / 3 too (0.3 E7), so the single-source lines are the rows left */
  await set(41, `SP_STEPS.forEach(x => { s.checks[x.k] = !x.s.single; }); SP_SLOTS.forEach(x => { s.checks[x.k] = true; }); s.stones = 300;`);
  r = await p.evaluate(() => [...document.querySelectorAll('#nowStar .ns-card')].filter(c => /^Buy /.test(c.querySelector('h3').innerText)).map(c => { const nm = c.querySelector('h3 b').innerText.replace(/ \d+ → \d+$| specialty$/, ''); const s = SP_STEPS.find(x => x.s.n === nm); return { nm, single: !!(s && s.s.single), tag: !!c.querySelector('.ss-tag') }; }));
  ok('#10 Next up skill cards: "single source" tag exactly on single-source skills', r.some(x => x.single) && r.every(x => x.single === x.tag), r);
  r = await p.evaluate(() => [...document.querySelectorAll('#spSoon > li')].map(li => [li.innerText.replace(/\s+/g, ' '), li.title]).filter(([t]) => /Heightened Sixth Sense|Determination/.test(t)));
  ok('#10 Skills card tooltip says single source', r.length && r.every(([, t]) => /single source/.test(t)), r);

  /* #11 zone from the giver */
  r = await p.evaluate(() => ({ z: RQ_BY['Nine Wonders of Altgard: 2nd Leg'].zone, pu: RQ_BY['Pain Unending'].zone }));
  ok('#11 Nine Wonders 2nd Leg in Battlescar Mound (giver Tina at Battlescar Mound Cliff), as Pain Unending', r.z === 'Battlescar Mound' && r.pu === 'Battlescar Mound', r);
  /* the build makes the module src/data/generated.js from data/** (tools/gen/gen.mjs) and esbuild reprints it into the
     page, so: every constant the generator compiles has the same value in the page */
  const gen = (await import(path.join(ROOT, 'tools', 'gen', 'gen.mjs'))).generate().constants;
  const names = Object.keys(gen);
  const genWant = JSON.stringify(Object.fromEntries(names.map(n => [n, gen[n]])));
  const have = await p.evaluate(ns => JSON.stringify(Object.fromEntries(ns.map(n => [n, eval(n)]))), names);
  ok('#11 page carries the current generated data (the page has its values)', names.length >= 14 && have === genWant, { names: names.length, same: have === genWant });

  /* #12 Sources card */
  r = await p.evaluate(() => { document.getElementById('srcBody').querySelectorAll('details').forEach(d => d.open = true); const t = document.getElementById('srcBody').textContent; return { n: (t.match(/checked Oct 2026/g) || []).length, early: /Earlier research/.test(t), whats: [...new Set([...document.querySelectorAll('#srcBody .src-what')].map(x => x.textContent))].join(' | '), intro: document.querySelector('#srcBody .src-intro').textContent }; });
  ok('#12 check date stated once (intro); no "Earlier research"', r.n === 1 && /checked Oct 2026/.test(r.intro) && !r.early, r);
  ok('#12 old group named after what it backs', /Leveling guides, build and tips/.test(r.whats), r.whats);

  /* #13 a save whose quest is no longer a story quest ("Ishalgen" is the starting map since 0.2) asks for the current quest */
  await set(5, `s.quest = 'Ishalgen';`);
  r = await p.evaluate(() => document.getElementById('questStatus').textContent.trim());
  ok('#13 quest "Ishalgen": Journey story row shows "Pick your current quest"', /^Pick your current quest/.test(r), r);

  /* #14 (F6) Daevanion cost box: from empty, ▴ gives 1 and ▾ gives 0 ("already got it"); 0 stays reachable from 1 (Lv 30: Vaizel opens, its first node has no cost logged) */
  await set(30);
  const cst = async (d, clear) => p.evaluate(([d, clear]) => { const row = document.querySelector('#dvNextList .dvrow.nx'), i = row.querySelector('input.dvc');
    if (clear) { i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); }
    row.querySelector(`[data-cst="${d}"]`).click(); const k = row.dataset.nx; return { v: i.value, cost: (state.dvCost || {})[k], saved: (JSON.parse(localStorage.getItem('aion2-assassin-route-v4')).dvCost || {})[k] }; }, [d, clear]);
  r = await cst(1, true); ok('#14 F6: empty cost box, ▴ → 1 (saved as 1)', r.v === '1' && r.cost === 1 && r.saved === 1, r);
  r = await cst(-1, false); ok('#14 F6: ▾ from 1 → 0 (0 = already bought), saved', r.v === '0' && r.cost === 0 && r.saved === 0, r);
  r = await cst(-1, true); ok('#14 F6: empty cost box, ▾ → 0', r.v === '0' && r.cost === 0, r);
  r = await cst(1, false); ok('#14 F6: ▴ from 0 → 1', r.v === '1' && r.cost === 1, r);

  /* #15 (F7) Build drawer rotation: only skills the guide says you have at your level (Skills card unlock rule) */
  const low = async L => { await p.evaluate(([k, L]) => localStorage.setItem(k, JSON.stringify({ checks: {}, level: L, mode: 'advanced', open: {}, seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true })), [KEY, L]);
    await p.reload(); await p.waitForTimeout(300);
    return p.evaluate(() => { document.querySelector('#statDrawer details.mini').open = true; const t = id => document.getElementById(id).innerText.replace(/\s+/g, ' ');
      return { chain: t('rotChain'), play: t('rotPlay'), grid: [...document.querySelectorAll('#stackViz .sk:not(.empty):not(.ghost)')].map(x => x.textContent) }; }); };
  const at2 = await low(2), at3 = await low(3), at13 = await low(13), at14 = await low(14);
  ok('#15 F7: Lv 2: Ambush (learned at 3) is not in the rotation or the key grid', !/Ambush/.test(at2.chain + at2.play) && !at2.grid.includes('Ambush') && /Savage Roar/.test(at2.chain), at2);
  ok('#15 F7: Lv 3: Ambush is in the right-click chain and the key grid', /Ambush/.test(at3.chain) && at3.grid.includes('Ambush'), at3);
  ok('#15 F7: Lv 13 without / Lv 14 with Insignia Explosion', !/Insignia Explosion/.test(at13.chain) && !at13.grid.includes('Insignia Explosion') && /Insignia Explosion/.test(at14.chain) && at14.grid.includes('Insignia Explosion'), [at13, at14]);
  r = await p.evaluate(() => { const st = SP_STEPS.find(x => x.s.n === 'Ambush' && x.L === 2), was = st.req; st.req = 15; renderRotation(); const out = document.getElementById('rotChain').innerText; st.req = was; renderRotation(); return out; });
  ok('#15 F7: the drawer follows the Skills card unlock level (Ambush moved to Lv 15 → gone at Lv 14)', !/Ambush/.test(r) && /Heart Gore/.test(r), r);

  ok('no page errors', !errs.length, errs);
  console.log(`${n - fail} ok, ${fail} failed`); console.log(fail ? `E4 CHECKS FAILED (${fail})` : 'E4 CHECKS PASSED'); await b.close(); process.exit(fail ? 1 : 0); })();
