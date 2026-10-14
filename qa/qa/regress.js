/* QA2 regression matrix (PLAN.md "QA", adapted to E1/E2).
   Usage (from the scratchpad root):
     bash polish/qa/map.sh assassin-route.html qa-cur.html && bash polish/qa/map.sh backup-v285-before-polish.html qa-v285.html
     NODE_PATH=$(npm root -g) node polish/qa/regress.js [--quick] [--noshots]
   Writes polish/qa/results.json ([{level, mode, width, fixture, check, pass, detail, soft?}]) and polish/qa/shots/*.png.
   "soft" checks are product/UX findings (reported, not part of the hard acceptance count). */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..'), QA = __dirname, SHOTS = path.join(QA, 'shots');
const CUR = path.join(ROOT, 'qa-cur.html'), V285 = path.join(ROOT, 'qa-v285.html'), KEY = 'aion2-assassin-route-v4';
const QUICK = process.argv.includes('--quick'), NOSHOTS = process.argv.includes('--noshots');
const J = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const SRC = fs.readFileSync(path.join(ROOT, 'assassin-route.html'), 'utf8');
const RQD = J('data/rq.json'), CH = J('data/rq-chains.json');
fs.mkdirSync(SHOTS, { recursive: true });
const results = []; let hardFail = 0, softFail = 0;
const rec = (ctx, check, pass, detail, soft) => { results.push({ ...ctx, check, pass: !!pass, ...(soft ? { soft: true } : {}), ...(detail !== undefined && !pass ? { detail } : (detail !== undefined && soft === 'info' ? { detail } : {})) }); if (!pass) soft ? softFail++ : hardFail++; };

const LEVELS = QUICK ? [25, 27, 30, 32, 37, 40, 44, 45] : Array.from({ length: 21 }, (_, i) => 25 + i);
const MODES = ['advanced', 'basic'], WIDTHS = [1500, 1100, 390], FIXTURES = ['clean', 'messy'];

/* ---------- fixtures (built in the page from its own GATES / RQ / AREA_ITEMS / SP_STEPS) ---------- */
function buildFixture({ L, mode, fx }) {
  const st = { checks: {}, level: L, mode, open: {}, seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, started: {}, areaRun: {}, hideCards: true };
  const qAt = QUESTS.filter(q => q[0] <= L), qAbove = QUESTS.find(q => q[0] > L);
  st.quest = fx === 'messy' && qAbove ? qAbove[1] : qAt[qAt.length - 1][1];
  let n = 0;
  GATES.forEach(g => g.items.forEach(it => { if (!it.k || it.sub || it.hidden) return;
    if (it.kind === 'quest') return;
    if (it.dv) { if (it.blv < L) st.checks[it.k] = true; return; }
    if (g.lv < L) { n++; if (fx === 'clean' || n % 4) st.checks[it.k] = true; } }));
  RQ.forEach((q, i) => { const k = 'rq:' + q.id; if (q.rec < L - (fx === 'messy' ? 3 : 0) && !(fx === 'messy' && i % 7 === 3)) st.checks[k] = true; });
  AREA_ITEMS.forEach(x => { if (x.it.kind === 'hideout' ? x.lv < L : (x.it.hi || 45) < L) st.checks[x.k] = true; });
  SP_STEPS.forEach(x => { if (x.req <= L - 2 && !(x.s && x.s.extra)) st.checks[x.k] = true; });
  st.stones = 2 * (L - 10); st.stShards = fx === 'messy' ? 7 : 3; st.stLv = { "Triniel's Dagger": fx === 'messy' ? 6 : 5 };
  st.checks['g22:0'] = true;
  st.dvCost = {}; DV_NODES().forEach(it => { if (st.checks[it.k]) st.dvCost[it.k] = 5; }); st.dvTotal = Object.keys(st.dvCost).length * 5 + 4;
  if (fx === 'messy') {
    st.pendSt = 3; st.pendCr = 2;
    const sd = AREA_ITEMS.find(x => x.it.kind === 'hideout' && x.lv <= L && !st.checks[x.k]); if (sd) st.areaRun[sd.k] = Date.now() - 6e5;
    const open = RQ.filter(q => !st.checks['rq:' + q.id] && q.unlocksAt <= L && !q.after.length);
    open.slice(0, 2).forEach(q => { st.started['rq:' + q.id] = 1; });
    const sz = open[2]; if (sz) st.rqSnooze = { ['rq:' + sz.id]: L };
  }
  localStorage.setItem('aion2-assassin-route-v4', JSON.stringify(st));
}

/* ---------- per-state probe (runs in the page) ---------- */
function probe() {
  const vis = e => !!e && !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
  const txt = e => e ? e.innerText.replace(/\s+/g, ' ').trim() : '';
  const cards = [...document.querySelectorAll('#nowStar .ns-card')].map(c => { const h = c.querySelector('h3'), hc = h ? h.cloneNode(true) : null; if (hc) hc.querySelectorAll('button').forEach(b => b.remove());
    const btn = c.querySelector('.meta [data-now]');
    return { title: hc ? hc.innerText.replace(/\s+/g, ' ').trim() : '', sub: txt(c.querySelector('.title > p')), act: btn ? btn.dataset.now : null, later: c.classList.contains('later'), tag: txt(c.querySelector('.meta .tag')) }; });
  /* regional quests: independent availability (unlock level, story at/after, prereqs turned in) */
  const sIdx = n => QUESTS.findIndex(q => q[1] === n), cur = state.quest ? sIdx(state.quest) : -1;
  const done = q => !!state.checks['rq:' + q.id], run = q => !done(q) && !!(state.started || {})['rq:' + q.id];
  const av = q => { const lvOk = state.level >= q.unlocksAt, sOk = !q.story || (cur >= 0 && cur >= sIdx(q.story)), pre = q.after.filter(n => !done(RQ_BY[n])); return { open: lvOk && sOk, ok: lvOk && sOk && !pre.length, pre }; };
  const rqCard = [...document.querySelectorAll('#nowStar .ns-card')].find(c => /Regional quests/.test(txt(c.querySelector('h3'))));
  const nuRows = rqCard ? [...rqCard.querySelectorAll('.ql')].map(x => { const a = x.querySelector('a, span[title]'), cb = x.querySelector('.q-cb'); return { name: a.innerText, title: a.title, dis: cb.disabled, fu: x.classList.contains('fu'), k: cb.dataset.rqk, rec: (x.querySelector('.q-rec') || {}).innerText || '' }; }) : [];
  const msRows = [...document.querySelectorAll('#gates li.qrow')].map(li => { const i = li.querySelector('input[data-k]'), q = RQ.find(r => 'rq:' + r.id === i.dataset.k); return { k: i.dataset.k, name: q.name, loc: (li.querySelector('.loc') || {}).textContent || '', locked: li.classList.contains('locked') }; });
  const rqInfo = { sub: rqCard ? txt(rqCard.querySelector('.title > p')) : '', rows: nuRows.map(r => { const q = RQ_BY[r.name]; return { ...r, zone: q && q.zone, av: q ? av(q) : null, done: q ? done(q) : null, run: q ? run(q) : null, snz: !!(state.rqSnooze || {})[r.k], recN: q && q.rec }; }) };
  const ellipsis = [...document.querySelectorAll('#nowStar *, #spCard *, #dvBox *, #stCard *, #ahead *, #questStatus')].filter(e => vis(e) && e.children.length === 0 && getComputedStyle(e).textOverflow === 'ellipsis' && e.scrollWidth > e.clientWidth + 1).map(e => e.innerText.slice(0, 60));
  /* is the top card's primary control clickable (not covered, e.g. by the Build tab at 390 px)? */
  let covered = null; const pb = document.querySelector('#nowStar .ns-card.first .meta button');
  if (pb) { pb.scrollIntoView({ block: 'center' }); const r = pb.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); covered = hit && !pb.contains(hit) && hit !== pb ? (hit.className || hit.tagName) : null; }
  const body = document.body.innerText;
  return { cards, rqInfo, msRows, ellipsis, covered,
    sp: txt(document.getElementById('spHero')), spVis: vis(document.getElementById('spHero')), dv: txt(document.getElementById('dvNextList')), dvVis: vis(document.getElementById('dvNextList')), st: txt(document.getElementById('stBody')), stVis: vis(document.getElementById('stBody')),
    ahead: txt(document.getElementById('ahead')), lvlUpDisabled: document.getElementById('lvlUpBig').disabled, sw: document.documentElement.scrollWidth, iw: window.innerWidth,
    story: txt(document.getElementById('questStatus')), bad: (body.match(/\b(undefined|NaN)\b|\[object \w+\]/g) || []), ariel: /Ariel/.test(body),
    sdCards: cards.filter(c => /^Clear /.test(c.title)).map(c => c.sub + ' ' + c.title), areaXP: /\bXP\b/.test(document.getElementById('areaList').innerText),
    level: state.level, quest: state.quest, storyEnd: state.storyEnd || null };
}

const setState = async (p, args) => { await p.evaluate(buildFixture, args); await p.reload(); await p.waitForTimeout(350); };

(async () => {
  const b = await chromium.launch(); const t0 = Date.now();
  /* ---------- static data checks ---------- */
  {
    const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 } }), p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + CUR); await p.waitForTimeout(300);
    const s = await p.evaluate(() => ({ badAfter: RQ.flatMap(q => q.after.filter(n => !RQ_BY[n]).map(n => q.name + ' → ' + n)), badStory: RQ.filter(q => q.story && QUESTS.findIndex(x => x[1] === q.story) < 0).map(q => q.name + ' → ' + q.story),
      last: QUESTS[QUESTS.length - 1], shRw: AREA_ITEMS.filter(x => x.it.kind === 'stronghold').map(x => CLEAR_REWARD(x.k)), sdRw: [...new Set(AREA_ITEMS.filter(x => x.it.kind === 'hideout').map(x => JSON.stringify(CLEAR_REWARD(x.k))))],
      xpLoc: Object.values(AREA_LOC).filter(v => 'xp' in v).length, noPre: RQ.filter(q => !q.story && !q.after.length && q.unlocksAt <= 10).map(q => q.name + ' (rec ' + q.rec + ')'),
      zones: [...new Set(RQ.map(q => q.zone))], places: [...new Set(RQ.map(q => q.place).filter(Boolean))], nLinks: document.querySelectorAll('#srcBody a').length, nGroups: document.querySelectorAll('#srcBody details, #srcBody .srcg').length,
      lvSorted: QUESTS.every((x, i) => !i || QUESTS[i - 1][0] <= x[0]) }));
    const c0 = { level: null, mode: null, width: 1500, fixture: 'static' };
    rec(c0, 'every regional chain lock names an existing quest', !s.badAfter.length, s.badAfter);
    rec(c0, 'every story gate names an existing story quest', !s.badStory.length, s.badStory);
    rec(c0, 'story data ends at Forgotten Commander (Lv 45), levels non-decreasing', s.last[1] === 'Forgotten Commander' && s.last[0] === 45 && s.lvSorted, s.last);
    rec(c0, 'strongholds credit nothing; Sealed Dungeons 2+2', s.shRw.every(x => x === null) && s.sdRw.join() === '{"st":2,"cr":2}', { sh: s.shRw.slice(0, 3), sd: s.sdRw });
    rec(c0, 'no dungeon XP in AREA_LOC', !s.xpLoc, s.xpLoc);
    rec(c0, 'no "Ariel" in the page source', !/Ariel/.test(SRC));
    rec(c0, 'no "Quick Use 2" / "not covered" leftovers in source', !/Quick Use 2|aren't covered|not covered yet/.test(SRC));
    const zoneNames = new Set(RQD.map(r => r.zone)); /* zones that are also used as a camp/place elsewhere = a camp used as a zone */
    const campAsZone = s.zones.filter(z => s.places.includes(z));
    rec(c0, 'regional quest zones are not camp names (zone vs place)', !campAsZone.length && !s.zones.includes('Quai Campsite'), { campAsZone, quai: s.zones.includes('Quai Campsite') }, true);
    rec(c0, 'regional quests with no prerequisite data (open from Lv 10 regardless of rec)', !s.noPre.filter(x => +x.match(/rec (\d+)/)[1] > 20).length, s.noPre, true);
    rec(c0, 'Sources card link count is scannable (<= 60 links)', s.nLinks <= 60, { links: s.nLinks, groups: s.nGroups }, true);
    rec(c0, 'static: no page errors', !errs.length, errs);
    await ctx.close();
  }

  /* ---------- the matrix ---------- */
  for (const width of WIDTHS) {
    const ctx = await b.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 }, /* no isMobile: the file has no viewport meta (the artifact wrapper adds width=device-width), so a plain 390 px viewport is the faithful test */ });
    const p = await ctx.newPage(); let errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + CUR); await p.waitForTimeout(300);
    for (const fx of FIXTURES) for (const mode of MODES) for (const L of LEVELS) {
      const c = { level: L, mode, width, fixture: fx }; errs = [];
      await setState(p, { L, mode, fx });
      const r = await p.evaluate(probe);
      rec(c, 'no pageerror', !errs.length, errs);
      const acts = r.cards.map(x => x.act).filter(Boolean), dup = acts.filter((a, i) => acts.indexOf(a) !== i);
      rec(c, 'no two Next up cards with the same action / tick key', !dup.length, dup);
      const titles = r.cards.map(x => x.title);
      rec(c, 'no Next up card title ends in ":" or "."', !titles.some(t => /[:.]$/.test(t)), titles.filter(t => /[:.]$/.test(t)));
      rec(c, 'Next up has at least one card', r.cards.length > 0);
      rec(c, 'Skills card not empty', r.spVis && r.sp.length > 3, r.sp);
      rec(c, 'Daevanion card not empty', r.dvVis && r.dv.length > 3, r.dv);
      rec(c, 'Stigmas card not empty', r.stVis && r.st.length > 3, r.st);
      const storyCard = r.cards.find(x => /^(Story:|Continue the story|Altgard story complete|Set your current main quest)/.test(x.title));
      rec(c, 'a story card exists', !!storyCard, titles);
      if (L === 45) { rec(c, 'Lv 45: Ahead shows the level cap', /Level cap reached/.test(r.ahead), r.ahead); rec(c, 'Lv 45: Level up disabled', r.lvlUpDisabled); }
      rec(c, 'no horizontal scroll (scrollWidth == innerWidth)', r.sw <= r.iw, { sw: r.sw, iw: r.iw });
      rec(c, 'no undefined / NaN / [object] in visible text', !r.bad.length, r.bad);
      rec(c, 'no Ariel on the page', !r.ariel);
      rec(c, 'no dungeon XP in Next up dungeon cards or Dungeons & Strongholds', !r.sdCards.some(x => /\bXP\b/.test(x)) && !r.areaXP, r.sdCards);
      /* regional quests */
      const rows = r.rqInfo.rows;
      const badOpen = rows.filter(x => !x.dis && !x.run && !(x.av && x.av.ok && !x.snz));
      rec(c, 'Next up regional rows: open in game (level + story + prereqs) or in progress; snoozed hidden', !badOpen.length, badOpen.map(x => [x.name, x.av, x.snz]));
      const badLock = rows.filter(x => x.dis && !(x.fu && x.av && x.av.open && x.av.pre.length));
      rec(c, 'locked follow-ups only as "→" under a prerequisite', !badLock.length, badLock.map(x => x.name));
      const zbad = rows.filter(x => !x.zone || !x.title.includes('· ' + x.zone));
      const msZ = r.msRows.filter(m => rows.some(x => x.k === m.k)).filter(m => { const z = rows.find(x => x.k === m.k).zone; return !m.loc.startsWith(z); });
      rec(c, 'every Next up quest row has a zone, same as its milestone row', !zbad.length && !msZ.length, { zbad: zbad.map(x => x.name), msZ: msZ.map(m => [m.name, m.loc.slice(0, 50)]) });
      const fcIdx = await p.evaluate(() => QUESTS.findIndex(x => x[1] === 'Forgotten Commander')), curIdx = await p.evaluate(() => QUESTS.findIndex(x => x[1] === state.quest));
      const batch = rows.filter(x => { const q = RQD.find(d => d.name === x.name); return CH.some(e => e.kind === 'story' && e.quest === x.name && e.after === 'Forgotten Commander'); });
      rec(c, 'Lv 44–45 batch only once the story reaches Forgotten Commander', curIdx >= fcIdx || !batch.length, batch.map(x => x.name));
      const far = rows.filter(x => !x.run && x.recN > L + 5);
      rec(c, 'Next up offers no quest recommended >5 levels above you', !far.length, far.map(x => `${x.name} (rec ${x.recN})`), true);
      rec(c, 'no ellipsis-truncated text in Next up / top cards', !r.ellipsis.length, r.ellipsis, true);
      if (width === 390) rec(c, 'top Next up button not covered by another element', !r.covered, r.covered);
      /* snapshot of Next up (for the behaviour review) */
      results.push({ ...c, check: 'info: Next up', pass: true, soft: 'info', detail: r.cards.slice(0, 5).map(x => x.title + (x.later ? ' [Later]' : '') + ' | ' + x.sub.slice(0, 90)) });
      /* Turned in always changes state, and update() timing: width 1500 only */
      if (width === 1500) {
        if (mode === 'advanced') { const ms = await p.evaluate(() => { const t = []; for (let i = 0; i < 10; i++) { const a = performance.now(); update(); t.push(performance.now() - a); } t.sort((a, b) => a - b); return (t[4] + t[5]) / 2; });
          rec(c, 'update() median of 10 under 15 ms', ms < 15, +ms.toFixed(1)); results.push({ ...c, check: 'info: update ms', pass: true, soft: 'info', detail: +ms.toFixed(1) }); }
        const before = await p.evaluate(() => JSON.stringify([state.quest, state.storyEnd || null, (state.qsteps || {})[state.quest] || []]));
        const has = await p.evaluate(() => { const b = [...document.querySelectorAll('#nowStar [data-now="story"]')].pop(); if (!b) return false; b.click(); return true; });
        if (has) { await p.waitForTimeout(700); const after = await p.evaluate(() => JSON.stringify([state.quest, state.storyEnd || null, (state.qsteps || {})[state.quest] || []]));
          rec(c, '"Turned in" changes state', after !== before, { before, after }); }
        else rec(c, '"Turned in" present unless story is level-gated or complete', storyCard && (/Needs Lv|Altgard story complete/.test(storyCard.sub + storyCard.title)), storyCard);
      }
    }
    await ctx.close();
  }

  /* ---------- migration: v285 fixture → current (tick counts by name) ---------- */
  {
    const fix = fs.readFileSync(path.join(ROOT, 'polish/e1/fixture-v285.json'), 'utf8');
    const metrics = () => { const out = { quests: {}, sd: {}, sh: {}, sp: 0, dv: 0 };
      GATES.forEach(g => g.items.forEach((it, j) => { const k = it.k || g.id + ':' + j;
        if (it.kind === 'quest') out.quests[it.name] = [!!state.checks[k], !!(state.started || {})[k]];
        if (it.kind === 'hideout') out.sd[it.name] = [!!state.checks[k], !!(state.areaRun || {})[k]]; }));
      AREA_ITEMS.filter(x => x.it.kind === 'stronghold').forEach(x => { out.sh[x.it.name] = !!state.checks[x.k]; });
      out.sp = SP_STEPS.filter(x => state.checks[x.k]).length; out.dv = Object.keys(state.checks).filter(k => k.startsWith('dv:') && state.checks[k]).length;
      out.story = [state.quest, JSON.stringify(state.qsteps), JSON.stringify(state.qsub)]; out.stig = [state.stLv, state.stShards, !!state.checks['g22:1']]; return out; };
    const ctx = await b.newContext(), p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + V285); await p.evaluate(([k, s]) => localStorage.setItem(k, s), [KEY, fix]); await p.reload(); await p.waitForTimeout(400);
    const A = await p.evaluate(metrics);
    await p.goto('file://' + CUR); await p.waitForTimeout(500); const B = await p.evaluate(metrics);
    const c = { level: 25, mode: 'advanced', width: 1500, fixture: 'v285-fixture' };
    const diffQ = Object.keys(A.quests).filter(n => JSON.stringify(A.quests[n]) !== JSON.stringify(B.quests[n]));
    const diffSd = Object.keys(A.sd).filter(n => JSON.stringify(A.sd[n]) !== JSON.stringify(B.sd[n]));
    rec(c, 'migration: regional quest done/in-progress identical by name', !diffQ.length, diffQ.map(n => [n, A.quests[n], B.quests[n]]));
    rec(c, 'migration: Sealed Dungeon done/run identical by name', !diffSd.length, diffSd);
    const shDiff = Object.keys(A.sh).filter(n => A.sh[n] !== B.sh[n]); rec(c, 'migration: strongholds identical by name', !shDiff.length && Object.keys(A.sh).length === Object.keys(B.sh).length, shDiff);
    rec(c, 'migration: skill ticks / board ticks / story / stigma preserved', A.sp <= B.sp && A.dv === B.dv && JSON.stringify(A.story) === JSON.stringify(B.story) && JSON.stringify(A.stig) === JSON.stringify(B.stig), { A: [A.sp, A.dv, A.story[0], A.stig], B: [B.sp, B.dv, B.story[0], B.stig] });
    rec(c, 'migration: no page errors', !errs.length, errs);
    await ctx.close();
  }

  /* ---------- user-realistic: his save, through v285 first, then the current page ---------- */
  const user = JSON.parse(fs.readFileSync(path.join(ROOT, 'polish/e1/fixture-v285.json'), 'utf8'));
  Object.assign(user, { level: 27, quest: 'Preparations for Restoration', stShards: 0, stones: 58, dvTotal: 114, stLv: { "Triniel's Dagger": 4 }, pendSt: 0, pendCr: 0, open: {}, areaRun: {} });
  Object.assign(user.checks, { 'g22:3': true, 'g22:4': false, 'g22:5': true, 'g22:6': false, 'g22:7': false, 'g27:3': false, 'g22:1': true, 'g22:0': true });
  user.started = { ...user.started, 'g22:4': 1, 'g22:6': 1, 'g22:7': 1 }; delete user.started['g30:13']; /* base fixture's Lv 30 quest in progress isn't his */
  ['dv:ew2', 'dv:as', 'dv:as2', 'dv:corner', 'dv:ie', 'dv:ss', 'dv:z:ie', 'dv:z:qs', 'dv:z:db', 'dv:z:db2', 'dv:z:corner'].forEach(k => { user.checks[k] = true; user.dvCost[k] = 7; });
  fs.writeFileSync(path.join(QA, 'fixture-user-v285.json'), JSON.stringify(user));
  const userRun = async (quest, tag, shots) => {
    const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 } }), p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + V285); await p.evaluate(([k, s]) => localStorage.setItem(k, s), [KEY, JSON.stringify({ ...user, quest })]); await p.reload(); await p.waitForTimeout(400);
    await p.goto('file://' + CUR); await p.waitForTimeout(600);
    const c = { level: 27, mode: 'advanced', width: 1500, fixture: 'user-' + tag };
    const r = await p.evaluate(probe);
    const st = await p.evaluate(() => { const by = n => 'rq:' + RQ_BY[n].id; const s = n => state.checks[by(n)] ? 'done' : (state.started || {})[by(n)] ? 'run' : 'open';
      return { q: ["Blade of Vengeance", "In the Fang Legion's Name", "Young Elim's Story", "A Guardian's Sacrifice", "Nine Wonders of Altgard: 1st Leg", "Fight Poison with Poison"].map(n => [n, s(n), rqAvail(RQ_BY[n]).ok]), migV5: state.migV5, shards: state.stShards, stLv: state.stLv, stones: state.stones, dv: state.dvTotal, dvLeft: dvLeftNow(), pick: state.stPick }; });
    rec(c, 'user: migrated quest states by name', JSON.stringify(st.q.map(x => x[1])) === JSON.stringify(['done', 'run', 'done', 'run', 'run', 'open']) && st.migV5, st.q);
    rec(c, 'user: shards 0, Triniel Lv 4, stones 58, crystals 114 preserved', st.shards === 0 && st.stLv["Triniel's Dagger"] === 4 && st.stones === 58 && st.dv === 114, st);
    rec(c, 'user: no page errors', !errs.length, errs);
    const fp = r.rqInfo.rows.find(x => x.name === 'Fight Poison with Poison');
    /* E4 (QA3 #9): a story-locked quest at your level is offered in the Regional card's "+N waiting on the story" row with "In my game". */
    const fpWait = await p.evaluate(() => [...document.querySelectorAll('#nowStar .rq-wait li')].some(li => /Fight Poison with Poison/.test(li.textContent) && li.querySelector('[data-rqig]')));
    rec(c, 'user: Fight Poison with Poison (open in his game) is offered in Next up', (!!fp && !fp.dis) || fpWait, { sub: r.rqInfo.sub, wait: fpWait, rows: r.rqInfo.rows.map(x => x.name + (x.run ? ' (run)' : x.dis ? ' (locked)' : '')) }, true);
    const herb = r.rqInfo.rows.find(x => x.name === 'Herb Pouch Heist');
    rec(c, 'user: Herb Pouch Heist (rec 44) not offered at Lv 27', !herb, r.rqInfo.rows.map(x => x.name + ' ' + x.rec), true);
    const eq = r.cards.find(x => /^Equip /.test(x.title));
    rec(c, 'user: Next up offers equipping stigma slot 2', !!eq, r.cards.map(x => x.title));
    results.push({ ...c, check: 'info: user view', pass: true, soft: 'info', detail: { nextUp: r.cards.map(x => x.title + ' | ' + x.sub), rq: r.rqInfo, sp: r.sp, dv: r.dv, st: r.st, story: r.story, ahead: r.ahead, st2: st } });
    if (shots && !NOSHOTS) { await p.screenshot({ path: path.join(SHOTS, `user-27-${tag}-top.png`) }); await p.screenshot({ path: path.join(SHOTS, `user-27-${tag}-full.png`), fullPage: true }); }
    await ctx.close();
  };
  await userRun('Preparations for Restoration', 'prep', true);
  await userRun('A Collective Effort', 'collective', true);

  /* ---------- pop-out (Document PiP stubbed with window.open) ---------- */
  {
    const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 } });
    await ctx.addInitScript(() => { window.documentPictureInPicture = { requestWindow: async o => { const w = window.open('', 'pip' + Date.now(), `popup,width=${o.width},height=${o.height}`); if (!w) throw new Error('blocked'); await new Promise(r => setTimeout(r, 50)); return w; } }; });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push('main: ' + e.message));
    await p.goto('file://' + CUR); await setState(p, { L: 27, mode: 'advanced', fx: 'messy' });
    const c = { level: 27, mode: 'advanced', width: 1500, fixture: 'popout' };
    const hasBtn = await p.$('[data-nspop]'); rec(c, 'pop-out button shown when Document PiP exists', !!hasBtn);
    if (hasBtn) {
      const [pop] = await Promise.all([ctx.waitForEvent('page'), p.click('[data-nspop]')]); pop.on('pageerror', e => errs.push('pip: ' + e.message));
      await pop.setViewportSize({ width: 400, height: 280 }); await p.waitForTimeout(500);
      const pr = await pop.evaluate(() => ({ cards: document.querySelectorAll('.ns-card').length, styled: getComputedStyle(document.body).backgroundColor, sw: document.documentElement.scrollWidth, iw: innerWidth, firstH: (document.querySelector('.ns-card.first') || {}).offsetHeight, popBtn: !!document.querySelector('[data-nspop]') && getComputedStyle(document.querySelector('[data-nspop]')).display !== 'none', hint: (document.querySelector('.pip-hint') || {}).innerText }));
      const away = await p.evaluate(() => (document.getElementById('nsAway') || {}).innerText || '');
      rec(c, 'pop-out: Next up moves to the window, placeholder in page', pr.cards > 0 && /pop-out window/.test(away), { pr, away });
      rec(c, 'pop-out: no horizontal scroll at 400 px', pr.sw <= pr.iw, pr);
      rec(c, 'pop-out: first card fits the 280 px window', pr.firstH && pr.firstH <= 280 - 40, pr.firstH, true);
      rec(c, 'pop-out: no "Pop out" button inside the pop-out', !pr.popBtn, pr, true);
      if (!NOSHOTS) await pop.screenshot({ path: path.join(SHOTS, 'popout-27.png') });
      const q0 = await p.evaluate(() => JSON.stringify([state.pendSt, state.pendCr, Object.keys(state.checks).filter(k => state.checks[k]).length, state.quest]));
      await pop.keyboard.press('Space'); await p.waitForTimeout(800);
      const q1 = await p.evaluate(() => JSON.stringify([state.pendSt, state.pendCr, Object.keys(state.checks).filter(k => state.checks[k]).length, state.quest]));
      rec(c, 'pop-out: Space completes the top card', q0 !== q1, { q0, q1 });
      if (!NOSHOTS) await pop.screenshot({ path: path.join(SHOTS, 'popout-27-after-space.png') });
      await pop.close(); await p.waitForTimeout(400);
      const back = await p.evaluate(() => !!document.querySelector('#main #nowStar, .layout #nowStar') && !document.getElementById('nsAway'));
      rec(c, 'pop-out: closing the window brings Next up back', back);
    }
    rec(c, 'pop-out: no page errors', !errs.length, errs);
    await ctx.close();
  }

  /* ---------- review screenshots ---------- */
  if (!NOSHOTS) {
    for (const width of [1500, 390]) {
      const ctx = await b.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 } }), p = await ctx.newPage();
      await p.goto('file://' + CUR);
      for (const mode of MODES) for (const L of [27, 30, 32, 37, 40, 45]) {
        await setState(p, { L, mode, fx: 'clean' });
        await p.screenshot({ path: path.join(SHOTS, `${width}-${mode}-${L}-top.png`) });
        if (width === 1500) await p.screenshot({ path: path.join(SHOTS, `${width}-${mode}-${L}-full.png`), fullPage: true });
      }
      if (width === 1500) { await setState(p, { L: 27, mode: 'advanced', fx: 'clean' });
        await p.evaluate(() => { document.querySelectorAll('#srcCard details, #confCard details, #srcCard, #confCard').forEach(d => { if (d.tagName === 'DETAILS') d.open = true; }); (document.getElementById('srcCard')).scrollIntoView(); });
        await p.waitForTimeout(200); await (await p.$('#srcCard')).screenshot({ path: path.join(SHOTS, 'sources-open.png') }).catch(() => {});
        await (await p.$('#confCard')).screenshot({ path: path.join(SHOTS, 'confidence-open.png') }).catch(() => {}); }
      await ctx.close();
    }
  }

  const hard = results.filter(r => !r.pass && !r.soft), soft = results.filter(r => !r.pass && r.soft === true);
  fs.writeFileSync(path.join(QA, 'results.json'), JSON.stringify(results, null, 0).replace(/\},\{/g, '},\n{'));
  const by = xs => Object.entries(xs.reduce((o, r) => (o[r.check] = (o[r.check] || 0) + 1, o), {})).map(([k, v]) => `  ${v}× ${k}`).join('\n');
  console.log(`checks: ${results.filter(r => r.soft !== 'info').length} · hard fail ${hard.length} · soft fail ${soft.length} · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  console.log('HARD FAILS by check:\n' + by(hard)); console.log('SOFT FAILS by check:\n' + by(soft));
  await b.close(); process.exit(hard.length ? 1 : 0);
})();
