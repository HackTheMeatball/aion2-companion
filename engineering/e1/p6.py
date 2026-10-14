F='assassin-route.html'
s=open(F,encoding='utf-8').read()
def once(old,new):
    global s
    c=s.count(old); assert c==1,(c,old[:90]); s=s.replace(old,new)
once('''    if (!run && tag) tag.remove();
  });
}''','''    if (!run && tag) tag.remove();
    /* "Not in game yet": only for a quest you haven't picked up; pressed = snoozed until your next Level up. */
    const zb = li.querySelector(":scope > .q-snz"), zz = !!(state.rqSnooze || {})[k];
    if (zb) { zb.hidden = !!state.checks[k] || run; zb.setAttribute("aria-pressed", String(zz)); zb.textContent = zz ? "Not in game yet · undo" : "Not in game yet"; }
    li.classList.toggle("snoozed", zz && !state.checks[k] && !run);
  });
}
/* Snooze a regional quest the guide shows as available but the game doesn't (state.rqSnooze[key] = level it was set at).
   Cleared by Level up (setLevel) or by turning in the quest it follows (rqTicked). */
function snoozeToggle(k) {
  state.rqSnooze = state.rqSnooze || {};
  if (state.rqSnooze[k]) delete state.rqSnooze[k]; else state.rqSnooze[k] = state.level;
  save(); update();
}
const RQ_K = k => GATES.flatMap(g => g.items).find(it => it.kind === "quest" && it.k === k);
function rqTicked(k) {
  const it = state.rqSnooze && RQ_K(k); if (!it) return;
  GATES.forEach(g => g.items.forEach(x => { if (x.kind === "quest" && x.q.after === it.name) delete state.rqSnooze[x.k]; }));
}''')
once('''/* Quest progress cycles Not started → Started → Completed (objectives done); the tick is for turned in. Old true values = Started. */
const Q_LABEL = ["Not started", "Started", "Completed"];
const qProg = k =>''','''/* Quest progress: 0 = not picked up, 1 = in progress (old true values count as 1). */
const qProg = k =>''')
once('''const qStartBtn = k => { const v = qProg(k); return `<button type="button" class="qstart s${v}" data-qs="${k}" title="Click to change">${Q_LABEL[v]}</button>`; };
''','')
open(F,'w',encoding='utf-8').write(s); print('ok')
