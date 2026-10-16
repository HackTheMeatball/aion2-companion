/* The app script (entry point): the page, its rendering and its event handlers. What the app decides lives in the pure
   core (src/core/: state, migrations, catalog, requirements, Next up ranking); this file reads the save from storage,
   writes it back, and turns the core's answers into the page. scripts/build.mjs bundles it with esbuild into one classic
   <script> inlined in the page, so its top-level names stay page globals (tests and the site-only script read them).
   Character data (level, story, ticks, build) is always read and written through char(state) (src/core/state.js). */
import { CONF, RQ, SD_RW, SH_DATA, SOURCES, SRC_SITE, STORY_END } from "./data/generated.js";
import { ITEMS } from "./data/items.js";
import { DV_TYPE, DV_TYPE_ICONS, E_ORDER, LEVEL_POINTS, RMB_STACK, SP_ICONS, SP_SKILLS, SP_STEPS, STAT_SRC, STAT_TIERS, STIGMA_ICON, STIGMA_PLAN, ST_COST, ST_TARGETS } from "./data/build.js";
import { T, metaSlug, seq } from "./data/markup.js";
import { TIPS } from "./data/tips.js";
import { GATES, STEPS } from "./data/milestones.js";
import { QUESTS, QUEST_STEPS, STORY_UNLOCKS, UNLOCK_GATE, VERIFIED_UNLOCKS } from "./data/story.js";
import { NO_AREA, SD_REWARD, SH_REWARD, ZONE_TRACES } from "./data/areas.js";
import { KEY, char, loadState } from "./core/state.js";
import { migrate } from "./core/migrations.js";
import { stampSave } from "./core/sync.js";
import { AREA_BANDS, AREA_ITEMS, CLEAR_REWARD, DV_NODES, RQ_BY, RQ_K, bandOf, eputK, itemByK, spCostTxt } from "./core/catalog.js";
import { areaLater, areaOpen, checkableOf, clearDoneOf, countsOf, derivedOf, doneOf, dvFromLv, dvGateOf, dvLeft, dvNeed, dvNext, dvSpent, dvWaitOf, gatesOf, mainCountsOf, objIdxOf, objPartsOf, objSubs,
  openOf, qProgOf, questIdx, rqStatus, rotKeys, shardsFromLv, sideOpenOf, skillBuy, skillOpen, skillPoints, slotLevelMet, slotNames, stLvOfC, stigmaEquipOpen,
  setGateChanges, stigmaPlan, stigmaSlots, storyGate, storyIdx, turnInNeedsLv, chainsOn, rqReqOf, stepChipOf, storyLineOf } from "./core/requirements.js";
import { rankNext } from "./core/nextup.js";

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

const statSeqHTML = () => STAT_TIERS.map((t, i) => `<div class="tier"><span class="tier-n">Tier ${i + 1}</span><div class="seq">${t.map(x => `<span>${x}<em class="src">${STAT_SRC[x] || ""}</em></span>`).join("")}</div></div>`).join("");

/* "Not in game yet" in Next up (compact): eye with a slash. */
const EYE_OFF = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7c2 0 3.7.7 5.1 1.6M22 12s-3.6 7-10 7c-2 0-3.7-.7-5.1-1.6"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/></svg>`;
/* Big icons for every item named in a line, shown on its right. */
const icons = html => {
  const keys = [...new Set([...html.matchAll(/data-ico="(\w+)"/g)].map(m => m[1]))].filter(k => ITEMS[k][2]);
  return keys.length ? `<span class="icos">${keys.map(k => `<img src="${ITEMS[k][2]}" alt="${ITEMS[k][3]}" title="${ITEMS[k][3]}" loading="lazy" onerror="this.remove()">`).join("")}</span>` : "";
};
/* Reduced motion: every scroll the script starts goes through SMOOTH() (instant when the user asks for less motion). */
const RMQ = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
const SMOOTH = () => RMQ.matches ? "auto" : "smooth";

/* Each hideout name links to its allthings.how map page (location and nearest teleport). */
/* Metabot slugs drop apostrophes ("Valka's Nest" → valkas-nest); allthings.how keeps them as hyphens. */
/* Pin target: Metabot's Altgard interactive map, centred on the marker (the same links its own pages use).
   Dungeons focus by slug; strongholds by their quest id (2820001–2820015, read from each stronghold's page). */
const SH_QID = Object.fromEntries(SH_DATA.map(s => [s.name, s.qid]));
/* Category pages open the map preset to that one layer (dungeons / strongholds), so other markers stay off. */
const mapFocus = it => it.kind === "stronghold"
  ? `https://metabot.gg/en/aion-2/map/altgard/strongholds?focus=quest:${SH_QID[it.name]}`
  : `https://metabot.gg/en/aion-2/map/altgard/dungeons?focus=dungeon:${metaSlug(it.name)}`;
const dvName = it => `<span class="dvname ${DV_TYPE[it.ty][0]}">${it.t}</span>`;
const dvMeta = it => `${it.board} · ${DV_TYPE[it.ty][1]}${it.via ? " · " + it.via : ""}${it.blv === 21 ? " · learned at Lv 21" : ""}`;
/* Daevanion node row: "points spent" box first, then the tick (enabled once a cost is logged). */
function refreshDvGates() {
  layoutEl.querySelectorAll('input[type=checkbox][data-k^="dv:"]').forEach(c => {
    const g = dvGate(c.dataset.k); c.disabled = g.off;
    const row = c.closest(".item, .dvrow"), w = row && row.querySelector(".dvwarn"); if (w) w.textContent = g.warn;
  });
}
const dvRowHTML = it => {
  const cost = (char(state).dvCost || {})[it.k], on = !!char(state).checks[it.k];
  return `<li class="item dvn" data-dvk="${it.k}"><label><input type="checkbox" data-k="${it.k}" ${on ? "checked" : ""} ${dvGate(it.k).off ? "disabled" : ""}><span class="txt"><img class="dvmini" src="${dvIconSrc(it)}" alt="" loading="lazy" onerror="this.remove()">${dvName(it)}<span class="loc">${dvMeta(it)}<span class="dvwarn">${dvGate(it.k).warn}</span></span></span></label>` +
    `<label class="dvc-wrap" title="Points this node took, including its path">cost <input class="dvc" type="number" min="0" max="200" inputmode="numeric" data-dvc="${it.k}" value="${cost ?? ""}" placeholder="–"></label></li>`;
};
/* Regional quests track like dungeons: first click on the box = in progress (char(state).started), second = completed.
   Clicking a completed one undoes it. In progress doesn't count toward the milestone. */
function syncQRun() {
  mainEl.querySelectorAll("#gates li.qrow input[data-k]").forEach(i => {
    const k = i.dataset.k, dv = "derived" in i.dataset, done = !!char(state).checks[k] || dv, run = !done && qProg(k) > 0, li = i.closest("li");
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
   Cleared by Level up (setLevel) or by turning in the quest it follows (rqTicked). */
function snoozeToggle(k) {
  char(state).rqSnooze = char(state).rqSnooze || {};
  if (char(state).rqSnooze[k]) delete char(state).rqSnooze[k]; else char(state).rqSnooze[k] = char(state).level;
  save(); update();
}
/* Turning in a regional quest clears the "Not in game yet" snoozes of the quests that follow it. */
function rqTicked(k) {
  const it = char(state).rqSnooze && RQ_K(k); if (!it) return;
  GATES.forEach(g => g.items.forEach(x => { if (x.kind === "quest" && x.q.after.includes(it.name)) delete char(state).rqSnooze[x.k]; }));
}
document.getElementById("gates").addEventListener("click", e => {
  const zb = e.target.closest && e.target.closest("li.qrow [data-snz]"); if (zb) { e.preventDefault(); snoozeToggle(zb.dataset.snz); return; }
  const ig = e.target.closest && e.target.closest("li.qrow [data-ingame]"); if (ig) { e.preventDefault(); const k = ig.dataset.ingame; char(state).started = char(state).started || {}; if (!char(state).checks[k]) { char(state).started[k] = 1; if (char(state).rqSnooze) delete char(state).rqSnooze[k]; save(); update(); } return; }
  const i = e.target.closest && e.target.closest("li.qrow input[data-k]"); if (!i) return;
  const k = i.dataset.k; char(state).started = char(state).started || {};
  if (!char(state).checks[k] && !qProg(k)) { e.preventDefault(); char(state).started[k] = 1; save(); update(); return; }
  delete char(state).started[k];
}, true);
/* Test hook (tests/golden.js --explain): the 0.3 E4 changes to run with, set by the runner before the page loads; the
   page itself runs with all of them on. */
if (Array.isArray(window.__gateChanges)) setGateChanges(window.__gateChanges);
/* The save from storage, then the load-time steps (src/core/migrations.js), which write it back where they always did. */
let { state, hadSave } = (() => { let raw = null; try { raw = localStorage.getItem(KEY); } catch (e) {} return loadState(raw); })();
migrate(state, hadSave, storeState, Math.floor(Date.now() / 1000));
/* Every write of the progress goes through storeState(): same key, same moments as before (0.1.5); since 5c the save
   carries per-item change times once the stampV1 step has run (stampSave, src/core/sync.js). A write
   that throws (storage full, private mode, storage disabled) shows the #saveWarn banner; the next write that works hides it. */
function storeState() {
  stampSave(state, Date.now());
  try { localStorage.setItem(KEY, JSON.stringify(state)); setSaveWarn(false); } catch (e) { setSaveWarn(true); }
}
function setSaveWarn(on) {
  const el = document.getElementById("saveWarn"); if (!el || el.hidden === !on) return;
  el.hidden = !on;
}
const save = () => { storeState(); };

const mainEl = document.getElementById("main");
const layoutEl = document.querySelector(".layout");
/* Next up (#nowStar) can move into a pop-out window, so it is always reached through this node. */
const nowEl = document.getElementById("nowStar");
let pipWin = null, nsHover = false;
const nsWin = () => (nowEl && nowEl.ownerDocument.defaultView) || window;
const gatesEl = document.getElementById("gates");
const stepsEl = document.getElementById("steps");
const chev = `<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`;
/* "upsell" = a free step that mentions an optional paid upgrade (shown with a "Paid option" tag). */
const MAP_ICO = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s-6-5.6-6-11a6 6 0 1 1 12 0c0 5.4-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/></svg>`;

const cardHTML = (s, num, cls) => `
  <details class="step ${cls}" id="${s.id}">
    <summary>
      <div class="num">${num}</div>
      <div class="title"><h3>${s.title}</h3><p>${s.blurb}</p></div>
      <div class="meta"><span class="tag">${s.tag || ""}</span><span class="count"></span>${chev}</div>
    </summary>
    <div class="bar"><span></span></div>
    <ul class="items">
      ${(() => {
        /* Regional quests go last so the skill lines don't sit under their heading. Keys keep the original index. */
        const isQ = it => (it.kind || it.group) === "quest";
        const order = s.items.map((it, j) => [it, j]);
        return [...order.filter(([it]) => !isQ(it)), ...order.filter(([it]) => isQ(it))].map(([it, j]) => {
        /* Sealed Dungeons are side content in the Areas card; milestones don't list them. Regional quests render inline. */
        if ((it.kind || it.group) === "hideout") return "";
        if (it.hidden) return "";
        if (it.dv) return ""; /* board nodes live in the Daevanion board card */
        if (it.sub) { const ic = icons(it.subNote || ""); return `<li class="sub-h${it.group === "quest" ? " rq" : ""}${ic ? " has-ico" : ""}"><span class="sub-txt">${it.sub}${it.subNote ? `<span>${it.subNote}</span>` : ""}</span>${ic}</li>`; }
        const k = it.k || s.id + ":" + j;
        const ic = icons(it.t);
        return `<li${it.req ? ` data-req="${it.req}"` : ""}${it.story ? ` data-story="${it.story}"` : ""}${it.after ? ` data-needs="${it.after}"` : ""} class="item${it.kind === "quest" ? " qrow" : ""}${it.cell ? " cell" : ""}${ic ? " has-ico" : ""}${it.opt ? " optional" : ""}${it.map ? " has-map" : ""}"><label><input type="checkbox" data-k="${k}" ${char(state).checks[k] ? "checked" : ""}>${ic}<span class="txt">${it.story ? `<span class="schip"></span>` : ""}${it.opt ? `<span class="opt-tag">Optional</span>` : ""}${it.t}${it.note ? `<span class="note">${it.note}</span>` : ""}${it.upsell ? `<span class="upsell"><span class="paid-tag opt">Paid option</span>${it.upsell}</span>` : ""}</span></label>${it.map ? `<a class="amap" href="https://metabot.gg/en/aion-2/map/altgard/dungeons?focus=dungeon:${it.map}" target="_blank" rel="noopener" title="Show the entrance on the Altgard interactive map (Metabot)">${MAP_ICO}</a>` : ""}${it.kind === "quest" ? `<button type="button" class="q-snz" data-snz="${k}" aria-pressed="false" title="The game doesn't offer this quest yet: hide it from Next up until your next Level up">Not in game yet</button><button type="button" class="q-inl" data-ingame="${k}" hidden title="The game already offers it: mark it picked up (same as clicking its box)">In my game</button>` : ""}</li>`;
      }).join(""); })()}
    </ul>
  </details>`;

/* Size each item icon to the height of the text beside it. Re-runs when a card opens or text rewraps. */
const iconSizer = typeof ResizeObserver === "function" ? new ResizeObserver(entries => {
  entries.forEach(e => {
    const row = e.target.closest(".has-ico"); if (!row) return;
    /* Capped so a wide icon can't narrow the text, rewrap it taller, and grow the icon again. */
    const h = Math.min(56, Math.round(e.target.getBoundingClientRect().height));
    if (!h) return;
    row.querySelectorAll(".icos img").forEach(img => { img.style.height = h + "px"; img.style.width = h + "px"; });
  });
}) : null;
function watchIcons() {
  if (!iconSizer) return;
  iconSizer.disconnect();
  mainEl.querySelectorAll(".has-ico .txt, .has-ico .sub-txt").forEach(el => iconSizer.observe(el));
}

/* ---------- Areas ---------- */
/* XP in regional quest tooltips (dungeon XP isn't shown: only a few pages state it). */
const fmtXP = n => n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : n >= 1000 ? Math.round(n / 1000) + "k" : String(n);
const pinLink = (href, label) => href ? ` <a class="ns-pin" href="${href}" target="_blank" rel="noopener" title="${label || "Show on the map"}">${MAP_ICO}</a>` : "";
const areaSel = document.getElementById("areaSel");
/* Areas: pick a level band; Sealed Dungeons (at their recommended level) and Strongholds are listed together, flat
   (bands: src/core/catalog.js). */
/* The band that holds your level; older bands with open clears show their count in the dropdown. */
function defaultBand() {
  return String(AREA_BANDS.filter(b => b <= char(state).level).pop() || AREA_BANDS[0]);
}
const SH_LV = it => it.lo === 1 && it.hi === 45 ? "any level" : it.lo === it.hi ? `Lv ${it.lo}` : `Lv ${it.lo}–${it.hi}`;
/* One entry point for every "show in Areas" link on the page: open the card, pick the band, scroll to it. */
function goAreas(band) {
  state.areasCollapsed = false; areaKeep = new Set();
  if (band != null) state.areaLv = String(band);
  save(); update();
  document.getElementById("areas").scrollIntoView({ behavior: SMOOTH(), block: "start" });
}
function renderAreas() {
  const lv = char(state).level, shOn = state.areaSh !== false, doneOn = state.areaDone !== false;
  /* done = ticked or derived (a stronghold a story quest clears, E9); derived rows show a disabled tick like the milestones' */
  const evA = gatesOf(char(state)), ad = x => doneOf(char(state), x.k, evA);
  const derive = () => document.querySelectorAll("#areaList input[data-k]").forEach(i => derivedBox(i, derivedOf(char(state), i.dataset.k, evA)));
  document.getElementById("areaShTog").checked = shOn;
  document.getElementById("areaDoneTog").checked = !doneOn;
  const vis = x => doneOn || !ad(x) || areaKeep.has(x.k);
  const opts = [...AREA_BANDS.map(String), "sh"];
  if (!opts.includes(state.areaLv)) state.areaLv = defaultBand();
  const allSh = state.areaLv === "sh";
  const inBand = v => v === "sh" ? AREA_ITEMS.filter(x => x.it.kind === "stronghold")
    : AREA_ITEMS.filter(x => bandOf(x) === +v && (shOn || x.it.kind !== "stronghold"));
  /* Open at or below your level: the same "behind" rule as the Progress card. */
  const behind = x => !ad(x) && areaOpen(char(state), x);
  areaSel.innerHTML = opts.map(v => {
    const xs = inBand(v), left = xs.filter(x => !ad(x)).length, bh = xs.filter(behind).length;
    const label = v === "sh" ? "All strongholds" : `Lv ${v}–${+v + 4}${+v > lv ? " (later)" : ""}`;
    return `${v === "sh" ? '<option disabled>──────────</option>' : ""}<option value="${v}"${v === state.areaLv ? " selected" : ""}>${label} · ${xs.length - left}/${xs.length}${left ? (bh && +v <= lv ? ` · ${bh} open` : "") : " ✓"}</option>`;
  }).join("");
  const cur = inBand(state.areaLv), curD = cur.filter(x => ad(x)).length, curB = cur.filter(behind).length;

  /* Sorted by zone so neighbours sit together. */
  const xs = cur.sort((a, b) => (allSh ? bandOf(a) - bandOf(b) : 0) || (a.area === NO_AREA) - (b.area === NO_AREA) || a.area.localeCompare(b.area) || a.it.name.localeCompare(b.it.name));
  const shs = xs.filter(x => x.it.kind === "stronghold"), sds = xs.filter(x => x.it.kind !== "stronghold");
  const mapIco = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s-6-5.6-6-11a6 6 0 1 1 12 0c0 5.4-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/></svg>`;
  const row = x => {
    if (!vis(x)) return "";
    const it = x.it, done = !!ad(x), sh = it.kind === "stronghold", run = !done && !!(char(state).areaRun || {})[x.k];
    const later = areaLater(char(state), x);
    const sub = sh ? `${x.area} · ${SH_LV(it)}` : "";
    const href = mapFocus(it);
    /* Name is plain text (ticks on click); the pin on the right opens its map page. */
    return `<li class="item arow${done ? " rdone" : ""}${run ? " running" : ""}${later ? " locked" : ""}${sh ? "" : " grouped"}" data-showall="1"><label><input type="checkbox" data-k="${x.k}" ${done ? "checked" : ""} title="${done ? "Cleared · click to undo" : run ? "In progress · click when cleared" : "Click when you go in; click again when cleared"}"><span class="txt"><b>${it.name}</b>${run ? `<span class="run-tag">In progress</span>` : ""}${sub ? `<small title="${sub}">${sub}</small>` : ""}</span></label><a class="amap" href="${href}" target="_blank" rel="noopener" title="Show on the Altgard interactive map (Metabot)">${mapIco}</a></li>`;
  };
  /* Region header: bigger than the rows; a finished region folds shut (after a short beat, so the row you just
     ticked doesn't vanish under the cursor). Click the header to open or close any region. */
  const zoneOpen = (z, g) => {
    const rk = state.areaLv + "|" + z, ov = (state.zoneOpen || {})[rk], done = g.every(x => ad(x));
    return ov !== undefined ? !!ov : !done || !!(zoneJustDone[rk] && Date.now() - zoneJustDone[rk] < 700);
  };
  const zoneHead = (z, g, open) => {
    const gd = g.filter(x => ad(x)).length, tr = ZONE_TRACES[z], rk = state.areaLv + "|" + z;
    return `<li class="zone-h${gd === g.length ? " done" : ""}"><button type="button" class="zone-btn" data-zone="${rk}" aria-expanded="${open}"><span class="zchev" aria-hidden="true">${open ? "▾" : "▸"}</span>${z}</button>` +
      `${tr ? `<a class="ztr" href="https://metabot.gg/en/aion-2/map/altgard/empyrean-traces" target="_blank" rel="noopener" title="${tr} Empyrean Traces (feathers) in this zone: grab them while you're here">${tr} traces</a>` : ""}<span class="zn">${gd === g.length ? "✓ " : ""}${gd}/${g.length}</span></li>`;
  };
  const sec = (cls, title, tip, note, list, grouped) => {
    if (!list.length) return "";
    const d = list.filter(x => ad(x)).length;
    const body = grouped ? [...new Set(list.map(x => x.area))].map(z => { const g = list.filter(x => x.area === z), open = zoneOpen(z, g); return g.some(vis) ? zoneHead(z, g, open) + (open ? g.map(row).join("") : "") : ""; }).join("") : list.map(row).join("");
    return `<li class="asec ${cls}"><span class="asec-t">${title} ${T("", tip, `What are ${title}?`)}</span><span class="asec-n${d === list.length ? " done" : ""}">${d}/${list.length}</span></li><li class="sh-note">${note}</li>` +
      (body || `<li class="sh-note ok">All cleared${doneOn ? "" : " (hidden)"}.</li>`);
  };
  if (allSh) {
    const bands = [...new Set(shs.map(bandOf))];
    document.getElementById("areaList").innerHTML =
      `<li class="asec sh"><span class="asec-t">Strongholds ${T("", "stronghold", "What are Strongholds?")}</span><span class="asec-n${shs.every(x => ad(x)) ? " done" : ""}">${shs.filter(x => ad(x)).length}/${shs.length}</span></li><li class="sh-note">${SH_REWARD} each</li>` +
      bands.map(bd => { const g = shs.filter(x => bandOf(x) === bd), d = g.filter(x => ad(x)).length;
        if (!g.some(vis)) return "";
        return `<li class="shband${d === g.length ? " done" : ""}"><span>Lv ${bd}${bd > lv ? " (later)" : ""}</span><span>${d}/${g.length}</span></li>` + g.map(row).join(""); }).join("");
    derive();
    return;
  }
  document.getElementById("areaList").innerHTML =
    sec("sh", "Strongholds", "stronghold", SH_REWARD + " each", shs, false) +
    sec("sd" + (shs.length ? " split" : ""), "Sealed Dungeons", "hideout", SD_REWARD + " each", sds, true);
  document.querySelectorAll("#areaList li.running input[data-k]").forEach(i => { i.indeterminate = true; });
  derive();
}
/* Two clicks per clear: the first marks it "in progress" (you went in), the second marks it cleared. Clicking a
   cleared one undoes it. In-progress runs show at the top of Next up so you finish what you started. */
document.getElementById("areaList").addEventListener("click", e => {
  const i = e.target.closest && e.target.closest("input[data-k]"); if (!i) return;
  const k = i.dataset.k; char(state).areaRun = char(state).areaRun || {};
  if (!char(state).checks[k] && !char(state).areaRun[k]) { e.preventDefault(); char(state).areaRun[k] = Date.now(); save(); update(); return; }
  if (char(state).areaRun[k]) delete char(state).areaRun[k];
}, true);
/* Zones finished this moment stay open ~0.7s, then fold. */
const zoneJustDone = {};
document.getElementById("areaList").addEventListener("change", e => {
  const k = e.target.dataset && e.target.dataset.k; if (!k || !e.target.checked) return;
  const x = AREA_ITEMS.find(y => y.k === k); if (!x || x.it.kind === "stronghold") return;
  const rk = state.areaLv + "|" + x.area;
  if (AREA_ITEMS.filter(y => y.area === x.area && bandOf(y) === bandOf(x) && y.it.kind !== "stronghold").every(y => y.k === k || char(state).checks[y.k])) {
    zoneJustDone[rk] = Date.now(); if (state.zoneOpen) delete state.zoneOpen[rk];
    setTimeout(() => { delete zoneJustDone[rk]; renderAreas(); }, 750);
  }
}, true);
document.getElementById("areaList").addEventListener("click", e => {
  const b = e.target.closest("[data-zone]"); if (!b) return;
  state.zoneOpen = state.zoneOpen || {}; state.zoneOpen[b.dataset.zone] = b.getAttribute("aria-expanded") !== "true";
  save(); renderAreas();
});
/* Rows ticked while cleared rows are hidden stay until you change band or the toggle (no jumping). */
let areaKeep = new Set();
/* With "Hide cleared" on, a row you tick turns green, fades and folds away (~0.7s), then the list re-renders. */
document.getElementById("areaList").addEventListener("change", e => {
  const k = e.target.dataset && e.target.dataset.k; if (!k || state.areaDone !== false) return;
  if (!e.target.checked) { areaKeep.delete(k); return; }
  areaKeep.add(k);
  setTimeout(() => { const li = document.querySelector(`#areaList input[data-k="${CSS.escape(k)}"]`); const row = li && li.closest("li"); if (row) row.classList.add("fading"); }, 30);
  setTimeout(() => { areaKeep.delete(k); renderAreas(); }, 750);
}, true);
document.getElementById("areaDoneTog").addEventListener("change", e => { areaKeep = new Set(); state.areaDone = !e.target.checked; save(); update(); });

document.getElementById("areaShTog").addEventListener("change", e => { state.areaSh = e.target.checked; save(); update(); });
areaSel.addEventListener("change", () => { areaKeep = new Set(); state.areaLv = areaSel.value; save(); update(); });

function render() {
  gatesEl.innerHTML = GATES.map(g => cardHTML(g, `<span><small>LV</small>${g.lv}</span>`, "gate")).join("");
  stepsEl.innerHTML = STEPS.map((s, i) => cardHTML(s, i + 1, "")).join("");
  mainEl.querySelectorAll("details.step").forEach(d => {
    d.addEventListener("toggle", () => { state.open[d.id] = d.open; save(); });
  });
  watchIcons();
}
let tipSeq = 0; /* ids for the "i" popovers (aria-controls) */
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
  box.id = "tipbox" + (++tipSeq);
  li.after(box);
  btn.setAttribute("aria-expanded", "true"); btn.setAttribute("aria-controls", box.id);
});
/* Confidence and Sources, from CONF and SOURCES (generated from data/*.json). Links are plain links (Metabot asks for that). */
function renderSources() {
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  document.getElementById("confBody").innerHTML = CONF.map(c => `<p><b>${c.g}</b> · ${c.sub}</p><ul class="conf">${c.items.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`).join("");
  document.getElementById("srcBody").innerHTML = `<p class="fine src-intro">Every sourced value in the guide comes from one of these pages (${SOURCES.reduce((t, g) => t + g.links.length, 0)} links, checked Oct 2026); values seen in game or worked out by the guide are marked in Confidence. Metabot data is used with credit: each item links to its Metabot page.</p>` +
    (() => { /* One row per site: how many pages and what they back; the page list opens per site. Sites with one page share a row. */
      const host = u => u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0], name = h => { const k = Object.keys(SRC_SITE).find(d => h.endsWith(d)); return k ? SRC_SITE[k] : h; };
      const by = new Map();
      SOURCES.forEach(g => g.links.forEach(([u, l]) => { const n = name(host(u)); if (!by.has(n)) by.set(n, { n, links: [], what: [] }); const x = by.get(n); x.links.push([u, l]); if (!x.what.includes(g.t)) x.what.push(g.t); }));
      const xs = [...by.values()].sort((a, b) => b.links.length - a.links.length || a.n.localeCompare(b.n)), big = xs.filter(x => x.links.length > 1), one = xs.filter(x => x.links.length === 1);
      if (one.length) big.push({ n: "Other sites", links: one.map(x => x.links[0]), what: [one.map(x => x.n).join(", ")] });
      return big.map(x => `<details class="mini srcg"><summary><span class="src-site">${esc(x.n)}</span><span class="src-n">${x.links.length}</span><span class="src-what">${esc(x.what.join(" · "))}</span></summary><ul class="sources">${x.links.map(([u, l]) => [u, x.n !== "Other sites" && l.toLowerCase().startsWith(x.n.toLowerCase() + ": ") ? l.slice(x.n.length + 2) : l]).sort((a, b) => a[1].localeCompare(b[1])).map(([u, l]) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(l)}</a></li>`).join("")}</ul></details>`).join(""); })();
}
renderSources();
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
/* Milestone ticks: the line turns green, then (if "Cleared tasks" hides it) fades and slides out; a milestone
   that just got cleared does the same when "Cleared milestones" is on. tickKeep holds them visible meanwhile. */
let tickKeep = new Set();
/* One-time clear rewards (CLEAR_REWARD, src/core/catalog.js) wait in "the Cube" until you say you've used them. */
/* "Waiting in your Cube" bars on Skills / Daevanion: one click once you've used them in game adds them to the totals. */
function renderCube() {
  const sp = document.getElementById("spCube"), dv = document.getElementById("dvCube"), ps = char(state).pendSt || 0, pc = char(state).pendCr || 0;
  const bar = (n, what, id) => `<span class="cube-ico" aria-hidden="true">🎒</span><span class="cube-t"><b>${n} ${what}${n === 1 ? "" : "s"}</b> in Cube</span><button type="button" class="cube-btn" id="${id}">Used ✓</button>`;
  if (sp) { sp.hidden = !ps; sp.innerHTML = ps ? bar(ps, "stone", "spCubeBtn") : ""; }
  if (dv) { dv.hidden = !pc; dv.innerHTML = pc ? bar(pc, "crystal", "dvCubeBtn") : ""; }
}
function cubeClick(e) {
  if (e.target.closest("#spCubeBtn")) { char(state).stones = (char(state).stones || 0) + (char(state).pendSt || 0); char(state).pendSt = 0; save(); update(); rewardToast("Wisdom Stones added to your skill points"); }
  if (e.target.closest("#dvCubeBtn")) { char(state).dvTotal = (char(state).dvTotal || 0) + (char(state).pendCr || 0); char(state).pendCr = 0; save(); update(); rewardToast("Crystals added to your board total"); }
}
document.addEventListener("click", cubeClick);
function rewardToast(msg, undo) {
  let t = document.getElementById("rwToast"); if (!t) { t = document.createElement("div"); t.id = "rwToast"; t.setAttribute("role", "status"); document.body.appendChild(t);
    t.addEventListener("animationend", () => { t.classList.remove("has-undo"); t.innerHTML = ""; }); }
  t.textContent = msg; t.classList.toggle("has-undo", !!undo);
  if (undo) { const b = document.createElement("button"); b.type = "button"; b.className = "tu"; b.textContent = "Undo"; b.addEventListener("click", () => { t.classList.remove("show", "has-undo"); t.innerHTML = ""; undo(); }, { once: true }); t.appendChild(b); }
  t.classList.remove("show"); void t.offsetWidth; t.classList.add("show");
}
layoutEl.addEventListener("change", e => {
  const k = e.target.dataset.k; if (!k) return;
  const was = !!char(state).checks[k];
  char(state).checks[k] = e.target.checked;
  if (e.target.checked) rqTicked(k);
  /* Equipping a stigma slot (milestone row, Stigmas card or Next up) also puts it on E. */
  if (e.target.checked) { const it = itemByK(k), ek = it && it.stig && eputK(it.stig); if (ek) char(state).checks[ek] = true; }
  const rw = was !== e.target.checked && CLEAR_REWARD(k);
  if (rw) { const d = e.target.checked ? 1 : -1;
    /* Rewards wait in "the Cube" until you say you've used them; unticking takes from what's waiting first, then from the totals. */
    const c = char(state), take = (pk, tk, n) => { c[pk] = (c[pk] || 0) + d * n; if (c[pk] < 0) { c[tk] = Math.max(0, (c[tk] || 0) + c[pk]); c[pk] = 0; } };
    take("pendSt", "stones", rw.st); take("pendCr", "dvTotal", rw.cr);
    rewardToast(d > 0 ? `+${rw.st} Wisdom Stone${rw.st > 1 ? "s" : ""} · +${rw.cr} crystal${rw.cr > 1 ? "s" : ""} waiting in your Cube` : `−${rw.st} stone${rw.st > 1 ? "s" : ""} · −${rw.cr} crystal${rw.cr > 1 ? "s" : ""} taken back`); }
  if (k.startsWith("dv:")) { if (e.target.checked) { char(state).dvLast = k; char(state).dvLastAt = Date.now(); } else if (char(state).dvLast === k) delete char(state).dvLast; }
  const li = e.target.closest("li.item"), card = e.target.closest("details.step");
  if (li && card && mainEl.contains(li)) {
    li.classList.remove("tick-on", "leaving"); tickKeep.delete(k);
    if (e.target.checked) {
      li.classList.add("tick-on"); tickKeep.add(k);
      const cardWasDone = card.classList.contains("done");
      if (state.hideCards && !cardWasDone) tickKeep.add(card.id);
      setTimeout(() => { if (state.hide && char(state).checks[k]) li.classList.add("leaving"); }, 550);
      setTimeout(() => {
        tickKeep.delete(k); li.classList.remove("tick-on");
        if (tickKeep.has(card.id) && card.classList.contains("done")) { card.classList.add("leaving"); setTimeout(() => { tickKeep.delete(card.id); card.classList.remove("leaving"); update(); }, 500); }
        else { tickKeep.delete(card.id); update(); }
      }, 1150);
    }
  }
  save(); update();
});


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
const spBuyT = x => `Buy <b>${x.s.n} ${x.spec ? "specialty" : (x.L - 1) + " → " + x.L}</b>`;
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
    case "skill": { const x = a.x, base = x.spec ? `Pick: ${x.s.spec}` : a.first ? `${spCostTxt(x)} · you have the points` : spCostTxt(x);
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
    const label = id && !x.lock ? `<a href="https://metabot.gg/en/aion-2/map/altgard?focus=quest:${id}" target="_blank" rel="noopener" title="${n} · ${st} · Lv ${q.rec} · show on the map">${n}</a>` : `<span title="${n} · ${st} · Lv ${q.rec}">${n}</span>`;
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
function storyView(a) {
  const { act } = a;
  if (a.v === "unset") return { story: true, ico: "📜", t: "Set your current main quest", sub: "In the Journey card; it places you on the story.", btn: "Show", act };
  if (a.v === "end") return { story: true, ico: "📜", t: "Altgard story complete", sub: `Continue in ${STORY_END.region} in game · the guide's story ends at "${a.quest}"`, act };
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
let nsAnim = false, nsRefocus = 0;
/* "i" next to a "need more" status: where more Wisdom Stones / Daevanion Crystals come from, plus what's open now.
   Regional quest: 1 stone + 1 crystal; Sealed Dungeon first clear: 2 + 2; levels: +4 crystals each. Items count once used from the Cube. */
function tipPop(kind) {
  const lv = char(state).level;
  let rq = 0; RQ.forEach(q => { if (!char(state).checks["rq:" + q.id] && rqAvail(q, lv).ok) rq++; });
  const sd = AREA_ITEMS.filter(x => x.it.kind === "hideout" && areaOpen(char(state), x) && !char(state).checks[x.k]).length, gain = rq + 2 * sd;
  const open = gain ? `<button type="button" class="tiplink" data-tipgo="${rq ? "quest" : "sd"}">${rq ? `${rq} quest${rq === 1 ? "" : "s"}` : ""}${rq && sd ? " + " : ""}${sd ? `${sd} dungeon${sd === 1 ? "" : "s"}` : ""} open now → +${gain}</button>` : "";
  const body = kind === "stones" ? "<b>More Wisdom Stones</b>1 per regional quest · 2 per Sealed Dungeon (first clear). Use them from the Cube."
    : "<b>More crystals</b>+4 per level · 1 per regional quest · 2 per Sealed Dungeon (first clear). Use them from the Cube.";
  const id = "tipPop" + (++tipSeq);
  return `<span class="tipwrap"><button type="button" class="tipbtn" aria-label="How to get more" aria-expanded="false" aria-controls="${id}">i</button><span class="tippop" id="${id}" role="tooltip">${body}${open ? `<span class="tipopen">${open}</span>` : ""}</span></span>`;
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
/* The current quest's open objectives, inside the Next up card when the story is the thing to do. */
function nsObjHTML() {
  const list = QUEST_STEPS[char(state).quest] || [], done = (char(state).qsteps || {})[char(state).quest] || [];
  const vis = objIdx(list), open = list.map((t, i) => [t, i]).filter(([, i]) => vis.includes(i) && !done.includes(i));
  /* First three open objectives; the rest wait their turn (all of them are in the Journey card). */
  const cap = pipWin ? 2 : 3, more = open.length - cap; /* the pop-out window is short */
  return open.length ? `<ul class="ns-obj">${open.slice(0, cap).map(([, i]) => { const [a, b] = objPartsOf(char(state).quest, i); const sl = subListHTML(i, "data-nssub"); return `<li class="${sl ? "has-sub" : ""}"><label><input type="checkbox" data-nsobj="${i}"><span><b>${a}</b>${b && !sl ? `<small>${b}</small>` : ""}</span></label>${sl}</li>`; }).join("")}${more > 0 ? `<li class="ns-obj-more">+${more} more after these</li>` : ""}</ul>` : "";
}
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
nowEl.addEventListener("pointerenter", () => { nsHover = true; });
nowEl.addEventListener("pointerleave", () => { nsHover = false; });
document.addEventListener("keydown", e => nsKey(e, false));
/* Milestones list: collapsed = just the current milestone; expanded = all of them. One click either way. */
document.getElementById("trkSum").addEventListener("mousedown", e => e.preventDefault());
document.getElementById("trkSum").addEventListener("click", () => { state.trackOpen = !state.trackOpen; save(); update(); });
/* Lines shown in the Now card are hidden from the milestone below it; a regional heading with nothing left under it hides too. */
/* A sub-heading (e.g. "Regional quests · Lv 14") with no visible rows under it is hidden (Basic hides done/locked rows). */
function hideEmptyHeads() {
  mainEl.querySelectorAll("#gates ul.items > li.sub-h").forEach(h => {
    h.classList.remove("empty-h"); let n = h.nextElementSibling, any = false;
    const basic = document.body.classList.contains("basic");
    while (n && !n.classList.contains("sub-h")) { if (!n.hidden && (!basic || n.offsetParent !== null)) { any = true; break; } n = n.nextElementSibling; }
    h.classList.toggle("empty-h", !any);
  });
}
function dedupeNow() {
  GATES.forEach(g => {
    const card = document.getElementById(g.id); if (!card) return;
    const lis = [...card.querySelectorAll(":scope > ul.items > li")];
    lis.forEach((li, i) => {
      if (!li.classList.contains("rq")) return;
      let any = false;
      for (let j = i + 1; j < lis.length && !lis[j].classList.contains("sub-h"); j++) if (!lis[j].hidden) any = true;
      li.hidden = !any;
    });
  });
}
function update() {
  const lv = char(state).level;
  let total = 0, done = 0;
  /* The milestone you're working toward: its main tasks aren't done (regional quests alone don't hold it). */
  const upcoming = GATES.find(g => { const [c, n] = mainCounts(g); return g.lv >= lv && c < n; });

  GATES.forEach(g => {
    const d = document.getElementById(g.id), [c, n] = counts(g);
    total += n; done += c;
    const [mc, mn] = mainCounts(g), side = sideOpen(g);
    /* A past milestone whose main tasks are done but regional quests remain isn't "missed": it steps back. */
    const complete = c === n, sideOnly = !complete && mc === mn && g.lv <= lv, overdue = !complete && !sideOnly && g.lv < lv, isNext = g === upcoming;
    d.querySelector(".count").textContent = sideOnly ? `${mc}/${mn} · ${side} side` : `${c}/${n}`;
    d.classList.toggle("sideonly", sideOnly);
    d.querySelector(".bar span").style.width = (n ? c / n * 100 : 100) + "%";
    d.classList.toggle("done", complete);
    d.classList.toggle("overdue", overdue);
    /* Only the milestone you're standing on is highlighted; between stops the Now card above it is the focus. */
    const here = isNext && g.lv === lv;
    d.classList.toggle("current", here);
    d.classList.toggle("upnext", isNext);
    const tag = d.querySelector(".tag");
    tag.className = "tag" + (overdue ? " warn" : here ? " now" : sideOnly ? " side" : "");
    tag.textContent = complete ? "Cleared" : sideOnly ? "Side quests" : overdue ? "Missed" : isNext ? (g.lv === lv ? "Now" : `${g.lv - lv} to go`) : "Later";
    d.open = state.open[g.id] !== undefined ? state.open[g.id] : (isNext || overdue);
  });
  /* Skill lines that unlock above your level are dimmed with their unlock level, so the order in a milestone
     doesn't look like it contradicts "Next skill upgrade" (which only offers what you can buy now). */
  { const ev = gatesOf(char(state)); mainEl.querySelectorAll("li[data-req]").forEach(li => li.classList.toggle("locked", !ev.byKey(li.querySelector("input[data-k]").dataset.k).open)); }
  STEPS.forEach(s => {
    const d = document.getElementById(s.id), [c, n] = counts(s);
    total += n; done += c;
    d.querySelector(".count").textContent = `${c}/${n}`;
    d.querySelector(".bar span").style.width = (n ? c / n * 100 : 100) + "%";
    d.classList.toggle("done", c === n);
    if (state.open[s.id] !== undefined) d.open = state.open[s.id];
  });

  { const evT = gatesOf(char(state)); total += AREA_ITEMS.length; done += AREA_ITEMS.filter(x => doneOf(char(state), x.k, evT)).length; }

  /* Cleared milestones follow the toolbar's "Hide cleared milestones" toggle; missed and upcoming always show. */
  const trackRows = GATES.map(g => {
    const [c, n] = counts(g), [mc, mn] = mainCounts(g), complete = c === n, sideOnly = !complete && mc === mn && g.lv <= lv;
    const cls = complete || sideOnly ? "cleared" : (g.lv < lv ? "overdue" : (g === upcoming ? "next" : ""));
    /* Same row layout as the story timeline: dot · name with a status line · level on the right. */
    const meta = complete ? "cleared" : sideOnly ? `cleared · ${sideOpen(g)} side quest${sideOpen(g) === 1 ? "" : "s"}` : g.lv < lv ? `missed · ${mn - mc} open` : g === upcoming ? (g.lv === lv ? "now" : `next · ${g.lv - lv} to go`) : "";
    return { complete, later: !cls, html: `<li class="ms ${cls}"><span class="dot"></span><a class="ms-name" href="#${g.id}" data-gogate="${g.id}">${g.title}${meta ? `<span class="ms-meta">${meta}</span>` : ""}</a><span class="st-lv">Lv ${g.lv}</span></li>` };
  });
  /* Milestones after the next one fold behind a toggle (state.trackLater shows them). */
  const shown = trackRows.filter(r => !r.complete || !state.hideCards);
  const curRow = trackRows[GATES.indexOf(upcoming)];
  document.getElementById("track").innerHTML = state.trackOpen ? shown.map(r => r.html).join("") : (curRow ? curRow.html : "");
  document.getElementById("trkSum").setAttribute("aria-expanded", String(!!state.trackOpen));

  document.getElementById("gateHint").textContent = upcoming
    ? (upcoming.lv === lv ? `milestone now: Lv ${lv}` : `next milestone at Lv ${upcoming.lv}`)
    : "all milestones cleared";
  document.getElementById("lvlNum").value = lv;
  document.getElementById("lvlRange").value = lv;
  { const lb = document.getElementById("lvlUpBig"); lb.disabled = lv >= 45; lb.title = lv >= 45 ? "Level cap (45)" : ""; }
  mainEl.classList.toggle("hide-done", state.hide);
  { const ev = gatesOf(char(state)); mainEl.querySelectorAll("input[data-k]").forEach(i => derivedBox(i, derivedOf(char(state), i.dataset.k, ev))); }
  renderAreas();
  layoutEl.querySelectorAll("li.item").forEach(li => {
    const cb = li.querySelector("input[type=checkbox]");
    /* A region you opened by hand shows its ticked rows even with "Hide ticked items" on. */
    if (cb && tickKeep.has(cb.dataset.k)) { li.hidden = false; return; }
    li.classList.remove("leaving");
    li.hidden = (state.hide && !!(cb && cb.checked) && !li.dataset.showall) || (!!state.hideOpt && li.classList.contains("optional"));
  });
  const tn = document.getElementById("trkN"); if (tn) tn.textContent = state.trackOpen ? `· all (${GATES.filter(g => (([c, n]) => c < n)(counts(g))).length} open)` : "· current";
  dedupeNow();
  requestAnimationFrame(hideEmptyHeads);
  mainEl.querySelectorAll("details.step").forEach(d => { d.hidden = !!state.hideCards && (d.classList.contains("done") || d.classList.contains("sideonly")) && !d.classList.contains("peek") && !tickKeep.has(d.id); });
  document.getElementById("fCards").checked = !!state.hideCards;
  document.getElementById("fTicked").checked = !!state.hide;
  document.getElementById("fOpt").checked = !!state.hideOpt;
  const nOn = [state.hideCards, state.hide, state.hideOpt].filter(Boolean).length;
  document.getElementById("filtN").textContent = nOn || "";
  document.getElementById("btnFilter").setAttribute("aria-label", nOn ? `Filters, ${nOn} active` : "Filters");
  document.getElementById("btnReset").disabled = !nOn;
  renderNext();
  renderCube();
  renderStigma();
  fillStigmaText();
  syncQRun();
  renderNow();
  /* Card sizing reads layout: it runs in the next frame (renderNext schedules fitSkills), so update() never forces a layout. */
  if (typeof syncExpand === "function") syncExpand();
  requestAnimationFrame(fitRail);
}

/* A milestone row's box (0.3 E4, design §5): ticked when its tick is stored; done by derivation (r: the evaluator's
   result) it is ticked and disabled, "done in the story" its accessible name and tooltip. The stored tick (true, false
   or absent) is left as it is, so a stored false shows again once the story moves back (A3). */
function derivedBox(i, r) {
  const li = i.closest("li"), was = "derived" in i.dataset;
  i.checked = !!r || !!char(state).checks[i.dataset.k];
  if (r) {
    if (!was) { i.dataset.derived = i.getAttribute("title") || ""; i.disabled = true; }
    const by = /^followUp /.test(r.via || "") && RQ_K(r.via.slice(9)), name = ((li && li.querySelector(".txt b")) || (li && li.querySelector(".txt")) || i).textContent.trim();
    i.title = by ? `done in the story: you have its follow-up "${by.name}"` : "done in the story";
    i.setAttribute("aria-label", `${name}: done in the story`);
  } else if (was) {
    if (i.dataset.derived) i.title = i.dataset.derived; else i.removeAttribute("title");
    i.removeAttribute("aria-label"); i.disabled = false; delete i.dataset.derived;
  }
  if (li) li.classList.toggle("derived", !!r);
}

const qInput = document.getElementById("questIn");
document.getElementById("questList").innerHTML = QUESTS.map(([l, n]) => `<option value="${n}">Lv ${l}</option>`).join("");
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, "");
function findQuest(txt) {
  const t = norm(txt); if (!t) return null;
  const exact = QUESTS.findIndex(([, n]) => norm(n) === t);
  if (exact >= 0) return exact;
  const hits = QUESTS.map((q, i) => [i, norm(q[1]).includes(t)]).filter(x => x[1]);
  return hits.length === 1 ? hits[0][0] : (hits.length > 1 ? -2 : -1);
}
/* Milestones with story-gated steps get an automatic first line: "Reach <quest> in the main story". It ticks
   itself when your current quest reaches it, isn't counted in the milestone's x/y, and shows how far away it is. */
function renderStoryReqs() {
  GATES.forEach(g => {
    const card = document.getElementById(g.id), ul = card && card.querySelector(":scope > ul.items"); if (!ul) return;
    let row = ul.querySelector(":scope > li.storyreq");
    /* the furthest of them; reached (or, E6, turned in where the rows under it wait for that) or not, and how far (d: quests
       ahead, null with the story unset), from the evaluator */
    const L = storyLineOf(char(state), g);
    if (!L) { if (row) row.remove(); return; }
    const { q, ok, ahead: d } = L, E6 = chainsOn();
    if (!row) { row = document.createElement("li"); row.className = "item storyreq"; ul.prepend(row); }
    row.classList.toggle("reached", ok);
    row.hidden = ok && !!state.hide;
    const chip = !E6 ? (ok ? "reached" : d == null ? "set your quest" : `${d} story quest${d === 1 ? "" : "s"} ahead`) : L.chip || "set your quest";
    const now = E6 && !ok && L.turnIn && d === 1;
    row.innerHTML = `<label><input type="checkbox" disabled ${ok ? "checked" : ""}><span class="txt"><span class="schip${ok ? "" : d == null ? "" : now ? " now" : " ahead"}">${chip}</span><b>${L.turnIn ? "Turn in" : "Reach"} "${q}" in the main story</b> <span class="sr-sub">Opens the steps with a story chip and the regional quests below that wait for it.${d != null && !ok ? ` You're on "${char(state).quest}".` : ""}</span></span></label>`;
  });
}
/* Chip on story-gated steps: how far that quest is from your current main quest. */
function renderStoryChips() {
  const c = char(state), E6 = chainsOn(), ev = gatesOf(c);
  mainEl.querySelectorAll("li[data-story]").forEach(li => {
    const chip = li.querySelector(".schip"); if (!chip) return;
    chip.className = "schip";
    /* E6: from the step's own gate (turned in where it waits for that), in the words of src/core/blockers.js */
    if (E6) { const cb = li.querySelector("input[data-k]"), x = li.classList.contains("qrow") || !cb ? null : stepChipOf(c, cb.dataset.k, li.dataset.story, ev);
      chip.textContent = x ? x.text : ""; if (x && x.title) chip.title = capFirst(x.title); else chip.removeAttribute("title"); if (x && x.cls) chip.classList.add(x.cls); return; }
    const sg = storyGate(c, li.dataset.story);
    if (!sg || (!sg.ok && sg.ahead == null)) { chip.textContent = ""; return; } /* not on the chain, or the story unset */
    const d = sg.ahead;
    if (li.classList.contains("qrow")) { chip.textContent = ""; return; } /* quest rows say what opens them in their own text */
    if (sg.ok && li.dataset.story !== c.quest) chip.textContent = "story: passed";
    else if (sg.ok) { chip.textContent = "your current quest"; chip.classList.add("now"); }
    else { chip.textContent = `${d} story quest${d === 1 ? "" : "s"} ahead`; chip.classList.add("ahead"); }
  });
}
/* inUpdate: called from update(), which renders Next up itself afterwards (so it isn't rendered twice). */
function renderQuest(inUpdate) {
  const st = document.getElementById("questStatus"), pv = document.getElementById("questPrev"), qlv = document.getElementById("questLv");
  st.className = "st next"; pv.innerHTML = ""; qlv.textContent = ""; renderAhead();
  const row = (q, tag) => q ? `<span class="dot"></span><span class="st-name st-step" title="Set as current quest">${q[1]}${tag ? ` <span class="unl">${tag}</span>` : ""}</span><span class="st-lv">Lv ${q[0]}</span>` : "";
  /* No quest, or one no longer in the story (e.g. "Ishalgen", the starting map since 0.2): ask for the current quest. */
  const i = questIdx(char(state));
  if (i < 0) { st.innerHTML = `<span class="dot"></span><span class="st-name muted">Pick your current quest to place yourself on the story.</span>`; return; }
  /* Story timeline: previous (dim), current (the input), next; then the next unlock as a callout linked to its milestone. */
  const prev = QUESTS[i - 1], nxt = QUESTS[i + 1];
  pv.innerHTML = row(prev);
  qlv.textContent = `Lv ${QUESTS[i][0]}`;
  st.innerHTML = nxt ? row(nxt, STORY_UNLOCKS[nxt[1]] ? `unlocks ${STORY_UNLOCKS[nxt[1]]}` : "") : `<span class="dot"></span><span class="st-name muted">${char(state).storyEnd === char(state).quest ? `Altgard story complete — continue in ${STORY_END.region} in game` : `Last Altgard story quest · turns in at ${STORY_END.place} (${STORY_END.region})`}</span>`;
  if (qInput.value !== char(state).quest) qInput.value = char(state).quest;
  requestAnimationFrame(fitQuestIn);
  renderQuestSubs(inUpdate);
}
/* Long quest names: the field shrinks its text (to 11.5px) rather than cutting the name; the full name is the tooltip. */
let fitQKey = "";
function fitQuestIn() {
  if (document.activeElement === qInput) return;
  const key = qInput.value + "|" + qInput.clientWidth; if (key === fitQKey) return; fitQKey = key;
  qInput.title = qInput.value; qInput.style.fontSize = ""; if (!qInput.clientWidth) return;
  let fs = parseFloat(getComputedStyle(qInput).fontSize);
  while (qInput.scrollWidth > qInput.clientWidth + 1 && fs > 11.5) { fs -= .5; qInput.style.fontSize = fs + "px"; }
}
window.addEventListener("resize", () => requestAnimationFrame(fitQuestIn));
function renderAhead() {
  const el = document.getElementById("ahead"); if (!el) return;
  {
    const lv = char(state).level, pl = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
    const lvls = [...new Set(VERIFIED_UNLOCKS.filter(x => x[0] > lv).map(x => x[0]))].slice(0, 2);
    const rows = lvls.map(L => {
      const xs = VERIFIED_UNLOCKS.filter(x => x[0] === L), g = GATES.find(g => g.lv === L);
      const prevLv = Math.max(1, ...VERIFIED_UNLOCKS.filter(x => x[0] <= lv).map(x => x[0])), pct = Math.min(100, Math.max(0, (lv - prevLv) / Math.max(1, L - prevLv) * 100));
      const what = xs.map(x => `<b>${x[1]}</b>${x[2] ? ` <span class="ah-d">${x[2]}</span>` : ""}`).join("<br>");
      return `<a class="ah-row"${g ? ` href="#${g.id}" data-gogate="${g.id}"` : ""} title="Sources: ${[...new Set(xs.flatMap(x => x[3].split(", ")))].join(", ")}"><span class="ah-lv">Lv ${L}</span><span class="ah-main"><span class="ah-what">${what}</span><span class="ns-chipbar"><span style="width:${pct}%"></span></span><small>${pl(L - lv, "level")} to go</small></span></a>`;
    });
    const qi = questIdx(char(state));
    if (qi >= 0) { const ui = QUESTS.slice(qi + 1).findIndex(([, n]) => STORY_UNLOCKS[n]);
      if (ui >= 0) { const uq = QUESTS[qi + 1 + ui], gid = UNLOCK_GATE[uq[1]];
        rows.push(`<a class="ah-row"${gid ? ` href="#${gid}" data-gogate="${gid}"` : ""}><span class="ah-lv unl">Lv ${uq[0]}</span><span class="ah-main"><b>🔓 ${STORY_UNLOCKS[uq[1]]}</b><small>${ui === 0 ? "your next quest" : pl(ui + 1, "story quest")} · "${uq[1]}"</small></span></a>`); } }
    /* At the cap there's nothing above you: say so instead of an empty box. */
    if (lv >= 45) rows.push(`<a class="ah-row" href="#g45" data-gogate="g45"><span class="ah-lv">Lv 45</span><span class="ah-main"><b>Level cap reached</b><small>Progress now comes from gear score, not levels</small></span></a>`);
    el.hidden = !rows.length;
    el.innerHTML = rows.length ? `<div class="where-sub">Ahead <span class="ah-ver" title="Each unlock here is backed by two or more independent sources">verified</span></div>${rows.join("")}` : "";
  }
}
/* Main story filter (icon right of "Main story"): objectives and ticked objectives are hidden by default;
   each box shows them. The badge counts what's switched on; × goes back to the default. */
const subDone = (i) => ((char(state).qsub || {})[char(state).quest] || {})[i] || [];
function setSub(i, j, on) {
  char(state).qsub = char(state).qsub || {}; const q = char(state).qsub[char(state).quest] = char(state).qsub[char(state).quest] || {};
  const cur = new Set(q[i] || []); on ? cur.add(j) : cur.delete(j); q[i] = [...cur];
  const n = objSubs(QUEST_STEPS[char(state).quest][i]).length, d = new Set((char(state).qsteps || {})[char(state).quest] || []);
  if (cur.size >= n) d.add(i); else d.delete(i);
  char(state).qsteps = char(state).qsteps || {}; char(state).qsteps[char(state).quest] = [...d]; save();
  return cur.size >= n;
}
function setObj(i, on) {
  const subs = objSubs(QUEST_STEPS[char(state).quest][i]);
  if (subs.length) { char(state).qsub = char(state).qsub || {}; const q = char(state).qsub[char(state).quest] = char(state).qsub[char(state).quest] || {}; q[i] = on ? subs.map((_, j) => j) : []; }
}
const subListHTML = (i, attr) => { const t = QUEST_STEPS[char(state).quest][i], subs = objSubs(t); if (!subs.length) return ""; const sd = subDone(i);
  const loc = ((t.split(" — ")[1] || "").match(/\(([^)]*)\)\s*$/) || [])[1];
  return `<ul class="qs-sub">${subs.map((x, j) => `<li class="${sd.includes(j) ? "on" : ""}"><label><input type="checkbox" ${attr}="${i}:${j}" ${sd.includes(j) ? "checked" : ""}><span>${x}</span></label></li>`).join("")}${loc ? `<li class="qs-sub-loc">${loc}</li>` : ""}</ul>`; };
/* Objectives are done in order: ticking one (or one of its parts) also ticks every objective before it,
   and those fade out with it. Unticking never unticks the earlier ones. */
function completeBefore(i, root, attr) {
  char(state).qsteps = char(state).qsteps || {}; const cur = new Set(char(state).qsteps[char(state).quest] || []);
  for (let j = 0; j < i; j++) if (!cur.has(j)) { cur.add(j); setObj(j, true); }
  char(state).qsteps[char(state).quest] = [...cur]; save();
  if (root) root.querySelectorAll(`input[${attr}]`).forEach(inp => { const j = +inp.getAttribute(attr); if (j < i && !inp.checked) { inp.checked = true; const li = inp.closest("li"); li.classList.add("on"); setTimeout(() => li.classList.add("leaving"), 550); } });
}
function syncJFilt() {
  const o = document.getElementById("jfObj"), d = document.getElementById("jfDone"), tk = document.getElementById("jfTalk"); if (!o) return;
  o.checked = !!state.showObj; d.checked = !!state.qsShowDone; d.disabled = !state.showObj; tk.checked = !!state.showTalk; tk.disabled = !state.showObj;
  const nOn = [state.showObj, state.showObj && state.qsShowDone, state.showObj && state.showTalk].filter(Boolean).length;
  const dot = document.getElementById("jFiltN"); dot.hidden = !nOn; document.getElementById("jFiltBtn").title = nOn ? `Story filters (${nOn} on)` : "Story filters"; document.getElementById("jFiltX").hidden = !nOn;
}
{ const btn = document.getElementById("jFiltBtn"), menu = document.getElementById("jFiltMenu");
  const set = o => { menu.hidden = !o; btn.setAttribute("aria-expanded", String(o)); };
  btn.addEventListener("click", e => { e.stopPropagation(); set(menu.hidden); });
  document.addEventListener("click", e => { if (!menu.hidden && !e.target.closest(".jfilt")) set(false); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !menu.hidden) { set(false); btn.focus(); } });
  document.getElementById("jFiltX").addEventListener("click", e => { e.stopPropagation(); state.showObj = false; state.qsShowDone = false; state.showTalk = false; save(); renderQuestSubs(); });
  document.getElementById("jfObj").addEventListener("change", e => { state.showObj = e.target.checked; save(); renderQuestSubs(); });
  document.getElementById("jfTalk").addEventListener("change", e => { state.showTalk = e.target.checked; save(); renderQuestSubs(); });
  document.getElementById("jfDone").addEventListener("change", e => { state.qsShowDone = e.target.checked; save(); renderQuestSubs(); }); }
/* Current quest's objectives as a mini checklist (ticks kept per quest). All done → a "Next quest" button. */
function renderQuestSubs(noNow) {
  const el = document.getElementById("questSubs"), list = char(state).quest && QUEST_STEPS[char(state).quest];
  syncJFilt();
  if (noNow !== true) renderNow();
  if (!state.showObj) { el.innerHTML = ""; return; }
  if (!list) { el.innerHTML = char(state).quest ? `<p class="qs-none">No objectives recorded for "${char(state).quest}" yet.</p>` : ""; return; }
  const done = (char(state).qsteps || {})[char(state).quest] || [], vis = objIdx(list), n = vis.filter(i => done.includes(i)).length, N = vis.length, showDone = !!state.qsShowDone;
  const head = `<div class="qs-head"><span>Objectives ${n}/${N}</span></div>`;
  /* Last quest the guide covers: the button turns it in (as Next up's "Turned in"); once turned in, the story continues in game. */
  const last = questIdx(char(state)) === QUESTS.length - 1, needLv = turnInNeedsLv(char(state));
  const nextBtn = n !== N ? "" : last && char(state).storyEnd === char(state).quest ? `<p class="qs-end">Altgard story complete · continue in ${STORY_END.region} in game</p>`
    : needLv ? `<p class="qs-wait">Turn in at Lv ${needLv}: the game opens this quest at Lv ${needLv}</p>`
    : `<button type="button" class="qs-next" id="qsNext">${last ? "Quest done · mark turned in" : "Quest done · next quest ›"}</button>`;
  el.innerHTML = head + `<ol class="qs-list">` +
    list.map((t, i) => { if (!vis.includes(i)) return ""; const [a, b] = objPartsOf(char(state).quest, i); if (done.includes(i) && !showDone && n < N) return ""; const sl = subListHTML(i, "data-qsub"); return `<li class="${done.includes(i) ? "on" : ""}${sl ? " has-sub" : ""}"><label><input type="checkbox" data-qobj="${i}" ${done.includes(i) ? "checked" : ""}><span><b>${a}</b>${b && !sl ? `<small>${b}</small>` : ""}</span></label>${sl}</li>`; }).join("") + `</ol>` +
    nextBtn;
}
document.getElementById("questSubs").addEventListener("change", e => {
  const sq = e.target.dataset && e.target.dataset.qsub;
  if (sq != null) { const [i, j] = sq.split(":").map(Number); if (e.target.checked) completeBefore(i, document.getElementById("questSubs"), "data-qobj"); const all = setSub(i, j, e.target.checked); e.target.closest("li").classList.toggle("on", e.target.checked);
    if (all) { const li = e.target.closest("li.has-sub"); if (li && !state.qsShowDone) { li.classList.add("on"); setTimeout(() => li.classList.add("leaving"), 550); setTimeout(renderQuestSubs, 1150); return; } }
    renderNow(); if (!all) return; renderQuestSubs(); return; }
  const i = e.target.dataset && e.target.dataset.qobj; if (i == null) return;
  if (e.target.checked) completeBefore(+i, document.getElementById("questSubs"), "data-qobj");
  setObj(+i, e.target.checked);
  char(state).qsteps = char(state).qsteps || {}; const cur = new Set(char(state).qsteps[char(state).quest] || []);
  e.target.checked ? cur.add(+i) : cur.delete(+i); char(state).qsteps[char(state).quest] = [...cur]; save();
  /* Ticked: turn green, then fade and fold away (unless done ones are shown, or it was the last one). */
  const li = e.target.closest("li"), vis = objIdx(QUEST_STEPS[char(state).quest] || []), all = vis.length, cnt = vis.filter(x => cur.has(x)).length;
  if (e.target.checked && !state.qsShowDone && cnt < all) {
    li.classList.add("on");
    setTimeout(() => li.classList.add("leaving"), 550);
    setTimeout(renderQuestSubs, 1150);
  } else renderQuestSubs();
});
document.getElementById("questSubs").addEventListener("click", e => {
  if (e.target.closest("#qsNext")) {
    if (turnInNeedsLv(char(state))) return;
    if (questIdx(char(state)) === QUESTS.length - 1) {
      GATES.forEach(g => g.items.forEach(it => { if (it.byStory && it.story === char(state).quest) char(state).checks[it.k] = true; }));
      char(state).storyEnd = char(state).quest; save(); update(); }
    else stepQuest(1); }

});
/* Click the previous or next quest to step the story; the three rows roll like a drum. Never touches your level:
   a quest's level is only its recommended level, and your real level comes from the game (Level up / − + / slider). */
function stepQuest(d) {
  const i = questIdx(char(state)), j = i + d;
  if (i < 0 || j < 0 || j >= QUESTS.length) return;
  char(state).quest = QUESTS[j][1]; delete char(state).storyEnd; save();
  update();
  const ul = document.querySelector("ul.story"); if (!ul) return;
  ul.classList.remove("roll-next", "roll-prev"); void ul.offsetWidth; ul.classList.add(d > 0 ? "roll-next" : "roll-prev");
  setTimeout(() => ul.classList.remove("roll-next", "roll-prev"), 450);
}
document.getElementById("questPrev").addEventListener("click", e => { if (e.target.closest(".st-name")) stepQuest(-1); });
document.getElementById("questStatus").addEventListener("click", e => { if (e.target.closest(".st-name") && !e.target.closest(".tip")) stepQuest(1); });
qInput.addEventListener("change", () => {
  const i = findQuest(qInput.value);
  const st = document.getElementById("questStatus");
  if (i === null) { char(state).quest = ""; save(); renderQuest(); return; }
  if (i < 0) {
    st.className = "st next warn";
    st.textContent = i === -2 ? "Several quests match; pick one from the list." : `Not in the list. The guide's story ends at "${QUESTS[QUESTS.length - 1][1]}" (Lv ${QUESTS[QUESTS.length - 1][0]}); set your level above.`;
    return;
  }
  char(state).quest = QUESTS[i][1]; delete char(state).storyEnd; save();
  update();
});

/* The keys at lv hold only what the guide says you have there (rotKeys, src/core/requirements.js: the Skills card's
   unlock rule for skills, the slot levels for stigmas). E_STACK marks stigmas with "*". */
const E_STACK = lv => rotKeys(char(state), lv).e.map(n => n + "*");
/* What's on your keys now, and what's been added since you last looked at the key setup (char(state).rotSeen). */
const rotNow = lv => { const out = [], k = rotKeys(char(state), lv); k.rmb.forEach((n, r) => out.push({ n, key: "Right click", r })); k.q.forEach(n => out.push({ n, key: "Q", r: 0 }));
  k.e.forEach((n, r) => out.push({ n, key: "E", r, stig: true })); return out; };
const rotNew = lv => { const seen = char(state).rotSeen; if (!seen) return []; return rotNow(lv).filter(x => !seen.includes(x.key + ":" + x.n + ":" + x.r)); }; /* moved rows count too */
const rotMarkSeen = () => { char(state).rotSeen = rotNow(char(state).level).map(x => x.key + ":" + x.n + ":" + x.r); save(); };
const rotWhere = x => `${x.key}${x.key === "Q" ? "" : `, row ${x.r}${x.r === 0 ? " (fires first)" : ""}`}`;
function renderStacks(lv) {
  if (!char(state).rotSeen || !char(state).rotSeen.every(k => k.split(":").length === 3)) rotMarkSeen(); /* first run: nothing counts as new */
  const fresh = new Set(rotNew(lv).map(x => x.n));
  const cell = n => n ? `<span class="sk${n.includes("*") ? " stig" : ""}${fresh.has(n.replace(/\*/g, "")) ? " new" : ""}">${n.replace(/\*/g, "")}</span>` : `<span class="sk empty"></span>`;
  /* One grid: shared row numbers on the left, one column per key. */
  const k = rotKeys(char(state), lv), keys = [k.rmb, k.q, E_STACK(lv)];
  document.getElementById("stackViz").innerHTML =
    `<span></span><span class="khead">Right click</span><span class="khead">Q</span><span class="khead">E</span>` +
    [3, 2, 1, 0].map(r => `<i class="rn">${r}</i>` + keys.map(k => cell(k[r]).replace('class="sk', `class="sk${r === 0 ? " r0" : ""}`)).join("")).join("") +
    `<p class="lmb">Left click: <span class="sk">Quick Slice</span></p>` + stLaterHTML();
}
/* Stigmas still to come: where each will go on E when you add it (in the order the slots open). */
function stLaterHTML() {
  const sl = STIGMA_SLOTS(), have = sl.filter(x => char(state).checks[x.k]).map(x => x.name), todo = sl.filter(x => !char(state).checks[x.k]).sort((a, b) => a.lv - b.lv);
  if (!todo.length) return "";
  const cur = [...have], rows = todo.map(x => { cur.push(x.name); const order = E_ORDER.filter(n => cur.includes(n)), r = order.indexOf(x.name), below = order.slice(r + 1);
    return `<li><span class="sk ghost">${stIco(x.name, "st-mini")}${x.name}</span><span class="lt-lv">Lv ${x.lv}</span><span class="lt-where">E, row ${r}${r === 0 ? " (fires first)" : ""}${below.length ? ` · ${below.join(", ")} move${below.length === 1 ? "s" : ""} down one` : ""}</span></li>`; }).join("");
  return `<div class="st-later"><span class="khead">Coming to E</span><ul>${rows}</ul></div>`;
}
function renderRotation() {
  const lv = char(state).level, { rmb, q, e } = rotKeys(char(state), lv);
  const before = e.filter(n => n === "Illusive Clone" || n === "Swift Contract"), after = e.filter(n => !before.includes(n));
  const steps = [];
  if (before.length) steps.push(`<b>E</b> ${before.join(" + ")}`);
  if (q.length) steps.push(`<b>Q</b> ${spMini(q[0])}${q[0]} to get behind the target`);
  if (after.length) steps.push(`<b>E</b> ${after.join(", then ")}`);
  steps.push(`<b>Hold</b> right + left click`);
  document.getElementById("rotLv").textContent = `at Lv ${lv}`;
  document.getElementById("rotPlay").innerHTML = steps.map(x => `<li>${x}</li>`).join("");
  document.getElementById("rotChain").innerHTML = rmb.map((n, i) => `<li><span class="dot"></span><span>${spMini(n)}${n}</span></li>`).join("");
  const nw = rotNew(lv);
  document.getElementById("rotNote").innerHTML = nw.length ? `<b class="rot-new">New</b> ${nw.map(x => `put <b>${x.n}</b> on ${rotWhere(x)}`).join("; ")}. The key grid below shows the full setup; closing this panel clears this note.` : "";
  const tb = document.getElementById("sdNew"); if (tb) tb.hidden = !nw.length;
  if (nw.length) { const ks = document.querySelector("#statDrawer details.mini"); if (ks) ks.open = true; }
  document.getElementById("statSeq").innerHTML = statSeqHTML();
  renderStacks(lv);
}

/* Progress = one-time clears: permanent rewards (Wisdom Stones, Daevanion Crystals, belt scrolls) you can only
   get once, so they're the only thing worth a running total. "Behind" = open ones at or below your level. */
function renderCollection() {
  const lv = char(state).level, ev = gatesOf(char(state)), cd = k => clearDoneOf(char(state), k, ev); /* ticked, or a quest derived as done */
  const quests = []; GATES.forEach(g => g.items.forEach(it => { if (it.kind === "quest") quests.push({ k: it.k, q: it.q, g }); }));
  const sds = AREA_ITEMS.filter(x => x.it.kind === "hideout"), shs = AREA_ITEMS.filter(x => x.it.kind === "stronghold");
  const rows = [
    { key: "quest", name: "Quests", reward: "Wisdom Stone + Daevanion Crystal each", all: quests, behind: quests.filter(x => !cd(x.k) && rqAvail(x.q, lv).ok) },
    { key: "sd", name: "Dungeons", reward: "2 Crystals + 2 Wisdom Stones each", all: sds, behind: sds.filter(x => areaOpen(char(state), x) && !char(state).checks[x.k]) },
    { key: "sh", name: "Strongholds", reward: "2 belt scrolls each", all: shs, behind: shs.filter(x => areaOpen(char(state), x) && !cd(x.k)) },
  ];
  let D = 0, N = 0;
  document.getElementById("progRows").innerHTML = rows.map(r => {
    const d = r.all.filter(x => cd(x.k)).length, n = r.all.length, b = r.behind.length; D += d; N += n;
    const full = { quest: "Regional quests", sd: "Sealed Dungeons", sh: "Strongholds" }[r.key];
    return `<button type="button" class="prow${d === n ? " done" : ""}" data-prog="${r.key}" title="${full}: ${d}/${n} · ${r.reward}${b ? ` · ${b} open at or below Lv ${lv} (click to show)` : d === n ? "" : " · caught up for your level"}">` +
      `<span class="prow-top"><span class="prow-name">${r.name}${b ? `<span class="behind-pill">${b}</span>` : ""}</span><span class="prow-n">${d === n ? "✓ " : ""}${d}/${n}</span></span>` +
      `<span class="prow-bar"><span style="width:${n ? d / n * 100 : 0}%"></span></span></button>`;
  }).join("");
  const pct = N ? Math.round(D / N * 100) : 0, C = 2 * Math.PI * 32, fg = document.getElementById("ringFg");
  fg.style.strokeDasharray = C; fg.style.strokeDashoffset = C * (1 - pct / 100);
  document.getElementById("ringTxt").textContent = pct + "%";
  document.getElementById("progBig").textContent = `${D}/${N}`;
}
/* Progress rows jump to where the open ones are: quests → their milestone, dungeons/strongholds → Areas. */
document.getElementById("progRows").addEventListener("click", e => {
  const b = e.target.closest("[data-prog]"); if (!b) return;
  const lv = char(state).level, key = b.dataset.prog;
  if (key === "quest") {
    const ev = gatesOf(char(state)), open = it => it.kind === "quest" && !clearDoneOf(char(state), it.k, ev);
    const g = GATES.find(g => g.items.some(it => open(it) && rqAvail(it.q, lv).ok)) || GATES.find(g => g.items.some(open));
    if (g) { state.open[g.id] = true; save(); update(); const el = document.getElementById(g.id); if (el) { el.open = true; el.scrollIntoView({ behavior: SMOOTH(), block: "start" }); } }
    return;
  }
  if (key === "sh") goAreas("sh");
  else { const open = AREA_ITEMS.filter(x => x.it.kind === "hideout" && areaOpen(char(state), x) && !char(state).checks[x.k]).map(x => x.lv); goAreas(open.length ? Math.min(...open) : defaultBand()); }
});


function renderNext() {
  renderCollection();
  renderRotation();
  renderQuest(true);
  renderStoryChips();
  renderStoryReqs();
  const lv = char(state).level;
  /* Open upgrades in the milestones' order and the points to spend (src/core/requirements.js). */
  const { open, now } = skillOpen(char(state), lv), { fromLevels, stones, spent, pts } = skillPoints(char(state), lv);
  const box = document.getElementById("spNextBox");
  const next = now[0];
  const overTicked = spent > fromLevels + stones;
  const ahead = open.filter(x => !now.includes(x)).sort((a, b) => a.req - b.req || a.rank - b.rank);
  /* Hero = what to do next: the next upgrade you can take now, else the next one to unlock. */
  const hero = next || ahead[0];
  const nowCost = now.reduce((t, y) => t + (y.spec ? 0 : y.cost), 0);
  /* Points you'll have when x unlocks: spare now (after buying what's open) + level points gained by then. */
  const haveAt = x => pts - (next ? nowCost : 0) + (LEVEL_POINTS[Math.min(45, x.req)] || 0) - fromLevels;
  let heroHTML = "";
  if (hero) {
    const locked = !now.includes(hero), cost = hero.spec ? 0 : hero.cost;
    const have = locked ? haveAt(hero) + (next ? 0 : 0) : pts;
    const ok = !locked && (hero.spec || pts >= cost);
    const state_ = hero.spec ? (locked ? "lock" : "ok") : locked ? (have >= cost ? "lock" : "short") : ok ? "ok" : "short";
    const sub = hero.spec ? hero.s.spec :
      `${locked ? `Lv ${hero.req}` : "Available now"} · <span class="nw">priority #${hero.rank + 1}</span>${hero.s.single ? ` · single source (${hero.s.single})` : ""}`;
    const btn = hero.spec ? (locked ? `Pick at Lv ${hero.req}` : "Mark specialty picked") :
      ok ? `Mark spent · ${spCostTxt(hero)}` : locked ? (have >= cost ? `All Lv ${lv} spent · next at Lv ${hero.req}` : `Lv ${hero.req} · need ${cost - have} more pts`) : `Need ${cost - pts} more pts`;
    const pct = hero.spec ? (locked ? 0 : 100) : Math.min(100, Math.max(0, pts / cost * 100));
    heroHTML = `<div class="sphero ${state_}${hero.spec ? " spec" : ""}">` +
      `<div class="dvhead">${SP_ICONS[hero.s.n] ? `<span class="dvico spico art"><img src="${SP_ICONS[hero.s.n]}" alt="" loading="lazy" onerror="this.remove()"></span>` : `<span class="dvico spico ini" aria-hidden="true">${ini(hero.s.n)}</span>`}` +
      `<div class="dvtext"><span class="spname">${hero.s.n} ${hero.spec ? "<em>specialty</em>" : `<span class="lvarr">${hero.L - 1} → ${hero.L}</span>`}</span><small title="${sub.replace(/<[^>]+>/g, "")}">${sub}</small>` +
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
  const rest = (next ? [...now.slice(1), ...ahead] : ahead.slice(1)).slice(0, 10);
  let cum = next ? 0 : (ahead[0] && !ahead[0].spec ? ahead[0].cost : 0);
  const spB = SP_STEPS.filter(x => char(state).checks[x.k]).length, spN = SP_STEPS.length;
  document.getElementById("spAfter").innerHTML = rest.length ? `<div class="dvbh"><div class="dvbh-top"><span class="dvbh-k">Coming up</span><span class="dvbh-n">${spB} of ${spN} spent</span></div><span class="dvbh-bar"><span style="width:${spB / spN * 100}%"></span></span></div><ul class="soonlist" id="spSoon">` + rest.map(x => {
    cum += x.spec ? 0 : x.cost;
    const avail = now.includes(x), have = avail ? pts - (next ? next.cost : 0) : haveAt(x), short = cum - have;
    return `<li class="${x.spec ? "isspec" : ""}" title="${x.spec ? "Specialty: " + x.s.spec : spCostTxt(x)} · ${avail ? "available now" : "Lv " + x.req} · ${short > 0 ? `${short} short by then` : "points covered"}${x.s.single ? ` · single source (${x.s.single})` : ""}"><span class="sname">${spMini(x.s.n)}${x.s.n} ${x.spec ? `<span class="spectag">spec</span>` : `<span class="lvarr">${x.L - 1} → ${x.L}</span>`}</span><span class="slv${avail ? " now" : ""}">${avail ? "now" : "Lv " + x.req}</span><span class="sst ${short > 0 ? "short" : "ok"}">${short > 0 ? `−${short}` : "✓"}</span></li>`;
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
/* Daevanion: the player types the board's total points and logs what each node cost (path included);
   remaining = total − logged costs. Node order lives in the milestones (Nezekan Lv 13, Zikel 20, Vaizel 30, Triniel 40). */
const dvShort = t => t.replace("Cooldown Reduction or Combat Speed corner", "1 corner: CDR or Speed").replace("Critical Damage Boost corner", "Crit Damage corner").replace("Multi-Hit Chance corner", "Multi-Hit corner");
/* What a shut board waits for (dvWaitOf): E6's blocker text ("unlocks after "Urgent Pursuit" · N quests ahead"); Basic and the
   switch off keep the short "opens after "X"" (Basic shows chains on milestone rows only, design Q8). */
const dvWhy = w => chainsOn() && !isBasic() && w.text ? w.text : `opens after "${w.story}"`;
function renderDaevanion() {
  /* The card stays shown before the window opens: it says what opens it. (It never hid: #dvBox's display: flex overrode
     `hidden`, so the old `box.hidden = !dvOpen(…)` was dead code; E6 removes it rather than hide the gate text.) */
  const total = char(state).dvTotal || 0, left = total - dvSpent(char(state));
  document.getElementById("dvRemain").innerHTML = dvSplitTxt(total);
  document.getElementById("dvBig").innerHTML = `<b class="dvsync" title="Click to match the game's crystals left">${total ? left : "–"}</b><span>crystal${total && left === 1 ? "" : "s"} left</span>${char(state).dvAdj ? `<em class="dvadj" title="Correction so this matches the game">${char(state).dvAdj > 0 ? "−" : "+"}${Math.abs(char(state).dvAdj)} adj</em>` : ""}`;
  /* One node at a time: the next unbought node on an unlocked board, in the milestones' order. */
  const opts = [dvNext(char(state))].filter(Boolean), list = document.getElementById("dvNextList");
  list.innerHTML = opts.length
    ? opts.map(it => { const cost = (char(state).dvCost || {})[it.k];
        const st = !cost ? `<span class="dvst">enter in-game cost</span>` : cost <= (total - dvSpent(char(state))) ? `<span class="dvst ok">ready to buy</span>` : `<span class="dvst"></span>`;
        /* Next node, top to bottom: what (icon + name), progress (points left vs its cost, cost editable inline),
           action (one button whose label says exactly what's missing). The checkbox stays hidden for state sync. */
        return `<div class="dvrow nx" data-nx="${it.k}"><input type="checkbox" class="dvcb" data-k="${it.k}" hidden>` +
          `<div class="dvhead">${dvIcon(it)}<div class="dvtext">${dvName({ ...it, t: dvShort(it.t.split(" · ")[0]) })}<small title="${dvMeta(it)}">${it.board} · ${it.t.includes(" · ") ? it.t.split(" · ")[1] : DV_TYPE[it.ty][1].replace(" skill", "")}</small><div class="dvbar"><div class="dvtrack"><span></span></div><span class="dvbar-l"></span></div>` +
          `<div class="dvcost dvcost-col"><span class="dvcost-k">cost <span class="dvi" tabindex="0" role="note" aria-label="Required amount of crystals to obtain selected Daevanion" data-tip="Required amount of crystals to obtain selected Daevanion">i</span></span><span class="cstep"><input class="dvc" type="number" min="0" max="200" inputmode="numeric" data-dvc="${it.k}" value="${cost ?? ""}" placeholder="?" aria-label="Cost in crystals"><span class="cstep-b"><button type="button" data-cst="1" tabindex="-1" aria-label="One more">▴</button><button type="button" data-cst="-1" tabindex="-1" aria-label="One fewer">▾</button></span></span></div></div></div>` +
          `<p class="dvstat"></p><div class="buyrow"><button type="button" class="dvbuy" data-buy="${it.k}"></button><div class="buystat" hidden></div></div></div>`; }).join("")
    : (() => { const nl = DV_NODES().find(it => !char(state).checks[it.k]); if (!nl) return null;
        const opensAt = Math.min(...DV_NODES().filter(n => n.board === nl.board).map(n => n.blv)), at = Math.max(opensAt, nl.blv), w = dvWaitOf(char(state), nl.board);
        /* Stop point: show the next node you'll buy (on the next board) and a green "all done" status in the button slot. */
        return `<div class="dvlocked"><div class="dvhead">${dvIcon(nl)}<div class="dvtext">${dvName({ ...nl, t: dvShort(nl.t.split(" · ")[0]) })}<small title="${dvMeta(nl)}">${nl.board}${w ? ` board · ${w.story ? dvWhy(w).split(" · ")[0] : `opens Lv ${at}`}` : ` · Lv ${at}`}</small></div></div>` +
          /* E6: the hero's one-line small text keeps the quest, the status below it the distance (both fit at 390 px; nothing said twice) */
          `<div class="buyrow"><div class="buystat done">✓ All open nodes acquired · ${w && w.story && dvWhy(w).split(" · ")[1] ? `<span class="nw">next: ${nl.board}</span> · <span class="nw">${dvWhy(w).split(" · ")[1]}</span>`
            : `<span class="nw">next: ${nl.board} ${w && w.story ? dvWhy(w).replace(/^opens /, "") : `at Lv ${at}`}</span>`}</div></div></div>`; })()
    || `<div class="alldone"><div class="dvhead"><span class="dvico done-ico" aria-hidden="true">✓</span><div class="dvtext"><span class="spname">All planned nodes acquired</span><small>Spare crystals: Critical Hit and Attack nodes</small></div></div></div>`;
  dvNxUpdate(); renderUndo(); requestAnimationFrame(() => typeof fitSkills === "function" && fitSkills());
  /* "Then": the next few nodes after this one (same order), like Skills' Coming up. */
  const after = DV_NODES().filter(it => !char(state).checks[it.k]).slice(opts.length || 1, (opts.length || 1) + 14);
  /* Board banner: which board you're on and how far along; a new board gets a proper announcement. */
  const heroB = opts[0] ? opts[0].board : null, nextLocked = !heroB && DV_NODES().find(it => !char(state).checks[it.k]);
  const bName = heroB || (nextLocked && nextLocked.board);
  /* Current board strip, always shown: the board you're buying on (or the last one you finished). Gold "new" right after it opens. */
  const curB = heroB || ([...DV_NODES()].reverse().find(it => char(state).checks[it.k] && openOf(char(state), it.k)) || DV_NODES()[0]).board;
  { const bl = DV_NODES().filter(it => it.board === curB), bd = bl.filter(it => char(state).checks[it.k]).length, isNew = !!heroB && bd === 0, full = bd === bl.length;
    /* Header for the list under it, styled like Skills' "Coming up": board name, bought count, a thin bar. */
    document.getElementById("dvBoard").innerHTML = `<div class="dvbh${isNew ? " new" : ""}${full ? " full" : ""}"><div class="dvbh-top"><span class="dvbh-k">${curB} board${isNew ? ` <span class="dvb-new">New</span>` : ""}</span><span class="dvbh-n">${full ? "✓&nbsp;" : ""}${bd} of ${bl.length}<span class="dvbh-w"> acquired</span></span></div>` +
      `<span class="dvbh-bar"><span style="width:${bd / bl.length * 100}%"></span></span></div>`; }
  let prevB = curB;
  document.getElementById("dvThen").innerHTML = after.length ? `<ul class="soonlist">` + after.map(it => {
    const opensAt = Math.min(...DV_NODES().filter(n => n.board === it.board).map(n => n.blv)), wB = dvWaitOf(char(state), it.board), shutB = !!wB;
    /* Not open yet: a bar from the last milestone below your level up to the board's level. */
    const fromLv = (GATES.filter(g => g.lv < char(state).level).pop() || { lv: 1 }).lv, pctB = Math.min(100, Math.max(0, (char(state).level - fromLv) / Math.max(1, opensAt - fromLv) * 100));
    const div = it.board !== prevB ? `<li class="then-board"><span>${it.board}</span><span>${!shutB ? "open" : wB.story ? dvWhy(wB) : `opens Lv ${opensAt} · ${opensAt - char(state).level} to go`}</span>${shutB && !wB.story ? `<span class="tb-bar"><span style="width:${pctB}%"></span></span>` : ""}</li>` : "";
    prevB = it.board;
    return div + `<li title="${dvMeta(it)}"><span class="sname">${SP_ICONS[dvSkill(it)] ? spMini(dvSkill(it)) : `<img class="dvmini" src="${dvIconSrc(it)}" alt="" loading="lazy" onerror="this.remove()">`}<span class="dvname ${DV_TYPE[it.ty][0]}">${dvShort(it.t)}</span></span><span class="slv">${!openOf(char(state), it.k) && it.blv !== opensAt ? `Lv ${it.blv}` : ""}</span><span class="sst"></span>${shutB ? `<span class="nb-tag" title="${it.board} board ${wB.story ? (chainsOn() && !isBasic() && wB.text ? wB.text : `opens after "${wB.story}" is turned in`).replace(/"/g, "&quot;") : `opens at Lv ${opensAt}`}">${wB.story ? "Story" : `Lv ${opensAt}`}</span>` : ""}</li>`; }).join("") + `</ul>` : "";
  /* Full plan, grouped by board; boards not yet open are dimmed with their level. */
  const byBoard = {};
  DV_NODES().forEach(it => { (byBoard[it.board] = byBoard[it.board] || []).push(it); });
  document.getElementById("dvAllList").innerHTML = Object.entries(byBoard).map(([b, list]) => {
    const opens = Math.min(...list.map(it => it.blv)), wb = dvWaitOf(char(state), b), shut = !!wb, done = list.filter(it => char(state).checks[it.k]).length;
    return `<ul class="items dv-board${shut ? " shut" : ""}"><li class="sub-h"><span class="sub-txt">${b} · ${shut ? (wb.story ? dvWhy(wb) : `opens at Lv ${opens}`) : `${done} of ${list.length} acquired`}</span></li>${list.map(dvRowHTML).join("")}</ul>`;
  }).join("");
  const inp = document.getElementById("dvIn");
  if (document.activeElement !== inp) inp.value = total || "";
  const allOpen = !!state.dvAllOpen;
  document.getElementById("dvAllList").hidden = !allOpen;
  const ab = document.getElementById("dvAllBtn"); ab.setAttribute("aria-expanded", String(allOpen)); ab.textContent = allOpen ? "Hide nodes" : "All nodes";
  /* Outline the tile when the next node is affordable (or points are waiting and its cost isn't logged yet). */
  const nx = dvNext(char(state), char(state).level), nc = nx && (char(state).dvCost || {})[nx.k];
  document.getElementById("dvBox").classList.toggle("act", !!nx && total > 0 && left >= dvNeed(char(state), nx));
  refreshDvGates();
}
/* Up/down arrows inside the cost box: step the value and run the normal input handler. From an empty box, up gives 1
   (no node costs 0 to buy outright) and down gives 0 ("already got it on the way to another node"), the same as the
   keyboard arrows in a number field (F6). */
layoutEl.addEventListener("click", e => {
  const b = e.target.closest("[data-cst]"); if (!b) return;
  const i = b.closest(".cstep").querySelector("input.dvc"), cur = i.value === "" ? (b.dataset.cst > 0 ? 0 : 1) : +i.value;
  i.value = Math.max(0, Math.min(200, cur + +b.dataset.cst)); i.dispatchEvent(new Event("input", { bubbles: true }));
});
/* Logging a cost enables that node's tick everywhere it appears; totals update live. */
layoutEl.addEventListener("input", e => {
  const k = e.target.dataset && e.target.dataset.dvc; if (!k) return;
  const v = parseInt(e.target.value, 10);
  char(state).dvCost = char(state).dvCost || {};
  /* 0 is a real cost: a node you already got on the way to another one. */
  const has = e.target.value.trim() !== "" && v >= 0;
  if (has) char(state).dvCost[k] = v; else delete char(state).dvCost[k];
  save();
  layoutEl.querySelectorAll(`[data-dvc="${k}"]`).forEach(i => { if (i !== e.target) i.value = has ? v : ""; });
  /* A logged cost swaps the node art to its filled version. */
  const node = DV_NODES().find(n => n.k === k);
  if (node && DV_TYPE_ICONS[node.ty]) layoutEl.querySelectorAll(`.dvrow.nx[data-nx="${k}"] .dvico img:first-child, .dvn[data-dvk="${k}"] img.dvmini`).forEach(im => { im.src = dvIconSrc(node); });
  refreshDvGates();
  dvLive();
  renderNow();
});
/* Small icon before a skill name; an empty slot of the same size when there's no art yet, so names line up. */
/* No art for a skill/stigma: a small initials square (same look for both). */
const ini = n => n.split(/\s+/).filter(w => /^[A-Z]/.test(w)).map(w => w[0]).join("").slice(0, 2) || n.slice(0, 2);
const spMini = n => SP_ICONS[n] ? `<img class="spmini" src="${SP_ICONS[n]}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">` : `<span class="spmini ini" aria-hidden="true">${ini(n)}</span>`;
const dvIconSrc = it => { const set = DV_TYPE_ICONS[it.ty]; return set ? set[char(state).checks[it.k] ? 1 : 0] : ITEMS.crystal[2]; };
const dvSkill = it => (it.t || "").split(" · ")[0];
/* The acquired art sits on top, hidden; it fades in while you hover the green "Mark acquired" button. */
const dvIcon = it => `<span class="dvico${DV_TYPE_ICONS[it.ty] ? " art" : ""}"><img src="${dvIconSrc(it)}" alt="" loading="lazy" onerror="this.remove()">${DV_TYPE_ICONS[it.ty] && !char(state).checks[it.k] ? `<img class="dvon" src="${DV_TYPE_ICONS[it.ty][1]}" alt="" loading="lazy" onerror="this.remove()">` : ""}${SP_ICONS[dvSkill(it)] ? `<img class="dvbadge" src="${SP_ICONS[dvSkill(it)]}" alt="" loading="lazy" onerror="this.remove()">` : ""}</span>`;
/* Board total = 4 per level past 11 + 1 per Daevanion Crystal used (formula confirmed in game at Lv 16 and 17). */
function dvSplitTxt(total) {
  const fromLv = Math.max(0, 4 * (char(state).level - 11)), cr = total - fromLv;
  document.getElementById("dvCr").textContent = total && cr >= 0 ? `+${cr} from items` : "";
  document.getElementById("dvCr").title = total && cr >= 0 ? `${total} crystals = ${fromLv} from levels (4 per level past 11) + ${cr} from Daevanion Crystal items used from your Cube` : "";
  if (!total) return "Enter the board's total crystals.";
  if (cr < 0) return `<b>${total}</b> total, but Lv ${char(state).level} alone gives ${fromLv}. Check your level or the total.`;
  return "";
}
/* "Crystals left" doesn't match the game? Click the number, type what the game shows; the difference is
   kept as a correction (e.g. a path node whose cost was logged 1 short). Respec clears it. */
document.getElementById("dvBig").addEventListener("click", e => {
  const b = e.target.closest(".dvsync"); if (!b || !(char(state).dvTotal > 0)) return;
  const cur = char(state).dvTotal - dvSpent(char(state));
  b.outerHTML = `<input class="dvsync-in" type="number" min="0" max="999" value="${cur}" aria-label="Crystals left in game">`;
  const i = document.querySelector("#dvBig .dvsync-in"); i.focus(); i.select();
  let fin = false;
  const done = ok => { if (fin) return; fin = true; if (ok) { const v = parseInt(i.value, 10); if (Number.isFinite(v)) char(state).dvAdj = (char(state).dvAdj || 0) + (cur - v); save(); } update(); };
  i.addEventListener("keydown", ev => { if (ev.key === "Enter") done(true); if (ev.key === "Escape") done(false); });
  i.addEventListener("blur", () => done(true), { once: true });
});
function dvNxUpdate() {
  const total = char(state).dvTotal || 0, left = Math.max(0, total - dvSpent(char(state)));
  document.querySelectorAll("#dvNextList .dvrow.nx").forEach(r => {
    const k = r.dataset.nx, it = DV_NODES().find(n => n.k === k), c = (char(state).dvCost || {})[k], need = it ? dvNeed(char(state), it) : (c ?? 1);
    const ok = c != null && c <= left, short = left < need;
    const bar = r.querySelector(".dvtrack span"), btn = r.querySelector(".dvbuy"), st = r.querySelector(".dvstat"), lab = r.querySelector(".dvbar-l");
    bar.style.width = (need ? Math.min(100, left / need * 100) : 100) + "%";
    if (lab) lab.innerHTML = `<b>${left}</b>/${need}${c != null ? "" : "+"}`; lab.title = "Crystals left / this node's cost";
    r.classList.toggle("ok", ok); r.classList.toggle("short", short); r.classList.toggle("nocost", c == null);
    /* One state at a time, like Skills: can't afford even the minimum → what's missing; no cost yet → the gold box asks;
       affordable → the buy button. */
    const miss = need - left;
    btn.hidden = !ok; btn.disabled = !ok;
    btn.textContent = ok ? (c === 0 ? "Mark acquired · free" : `Mark acquired · ${c} crystal${c === 1 ? "" : "s"}`) : "";
    const bs = r.querySelector(".buystat");
    if (bs) { bs.hidden = ok; bs.classList.toggle("ask", !short && c == null);
      bs.innerHTML = short ? `Need ${miss}${c != null ? "" : "+"} more · +4 per level${tipPop("crystals")}` : !ok ? `Type its cost from the game` : ""; }
    st.textContent = "";
  });
}
function dvLive() {
  dvNxUpdate();
  const total = char(state).dvTotal || 0, left = total - dvSpent(char(state));
  document.getElementById("dvBig").innerHTML = `<b class="dvsync" title="Click to match the game's crystals left">${total ? left : "–"}</b><span>crystal${total && left === 1 ? "" : "s"} left</span>${char(state).dvAdj ? `<em class="dvadj" title="Correction so this matches the game">${char(state).dvAdj > 0 ? "−" : "+"}${Math.abs(char(state).dvAdj)} adj</em>` : ""}`;
  document.getElementById("dvRemain").innerHTML = dvSplitTxt(total);
  document.querySelectorAll("#dvNextList .dvrow").forEach(r => {
    const k = r.querySelector("input[type=checkbox]").dataset.k, c = (char(state).dvCost || {})[k], st = r.querySelector(".dvst");
    if (!st) return;
    st.className = "dvst" + (c != null && c <= left ? " ok" : "");
    st.textContent = c == null ? "enter in-game cost" : c <= left ? "ready to buy" : "";
  });
  const nx = dvNext(char(state), char(state).level), nc = nx && (char(state).dvCost || {})[nx.k];
  document.getElementById("dvBox").classList.toggle("act", !!nx && total > 0 && left >= dvNeed(char(state), nx));
}
document.getElementById("dvIn").addEventListener("input", e => {
  char(state).dvTotal = Math.max(0, parseInt(e.target.value.trim(), 10) || 0);
  save(); renderDaevanion(); renderNow();
});
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
/* Fill the Skills card down to the height of its neighbours: drop Coming up rows that don't fit (min 3). */
/* Elastic lists (Skills "Coming up", Daevanion's board list) show at least 3 rows, then add rows while their card
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
window.addEventListener("resize", () => requestAnimationFrame(fitRail));
document.getElementById("gates").addEventListener("toggle", () => requestAnimationFrame(fitRail), true);
/* Stigma card: the four slots from the milestones (22 / 27 / 32 / 37). Ticking "equipped" here is the same tick as the
   milestone's "Equip …" line. Slot 1 also needs "The One Who Hears the Voice" done (that's what unlocks Stigmas). */
/* E row a slot's stigma goes to when added (stigmas in slots up to n, in E_ORDER), and who moves down. */
const eRowOf = n => { const sl = STIGMA_SLOTS(), cur = sl.filter(x => x.n <= n).map(x => x.name), nm = sl[n - 1].name, order = E_ORDER.filter(x => cur.includes(x)), r = order.indexOf(nm); return { r, below: order.slice(r + 1) }; };
/* Milestone text follows the picks: stigma names, E rows, and the full-rotation line at slot 4. */
function fillStigmaText() {
  const names = stNames();
  mainEl.querySelectorAll(".stn[data-slot]").forEach(x => { x.textContent = names[x.dataset.slot - 1]; });
  mainEl.querySelectorAll(".erow[data-slot]").forEach(x => { const { r, below } = eRowOf(+x.dataset.slot); x.textContent = r < 0 ? "" : `, row ${r}${below.length ? ` (${below.join(", ")} move${below.length === 1 ? "s" : ""} down one)` : ""}`; });
  const e = E_ORDER.filter(x => names.includes(x)), pre = e.filter(n => n === "Illusive Clone" || n === "Swift Contract"), post = e.filter(n => !pre.includes(n));
  mainEl.querySelectorAll(".rotseq").forEach(x => { x.innerHTML = seq([pre.length ? "E: " + pre.join(" + ") : "", "Q: Shadowstrike", post.length ? "E: " + post.join(", ") : "", "Hold both mouse buttons"].filter(Boolean)); });
}
const stIco = (name, cls) => STIGMA_ICON[name] ? `<img class="${cls}" src="${STIGMA_ICON[name]}" alt="">` : cls === "st-mini" ? `<span class="st-mini ini" aria-hidden="true">${ini(name)}</span>` : "";
/* Grey "i" with a popover, same as the Skills/Daevanion "need more" tips. */
const stTip = () => `<span class="tipwrap"><button type="button" class="tipbtn" aria-label="Stigma shard costs" aria-expanded="false" aria-controls="tipPop${++tipSeq}">i</button><span class="tippop" id="tipPop${tipSeq}" role="tooltip"><b>Shards per level</b>1–5: 1 each · 6–10: 2 · 11–15: 4 · 16–20: 8 (75 to reach 20). Learning a stigma is its level 1. Bonuses at 5, 10, 15, 20.<br><br><b>More shards</b>1 per character level from 23 to 39 (2 from 40), plus achievements and shops.<br><br><b>Plan</b>Triniel's Dagger to 10, then Illusive Clone toward 20.<span class="tipopen">Costs from Metabot and allthings.how; not yet checked in game.</span></span></span>`;
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
document.addEventListener("keydown", e => { const f = e.target.closest && e.target.closest("[data-stother]"); if (!f) return; if (e.key === "Enter") { e.preventDefault(); stOtherDone(f, true); } else if (e.key === "Escape") stOtherDone(f, false); });
document.addEventListener("focusout", e => { const f = e.target.closest && e.target.closest("[data-stother]"); if (f) setTimeout(() => stOtherDone(f, true), 0); });
[stTickClick, stUpClick, stLvClick].forEach(f => document.addEventListener("click", f));
document.addEventListener("change", stPickChange);
document.getElementById("stShards").addEventListener("input", e => { char(state).stShards = Math.max(0, parseInt(e.target.value, 10) || 0); save(); renderStigma(); renderNow(); fitSkills(); });
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
document.getElementById("spNextBox").addEventListener("change", e => {
  const k = e.target.dataset.sp; if (!k || !e.target.checked) return;
  char(state).checks[k] = true; save();
  const cb = mainEl.querySelector(`input[data-k="${k}"]`); if (cb) cb.checked = true;
  update();
});

function setLevel(v) {
  v = Math.max(1, Math.min(45, parseInt(v, 10) || 1));
  if (char(state).dvTotal) char(state).dvTotal = Math.max(0, char(state).dvTotal + dvFromLv(v) - dvFromLv(char(state).level));
  /* Shards on hand follow level changes the same way crystals do (down too, so fixing a mis-click undoes it). */
  { const ds = shardsFromLv(v) - shardsFromLv(char(state).level || 1); if (ds) char(state).stShards = Math.max(0, (char(state).stShards || 0) + ds); }
  /* "Not in game yet" snoozes last until the next Level up; a quest with no prerequisite data keeps it until its recommended level. */
  if (v > (char(state).level || 1) && char(state).rqSnooze) { Object.keys(char(state).rqSnooze).forEach(k => { const it = RQ_K(k); if (!(it && it.q.noPre && v < it.q.rec)) delete char(state).rqSnooze[k]; });
    if (!Object.keys(char(state).rqSnooze).length) delete char(state).rqSnooze; }
  char(state).level = v;
  /* Areas follows you: if the band you're viewing is fully cleared, go back to the default (lowest band with open clears). */
  if (state.areaLv && state.areaLv !== "sh" && !AREA_ITEMS.some(x => bandOf(x) === +state.areaLv && !char(state).checks[x.k])) delete state.areaLv;
  GATES.forEach(g => delete state.open[g.id]);
  save(); update();
}
document.getElementById("lvlNum").addEventListener("change", e => setLevel(e.target.value));
document.getElementById("lvlRange").addEventListener("input", e => setLevel(e.target.value));
document.getElementById("lvlDown").addEventListener("click", () => setLevel(char(state).level - 1));
document.getElementById("lvlUp").addEventListener("click", () => setLevel(char(state).level + 1));
/* Level-up button: same as +, with a bit of ceremony (chime, burst, what you gained). */
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
document.getElementById("lvlUpBig").addEventListener("click", e => {
  const from = char(state).level; if (from >= 45) return;
  setLevel(from + 1);
  const to = char(state).level, sp = (LEVEL_POINTS[to] || 0) - (LEVEL_POINTS[from] || 0), dv = dvFromLv(to) - dvFromLv(from), sh = shardsFromLv(to) - shardsFromLv(from);
  if (state.sound !== false) chime();
  const btn = e.currentTarget, r = btn.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  btn.classList.remove("pop"); void btn.offsetWidth; btn.classList.add("pop");
  const num = document.getElementById("lvlNum"); num.classList.remove("pulse"); void num.offsetWidth; num.classList.add("pulse");
  for (let i = 0; i < 18; i++) {
    const p = document.createElement("span"); p.className = "lvl-spark";
    const a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 45;
    p.style.left = cx + "px"; p.style.top = cy + "px";
    p.style.setProperty("--dx", Math.cos(a) * d + "px"); p.style.setProperty("--dy", Math.sin(a) * d - 10 + "px");
    p.style.background = i % 3 ? "var(--good)" : "#e6c76a";
    document.body.appendChild(p); setTimeout(() => p.remove(), 900);
  }
  const f = document.createElement("div"); f.className = "lvl-float";
  f.innerHTML = `<b>Lv ${to}</b> +${sp} skill pts${dv ? ` · +${dv} crystals` : ""}${sh ? ` · +${sh} shard${sh === 1 ? "" : "s"}` : ""}`;
  f.style.left = cx + "px"; f.style.top = r.top - 6 + "px";
  document.body.appendChild(f); setTimeout(() => f.remove(), 1700);
  /* Under reduced motion the floating label is hidden (CSS): the gains go in the toast instead. */
  if (RMQ.matches) rewardToast(f.textContent);
});
/* Filter dropdown: funnel button opens a menu of checkboxes + Reset; closes on outside click or Esc. */
const filtBtn = document.getElementById("btnFilter"), filtMenu = document.getElementById("filtMenu");
const setFilt = o => { filtMenu.hidden = !o; filtBtn.setAttribute("aria-expanded", String(o)); };
filtBtn.addEventListener("click", e => { e.stopPropagation(); setFilt(filtMenu.hidden); });
document.addEventListener("click", e => { if (!filtMenu.hidden && !e.target.closest(".filt")) setFilt(false); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !filtMenu.hidden) { setFilt(false); filtBtn.focus(); } });
document.getElementById("fCards").addEventListener("change", e => { state.hideCards = e.target.checked; save(); update(); });
document.getElementById("fTicked").addEventListener("change", e => { state.hide = e.target.checked; save(); update(); });
document.getElementById("fOpt").addEventListener("change", e => { state.hideOpt = e.target.checked; save(); update(); });

const btnExpand = document.getElementById("btnExpand");
/* One toggle: Expand all ↔ Collapse all, based on the milestone cards you can see. */
const gateCards = () => [...document.querySelectorAll("#gates details.step")].filter(d => !d.hidden);
const syncExpand = () => { const all = gateCards(); btnExpand.textContent = all.length && all.every(d => d.open) ? "Collapse all" : "Expand all"; };
btnExpand.addEventListener("click", () => {
  const all = gateCards(), open = !all.every(d => d.open);
  all.forEach(d => { d.open = open; state.open[d.id] = open; });
  save(); syncExpand();
});
document.getElementById("gates").addEventListener("toggle", () => syncExpand(), true);
/* Links that jump to a milestone open it too. */
layoutEl.addEventListener("click", e => {
  const a = e.target.closest("[data-gogate]"); if (!a) return;
  e.preventDefault();
  const d = document.getElementById(a.dataset.gogate); if (!d) return;
  d.hidden = false; d.open = true; state.open[d.id] = true; save();
  d.scrollIntoView({ behavior: SMOOTH(), block: "start" });
});
document.getElementById("dvAllBtn").addEventListener("click", () => { state.dvAllOpen = !state.dvAllOpen; save(); renderDaevanion(); });
/* Undo for the last board node you ticked (from anywhere on the page). It stays until you undo it or tick
   another node, and survives a reload. */
/* Shown for 10 seconds after a buy, fading out over the last 1.5 s. */
let undoTimer = 0;
function renderUndo() {
  const el = document.getElementById("dvUndo"); if (!el) return;
  const it = char(state).dvLast && char(state).checks[char(state).dvLast] && DV_NODES().find(n => n.k === char(state).dvLast);
  const age = Date.now() - (char(state).dvLastAt || 0), live = it && age < 10000;
  clearTimeout(undoTimer);
  el.innerHTML = live ? `<button type="button" class="undorow" id="dvUndoBtn" style="animation-delay:-${age}ms" title="Untick the last node you acquired"><span class="ur-k">↶ Undo</span><span class="ur-n">${dvShort(it.t)}</span></button>` : "";
  if (live) undoTimer = setTimeout(() => { el.innerHTML = ""; }, 10000 - age);
}
document.getElementById("dvUndo").addEventListener("click", e => {
  if (!e.target.closest("#dvUndoBtn")) return;
  const k = char(state).dvLast && char(state).checks[char(state).dvLast] ? char(state).dvLast : null;
  if (!k) return;
  char(state).checks[k] = false; delete char(state).dvLast; save(); update();
});
/* Next node's buy button ticks its (hidden) checkbox, same path as any other tick. */
layoutEl.addEventListener("click", e => {
  const b = e.target.closest("[data-buy]"); if (!b || b.disabled) return;
  const cb = b.closest(".dvrow").querySelector("input.dvcb"); cb.checked = true;
  cb.dispatchEvent(new Event("change", { bubbles: true }));
});
/* Stat priority drawer: a tab pinned to the right edge; open state remembered.
   It starts level with the top of the cards row and sticks 16px from the top once you scroll past it. */
(() => {
  const place = () => { const g = document.querySelector("#main .top-grid"), d = document.getElementById("statDrawer");
    if (g && d) d.style.top = Math.max(16, Math.round(g.getBoundingClientRect().top)) + "px"; };
  addEventListener("scroll", place, { passive: true }); addEventListener("resize", place); requestAnimationFrame(place);
})();
(() => {
  const d = document.getElementById("statDrawer"), tab = document.getElementById("sdTab");
  const set = o => { const was = d.classList.contains("open"); d.classList.toggle("open", o); tab.setAttribute("aria-expanded", String(o)); state.statOpen = o;
    /* Focus moves into the panel when it opens and back to the tab when it closes. */
    if (o && !was) requestAnimationFrame(() => document.getElementById("sdClose").focus({ preventScroll: true }));
    if (!o && was && d.contains(document.activeElement)) tab.focus({ preventScroll: true });
    /* Closing the panel after seeing a new key placement counts as done. */
    if (was && !o && rotNew(char(state).level).length) { rotMarkSeen(); update(); } else save(); };
  if (state.statOpen) { d.classList.add("open"); tab.setAttribute("aria-expanded", "true"); }
  tab.addEventListener("click", () => set(!d.classList.contains("open")));
  document.getElementById("sdClose").addEventListener("click", () => set(false));
  document.addEventListener("keydown", e => { if (e.key === "Escape" && d.classList.contains("open")) set(false); });
})();
/* +/− steppers next to number boxes: change the value and fire the box's own input handler. */
layoutEl.addEventListener("click", e => {
  const b = e.target.closest("[data-step]"); if (!b) return;
  const i = document.getElementById(b.dataset.step), before = parseInt(i.value, 10) || 0;
  i.value = Math.max(0, before + (+b.dataset.d));
  i.dispatchEvent(new Event("input", { bubbles: true }));
  /* Stones / crystals: a bright rising ping for +, the mirrored falling one for − (silent at 0). */
  if (state.sound !== false && +i.value !== before) blip(+b.dataset.d > 0);
});
/* Board respec: untick every node and clear logged costs (two clicks, like Reset). Total points stay, as in the game. */
const dvRespec = document.getElementById("dvRespec");
let dvArmed = false;
dvRespec.addEventListener("click", () => {
  if (!dvArmed) { dvArmed = true; dvRespec.textContent = "Click again to respec"; setTimeout(() => { dvArmed = false; dvRespec.textContent = "Respec"; }, 3000); return; }
  dvArmed = false; dvRespec.textContent = "Respec"; delete char(state).dvAdj;
  delete char(state).dvCost;
  Object.keys(char(state).checks).forEach(k => { if (k.startsWith("dv:")) delete char(state).checks[k]; });
  save(); render(); update();
});
/* Export / import progress: localStorage is the only copy, so offer a JSON file download and upload (P2-9). */
/* Inside claude.ai, saving a file goes through the viewer's downloads permission (the button only shows where that's available).
   Anywhere else (the standalone site) it is a plain Blob download. */
(async () => {
  const btn = document.getElementById("expBtn"), msg = document.getElementById("xferMsg");
  /* the save-failed banner offers the same Export action wherever this button is available */
  const show = on => { btn.hidden = !on; document.getElementById("saveWarnExp").hidden = !on; };
  const fname = () => `aion2-assassin-progress-${new Date().toISOString().slice(0, 10)}.json`;
  if (!(window.claude && window.claude.use)) {
    show(true);
    btn.addEventListener("click", () => {
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
  let data = null; try { data = JSON.parse(await f.text()); } catch (err) { /* not JSON */ }
  if (!data || typeof data !== "object" || typeof data.checks !== "object" || !data.checks) { msg.textContent = "That file isn't a progress export."; return; }
  const n = Object.values(data.checks).filter(Boolean).length;
  msg.innerHTML = `Replace your progress with this file (Lv ${+data.level || "?"}, ${n} ticks)? <button type="button" class="go" id="impGo">Replace</button><button type="button" id="impNo">Cancel</button>`;
  document.getElementById("impNo").onclick = () => { msg.textContent = ""; };
  document.getElementById("impGo").onclick = () => {
    /* The progress being replaced is kept one step back under a separate key. Imported files never re-run the one-time seeds. */
    try { localStorage.setItem(KEY + ":before-import", JSON.stringify(state)); } catch (err) {}
    Object.assign(data, { seedLv12: true, stTriniel1: true, dvReset1: true });
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (err) { msg.textContent = "Couldn't save in this browser."; return; }
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
const reportURL = () => {
  const f = { template: "bug.yml", version: APP_VERSION, level: String(char(state).level || ""), quest: char(state).quest || "(not set)",
    mode: state.mode === "basic" ? "Basic" : "Advanced", build: APP_BUILD, browser: navigator.userAgent };
  return "https://github.com/hackthemeatball/daeva-companion/issues/new?" + Object.entries(f).map(([k, v]) => k + "=" + encodeURIComponent(v)).join("&");
};
const refreshReport = () => { reportLink.href = reportURL(); };
["pointerdown", "focus", "mouseenter", "click", "contextmenu"].forEach(ev => reportLink.addEventListener(ev, refreshReport));
refreshReport();
const btnReset = document.getElementById("btnReset");
/* Reset filters: back to default (all off). Progress is never touched here. */
btnReset.addEventListener("click", () => { state.hideCards = false; state.hide = false; state.hideOpt = false; save(); update(); });

render(); update();
