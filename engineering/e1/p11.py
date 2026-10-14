F='assassin-route.html'
s=open(F,encoding='utf-8').read()
def once(old,new):
    global s
    c=s.count(old); assert c==1,(c,old[:90]); s=s.replace(old,new)
once('''  if (e.target.closest("[data-nspop]")) { popOutNow(); return; }
  const qb = e.target.closest("[data-rqk]");
  if (qb) { e.preventDefault(); const k = qb.dataset.rqk; state.started = state.started || {};
    if (!state.checks[k] && !qProg(k)) { state.started[k] = 1; save(); update(); return; }
    const src = mainEl.querySelector(`input[data-k="${CSS.escape(k)}"]`);
    if (src && !src.checked) src.click(); else { delete state.started[k]; state.checks[k] = true; save(); update(); }
    return; }''','''  if (e.target.closest("[data-nspop]")) { popOutNow(); return; }
  const zb = e.target.closest("[data-snz]"); if (zb) { e.preventDefault(); snoozeToggle(zb.dataset.snz); return; }
  const qb = e.target.closest("[data-rqk]");
  if (qb) { e.preventDefault(); const k = qb.dataset.rqk; state.started = state.started || {};
    if (!state.checks[k] && !qProg(k)) { state.started[k] = 1; save(); update(); return; }
    const src = mainEl.querySelector(`input[data-k="${CSS.escape(k)}"]`);
    if (src && !src.checked) src.click(); else { delete state.started[k]; state.checks[k] = true; rqTicked(k); save(); update(); }
    return; }''')
once('''    const list = QUEST_STEPS[state.quest];
    if (list) { state.qsteps = state.qsteps || {}; state.qsteps[state.quest] = list.map((_, i) => i); list.forEach((_, i) => setObj(i, true)); save(); }
    stepQuest(1); }''','''    const list = QUEST_STEPS[state.quest];
    if (list) { state.qsteps = state.qsteps || {}; state.qsteps[state.quest] = list.map((_, i) => i); list.forEach((_, i) => setObj(i, true)); save(); }
    /* Last quest the guide covers: remember it's turned in (the card then says to continue in game). */
    if (QUESTS.findIndex(([, n]) => n === state.quest) === QUESTS.length - 1) { state.storyEnd = state.quest; save(); update(); }
    else stepQuest(1); }''')
once('''  else if (a === "rotopen") { const t = document.getElementById("sdTab"); if (!document.getElementById("statDrawer").classList.contains("open")) t.click(); }
''','')
once('''  else if (a === "quests") { const pb = document.querySelector('[data-prog="quest"]'); if (pb) pb.click(); }
  else if (a === "areas") { const pb = document.querySelector('[data-prog="sd"]'); if (pb) pb.click(); }
''','')
# milestone row snooze + ticking clears follow-up snoozes
once('''document.getElementById("gates").addEventListener("click", e => {
  const i = e.target.closest && e.target.closest("li.qrow input[data-k]"); if (!i) return;''','''document.getElementById("gates").addEventListener("click", e => {
  const zb = e.target.closest && e.target.closest("li.qrow [data-snz]"); if (zb) { e.preventDefault(); snoozeToggle(zb.dataset.snz); return; }
  const i = e.target.closest && e.target.closest("li.qrow input[data-k]"); if (!i) return;''')
once('''  const k = e.target.dataset.k; if (!k) return;
  const was = !!state.checks[k];
  state.checks[k] = e.target.checked;''','''  const k = e.target.dataset.k; if (!k) return;
  const was = !!state.checks[k];
  state.checks[k] = e.target.checked;
  if (e.target.checked) rqTicked(k);''')
open(F,'w',encoding='utf-8').write(s); print('ok')
