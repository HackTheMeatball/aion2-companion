F='assassin-route.html'
s=open(F,encoding='utf-8').read()
def once(old,new):
    global s
    c=s.count(old); assert c==1,(c,old[:90]); s=s.replace(old,new)
once('''    : (() => { const list = QUEST_STEPS[state.quest], done = (state.qsteps || {})[state.quest] || [], nq = QUESTS[qi + 1];
        if (!list) return''','''    : (() => { const list = QUEST_STEPS[state.quest], done = (state.qsteps || {})[state.quest] || [], nq = QUESTS[qi + 1];
        /* Past the end of the guide's story data: no dead "Turned in"; the story goes on in game. */
        if (!nq && state.storyEnd === state.quest) return { ico: "📜", t: "Continue the story in game", sub: `The guide covers the main story to "${state.quest}" (Lv ${QUESTS[qi][0]})`, act: "" };
        if (!list) return''')
once('''  const [first, second] = acts, then = second ? [second] : [];
  const row = a => `<li class="ns-row"><span class="ns-ico">${a.ico}</span><span class="ns-txt"><span class="ns-t">${a.t}</span><span class="ns-sub">${a.sub}</span></span><button type="button" class="ns-btn" data-now="${a.act}">${a.btn}</button></li>`;
  const top = acts[0];
  /* One card per action, each laid out like a milestone header (icon box · what · its own control). Only the first
     shows; the rest sit below it in a snap-scroll stack (a sliver of the next one peeks out). */
  const firstSkill = acts.findIndex(a => a.act === "skill");''','''  /* Basic: only what you can act on now (no "Later" cards, no queued skill buys after the first). */
  const fs0 = acts.findIndex(a => a.act === "skill");
  const shown = document.body.classList.contains("basic") ? acts.filter((a, i) => !a.later && !(a.act === "skill" && i !== fs0)) : acts;
  const top = shown[0];
  /* One card per action, each laid out like a milestone header (icon box · what · its own control). Only the first
     shows; the rest sit below it in a snap-scroll stack (a sliver of the next one peeks out). */
  const firstSkill = shown.findIndex(a => a.act === "skill");''')
once('''(top ? `<div class="ns-stack" id="nsqWrap">${acts.slice(0, 12).map(card).join("")}</div>`''','''(top ? `<div class="ns-stack" id="nsqWrap">${shown.slice(0, 12).map(card).join("")}</div>`''')
open(F,'w',encoding='utf-8').write(s); print('ok')
