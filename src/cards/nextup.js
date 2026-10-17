/* Next up (0.4 P4c: moved verbatim from src/main.js; markup nextup.html): the one-task cards rankNext ranks
   (src/core/nextup.js) as a snap-scroll stack, the story card's objectives, the hotkeys and the pop-out window (Document
   Picture-in-Picture). Its handlers wire in its mount (from render(), once), so the module touches no DOM at import (the
   Node core bundle imports it). 0.4 P5a: it draws its own kinds (milestone steps, the story card, the milestone Later
   card) and hands every other kind, and the pack's controls inside it, to the pack's nowRenderers
   (docs/design/0.4-engine-contract.md §2; the hooks are listed where the pack defines them). */
import { char } from "../core/state.js";
import { activePack } from "../core/pack.js";
import { chainsOn, objPartsOf, questIdx, turnInNeedsLv } from "../core/requirements.js";
import { TRACKS, rankChangeOn, rankNext, trackOf, tracksDiffer } from "../core/nextup.js";
import { completeBefore, renderQuestSubs, setObj, setSub, stepQuest, subListHTML } from "./journey.js";
import { pageState as state, pageSave as save, pageUpdate as update, pageMainEl as mainEl, pageLayoutEl as layoutEl, pageSMOOTH as SMOOTH, pageTipClick as tipClick, pageTipGoClick as tipGoClick, pageTipEsc as tipEsc, pageGATES as GATES, pageQUESTS as QUESTS, pageQUEST_STEPS as QUEST_STEPS, pageSTORY_END as STORY_END, pageObjIdx as objIdx } from "./page.js";

/* Next up (#nowStar) can move into a pop-out window, so it is always reached through this node. */
let nowEl = null;
let pipWin = null, nsHover = false;
const nsWin = () => (nowEl && nowEl.ownerDocument.defaultView) || window;
/* the pack's renderers and Next up hooks (docs/design/0.4-engine-contract.md §2 nowRenderers) */
const nowR = () => activePack().nowRenderers;
const nowCtx = () => ({ state, c: char(state), lv: char(state).level, basic: isBasic(), el: nowEl });

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
/* Kept here for the shell, which hands it to the pack's Skills card: the pack's slot line. */
const specSub = x => nowR()["skill.slot"](x);
const nsGate = g => `<a href="#${g.id}" data-now="gate:${g.id}">${g.title}</a>`;
/* A blocker text at the start of a line. */
const capFirst = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const isBasic = () => document.body.classList.contains("basic");
function nowCard(a) {
  const { act } = a, lv = char(state).level, away = L => `${L - lv} level${L - lv === 1 ? "" : "s"} away`;
  switch (a.kind) {
    case "step": return { ico: "⚑", t: stepHTML(a.g, a.x), sub: `Lv ${a.g.lv} milestone · ${nsGate(a.g)}`, btn: "Done", act };
    case "missed": return { ico: "↺", t: stepHTML(a.g, a.x), sub: `Missed · Lv ${a.g.lv} ${nsGate(a.g)}`, btn: "Done", act };
    case "adv": return { adv: true, ico: "⚑", t: stepHTML(a.g, a.x), sub: `Optional · Lv ${a.g.lv} milestone · ${nsGate(a.g)}`, btn: "Done", act };
    case "story": return storyView(a);
    /* E6: what opens it, in the words every card uses (src/core/blockers.js) */
    case "laterStep": return { ico: "⚑", t: a.x ? stepHTML(a.g, a.x) : `<b>${a.g.title}</b>`, sub: `Lv ${a.g.lv} milestone · ${away(a.g.lv)}${chainsOn() && a.why ? ` · ${a.why}` : ""}`, act, later: true };
  }
  /* a kind the pack produces: its renderer returns the same view object (keys with a dot are hooks, not kinds) */
  const R = nowR(), r = !a.kind.includes(".") && Object.hasOwn(R, a.kind) && R[a.kind];
  if (r) return r(a, nowCtx());
  throw new Error("Next up: unknown card " + a.kind);
}
/* The end of the guide's story (0.3 E10): the last covered quest turned in; the game's next story quest unlocks past the cap. */
/* set at mount: STORY_END is the pack's, handed over after this module is loaded */
let STORY_DONE = "", END_NEXT = "";
function storyView(a) {
  const { act } = a;
  if (a.v === "unset") return { story: true, ico: "📜", t: "Set your current main quest", sub: "In the Journey card; it places you on the story.", btn: "Show", act };
  if (a.v === "end") return { story: true, ico: "📜", t: STORY_DONE, sub: `${capFirst(END_NEXT)} · the guide's story ends at "${a.quest}"`, act };
  /* what else to do at your level, and where the objectives send you: in the pack's words */
  const R = nowR(), ctx = nowCtx();
  const xs = a.meanwhile && R["story.meanwhile"] ? R["story.meanwhile"](a.meanwhile, ctx) : "";
  const gatedSub = `Needs Lv ${a.gateLv}: you're ${a.lv}. Level up first.${xs ? `<span class="ns-mean">Meanwhile: ${xs}</span>` : ""}`;
  /* Below the quest's unlock level (turnInNeedsLv): no "Turned in", the tag says when (as the Journey card does). */
  const tag = a.turnInLv ? `Turn in at Lv ${a.turnInLv}` : undefined;
  if (a.v === "nolist") return { story: true, ico: "📜", t: `Continue the story: <b>${a.quest}</b>`, sub: a.gated ? gatedSub : a.nq ? `Main story · then ${a.nq[1]}` : "Main story", btn: "Turned in", act, tag };
  const where = R["story.where"] ? R["story.where"](a, ctx) : "";
  /* a row of the pack's under the text, above the action (0.5 P15: the "Bind X" row) */
  const row = R["story.row"] ? R["story.row"](a, ctx) : "";
  return { story: true, ico: "📜", t: `Story: <b>${a.quest}</b>`, sub: a.gated ? gatedSub : `${a.done}/${a.total} objectives${where ? ` · ${where}` : ""}${a.nq ? ` · then ${a.nq[1]}` : ""}`, btn: "Turned in", act, tag, quest: a.objectives, row };
}
/* Phones (<= 600 px, 0.5 P3; docs/design/phone-layout.md 3.4): no nested scroll stack. The featured card is full width
   with its action(s) under the text, the others are compact rows (tile, title, one line), and in Advanced a "1 of N"
   pager picks the featured card (Basic hides the Next up header: no pager, owner 2026-10-17). Never in the pop-out. */
let nsPhoneQ = { matches: false }; /* the media query, from the mount (no DOM at import) */
const nsPhone = () => !pipWin && nsPhoneQ.matches;
let nsCur = 0;
function renderNow() {
  const el = nowEl; if (!el) return;
  const lv = char(state).level;
  const ranked = rankNext(state, { basic: isBasic() }), shown = ranked.map(nowCard);
  /* band labels (0.5 P14, S1): above a card whose band differs from the card before it; rankNext sets lvBand only when
     the list spans more than one band (Advanced). A band is its start level plus the missed flag, so a missed card next
     to a current one in the same band gets its own label (intended: "Missed · Lv 20–24", then "Lv 20–24") */
  const bandKey = b => b ? `${b.missed ? "m" : ""}${b.from}` : "";
  const bandTxt = b => `${b.missed ? "Missed · " : ""}Lv ${b.from}${b.to == null ? "+" : b.to > b.from ? `–${b.to}` : ""}`;
  const bandAt = i => { const b = ranked[i] && ranked[i].lvBand; return b && (i === 0 || bandKey(ranked[i - 1].lvBand) !== bandKey(b)) ? `<p class="ns-band">${bandTxt(b)}</p>` : ""; };
  const top = shown[0], phone = nsPhone(), pager = phone && !isBasic() && shown.length > 1;
  /* the featured card: the first one, or on a phone the one the pager is on */
  nsCur = pager ? Math.min(nsCur, shown.length - 1) : 0;
  /* One card per action, each laid out like a milestone header (icon box · what · its own control). Only the first
     shows; the rest sit below it in a snap-scroll stack (a sliver of the next one peeks out). */
  /* a queue (a view's queue name): only its first card gets the button, the rest say they come after it */
  const firstOf = {}; shown.forEach((a, i) => { if (a.queue && !(a.queue in firstOf)) firstOf[a.queue] = i; });
  const info = (a, i) => a.info ? ` <button type="button" class="tipbtn nsinfo" aria-label="More info" aria-expanded="false" aria-controls="nsInfo${i}">i</button>` : "";
  const control = (a, i) => {
    if (a.later) return `<span class="tag">Later</span>`;
    if (a.tag) return `<span class="tag">${a.tag}</span>`;
    if (!a.act) return "";
    if (a.queue && i !== firstOf[a.queue]) return `<span class="tag">After the one above</span>`;
    /* completing it here (a view's done flag) makes the primary button; any other action goes somewhere */
    const done = a.done || /^(tick:|story$)/.test(a.act);
    return `<button type="button" class="${done ? "ns-btn primary" : "ns-go"}" data-now="${a.act}">${a.btn || "Done"}</button>`;
  };
  /* Progress bars run along the card's bottom edge (like the milestone cards); their label joins the subline. */
  const splitBar = a => { if (!a.bar) return { bar: "", lbl: "" }; const m = a.bar.match(/<span class="nsq-barl">([\s\S]*?)<\/span>/); return { bar: a.bar.replace(/<span class="nsq-barl">[\s\S]*?<\/span>/, ""), lbl: m ? m[1] : "" }; };
  /* on a phone the "i" opens the subline instead of following the title (at the end of either it wrapped onto a line of its own) */
  const card = (a, i) => { const pb = splitBar(a), sub = [a.sub, pb.lbl ? `<span class="nw">${pb.lbl}</span>` : ""].filter(Boolean).join(" · "), ti = phone ? "" : info(a, i), pi = phone ? info(a, i) : "";
    return `<article class="ns-card${i === nsCur ? " first ns-primary nsbox" : ""}${a.later ? " later" : ""}${pb.bar ? " has-bbar" : ""}${nsAnim ? " rise" : ""}">` +
    bandAt(i) + `<div class="ns-mhead"><div class="num ns-num" aria-hidden="true">${a.ico}</div><div class="title"><h3>${a.t}${ti}</h3>${sub || pi ? `<p>${pi}${sub}</p>` : ""}${a.row || ""}${a.info ? `<span class="ns-info" id="nsInfo${i}">${a.info}</span>` : ""}</div>` +
    (a.extra ? `<div class="ns-extra">${a.extra}</div>` : "") + `<div class="meta">${control(a, i)}</div></div>${a.quest ? nsObjHTML() : ""}${pb.bar ? `<div class="ns-bbar">${pb.bar}</div>` : ""}</article>`; };
  const pg = pager ? `<div class="ns-pg" role="group" aria-label="Next up cards"><button type="button" class="ns-pgb" data-nspg="-1" aria-label="Previous card">‹</button><span class="ns-pgn" aria-live="polite">${nsCur + 1} of ${shown.length}</span><button type="button" class="ns-pgb" data-nspg="1" aria-label="Next card">›</button></div>` : "";
  el.innerHTML = `<div class="sec ns-sec"><h2 class="sec-h">Next up</h2>${pg}${window.documentPictureInPicture ? `<button type="button" class="ns-pop" data-nspop title="Keep Next up in a small window on top of the game">Pop out</button>` : ""}</div>` + trackHTML() + (top ? `<div class="ns-stack${phone ? " ns-phone" : ""}" id="nsqWrap">${shown.map(card).join("")}</div>`
    : `<div class="ns-stack"><article class="ns-card first"><div class="ns-mhead"><div class="num ns-num" aria-hidden="true">✓</div><div class="title"><h3>You're caught up for Lv ${lv}</h3><p>Push the story to the next level.</p></div><div class="meta"></div></div></article></div>`);
  nsAnim = false;
  if (pipWin) syncPipClasses();
  const w = el.querySelector("#nsqWrap"), vw = nsWin();
  if (w && !phone) {
    /* The stack is as tall as the card snapped into view (+ a peek of the next one), so a taller card is never clipped. */
    const curCard = () => { const cs = [...w.children], t = w.scrollTop; let best = cs[0], bd = Infinity; cs.forEach(c => { const d = Math.abs(c.offsetTop - cs[0].offsetTop - t); if (d < bd) { bd = d; best = c; } }); return best; };
    const fit = () => { const c = curCard(); if (c) w.style.height = (c.offsetHeight + (c.nextElementSibling ? 30 : 0)) + "px"; };
    const end = () => w.classList.toggle("at-end", w.scrollTop + w.clientHeight >= w.scrollHeight - 2);
    let fitT = 0; w.addEventListener("scroll", () => { end(); vw.clearTimeout(fitT); fitT = vw.setTimeout(() => { fit(); end(); }, 140); }, { passive: true }); vw.requestAnimationFrame(() => { fit(); end(); });
    const RO = vw.ResizeObserver || window.ResizeObserver; if (typeof RO === "function") { const ro = new RO(() => { fit(); end(); }); [...w.children].forEach(c => ro.observe(c)); }
  }
  /* After completing a card, keep keyboard focus on the new top card's control. */
  if (w && nsRefocus > Date.now()) { const c = w.querySelector(".ns-card.first .meta button, .ns-card.first .meta a"); if (c) c.focus({ preventScroll: true }); }
}
/* The track toggle (0.5 P14, S1): Fastest / Completionist, the view setting `track` (top-level, per device, not synced),
   written only by a click. Advanced only, and hidden while no record has a non-core route (tracksDiffer; owner, S1 Q7,
   DECISIONS 2026-10-17). Under it the drawbacks line, the pack's words ("track.drawbacks"; none: no line). After them
   the pack's own view settings ("now.opts", 0.5 P16; S1 Q6': in this row in every Advanced frame, never in Basic). */
function trackHTML() {
  if (isBasic()) return "";
  const R = nowR(), po = R["now.opts"] ? R["now.opts"](nowCtx()) : "";
  let tk = "";
  if (rankChangeOn("trackFilter") && tracksDiffer()) {
    const t = trackOf(state), dl = R["track.drawbacks"] ? R["track.drawbacks"](t, nowCtx()) : "";
    const b = (v, txt) => `<button type="button" class="ns-trk${t === v ? " on" : ""}" data-nstrack="${v}" aria-pressed="${t === v}">${txt}</button>`;
    tk = `<div class="ns-seg" role="group" aria-label="Track">${b("fastest", "Fastest")}${b("completionist", "Completionist")}</div>${dl ? `<p class="ns-drawb">${dl}</p>` : ""}`;
  }
  return tk || po ? `<div class="ns-opts">${tk}${po}</div>` : "";
}
/* The phone pager: d = -1 / +1, round the list. Focus stays on the pager button that was used (from the keyboard
   elsewhere in the card it moves to the new card's control). */
function nsPage(d, from) {
  const n = nowEl.querySelectorAll("#nsqWrap > .ns-card").length; if (n < 2) return;
  nsCur = (nsCur + d + n) % n; renderNow();
  const f = (from && nowEl.querySelector(`[data-nspg="${from}"]`)) || nowEl.querySelector(".ns-card.first .meta button, .ns-card.first .meta a") || nowEl.querySelector('[data-nspg="1"]');
  if (f) f.focus({ preventScroll: true });
}
/* Next up can live in a pop-out (Document Picture-in-Picture) window: everything goes through this node, never a
   document lookup, and timers/frames come from whichever window currently holds it. */
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
  [tipClick, tipGoClick, ...(nowR()["now.docClicks"] ? nowR()["now.docClicks"]() : [])].forEach(f => d.addEventListener("click", f));
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
  /* on a phone the pager moves (Advanced); Basic's list is all in view */
  if (!inPip && nsPhone()) { if (nowEl.querySelector("[data-nspg]")) { e.preventDefault(); nsPage(d, t && t.dataset && t.dataset.nspg); } return; }
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
  nowEl.addEventListener("toggle", e => { const f = nowR()["now.toggle"]; if (f) f(e, nowCtx()); }, true);
  nowEl.addEventListener("click", e => {
    if (e.target.closest("[data-nspop]")) { popOutNow(); return; }
    const pgb = e.target.closest("[data-nspg]"); if (pgb) { nsPage(+pgb.dataset.nspg, pgb.dataset.nspg); return; }
    const tb = e.target.closest("[data-nstrack]");
    if (tb) { if (TRACKS.includes(tb.dataset.nstrack) && state.track !== tb.dataset.nstrack) { state.track = tb.dataset.nstrack; nsCur = 0; save(); renderNow(); } return; }
    /* the pack's own controls inside a card (drawn by its renderers) */
    const pc = nowR()["now.click"]; if (pc && pc(e, nowCtx())) return;
    const ib = e.target.closest(".nsinfo"); if (ib) { e.stopPropagation(); ib.setAttribute("aria-expanded", String((ib.closest(".ns-card") || ib.closest(".nsq, .nsbox")).classList.toggle("show-info"))); return; }
    const b = e.target.closest("[data-now]"); if (!b) return;
    const a = b.dataset.now;
    /* Completing the top card: it slides up and out, then the queue rises into place. */
    if (b.closest(".ns-primary") && (/^(tick:|obj:|story$)/.test(a) || b.matches(".ns-btn.primary")) && !b.dataset.go) {
      e.preventDefault(); b.dataset.go = "1"; b.disabled = true;
      nowEl.querySelector(".ns-primary").classList.add("out");
      window.setTimeout(() => { nsAnim = true; nsRefocus = Date.now() + 1500;
        /* If the pop-out closed meanwhile, the card was re-rendered: click the live copy of the same action. */
        const live = b.isConnected ? b : nowEl.querySelector(`[data-now="${CSS.escape(a)}"]`) || b;
        live.dataset.go = "2"; live.disabled = false; live.click(); }, 320);
      return;
    }
    if (b.tagName === "A") e.preventDefault();
    /* a pack action, or the pack's part of one the engine then finishes (tick:) */
    const pa = nowR()["now.act"]; if (pa && pa(a, nowCtx())) return;
    if (a.startsWith("tick:")) { const k = a.slice(5);
      const src = mainEl.querySelector(`input[data-k="${CSS.escape(k)}"]`);
      if (src) { if (!src.checked) src.click(); return; }
      /* Not on screen (e.g. a row outside the selected band): tick it through the same handler. */
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
  /* crossing 600 px draws it in the other layout, the featured card back on the first */
  if (window.matchMedia) nsPhoneQ = matchMedia("(max-width: 600px)");
  if (nsPhoneQ.addEventListener) nsPhoneQ.addEventListener("change", () => { nsCur = 0; renderNow(); });
}

const nextUpCard = { id: "nextup", slot: "main", order: 100, root: "nowStar", mount: nextUpMount, update: () => renderNow() };
export { renderNow, nowEl, pipWin, capFirst, isBasic, specSub, STORY_DONE, END_NEXT, nextUpCard };
