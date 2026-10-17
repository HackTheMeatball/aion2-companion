/* Lookups over the pack's catalog (0.2 P3, 0.4 P2b; pure: no DOM, no state). The pack finishes its milestones and route
   rules at module load (src/packs/<game>/catalog.js); the engine reads them through the pack object (catalog.milestones,
   catalog.routes) and asks catalog.rowKind which rows are milestone rows. Keys never depend on where an item ends up
   (docs/ARCHITECTURE.md §1). */
import { activePack, perPack } from "./pack.js";

/* Every milestone / route item by its key (built on first use per pack; the milestones are final by then). */
export const itemByK = k => perPack("itemByK", p => { const m = {}; [...p.catalog.milestones, ...p.catalog.routes].forEach(g => g.items.forEach(it => { if (it.k) m[it.k] = it; })); return m; })[k];
/* A milestone's items as its card lists them (main rows first, then the pack's side rows; keys keep the original index),
   without the ones that never show as a row (sub-headings, hidden lines, rows of kind "none"). */
export const cardRows = s => {
  const { rowKind } = activePack().catalog, isSide = it => rowKind(it) === "side";
  const order = s.items.map((it, j) => [it, j]);
  return [...order.filter(([it]) => !isSide(it)), ...order.filter(([it]) => isSide(it))]
    .filter(([it]) => rowKind(it) !== "none" && !it.hidden && !it.sub)
    .map(([it, j]) => ({ it, k: it.k || s.id + ":" + j }));
};
