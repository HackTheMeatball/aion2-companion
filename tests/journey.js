/* QA3 journey: the user's v285 save (as the current page stores it: tests/fixtures/fixture-user-v285.via-v285.flat.json),
   Lv 27 -> 45 by clicking. node tests/journey.js [toLv]  (log: tests/out/journey/journey.log)
   JOURNEY_REALTIME=1: real pauses instead of the fake clock (see below). */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const { dump } = require('./lib');
const { writeSave, flatFixture } = require('./support/save');
const CFG = require('./config'); const ROOT = CFG.ROOT, OUT = path.join(CFG.OUT, 'journey'), SH = path.join(OUT, 'shots');
fs.mkdirSync(SH, { recursive: true });
const TO = +(process.argv[2] || 45);
const log = []; const L = (...a) => { const s = a.join(' '); log.push(s); console.log(s); };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 } });
  /* Page timers run on Playwright's fake clock: every pause below (the app's animation timers: 320 ms card exit, 550 /
     1150 ms objective fade, 750 ms area fade, …) advances the page's setTimeout / rAF / Date by exactly that much, in
     order, without waiting in real time: same steps, same order, no wall-clock races (2026-10-15, 2 vCPU: 243 s vs ~12
     min, and the step log through Lv 39 identical to a real-time run, which then lost a race at Lv 40).
     JOURNEY_REALTIME=1 runs the old way (real pauses) to compare logs. */
  const REAL = !!process.env.JOURNEY_REALTIME; if (!REAL) await ctx.clock.install();
  const wait = ms => REAL ? new Promise(r => setTimeout(r, ms)) : ctx.clock.runFor(ms);
  await ctx.addInitScript(() => { window.documentPictureInPicture = { requestWindow: async (o) => { const w = window.open('', 'pip', `width=${o.width},height=${o.height}`); w.document.write('<!doctype html><html><head></head><body></body></html>'); w.document.close(); window.__pip = w; return w; } }; });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); ctx.on('page', pg => pg.on('pageerror', e => errs.push('pip: ' + e.message)));
  /* the user's v285 save as the current page stored it after loading it through v285 first (a flat fixture, frozen since 0.4 P3c) */
  await p.goto(CFG.CUR); await writeSave(p, flatFixture('fixture-user-v285.via-v285.flat.json')); await p.reload(); await wait(700);
  const S = () => p.evaluate(() => JSON.stringify(state));
  const top = () => p.evaluate(() => { const c = document.querySelector('#nsqWrap > .ns-card'); return c ? c.querySelector('h3').innerText.replace(/\s+/g, ' ') + ' | ' + ((c.querySelector('.title > p') || {}).innerText || '') : '(none: ' + (document.querySelector('#nowStar') || {}).innerText.replace(/\s+/g, ' ').slice(0, 120) + ')'; });
  const shots = async (lv) => {
    for (const mode of ['advanced', 'basic']) { await p.click(`.modeseg [data-mode="${mode}"]`); await wait(350); await p.evaluate(() => window.scrollTo(0, 0));
      await p.screenshot({ path: path.join(SH, `j-${lv}-${mode}.png`) }); }
    await p.click('.modeseg [data-mode="advanced"]'); await wait(250); };
  const dupCheck = async lv => { const d = await dump(p); const hs = d.cards.map(c => c.h); const dup = hs.filter((h, i) => hs.indexOf(h) !== i); if (dup.length) L(`  !! DUP cards at ${lv}: ${dup}`); return d; };
  const stepOnce = async lv => {
    /* returns description of action or null if nothing actionable */
    const info = await p.evaluate(() => { const cs = [...document.querySelectorAll('#nsqWrap > .ns-card')];
      return cs.map((c, i) => ({ i, h: c.querySelector('h3').innerText.replace(/\s+/g, ' '), prim: !!c.querySelector('.meta .ns-btn.primary:not([disabled])'), primT: (c.querySelector('.meta .ns-btn.primary') || {}).innerText, go: (c.querySelector('.meta .ns-go') || {}).innerText, goAct: (c.querySelector('.meta [data-now]') || { dataset: {} }).dataset.now, obj: c.querySelectorAll('input[data-nsobj]').length, sub: c.querySelectorAll('input[data-nssub]:not(:checked)').length, rqk: [...c.querySelectorAll('[data-rqk]:not([disabled])')].map(x => x.dataset.rqk), later: c.classList.contains('later') })); });
    if (!info.length) return null;
    const c0 = info[0];
    // story card with objectives: tick first objective
    const story = info.find(c => /^📜|Story:/.test(c.h) || c.h.startsWith('Story') || c.h.includes('Story:'));
    if (c0.prim && !/Story:/.test(c0.h)) { await p.click('#nsqWrap > .ns-card:first-child .meta .ns-btn.primary'); await wait(800); return 'click top [' + c0.primT + '] ' + c0.h; }
    if (c0.goAct === 'boardcost') { await p.click('#nsqWrap > .ns-card:first-child .meta [data-now]'); await wait(500); const inp = await p.$('#dvNextList input.dvc'); if (inp) { const k = await inp.getAttribute('data-dvc'); await inp.fill('5'); /* the input event saves the cost and can re-render the row: press Enter on the current input for the node */ const cur = p.locator(`#dvNextList input.dvc[data-dvc="${k}"]`); if (await cur.count()) await cur.first().press('Enter'); await wait(400); const saved = await p.evaluate(k => (char(state).dvCost || {})[k], k); if (saved !== 5) L(`  !! board cost not saved for ${k}: ${saved}`); return 'board cost 5 for ' + c0.h; } return 'boardcost (no input!) ' + c0.h; }
    if (story && story.sub) { const sel = '#nsqWrap input[data-nssub]:not(:checked)'; await p.click(sel); await wait(1300); return 'tick story sub-objective'; }
    if (story && story.obj) { await p.click('#nsqWrap input[data-nsobj]'); await wait(1300); return 'tick story objective (' + story.h + ')'; }
    if (story && /Story:|Continue the story/.test(story.h) && info[story.i].prim) {
      const sel = `#nsqWrap > .ns-card:nth-child(${story.i + 1}) .meta .ns-btn.primary`; await p.click(sel); await wait(900); return 'Turned in: ' + story.h; }
    const rq = info.find(c => c.rqk.length);
    if (rq) { const k = rq.rqk[0]; await p.click(`#nsqWrap [data-rqk="${k}"]`); await wait(500); return 'rq click ' + k; }
    const area = info.find(c => /^(⛏|🏰)/.test(c.h) || /^(Clear|Run) /.test(c.h));
    if (area && /^areas:/.test(area.goAct || '')) {
      await p.click(`#nsqWrap > .ns-card:nth-child(${area.i + 1}) .meta [data-now]`); await wait(600);
      const name = area.h.replace(/^(Clear|Run) /, '').replace(/ i$/, '').replace(/ and others.*$/, '').trim();
      const k = await p.evaluate(n => { const x = AREA_ITEMS.find(y => y.it.name === n); return x && x.k; }, name);
      if (!k) return 'area: no key for ' + name;
      let el = await p.$(`#areaList input[data-k="${k}"]`);
      if (!el || !(await el.isVisible())) { const zb = await p.evaluateHandle(k => { const i = document.querySelector(`#areaList input[data-k="${CSS.escape(k)}"]`); return null; }, k); }
      if (!el) return 'AREA ROW NOT FOUND after Show: ' + name + ' ' + k;
      if (!(await el.isVisible())) return 'AREA ROW HIDDEN after Show: ' + name;
      await el.click(); await wait(300); el = await p.$(`#areaList input[data-k="${k}"]`); if (el) { await el.click(); await wait(1200); }
      const ok = await p.evaluate(k => !!char(state).checks[k], k); return `area ${name} cleared=${ok}`; }
    return null;
  };
  let lv = await p.evaluate(() => char(state).level);
  for (; lv <= TO; ) {
    L(`\n===== Lv ${lv} · story: ${await p.evaluate(() => char(state).quest)}`);
    const d = await dupCheck(lv); L('  cards: ' + d.cards.map(c => `[${c.h} | ${c.p} | ${c.meta}]`).join(' '));
    L('  SP: ' + d.sp.slice(0, 220)); L('  ST: ' + d.st.slice(0, 260)); L('  DV: ' + d.dv.slice(0, 220)); L('  prog: ' + d.prog + ' · ahead: ' + d.ahead.slice(0, 200));
    await shots(lv);
    // special scenarios
    if (!state28) { /* snooze one open regional quest in Next up, check card, level-up should clear */
      const k = await p.evaluate(() => { const b = document.querySelector('#nsqWrap [data-snz]'); return b && b.dataset.snz; });
      if (k) { await p.click(`#nsqWrap [data-snz="${k}"]`); await wait(400); L('  snoozed ' + k + ' -> rq sub: ' + (await dump(p)).cards.filter(c => /Regional/.test(c.h)).map(c => c.p)); state28 = k; }
    }
    if (lv === 30) { /* pop out */
      const has = await p.$('[data-nspop]'); L('  pop-out button: ' + !!has);
      if (has) { await p.click('[data-nspop]'); await wait(800);
        const pip = ctx.pages().find(x => x !== p); if (pip) { await pip.setViewportSize({ width: 400, height: 280 }); await wait(300); await pip.screenshot({ path: path.join(SH, 'j-30-pip.png') });
          const t0 = await pip.evaluate(() => (document.querySelector('.ns-card h3') || {}).innerText); const btn = await pip.$('.ns-card.first .meta .ns-btn.primary'); L('  pip top: ' + t0 + ' btn=' + !!btn);
          if (btn) { await btn.click(); await wait(900); L('  pip after click top: ' + await pip.evaluate(() => (document.querySelector('.ns-card h3') || {}).innerText)); }
          await pip.keyboard.press('ArrowDown'); await wait(300);
          await p.screenshot({ path: path.join(SH, 'j-30-main-while-pip.png') });
          await pip.close(); await wait(600); L('  after pip close nowStar in page: ' + await p.evaluate(() => !!document.querySelector('#main #nowStar, #nowStar') && document.getElementById('nowStar').isConnected && !document.getElementById('nsAway')));
        } else L('  !! pip window not opened'); } }
    if (!inGameDone) { /* "In my game" pill on a locked milestone quest */
      const k = await p.evaluate(() => { const b = document.querySelector('#gates li.qrow [data-ingame]'); return b && b.dataset.ingame; });
      if (k) { inGameDone = 1; L('  In my game pill: ' + k); await p.evaluate(k => { const b = document.querySelector(`#gates li.qrow [data-ingame="${CSS.escape(k)}"]`); const d = b.closest('details'); d.open = true; d.hidden = false; b.scrollIntoView({ block: 'center' }); }, k);
        await wait(200); try { await p.click(`#gates li.qrow [data-ingame="${k}"]`, { timeout: 3000 }); } catch (e) { L('  !! In my game click failed: ' + e.message.split('\n')[0]); }
        await wait(400); L('  after In my game started=' + await p.evaluate(k => (char(state).started || {})[k], k) + ' in NextUp=' + await p.evaluate(k => !!document.querySelector(`#nsqWrap [data-rqk="${CSS.escape(k)}"]`), k)); } }
    let n = 0, last = '', same = 0;
    while (n++ < 140) {
      const before = await S(), tb = await top();
      const a = await stepOnce(lv); if (!a) break;
      const after = await S(), ta = await top();
      L('  · ' + a + (before === after ? '   !! NO STATE CHANGE' : ''));
      if (before === after) { if (++same > 2) { L('  !! STUCK at ' + ta); break; } } else same = 0;
      // story: stop when gated (story card has no button)
    }
    if (errs.length) { L('  !! page errors: ' + errs.splice(0).join(' | ')); }
    const d2 = await dupCheck(lv); L('  end-of-level cards: ' + d2.cards.map(c => `[${c.h} | ${c.p} | ${c.meta}]`).join(' '));
    if (lv >= TO || lv >= 45) break;
    await p.evaluate(() => window.scrollTo(0, 0)); await p.click('#lvlUpBig'); await wait(900);
    const nl = await p.evaluate(() => char(state).level); if (state28 && !snzChecked) { snzChecked = 1; L('  after Level up snooze for ' + state28 + ' still set: ' + await p.evaluate(k => k in (char(state).rqSnooze || {}), state28)); } if (nl !== lv + 1) { L('  !! Level up did not advance: ' + nl); break; } lv = nl;
  }
  await p.screenshot({ path: path.join(SH, 'j-end-full.png'), fullPage: true });

  /* Lv 44 edge case (0.3 E4, Q10 follow-up): can a real save stand on "Forgotten Commander" (unlock Lv 45) at Lv 44 with
     every objective ticked, and is "Turned in" then held back? Only through the page's own controls:
     A. at Lv 45 tick every objective in the Journey card, then Level −;
     B. normal play at Lv 44: "Farewells" (rec 45, no unlock level of its own) ticked through and turned in from Next up,
        then Forgotten Commander's objectives ticked in the Journey card.
     (C. an imported save can hold any state; Import replaces the save as it is.) */
  {
    const edge = async (name, save, steps) => {
      const c2 = await b.newContext({ viewport: { width: 1500, height: 1000 } }); if (!REAL) await c2.clock.install();
      const w2 = ms => REAL ? new Promise(r => setTimeout(r, ms)) : c2.clock.runFor(ms);
      const q = await c2.newPage(); q.on('pageerror', e => errs.push(e.message));
      await q.goto(CFG.CUR); await writeSave(q, { open: {}, mode: 'advanced', showObj: true, showTalk: true, qsShowDone: true, ...save }, { fresh: true });
      await q.reload(); await w2(500);
      const tickAll = async () => { for (let n = 0; n < 40; n++) { const i = await q.$('#questSubs input[data-qobj]:not(:checked)'); if (!i) break; await i.click(); await w2(1300); } };
      await steps(q, w2, tickAll);
      const r = await q.evaluate(() => { const c = char(state), n = (QUEST_STEPS[c.quest] || []).length, card = [...document.querySelectorAll('#nsqWrap .ns-card')].find(x => /Story:|Continue the story/.test(x.innerText));
        return { lv: c.level, quest: c.quest, objs: ((c.qsteps || {})[c.quest] || []).length, n, turnIn: !!(card && card.querySelector('.ns-btn.primary')), qsNext: !!document.getElementById('qsNext'), wait: (document.querySelector('#questSubs .qs-wait') || {}).textContent || '' }; });
      const reached = r.lv === 44 && r.quest === 'Forgotten Commander' && r.n > 0 && r.objs === r.n;
      L(`  Lv 44 edge ${name}: Lv ${r.lv} on "${r.quest}", ${r.objs}/${r.n} objectives → state reached: ${reached}; Next up "Turned in": ${r.turnIn}; Journey button: ${r.qsNext}; "${r.wait}"`);
      if (r.turnIn || r.qsNext) L(`  !! Lv 44 edge ${name}: "Turned in" offered below the unlock level`);
      await c2.close(); return reached;
    };
    const a = await edge('A (tick at 45, then Level −)', { level: 45, quest: 'Forgotten Commander', checks: {} }, async (q, w2, tickAll) => { await tickAll(); await q.click('#lvlDown'); await w2(900); });
    const bN = await edge('B (normal play at Lv 44)', { level: 44, quest: 'Farewells', checks: {} }, async (q, w2, tickAll) => {
      await tickAll();
      const btn = await q.$('#nsqWrap .ns-card .ns-btn.primary[data-now="story"]');
      if (btn) { await btn.click(); await w2(1200); } else { const j = await q.$('#qsNext'); if (j) { await j.click(); await w2(900); } }
      await tickAll(); });
    L(`  Lv 44 edge: reachable by a real save: ${a || bN ? 'yes' : 'no'} (A Level − after ticking: ${a}; B normal play: ${bN}; C Import: any saved state)`);
    if (!a || !bN) L('  !! Lv 44 edge: a path the guide expects to reach the state did not (the answer in the PR would be wrong)');
  }
  if (errs.length) L('  !! page errors: ' + errs.splice(0).join(' | '));
  fs.writeFileSync(path.join(OUT, 'journey.log'), log.join('\n')); fs.writeFileSync(path.join(OUT, 'journey-state.json'), await S());
  await b.close(); })();
let state28, inGameDone, snzChecked;
