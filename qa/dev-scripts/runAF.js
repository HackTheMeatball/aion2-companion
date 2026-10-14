const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2]);
await p.evaluate(()=>{const st=JSON.parse(localStorage.getItem('aion2-assassin-route-v4')||'{}');st.level=21;st.quest='Creeping Shadow';st.qsteps={};st.dvReset1=true;st.checks={};SP_STEPS.forEach(x=>{if(x.req<=21)st.checks[x.k]=true});st.stones=2;st.dvTotal=79;['hg','ew','amb','qs','ew2','as','as2','corner','ie','ss','z:hg','z:ie'].forEach(k=>st.checks['dv:'+k]=true);st.dvCost={'dv:hg':10,'dv:ew':5,'dv:amb':8,'dv:qs':5,'dv:ew2':5,'dv:as':4,'dv:as2':4,'dv:corner':4,'dv:ie':5,'dv:ss':4,'dv:z:hg':12,'dv:z:ie':12,'dv:z:qs':10};localStorage.setItem('aion2-assassin-route-v4',JSON.stringify(st))});
await p.reload();await p.waitForTimeout(700);
await p.screenshot({path:'af1.png',clip:{x:510,y:230,width:830,height:620}});
console.log(await p.evaluate(()=>[document.querySelectorAll('.tipbtn').length, document.querySelector('#dvNextList')?.innerHTML.slice(0,200), getComputedStyle(document.querySelector('#dvBox .tipwrap')||document.body).display]));await p.hover('#dvBox .buystat .tipbtn');await p.waitForTimeout(200);await p.screenshot({path:'af2.png',clip:{x:510,y:230,width:830,height:620}});
console.log(await p.evaluate(()=>[...document.querySelectorAll('#main .top-grid > *')].map(c=>c.id+':'+c.offsetHeight)), await p.evaluate(()=>{const w=document.getElementById('nsqWrap');return w&&[w.clientHeight,w.scrollHeight]}));
console.log('ERR',errs);await b.close();})();
