F='assassin-route.html'
s=open(F,encoding='utf-8').read()
def once(old,new):
    global s
    c=s.count(old); assert c==1,(c,old[:90]); s=s.replace(old,new)
def cut(a,b):
    global s
    i=s.index(a); j=s.index(b,i)+len(b)
    if s[j]=='\n': j+=1
    assert s.count(a)==1
    s=s[:i]+s[j:]
cut('function pickDefaultArea() {','return (open[0] || AREA_ITEMS.filter(x => !state.checks[x.k]).sort((a, b) => a.lv - b.lv)[0] || AREA_ITEMS[0]).area;\n}')
cut('document.getElementById("areaList").addEventListener("click", e => {\n  const b = e.target.closest("[data-region]");','  save(); renderAreas(); update();\n});')
cut('/* Milestone summary lines: count that milestone','  goAreas(b.dataset.golv || defaultBand());\n});')
cut('const SH_TOTAL = STRONGHOLDS.length;','  return [d, n];\n}')
once('''/* One-time clears: hideouts and regional quests are counted from the same checkboxes as the milestones;
   strongholds are counted from their Areas ticks. */
''','')
cut('let resetArmed = false;','let resetArmed = false;')
cut('layoutEl.addEventListener("click", e => {\n  const b = e.target.closest("[data-qs]");','x.textContent = Q_LABEL[v]; });\n});')
cut('document.getElementById("track").addEventListener("click", e => {\n  if (!e.target.closest("#trkLater"))','  state.trackLater = !state.trackLater; save(); update();\n});')
cut('function renderTips() {}','function renderTips() {}')
once('  renderTips();\n','')
# renderAhead: drop block wrapper + unreachable tail
i=s.index('function renderAhead() {'); j=s.index('/* Main story filter (icon right of "Main story")',i)
body=s[i:j]
k=body.index('    el.innerHTML = rows.length ? `<div class="where-sub">Ahead <span class="ah-ver">verified</span></div>${rows.join("")}` : "";\n    return;\n  }\n')
newbody=body[:k]+'    el.innerHTML = rows.length ? `<div class="where-sub">Ahead <span class="ah-ver">verified</span></div>${rows.join("")}` : "";\n  }\n}\n'
s=s[:i]+newbody+s[j:]
# dedupeNow: first loop no-op
once('''    const lis = [...card.querySelectorAll(":scope > ul.items > li")];
    lis.forEach(li => {
      const cb = li.querySelector("input[data-k]");
      if (cb && g.id === nowGate && nowKeys.has(cb.dataset.k)) li.hidden = true;
    });
''','''    const lis = [...card.querySelectorAll(":scope > ul.items > li")];
''')
open(F,'w',encoding='utf-8').write(s); print('ok')
