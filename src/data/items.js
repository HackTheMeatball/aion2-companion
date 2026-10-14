/* Items the guide names (label, Metabot slug, icon, in-game name).
   Moved out of src/main.js unchanged (0.2 P2). Every export is still a page global (scripts/build.mjs). */
/* Item names link to their Metabot database page, which shows the in-game icon. */
/* Item icons are stored in this artifact (uploaded by the player). Any item line that names one
   shows the icon large on its right. Items without an icon yet still link to their database page. */
export const ITEMS = {
  enhance: ["Enhance Stones", "enhance-stone", "assets/icons/enhance-stone.png", "Enhance Stone"],
  wisdom: ["Wisdom Stones", "wisdom-stone-bound", "assets/icons/wisdom-stone.png", "Wisdom Stone"],
  crystal: ["Daevanion Crystals", "daevanion-crystal-bound", "assets/icons/daevanion-crystal.png", "Daevanion Crystal"],
  cubekey: ["Hidden Cube keys", "key-hidden-cube", "", "Key: Hidden Cube"],
};
