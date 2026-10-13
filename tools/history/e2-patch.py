#!/usr/bin/env python3
"""E2 code/text patch: backup-v287-pre-E2.html -> assassin-route.html (then gen.py + apply.py add the data block).

Reproduce E2 from scratch:
  cp backup-v287-pre-E2.html assassin-route.html && python3 -I polish/e2/patch.py && python3 -I polish/e2/gen.py && python3 -I polish/e2/apply.py
Every replacement must match exactly once (else the script stops), so a drifted input never half-applies.
"""
import os, re, sys, json
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
page = os.path.join(ROOT, "assassin-route.html")
h = open(page, encoding="utf-8").read()
claims = {c["id"]: c for c in json.load(open(os.path.join(ROOT, "data/claims.json"), encoding="utf-8"))}
if "E2-GEN START" in h or "rqAvail" in h:
    sys.exit("already patched: start from backup-v287-pre-E2.html")

def R(old, new, n=1):
    global h
    c = h.count(old)
    if c != n: sys.exit(f"expected {n} match(es), found {c}:\n{old[:200]}")
    h = h.replace(old, new)

def RX(pat, new, n=1, flags=re.S):
    global h
    hs = re.findall(pat, h, flags)
    if len(hs) != n: sys.exit(f"regex expected {n}, found {len(hs)}: {pat[:120]}")
    h = re.sub(pat, new, h, flags=flags)

NT = lambda cid: claims[cid]["newText"]          # V1's exact replacement text
ED = lambda cid, i: claims[cid]["edits"][i]["new"]

# ============================================================== 1. regional quests
# The hand-seeded RQ table is replaced by the generated one (E2-GEN block).
RX(r"/\* Regional quests: one table \(E1, Oct 2026\).*?\n\];\nconst RQ_BY", "const RQ_BY")
# quests(): rows are placed by recommended level at runtime (see "Regional quests into their milestones" below).
R('''/* A milestone's regional quests, by name; everything else comes from RQ. Availability is the quest's own rec level. */
const quests = (label, names) => [{ ...sub(`Regional quests · ${label} ${T("", "regional")}`), group: "quest" }, ...names.map(n => { const q = RQ_BY[n];
  return { kind: "quest", name: n, k: "rq:" + q.id, lv: q.rec, q, t: `<b>${n}</b><span class="loc">${qMap(q)}${q.after ? `<br>Appears after <em>${q.after}</em> is turned in` : ""}${q.reward ? `<br>Reward: <em>${q.reward}</em>` : ""}</span>` }; })];''',
'''/* What opens a regional quest, in the row's second line: unlock level (if above 10), the story quest, earlier regional quests. */
/* inGroup: the group heading already says it (story quest or unlock level), so the row doesn't repeat it. */
const rqReqTxt = (q, inGroup) => { const xs = [q.unlocksAt > 10 && !inGroup ? `at Lv ${q.unlocksAt}` : "", q.story && !inGroup ? `once the story reaches <em>${q.story}</em>` : "",
  q.after.length ? `after ${q.after.map(n => `<em>${n}</em>`).join(" and ")} ${q.after.length > 1 ? "are" : "is"} turned in` : ""].filter(Boolean);
  return xs.length ? `<br>Opens ${xs.join(", ")}` : ""; };
/* A regional quest row (key "rq:" + id, so where it sits never touches its ticks). lv = recommended level. */
const rqItem = (q, inGroup) => ({ kind: "quest", name: q.name, k: "rq:" + q.id, lv: q.rec, q, ...(q.story ? { story: q.story } : {}),
  t: `<b>${q.name}</b><span class="loc">${qMap(q)}${rqReqTxt(q, inGroup)}${q.reward ? `<br>Reward: <em>${q.reward}</em>` : ""}</span>` });
/* Open in game? Its unlock level, the main story at or past its story quest, and (pre = still to turn in) the regional
   quests before it. Quests you've already picked up or turned in count as open whatever the data says. */
const storyIdx = n => QUESTS.findIndex(([, q]) => q === n);
const rqAvail = (q, lv = state.level) => {
  if (lv < (q.unlocksAt || q.rec)) return { open: false, ok: false, pre: [] };
  if (q.story) { const at = storyIdx(q.story), cur = state.quest ? storyIdx(state.quest) : -1; if (at >= 0 && (cur < 0 || cur < at)) return { open: false, ok: false, pre: [] }; }
  const pre = q.after.filter(n => !state.checks["rq:" + RQ_BY[n].id]);
  return { open: true, ok: !pre.length, pre };
};''')
# GATES: drop the hand-placed quest groups.
RX(r"\n[ \t]*\.\.\.quests\(\"[^\"]*\", \[[^\]]*\]\),", "", n=14)
# Place them after GATES is final (after the skill-only milestones are pushed and sorted).
R('''GATES.sort((a, b) => a.lv - b.lv);
''', '''GATES.sort((a, b) => a.lv - b.lv);
/* Regional quests into their milestones: the highest milestone at or below the quest's recommended level, grouped under
   "Regional quests · Lv N". A group of more than 8 splits by what opens it (story quest, unlock level). */
{ const why = q => q.story ? `after "${q.story}"` : q.unlocksAt > 10 ? `opens at Lv ${q.unlocksAt}` : "";
  const byGate = new Map();
  RQ.forEach(q => { const g = [...GATES].reverse().find(x => x.lv <= q.rec) || GATES[0]; if (!byGate.has(g)) byGate.set(g, []); byGate.get(g).push(q); });
  byGate.forEach((qs, g) => [...new Set(qs.map(q => q.rec))].sort((a, b) => a - b).forEach(r => {
    const grp = qs.filter(q => q.rec === r), parts = grp.length > 8 ? [...new Set(grp.map(why))] : [null];
    parts.forEach(p => { const xs = p == null ? grp : grp.filter(q => why(q) === p);
      g.items.push({ ...sub(`Regional quests · Lv ${r}${p ? " · " + p : ""} ${T("", "regional")}`), group: "quest" }, ...xs.map(q => rqItem(q, !!p))); }); })); }
''')
# Follow-up snoozes clear when any quest before it is turned in.
R('''GATES.forEach(g => g.items.forEach(x => { if (x.kind === "quest" && x.q.after === it.name) delete state.rqSnooze[x.k]; }));''',
  '''GATES.forEach(g => g.items.forEach(x => { if (x.kind === "quest" && x.q.after.includes(it.name)) delete state.rqSnooze[x.k]; }));''')
# Milestone rows: quests that aren't open yet are dimmed (like skill lines above your level) and can't be snoozed.
R('''    const zb = li.querySelector(":scope > .q-snz"), zz = !!(state.rqSnooze || {})[k];
    if (zb) { zb.hidden = !!state.checks[k] || run; zb.setAttribute("aria-pressed", String(zz)); zb.textContent = zz ? "Not in game yet · undo" : "Not in game yet"; }''',
'''    const zb = li.querySelector(":scope > .q-snz"), zz = !!(state.rqSnooze || {})[k], it = itemByK(k), shut = !state.checks[k] && !run && !!it && !rqAvail(it.q).ok;
    li.classList.toggle("locked", shut);
    if (zb) { zb.hidden = !!state.checks[k] || run || shut; zb.setAttribute("aria-pressed", String(zz)); zb.textContent = zz ? "Not in game yet · undo" : "Not in game yet"; }''')

# Next up: open = unlock level + story reached; follow-ups (regional prerequisite still open) sit under their prerequisite.
R('''  const rqAll = []; GATES.forEach(g => g.items.forEach(it => { if (it.kind !== "quest" || it.hidden || it.lv > lv || (state.hideOpt && it.opt)) return;
    const k = it.k; rqAll.push({ k, g, it, done: !!state.checks[k], run: !state.checks[k] && qProg(k) > 0 }); }));
  /* A follow-up isn't available until its first part is turned in. */
  rqAll.forEach(x => { const pre = x.it.q.after, p = pre && rqAll.find(y => y.it.name === pre); x.lock = !x.done && !x.run && !!p && !p.done; x.pre = pre; x.snz = !x.done && !x.run && x.k in snz; });''',
'''  const rqAll = []; GATES.forEach(g => g.items.forEach(it => { if (it.kind !== "quest" || it.hidden) return;
    const k = it.k, done = !!state.checks[k], run = !done && qProg(k) > 0, av = rqAvail(it.q, lv);
    if (!done && !run && !av.open) return; /* below its unlock level, or the story isn't there yet */
    rqAll.push({ k, g, it, done, run, pre: done || run ? [] : av.pre }); }));
  /* A follow-up isn't available until the quests before it are turned in. */
  rqAll.forEach(x => { x.lock = x.pre.length > 0; x.snz = !x.done && !x.run && x.k in snz; });''')
R('''  const rqOpen = rqAll.filter(x => !x.done && !x.snz), rqRun = rqOpen.filter(x => x.run).length, rqLock = rqOpen.filter(x => x.lock).length, rqNew = rqOpen.length - rqRun - rqLock;''',
'''  const rqOpen0 = rqAll.filter(x => !x.done && !x.snz);
  /* A locked follow-up shows only under a prerequisite that is itself shown (open, not snoozed). */
  const parentOf = x => x.pre.find(n => rqOpen0.some(y => !y.lock && y.it.name === n));
  const rqOpen = rqOpen0.filter(x => !x.lock || parentOf(x)), rqRun = rqOpen.filter(x => x.run).length, rqLock = rqOpen.filter(x => x.lock).length, rqNew = rqOpen.length - rqRun - rqLock;''')
R('''      const isRoot = x => !(x.pre && rqOpen.some(y => y.it.name === x.pre));
      const roots = rqOpen.filter(isRoot); /* milestone order, so rows don't jump when you tick one */
      const line = (x, fu) => { const n = x.it.name, q = x.it.q, id = q.id, st = (x.run ? "In progress" : x.lock ? `Unlocks when ${x.pre} is turned in` : "Not picked up") + (q.zone ? ` · ${q.zone}` : "") + (q.kib ? ` · Kibelisk: ${q.kib}${q.m ? ` (${q.m} m)` : ""}` : "");
        const label = id && !x.lock ? `<a href="https://metabot.gg/en/aion-2/map/altgard?focus=quest:${id}" target="_blank" rel="noopener" title="${n} · ${st} · Lv ${q.rec} · show on the map">${n}</a>` : `<span title="${n} · ${st} · Lv ${q.rec}">${n}</span>`;''',
'''      const roots = rqOpen.filter(x => !x.lock); /* milestone order, so rows don't jump when you tick one */
      const preTxt = x => x.pre.join(" and ") + (x.pre.length > 1 ? " are" : " is");
      const line = (x, fu) => { const n = x.it.name, q = x.it.q, id = q.id, st = (x.run ? "In progress" : x.lock ? `Unlocks when ${preTxt(x)} turned in` : "Not picked up") + (q.zone ? ` · ${q.zone}` : "") + (q.kib ? ` · Kibelisk: ${q.kib}${q.m ? ` (${q.m} m)` : ""}` : "") + (q.xp ? ` · ${fmtXP(q.xp)} XP` : "");
        const label = id && !x.lock ? `<a href="https://metabot.gg/en/aion-2/map/altgard?focus=quest:${id}" target="_blank" rel="noopener" title="${n} · ${st} · Lv ${q.rec} · show on the map">${n}</a>` : `<span title="${n} · ${st} · Lv ${q.rec}">${n}</span>`;
        /* Recommended level above yours: a small level tag, so a hard quest doesn't look like the obvious next pick. */
        const hi = q.rec > lv && !x.run ? `<span class="q-rec" title="Recommended level ${q.rec}">Lv ${q.rec}</span>` : "";''')
R('''        const box = `<button type="button" class="q-cb" data-rqk="${x.k}"${x.lock ? " disabled" : ""} aria-pressed="${x.run ? "mixed" : "false"}" aria-label="${n}: ${x.lock ? "locked" : x.run ? "in progress, mark turned in" : "not picked up, mark picked up"}" title="${x.lock ? `Unlocks when ${x.pre} is turned in` : x.run ? "In progress · click when turned in" : "Click when you pick it up"}"></button>`;''',
'''        const box = `<button type="button" class="q-cb" data-rqk="${x.k}"${x.lock ? " disabled" : ""} aria-pressed="${x.run ? "mixed" : "false"}" aria-label="${n}: ${x.lock ? "locked" : x.run ? "in progress, mark turned in" : "not picked up, mark picked up"}" title="${x.lock ? `Unlocks when ${preTxt(x)} turned in` : x.run ? "In progress · click when turned in" : "Click when you pick it up"}"></button>`;''')
R('''        return `<span class="ql ${x.run ? "run" : x.lock ? "lock" : "new"}${fu ? " fu" : ""}${near ? " near" : ""}">${box}${label}${near ? `<span class="q-near" title="Near your story step (${hereArea})">${MAP_ICO}</span>` : ""}${zz}</span>`; };''',
'''        return `<span class="ql ${x.run ? "run" : x.lock ? "lock" : "new"}${fu ? " fu" : ""}${near ? " near" : ""}">${box}${label}${hi}${near ? `<span class="q-near" title="Near your story step (${hereArea})">${MAP_ICO}</span>` : ""}${zz}</span>`; };''')
R('''      const groups = roots.map(r => { const kids = rqOpen.filter(y => y.pre === r.it.name), need = 1 + kids.length;''',
'''      const groups = roots.map(r => { const kids = rqOpen.filter(y => y.lock && parentOf(y) === r.it.name), need = 1 + kids.length;''')
# "How to get more" tip, Progress card and its jump: open = available now (same rule as Next up).
R('''  let rq = 0; GATES.forEach(g => g.items.forEach((it, j) => { if (it.kind === "quest" && it.lv <= lv && !state.checks[it.k || g.id + ":" + j]) rq++; }));''',
  '''  let rq = 0; RQ.forEach(q => { if (!state.checks["rq:" + q.id] && rqAvail(q, lv).ok) rq++; });''')
R('''  const quests = []; GATES.forEach(g => g.items.forEach((it, j) => { if (it.kind === "quest") quests.push({ k: it.k || g.id + ":" + j, lv: it.lv, g }); }));''',
  '''  const quests = []; GATES.forEach(g => g.items.forEach(it => { if (it.kind === "quest") quests.push({ k: it.k, q: it.q, g }); }));''')
R('''{ key: "quest", name: "Quests", reward: "Wisdom Stone + Daevanion Crystal each", all: quests, behind: quests.filter(x => x.lv <= lv && !state.checks[x.k]) },''',
  '''{ key: "quest", name: "Quests", reward: "Wisdom Stone + Daevanion Crystal each", all: quests, behind: quests.filter(x => !state.checks[x.k] && rqAvail(x.q, lv).ok) },''')
R('''    const g = GATES.find(g => g.items.some((it, j) => it.kind === "quest" && it.lv <= lv && !state.checks[it.k || g.id + ":" + j]))
      || GATES.find(g => g.items.some((it, j) => it.kind === "quest" && !state.checks[it.k || g.id + ":" + j]));''',
'''    const g = GATES.find(g => g.items.some(it => it.kind === "quest" && !state.checks[it.k] && rqAvail(it.q, lv).ok))
      || GATES.find(g => g.items.some(it => it.kind === "quest" && !state.checks[it.k]));''')
# Story chips on quest rows: only while the story is still ahead (passed / current says nothing on a quest row).
R('''    const d = at - cur;
    if (d < 0) chip.textContent = "story: passed";''',
'''    const d = at - cur;
    if (li.classList.contains("qrow")) { chip.textContent = ""; return; } /* quest rows say what opens them in their own text */
    if (d < 0) chip.textContent = "story: passed";''')
# Regional quest tip: counts from the data.
R('''  regional: { h: "Regional quests", b: `<p>Optional side quests (green markers) in Altgard, picked up from the NPC listed. Each is one-time and pays XP, Kina, a Wisdom Stone, a Daevanion Crystal and often an accessory. Most unlock at Lv 10; the level shown is the recommended level, a combat guideline rather than a lock, so you can take one early if the fights are easy.</p>`, src: "Allthings.how, Selphie1999, Elite Grind Lab" },''',
'''  regional: { h: "Regional quests", b: `<p>Optional side quests (green markers) in Altgard, picked up from the NPC listed. Each is one-time and pays XP, Kina, a Wisdom Stone, a Daevanion Crystal and often an accessory.</p><p>${RQ_STATS.at10} of the ${RQ_STATS.n} unlock at Lv 10 and the rest at 45, but ${RQ_STATS.story} also wait for a story quest and ${RQ_STATS.chained} follow an earlier regional quest. Next up lists a quest once all of that is met. The level shown is the recommended level, a combat guideline rather than a lock.</p>`, src: "Metabot quest pages, aion2.gaming.tools, aion2.th.gl, allthings.how" },''')

# ============================================================== 2. story Lv 41-45
R('''  [40,"Fafnite's Whereabouts"],[40,"Exiled Ritualist"],[40,"Healing Herbs"],[40,"Treatment"],[40,"Symbol of Liberation"],
];''', '''  [40,"Fafnite's Whereabouts"],[40,"Exiled Ritualist"],[40,"Healing Herbs"],[40,"Treatment"],[40,"Symbol of Liberation"],
  ...QUESTS_X, /* Lv 41-45: data/story-40-45.json (Metabot) */
];''')
R('''/* Asmodian Hero (main story) quests by level: AION2HUB 1–40, cross-checked 2–9 with allthings.how. */''',
  '''/* Asmodian Hero (main story) quests by level: AION2HUB 1–40, cross-checked 2–9 with allthings.how; 41–45 from Metabot (QUESTS_X). */''')
R('''/* Objectives for each story quest (Metabot quest pages), shown under the current quest. Covered: A New Lead → Symbol of Liberation (Lv 40). */''',
  '''/* Objectives for each story quest (Metabot quest pages), shown under the current quest. Covered: A New Lead → Forgotten Commander (Lv 45). */''')
RX(r'(const QUEST_STEPS = \{"A New Lead".*?\]\};\n)', r'\1Object.assign(QUEST_STEPS, QUEST_STEPS_X); Object.assign(QUEST_LOC, QUEST_LOC_X);\n', n=1)
R('''        if (!nq && state.storyEnd === state.quest) return { ico: "📜", t: "Continue the story in game", sub: `The guide covers the main story to "${state.quest}" (Lv ${QUESTS[qi][0]})`, act: "" };''',
  '''        if (!nq && state.storyEnd === state.quest) return { ico: "📜", t: "Altgard story complete", sub: `Continue in ${STORY_END.region} in game · the guide's story ends at "${state.quest}"`, act: "" };''')
R('''  st.innerHTML = nxt ? row(nxt, STORY_UNLOCKS[nxt[1]] ? `unlocks ${STORY_UNLOCKS[nxt[1]]}` : "") : `<span class="dot"></span><span class="st-name muted">End of the covered story (Lv ${QUESTS[i][0]})</span>`;''',
  '''  st.innerHTML = nxt ? row(nxt, STORY_UNLOCKS[nxt[1]] ? `unlocks ${STORY_UNLOCKS[nxt[1]]}` : "") : `<span class="dot"></span><span class="st-name muted">${state.storyEnd === state.quest ? `Altgard story complete — continue in ${STORY_END.region} in game` : `Last Altgard story quest · turns in at ${STORY_END.place} (${STORY_END.region})`}</span>`;''')

# ============================================================== 3. strongholds
RX(r'const SH_QID = \{ "Graverobber Den".*?"Andsha Forward Base": 2820015 \};', 'const SH_QID = Object.fromEntries(SH_DATA.map(s => [s.name, s.qid]));')
RX(r'/\* Strongholds: all 15 in Altgard, with zone and the level range Metabot\'s map lists \(1–45 = open at any level\)\. \*/\nconst STRONGHOLDS = \[.*?\n\];\nSTRONGHOLDS\.forEach\(\(\[n, area, lo, hi\]\) => AREA_ITEMS\.push\(\{ it: \{ kind: "stronghold", name: n, lo, hi \}, g: null, k: "sh:" \+ mapSlug\(n\), lv: null, area \}\)\);',
   '/* Strongholds: all 15 in Altgard (SH_DATA): zone, the level range Metabot\'s map lists (1–45 = open at any level), nearest Kibelisk. */\n'
   'SH_DATA.forEach(s => AREA_ITEMS.push({ it: { kind: "stronghold", name: s.name, lo: s.lo, hi: s.hi, kib: s.kib, m: s.m }, g: null, k: "sh:" + mapSlug(s.name), lv: null, area: s.zone }));')
R('''if (shOpen.length) acts.push({ bar: `<span class="nsq-bar"><span style="width:${shD / shDone.length * 100}%"></span></span><span class="nsq-barl">${shD}/${shDone.length} strongholds</span>`, ico: "🏰", t: `Run <b>${shPick.it.name}</b>${pinLink(mapFocus(shPick.it))}`, sub: shPick.area !== NO_AREA ? shPick.area + (shPick.area === hereArea ? " (near your story step)" : "") : "", info: `2 Noble Belt Enhance Scrolls each · ${shOpen.length} open`, btn: "Show", act: "areas:sh" });''',
  '''if (shOpen.length) acts.push({ bar: `<span class="nsq-bar"><span style="width:${shD / shDone.length * 100}%"></span></span><span class="nsq-barl">${shD}/${shDone.length} strongholds</span>`, ico: "🏰", t: `Run <b>${shPick.it.name}</b>${pinLink(mapFocus(shPick.it))}`,
    sub: [shPick.area !== NO_AREA ? shPick.area + (shPick.area === hereArea ? " (near your story step)" : "") : "", shPick.it.kib ? `<span class="nw">Kibelisk: ${shPick.it.kib}</span>` : ""].filter(Boolean).join(" · "),
    info: [`${SH_REWARD} each`, shPick.it.kib && shPick.it.m ? `Kibelisk ${shPick.it.kib} is ${shPick.it.m} m away` : "", `${shOpen.length} open`].filter(Boolean).join(" · "), btn: "Show", act: "areas:sh" });''')
R('''/* One-time clear rewards, added when you tick the clear and taken back when you untick it:
   Sealed Dungeon first clear = 2 Wisdom Stones + 2 Daevanion Crystals; regional quest = 1 + 1 (guide sources + Metabot).
   Strongholds aren't included: sources disagree on whether they pay crystals (belt scrolls are what's confirmed). */
const CLEAR_REWARD = k => {
  const a = AREA_ITEMS.find(x => x.k === k); if (a) return a.it.kind === "hideout" ? { st: 2, cr: 2 } : null;''',
'''/* One-time clear rewards, added when you tick the clear and taken back when you untick it:
   Sealed Dungeon first clear = SD_RW (2 Wisdom Stones + 2 Daevanion Crystals at every band); regional quest = its own rw (Metabot).
   Strongholds credit nothing: their pages list no Wisdom Stones or crystals (belt scrolls and Kina only). */
const CLEAR_REWARD = k => {
  const a = AREA_ITEMS.find(x => x.k === k); if (a) return a.it.kind === "hideout" ? SD_RW : null;''')

# ============================================================== 4. dungeons: Kibelisks from data, no XP anywhere
R('''/* Route data (Oct 2026): nearest Kibelisk (teleport) per story quest giver/turn-in (Metabot quest pages), per regional
   quest giver (Metabot/allthings.how), per Sealed Dungeon (allthings.how map pages) and XP per clear where a page states it. */''',
  '''/* Route data (Oct 2026): nearest Kibelisk (teleport) per story quest giver/turn-in (Metabot quest pages). Sealed Dungeon
   entrances: AREA_LOC (generated). */''')
RX(r'\nconst AREA_LOC = \{"Abandoned Archon Jail".*?\};\n', '\n')
R('''    sub: sdSub, info: [`+2 crystals, +2 Wisdom Stones each · ~5 min`, sdL && sdL.kib && sdL.m ? `Kibelisk ${sdL.kib} is ${sdL.m} m away` : "", sdL && sdL.xp ? `${fmtXP(sdL.xp)} XP (exploration)` : "", `${sdOpen.length} open at your level`].filter(Boolean).join(" · "), btn: "Show", act: "areas:" + bandOf(sdPick) } : null;''',
  '''    sub: sdSub, info: [`+${SD_RW.cr} crystals, +${SD_RW.st} Wisdom Stones each · ~5 min`, sdL && sdL.kib && sdL.m ? `Kibelisk ${sdL.kib} is ${sdL.m} m away` : "", `${sdOpen.length} open at your level`].filter(Boolean).join(" · "), btn: "Show", act: "areas:" + bandOf(sdPick) } : null;''')
R('''const fmtXP = n =>''', '''/* XP in regional quest tooltips (dungeon XP isn't shown: only a few pages state it). */
const fmtXP = n =>''')

# ============================================================== 5. build
# 5a. stigma slot plan (DECISIONS 5: Metabot + Skycoach for slots 3/4) and upgrade priority (GamesFuze + Skycoach).
R('''/* Stigma slots 22 / 27 / 32 / 37: the plan's stigma per slot (unverified order; Metabot's differs). The Stigmas card lets you
   pick what you actually equipped (state.stPick); milestone lines, E stack, rotation and Coming up all follow the pick. */
const STIGMA_PLAN = ["Triniel's Dagger", "Illusive Clone", "Savage Fang", "Swift Contract"];''',
'''/* Stigma slots 22 / 27 / 32 / 37. Every stigma is learnable at 22 and fits any slot (data/build.json stigmaRules). Plan: Triniel's
   Dagger and Illusive Clone first (GamesFuze, Skycoach); Swift Contract before Savage Fang (Metabot, Skycoach; GamesFuze reverses
   it). The Stigmas card lets you pick what you actually equipped (state.stPick); milestone lines, E stack, rotation and Coming
   up all follow the pick. */
const STIGMA_PLAN = ["Triniel's Dagger", "Illusive Clone", "Swift Contract", "Savage Fang"];
/* Upgrade plan by name (GamesFuze + Skycoach): Triniel's Dagger to 10, then Illusive Clone toward 20. */
const ST_TARGETS = [["Triniel's Dagger", 10], ["Illusive Clone", 20]];''')
R('''/* Upgrade order: every equipped stigma to 5 (slot order), then each to 10, 15, 20 with slot 1 first. */
function stPlan() {
  const eq = STIGMA_SLOTS().filter(x => state.checks[x.k]), steps = [], cur = {};
  eq.forEach(x => cur[x.name] = stLvOf(x.name));
  [5, 10, 15, 20].forEach(T => eq.forEach(x => { while (cur[x.name] < T) { cur[x.name]++; steps.push({ x, L: cur[x.name], cost: ST_COST(cur[x.name]) }); } }));
  return steps;
}''',
'''/* Upgrade order: ST_TARGETS in turn, for the stigmas you have equipped. Other stigmas stay at level 1 (the plan's sources). */
function stPlan() {
  const eq = STIGMA_SLOTS().filter(x => state.checks[x.k]), steps = [];
  ST_TARGETS.forEach(([n, T]) => { const x = eq.find(y => y.name === n); if (!x) return; for (let L = stLvOf(n) + 1; L <= T; L++) steps.push({ x, L, cost: ST_COST(L) }); });
  return steps;
}''')
R('''  const planTotal = eqN * 75;''', '''  /* Bar: shards in the planned stigmas so far vs the plan's total (learning + each level up to its target). */
  const planTotal = ST_TARGETS.filter(([n]) => slots.some(x => x.name === n && state.checks[x.k])).reduce((t, [, T]) => { let c = 0; for (let L = 1; L <= T; L++) c += ST_COST(L); return t + c; }, 0);''')
R('''  const spentNow = slots.filter(x => state.checks[x.k]).reduce((t, x) => { let c = 0; for (let L = 1; L <= stLvOf(x.name); L++) c += ST_COST(L) || 0; return t + c; }, 0);''',
  '''  const spentNow = ST_TARGETS.filter(([n]) => slots.some(x => x.name === n && state.checks[x.k])).reduce((t, [n, T]) => { let c = 0; for (let L = 1; L <= Math.min(T, stLvOf(n)); L++) c += ST_COST(L) || 0; return t + c; }, 0);''')
R('''  } else hero = `<div class="sphero st-hero"><div class="dvhead"><span class="dvico st-ico done-ico" aria-hidden="true">✓</span><div class="dvtext"><span class="spname">All stigmas at 20</span><small>Past 20 needs Superior Stigma Shards</small></div></div></div>`;''',
  '''  } else hero = `<div class="sphero st-hero"><div class="dvhead"><span class="dvico st-ico done-ico" aria-hidden="true">✓</span><div class="dvtext"><span class="spname">Planned upgrades done</span><small>${ST_TARGETS.map(([n, T]) => `${n} ${T}`).join(" · ")}</small></div></div></div>`;''')
STC = "Plan: Triniel's Dagger to 10, then Illusive Clone toward 20 (GamesFuze, Skycoach); the others stay at 1."
R('''Plan: every equipped stigma to 5, then slot 1 to 10 and 15 first. Costs from one source (Metabot), not yet checked in game.</p></details>''',
  f'''{STC} Costs from Metabot and allthings.how, not yet checked in game.</p></details>''')
R('''<p><b>Plan:</b> every equipped stigma to 5 first, then the slot-1 stigma to 10 and 15 before the others (Metabot's general advice; it gives no Assassin-specific order).</p><p><b>Unverified:</b> one source (Metabot). Check one upgrade tooltip in game.</p>`, src: "Metabot stigma guide" },''',
  f'''<p><b>{STC.split(": ")[0]}:</b> {STC.split(": ", 1)[1]}</p><p>Costs agree in Metabot and allthings.how; check one upgrade tooltip in game.</p>`, src: "Metabot stigma guide, allthings.how, GamesFuze, Skycoach" }},''')
R('''<b>Plan</b>Every equipped stigma to 5, then slot 1 to 10 and 15 first.<span class="tipopen">Costs from one source (Metabot); not yet checked in game.</span>''',
  '''<b>Plan</b>Triniel's Dagger to 10, then Illusive Clone toward 20.<span class="tipopen">Costs from Metabot and allthings.how; not yet checked in game.</span>''')
R('''  stigma: { h: "Stigma", b: `<p>Extra skills that go into special slots, separate from your normal skills. Slots open at 22, 27, 32 and 37, four in total. Level 22's slot unlocks through the quest "One Who Hears the Voice."</p>`, src: "Metabot, PlayNews" },''',
  '''  stigma: { h: "Stigma", b: `<p>Extra skills that go into special slots, separate from your normal skills. Slots open at 22, 27, 32 and 37, four in total. Level 22's slot unlocks through the quest "One Who Hears the Voice." Every stigma can be learned from then on, and any stigma fits any slot.</p>`, src: "Metabot, PlayNews, allthings.how, thegameswiki" },''')
R('''    { k: "g22:1", stig: 1, after: "Daeva in a Dream", t: `<b>Equip ${stn(1)}.</b> Plan: Triniel's Dagger, long-term target skill level 10. <i>Check first:</i> Metabot puts Illusive Clone in slot 1 and Triniel's Dagger last. If Illusive Clone is equippable at 22, pick it in the Stigmas card instead.` },''',
  '''    { k: "g22:1", stig: 1, after: "Daeva in a Dream", t: `<b>Equip ${stn(1)}.</b> Plan: Triniel's Dagger, raised to level 10 first. Any stigma fits any slot; if you equipped another, pick it in the Stigmas card.` },''')
R('''  { id: "g27", lv: 27, title: "Stigma slot 2", blurb: "Illusive Clone goes in.", items: [
    { k: "g27:0", stig: 2, t: `<b>Equip ${stn(2)}.</b> Plan: Illusive Clone, long-term target skill level 20.` },''',
  '''  { id: "g27", lv: 27, title: "Stigma slot 2", blurb: "Second stigma goes in.", items: [
    { k: "g27:0", stig: 2, t: `<b>Equip ${stn(2)}.</b> Plan: Illusive Clone, raised toward level 20 once Triniel's Dagger is at 10.` },''')
R('''  { id: "g32", lv: 32, title: "Stigma slot 3", blurb: "Savage Fang, the macro, and five quests.", items: [
    { k: "g32:0", stig: 3, t: `<b>Equip ${stn(3)}.</b> Plan: Savage Fang. Level 1 is enough for now.` },''',
  '''  { id: "g32", lv: 32, title: "Stigma slot 3", blurb: "Third stigma goes in.", items: [
    { k: "g32:0", stig: 3, t: `<b>Equip ${stn(3)}.</b> Plan: Swift Contract. Level 1 is enough for now.` },''')
R('''  { id: "g37", lv: 37, title: "Stigma slot 4", blurb: "Full rotation online; story dungeon nearby.", items: [
    { k: "g37:0", stig: 4, t: `<b>Equip ${stn(4)}.</b> Plan: Swift Contract. Level 1 is enough for now.` },''',
  '''  { id: "g37", lv: 37, title: "Stigma slot 4", blurb: "Full rotation online; the story takes you into the Fire Temple.", items: [
    { k: "g37:0", stig: 4, t: `<b>Equip ${stn(4)}.</b> Plan: Savage Fang. Level 1 is enough for now.` },''')
R('''/* E follows the stigmas you've actually equipped (Stigmas card); buffs first, then damage. Before any are ticked,
   it falls back to the slot levels. */''',
  '''/* E follows the stigmas you've actually equipped (Stigmas card); buffs first, then damage (the guide's inference, no source
   gives an order). Before any are ticked, it falls back to the slot levels. */''')

# 5b. skill points after the core eight (SP_EXTRA, data/build.json): Skills card + Sync only; no milestone lines, so cleared
#     milestones stay cleared. Flat gates for Defense Break / Determination; no specialty pick (no source picks one).
R('''/* Total skill points granted by character level''', '''/* After the core eight (E2): SP_EXTRA from data/build.json, in its source-backed order (single-source ones flagged). They live in
   the Skills card and Sync levels only, not in milestones, and come after every core upgrade that's open. */
SP_EXTRA.forEach(s => SP_SKILLS.push({ ...s, extra: true }));
/* Total skill points granted by character level''')
R('''    SP_STEPS.push({ k: `sp:${s.n}:${L}`, s, rank, L, req: s.learn + 3 * (L - 2), cost: spCost(L) });
    if (L === 8 && !s.passive) SP_STEPS.push({ k: `sp:${s.n}:spec`, s, rank, L: 8.5, req: s.learn + 18, cost: 0, spec: true });''',
  '''    SP_STEPS.push({ k: `sp:${s.n}:${L}`, s, rank, L, req: s.flat ? s.learn : s.learn + 3 * (L - 2), cost: spCost(L) });
    if (L === 8 && !s.passive && s.spec) SP_STEPS.push({ k: `sp:${s.n}:spec`, s, rank, L: 8.5, req: s.learn + 18, cost: 0, spec: true });''')
R('''/* Fold each skill upgrade into the first milestone at or after its unlock level. */
GATES.forEach((g, i) => {
  const prev = i ? GATES[i - 1].lv : 0;
  const steps = SP_STEPS.filter(x => x.req > prev && x.req <= g.lv);''',
  '''/* Fold each core skill upgrade into the first milestone at or after its unlock level (the extra skills sort after them all). */
SP_STEPS.filter(x => x.s.extra).forEach(x => { x.gi = 1000 + x.rank; x.gj = x.L; });
GATES.forEach((g, i) => {
  const prev = i ? GATES[i - 1].lv : 0;
  const steps = SP_STEPS.filter(x => !x.s.extra && x.req > prev && x.req <= g.lv);''')
R('''    const sub = hero.spec ? hero.s.spec :
      `${locked ? `Lv ${hero.req}` : "Available now"} · priority #${hero.rank + 1}`;''',
  '''    const sub = hero.spec ? hero.s.spec :
      `${locked ? `Lv ${hero.req}` : "Available now"} · priority #${hero.rank + 1}${hero.s.single ? ` · single source (${hero.s.single})` : ""}`;''')
R('''    return `<li class="${x.spec ? "isspec" : ""}" title="${x.spec ? "Specialty: " + x.s.spec : spCostTxt(x)} · ${avail ? "available now" : "Lv " + x.req} · ${short > 0 ? `${short} short by then` : "points covered"}">''',
  '''    return `<li class="${x.spec ? "isspec" : ""}" title="${x.spec ? "Specialty: " + x.s.spec : spCostTxt(x)} · ${avail ? "available now" : "Lv " + x.req} · ${short > 0 ? `${short} short by then` : "points covered"}${x.s.single ? ` · single source (${x.s.single})` : ""}">''')
R('''Each skill gains one level every 3 character levels after you learn it. ''', '')                       # C02 drop
R('''Respec is free until Lv 31.</p>''', NT("C01") + "</p>")                                            # C01
R('''Each milestone lists the upgrades that opened since the last one, in priority order.''',
  '''Each milestone lists the core upgrades that opened since the last one, in priority order; the extra skills after them are in this card only.''')

# 5c. boards: Vaizel / Triniel nodes from data, Ariel removed, path costs labelled as inference.
RX(r'    \{ k: "dv:v:hg".*?\{ k: "dv:v:corner"[^\n]*\n', '    ...dvNodes("Vaizel"),\n')
RX(r'    \{ k: "dv:t:hg".*?\{ k: "dv:t:corner"[^\n]*\n', '    ...dvNodes("Triniel"),\n')
R('''const sub = (label, note) => ({ sub: label, subNote: note });''',
  '''const sub = (label, note) => ({ sub: label, subNote: note });
/* Vaizel / Triniel plan nodes (DV_BOARDS, data/build.json); keys dv:v:* / dv:t:*. */
const dvNodes = b => DV_BOARDS[b].nodes.map(n => ({ k: n.k, dv: true, board: b, blv: DV_BOARDS[b].lv, ty: n.ty, t: n.t, ...(n.via ? { via: n.via } : {}) }));''')
R('''via: "bottom edge; about 3–5 with its path (GamesFuze node pick)" },''', '''via: "bottom edge; path cost inferred, about 3–5 (GamesFuze node pick)" },''')
R('''via: "just above Start; about 3–5 with its path (GamesFuze node pick)" },''', '''via: "just above Start; path cost inferred, about 3–5 (GamesFuze node pick)" },''')
R('''.replace("Critical Damage Boost corner", "Crit Damage corner");''', '''.replace("Critical Damage Boost corner", "Crit Damage corner").replace("Multi-Hit Chance corner", "Multi-Hit corner");''')
R('''  [45, "Level cap", "Abyss, Sanctuary raid, Conquest expeditions, Ariel and Azphel boards", "PlayNews, KeenGamer, Metabot, thegameswiki"],''',
  '''  [45, "Level cap", "Abyss, Ascension Trial, Conquest, Azphel board (PvP stats)", "Metabot, Wikily, GamesFuze, games.gg, thegameswiki, GameWith"],''')
R('''Azphel has no skill nodes and uses Azphel points from PvP shops instead.''', claims["C22"]["edits"][1]["new"])
R('''    { k: "g45:2", ns: `Azphel board opens`, t: `<b>Azphel ${T("Daevanion board", "daevanion")} opens.</b> Stat nodes only, paid with Azphel points from Abyss, arena and battlefield shops, not Daevanion Crystals.` },''',
  '''    { k: "g45:2", ns: `Azphel board opens`, t: `''' + ED("C22", 0) + '''` },''')

# 5d. expeditions: the story sends you in (note, not a gate: they open by level); daily dungeon name only.
R('''t: `<b>Urugugu Canyon ${T("Expedition", "expedition")} (Exploration) opens</b>: needs a party of 2–5 and item level 300.` },''',
  '''t: `<b>Urugugu Canyon ${T("Expedition", "expedition")} (Exploration) opens</b>: needs a party of 2–5 and item level 300.<span class="loc">The story quest "Canyon's Secret" (Lv 30) sends you in.</span>` },''')
R('''t: `<b>Fire Temple ${T("Expedition", "expedition")} (Exploration) opens</b>: 1–5 players, item level 500.` },''',
  '''t: `<b>Fire Temple ${T("Expedition", "expedition")} (Exploration) opens</b>: 1–5 players, item level 500.<span class="loc">The story quest "Mirror of Greed" (Lv 37) sends you in.</span>` },''')
R('''<b>Start the daily dungeon:</b> run Daeva Bio-Research Base for ${I("enhance")}, not the Kinah or pet-fragment dungeons.''',
  '''<b>Start the daily dungeon:</b> run Daeva Bio-Research Base for ${I("enhance")}.''')
R('''  [28, "Urugugu Canyon", "Expedition (Exploration)", "games.gg, PlayNews"],''',
  '''  [28, "Urugugu Canyon", "Expedition (Exploration) · item level 300 · party 2–5", "Metabot, thegameswiki, ExpCarry, allthings.how, games.gg"],''')
R('''  [35, "Fire Temple", "Expedition (Exploration) · item level 500", "PlayNews, thegameswiki, Wikily"],''',
  '''  [35, "Fire Temple", "Expedition (Exploration) · item level 500", "Metabot, thegameswiki, Wikily, ExpCarry"],''')
R('''  [25, "Supply Requests", "Hand in items for Abyss Points", "Metabot, Inven"],''', '''  [25, "Supply Requests", "Hand in items for Abyss Points", "Metabot, allthings.how"],''')
R('''then Urugugu Canyon 28 and Fire Temple 35 (listed levels, not yet checked against the story) and pays rewards 7 times per dungeon each week. Conquest mode opens at 45.''',
  '''then Urugugu Canyon 28 and Fire Temple 35 (the story quests "Canyon's Secret" and "Mirror of Greed" send you into them). ''' + NT("C11") + ''' Conquest mode opens at 45.''')
R('''`, src: "Metabot dungeon guide, AION2 Wiki" },''', '''`, src: "Metabot dungeon guide, thegameswiki, ExpCarry, allthings.how, KeenGamer, games.gg" },''')

# ============================================================== 6. claims (data/claims.json), in id order
R('''<b>Experiment freely until 31.</b> ${T("Respec is free", "respec")} until then; lock in the build by 31.''', ED("C01", 1).replace("<b>", "<b>", 1))  # C01
R('''blurb: "Hero quests are ~99% of Asmodian XP to 45."''', 'blurb: "' + NT("C04") + '"')                                   # C04
R('''t: `<b>Ascension Trial timing.</b> Days before reset: reach item level 1,500 first. Reset close: run it at 1,000 rather than waste the week.` },''',
  't: `' + NT("C06") + '` },')                                                                                              # C06
R('''    { k: "g45:4", ns: `Spend Abyss Points on upgrades`, t: `<b>Abyss Points</b> on Potential Stones, Stigma Shards and Daevanion resources, not a shop gear set.` },''',
  '''    { k: "g45:4", ns: `Abyss Points: Stigma Shards first`, t: `''' + NT("C07") + '''` },''')                         # C07
R('''<p><b>At 45:</b> Krao Cave Normal needs gear score 700.</p>''', ED("C08", 0))                                           # C08
R('''<b>Start Conquest</b> (Krao Cave tier, ${T("gear score", "gearscore")} 700). Weapon first, then your weakest slots.''',
  ED("C08", 1).replace("item level 700", '${T("item level", "gearscore")} 700'))
R('''Content like Krao Cave has a minimum (700 for Normal).''', '''Content like Krao Cave has a minimum (item level 700 for Conquest at 45).''')
R('''  shugo: { h: "Shugo Festival", b: `<p>An hourly set of minigames (races, jumping, memory tiles). Rewards scale with your level, and claiming one uses a limited key that recharges only once a day. Keys are worth far more at 45, so skip it while leveling.</p>`, src: "MeinMMO" },''',
  '''  shugo: { h: "Shugo Festival", b: `''' + ED("C09", 0) + '''`, src: "''' + claims["C09"]["edits"][0]["src"] + '''" },''')  # C09
R('''    { k: "g45:1", ns: `Spend your banked Shugo Festival keys`, t: `<b>Spend your banked Shugo Festival keys.</b>` },\n''', '')     # C09 drop
R('''      { k: "hold:0", t: `<b>${T("Shugo Festival", "shugo")}.</b> Rewards scale with level and keys are limited. Bank them.` },\n''', '')  # C09: "bank them" is the same wrong claim
R('''note: "Same quest unlocks the Shugo Festival. Leave the festival alone." },''', '''note: "Same quest unlocks the Shugo Festival." },''')   # C09
R('''    { k: "g37:2", ns: `Story dungeon around Lv 37`, t: `<b>Story dungeon around Lv 37.</b> If it stops you, enhance your weapon first; otherwise keep saving.` },''',
  '''    { k: "g37:2", ns: `"Mirror of Greed": the Fire Temple run`, story: "Mirror of Greed", t: `''' + NT("C10") + '''` },''')  # C10
R('''That pays 2 Noble Belt Enhance Scrolls and 15,000 Kina (some add a title). Belt scrolls come from nowhere else, and the belt is permanent, so clear every one.''', NT("C13"))  # C13
R('''Belt enhance scrolls come only from Strongholds (2 each); both are in Dungeons & Strongholds.''',
  '''Strongholds are the main source of belt enhance scrolls (2 each); both are in Dungeons & Strongholds.''')             # C13
R('''      { k: "daily:1", t: `<b>${T("Duty Quests", "duty")}</b> (Lv 45): 5 a day per server from the Journal's Duty tab. Reroll toward ${I("cubekey")} and Enhancement Stones.` },''',
  '''      { k: "daily:1", t: `''' + ED("C15", 0) + '''` },''')                                                         # C15
RX(r'  duty: \{ h: "Duty Quests", b: `.*?`, src: "[^"]*" \},', '  duty: { h: "Duty Quests", b: `' + ED("C15", 1) + '`, src: "' + claims["C15"]["edits"][1]["src"] + '" },')
RX(r'  supply: \{ h: "Supply Requests \(보급 의뢰\)", b: `.*?`, src: "[^"]*" \},', '  supply: { h: "Supply Requests (보급 의뢰)", b: `' + NT("C16") + '`, src: "Metabot, allthings.how, KeenGamer, games.gg, MeinMMO" },')  # C16
R('''<b>Cash shop is cosmetic</b> (outfits, wings, pets, weapon skins); NCSoft says no stats. Nothing in this guide needs it.''', NT("C18"))  # C18
R('''      { k: "daily:3", t: `<b>Weekly Command scrolls</b> from the capital's Command vendor once you find it. Reroll if rewards lack keys or fragments.`, note: "No source gives an unlock level." },''',
  '''      { k: "daily:3", t: `''' + NT("C19") + '''`, note: "No source gives an unlock level." },''')                   # C19
# C20 stat tiers
R('''/* Assassin stat tiers: overlap of Metabot class builds, Skycoach Assassin guide and Odealo stats guide (orders differ). */
const STAT_TIERS = [["Attack", "Critical Hit", "Back Attack Damage Boost"], ["Accuracy", "Critical Damage Boost"], ["Double Chance", "Combat Speed"]];
/* Where each stat comes from: board stat nodes/corners (player's board, Metabot corners) or gear. Back Attack and Double Chance weren't on any board path. */
const STAT_SRC = { "Critical Hit": "BG", "Back Attack Damage Boost": "G", "Attack": "BG", "Accuracy": "BG", "Critical Damage Boost": "BG", "Double Chance": "G", "Combat Speed": "BG" };''',
  '''/* Assassin stat tiers (data/claims.json C20): Critical Hit is top in Metabot, games.gg and GamesFuze; tier 2 = stats exactly two of them
   rank high. Stats only one ranks (Accuracy, Critical Damage Boost, Double Chance) are left out. */
''' + ED("C20", 1) + '''
/* Where each stat comes from: board stat nodes/corners (player's board, Metabot corners) or gear. Back Attack wasn't on any board path. */
''' + ED("C20", 2))
R('''<p class="fine tline">B board · G gear. Exact order varies by source; tiers are where they agree.</p>''', ED("C20", 0))
# C21 macro text: no "Quick Use 2" (not sourced), no delay values (unsourced)
R('''press right click and confirm moving it from Quick Use 2 (only in the current control mode, not AION 1 mode).''',
  '''press right click and confirm moving it from its current key (only in the current control mode, not AION 1 mode).''')
R('''<li><b>Make the macro:</b> K → Macro (top right) → Add Macro. Step 1 = Quick Use 2 (the right-click stack), delay 10 ms. Raise to 30–50 ms only if ready skills get skipped.</li>''',
  ED("C21", 0).replace("Step 1 = Quick Use 2 (the right-click stack).", "Step 1 = the right-click macro slot (the right-click stack)."))
R('''<p class="fine tline">Row order is my inference''', '''<p class="fine tline">Row order and the E stack are the guide's inference''')
# C23 / C24 belt and amulet
R('''note: "Belt and amulet to +10 (Rare) cost about 232,000 Kina and 9,280 Enhance Stones each. Later, Substance Morph moves one up a tier and resets it to +0; that's a Lv 45 Kina sink." },''',
  '''note: "''' + NT("C23") + '''" },''')
R('''use each one right away (+1, plus Enhance Stones and Kina, 100% success).''', '''use each one right away (+1, plus Enhance Stones and Kina).''')
# C25 traces
R('''    <p>You can carry them from the start, but you can only use them after the Lv 16 story quest "Empyrean Monolith." Then go to a Monolith (Safe Haven or Nornir Assembly), interact and press <b>Resonate</b>. That raises the Monolith's Resonance level (up to 30) for Amulet Enhance Scrolls, Amplify Stone fragments, titles and Soul Codex resets. At Resonance 30, extra feathers convert to Power Shards.</p>''',
  '''    ''' + NT("C25"))
# C28 confidence card: rebuilt from CONF (generated); Sources card from SOURCES.
RX(r'(<details class="card notes foldcard" id="confCard">\s*<summary><h2>Confidence</h2></summary>).*?(</details>)',
   r'\1\n      <div id="confBody"></div>\n    \2')
RX(r'(<details class="card foldcard" id="srcCard">\s*<summary><h2>Sources</h2></summary>).*?(</details>)',
   r'\1\n      <div id="srcBody"></div>\n    \2')
R('''/* Confidence and Sources fold; open state remembered. */''',
  '''/* Confidence and Sources, from CONF and SOURCES (generated from data/*.json). Links are plain links (Metabot asks for that). */
function renderSources() {
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  document.getElementById("confBody").innerHTML = CONF.map(c => `<p><b>${c.g}</b> · ${c.sub}</p><ul class="conf">${c.items.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`).join("");
  document.getElementById("srcBody").innerHTML = `<p class="fine src-intro">Every value in the guide comes from one of these pages (${SOURCES.reduce((t, g) => t + g.links.length, 0)} links). Metabot data is used with credit: each item links to its Metabot page.</p>` +
    SOURCES.map(g => `<details class="mini srcg"><summary>${g.t} · ${g.links.length}</summary><ul class="sources">${g.links.map(([u, l]) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(l)}</a></li>`).join("")}</ul></details>`).join("");
}
renderSources();
/* Confidence and Sources fold; open state remembered. */''')
# CSS for the rebuilt cards (same type scale as .notes / .sources)
R('''.sources li { margin-bottom: 6px; break-inside: avoid; }''',
  '''.sources li { margin-bottom: 6px; break-inside: avoid; }
.conf { margin: -4px 0 4px; padding-left: 18px; display: grid; gap: 4px; font-size: 13px; color: var(--muted); }
#srcBody { display: grid; gap: 8px; }
#srcBody .src-intro { margin: 0; }
.srcg[open] summary { margin-bottom: 8px; }
.q-rec { margin-left: 6px; font: 600 10.5px var(--mono); color: var(--muted); white-space: nowrap; }''')

# Respec text in the confidence card is generated; the respec tip already states the dispute (C01: keep).
open(page, "w", encoding="utf-8").write(h)
print("patched", page)

# Quest rows carry no story chip (their text says what opens them), so the auto line names both.
h = open(page, encoding="utf-8").read()
R('''Unlocks the steps marked with a story chip below.''', '''Opens the steps with a story chip and the regional quests below that wait for it.''')
open(page, "w", encoding="utf-8").write(h)
