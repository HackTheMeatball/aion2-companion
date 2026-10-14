F='assassin-route.html'
s=open(F,encoding='utf-8').read()
def once(old,new):
    global s
    c=s.count(old); assert c==1,(c,old[:90]); s=s.replace(old,new)
once('''function renderNow() {
  nowKeys = new Set(); nowGate = "";
''','''function renderNow() {
''')
# stigma card: picked name already via STIGMA_SLOTS. stepsOf changes
once('''  const stepsOf = g => { const out = [], card = document.getElementById(g.id); if (!card) return out;
    card.querySelectorAll(":scope > ul.items > li.item").forEach(li => {
      const cb = li.querySelector("input[data-k]"); if (!cb || cb.disabled || state.checks[cb.dataset.k] || li.classList.contains("locked")) return;
      if (/^(sp|dv):/.test(cb.dataset.k) || li.classList.contains("optional")) return;''','''  const stepsOf = g => { const out = [], card = document.getElementById(g.id); if (!card) return out;
    card.querySelectorAll(":scope > ul.items > li.item").forEach(li => {
      const cb = li.querySelector("input[data-k]"); if (!cb || cb.disabled || state.checks[cb.dataset.k] || li.classList.contains("locked")) return;
      if (/^(sp|dv):/.test(cb.dataset.k) || li.classList.contains("optional")) return;
      /* Stigma "Equip" and "Put … on E" lines: the Stigmas card's own Equip card covers both (one card, not three). */
      const it = itemByK(cb.dataset.k); if (it && (it.stig || it.eput)) return;''')
once('''      const cl = t.cloneNode(true); cl.querySelectorAll(".tip, .loc, .schip, .paid, .req, .cost, button, small").forEach(x => x.remove());
      const b = cl.querySelector("b"); out.push({ k: cb.dataset.k, html: b ? b.innerHTML : cl.innerHTML, rq: li.classList.contains("qrow") }); });''','''      const cl = t.cloneNode(true); cl.querySelectorAll(".tip, .loc, .schip, .upsell, .req, .cost, button, small").forEach(x => x.remove());
      /* Card title: the item's short ns title; else its first bold phrase without trailing ":" or ".". */
      const b = cl.querySelector("b"); out.push({ k: cb.dataset.k, html: it && it.ns ? it.ns : (b ? b.innerHTML : cl.innerHTML).replace(/[\\s:.]+$/, ""), rq: li.classList.contains("qrow") }); });''')
once('''  const hsRegional = hs.filter(x => x.rq);
''','')
once('''  const ms = msAll.filter(m => !m.rq), msRq = msAll.filter(m => m.rq);''','''  const ms = msAll.filter(m => !m.rq);''')
i=s.index('  if (false) acts.push({ ico: "↺", t: ms[0].html'); j=s.index('\n',i)+1; s=s[:i]+s[j:]
once('''    const useSp = sp2 && (!g2 || sp2.req <= g2.lv);
''','')
once('''    const g2 = GATES.find(g => g.lv > lv && (([c, n]) => c < n)(counts(g))), st2 = g2 ? stepsOf(g2)[0] : null;''','''    /* A milestone's first step that isn't a regional quest; stigma-only milestones show their title ("Stigma slot 2"). */
    const g2 = GATES.find(g => g.lv > lv && (([c, n]) => c < n)(counts(g))), st2 = g2 ? stepsOf(g2).find(x => !x.rq) : null;''')
once('''    later.sort((x, y) => x.L - y.L).forEach(x => acts.push(x.a)); void useSp;''','''    later.sort((x, y) => x.L - y.L).forEach(x => acts.push(x.a));''')
once('''  nsGate = first && here && first.act.startsWith("tick:") && hs.some(x => "tick:" + x.k === first.act) ? here.id : "";
''','')
once('''let nowKeys = new Set(), nowGate = "", nsGate = "", nsAnim = false, nsRefocus = 0;''','''let nsAnim = false, nsRefocus = 0;''')
open(F,'w',encoding='utf-8').write(s); print('ok')
