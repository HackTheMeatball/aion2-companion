/* Assassin build data: stat tiers, skill point plan and costs, Daevanion node types, stigma plan, key stacks, icons.
   Moved out of src/main.js unchanged (0.2 P2). Every export is still a page global (scripts/build.mjs). */
import { SP_EXTRA } from "./generated.js";
/* Assassin stat tiers (data/claims.json C20): Critical Hit is top in Metabot, games.gg and GamesFuze; tier 2 = stats exactly two of them
   rank high. Stats only one ranks (Accuracy, Critical Damage Boost, Double Chance) are left out. */
export const STAT_TIERS = [["Critical Hit"], ["Attack", "Back Attack Damage Boost", "Combat Speed"]];
/* Where each stat comes from: board stat nodes/corners (player's board, Metabot corners) or gear. Back Attack wasn't on any board path. */
export const STAT_SRC = { "Critical Hit": "BG", "Back Attack Damage Boost": "G", "Attack": "BG", "Combat Speed": "BG" };
/* Stigma slots 22 / 27 / 32 / 37. Every stigma is learnable at 22 and fits any slot (data/build.json stigmaRules). Plan: Triniel's
   Dagger and Illusive Clone first (GamesFuze, Skycoach); Swift Contract before Savage Fang (Metabot, Skycoach; GamesFuze reverses
   it). The Stigmas card lets you pick what you actually equipped (state.stPick); milestone lines, E stack, rotation and Coming
   up all follow the pick. */
export const STIGMA_PLAN = ["Triniel's Dagger", "Illusive Clone", "Swift Contract", "Savage Fang"];
/* Upgrade plan by name (GamesFuze + Skycoach): Triniel's Dagger to 10, then Illusive Clone toward 20. */
export const ST_TARGETS = [["Triniel's Dagger", 10], ["Illusive Clone", 20]];
/* Node colours match the game: blue = active skill (3), green = passive skill (2), orange = corner (4). Path stat nodes are grey (1). */
export const DV_TYPE = { a: ["dv-a", "active skill"], p: ["dv-p", "passive skill"], c: ["dv-c", "corner"] };
/* Skill point plan, re-ranked from the player's tooltips and Metabot's per-level tables (damage gained per level ÷ cooldown):
   Heart Gore (5s, crit-gated) and Insignia Explosion (10s, biggest per-level gain, scales with stacks) first; the two no-cooldown
   fillers next (cast most often; Savage Roar's level-8 specialty is +20% Skill Speed); Ambush (10s); Shadowstrike (20s) last.
   This order is an inference, not a published build. Gating/costs per Metabot skill pages. */
export const SP_SKILLS = [
  { n: "Heart Gore", learn: 4, spec: "Up to +20% Critical Hit when fewer targets are hit" },
  { n: "Insignia Explosion", learn: 14, spec: "+50% Multi-Hit on hit" },
  { n: "Savage Roar", learn: 1, spec: "+20% Skill Speed" },
  { n: "Quick Slice", learn: 1, spec: "+50% Multi-Hit on hit" },
  { n: "Ambush", learn: 3, spec: "Engraves 2 Insignias when it lands as a Back attack" },
  { n: "Rear Smite", learn: 11, passive: true },
  { n: "Exploit Weakness", learn: 6, passive: true },
  { n: "Shadowstrike", learn: 1, spec: "+20% Critical Damage Boost for 10s on hit" },
];
/* After the core eight (E2): SP_EXTRA from data/build.json, in its source-backed order (single-source ones flagged). They live in
   the Skills card and Sync levels only, not in milestones, and come after every core upgrade that's open. */
SP_EXTRA.forEach(s => SP_SKILLS.push({ ...s, extra: true }));
/* Total skill points granted by character level (Wikily leveling table; matches the game at Lv 12 = 24, Lv 13 = 28, max 203). */
export const LEVEL_POINTS = [0, 0, 0, 0, 1, 3, 5, 7, 10, 13, 16, 20, 24, 28, 32, 36, 41, 46, 51, 56, 61, 66, 71, 76, 81, 86, 91, 96, 101, 106, 111, 117, 123, 129, 135, 141, 147, 153, 159, 165, 171, 177, 183, 189, 196, 203];
export const spCost = L => L <= 4 ? 1 : L <= 7 ? 2 : 4;
export const SP_STEPS = [];
SP_SKILLS.forEach((s, rank) => {
  for (let L = 2; L <= 10; L++) {
    SP_STEPS.push({ k: `sp:${s.n}:${L}`, s, rank, L, req: s.flat ? s.learn : s.learn + 3 * (L - 2), cost: spCost(L) });
    if (L === 8 && !s.passive && s.spec) SP_STEPS.push({ k: `sp:${s.n}:spec`, s, rank, L: 8.5, req: s.learn + 18, cost: 0, spec: true });
  }
});
/* Key stacks for the hold-to-run setup (K grid): row 0 fires first. Right click = damage line; Q = Shadowstrike alone
   (positioning, so it never fires by accident); E = opener cooldowns as they unlock. Row order is inferred. */
/* Insignia Explosion scales with Insignia stacks (Metabot: +12% damage and +10% stun per stack, up to 5) but casts at 0,
   so it sits above the builders: it fires once Heart Gore and Ambush are on cooldown. */
export const RMB_STACK = lv => lv >= 14 ? ["Heart Gore", "Ambush", "Insignia Explosion", "Savage Roar"]
  : lv >= 4 ? ["Heart Gore", "Ambush", "Savage Roar"] : lv >= 3 ? ["Ambush", "Savage Roar"] : ["Savage Roar"];
/* E follows the stigmas you've actually equipped (Stigmas card); buffs first, then damage (the guide's inference, no source
   gives an order). Before any are ticked, it falls back to the slot levels. */
export const E_ORDER = ["Illusive Clone", "Swift Contract", "Triniel's Dagger", "Savage Fang"];
/* Skill icons by skill name (uploaded art); until then the Wisdom Stone icon. */
export const SP_ICONS = {
  "Heart Gore": "assets/icons/sk-heart-gore.png",
  "Insignia Explosion": "assets/icons/sk-insignia-explosion.png",
  "Savage Roar": "assets/icons/sk-savage-roar.png",
  "Quick Slice": "assets/icons/sk-quick-slice.png",
  "Ambush": "assets/icons/sk-ambush.png",
  "Shadowstrike": "assets/icons/sk-shadowstrike.png",
  "Exploit Weakness": "assets/icons/sk-exploit-weakness.png",
  "Rear Smite": "assets/icons/sk-rear-smite.png",
  "Assault Stance": "assets/icons/sk-assault-stance.png",
  "Defense Break": "assets/icons/sk-defense-break.png",
};
/* Node icons by node type, cut from the player's screenshots: [not bought, bought]. Types without art yet use the crystal. */
/* Node art cut from the player's screenshots: [not bought, bought] per node colour. */
export const DV_TYPE_ICONS = {
  p: ["assets/icons/green-off2.png", "assets/icons/green-on2.png"],
  a: ["assets/icons/blue-off.png", "assets/icons/blue-on.png"],
  c: ["assets/icons/orange-off.png", "assets/icons/orange-on.png"] };
/* Live refresh while typing a cost (no re-render, so the box keeps focus). */
/* Cheapest a node can be: the node itself (passive 2, active 3, corner 4); its path only adds to that. */
export const DV_MIN = { p: 2, a: 3, c: 4 };
export const STIGMA_ICON = { "Illusive Clone": "assets/icons/st-illusive-clone.png", "Swift Contract": "assets/icons/st-swift-contract.png",
  "Savage Fang": "assets/icons/st-savage-fang.png", "Triniel's Dagger": "assets/icons/st-triniels-dagger.png" };
export const ST_COST = L => L <= 5 ? 1 : L <= 10 ? 2 : L <= 15 ? 4 : L <= 20 ? 8 : null; /* shards to reach level L (Metabot) */
