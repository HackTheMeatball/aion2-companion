/* Later (0.4 P4c: moved verbatim from src/main.js): the Journey card's "Ahead" list (#ahead), the next verified
   unlocks by level and the next story unlock. Drawn by renderQuest (Journey), so it registers with update: null. */
import { char } from "../core/state.js";
import { activePack } from "../core/pack.js";
import { questIdx } from "../core/requirements.js";
import { pageState as state, pageUpdate as update, pageGATES as GATES, pageQUESTS as QUESTS, pageSTORY_UNLOCKS as STORY_UNLOCKS, pageUNLOCK_GATE as UNLOCK_GATE, pageVERIFIED_UNLOCKS as VERIFIED_UNLOCKS } from "./page.js";

function renderAhead() {
  const el = document.getElementById("ahead"); if (!el) return;
  {
    const lv = char(state).level, pl = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
    const lvls = [...new Set(VERIFIED_UNLOCKS.filter(x => x[0] > lv).map(x => x[0]))].slice(0, 2);
    const rows = lvls.map(L => {
      const xs = VERIFIED_UNLOCKS.filter(x => x[0] === L), g = GATES.find(g => g.lv === L);
      const prevLv = Math.max(1, ...VERIFIED_UNLOCKS.filter(x => x[0] <= lv).map(x => x[0])), pct = Math.min(100, Math.max(0, (lv - prevLv) / Math.max(1, L - prevLv) * 100));
      const what = xs.map(x => `<b>${x[1]}</b>${x[2] ? ` <span class="ah-d">${x[2]}</span>` : ""}`).join("<br>");
      return `<a class="ah-row"${g ? ` href="#${g.id}" data-gogate="${g.id}"` : ""} title="Sources: ${[...new Set(xs.flatMap(x => x[3].split(", ")))].join(", ")}"><span class="ah-lv">Lv ${L}</span><span class="ah-main"><span class="ah-what">${what}</span><span class="ns-chipbar"><span style="width:${pct}%"></span></span><small>${pl(L - lv, "level")} to go</small></span></a>`;
    });
    const qi = questIdx(char(state));
    if (qi >= 0) { const ui = QUESTS.slice(qi + 1).findIndex(([, n]) => STORY_UNLOCKS[n]);
      if (ui >= 0) { const uq = QUESTS[qi + 1 + ui], gid = UNLOCK_GATE[uq[1]];
        rows.push(`<a class="ah-row"${gid ? ` href="#${gid}" data-gogate="${gid}"` : ""}><span class="ah-lv unl">Lv ${uq[0]}</span><span class="ah-main"><b>🔓 ${STORY_UNLOCKS[uq[1]]}</b><small>${ui === 0 ? "your next quest" : pl(ui + 1, "story quest")} · "${uq[1]}"</small></span></a>`); } }
    /* At the cap there's nothing above you: the pack's row says so instead of an empty box (0.4 P5a, nowRenderers). */
    const capRow = activePack().nowRenderers["ahead.cap"], cap = capRow ? capRow(lv, { state, c: char(state), lv }) : "";
    if (cap) rows.push(cap);
    el.hidden = !rows.length;
    el.innerHTML = rows.length ? `<div class="where-sub">Ahead <span class="ah-ver" title="Each unlock here is backed by two or more independent sources">verified</span></div>${rows.join("")}` : "";
  }
}

const aheadCard = { id: "ahead", slot: "journey.ahead", order: 100, root: "ahead", mount: null, update: null };
export { renderAhead, aheadCard };
