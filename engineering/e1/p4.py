F='assassin-route.html'
L=open(F,encoding='utf-8').read().split('\n')
rep={
'g22:1':'''    { k: "g22:1", stig: 1, after: "Daeva in a Dream", t: `<b>Equip ${stn(1)}.</b> Plan: Triniel's Dagger, long-term target skill level 10. <i>Check first:</i> Metabot puts Illusive Clone in slot 1 and Triniel's Dagger last. If Illusive Clone is equippable at 22, pick it in the Stigmas card instead.` },''',
'g27:0':'''    { k: "g27:0", stig: 2, t: `<b>Equip ${stn(2)}.</b> Plan: Illusive Clone, long-term target skill level 20.` },''',
'g27:1':'''    { k: "g27:1", eput: 2, t: `<b>Put ${stn(2)} on E</b>${eRow(2)}. Open with E, then Q (Shadowstrike).` },''',
'g32:0':'''    { k: "g32:0", stig: 3, t: `<b>Equip ${stn(3)}.</b> Plan: Savage Fang. Level 1 is enough for now.` },''',
'g32:1':'''    { k: "g32:1", eput: 3, t: `<b>Put ${stn(3)} on E</b>${eRow(3)}. Build tab (right edge) → Key setup shows where.` },''',
'g37:0':'''    { k: "g37:0", stig: 4, t: `<b>Equip ${stn(4)}.</b> Plan: Swift Contract. Level 1 is enough for now.` },''',
'g37:1':'''    { k: "g37:1", eput: 4, t: `<b>Put ${stn(4)} on E${eRow(4)}, then run the full rotation on a training dummy.</b><span class="rotseq"></span>` },''',
}
n=0
for i,l in enumerate(L):
    for k,v in rep.items():
        if l.startswith('    { k: "%s",'%k): L[i]=v; n+=1
assert n==7,n
s='\n'.join(L)
old='const DAEVA = '
assert s.count(old)==1
s=s.replace(old,'''/* Stigma slots 22 / 27 / 32 / 37: the plan's stigma per slot (unverified order; Metabot's differs). The Stigmas card lets you
   pick what you actually equipped (state.stPick); milestone lines, E stack, rotation and Coming up all follow the pick. */
const STIGMA_PLAN = ["Triniel's Dagger", "Illusive Clone", "Savage Fang", "Swift Contract"];
/* Effective name per slot 1–4: your pick, else the plan; a name already used by an earlier slot falls to the first free one. */
function stNames() { const used = []; for (let n = 1; n <= 4; n++) { let nm = (state.stPick || {})[n]; if (!nm || used.includes(nm)) nm = STIGMA_PLAN[n - 1]; if (used.includes(nm)) nm = STIGMA_PLAN.find(x => !used.includes(x)); used.push(nm); } return used; }
/* Placeholders in milestone text, filled by fillStigmaText() on every update. */
const stn = n => `<span class="stn" data-slot="${n}">${STIGMA_PLAN[n - 1]}</span>`;
const eRow = n => `<span class="erow" data-slot="${n}"></span>`;
const DAEVA = ''',1)
open(F,'w',encoding='utf-8').write(s); print('ok')
