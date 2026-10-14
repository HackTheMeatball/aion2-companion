F='assassin-route.html'
s=open(F,encoding='utf-8').read()
def once(old,new):
    global s
    c=s.count(old); assert c==1,(c,old[:90]); s=s.replace(old,new)
once('''let state = DEFAULT();
try { const s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s) state = Object.assign(state, s); } catch (e) {}
/* PLAYER-SEED-START: one-time sync to skill levels reported in game (Oct 10, Lv 12). Runs once per browser. */''','''let state = DEFAULT(), hadSave = false;
try { const s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s) { state = Object.assign(state, s); hadSave = true; } } catch (e) {}
/* A fresh browser: the one-time player seeds below are for the saved progress that predates them, so they're marked
   done without running; cleared milestones start folded (Filters → Cleared milestones). Existing saves keep their settings. */
if (!hadSave) { state.seedLv12 = state.stTriniel1 = state.dvReset1 = true; state.hideCards = true; }
if (migrateV5(state) && hadSave) { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
/* PLAYER-SEED-START: one-time sync to skill levels reported in game (Oct 10, Lv 12). Runs once per saved progress. */''')
once('''  GATES.forEach(g => g.items.forEach((it, j) => { if (/<b>Equip Triniel's Dagger/.test(it.t || "")) state.checks[it.k || g.id + ":" + j] = true; }));''','''  GATES.forEach(g => g.items.forEach(it => { if (it.stig === 1) state.checks[it.k] = true; }));''')
once('''/* Any step carrying a Paid tag is a paid step: with "Hide paid steps" on it disappears and stops counting
   toward its milestone, the progress ring and the "missed" check. */
/* "paid" = the step itself needs real money (hidden by the filter). "upsell" = a free step that mentions an optional paid upgrade (never hidden). */
const isPaid = it => !!it.paid;
''','''/* "upsell" = a free step that mentions an optional paid upgrade (shown with a "Paid option" tag). */
''')
once('''/* Optional tasks count toward their milestone like any task, unless the Optional tasks filter hides them
   (same rule as Paid tasks). */''','''/* Optional tasks count toward their milestone like any task, unless the Optional tasks filter hides them. */''')
once('''!(state.hideOpt && x.it.opt) && !(state.hidePaid && isPaid(x.it)));''','''!(state.hideOpt && x.it.opt));''')
open(F,'w',encoding='utf-8').write(s); print('ok')
