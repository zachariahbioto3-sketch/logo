const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const resDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const logoPath = path.join(__dirname, '..', 'public', 'launcher_logo.jpeg');

const iconSizes = {
  'mipmap-mdpi': { icon: 48, fore: 108 },
  'mipmap-hdpi': { icon: 72, fore: 162 },
  'mipmap-xhdpi': { icon: 96, fore: 216 },
  'mipmap-xxhdpi': { icon: 144, fore: 324 },
  'mipmap-xxxhdpi': { icon: 192, fore: 432 },
};

async function generateIcons() {
  for (const [folder, sizes] of Object.entries(iconSizes)) {
    const dir = path.join(resDir, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // ic_launcher.png
    await sharp(logoPath)
      .resize(sizes.icon, sizes.icon, { fit: 'cover' })
      .toFile(path.join(dir, 'ic_launcher.png'));

    // ic_launcher_round.png
    const svgCircleMask = Buffer.from(`<svg><circle cx="${sizes.icon / 2}" cy="${sizes.icon / 2}" r="${sizes.icon / 2}"/></svg>`);
    await sharp(logoPath)
      .resize(sizes.icon, sizes.icon, { fit: 'cover' })
      .composite([{ input: svgCircleMask, blend: 'dest-in' }])
      .toFile(path.join(dir, 'ic_launcher_round.png'));

    // ic_launcher_foreground.png
    const innerSize = Math.round(sizes.fore * 0.65);
    const innerLogo = await sharp(logoPath)
      .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp({
      create: {
        width: sizes.fore,
        height: sizes.fore,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([{ input: innerLogo, gravity: 'center' }])
    .toFile(path.join(dir, 'ic_launcher_foreground.png'));

    console.log('Generated icons for', folder);
  }

  // Splash screens
  const splashes = {
    'drawable-port-mdpi': [320, 480],
    'drawable-port-hdpi': [480, 800],
    'drawable-port-xhdpi': [720, 1280],
    'drawable-port-xxhdpi': [960, 1600],
    'drawable-port-xxxhdpi': [1280, 1920],
    'drawable-land-mdpi': [480, 320],
    'drawable-land-hdpi': [800, 480],
    'drawable-land-xhdpi': [1280, 720],
    'drawable-land-xxhdpi': [1600, 960],
    'drawable-land-xxxhdpi': [1920, 1280],
    'drawable': [512, 512]
  };

  for (const [folder, [w, h]] of Object.entries(splashes)) {
    const dir = path.join(resDir, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const logoSize = Math.min(w, h) * 0.4;
    const logoBuf = await sharp(logoPath)
      .resize(Math.round(logoSize), Math.round(logoSize), { fit: 'contain' })
      .toBuffer();

    await sharp({
      create: {
        width: w,
        height: h,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      }
    })
    .composite([{ input: logoBuf, gravity: 'center' }])
    .toFile(path.join(dir, 'splash.png'));

    console.log('Generated splash for', folder);
  }
}

generateIcons().then(() => console.log('All icons and splash screens generated successfully!'));
