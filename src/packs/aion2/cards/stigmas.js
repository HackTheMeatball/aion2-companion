/* Stigmas (0.4 P4b: moved verbatim from src/main.js; markup stigmas.html): shards to spend, the next equip or
   upgrade, Coming up, the slots' levels, the stigma pick. */
import { char } from "../../../core/state.js";
import { gatesOf } from "../../../core/requirements.js";
import { STIGMA_ICON, STIGMA_PLAN, ST_COST, ST_TARGETS } from "../data/build.js";
import { eputK } from "../catalog.js";
import { shardsFromLv, slotLevelMet, stigmaEquipOpen } from "../requirements.js";
import { stTip } from "./shared.js";
import { aion2State as state, aion2Save as save, aion2Update as update, aion2RenderNow as renderNow, aion2FitSkills as fitSkills, aion2FadeScroll as fadeScroll, aion2RewardToast as rewardToast, aion2Chime as chime, aion2StIco as stIco, aion2MainEl as mainEl, aion2STIGMA_SLOTS as STIGMA_SLOTS, aion2StPlan as stPlan, aion2StLvOf as stLvOf } from "./page.js";

/* Stigma card: the four slots from the milestones (22 / 27 / 32 / 37). Ticking "equipped" here is the same tick as the
   milestone's "Equip …" line. Slot 1 also needs "The One Who Hears the Voice" done (that's what unlocks Stigmas). */
function renderStigma() {
  const body = document.getElementById("stBody"), card = document.getElementById("stCard"); if (!body) return;
  const lv = char(state).level, slots = STIGMA_SLOTS(), ev = gatesOf(char(state)), sh = char(state).stShards || 0;
  const si = document.getElementById("stShards"); if (si && document.activeElement !== si) si.value = char(state).stShards != null ? char(state).stShards : "";
  const eqN = slots.filter(x => char(state).checks[x.k]).length, next = slots.find(x => !char(state).checks[x.k]);
  const canEquip = next && stigmaEquipOpen(char(state), next, ev);
  const plan = stPlan(), up = plan[0];
  const ico = n => `<span class="dvico st-ico${STIGMA_ICON[n] ? " art" : ""}">${stIco(n, "st-img") || n.split(" ").map(w => w[0]).join("").slice(0, 2)}</span>`;
  const bonusAt = L => [5, 10, 15, 20].find(t => t >= L);
  const toNext = up ? plan.filter(s => s.x === up.x && s.L <= bonusAt(up.L)).reduce((t, s) => t + s.cost, 0) : 0;
  let hero = "", thenRow = "";
  const fromLv0 = shardsFromLv(lv), reach = need => { for (let L = lv + 1; L <= 45; L++) if (sh + shardsFromLv(L) - fromLv0 >= need) return L; return null; };
  /* One row format for "after this" (Basic) and Coming up (Advanced): −N = shards short, counting everything above it. */
  const soonRow = (st, need) => { const ok = need <= sh, at = ok ? null : reach(need);
    return `<li title="${st.cost} shard${st.cost === 1 ? "" : "s"} · ${ok ? "shards covered" : `${need - sh} short now`}"><span class="sname">${stIco(st.x.name, "st-mini")}${st.x.name} <span class="lvarr">${st.L - 1} → ${st.L}</span></span><span class="slv${ok ? " now" : ""}">${ok ? "now" : at ? "Lv " + at : "later"}</span><span class="sst ${ok ? "ok" : "short"}">${ok ? "✓" : `−${need - sh}`}</span></li>`; };
  const learnCost = canEquip && !(char(state).stLv || {})[next.name] ? 1 : 0;
  if (canEquip) {
    /* Pick what you actually equipped in this slot (default = the plan): the planned stigmas not in earlier slots, or "Other…". */
    const taken = slots.filter(x => x.n < next.n).map(x => x.name), opts = [...new Set([...STIGMA_PLAN.filter(n => !taken.includes(n)), next.name])];
    const pick = stOther === next.n
      ? `<input class="st-other" data-stother="${next.n}" type="text" maxlength="40" placeholder="Stigma name" aria-label="Stigma you equipped in slot ${next.n}" value="${STIGMA_PLAN.includes(next.name) ? "" : next.name.replace(/"/g, "&quot;")}">`
      : `<span class="st-chg">change<select class="st-pick" data-stpick="${next.n}" aria-label="Stigma you equipped in slot ${next.n}" title="Pick the stigma you equipped">${opts.map(n => `<option${n === next.name ? " selected" : ""}>${n}</option>`).join("")}<option value="__other">Other…</option></select></span>`;
    /* Learning a stigma costs 1 shard: with none on hand the button waits (the level that brings one is shown). */
    const blocked = learnCost > sh, at1 = blocked ? reach(1) : null;
    hero = `<div class="sphero st-hero ${blocked ? "short" : "ok"}"><div class="dvhead">${ico(next.name)}<div class="dvtext"><span class="spname">${stOther === next.n ? pick : next.name}</span><small title="${next.note}">Slot ${next.n} · ${blocked ? `needs 1 shard${at1 ? ` · +1 at Lv ${at1}` : ""}` : "ready to equip"}${next.name !== next.plan ? ` · plan: ${next.plan}` : ""}${stOther === next.n ? "" : ` · ${pick}`}</small></div></div>` +
      `<div class="buyrow"><button type="button" class="dvbuy" data-sttick="${next.k}"${blocked ? " disabled" : ""}>${blocked ? "Needs 1 shard" : `Mark equipped · ${learnCost ? "−1 shard" : `slot ${next.n}`}`}</button></div></div>`;
    if (up) thenRow = soonRow(up, learnCost + up.cost);
  } else if (up) {
    const ok = sh >= up.cost, b = bonusAt(up.L);
    hero = `<div class="sphero st-hero ${ok ? "ok" : "short"}"><div class="dvhead">${ico(up.x.name)}<div class="dvtext"><span class="spname">${up.x.name} <span class="lvarr">${up.L - 1} → ${up.L}</span></span><small>${up.cost} shard${up.cost === 1 ? "" : "s"}${b ? ` · ${toNext} to the Lv ${b} bonus` : ""}</small></div></div>` +
      `<div class="buyrow">${ok ? `<button type="button" class="dvbuy" data-stup="1">Mark upgraded · ${up.cost} shard${up.cost === 1 ? "" : "s"}</button>` : `<div class="buystat">Need ${up.cost - sh} more shard${up.cost - sh === 1 ? "" : "s"} ${stTip()}</div>`}</div></div>`;
    const nx = plan[1];
    if (nx) thenRow = soonRow(nx, up.cost + nx.cost);
    else if (next) thenRow = `<li><span class="sname">${stIco(next.name, "st-mini")}${next.name}</span><span class="slv">Lv ${next.lv}</span><span class="sst"></span></li>`;
  } else if (next) {
    const shut = !slotLevelMet(ev, next);
    hero = `<div class="sphero st-hero lock"><div class="dvhead">${ico(next.name)}<div class="dvtext"><span class="spname">${next.name}</span><small>Slot ${next.n} · ${shut ? `opens Lv ${next.lv}` : "Stigmas not unlocked yet"}</small></div></div>` +
      `<div class="buyrow"><div class="buystat">${shut ? `Slot ${next.n} opens at Lv ${next.lv}` : `Finish "The One Who Hears the Voice" first`}</div></div></div>`;
  } else hero = `<div class="sphero st-hero"><div class="dvhead"><span class="dvico st-ico done-ico" aria-hidden="true">✓</span><div class="dvtext"><span class="spname">Planned upgrades done</span><small>${ST_TARGETS.map(([n, T]) => `${n} ${T}`).join(" · ")}</small></div></div></div>`;
  /* Slots (footer): equipped stigmas get − / + to match the game; the rest show when they open. */
  document.getElementById("stList").innerHTML = slots.map(x => { const on = !!char(state).checks[x.k], open = ev.byKey(x.k).open, L = stLvOf(x.name);
    return `<li class="${on ? "st-on" : ""}"><span class="sname"><span class="st-n">${x.n}</span>${stIco(x.name, "st-mini")}${x.name}</span>` +
      (on ? `<span class="st-lvctl"><button type="button" data-stlv="${x.name}" data-d="-1" aria-label="Level down">−</button><span>Lv ${L}</span><button type="button" data-stlv="${x.name}" data-d="1" aria-label="Level up">+</button></span>`
          : `<span class="slv${open ? " now" : ""}">${open ? "now" : "Lv " + x.lv}</span>`) + `</li>`; }).join("");
  const fromLv = shardsFromLv(lv); const note = document.getElementById("stLvNote"); if (note) { note.textContent = fromLv ? `${fromLv} earned from levels` : ""; note.title = `${fromLv} shard${fromLv === 1 ? "" : "s"} earned from character levels so far (1 per level from 23, 2 from 40); the number above is what you have left`; }
  /* Coming up: the upgrades after the hero, like the Skills card. "now ✓" if your shards cover it (counting the ones
     above it); otherwise the level where level-up shards would cover it, and how many you're short today. */
  const restSteps = (canEquip ? plan : plan.slice(1)).slice(0, 10);
  let cum = canEquip ? learnCost : (up ? up.cost : 0);
  /* Bar: shards in the planned stigmas so far vs the whole plan (all 4 planned stigmas: learning + each level up to its
     target; ST_TARGETS, else level 1). The total doesn't move when a slot opens. */
  const stT = n => (ST_TARGETS.find(([m]) => m === n) || [n, 1])[1], stC = T => { let c = 0; for (let L = 1; L <= T; L++) c += ST_COST(L) || 0; return c; };
  const spentNow = STIGMA_PLAN.filter(n => slots.some(x => x.name === n && char(state).checks[x.k])).reduce((t, n) => t + stC(Math.min(stT(n), stLvOf(n))), 0);
  const planTotal = STIGMA_PLAN.reduce((t, n) => t + stC(stT(n)), 0);
  const soon = restSteps.map(st => { cum += st.cost; return soonRow(st, cum); }).join("");
  const nextSlot = !canEquip && next ? `<li class="st-slotrow"><span class="sname">${stIco(next.name, "st-mini")}${next.name}</span><span class="slv" title="Stigma slot ${next.n} opens">Lv ${next.lv}</span><span class="sst"></span></li>` : "";
  body.innerHTML = `<div class="ptbig st-big"><b>${sh}</b><span>shard${sh === 1 ? "" : "s"} to spend</span></div>` + hero + (thenRow ? `<ul class="soonlist st-then">${thenRow}</ul>` : "") +
    (soon || nextSlot ? `<div id="stAfter"><div class="dvbh"><div class="dvbh-top"><span class="dvbh-k">Coming up</span><span class="dvbh-n">${spentNow} of ${planTotal} spent</span></div><span class="dvbh-bar"><span style="width:${planTotal ? spentNow / planTotal * 100 : 0}%"></span></span></div><ul class="soonlist" id="stSoon">${nextSlot}${soon}</ul></div>` : "");
  card.classList.toggle("act", (!!canEquip && learnCost <= sh) || (!canEquip && !!up && sh >= up.cost));
  fadeScroll(document.getElementById("stSoon"));
}
function stTickClick(e) { const b = e.target.closest && e.target.closest("[data-sttick]"); if (!b) return;
  const k = b.dataset.sttick, slot = STIGMA_SLOTS().find(x => x.k === k);
  /* Learning a stigma is its level 1: 1 shard (one source). Shown on the button and in a toast you can undo. */
  if (slot) { char(state).stPick = char(state).stPick || {}; char(state).stPick[slot.n] = slot.name; char(state).stLv = char(state).stLv || {};
    if (!char(state).stLv[slot.name]) { char(state).stLv[slot.name] = 1;
      if ((char(state).stShards || 0) > 0) { char(state).stShards--; rewardToast(`Learned ${slot.name} · −1 shard`, () => { char(state).stShards = (char(state).stShards || 0) + 1; save(); update(); }); } } }
  const ek = slot && eputK(slot.n); if (ek) char(state).checks[ek] = true;
  const src = mainEl.querySelector(`input[data-k="${CSS.escape(k)}"]`);
  if (src) { if (!src.checked) src.click(); else { save(); update(); } } else { char(state).checks[k] = true; save(); update(); } }
function stUpClick(e) { const b = e.target.closest && e.target.closest("[data-stup]"); if (!b) return;
  const up = stPlan()[0]; if (!up || (char(state).stShards || 0) < up.cost) return;
  char(state).stLv = char(state).stLv || {}; char(state).stLv[up.x.name] = up.L; char(state).stShards = (char(state).stShards || 0) - up.cost;
  if (state.sound !== false) chime(); save(); update(); }
function stLvClick(e) { const b = e.target.closest && e.target.closest("[data-stlv]"); if (!b) return;
  char(state).stLv = char(state).stLv || {}; const n = b.dataset.stlv; char(state).stLv[n] = Math.max(1, Math.min(25, stLvOf(n) + (+b.dataset.d))); save(); update(); }
/* Stigma pick (Stigmas card): which stigma went into the slot you're about to mark equipped. */
let stOther = 0; /* slot whose "Other…" name field is open */
function stPickChange(e) { const p = e.target.closest && e.target.closest("[data-stpick]"); if (!p) return;
  if (p.value === "__other") { stOther = +p.dataset.stpick; renderStigma(); const f = document.querySelector("#stCard [data-stother]"); if (f) f.focus(); return; }
  char(state).stPick = char(state).stPick || {}; char(state).stPick[p.dataset.stpick] = p.value; save(); update(); }
/* "Other…": a stigma off the plan, typed in; Enter or leaving the field saves it, Escape or an empty field cancels. */
function stOtherDone(f, keep) { if (!f || !f.isConnected) return; const v = f.value.trim().replace(/\s+/g, " "), n = +f.dataset.stother; stOther = 0;
  if (keep && v) { char(state).stPick = char(state).stPick || {}; char(state).stPick[n] = v; save(); update(); } else renderStigma(); }
/* the card's buttons, the pick, the shards box (from render(), once; the Next up pop-out adds the click handlers to
   its own document) */
function aion2StigmasMount() {
  document.addEventListener("keydown", e => { const f = e.target.closest && e.target.closest("[data-stother]"); if (!f) return; if (e.key === "Enter") { e.preventDefault(); stOtherDone(f, true); } else if (e.key === "Escape") stOtherDone(f, false); });
  document.addEventListener("focusout", e => { const f = e.target.closest && e.target.closest("[data-stother]"); if (f) setTimeout(() => stOtherDone(f, true), 0); });
  [stTickClick, stUpClick, stLvClick].forEach(f => document.addEventListener("click", f));
  document.addEventListener("change", stPickChange);
  document.getElementById("stShards").addEventListener("input", e => { char(state).stShards = Math.max(0, parseInt(e.target.value, 10) || 0); save(); renderStigma(); renderNow(); fitSkills(); });
}

const aion2StigmasCard = { id: "stigmas", slot: "top", order: 400, root: "stCard", mount: aion2StigmasMount, update: () => renderStigma() };
export { renderStigma, stTickClick, stUpClick, stLvClick, aion2StigmasCard };
