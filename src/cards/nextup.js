/* Next up (0.4 P4c: moved verbatim from src/main.js; markup nextup.html): the one-task cards rankNext ranks
   (src/core/nextup.js) as a snap-scroll stack, the regional quests card's list, the story card's objectives, the hotkeys
   and the pop-out window (Document Picture-in-Picture). Its handlers wire in its mount (from render(), once), so the
   module touches no DOM at import (the Node core bundle imports it). */
import { char } from "../core/state.js";
import { chainsOn, objPartsOf, openOf, questIdx, turnInNeedsLv } from "../core/requirements.js";
import { rankNext } from "../core/nextup.js";
import { MAP_ICO, rqTicked, snoozeToggle } from "./milestones.js";
import { completeBefore, renderQuestSubs, setObj, setSub, stepQuest, subListHTML } from "./journey.js";
import { pageState as state, pageSave as save, pageUpdate as update, pageMainEl as mainEl, pageLayoutEl as layoutEl, pageSMOOTH as SMOOTH, pageTipClick as tipClick, pageTipGoClick as tipGoClick, pageTipEsc as tipEsc, pageGATES as GATES, pageQUESTS as QUESTS, pageQUEST_STEPS as QUEST_STEPS, pageSTORY_END as STORY_END, pageSD_RW as SD_RW, pageSH_REWARD as SH_REWARD, pageNO_AREA as NO_AREA, pageSpCostTxt as spCostTxt, pageRqReqOf as rqReqOf, pageSpecPickOf as specPickOf, pageMapFocus as mapFocus, pageAion2QuestMap as aion2QuestMap, pageGoAreas as goAreas, pageCubeClick as cubeClick, pageStTickClick as stTickClick, pageStUpClick as stUpClick, pageStLvClick as stLvClick, pageSpMini as spMini, pageStIco as stIco, pageDvShort as dvShort, pageQProg as qProg, pageObjIdx as objIdx } from "./page.js";

/* "Not in game yet" in Next up (compact): eye with a slash. */
const EYE_OFF = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7c2 0 3.7.7 5.1 1.6M22 12s-3.6 7-10 7c-2 0-3.7-.7-5.1-1.6"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/></svg>`;
/* Next up (#nowStar) can move into a pop-out window, so it is always reached through this node. */
let nowEl = null;
let pipWin = null, nsHover = false;
const nsWin = () => (nowEl && nowEl.ownerDocument.defaultView) || window;
/* XP in regional quest tooltips (dungeon XP isn't shown: only a few pages state it). */
const fmtXP = n => n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : n >= 1000 ? Math.round(n / 1000) + "k" : String(n);
const pinLink = (href, label) => href ? ` <a class="ns-pin" href="${href}" target="_blank" rel="noopener" title="${label || "Show on the map"}">${MAP_ICO}</a>` : "";

/* "Next up": the north star. A short ranked list of what moves you forward right now, each with one action. The ranking
   is rankNext (src/core/nextup.js); nowCard turns one of its cards into the view object renderNow lays out. */
/* A milestone step's card title: the item's short ns title; else its first bold phrase in the milestone row (without
   trailing ":" or "."), as the row shows it. */
function stepHTML(g, x) {
  if (x.it && x.it.ns) return x.it.ns;
  const card = document.getElementById(g.id), li = card && [...card.querySelectorAll(":scope > ul.items > li.item")].find(l => { const cb = l.querySelector("input[data-k]"); return cb && cb.dataset.k === x.k; });
  const t = li && li.querySelector(".txt"); if (!t) return "";
  const cl = t.cloneNode(true); cl.querySelectorAll(".tip, .loc, .schip, .upsell, .req, .cost, button, small").forEach(e => e.remove());
  const b = cl.querySelector("b"); return (b ? b.innerHTML : cl.innerHTML).replace(/[\s:.]+$/, "");
}
/* A skill upgrade backed by one source only: a small tag (the Skills card's tooltip names the source). */
const ssTag = x => x.s.single ? ` · <span class="ss-tag" title="Single source (${x.s.single})">single source</span>` : "";
const spBuyT = x => `Buy <b>${x.s.n} ${x.spec ? "specialty" + (x.slot > 1 ? " slot " + x.slot : "") : (x.L - 1) + " → " + x.L}</b>`;
/* A specialty slot's line (0.3 E7, design §9; Q6): the build's pick once its choice is open at the skill's effective level;
   a pick that needs a higher skill level says when; no pick: "pick a specialty". */
const specSub = x => { const p = specPickOf(char(state), x); if (p) return `Pick: ${p.t}`;
  const q = (x.s.specs || [])[x.slot - 1], open = openOf(char(state), x.k);
  return `${open ? `Slot ${x.slot} open: pick` : "Pick"} a specialty${q ? ` · guide pick (${q.t}) at skill Lv ${q.lv}` : ""}`; };
const nsGate = g => `<a href="#${g.id}" data-now="gate:${g.id}">${g.title}</a>`;
/* A blocker text at the start of a line. */
const capFirst = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const isBasic = () => document.body.classList.contains("basic");
const nsBar = (d, n, lbl) => `<span class="nsq-bar"><span style="width:${d / n * 100}%"></span></span><span class="nsq-barl">${lbl}</span>`;
/* Zone (and whether it's where the story sends you) · nearest Kibelisk. */
const nsWhere = (area, kib, hereArea) => [area !== NO_AREA ? area + (area === hereArea ? " (near your story step)" : "") : "", kib ? `<span class="nw">Kibelisk: ${kib}</span>` : ""].filter(Boolean).join(" · ");
function nowCard(a) {
  const { act } = a, lv = char(state).level, away = L => `${L - lv} level${L - lv === 1 ? "" : "s"} away`;
  switch (a.kind) {
    case "run": { const sh = a.x.it.kind === "stronghold";
      return { ico: sh ? "🏰" : "⛏", t: `Finish <b>${a.x.it.name}</b>`, sub: `In progress · ${sh ? "Stronghold" : "Sealed Dungeon"}`, btn: "Cleared", act }; }
    case "cube": return { ico: "🎒", t: `Use your Cube items: <b>${[a.st ? `${a.st} Wisdom Stone${a.st === 1 ? "" : "s"}` : "", a.cr ? `${a.cr} crystal${a.cr === 1 ? "" : "s"}` : ""].filter(Boolean).join(" + ")}</b>`, sub: "Open the Cube and use them, then confirm", btn: "Used", act };
    case "skill": { const x = a.x, base = x.spec ? specSub(x) : a.first ? `${spCostTxt(x)} · you have the points` : spCostTxt(x);
      return a.first ? { ico: spMini(x.s.n) || "✦", t: spBuyT(x), sub: base + ssTag(x), btn: "Spent", act } : { ico: spMini(x.s.n) || "✦", t: spBuyT(x), sub: base + ssTag(x), act }; }
    case "board": return { ico: "◆", t: `Buy <b>${dvShort(a.dn.t)}</b> on ${a.dn.board}`, sub: a.dc === 0 ? "Already on your board: just mark it" : `${a.dc} of your ${a.dLeft} crystals`, btn: "Acquired", act };
    case "boardcost": return { ico: "◆", t: `Check <b>${dvShort(a.dn.t)}</b>'s cost on ${a.dn.board}`, sub: `You have ${a.dLeft} crystals; type its cost to see if you can buy it`, btn: "Enter cost", act };
    case "stwait": return { ico: stIco(a.nx.name, "st-img") || "✧", t: `Equip <b>${a.nx.name}</b>`, sub: `Stigma slot ${a.nx.n} is open · needs 1 shard${a.at ? ` (+1 at Lv ${a.at})` : ""}`, tag: "Needs 1 shard", act };
    case "stequip": { const eTxt = a.r < 0 ? "" : ` · then put it on E, row ${a.r}${a.r === 0 ? " (fires first)" : ""}`;
      return { ico: stIco(a.nx.name, "st-img") || "✧", t: `Equip <b>${a.nx.name}</b>`, sub: `Stigma slot ${a.nx.n} is open${eTxt}`, btn: "Equipped", act }; }
    case "stup": return { ico: stIco(a.up.x.name, "st-img") || "✧", t: `Upgrade <b>${a.up.x.name} ${a.up.L - 1} → ${a.up.L}</b>`, sub: `${a.up.cost} of your ${a.shards} shards`, btn: "Upgraded", act };
    case "step": return { ico: "⚑", t: stepHTML(a.g, a.x), sub: `Lv ${a.g.lv} milestone · ${nsGate(a.g)}`, btn: "Done", act };
    case "missed": return { ico: "↺", t: stepHTML(a.g, a.x), sub: `Missed · Lv ${a.g.lv} ${nsGate(a.g)}`, btn: "Done", act };
    case "adv": return { adv: true, ico: "⚑", t: stepHTML(a.g, a.x), sub: `Optional · Lv ${a.g.lv} milestone · ${nsGate(a.g)}`, btn: "Done", act };
    case "sd": { const p = a.pick, L = a.loc, pin = `<b>${p.it.name}</b>${pinLink(mapFocus(p.it))}`;
      return { bar: a.band.n ? nsBar(a.band.d, a.band.n, `Lv ${a.band.bd}–${a.band.bd + 4} · ${a.band.d}/${a.band.n}`) : "", ico: "⛏",
        t: a.gated ? `Clear ${pin} <span class="ns-then">and others until Lv ${a.gateLv}</span>` : `Clear ${pin}`, sub: nsWhere(p.area, L.kib, a.hereArea),
        info: [`+${SD_RW.cr} crystals, +${SD_RW.st} Wisdom Stones each · ~5 min`, L.kib && L.m ? `Kibelisk ${L.kib} is ${L.m} m away` : "", `${a.open} open at your level`].filter(Boolean).join(" · "), btn: "Show", act }; }
    case "sh": { const p = a.pick;
      return { bar: nsBar(a.done, a.total, `${a.done}/${a.total} strongholds`), ico: "🏰", t: `Run <b>${p.it.name}</b>${pinLink(mapFocus(p.it))}`, sub: nsWhere(p.area, p.it.kib, a.hereArea),
        info: [`${SH_REWARD} each`, p.it.kib && p.it.m ? `Kibelisk ${p.it.kib} is ${p.it.m} m away` : "", `${a.open} open`].filter(Boolean).join(" · "), btn: "Show", act }; }
    case "rq": return { ico: "❖", t: `<b>Regional quests</b>`,
      sub: [a.fresh ? `${a.fresh} to pick up` : "", a.run ? `${a.run} in progress` : "", a.lock ? `${a.lock} follow-up${a.lock === 1 ? "" : "s"}` : "", a.snz.length ? `${a.snz.length} not in game yet` : "",
        a.near ? `<span class="nw">${a.near} near your story step</span>` : ""].filter(Boolean).join(" · ") || "None to pick up now",
      bar: a.scope ? `<span class="nsq-bar rq"><span class="d" style="width:${a.done / a.scope * 100}%"></span><span class="r" style="width:${a.run / a.scope * 100}%"></span></span><span class="nsq-barl">${a.done}/${a.scope} turned in</span>` : "",
      btn: "Show", act, extra: rqExtraHTML(a) };
    case "story": return storyView(a);
    /* E6: what opens it, in the words every card uses (src/core/blockers.js) */
    case "laterSkill": return { ico: spMini(a.x.s.n) || "✦", t: spBuyT(a.x), sub: `${chainsOn() && a.why ? capFirst(a.why) : `Opens at Lv ${a.x.req}`} · ${away(a.x.req)}${ssTag(a.x)}`, act, later: true };
    case "laterStep": return { ico: "⚑", t: a.x ? stepHTML(a.g, a.x) : `<b>${a.g.title}</b>`, sub: `Lv ${a.g.lv} milestone · ${away(a.g.lv)}${chainsOn() && a.why ? ` · ${a.why}` : ""}`, act, later: true };
  }
  throw new Error("Next up: unknown card " + a.kind);
}
/* The regional quests card's list. Chains: a follow-up sits under the quest that unlocks it (→), so it's clear what to finish first. */
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
/* The end of the guide's story (0.3 E10): the last covered quest turned in; the game's next story quest unlocks past the cap. */
/* set at mount: STORY_END is the pack's, handed over after this module is loaded */
let STORY_DONE = "", END_NEXT = "";
function storyView(a) {
  const { act } = a;
  if (a.v === "unset") return { story: true, ico: "📜", t: "Set your current main quest", sub: "In the Journey card; it places you on the story.", btn: "Show", act };
  if (a.v === "end") return { story: true, ico: "📜", t: STORY_DONE, sub: `${capFirst(END_NEXT)} · the guide's story ends at "${a.quest}"`, act };
  const m = a.meanwhile, xs = [];
  if (m) { if (m.sd) xs.push("Sealed Dungeons"); if (m.sh) xs.push("Strongholds");
    if (m.ex) xs.push(`${m.ex.name} (Lv ${m.ex.lv}+${m.ex.il ? `, item level ${m.ex.il}` : ""})`);
    if (m.dd != null) xs.push(`daily dungeon (Lv ${m.dd}+)`); }
  const gatedSub = `Needs Lv ${a.gateLv}: you're ${a.lv}. Level up first.${xs.length ? `<span class="ns-mean">Meanwhile: ${xs.join(" / ")}</span>` : ""}`;
  /* Below the quest's unlock level (turnInNeedsLv): no "Turned in", the tag says when (as the Journey card does). */
  const tag = a.turnInLv ? `Turn in at Lv ${a.turnInLv}` : undefined;
  if (a.v === "nolist") return { story: true, ico: "📜", t: `Continue the story: <b>${a.quest}</b>`, sub: a.gated ? gatedSub : a.nq ? `Main story · then ${a.nq[1]}` : "Main story", btn: "Turned in", act, tag };
  const kibTxt = a.kib ? ` · <span class="nw">Kibelisk: ${a.kib.kib}${a.kib.m ? ` (${a.kib.m} m)` : ""}</span>` : "";
  return { story: true, ico: "📜", t: `Story: <b>${a.quest}</b>`, sub: a.gated ? gatedSub : `${a.done}/${a.total} objectives${kibTxt}${a.nq ? ` · then ${a.nq[1]}` : ""}`, btn: "Turned in", act, tag, quest: a.objectives };
}
function renderNow() {
  const el = nowEl; if (!el) return;
  const lv = char(state).level;
  const shown = rankNext(state, { basic: document.body.classList.contains("basic") }).map(nowCard);
  const top = shown[0];
  /* One card per action, each laid out like a milestone header (icon box · what · its own control). Only the first
     shows; the rest sit below it in a snap-scroll stack (a sliver of the next one peeks out). */
  const firstSkill = shown.findIndex(a => a.act === "skill");
  const info = (a, i) => a.info ? ` <button type="button" class="tipbtn nsinfo" aria-label="More info" aria-expanded="false" aria-controls="nsInfo${i}">i</button>` : "";
  const control = (a, i) => {
    if (a.later) return `<span class="tag">Later</span>`;
    if (a.tag) return `<span class="tag">${a.tag}</span>`;
    if (!a.act) return "";
    if (a.act === "skill" && i !== firstSkill) return `<span class="tag">After the one above</span>`;
    const done = /^(tick:|board$|usecube$|story$|skill$|stup$|stequip$)/.test(a.act);
    return `<button type="button" class="${done ? "ns-btn primary" : "ns-go"}" data-now="${a.act}">${a.btn || "Done"}</button>`;
  };
  /* Progress bars run along the card's bottom edge (like the milestone cards); their label joins the subline. */
  const splitBar = a => { if (!a.bar) return { bar: "", lbl: "" }; const m = a.bar.match(/<span class="nsq-barl">([\s\S]*?)<\/span>/); return { bar: a.bar.replace(/<span class="nsq-barl">[\s\S]*?<\/span>/, ""), lbl: m ? m[1] : "" }; };
  const card = (a, i) => { const pb = splitBar(a), sub = [a.sub, pb.lbl ? `<span class="nw">${pb.lbl}</span>` : ""].filter(Boolean).join(" · ");
    return `<article class="ns-card${i === 0 ? " first ns-primary nsbox" : ""}${a.later ? " later" : ""}${pb.bar ? " has-bbar" : ""}${nsAnim ? " rise" : ""}">` +
    `<div class="ns-mhead"><div class="num ns-num" aria-hidden="true">${a.ico}</div><div class="title"><h3>${a.t}${info(a, i)}</h3>${sub ? `<p>${sub}</p>` : ""}${a.info ? `<span class="ns-info" id="nsInfo${i}">${a.info}</span>` : ""}</div>` +
    (a.extra ? `<div class="ns-extra">${a.extra}</div>` : "") + `<div class="meta">${control(a, i)}</div></div>${a.quest ? nsObjHTML() : ""}${pb.bar ? `<div class="ns-bbar">${pb.bar}</div>` : ""}</article>`; };
  el.innerHTML = `<div class="sec ns-sec"><h2 class="sec-h">Next up</h2>${window.documentPictureInPicture ? `<button type="button" class="ns-pop" data-nspop title="Keep Next up in a small window on top of the game">Pop out</button>` : ""}</div>` + (top ? `<div class="ns-stack" id="nsqWrap">${shown.map(card).join("")}</div>`
    : `<div class="ns-stack"><article class="ns-card first"><div class="ns-mhead"><div class="num ns-num" aria-hidden="true">✓</div><div class="title"><h3>You're caught up for Lv ${lv}</h3><p>Push the story to the next level.</p></div><div class="meta"></div></div></article></div>`);
  nsAnim = false;
  if (pipWin) syncPipClasses();
  const w = el.querySelector("#nsqWrap"), vw = nsWin();
  if (w) {
    /* The stack is as tall as the card snapped into view (+ a peek of the next one), so a taller card is never clipped. */
    const curCard = () => { const cs = [...w.children], t = w.scrollTop; let best = cs[0], bd = Infinity; cs.forEach(c => { const d = Math.abs(c.offsetTop - cs[0].offsetTop - t); if (d < bd) { bd = d; best = c; } }); return best; };
    const fit = () => { const c = curCard(); if (c) w.style.height = (c.offsetHeight + (c.nextElementSibling ? 30 : 0)) + "px"; };
    const end = () => w.classList.toggle("at-end", w.scrollTop + w.clientHeight >= w.scrollHeight - 2);
    let fitT = 0; w.addEventListener("scroll", () => { end(); vw.clearTimeout(fitT); fitT = vw.setTimeout(() => { fit(); end(); }, 140); }, { passive: true }); vw.requestAnimationFrame(() => { fit(); end(); });
    const RO = vw.ResizeObserver || window.ResizeObserver; if (typeof RO === "function") { const ro = new RO(() => { fit(); end(); }); [...w.children].forEach(c => ro.observe(c)); }
    /* After completing a card, keep keyboard focus on the new top card's control. */
    if (nsRefocus > Date.now()) { const c = w.querySelector(".ns-card.first .meta button, .ns-card.first .meta a"); if (c) c.focus({ preventScroll: true }); }
  }
}
/* Next up can live in a pop-out (Document Picture-in-Picture) window: everything goes through this node, never a
   document lookup, and timers/frames come from whichever window currently holds it. */
let rqWaitOpen = false; /* "+N waiting on the story" fold, kept across Next up re-renders */
let nsAnim = false, nsRefocus = 0;
/* The current quest's open objectives, inside the Next up card when the story is the thing to do. */
function nsObjHTML() {
  const list = QUEST_STEPS[char(state).quest] || [], done = (char(state).qsteps || {})[char(state).quest] || [];
  const vis = objIdx(list), open = list.map((t, i) => [t, i]).filter(([, i]) => vis.includes(i) && !done.includes(i));
  /* First three open objectives; the rest wait their turn (all of them are in the Journey card). */
  const cap = pipWin ? 2 : 3, more = open.length - cap; /* the pop-out window is short */
  return open.length ? `<ul class="ns-obj">${open.slice(0, cap).map(([, i]) => { const [a, b] = objPartsOf(char(state).quest, i); const sl = subListHTML(i, "data-nssub"); return `<li class="${sl ? "has-sub" : ""}"><label><input type="checkbox" data-nsobj="${i}"><span><b>${a}</b>${b && !sl ? `<small>${b}</small>` : ""}</span></label>${sl}</li>`; }).join("")}${more > 0 ? `<li class="ns-obj-more">+${more} more after these</li>` : ""}</ul>` : "";
}
/* Pop out: Next up in an always-on-top mini window (Document Picture-in-Picture) to keep over the game. The live
   node moves there (its listeners go with it); a one-line placeholder stays in the page until it comes back. */
function syncPipClasses() {
  if (!pipWin) return; const d = pipWin.document, h = document.documentElement;
  d.documentElement.className = (h.className ? h.className + " " : "") + "pip";
  if (h.dataset.theme) d.documentElement.dataset.theme = h.dataset.theme; else delete d.documentElement.dataset.theme;
  d.body.className = document.body.className;
}
async function popOutNow() {
  if (pipWin || !window.documentPictureInPicture) return;
  let w; try { w = await documentPictureInPicture.requestWindow({ width: 400, height: 280 }); } catch (err) { return; }
  pipWin = w; const d = w.document;
  d.title = "Next up";
  const base = d.createElement("base"); base.href = location.href; d.head.appendChild(base);
  document.querySelectorAll('style, link[rel="stylesheet"]').forEach(x => d.head.appendChild(x.cloneNode(true)));
  syncPipClasses();
  const ph = document.createElement("div"); ph.className = "ns-away"; ph.id = "nsAway";
  ph.innerHTML = `<span>Next up is in the pop-out window</span><span class="dot">·</span><button type="button">Bring back</button>`;
  ph.querySelector("button").addEventListener("click", () => { if (pipWin) pipWin.close(); });
  nowEl.replaceWith(ph);
  d.body.appendChild(nowEl);
  const hint = d.createElement("div"); hint.className = "pip-hint"; hint.textContent = "Space done · ↓ next"; d.body.appendChild(hint);
  /* Clicks that the page handles at document level (info popovers) need the same delegation in this document. */
  [tipClick, tipGoClick, cubeClick, stTickClick, stUpClick, stLvClick].forEach(f => d.addEventListener("click", f));
  d.addEventListener("keydown", tipEsc);
  d.addEventListener("keydown", e => nsKey(e, true));
  w.addEventListener("pagehide", () => {
    const p = document.getElementById("nsAway"); if (p) p.replaceWith(nowEl); else mainEl.appendChild(nowEl);
    pipWin = null; nsHover = false; update();
  }, { once: true });
  renderNow();
}
/* Hotkeys: Enter / Space = complete the top card; ↓ → next card, ↑ ← previous. In the page only while the pointer is
   over Next up or focus is inside it; in the pop-out always. Never while typing. */
function nsKey(e, inPip) {
  if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
  const t = e.target, tag = t && t.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (t && t.isContentEditable)) return;
  if (!inPip && (pipWin || !(nsHover || nowEl.contains(document.activeElement)))) return;
  const k = e.key;
  if (k === "Enter" || k === " " || k === "Spacebar") {
    if (tag === "BUTTON" || tag === "A" || tag === "SUMMARY") return; /* the focused control activates itself */
    const b = nowEl.querySelector(".ns-card.first .meta .ns-btn.primary");
    if (b && !b.disabled) { e.preventDefault(); b.click(); } else if (inPip) e.preventDefault();
    return; }
  const d = k === "ArrowDown" || k === "ArrowRight" ? 1 : k === "ArrowUp" || k === "ArrowLeft" ? -1 : 0; if (!d) return;
  const w = nowEl.querySelector(".ns-stack"), cards = w ? [...w.children] : []; if (cards.length < 2) return;
  e.preventDefault();
  const top0 = cards[0].offsetTop, pos = cards.map(c => c.offsetTop - top0);
  let cur = 0; pos.forEach((p, i) => { if (p <= w.scrollTop + 4) cur = i; });
  const n = Math.max(0, Math.min(cards.length - 1, cur + d));
  w.scrollTo({ top: pos[n], behavior: SMOOTH() });
}
/* the handlers (from render(), once); el = #nowStar */
function nextUpMount(el) {
  nowEl = el;
  STORY_DONE = `Lv ${STORY_END.lv} story complete`; END_NEXT = `next in game: "${STORY_END.next}" at Lv ${STORY_END.nextLv}`;
  nowEl.addEventListener("toggle", e => { if (e.target.classList && e.target.classList.contains("rq-wait")) rqWaitOpen = e.target.open; }, true);
  nowEl.addEventListener("click", e => {
    if (e.target.closest("[data-nspop]")) { popOutNow(); return; }
    const zb = e.target.closest("[data-snz]"); if (zb) { e.preventDefault(); snoozeToggle(zb.dataset.snz); return; }
    const ub = e.target.closest("[data-unsnz]"); if (ub) { e.preventDefault(); ub.dataset.unsnz.split("|").forEach(k => { if (char(state).rqSnooze) delete char(state).rqSnooze[k]; }); save(); update(); return; }
    const ig = e.target.closest("[data-rqig]"); if (ig) { e.preventDefault(); const k = ig.dataset.rqig; char(state).started = char(state).started || {};
      if (!char(state).checks[k]) { char(state).started[k] = 1; if (char(state).rqSnooze) delete char(state).rqSnooze[k]; save(); update(); } return; }
    const qb = e.target.closest("[data-rqk]");
    if (qb) { e.preventDefault(); const k = qb.dataset.rqk; char(state).started = char(state).started || {};
      if (!char(state).checks[k] && !qProg(k)) { char(state).started[k] = 1; save(); update(); return; }
      const src = mainEl.querySelector(`input[data-k="${CSS.escape(k)}"]`);
      if (src && !src.checked) src.click(); else { delete char(state).started[k]; char(state).checks[k] = true; rqTicked(k); save(); update(); }
      return; }
    const ib = e.target.closest(".nsinfo"); if (ib) { e.stopPropagation(); ib.setAttribute("aria-expanded", String((ib.closest(".ns-card") || ib.closest(".nsq, .nsbox")).classList.toggle("show-info"))); return; }
    const b = e.target.closest("[data-now]"); if (!b) return;
    const a = b.dataset.now;
    /* Completing the top card: it slides up and out, then the queue rises into place. */
    if (b.closest(".ns-primary") && /^(tick:|obj:|skill$|board$|story$|usecube$|stup$|stequip$)/.test(a) && !b.dataset.go) {
      e.preventDefault(); b.dataset.go = "1"; b.disabled = true;
      nowEl.querySelector(".ns-primary").classList.add("out");
      window.setTimeout(() => { nsAnim = true; nsRefocus = Date.now() + 1500;
        /* If the pop-out closed meanwhile, the card was re-rendered: click the live copy of the same action. */
        const live = b.isConnected ? b : nowEl.querySelector(`[data-now="${CSS.escape(a)}"]`) || b;
        live.dataset.go = "2"; live.disabled = false; live.click(); }, 320);
      return;
    }
    if (b.tagName === "A") e.preventDefault();
    if (a === "usecube") { char(state).stones = (char(state).stones || 0) + (char(state).pendSt || 0); char(state).dvTotal = (char(state).dvTotal || 0) + (char(state).pendCr || 0); char(state).pendSt = 0; char(state).pendCr = 0; save(); update(); return; }
    if (a.startsWith("tick:")) { const k = a.slice(5); if (char(state).areaRun) delete char(state).areaRun[k];
      const src = mainEl.querySelector(`input[data-k="${CSS.escape(k)}"]`);
      /* A regional quest ticked from here completes in one click (its own box takes two: in progress, then done). */
      if (src && src.closest("li.qrow") && !src.checked) { char(state).started = char(state).started || {}; char(state).started[k] = char(state).started[k] || 1; }
      if (src) { if (!src.checked) src.click(); return; }
      /* Not on screen (e.g. a stronghold outside the selected band): tick it through the same handler. */
      if (!char(state).checks[k]) { const tmp = document.createElement("input"); tmp.type = "checkbox"; tmp.dataset.k = k; tmp.checked = true; tmp.hidden = true; layoutEl.appendChild(tmp); tmp.dispatchEvent(new Event("change", { bubbles: true })); tmp.remove(); }
      return; }
    if (a.startsWith("obj:")) { const i = +a.slice(4); char(state).qsteps = char(state).qsteps || {}; const cur = new Set(char(state).qsteps[char(state).quest] || []); cur.add(i); char(state).qsteps[char(state).quest] = [...cur]; save(); renderQuestSubs(); return; }
    if (a === "story") { /* "Turned in": every objective of the quest counts as done (sub-steps too), then the story moves on. */
      if (turnInNeedsLv(char(state))) return; /* not below the quest's unlock level (the card shows no button then) */
      const list = QUEST_STEPS[char(state).quest];
      if (list) { char(state).qsteps = char(state).qsteps || {}; char(state).qsteps[char(state).quest] = list.map((_, i) => i); list.forEach((_, i) => setObj(i, true)); save(); }
      /* Milestone steps that are this story quest (byStory) are done with it. */
      GATES.forEach(g => g.items.forEach(it => { if (it.byStory && it.story === char(state).quest) char(state).checks[it.k] = true; })); save();
      /* Last quest the guide covers: remember it's turned in (the card then says to continue in game). */
      if (questIdx(char(state)) === QUESTS.length - 1) { char(state).storyEnd = char(state).quest; save(); update(); }
      else stepQuest(1); }
    else if (a === "setquest") { const i = document.getElementById("questIn"); i.scrollIntoView({ behavior: SMOOTH(), block: "center" }); i.focus(); }
    else if (a === "skill") { const box = document.getElementById("spNextBox"); if (box.dataset.sp) { box.checked = true; box.dispatchEvent(new Event("change")); } }
    else if (a === "stup") { const sb = document.querySelector("#stCard [data-stup]"); if (sb) sb.click(); }
    else if (a === "stequip") { const sb = document.querySelector("#stCard [data-sttick]"); if (sb) sb.click(); }
    else if (a === "board") { const bb = document.querySelector("#dvNextList [data-buy]"); if (bb) bb.click(); }
    else if (a === "boardcost") { const c = document.querySelector("#dvNextList input.dvc"); document.getElementById("dvBox").scrollIntoView({ behavior: SMOOTH(), block: "center" }); if (c) setTimeout(() => c.focus(), 300); }
    else if (a.startsWith("areas:")) { const v = a.slice(6); goAreas(v === "sh" ? "sh" : +v); }
    else if (a.startsWith("rqgo:")) { /* open the milestone and land on that quest's row */
      const inp = mainEl.querySelector(`input[data-k="${CSS.escape(a.slice(5))}"]`), d = inp && inp.closest("details");
      if (d) { d.open = true; state.open[d.id] = true; save(); d.classList.add("peek"); d.hidden = false; requestAnimationFrame(() => { const li = inp.closest("li"); li.scrollIntoView({ behavior: SMOOTH(), block: "center" }); li.classList.add("flash"); setTimeout(() => li.classList.remove("flash"), 1600); }); } }
    else if (a.startsWith("gate:")) { const g = document.getElementById(a.slice(5)); if (g) { g.open = true; g.scrollIntoView({ behavior: SMOOTH(), block: "start" }); } }
  });
  nowEl.addEventListener("change", e => {
    const sq = e.target.dataset && e.target.dataset.nssub, st = (f, t) => nsWin().setTimeout(f, t);
    if (sq != null) { const [si, sj] = sq.split(":").map(Number); if (e.target.checked) completeBefore(si, nowEl, "data-nsobj"); const all = setSub(si, sj, e.target.checked); e.target.closest("li").classList.toggle("on", e.target.checked);
      if (all) { const li = e.target.closest("li.has-sub"); li.classList.add("on"); st(() => li.classList.add("leaving"), 550); st(() => renderQuestSubs(), 1150); }
      else { const jl = document.querySelector(`#questSubs input[data-qsub="${sq}"]`); if (jl) jl.checked = e.target.checked; }
      return; }
    const i = e.target.dataset && e.target.dataset.nsobj; if (i == null) return;
    completeBefore(+i, nowEl, "data-nsobj");
    setObj(+i, true);
    char(state).qsteps = char(state).qsteps || {}; const cur = new Set(char(state).qsteps[char(state).quest] || []); cur.add(+i); char(state).qsteps[char(state).quest] = [...cur]; save();
    const li = e.target.closest("li"); li.classList.add("on");
    st(() => li.classList.add("leaving"), 550);
    st(() => renderQuestSubs(), 1150);
  });
  nowEl.addEventListener("pointerenter", () => { nsHover = true; });
  nowEl.addEventListener("pointerleave", () => { nsHover = false; });
  document.addEventListener("keydown", e => nsKey(e, false));
}

const nextUpCard = { id: "nextup", slot: "main", order: 100, root: "nowStar", mount: nextUpMount, update: () => renderNow() };
export { renderNow, nowEl, pipWin, capFirst, isBasic, specSub, STORY_DONE, END_NEXT, nextUpCard };
