/* Text helpers the data tables use to build their HTML (item links, "i" buttons, map links, placeholders).
   Moved out of src/main.js unchanged (0.2 P2). Every export is still a page global (scripts/build.mjs). */
import { DV_BOARDS } from "./generated.js";
import { ITEMS } from "./items.js";
import { STIGMA_PLAN } from "./build.js";
export const seq = (arr) => '<span class="seq">' + arr.map(s => `<span>${s}</span>`).join('<i>→</i>') + '</span>';
export const EYE = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>`;
export const I = (key, label) => {
  const [name, slug] = ITEMS[key];
  return `<a class="itm" data-ico="${key}" href="https://metabot.gg/en/aion-2/items/${slug}" target="_blank" rel="noopener" title="Open in the item database">${label || name}${EYE}</a>`;
};
/* "i" button after a term. `name` is the button's spoken name when the term has no visible label (a section title next to it). */
export const T = (label, key, name) => `<span class="term">${label}<button type="button" class="tip" data-tip="${key}" aria-expanded="false" aria-label="${name || `What is ${label.replace(/<[^>]+>/g, "")}?`}">i</button></span>`;
/* Placeholders in milestone text, filled by fillStigmaText() on every update. */
export const stn = n => `<span class="stn" data-slot="${n}">${STIGMA_PLAN[n - 1]}</span>`;
export const eRow = n => `<span class="erow" data-slot="${n}"></span>`;
export const DAEVA = `<b>Use your ${I("crystal")}</b> from the Cube, then spend the crystals on the current board's Heart Gore and Ambush nodes, then a corner.`;
export const sub = (label, note) => ({ sub: label, subNote: note });
/* Vaizel / Triniel plan nodes (DV_BOARDS, data/build.json); keys dv:v:* / dv:t:*. */
export const dvNodes = b => DV_BOARDS[b].nodes.map(n => ({ k: n.k, dv: true, board: b, blv: DV_BOARDS[b].lv, ty: n.ty, t: n.t, ...(n.via ? { via: n.via } : {}) }));
export const metaSlug = n => n.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const mapSlug = n => n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const hideouts = (names, keyPrefix = "sd") => [{ ...sub("Sealed Dungeons"), group: "hideout" },
  ...names.map(n => ({ kind: "hideout", name: n, k: `${keyPrefix}:${mapSlug(n)}`, t: `<a class="itm" href="https://metabot.gg/en/aion-2/map/altgard/dungeons?focus=dungeon:${metaSlug(n)}" target="_blank" rel="noopener" title="Show on the Altgard interactive map (Metabot)"><b>${n}</b>${EYE}</a>`, cell: true }))];
/* Link a quest giver to the quest's marker on Metabot's Altgard map. */
export const mapQ = (id, who) => `<a class="itm" href="https://metabot.gg/en/aion-2/map/altgard?focus=quest:${id}" target="_blank" rel="noopener" title="Show on the map">${who}${EYE}</a>`;
export const ASC = "Journal (J) → Ascension tab → Teleport (bottom right) takes you to Asahr.";
/* Guide text tokens (data format v2, DATA-FORMAT-V2 §7) -> the HTML the helpers above make. The data holds the tokens; their
   markup and wording stay here in code. Build tokens ([[build:…]]) are expanded by the generator with the guide build. */
export const expandTokens = s => s.replace(/\[\[([a-z]+)(?::([^|\]]*))?(?:\|([^\]]*))?\]\]/g, (m, kind, arg, label) => {
  if (kind === "item") return I(arg, label);
  if (kind === "tip") return T(label, arg);
  if (kind === "mapq") return mapQ(arg, label);
  if (kind === "stigma") return stn(+arg);
  if (kind === "erow") return eRow(+arg);
  if (kind === "asc") return ASC;
  if (kind === "daeva") return DAEVA;
  if (kind === "rotseq") return `<span class="rotseq"></span>`;
  throw new Error("unknown text token " + m);
});
