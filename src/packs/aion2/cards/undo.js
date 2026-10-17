/* What the AION 2 pack tells the engine's Undo card (0.4 P5d; rowHooks undoLast / undoDo): the last board node you
   ticked, if it is still ticked. The engine card owns the 10-second row and the click. */
import { char } from "../../../core/state.js";
import { DV_NODES } from "../catalog.js";
import { aion2State as state, aion2DvShort as dvShort } from "./page.js";

/* { label, at } of the node to offer an undo for (at = when it was ticked), or null */
export function aion2UndoLast() {
  const it = char(state).dvLast && char(state).checks[char(state).dvLast] && DV_NODES().find(n => n.k === char(state).dvLast);
  return it ? { label: dvShort(it.t), at: char(state).dvLastAt || 0 } : null;
}
/* untick it; true if there was one (the engine then saves and redraws) */
export function aion2UndoDo() {
  const k = char(state).dvLast && char(state).checks[char(state).dvLast] ? char(state).dvLast : null;
  if (!k) return false;
  char(state).checks[k] = false; delete char(state).dvLast;
  return true;
}
