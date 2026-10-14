const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:1000},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2]);
for (const [tot,cost,fn] of [[90,{'dv:z:db':0},'ao1.png'],[80,{},'ao2.png'],[95,{},'ao3.png']]){
await p.evaluate(([tot,cost])=>{const st=JSON.parse(localStorage.getItem('aion2-assassin-route-v4')||'{}');st.level=21;st.quest='Creeping Shadow';st.dvReset1=true;st.checks={};GATES.forEach(g=>{if(g.lv<=21)g.items.forEach((it,j)=>{const k=it.k||g.id+':'+j; if(!k.startsWith('dv:')&&it.kind!=='hideout')st.checks[k]=true})});SP_STEPS.forEach(x=>{if(x.req<=21)st.checks[x.k]=true});st.stones=50;st.dvTotal=tot;st.pendSt=0;st.pendCr=0;['hg','ew','amb','qs','ew2','as','as2','corner','ie','ss','z:hg','z:ie','z:qs'].forEach(k=>st.checks['dv:'+k]=true);st.dvCost=Object.assign({'dv:hg':10,'dv:ew':5,'dv:amb':8,'dv:qs':5,'dv:ew2':5,'dv:as':4,'dv:as2':4,'dv:corner':4,'dv:ie':5,'dv:ss':4,'dv:z:hg':12,'dv:z:ie':12,'dv:z:qs':10},cost);localStorage.setItem('aion2-assassin-route-v4',JSON.stringify(st))},[tot,cost]);
await p.reload();await p.waitForTimeout(600);
await p.screenshot({path:fn,clip:{x:510,y:230,width:540,height:280}});
console.log(fn, await p.evaluate(()=>{const r=(sel)=>{const e=document.querySelector(sel);if(!e)return null;const b=e.getBoundingClientRect();return [Math.round(b.top),Math.round(b.height)]};return {spIco:r('#spCard .sphero .dvico'),dvIco:r('#dvNextList .dvico'),spBuy:r('#spCard .buyrow'),dvBuy:r('#dvNextList .buyrow'),spHead:r('#spAfter .dvbh'),dvHead:r('#dvBoard .dvbh')}}));}
console.log('ERR',errs);await b.close();})();
