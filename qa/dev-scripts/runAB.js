const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2]);
for (const ho of [false,true]){
await p.evaluate(ho=>{const st=JSON.parse(localStorage.getItem('aion2-assassin-route-v4')||'{}');st.level=20;st.dvReset1=true;st.checks={};GATES.forEach(g=>{if(g.lv<=20)g.items.forEach((it,j)=>{if(!it.opt)st.checks[it.k||g.id+':'+j]=true})});st.hideCards=true;st.hide=true;st.hideOpt=ho;localStorage.setItem('aion2-assassin-route-v4',JSON.stringify(st))},ho);
await p.reload();await p.waitForTimeout(300);
console.log('hideOpt',ho,await p.evaluate(()=>({count:document.querySelector('#g20 .count').textContent,tag:document.querySelector('#g20 .tag').textContent,cardHidden:document.getElementById('g20').hidden,nu:document.querySelector('#nowStar .ns-pt').innerText})));}
console.log(errs);await b.close();})();
