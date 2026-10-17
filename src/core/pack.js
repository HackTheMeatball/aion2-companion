/* The pack holder (0.4 P2b, pure: no DOM; docs/design/0.4-engine-contract.md §2). The engine knows no game: a game's data
   and its rules reach it only through one pack object, set once by the shell (usePack, before loadState / migrate) and
   read inside functions (activePack), never at module top level, since every module is evaluated before the shell runs.

   definePack(spec) → a frozen pack. Only id, data and catalog are required; every hook has a default that means "this
   game has none". An unknown key, a missing required key or a hook of the wrong type throws, so a typo fails at load. */

const packNoop = () => {};
/* key → [type check, default (a function: a fresh value per pack)] */
const pkFn = x => typeof x === "function", pkObj = x => !!x && typeof x === "object" && !Array.isArray(x), pkArr = Array.isArray;
const pkStr = x => typeof x === "string" && x !== "";
const FIELD_SHAPES = new Set(["map", "register", "local"]);
const PACK_KEYS = {
  id: [pkStr],
  data: [d => pkObj(d) && pkObj(d.graph) && pkObj(d.story) && pkArr(d.story.quests) && pkObj(d.story.steps)],
  catalog: [c => pkObj(c) && pkArr(c.milestones) && pkArr(c.routes)],
  /* the character's own fields beside the engine's (src/core/state.js ENGINE_FIELDS), each with how merge() syncs it
     (src/core/sync.js): "map" (a change time per key), "register" (one change time) or "local" (never synced) */
  charFields: [x => pkObj(x) && Object.values(x).every(v => FIELD_SHAPES.has(v)), () => ({})],
  /* a new character's identity: the guide pack it plays and its class (src/core/state.js newChar) */
  character: [x => pkObj(x) && pkStr(x.pack) && typeof x.class === "string"],
  keptRules: [pkObj, () => ({})],
  gateChanges: [x => pkObj(x) && Object.values(x).every(pkObj), () => ({})],
  graphTransforms: [x => pkArr(x) && x.every(t => pkObj(t) && pkStr(t.id) && pkFn(t.apply) && (t.when === "always" || (pkObj(t.when) && pkStr(t.when.off)))), () => []],
  story: [pkObj, () => ({})],
  hopName: [x => x === null || pkFn(x), () => null],
  locate: [pkFn, () => () => null],
  skipLocation: [pkFn, () => () => false],
  onLoad: [pkFn, () => packNoop],
  /* [{ id, produce(state, ctx) → [{ phase, card, keep?, queue?, L? }] }] (src/core/nextup.js) */
  nextUpProducers: [x => pkArr(x) && x.every(n => pkObj(n) && pkStr(n.id) && pkFn(n.produce)), () => []],
  cards: [pkArr, () => []],
  nowRenderers: [pkObj, () => ({})],
  rowRenderers: [pkObj, () => ({})],
  text: [pkObj, () => ({})],
};
const PACK_REQUIRED = ["id", "data", "catalog"];
/* promised(it, k): may Next up's Later card promise this row at its milestone's level (false for rows bought through a
   card of their own); story.cardFields(state, ctx): the pack's own fields on the story card's objectives version (0.4 P2c) */
const PACK_CATALOG_DEFAULTS = { rowKind: () => "main", offered: () => true, promised: () => true };
const PACK_STORY_DEFAULTS = { levelGate: () => ({ gated: false, gateLv: 0 }), isTalkOnly: () => false, subs: () => [], here: () => null, meanwhile: () => null,
  cardFields: () => ({}) };

export function definePack(spec) {
  if (!pkObj(spec)) throw new Error("definePack: a pack spec object is needed");
  for (const k of Object.keys(spec)) if (!(k in PACK_KEYS)) throw new Error(`definePack: unknown key "${k}"`);
  for (const k of PACK_REQUIRED) if (spec[k] === undefined) throw new Error(`definePack: "${k}" is required`);
  const p = {};
  for (const [k, [ok, def]] of Object.entries(PACK_KEYS)) {
    if (spec[k] === undefined) { p[k] = k === "character" ? { pack: spec.id, class: "" } : def ? def() : undefined; continue; }
    if (!ok(spec[k])) throw new Error(`definePack: "${k}" has the wrong type`);
    p[k] = spec[k];
  }
  for (const [k, f] of Object.entries(p.catalog)) if (k in PACK_CATALOG_DEFAULTS && !pkFn(f)) throw new Error(`definePack: "catalog.${k}" has the wrong type`);
  for (const [k, f] of Object.entries(p.story)) if (!(k in PACK_STORY_DEFAULTS) || !pkFn(f)) throw new Error(`definePack: "story.${k}" is unknown or not a function`);
  p.data = { proposed: {}, ...p.data, story: { notes: {}, ...p.data.story } };
  p.catalog = { ...PACK_CATALOG_DEFAULTS, ...p.catalog };
  p.story = { ...PACK_STORY_DEFAULTS, ...p.story };
  return Object.freeze(p);
}

let ACTIVE_PACK = null;
/* Set the active pack (the shell, once, before loadState; the Node test bundle). Returns it. */
export const usePack = p => {
  if (!p || !Object.isFrozen(p) || !pkStr(p.id)) throw new Error("usePack: not a pack (make one with definePack)");
  return (ACTIVE_PACK = p);
};
export const activePack = () => { if (!ACTIVE_PACK) throw new Error("activePack: no pack is set (usePack first)"); return ACTIVE_PACK; };

/* A value built once per pack (the engine's memoised tables: the app graph, the story ids, the key lookup). */
const PER_PACK = new WeakMap();
export const perPack = (name, build) => {
  const p = activePack();
  let m = PER_PACK.get(p); if (!m) PER_PACK.set(p, m = new Map());
  if (!m.has(name)) m.set(name, build(p));
  return m.get(name);
};
