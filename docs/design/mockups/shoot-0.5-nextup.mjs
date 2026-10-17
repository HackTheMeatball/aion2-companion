/* Screenshots for the 0.5 S1 Next up mockup: node docs/design/mockups/shoot-0.5-nextup.mjs
   Uses the repo's Playwright and the preinstalled Chromium (PLAYWRIGHT_BROWSERS_PATH). One PNG per frame. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(here, '0.5-nextup'), { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1700, height: 1000 } });
await p.goto(pathToFileURL(join(here, '0.5-nextup.html')).href);
for (const f of await p.$$('.fr')) {
  const id = (await (await f.$('.cap')).innerText()).split(' ')[0].toLowerCase();
  const frame = await f.$('.ph, .dk');
  await frame.screenshot({ path: join(here, '0.5-nextup', id + (id.startsWith('m') ? '-390' : '-1500') + '.png') });
}
await b.close();
