const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2]);
await p.evaluate(()=>{const st=JSON.parse(localStorage.getItem('aion2-assassin-route-v4')||'{}');st.level=21;st.quest='Creeping Shadow';st.dvReset1=true;st.checks={};GATES.forEach(g=>{if(g.lv<=21)g.items.forEach((it,j)=>{const k=it.k||g.id+':'+j; if(!k.startsWith('dv:')&&it.kind!=='hideout')st.checks[k]=true})});SP_STEPS.forEach(x=>{if(x.req<=21)st.checks[x.k]=true});st.stones=44;st.dvTotal=84;['hg','ew','amb','qs','ew2','as','as2','corner','ie','ss','z:hg','z:ie'].forEach(k=>st.checks['dv:'+k]=true);st.dvCost={'dv:hg':10,'dv:ew':5,'dv:amb':8,'dv:qs':5,'dv:ew2':5,'dv:as':4,'dv:as2':4,'dv:corner':4,'dv:ie':5,'dv:ss':4,'dv:z:hg':12,'dv:z:ie':12,'dv:z:qs':10};st.dvAdj=0;localStorage.setItem('aion2-assassin-route-v4',JSON.stringify(st))});
await p.reload();await p.waitForTimeout(700);
console.log(await p.evaluate(()=>{const rel=(c,sel)=>{const e=c.querySelector(sel);if(!e)return null;const r=e.getBoundingClientRect(),cr=c.getBoundingClientRect();return [Math.round(r.top-cr.top),Math.round(r.height),Math.round(r.left-cr.left),Math.round(r.width)]};
const s=document.getElementById('spCard'),d=document.getElementById('dvBox');
return {sp:{big:rel(s,'.ptbig'),from:rel(s,'.dvcr, em, .spfrom'),icon:rel(s,'.sphero img, .sphero .spico'),hero:rel(s,'.sphero'),stat:rel(s,'.buystat, #spBuy'),head:rel(s,'.soonhead'),list:rel(s,'#spSoon')},
dv:{big:rel(d,'.ptbig'),from:rel(d,'.dvcr'),icon:rel(d,'.dvico'),hero:rel(d,'.dvrow.nx'),stat:rel(d,'.buystat:not([hidden]), .dvbuy:not([hidden])'),head:rel(d,'.dvbh'),list:rel(d,'#dvThen')}}}));
await p.screenshot({path:'ak.png',clip:{x:510,y:230,width:560,height:420}});
console.log('ERR',errs);await b.close();})();
