const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'icon-48x48.png', size: 48 },
  { name: 'icon-72x72.png', size: 72 },
  { name: 'icon-96x96.png', size: 96 },
  { name: 'icon-128x128.png', size: 128 },
  { name: 'icon-144x144.png', size: 144 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-256x256.png', size: 256 },
  { name: 'icon-384x384.png', size: 384 },
  { name: 'icon-512x512.png', size: 512 },
];

const publicDir = path.join(__dirname, '..', 'public');
const svgPath = path.join(publicDir, 'icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function generate() {
  for (const { name, size } of sizes) {
    const outPath = path.join(publicDir, name);
    await sharp(svgBuffer, { density: 300 })
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`Created ${name} (${size}x${size})`);
  }

  // Generate favicon.ico (multi-size)
  const faviconPath = path.join(publicDir, 'favicon.ico');
  const ico = require('sharp');
  // ICO format is complex, just copy the 32px as favicon and use PNGs instead
  // Modern browsers prefer PNG favicons linked via metadata anyway
  fs.copyFileSync(path.join(publicDir, 'favicon-32x32.png'), faviconPath);
  console.log('Created favicon.ico (32px)');

  console.log('\nDone! Generated', sizes.length + 1, 'icon files.');
}

generate().catch(console.error);
