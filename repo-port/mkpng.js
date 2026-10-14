const sharp = require('sharp'); const fs = require('fs'); const R = '/home/claude/aion2-companion';
/* Manifest icons: full-bleed background (no rounded corners) with the glyph inside the maskable safe zone (inner 80%). */
const svg = fs.readFileSync(R + '/public/favicon.svg', 'utf8').replace('rx="14" ', '').replace('rotate(45 32 32)', 'translate(32 32) scale(0.78) translate(-32 -32) rotate(45 32 32)');
(async () => { for (const n of [192, 512]) await sharp(Buffer.from(svg), { density: 72 * n / 64 }).resize(n, n).png({ compressionLevel: 9 }).toFile(`${R}/public/icons/icon-${n}.png`); })();
