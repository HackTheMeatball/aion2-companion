const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:900}});
 const errs=[]; p.on('pageerror', e => { errs.push(e.message); console.log('ERR', e.message); });
 await p.goto('file://' + process.argv[2]);
 await p.evaluate(() => localStorage.setItem('aion2-assassin-route-v4', JSON.stringify({level:23, quest:'Disturbed Balance', mode:'basic'})));
 await p.reload(); await p.waitForTimeout(500);
 await p.evaluate(()=>{ SP_STEPS.forEach(x=>state.checks[x.k]=true); save(); update(); });
 // drop everything above the story
 for (let i=0;i<8;i++){ const t = await p.$eval('#nowStar .ns-card.first h3', e=>e.textContent); if (t.startsWith('Story')) break; await p.click('#nowStar .ns-card.first .meta button'); await p.waitForTimeout(1300); }
 const q = await p.evaluate(()=>state.quest);
 console.log('top', await p.$eval('#nowStar .ns-card.first', e=>e.querySelector('h3').textContent+' | '+e.querySelector('.meta').textContent+' | objs '+e.querySelectorAll('.ns-obj input').length));
 await (await p.$('#nowStar')).screenshot({path:'nsx-story2.png'});
 await p.click('#nowStar .ns-card.first .meta .ns-btn.primary'); await p.waitForTimeout(1000);
 console.log(await p.evaluate(q=>({lv:state.level, quest:state.quest, qsteps:state.qsteps[q], n:QUEST_STEPS[q].length, qsub:(state.qsub||{})[q]}), q));
 // gated case
 await p.evaluate(()=>{ state.level=10; save(); update(); });
 console.log('gated', await p.evaluate(()=>{ const c=[...nowEl.querySelectorAll('.ns-card')].find(c=>c.querySelector('h3').textContent.startsWith('Story')); return c ? c.querySelector('p').textContent+' | btn:'+c.querySelector('.meta').innerHTML : 'none'; }));
 await p.evaluate(()=>{ state.level=24; save(); update(); });
 const lvb = await p.$('button:has-text("Level up"):visible'); console.log('lvbtn', !!lvb); if (lvb) { await lvb.click(); await p.waitForTimeout(400); }
 const cb = await p.$('#main li.item input[data-k]:not(:checked):not([disabled]):visible'); console.log('cb', !!cb); if (cb) { await cb.click(); await p.waitForTimeout(400); }
 console.log('lv', await p.evaluate(()=>state.level), 'errors', errs.length);
 await b.close(); })();
