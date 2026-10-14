const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
 await p.goto('file://' + process.argv[2]); await p.waitForTimeout(300);
 console.log(await p.evaluate(()=>{const i=QUESTS.findIndex(([,n])=>n==="A New Lead"); return QUESTS.slice(i-1,i+14).map(q=>q.join(' | ')).join('\n')}));
 await b.close(); })();
