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


// Run astro's bin through node directly: portable (no npx shim on Windows) and kill() stops the server.
const dev = spawn(process.execPath, ['node_modules/astro/bin/astro.mjs', 'dev', '--port', String(PORT)], { env: { ...process.env, RENDER_STILLS: '1', ASTRO_TELEMETRY_DISABLED: '1' }, stdio: 'pipe' });
const ready = new Promise((res, rej) => {
  dev.stdout.on('data', (d) => String(d).includes('localhost:') && res());
  setTimeout(() => rej(new Error('dev server did not start')), 60000);
});
try {
  await ready;
  // The dev server exposes the still list as JSON (see src/pages/render/stills.json.ts).
  const list = await (await fetch(`http://localhost:${PORT}/render/stills.json`)).json();
  const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
  const browser = await chromium.launch();
  for (const { id, width: w, height: h, widths, og, transparent } of list) {
    if (only && !only.test(id)) continue;
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto(`http://localhost:${PORT}/render/${id}`);
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
    await page.waitForTimeout(500);
    const png = await page.screenshot({ timeout: 120000, omitBackground: !!transparent });
    if (og) {
      // Social crawlers expect PNG/JPEG; keep it lean with palette quantisation.
      await sharp(png).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile('public/og.png');
    } else {
      for (const width of widths ?? [w, Math.round(w / 2)]) {
        await sharp(png).resize({ width }).webp({ quality: 80, effort: 6, smartSubsample: true }).toFile(`${OUT}/${id}-${width}.webp`);
      }
    }
    console.log('✓', id);
    await page.close();
  }
  await browser.close();
} finally {
  dev.kill();
}
