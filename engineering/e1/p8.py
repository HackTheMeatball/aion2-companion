F='assassin-route.html'
s=open(F,encoding='utf-8').read()
def once(old,new):
    global s
    c=s.count(old); assert c==1,(c,old[:90]); s=s.replace(old,new)
once('''${ic ? " has-ico" : ""}${isPaid(it) ? " paid-only" : ""}${it.opt ? " optional" : ""}''','''${ic ? " has-ico" : ""}${it.opt ? " optional" : ""}''')
once('''${it.note ? `<span class="note">${it.note}</span>` : ""}${it.paid ? `<span class="paid"><span class="paid-tag">Paid</span>${it.paid}</span>` : ""}${it.upsell''','''${it.note ? `<span class="note">${it.note}</span>` : ""}${it.upsell''')
once('''title="Show the entrance on the Altgard interactive map (Metabot)">${MAP_ICO}</a>` : ""}</li>`;
      }).join(""); })()}''','''title="Show the entrance on the Altgard interactive map (Metabot)">${MAP_ICO}</a>` : ""}${it.kind === "quest" ? `<button type="button" class="q-snz" data-snz="${k}" aria-pressed="false" title="The game doesn't offer this quest yet: hide it from Next up until your next Level up">Not in game yet</button>` : ""}</li>`;
      }).join(""); })()}''')
once('''      if (/^(sp|dv):/.test(cb.dataset.k) || li.classList.contains("optional") || (state.hidePaid && li.classList.contains("paid-only"))) return;''','''      if (/^(sp|dv):/.test(cb.dataset.k) || li.classList.contains("optional")) return;''')
once('''    li.hidden = (state.hide && !!(cb && cb.checked) && !li.dataset.showall) || (!!state.hidePaid && li.classList.contains("paid-only")) || (!!state.hideOpt && li.classList.contains("optional"));''','''    li.hidden = (state.hide && !!(cb && cb.checked) && !li.dataset.showall) || (!!state.hideOpt && li.classList.contains("optional"));''')
once('''  mainEl.querySelectorAll(".paid").forEach(p => { p.hidden = !!state.hidePaid; });
  document.getElementById("fPaid").checked = !!state.hidePaid;
''','')
once('''const nOn = [state.hideCards, state.hide, state.hidePaid, state.hideOpt]''','''const nOn = [state.hideCards, state.hide, state.hideOpt]''')
once('''document.getElementById("fPaid").addEventListener("change", e => { state.hidePaid = e.target.checked; save(); update(); });
''','')
once('''state.hideCards = false; state.hide = false; state.hidePaid = false; state.hideOpt = false;''','''state.hideCards = false; state.hide = false; state.hideOpt = false;''')
once('''        <label><input type="checkbox" id="fPaid"> Paid tasks</label>
''','')
once('''body.basic #gates .loc, body.basic #gates .note, body.basic #gates .paid, body.basic #gates .upsell''','''body.basic #gates .loc, body.basic #gates .note, body.basic #gates .upsell''')
once('''.paid, .upsell { display: block;''','''.upsell { display: block;''')
open(F,'w',encoding='utf-8').write(s); print('ok')
