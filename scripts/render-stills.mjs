// Renders the hero sculpture to optimised stills: free and local, no image API.
//   pnpm render:stills
// Writes public/renders/<id>-<width>.webp at full and half width.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const PORT = 4400;
const OUT = 'public/renders';
mkdirSync(OUT, { recursive: true });

// Read the still list straight from the source of truth.
const src = await (await import('node:fs/promises')).readFile('src/data/stills.ts', 'utf8');
const ids = [...src.matchAll(/id: '([^']+)', width: (\d+), height: (\d+)/g)].map((m) => ({ id: m[1], w: +m[2], h: +m[3] }));

const dev = spawn('npx', ['astro', 'dev', '--port', String(PORT)], { env: { ...process.env, RENDER_STILLS: '1', ASTRO_TELEMETRY_DISABLED: '1' }, stdio: 'pipe' });
const ready = new Promise((res, rej) => {
  dev.stdout.on('data', (d) => String(d).includes('localhost:') && res());
  setTimeout(() => rej(new Error('dev server did not start')), 60000);
});
try {
  await ready;
  const browser = await chromium.launch();
  for (const { id, w, h } of ids) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto(`http://localhost:${PORT}/render/${id}`);
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
    await page.waitForTimeout(500);
    const png = await page.screenshot({ timeout: 120000 });
    for (const width of [w, Math.round(w / 2)]) {
      await sharp(png).resize({ width }).webp({ quality: 82, effort: 6 }).toFile(`${OUT}/${id}-${width}.webp`);
    }
    console.log('✓', id);
    await page.close();
  }
  await browser.close();
} finally {
  dev.kill();
}
