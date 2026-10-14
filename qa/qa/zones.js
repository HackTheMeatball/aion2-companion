const { chromium } = require('playwright'); const path = require('path'); const ROOT = path.resolve(__dirname, '..', '..');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); await p.goto('file://' + ROOT + '/qa-cur.html'); await p.waitForTimeout(300);
  console.log(JSON.stringify(await p.evaluate(() => { const areas = [...new Set(AREA_ITEMS.map(x => x.area))]; const rqZ = [...new Set(RQ.map(q => q.zone))];
    const byPlace = {}; RQ.forEach(q => { if (q.place) (byPlace[q.place] = byPlace[q.place] || new Set()).add(q.zone); });
    const kibZ = {}; RQ.forEach(q => { if (q.kib) (kibZ[q.kib] = kibZ[q.kib] || new Set()).add(q.zone); });
    return { areas, rqNotArea: rqZ.filter(z => !areas.includes(z)), placeMulti: Object.entries(byPlace).filter(([, s]) => s.size > 1).map(([k, s]) => [k, [...s]]), kibMulti: Object.entries(kibZ).filter(([, s]) => s.size > 1).map(([k, s]) => [k, [...s]]), kibArea: Object.fromEntries(RQ.filter(q => q.kib && KIB_AREA[q.kib] && KIB_AREA[q.kib] !== q.zone).map(q => [q.name, q.zone + ' vs KIB_AREA ' + KIB_AREA[q.kib]])) }; }), null, 1));
  await b.close(); })();
