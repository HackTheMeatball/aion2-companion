/* The AION 2 Next up kinds (0.4 P5a, docs/design/0.4-engine-contract.md §2 `nowRenderers`; moved verbatim from
   src/cards/nextup.js and src/cards/ahead.js). The engine's Next up card lays out every card (icon, title, subline, the
   act button, Basic / Advanced, the cap, the pop-out) and draws its own kinds (milestone steps, the story card, the
   milestone Later card); for a card whose kind is listed here it calls the pack's renderer, which returns the same view
   object nowCard returns (ico, t, sub, btn, act, tag, bar, info, extra, later, done, queue; html in the strings).

   Keys with a dot are hooks of the engine cards, not card kinds:
   - story.meanwhile(m, ctx) → html: the story card's "Meanwhile" list (m = the pack's story.meanwhile object)
   - story.where(card, ctx) → html: where the story card's objectives send you, or ""
   - story.row(card, ctx) → html: a row inside the story card under its text, above its action (the "Bind X" row), or ""
   - now.act(act, ctx) → true when handled: a data-now action (called before the engine's; false = the engine goes on)
   - now.click(e, ctx) → true when handled: a click on the pack's own controls inside Next up (the regional quests list)
   - now.toggle(e): a toggle event inside Next up (the "+N waiting on the story" fold)
   - now.docClicks() → [handler]: the pack's document-level click handlers the pop-out window needs too
   - skill.slot(x) → html: a specialty slot's line (the shell hands src/cards/nextup.js's specSub to the Skills card)
   - ahead.cap(lv) → html: the Later list's last row at the level cap, or "" */
import { char } from "../../../core/state.js";
import { chainsOn, openOf } from "../../../core/requirements.js";
import { MAP_ICO, rqTicked, snoozeToggle } from "../../../cards/milestones.js";
import { capFirst, isBasic } from "../../../cards/nextup.js";
import { pageState as state, pageSave as save, pageUpdate as update, pageMainEl as mainEl, pageSMOOTH as SMOOTH, pageSD_RW as SD_RW, pageSH_REWARD as SH_REWARD, pageNO_AREA as NO_AREA, pageSpCostTxt as spCostTxt, pageRqReqOf as rqReqOf, pageSpecPickOf as specPickOf, pageMapFocus as mapFocus, pageAion2QuestMap as aion2QuestMap, pageGoAreas as goAreas, pageCubeClick as cubeClick, pageStTickClick as stTickClick, pageStUpClick as stUpClick, pageStLvClick as stLvClick, pageSpMini as spMini, pageStIco as stIco, pageDvShort as dvShort, pageQProg as qProg } from "../../../cards/page.js";

/* "Not in game yet" in Next up (compact): eye with a slash. */
const EYE_OFF = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7c2 0 3.7.7 5.1 1.6M22 12s-3.6 7-10 7c-2 0-3.7-.7-5.1-1.6"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/></svg>`;
/* XP in regional quest tooltips (dungeon XP isn't shown: only a few pages state it). */
const fmtXP = n => n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : n >= 1000 ? Math.round(n / 1000) + "k" : String(n);
const pinLink = (href, label) => href ? ` <a class="ns-pin" href="${href}" target="_blank" rel="noopener" title="${label || "Show on the map"}">${MAP_ICO}</a>` : "";
const away = L => { const lv = char(state).level; return `${L - lv} level${L - lv === 1 ? "" : "s"} away`; };
/* A skill upgrade backed by one source only: a small tag (the Skills card's tooltip names the source). */
const ssTag = x => x.s.single ? ` · <span class="ss-tag" title="Single source (${x.s.single})">single source</span>` : "";
const spBuyT = x => `Buy <b>${x.s.n} ${x.spec ? "specialty" + (x.slot > 1 ? " slot " + x.slot : "") : (x.L - 1) + " → " + x.L}</b>`;
/* A specialty slot's line (0.3 E7, design §9; Q6): the build's pick once its choice is open at the skill's effective level;
   a pick that needs a higher skill level says when; no pick: "pick a specialty". */
const spSlotSub = x => { const p = specPickOf(char(state), x); if (p) return `Pick: ${p.t}`;
  const q = (x.s.specs || [])[x.slot - 1], open = openOf(char(state), x.k);
  return `${open ? `Slot ${x.slot} open: pick` : "Pick"} a specialty${q ? ` · guide pick (${q.t}) at skill Lv ${q.lv}` : ""}`; };
const nsBar = (d, n, lbl) => `<span class="nsq-bar"><span style="width:${d / n * 100}%"></span></span><span class="nsq-barl">${lbl}</span>`;
/* Zone (and whether it's where the story sends you) · nearest Kibelisk. */
const nsWhere = (area, kib, hereArea) => [area !== NO_AREA ? area + (area === hereArea ? " (near your story step)" : "") : "", kib ? `<span class="nw">Kibelisk: ${kib}</span>` : ""].filter(Boolean).join(" · ");

/* The regional quests card's list. Chains: a follow-up sits under the quest that unlocks it (→), so it's clear what to finish first. */
let rqWaitOpen = false; /* "+N waiting on the story" fold, kept across Next up re-renders */
function rqExtraHTML(a) {
  const lv = char(state).level, hereArea = a.hereArea;
  const roots = a.open.filter(x => !x.lock); /* milestone order, so rows don't jump when you tick one */
  const preTxt = x => x.pre.join(" and ") + (x.pre.length > 1 ? " are" : " is");
  const line = (x, fu) => { const n = x.it.name, q = x.it.q, id = q.id, st = (x.run ? "In progress" : x.lock ? `Unlocks when ${preTxt(x)} turned in` : "Not picked up") + (q.zone ? ` · ${q.zone}` : "") + (q.kib ? ` · Kibelisk: ${q.kib}${q.m ? ` (${q.m} m)` : ""}` : "") + (q.xp ? ` · ${fmtXP(q.xp)} XP` : "");
    const label = id && !x.lock ? `<a href="${aion2QuestMap(id)}" target="_blank" rel="noopener" title="${n} · ${st} · Lv ${q.rec} · show on the map">${n}</a>` : `<span title="${n} · ${st} · Lv ${q.rec}">${n}</span>`;
    /* Recommended level above yours: a small level tag, so a hard quest doesn't look like the obvious next pick. */
    const hi = q.rec > lv && !x.run ? `<span class="q-rec" title="Recommended level ${q.rec}">Lv ${q.rec}</span>` : "";
    /* Box: click once = picked up (in progress), again = turned in. Same two clicks as the milestone rows. */
    const box = `<button type="button" class="q-cb" data-rqk="${x.k}"${x.lock ? " disabled" : ""} aria-pressed="${x.run ? "mixed" : "false"}" aria-label="${n}: ${x.lock ? "locked" : x.run ? "in progress, mark turned in" : "not picked up, mark picked up"}" title="${x.lock ? `Unlocks when ${preTxt(x)} turned in` : x.run ? "In progress · click when turned in" : "Click when you pick it up"}"></button>`;
    const near = hereArea && q.zone === hereArea && !x.lock;
    const zz = !x.run && !x.lock ? `<button type="button" class="q-snz ico" data-snz="${x.k}" title="Not in game yet: hide it until your next Level up" aria-label="${n}: not in game yet">${EYE_OFF}</button>` : "";
    /* A follow-up keeps its arrow with it when the row wraps. */
    return `<span class="ql ${x.run ? "run" : x.lock ? "lock" : "new"}${fu ? " fu" : ""}${near ? " near" : ""}">${fu ? `<span class="q-ar" aria-hidden="true">→</span>` : ""}${box}${label}${hi}${near ? `<span class="q-near" title="Near your story step (${hereArea})">${MAP_ICO}</span>` : ""}${zz}</span>`; };
  let budget = 6, more = 0;
  const groups = roots.map(r => { const kids = a.open.filter(y => y.lock && y.parent === r.it.name), need = 1 + kids.length;
    if (need > budget) { more += need; return ""; } budget -= need;
    return `<li class="qg">${line(r)}${kids.map(k => line(k, true)).join("")}</li>`; }).join("");
  /* Snoozed ("Not in game yet", counted in the subline): one compact row with their names and one control that shows them again. */
  const zRow = a.snz.length ? `<li class="qg rq-aux"><span class="rq-auxt" title="Not in game yet: hidden until your next Level up">${a.snz.map(x => x.it.name).join(", ")}</span><button type="button" class="q-inl" data-unsnz="${a.snz.map(x => x.k).join("|")}">Show again</button></li>` : "";
  /* Waiting on the story: folded; each quest gets the milestone rows' "In my game" (= picked up). */
  const wRow = a.wait.length ? `<li class="qg rq-aux"><details class="rq-wait"${rqWaitOpen ? " open" : ""}><summary>+${a.wait.length} waiting on the story</summary><ul>${a.wait.map(x => `<li><span title="${chainsOn() && !isBasic() ? capFirst(rqReqOf(char(state), x.k)) : `Opens once ${x.it.q.turnedIn ? `${x.it.q.story} is turned in` : `the story reaches ${x.it.q.story}`}`}">${x.it.name}</span><button type="button" class="q-inl" data-rqig="${x.k}">In my game</button></li>`).join("")}</ul></details></li>` : "";
  return `<ul class="ns-qgrid">${groups}${more ? `<li class="qg more">+${more} more</li>` : ""}${zRow}${wRow}</ul>`;
}

export const aion2NowRenderers = {
  run: a => { const sh = a.x.it.kind === "stronghold";
    return { ico: sh ? "🏰" : "⛏", t: `Finish <b>${a.x.it.name}</b>`, sub: `In progress · ${sh ? "Stronghold" : "Sealed Dungeon"}`, btn: "Cleared", act: a.act }; },
  cube: a => ({ ico: "🎒", t: `Use your Cube items: <b>${[a.st ? `${a.st} Wisdom Stone${a.st === 1 ? "" : "s"}` : "", a.cr ? `${a.cr} crystal${a.cr === 1 ? "" : "s"}` : ""].filter(Boolean).join(" + ")}</b>`, sub: "Open the Cube and use them, then confirm", btn: "Used", act: a.act, done: true }),
  /* skill buys queue: only the first one gets the button */
  skill: a => { const x = a.x, base = x.spec ? spSlotSub(x) : a.first ? `${spCostTxt(x)} · you have the points` : spCostTxt(x);
    return a.first ? { ico: spMini(x.s.n) || "✦", t: spBuyT(x), sub: base + ssTag(x), btn: "Spent", act: a.act, done: true, queue: "skill" } : { ico: spMini(x.s.n) || "✦", t: spBuyT(x), sub: base + ssTag(x), act: a.act, done: true, queue: "skill" }; },
  board: a => ({ ico: "◆", t: `Buy <b>${dvShort(a.dn.t)}</b> on ${a.dn.board}`, sub: a.dc === 0 ? "Already on your board: just mark it" : `${a.dc} of your ${a.dLeft} crystals`, btn: "Acquired", act: a.act, done: true }),
  boardcost: a => ({ ico: "◆", t: `Check <b>${dvShort(a.dn.t)}</b>'s cost on ${a.dn.board}`, sub: `You have ${a.dLeft} crystals; type its cost to see if you can buy it`, btn: "Enter cost", act: a.act }),
  stwait: a => ({ ico: stIco(a.nx.name, "st-img") || "✧", t: `Equip <b>${a.nx.name}</b>`, sub: `Stigma slot ${a.nx.n} is open · needs 1 shard${a.at ? ` (+1 at Lv ${a.at})` : ""}`, tag: "Needs 1 shard", act: a.act }),
  stequip: a => { const eTxt = a.r < 0 ? "" : ` · then put it on E, row ${a.r}${a.r === 0 ? " (fires first)" : ""}`;
    return { ico: stIco(a.nx.name, "st-img") || "✧", t: `Equip <b>${a.nx.name}</b>`, sub: `Stigma slot ${a.nx.n} is open${eTxt}`, btn: "Equipped", act: a.act, done: true }; },
  stup: a => ({ ico: stIco(a.up.x.name, "st-img") || "✧", t: `Upgrade <b>${a.up.x.name} ${a.up.L - 1} → ${a.up.L}</b>`, sub: `${a.up.cost} of your ${a.shards} shards`, btn: "Upgraded", act: a.act, done: true }),
  sd: a => { const p = a.pick, L = a.loc, pin = `<b>${p.it.name}</b>${pinLink(mapFocus(p.it))}`;
    return { bar: a.band.n ? nsBar(a.band.d, a.band.n, `Lv ${a.band.bd}–${a.band.bd + 4} · ${a.band.d}/${a.band.n}`) : "", ico: "⛏",
      t: a.gated ? `Clear ${pin} <span class="ns-then">and others until Lv ${a.gateLv}</span>` : `Clear ${pin}`, sub: nsWhere(p.area, L.kib, a.hereArea),
      info: [`+${SD_RW.cr} crystals, +${SD_RW.st} Wisdom Stones each · ~5 min`, L.kib && L.m ? `Kibelisk ${L.kib} is ${L.m} m away` : "", `${a.open} open at your level`].filter(Boolean).join(" · "), btn: "Show", act: a.act }; },
  sh: a => { const p = a.pick;
    return { bar: nsBar(a.done, a.total, `${a.done}/${a.total} strongholds`), ico: "🏰", t: `Run <b>${p.it.name}</b>${pinLink(mapFocus(p.it))}`, sub: nsWhere(p.area, p.it.kib, a.hereArea),
      info: [`${SH_REWARD} each`, p.it.kib && p.it.m ? `Kibelisk ${p.it.kib} is ${p.it.m} m away` : "", `${a.open} open`].filter(Boolean).join(" · "), btn: "Show", act: a.act }; },
  rq: a => ({ ico: "❖", t: `<b>Regional quests</b>`,
    sub: [a.fresh ? `${a.fresh} to pick up` : "", a.run ? `${a.run} in progress` : "", a.lock ? `${a.lock} follow-up${a.lock === 1 ? "" : "s"}` : "", a.snz.length ? `${a.snz.length} not in game yet` : "",
      a.near ? `<span class="nw">${a.near} near your story step</span>` : ""].filter(Boolean).join(" · ") || "None to pick up now",
    bar: a.scope ? `<span class="nsq-bar rq"><span class="d" style="width:${a.done / a.scope * 100}%"></span><span class="r" style="width:${a.run / a.scope * 100}%"></span></span><span class="nsq-barl">${a.done}/${a.scope} turned in</span>` : "",
    btn: "Show", act: a.act, extra: rqExtraHTML(a) }),
  /* E6: what opens it, in the words every card uses (src/core/blockers.js) */
  laterSkill: a => ({ ico: spMini(a.x.s.n) || "✦", t: spBuyT(a.x), sub: `${chainsOn() && a.why ? capFirst(a.why) : `Opens at Lv ${a.x.req}`} · ${away(a.x.req)}${ssTag(a.x)}`, act: a.act, later: true }),

  /* level-gated story card: what else gives XP at your level */
  "story.meanwhile": m => { const xs = [];
    if (m.sd) xs.push("Sealed Dungeons"); if (m.sh) xs.push("Strongholds");
    if (m.ex) xs.push(`${m.ex.name} (Lv ${m.ex.lv}+${m.ex.il ? `, item level ${m.ex.il}` : ""})`);
    if (m.dd != null) xs.push(`daily dungeon (Lv ${m.dd}+)`);
    return xs.join(" / "); },
  "story.where": a => a.kib ? `<span class="nw">Kibelisk: ${a.kib.kib}${a.kib.m ? ` (${a.kib.m} m)` : ""}</span>` : "",
  /* The one-time "Bind X" row (0.5 P15, S1 M2 / D1 / D3; design §8.2): the whole row is the tick box's label, so the box
     is named by its text. The metres are the data's (the turn-in's distance to that Kibelisk). Ticking writes
     checks["bind:<kib id>"] ("now.click"). */
  "story.row": a => { const b = a.bind; if (!b) return "";
    return `<label class="ns-bind"><input type="checkbox" data-nsbind="${b.key}"><span>Bind <b>${b.name}</b> on the way<small>${b.m} m from ${b.npc || "the turn-in"}</small></span></label>`; },
  "now.act": a => {
    if (a === "usecube") { char(state).stones = (char(state).stones || 0) + (char(state).pendSt || 0); char(state).dvTotal = (char(state).dvTotal || 0) + (char(state).pendCr || 0); char(state).pendSt = 0; char(state).pendCr = 0; save(); update(); return true; }
    if (a.startsWith("tick:")) { const k = a.slice(5); if (char(state).areaRun) delete char(state).areaRun[k];
      const src = mainEl.querySelector(`input[data-k="${CSS.escape(k)}"]`);
      /* A regional quest ticked from here completes in one click (its own box takes two: in progress, then done). */
      if (src && src.closest("li.qrow") && !src.checked) { char(state).started = char(state).started || {}; char(state).started[k] = char(state).started[k] || 1; }
      return false; }
    if (a === "skill") { const box = document.getElementById("spNextBox"); if (box.dataset.sp) { box.checked = true; box.dispatchEvent(new Event("change")); } }
    else if (a === "stup") { const sb = document.querySelector("#stCard [data-stup]"); if (sb) sb.click(); }
    else if (a === "stequip") { const sb = document.querySelector("#stCard [data-sttick]"); if (sb) sb.click(); }
    else if (a === "board") { const bb = document.querySelector("#dvNextList [data-buy]"); if (bb) bb.click(); }
    else if (a === "boardcost") { const c = document.querySelector("#dvNextList input.dvc"); document.getElementById("dvBox").scrollIntoView({ behavior: SMOOTH(), block: "center" }); if (c) setTimeout(() => c.focus(), 300); }
    else if (a.startsWith("areas:")) { const v = a.slice(6); goAreas(v === "sh" ? "sh" : +v); }
    else return false;
    return true;
  },
  "now.click": e => {
    /* the "Bind X" tick (the box's own click; a click on its label text reaches the box as one) */
    const bb = e.target.closest("input[data-nsbind]");
    if (bb) { const k = bb.dataset.nsbind; if (/^bind:/.test(k) && !char(state).checks[k]) { char(state).checks[k] = true; save(); update(); } return true; }
    if (e.target.closest(".ns-bind")) return true;
    const zb = e.target.closest("[data-snz]"); if (zb) { e.preventDefault(); snoozeToggle(zb.dataset.snz); return true; }
    const ub = e.target.closest("[data-unsnz]"); if (ub) { e.preventDefault(); ub.dataset.unsnz.split("|").forEach(k => { if (char(state).rqSnooze) delete char(state).rqSnooze[k]; }); save(); update(); return true; }
    const ig = e.target.closest("[data-rqig]"); if (ig) { e.preventDefault(); const k = ig.dataset.rqig; char(state).started = char(state).started || {};
      if (!char(state).checks[k]) { char(state).started[k] = 1; if (char(state).rqSnooze) delete char(state).rqSnooze[k]; save(); update(); } return true; }
    const qb = e.target.closest("[data-rqk]");
    if (qb) { e.preventDefault(); const k = qb.dataset.rqk; char(state).started = char(state).started || {};
      if (!char(state).checks[k] && !qProg(k)) { char(state).started[k] = 1; save(); update(); return true; }
      const src = mainEl.querySelector(`input[data-k="${CSS.escape(k)}"]`);
      if (src && !src.checked) src.click(); else { delete char(state).started[k]; char(state).checks[k] = true; rqTicked(k); save(); update(); }
      return true; }
    return false;
  },
  "now.toggle": e => { if (e.target.classList && e.target.classList.contains("rq-wait")) rqWaitOpen = e.target.open; },
  "now.docClicks": () => [cubeClick, stTickClick, stUpClick, stLvClick],
  "skill.slot": spSlotSub,
  /* At the cap there's nothing above you: say so instead of an empty box. */
  "ahead.cap": lv => lv >= 45 ? `<a class="ah-row" href="#g45" data-gogate="g45"><span class="ah-lv">Lv 45</span><span class="ah-main"><b>Level cap reached</b><small>Progress now comes from gear score, not levels</small></span></a>` : "",
};
