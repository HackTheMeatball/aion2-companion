const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:1500,height:900}}); const p = await ctx.newPage();
 p.on('pageerror', e => console.log('PAGEERR', e.message));
 await p.addInitScript(() => { window.documentPictureInPicture = { requestWindow: async (o) => window.open('about:blank','', 'width=400,height=280') }; });
 await p.goto('file://' + process.argv[2]);
 const seed = async (o) => { await p.evaluate(o => localStorage.setItem('aion2-assassin-route-v4', JSON.stringify(o)), o); await p.reload(); await p.waitForTimeout(400); };
 const top = async (pg) => pg.$eval('#nowStar .ns-card.first h3', e=>e.innerText);
 await seed({level:32, quest:'Eye of the Red Tower', mode:'advanced'});
 console.log((await p.$$eval('#nowStar .ns-card', cs=>cs.map(c=>(c.querySelector('h3').innerText+' | '+((c.querySelector('.title p')||{}).innerText||'')).replace(/\s+/g,' ')))).join('\n'));
 // hotkeys main: not hovering
 await seed({level:23, quest:'Disturbed Balance', mode:'advanced'});
 const t0 = await top(p); await p.mouse.move(5, 890); await p.keyboard.press('Space'); await p.waitForTimeout(700);
 console.log('not hovering Space:', t0 === await top(p), 'scrollY', await p.evaluate(()=>scrollY));
 const box = await p.$eval('#nowStar .ns-card.first', e=>{const r=e.getBoundingClientRect(); return [r.x+r.width/2, r.y+10];});
 await p.evaluate(()=>scrollTo(0,0)); await p.mouse.move(box[0], box[1]); await p.keyboard.press('Enter'); await p.waitForTimeout(800);
 console.log('hover Enter:', t0, '->', await top(p));
 // top card non-completion (Show): rq at lv 15 gated
 await seed({level:15, quest:'Imminent Threat', mode:'advanced', checks:{}});
 // mark skills spent quickly by clicking until top is rq
 for (let i=0;i<6;i++){ const t=await top(p); if(/Regional/.test(t)) break; await p.click('#nowStar .ns-card.first .meta button'); await p.waitForTimeout(700); }
 const tr = await top(p); const m0 = await p.evaluate(()=>scrollY);
 const bx = await p.$eval('#nowStar .ns-card.first', e=>{const r=e.getBoundingClientRect(); return [r.x+20, r.y+10];}); await p.mouse.move(bx[0], bx[1]);
 await p.keyboard.press('Enter'); await p.waitForTimeout(700); console.log('Enter on Show card:', tr, '->', await top(p), 'scrolled', m0, await p.evaluate(()=>scrollY));
 // pip sizing at 400x280
 await seed({level:23, quest:'Disturbed Balance', mode:'advanced'});
 const [pip] = await Promise.all([ctx.waitForEvent('page'), p.click('#nowStar [data-nspop]')]);
 await pip.setViewportSize({width:400,height:280}); await pip.waitForTimeout(300);
 await pip.evaluate(()=>{}); await p.evaluate(()=>update()); await pip.waitForTimeout(500);
 console.log('pip stack', await pip.evaluate(()=>{const w=document.querySelector('#nsqWrap'); const h=document.querySelector('.pip-hint'); return {w:w.offsetHeight, sh:w.scrollHeight, card:w.querySelector('.ns-card').offsetHeight, doc:document.documentElement.scrollHeight, docW:document.documentElement.scrollWidth, hint:h&&h.getBoundingClientRect().top};}));
 await pip.screenshot({path:'rv-pip400.png'});
 // advance to story card in pip
 for (let i=0;i<8;i++){ const t=await top(pip); if(/Story/.test(t)) break; await pip.click('#nowStar .ns-card.first .meta button'); await pip.waitForTimeout(700); }
 console.log('pip top now', await top(pip)); await pip.screenshot({path:'rv-pip400-story.png'});
 console.log('pip story', await pip.evaluate(()=>{const w=document.querySelector('#nsqWrap'); return {w:w.offsetHeight, card:w.querySelector('.ns-card').offsetHeight, doc:document.documentElement.scrollHeight, vh:innerHeight};}));
 // objective checkbox in pip
 const ob = await pip.$('#nowStar input[data-nsobj]'); if (ob) { await ob.check(); await pip.waitForTimeout(1500); console.log('obj after check', await p.evaluate(()=>JSON.stringify(state.qsteps))); }
 await pip.close(); await p.waitForTimeout(300);
 await b.close(); })();
