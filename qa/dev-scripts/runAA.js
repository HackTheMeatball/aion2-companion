const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2]);
for (const [hc,hide] of [[false,false],[true,false],[false,true],[true,true]]){
await p.evaluate(([hc,hide])=>{const st=JSON.parse(localStorage.getItem('aion2-assassin-route-v4')||'{}');st.level=20;st.dvReset1=true;st.checks={};GATES.forEach(g=>{if(g.lv<=20)g.items.forEach((it,j)=>{if(!it.opt)st.checks[it.k||g.id+':'+j]=true})});st.hideCards=hc;st.hide=hide;st.hideOpt=false;localStorage.setItem('aion2-assassin-route-v4',JSON.stringify(st))},[hc,hide]);
await p.reload();await p.waitForTimeout(300);
console.log(hc,hide,await p.evaluate(()=>{const li=document.querySelector('#main input[data-k="g20:exp"]').closest('li');return {liHidden:li.hidden,card:document.getElementById('g20').hidden,open:document.getElementById('g20').open}}));}
console.log(errs);await b.close();})();
