/* Render SVGs to PNGs at exact pixel sizes with Playwright's Chromium (used by tools/brand/build.py).
   Usage: node tools/brand/render.mjs '[["in.svg", "out.png", size, transparent(0|1)], ...]' */
import { chromium } from 'playwright';
import fs from 'node:fs';

const jobs = JSON.parse(process.argv[2]);
const b = await chromium.launch();
for (const [inp, out, size, transp] of jobs) {
  const p = await b.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  const svg = fs.readFileSync(inp, 'utf8').replace('<svg', `<svg width="${size}" height="${size}" style="display:block"`);
  await p.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  await p.screenshot({ path: out, omitBackground: !!transp });
  await p.close();
}
await b.close();
