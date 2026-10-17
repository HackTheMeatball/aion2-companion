/* Sync groundwork (0.2 step 5c, pure: no DOM, no storage, no clock): per-item change times in the save, merge(a, b) of
   two saves (per character slot, save v5), and the last confirmed location derived from the change times.
   docs/DATA-FORMAT-V2.md §13 is the spec; docs/ARCHITECTURE.md §1 the save rules.

   mt (in the character, next to the fields it times) mirrors the character's fields: a stamp is [seconds, value].
     mt.checks{k}, mt.started{k}, mt.areaRun{k}, mt.rqSnooze{k}, mt.stLv{name}, mt.stPick{slot}, mt.dvCost{k}: per key
     mt.qsteps{quest}{i}, mt.qsub{quest}{i}{j}: per objective (value true; null once removed)
     mt.level, mt.stones, …: registers; mt.quest = [t, [quest, storyEnd]] (one register for both)
   null is a tombstone (the entry was removed). A stamp's time is when this device saw the value change; 0 = unknown
   (a fresh browser's defaults). A v5 save is born with mt (src/core/migrations.js) and every write stamps it. */
import { char } from "./state.js";
import { AREA_ITEMS, itemByK } from "./catalog.js";
import { RQ, QUESTS } from "../data/generated.js";
import { NO_AREA } from "../data/areas.js";

/* Character fields with change times, by shape. Not timed: dvLast / dvLastAt (the 10-second undo, local), dvPts /
   crystals (retired fields). buildId / customBuild don't exist yet (0.3, §8.4); they are timed once they do. The
   character's identity (id, pack, class, created) never changes; name gets a stamp once 0.5 makes it editable. */
const SYNC_MAPS = ["checks", "started", "areaRun", "rqSnooze", "stLv", "stPick", "dvCost"];
const SYNC_REGS = ["level", "stones", "pendSt", "pendCr", "stShards", "dvTotal", "dvAdj", "rotSeen", "buildId", "customBuild"];

/* canonical JSON (object keys sorted), for comparing values */
const mtCanon = v => JSON.stringify(v, (k, x) => x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(y => [y, x[y]])) : x);
const mtSame = (x, y) => mtCanon(x) === mtCanon(y);
const MT_RANK = v => v === true ? 5 : typeof v === "number" ? 4 : typeof v === "string" ? 3 : v && typeof v === "object" ? 2 : v === false ? 1 : 0;
/* Order of two stamps: later time wins; a tie breaks on the value (true > number > string > list/object > false > null),
   then on the value itself, so every pair has one winner and merge() is commutative, associative and idempotent. */
export const cmpStamp = ([ta, va], [tb, vb]) => {
  if (ta !== tb) return ta < tb ? -1 : 1;
  const ra = MT_RANK(va), rb = MT_RANK(vb); if (ra !== rb) return ra < rb ? -1 : 1;
  if (ra === 4) return va === vb ? 0 : va < vb ? -1 : 1;
  const ca = mtCanon(va), cb = mtCanon(vb); return ca === cb ? 0 : ca < cb ? -1 : 1;
};

/* The story position register (mt.quest = [t, [quest, storyEnd]]): on a time tie, the position further along the story
   wins (storyRank: the untouched first quest lowest, then unset or unknown, then later quests; "turned in" over not),
   and only then cmpStamp's value order. Two time-0 stamps (saves from before change times, or a fresh browser's
   default first quest) mean "unknown when", and further progress is the safe pick: a fresh browser's default never
   resets or clears another device's story position. The ranking reads this build's QUESTS order (fine before sync
   ships; sync must merge with the same data). */
/* Rank of a story position on a time tie: removed (tombstone) -3 < the first quest not turned in -2 (a fresh browser's
   default, which says nothing about progress) < unset or unknown -1 < any later quest (its index). */
const storyPosOf = q => { const i = typeof q === "string" && q ? QUESTS.findIndex(([, n]) => n === q) : -1; return i; };
const storyRank = p => { const i = storyPosOf(p[0]); return i === 0 && p[1] == null ? -2 : i; };
const QUEST_KEY = JSON.stringify(["quest"]);
const cmpQuestStamp = (a, b) => {
  if (a[0] !== b[0]) return cmpStamp(a, b);
  const pa = Array.isArray(a[1]) ? a[1] : [null, null], pb = Array.isArray(b[1]) ? b[1] : [null, null];
  const ia = a[1] === null ? -3 : storyRank(pa), ib = b[1] === null ? -3 : storyRank(pb);
  if (ia !== ib) return ia < ib ? -1 : 1;
  const ea = pa[1] != null ? 1 : 0, eb = pb[1] != null ? 1 : 0;
  if (ea !== eb) return ea < eb ? -1 : 1;
  return cmpStamp(a, b);
};
export const cmpItem = (key, a, b) => key === QUEST_KEY ? cmpQuestStamp(a, b) : cmpStamp(a, b);

/* The character's timed values, flat: Map "path" → [path, value]; absent and null are the same (not listed). */
function mtValuesOf(c) {
  const out = new Map(), put = (p, v) => { if (v != null) out.set(JSON.stringify(p), [p, v]); };
  SYNC_MAPS.forEach(f => Object.entries(c[f] || {}).forEach(([k, v]) => put([f, k], v)));
  Object.entries(c.qsteps || {}).forEach(([q, a]) => (Array.isArray(a) ? a : []).forEach(i => put(["qsteps", q, String(i)], true)));
  Object.entries(c.qsub || {}).forEach(([q, o]) => Object.entries(o || {}).forEach(([i, a]) => (Array.isArray(a) ? a : []).forEach(j => put(["qsub", q, i, String(j)], true))));
  SYNC_REGS.forEach(f => put([f], c[f]));
  if (c.quest != null || c.storyEnd != null) put(["quest"], [c.quest ?? null, c.storyEnd ?? null]);
  return out;
}
/* The stamps in mt, flat: Map "path" → [path, [t, value]]. Malformed entries are skipped. */
const MT_DEPTH = { checks: 1, started: 1, areaRun: 1, rqSnooze: 1, stLv: 1, stPick: 1, dvCost: 1, qsteps: 2, qsub: 3 };
const isMtStamp = x => Array.isArray(x) && x.length === 2 && typeof x[0] === "number" && Number.isFinite(x[0]) && x[0] >= 0;
function mtStampsOf(mt) {
  const out = new Map();
  const walk = (o, p, d) => { if (!o || typeof o !== "object" || Array.isArray(o)) return;
    Object.entries(o).forEach(([k, v]) => { if (d > 1) walk(v, [...p, k], d - 1); else if (isMtStamp(v)) out.set(JSON.stringify([...p, k]), [[...p, k], v]); }); };
  Object.entries(mt || {}).forEach(([f, v]) => { if (MT_DEPTH[f]) walk(v, [f], MT_DEPTH[f]); else if ((SYNC_REGS.includes(f) || f === "quest") && isMtStamp(v)) out.set(JSON.stringify([f]), [[f], v]); });
  return out;
}
const mtSetIn = (o, p, v) => { let x = o; p.slice(0, -1).forEach(k => { if (!x[k] || typeof x[k] !== "object" || Array.isArray(x[k])) x[k] = {}; x = x[k]; }); x[p[p.length - 1]] = v; };

/* A new stamp is strictly later than the one it replaces (per-item Lamport bump), so an edit on a device whose clock
   went back or runs behind still beats the value it changed. Time-0 stamps (unknown) stay 0. */
const mtNext = (prev, t) => t > 0 && typeof prev === "number" ? Math.max(t, prev + 1) : t;
/* Seconds from a stored ms time; anything that isn't a positive finite number (a broken import) gives 0. */
export const mtSecOf = ms => typeof ms === "number" && Number.isFinite(ms) && ms > 0 ? Math.floor(ms / 1000) : 0;

/* Stamp every timed value of the character that differs from its stamp (or has none) with time t; a value that is gone
   gets a tombstone. Returns the number of stamps written. Used (1) by every save, so each change carries the time it
   was saved, (2) once by the fresh start with t = 0, so a new character's defaults never outrank a dated change. */
export function stamp(c, t) {
  const vals = mtValuesOf(c), st = mtStampsOf(c.mt);
  let n = 0;
  const mt = c.mt && typeof c.mt === "object" && !Array.isArray(c.mt) ? c.mt : (c.mt = {});
  vals.forEach(([p, v], key) => { const s0 = st.get(key); if (!s0 || !mtSame(s0[1][1], v)) { mtSetIn(mt, p, [mtNext(s0 && s0[1][0], t), v]); n++; } });
  st.forEach(([p, s0], key) => { if (!vals.has(key) && s0[1] !== null) { mtSetIn(mt, p, [mtNext(s0[0], t), null]); n++; } });
  return n;
}
/* What storeState() runs before each write (the page passes Date.now()). savedAt (ms) is the time of the last saved
   progress change: writes that change only view settings (the page writes folds and filters at start-up too) leave it,
   so a reload stores the same text. Only the current character changes between writes, so only it is stamped. */
export function stampSave(save, nowMs) {
  if (stamp(char(save), mtSecOf(nowMs))) save.savedAt = nowMs;
}

/* The character's timed items for merging: Map "path" → [path, [t, value]]; a value with no matching stamp counts as
   time 0 (never stamped), or its stamp's time if it changed since without a new stamp. */
function mtItemsOf(c) {
  const vals = mtValuesOf(c), st = mtStampsOf(c.mt), out = new Map();
  st.forEach(([p, s0], key) => { const cur = vals.has(key) ? vals.get(key)[1] : null; out.set(key, [p, [s0[0], cur]]); });
  vals.forEach(([p, v], key) => { if (!out.has(key)) out.set(key, [p, [0, v]]); });
  return out;
}

/* merge(local, remote): the local save with the remote one's progress folded in, per character slot (by slot id): a
   slot on one side only is kept (merged with itself: the same values, unstamped ones filled in at time 0, so merge()
   stays idempotent); a slot on both sides merges per item (mergeChar). v and savedAt: the larger.
   current, the view settings, backup and unknown top-level fields stay the local save's: the synced part (syncedPart)
   is commutative, associative and idempotent. Neither input is changed, and the result shares no objects with them. */
const clone = x => JSON.parse(JSON.stringify(x));
const charsOf = s => (s && s.chars && typeof s.chars === "object" ? s.chars : {});
export function merge(a, b) {
  const out = clone(a), ac = charsOf(a), bc = charsOf(b);
  const num = x => typeof x === "number" && Number.isFinite(x) && x > 0 ? x : 0;
  ["v", "savedAt"].forEach(f => { const v = Math.max(num(a[f]), num(b[f])); if (v || f in a || f in b) out[f] = v; });
  out.chars = {};
  [...new Set([...Object.keys(ac), ...Object.keys(bc)])].forEach(id => { out.chars[id] = mergeChar(ac[id] || bc[id], bc[id] || ac[id]); });
  return out;
}
/* Two copies of one character: per item, the later change wins (an un-tick dated after a tick survives). The identity
   (id, pack, class, name, created) and the local-only fields (dvLast, dvLastAt, dvPts, crystals) stay the local copy's. */
function mergeChar(ca, cb) {
  const co = clone(ca);
  const ia = mtItemsOf(ca), ib = mtItemsOf(cb), win = new Map(ia);
  ib.forEach((x, key) => { const y = win.get(key); if (!y || cmpItem(key, y[1], x[1]) < 0) win.set(key, x); });
  /* rebuild every timed field from the winners; containers that either side had stay (possibly empty) */
  const has = f => (ca[f] && typeof ca[f] === "object") || (cb[f] && typeof cb[f] === "object");
  SYNC_MAPS.forEach(f => { if (has(f)) co[f] = {}; else delete co[f]; });
  ["qsteps", "qsub"].forEach(f => {
    if (!has(f)) { delete co[f]; return; }
    co[f] = {};
    [ca[f], cb[f]].forEach(o => Object.entries(o || {}).forEach(([q, v]) => { if (!(q in co[f])) co[f][q] = f === "qsteps" ? [] : {}; if (f === "qsub") Object.keys(v || {}).forEach(i => { co[f][q][i] = co[f][q][i] || []; }); }));
  });
  SYNC_REGS.forEach(f => { delete co[f]; });
  delete co.quest; delete co.storyEnd;
  const mt = {};
  [...win.keys()].sort().forEach(key => {
    /* a copy: the result shares no objects with the inputs (values can be lists or objects: rotSeen, customBuild) */
    const [p, s1] = win.get(key), s0 = JSON.parse(JSON.stringify(s1)), v = s0[1], f = p[0];
    mtSetIn(mt, p, s0);
    if (v === null) return;
    if (SYNC_MAPS.includes(f)) { co[f] = co[f] || {}; co[f][p[1]] = v; }
    else if (f === "qsteps") { (co.qsteps[p[1]] = co.qsteps[p[1]] || []).push(+p[2]); }
    else if (f === "qsub") { const q = co.qsub[p[1]] = co.qsub[p[1]] || {}; (q[p[2]] = q[p[2]] || []).push(+p[3]); }
    else if (f === "quest") { co.quest = v[0]; if (v[1] != null) co.storyEnd = v[1]; }
    else co[f] = v;
  });
  Object.values(co.qsteps || {}).forEach(a => a.sort((x, y) => x - y));
  Object.values(co.qsub || {}).forEach(o => Object.values(o).forEach(a => a.sort((x, y) => x - y)));
  co.mt = mt;
  return co;
}
/* The part of a save that merge() syncs (for tests and, later, the sync layer): per slot, the character's progress and
   mt; v and savedAt. */
export function syncedPart(save) {
  const out = { chars: {} };
  Object.entries(charsOf(save)).forEach(([id, c]) => { const o = out.chars[id] = {};
    [...SYNC_MAPS, ...SYNC_REGS, "qsteps", "qsub", "quest", "storyEnd", "mt"].forEach(f => { if (c[f] !== undefined) o[f] = c[f]; }); });
  ["v", "savedAt"].forEach(f => { if (save[f] !== undefined) out[f] = save[f]; });
  return out;
}

/* ---------- Last confirmed location (F15, §9): derived, never stored ---------- */
/* Zone of a ticked item from today's data: Sealed Dungeons and strongholds by their area, regional quests by the zone
   rq.json gives (the quest giver's; v2 adds turn-in zones in 5b, the locator is then swapped). null = not located. */
let ZONE_K = null;
export const zoneOfKey = k => {
  if (!ZONE_K) { ZONE_K = {}; AREA_ITEMS.forEach(x => { if (x.area && x.area !== NO_AREA) ZONE_K[x.k] = x.area; }); RQ.forEach(q => { if (q.zone) ZONE_K["rq:" + q.id] = q.zone; }); }
  return ZONE_K[k] || null;
};
/* Ascension quests have no map location (owner, 2026-10-14): steps that are one never move the last location. */
export const isAscensionKey = k => { const it = itemByK(k); return !!(it && it.ascensionQuest); };
/* The newest dated tick (time > 0, value true) of a located, non-Ascension item: { key, t, zone }, or null (no change
   times yet: Next up keeps today's order). Ties on time break on the key, so every device derives the same answer. */
export function lastConfirmedLocation(c, locate = zoneOfKey) {
  let best = null;
  mtStampsOf(c.mt).forEach(([p, [t, v]]) => {
    if (p[0] !== "checks" || v !== true || !(t > 0)) return;
    const k = p[1]; if (isAscensionKey(k)) return;
    const zone = locate(k); if (!zone) return;
    if (!best || t > best.t || (t === best.t && k > best.key)) best = { key: k, t, zone };
  });
  return best;
}
