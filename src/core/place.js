/* Where the player is (0.5 P10, pure: no DOM, no storage, no clock; docs/design/0.4-smart-next-up.md §4, §5): derived
   from the change times in the save (mt, src/core/sync.js), never stored. lastConfirmedLocation (sync.js) stays as it is.

   The places are the pack's (its `place`, src/core/pack.js): nodes { node id: { zone, pts: { side: point } } }, a point
   { map, x, y, … } (x, y on that map's own grid; map null = no coordinates), and two optional hooks for what the engine
   can't place itself: objective(node id, i) and stamp(field, key, value), each → { zone, pt } or null. A pack without
   `place` has no places: whereNow() is null, byPlace() keeps the catalog order.

   whereNow(c) → { via, t, zone, pt } or null: the newest dated stamp (time > 0) that means "I was here":
     mt.checks[k] = [t, true]         the node with save key k, where it is done (its turn-in, else entrance, else giver;
                                      a node with no place: the pack's locate(k), a zone); a key with no node: the pack's
                                      stamp("checks", k, true)
     mt.started[k] = [t, v]           the node's giver (v a value, not false)
     mt.qsteps[quest][i] = [t, true]  the pack's objective(node, i), else the quest's zone (no point)
     mt.quest = [t, [q, end]]         quest q's giver; end = q (turned in): its turn-in
     mt[f][k], a pack "map" field     the pack's stamp(f, k, value)
   Keys the pack skips (skipLocation) never move it, nor do removals (null) and un-ticks. The newest wins; a time tie
   breaks on the key, the larger wins (as lastConfirmedLocation does), so every device derives the same answer after
   merge(). The key: k for checks, "started:k", "qsteps:quest:i", "quest", "f:k" for a pack field. zone is a zone id or
   null, pt { map, x, y } or null; a stamp that gives neither moves nothing. */
import { activePack } from "./pack.js";

const plIsObj = x => !!x && typeof x === "object" && !Array.isArray(x);
const plIsStamp = x => Array.isArray(x) && x.length === 2 && typeof x[0] === "number" && Number.isFinite(x[0]) && x[0] >= 0;
/* a point with coordinates → { map, x, y }, else null */
const plPt = p => p && typeof p.map === "string" && p.map && Number.isFinite(p.x) && Number.isFinite(p.y) ? { map: p.map, x: p.x, y: p.y } : null;
/* the sides a node is placed at, in order: once done, and once picked up */
const PL_DONE = ["turnin", "entrance", "giver"], PL_START = ["giver"];

/* The place of node id at the first of its sides it has: { zone, pt, side }, a node with a zone but none of the sides:
   { zone, pt: null, side: null }; an unknown node: null. */
export function nodePlaceOf(id, sides = PL_DONE) {
  const P = activePack().place, n = P && P.nodes[id];
  if (!n) return null;
  const side = sides.find(s => n.pts && n.pts[s]) || null;
  return { zone: n.zone ?? null, pt: side ? plPt(n.pts[side]) : null, side };
}
/* save key → node id (the first node with that key, as the evaluator reads it), and story name → node id; per graph */
const plIndex = new WeakMap();
const plIndexOf = g => {
  let x = plIndex.get(g);
  if (!x) { x = { byKey: new Map(), byName: new Map(g.story.map(([id, n]) => [n, id])) };
    for (const [id, n] of Object.entries(g.nodes)) if (n.key !== undefined && !x.byKey.has(n.key)) x.byKey.set(n.key, id);
    plIndex.set(g, x); }
  return x;
};

export function whereNow(c) {
  const p = activePack(), P = p.place;
  if (!P || !plIsObj(c && c.mt)) return null;
  const mt = c.mt, ix = plIndexOf(p.data.graph), skip = p.skipLocation, locate = p.locate;
  let best = null;
  const offer = (via, t, at) => {
    if (!at || (!at.zone && !at.pt) || !(t > 0)) return;
    if (!best || t > best.t || (t === best.t && via > best.via)) best = { via, t, zone: at.zone ?? null, pt: at.pt ?? null };
  };
  const hook = (f, k, v) => P.stamp ? P.stamp(f, k, v) : null;
  /* a node's place for save key k; its zone from the pack's locator when the place has none (or the node no place) */
  const keyAt = (k, sides) => { const id = ix.byKey.get(k), at = id !== undefined ? nodePlaceOf(id, sides) : null;
    return { zone: (at && at.zone) || locate(k) || null, pt: at ? at.pt : null }; };
  const each = (o, fn) => { if (plIsObj(o)) Object.entries(o).forEach(([k, s]) => { if (plIsStamp(s) && s[1] != null && s[1] !== false) fn(k, s); }); };
  each(mt.checks, (k, [t, v]) => { if (v !== true || skip(k)) return;
    offer(k, t, ix.byKey.has(k) ? keyAt(k, PL_DONE) : hook("checks", k, v)); });
  each(mt.started, (k, [t]) => { if (!skip(k)) offer("started:" + k, t, keyAt(k, PL_START)); });
  if (plIsObj(mt.qsteps)) Object.entries(mt.qsteps).forEach(([q, o]) => { const id = ix.byName.get(q); if (id === undefined) return;
    each(o, (i, [t, v]) => { if (v !== true) return;
      const at = (P.objective && P.objective(id, +i)) || nodePlaceOf(id, []);
      offer(`qsteps:${q}:${i}`, t, at); }); });
  if (plIsStamp(mt.quest) && Array.isArray(mt.quest[1])) { const [t, [q, end]] = mt.quest, id = typeof q === "string" ? ix.byName.get(q) : undefined;
    if (id !== undefined) offer("quest", t, nodePlaceOf(id, end === q ? ["turnin"] : PL_START)); }
  Object.keys(p.charFields).filter(f => p.charFields[f] === "map").forEach(f => each(mt[f], (k, [t, v]) => offer(f + ":" + k, t, hook(f, k, v))));
  return best;
}

/* ---------- Location-aware order (design §5) ---------- */
/* Straight-line distance between two points on the same map, or null (unknown: no coordinates, or two maps). */
export const placeDistance = (a, b) => {
  const p = plPt(a), q = plPt(b);
  return p && q && p.map === q.map ? Math.hypot(p.x - q.x, p.y - q.y) : null;
};
/* byPlace(here) → a comparator of candidates { zone, pt, catalogIndex }: in here.zone first, then nearer to here.pt (same
   map only; unknown or another map counts as infinitely far), then catalog order. here null: catalog order. */
export const byPlace = here => (a, b) => {
  const z = x => here && here.zone && x.zone === here.zone ? 0 : 1;
  if (z(a) !== z(b)) return z(a) - z(b);
  const d = x => placeDistance(here && here.pt, x.pt) ?? Infinity, da = d(a), db = d(b);
  if (da !== db) return da < db ? -1 : 1;
  return a.catalogIndex - b.catalogIndex;
};
