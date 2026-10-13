# E4 code/text edits to assassin-route.html (QA3 findings 1-12). Each edit is an exact single-match replacement;
# the script stops if the input drifted. Run from the scratchpad root after gen.py + apply.py:
#   cp backup-v290-pre-E4.html assassin-route.html && python3 -I polish/e2/gen.py && python3 -I polish/e2/apply.py && python3 -I polish/e4/patch.py
import sys
P = "assassin-route.html"
s = open(P, encoding="utf-8").read()
def R(old, new, tag):
    global s
    n = s.count(old)
    if n != 1: sys.exit(f"[{tag}] expected 1 match, found {n}: {old[:90]!r}")
    s = s.replace(old, new)

# ---------- #1 "Put <stigma> on E" ticks with the equip; one-time migration for slots already equipped
R('''function rqTicked(k) {''',
  '''/* E4: a stigma slot's "Put X on E" step (it.eput === slot n) is done when the slot is marked equipped. */
const eputK = n => { const it = GATES.flatMap(g => g.items).find(x => x.eput === n); return it ? it.k : null; };
function rqTicked(k) {''', "1-helper")
R('''  if (e.target.checked) rqTicked(k);
  const rw = was !== e.target.checked && CLEAR_REWARD(k);''',
  '''  if (e.target.checked) rqTicked(k);
  /* Equipping a stigma slot (milestone row, Stigmas card or Next up) also puts it on E. */
  if (e.target.checked) { const it = itemByK(k), ek = it && it.stig && eputK(it.stig); if (ek) state.checks[ek] = true; }
  const rw = was !== e.target.checked && CLEAR_REWARD(k);''', "1-change")
R('''  const src = mainEl.querySelector(`input[data-k="${CSS.escape(k)}"]`);
  if (src) { if (!src.checked) src.click(); else { save(); update(); } } else { state.checks[k] = true; save(); update(); } }''',
  '''  const ek = slot && eputK(slot.n); if (ek) state.checks[ek] = true;
  const src = mainEl.querySelector(`input[data-k="${CSS.escape(k)}"]`);
  if (src) { if (!src.checked) src.click(); else { save(); update(); } } else { state.checks[k] = true; save(); update(); } }''', "1-sttick")
R('''const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };
''',
  '''/* E4 one-time (state.eputSync1): slots already marked equipped get their "Put X on E" step ticked; before E4 nothing ticked
   it, so Lv 27/32/37 stayed "Missed". Only adds ticks; nothing is renamed or removed. */
if (!state.eputSync1) {
  const all = GATES.flatMap(g => g.items);
  all.forEach(it => { if (!it.stig || !state.checks[it.k]) return; const e = all.find(x => x.eput === it.stig); if (e) state.checks[e.k] = true; });
  state.eputSync1 = true; if (hadSave) { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };
''', "1-mig")
R('''The key grid below shows the full setup; closing this panel marks it done.`''',
  '''The key grid below shows the full setup; closing this panel clears this note.`''', "1-note")

# ---------- #2 unticked optional steps: not counted, hidden in Basic, no "Later" card for optional-only milestones
R('''/* Optional tasks count toward their milestone like any task, unless the Optional tasks filter hides them. */''',
  '''/* Optional tasks count toward their milestone only once ticked (an untouched one never makes a milestone "Missed");
   the Optional tasks filter hides them entirely. Basic hides unticked ones. */''', "2-comment")
R('''!isAreaKind(x.it) && !(state.hideOpt && x.it.opt));''',
  '''!isAreaKind(x.it) && !(x.it.opt && (state.hideOpt || !state.checks[x.k])));''', "2-checkable")
R('''    d.querySelector(".bar span").style.width = (c / n * 100) + "%";
    d.classList.toggle("done", complete);''',
  '''    d.querySelector(".bar span").style.width = (n ? c / n * 100 : 100) + "%";
    d.classList.toggle("done", complete);''', "2-bar-g")
R('''    d.querySelector(".bar span").style.width = (c / n * 100) + "%";
    d.classList.toggle("done", c === n);''',
  '''    d.querySelector(".bar span").style.width = (n ? c / n * 100 : 100) + "%";
    d.classList.toggle("done", c === n);''', "2-bar-s")
R('''body.basic #gates li.item:has(> label > input:checked), body.basic #gates li.storyreq.reached, body.basic #btnExpand,''',
  '''body.basic #gates li.item:has(> label > input:checked), body.basic #gates li.item.optional, body.basic #gates li.storyreq.reached, body.basic #btnExpand,''', "2-basic-css")
R('''    const g2 = GATES.find(g => g.lv > lv && (([c, n]) => c < n)(counts(g))), st2 = g2 ? stepsOf(g2).find(x => !x.rq) : null;''',
  '''    /* Only a milestone with a required step still open: not regional quests, optional steps, or skill lines (those have
       their own "Buy" cards above), so a card never promises something that won't show up at that level. */
    const g2 = GATES.find(g => g.lv > lv && checkable(g).some(x => x.it.kind !== "quest" && !/^(sp|dv):/.test(x.k) && !state.checks[x.k])), st2 = g2 ? stepsOf(g2).find(x => !x.rq && !x.adv) : null;''', "2-later")

# ---------- #3 Skills past the plan: plain statement, no link
R('''`<div class="dvtext"><span class="spname">All planned upgrades spent</span><small>${pts} point${pts === 1 ? "" : "s"} unplanned · see <a href="#build" data-gogate="build">Build plan</a></small></div></div>` +''',
  '''`<div class="dvtext"><span class="spname">All planned upgrades spent</span><small>${pts} point${pts === 1 ? "" : "s"} spare · no sourced plan past this — spend on skills you use</small></div></div>` +''', "3-spdone")
R('''#spCard .spdone small a { color: inherit; text-underline-offset: 2px; }
body.basic #spCard .spdone small a { pointer-events: none; text-decoration: none; }
''', '', "3-css")

# ---------- #5 "+N more upgrades available now" -> what the remaining points cover
R('''      (next && now.length > 1 ? `<p class="sphint">+${now.length - 1} more upgrade${now.length === 2 ? "" : "s"} available now</p>` : "") +''',
  '''      (next && now.length > 1 ? (() => { /* after this one: how many of the next open upgrades (in order) the points left cover */
        let left = pts - (next.spec ? 0 : next.cost), k = 0; now.slice(1).some(y => { const c = y.spec ? 0 : y.cost; if (c > left) return true; left -= c; k++; return false; });
        return `<p class="sphint">${k ? `+${k} more your points cover` : `${now.length - 1} more unlocked · ${Math.max(0, left)} pt${left === 1 ? "" : "s"} left`}</p>`; })() : "") +''', "5-hint")

# ---------- #6 stigma "x of y spent": total = the whole plan (4 planned stigmas to their targets), stable
R('''  const spentNow = ST_TARGETS.filter(([n]) => slots.some(x => x.name === n && state.checks[x.k])).reduce((t, [n, T]) => { let c = 0; for (let L = 1; L <= Math.min(T, stLvOf(n)); L++) c += ST_COST(L) || 0; return t + c; }, 0);
  /* Bar: shards in the planned stigmas so far vs the plan's total (learning + each level up to its target). */
  const planTotal = ST_TARGETS.filter(([n]) => slots.some(x => x.name === n && state.checks[x.k])).reduce((t, [, T]) => { let c = 0; for (let L = 1; L <= T; L++) c += ST_COST(L); return t + c; }, 0);''',
  '''  /* Bar: shards in the planned stigmas so far vs the whole plan (all 4 planned stigmas: learning + each level up to its
     target; ST_TARGETS, else level 1). The total doesn't move when a slot opens. */
  const stT = n => (ST_TARGETS.find(([m]) => m === n) || [n, 1])[1], stC = T => { let c = 0; for (let L = 1; L <= T; L++) c += ST_COST(L) || 0; return c; };
  const spentNow = STIGMA_PLAN.filter(n => slots.some(x => x.name === n && state.checks[x.k])).reduce((t, n) => t + stC(Math.min(stT(n), stLvOf(n))), 0);
  const planTotal = STIGMA_PLAN.reduce((t, n) => t + stC(stT(n)), 0);''', "6-total")

# ---------- #7 Journey: no dead "Quest done · next quest ›" after the last Altgard quest
R('''  const nextBtn = n === N ? `<button type="button" class="qs-next" id="qsNext">Quest done · next quest ›</button>` : "";''',
  '''  /* Last quest the guide covers: the button turns it in (as Next up's "Turned in"); once turned in, the story continues in game. */
  const last = QUESTS.findIndex(([, q]) => q === state.quest) === QUESTS.length - 1;
  const nextBtn = n !== N ? "" : last && state.storyEnd === state.quest ? `<p class="qs-end">Altgard story complete · continue in ${STORY_END.region} in game</p>`
    : `<button type="button" class="qs-next" id="qsNext">${last ? "Quest done · mark turned in" : "Quest done · next quest ›"}</button>`;''', "7-btn")
R('''  if (e.target.closest("#qsNext")) stepQuest(1);
''',
  '''  if (e.target.closest("#qsNext")) {
    if (QUESTS.findIndex(([, q]) => q === state.quest) === QUESTS.length - 1) {
      GATES.forEach(g => g.items.forEach(it => { if (it.byStory && it.story === state.quest) state.checks[it.k] = true; }));
      state.storyEnd = state.quest; save(); update(); }
    else stepQuest(1); }
''', "7-click")
R('''.qs-next { margin-top: 6px;''', '''.qs-end { margin: 6px 0 0; font: 600 12px var(--body); color: var(--good); }
.qs-next { margin-top: 6px;''', "7-css")

# ---------- #4 level-gated story: one "Meanwhile" line of open, verified XP sources
R('''  /* Nothing else to do right now: the story is the default (its steps live in the Journey card). */
  const qi = state.quest ? QUESTS.findIndex(([, n]) => n === state.quest) : -1;''',
  '''  /* Nothing else to do right now: the story is the default (its steps live in the Journey card). */
  const qi = state.quest ? QUESTS.findIndex(([, n]) => n === state.quest) : -1;
  /* Story level-gated: one line of what's open at your level that gives XP (verified unlocks only): Sealed Dungeons and
     Strongholds still to clear, the highest Expedition you've unlocked (Krao Cave also needs "Daeva in a Dream"), the daily dungeon. */
  const meanwhile = !gated ? "" : (() => { const xs = [];
    if (sdOpen.length) xs.push("Sealed Dungeons"); if (shOpen.length) xs.push("Strongholds");
    const kraoOk = qi >= storyIdx("Daeva in a Dream");
    const ex = VERIFIED_UNLOCKS.filter(x => x[0] <= lv && /^Expedition/.test(x[2]) && (x[1] !== "Krao Cave" || kraoOk)).pop();
    if (ex) { const il = (ex[2].match(/item level (\\d+)/) || [])[1]; xs.push(`${ex[1]} (Lv ${ex[0]}+${il ? `, item level ${il}` : ""})`); }
    const dd = VERIFIED_UNLOCKS.find(x => x[1] === "Daily dungeon"); if (dd && dd[0] <= lv) xs.push(`daily dungeon (Lv ${dd[0]}+)`);
    return xs.length ? `<span class="ns-mean">Meanwhile: ${xs.join(" / ")}</span>` : ""; })();
  const gatedSub = `Needs Lv ${gateLv}: you're ${lv}. Level up first.${meanwhile}`;''', "4-meanwhile")
R('''sub: gated ? `Needs Lv ${gateLv}: you're ${lv}. Level up first.` : nq ? `Main story · then ${nq[1]}` : "Main story", btn: "Turned in"''',
  '''sub: gated ? gatedSub : nq ? `Main story · then ${nq[1]}` : "Main story", btn: "Turned in"''', "4-sub1")
R('''sub: gated ? `Needs Lv ${gateLv}: you're ${lv}. Level up first.` : `${vis.filter(i => done.includes(i)).length}/${vis.length} objectives''',
  '''sub: gated ? gatedSub : `${vis.filter(i => done.includes(i)).length}/${vis.length} objectives''', "4-sub2")

# ---------- #10 single-source skill buys: a subtle tag on their Next up cards
R('''  if (sp) { acts.push({ ico: spMini(sp.s.n) || "✦", t: `Buy <b>${sp.s.n} ${sp.spec ? "specialty" : (sp.L - 1) + " → " + sp.L}</b>`, sub: sp.spec ? `Pick: ${sp.s.spec}` : `${spCostTxt(sp)} · you have the points`, btn: "Spent", act: "skill" });''',
  '''  /* A skill upgrade backed by one source only: a small tag (the Skills card's tooltip names the source). */
  const ssTag = x => x.s.single ? ` · <span class="ss-tag" title="Single source (${x.s.single})">single source</span>` : "";
  if (sp) { acts.push({ ico: spMini(sp.s.n) || "✦", t: `Buy <b>${sp.s.n} ${sp.spec ? "specialty" : (sp.L - 1) + " → " + sp.L}</b>`, sub: (sp.spec ? `Pick: ${sp.s.spec}` : `${spCostTxt(sp)} · you have the points`) + ssTag(sp), btn: "Spent", act: "skill" });''', "10-top")
R('''      acts.push({ ico: spMini(x.s.n) || "✦", t: `Buy <b>${x.s.n} ${x.spec ? "specialty" : (x.L - 1) + " → " + x.L}</b>`, sub: x.spec ? `Pick: ${x.s.spec}` : spCostTxt(x), act: "skill" });''',
  '''      acts.push({ ico: spMini(x.s.n) || "✦", t: `Buy <b>${x.s.n} ${x.spec ? "specialty" : (x.L - 1) + " → " + x.L}</b>`, sub: (x.spec ? `Pick: ${x.s.spec}` : spCostTxt(x)) + ssTag(x), act: "skill" });''', "10-queue")
R('''sub: `Opens at Lv ${x.req} · ${away(x.req)}`, act: "", later: true } }));''',
  '''sub: `Opens at Lv ${x.req} · ${away(x.req)}${ssTag(x)}`, act: "", later: true } }));''', "10-later")

# ---------- #8 / #9 regional card: survives snoozing the last open quest; "+N waiting on the story" with "In my game"
R('''    rqAll.push({ k, g, it, done, run, pre: done || run ? [] : av.pre }); }));''',
  '''    rqAll.push({ k, g, it, done, run, pre: done || run ? [] : av.pre }); }));
  /* Waiting on the story: at or above its recommended level and unlock level, but the main story isn't at its story quest
     yet. Listed (folded) in the card with the same "In my game" control as the milestone rows. */
  const rqWait = []; GATES.forEach(g => g.items.forEach(it => { if (it.kind !== "quest" || it.hidden) return; const k = it.k, q = it.q;
    if (state.checks[k] || qProg(k) > 0 || !q.story || q.rec > lv || lv < rqOpenLv(q) || rqAvail(q, lv).open) return; rqWait.push({ k, it }); }));''', "9-wait")
R('''  const rqCard = rqOpen.length ? { ico: "❖", t: `<b>Regional quests</b>`,''',
  '''  const rqSnzK = rqAll.filter(x => x.snz).map(x => x.k);
  const rqCard = rqOpen.length || rqSnz || rqWait.length ? { ico: "❖", t: `<b>Regional quests</b>`,''', "8-card")
R('''    bar: `<span class="nsq-bar rq"><span class="d" style="width:${rqDone / rqScope.length * 100}%"></span><span class="r" style="width:${rqRun / rqScope.length * 100}%"></span></span><span class="nsq-barl">${rqDone}/${rqScope.length} turned in</span>`,
    btn: "Show", act: "rqgo:" + rqFirst.k,''',
  '''    bar: rqScope.length ? `<span class="nsq-bar rq"><span class="d" style="width:${rqDone / rqScope.length * 100}%"></span><span class="r" style="width:${rqRun / rqScope.length * 100}%"></span></span><span class="nsq-barl">${rqDone}/${rqScope.length} turned in</span>` : "",
    btn: "Show", act: "rqgo:" + (rqFirst ? rqFirst.k : rqSnzK.length ? rqSnzK[0] : rqWait[0].k),''', "8-bar")
R('''      return `<ul class="ns-qgrid">${groups}${more ? `<li class="qg more">+${more} more</li>` : ""}</ul>`; })() } : null;
  if (rqCard && gated) acts.push(rqCard);''',
  '''      /* Snoozed ("Not in game yet", counted in the subline): one compact row with their names and one control that shows them again. */
      const zRow = rqSnzK.length ? `<li class="qg rq-aux"><span class="rq-auxt" title="Not in game yet: hidden until your next Level up">${rqAll.filter(x => x.snz).map(x => x.it.name).join(", ")}</span><button type="button" class="q-inl" data-unsnz="${rqSnzK.join("|")}">Show again</button></li>` : "";
      /* Waiting on the story: folded; each quest gets the milestone rows' "In my game" (= picked up). */
      const wRow = rqWait.length ? `<li class="qg rq-aux"><details class="rq-wait"${rqWaitOpen ? " open" : ""}><summary>+${rqWait.length} waiting on the story</summary><ul>${rqWait.map(x => `<li><span title="Opens once the story reaches ${x.it.q.story}">${x.it.name}</span><button type="button" class="q-inl" data-rqig="${x.k}">In my game</button></li>`).join("")}</ul></details></li>` : "";
      return `<ul class="ns-qgrid">${groups}${more ? `<li class="qg more">+${more} more</li>` : ""}${zRow}${wRow}</ul>`; })() } : null;
  if (rqCard && gated && rqOpen.length) acts.push(rqCard);''', "8-rows")
R('''return n ? `<span class="nw">${n} near your story step</span>` : ""; })()].filter(Boolean).join(" · "),''',
  '''return n ? `<span class="nw">${n} near your story step</span>` : ""; })()].filter(Boolean).join(" · ") || "None to pick up now",''', "8-sub")
R('''  if (rqCard && !gated) acts.push(rqCard);''', '''  if (rqCard && !(gated && rqOpen.length)) acts.push(rqCard);''', "8-rank")
R('''  const zb = e.target.closest("[data-snz]"); if (zb) { e.preventDefault(); snoozeToggle(zb.dataset.snz); return; }
  const qb = e.target.closest("[data-rqk]");''',
  '''  const zb = e.target.closest("[data-snz]"); if (zb) { e.preventDefault(); snoozeToggle(zb.dataset.snz); return; }
  const ub = e.target.closest("[data-unsnz]"); if (ub) { e.preventDefault(); ub.dataset.unsnz.split("|").forEach(k => { if (state.rqSnooze) delete state.rqSnooze[k]; }); save(); update(); return; }
  const ig = e.target.closest("[data-rqig]"); if (ig) { e.preventDefault(); const k = ig.dataset.rqig; state.started = state.started || {};
    if (!state.checks[k]) { state.started[k] = 1; if (state.rqSnooze) delete state.rqSnooze[k]; save(); update(); } return; }
  const qb = e.target.closest("[data-rqk]");''', "9-click")
R('''nowEl.addEventListener("click", e => {''',
  '''let rqWaitOpen = false; /* "+N waiting on the story" fold, kept across Next up re-renders */
nowEl.addEventListener("toggle", e => { if (e.target.classList && e.target.classList.contains("rq-wait")) rqWaitOpen = e.target.open; }, true);
nowEl.addEventListener("click", e => {''', "9-fold")

# ---------- CSS for the new bits (same muted mono style as .q-rec / pills)
R('''#nowStar .q-cb:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }''',
  '''#nowStar .q-cb:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
/* E4: Next up extras */
#nowStar .ns-mean { display: block; margin-top: 2px; color: var(--muted); }
#nowStar .ss-tag { font: 600 10.5px var(--mono); color: var(--muted); white-space: nowrap; }
#nowStar .ns-qgrid li.rq-aux { color: var(--muted); font-size: 12px; align-items: center; }
#nowStar .ns-qgrid li.rq-aux .q-inl { margin: 0; padding: 0 7px; line-height: 16px; font-size: 10px; }
#nowStar .rq-wait { min-width: 0; }
#nowStar .rq-wait > summary { display: block; padding: 0; cursor: pointer; font: 600 11px/18px var(--mono); color: var(--muted); list-style: none; }
#nowStar .rq-wait > summary::-webkit-details-marker { display: none; }
#nowStar .rq-wait > summary::after { content: " ▾"; }
#nowStar .rq-wait[open] > summary::after { content: " ▴"; }
#nowStar .rq-wait ul { list-style: none; margin: 2px 0 0; padding: 0; display: grid; gap: 3px; }
#nowStar .rq-wait li { display: flex; align-items: center; gap: 8px; padding: 0; font-size: 12.5px; color: var(--muted); white-space: normal; overflow: visible; }
#nowStar .rq-wait li::before { display: none; }
#nowStar .rq-wait li .q-inl { margin: 0; padding: 0 7px; line-height: 16px; font-size: 10px; }''', "css")

# ---------- #12 Sources card: the check date once, in the intro (group titles come from gen.py)
R('''these pages (${SOURCES.reduce((t, g) => t + g.links.length, 0)} links). Metabot''',
  '''these pages (${SOURCES.reduce((t, g) => t + g.links.length, 0)} links, checked Oct 2026). Metabot''', "12-intro")

open(P, "w", encoding="utf-8").write(s)
print("E4 patch applied")
