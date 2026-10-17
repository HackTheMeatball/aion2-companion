/* Where the player is, and an order by place (0.5 P10, pure: no DOM; docs/design/0.4-smart-next-up.md §4, §5). Derived
   from the change times in the save (mt, src/core/sync.js), never stored. Not wired into any card yet.

   What a stamp means comes from the pack's `place` (src/core/pack.js): at(path, value) → { zone, pt } or null (the stamp
   says nothing about where the player was). The engine scans the stamps that can mean "I was here": mt.checks{k} (value
   true), mt.started{k} (picked up), mt.qsteps{quest}{i} (an objective ticked), mt.quest ([quest, storyEnd]), and each
   field the pack names in place.fields (per key, any value). A pack without `place` gets null everywhere.

   A point is { map, x, y } (map units are metres); a zone is the pack's zone id or null. */
import { activePack } from "./pack.js";

const isStamp = x => Array.isArray(x) && x.length === 2 && typeof x[0] === "number" && Number.isFinite(x[0]);
const isObj = x => !!x && typeof x === "object" && !Array.isArray(x);

/* Every dated stamp (time > 0, value not removed) the place hook may read: [key, path, t, value]. The key is the item key
   for a tick (as lastConfirmedLocation uses it), else `started:<k>`, `qsteps:<quest>:<i>`, `quest`, `<field>:<k>`. */
function placeStamps(mt, fields) {
  const out = [], put = (key, path, s) => { if (isStamp(s) && s[0] > 0 && s[1] != null) out.push([key, path, s[0], s[1]]); };
  if (!isObj(mt)) return out;
  const perKey = (f, pre) => { if (isObj(mt[f])) Object.entries(mt[f]).forEach(([k, s]) => put(pre + k, [f, k], s)); };
  perKey("checks", "");
  perKey("started", "started:");
  if (isObj(mt.qsteps)) Object.entries(mt.qsteps).forEach(([q, o]) => { if (isObj(o)) Object.entries(o).forEach(([i, s]) => put(`qsteps:${q}:${i}`, ["qsteps", q, i], s)); });
  put("quest", ["quest"], mt.quest);
  fields.forEach(f => perKey(f, f + ":"));
  return out;
}
/* the engine's own reading of a stamp before the pack's: a tick counts when it is set, a pick-up while it is held, an
   objective when it is ticked; the story position and the pack's fields go to the pack as they are */
const placeValueOk = (path, v) => path[0] === "checks" || path[0] === "qsteps" ? v === true : path[0] === "started" ? !!v : true;

/* Where the player last was: the newest dated stamp the pack places, { via: its key, t, zone, pt } or null (no dated
   stamp, or the pack has no place). A time tie breaks on the key, the larger key wins (as lastConfirmedLocation), so
   every device derives the same answer after merge(). */
export function whereNow(c, pack = activePack()) {
  const P = pack.place;
  if (!P || !c) return null;
  let best = null;
  placeStamps(c.mt, P.fields).forEach(([key, path, t, v]) => {
    if (best && (t < best.t || (t === best.t && key <= best.via))) return;
    if (!placeValueOk(path, v)) return;
    const at = P.at(path, v); if (!at) return;
    best = { via: key, t, zone: at.zone || null, pt: placePt(at.pt) };
  });
  return best;
}
/* a point as { map, x, y }, or null when it has no map position */
export const placePt = p => p && typeof p.map === "string" && p.map && Number.isFinite(p.x) && Number.isFinite(p.y) ? { map: p.map, x: p.x, y: p.y } : null;

/* Straight-line distance between two points on the same map (metres), or null: unknown (a point missing, or two maps). */
export const placeDist = (a, b) => { const p = placePt(a), q = placePt(b); return p && q && p.map === q.map ? Math.hypot(p.x - q.x, p.y - q.y) : null; };

/* The order by place (design §5): in here.zone first, then the straight-line distance from here.pt (same map only; an
   unknown distance sorts last), then the catalog order. of(item) → { zone, pt, order } (default: the item itself). With
   here null every item ties on the first two, so the order is the catalog's. */
export const byPlace = (here, of = x => x) => {
  const key = x => { const p = of(x) || {}, d = here ? placeDist(here.pt, p.pt) : null;
    return [here && here.zone && p.zone === here.zone ? 0 : 1, d === null ? Infinity : d, Number.isFinite(p.order) ? p.order : Infinity]; };
  return (a, b) => { const ka = key(a), kb = key(b);
    for (let i = 0; i < 3; i++) if (ka[i] !== kb[i]) return ka[i] < kb[i] ? -1 : 1;
    return 0; };
};
