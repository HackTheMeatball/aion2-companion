F='assassin-route.html'
s=open(F,encoding='utf-8').read()
def once(old,new):
    global s
    c=s.count(old); assert c==1,(c,old[:90]); s=s.replace(old,new)
once('''function renderAhead() {
  const el = document.getElementById("ahead"); if (!el) return;
  {
    const lv = state.level''','''function renderAhead() {
  const el = document.getElementById("ahead"); if (!el) return;
  {
    const lv = state.level''')
once('''        rows.push(`<a class="ah-row"${gid ? ` href="#${gid}" data-gogate="${gid}"` : ""}><span class="ah-lv unl">Lv ${uq[0]}</span><span class="ah-main"><b>🔓 ${STORY_UNLOCKS[uq[1]]}</b><small>${ui === 0 ? "your next quest" : pl(ui + 1, "story quest")} · "${uq[1]}"</small></span></a>`); } }
    el.hidden = !rows.length;''','''        rows.push(`<a class="ah-row"${gid ? ` href="#${gid}" data-gogate="${gid}"` : ""}><span class="ah-lv unl">Lv ${uq[0]}</span><span class="ah-main"><b>🔓 ${STORY_UNLOCKS[uq[1]]}</b><small>${ui === 0 ? "your next quest" : pl(ui + 1, "story quest")} · "${uq[1]}"</small></span></a>`); } }
    /* At the cap there's nothing above you: say so instead of an empty box. */
    if (lv >= 45) rows.push(`<a class="ah-row" href="#g45" data-gogate="g45"><span class="ah-lv">Lv 45</span><span class="ah-main"><b>Level cap reached</b><small>Progress now comes from gear score, not levels</small></span></a>`);
    el.hidden = !rows.length;''')
open(F,'w',encoding='utf-8').write(s); print('ok')
