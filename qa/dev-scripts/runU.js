const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2]);
await p.evaluate(()=>{const st=JSON.parse(localStorage.getItem('aion2-assassin-route-v4')||'{}');st.level=21;st.quest='Imminent Threat';st.dvReset1=true;st.checks={};['hg','ew','amb','qs','ew2','as','as2','corner','ie','ss','z:hg','z:ie'].forEach(k=>st.checks['dv:'+k]=true);st.dvTotal=79;st.sdOpen=false;localStorage.setItem('aion2-assassin-route-v4',JSON.stringify(st))});
await p.reload();await p.waitForTimeout(600);
await p.screenshot({path:'u1.png'});
console.log(await p.evaluate(()=>{const g=document.querySelector('#main .top-grid');g.style.alignItems='start';const r=[...g.children].map(c=>c.id+':'+c.offsetHeight);g.style.alignItems='';fitSkills();return r+' cols '+getComputedStyle(g).gridTemplateColumns}), await p.evaluate(()=>[...document.querySelectorAll('#main .top-grid > *')].map(c=>c.id+':'+c.offsetHeight)), await p.evaluate(()=>[...document.querySelectorAll('#spSoon li')].filter(l=>!l.hidden).length));
console.log('ERR',errs);await b.close();})();
