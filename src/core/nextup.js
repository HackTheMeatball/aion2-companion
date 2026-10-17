/* Next up ranking (0.2 P3, pure: no DOM; 0.4 P2c: the engine ranks, the pack produces its own cards). rankNext(state,
   { basic }) decides which cards Next up shows and in which order; src/main.js turns each card into HTML (nowCard). A card
   is { kind, act, ... }: act is the action its button runs ("tick:<key>", "story", …, "" for none), the other fields are
   what the view needs.

   Cards come as entries { phase, card, keep?, queue?, L? } (docs/design/0.4-engine-contract.md §2 "Next up phases"): the
   engine's own (steps of the milestone you stand on, missed steps, the story card, advice, the next milestone's Later
   card) and the pack's (nextUpProducers, each called once per ranking, in list order). They are sorted by phase, then in
   the order they were collected (the pack's producers first, then the engine's); the later phase by L (the level it
   opens at) first. Order: spend what you already have → steps the milestone you're standing on opens (the route pauses
   at milestones) → what the pack ranks above the story → missed steps → the story → side content → advice → late →
   what opens later. */
import { activePack } from "./pack.js";
import { blockerText } from "./blockers.js";
import { char } from "./state.js";
import { checkableOf, countsOf, doneOf, gatesOf, isOpen, objIdxOf, openSteps, questIdx, turnInNeedsLv } from "./requirements.js";

export const NEXT_UP_PHASES = ["spend", "here", "beforeStory", "missed", "story", "side", "advice", "late", "later"];

/* The ranking changes of smart Next up (docs/design/0.4-smart-next-up.md §12), each a named switch like the gate changes
   (the pack's gateChanges, design 0.3 §13), so tests/golden.js --explain can attribute every changed state to the
   smallest set of them. Unlike those, a ranking change ships off (on: false) until the step that builds it turns it on and
   re-records the golden snapshots (0.5 P11: every one off, nothing reads them yet). A pack declares its own ranking
   changes in a table of its own, read with rankChangeOn(n, table). setRankChanges (tests, the golden runner) turns on
   exactly the names given, from any table; the caller adds what each one needs. */
export const RANK_CHANGES = {
  ascensionFirst: { on: false, what: "a met, not-done step the pack ranks first (the rank-up quest steps) moves to the top of the steps (design §5; 0.3 invariant 3 enforced)" },
  placeRank: { on: false, what: "the side-content picks, their order and the \"near\" count by where the player is (whereNow, byPlace; design §5)" },
  trackFilter: { on: false, what: "fastest drops cards whose candidates are all non-core outside a story level gate; completionist offers its steps after the story (design §6)" },
  bandLabels: { on: false, what: "one level-band label per group when Next up holds cards from more than one milestone band (design §6)" },
  catchUp: { on: false, what: "behind (3+ missed steps or 2+ kinds of points to spend): the spend queue and the missed steps lifted, missed steps by place (design §7)" },
  etaLater: { on: false, what: "the Later cards from every closed node, by the level (then the story quest) they open at (design §7 item 3)" },
};
let RANK_ON = null;
/* Turn on exactly these ranking changes (null: back to each table's `on`); returns the names now on. */
export const setRankChanges = names => { RANK_ON = names == null ? null : new Set(names); return RANK_ON ? [...RANK_ON] : null; };
/* Is ranking change n on? table: the table that declares it (the engine's by default; a pack passes its own). */
export const rankChangeOn = (n, table = RANK_CHANGES) => {
  if (!(n in table)) throw new Error("rankChangeOn: unknown ranking change " + n);
  return RANK_ON ? RANK_ON.has(n) : table[n].on === true;
};

export function rankNext(state, { basic = false } = {}) {
  /* every "is it open?" below is the evaluator's (gatesOf, src/core/requirements.js); the ranking is 0.2's */
  const P = activePack(), { milestones, rowKind, promised } = P.catalog;
  const c = char(state), lv = c.level, ev = gatesOf(c);
  const here = milestones.find(g => g.lv === lv && isOpen(countsOf(state, g)));
  const hs = here ? openSteps(state, here) : [];
  /* the story card's level gate (story.levelGate) */
  const { gated, gateLv } = P.story.levelGate(c);
  const ctx = { c, lv, ev, basic, story: { qi: questIdx(c), gated, gateLv }, here };
  const entries = [];
  for (const p of P.nextUpProducers) for (const e of p.produce(state, ctx)) {
    if (!NEXT_UP_PHASES.includes(e.phase)) throw new Error(`rankNext: producer "${p.id}" returned the unknown phase "${e.phase}"`);
    entries.push(e);
  }
  const add = (phase, card) => entries.push({ phase, card });
  /* Unlock-type steps at your milestone come before the story; its side rows come after it (the pack's cards). */
  hs.filter(x => !x.rq && !x.adv).forEach(x => add("here", { kind: "step", x, g: here, act: "tick:" + x.k }));
  /* Leftovers from milestones below your level. Unlock-type steps stay above the story; side rows keep the rank they had
     at their own level: after the story. */
  const missed = milestones.filter(g => g.lv < lv && isOpen(countsOf(state, g)));
  const msAll = missed.flatMap(g => openSteps(state, g).map(m => ({ ...m, g })));
  msAll.filter(m => !m.rq && !m.adv).slice(0, 2).forEach(m => add("missed", { kind: "missed", x: m, g: m.g, act: "tick:" + m.k }));
  /* Nothing else to do right now: the story is the default (its steps live in the Journey card). */
  add("story", storyCard(state, ctx));
  /* Advice steps (optional notes) rank after the story. Advanced only. */
  [...hs.filter(x => x.adv).map(x => ({ x, g: here })), ...msAll.filter(m => m.adv).map(m => ({ x: m, g: m.g }))].slice(0, 3).forEach(({ x, g }) =>
    add("advice", { kind: "adv", adv: true, x, g, act: "tick:" + x.k }));
  /* The queue's tail, the engine's part: the next milestone with a required step still open. Not side rows, optional
     steps, or rows the pack queues on cards of their own (catalog.promised), so a card never promises something that
     won't show up at that level. Its first step that isn't a side row or advice; a milestone whose rows Next up doesn't
     offer shows its title. why: what opens that step apart from its milestone's level (the card says it). */
  const g2 = milestones.find(g => g.lv > lv && checkableOf(state, g).some(x => rowKind(x.it) !== "side" && promised(x.it, x.k) && !doneOf(c, x.k, ev)));
  const st2 = g2 ? openSteps(state, g2).find(x => !x.rq && !x.adv) : null;
  if (g2) entries.push({ phase: "later", L: g2.lv, card: { kind: "laterStep", g: g2, x: st2 || null, lv, later: true, act: "",
    why: st2 && ev.byKey(st2.k) ? blockerText(ev.byKey(st2.k), ev, { omit: ["level"] }) : "" } });
  const ranked = entries.map((e, i) => ({ e, i, p: NEXT_UP_PHASES.indexOf(e.phase) }))
    .sort((a, b) => a.p - b.p || (a.e.phase === "later" ? (a.e.L || 0) - (b.e.L || 0) : 0) || a.i - b.i).map(x => x.e);
  /* Basic: only what you can act on now (no Later or advice cards, only the first card of each queue). */
  const firstOf = new Set();
  const shown = !basic ? ranked : ranked.filter(e => { if (e.card.later || e.card.adv) return false; if (!e.queue) return true;
    if (firstOf.has(e.queue)) return false; firstOf.add(e.queue); return true; });
  /* At most 8 cards, plus the story card and the cards the pack keeps (keep: true), which always stay. */
  return shown.filter((e, i) => i < 8 || e.card.story || e.keep).map(e => e.card);
}

/* The story card: set your quest / story complete / the quest with its objectives. Level-gated (the quest's level is
   above yours): no "Turned in" until its objectives are all ticked, never below the quest's unlock level (turnInNeedsLv,
   0.3 E4), and a "Meanwhile" line of what else to do at your level (story.meanwhile). The objectives version carries the
   pack's own fields (story.cardFields: where to go next). */
function storyCard(state, ctx) {
  const c = char(state), lv = c.level, P = activePack(), { quests, steps } = P.data.story, { qi, gated, gateLv } = ctx.story;
  if (qi < 0) return { kind: "story", story: true, v: "unset", act: "setquest" };
  const list = steps[c.quest], done = (c.qsteps || {})[c.quest] || [], nq = quests[qi + 1] || null;
  /* Past the end of the guide's story data: no dead "Turned in"; the story goes on in game. */
  if (!nq && c.storyEnd === c.quest) return { kind: "story", story: true, v: "end", quest: c.quest, act: "" };
  const meanwhile = gated ? P.story.meanwhile(state, ctx) : null;
  const base = { kind: "story", story: true, quest: c.quest, nq, gated, gateLv, lv, meanwhile };
  const turnInLv = turnInNeedsLv(c), shut = turnInLv > 0;
  if (shut) base.turnInLv = turnInLv;
  if (!list) return { ...base, v: "nolist", act: gated || shut ? "" : "story" };
  const vis = objIdxOf(state, list), allDone = vis.every(i => done.includes(i));
  const fields = P.story.cardFields(state, { ...ctx, open: list[vis.find(i => !done.includes(i))] });
  return { ...base, v: "obj", done: vis.filter(i => done.includes(i)).length, total: vis.length, ...fields, objectives: !gated, act: shut ? "" : gated ? (allDone ? "story" : "") : "story" };
}
