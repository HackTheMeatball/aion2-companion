/* The milestone cards (0.4 P4c: moved verbatim from src/main.js; markup milestones.html): one card per GATES milestone
   (cardHTML, also used by Route rules), their counts, tags and open state, the rail's milestone list, the tick handler of
   every data-k box (fade-out, Cube rewards), regional quest rows (in progress, "Not in game yet"), the filters and Expand
   all. update() calls updateMilestones, milestoneFilters, fillStigmaText and syncQRun at their old spots (src/main.js). */
import { char } from "../core/state.js";
import { itemByK } from "../core/catalog.js";
import { chainsOn, derivedOf, doneOf, gatesOf } from "../core/requirements.js";
import { capFirst } from "./nextup.js";
import { pageState as state, pageSave as save, pageUpdate as update, pageMainEl as mainEl, pageLayoutEl as layoutEl, pageSMOOTH as SMOOTH, pageRewardToast as rewardToast, pageGATES as GATES, pageITEMS as ITEMS, pageE_ORDER as E_ORDER, pageSeq as seq, pageAREA_ITEMS as AREA_ITEMS, pageCLEAR_REWARD as CLEAR_REWARD, pageRQ_K as RQ_K, pageEputK as eputK, pageRqReqOf as rqReqOf, pageAion2DungeonMap as aion2DungeonMap, pageSTIGMA_SLOTS as STIGMA_SLOTS, pageStNames as stNames, pageRqAvail as rqAvail, pageQProg as qProg, pageCounts as counts, pageMainCounts as mainCounts, pageSideOpen as sideOpen } from "./page.js";

/* Big icons for every item named in a line, shown on its right. */
const icons = html => {
  const keys = [...new Set([...html.matchAll(/data-ico="(\w+)"/g)].map(m => m[1]))].filter(k => ITEMS[k][2]);
  return keys.length ? `<span class="icos">${keys.map(k => `<img src="${ITEMS[k][2]}" alt="${ITEMS[k][3]}" title="${ITEMS[k][3]}" loading="lazy" onerror="this.remove()">`).join("")}</span>` : "";
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
        return `<li${it.req ? ` data-req="${it.req}"` : ""}${it.story ? ` data-story="${it.story}"` : ""}${it.after ? ` data-needs="${it.after}"` : ""} class="item${it.kind === "quest" ? " qrow" : ""}${it.cell ? " cell" : ""}${ic ? " has-ico" : ""}${it.opt ? " optional" : ""}${it.map ? " has-map" : ""}"><label><input type="checkbox" data-k="${k}" ${char(state).checks[k] ? "checked" : ""}>${ic}<span class="txt">${it.story ? `<span class="schip"></span>` : ""}${it.opt ? `<span class="opt-tag">Optional</span>` : ""}${it.t}${it.note ? `<span class="note">${it.note}</span>` : ""}${it.upsell ? `<span class="upsell"><span class="paid-tag opt">Paid option</span>${it.upsell}</span>` : ""}</span></label>${it.map ? `<a class="amap" href="${aion2DungeonMap(it.map)}" target="_blank" rel="noopener" title="Show the entrance on the Altgard interactive map (Metabot)">${MAP_ICO}</a>` : ""}${it.kind === "quest" ? `<button type="button" class="q-snz" data-snz="${k}" aria-pressed="false" title="The game doesn't offer this quest yet: hide it from Next up until your next Level up">Not in game yet</button><button type="button" class="q-inl" data-ingame="${k}" hidden title="The game already offers it: mark it picked up (same as clicking its box)">In my game</button>` : ""}</li>`;
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

/* Milestone ticks: the line turns green, then (if "Cleared tasks" hides it) fades and slides out; a milestone
   that just got cleared does the same when "Cleared milestones" is on. tickKeep holds them visible meanwhile. */
let tickKeep = new Set();
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
/* counts, tags and open state of the milestone cards, the rail's milestone list, the derived boxes */
function updateMilestones() {
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
  mainEl.classList.toggle("hide-done", state.hide);
  { const ev = gatesOf(char(state)); mainEl.querySelectorAll("input[data-k]").forEach(i => derivedBox(i, derivedOf(char(state), i.dataset.k, ev))); }
}
/* the filters: ticked / optional rows, cleared milestones, the toolbar */
function milestoneFilters() {
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
/* One toggle: Expand all ↔ Collapse all, based on the milestone cards you can see. */
let btnExpand = null;
const gateCards = () => [...document.querySelectorAll("#gates details.step")].filter(d => !d.hidden);
const syncExpand = () => { const all = gateCards(); btnExpand.textContent = all.length && all.every(d => d.open) ? "Collapse all" : "Expand all"; };
/* the milestone cards: render() draws them on every call (Sync levels and Respec redraw the page) */
function renderMilestones() {
  const gatesEl = document.getElementById("gates");
  gatesEl.innerHTML = GATES.map(g => cardHTML(g, `<span><small>LV</small>${g.lv}</span>`, "gate")).join("");
  mainEl.querySelectorAll("details.step").forEach(d => {
    d.addEventListener("toggle", () => { state.open[d.id] = d.open; save(); });
  });
  watchIcons();
}
/* the handlers (from render(), once) */
function milestonesMount() {
  document.getElementById("gates").addEventListener("click", e => {
    const zb = e.target.closest && e.target.closest("li.qrow [data-snz]"); if (zb) { e.preventDefault(); snoozeToggle(zb.dataset.snz); return; }
    const ig = e.target.closest && e.target.closest("li.qrow [data-ingame]"); if (ig) { e.preventDefault(); const k = ig.dataset.ingame; char(state).started = char(state).started || {}; if (!char(state).checks[k]) { char(state).started[k] = 1; if (char(state).rqSnooze) delete char(state).rqSnooze[k]; save(); update(); } return; }
    const i = e.target.closest && e.target.closest("li.qrow input[data-k]"); if (!i) return;
    const k = i.dataset.k; char(state).started = char(state).started || {};
    if (!char(state).checks[k] && !qProg(k)) { e.preventDefault(); char(state).started[k] = 1; save(); update(); return; }
    delete char(state).started[k];
  }, true);
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
  /* Milestones list: collapsed = just the current milestone; expanded = all of them. One click either way. */
  document.getElementById("trkSum").addEventListener("mousedown", e => e.preventDefault());
  document.getElementById("trkSum").addEventListener("click", () => { state.trackOpen = !state.trackOpen; save(); update(); });
  /* Filter dropdown: funnel button opens a menu of checkboxes + Reset; closes on outside click or Esc. */
  const filtBtn = document.getElementById("btnFilter"), filtMenu = document.getElementById("filtMenu");
  const setFilt = o => { filtMenu.hidden = !o; filtBtn.setAttribute("aria-expanded", String(o)); };
  filtBtn.addEventListener("click", e => { e.stopPropagation(); setFilt(filtMenu.hidden); });
  document.addEventListener("click", e => { if (!filtMenu.hidden && !e.target.closest(".filt")) setFilt(false); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !filtMenu.hidden) { setFilt(false); filtBtn.focus(); } });
  document.getElementById("fCards").addEventListener("change", e => { state.hideCards = e.target.checked; save(); update(); });
  document.getElementById("fTicked").addEventListener("change", e => { state.hide = e.target.checked; save(); update(); });
  document.getElementById("fOpt").addEventListener("change", e => { state.hideOpt = e.target.checked; save(); update(); });

  btnExpand = document.getElementById("btnExpand");
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
  const btnReset = document.getElementById("btnReset");
  /* Reset filters: back to default (all off). Progress is never touched here. */
  btnReset.addEventListener("click", () => { state.hideCards = false; state.hide = false; state.hideOpt = false; save(); update(); });
}

const milestonesCard = { id: "milestones", slot: "main", order: 200, root: "gates", mount: milestonesMount, update: () => updateMilestones() };
export { MAP_ICO, cardHTML, renderMilestones, derivedBox, rqTicked, snoozeToggle, syncQRun, fillStigmaText, milestoneFilters, syncExpand, milestonesCard };
