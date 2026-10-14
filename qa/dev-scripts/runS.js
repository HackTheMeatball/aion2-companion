const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2]);
await p.evaluate(()=>{const st=JSON.parse(localStorage.getItem('aion2-assassin-route-v4')||'{}');st.level=20;st.dvReset1=true;st.checks={};st.hide=true;st.hideCards=true;st.open={g20:true};localStorage.setItem('aion2-assassin-route-v4',JSON.stringify(st))});
await p.reload();await p.waitForTimeout(400);
const st=k=>p.evaluate(k=>{const i=document.querySelector(`#main input[data-k="${k}"]`);const li=i.closest('li');return {cls:li.className,hidden:li.hidden,op:getComputedStyle(li).opacity}},k);
const k=await p.evaluate(()=>document.querySelector('#g20 li.item input[data-k]:not([disabled])').dataset.k);
await p.click(`#main input[data-k="${k}"]`);
for(const t of [100,500,300,400]){await p.waitForTimeout(t);console.log(t,JSON.stringify(await st(k)));}
// complete a whole card: g6 items
const keys=await p.evaluate(()=>[...document.querySelectorAll('#g6 li.item input[data-k]')].map(i=>i.dataset.k));
await p.evaluate(ks=>{ks.slice(0,-1).forEach(k=>state.checks[k]=true);update();},keys);
await p.evaluate(()=>{document.getElementById('g6').open=true});
await p.click(`#main input[data-k="${keys[keys.length-1]}"]`).catch(e=>console.log('click err',e.message.slice(0,80)));
await p.waitForTimeout(1300);console.log('card mid',await p.evaluate(()=>({cls:document.getElementById('g6').className,h:document.getElementById('g6').hidden})));
await p.waitForTimeout(600);console.log('card end',await p.evaluate(()=>({cls:document.getElementById('g6').className,h:document.getElementById('g6').hidden})));
console.log('ERR',errs);await b.close();})();
