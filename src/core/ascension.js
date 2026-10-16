/* The Ascension bar (0.3 E8, pure: no DOM; docs/design/0.3-requirement-engine.md §11). Informational only: it reads the
   evaluator (gatesOf) and the ticks, and writes nothing. The 4 in-cap chapters (ASCENSION, inCap) are its segments; a
   chapter is filled when its node is done (derived from its wrapper story quest, §5) or its guide step is ticked
   (ASCENSION step: g6:0, g22:0, g32:dreams, g45:witness). The Ascension Gauge stays a player atom: never read, only named. */
import { ASCENSION } from "../data/story.js";
import { gatesOf } from "./requirements.js";

const ASC_CAP = ASCENSION.filter(a => a.inCap);

/* The label's chapter name: every chapter is "The One Who …", so the label drops the shared prefix to stay one line at
   390 px (owner, 2026-10-16: "Ascension n / 4 · next: <name>", one line in Basic); the full name is the segment's tooltip. */
export const shortName = name => name.replace(/^The One Who /, "");
/* The gauge note, only where the chapter's gate names the gauge (a player atom: II owner tooltip 2026-10-15, III claim
   C36; IV has none, so no note). */
const gaugeNote = p => p.replace(/^Ascension Gauge at /, "gauge ");

/* { n, total, chapters: [{ id, name, chapter, done: false | "tick" | "derived" }], next, oath, label }
   next: the first chapter not done, with { gauge } (the gauge note when its gate names the gauge, else ""), or null at
   4 / 4. The label leaves the story position out: the timeline above it already says where the story is (owner rule,
   no redundancy). */
export function ascensionOf(c, ev = gatesOf(c)) {
  const chapters = ASC_CAP.map(a => {
    const r = ev.node(a.id);
    return { id: a.id, name: a.name, chapter: a.chapter, done: a.step && c.checks[a.step] ? "tick" : r.done !== false ? "derived" : false };
  });
  const n = chapters.filter(x => x.done).length, nx = chapters.find(x => !x.done), oath = ASCENSION.find(a => !a.inCap);
  let next = null;
  if (nx) {
    const g = ev.node(nx.id).info.find(a => a.player);
    next = { ...nx, gauge: g ? gaugeNote(g.player) : "" };
  }
  const head = `Ascension ${n} / ${chapters.length}`;
  const label = next ? `${head} · next: ${shortName(next.name)}${next.gauge ? ` · ${next.gauge}` : ""}`
    : `${head}${oath ? ` · next: ${shortName(oath.name)} (Lv ${oath.lv})` : ""}`;
  return { n, total: chapters.length, chapters, next, oath, label };
}
