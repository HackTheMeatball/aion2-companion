const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:1280,height:900}}); const p = await ctx.newPage();
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.addInitScript(() => { window.documentPictureInPicture = { requestWindow: async (o) => window.open('about:blank', 'pip', `width=${o.width},height=${o.height}`) }; });
 await p.goto('file://' + process.argv[2]);
 await p.evaluate(() => localStorage.setItem('aion2-assassin-route-v4', JSON.stringify({level:23, quest:'Disturbed Balance', mode:'basic'})));
 await p.reload(); await p.waitForTimeout(500);
 await p.evaluate(()=>{ SP_STEPS.forEach(x=>state.checks[x.k]=true); save(); update(); });
 const [pop] = await Promise.all([ctx.waitForEvent('page'), p.click('#nowStar .ns-pop')]);
 await pop.setViewportSize({width:400,height:280}); await pop.waitForTimeout(500);
 const dbg = () => pop.evaluate(()=>{ const w=document.querySelector('#nsqWrap'); return {st:w.scrollTop, sh:w.scrollHeight, ch:w.clientHeight, style:w.style.height, pos:[...w.children].slice(0,4).map(c=>c.offsetTop), act: document.activeElement.tagName}; });
 console.log(await dbg());
 for (const k of ['ArrowDown','ArrowDown','ArrowUp']) { await pop.keyboard.press(k); await pop.waitForTimeout(700); console.log(k, await dbg()); }
 await pop.screenshot({path:'nsx-pip3.png'});
 await b.close(); })();
