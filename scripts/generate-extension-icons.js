const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Script to create PNG icons for the Chrome extension from SVG

const iconSizes = [16, 32, 48, 128];
const extensionIconsDir = path.join(__dirname, '../chrome-extension/icons');

// Ensure the icons directory exists
if (!fs.existsSync(extensionIconsDir)) {
  fs.mkdirSync(extensionIconsDir, { recursive: true });
}

// Create SVG content for the icon
const createSVG = (size) => {
  const halfSize = size / 2;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3A7CA5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2C6E91;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#5DA271;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3B755D;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#D4AF37;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#B8860B;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="${halfSize}" cy="${halfSize}" r="${halfSize - 2}" fill="url(#primaryGradient)" stroke="#1E3A8A" stroke-width="1"/>
  
  <!-- House icon -->
  <path d="M${size * 0.22} ${size * 0.64} L${halfSize} ${size * 0.36} L${size * 0.78} ${size * 0.64} L${size * 0.78} ${size * 0.8} L${size * 0.22} ${size * 0.8} Z" fill="white" opacity="0.95"/>
  
  <!-- House roof accent -->
  <path d="M${size * 0.22} ${size * 0.64} L${halfSize} ${size * 0.36} L${size * 0.78} ${size * 0.64}" fill="none" stroke="url(#goldGradient)" stroke-width="${Math.max(1, size * 0.02)}" stroke-linecap="round"/>
  
  <!-- Door -->
  <rect x="${size * 0.45}" y="${size * 0.68}" width="${size * 0.1}" height="${size * 0.12}" fill="url(#primaryGradient)" rx="${Math.max(1, size * 0.015)}"/>
  
  <!-- Windows -->
  <rect x="${size * 0.3}" y="${size * 0.56}" width="${size * 0.08}" height="${size * 0.08}" fill="white" opacity="0.9" rx="${Math.max(1, size * 0.01)}"/>
  <rect x="${size * 0.62}" y="${size * 0.56}" width="${size * 0.08}" height="${size * 0.08}" fill="white" opacity="0.9" rx="${Math.max(1, size * 0.01)}"/>
  
  <!-- Capture button -->
  <circle cx="${size * 0.78}" cy="${size * 0.22}" r="${size * 0.14}" fill="url(#accentGradient)" stroke="white" stroke-width="${Math.max(1, size * 0.015)}"/>
  
  <!-- Plus symbol -->
  <line x1="${size * 0.78}" y1="${size * 0.16}" x2="${size * 0.78}" y2="${size * 0.28}" stroke="white" stroke-width="${Math.max(1, size * 0.02)}" stroke-linecap="round"/>
  <line x1="${size * 0.72}" y1="${size * 0.22}" x2="${size * 0.84}" y2="${size * 0.22}" stroke="white" stroke-width="${Math.max(1, size * 0.02)}" stroke-linecap="round"/>
</svg>`;
};

// Generate PNG icons from SVG
async function generateIcons() {
  try {
    for (const size of iconSizes) {
      const svgContent = createSVG(size);
      const pngPath = path.join(extensionIconsDir, `icon${size}.png`);
      
      // Convert SVG to PNG using sharp
      await sharp(Buffer.from(svgContent))
        .resize(size, size)
        .png()
        .toFile(pngPath);
      
      console.log(`Created icon${size}.png (${size}x${size})`);
    }
    
    console.log('\n✅ All icon files created successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    
    // Fallback: create simple colored squares if sharp fails
    console.log('Creating fallback icons...');
    for (const size of iconSizes) {
      const pngPath = path.join(extensionIconsDir, `icon${size}.png`);
      
      // Create a simple colored square as fallback
      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 58, g: 124, b: 165, alpha: 1 } // Primary blue
        }
      })
        .png()
        .toFile(pngPath);
      
      console.log(`Created fallback icon${size}.png (${size}x${size})`);
    }
  }
}

generateIcons(); 