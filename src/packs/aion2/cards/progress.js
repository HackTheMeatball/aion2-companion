/* Progress (0.4 P4b: moved verbatim from src/main.js; markup progress.html): one-time clears with a running total.
   Drawn by the Skills card (renderNext calls renderCollection), so it registers with update: null. */
import { char } from "../../../core/state.js";
import { gatesOf } from "../../../core/requirements.js";
import { GATES } from "../data/milestones.js";
import { AREA_ITEMS } from "../catalog.js";
import { areaOpen, clearDoneOf } from "../requirements.js";
import { defaultBand, goAreas } from "./areas.js";
import { aion2State as state, aion2Save as save, aion2Update as update, aion2SMOOTH as SMOOTH, aion2RqAvail as rqAvail } from "./page.js";

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
function aion2ProgressMount() {
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
}

const aion2ProgressCard = { id: "progress", slot: "rail", order: 100, root: null, mount: aion2ProgressMount, update: null };
export { renderCollection, aion2ProgressCard };
