#!/usr/bin/env node

import sharp from 'sharp';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const svgPath = path.join(__dirname, '../public/i/assets/icon-logo.svg');
const publicDir = path.join(__dirname, '../public');

// Icon sizes to generate
const iconSizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 }
];

async function generateIcon(svgBuffer, size, outputPath) {
  try {
    await sharp(svgBuffer)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(outputPath);
    console.log(`✅ Generated: ${path.basename(outputPath)} (${size}x${size})`);
  } catch (err) {
    console.error(`❌ Error generating ${outputPath}:`, err);
  }
}

async function generateFavicon(svgBuffer) {
  // Generate multiple sizes for the ICO file
  const size16 = await sharp(svgBuffer)
    .resize(16, 16, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toBuffer();
    
  const size32 = await sharp(svgBuffer)
    .resize(32, 32, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toBuffer();
    
  const size48 = await sharp(svgBuffer)
    .resize(48, 48, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toBuffer();
  
  // Create ICO file structure manually (simple ICO with PNG data)
  // ICO header
  const iconCount = 3;
  const headerSize = 6;
  const directorySize = 16;
  
  // Calculate offsets
  let currentOffset = headerSize + (directorySize * iconCount);
  const images = [
    { size: 16, data: size16 },
    { size: 32, data: size32 },
    { size: 48, data: size48 }
  ];
  
  // Build ICO file
  const totalSize = currentOffset + images.reduce((sum, img) => sum + img.data.length, 0);
  const ico = Buffer.alloc(totalSize);
  
  // Write header
  ico.writeUInt16LE(0, 0); // Reserved
  ico.writeUInt16LE(1, 2); // Type (1 for ICO)
  ico.writeUInt16LE(iconCount, 4); // Number of images
  
  // Write directory entries and image data
  let directoryOffset = 6;
  for (const img of images) {
    // Directory entry
    ico.writeUInt8(img.size === 256 ? 0 : img.size, directoryOffset); // Width
    ico.writeUInt8(img.size === 256 ? 0 : img.size, directoryOffset + 1); // Height
    ico.writeUInt8(0, directoryOffset + 2); // Color palette
    ico.writeUInt8(0, directoryOffset + 3); // Reserved
    ico.writeUInt16LE(1, directoryOffset + 4); // Color planes
    ico.writeUInt16LE(32, directoryOffset + 6); // Bits per pixel
    ico.writeUInt32LE(img.data.length, directoryOffset + 8); // Image size
    ico.writeUInt32LE(currentOffset, directoryOffset + 12); // Image offset
    
    // Copy image data
    img.data.copy(ico, currentOffset);
    
    directoryOffset += 16;
    currentOffset += img.data.length;
  }
  
  const faviconPath = path.join(publicDir, 'favicon.ico');
  await fs.writeFile(faviconPath, ico);
  console.log('✅ Generated: favicon.ico (16x16, 32x32, 48x48)');
}

async function generateAllIcons() {
  console.log('🎨 Starting icon generation from SVG...\n');
  
  // Read the SVG file
  const svgBuffer = await fs.readFile(svgPath);
  
  // Generate PNG icons
  for (const icon of iconSizes) {
    const outputPath = path.join(publicDir, icon.name);
    await generateIcon(svgBuffer, icon.size, outputPath);
  }
  
  // Generate favicon.ico
  await generateFavicon(svgBuffer);
  
  console.log('\n✨ All icons generated successfully!');
}

// Run the generation
generateAllIcons().catch(console.error);