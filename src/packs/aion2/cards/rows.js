/* The AION 2 rows of the milestone and Route rules cards (0.4 P5b; moved from src/cards/milestones.js, behaviour
   unchanged). The engine card draws a milestone and its plain rows; the pack object hands it these
   (docs/design/0.4-engine-contract.md §2):
     aion2RowRenderers (rowRenderers): regional quest rows and their headings ("quest": the snooze and "In my game"
       buttons), plain rows with a Sealed Dungeon entrance pin ("item": the Metabot map link). Each returns the whole <li>,
       built with the engine's row (ctx.row) and its own classes and buttons.
     aion2RowHooks (rowHooks): what the engine card calls for them: text (stigma names, E rows and the rotation line follow
       the picks), sync (regional quests in progress, "Not in game yet", what still blocks them), ticked (a box changed:
       follow-up snoozes, "Put … on E", Cube rewards, the board node undo), click (the quest boxes and buttons), snooze
       and turnedIn (Next up's quest buttons). */
import { char } from "../../../core/state.js";
import { itemByK } from "../../../core/catalog.js";
import { chainsOn, qProgOf } from "../../../core/requirements.js";
import { capFirst } from "../../../cards/nextup.js";
import { MAP_ICO } from "../../../cards/milestones.js";
import { GATES } from "../data/milestones.js";
import { E_ORDER } from "../data/build.js";
import { seq } from "../data/markup.js";
import { CLEAR_REWARD, RQ_K, eputK } from "../catalog.js";
import { rqReqOf, slotNames } from "../requirements.js";
import { aion2DungeonMap } from "./maps.js";
import { aion2State as state, aion2Save as save, aion2Update as update, aion2MainEl as mainEl, aion2RewardToast as rewardToast, aion2STIGMA_SLOTS as STIGMA_SLOTS, aion2RqAvail as rqAvail } from "./page.js";

/* Regional quests track like dungeons: first click on the box = in progress (char(state).started), second = completed.
   Clicking a completed one undoes it. In progress doesn't count toward the milestone. */
function aion2QuestSync() {
  mainEl.querySelectorAll("#gates li.qrow input[data-k]").forEach(i => {
    const k = i.dataset.k, dv = "derived" in i.dataset, done = !!char(state).checks[k] || dv, run = !done && qProgOf(char(state), k) > 0, li = i.closest("li");
    li.classList.toggle("running", run); i.indeterminate = run;
    if (!dv) i.title = done ? "Completed · click to undo" : run ? "In progress · click when turned in" : "Click when you take the quest; click again when turned in";
    const txt = li.querySelector(".txt"); let tag = txt && txt.querySelector(":scope > .run-tag");
    if (run && txt && !tag) { tag = document.createElement("span"); tag.className = "run-tag"; tag.textContent = "In progress"; const b = txt.querySelector("b"); b ? b.after(tag) : txt.prepend(tag); }
    if (!run && tag) tag.remove();
    /* "Not in game yet": only for a quest you haven't picked up; pressed = snoozed until your next Level up. */
    const zb = li.querySelector(":scope > .q-snz"), zz = !!(char(state).rqSnooze || {})[k], it = itemByK(k), shut = !done && !run && !!it && !rqAvail(it.q).ok;
    li.classList.toggle("locked", shut);
    if (zb) { zb.hidden = done || run || shut; zb.setAttribute("aria-pressed", String(zz)); zb.textContent = zz ? "Not in game yet · undo" : "Not in game yet"; }
    /* Locked by the guide's data but already offered in your game: one click marks it picked up (same as its box). */
    const ib = li.querySelector(":scope > .q-inl"); if (ib) ib.hidden = !shut;
    /* What opens it only matters while it isn't picked up. E6: what still blocks it, from the evaluator (design §4), in
       place of the static "Opens …" list; nothing once it is open. */
    const rr = li.querySelector(".rq-req");
    if (rr && chainsOn()) { const why = done || run ? "" : rqReqOf(char(state), k); rr.innerHTML = why ? `<br>${capFirst(why)}` : ""; rr.hidden = !why; }
    else if (rr) rr.hidden = done || run;
    li.classList.toggle("snoozed", zz && !done && !run);
  });
}
/* Snooze a regional quest the guide shows as available but the game doesn't (char(state).rqSnooze[key] = level it was set at).
   Cleared by Level up (setLevel) or by turning in the quest it follows (aion2QuestTurnedIn). */
function aion2Snooze(k) {
  char(state).rqSnooze = char(state).rqSnooze || {};
  if (char(state).rqSnooze[k]) delete char(state).rqSnooze[k]; else char(state).rqSnooze[k] = char(state).level;
  save(); update();
}
/* Turning in a regional quest clears the "Not in game yet" snoozes of the quests that follow it. */
function aion2QuestTurnedIn(k) {
  const it = char(state).rqSnooze && RQ_K(k); if (!it) return;
  GATES.forEach(g => g.items.forEach(x => { if (x.kind === "quest" && x.q.after.includes(it.name)) delete char(state).rqSnooze[x.k]; }));
}
/* A box changed (k, now ticked or not, was it ticked), before the engine stores it and redraws. */
function aion2RowTicked(k, on, was) {
  if (on) aion2QuestTurnedIn(k);
  /* Equipping a stigma slot (milestone row, Stigmas card or Next up) also puts it on E. */
  if (on) { const it = itemByK(k), ek = it && it.stig && eputK(it.stig); if (ek) char(state).checks[ek] = true; }
  const rw = was !== on && CLEAR_REWARD(k);
  if (rw) { const d = on ? 1 : -1;
    /* Rewards wait in "the Cube" until you say you've used them; unticking takes from what's waiting first, then from the totals. */
    const c = char(state), take = (pk, tk, n) => { c[pk] = (c[pk] || 0) + d * n; if (c[pk] < 0) { c[tk] = Math.max(0, (c[tk] || 0) + c[pk]); c[pk] = 0; } };
    take("pendSt", "stones", rw.st); take("pendCr", "dvTotal", rw.cr);
    rewardToast(d > 0 ? `+${rw.st} Wisdom Stone${rw.st > 1 ? "s" : ""} · +${rw.cr} crystal${rw.cr > 1 ? "s" : ""} waiting in your Cube` : `−${rw.st} stone${rw.st > 1 ? "s" : ""} · −${rw.cr} crystal${rw.cr > 1 ? "s" : ""} taken back`); }
  if (k.startsWith("dv:")) { if (on) { char(state).dvLast = k; char(state).dvLastAt = Date.now(); } else if (char(state).dvLast === k) delete char(state).dvLast; }
}
/* Clicks in the milestone list (capture phase): the quest buttons, and a quest box's first click = picked up. */
function aion2RowClick(e) {
  const zb = e.target.closest && e.target.closest("li.qrow [data-snz]"); if (zb) { e.preventDefault(); aion2Snooze(zb.dataset.snz); return; }
  const ig = e.target.closest && e.target.closest("li.qrow [data-ingame]"); if (ig) { e.preventDefault(); const k = ig.dataset.ingame; char(state).started = char(state).started || {}; if (!char(state).checks[k]) { char(state).started[k] = 1; if (char(state).rqSnooze) delete char(state).rqSnooze[k]; save(); update(); } return; }
  const i = e.target.closest && e.target.closest("li.qrow input[data-k]"); if (!i) return;
  const k = i.dataset.k; char(state).started = char(state).started || {};
  if (!char(state).checks[k] && !qProgOf(char(state), k)) { e.preventDefault(); char(state).started[k] = 1; save(); update(); return; }
  delete char(state).started[k];
}
/* E row a slot's stigma goes to when added (stigmas in slots up to n, in E_ORDER), and who moves down. */
const eRowOf = n => { const sl = STIGMA_SLOTS(), cur = sl.filter(x => x.n <= n).map(x => x.name), nm = sl[n - 1].name, order = E_ORDER.filter(x => cur.includes(x)), r = order.indexOf(nm); return { r, below: order.slice(r + 1) }; };
/* Milestone text follows the picks: stigma names, E rows, and the full-rotation line at slot 4. */
function aion2RowText() {
  const names = slotNames(char(state));
  mainEl.querySelectorAll(".stn[data-slot]").forEach(x => { x.textContent = names[x.dataset.slot - 1]; });
  mainEl.querySelectorAll(".erow[data-slot]").forEach(x => { const { r, below } = eRowOf(+x.dataset.slot); x.textContent = r < 0 ? "" : `, row ${r}${below.length ? ` (${below.join(", ")} move${below.length === 1 ? "s" : ""} down one)` : ""}`; });
  const e = E_ORDER.filter(x => names.includes(x)), pre = e.filter(n => n === "Illusive Clone" || n === "Swift Contract"), post = e.filter(n => !pre.includes(n));
  mainEl.querySelectorAll(".rotseq").forEach(x => { x.innerHTML = seq([pre.length ? "E: " + pre.join(" + ") : "", "Q: Shadowstrike", post.length ? "E: " + post.join(", ") : "", "Hold both mouse buttons"].filter(Boolean)); });
}

export const aion2RowRenderers = {
  /* a regional quest (picked up / turned in, "Not in game yet", "In my game") and the heading above them */
  quest: (it, k, ctx) => it.sub ? ctx.row({ pre: " rq" }) : ctx.row({ pre: " qrow", post: `<button type="button" class="q-snz" data-snz="${k}" aria-pressed="false" title="The game doesn't offer this quest yet: hide it from Next up until your next Level up">Not in game yet</button><button type="button" class="q-inl" data-ingame="${k}" hidden title="The game already offers it: mark it picked up (same as clicking its box)">In my game</button>` }),
  /* a plain row; one that names a Sealed Dungeon entrance gets its pin on the Metabot map */
  item: (it, k, ctx) => it.map ? ctx.row({ cls: " has-map", post: `<a class="amap" href="${aion2DungeonMap(it.map)}" target="_blank" rel="noopener" title="Show the entrance on the Altgard interactive map (Metabot)">${MAP_ICO}</a>` }) : ctx.row(),
};
export const aion2RowHooks = { text: aion2RowText, sync: aion2QuestSync, ticked: aion2RowTicked, click: aion2RowClick, snooze: aion2Snooze, turnedIn: aion2QuestTurnedIn };
