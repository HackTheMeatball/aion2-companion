/* AION 2 travel (0.5 P10, pure: no DOM; docs/design/0.4-smart-next-up.md §4, §8): what a stamp in the save says about
   where the player was (aion2Place, the pack's `place` for src/core/place.js whereNow), which Kibelisks are bound (§8.1),
   the one-time "Bind X" row (§8.2) and teleport vs walk (§8.3). All derived from the save and the rules
   (TRAVEL_RULES: rule:kibelisk-bind-radius, rule:kibelisk-nudge-radius, rule:teleport-gain), never stored. Nothing on the
   page calls them yet.

   Points are NODE_PLACE's { map, x, y, anchor, m }: anchor = the nearest Kibelisk's registry id, m = the source's metres
   to it. Story objectives have no points yet (design §3, S1), so an objective places the player only by its Kibelisk's
   zone, and the story card's target is the current quest's turn-in. */
import { KIBELISKS, NODE_PLACE, TRAVEL_RULES } from "./data/place.js";
import { QUEST_STEPS } from "./data/story.js";
import { isAscensionKey } from "./requirements.js";
import { activePack, perPack } from "../../core/pack.js";
import { placeDist } from "../../core/place.js";
import { gatesOf, qProgOf } from "../../core/requirements.js";

/* the gate graph is the pack object's (data.graph; only pack.js imports GATE_GRAPH); lookups built once per pack: save
   key → node id, quest name → story index, Kibelisk name → id */
const travelGraph = () => activePack().data.graph;
const travelIx = () => perPack("travelIx", p => ({
  idOfKey: new Map(Object.entries(p.data.graph.nodes).filter(([, n]) => n.key !== undefined).map(([id, n]) => [n.key, id])),
  storyIdx: new Map(p.data.graph.story.map(([, name], i) => [name, i])),
  kibByName: new Map(Object.entries(KIBELISKS).map(([id, k]) => [k.name, id])),
}));
const travelNode = k => { const id = travelIx().idOfKey.get(k); return id ? { id, n: travelGraph().nodes[id], P: NODE_PLACE[id] } : null; };
const travelMapOf = p => p ? p.map || (KIBELISKS[p.anchor] || {}).map || null : null;
const travelSpot = (zone, pt) => zone || pt ? { zone: zone || null, pt: pt || null } : null;
const TRAVEL_MARK = /\(Kibelisk: ([^)]+)\)/;

/* ---------- Where a stamp says the player was (design §4) ---------- */
/* A done regional quest: its turn-in (the Kibelisk's zone, the record's zone being the giver's); picked up: its giver; a
   Sealed Dungeon or stronghold done or run: its entrance; a "bind:<kib>" tick: that Kibelisk's zone (no position);
   an objective: its Kibelisk's zone, else the quest's; the story position: the current quest's giver, which sits at the
   previous quest's turn-in on a same-map hop (location research §7), or its turn-in once turned in. Ascension steps
   never place the player (owner, 2026-10-14). */
export const aion2Place = {
  fields: ["areaRun"],
  at(path, v) {
    const [f, k, i] = path;
    if (f === "checks") {
      if (k.startsWith("bind:")) { const K = KIBELISKS[k.slice(5)]; return K ? travelSpot(K.zone, null) : null; }
      const x = !isAscensionKey(k) && travelNode(k); if (!x || !x.P) return null;
      if (x.n.kind === "rq") { const p = x.P.pts.turnin; return travelSpot((p && KIBELISKS[p.anchor] || {}).zone || x.P.zone, p); }
      return x.n.kind === "sd" || x.n.kind === "sh" ? travelSpot(x.P.zone, x.P.pts.entrance) : null;
    }
    if (f === "started") { const x = travelNode(k); return x && x.P && x.n.kind === "rq" ? travelSpot(x.P.zone, x.P.pts.giver) : null; }
    if (f === "areaRun") { const x = travelNode(k); return x && x.P && (x.n.kind === "sd" || x.n.kind === "sh") ? travelSpot(x.P.zone, x.P.pts.entrance) : null; }
    if (f === "qsteps") {
      const x = travelNode(k), m = ((QUEST_STEPS[k] || [])[+i] || "").match(TRAVEL_MARK), K = m && KIBELISKS[travelIx().kibByName.get(m[1])];
      return travelSpot(K ? K.zone : x && x.P ? x.P.zone : null, null);
    }
    if (f === "quest") {
      const [q, end] = Array.isArray(v) ? v : [], si = travelIx().storyIdx.get(q), x = q ? travelNode(q) : null;
      if (si === undefined || !x || !x.P) return null;
      if (end === q) return travelSpot(x.P.zone, x.P.pts.turnin);
      const prev = si > 0 ? NODE_PLACE[travelGraph().story[si - 1][0]] : null, g = x.P.pts.giver, pm = prev && travelMapOf(prev.pts.turnin);
      return travelSpot(prev && pm && pm === travelMapOf(g) ? prev.zone : x.P.zone, g);
    }
    return null;
  },
};

/* ---------- Bound Kibelisks (design §8.1) ---------- */
/* quests turned in: the index of the current quest, one more once it is turned in (storyEnd) */
const turnedInCount = c => { const i = c.quest ? travelIx().storyIdx.get(c.quest) : undefined; return i === undefined ? 0 : i + (c.storyEnd === c.quest ? 1 : 0); };
/* Every point the player has visited: a story giver once the quest is turned in or one of its objectives ticked, a story
   turn-in once turned in; a regional quest's giver once picked up or done, its turn-in once done; an entrance once done or
   run. Done = ticked or derived (the evaluator, so a follow-up's pick-up counts). */
function visitedPoints(c) {
  const out = [], add = p => { if (p) out.push(p); }, ti = turnedInCount(c), qs = c.qsteps || {}, run = c.areaRun || {};
  travelGraph().story.forEach(([id, name], i) => { const P = NODE_PLACE[id]; if (!P) return;
    if (i < ti || (qs[name] || []).length) add(P.pts.giver);
    if (i < ti) add(P.pts.turnin); });
  const ev = gatesOf(c);
  Object.entries(travelGraph().nodes).forEach(([id, n]) => { const P = NODE_PLACE[id]; if (!P || n.kind === "story") return;
    const r = ev.byKey(n.key), done = !!(c.checks || {})[n.key] || !!(r && r.done);
    if (n.kind === "rq") { if (done || qProgOf(c, n.key) > 0) add(P.pts.giver); if (done) add(P.pts.turnin); }
    else if (done || run[n.key]) add(P.pts.entrance); });
  return out;
}
/* The bound Kibelisks (a Set of ids): a visited point within R metres of it, a "bind:<kib>" tick, or a `binds` fact on a
   visited objective (ticked, or its quest turned in). o.R = the bind radius (rule:kibelisk-bind-radius), o.kibs = the
   registry (tests swap both). Ticking more never unbinds: every clause only grows with ticks and story progress. */
export function boundSet(c, { R = TRAVEL_RULES.bindRadius, kibs = KIBELISKS } = {}) {
  const out = new Set(), ti = turnedInCount(c), qs = c.qsteps || {};
  visitedPoints(c).forEach(p => { if (p.anchor && p.anchor in kibs && p.m != null && p.m <= R) out.add(p.anchor); });
  Object.entries(c.checks || {}).forEach(([k, v]) => { if (v === true && k.startsWith("bind:") && k.slice(5) in kibs) out.add(k.slice(5)); });
  Object.entries(kibs).forEach(([id, K]) => { if ((K.binds || []).some(b => { const n = travelGraph().nodes[b.node], si = n ? travelIx().storyIdx.get(n.key) : undefined;
    return si !== undefined && (si < ti || (qs[n.key] || []).includes(b.i)); })) out.add(id); });
  return out;
}
export const bound = (c, kib, o) => boundSet(c, o).has(kib);

/* ---------- The "Bind X" row (design §8.2) ---------- */
/* On the story card while its target (the current quest's turn-in) is more than R and at most the nudge radius from its
   Kibelisk K, K is not bound and this is the first point in story order with K in that band: { kib, name, m, key, via }
   (key = the tick that binds it, via = the quest's node id), else null. "One-time" comes from the data: past that point
   the row is gone. */
export function nudgeOf(c, { R = TRAVEL_RULES.bindRadius, nudge = TRAVEL_RULES.nudgeRadius, kibs = KIBELISKS } = {}) {
  if (!c.quest || c.storyEnd === c.quest) return null;
  const x = travelNode(c.quest), T = x && x.P && x.P.pts.turnin;
  const inBand = p => !!p && p.anchor in kibs && p.m != null && p.m > R && p.m <= nudge;
  if (!inBand(T)) return null;
  let first = null;
  for (const [id] of travelGraph().story) { const P = NODE_PLACE[id];
    first = P && [P.pts.giver, P.pts.turnin].find(p => inBand(p) && p.anchor === T.anchor); if (first) break; }
  if (first !== T || boundSet(c, { R, kibs }).has(T.anchor)) return null;
  return { kib: T.anchor, name: kibs[T.anchor].name, m: T.m, key: "bind:" + T.anchor, via: x.id };
}

/* ---------- Teleport vs walk (design §8.3) ---------- */
/* For a target { zone, pt } (pt a NODE_PLACE point) from here (whereNow): teleport when the target's Kibelisk is bound and
   either the walk is known and at least the teleport gain longer than the run from the Kibelisk, or the walk is unknown
   (another map, or no position) and here is a known zone other than the target's. o.preferRun (the view setting) and
   o.walk (the player chose to walk this card) turn it off. → { kib, name, m, walk } (walk: metres or null), else null. */
export function teleportOf(c, target, here, { preferRun = false, walk: walkThis = false, gain = TRAVEL_RULES.teleportGain, R, kibs = KIBELISKS } = {}) {
  const T = target && target.pt;
  if (preferRun || walkThis || !here || !T || !(T.anchor in kibs) || T.m == null) return null;
  if (!boundSet(c, { R, kibs }).has(T.anchor)) return null;
  const walk = placeDist(here.pt, T);
  const go = walk === null ? !!here.zone && here.zone !== (target.zone || null) : walk - T.m >= gain;
  return go ? { kib: T.anchor, name: kibs[T.anchor].name, m: T.m, walk } : null;
}
