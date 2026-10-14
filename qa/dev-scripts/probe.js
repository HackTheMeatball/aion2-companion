const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
 await p.goto('file://' + process.argv[2]); await p.waitForTimeout(300);
 console.log(await p.evaluate(()=>{
  const kinds={}; AREA_ITEMS.forEach(x=>kinds[x.it.kind]=(kinds[x.it.kind]||0)+1);
  const zl={}; AREA_ITEMS.filter(x=>x.lv!=null).forEach(x=>{(zl[x.area]=zl[x.area]||[]).push(x.lv)});
  const out=STRONGHOLDS.map(([n,a,lo,hi])=>`${n} | ${a} ${lo}-${hi} | zone lvls: ${zl[a]?[...new Set(zl[a])].join(','):'none'}`);
  return JSON.stringify({kinds,bands:AREA_BANDS,inbandKinds:[...new Set(AREA_ITEMS.filter(x=>x.lv!=null).map(x=>x.it.kind))]})+'\n'+out.join('\n');
 })); await b.close(); })();
