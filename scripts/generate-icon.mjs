import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const size = 512;
const pixels = Buffer.alloc((size * 4 + 1) * size);

function inRoundedRect(x, y, left, top, width, height, radius) {
  const cx = Math.max(left + radius, Math.min(x, left + width - radius));
  const cy = Math.max(top + radius, Math.min(y, top + height - radius));
  const dx = x - cx; const dy = y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

const blend = (base, color, alpha) => Math.round(base * (1 - alpha) + color * alpha);

for (let y = 0; y < size; y++) {
  const row = y * (size * 4 + 1); pixels[row] = 0;
  for (let x = 0; x < size; x++) {
    const p = row + 1 + x * 4;
    if (!inRoundedRect(x, y, 32, 32, 448, 448, 112)) continue;
    const t = Math.min(1, Math.max(0, (x + y - 64) / 896));
    let r = Math.round(136 + (70 - 136) * t);
    let g = Math.round(123 + (52 - 123) * t);
    let b = Math.round(255 + (198 - 255) * t);
    const glow = Math.max(0, 1 - Math.hypot(x - 132, y - 118) / 145) * .1;
    r = blend(r, 255, glow); g = blend(g, 255, glow); b = blend(b, 255, glow);
    const barAlpha = Math.max(
      inRoundedRect(x, y, 153, 225, 64, 138, 32) ? .76 : 0,
      inRoundedRect(x, y, 224, 141, 64, 222, 32) ? .98 : 0,
      inRoundedRect(x, y, 295, 183, 64, 180, 32) ? .88 : 0
    );
    if (barAlpha) {
      const shade = Math.round(255 - Math.max(0, y - 141) * .035);
      r = blend(r, shade, barAlpha); g = blend(g, shade - 2, barAlpha); b = blend(b, 255, barAlpha);
    }
    pixels[p] = r; pixels[p + 1] = g; pixels[p + 2] = b; pixels[p + 3] = 255;
  }
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, crc]);
}

const header = Buffer.alloc(13);
header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 6;
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', header), chunk('IDAT', deflateSync(pixels, { level: 9 })), chunk('IEND', Buffer.alloc(0))
]);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(resolve(root, 'build'), { recursive: true });
writeFileSync(resolve(root, 'build', 'icon.png'), png);
const icoHeader = Buffer.alloc(22);
icoHeader.writeUInt16LE(0, 0);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(1, 4);
icoHeader[6] = 0;
icoHeader[7] = 0;
icoHeader.writeUInt16LE(1, 10);
icoHeader.writeUInt16LE(32, 12);
icoHeader.writeUInt32LE(png.length, 14);
icoHeader.writeUInt32LE(22, 18);
writeFileSync(resolve(root, 'build', 'icon.ico'), Buffer.concat([icoHeader, png]));
console.log(`Generated build/icon.png and build/icon.ico (${png.length} bytes)`);
