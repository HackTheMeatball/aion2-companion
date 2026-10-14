F='assassin-route.html'
s=open(F,encoding='utf-8').read()
def once(old,new):
    global s
    c=s.count(old); assert c==1,(c,old[:90]); s=s.replace(old,new)
once('''  const rqAll = []; GATES.filter(g => g.lv <= lv).forEach(g => g.items.forEach((it, j) => { if (it.kind !== "quest" || it.hidden || (state.hideOpt && it.opt) || (state.hidePaid && isPaid(it))) return;
    const k = it.k || g.id + ":" + j; rqAll.push({ k, g, it, done: !!state.checks[k], run: !state.checks[k] && qProg(k) > 0 }); }));
  /* A follow-up isn't available until its first part is turned in. */
  rqAll.forEach(x => { const pre = QUEST_AFTER[x.it.name], p = pre && rqAll.find(y => y.it.name === pre); x.lock = !x.done && !x.run && !!p && !p.done; x.pre = pre; });
  const rqOpen = rqAll.filter(x => !x.done), rqRun''','''  /* Available = the quest's own recommended level (RQ rec), not its milestone's level. */
  const snz = state.rqSnooze || {};
  const rqAll = []; GATES.forEach(g => g.items.forEach(it => { if (it.kind !== "quest" || it.hidden || it.lv > lv || (state.hideOpt && it.opt)) return;
    const k = it.k; rqAll.push({ k, g, it, done: !!state.checks[k], run: !state.checks[k] && qProg(k) > 0 }); }));
  /* A follow-up isn't available until its first part is turned in. */
  rqAll.forEach(x => { const pre = x.it.q.after, p = pre && rqAll.find(y => y.it.name === pre); x.lock = !x.done && !x.run && !!p && !p.done; x.pre = pre; x.snz = !x.done && !x.run && k in snz; });
  /* "Not in game yet" (state.rqSnooze) hides a quest here until your next Level up or until its first part is turned in. */
  const rqSnz = rqAll.filter(x => x.snz).length;
  const rqOpen = rqAll.filter(x => !x.done && !x.snz), rqRun''')
s=s.replace("x.snz = !x.done && !x.run && k in snz;","x.snz = !x.done && !x.run && x.k in snz;")
once('''rqLock ? `${rqLock} follow-up${rqLock === 1 ? "" : "s"}` : "",
      (() => { const n = hereArea ? rqOpen.filter(x => !x.lock && QUEST_AREA[x.it.name] === hereArea).length''','''rqLock ? `${rqLock} follow-up${rqLock === 1 ? "" : "s"}` : "", rqSnz ? `${rqSnz} not in game yet` : "",
      (() => { const n = hereArea ? rqOpen.filter(x => !x.lock && x.it.q.zone === hereArea).length''')
once('''      const line = (x, fu) => { const n = x.it.name, id = QUEST_ID[n], rl = RQ_LOC[n], st = (x.run ? "In progress" : x.lock ? `Unlocks when ${x.pre} is turned in` : "Not picked up") + (QUEST_AREA[n] ? ` · ${QUEST_AREA[n]}` : "") + (rl && rl.kib ? ` · Kibelisk: ${rl.kib}${rl.m ? ` (${rl.m} m)` : ""}` : "");
        const label = id && !x.lock ? `<a href="https://metabot.gg/en/aion-2/map/altgard?focus=quest:${id}" target="_blank" rel="noopener" title="${n} · ${st} · Lv ${x.g.lv} · show on the map">${n}</a>` : `<span title="${n} · ${st} · Lv ${x.g.lv}">${n}</span>`;''','''      const line = (x, fu) => { const n = x.it.name, q = x.it.q, id = q.id, st = (x.run ? "In progress" : x.lock ? `Unlocks when ${x.pre} is turned in` : "Not picked up") + (q.zone ? ` · ${q.zone}` : "") + (q.kib ? ` · Kibelisk: ${q.kib}${q.m ? ` (${q.m} m)` : ""}` : "");
        const label = id && !x.lock ? `<a href="https://metabot.gg/en/aion-2/map/altgard?focus=quest:${id}" target="_blank" rel="noopener" title="${n} · ${st} · Lv ${q.rec} · show on the map">${n}</a>` : `<span title="${n} · ${st} · Lv ${q.rec}">${n}</span>`;''')
once('''        const box = `<button type="button" class="q-cb" data-rqk="${x.k}"${x.lock ? " disabled" : ""} aria-label="${x.run ? `Mark ${n} turned in` : `Mark ${n} picked up`}" title="${x.lock ? `Unlocks when ${x.pre} is turned in` : x.run ? "In progress · click when turned in" : "Click when you pick it up"}"></button>`;
        const near = hereArea && QUEST_AREA[n] === hereArea && !x.lock;
        return `<span class="ql ${x.run ? "run" : x.lock ? "lock" : "new"}${fu ? " fu" : ""}${near ? " near" : ""}">${box}${label}${near ? `<span class="q-near" title="Near your story step (${hereArea})">${MAP_ICO}</span>` : ""}</span>`; };''','''        const box = `<button type="button" class="q-cb" data-rqk="${x.k}"${x.lock ? " disabled" : ""} aria-pressed="${x.run ? "mixed" : "false"}" aria-label="${n}: ${x.lock ? "locked" : x.run ? "in progress, mark turned in" : "not picked up, mark picked up"}" title="${x.lock ? `Unlocks when ${x.pre} is turned in` : x.run ? "In progress · click when turned in" : "Click when you pick it up"}"></button>`;
        const near = hereArea && q.zone === hereArea && !x.lock;
        const zz = !x.run && !x.lock ? `<button type="button" class="q-snz" data-snz="${x.k}" title="Not in the game yet: hide it until your next Level up" aria-label="${n} is not in the game yet">not yet</button>` : "";
        return `<span class="ql ${x.run ? "run" : x.lock ? "lock" : "new"}${fu ? " fu" : ""}${near ? " near" : ""}">${box}${label}${near ? `<span class="q-near" title="Near your story step (${hereArea})">${MAP_ICO}</span>` : ""}${zz}</span>`; };''')
open(F,'w',encoding='utf-8').write(s)
print('ok')
