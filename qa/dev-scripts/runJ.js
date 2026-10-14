const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:1000}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2]);
await p.evaluate(()=>{const st=JSON.parse(localStorage.getItem('aion2-assassin-route-v4')||'{}');st.level=20;st.quest='A New Lead';st.dvReset1=true;localStorage.setItem('aion2-assassin-route-v4',JSON.stringify(st))});
await p.reload();await p.waitForTimeout(500);
await p.screenshot({path:'j1.png'});
const ns=await p.evaluate(()=>document.getElementById('nowStar').innerText);console.log('NOW:\n'+ns);
console.log('AHEAD:\n'+await p.evaluate(()=>document.getElementById('ahead').innerText));
const before=await p.evaluate(()=>document.querySelector('#nowStar .nu-row input')?.dataset.nowk);
await p.click('#nowStar .nu-row input');await p.waitForTimeout(900);
console.log('ticked',before, await p.evaluate(k=>JSON.parse(localStorage.getItem('aion2-assassin-route-v4')).checks[k],before));
await p.click('#qsFold').catch(e=>console.log('nofold'));await p.waitForTimeout(200);
console.log('subs:',await p.evaluate(()=>document.getElementById('questSubs').innerText));
await p.click('#trackWrap summary');await p.waitForTimeout(200);
await p.screenshot({path:'j2.png'});
// undo tick
await p.evaluate(k=>{const st=JSON.parse(localStorage.getItem('aion2-assassin-route-v4'));delete st.checks[k];st.qsHide=false;st.trackOpen=false;localStorage.setItem('aion2-assassin-route-v4',JSON.stringify(st))},before);
console.log('ERR',errs);await b.close();})();
