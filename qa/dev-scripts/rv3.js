const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:1500,height:900}}); const p = await ctx.newPage();
 const errs=[]; p.on('pageerror', e => { errs.push('main:'+e.message); console.log('PAGEERR', e.message); });
 ctx.on('page', pg => pg.on('pageerror', e => console.log('PIPERR', e.message)));
 await p.addInitScript(() => { window.documentPictureInPicture = { requestWindow: async (o) => window.open('about:blank','', 'width=400,height=280') }; });
 await p.goto('file://' + process.argv[2]);
 const seed = async (o) => { await p.evaluate(o => localStorage.setItem('aion2-assassin-route-v4', JSON.stringify(o)), o); await p.reload(); await p.waitForTimeout(400); };
 const top = async (pg) => pg.$eval('#nowStar .ns-card.first h3', e=>e.innerText).catch(e=>'ERR '+e.message);
 // Eye of the Red Tower check
 await seed({level:32, quest:'Eye of the Red Tower', mode:'advanced'});
 console.log('EyeRT:', (await p.$$eval('#nowStar .ns-card', cs=>cs.map(c=>c.innerText.replace(/\s+/g,' ')).filter(t=>/Story|Clear|Run /.test(t)))).join('\n  '));
 // info button on non-first card
 await seed({level:23, quest:'Disturbed Balance', mode:'advanced'});
 const r = await p.evaluate(() => { const bs=[...document.querySelectorAll('#nowStar .ns-card:not(.first) .nsinfo')]; if(!bs.length) return 'none'; try { bs[0].click(); return 'ok '+bs[0].closest('.ns-card').className; } catch(e) { return 'THROW '+e.message; } });
 console.log('info on non-first card:', r, errs.slice(-1));
 // story Turned in one-click with only story on top: mark skills done via hotkey? simpler: seed checks? click story button directly
 await seed({level:23, quest:'Disturbed Balance', mode:'advanced'});
 const before = await p.evaluate(()=>state.level);
 await p.evaluate(() => { document.querySelector('#nowStar [data-now="story"]').click(); });
 await p.waitForTimeout(800);
 console.log('story turned in (non-top):', await p.evaluate(()=>[state.level, state.quest, JSON.stringify(state.qsteps)]), 'lv before', before);
 // pop out
 await seed({level:23, quest:'Disturbed Balance', mode:'advanced'});
 const [pip] = await Promise.all([ctx.waitForEvent('page'), p.click('#nowStar [data-nspop]')]);
 await pip.waitForTimeout(600);
 console.log('pip has nowStar:', await pip.$$eval('#nowStar', x=>x.length), 'main placeholder:', await p.$$eval('#nsAway', x=>x.length));
 console.log('pip styles:', await pip.evaluate(()=>[document.querySelectorAll('style,link').length, getComputedStyle(document.body).backgroundColor, document.documentElement.className]));
 console.log('pip vp', await pip.evaluate(()=>[innerWidth, innerHeight]), 'stack h', await pip.$eval('#nsqWrap', w=>[w.offsetHeight, w.scrollHeight, w.querySelector('.ns-card').offsetHeight, document.documentElement.scrollHeight]));
 await pip.screenshot({path:'rv-pip1.png'});
 await p.screenshot({path:'rv-main-ph.png', clip:{x:0,y:0,width:1500,height:500}});
 // click Spent in pip
 const t0 = await top(pip);
 await pip.click('#nowStar .ns-card.first .meta button'); await pip.waitForTimeout(900);
 console.log('pip Spent:', t0, '->', await top(pip));
 // keyboard in pip
 await pip.keyboard.press('Space'); await pip.waitForTimeout(900); console.log('pip Space ->', await top(pip));
 await pip.keyboard.press('ArrowDown'); await pip.waitForTimeout(600); console.log('pip ArrowDown scrollTop', await pip.$eval('#nsqWrap', w=>w.scrollTop));
 // tip button in pip
 const tipr = await pip.evaluate(() => { const b=document.querySelector('#nowStar .tipbtn'); if(!b) return 'no tipbtn'; b.click(); return b.parentElement.className + ' / ' + (b.closest('.nsbox,.ns-card')||{}).className; });
 console.log('pip tip:', tipr);
 // rq checkbox in pip
 const rq = await pip.$('#nowStar .q-cb:not([disabled])');
 if (rq) { const k = await rq.getAttribute('data-rqk'); await rq.click(); await pip.waitForTimeout(300); console.log('pip rq started:', await p.evaluate(k=>[state.started&&state.started[k], state.checks[k]], k)); } else console.log('no q-cb visible in pip');
 // close mid animation
 await pip.evaluate(()=>{ const b=document.querySelector('#nowStar .ns-card.first .meta .ns-btn.primary'); if(b) b.click(); });
 await pip.close(); await p.waitForTimeout(800);
 console.log('after close: nowStar in main', await p.$$eval('#main #nowStar, #nowStar', x=>x.length), 'nsAway', await p.$$eval('#nsAway', x=>x.length), 'top', await top(p), 'disabled btns', await p.$$eval('#nowStar button[disabled]', x=>x.length));
 // update after restore
 await p.evaluate(()=>{ state.level=24; save(); update(); }); console.log('after update top:', await top(p));
 // second pop out & Bring back
 const [pip2] = await Promise.all([ctx.waitForEvent('page'), p.click('#nowStar [data-nspop]')]); await pip2.waitForTimeout(400);
 await p.click('#nsAway button'); await p.waitForTimeout(500);
 console.log('bring back: ', await p.$$eval('#nsAway', x=>x.length), await p.$$eval('#nowStar', x=>x.length), pip2.isClosed());
 console.log('errors', errs);
 await b.close(); })();
