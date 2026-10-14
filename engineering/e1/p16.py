F='assassin-route.html'
s=open(F,encoding='utf-8').read()
def once(old,new):
    global s
    c=s.count(old); assert c==1,(c,old[:90]); s=s.replace(old,new)
# pin equipped stigma names at load
once('''/* PLAYER-SEED-END */''','''/* PLAYER-SEED-END */
/* An equipped slot keeps the stigma it was equipped with, even if the plan's order changes later. */
GATES.forEach(g => g.items.forEach(it => { if (it.stig && state.checks[it.k] && !(state.stPick || {})[it.stig]) { state.stPick = state.stPick || {}; state.stPick[it.stig] = STIGMA_PLAN[it.stig - 1]; } }));''')
# Skills card never empty
once('''  } else heroHTML = `<p class="sphint ok">Every planned skill upgrade is spent.</p>`;''','''  } else heroHTML = `<div class="sphero ok spdone"><div class="dvhead"><span class="dvico spico"><img src="${ITEMS.wisdom[2]}" alt="" loading="lazy" onerror="this.remove()"></span>` +
      `<div class="dvtext"><span class="spname">All planned upgrades spent</span><small>${pts} point${pts === 1 ? "" : "s"} unplanned · see <a href="#build" data-gogate="build">Build plan</a></small></div></div>` +
      (overTicked ? `<p class="sphint warn">Ticked lines cost ${spent} but you've earned ${fromLevels + stones}. Use "Sync levels" to fix.</p>` : "") + `</div>`;''')
# story end texts
once('''  st.innerHTML = nxt ? row(nxt, STORY_UNLOCKS[nxt[1]] ? `unlocks ${STORY_UNLOCKS[nxt[1]]}` : "") : `<span class="dot"></span><span class="st-name muted">End of the covered story (Lv 40)</span>`;''','''  st.innerHTML = nxt ? row(nxt, STORY_UNLOCKS[nxt[1]] ? `unlocks ${STORY_UNLOCKS[nxt[1]]}` : "") : `<span class="dot"></span><span class="st-name muted">End of the covered story (Lv ${QUESTS[i][0]})</span>`;''')
once('''    st.textContent = i === -2 ? "Several quests match; pick one from the list." : "Not in the list. Levels 40–45 aren't covered yet; set your level below.";''','''    st.textContent = i === -2 ? "Several quests match; pick one from the list." : `Not in the list. The guide's story ends at "${QUESTS[QUESTS.length - 1][1]}" (Lv ${QUESTS[QUESTS.length - 1][0]}); set your level above.`;''')
open(F,'w',encoding='utf-8').write(s); print('ok')
