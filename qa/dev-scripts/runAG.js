const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2]);
for (const tot of [79,95]){
await p.evaluate(tot=>{const st=JSON.parse(localStorage.getItem('aion2-assassin-route-v4')||'{}');st.level=21;st.quest='Creeping Shadow';st.qsteps={};st.dvReset1=true;st.checks={};GATES.forEach(g=>{if(g.lv<=21)g.items.forEach((it,j)=>{const k=it.k||g.id+':'+j; if(it.kind!=='hideout'&&it.kind!=='stronghold'&&!k.startsWith('dv:'))st.checks[k]=true})});SP_STEPS.forEach(x=>{if(x.req<=21)st.checks[x.k]=true});st.dvTotal=tot;['hg','ew','amb','qs','ew2','as','as2','corner','ie','ss','z:hg','z:ie'].forEach(k=>st.checks['dv:'+k]=true);st.dvCost={'dv:hg':10,'dv:ew':5,'dv:amb':8,'dv:qs':5,'dv:ew2':5,'dv:as':4,'dv:as2':4,'dv:corner':4,'dv:ie':5,'dv:ss':4,'dv:z:hg':12,'dv:z:ie':12,'dv:z:qs':10};localStorage.setItem('aion2-assassin-route-v4',JSON.stringify(st))},tot);
await p.reload();await p.waitForTimeout(600);
console.log(await p.evaluate(()=>{const dn=dvNext(state.level);return [dn&&dn.k,(state.dvTotal||0)-dvSpent(),dn&&dvNeed(dn)]}));console.log(tot, await p.evaluate(()=>[document.querySelector('#nowStar .ns-pt').innerText, ...[...document.querySelectorAll('#nsQueue .nsq-t')].map(x=>x.innerText)].join(' || ')));}
await p.click('#nowStar .ns-btn.primary').catch(()=>{});await p.waitForTimeout(500);console.log('areaLv',await p.evaluate(()=>state.areaLv));
console.log('ERR',errs);await b.close();})();
