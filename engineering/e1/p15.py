F='assassin-route.html'
s=open(F,encoding='utf-8').read()
def once(old,new):
    global s
    c=s.count(old); assert c==1,(c,old[:90]); s=s.replace(old,new)
once('''const STIGMA_SLOTS = () => GATES.filter(g => /^Stigma slot \\d/.test(g.title)).map((g, n) => {
  const j = g.items.findIndex(it => /<b>Equip [^<]+<\\/b>/.test(it.t || "")); if (j < 0) return null;
  const it = g.items[j], name = it.t.match(/<b>Equip ([^.<]+)\\.?<\\/b>/)[1];
  return { n: n + 1, lv: g.lv, gid: g.id, k: it.k || g.id + ":" + j, name, note: it.t.replace(/<b>[^<]*<\\/b>\\s*/, "").replace(/<[^>]+>/g, "") };
}).filter(Boolean);''','''const STIGMA_SLOTS = () => { const names = stNames();
  return GATES.flatMap(g => g.items.filter(it => it.stig).map(it => ({ n: it.stig, lv: g.lv, gid: g.id, k: it.k, name: names[it.stig - 1], plan: STIGMA_PLAN[it.stig - 1],
    note: it.t.replace(/<b>.*?<\\/b>\\s*/, "").replace(/<[^>]+>/g, "") }))).sort((a, b) => a.n - b.n); };
/* E row a slot's stigma goes to when added (stigmas in slots up to n, in E_ORDER), and who moves down. */
const eRowOf = n => { const sl = STIGMA_SLOTS(), cur = sl.filter(x => x.n <= n).map(x => x.name), nm = sl[n - 1].name, order = E_ORDER.filter(x => cur.includes(x)), r = order.indexOf(nm); return { r, below: order.slice(r + 1) }; };
/* Milestone text follows the picks: stigma names, E rows, and the full-rotation line at slot 4. */
function fillStigmaText() {
  const names = stNames();
  mainEl.querySelectorAll(".stn[data-slot]").forEach(x => { x.textContent = names[x.dataset.slot - 1]; });
  mainEl.querySelectorAll(".erow[data-slot]").forEach(x => { const { r, below } = eRowOf(+x.dataset.slot); x.textContent = `, row ${r}${below.length ? ` (${below.join(", ")} move${below.length === 1 ? "s" : ""} down one)` : ""}`; });
  const e = E_ORDER.filter(x => names.includes(x)), pre = e.filter(n => n === "Illusive Clone" || n === "Swift Contract"), post = e.filter(n => !pre.includes(n));
  mainEl.querySelectorAll(".rotseq").forEach(x => { x.innerHTML = seq([pre.length ? "E: " + pre.join(" + ") : "", "Q: Shadowstrike", post.length ? "E: " + post.join(", ") : "", "Hold both mouse buttons"].filter(Boolean)); });
}''')
once('''const E_STACK_LV = lv => [[27, "Illusive Clone*"], [37, "Swift Contract*"], [22, "Triniel's Dagger*"], [32, "Savage Fang*"]].filter(([l]) => lv >= l).map(([, n]) => n);''','''const E_STACK_LV = lv => { const sl = STIGMA_SLOTS().filter(x => lv >= x.lv).map(x => x.name); return E_ORDER.filter(n => sl.includes(n)).map(n => n + "*"); };''')
# hero: pick select when ready to equip
once('''  if (canEquip) {
    hero = `<div class="sphero st-hero ok"><div class="dvhead">${ico(next.name)}<div class="dvtext"><span class="spname">${next.name}</span><small title="${next.note}">Slot ${next.n} · ready to equip</small></div></div>` +
      `<div class="buyrow"><button type="button" class="dvbuy" data-sttick="${next.k}">Mark equipped · slot ${next.n}</button></div></div>`;''','''  if (canEquip) {
    /* Pick what you actually equipped in this slot (default = the plan); stigmas already in earlier slots aren't offered. */
    const taken = slots.filter(x => x.n < next.n).map(x => x.name), opts = STIGMA_PLAN.filter(n => !taken.includes(n));
    const pick = `<select class="st-pick" data-stpick="${next.n}" aria-label="Stigma you equipped in slot ${next.n}" title="Pick the stigma you equipped">${opts.map(n => `<option${n === next.name ? " selected" : ""}>${n}</option>`).join("")}</select>`;
    const learn = !(state.stLv || {})[next.name] && sh > 0;
    hero = `<div class="sphero st-hero ok"><div class="dvhead">${ico(next.name)}<div class="dvtext"><span class="spname">${pick}</span><small title="${next.note}">Slot ${next.n} · ready to equip${next.name !== next.plan ? ` · plan: ${next.plan}` : ""}</small></div></div>` +
      `<div class="buyrow"><button type="button" class="dvbuy" data-sttick="${next.k}">Mark equipped · ${learn ? "−1 shard" : `slot ${next.n}`}</button></div></div>`;''')
once('''function stTickClick(e) { const b = e.target.closest && e.target.closest("[data-sttick]"); if (!b) return;
  const k = b.dataset.sttick, slot = STIGMA_SLOTS().find(x => x.k === k);
  /* Learning a stigma is its level 1: 1 shard. */
  if (slot) { state.stLv = state.stLv || {}; if (!state.stLv[slot.name]) { state.stLv[slot.name] = 1; if ((state.stShards || 0) > 0) state.stShards--; } }''','''function stTickClick(e) { const b = e.target.closest && e.target.closest("[data-sttick]"); if (!b) return;
  const k = b.dataset.sttick, slot = STIGMA_SLOTS().find(x => x.k === k);
  /* Learning a stigma is its level 1: 1 shard (one source). Shown on the button and in a toast you can undo. */
  if (slot) { state.stPick = state.stPick || {}; state.stPick[slot.n] = slot.name; state.stLv = state.stLv || {};
    if (!state.stLv[slot.name]) { state.stLv[slot.name] = 1;
      if ((state.stShards || 0) > 0) { state.stShards--; rewardToast(`Learned ${slot.name} · −1 shard`, () => { state.stShards = (state.stShards || 0) + 1; save(); update(); }); } } }''')
once('''[stTickClick, stUpClick, stLvClick].forEach(f => document.addEventListener("click", f));''','''/* Stigma pick (Stigmas card): which stigma went into the slot you're about to mark equipped. */
function stPickChange(e) { const p = e.target.closest && e.target.closest("[data-stpick]"); if (!p) return;
  state.stPick = state.stPick || {}; state.stPick[p.dataset.stpick] = p.value; save(); update(); }
[stTickClick, stUpClick, stLvClick].forEach(f => document.addEventListener("click", f));
document.addEventListener("change", stPickChange);''')
# rewardToast with undo
once('''function rewardToast(msg) {
  let t = document.getElementById("rwToast"); if (!t) { t = document.createElement("div"); t.id = "rwToast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.remove("show"); void t.offsetWidth; t.classList.add("show");
}''','''function rewardToast(msg, undo) {
  let t = document.getElementById("rwToast"); if (!t) { t = document.createElement("div"); t.id = "rwToast"; t.setAttribute("role", "status"); document.body.appendChild(t);
    t.addEventListener("animationend", () => { t.classList.remove("has-undo"); t.innerHTML = ""; }); }
  t.textContent = msg; t.classList.toggle("has-undo", !!undo);
  if (undo) { const b = document.createElement("button"); b.type = "button"; b.className = "tu"; b.textContent = "Undo"; b.addEventListener("click", () => { t.classList.remove("show", "has-undo"); t.innerHTML = ""; undo(); }, { once: true }); t.appendChild(b); }
  t.classList.remove("show"); void t.offsetWidth; t.classList.add("show");
}''')
open(F,'w',encoding='utf-8').write(s); print('ok')
