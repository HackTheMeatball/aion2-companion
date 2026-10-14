/* The saved state (0.2 P3, pure: no DOM, no storage). docs/ARCHITECTURE.md §1 has the rules: the key never changes,
   item keys are permanent, migrations only add.

   One save holds view settings (mode, filters, folds), one-time flags (seedLv12, migV5, …) and the character: level,
   story position, ticks, build. Today the character's fields sit at the top level of the save (one character per
   browser). Every read and write of character data goes through char(state), so several characters (0.4) change this
   one function and the save format, not every caller. tests/core/char.test.mjs fails on a direct state.<field> access
   to a CHAR_FIELDS name anywhere in src/. */
export const KEY = "aion2-assassin-route-v4";

/* The character's fields. Everything else in the save is a view setting or a one-time flag. */
export const CHAR_FIELDS = [
  "checks", "started", "areaRun", "level", "quest", "storyEnd", "qsteps", "qsub", "rqSnooze",
  "stLv", "stShards", "stPick", "stones", "pendSt", "pendCr",
  "dvTotal", "dvCost", "dvAdj", "dvLast", "dvLastAt", "dvPts", "crystals", "rotSeen",
];
export const char = state => state;

export const DEFAULT = () => ({ checks: {}, level: 5, hide: false, open: {}, quest: "" });

/* The state from the stored text (null = no save). hadSave: progress existed (decides which one-time steps write). */
export function loadState(raw) {
  let state = DEFAULT(), hadSave = false;
  try { const s = JSON.parse(raw || "null"); if (s) { state = Object.assign(state, s); hadSave = true; } } catch (e) {}
  return { state, hadSave };
}
