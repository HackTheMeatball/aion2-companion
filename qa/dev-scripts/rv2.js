const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
 await p.goto('file://' + process.argv[2]);
 const r = await p.evaluate(() => {
  const conf = {}; AREA_ITEMS.forEach(x => { const l = AREA_LOC[x.it.name]; if (l && l.kib && x.area !== NO_AREA) (conf[l.kib] = conf[l.kib] || new Set()).add(x.area+'('+x.it.name+' '+l.m+'m)'); });
  Object.entries(RQ_LOC).forEach(([n,l]) => { if (l.kib && QUEST_AREA[n]) (conf[l.kib] = conf[l.kib] || new Set()).add(QUEST_AREA[n]+'(RQ '+n+')'); });
  const multi = Object.entries(conf).filter(([k,s]) => new Set([...s].map(x=>x.split('(')[0])).size>1).map(([k,s])=>k+': '+[...s].join(' | '));
  // story kibs
  const sk = {}; Object.entries(QUEST_STEPS).forEach(([q,l]) => l.forEach(t => { const m = t.match(/\(Kibelisk: ([^)]+)\)/); if (m) sk[m[1]] = (sk[m[1]]||0)+1; }));
  const unmapped = Object.keys(sk).filter(k => !KIB_AREA[k]);
  const turnin = Object.entries(QUEST_LOC).filter(([q,L]) => L.turninKib && !KIB_AREA[L.turninKib]).map(([q,L])=>L.turninKib);
  const sdNoLoc = AREA_ITEMS.filter(x => x.it.kind==='hideout' && !AREA_LOC[x.it.name]).map(x=>x.it.name+' L'+x.lv);
  const sd = AREA_ITEMS.filter(x => x.it.kind==='hideout').map(x=>x.it.name+' L'+x.lv+' '+x.area);
  const qs = Object.keys(QUEST_STEPS); const lvls = qs.map(q => (QUESTS.find(([,n])=>n===q)||['?'])[0]);
  const missing = QUESTS.filter(([l,n]) => !QUEST_STEPS[n]).map(([l,n])=>l+' '+n);
  const weird = []; Object.entries(QUEST_STEPS).forEach(([q,l]) => l.forEach(t => { if (/undefined|null|\(Kibelisk: *\)|  /.test(t)) weird.push(q+': '+t); }));
  return { multi, unmapped, turnin, sdNoLoc, sd, KIB_AREA, missingSteps: missing, weird, nSteps: qs.length };
 });
 console.log(JSON.stringify(r, null, 1));
 await b.close(); })();
