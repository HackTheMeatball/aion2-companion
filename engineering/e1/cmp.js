/* Compare two cssdiff runs: computed-style hashes per element and screenshot pixels. */
const fs = require('fs'), path = require('path'), sharp = require('sharp');
const [,, A, B] = process.argv;
(async () => {
  const ha = JSON.parse(fs.readFileSync(path.join(A, 'hashes.json'))), hb = JSON.parse(fs.readFileSync(path.join(B, 'hashes.json')));
  let bad = 0;
  for (const k of Object.keys(ha).filter(k => hb[k] || !process.argv[4])) {
    const x = ha[k], y = hb[k]; if (!y) { console.log('missing', k); bad++; continue; }
    const diffs = []; if (x.length !== y.length) diffs.push(`element count ${x.length} vs ${y.length}`);
    let SA = null, SB = null; const parse = str => { const o = {}; str.split(/;(?=[-a-z0-9]+:)/).filter(Boolean).forEach(s => { const j = s.indexOf(':'); o[s.slice(0, j)] = s.slice(j + 1); }); return o; };
    for (let i = 0; i < Math.min(x.length, y.length); i++) if (x[i][0] !== y[i][0] || x[i][1] !== y[i][1]) {
      if (x[i][0] === y[i][0]) { SA = SA || JSON.parse(fs.readFileSync(path.join(A, k + '.styles.json'))); SB = SB || JSON.parse(fs.readFileSync(path.join(B, k + '.styles.json')));
        const pa = parse(SA[i][2]), pb = parse(SB[i][2]); if (Object.keys({ ...pa, ...pb }).every(p => pa[p] === pb[p])) continue; }
      diffs.push(i); }
    let px = 'n/a';
    try {
      const ia = await sharp(path.join(A, k + '.png')).raw().toBuffer({ resolveWithObject: true }), ib = await sharp(path.join(B, k + '.png')).raw().toBuffer({ resolveWithObject: true });
      if (ia.info.width !== ib.info.width || ia.info.height !== ib.info.height) px = `size ${ia.info.width}x${ia.info.height} vs ${ib.info.width}x${ib.info.height}`;
      else { let n = 0; for (let i = 0; i < ia.data.length; i += ia.info.channels) if (ia.data[i] !== ib.data[i] || ia.data[i + 1] !== ib.data[i + 1] || ia.data[i + 2] !== ib.data[i + 2]) n++; px = (n / (ia.info.width * ia.info.height) * 100).toFixed(4) + '% px'; }
    } catch (e) { px = 'err ' + e.message; }
    const pxBad = !/^0\.0000%/.test(px);
    if (diffs.length || pxBad) { bad++; console.log('DIFF', k, px, diffs.length, 'style diffs');
      if (diffs.length && typeof diffs[0] === 'number') { const sa = JSON.parse(fs.readFileSync(path.join(A, k + '.styles.json'))), sb = JSON.parse(fs.readFileSync(path.join(B, k + '.styles.json')));
        diffs.slice(0, 6).forEach(i => { const pa = parse(sa[i][2]), pb = parse(sb[i][2]);
          const props = Object.keys({ ...pa, ...pb }).filter(p => pa[p] !== pb[p]); console.log('   ', sa[i][0], props.map(p => `${p}: ${pa[p]} -> ${pb[p]}`).join(' | ').slice(0, 400)); }); }
    } else console.log('same', k, px);
  }
  console.log(bad ? `CSS DIFF: ${bad} states differ` : 'CSS DIFF: all states identical (computed styles + pixels)');
})();
