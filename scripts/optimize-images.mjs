import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const SRC = 'scripts/source/avatar.jpg';
const OUT = 'assets/img';
await mkdir(OUT, { recursive: true });

for (const w of [168, 336]) {
  const base = sharp(SRC).resize(w, w, { fit: 'cover', position: 'attention' });
  await base.clone().avif({ quality: 50 }).toFile(`${OUT}/avatar-${w}.avif`);
  await base.clone().webp({ quality: 78 }).toFile(`${OUT}/avatar-${w}.webp`);
  await base.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(`${OUT}/avatar-${w}.jpg`);
}

const mask = Buffer.from('<svg width="280" height="280"><circle cx="140" cy="140" r="140" fill="#fff"/></svg>');
const avatar = await sharp(SRC)
  .resize(280, 280, { fit: 'cover' })
  .composite([{ input: mask, blend: 'dest-in' }])
  .png()
  .toBuffer();

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0a0c10"/><stop offset="1" stop-color="#121826"/>
    </linearGradient>
    <radialGradient id="a" cx="0.2" cy="0.1" r="0.7"><stop offset="0" stop-color="#2dd4f0" stop-opacity="0.25"/><stop offset="1" stop-color="#2dd4f0" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect width="1200" height="630" fill="url(#a)"/>
  <g font-family="Segoe UI, Helvetica, Arial, sans-serif" fill="#e6e9ee">
    <text x="440" y="270" font-size="64" font-weight="700">Omargaly Bitebayev</text>
    <text x="440" y="340" font-size="34" fill="#2dd4f0">Software Engineer · Backend &amp; AI</text>
    <text x="440" y="400" font-size="26" fill="#8b95a5">Go backend engineer, growing into AI engineering.</text>
    <text x="440" y="520" font-size="24" fill="#8b95a5" font-family="Consolas, monospace">omargaly.github.io</text>
  </g>
</svg>`;

await sharp(Buffer.from(og))
  .composite([{ input: avatar, left: 100, top: 175 }])
  .png({ compressionLevel: 9, palette: true })
  .toFile(`${OUT}/og.png`);
console.log('images written');
