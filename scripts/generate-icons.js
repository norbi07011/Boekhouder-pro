// This is a placeholder script
// To generate proper PWA icons, you need to:
// 1. Install sharp: npm install sharp
// 2. Run: node scripts/generate-icons.js
// Or use an online tool like https://realfavicongenerator.net

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputImage = path.join(__dirname, '../public/logo.jpg');
const outputDir = path.join(__dirname, '../public/icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  console.log('Generating PWA icons...');
  
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    
    await sharp(inputImage)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toFile(outputPath);
    
    console.log(`Generated: icon-${size}x${size}.png`);
  }

  // Generate badge icon (smaller, monochrome-friendly)
  await sharp(inputImage)
    .resize(72, 72, { fit: 'cover' })
    .png()
    .toFile(path.join(outputDir, 'badge-72x72.png'));
  
  console.log('Generated: badge-72x72.png');
  console.log('Done!');
}

generateIcons().catch(console.error);
