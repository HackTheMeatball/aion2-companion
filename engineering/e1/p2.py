import re, json
F='assassin-route.html'
s=open(F,encoding='utf-8').read()
G=json.load(open('polish/e1/gen.json'))
def once(old,new):
    global s
    c=s.count(old); assert c==1,(c,old[:90]); s=s.replace(old,new)
def cut(start,end_incl):
    """remove from line starting with start through the line containing end_incl"""
    global s
    i=s.index(start); j=s.index(end_incl,i)+len(end_incl)
    if s[j]=='\n': j+=1
    s=s[:i]+s[j:]
# 1. quest lists -> names only (within GATES)
a=s.index('const GATES = ['); b=s.index('const STEPS = [')
seg=s[a:b]
seg2,n=re.subn(r'\["([^"\]]+)", "([^"]+)", "([^"]*)"\]', r'"\1"', seg)
print('quest entries', n); assert n==58
s=s[:a]+seg2+s[b:]
# 2. RQ table replaces QUEST_ID / QUEST_POI / QUEST_AFTER and qMap/quests
rows=[]
for q in G['rq']:
    o={k:q[k] for k in ['name','id','rec','unlocksAt','zone','place','npc','kib','m','after','afterBasis','reward','rw']}
    rows.append('  '+json.dumps(o,ensure_ascii=False).replace('{"','{ "').replace('}}',' } }'))
RQ='''/* Regional quests: one table (E1, Oct 2026), seeded from the guide's earlier tables. id: shugo.gg quest list (spot-checked
   on Metabot). rec: recommended level (allthings.how, Selphie1999); unlocksAt: not recorded yet. zone: Altgard area;
   place / npc: the quest giver's spot and NPC (allthings.how area guides, Metabot quest pages); kib / m: the giver's
   nearest Kibelisk and its distance (Metabot, allthings.how). after: a quest that must be turned in first, with its basis
   (source-text: allthings.how says it "picks up straight after"; turnin-npc: inferred, the first part turns in to this
   quest's giver; name-pattern: inferred from the names, unconfirmed in game). rw: Wisdom Stones / crystals credited on
   turn-in. The milestone a quest sits in is set in GATES; its key is "rq:" + id, so moving it keeps its ticks. */
const RQ = [
'''+',\n'.join(rows)+'''
];
const RQ_BY = Object.fromEntries(RQ.map(q => [q.name, q]));
'''
i=s.index('/* Regional quest IDs (shugo.gg quest list;'); j=s.index('const QUEST_ID = ')
s=s[:i]+RQ+s[s.index('\n',j)+1:]
cut('/* Where each regional quest starts: specific spot','const QUEST_POI = ')
# qMap
i=s.index('/* Area · spot · quest giver (linked'); j=s.index('const quests = (label, list)')
s=s[:i]+'''/* Zone · spot · quest giver (linked to the quest on Metabot's Altgard map). */
const qMap = q => [q.zone, q.place && q.place !== q.zone ? q.place : "", q.id ? mapQ(q.id, q.npc || "map") : (q.npc || "map")].filter(Boolean).join(" · ");
'''+s[j:]
once('''const quests = (label, list) => [{ ...sub(`Regional quests · ${label} ${T("", "regional")}`), group: "quest" }, ...list.map(([n, where, r]) => ({ kind: "quest", name: n, lv: parseInt(label.replace(/^\\D+/, ""), 10), where, reward: r, t:`<b>${n}</b><span class="loc">${qMap(n, where)}${QUEST_AFTER[n] ? `<br>Appears after <em>${QUEST_AFTER[n]}</em> is turned in` : ""}${r ? `<br>Reward: <em>${r}</em>` : ""}</span>` }))];''',
'''/* A milestone's regional quests, by name; everything else comes from RQ. Availability is the quest's own rec level. */
const quests = (label, names) => [{ ...sub(`Regional quests · ${label} ${T("", "regional")}`), group: "quest" }, ...names.map(n => { const q = RQ_BY[n];
  return { kind: "quest", name: n, k: "rq:" + q.id, lv: q.rec, q, t: `<b>${n}</b><span class="loc">${qMap(q)}${q.after ? `<br>Appears after <em>${q.after}</em> is turned in` : ""}${q.reward ? `<br>Reward: <em>${q.reward}</em>` : ""}</span>` }; })];''')
# 3. hideouts default key prefix
once('const hideouts = (names, keyPrefix) =>','const hideouts = (names, keyPrefix = "sd") =>')
once('k: keyPrefix ? `${keyPrefix}:${mapSlug(n)}` : undefined,','k: `${keyPrefix}:${mapSlug(n)}`,')
# 4. QUEST_AREA, RQ_LOC removal
cut('const QUEST_AREA = {','"Spacetime Rift: An Honest Shugo": "Basfelt Ruins", "Spacetime Rift: Proof": "Basfelt Ruins",\n};')
cut('const RQ_LOC = {','"place": "Graverobber Campsite"}};')
once('''  const lv = it.kind === "hideout" ? g.lv : (it.lv || g.lv);
  const area = (it.kind === "hideout" ? HIDEOUT_AREA[it.name] : QUEST_AREA[it.name]) || NO_AREA;
  AREA_ITEMS.push({ it, g, k: it.k || g.id + ":" + j, lv, area });''','''  AREA_ITEMS.push({ it, g, k: it.k, lv: g.lv, area: HIDEOUT_AREA[it.name] || NO_AREA });''')
once('  Object.entries(RQ_LOC).forEach(([n, l]) => add(l.kib, QUEST_AREA[n]));','  RQ.forEach(q => add(q.kib, q.zone));')
# 5. migration map
mig=G['mig']
s=s.replace('const KEY = "aion2-assassin-route-v4";','''const KEY = "aion2-assassin-route-v4";
/* v5 keys (E1, Oct 2026): regional quests are keyed "rq:<quest id>" and Sealed Dungeons "sd:<name>", so moving one to
   another milestone keeps its ticks; every other item has its old position key written out as an explicit k. This
   one-time map copies ticks, in-progress marks and dungeon runs from the old position keys (old keys are left in place).
   Story objective ticks (qsteps / qsub) are keyed by quest name and need no copy. Never reuse a "gN:i" key. */
const MIG_V5 = '''+json.dumps(mig,ensure_ascii=False,separators=(', ',': '))+''';
function migrateV5(s) {
  if (s.migV5) return false;
  ["checks", "started", "areaRun"].forEach(f => { const o = s[f]; if (!o) return; Object.entries(MIG_V5).forEach(([a, b]) => { if (a in o && !(b in o)) o[b] = o[a]; }); });
  s.migV5 = true; return true;
}''',1)
open(F,'w',encoding='utf-8').write(s)
print('ok')
