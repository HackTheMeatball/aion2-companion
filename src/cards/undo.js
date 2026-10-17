/* Undo (0.4 P4c: moved verbatim from src/main.js): the 10-second undo row of the last board node you ticked (#dvUndo,
   in the Daevanion card's markup). Drawn by the Daevanion card, so it registers with update: null. */
import { char } from "../core/state.js";
import { pageState as state, pageSave as save, pageUpdate as update, pageDV_NODES as DV_NODES, pageDvShort as dvShort } from "./page.js";

/* Undo for the last board node you ticked (from anywhere on the page). It stays until you undo it or tick
   another node, and survives a reload. */
/* Shown for 10 seconds after a buy, fading out over the last 1.5 s. */
let undoTimer = 0;
function renderUndo() {
  const el = document.getElementById("dvUndo"); if (!el) return;
  const it = char(state).dvLast && char(state).checks[char(state).dvLast] && DV_NODES().find(n => n.k === char(state).dvLast);
  const age = Date.now() - (char(state).dvLastAt || 0), live = it && age < 10000;
  clearTimeout(undoTimer);
  el.innerHTML = live ? `<button type="button" class="undorow" id="dvUndoBtn" style="animation-delay:-${age}ms" title="Untick the last node you acquired"><span class="ur-k">↶ Undo</span><span class="ur-n">${dvShort(it.t)}</span></button>` : "";
  if (live) undoTimer = setTimeout(() => { el.innerHTML = ""; }, 10000 - age);
}
/* the Undo button (from render(), once) */
function undoMount() {
  document.getElementById("dvUndo").addEventListener("click", e => {
    if (!e.target.closest("#dvUndoBtn")) return;
    const k = char(state).dvLast && char(state).checks[char(state).dvLast] ? char(state).dvLast : null;
    if (!k) return;
    char(state).checks[k] = false; delete char(state).dvLast; save(); update();
  });
}

const undoCard = { id: "undo", slot: "top", order: 500, root: "dvUndo", mount: undoMount, update: null };
export { renderUndo, undoCard };
