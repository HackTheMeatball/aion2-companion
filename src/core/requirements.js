/* Requirements and derived facts (0.2 P3, pure: no DOM). What is open, done, affordable or next for a character, from
   the save and the catalog. Functions take the character (c = char(state)) or, where a view setting changes the answer
   (the Optional tasks filter, the talk-only objectives filter), the whole state. Nothing here writes. */
import { QUESTS, QUEST_LOC, QUEST_STEPS } from "../data/story.js";
import { DV_MIN, LEVEL_POINTS, SP_STEPS, STIGMA_PLAN, ST_COST, ST_TARGETS } from "../data/build.js";
import { GATES } from "../data/milestones.js";
import { RQ_BY, DV_NODES, cardRows, itemByK } from "./catalog.js";
import { char } from "./state.js";

/* ---------- Story ---------- */
export const storyIdx = n => QUESTS.findIndex(([, q]) => q === n);
/* Index of the current story quest, -1 when none is set (or the name is unknown). */
export const questIdx = c => c.quest ? storyIdx(c.quest) : -1;
/* Talk-only steps ("talk to …" with no trip, item or fight; turn-ins are the exception and always show) are hidden by
   default and count as done, so the list is only objectives where you travel, examine, collect, fight or deliver. */
export const objLow = t => { const [a, b = ""] = t.split(" — "); if (/^Turn in\b/i.test(a)) return false; /* turn-ins always show: they finish the quest */ return /^talk (to|via)\b/i.test(b) && !/^(Deliver|Find|Rendezvous|Go)\b/i.test(a); };
/* Multi-part objectives ("collect A, B, C", "inspect X; talk to Y", "search the A and B") get their own sub-checklist.
   Ticking every part ticks the objective; ticking the objective ticks every part. */
export function objSubs(t) {
  if (objLow(t) || /^Turn in\b/i.test(t)) return [];
  const b = (t.split(" — ")[1] || "").trim(), m = b.match(/\s*\(([^)]*)\)\s*$/), d = m ? b.slice(0, m.index) : b;
  let parts = d.split(/;\s*/).flatMap(x => x.split(/,\s*/)).map(x => x.trim()).filter(Boolean);
  if (parts.length === 1 && /^search the /i.test(d)) parts = d.replace(/^search the /i, "").split(/\s+and\s+/).map(x => "search the " + x);
  /* "talk to A, B" → "talk to A", "talk to B" */
  let verb = ""; parts = parts.map(x => { const v = x.match(/^([a-z]+(?: to| the)?)\s/); if (v && /^[a-z]/.test(x)) { verb = v[1]; return x; } return verb && /^[A-Z]/.test(x) && !/^(Lv|Balaur|Draconute|Outpost|Dratona|Broken)/.test(x) ? verb + " " + x : x; });
  return parts.length > 1 ? parts : [];
}
/* The objectives shown (and counted): all of them with "talk-only steps" on (state.showTalk), else the non-talk ones. */
export const objIdxOf = (state, list) => list.map((t, i) => i).filter(i => state.showTalk || !objLow(list[i]));
/* Where the story sends you next: the next open objective's Kibelisk, or the turn-in's. */
export function storyHereOf(state) {
  const c = char(state);
  if (!c.quest) return null;
  const list = QUEST_STEPS[c.quest], done = (c.qsteps || {})[c.quest] || [], L = QUEST_LOC[c.quest] || {};
  if (list) { const i = objIdxOf(state, list).find(i => !done.includes(i));
    if (i != null) { const t = list[i], m = t.match(/\(Kibelisk: ([^)]+)\)/);
      if (/^Turn in\b/.test(t)) return L.turninKib ? { kib: L.turninKib, m: L.turninKibM } : null;
      return m ? { kib: m[1] } : null; } } /* no Kibelisk on that objective: say nothing rather than point elsewhere */
  return L.turninKib ? { kib: L.turninKib, m: L.turninKibM } : null;
}

/* ---------- Regional quests ---------- */
/* Quest progress: 0 = not picked up, 1 = in progress (old true values count as 1). */
export const qProgOf = (c, k) => { const v = (c.started || {})[k]; return v === true ? 1 : (v || 0); };
/* No prerequisite data at all (q.noPre): open from its recommended level, not from the data's unlock level 10. */
export const rqOpenLv = q => q.noPre ? Math.max(q.unlocksAt || 0, q.rec) : (q.unlocksAt || q.rec);
/* Open in game? Its unlock level, the main story at or past its story quest, and (pre = still to turn in) the regional
   quests before it. Quests you've already picked up or turned in count as open whatever the data says (callers decide). */
export const rqStatus = (c, q, lv = c.level) => {
  if (lv < rqOpenLv(q)) return { open: false, ok: false, pre: [] };
  if (q.story) { const at = storyIdx(q.story), cur = c.quest ? storyIdx(c.quest) : -1; if (at >= 0 && (cur < 0 || cur < at)) return { open: false, ok: false, pre: [] }; }
  const pre = q.after.filter(n => !c.checks["rq:" + RQ_BY[n].id]);
  return { open: true, ok: !pre.length, pre };
};

/* ---------- Milestones ---------- */
/* Sealed Dungeons and Strongholds are tracked in the Areas card, not in milestone counts. Optional tasks count toward
   their milestone only once ticked (an untouched one never makes a milestone "Missed"); the Optional tasks filter
   (state.hideOpt) hides them entirely. */
const isAreaKind = it => it.kind === "hideout";
export const checkableOf = (state, s) => { const c = char(state); return s.items.map((it, j) => ({ it, k: it.k || s.id + ":" + j })).filter(x => !x.it.sub && !x.it.hidden && !x.it.dv && !isAreaKind(x.it) && !(x.it.opt && (state.hideOpt || !c.checks[x.k]))); };
export const countsOf = (state, s) => { const c = checkableOf(state, s); return [c.filter(x => char(state).checks[x.k]).length, c.length]; };
/* Main tasks only (regional quests are side content, tracked in Next up), and how many regional quests are still open. */
export const mainCountsOf = (state, s) => { const c = checkableOf(state, s).filter(x => x.it.kind !== "quest"); return [c.filter(x => char(state).checks[x.k]).length, c.length]; };
export const sideOpenOf = (state, s) => checkableOf(state, s).filter(x => x.it.kind === "quest" && !char(state).checks[x.k]).length;
export const isOpen = ([c, n]) => c < n;

/* Open steps of a milestone that Next up may offer, in card order: not ticked, not a skill or board line (those have
   their own cards), not optional (unless it's advice, it.adv), not a stigma equip / "put on E" line (the Stigmas card
   covers them), not a regional quest the guide shows as locked, and with its story gate met:
   - story / after: X = the story has reached X; turnedIn: X = X is turned in (story past it, or on it with storyEnd);
   - byStory = the step is story quest X: left to the story card while you're on X, done in game once you're past it.
   it = the item registered under the step's key (itemByK), as the page has always looked it up. */
export function openSteps(state, g) {
  const c = char(state), cur = c.quest ? QUESTS.findIndex(([, n]) => n === c.quest) : -1, out = [];
  cardRows(g).forEach(({ it: row, k }) => {
    if (c.checks[k]) return;
    const rq = row.kind === "quest";
    const it = itemByK(k);
    if (rq && !(qProgOf(c, k) > 0) && it && !rqStatus(c, it.q).ok) return; /* locked regional quest */
    if (/^(sp|dv):/.test(k) || (row.opt && !(it && it.adv))) return;
    if (it && (it.stig || it.eput)) return;
    if (it && it.byStory && it.story === c.quest) return;
    const need = row.story || row.after;
    if (need) { const at = QUESTS.findIndex(([, n]) => n === need); if (at >= 0 && (cur < 0 || at > cur)) return; }
    if (it && it.turnedIn) { const at = QUESTS.findIndex(([, n]) => n === it.turnedIn); if (at >= 0 && !(cur > at || (cur === at && c.storyEnd === it.turnedIn))) return; }
    if (it && it.byStory) { const at = QUESTS.findIndex(([, n]) => n === it.story); if (at >= 0 && cur > at) return; }
    out.push({ k, it, row, rq, adv: !!(it && it.adv) });
  });
  return out;
}

/* ---------- Skill points ---------- */
/* Available points = points from character level (table) + Wisdom Stones used − cost of every ticked skill line.
   Off-plan skill purchases aren't tracked. */
export const skillPoints = (c, lv = c.level) => {
  const fromLevels = LEVEL_POINTS[Math.min(45, Math.max(0, lv))] || 0, stones = c.stones || 0;
  const spent = SP_STEPS.filter(x => c.checks[x.k]).reduce((a, x) => a + x.cost, 0);
  return { fromLevels, stones, spent, pts: Math.max(0, fromLevels + stones - spent) };
};
/* Open upgrades in the milestones' order, and the ones open at lv. */
export const skillOpen = (c, lv = c.level) => { const open = SP_STEPS.filter(x => !c.checks[x.k]).sort((a, b) => a.gi - b.gi || a.gj - b.gj); return { open, now: open.filter(x => x.req <= lv) }; };
/* The upgrade to buy now: the first open one, if you have the points (a specialty is free); else null. */
export const skillBuy = (c, lv = c.level) => { const next = skillOpen(c, lv).now[0], { pts } = skillPoints(c, lv); return next && (next.spec || pts >= next.cost) ? next : null; };

/* ---------- Daevanion board ---------- */
/* Logged costs of the ticked nodes plus the correction (dvAdj). */
export const dvSpent = c => DV_NODES().filter(it => c.checks[it.k]).reduce((a, it) => a + ((c.dvCost || {})[it.k] || 0), 0) + (c.dvAdj || 0);
/* The next unbought node on an open board, in the milestones' order. */
export const dvNext = (c, lv) => DV_NODES().find(it => !c.checks[it.k] && it.blv <= lv);
/* Its logged cost, else the cheapest it can be (the node itself; its path only adds). */
export const dvNeed = (c, it) => (c.dvCost || {})[it.k] ?? (DV_MIN[it.ty] || 1);
/* Points left for ticking (without the correction): a node can be ticked only when its cost is logged and you have that
   many left (ticked nodes can always be unticked). */
export const dvLeft = c => (c.dvTotal || 0) - DV_NODES().filter(it => c.checks[it.k]).reduce((a, it) => a + ((c.dvCost || {})[it.k] || 0), 0);
export const dvGateOf = (c, k) => {
  const cost = (c.dvCost || {})[k], on = !!c.checks[k], left = dvLeft(c);
  if (on) return { off: false, warn: "" };
  if (cost == null) return { off: true, warn: "" };
  return cost > left ? { off: true, warn: `needs ${cost}, ${left} left` } : { off: false, warn: "" };
};
/* Board total follows the level: 4 points per level past 11 (crystals stay as they were). */
export const dvFromLv = lv => Math.max(0, 4 * (lv - 11));

/* ---------- Stigmas ---------- */
/* Stigma Shards from levels (Metabot): 1 per level reached from 23 to 39, 2 per level from 40 to 45. */
export const shardsFromLv = L => { let t = 0; for (let x = 23; x <= Math.min(L, 45); x++) t += x >= 40 ? 2 : 1; return t; };
/* Effective name per slot 1–4: your pick, else the plan; a name already used by an earlier slot falls to the first free one. */
export const slotNames = c => { const used = []; for (let n = 1; n <= 4; n++) { let nm = (c.stPick || {})[n]; if (!nm || used.includes(nm)) nm = STIGMA_PLAN[n - 1]; if (used.includes(nm)) nm = STIGMA_PLAN.find(x => !used.includes(x)); used.push(nm); } return used; };
/* The four slots from the milestones (22 / 27 / 32 / 37). Slot 1 also needs "The One Who Hears the Voice" (g22:0). */
export const stigmaSlots = c => { const names = slotNames(c);
  return GATES.flatMap(g => g.items.filter(it => it.stig).map(it => ({ n: it.stig, lv: g.lv, gid: g.id, k: it.k, name: names[it.stig - 1], plan: STIGMA_PLAN[it.stig - 1],
    note: it.t.replace(/<b>.*?<\/b>\s*/, "").replace(/<[^>]+>/g, "") }))).sort((a, b) => a.n - b.n); };
export const stLvOfC = (c, n) => (c.stLv || {})[n] || 1;
/* Upgrade order: ST_TARGETS in turn, for the stigmas you have equipped. Other stigmas stay at level 1 (the plan's sources). */
export const stigmaPlan = c => {
  const eq = stigmaSlots(c).filter(x => c.checks[x.k]), steps = [];
  ST_TARGETS.forEach(([n, T]) => { const x = eq.find(y => y.name === n); if (!x) return; for (let L = stLvOfC(c, n) + 1; L <= T; L++) steps.push({ x, L, cost: ST_COST(L) }); });
  return steps;
};
