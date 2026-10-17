/* Next up ranking (0.2 P3, pure: no DOM; 0.4 P2c: the engine ranks, the pack produces its own cards). rankNext(state,
   { basic }) decides which cards Next up shows and in which order; src/main.js turns each card into HTML (nowCard). A card
   is { kind, act, ... }: act is the action its button runs ("tick:<key>", "story", …, "" for none), the other fields are
   what the view needs.

   Cards come as entries { phase, card, keep?, queue?, L?, first? } (docs/design/0.4-engine-contract.md §2 "Next up phases"): the
   engine's own (steps of the milestone you stand on, missed steps, the story card, advice, the next milestone's Later
   card) and the pack's (nextUpProducers, each called once per ranking, in list order). They are sorted by phase, then in
   the order they were collected (the pack's producers first, then the engine's); the later phase by L (the level it
   opens at) first. Order: spend what you already have → steps the milestone you're standing on opens (the route pauses
   at milestones) → what the pack ranks above the story → missed steps → the story → side content → advice → late →
   what opens later. A step card the pack puts first (first: true; ascensionFirst: the rank-up quest steps, design §5)
   goes above all of them, and the engine leaves that step out of its own steps and missed steps.

   Catch-up (catchUp, design §7): an entry may say what it spends (points: the kind of points, "skill" / "board" / …, on
   the entry that shows something affordable now) and that it is a queue preview past the pack's usual length (more:
   true). When the player is behind (behindOf), the previews stay and every missed step shows; else the previews drop and
   the missed steps stop at MISSED_SHOWN. Later by eta (etaLater, design §7 item 3): later entries carry Q (the story
   position they wait on, etaOf) next to L, and sort by L, then Q. */
import { activePack, perPack } from "./pack.js";
import { blockerText } from "./blockers.js";
import { cardRows, itemByK } from "./catalog.js";
import { byPlace, whereNow } from "./place.js";
import { char } from "./state.js";
import { checkableOf, countsOf, doneOf, gatesOf, isOpen, objIdxOf, openSteps, questIdx, turnInNeedsLv } from "./requirements.js";

export const NEXT_UP_PHASES = ["spend", "here", "beforeStory", "missed", "story", "side", "advice", "late", "later"];

/* The ranking changes of smart Next up (docs/design/0.4-smart-next-up.md §12), each a named switch like the gate changes
   (the pack's gateChanges, design 0.3 §13), so tests/golden.js --explain can attribute every changed state to the
   smallest set of them. Unlike those, a ranking change ships off (on: false) until the step that builds it turns it on and
   re-records the golden snapshots (0.5 P11: every one off; P12 turns on ascensionFirst and placeRank, both read by the
   pack's producers; P13 turns on catchUp and etaLater, read here and by the pack's spend and Later skill producers; P14
   turns on trackFilter and bandLabels, read here).
   baseline: in the snapshots since an earlier step, so --explain keeps it on and never explains it (as the pack's gate
   changes; the step after the one that records a switch marks it). A pack declares its own ranking changes in a table of its own, read with rankChangeOn(n, table). setRankChanges (tests, the golden runner) turns on
   exactly the names given, from any table; the caller adds what each one needs. */
export const RANK_CHANGES = {
  ascensionFirst: { on: true, baseline: true, what: "a met, not-done step the pack ranks first (the rank-up quest steps) moves to the top of the steps (design §5; 0.3 invariant 3 enforced)" },
  placeRank: { on: true, baseline: true, what: "the side-content picks and the order of their lists by where the player is (whereNow, byPlace; design §5)" },
  trackFilter: { on: true, what: "fastest drops cards whose candidates are all non-core outside a story level gate; completionist offers its steps after the story (design §6)" },
  bandLabels: { on: true, what: "one level-band label per group when Next up holds cards from more than one milestone band (design §6)" },
  catchUp: { on: true, baseline: true, what: "behind (3+ missed steps or 2+ kinds of points to spend): the spend queue and the missed steps lifted, missed steps by place (design §7)" },
  etaLater: { on: true, baseline: true, what: "the Later cards from every closed node, by the level (then the story quest) they open at (design §7 item 3)" },
};
/* Catch-up's thresholds (design §7, inferred; pinned by tests/core/nextup.test.mjs): behind with at least BEHIND_MISSED
   open missed steps, or at least BEHIND_KINDS kinds of points with something affordable now. Not behind: at most
   MISSED_SHOWN missed steps (0.2's rule). */
export const BEHIND_MISSED = 3, BEHIND_KINDS = 2, MISSED_SHOWN = 2;
/* behind(c), from what this ranking collected: missed = the open missed steps, entries = every entry (their points). */
export const behindOf = (missed, entries) => missed.length >= BEHIND_MISSED || new Set(entries.filter(e => e.points).map(e => e.points)).size >= BEHIND_KINDS;
/* When a closed node opens (etaLater): { L: the level it waits for (0: none), Q: the story position it waits on (the
   quest's index on the chain, +0.5 when it needs the turn-in; -1: none) } from its eta (src/core/evaluator.js). */
export const etaOf = r => {
  const e = (r && r.eta) || {}, ix = perPack("nextupStoryIx", p => new Map(p.data.graph.story.map(([id], i) => [id, i])));
  return { L: e.level || 0, Q: e.quest && ix.has(e.quest) ? ix.get(e.quest) + (e.turnIn ? 0.5 : 0) : -1 };
};
let RANK_ON = null;
/* Turn on exactly these ranking changes (null: back to each table's `on`); returns the names now on. */
export const setRankChanges = names => { RANK_ON = names == null ? null : new Set(names); return RANK_ON ? [...RANK_ON] : null; };
/* Is ranking change n on? table: the table that declares it (the engine's by default; a pack passes its own). */
export const rankChangeOn = (n, table = RANK_CHANGES) => {
  if (!(n in table)) throw new Error("rankChangeOn: unknown ranking change " + n);
  return RANK_ON ? RANK_ON.has(n) : table[n].on === true;
};

/* Tracks (trackFilter, design §6; 0.5 P14). A record's route ("core" / "filler" / "completionist") is the pack's
   (catalog.route(k); a key it doesn't label, or a pack without the hook: "core"). The view setting `track` (top-level,
   per device, not synced; absent: "fastest") picks one; Basic always ranks the fastest track. Fastest drops an entry
   whose candidates (its `cands` keys, else the card's step, pick or open rows) are all non-core, except while the story
   is level-gated (filler is how you catch up XP there); the story card and entries without candidates always stay.
   Completionist ranks every route as core and, in Advanced, offers up to COMPLETIONIST_MORE more optional steps after
   the list (the advice cards past the first three). setRouteOf(f) (tests) labels keys with f instead of the pack. */
export const TRACKS = ["fastest", "completionist"], COMPLETIONIST_MORE = 3;
let ROUTE_OF = null;
export const setRouteOf = f => { ROUTE_OF = typeof f === "function" ? f : null; };
export const routeOf = k => { const f = ROUTE_OF || activePack().catalog.route; return (f && f(k)) || "core"; };
export const trackOf = (state, basic = false) => !basic && state && state.track === "completionist" ? "completionist" : "fastest";
/* Is any record the pack offers labelled non-core? (the toggle shows only then: owner, S1 Q7, DECISIONS 2026-10-17) */
export const tracksDiffer = () => Object.values(activePack().data.graph.nodes).some(n => n.key !== undefined && n.kind !== "story" && routeOf(n.key) !== "core");
const candsOf = e => e.cands || [e.card.x && e.card.x.k, e.card.pick && e.card.pick.k, ...(Array.isArray(e.card.open) ? e.card.open.map(x => x.k) : [])].filter(Boolean);
/* Level bands (bandLabels, design §6): a level's band { from, to } runs from the milestone level at or below it to the
   next one's level - 1 (to null: the last band). A card's level: its milestone's; a Later card's the level it opens at; anything else
   is now (your level). */
const bandOfLv = (L, lvs) => { const from = lvs.filter(m => m <= L).pop() ?? lvs[0], nx = lvs.find(m => m > from); return { from, to: nx == null ? null : nx - 1 }; };

export function rankNext(state, { basic = false, track = trackOf(state, basic) } = {}) {
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
  /* the steps the pack put first (first: true) aren't offered twice */
  const firstK = new Set(entries.filter(e => e.first && e.card.x).map(e => e.card.x.k));
  /* Unlock-type steps at your milestone come before the story; its side rows come after it (the pack's cards). */
  hs.filter(x => !x.rq && !x.adv && !firstK.has(x.k)).forEach(x => add("here", { kind: "step", x, g: here, act: "tick:" + x.k }));
  /* Leftovers from milestones below your level. Unlock-type steps stay above the story; side rows keep the rank they had
     at their own level: after the story. */
  const missed = milestones.filter(g => g.lv < lv && isOpen(countsOf(state, g)));
  const msAll = missed.flatMap(g => openSteps(state, g).filter(m => !firstK.has(m.k)).map(m => ({ ...m, g })));
  let ms = msAll.filter(m => !m.rq && !m.adv);
  /* Catch-up (design §7): behind, every missed step, nearest first (byPlace on the zone the pack locates a key in; where
     the player isn't known, the catalog order); else the first MISSED_SHOWN, as 0.2. */
  const lift = rankChangeOn("catchUp") && behindOf(ms, entries);
  if (lift) { const ix = new Map(ms.map((m, i) => [m, i])); ms = [...ms].sort(byPlace(whereNow(c), m => ({ zone: P.locate(m.k), pt: null, order: ix.get(m) }))); }
  else ms = ms.slice(0, MISSED_SHOWN);
  ms.forEach(m => add("missed", { kind: "missed", x: m, g: m.g, act: "tick:" + m.k }));
  /* Nothing else to do right now: the story is the default (its steps live in the Journey card). */
  add("story", storyCard(state, ctx));
  /* Advice steps (optional notes) rank after the story. Advanced only. */
  const advAll = [...hs.filter(x => x.adv).map(x => ({ x, g: here })), ...msAll.filter(m => m.adv).map(m => ({ x: m, g: m.g }))];
  const advCard = ({ x, g }) => ({ kind: "adv", adv: true, x, g, act: "tick:" + x.k });
  advAll.slice(0, 3).forEach(a => add("advice", advCard(a)));
  /* The queue's tail, the engine's part: the next milestone with a required step still open. Not side rows, optional
     steps, or rows the pack queues on cards of their own (catalog.promised), so a card never promises something that
     won't show up at that level. Its first step that isn't a side row or advice; a milestone whose rows Next up doesn't
     offer shows its title. why: what opens that step apart from its milestone's level (the card says it). */
  const eta = rankChangeOn("etaLater") ? laterByEta(state, ctx) : null;
  const g2 = eta ? eta.g : milestones.find(g => g.lv > lv && checkableOf(state, g).some(x => rowKind(x.it) !== "side" && promised(x.it, x.k) && !doneOf(c, x.k, ev)));
  const st2 = eta ? eta.x : g2 ? openSteps(state, g2).find(x => !x.rq && !x.adv) : null;
  if (g2) entries.push({ phase: "later", L: eta ? eta.L : g2.lv, Q: eta ? eta.Q : undefined, card: { kind: "laterStep", g: g2, x: st2 || null, lv, later: true, act: "",
    why: st2 && ev.byKey(st2.k) ? blockerText(ev.byKey(st2.k), ev, { omit: ["level"] }) : "" } });
  /* fastest (trackFilter): an entry whose candidates are all non-core drops, outside a story level gate */
  const tracks = rankChangeOn("trackFilter"), fast = tracks && track !== "completionist" && !gated;
  const onTrack = e => { if (!fast || e.card.story) return true; const ks = candsOf(e); return !ks.length || ks.some(k => routeOf(k) === "core"); };
  /* not behind (or catchUp off): the pack's queue previews past its usual length drop */
  const ranked = (lift ? entries : entries.filter(e => !e.more)).map((e, i) => ({ e, i, p: NEXT_UP_PHASES.indexOf(e.phase) }))
    .sort((a, b) => (b.e.first ? 1 : 0) - (a.e.first ? 1 : 0) || a.p - b.p || (a.e.phase === "later" ? (a.e.L || 0) - (b.e.L || 0) || (a.e.Q ?? -1) - (b.e.Q ?? -1) : 0) || a.i - b.i).map(x => x.e);
  /* Basic: only what you can act on now (no Later or advice cards, only the first card of each queue). */
  const firstOf = new Set();
  const shown = !basic ? ranked : ranked.filter(e => { if (e.card.later || e.card.adv) return false; if (!e.queue) return true;
    if (firstOf.has(e.queue)) return false; firstOf.add(e.queue); return true; });
  /* At most 8 cards, plus the story card and the cards the pack keeps (keep: true), which always stay. Queue previews
     (more, catch-up) may push out what ranks after the story, never a step, a missed step or the story itself. */
  const room = Math.max(0, 8 - shown.filter(e => !e.more && NEXT_UP_PHASES.indexOf(e.phase) <= NEXT_UP_PHASES.indexOf("story")).length);
  let extra = 0;
  /* the track filter runs after the cap, so fastest is always a subset of completionist (tracks nest, invariant 10) */
  const out = shown.filter(e => !e.more || extra++ < room).filter((e, i) => i < 8 || e.card.story || e.keep).filter(onTrack);
  /* completionist (Advanced): the optional steps past the first three, after the list */
  if (tracks && track === "completionist" && !basic) advAll.slice(3, 3 + COMPLETIONIST_MORE).forEach(a => out.push({ phase: "advice", card: advCard(a) }));
  if (!rankChangeOn("bandLabels") || basic) return out.map(e => e.card);
  /* band labels: each card's band ({ from, to }, missed: a missed step), only when the cards span more than one band */
  const lvs = [...new Set(milestones.map(g => g.lv))].sort((a, b) => a - b);
  const bands = out.map(e => ({ ...bandOfLv(e.card.g ? e.card.g.lv : e.phase === "later" ? Math.max(e.L || 0, lv) : lv, lvs), ...(e.card.kind === "missed" ? { missed: true } : {}) }));
  if (lvs.length === 0 || new Set(bands.map(b => b.from)).size < 2) return out.map(e => e.card);
  return out.map((e, i) => ({ ...e.card, band: bands[i] }));
}

/* Later by eta (etaLater, design §7 item 3): of the steps the Later card may promise (on a milestone above your level;
   not a side row, advice or a quest row; offered and promised by the pack; not done) the closed one that opens
   first: by the level it waits for, then the story position, then the catalog order. So a step that waits on a quest
   ranks by that quest, not by its milestone's first row. { g, x, L, Q }, or null (none: the card is 0.2's pick). */
function laterByEta(state, { c, lv, ev }) {
  const { milestones, rowKind, offered, promised } = activePack().catalog;
  let best = null;
  for (const g of milestones) { if (g.lv <= lv) continue;
    for (const { it: row, k } of cardRows(g)) {
      const r = ev.byKey(k), it = itemByK(k);
      if (!r || r.open || r.done !== false || row.kind === "quest" || row.opt || (it && it.adv)) continue;
      if (rowKind(row) === "side" || !offered(it, k) || !promised(row, k)) continue;
      if (it && it.byStory && (it.story === c.quest || ev.completes(r.id))) continue;
      const { L, Q } = etaOf(r), at = Math.max(L, g.lv);
      if (!best || at < best.L || (at === best.L && Q < best.Q)) best = { g, x: { k, it, row, rq: false, adv: false }, L: at, Q };
    } }
  return best;
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
