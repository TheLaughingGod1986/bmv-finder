const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const svgPath = path.join(__dirname, '../public/icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  // Generate 192x192 icon
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(__dirname, '../public/icon-192.png'));

  // Generate 512x512 icon
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(__dirname, '../public/icon-512.png'));

  // Generate favicon sizes
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, '../public/favicon-32x32.png'));

  await sharp(svgBuffer)
    .resize(16, 16)
    .png()
    .toFile(path.join(__dirname, '../public/favicon-16x16.png'));

  console.log('Icons generated successfully!');
}

generateIcons().catch(console.error); 