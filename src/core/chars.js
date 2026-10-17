/* The characters of a save (0.5 P17, pure: no DOM, no storage, no clock): add, switch, rename, remove a slot of save v5
   (src/core/state.js). Each function takes a save and returns a new one; the input is never written, and every slot the
   call doesn't change is the same object as before. The slot id comes from the caller (the page's newId) and is never
   derived from the name, class or level; the name stays in the character, never in a key, a file name, a URL or a log. */
import { newChar } from "./state.js";

/* A name: control characters and runs of white space become one space, trimmed, at most NAME_MAX characters (code points,
   so a cut never splits one). Anything that isn't a string gives "". */
export const NAME_MAX = 24;
export const cleanName = name => typeof name === "string"
  ? [...name.replace(/[\s\p{Cc}]+/gu, " ").trim()].slice(0, NAME_MAX).join("").trim() : "";

const slotOf = (state, id) => {
  if (typeof id !== "string" || !Object.prototype.hasOwnProperty.call(state.chars, id)) throw new Error("chars: no such slot");
  return state.chars[id];
};

/* A new character of a playable class (packClasses; none = the pack's `character`) in a new slot, which becomes current. */
export function addChar(state, { class: cls, name, now = 0, id } = {}) {
  if (typeof id === "string" && Object.prototype.hasOwnProperty.call(state.chars, id)) throw new Error("chars: the slot id is taken");
  const c = { ...newChar({ now, id, class: cls }), name: cleanName(name) };
  return { ...state, current: id, chars: { ...state.chars, [id]: c } };
}

/* Make slot id the current character. */
export function switchChar(state, id) {
  slotOf(state, id);
  return { ...state, current: id };
}

/* Give slot id a new name (cleanName; "" clears it). Only that slot changes. */
export function renameChar(state, id, name) {
  const c = slotOf(state, id);
  return { ...state, chars: { ...state.chars, [id]: { ...c, name: cleanName(name) } } };
}

/* Remove slot id; the last slot is never removed. If it was current, the first remaining slot (save order) is. */
export function removeChar(state, id) {
  slotOf(state, id);
  const rest = Object.keys(state.chars).filter(k => k !== id);
  if (!rest.length) throw new Error("chars: the last character can't be removed");
  const chars = {}; rest.forEach(k => { chars[k] = state.chars[k]; });
  return { ...state, current: state.current === id ? rest[0] : state.current, chars };
}
