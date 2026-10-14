const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:1000}});
await p.goto('file://'+process.argv[2]);
await p.evaluate(()=>{const st=JSON.parse(localStorage.getItem('aion2-assassin-route-v4')||'{}');st.level=20;st.quest='Imminent Threat';st.dvReset1=true;st.trackOpen=true;localStorage.setItem('aion2-assassin-route-v4',JSON.stringify(st))});
await p.reload();await p.waitForTimeout(500);
console.log(await p.evaluate(()=>{const d=document.getElementById('trackWrap');const t=document.getElementById('track');return {open:d.open,trackH:t.getBoundingClientRect().height,sumBefore:getComputedStyle(d.querySelector('summary'),'::before').content, summaryRect:d.querySelector('summary').getBoundingClientRect().toJSON(), wrapRect:d.getBoundingClientRect().toJSON(), ua:navigator.userAgent}}));
const el=await p.$('section.card.where');await el.screenshot({path:'k.png'});await b.close();})();
