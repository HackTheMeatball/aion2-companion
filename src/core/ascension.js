/* The Ascension bar (0.3 E8, pure: no DOM; docs/design/0.3-requirement-engine.md §11). Informational only: it reads the
   evaluator (gatesOf) and the ticks, and writes nothing. The 4 in-cap chapters (ASCENSION, inCap) are its segments; a
   chapter is filled when its node is done (derived from its wrapper story quest, §5) or its guide step is ticked
   (ASCENSION step: g6:0, g22:0, g32:dreams, g45:0). The Ascension Gauge stays a player atom: never read, only named. */
import { ASCENSION, QUESTS } from "../data/story.js";
import { gatesOf, storyIdx } from "./requirements.js";

const ASC_CAP = ASCENSION.filter(a => a.inCap);
const ASC_IDS = new Set(ASCENSION.map(a => a.id));
const pl = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

/* One blocker as text (design §4): story `unlocks after "X"` (turnedIn) / `opens on "X"` (reached) · N quests ahead
   ("your current quest" at 0; "set your quest" with the story unset), level `needs Lv N`.
   TODO(E6): E8's own copy of the blocker wording, kept to this one helper; swap it for E6's shared formatter once E6 has
   merged (the CEO unifies them), keeping the Ascension bar's labels as tests/core/ascension.test.mjs pins them. */
export const blockerText = b => {
  if (b.kind === "level") return `needs Lv ${b.need}`;
  if (b.kind === "story") {
    if (b.ahead == null) return "set your quest";
    const n = b.turnIn ? b.ahead - 1 : b.ahead;   /* quests between your current quest and X */
    return `${b.turnIn ? "unlocks after" : "opens on"} "${b.name}" · ${n === 0 ? "your current quest" : pl(n, "quest") + " ahead"}`;
  }
  return "after an earlier step";
};

/* The game words a chapter's story gate as the quest before it completed (owner, 2026-10-15: the Ascension Gauge Level 1
   tooltip asks for "Verdant Melody" complete, the quest before "Daeva in a Dream"). On a linear story, reaching X and
   turning in the quest before X are the same position, so the bar says it the game's way, with the same count. */
const asGame = b => {
  if (b.kind !== "story" || b.turnIn) return b;
  const i = storyIdx(b.name);
  return i > 0 ? { ...b, name: QUESTS[i - 1][1], turnIn: true } : b;   /* ahead is the same number (design §3: i − pos either way) */
};

/* { n, total, chapters: [{ id, name, chapter, done: false | "tick" | "derived" }], next, oath, label }
   next: the first chapter not done, with { open, text } (its first blocker apart from the chapter before it, which the
   bar shows itself, and the gauge when its gate names it), or null at 4 / 4. */
export function ascensionOf(c, ev = gatesOf(c)) {
  const chapters = ASC_CAP.map(a => {
    const r = ev.node(a.id);
    return { id: a.id, name: a.name, chapter: a.chapter, done: a.step && c.checks[a.step] ? "tick" : r.done !== false ? "derived" : false };
  });
  const n = chapters.filter(x => x.done).length, nx = chapters.find(x => !x.done), oath = ASCENSION.find(a => !a.inCap);
  let next = null;
  if (nx) {
    const r = ev.node(nx.id), bs = r.blockers.filter(b => !(b.kind === "done" && ASC_IDS.has(b.of)));
    const gauge = r.info.find(a => a.player), why = bs.length ? blockerText(asGame(bs[0])) : "";
    next = { ...nx, open: !bs.length, text: [why, gauge && `needs ${gauge.player}`].filter(Boolean).join(" · ") || "open now" };
  }
  const label = next ? `Ascension ${n} / ${chapters.length} · next: ${next.name} · ${next.text}`
    : `Ascension ${n} / ${chapters.length} in Altgard${oath ? ` · ${oath.name} is at Lv ${oath.lv}` : ""}`;
  return { n, total: chapters.length, chapters, next, oath, label };
}
