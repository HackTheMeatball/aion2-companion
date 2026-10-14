const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:1000},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2]);
await p.evaluate(()=>{const st=JSON.parse(localStorage.getItem('aion2-assassin-route-v4')||'{}');st.level=20;st.quest='Imminent Threat';st.dvReset1=true;st.qsteps={'Imminent Threat':[0,1]};st.showObj=true;localStorage.setItem('aion2-assassin-route-v4',JSON.stringify(st))});
await p.reload();await p.waitForTimeout(400);
const r=await p.evaluate(()=>{const b=document.querySelector('.ms-head').getBoundingClientRect();return {x:b.x-10,y:b.y-30,width:b.width+20,height:b.height+50}});await p.screenshot({path:'n1.png',clip:r});
await p.click('#jFiltX');await p.waitForTimeout(150);
console.log(await p.evaluate(()=>({n:document.getElementById('jFiltN').textContent,x:document.getElementById('jFiltX').hidden,subs:document.getElementById('questSubs').innerText.slice(0,40)})));
console.log('ERR',errs);await b.close();})();
