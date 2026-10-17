/* The saved state (0.2 P3, pure: no DOM, no storage). docs/ARCHITECTURE.md §1 has the rules.

   Save v5 (0.4 P3c, a clean break: the v4 key is never read). One save holds the view settings (mode, filters, folds),
   this browser's backup times, and the characters, one slot each:
     { v: 5, savedAt, current: <slot id>, chars: { <slot id>: character }, mode, open, hide, hideCards, …, backup }
   A character is { id, pack, class, name, created, ...CHAR_FIELDS }. The slot id is random (newId), never derived from
   the name, class or level. Every read and write of character data goes through char(state); tests/core/purity.test.mjs
   fails on a direct state.<field> access to a CHAR_FIELDS name anywhere in src/. */
export const KEY = "companion-save-v5";
export const SAVE_V = 5;
/* The guide pack (data/packs/aion2/asmodian/assassin/pack.json) and its class (data/packs/aion2/classes/assassin), the only
   ones a character can have until 0.5 adds a class picker; tests/core/state.test.mjs checks both against data/.
   The slot id is random (newId, src/shell/ids.js) and stays the same for the character's life. */
export const PACK = "aion2/asmodian/assassin";
export const CLASS = "assassin";

/* The character's progress fields. Everything else in a character is its identity (CHAR_META); everything else in the
   save is a view setting, the backup times, or v / savedAt / current / chars. */
export const CHAR_FIELDS = [
  "checks", "started", "areaRun", "level", "quest", "storyEnd", "qsteps", "qsub", "rqSnooze",
  "stLv", "stShards", "stPick", "stones", "pendSt", "pendCr",
  "dvTotal", "dvCost", "dvAdj", "dvLast", "dvLastAt", "dvPts", "crystals", "rotSeen",
  "mt", /* per-item change times (5c, src/core/sync.js) */
];
export const CHAR_META = ["id", "pack", "class", "name", "created"];
export const char = state => state.chars[state.current];

/* The label (owner, 2026-10-16): <name>-<class>-lvl<level>, the name part left out while the name is empty. Derived on
   read, never stored, and never put in a storage key, a file name, a URL or a log (it may carry the player's name). */
export const labelOf = c => [c.name, c.class, "lvl" + (+c.level || 1)].filter(Boolean).join("-");

/* Defaults laid under a stored save (a save is never re-defaulted beyond these) and a stored character. */
export const DEFAULT = () => ({ hide: false, open: {} });
export const CHAR_DEFAULT = () => ({ checks: {}, level: 5, quest: "" });
/* A new character in a new slot: now is the time in ms; id is random (the page's newId, src/shell/ids.js). */
export function newChar({ now = 0, id }) {
  if (typeof id !== "string" || !id) throw new Error("newChar: a slot id is needed");
  return { id, pack: PACK, class: CLASS, name: "", created: now, ...CHAR_DEFAULT() };
}
/* A new save with one empty character (the load-time fresh start in src/core/migrations.js sets it to Lv 1). */
export function newSave({ now = 0, id }) {
  const c = newChar({ now, id });
  return { v: SAVE_V, current: c.id, chars: { [c.id]: c }, ...DEFAULT() };
}

/* A stored v5 save: an object with v 5 and a current slot that holds a character. Nothing else is read. */
const isObj = x => !!x && typeof x === "object" && !Array.isArray(x);
const isV5 = s => isObj(s) && s.v === SAVE_V && isObj(s.chars) && typeof s.current === "string" && isObj(s.chars[s.current]);

/* The state from the stored text (null = no save). Anything that isn't a v5 save (unreadable text, another shape) gives
   a new save, as if there were none. hadSave: a v5 save was loaded. opts { now (ms), newId () → slot id } make the new
   save; newId is only called then. */
export function loadState(raw, { now = 0, newId } = {}) {
  let s = null;
  try { s = JSON.parse(raw || "null"); } catch (e) { s = null; }
  if (!isV5(s)) return { state: newSave({ now, id: newId && newId() }), hadSave: false };
  const state = Object.assign(DEFAULT(), s);
  Object.entries(state.chars).forEach(([k, c]) => { if (isObj(c)) state.chars[k] = Object.assign(CHAR_DEFAULT(), c); else delete state.chars[k]; });
  return { state, hadSave: true };
}
/* An imported file's text: the parsed save when it is a v5 export, else null (a pre-0.4 export, or not a save). */
export function parseExport(raw) {
  let s = null;
  try { s = JSON.parse(raw); } catch (e) { return null; }
  return isV5(s) ? s : null;
}
