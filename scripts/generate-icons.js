import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const iconsDir = path.resolve('public/icons');
fs.mkdirSync(iconsDir, { recursive: true });

// SVG icon with green farm leaf + sprout emblem
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="farmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2E7D32" />
      <stop offset="100%" stop-color="#1B5E20" />
    </linearGradient>
    <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#AED581" />
      <stop offset="100%" stop-color="#66BB6A" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="108" fill="url(#farmGrad)" />
  <circle cx="256" cy="256" r="210" fill="none" stroke="#81C784" stroke-width="8" stroke-dasharray="16 12" opacity="0.6"/>
  <!-- Leaf Stem & Blades -->
  <path d="M160 380 C190 320 220 250 360 140 C350 250 290 340 180 376 Z" fill="url(#leafGrad)" />
  <path d="M160 380 Q 250 270 360 140" stroke="#1B5E20" stroke-width="8" stroke-linecap="round" fill="none" />
  <!-- Small side leaf -->
  <path d="M220 290 C180 270 145 220 180 180 C210 200 230 250 220 290 Z" fill="#C5E1A5" />
  <!-- Cross/Plus Doctor symbol -->
  <rect x="350" y="320" width="80" height="24" rx="8" fill="#FFF9C4" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"/>
  <rect x="378" y="292" width="24" height="80" rx="8" fill="#FFF9C4" />
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent);
fs.writeFileSync(path.resolve('public/favicon.svg'), svgContent);

// Minimal PNG encoder for pure node without native dependencies
function createPng(width, height, r, g, b) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type: truecolor (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const scanlineLength = 1 + width * 3;
  const rawData = Buffer.alloc(height * scanlineLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter: none
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      // Border circle check
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
      if (dist < width * 0.45) {
        rawData[pxOffset] = r;
        rawData[pxOffset + 1] = g;
        rawData[pxOffset + 2] = b;
      } else {
        rawData[pxOffset] = 27;  // #1B5E20 background
        rawData[pxOffset + 1] = 94;
        rawData[pxOffset + 2] = 32;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeInt32BE(crc, 8 + len);
  return buf;
}

// Standard CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return crc ^ -1;
}

const png192 = createPng(192, 192, 76, 175, 80);
const png512 = createPng(512, 512, 76, 175, 80);

fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), png192);
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), png512);
fs.writeFileSync(path.resolve('public/favicon.ico'), png192);

console.log('Icons generated successfully.');
