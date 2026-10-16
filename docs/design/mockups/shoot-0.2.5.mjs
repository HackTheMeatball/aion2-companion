/* Screenshots for the 0.2.5 save-safety mockup: node docs/design/mockups/shoot-0.2.5.mjs
   Uses the repo's Playwright and the preinstalled Chromium (PLAYWRIGHT_BROWSERS_PATH). */
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
const url = pathToFileURL(join(here, '0.2.5-save-safety.html')).href;
const b = await chromium.launch();
for (const w of [390, 1280]) for (const theme of ['light', 'dark']) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto(url + '?theme=' + theme);
  await p.screenshot({ path: join(here, '0.2.5', w + '-' + theme + '.png'), fullPage: true });
  await p.close();
}
await b.close();
