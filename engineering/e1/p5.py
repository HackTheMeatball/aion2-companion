F='assassin-route.html'
s=open(F,encoding='utf-8').read()
def once(old,new):
    global s
    c=s.count(old); assert c==1,(c,old[:90]); s=s.replace(old,new)
once('spend them at each milestone; the Next skill upgrade card shows the single next upgrade between stops.','spend them at each milestone; the Skills card shows the single next upgrade between stops.')
once('for gear and Daevanion paths is in the rotation card at the top.','for gear and Daevanion paths is in the Build tab (right edge).')
once('{ k: "story:3", t: `<b>A regional quest you can\'t solo at its level</b> stays unticked; it turns amber so you catch it later.` },',
     '{ k: "story:3", t: `<b>A regional quest that isn\'t in the game yet:</b> click "not yet" on it in Next up (or "Not in game yet" in its milestone). It comes back after your next Level up, or once the quest before it is turned in.` },')
open(F,'w',encoding='utf-8').write(s); print('ok')
