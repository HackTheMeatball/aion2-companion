/* The catalog (0.2 P3, pure: no DOM, no state): the data tables finished into what the app works with, and lookups
   over them. Evaluated once, before src/main.js, in this order (moved from main.js; the order is kept because some
   tables are read before others are finished):
   1. Sealed Dungeons and Strongholds (AREA_ITEMS) from the milestones as written, with their level bands.
   2. Skill upgrades sorted; two skill-only milestones added; milestones sorted by level.
   3. Regional quests (RQ) placed into milestones by recommended level; skill lines folded into milestones.
   Keys never depend on where an item ends up (docs/ARCHITECTURE.md §1). */
import { AREA_LOC, RQ, SD_RW, SH_DATA } from "../data/generated.js";
import { SP_SLOTS, SP_STEPS } from "../data/build.js";
import { T, mapQ, mapSlug, sub } from "../data/markup.js";
import { GATES, STEPS } from "../data/milestones.js";
import { HIDEOUT_AREA, NO_AREA } from "../data/areas.js";

export const RQ_BY = Object.fromEntries(RQ.map(q => [q.name, q]));
/* A regional quest's milestone item by key; a stigma slot's "Put X on E" step key (it.eput === slot n). */
export const RQ_K = k => GATES.flatMap(g => g.items).find(it => it.kind === "quest" && it.k === k);
export const eputK = n => { const it = GATES.flatMap(g => g.items).find(x => x.eput === n); return it ? it.k : null; };

/* ---------- Dungeons & Strongholds ---------- */
/* Every Sealed Dungeon with its key, level and area, in milestone order. */
export const AREA_ITEMS = [];
GATES.forEach(g => g.items.forEach((it, j) => {
  if (it.kind !== "hideout") return;
  AREA_ITEMS.push({ it, g, k: it.k, lv: g.lv, area: HIDEOUT_AREA[it.name] || NO_AREA });
}));
/* Kibelisk → zone, from the dungeons and regional quests whose nearest Kibelisk we know (for "near your story step"). */
export const KIB_AREA = (() => { const votes = {}, add = (k, a) => { if (!k || !a || a === NO_AREA) return; (votes[k] = votes[k] || {})[a] = (votes[k][a] || 0) + 1; };
  AREA_ITEMS.forEach(x => { const l = AREA_LOC[x.it.name]; if (l) add(l.kib, x.area); });
  RQ.forEach(q => add(q.kib, q.zone));
  /* Majority zone per Kibelisk (one source put Briskwind Shelter in Purifying Forest; four say Dranactus). */
  const m = {}; Object.entries(votes).forEach(([k, v]) => { m[k] = Object.entries(v).sort((a, b) => b[1] - a[1])[0][0]; }); return m; })();
/* Strongholds: all 15 in Altgard (SH_DATA): zone, the level range Metabot's map lists (1–45 = open at any level), nearest Kibelisk. */
SH_DATA.forEach(s => AREA_ITEMS.push({ it: { kind: "stronghold", name: s.name, lo: s.lo, hi: s.hi, kib: s.kib, m: s.m }, g: null, k: "sh:" + mapSlug(s.name), lv: null, area: s.zone }));
/* Level bands: Sealed Dungeons sit at their recommended level. Strongholds have only a level range, so each is filed
   under a band: the band of its zone's Sealed Dungeons, raised to its minimum level; zones with no dungeon data use the
   last band below its level cap. (Inferred placement.) */
export const AREA_BANDS = [...new Set(AREA_ITEMS.filter(x => x.lv != null).map(x => x.lv))].sort((a, b) => a - b);
const bandAtOrBelow = n => AREA_BANDS.filter(b => b <= n).pop() || AREA_BANDS[0];
AREA_ITEMS.filter(x => x.it.kind === "stronghold").forEach(x => {
  const zone = AREA_ITEMS.filter(y => y.area === x.area && y.lv != null).map(y => y.lv);
  const base = zone.length ? Math.min(...zone) : (AREA_BANDS.filter(b => b < x.it.hi).pop() || AREA_BANDS[0]);
  x.band = Math.max(base, bandAtOrBelow(x.it.lo));
});
export const bandOf = x => x.lv != null ? x.lv : x.band;

/* ---------- Milestones ---------- */
SP_STEPS.sort((a, b) => a.rank - b.rank || a.L - b.L);
const spLabel = x => x.spec ? `<b>${x.s.n}: pick specialty</b>` : `<b>${x.s.n} ${x.L - 1} → ${x.L}</b>`;
export const spCostTxt = x => x.spec ? "free" : x.cost + " pt" + (x.cost > 1 ? "s" : "");

/* Skill-only milestones where the gap would otherwise delay key tiers. */
GATES.push(
  { id: "g19", lv: 19, title: "Skill tier: level 8", blurb: "Quick Slice, Savage Roar and Shadowstrike reach skill level 8.", items: [] },
  { id: "g28", lv: 28, title: "Heart Gore 10 and Urugugu Canyon", blurb: "Heart Gore reaches its point cap; a party Expedition opens.", items: [
    { k: "g28:exp", ns: `Urugugu Canyon Expedition opens`, opt: true, map: "urugugu-canyon", t: `<b>Urugugu Canyon ${T("Expedition", "expedition")} (Exploration) opens</b>: needs a party of 2–5 and item level 300.<span class="loc">The story quest "Canyon's Secret" (Lv 30) sends you in.</span>` },
  ] },
);
GATES.sort((a, b) => a.lv - b.lv);

/* Zone · spot · quest giver (linked to the quest on Metabot's Altgard map). */
const qMap = q => [q.zone, q.place && q.place !== q.zone ? q.place : "", q.id ? mapQ(q.id, q.npc || "map") : (q.npc || "map")].filter(Boolean).join(" · ");
/* What opens a regional quest, in the row's second line: unlock level (if above 10), the story quest, earlier regional quests. */
/* inGroup: the group heading already says it (story quest or unlock level), so the row doesn't repeat it. */
const rqReqTxt = (q, inGroup) => { const xs = [q.unlocksAt > 10 && !inGroup ? `at Lv ${q.unlocksAt}` : "", q.story && !inGroup ? (q.turnedIn ? `once <em>${q.story}</em> is turned in` : `once the story reaches <em>${q.story}</em>`) : "",
  q.after.length ? `after ${q.after.map(n => `<em>${n}</em>`).join(" and ")} ${q.after.length > 1 ? "are" : "is"} turned in` : ""].filter(Boolean);
  return xs.length ? `<span class="rq-req"><br>Opens ${xs.join(", ")}</span>` : ""; };
/* A regional quest row (key "rq:" + id, so where it sits never touches its ticks). lv = recommended level. */
const rqItem = (q, inGroup) => ({ kind: "quest", name: q.name, k: "rq:" + q.id, lv: q.rec, q, ...(q.story ? { story: q.story } : {}),
  t: `<b>${q.name}</b><span class="loc">${qMap(q)}${rqReqTxt(q, inGroup)}${q.reward ? `<br>Reward: <em>${q.reward}</em>` : ""}</span>` });
/* Regional quests into their milestones: the highest milestone at or below the quest's recommended level, grouped under
   "Regional quests · Lv N". A group of more than 8 splits by what opens it (story quest, unlock level). */
{ const why = q => q.story ? `after "${q.story}"` : q.unlocksAt > 10 ? `opens at Lv ${q.unlocksAt}` : "";
  const byGate = new Map();
  RQ.forEach(q => { const g = [...GATES].reverse().find(x => x.lv <= q.rec) || GATES[0]; if (!byGate.has(g)) byGate.set(g, []); byGate.get(g).push(q); });
  byGate.forEach((qs, g) => [...new Set(qs.map(q => q.rec))].sort((a, b) => a - b).forEach(r => {
    const grp = qs.filter(q => q.rec === r), parts = grp.length > 8 ? [...new Set(grp.map(why))] : [null];
    parts.forEach(p => { const xs = p == null ? grp : grp.filter(q => why(q) === p);
      g.items.push({ ...sub(`Regional quests · Lv ${r}${p ? " · " + p : ""} ${T("", "regional", "What are regional quests?")}`), group: "quest" }, ...xs.map(q => rqItem(q, !!p))); }); })); }

/* Fold each core skill upgrade into the first milestone at or after its unlock level (the extra skills sort after them all).
   gi / gj: the upgrade's milestone and place in it, the order the Skills card and Next up offer them in. */
SP_STEPS.filter(x => x.s.extra).forEach(x => { x.gi = 1000 + x.rank; x.gj = x.L; });
GATES.forEach((g, i) => {
  const prev = i ? GATES[i - 1].lv : 0;
  const steps = SP_STEPS.filter(x => !x.s.extra && x.req > prev && x.req <= g.lv);
  steps.forEach((x, j) => { x.gi = i; x.gj = j; });
  if (!steps.length) return;
  steps.forEach(x => g.items.push({
    k: x.k, req: x.req,
    t: `<span class="cost">${spCostTxt(x)}</span>${spLabel(x)}<span class="req">unlocks at Lv ${x.req}</span>${x.spec ? `<span class="loc"><em>${x.s.spec}</em></span>` : (x.L === 8 && !x.s.passive ? `<span class="loc">opens first ${T("specialty slot", "specialty")}</span>` : "")}`,
  }));
});
/* Specialty slots 2 and 3 (0.3 E7) are no milestone rows: they take their skill's slot 1 place in the order, right after it. */
SP_SLOTS.forEach(x => { const s1 = SP_STEPS.find(y => y.slot === 1 && y.s === x.s); x.gi = s1.gi; x.gj = s1.gj + x.slot / 10; });

/* ---------- Lookups over the finished milestones ---------- */
/* Every milestone / route item by its key (built on first use; the milestones are final by then). */
let ITEM_K = null;
export const itemByK = k => { if (!ITEM_K) { ITEM_K = {}; [...GATES, ...STEPS].forEach(g => g.items.forEach(it => { if (it.k) ITEM_K[it.k] = it; })); } return ITEM_K[k]; };
/* Daevanion nodes, in the milestones' order (Nezekan Lv 12, Zikel 20, Vaizel 30, Triniel 40). */
export const DV_NODES = () => GATES.flatMap(g => g.items.filter(it => it.dv));
/* One-time clear rewards, added when you tick the clear and taken back when you untick it:
   Sealed Dungeon first clear = SD_RW (2 Wisdom Stones + 2 Daevanion Crystals at every band); regional quest = its own rw (Metabot).
   Strongholds credit nothing: their pages list no Wisdom Stones or crystals (belt scrolls and Kina only). */
export const CLEAR_REWARD = k => {
  const a = AREA_ITEMS.find(x => x.k === k); if (a) return a.it.kind === "hideout" ? SD_RW : null;
  const it = itemByK(k); return it && it.kind === "quest" ? it.q.rw : null;
};
/* A milestone's items as its card lists them (non-quest lines first, then regional quests; keys keep the original index),
   without the ones that never show as a row (sub-headings, hidden lines, board nodes, Sealed Dungeons). */
export const cardRows = s => {
  const isQ = it => (it.kind || it.group) === "quest";
  const order = s.items.map((it, j) => [it, j]);
  return [...order.filter(([it]) => !isQ(it)), ...order.filter(([it]) => isQ(it))]
    .filter(([it]) => (it.kind || it.group) !== "hideout" && !it.hidden && !it.dv && !it.sub)
    .map(([it, j]) => ({ it, k: it.k || s.id + ":" + j }));
};
