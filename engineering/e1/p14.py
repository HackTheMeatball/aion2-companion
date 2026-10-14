F='assassin-route.html'
s=open(F,encoding='utf-8').read()
def once(old,new):
    global s
    c=s.count(old); assert c==1,(c,old[:90]); s=s.replace(old,new)
once('''const UNLOCK_TIP = { "Gathering Essentials": "petfilter", "Urgent Pursuit": "daevanion", "Buried Atrocities": "guild", "Empyrean Monolith": "traces", "Daeva in a Dream": "stigma" };
''','')
# CLEAR_REWARD
once('''const CLEAR_REWARD = k => {
  const a = AREA_ITEMS.find(x => x.k === k); if (a) return a.it.kind === "hideout" ? { st: 2, cr: 2 } : null;
  for (const g of GATES) { const j = g.items.findIndex((it, i) => (it.k || g.id + ":" + i) === k); if (j >= 0) return g.items[j].kind === "quest" ? { st: 1, cr: 1 } : null; }
  return null;
};''','''const CLEAR_REWARD = k => {
  const a = AREA_ITEMS.find(x => x.k === k); if (a) return a.it.kind === "hideout" ? { st: 2, cr: 2 } : null;
  const it = itemByK(k); return it && it.kind === "quest" ? it.q.rw : null;
};
/* Every milestone / route item by its key (built once GATES is final). */
let ITEM_K = null;
const itemByK = k => { if (!ITEM_K) { ITEM_K = {}; [...GATES, ...STEPS].forEach(g => g.items.forEach(it => { if (it.k) ITEM_K[it.k] = it; })); } return ITEM_K[k]; };''')
# setLevel: snooze clears on level up
once('''  state.level = v;
  /* Areas follows you''','''  /* "Not in game yet" snoozes last until the next Level up. */
  if (v > (state.level || 1)) delete state.rqSnooze;
  state.level = v;
  /* Areas follows you''')
# defaultBand: P2-11
once('''function defaultBand() {
  const open = AREA_BANDS.filter(b => b <= state.level && AREA_ITEMS.some(x => bandOf(x) === b && !state.checks[x.k]));
  return String(open.length ? open[0] : AREA_BANDS.filter(b => b <= state.level).pop() || AREA_BANDS[0]);
}''','''/* The band that holds your level; older bands with open clears show their count in the dropdown. */
function defaultBand() {
  return String(AREA_BANDS.filter(b => b <= state.level).pop() || AREA_BANDS[0]);
}''')
open(F,'w',encoding='utf-8').write(s); print('ok')
