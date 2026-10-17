/* Skills (0.4 P4b: moved verbatim from src/main.js; markup skills.html): points to spend, the next upgrade, Coming
   up, Sync levels. renderNext still draws the cards it drew before (Progress, Build drawer, Journey, Daevanion; P0 §4
   "Calls between cards"). */
import { char } from "../../../core/state.js";
import { ITEMS } from "../data/items.js";
import { LEVEL_POINTS, SP_ICONS, SP_SKILLS, SP_STEPS } from "../data/build.js";
import { spCostTxt } from "../catalog.js";
import { planReachOf, skillBuy, skillLvOf, skillOpen, skillPoints } from "../requirements.js";
import { tipPop } from "./shared.js";
import { renderCollection } from "./progress.js";
import { renderRotation } from "./build.js";
import { renderDaevanion } from "./daevanion.js";
import { aion2State as state, aion2Save as save, aion2Update as update, aion2Render as render, aion2RenderNow as renderNow, aion2RenderQuest as renderQuest, aion2RenderAscension as renderAscension, aion2RenderStoryChips as renderStoryChips, aion2RenderStoryReqs as renderStoryReqs, aion2FitSkills as fitSkills, aion2SpMini as spMini, aion2Ini as ini, aion2SpecSub as specSub, aion2MainEl as mainEl } from "./page.js";

function renderNext() {
  renderCollection();
  renderRotation();
  renderQuest(true);
  renderAscension();
  renderStoryChips();
  renderStoryReqs();
  const lv = char(state).level;
  /* Open upgrades in the milestones' order and the points to spend (src/core/requirements.js). */
  const { open, now } = skillOpen(char(state), lv), { fromLevels, stones, spent, pts } = skillPoints(char(state), lv);
  const box = document.getElementById("spNextBox");
  const next = now[0];
  const overTicked = spent > fromLevels + stones;
  const ahead = open.filter(x => !now.includes(x)).sort((a, b) => a.req - b.req || a.rank - b.rank);
  /* Hero = what to do next: the next upgrade you can take now, else the next one to unlock (never a specialty slot the plan
     can't reach, such as slot 3: Q5). */
  const hero = next || ahead.find(x => !x.spec || planReachOf(x) >= x.slotLv);
  const nowCost = now.reduce((t, y) => t + (y.spec ? 0 : y.cost), 0);
  /* Points you'll have when x unlocks: spare now (after buying what's open) + level points gained by then. */
  const haveAt = x => pts - (next ? nowCost : 0) + (LEVEL_POINTS[Math.min(45, x.req)] || 0) - fromLevels;
  let heroHTML = "";
  if (hero) {
    const locked = !now.includes(hero), cost = hero.spec ? 0 : hero.cost;
    const have = locked ? haveAt(hero) + (next ? 0 : 0) : pts;
    const ok = !locked && (hero.spec || pts >= cost);
    const state_ = hero.spec ? (locked ? "lock" : "ok") : locked ? (have >= cost ? "lock" : "short") : ok ? "ok" : "short";
    const sub = hero.spec ? specSub(hero) :
      `${locked ? `Lv ${hero.req}` : "Available now"} · <span class="nw">priority #${hero.rank + 1}</span>${hero.s.single ? ` · single source (${hero.s.single})` : ""}`;
    const btn = hero.spec ? (locked ? `Opens at skill Lv ${hero.slotLv} · yours: ${skillLvOf(char(state), hero)}` : "Mark specialty picked") :
      ok ? `Mark spent · ${spCostTxt(hero)}` : locked ? (have >= cost ? `All Lv ${lv} spent · next at Lv ${hero.req}` : `Lv ${hero.req} · need ${cost - have} more pts`) : `Need ${cost - pts} more pts`;
    const pct = hero.spec ? (locked ? 0 : 100) : Math.min(100, Math.max(0, pts / cost * 100));
    heroHTML = `<div class="sphero ${state_}${hero.spec ? " spec" : ""}">` +
      `<div class="dvhead">${SP_ICONS[hero.s.n] ? `<span class="dvico spico art"><img src="${SP_ICONS[hero.s.n]}" alt="" loading="lazy" onerror="this.remove()"></span>` : `<span class="dvico spico ini" aria-hidden="true">${ini(hero.s.n)}</span>`}` +
      `<div class="dvtext"><span class="spname">${hero.s.n} ${spType(hero.s)} ${hero.spec ? `<em>specialty${hero.slot > 1 ? " " + hero.slot : ""}</em>` :`<span class="lvarr">${hero.L - 1} → ${hero.L}</span>`}</span><small title="${sub.replace(/<[^>]+>/g, "")}">${sub}</small>` +
      (hero.spec || locked ? `<span class="dvbar-ph"></span>` : `<div class="dvbar"><div class="dvtrack"><span style="width:${pct}%"></span></div><span class="dvbar-l" title="You have ${pts} point${pts === 1 ? "" : "s"}; this upgrade costs ${cost}"><b>${Math.min(pts, cost)}</b> of ${cost} pt${cost === 1 ? "" : "s"}</span></div>`) + `</div></div>` +
      `<div class="buyrow">${ok ? `<button type="button" class="dvbuy" id="spBuy">${btn}</button>` : `<div class="buystat">${btn}${tipPop("stones")}</div>`}</div>` +

      (next && now.length > 1 ? (() => { /* after this one: how many of the next open upgrades (in order) the points left cover */
        let left = pts - (next.spec ? 0 : next.cost), k = 0; now.slice(1).some(y => { const c = y.spec ? 0 : y.cost; if (c > left) return true; left -= c; k++; return false; });
        return `<p class="sphint">${k ? `+${k} more your points cover` : `${now.length - 1} more unlocked · ${Math.max(0, left)} pt${left === 1 ? "" : "s"} left`}</p>`; })() : "") +
      (overTicked ? `<p class="sphint warn">Ticked lines cost ${spent} but you've earned ${fromLevels + stones}. Use "Sync levels" to fix.</p>` : "") +
      `</div>`;
  } else heroHTML = `<div class="sphero ok spdone"><div class="dvhead"><span class="dvico spico"><img src="${ITEMS.wisdom[2]}" alt="" loading="lazy" onerror="this.remove()"></span>` +
      `<div class="dvtext"><span class="spname">All planned upgrades spent</span><small>${pts} point${pts === 1 ? "" : "s"} spare · no sourced plan past this — spend on skills you use</small></div></div>` +
      (overTicked ? `<p class="sphint warn">Ticked lines cost ${spent} but you've earned ${fromLevels + stones}. Use "Sync levels" to fix.</p>` : "") + `</div>`;
  box.checked = false; box.dataset.sp = (skillBuy(char(state), lv) || {}).k || "";
  document.getElementById("spHero").innerHTML = heroHTML;
  /* Coming up: everything after the hero, as many rows as fit the card (trimmed in fitSkills). */
  const rest = (next ? [...now.slice(1), ...ahead] : ahead.filter(x => x !== hero)).slice(0, 10);
  let cum = next ? 0 : (hero && !hero.spec ? hero.cost : 0);
  /* "N of M spent" counts SP_STEPS only, on purpose: slots 2 / 3 (SP_SLOTS) cost no points and slot 3 is out of reach (Q5),
     so counting them would keep the bar short of full at Lv 45 and change 0.2's count */
  const spB = SP_STEPS.filter(x => char(state).checks[x.k]).length, spN = SP_STEPS.length;
  document.getElementById("spAfter").innerHTML = rest.length ? `<div class="dvbh"><div class="dvbh-top"><span class="dvbh-k">Coming up</span><span class="dvbh-n">${spB} of ${spN} spent</span></div><span class="dvbh-bar"><span style="width:${spB / spN * 100}%"></span></span></div><ul class="soonlist" id="spSoon">` + rest.map(x => {
    cum += x.spec ? 0 : x.cost;
    const avail = now.includes(x), have = avail ? pts - (next ? next.cost : 0) : haveAt(x), short = cum - have;
    /* a specialty slot waits for a skill level, not a character level, and is free (never short of points, so an empty
       status like the Stigmas card's slot row, not the green "points covered" ✓); slot 3 is past what points and plan nodes reach (Q5) */
    if (x.spec) return `<li class="isspec" title="Specialty slot ${x.slot}: ${specSub(x).replace(/<[^>]+>/g, "")} · ${avail ? "available now" : `at skill Lv ${x.slotLv} (yours: ${skillLvOf(char(state), x)})`}${planReachOf(x) < x.slotLv ? ` · the plan's skill points and board nodes reach skill Lv ${planReachOf(x)}` : ""}">` +
      `<span class="sname">${spMini(x.s.n)}${x.s.n} ${spType(x.s)} <span class="spectag">${x.slot > 1 ? "slot " + x.slot : "spec"}</span></span><span class="slv${avail ? " now" : ""}">${avail ? "now" : "skill " + x.slotLv}</span><span class="sst"></span></li>`;
    return `<li title="${spCostTxt(x)} · ${avail ? "available now" : "Lv " + x.req} · ${short > 0 ? `${short} short by then` : "points covered"}${x.s.single ? ` · single source (${x.s.single})` : ""}"><span class="sname">${spMini(x.s.n)}${x.s.n} ${spType(x.s)} <span class="lvarr">${x.L - 1} → ${x.L}</span></span><span class="slv${avail ? " now" : ""}">${avail ? "now" : "Lv " + x.req}</span><span class="sst ${short > 0 ? "short" : "ok"}">${short > 0 ? `−${short}` : "✓"}</span></li>`;
  }).join("") + `</ul>` : "";
  const ptsIn = document.getElementById("spPts");
  if (document.activeElement !== ptsIn) ptsIn.value = stones;
  document.getElementById("spLv").textContent = `${fromLevels} earned from levels`;
  document.getElementById("spLv").title = `${fromLevels + stones} earned = ${fromLevels} from levels + ${stones} from Wisdom Stones; ${spent} spent`;
  document.getElementById("spBig").innerHTML = `<b>${pts}</b><span>pt${pts === 1 ? "" : "s"} to spend</span>`;
  document.getElementById("spCard").classList.toggle("act", !!next && (next.spec || pts >= next.cost));
  requestAnimationFrame(fitSkills);
  renderDaevanion();
}
/* Active / Passive tag (0.2.7): skills.json "type" via the compiled s.passive flag; text, not colour only */
const spType = s => `<span class="sptype">${s.passive ? "Passive" : "Active"}</span>`;
/* Sync levels, the stones box, the hero's button (from render(), once) */
function aion2SkillsMount() {
  /* Sync: set each plan skill's level from the game; ticks lines up to that level and unticks the rest.
     Specialty picks are left as they are. Points are not changed (the game's own counter is the truth). */
  const syncGrid = document.getElementById("syncGrid");
  syncGrid.innerHTML = SP_SKILLS.map((s, i) => `<label for="sync${i}">${s.n}<input id="sync${i}" type="number" min="1" max="10" inputmode="numeric"></label>`).join("");
  document.getElementById("syncBox").addEventListener("toggle", e => {
    if (!e.target.open) return;
    SP_SKILLS.forEach((s, i) => {
      let lvl = 1;
      for (let L = 2; L <= 10; L++) if (char(state).checks[`sp:${s.n}:${L}`]) lvl = L;
      document.getElementById("sync" + i).value = lvl;
    });
    document.getElementById("syncMsg").textContent = "";
  });
  document.getElementById("syncApply").addEventListener("click", () => {
    let changed = 0;
    SP_SKILLS.forEach((s, i) => {
      const v = parseInt(document.getElementById("sync" + i).value, 10);
      if (!Number.isFinite(v)) return;
      for (let L = 2; L <= 10; L++) {
        const k = `sp:${s.n}:${L}`, want = L <= v;
        if (!!char(state).checks[k] !== want) { char(state).checks[k] = want; changed++; }
      }
    });
    save(); render(); update();
    document.getElementById("syncMsg").textContent = changed ? `Updated ${changed} line${changed === 1 ? "" : "s"}.` : "Already matched.";
  });
  document.getElementById("spPts").addEventListener("input", e => {
    const v = e.target.value.trim();
    char(state).stones = Math.max(0, parseInt(v, 10) || 0);
    save(); renderNext(); renderNow(); fitSkills();
  });
  /* Skills hero button: ticks the next upgrade (same path as its checkbox in the milestones). */
  document.getElementById("spHero").addEventListener("click", e => {
    const b = e.target.closest("#spBuy"); if (!b || b.disabled) return;
    const box = document.getElementById("spNextBox"); if (!box.dataset.sp) return;
    box.checked = true; box.dispatchEvent(new Event("change"));
  });
  document.getElementById("spNextBox").addEventListener("change", e => {
    const k = e.target.dataset.sp; if (!k || !e.target.checked) return;
    char(state).checks[k] = true; save();
    const cb = mainEl.querySelector(`input[data-k="${k}"]`); if (cb) cb.checked = true;
    update();
  });
}

const aion2SkillsCard = { id: "skills", slot: "top", order: 100, root: "spCard", mount: aion2SkillsMount, update: () => renderNext() };
export { renderNext, aion2SkillsCard };
