/* The page shell (entry point). What the app decides lives in the pure core (src/core/: state, migrations, catalog,
   requirements, Next up ranking); the cards live in src/cards/ (the engine's) and in the game pack (the pack's).
   This file reads the save from storage and writes it back, hands the game pack to the engine, registers the cards and
   calls them (render(), update()), and keeps what belongs to no card: the header (Basic / Advanced), layout fitting, the
   "i" popovers, the toast and sounds, the number steppers, export / import and Report a problem. scripts/build.mjs
   bundles it with esbuild into one classic <script> inlined in the page, so its top-level names stay page globals (tests
   and the site-only script read them). Character data (level, story, ticks, build) is always read and written through
   char(state) (src/core/state.js). */
/* the game pack, as one module: "pack" is the pack's shell.js (scripts/build.mjs maps the name): the pack object, its
   tables and helpers the cards get by their old names, its cards' hand-over of the shell's names (aion2UsePage, below)
   and what the shell still calls of its cards */
import { CONF, SD_RW, SOURCES, SRC_SITE, STORY_END, ITEMS, E_ORDER, LEVEL_POINTS, RMB_STACK, seq, TIPS, GATES, STEPS, QUESTS,
  QUEST_STEPS, STORY_UNLOCKS, UNLOCK_GATE, VERIFIED_UNLOCKS, NO_AREA, SH_REWARD, aion2Pack, aion2UsePage, aion2DungeonMap,
  aion2QuestMap, mapFocus, aion2TipId, ini, spMini, stIco, dvShort, goAreas, cubeClick, stLvClick, stTickClick, stUpClick,
  AREA_ITEMS, CLEAR_REWARD, DV_NODES, RQ_BY, RQ_K, bandOf, eputK, spCostTxt, dvFromLv, dvGateOf, dvLeft, objSubs, rqStatus,
  shardsFromLv, slotNames, specPickOf, stLvOfC, stigmaPlan, stigmaSlots, rqReqOf, ascensionOf, aion2AscensionCard,
  renderAscension } from "pack";
import { activePack, usePack } from "./core/pack.js";
import { mountAll, registerCard, registeredCards, updateCard } from "./core/cards.js";
import { sourcesCards } from "./cards/sources.js";
import { KEY, char, loadState, parseExport } from "./core/state.js";
import { migrate } from "./core/migrations.js";
import { stamp, stampSave } from "./core/sync.js";
import { addChar, removeChar, renameChar, switchChar } from "./core/chars.js";
/* the save is read and written only through this storage (interface: src/core/storage.js) */
import { webStorage as saveStore } from "./shell/storage-web.js";
import { newId } from "./shell/ids.js";
/* the whole module lands in this bundle; src/site.js reads its line / nudge / hint helpers as page globals */
import { importBackup, markExport } from "./core/backup.js";
import { itemByK } from "./core/catalog.js";
import { checkableOf, countsOf, derivedOf, doneOf, gateChangeOn, gatesOf, mainCountsOf, objIdxOf, objPartsOf, openOf, qProgOf, questIdx, sideOpenOf,
  setGateChanges, gatesPass, storyGate, storyIdx, turnInNeedsLv, chainsOn, stepChipOf, storyLineOf } from "./core/requirements.js";
import { rankNext, setRankChanges } from "./core/nextup.js";
/* the engine's cards (0.4 P4c, src/cards/): what the shell still calls of them, and the hand-over of the shell's names
   they read (useCardPage, below) */
import { useCardPage } from "./cards/page.js";
import { nextUpCard, renderNow, nowEl, pipWin, isBasic, specSub } from "./cards/nextup.js";
import { milestonesCard, renderMilestones, derivedBox, fillStigmaText, milestoneFilters, syncExpand, syncQRun } from "./cards/milestones.js";
import { renderRoute, routeRulesCard } from "./cards/route.js";
import { journeyCard, renderQuest, renderStoryChips, renderStoryReqs } from "./cards/journey.js";
import { aheadCard } from "./cards/ahead.js";
import { renderUndo, undoCard } from "./cards/undo.js";
import { charactersCard } from "./cards/characters.js";
/* the engine reaches the game through this one pack object; set before anything asks the engine (the save is loaded below) */
usePack(aion2Pack);
/* Cards through the registry (src/core/cards.js, 0.4 P4a): render() draws the milestone and Route rules cards (on every
   call) and mounts the cards; update() calls each card with updateCard, in the old order (updatePass). Confidence and
   Sources get the tables they draw from here (P5d moves them into the pack); the pack's own cards come with it (0.4 P4b);
   the engine's cards (0.4 P4c) read the shell's names handed over with useCardPage (below). */
sourcesCards({ CONF, SOURCES, SRC_SITE }).forEach(registerCard);
activePack().cards.forEach(registerCard);
[journeyCard, aheadCard, undoCard, nextUpCard, milestonesCard, routeRulesCard].forEach(registerCard);
/* the character switcher in the header (0.5 P18): picking another character, adding, renaming (0.5 P19) or removing one
   (P19; a removed current one hands over to the first remaining slot) stores the new save and reloads (useSave, below),
   so every card starts over with the current character */
registerCard(charactersCard({ onSwitch: id => useSave(switchChar(state, id)), onAdd: ({ class: cls, name }) => useSave(newCharSave(cls, name)),
  onRename: (id, name) => useSave(renameChar(state, id, name)), onRemove: id => useSave(removeChar(state, id)) }));
/* the pack's card in a section of Journey: registered after Journey, which declares the section */
registerCard(aion2AscensionCard);
/* what a card reads (P0 §4), built once per render() / update(); ev = the character's gates (memoised inside gatesPass) */
const cardCtx = () => { const c = char(state); return { state, c, pack: activePack(), basic: state.mode === "basic", get ev() { return gatesOf(c); } }; };

/* Page API: the names the suites (and the old baseline builds they compare against) call, bound to the page's state. */
const stNames = () => slotNames(char(state));
const STIGMA_SLOTS = () => stigmaSlots(char(state));
const stPlan = () => stigmaPlan(char(state));
const stLvOf = n => stLvOfC(char(state), n);
const rqAvail = (q, lv = char(state).level) => rqStatus(char(state), q, lv);
const qProg = k => qProgOf(char(state), k);
const dvLeftNow = () => dvLeft(char(state));
const dvGate = k => dvGateOf(char(state), k);
const checkable = s => checkableOf(state, s);
const counts = s => countsOf(state, s);
const mainCounts = s => mainCountsOf(state, s);
const sideOpen = s => sideOpenOf(state, s);
const objIdx = list => objIdxOf(state, list);

/* Reduced motion: every scroll the script starts goes through SMOOTH() (instant when the user asks for less motion). */
const RMQ = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
const SMOOTH = () => RMQ.matches ? "auto" : "smooth";

/* Test hook (tests/golden.js --explain): the 0.3 E4 changes to run with, set by the runner before the page loads; the
   page itself runs with all of them on. */
if (Array.isArray(window.__gateChanges)) setGateChanges(window.__gateChanges);
/* ... and the ranking changes of smart Next up (RANK_CHANGES and the pack's table) to run with; the page runs with each
   table's `on` (0.5 P11: all off). */
if (Array.isArray(window.__rankChanges)) setRankChanges(window.__rankChanges);
/* The save from storage (save v5; anything else starts fresh), then the load-time steps (src/core/migrations.js). */
let { state, hadSave } = loadState(saveStore.get(KEY), { now: Date.now(), newId });
migrate(state, hadSave, storeState, Math.floor(Date.now() / 1000));
/* Every write of the progress goes through storeState(); each one stamps the current character's per-item change times
   (stampSave, src/core/sync.js). A write
   that fails (storage full, private mode, storage disabled) shows the #saveWarn banner; the next write that works hides it. */
function storeState() {
  stampSave(state, Date.now());
  setSaveWarn(!saveStore.set(KEY, JSON.stringify(state)));
}
function setSaveWarn(on) {
  const el = document.getElementById("saveWarn"); if (!el || el.hidden === !on) return;
  el.hidden = !on;
}
const save = () => { storeState(); };
/* A save with a new character (src/core/chars.js addChar), current: it starts where a fresh browser does (Lv 1, on the
   first story quest, its defaults stamped at time 0 so they never outrank another device's progress; migrate()). */
function newCharSave(cls, name) {
  const next = addChar(state, { class: cls, name, now: Date.now(), id: newId() }), c = char(next), quests = activePack().data.story.quests;
  c.level = 1; if (quests.length) c.quest = quests[0][1];
  stamp(c, 0);
  return next;
}
/* Another current character (0.5 P18): store the save and reload, so the load-time steps and every card run for that
   character. A write that fails keeps the page as it is and shows the banner. */
function useSave(next) {
  stampSave(next, Date.now());
  if (!saveStore.set(KEY, JSON.stringify(next))) { setSaveWarn(true); return; }
  location.reload();
}

const mainEl = document.getElementById("main");
const layoutEl = document.querySelector(".layout");

function render() {
  renderMilestones();
  renderRoute();
  mountAll(Object.fromEntries(registeredCards().filter(x => x.root).map(x => [x.root, document.getElementById(x.root)])), cardCtx());
}
/* the "i" popovers number their ids in one sequence with the pack cards' tips (aion2TipId, the pack's cards/shared.js) */
layoutEl.addEventListener("click", e => {
  const btn = e.target.closest(".tip"); if (!btn || btn.closest(".coll")) return;
  e.preventDefault(); e.stopPropagation();
  const li = btn.closest("li");
  const open = btn.getAttribute("aria-expanded") === "true";
  layoutEl.querySelectorAll("li.tipbox").forEach(b => b.remove());
  layoutEl.querySelectorAll('li .tip[aria-expanded="true"]').forEach(b => { b.setAttribute("aria-expanded", "false"); b.removeAttribute("aria-controls"); });
  if (open) return;
  const tip = TIPS[btn.dataset.tip]; if (!tip) return;
  const box = document.createElement("li");
  box.className = "tipbox" + (li.classList.contains("sub-h") ? " wide" : "");
  box.innerHTML = `<h4>${tip.h}</h4>${tip.b}<p class="src muted">Source: ${tip.src}</p>`;
  box.id = "tipbox" + aion2TipId();
  li.after(box);
  btn.setAttribute("aria-expanded", "true"); btn.setAttribute("aria-controls", box.id);
});
/* Confidence and Sources fold; open state remembered. */
document.querySelectorAll("details.foldcard").forEach(d => { const k = "fold_" + d.id; d.open = !!(state[k]); d.addEventListener("toggle", () => { state[k] = d.open; save(); }); });
/* Basic / Advanced view. Basic keeps each card to its essentials: what you have, the one thing to do, and its button. */
function applyMode() {
  const m = state.mode === "basic" ? "basic" : "advanced";
  document.body.classList.toggle("basic", m === "basic");
  document.querySelectorAll(".modeseg [data-mode]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mode === m)));
}
document.querySelector(".modeseg").addEventListener("click", e => { const b = e.target.closest("[data-mode]"); if (!b) return; state.mode = b.dataset.mode; save(); applyMode(); update(); });
applyMode();
/* A short message at the foot of the screen (rewards, the level-up gains under reduced motion), with an optional Undo. */
function rewardToast(msg, undo) {
  let t = document.getElementById("rwToast"); if (!t) { t = document.createElement("div"); t.id = "rwToast"; t.setAttribute("role", "status"); document.body.appendChild(t);
    t.addEventListener("animationend", () => { t.classList.remove("has-undo"); t.innerHTML = ""; }); }
  t.textContent = msg; t.classList.toggle("has-undo", !!undo);
  if (undo) { const b = document.createElement("button"); b.type = "button"; b.className = "tu"; b.textContent = "Undo"; b.addEventListener("click", () => { t.classList.remove("show", "has-undo"); t.innerHTML = ""; undo(); }, { once: true }); t.appendChild(b); }
  t.classList.remove("show"); void t.offsetWidth; t.classList.add("show");
}

function tipClick(e) { const t = e.target.closest && e.target.closest(".tipbtn"); (e.currentTarget.nodeType === 9 ? e.currentTarget : document).querySelectorAll(".tipwrap.open").forEach(w => { if (!t || w !== t.parentElement) tipSet(w, false); }); if (t && t.parentElement.classList.contains("tipwrap")) tipSet(t.parentElement, !t.parentElement.classList.contains("open")); else if (t) t.parentElement.classList.toggle("open"); }
const tipSet = (w, o) => { w.classList.toggle("open", o); const b = w.querySelector(".tipbtn"); if (b) b.setAttribute("aria-expanded", String(o)); };
/* Escape closes the open "i" popover (milestone / card tips, Next up info) and returns focus to its button; a popover
   that is showing on hover hides until the pointer leaves it. */
function tipEsc(e) {
  if (e.key !== "Escape") return;
  const d = e.currentTarget.nodeType === 9 ? e.currentTarget : document, f = d.activeElement;
  let back = null;
  d.querySelectorAll('.tip[aria-expanded="true"]').forEach(b => { b.setAttribute("aria-expanded", "false"); b.removeAttribute("aria-controls"); back = back || b; });
  d.querySelectorAll("li.tipbox").forEach(b => b.remove());
  d.querySelectorAll(".tipwrap.open").forEach(w => { tipSet(w, false); back = back || w.querySelector(".tipbtn"); });
  d.querySelectorAll(".tipwrap:hover").forEach(w => { w.classList.add("shut"); w.addEventListener("pointerleave", () => w.classList.remove("shut"), { once: true }); });
  d.querySelectorAll(".show-info").forEach(c => { c.classList.remove("show-info"); const b = c.querySelector(".nsinfo"); if (b) { b.setAttribute("aria-expanded", "false"); back = back || b; } });
  if (back && (!f || f === d.body || !f.closest || f.closest(".term, .tipwrap, li.tipbox, .ns-card"))) back.focus();
}
document.addEventListener("keydown", tipEsc);
document.addEventListener("click", tipClick);
function tipGoClick(e) { const b = e.target.closest && e.target.closest("[data-tipgo]"); if (!b) return; const pb = document.querySelector(`#progRows [data-prog="${b.dataset.tipgo}"]`); if (pb) pb.click(); }
document.addEventListener("click", tipGoClick);
/* One gatesPass: every gatesOf for this character during the render shares one evaluator (src/core/requirements.js). */
function update() { gatesPass(updatePass); }
function updatePass() {
  const ctx = cardCtx();
  updateCard("characters", ctx);
  updateCard("milestones", ctx);
  updateCard("route", ctx);
  updateCard("journey", ctx);
  updateCard("areas", ctx);
  milestoneFilters();
  /* the top row's cards, in their order (the pack's build cards; a card without update is skipped) */
  registeredCards().filter(x => x.slot === "top").forEach(x => updateCard(x.id, ctx));
  fillStigmaText();
  syncQRun();
  updateCard("nextup", ctx);
  /* each card is called where its old code stood, not with updateAll(ctx): the slot order (rail, top, main) would run the
     milestone filters after the Skills card redraws the board rows they hide, and Next up before the milestone text it
     reads (stepHTML). updateAll takes over when P5a–d make the cards independent of each other. */
  /* Card sizing reads layout: it runs in the next frame (renderNext schedules fitSkills), so update() never forces a layout. */
  if (typeof syncExpand === "function") syncExpand();
  requestAnimationFrame(fitRail);
}

/* Fill the Skills card down to the height of its neighbours: drop Coming up rows that don't fit (min 3). */
/* Elastic lists (Skills "Coming up", the board list) show at least 3 rows, then add rows while their card
   stays within the tallest card's natural height, so the row ends level without any card setting the height. */
/* Scroll areas with a hidden bar and a bottom fade that clears once you reach the end. */
function fadeScroll(el) {
  if (!el || el.dataset.fs) { if (el) requestAnimationFrame(() => el.classList.toggle("at-end", el.scrollTop + el.clientHeight >= el.scrollHeight - 2)); return; }
  el.dataset.fs = "1";
  const end = () => el.classList.toggle("at-end", el.scrollTop + el.clientHeight >= el.scrollHeight - 2);
  el.addEventListener("scroll", end, { passive: true }); requestAnimationFrame(end);
}
/* Basic mode: the left column ends where the milestone card ends, and scrolls with the same fade. */
function fitRail() {
  const rail = document.querySelector("aside.rail"), main = document.getElementById("main"); if (!rail || !main) return;
  rail.style.height = "";
  if (!document.body.classList.contains("basic") || getComputedStyle(document.querySelector(".layout")).gridTemplateColumns.split(" ").length < 2) return;
  const vis = [...document.querySelectorAll("#gates details.step")].filter(d => getComputedStyle(d).display !== "none").pop();
  const end = vis ? vis.getBoundingClientRect().bottom : main.getBoundingClientRect().bottom;
  const h = Math.round(end - rail.getBoundingClientRect().top);
  if (h > 120) rail.style.height = h + "px";
  fadeScroll(rail);
}
/* Phones (<= 860 px): Next up, Journey, Progress lead the page (docs/design/phone-layout.md 3.1). The same three elements
   move into #main ahead of the top row (never copies); the CSS puts #main before the rail, which keeps the later cards
   (Dungeons, The map). Wider than 860 px they go back to where the markup has them. */
const phoneQ = window.matchMedia ? matchMedia("(max-width: 860px)") : { matches: false };
/* each card's home (its parent and the node after it) is noted before the first move, so going back to the wide layout
   gives exactly the markup a fresh load has */
const phoneCards = [document.getElementById("nowStar"), document.querySelector("aside.rail > section.where"), document.querySelector("aside.rail > section:first-child")]
  .map(el => el && { el, p: el.parentNode, n: el.nextSibling });
let phoneLayout = false;
function placeCards() {
  const tg = document.querySelector("#main .top-grid");
  if (!tg || phoneCards.includes(null) || phoneQ.matches === phoneLayout) return;
  phoneLayout = phoneQ.matches;
  if (phoneLayout) tg.before(...phoneCards.map(x => x.el));
  else [...phoneCards].reverse().forEach(x => x.p.insertBefore(x.el, x.n));
}
if (phoneQ.addEventListener) phoneQ.addEventListener("change", () => { placeCards(); requestAnimationFrame(fitRail); });
placeCards();
window.addEventListener("resize", () => requestAnimationFrame(fitRail));
document.getElementById("gates").addEventListener("toggle", () => requestAnimationFrame(fitRail), true);
/* Web fonts (font-display: swap) land after the first fit and rewrap the text: refit when the fonts settle (the hero
   rows too, as on a resize: they set the top row's height) and whenever the main column or the milestone list changes
   size, at most once a frame. */
let railQueued = false, heroQueued = false;
const refitRail = () => { if (railQueued) return; railQueued = true; requestAnimationFrame(() => { railQueued = false; if (heroQueued) { heroQueued = false; fitSkills(); } fitRail(); }); };
const fontsSettled = () => { heroQueued = true; refitRail(); };
if (document.fonts) { document.fonts.addEventListener("loadingdone", fontsSettled); document.fonts.ready.then(fontsSettled); }
if (typeof ResizeObserver === "function") { const ro = new ResizeObserver(refitRail); ro.observe(document.getElementById("main")); ro.observe(document.getElementById("gates")); }
/* Hero rows: names wrap instead of "…"; both cards' rows take the taller one's height so they stay aligned. */
function syncHeroRows() {
  const a = document.querySelector("#spCard .sphero .dvhead"), b = document.querySelector("#dvNextList .dvhead"), c = document.querySelector("#stCard .dvhead");
  /* All writes first, then one read pass, then the writes (one forced layout instead of four). */
  const xs = [a, b, c].filter(Boolean);
  xs.forEach(x => { x.style.height = ""; x.style.removeProperty("--hero"); x.querySelector(".dvtext").style.height = "auto"; x.style.minHeight = "0"; });
  const tg = document.querySelector("#main .top-grid");
  if (!a || !b || (tg && getComputedStyle(tg).gridTemplateColumns.split(" ").length < 2)) { xs.forEach(x => { x.querySelector(".dvtext").style.height = ""; }); return; }
  /* The icon is a square as tall as the text beside it; both cards share the taller one's size. */
  /* The icon grows with the text up to 72px; a bigger icon narrows the text beside it, so the row height is measured
     again with the final icon size (the row is never shorter than its text). */
  const ico = Math.min(72, Math.max(56, ...xs.map(x => x.querySelector(".dvtext").offsetHeight)));
  xs.forEach(x => x.style.setProperty("--hero", ico + "px"));
  const h = Math.max(ico, ...xs.map(x => x.querySelector(".dvtext").offsetHeight));
  xs.forEach(x => { x.style.minHeight = ""; x.style.height = h + "px"; x.querySelector(".dvtext").style.height = h + "px"; });
}
function fitSkills() {
  syncHeroRows();
  /* Basic mode: the shortest card sets the row height; Next up's content scrolls (with the fade) to match. */
  const ns = pipWin ? null : nowEl, tg = document.querySelector("#main .top-grid");
  if (ns) ns.style.height = "";
  if (ns) { const w = ns.querySelector(".ns-stack"), f = w && w.querySelector(".ns-card"); if (f) w.style.height = (f.offsetHeight + (w.children.length > 1 ? 30 : 0)) + "px"; }
  /* The board list always shows at least its next 3 nodes; the row grows to that, and Skills / Next up fill the same height. */
  const dvt = document.getElementById("dvThen");
  if (dvt) { dvt.style.minHeight = ""; } if (dvt && !document.body.classList.contains("basic")) { const nodes = [...dvt.querySelectorAll(".soonlist > li:not(.then-board)")], n3 = nodes[Math.min(2, nodes.length - 1)];
    if (n3) { const top = dvt.getBoundingClientRect().top - dvt.scrollTop; dvt.style.minHeight = Math.ceil(n3.getBoundingClientRect().bottom - top + 14) + "px"; } }
  fadeScroll(document.getElementById("spSoon")); fadeScroll(dvt);
  const grid = document.querySelector("#main .top-grid"); if (!grid) return;
  const lists = []; /* Coming up and the board list now scroll inside their cards (see fadeScroll) */
  const single = getComputedStyle(grid).gridTemplateColumns.split(" ").length < 2;
  /* Minimum: 3 node/skill rows (board headers don't count). */
  const showFirst = (rows, n) => { let c = 0; rows.forEach(li => { const node = !li.classList.contains("then-board"); li.hidden = c >= n; if (node && c < n) c++; }); trimHead(rows); };
  const trimHead = rows => { const vis = rows.filter(li => !li.hidden); const last = vis[vis.length - 1]; if (last && last.classList.contains("then-board")) last.hidden = true; };
  lists.forEach(x => showFirst(x.rows, single ? 6 : x.min));
  if (single) return;
  grid.style.alignItems = "start";
  const target = Math.max(0, ...[...grid.children].filter(c => !c.hidden).map(c => c.offsetHeight));
  lists.forEach(x => {
    for (const li of x.rows) { if (!li.hidden) continue; li.hidden = false; if (x.card.offsetHeight > target) { li.hidden = true; break; } }
    trimHead(x.rows);
  });
  grid.style.alignItems = "";
}
window.addEventListener("resize", () => requestAnimationFrame(fitSkills));

/* Sounds: the level-up chime (Journey) and the steppers' ping (below). */
let audioCtx = null;
function chime() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = audioCtx.currentTime, out = audioCtx.createGain(); out.gain.value = 0.18; out.connect(audioCtx.destination);
    [[523.25, 0], [659.25, 0.08], [783.99, 0.16], [1046.5, 0.26]].forEach(([f, d]) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = "triangle"; o.frequency.value = f; o.connect(g); g.connect(out);
      g.gain.setValueAtTime(0, t0 + d); g.gain.linearRampToValueAtTime(1, t0 + d + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + d + (d > 0.2 ? 0.9 : 0.35));
      o.start(t0 + d); o.stop(t0 + d + 1);
    });
  } catch (e) { /* no audio available: stay silent */ }
}
/* Short two-note ping: up = rising fifth (happy), down = the same notes falling. */
function blip(up) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = audioCtx.currentTime, out = audioCtx.createGain(); out.gain.value = 0.14; out.connect(audioCtx.destination);
    (up ? [[880, 0], [1318.5, 0.06]] : [[1318.5, 0], [880, 0.06]]).forEach(([f, d]) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = "sine"; o.frequency.value = f; o.connect(g); g.connect(out);
      g.gain.setValueAtTime(0, t0 + d); g.gain.linearRampToValueAtTime(1, t0 + d + 0.008);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + d + 0.18);
      o.start(t0 + d); o.stop(t0 + d + 0.2);
    });
  } catch (e) { /* no audio: stay silent */ }
}
/* +/− steppers next to number boxes: change the value and fire the box's own input handler. */
layoutEl.addEventListener("click", e => {
  const b = e.target.closest("[data-step]"); if (!b) return;
  const i = document.getElementById(b.dataset.step), before = parseInt(i.value, 10) || 0;
  i.value = Math.max(0, before + (+b.dataset.d));
  i.dispatchEvent(new Event("input", { bubbles: true }));
  /* a bright rising ping for +, the mirrored falling one for − (silent at 0). */
  if (state.sound !== false && +i.value !== before) blip(+b.dataset.d > 0);
});
/* Export / import progress: localStorage is the only copy, so offer a JSON file download and upload (P2-9). */
/* Inside claude.ai, saving a file goes through the viewer's downloads permission (the button only shows where that's available).
   Anywhere else (the standalone site) it is a plain Blob download. */
(async () => {
  const btn = document.getElementById("expBtn"), msg = document.getElementById("xferMsg");
  /* the save-failed banner offers the same Export action wherever this button is available */
  const show = on => { btn.hidden = !on; document.getElementById("saveWarnExp").hidden = !on; };
  /* no name or label in the file name (it may carry the player's name; docs/ARCHITECTURE.md §1) */
  const fname = () => `companion-save-${new Date().toISOString().slice(0, 10)}.json`;
  if (!(window.claude && window.claude.use)) {
    show(true);
    btn.addEventListener("click", () => {
      /* 0.2.5: the export time is stored before the file is built, so the file equals the save at the moment of export
         (the browser doesn't say whether the file was kept, hence "Last backup", not "saved") */
      markExport(state, Date.now()); save();
      const a = document.createElement("a"), url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 1)], { type: "application/json" }));
      a.href = url; a.download = fname(); document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    return;
  }
  let dl = null; try { dl = await window.claude.use("downloads"); } catch (e) { dl = null; }
  if (!dl) return;
  show(true);
  btn.addEventListener("click", async () => {
    try { await dl.save({ filename: fname(), data: JSON.stringify(state, null, 1) }); }
    catch (err) { const c = err && err.code; if (msg && c !== "declined") msg.textContent = c === "rate_limited" ? "A save prompt is already open." : "Export isn't available here."; if (c === "unavailable" || c === "not_granted") show(false); }
  });
})();
document.getElementById("impIn").addEventListener("change", async e => {
  const f = e.target.files && e.target.files[0], msg = document.getElementById("xferMsg"); e.target.value = ""; if (!f) return;
  /* only a v5 export (0.4 on) loads; anything else, a pre-0.4 export included, changes nothing */
  const data = parseExport(await f.text());
  if (!data) { msg.textContent = "This file is from a version before 0.4 and can't be loaded."; return; }
  const c = char(data), n = Object.values(c.checks || {}).filter(Boolean).length;
  msg.innerHTML = `Replace your progress with this file (Lv ${+c.level || "?"}, ${n} ticks)? <button type="button" class="go" id="impGo">Replace</button><button type="button" id="impNo">Cancel</button>`;
  document.getElementById("impNo").onclick = () => { msg.textContent = ""; };
  document.getElementById("impGo").onclick = () => {
    /* The progress being replaced is kept one step back under a separate key. */
    saveStore.set(KEY + ":before-import", JSON.stringify(state));
    /* 0.2.5: the file's backup times are another copy's; the import itself counts as a backup here (src/core/backup.js) */
    importBackup(data, Date.now());
    if (!saveStore.set(KEY, JSON.stringify(data))) { msg.textContent = "Couldn't save in this browser."; return; }
    location.reload();
  };
});
document.getElementById("saveWarnExp").addEventListener("click", () => document.getElementById("expBtn").click());
document.getElementById("srcLink").addEventListener("click", () => { document.getElementById("srcCard").open = true; });
/* Report a problem: a GitHub issue form (.github/ISSUE_TEMPLATE/bug.yml) whose fields are prefilled through the URL with
   the version, level, story quest, view mode, build and browser. Nothing else from the saved progress goes into the link.
   The href is refreshed when the link is about to be used, so it always carries the current level and quest. */
const APP_VERSION = "__APP_VERSION__", APP_BUILD = "__APP_BUILD__";
const reportLink = document.getElementById("reportLink");
/* the form's address as the page's markup holds it (src/index.html), before the first refresh adds the fields */
const reportBase = reportLink.getAttribute("href").split("?")[0];
const reportURL = () => {
  const f = { template: "bug.yml", version: APP_VERSION, level: String(char(state).level || ""), quest: char(state).quest || "(not set)",
    mode: state.mode === "basic" ? "Basic" : "Advanced", build: APP_BUILD, browser: navigator.userAgent };
  return reportBase + "?" + Object.entries(f).map(([k, v]) => k + "=" + encodeURIComponent(v)).join("&");
};
const refreshReport = () => { reportLink.href = reportURL(); };
["pointerdown", "focus", "mouseenter", "click", "contextmenu"].forEach(ev => reportLink.addEventListener(ev, refreshReport));
refreshReport();

/* the shell's names the pack's cards read (the pack's cards/page.js), handed over before the first render() */
aion2UsePage({ state, save, update, render, renderNow, renderQuest, renderAscension, renderStoryChips, renderStoryReqs, renderUndo,
  fitSkills, fadeScroll, rewardToast, chime, SMOOTH, derivedBox, isBasic, spMini, ini, specSub, stIco, dvShort,
  mainEl, layoutEl, STIGMA_SLOTS, stPlan, stLvOf, rqAvail, dvGate });
/* the shell's names the engine cards read (src/cards/page.js), handed over before the first render() */
useCardPage({ state, save, update, mainEl, layoutEl, SMOOTH, RMQ, rewardToast, chime, tipClick, tipGoClick, tipEsc, GATES,
  STEPS, QUESTS, QUEST_STEPS, STORY_UNLOCKS, UNLOCK_GATE, VERIFIED_UNLOCKS, STORY_END, SD_RW, SH_REWARD, NO_AREA,
  ITEMS, E_ORDER, LEVEL_POINTS, seq, AREA_ITEMS, CLEAR_REWARD, DV_NODES, RQ_K, bandOf, eputK, spCostTxt, dvFromLv,
  shardsFromLv, objSubs, rqReqOf, specPickOf, mapFocus, aion2QuestMap, aion2DungeonMap, goAreas, cubeClick,
  stTickClick, stUpClick, stLvClick, spMini, stIco, dvShort, STIGMA_SLOTS, stNames, rqAvail, qProg, counts,
  mainCounts, sideOpen, objIdx });
render(); update();
