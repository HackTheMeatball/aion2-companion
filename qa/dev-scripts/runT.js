const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(e.stack.split('\n').slice(0,3).join(' ')));
await p.goto('file://'+process.argv[2]);
await p.evaluate(()=>{const st=JSON.parse(localStorage.getItem('aion2-assassin-route-v4')||'{}');st.level=21;st.quest='Imminent Threat';st.dvReset1=true;st.checks={};['hg','ew','amb','qs','ew2','as','as2','corner','ie','ss','z:hg','z:ie'].forEach(k=>st.checks['dv:'+k]=true);st.dvTotal=79;st.sdOpen=false;localStorage.setItem('aion2-assassin-route-v4',JSON.stringify(st))});
await p.reload();await p.waitForTimeout(500);
await p.screenshot({path:'t1.png'});
await p.click('#sdTab');await p.waitForTimeout(400);await p.screenshot({path:'t2.png'});
console.log('ERR',errs);await b.close();})();
