/* Assassin build data: stat tiers, skill point plan and costs, Daevanion node types, stigma plan, key stacks, icons.
   Every export is still a page global (scripts/build.mjs). */
import { E_ORDER, LEVEL_POINTS, RMB_ROWS, SP_EXTRA, SP_ICONS, SP_SKILLS_CORE, STAT_SRC, STAT_TIERS, STIGMA_ICON, STIGMA_PLAN, ST_TARGETS } from "./generated.js";
/* Compiled from data/classes/assassin/ since 0.2 step 5b (tools/gen/gen.mjs): the guide build (builds.json: stat tiers,
   skill order and specialty picks, stigma plan and targets, key stacks), skills.json (learn levels, icons) and
   stigmas.json (icons), and rule:level-points. Re-exported here under their page names. */
export { E_ORDER, LEVEL_POINTS, SP_ICONS, STAT_SRC, STAT_TIERS, STIGMA_ICON, STIGMA_PLAN, ST_TARGETS };
/* Node colours match the game: blue = active skill (3), green = passive skill (2), orange = corner (4). Path stat nodes are grey (1). */
export const DV_TYPE = { a: ["dv-a", "active skill"], p: ["dv-p", "passive skill"], c: ["dv-c", "corner"] };
/* Skill point plan: the guide build's core skills in order ({n, learn, spec, passive}), then (E2) the skills after the
   core eight in their source-backed order (single-source ones flagged). Those live in the Skills card and Sync levels
   only, not in milestones, and come after every core upgrade that's open. */
export const SP_SKILLS = SP_SKILLS_CORE.map(s => ({ ...s }));
SP_EXTRA.forEach(s => SP_SKILLS.push({ ...s, extra: true }));
export const spCost = L => L <= 4 ? 1 : L <= 7 ? 2 : 4;
/* Effective skill level at which specialty slot 1 / 2 / 3 opens (rule:specialty-slots) */
export const SPEC_SLOT_LV = [8, 12, 20];
export const SP_STEPS = [];
SP_SKILLS.forEach((s, rank) => {
  for (let L = 2; L <= 10; L++) {
    SP_STEPS.push({ k: `sp:${s.n}:${L}`, s, rank, L, req: s.flat ? s.learn : s.learn + 3 * (L - 2), cost: spCost(L) });
    if (L === 8 && !s.passive && s.spec) SP_STEPS.push({ k: `sp:${s.n}:spec`, s, rank, L: 8.5, req: s.learn + 18, cost: 0, spec: true, slot: 1, slotLv: SPEC_SLOT_LV[0] });
  }
});
/* Specialty slots 2 and 3 (0.3 E7, design §9): open at effective skill level 12 / 20 (rule:specialty-slots; the generator
   checks 8 / 12 / 20), on the skills with a slot 1 line. Not milestone rows: the Skills card and Next up only (slot 3, out of
   reach inside Lv 45, the Skills card only: Q5). req only orders them (slot 2: the level of skill line 10; slot 3: after
   Lv 45). New keys sp:<skill>:spec2 / :spec3, written only when ticked. The build's pick per slot is s.specs[slot − 1]. */
export const SP_SLOTS = [];
SP_STEPS.filter(x => x.slot === 1).forEach(x => [2, 3].forEach(n => SP_SLOTS.push({ k: `${x.k}${n}`, s: x.s, rank: x.rank, L: 10 + n / 10,
  req: n === 2 ? x.s.learn + 24 : 46, cost: 0, spec: true, slot: n, slotLv: SPEC_SLOT_LV[n - 1] })));
/* Key stacks for the hold-to-run setup (K grid): row 0 fires first. Right click = damage line, by character level (the guide
   build's keyStacks.rightClick: the first row whose minLv the level reaches). Q = Shadowstrike alone (positioning, so it
   never fires by accident); E = opener cooldowns as they unlock, E_ORDER. Row order is inferred. */
export const RMB_STACK = lv => (RMB_ROWS.find(r => lv >= r.minLv) || RMB_ROWS[RMB_ROWS.length - 1]).skills.slice();
/* Node icons by node type, cut from the player's screenshots: [not bought, bought]. Types without art yet use the crystal. */
/* Node art cut from the player's screenshots: [not bought, bought] per node colour. */
export const DV_TYPE_ICONS = {
  p: ["assets/icons/green-off2.png", "assets/icons/green-on2.png"],
  a: ["assets/icons/blue-off.png", "assets/icons/blue-on.png"],
  c: ["assets/icons/orange-off.png", "assets/icons/orange-on.png"] };
/* Live refresh while typing a cost (no re-render, so the box keeps focus). */
/* Cheapest a node can be: the node itself (passive 2, active 3, corner 4); its path only adds to that. */
export const DV_MIN = { p: 2, a: 3, c: 4 };
export const ST_COST = L => L <= 5 ? 1 : L <= 10 ? 2 : L <= 15 ? 4 : L <= 20 ? 8 : null; /* shards to reach level L (Metabot) */
