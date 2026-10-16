/* The 0.2 gate rules, frozen (0.3 E2). Until E2 these lived as inline code in src/core/requirements.js,
   src/core/nextup.js and src/main.js; since E2 the app asks the evaluator (src/core/requirements.js gatesOf, with the
   named KEPT_RULES). This is a copy, taken from those files at d83a144, and the reference that
   tests/equiv/evaluator-equivalence.test.mjs holds both the bare evaluator and the wired app functions to.

   Being a copy, it does not follow the app: a later change in src/ is seen only where it changes what the wired
   functions return for the golden states. An inline comparison that bypasses those functions (in main.js, say) is not
   seen here at all; the source check (tests/core/gate-sources.test.mjs) is what catches that. The main.js rules below
   (Areas "behind" / "later", Progress, Stigmas card, Daevanion card, story chips and "Reach …" row) are reimplemented
   from main.js as it was, since main.js can't run in Node; the app side of the comparison is the requirements.js
   function main.js calls since E2.

   M = the core bundle (tests/support/core-bundle.mjs). */
export const gates02 = M => {
  const { QUESTS, RQ_BY, SP_STEPS, DV_NODES, cardRows, itemByK, qProgOf, char, bandOf } = M;
  const storyIdx = n => QUESTS.findIndex(([, q]) => q === n);
  const questIdx = c => c.quest ? storyIdx(c.quest) : -1;

  /* requirements.js */
  /* E9 (2026-10-15, owner check 1): Shugo-of-All-Trades and Spooky Specters gained a story gate in the data (their row now has
     story + no noPre). 0.2 had neither, so the frozen rules see them as they were; the page does the same with the switch
     regionalTurnedIn off (src/core/requirements.js APP_GRAPH_0_2). Nothing else of the frozen rules changes. */
  const NEW_RQ_GATE = new Set(["2202044", "2202051"]);
  const rq0 = q => NEW_RQ_GATE.has(q.id) ? { ...q, story: null, noPre: 1 } : q;
  const rqOpenLv = q => (q = rq0(q)).noPre ? Math.max(q.unlocksAt || 0, q.rec) : (q.unlocksAt || q.rec);
  const rqStatus = (c, q, lv = c.level) => {
    q = rq0(q);
    if (lv < rqOpenLv(q)) return { open: false, ok: false, pre: [] };
    if (q.story) { const at = storyIdx(q.story), cur = c.quest ? storyIdx(c.quest) : -1; if (at >= 0 && (cur < 0 || cur < at)) return { open: false, ok: false, pre: [] }; }
    const pre = q.after.filter(n => !c.checks["rq:" + RQ_BY[n].id]);
    return { open: true, ok: !pre.length, pre };
  };
  function openSteps(state, g) {
    const c = char(state), cur = c.quest ? QUESTS.findIndex(([, n]) => n === c.quest) : -1, out = [];
    cardRows(g).forEach(({ it: row, k }) => {
      if (c.checks[k]) return;
      const rq = row.kind === "quest";
      const it = itemByK(k);
      if (rq && !(qProgOf(c, k) > 0) && it && !rqStatus(c, it.q).ok) return;
      if (/^(sp|dv):/.test(k) || (row.opt && !(it && it.adv))) return;
      if (it && (it.stig || it.eput)) return;
      if (it && it.byStory && it.story === c.quest) return;
      const need = (rq && row.q && NEW_RQ_GATE.has(row.q.id) ? null : row.story) || row.after;
      if (need) { const at = QUESTS.findIndex(([, n]) => n === need); if (at >= 0 && (cur < 0 || at > cur)) return; }
      if (it && it.turnedIn) { const at = QUESTS.findIndex(([, n]) => n === it.turnedIn); if (at >= 0 && !(cur > at || (cur === at && c.storyEnd === it.turnedIn))) return; }
      if (it && it.byStory) { const at = QUESTS.findIndex(([, n]) => n === it.story); if (at >= 0 && cur > at) return; }
      out.push({ k, it, row, rq, adv: !!(it && it.adv) });
    });
    return out;
  }
  const skillOpen = (c, lv = c.level) => { const open = SP_STEPS.filter(x => !c.checks[x.k]).sort((a, b) => a.gi - b.gi || a.gj - b.gj); return { open, now: open.filter(x => x.req <= lv) }; };
  const skillLearned = (name, lv) => SP_STEPS.some(x => x.s.n === name && x.L === 2 && x.req <= lv);
  const dvNext = (c, lv) => DV_NODES().find(it => !c.checks[it.k] && it.blv <= lv);
  /* rotKeys: a slot's stigma counts at lv from the slot's level */
  const slotAt = (sl, lv) => lv >= sl.lv;

  /* nextup.js */
  /* stigma equip card (and the Stigmas card's equip hero in main.js): slot level + "g22:0" ticked, every slot */
  const stigmaEquip = (c, sl) => sl.lv <= c.level && !!c.checks["g22:0"];
  /* Sealed Dungeons / strongholds offered (and main.js "behind", Progress, Areas jump) */
  const areaOpen = (c, x) => x.it.kind === "stronghold" ? bandOf(x) <= c.level && (x.it.lo || 0) <= c.level : x.lv <= c.level;
  /* regional quest waiting on the story (not ticked or picked up: the caller's part) */
  const rqWait = (c, q, lv = c.level) => !(!rq0(q).story || q.rec > lv || lv < rqOpenLv(q) || rqStatus(c, q, lv).open);
  /* story card: level-gated on the current quest's recommended level, never on the first quest */
  const storyGated = c => { const qi = questIdx(c), gateLv = qi > 0 ? QUESTS[qi][0] : 0; return { qi, gateLv, gated: gateLv > c.level }; };
  /* "Meanwhile": Krao Cave also needs "Daeva in a Dream" (qi ≥ 0 there: the card is level-gated) */
  const kraoStory = c => questIdx(c) >= storyIdx("Daeva in a Dream");
  const skillLater = (c, x) => x.req > c.level;

  /* main.js */
  const areaLater = (c, x) => x.it.kind === "stronghold" ? x.it.lo > c.level : x.lv > c.level;
  const stigmaRow = (c, sl) => sl.lv <= c.level && (sl.n > 1 || !!c.checks["g22:0"]);
  const stigmaUnlocked = c => !!c.checks["g22:0"];
  const dvWindow = c => !(c.level < 12);
  const dvBoardOpen = (c, board) => !(Math.min(...DV_NODES().filter(n => n.board === board).map(n => n.blv)) > c.level);
  const planOpen = (c, it) => !(it.blv > c.level);
  const skillLineLocked = (c, x) => +x.req > c.level;
  /* "Reach <quest> in the main story" row: d = quests ahead (null: story unset), ok = reached */
  const reachRow = (c, name) => { const cur = questIdx(c), at = storyIdx(name), d = cur < 0 ? null : at - cur; return { ok: d != null && d <= 0, d }; };
  /* story chip text on a story-gated step */
  const chip = (c, name) => { const cur = questIdx(c), at = storyIdx(name); if (cur < 0 || at < 0) return ""; const d = at - cur;
    return d < 0 ? "story: passed" : d === 0 ? "your current quest" : `${d} story quest${d === 1 ? "" : "s"} ahead`; };

  return { storyIdx, rqOpenLv, rqStatus, openSteps, skillOpen, skillLearned, dvNext, slotAt, stigmaEquip, areaOpen, rqWait, storyGated, kraoStory, skillLater,
    areaLater, stigmaRow, stigmaUnlocked, dvWindow, dvBoardOpen, planOpen, skillLineLocked, reachRow, chip };
};
