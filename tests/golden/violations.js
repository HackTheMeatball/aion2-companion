/* Golden master: known-violations report (writes tests/golden/KNOWN-VIOLATIONS.md; see tests/golden/README.md).

   A violation = Next up offers an actionable step (a primary button) whose gate isn't met, judged from the recorded
   snapshot and the state after load, independently of the app's own filtering:
     level-gate     the step's milestone (or skill upgrade) is above the character's level
     story-gate     the step names a story quest ("story" field) that the story hasn't reached yet
     done-by-story  the step is "complete story quest X" and the story is already past X, but it isn't ticked
                    (the app only ticks these on its own "Turned in" click; setting the story by hand skips that)
     oracle-gate    a gate from ORACLE below, checked whether or not the app models it (the ascension hotfix's gates)
   The file is generated, so a fix shows up as a golden diff plus a shorter list. */
'use strict';

/* Gates checked independently of the app (the gate table). They match the ascension hotfix (PR #2, fix/ascension-gates):
     story     the story has reached X (current quest index >= X), like "story"/"after" in the app's stepsOf
     turnedIn  X is turned in: the story is past X, or X is the current quest and storyEnd === X ("Turned in" on the last
               covered quest)
   byStory steps (story quests themselves) are the done-by-story kind above, not oracle entries. Once the app models a
   gate the entry stays and simply finds nothing. */
const ORACLE = {
  'g32:dreams': { story: 'A Daeva Dreaming Anew', why: 'hotfix: "The One Who Dreams" waits for the story to reach "A Daeva Dreaming Anew" (claims C36)' },
  'g45:witness': { turnedIn: 'Forgotten Commander', why: 'hotfix: "The One Who Witnesses the Nightmare" needs "Forgotten Commander" turned in (claims C37)' },
};

/* Unmet parts of an ORACLE entry for a save (cur = current story index, st = the stored state), as reasons. */
function oracleMisses(o, cur, st, qIdx, ck) {
  const why = [];
  if (o.story) { const at = qIdx(o.story); if (at >= 0 && cur < at) why.push(`story not at "${o.story}" yet`); }
  if (o.turnedIn) { const at = qIdx(o.turnedIn); if (at >= 0 && !(cur > at || (cur === at && st.storyEnd === o.turnedIn))) why.push(`"${o.turnedIn}" not turned in`); }
  const miss = (o.done || []).filter(d => !ck[d]); if (miss.length) why.push(`not done: ${miss.join(', ')}`);
  return why;
}

function findViolations(C, states, results) {
  const qIdx = n => C.quests.findIndex(q => q[1] === n);
  const items = new Map(C.gates.flatMap(g => g.items.map(it => [it.k, it])));
  const sp = C.sp, out = [];
  for (const s of states) {
    const r = results[s.id]; if (!r || !r.nu) continue;
    let st = null; try { st = JSON.parse(r.storedRaw != null ? r.storedRaw : s.raw); } catch { }
    if (!st || typeof st !== 'object') st = {};
    const lv = st.level != null ? st.level : 5, cur = st.quest ? qIdx(st.quest) : -1, ck = st.checks || {};
    r.nu.forEach((c, rank) => {
      const m = /^primary "[^"]*" (\S+)/.exec(c.c || ''); if (!m) return;
      const act = m[1], add = (kind, key, why) => out.push({ id: s.id, lv, quest: st.quest || '', cur, rank, kind, key, title: c.t, why });
      if (act.startsWith('tick:')) {
        const k = act.slice(5), it = items.get(k); if (!it) return;
        if (it.lv > lv) add('level-gate', k, `milestone Lv ${it.lv} > level ${lv}`);
        if (it.story) { const at = qIdx(it.story);
          if (at >= 0 && cur < at) add('story-gate', k, `story not at "${it.story}" yet`);
          /* "story" is overloaded: the step IS that story quest (byStory, or its title names it: g6:0) or is only gated by
             it (g22:0, an Asahr quest after "Daeva in a Dream"). Only the first kind is done once the story is past it. */
          else if (at >= 0 && cur > at && !ck[k] && (it.byStory || it.ns.includes(`"${it.story}"`))) add('done-by-story', k, `story is past "${it.story}"`); }
        const o = ORACLE[k];
        if (o) { const why = oracleMisses(o, cur, st, qIdx, ck); if (why.length) add('oracle-gate', k, why.join('; ')); }
      } else if (act === 'skill') {
        /* a specialty slot opens on effective skill level, not character level (0.3 E7): the invariant suite's oracle judges it */
        const mm = /^Buy (.+) (\d+) → (\d+)$/.exec(c.t); if (!mm) return;
        const x = sp.find(y => y.n === mm[1] && y.L === +mm[3]);
        if (x && x.req > lv) add('level-gate', x.k, `skill step needs Lv ${x.req}`);
      }
    });
  }
  return out;
}

function renderReport(C, violations, nStates) {
  const qName = i => i < 0 ? '(none)' : C.quests[i][1];
  const groups = new Map();
  for (const v of violations) { const g = v.kind + '\u0000' + v.key; if (!groups.has(g)) groups.set(g, []); groups.get(g).push(v); }
  const rows = [...groups.values()].sort((a, b) => b.length - a.length || (a[0].kind + a[0].key < b[0].kind + b[0].key ? -1 : 1));
  const range = xs => { const s = [...new Set(xs)].sort((a, b) => a - b); return s.length ? (s[0] === s[s.length - 1] ? String(s[0]) : `${s[0]}–${s[s.length - 1]}`) : ''; };
  const L = [];
  L.push('# Known violations (generated)', '',
    'Generated by `node tests/golden.js --record` from the golden snapshots. Do not edit by hand. A violation is a Next up',
    'card with a primary button for a step whose gate is not met (see `tests/golden/violations.js` for the kinds and the',
    'inferred gates). Fixing one shows up as golden diffs plus a shorter list here.', '',
    `${violations.length} violations in ${new Set(violations.map(v => v.id)).size} of ${nStates} states, ${rows.length} distinct steps.`, '',
    '| Kind | Step | Card | States | Levels | Story positions | Top card in | Why |', '|---|---|---|---:|---|---|---:|---|');
  for (const g of rows) {
    const v = g[0], curs = g.map(x => x.cur);
    const sp = (() => { const s = [...new Set(curs)].sort((a, b) => a - b); return s.length === 1 ? qName(s[0]) : `${qName(s[0])} … ${qName(s[s.length - 1])} (${s.length})`; })();
    L.push(`| ${v.kind} | \`${v.key}\` | ${v.title.replace(/\|/g, '\\|')} | ${g.length} | ${range(g.map(x => x.lv))} | ${sp.replace(/\|/g, '\\|')} | ${g.filter(x => x.rank === 0).length} | ${[...new Set(g.map(x => x.why))].slice(0, 2).join('; ').replace(/\|/g, '\\|')} |`);
  }
  if (Object.keys(ORACLE).length) { L.push('', '## Gate table (ORACLE)', ''); for (const [k, o] of Object.entries(ORACLE)) L.push(`- \`${k}\`: ${[o.story ? `story at "${o.story}"` : '', o.turnedIn ? `"${o.turnedIn}" turned in` : '', o.done ? `done: ${o.done.join(', ')}` : ''].filter(Boolean).join(', ')}. ${o.why}`); }
  L.push('', '## States', '');
  for (const g of rows) {
    const v = g[0];
    L.push(`<details><summary>${v.kind} <code>${v.key}</code>: ${g.length} states</summary>`, '', ...[...new Set(g.map(x => x.id))].sort().map(id => `- \`${id}\``), '', '</details>', '');
  }
  return L.join('\n').replace(/\n+$/, '') + '\n';
}

module.exports = { ORACLE, findViolations, renderReport };
