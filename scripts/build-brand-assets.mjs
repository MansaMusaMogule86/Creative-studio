// Builds every production brand asset from the untouched master emblem.
//   pnpm brand:assets
// Master: brand-source/crowned-m-master.png (never modified).
// Output: public/brand/*, public/favicon.ico, public/favicon-*.png,
//         public/apple-touch-icon.png, public/icon-*.png
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';

const MASTER = 'brand-source/crowned-m-master.png';
const OUT = 'public/brand';
mkdirSync(OUT, { recursive: true });
const PEARL = { r: 248, g: 247, b: 255, alpha: 1 };

// 1. Clean: the master carries a faint smoky glow (alpha ≲ 40) that reads as a
//    grey halo with a hard rectangular edge on dark backgrounds. Fade it out
//    with a smoothstep on alpha; solid gold, crown and ring are untouched.
const { data, info } = await sharp(MASTER).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const LO = 34, HI = 96;
for (let i = 3; i < data.length; i += 4) {
  const a = data[i];
  if (a <= LO) { data[i] = 0; continue; }
  if (a >= HI) continue;
  const t = (a - LO) / (HI - LO);
  data[i] = Math.round(a * t * t * (3 - 2 * t));
}
const cleaned = await sharp(data, { raw: info }).png().toBuffer();
// Trim to the emblem itself, then add 3% breathing room so glints aren't clipped.
const trimmed = await sharp(cleaned).trim({ threshold: 1 }).toBuffer();
const tm = await sharp(trimmed).metadata();
const pad = Math.round(Math.max(tm.width, tm.height) * 0.03);
const emblem = await sharp(trimmed).extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
const em = await sharp(emblem).metadata();
console.log(`emblem: ${em.width}×${em.height} (master ${info.width}×${info.height})`);

const webp = (buf, h, name) => sharp(buf).resize({ height: h }).webp({ quality: 86, alphaQuality: 90, effort: 6 }).toFile(`${OUT}/${name}`);
const png = (buf, h, name) => sharp(buf).resize({ height: h }).png({ compressionLevel: 9, palette: false }).toFile(`${OUT}/${name}`);

// 2. Light-background emblem (default): header 1×/2×/3×, footer, large.
for (const h of [44, 88, 132]) await webp(emblem, h, `emblem-${h}.webp`);
for (const h of [160, 320]) await webp(emblem, h, `emblem-${h}.webp`);
await webp(emblem, 720, 'emblem-720.webp');
await sharp(emblem).resize({ height: 512 }).png({ compressionLevel: 9, palette: true, quality: 92 }).toFile(`${OUT}/emblem-512.png`); // structured data, email, decks

// 3. Dark-background emblem: same art with a soft champagne aura so the
//    gold separates from deep indigo without a grey halo.
{
  const aura = await sharp(emblem).extractChannel(3).blur(18).toBuffer();
  const glow = await sharp({ create: { width: em.width, height: em.height, channels: 3, background: '#d8b875' } }).joinChannel(await sharp(aura).linear(0.45, 0).toBuffer()).png().toBuffer();
  const dark = await sharp(glow).composite([{ input: emblem }]).png().toBuffer();
  for (const h of [160, 320, 720]) await webp(dark, h, `emblem-dark-${h}.webp`);
}

// 4. Icons. Square canvases; tiny sizes use a tighter crop of the same art.
const square = async (size, { bg = null, inset = 0.08 } = {}) => {
  const inner = Math.round(size * (1 - inset * 2));
  const art = await sharp(emblem).resize({ width: inner, height: inner, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: bg ?? { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: art, gravity: 'center' }]).png({ compressionLevel: 9, palette: size > 48, quality: 92 }).toBuffer();
};
const fav = {};
for (const s of [16, 32, 48]) { fav[s] = await square(s, { inset: 0.02 }); writeFileSync(`public/favicon-${s}.png`, fav[s]); }
writeFileSync('public/apple-touch-icon.png', await square(180, { bg: PEARL, inset: 0.12 }));
writeFileSync('public/icon-192.png', await square(192, { bg: PEARL, inset: 0.12 }));
writeFileSync('public/icon-512.png', await square(512, { bg: PEARL, inset: 0.12 }));
// Maskable: Android may crop to a circle, so keep the art inside the 80% safe zone.
writeFileSync('public/icon-maskable-512.png', await square(512, { bg: PEARL, inset: 0.2 }));

// favicon.ico with embedded PNG frames (16/32/48), a format every browser reads.
{
  const frames = [16, 32, 48].map((s) => ({ s, buf: fav[s] }));
  const header = Buffer.alloc(6 + frames.length * 16);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(frames.length, 4);
  let offset = header.length;
  frames.forEach(({ s, buf }, i) => {
    const o = 6 + i * 16;
    header.writeUInt8(s, o); header.writeUInt8(s, o + 1); header.writeUInt8(0, o + 2); header.writeUInt8(0, o + 3);
    header.writeUInt16LE(1, o + 4); header.writeUInt16LE(32, o + 6);
    header.writeUInt32LE(buf.length, o + 8); header.writeUInt32LE(offset, o + 12);
    offset += buf.length;
  });
  writeFileSync('public/favicon.ico', Buffer.concat([header, ...frames.map((f) => f.buf)]));
}
console.log('brand assets written');
