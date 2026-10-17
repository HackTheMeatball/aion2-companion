/* Screenshots for the 0.5 characters mockup: node docs/design/mockups/shoot-0.5-characters.mjs
   Uses the repo's Playwright and the preinstalled Chromium (PLAYWRIGHT_BROWSERS_PATH). One PNG per frame. */
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
const url = pathToFileURL(join(here, '0.5-characters.html')).href;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1560, height: 900 } });
await p.goto(url);
for (const el of await p.locator('section.frame').all()) {
  const id = await el.getAttribute('id');
  await el.screenshot({ path: join(here, '0.5-characters', id + '.png') });
}
await b.close();
