/* E2 functional checks. Usage: node tests/e2test.js <page URL> (reads the data through tests/support/v1view.js and dist/index.html).
   Expectations are computed here from the data files and QUESTS order, not from the page's own rqAvail. */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const FILE = process.argv[2], ROOT = path.resolve(__dirname, '..');
const { writeSave } = require('./support/save');
const J = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const V1 = require('./support/v1view'); /* the v1-shaped view of data/** (0.2 step 5b) */
const RQ = V1.rq, CH = V1.chains, S45 = V1.story45, CLAIMS = V1.claims, BUILD = V1.build;
const SRC = fs.readFileSync(require('./config').PAGE, 'utf8');
let fail = 0; const ok = (name, cond, detail) => { console.log((cond ? 'ok   ' : 'FAIL ') + name + (detail !== undefined && !cond ? '  · ' + JSON.stringify(detail).slice(0, 700) : '')); if (!cond) fail++; };
const PRE = {}, STORY = {}; CH.forEach(e => { if (e.kind === 'regional') (PRE[e.quest] = PRE[e.quest] || []).push(e.after); if (e.kind === 'story') STORY[e.quest] = e.after; });
const BATCH = Object.keys(STORY).filter(q => STORY[q] === 'Forgotten Commander');

async function setState(p, { L, q, mode = 'advanced', extra = {}, ticks = {} }) {
  await writeSave(p, await p.evaluate(({ L, q, mode, extra, ticks }) => {
    const st = { checks: {}, level: L, quest: q, mode, open: {}, seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, started: {}, stones: 2 * (L - 10), dvTotal: 4 * (L - 11) + 20, stShards: 3 };
    GATES.forEach(g => g.items.forEach(it => { if (g.lv < L && !it.sub && !it.dv && it.kind !== 'hideout' && it.kind !== 'quest' && it.k) st.checks[it.k] = true; }));
    SP_STEPS.forEach(x => { if (x.req <= L - 2) st.checks[x.k] = true; }); st.stones += 150; /* points spent as they open, extras included */
    st.checks['g22:0'] = true; st.stLv = { "Triniel's Dagger": 5 };
    Object.assign(st.checks, ticks); Object.assign(st, extra);
    return st;
  }, { L, q, mode, extra, ticks }));
  await p.reload(); await p.waitForTimeout(400);
}
/* Expected availability of a regional quest, from the data: unlock level, story at/after its story quest, regional prereqs turned in. */
const expect = (QUESTS, st) => { const idx = n => QUESTS.findIndex(x => x[1] === n), cur = st.quest ? idx(st.quest) : -1, done = n => !!st.checks['rq:' + RQ.find(r => r.name === n).id];
  /* E3 (P0-1): a quest with no prerequisite data at all opens at its recommended level. */
  const noPre = r => r.requiresStory == null && r.requiresRegional == null && !STORY[r.name] && !(PRE[r.name] || []).length;
  const out = {}; RQ.forEach(r => { const lvOk = st.level >= (noPre(r) ? Math.max(r.unlocksAt, r.rec) : r.unlocksAt), s = STORY[r.name], sOk = !s || (cur >= 0 && (cur > idx(s) || (cur === idx(s) && st.storyEnd === s))),   /* E9 (owner check 1, 2026-10-15): the story quest is turned in */ pre = (PRE[r.name] || []).filter(n => !done(n));
    out[r.name] = { open: lvOk && sOk, ok: lvOk && sOk && !pre.length, pre }; }); return out; };
const nextUp = p => p.evaluate(() => { const card = [...document.querySelectorAll('#nowStar .ns-card')].find(c => /Regional quests/.test((c.querySelector('h3') || {}).innerText || ''));
  if (!card) return { card: false, rows: [], sub: '' };
  return { card: true, sub: card.querySelector('.title > p').innerText, more: (card.querySelector('.qg.more') || {}).innerText || '',
    rows: [...card.querySelectorAll('.ql')].map(x => ({ name: (x.querySelector('a, span[title]') || {}).innerText, dis: x.querySelector('.q-cb').disabled, fu: x.classList.contains('fu'), k: x.querySelector('.q-cb').dataset.rqk })) }; });

(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 } }); const p = await ctx.newPage();
  const errs = [], reqs = new Set(); p.on('pageerror', e => errs.push(e.message)); p.on('request', r => { const u = r.url(); if (!/^(file|data|blob):/.test(u) && !u.startsWith(require('./config').BASE + '/')) reqs.add(u.split('?')[0]); /* same origin = local, like file:// */ });
  await p.goto(FILE); await p.waitForTimeout(300);
  const QUESTS = await p.evaluate(() => QUESTS);

  /* 1. Regional quests in Next up: only when unlock level + story + regional prerequisites are met (locked follow-ups only as "→" under a shown prerequisite) */
  const idOf = n => RQ.find(r => r.name === n).id;
  const scen = [
    { L: 22, q: 'Verdant Melody' }, { L: 22, q: 'Disturbed Balance' }, { L: 25, q: 'Voice of Rage', ticks: { ['rq:' + idOf('Blade of Vengeance')]: true } },
    { L: 27, q: 'Preparations for Restoration' }, { L: 27, q: 'A Collective Effort' }, { L: 30, q: 'Dying Light' }, { L: 30, q: "Canyon's Secret" },
    { L: 30, q: "Canyon's Secret", ticks: { ['rq:' + idOf('An Invitation to the Past: Part 1')]: true, ['rq:' + idOf('Hugo Mercenaries: Past and Present')]: true } },
    { L: 33, q: 'Scripture in the Ruins' }, { L: 37, q: 'Mirror of Greed' }, { L: 40, q: 'Symbol of Liberation' }, { L: 42, q: 'The Breaking of the Day' },
    { L: 44, q: 'Blood Barrier' }, { L: 45, q: 'Farewells' }, { L: 45, q: 'Forgotten Commander' }, { L: 45, q: '' },
  ];
  for (const sc of scen) for (const tickLow of [true, false]) {
    const ticks = { ...(sc.ticks || {}) };
    if (tickLow) RQ.forEach(r => { if (r.rec < Math.min(sc.L, 30) - 4) ticks['rq:' + r.id] = true; });   // a player who did the old ones
    await setState(p, { L: sc.L, q: sc.q, ticks });
    const st = await p.evaluate(() => state), exp = expect(QUESTS, st), nu = await nextUp(p);
    const label = `Lv ${sc.L} "${sc.q || '(no quest)'}"${tickLow ? ' (old ones done)' : ''}${sc.ticks ? ' +prereqs done' : ''}`;
    const bad = nu.rows.filter(r => { const e = exp[r.name]; if (!e) return true; if (!r.dis) return !e.ok; return !(e.open && e.pre.length && r.fu); });
    ok(`${label}: every Next up quest row is open in game (level, story, prerequisites)`, !bad.length, bad.map(r => [r.name, exp[r.name]]));
    const want = RQ.filter(r => exp[r.name].ok && !st.checks['rq:' + r.id]).map(r => r.name);
    const shown = nu.rows.filter(r => !r.dis).map(r => r.name), m = nu.sub.match(/(\d+) to pick up/), n = m ? +m[1] : 0;
    ok(`${label}: "to pick up" counts exactly the open quests (${want.length})`, n === want.length && shown.every(x => want.includes(x)) && (shown.length === Math.min(want.length, 6) || /more/.test(nu.more)), { n, want, shown, sub: nu.sub });
    const lockedShown = nu.rows.filter(r => r.dis);
    ok(`${label}: locked follow-ups only under their prerequisite`, lockedShown.every(r => r.fu), lockedShown);
    /* milestone rows: not-yet-open quests are dimmed and can't be snoozed */
    const ms = await p.evaluate(() => [...document.querySelectorAll('#gates li.qrow')].map(li => ({ k: li.querySelector('input[data-k]').dataset.k, locked: li.classList.contains('locked'), snzHidden: li.querySelector('.q-snz').hidden })));
    const msBad = ms.filter(x => { const r = RQ.find(q => 'rq:' + q.id === x.k), e = exp[r.name], done = !!st.checks[x.k]; return !done && (x.locked !== !e.ok || (x.locked && !x.snzHidden)); });
    ok(`${label}: milestone rows dim exactly the quests that aren't open`, !msBad.length, msBad.slice(0, 5));
  }
  /* 2. Lv 44–45 batch: only once "Forgotten Commander" is turned in (E9, owner check 1: a regional gate is "turned in"). Since 0.3 E10 the story
     goes on to "Daeva Trapped in a Nightmare"; a save with storyEnd = Forgotten Commander (an older end of data) moves on to it at load. */
  for (const [q, end, want] of [['Farewells', false, false], ["Zikel's Core", false, false], ['Forgotten Commander', false, false], ['Forgotten Commander', true, true], ['Daeva Trapped in a Nightmare', false, true]]) {
    await setState(p, { L: 45, q, extra: end ? { storyEnd: 'Forgotten Commander' } : {} });
    const all = await p.evaluate(names => { const ids = names.map(n => RQ_BY[n].id); return ids.map(id => rqAvail(RQ.find(r => r.id === id)).open); }, BATCH);
    const nu = await nextUp(p), inNu = nu.rows.filter(r => BATCH.includes(r.name)).length, m = nu.sub.match(/(\d+) to pick up/);
    ok(`batch (${BATCH.length} quests) with the story at "${q}"${end ? ' (turned in)' : ''}: ${want ? 'open' : 'hidden'}`, BATCH.length === 23 && all.every(x => x === want) && (want ? inNu > 0 && +m[1] >= 23 : inNu === 0), { inNu, sub: nu.sub });
  }
  /* 3. Rewards: strongholds credit nothing; Sealed Dungeons 2 + 2; regional quests 1 + 1 */
  await setState(p, { L: 30, q: 'Dying Light', extra: { pendSt: 0, pendCr: 0 } });
  const rw = await p.evaluate(() => ({ sh: AREA_ITEMS.filter(x => x.it.kind === 'stronghold').map(x => CLEAR_REWARD(x.k)), sd: [...new Set(AREA_ITEMS.filter(x => x.it.kind === 'hideout').map(x => JSON.stringify(CLEAR_REWARD(x.k))))], rq: [...new Set(RQ.map(q => JSON.stringify(CLEAR_REWARD('rq:' + q.id))))] }));
  ok('CLEAR_REWARD: every stronghold null, every Sealed Dungeon {2,2}, every regional quest {1,1}', rw.sh.every(x => x === null) && rw.sd.join() === '{"st":2,"cr":2}' && rw.rq.join() === '{"st":1,"cr":1}', rw);
  await p.selectOption('#areaSel', 'sh'); await p.waitForTimeout(200);
  const shk = await p.evaluate(() => document.querySelector('#areaList input[data-k^="sh:"]:not(:disabled)').dataset.k);   /* a stronghold the story already cleared (Graverobber Den, E9) shows a disabled tick */
  await p.click(`#areaList input[data-k="${shk}"]`); await p.waitForTimeout(150); await p.click(`#areaList input[data-k="${shk}"]`); await p.waitForTimeout(400);
  let r3 = await p.evaluate(k => ({ done: state.checks[k], st: state.pendSt || 0, cr: state.pendCr || 0, toast: (document.getElementById('rwToast') || {}).innerText || '' }), shk);
  ok('clearing a stronghold in Dungeons & Strongholds credits no stones or crystals', r3.done === true && r3.st === 0 && r3.cr === 0 && !/Wisdom|crystal/.test(r3.toast), r3);
  await p.evaluate(k => { const nb = [...document.querySelectorAll('#nowStar [data-now^="tick:"]')]; return nb.length; }, shk);
  const sdk = await p.evaluate(() => AREA_ITEMS.find(x => x.it.kind === 'hideout' && x.lv <= 30 && !state.checks[x.k]).k);
  await p.evaluate(k => { const t = document.createElement('input'); t.type = 'checkbox'; t.dataset.k = k; t.checked = true; document.querySelector('.layout').appendChild(t); t.dispatchEvent(new Event('change', { bubbles: true })); t.remove(); }, sdk); await p.waitForTimeout(200);
  r3 = await p.evaluate(() => ({ st: state.pendSt, cr: state.pendCr }));
  ok('clearing a Sealed Dungeon credits 2 + 2', r3.st === 2 && r3.cr === 2, r3);
  /* stronghold card in Next up: Kibelisk from data, belt scrolls, no stones/crystals */
  const shCard = await p.evaluate(() => { const c = [...document.querySelectorAll('#nowStar .ns-card')].find(c => /^Run /.test((c.querySelector('h3') || {}).innerText || '')); return c ? c.innerText + ' ' + c.querySelector('.ns-info').innerText : ''; });
  ok('stronghold Next up card: Kibelisk shown, belt scrolls, no stone/crystal credit', /Kibelisk/.test(shCard) && /Belt Enhance Scrolls/.test(shCard) && !/Wisdom|crystal/i.test(shCard), shCard);
  /* 4. No dungeon XP anywhere */
  const xp = [];
  for (const L of [15, 22, 25, 30, 35, 40, 45]) {
    await setState(p, { L, q: 'Dying Light' });
    const r = await p.evaluate(() => { document.querySelectorAll('details').forEach(d => d.open = true); return { sd: [...document.querySelectorAll('#nowStar .ns-card')].filter(c => /^Clear /.test((c.querySelector('h3') || {}).innerText || '')).map(c => c.innerHTML).join(''), areas: document.getElementById('areaList').innerHTML, loc: Object.values(AREA_LOC).filter(v => 'xp' in v).length }; });
    if (/XP/.test(r.sd) || /XP/.test(r.areas) || r.loc) xp.push(L);
  }
  ok('no dungeon XP in Next up dungeon cards, Dungeons & Strongholds or AREA_LOC (Lv 15–45)', !xp.length, xp);
  ok('page source has no dungeon XP text', !/XP \(exploration\)|xp": \d/.test(SRC.replace(/(?:const|var) RQ = \[[\s\S]*?\n\];/, '') /* esbuild prints top-level const as var */));
  /* 5. Story chain continuous to Daeva Trapped in a Nightmare (0.3 E10); end-of-data state */
  const sc5 = await p.evaluate(() => { const i0 = QUESTS.findIndex(x => x[1] === 'A New Lead'), tail = QUESTS.slice(i0);
    return { lvSorted: QUESTS.every((x, i) => !i || QUESTS[i - 1][0] <= x[0]), missingSteps: tail.filter(([, n]) => !QUEST_STEPS[n]).map(x => x[1]), last: QUESTS[QUESTS.length - 1], afterSoL: QUESTS[QUESTS.findIndex(x => x[1] === 'Symbol of Liberation') + 1], dup: QUESTS.length - new Set(QUESTS.map(x => x[1])).size, loc45: QUESTS.filter(x => x[0] > 40).every(([, n]) => QUEST_LOC[n] && QUEST_LOC[n].giverKib && (QUEST_LOC[n].turninKib || n === 'Blood Barrier') || n === 'Daeva Trapped in a Nightmare') }; });
  let chain = 'Daybreak Society', order = []; while (chain) { order.push(chain); chain = S45[chain].next; }
  const qNames = QUESTS.map(x => x[1]), i0 = qNames.indexOf('Symbol of Liberation');
  ok('story chain continuous: Symbol of Liberation → … → Daeva Trapped in a Nightmare matches the data\'s next links (Lv 41–45)', JSON.stringify(qNames.slice(i0 + 1)) === JSON.stringify(order) && sc5.last[1] === 'Daeva Trapped in a Nightmare' && sc5.last[0] === 45, { tail: qNames.slice(i0 + 1), order });
  ok('every story quest from "A New Lead" on has objectives; levels non-decreasing; no duplicates; Lv 41–45 Kibelisks', !sc5.missingSteps.length && sc5.lvSorted && !sc5.dup && sc5.loc45, sc5); /* Blood Barrier: Metabot gives no turn-in Kibelisk; Daeva Trapped: no giver on Metabot, the owner's lookup names the place only (C41) */
  await setState(p, { L: 40, q: 'Symbol of Liberation' });
  await p.evaluate(() => [...document.querySelectorAll('#nowStar [data-now="story"]')].pop().click()); await p.waitForTimeout(900);
  ok('"Turned in" on Symbol of Liberation moves to Daybreak Society', await p.evaluate(() => state.quest === 'Daybreak Society' && !state.storyEnd));
  await setState(p, { L: 40, q: 'Symbol of Liberation', extra: { storyEnd: 'Symbol of Liberation' } });
  ok('an E1 end-of-data save (storyEnd at Symbol of Liberation) moves on to Daybreak Society at load', await p.evaluate(() => state.quest === 'Daybreak Society' && !state.storyEnd));
  for (const mode of ['advanced', 'basic']) {
    await setState(p, { L: 45, q: 'Daeva Trapped in a Nightmare', mode });
    const before = await p.evaluate(() => document.getElementById('questStatus').innerText);
    await p.evaluate(() => [...document.querySelectorAll('#nowStar [data-now="story"]')].pop().click()); await p.waitForTimeout(900);
    const end = async () => p.evaluate(() => ({ end: state.storyEnd, q: state.quest, card: [...document.querySelectorAll('#nowStar .ns-card')].map(c => c.innerText).find(t => /Lv 45 story complete/.test(t)) || '', btn: !!document.querySelector('#nowStar [data-now="story"]'), status: document.getElementById('questStatus').innerText }));
    let e = await end();
    ok(`${mode}: last quest before turn-in says where it turns in`, /Last story quest in the guide · turns in to Nemon at Outskirts Stall/.test(before), before);
    ok(`${mode}: end state reads "Lv 45 story complete — next in game: …"; no dead Turned in`, e.end === 'Daeva Trapped in a Nightmare' && /Lv 45 story complete/.test(e.card) && /Next in game: "Waiting for the Next Journey" at Lv 46/.test(e.card) && !e.btn && /Lv 45 story complete — next in game: "Waiting for the Next Journey" at Lv 46/.test(e.status), e);
    await p.reload(); await p.waitForTimeout(400); e = await end();
    ok(`${mode}: end state survives a reload`, e.end === 'Daeva Trapped in a Nightmare' && /Lv 45 story complete/.test(e.card), e);
  }
  ok('old "40–45 not covered" text gone', !/aren't covered|not covered yet|End of the covered story/.test(SRC));
  /* 6. Ahead: no Ariel at any level; nowhere on the page */
  const ariel = [];
  for (let L = 25; L <= 45; L++) { await p.evaluate(L => { state.level = L; update(); }, L); if (/Ariel/.test(await p.innerText('#ahead'))) ariel.push(L); }
  ok('Ahead never mentions Ariel (Lv 25–45)', !ariel.length, ariel);
  ok('no "Ariel" anywhere in the page source', !/Ariel/.test(SRC));
  /* 7. Claims lint (claims.json; v1 edits frozen in tests/fixtures/claims-v1-edits.json): dropped / rewritten old text gone, new text in */
  const oldGone = [], newIn = [];
  const plain = s => s.replace(/\$\{T\("([^"]*)", "[^"]*"\)\}/g, '$1').replace(/\$\{I\("[^"]*"\)\}/g, '');
  const SRCP = plain(SRC);
  CLAIMS.forEach(c => { (c.edits || []).forEach(e => { if (e.old && !/^\(|keep/.test(e.old) && SRC.includes(e.old)) oldGone.push(c.id + ': ' + e.old);
      if (e.action === 'drop' && e.line) {} });
    if (c.action === 'rewrite' && c.newText && !/^C28|^C20|^C21/.test(c.id) && !SRC.includes(c.newText)) newIn.push(c.id); });
  /* Old wording V1 flagged (drop / rewrite) that has no exact "old" in claims.json, checked by phrase. */
  const PHRASES = { C02: 'gains one level every 3 character levels', C04: '~99%', C06: 'Reset close: run it at 1,000', C07: 'Potential Stones, Stigma Shards and Daevanion resources', C08: 'gear score 700', C09: ['worth far more at 45', 'banked Shugo Festival keys', 'Bank them', 'Leave the festival alone'],
    C10: 'Story dungeon around Lv 37', C11: 'pays rewards 7 times', C13: ['come from nowhere else', 'come only from Strongholds'], C15: ['Reroll toward', 'reroll a mission', 'gear parts'], C16: ['Inven', 'Unconfirmed (one source)', '380–6,000'],
    C18: '<b>Cash shop is cosmetic</b>', C19: ['Weekly Command scrolls', 'Reroll if rewards lack'], C20: ['"Accuracy"', '"Double Chance"', '["Accuracy", "Critical Damage Boost"]'], C21: ['Quick Use 2', 'delay 10 ms', '30–50 ms'],
    C22: ['Azphel points', 'arena and battlefield'], C23: ['9,280 Enhance Stones each', 'resets it to +0'], C24: '100% success).', C25: 'Safe Haven or Nornir Assembly', C01: ['free until Lv 31', 'Experiment freely until 31', 'respec is free until 31'],
    C28c: 'Skycoach). Leveling order', C28e: 'Metabot calls its reading an interpretation', C28h: 'exact unlock level for most regional quests' };
  Object.entries(PHRASES).forEach(([id, ps]) => [].concat(ps).forEach(x => { if (SRC.includes(x)) oldGone.push(id + ': ' + x); }));
  ok('claims lint: no dropped or replaced wording left (claims.json edits + V1 phrases)', !oldGone.length, oldGone);
  ok('claims lint: every rewrite\'s newText is in the page (C20 / C21 / C28 checked separately)', !newIn.length, newIn);
  { const t = CLAIMS.find(c => c.id === 'C20').newText; /* esbuild prints the top-level const as var */
    ok('C20: stat tiers are exactly V1\'s', SRC.includes(t) || SRC.includes(t.replace(/^const /, 'var '))); }
  ok('C21: macro step without "Quick Use 2", with the short-delay wording', SRC.includes('Step 1 = the right-click macro slot (the right-click stack). If ready skills get skipped, add a short delay.'));
  /* 8. Build data */
  const bd = await p.evaluate(() => ({ plan: STIGMA_PLAN, extra: SP_SKILLS.filter(s => s.extra).map(s => s.n), vz: DV_NODES().filter(n => n.board === 'Vaizel').map(n => n.k + '=' + n.t), tr: DV_NODES().filter(n => n.board === 'Triniel').map(n => n.k + '=' + n.t), flat: SP_STEPS.filter(x => x.s.n === 'Defense Break').map(x => x.req), msExtra: GATES.some(g => g.items.some(it => /^sp:(Assault Stance|Impact Hit|Flash Slice|Storm Rampage|Defense Break|Determination|Heightened Sixth Sense):/.test(it.k || ''))) }));
  ok('stigma plan TD / IC / Swift Contract / Savage Fang', bd.plan.join('|') === "Triniel's Dagger|Illusive Clone|Swift Contract|Savage Fang", bd.plan);
  ok('skills after the core eight in build.json order', bd.extra.join('|') === BUILD.spOrderAfterCore.order.join('|'), bd.extra);
  ok('Defense Break uses its flat Lv 21 gate; extra skills stay out of milestones', bd.flat.every(x => x === 21) && !bd.msExtra, bd);
  ok('Vaizel / Triniel nodes from build.json (keys dv:v:* / dv:t:*, corners named)', bd.vz.includes('dv:v:db=Defense Break') && bd.vz.includes('dv:v:corner=Critical Damage Boost corner') && bd.tr.includes('dv:t:corner=Multi-Hit Chance corner') && bd.vz.length === 6 && bd.tr.length === 6, bd);
  await setState(p, { L: 27, q: 'Preparations for Restoration', extra: { stLv: { "Triniel's Dagger": 9 }, stShards: 50 }, ticks: { 'g27:0': true } });
  const sp = await p.evaluate(() => stPlan().map(s => s.x.name + ' ' + s.L));
  ok('stigma upgrades: Triniel\'s Dagger to 10, then Illusive Clone toward 20', sp[0] === "Triniel's Dagger 10" && sp[1] === 'Illusive Clone 2' && sp[sp.length - 1] === 'Illusive Clone 20' && sp.length === 20, sp);
  /* 9. Sources card: every URL in the data files is listed; plain links (no nofollow) */
  const links = await p.evaluate(() => [...document.querySelectorAll('#srcBody a')].map(a => [a.href, a.rel]));
  const hrefs = new Set(links.map(x => x[0]));
  const dataUrls = V1.dataUrls;   /* every URL in the v2 data records and sources.json pages */
  const norm = u => { try { return new URL(u).href; } catch (e) { return u; } };
  const missing = [...dataUrls].filter(u => !hrefs.has(norm(u)) && !/^https?:\/\/metabot\.gg\/en\/aion-2\/quests\/daeva-trapped/.test(u));
  ok(`Sources card lists every URL in the data files (${dataUrls.size})`, !missing.length, missing);
  ok('Sources links: no nofollow / sponsored / ugc', links.every(([, r]) => !/nofollow|sponsored|ugc/.test(r)));
  /* 10. No new external requests (fonts only, as before) */
  ok('no external requests besides Google Fonts', [...reqs].every(u => /^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(u)), [...reqs]); /* stylesheet + the font files it names (only where the network allows) */
  ok('no page errors', !errs.length, errs);
  console.log(fail ? `E2 CHECKS FAILED (${fail})` : 'E2 CHECKS PASSED');
  await b.close(); process.exit(fail ? 1 : 0);
})();
