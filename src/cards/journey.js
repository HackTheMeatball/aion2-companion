/* Journey (0.4 P4c: moved verbatim from src/main.js; markup journey.html): the level control (Level up, − / + and
   the slider), the story timeline and current quest, its objectives and the story filters, and the milestone rows'
   story chips and "Reach …" lines. renderQuest is drawn by the Skills card (renderNext); the card's own update keeps the
   level control in step. 0.4 P5c: the game's own parts (what a level change does beside the level, the Level up gains,
   the objective's place, what a story line opens) come from the pack's sections of this card (useJourneyParts). */
import { char } from "../core/state.js";
import { activePack } from "../core/pack.js";
import { chainsOn, gatesOf, objPartsOf, questIdx, stepChipOf, storyGate, storyLineOf, turnInNeedsLv } from "../core/requirements.js";
import { END_NEXT, STORY_DONE, capFirst, renderNow } from "./nextup.js";
import { renderAhead } from "./ahead.js";
import { pageState as state, pageSave as save, pageUpdate as update, pageMainEl as mainEl, pageRMQ as RMQ, pageRewardToast as rewardToast, pageChime as chime, pageGATES as GATES, pageQUESTS as QUESTS, pageQUEST_STEPS as QUEST_STEPS, pageSTORY_UNLOCKS as STORY_UNLOCKS, pageSTORY_END as STORY_END, pageObjIdx as objIdx } from "./page.js";

/* The pack's parts of this card (0.4 P5c, P0 §4: a card's pack sections). A pack section of Journey hands them over from
   its mount (sections mount right after their card, before anything is drawn); a part it doesn't give keeps the default,
   which means "this game has none".
   reqOpens: what a story line opens (the words after "Opens"); subPlace(text): the place an objective with parts names,
   shown under its parts; onLevel(state, v): what a level change does beside the level, run before the level is set (it
   reads the old one); levelGains(from, to): the Level up float's text after "Lv <to>". */
const JOURNEY_PARTS = { reqOpens: "the steps with a story chip below", subPlace: () => "", onLevel: () => {}, levelGains: () => "" };
let parts = JOURNEY_PARTS;
const useJourneyParts = p => {
  for (const k of Object.keys(p)) if (!(k in JOURNEY_PARTS) || typeof p[k] !== typeof JOURNEY_PARTS[k]) throw new Error(`useJourneyParts: "${k}" is unknown or of the wrong type`);
  parts = { ...parts, ...p };
};
/* an objective's parts, by the pack's grammar */
const objPartsList = t => activePack().story.subs(t);

let qInput = null;
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
    row.innerHTML = `<label><input type="checkbox" disabled ${ok ? "checked" : ""}><span class="txt"><span class="schip${ok ? "" : d == null ? "" : now ? " now" : " ahead"}">${chip}</span><b>${L.turnIn ? "Turn in" : "Reach"} "${q}" in the main story</b> <span class="sr-sub">Opens ${parts.reqOpens} that wait for it.${d != null && !ok ? ` You're on "${char(state).quest}".` : ""}</span></span></label>`;
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
  /* No quest, or one no longer in the story (a quest the story has since dropped): ask for the current quest. */
  const i = questIdx(char(state));
  if (i < 0) { st.innerHTML = `<span class="dot"></span><span class="st-name muted">Pick your current quest to place yourself on the story.</span>`; return; }
  /* Story timeline: previous (dim), current (the input), next; then the next unlock as a callout linked to its milestone. */
  const prev = QUESTS[i - 1], nxt = QUESTS[i + 1];
  pv.innerHTML = row(prev);
  qlv.textContent = `Lv ${QUESTS[i][0]}`;
  st.innerHTML = nxt ? row(nxt, STORY_UNLOCKS[nxt[1]] ? `unlocks ${STORY_UNLOCKS[nxt[1]]}` : "") : `<span class="dot"></span><span class="st-name muted">${char(state).storyEnd === char(state).quest ? `${STORY_DONE} — ${END_NEXT}` : `Last story quest in the guide · turns in to ${STORY_END.turnin} at ${STORY_END.place}`}</span>`;
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
/* Main story filter (icon right of "Main story"): objectives and ticked objectives are hidden by default;
   each box shows them. The badge counts what's switched on; × goes back to the default. */
const subDone = (i) => ((char(state).qsub || {})[char(state).quest] || {})[i] || [];
function setSub(i, j, on) {
  char(state).qsub = char(state).qsub || {}; const q = char(state).qsub[char(state).quest] = char(state).qsub[char(state).quest] || {};
  const cur = new Set(q[i] || []); on ? cur.add(j) : cur.delete(j); q[i] = [...cur];
  const n = objPartsList(QUEST_STEPS[char(state).quest][i]).length, d = new Set((char(state).qsteps || {})[char(state).quest] || []);
  if (cur.size >= n) d.add(i); else d.delete(i);
  char(state).qsteps = char(state).qsteps || {}; char(state).qsteps[char(state).quest] = [...d]; save();
  return cur.size >= n;
}
function setObj(i, on) {
  const subs = objPartsList(QUEST_STEPS[char(state).quest][i]);
  if (subs.length) { char(state).qsub = char(state).qsub || {}; const q = char(state).qsub[char(state).quest] = char(state).qsub[char(state).quest] || {}; q[i] = on ? subs.map((_, j) => j) : []; }
}
const subListHTML = (i, attr) => { const t = QUEST_STEPS[char(state).quest][i], subs = objPartsList(t); if (!subs.length) return ""; const sd = subDone(i);
  const loc = parts.subPlace(t);
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
  const nextBtn = n !== N ? "" : last && char(state).storyEnd === char(state).quest ? `<p class="qs-end">${STORY_DONE} · ${END_NEXT}</p>`
    : needLv ? `<p class="qs-wait">Turn in at Lv ${needLv}: the game opens this quest at Lv ${needLv}</p>`
    : `<button type="button" class="qs-next" id="qsNext">${last ? "Quest done · mark turned in" : "Quest done · next quest ›"}</button>`;
  el.innerHTML = head + `<ol class="qs-list">` +
    list.map((t, i) => { if (!vis.includes(i)) return ""; const [a, b] = objPartsOf(char(state).quest, i); if (done.includes(i) && !showDone && n < N) return ""; const sl = subListHTML(i, "data-qsub"); return `<li class="${done.includes(i) ? "on" : ""}${sl ? " has-sub" : ""}"><label><input type="checkbox" data-qobj="${i}" ${done.includes(i) ? "checked" : ""}><span><b>${a}</b>${b && !sl ? `<small>${b}</small>` : ""}</span></label>${sl}</li>`; }).join("") + `</ol>` +
    nextBtn;
}
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

function setLevel(v) {
  v = Math.max(1, Math.min(45, parseInt(v, 10) || 1));
  parts.onLevel(state, v);
  char(state).level = v;
  GATES.forEach(g => delete state.open[g.id]);
  save(); update();
}
/* the level control follows the level */
function syncLevel() {
  const lv = char(state).level;
  document.getElementById("lvlNum").value = lv;
  document.getElementById("lvlRange").value = lv;
  { const lb = document.getElementById("lvlUpBig"); lb.disabled = lv >= 45; lb.title = lv >= 45 ? "Level cap (45)" : ""; }
}
/* the handlers (from render(), once) */
function journeyMount() {
  qInput = document.getElementById("questIn");
  document.getElementById("questList").innerHTML = QUESTS.map(([l, n]) => `<option value="${n}">Lv ${l}</option>`).join("");
  window.addEventListener("resize", () => requestAnimationFrame(fitQuestIn));
  { const btn = document.getElementById("jFiltBtn"), menu = document.getElementById("jFiltMenu");
    const set = o => { menu.hidden = !o; btn.setAttribute("aria-expanded", String(o)); };
    btn.addEventListener("click", e => { e.stopPropagation(); set(menu.hidden); });
    document.addEventListener("click", e => { if (!menu.hidden && !e.target.closest(".jfilt")) set(false); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !menu.hidden) { set(false); btn.focus(); } });
    document.getElementById("jFiltX").addEventListener("click", e => { e.stopPropagation(); state.showObj = false; state.qsShowDone = false; state.showTalk = false; save(); renderQuestSubs(); });
    document.getElementById("jfObj").addEventListener("change", e => { state.showObj = e.target.checked; save(); renderQuestSubs(); });
    document.getElementById("jfTalk").addEventListener("change", e => { state.showTalk = e.target.checked; save(); renderQuestSubs(); });
    document.getElementById("jfDone").addEventListener("change", e => { state.qsShowDone = e.target.checked; save(); renderQuestSubs(); }); }
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
  document.getElementById("lvlNum").addEventListener("change", e => setLevel(e.target.value));
  document.getElementById("lvlRange").addEventListener("input", e => setLevel(e.target.value));
  document.getElementById("lvlDown").addEventListener("click", () => setLevel(char(state).level - 1));
  document.getElementById("lvlUp").addEventListener("click", () => setLevel(char(state).level + 1));
  /* Level-up button: same as +, with a bit of ceremony (chime, burst, what you gained). */
  document.getElementById("lvlUpBig").addEventListener("click", e => {
    const from = char(state).level; if (from >= 45) return;
    setLevel(from + 1);
    const to = char(state).level;
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
    f.innerHTML = `<b>Lv ${to}</b>${parts.levelGains(from, to)}`;
    f.style.left = cx + "px"; f.style.top = r.top - 6 + "px";
    document.body.appendChild(f); setTimeout(() => f.remove(), 1700);
    /* Under reduced motion the floating label is hidden (CSS): the gains go in the toast instead. */
    if (RMQ.matches) rewardToast(f.textContent);
  });
}

/* the Later list (src/cards/ahead.js) is a section of this card; after-timeline: a pack's section under the story timeline */
const journeyCard = { id: "journey", slot: "rail", order: 200, root: null, sections: ["ahead", "after-timeline"], mount: journeyMount, update: () => syncLevel() };
export { useJourneyParts, renderQuest, renderQuestSubs, renderStoryChips, renderStoryReqs, setLevel, setObj, setSub, completeBefore, subListHTML, stepQuest, journeyCard };
