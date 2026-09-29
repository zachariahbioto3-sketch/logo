const sharp = require('sharp');
const path = require('path');

const src = process.argv[2];
if (!src) { console.error('Usage: node scripts/make-logo.js <path-to-N-image>'); process.exit(1); }
const out = path.join(__dirname, '..', 'public', 'launcher_logo.jpeg');

(async () => {
  const { data, info } = await sharp(src).greyscale().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width, maxX = 0, minY = info.height, maxY = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (data[y * info.width + x] > 128) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const side = Math.round(Math.max(maxX - minX, maxY - minY) / 0.7);
  const left = Math.max(0, Math.min(info.width - side, Math.round(cx - side / 2)));
  const top = Math.max(0, Math.min(info.height - side, Math.round(cy - side / 2)));
  await sharp(src)
    .extract({ left, top, width: Math.min(side, info.width), height: Math.min(side, info.height) })
    .resize(1024, 1024, { fit: 'fill', kernel: 'lanczos3' })
    .jpeg({ quality: 95 })
    .toFile(out);
  console.log('Wrote', out);
})();
