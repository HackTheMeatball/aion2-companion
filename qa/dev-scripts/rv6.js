const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1500,height:900}});
 await p.goto('file://' + process.argv[2]);
 for (const w of [1500,400]) { await p.setViewportSize({width:w,height:900});
 await p.evaluate(() => localStorage.setItem('aion2-assassin-route-v4', JSON.stringify({level:23, quest:'Disturbed Balance', mode:'advanced'}))); await p.reload(); await p.waitForTimeout(400);
 for (const re of ['Clear','Regional']) {
 const c = await p.evaluate((re) => { const w=document.querySelector('#nsqWrap'); const c=[...w.children].find(c=>new RegExp(re).test(c.querySelector('h3').innerText)); c.style.outline='0'; const cs=[...w.children]; cs.forEach(x=>{ if(x!==c) x.remove(); }); c.classList.add('first'); w.style.height='auto'; w.style.overflow='visible'; const r=c.getBoundingClientRect(); return [r.x,r.y+scrollY,r.width,r.height]; }, re);
 await p.screenshot({path:`rv-${re}-${w}.png`, clip:{x:c[0],y:c[1],width:c[2],height:Math.min(c[3],600)}, fullPage:true});
 await p.reload(); await p.waitForTimeout(300); } }
 await b.close(); })();
