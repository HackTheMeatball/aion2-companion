/* Blocker-chain text (0.3 E6, pure: no DOM; docs/design/0.3-requirement-engine.md §4). One line from an evaluator
   result (Ev.node / Ev.byKey): its first blocker, followed down to the root, naming at most one `done` hop. Every card
   that says why something isn't open yet uses this (Later cards, milestone chips and the "Turn in / Reach" line, the
   pack's rows and cards), so the words agree everywhere:
     story leaf  unlocks after "X" · N quests ahead   (turnedIn; N = 0: "your current quest — turn it in")
                 opens on "X" · N quests ahead        (reached)
                 … · set your quest                   (story unset)
     level leaf  needs Lv N
     done hop    after "Y" is turned in               (Y open, not done yet)
                 after "Y" (unlocks after "X" · …)    (Y itself blocked: Y plus the root, never deeper)
   N counts the quests from your current one to X (a turnedIn leaf's `ahead` also counts X's own turn-in, design §3).
   What a `done` hop is called is the pack's (hook hopName: a name and a verb, or null to skip the hop and show its root);
   a pack without one names a hop by its row's bold text, "is done". */
import { itemByK } from "./catalog.js";
import { activePack } from "./pack.js";

const pl = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const plain = s => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
/* A row's name: its own short name (ns), else its first bold phrase; `Complete "X"` gives X. */
export const stepName = it => { const t = plain(it.ns || ((it.t || "").match(/<b>(.*?)<\/b>/) || [, it.t || ""])[1]).replace(/[\s:.]+$/, "");
  const m = t.match(/^Complete "(.+)"$/); return m ? m[1] : t; };
/* The default hop name: the row with the node's save key, "is done". */
const rowHopName = r => { const it = r.key !== undefined ? itemByK(r.key) : null; return { name: it ? stepName(it) : r.id, verb: "is done" }; };
const hopNameOf = r => { const h = activePack().hopName; return h ? h(r) : rowHopName(r); };

/* Quests from your current quest to X (null with the story unset). */
export const questsAhead = b => b.ahead == null ? null : b.turnIn ? b.ahead - 1 : b.ahead;
/* The distance part of a story leaf: "3 quests ahead", "your current quest — turn it in", "set your quest". Chips under a
   line that already names the quest show this part alone. */
export const aheadText = b => { const n = questsAhead(b);
  return n == null ? "set your quest" : n <= 0 ? (b.turnIn ? "your current quest — turn it in" : "your current quest") : pl(n, "quest") + " ahead"; };
/* One leaf: a story or level blocker. */
export const leafText = b => b.kind === "level" ? `needs Lv ${b.need}`
  : b.kind === "story" ? `${b.turnIn ? "unlocks after" : "opens on"} "${b.name}" · ${aheadText(b)}` : "";

/* The chain of a node result r, for this evaluation ev: { text, leaf, hop, names } or null when r is open.
   omit: blocker kinds left out (a milestone row leaves out the milestone's own level, which its card already shows).
   leaf: the root blocker shown; hop: the named `done` hop or null; names: every node id the text names (the story
   quest of a story leaf, the hop), for invariant 5 (a blocker text never names something already done). */
export function blockerChain(r, ev, { omit = [] } = {}) {
  const bs = r ? r.blockers.filter(b => !omit.includes(b.kind)) : [];
  if (!bs.length) return null;
  let b = bs[0], hop = null;
  /* through unnamed hops (unlock nodes) to the first named one or a leaf */
  while (b.kind === "done") {
    const y = ev.node(b.of), h = hopNameOf(y);
    if (h) { hop = { id: b.of, ...h }; break; }
    if (!b.chain.length) return null;   /* an open, undone unlock: nothing the player can act on (never in the data) */
    b = b.chain[0];
  }
  if (hop) {
    /* the hop's own root (deeper hops collapse into it: one line, root plus the first hop) */
    let lf = b.chain[0] || null;
    while (lf && lf.kind === "done" && lf.chain.length) lf = lf.chain[0];
    const deep = lf && lf.kind !== "done" ? lf : null;
    return { text: deep ? `after "${hop.name}" (${leafText(deep)})` : `after "${hop.name}" ${hop.verb}`, leaf: deep, hop,
      names: [hop.id, ...(deep && deep.kind === "story" ? [deep.quest] : [])] };
  }
  return { text: leafText(b), leaf: b, hop: null, names: b.kind === "story" ? [b.quest] : [] };
}
export const blockerText = (r, ev, opts) => { const x = blockerChain(r, ev, opts); return x ? x.text : ""; };
