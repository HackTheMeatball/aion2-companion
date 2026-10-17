/* The Build drawer (0.4 P4b: moved verbatim from src/main.js; markup build.html): stat priority, rotation and key
   setup at your level, what's new on your keys. Drawn by the Skills card (renderNext calls renderRotation), so it
   registers with update: null; its mount places the drawer and wires its tab. */
import { char } from "../../../core/state.js";
import { E_ORDER, STAT_SRC, STAT_TIERS } from "../data/build.js";
import { rotKeys } from "../requirements.js";
import { aion2State as state, aion2Save as save, aion2Update as update, aion2STIGMA_SLOTS as STIGMA_SLOTS, aion2StIco as stIco, aion2SpMini as spMini } from "./page.js";

const statSeqHTML = () => STAT_TIERS.map((t, i) => `<div class="tier"><span class="tier-n">Tier ${i + 1}</span><div class="seq">${t.map(x => `<span>${x}<em class="src">${STAT_SRC[x] || ""}</em></span>`).join("")}</div></div>`).join("");
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
  const bt = document.getElementById("tabBuild"); if (bt) bt.classList.toggle("has-new", !!nw.length);
  if (nw.length) { const ks = document.querySelector("#statDrawer details.mini"); if (ks) ks.open = true; }
  document.getElementById("statSeq").innerHTML = statSeqHTML();
  renderStacks(lv);
}
/* the drawer's place and its tab (from render(), once) */
function aion2BuildMount() {
  /* Stat priority drawer: a tab pinned to the right edge; open state remembered.
     It starts level with the top of the cards row and sticks 16px from the top once you scroll past it. */
  (() => {
    const place = () => { const g = document.querySelector("#main .top-grid"), d = document.getElementById("statDrawer");
      if (g && d) d.style.top = Math.max(16, Math.round(g.getBoundingClientRect().top)) + "px"; };
    addEventListener("scroll", place, { passive: true }); addEventListener("resize", place); requestAnimationFrame(place);
  })();
  (() => {
    const d = document.getElementById("statDrawer"), sideTab = document.getElementById("sdTab"), barTab = document.getElementById("tabBuild");
    /* <= 600 px (0.5 P5): the drawer is a bottom sheet opened from the tab bar's Build tab, which takes its label from this
       card; the side tab is hidden there. Same open state either way. */
    const sheetQ = window.matchMedia ? matchMedia("(max-width: 600px)") : { matches: false };
    barTab.textContent = sideTab.querySelector(".sd-lbl").textContent;
    const tab = { setAttribute: (k, v) => { sideTab.setAttribute(k, v); barTab.setAttribute(k, v); }, focus: o => (sheetQ.matches ? barTab : sideTab).focus(o) };
    const set = (o, viaKey) => { const was = d.classList.contains("open"); d.classList.toggle("open", o); tab.setAttribute("aria-expanded", String(o)); state.statOpen = o;
      /* Focus moves into the panel when it opens and back to the tab when it closes. */
      if (o && !was) requestAnimationFrame(() => document.getElementById("sdClose").focus({ preventScroll: true }));
      /* (also after a scrim tap, which leaves focus on the page, and after Escape with focus on Level up in the bar) */
      if (!o && was && (viaKey || d.contains(document.activeElement) || document.activeElement === document.body)) tab.focus({ preventScroll: true });
      /* Closing the panel after seeing a new key placement counts as done. */
      if (was && !o && rotNew(char(state).level).length) { rotMarkSeen(); update(); } else save(); };
    if (state.statOpen) { d.classList.add("open"); tab.setAttribute("aria-expanded", "true"); }
    for (const t of [sideTab, barTab]) t.addEventListener("click", () => set(!d.classList.contains("open")));
    for (const id of ["sdClose", "sdGrab", "sdScrim"]) document.getElementById(id).addEventListener("click", () => set(false));
    document.addEventListener("keydown", e => { if (e.key === "Escape" && d.classList.contains("open")) set(false, sheetQ.matches); });
  })();
}

const aion2BuildCard = { id: "build", slot: "drawer", order: 100, root: "statDrawer", mount: aion2BuildMount, update: null };
export { renderRotation, renderStacks, E_STACK, aion2BuildCard };
