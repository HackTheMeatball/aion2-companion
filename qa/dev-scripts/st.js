const { chromium } = require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+process.argv[2]);
const mode=process.argv[3];
await p.evaluate(mode=>{const st=JSON.parse(localStorage.getItem('aion2-assassin-route-v4')||'{}');for(const k of ['stTriniel1','stLv','stShards'])delete st[k];st.level=23;st.mode=mode;st.quest='Searching for Survivors';st.checks={};GATES.forEach(g=>{if(g.lv<22)g.items.forEach((it,j)=>{st.checks[it.k||g.id+':'+j]=true})});SP_STEPS.forEach(x=>{if(x.req<=23)st.checks[x.k]=true});DV_NODES().forEach(n=>{if(n.blv<=23)st.checks[n.k]=true});st.dvTotal=104;st.pendSt=0;st.pendCr=0;st.started={};localStorage.setItem('aion2-assassin-route-v4',JSON.stringify(st))},mode);await p.reload();await p.waitForTimeout(800);
console.log('migrated',await p.evaluate(()=>[state.stTriniel1,state.stLv,state.checks['g22:0']]));
await p.fill('#stShards','3');await p.dispatchEvent('#stShards','input');await p.waitForTimeout(400);
await p.screenshot({path:'st_'+mode+'.png',clip:{x:1060,y:90,width:290,height:mode==='basic'?320:520}});
console.log('next up',await p.evaluate(()=>[...document.querySelectorAll('#nowStar .ns-card')].slice(0,3).map(c=>c.querySelector('h3').innerText+' | '+(c.querySelector('p')||{}).innerText).join('\n')));
await p.click('#stCard [data-stup]');await p.waitForTimeout(400);console.log('after up',await p.evaluate(()=>[state.stLv,state.stShards,document.querySelector('#stCard .spname').innerText]));
const e=await p.$('#nowStar');await e.scrollIntoViewIfNeeded();const bb=await e.boundingBox();await p.screenshot({path:'ns_'+mode+'.png',clip:{x:bb.x-5,y:bb.y-5,width:bb.width+10,height:Math.min(bb.height+10,300)}});
console.log(errs);await b.close();})()
