const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2]);
await p.evaluate(()=>{const st=JSON.parse(localStorage.getItem('aion2-assassin-route-v4')||'{}');st.level=20;st.quest='Imminent Threat';st.dvReset1=true;st.qsteps={'Imminent Threat':[0,1]};localStorage.setItem('aion2-assassin-route-v4',JSON.stringify(st))});
await p.reload();await p.waitForTimeout(500);
const ns=()=>p.evaluate(()=>document.getElementById('nowStar').innerText.replace(/\n+/g,' | '));
console.log('1:',await ns());
console.log('AHEAD:',await p.evaluate(()=>document.getElementById('ahead').innerText.replace(/\n+/g,' | ')));
await p.screenshot({path:'p1.png',clip:{x:0,y:0,width:1500,height:420}});
await p.click('#nowStar .ns-btn.primary');await p.waitForTimeout(500);console.log('2:',await ns());
// mark all skill/board/milestone done to see story action
await p.evaluate(()=>{const st=JSON.parse(localStorage.getItem('aion2-assassin-route-v4'));GATES.forEach(g=>{if(g.lv<=20)g.items.forEach((it,j)=>st.checks[it.k||g.id+':'+j]=true)});SP_STEPS.forEach(x=>{if(x.req<=20)st.checks[x.k]=true});localStorage.setItem('aion2-assassin-route-v4',JSON.stringify(st))});
await p.reload();await p.waitForTimeout(500);console.log('3:',await ns());
await p.click('#nowStar .ns-btn.primary');await p.waitForTimeout(300);console.log('4:',await ns());
console.log('ERR',errs);await b.close();})();
