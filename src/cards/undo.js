/* Undo (0.4 P5d): the 10-second undo row of the last node you ticked (#dvUndo, in a pack card's markup). The pack says
   what that node is and unticks it (rowHooks undoLast / undoDo); the button's title is the pack's text. Drawn by that
   card, so it registers with update: null. */
import { activePack } from "../core/pack.js";
import { pageSave as save, pageUpdate as update } from "./page.js";

/* Undo for the last node you ticked (from anywhere on the page). It stays until you undo it or tick another node, and
   survives a reload. */
/* Shown for 10 seconds after a tick, fading out over the last 1.5 s. */
let undoTimer = 0;
function renderUndo() {
  const el = document.getElementById("dvUndo"); if (!el) return;
  const hook = activePack().rowHooks.undoLast, last = hook && hook();
  const age = last ? Date.now() - last.at : 0, live = last && age < 10000;
  clearTimeout(undoTimer);
  el.innerHTML = live ? `<button type="button" class="undorow" id="dvUndoBtn" style="animation-delay:-${age}ms" title="${activePack().text.undoTitle || ""}"><span class="ur-k">↶ Undo</span><span class="ur-n">${last.label}</span></button>` : "";
  if (live) undoTimer = setTimeout(() => { el.innerHTML = ""; }, 10000 - age);
}
/* the Undo button (from render(), once) */
function undoMount() {
  document.getElementById("dvUndo").addEventListener("click", e => {
    if (!e.target.closest("#dvUndoBtn")) return;
    const hook = activePack().rowHooks.undoDo;
    if (!hook || !hook()) return;
    save(); update();
  });
}

const undoCard = { id: "undo", slot: "top", order: 500, root: "dvUndo", mount: undoMount, update: null };
export { renderUndo, undoCard };
