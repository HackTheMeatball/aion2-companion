F='assassin-route.html'
s=open(F,encoding='utf-8').read()
def once(old,new):
    global s
    c=s.count(old); assert c==1,(c,old[:90]); s=s.replace(old,new)
once('''  renderStigma();
  syncQRun();''','''  renderStigma();
  fillStigmaText();
  syncQRun();''')
once('''  document.getElementById("lvlNum").value = lv;
  document.getElementById("lvlRange").value = lv;''','''  document.getElementById("lvlNum").value = lv;
  document.getElementById("lvlRange").value = lv;
  { const lb = document.getElementById("lvlUpBig"); lb.disabled = lv >= 45; lb.title = lv >= 45 ? "Level cap (45)" : ""; }''')
once('''  if (i < 0 || j < 0 || j >= QUESTS.length) return;
  state.quest = QUESTS[j][1]; save();''','''  if (i < 0 || j < 0 || j >= QUESTS.length) return;
  state.quest = QUESTS[j][1]; delete state.storyEnd; save();''')
once('''  state.quest = QUESTS[i][1]; save();
  update();
});''','''  state.quest = QUESTS[i][1]; delete state.storyEnd; save();
  update();
});''')
open(F,'w',encoding='utf-8').write(s); print('ok')
