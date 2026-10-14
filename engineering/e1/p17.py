F='assassin-route.html'
s=open(F,encoding='utf-8').read()
def once(old,new):
    global s
    c=s.count(old); assert c==1,(c,old[:90]); s=s.replace(old,new)
once('function renderQuest() {','/* inUpdate: called from update(), which renders Next up itself afterwards (so it isn\'t rendered twice). */\nfunction renderQuest(inUpdate) {')
once('''  if (qInput.value !== state.quest) qInput.value = state.quest;
  renderQuestSubs();''','''  if (qInput.value !== state.quest) qInput.value = state.quest;
  renderQuestSubs(inUpdate);''')
once('''function renderQuestSubs() {
  const el = document.getElementById("questSubs"), list = state.quest && QUEST_STEPS[state.quest];
  syncJFilt();
  renderNow();''','''function renderQuestSubs(noNow) {
  const el = document.getElementById("questSubs"), list = state.quest && QUEST_STEPS[state.quest];
  syncJFilt();
  if (noNow !== true) renderNow();''')
once('''  renderCollection();
  renderRotation();
  renderQuest();''','''  renderCollection();
  renderRotation();
  renderQuest(true);''')
once('''  renderAhead();
  const tn = document.getElementById("trkN");''','''  const tn = document.getElementById("trkN");''')
# story end auto-advance once more story data exists
once('''const qInput = document.getElementById("questIn");''','''/* "Turned in" on the last covered quest is remembered (state.storyEnd); once later quests are added, move on to the next. */
if (state.storyEnd && state.storyEnd === state.quest) { const i = QUESTS.findIndex(([, n]) => n === state.quest); if (i >= 0 && i < QUESTS.length - 1) { state.quest = QUESTS[i + 1][1]; delete state.storyEnd; save(); } }
const qInput = document.getElementById("questIn");''')
open(F,'w',encoding='utf-8').write(s); print('ok')
