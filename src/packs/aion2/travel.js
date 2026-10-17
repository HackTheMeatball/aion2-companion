/* AION 2 travel (0.5 P10, pure: no DOM, no storage, no clock; docs/design/0.4-smart-next-up.md §8): which Kibelisks are
   bound, the one-time "Bind X" nudge and teleport vs walk, all derived from the save and the travel rules (TRAVEL_RULES:
   rule:kibelisk-bind-radius, rule:kibelisk-nudge-radius, rule:teleport-gain), never stored. Also the pack's `place` hooks
   for whereNow() (src/core/place.js): an objective's place and the pack's own keys. Nothing on the page calls them yet.

   A point is NODE_PLACE's { map, x, y, anchor, m }: anchor = the Kibelisk id, m = the source's stated metres to it. The
   gate graph and the place table are read through the pack object (activePack: data.graph, place.nodes), never imported. */
import { KIBELISKS, TRAVEL_RULES } from "./data/place.js";
import { QUEST_STEPS } from "./data/story.js";
import { perPack } from "../../core/pack.js";
import { doneOf, gatesOf } from "../../core/requirements.js";
import { nodePlaceOf, placeDistance, whereNow } from "../../core/place.js";

/* the tables, built once per pack: the story chain [[id, name]] and id → index, Kibelisk name → id, save key → node id
   (the first node with that key), "binds" facts by objective ("node#i" → Kibelisk id), and per Kibelisk every point
   that names it ([{ id, side, m }]) */
const aion2T = () => perPack("aion2Travel", p => {
  const g = p.data.graph, nodes = p.place.nodes, byKey = new Map(), pointsOf = new Map();
  for (const [id, n] of Object.entries(g.nodes)) if (n.key !== undefined && !byKey.has(n.key)) byKey.set(n.key, id);
  for (const [id, x] of Object.entries(nodes)) for (const [side, pt] of Object.entries(x.pts))
    if (pt.anchor) { if (!pointsOf.has(pt.anchor)) pointsOf.set(pt.anchor, []); pointsOf.get(pt.anchor).push({ id, side, m: pt.m }); }
  return { graph: g, nodes, story: g.story, storyIdx: new Map(g.story.map(([id], i) => [id, i])), byKey, pointsOf,
    kibByName: new Map(Object.entries(KIBELISKS).map(([id, k]) => [k.name, id])),
    bindFact: new Map(Object.entries(KIBELISKS).flatMap(([id, k]) => (k.binds || []).map(b => [b.node + "#" + b.i, id]))) };
});

/* ---------- The pack's place hooks (src/core/pack.js `place`) ---------- */
/* Story objective i of node id: the Kibelisk its `binds` fact names, else the one its text names ("(Kibelisk: X)"); no
   objective has a point of its own yet (P9) and no Kibelisk a position, so the Kibelisk's zone. null: neither. */
export const aion2ObjectivePlace = (id, i) => {
  const T = aion2T(), n = T.graph.nodes[id], t = n && (QUEST_STEPS[n.key] || [])[i], m = typeof t === "string" && t.match(/\(Kibelisk: ([^)]+)\)/);
  const kib = T.bindFact.get(id + "#" + i) || (m && T.kibByName.get(m[1]));
  return kib ? { zone: KIBELISKS[kib].zone, pt: null } : null;
};
/* The pack's own keys: a "bind:<Kibelisk id>" tick (the nudge row, §8.2): the Kibelisk's zone; a Sealed Dungeon run
   started (areaRun): the dungeon's entrance. */
export const aion2StampPlace = (field, k, v) => {
  if (field === "checks" && v === true && k.startsWith("bind:")) { const K = KIBELISKS[k.slice(5)]; return K ? { zone: K.zone, pt: null } : null; }
  if (field === "areaRun" && v) { const id = aion2T().byKey.get(k), at = id !== undefined ? nodePlaceOf(id, ["entrance"]) : null; return at && { zone: at.zone, pt: at.pt }; }
  return null;
};

/* ---------- Visited points (§8.1: never early; from ticks, the story position and pick-ups) ---------- */
/* story node id: turned in (the story is past it, or on it with storyEnd) */
const aion2TurnedIn = (c, id) => {
  const T = aion2T(), i = T.storyIdx.get(id), pos = c.quest ? T.story.findIndex(([, n]) => n === c.quest) : -1;
  return i !== undefined && pos >= 0 && (pos > i || (pos === i && c.storyEnd === c.quest));
};
const aion2Visited = (c, id, side, ev) => {
  const n = aion2T().graph.nodes[id];
  if (!n) return false;
  if (n.kind === "story") return aion2TurnedIn(c, id) || (side === "giver" && ((c.qsteps || {})[n.key] || []).length > 0);
  const done = doneOf(c, n.key, ev);
  if (side === "giver") return done || !!(c.started || {})[n.key];
  if (side === "entrance") return done || !!(c.areaRun || {})[n.key];
  return done;
};

/* How Kibelisk kib is bound: "radius" (a visited point within the bind radius), "fact" (a visited objective with a
   `binds` fact naming it: ticked, or its quest turned in), "tick" (bind:<kib> ticked), or null (not bound). Checked in
   that order. opts: ev (the page's evaluator for c, for derived completion), rules (the travel rules). */
export function aion2BoundBy(c, kib, { ev = gatesOf(c), rules = TRAVEL_RULES } = {}) {
  const R = rules.bindRadius, T = aion2T();
  if ((T.pointsOf.get(kib) || []).some(p => p.m != null && p.m <= R && aion2Visited(c, p.id, p.side, ev))) return "radius";
  if (((KIBELISKS[kib] || {}).binds || []).some(b => aion2TurnedIn(c, b.node) || ((c.qsteps || {})[T.graph.nodes[b.node].key] || []).includes(b.i))) return "fact";
  if ((c.checks || {})["bind:" + kib] === true) return "tick";
  return null;
}
export const aion2Bound = (c, kib, opts) => aion2BoundBy(c, kib, opts) !== null;

/* ---------- The "Bind X" nudge (§8.2) ---------- */
/* The story card's target point: the next open objective's point (none in the data yet, P9), else the current quest's
   turn-in; none once the last quest is turned in. → { id, side, pt } or null */
const aion2StoryTarget = c => {
  if (!c.quest || c.storyEnd === c.quest) return null;
  const T = aion2T(), e = T.story.find(([, n]) => n === c.quest), p = e && T.nodes[e[0]], pt = p && p.pts.turnin;
  return pt ? { id: e[0], side: "turnin", pt } : null;
};
/* The nudge row for c, or null: the target T has R < T.m ≤ the nudge radius, its Kibelisk K is not bound, and T is the
   first target point in story order with K in that band, so the row shows once. Target points only (today the turn-ins):
   a giver is never the story card's target, so a giver first in the band would hide the row for good. */
export function aion2NudgeOf(c, { ev = gatesOf(c), rules = TRAVEL_RULES } = {}) {
  const T = aion2StoryTarget(c), R = rules.bindRadius, NR = rules.nudgeRadius;
  const inBand = pt => !!pt && !!pt.anchor && pt.m != null && pt.m > R && pt.m <= NR;
  if (!T || !inBand(T.pt) || aion2Bound(c, T.pt.anchor, { ev, rules })) return null;
  const K = T.pt.anchor;
  const { story, nodes } = aion2T(), first = story.find(([id]) => { const pt = (nodes[id] || { pts: {} }).pts.turnin; return pt && pt.anchor === K && inBand(pt); });
  return first && first[0] === T.id ? { kib: K, name: KIBELISKS[K].name, m: T.pt.m, key: "bind:" + K } : null;
}

/* ---------- Teleport vs walk (§8.3) ---------- */
/* For a card's target { zone, pt } (pt a NODE_PLACE point) from here (whereNow: { zone, pt }): the teleport line
   { kib, name, m, scrolls: 1 }, or null (walk: the default, nothing shown). Teleport iff not preferRun, not walked
   ("I'll walk" on this card), the target's Kibelisk bound and stated metres known, and: walk distance unknown (no point
   or another map) and the zones differ, or walk − m ≥ the teleport gain. The metres shown are the data's m; the walk
   distance only decides. */
export function aion2TeleportOf(c, target, { here = whereNow(c), ev = gatesOf(c), rules = TRAVEL_RULES, preferRun = false, walked = false } = {}) {
  const pt = target && target.pt;
  if (preferRun || walked || !here || !pt || !pt.anchor || pt.m == null || !aion2Bound(c, pt.anchor, { ev, rules })) return null;
  const walk = placeDistance(here.pt, pt);
  const go = walk === null ? here.zone !== (target.zone ?? null) : walk - pt.m >= rules.teleportGain;
  return go ? { kib: pt.anchor, name: KIBELISKS[pt.anchor].name, m: pt.m, scrolls: 1 } : null;
}
