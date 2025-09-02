const fs = require('fs');
const path = require('path');

// Simple SVG icon generator for PWA
function generateIcon(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3A7CA5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2C6E91;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad1)"/>
  <rect x="${size * 0.15}" y="${size * 0.2}" width="${size * 0.7}" height="${size * 0.5}" rx="${size * 0.05}" fill="white" opacity="0.9"/>
  <rect x="${size * 0.25}" y="${size * 0.3}" width="${size * 0.5}" height="${size * 0.15}" rx="${size * 0.02}" fill="#3A7CA5"/>
  <rect x="${size * 0.25}" y="${size * 0.5}" width="${size * 0.3}" height="${size * 0.1}" rx="${size * 0.02}" fill="#5DA271"/>
  <rect x="${size * 0.6}" y="${size * 0.5}" width="${size * 0.15}" height="${size * 0.1}" rx="${size * 0.02}" fill="#5DA271"/>
  <circle cx="${size * 0.4}" cy="${size * 0.75}" r="${size * 0.08}" fill="white" opacity="0.8"/>
  <circle cx="${size * 0.6}" cy="${size * 0.75}" r="${size * 0.08}" fill="white" opacity="0.8"/>
</svg>`;
}

// Generate icons
const sizes = [192, 512];
const publicDir = path.join(__dirname, '..', 'public');

sizes.forEach(size => {
  const svgContent = generateIcon(size);
  const filename = `icon-${size}.png`;
  
  // For now, we'll create SVG files and note that they need to be converted to PNG
  const svgFilename = `icon-${size}.svg`;
  fs.writeFileSync(path.join(publicDir, svgFilename), svgContent);
  
  console.log(`Generated ${svgFilename} (${size}x${size})`);
  console.log(`Note: Convert ${svgFilename} to PNG format for PWA compatibility`);
});

console.log('\nPWA Icons generated!');
console.log('To complete the setup:');
console.log('1. Convert the SVG files to PNG format');
console.log('2. Ensure icons are optimized for web use');
console.log('3. Test the PWA installation on mobile devices');
