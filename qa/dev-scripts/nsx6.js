const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:1280,height:900}}); const p = await ctx.newPage();
 const errs=[]; p.on('pageerror', e => { errs.push(e.message); console.log('ERR', e.message); });
 await p.addInitScript(() => { window.documentPictureInPicture = { requestWindow: async (o) => window.open('about:blank', '', 'width=400,height=280') }; });
 await p.goto('file://' + process.argv[2]);
 await p.evaluate(() => localStorage.setItem('aion2-assassin-route-v4', JSON.stringify({level:23, quest:'Disturbed Balance', mode:'basic'})));
 await p.reload(); await p.waitForTimeout(600);
 const top = () => p.$eval('#nowStar .ns-card.first', e=>e.querySelector('h3').textContent+' | '+((e.querySelector('.meta button')||{}).dataset||{}).now);
 console.log('pop btn:', await p.$$eval('#nowStar [data-nspop]', x=>x.length));
 console.log('top0', await top());
 // Hotkeys: no effect without hover
 await p.mouse.move(5,5); await p.keyboard.press('Space'); await p.waitForTimeout(800); console.log('after Space w/o hover', await top()); await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'})); await p.waitForTimeout(500);
 // hover then ArrowDown
 const bb = await p.$eval('#nowStar', e=>{const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+20];});
 await p.mouse.move(bb[0], bb[1]);
 await p.keyboard.press('ArrowDown'); await p.waitForTimeout(700); console.log('scrollTop after down', await p.$eval('#nsqWrap', w=>w.scrollTop));
 await p.keyboard.press('ArrowUp'); await p.waitForTimeout(700); console.log('scrollTop after up', await p.$eval('#nsqWrap', w=>w.scrollTop));
 const lv0 = await p.evaluate(()=>state.level);
 await p.keyboard.press('Space'); await p.waitForTimeout(1300); console.log('after Space hover', await top());
 // input focus guard
 // advance to story card
 await p.evaluate(()=>{ SP_STEPS.forEach(x=>state.checks[x.k]=true); GATES.forEach(g=>{ if (g.lv<=state.level) checkable(g).forEach(x=>state.checks[x.k]=true); }); state.areaRun={}; state.pendSt=0; state.pendCr=0; save(); update(); });
 for (let i=0;i<10;i++){ const r=await top(); if (r.startsWith('Story')||r.includes('story')) break; const btn=await p.$('#nowStar .ns-card.first .meta button'); if(!btn) break; await btn.click(); await p.waitForTimeout(1200); }
 console.log('story card', await top(), 'objs', await p.$$eval('#nowStar .ns-card.first .ns-obj li', x=>x.length), 'btn', await p.$eval('#nowStar .ns-card.first .meta button', e=>e.textContent).catch(()=>null));
 await p.screenshot({path:'nsx6-story.png', clip:{x:0,y:0,width:1280,height:700}});
 const q0 = await p.evaluate(()=>[state.quest, state.level]);
 await p.click('#nowStar .ns-card.first .meta .ns-btn.primary'); await p.waitForTimeout(1300);
 const q1 = await p.evaluate((q)=>[state.quest, state.level, (state.qsteps||{})[q], (QUEST_STEPS[q]||[]).length], q0[0]);
 console.log('turned in:', q0, '->', q1);
 // PiP
 await p.mouse.move(5,5);
 const popP = ctx.waitForEvent('page'); await p.click('#nowStar [data-nspop]'); const w = await popP; await p.waitForTimeout(600);
 console.log('in page nowStar?', await p.$$eval('#nowStar', x=>x.length), 'placeholder', await p.$eval('#nsAway', e=>e.textContent).catch(()=>null));
 console.log('pip has nowStar', await w.$$eval('#nowStar', x=>x.length), 'body class', await w.evaluate(()=>document.body.className), 'hint', await w.$eval('.pip-hint', e=>e.textContent), 'styles', await w.$$eval('style', x=>x.length));
 console.log('pop btn visible in pip', await w.$eval('[data-nspop]', e=>getComputedStyle(e).display).catch(()=>'none-elem'));
 await w.setViewportSize({width:400,height:280}); await w.waitForTimeout(300);
  const ptop = () => w.$eval('#nowStar .ns-card.first', e=>e.querySelector('h3').textContent+' | '+((e.querySelector('.meta button')||{}).dataset||{}).now);
 await p.evaluate(()=>{ state.quest='Disturbed Balance'; state.qsteps={}; save(); update(); }); await w.waitForTimeout(400);
 console.log('pip top', await ptop()); await w.screenshot({path:'nsx6-pip.png'});
 await w.keyboard.press('ArrowDown'); await w.waitForTimeout(700); console.log('pip scroll', await w.$eval('#nsqWrap', x=>x.scrollTop));
 await w.keyboard.press('ArrowUp'); await w.waitForTimeout(700);
 // tick an objective in PiP
 const ob = await w.$('#nowStar input[data-nsobj]'); if (ob) { const before = await p.evaluate(()=>JSON.stringify((state.qsteps||{})[state.quest]||[])); await ob.click(); await w.waitForTimeout(1500); console.log('pip obj tick', before, '->', await p.evaluate(()=>JSON.stringify((state.qsteps||{})[state.quest]||[]))); }
 const pb = await w.$('#nowStar .ns-card.first .meta button'); const pq0 = await p.evaluate(()=>state.quest);
 if (pb) { console.log('pb', await pb.evaluate(e=>[e.outerHTML, e.disabled, e.closest('.ns-card').className, document.querySelector('#nsqWrap').scrollTop])); await pb.click(); await w.waitForTimeout(1400); console.log('pip click Turned in: quest ->', await p.evaluate(()=>[state.quest,state.level])); }
 await p.evaluate(()=>{ state.quest='Disturbed Balance'; state.qsteps={}; save(); update(); }); await w.waitForTimeout(400); await w.mouse.click(390,10);
 console.log('pip click card btn: quest', pq0, '->', await p.evaluate(()=>state.quest), 'top', await ptop());
 await w.keyboard.press('Space'); await w.waitForTimeout(1400); console.log('pip Space: quest', await p.evaluate(()=>state.quest), 'top', await ptop());
 await w.screenshot({path:'nsx6-pip2.png'});
 await p.screenshot({path:'nsx6-page-ph.png', clip:{x:0,y:0,width:1280,height:500}});
 // Bring back
 await p.click('#nsAway button'); await p.waitForTimeout(800);
 console.log('returned', await p.$$eval('#nowStar', x=>x.length), 'placeholder', await p.$$eval('#nsAway', x=>x.length), 'pipWin', await p.evaluate(()=>pipWin));
 // works again in page
 console.log('page top after return', await top());
 // Level up + milestone tick smoke
 const L0 = await p.evaluate(()=>state.level);
 const lu = await p.$('#lvlUpBig'); if (lu) { await lu.click(); await p.waitForTimeout(800); }
 console.log('level up', L0, '->', await p.evaluate(()=>state.level), 'btn found', !!lu);
 const cb = await p.$('#main details[open] ul.items input[data-k]:not(:checked)');
 if (cb) { const k = await cb.evaluate(e=>e.dataset.k); await cb.evaluate(e=>e.click()); await p.waitForTimeout(500); console.log('milestone tick', k, await p.evaluate(k=>state.checks[k], k)); }
 // input guard: focus an input, hover nowStar, press space
 await p.screenshot({path:'nsx6-page.png', clip:{x:0,y:0,width:1280,height:700}});
 console.log('errors', errs.length);
 await b.close(); })();
