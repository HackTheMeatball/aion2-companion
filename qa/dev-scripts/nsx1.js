const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:1280,height:900}}); const p = await ctx.newPage();
 const errs=[]; p.on('pageerror', e => { errs.push(e.message); console.log('ERR', e.message); });
 await p.addInitScript(() => { window.documentPictureInPicture = { requestWindow: async (o) => window.open('about:blank', 'pip', `width=${o.width},height=${o.height}`) }; });
 await p.goto('file://' + process.argv[2]);
 await p.evaluate(() => localStorage.setItem('aion2-assassin-route-v4', JSON.stringify({level:23, quest:'Disturbed Balance', mode:'basic'})));
 await p.reload(); await p.waitForTimeout(500);
 const info = () => p.evaluate(() => ({lv: state.level, q: state.quest, qs: (state.qsteps||{})[state.quest], cards: [...nowEl.querySelectorAll('.ns-card .title h3')].slice(0,4).map(x=>x.textContent), btn: (nowEl.querySelector('.ns-card.first .meta button')||{}).textContent}));
 console.log('start', JSON.stringify(await info()));
 await (await p.$('#nowStar')).screenshot({path:'nsx-page.png'});
 // hotkeys: Space without hover should not act
 await p.mouse.move(5,5); const st0 = JSON.stringify(await info());
 await p.keyboard.press('Space'); await p.waitForTimeout(600);
 console.log('space-nohover unchanged:', st0 === JSON.stringify(await info()));
 // arrow down with hover
 await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(300); await p.$eval('#nsqWrap', e=>e.scrollIntoView({block:'center'})); await p.waitForTimeout(300); const box = await (await p.$('#nsqWrap')).boundingBox(); await p.mouse.move(box.x+box.width/2, box.y+10);
 await p.keyboard.press('ArrowDown'); await p.waitForTimeout(700);
 console.log('scrollTop after down', await p.evaluate(()=>nowEl.querySelector('#nsqWrap').scrollTop));
 await p.keyboard.press('ArrowUp'); await p.waitForTimeout(700);
 console.log('scrollTop after up', await p.evaluate(()=>nowEl.querySelector('#nsqWrap').scrollTop));
 // Space with hover: complete top card
 const before = await info(); await p.keyboard.press('Space'); await p.waitForTimeout(900);
 console.log('after space', JSON.stringify(await info()), 'was', before.cards[0]);
 await p.evaluate(()=>{ SP_STEPS.forEach(x=>state.checks[x.k]=true); state.pendSt=0; state.pendCr=0; save(); update(); }); await p.waitForTimeout(300);
 // Story turned in: clear everything above the story by finding story card
 for (let i=0;i<10;i++){ const f = await info(); if (/Story|story/.test(f.cards[0])) break; const btn = await p.$('#nowStar .ns-card.first .meta .ns-btn.primary'); if (!btn) break; await btn.click(); await p.waitForTimeout(900); }
 const s1 = await info(); console.log('top now', JSON.stringify(s1));
 await p.evaluate(()=>{ window.__steps = QUEST_STEPS[state.quest] ? QUEST_STEPS[state.quest].length : -1; });
 await (await p.$('#nowStar')).screenshot({path:'nsx-story.png'});
 await p.click('#nowStar .ns-card.first .meta .ns-btn.primary'); await p.waitForTimeout(900);
 console.log('after turned in', JSON.stringify(await info()), 'prev quest qsteps', await p.evaluate(q=>JSON.stringify([(state.qsteps||{})[q], window.__steps, (state.qsub||{})[q]]), s1.q));
 // PiP
 const [pop] = await Promise.all([ctx.waitForEvent('page'), p.click('#nowStar .ns-pop')]);
 await p.waitForTimeout(500);
 console.log('placeholder', await p.evaluate(()=>!!document.getElementById('nsAway') && !document.getElementById('nowStar')));
 await pop.setViewportSize({width:400,height:280}); await pop.waitForTimeout(300);
 await pop.screenshot({path:'nsx-pip.png'});
 await p.screenshot({path:'nsx-page-ph.png', clip:{x:0,y:0,width:1280,height:900}});
 const b1 = await info();
 await pop.click('#nowStar .ns-card.first .meta button'); await pop.waitForTimeout(900);
 console.log('pip click', b1.cards[0], '->', JSON.stringify(await info()));
 await pop.keyboard.press('ArrowDown'); await pop.waitForTimeout(600);
 console.log('pip scroll', await pop.evaluate(()=>document.querySelector('#nsqWrap').scrollTop));
 const b2 = await info(); await pop.keyboard.press('Space'); await pop.waitForTimeout(900);
 console.log('pip space', b2.cards[0], '->', (await info()).cards[0]);
 await pop.screenshot({path:'nsx-pip2.png'});
 await pop.close(); await p.waitForTimeout(500);
 console.log('restored', await p.evaluate(()=>({back: document.getElementById('nowStar')===nowEl, ph: !!document.getElementById('nsAway'), pip: pipWin})));
 await p.evaluate(()=>{ state.level++; save(); update(); }); await p.waitForTimeout(300);
 console.log('update ok', JSON.stringify(await info()));
 // smoke: Level up button, tick a milestone item
 const lvb = await p.$('text=Level up'); if (lvb) { await lvb.click(); await p.waitForTimeout(300); }
 const cb = await p.$('#main li.item input[data-k]:not(:checked):not([disabled])'); if (cb) { await cb.click(); await p.waitForTimeout(300); }
 console.log('smoke', JSON.stringify(await info()), 'errors', errs.length);
 await (await p.$('#nowStar')).screenshot({path:'nsx-page2.png'});
 await b.close(); })();
