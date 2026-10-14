const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:1000},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2]);
const set=async(total)=>{await p.evaluate(t=>{const st=JSON.parse(localStorage.getItem('aion2-assassin-route-v4')||'{}');st.level=21;st.dvReset1=true;st.checks={};['hg','ew','amb','qs','ew2','as','as2','corner','ie','ss','z:hg','z:ie'].forEach(k=>st.checks['dv:'+k]=true);st.dvTotal=t;st.dvCost={'dv:hg':10,'dv:ew':5,'dv:amb':8,'dv:qs':5,'dv:ew2':5,'dv:as':4,'dv:as2':4,'dv:corner':4,'dv:ie':5,'dv:ss':4,'dv:z:hg':12,'dv:z:ie':12};localStorage.setItem('aion2-assassin-route-v4',JSON.stringify(st))},total);await p.reload();await p.waitForTimeout(400);};
await set(79);const box=await p.$('#dvBox');await box.screenshot({path:'r1.png'});
console.log('NU1:',await p.evaluate(()=>document.querySelector('#nowStar .ns-pt')?.innerText));
await set(90);await (await p.$('#dvBox')).screenshot({path:'r2.png'});
console.log('NU2:',await p.evaluate(()=>document.querySelector('#nowStar .ns-pt')?.innerText));
console.log('ERR',errs);await b.close();})();
