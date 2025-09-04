#!/usr/bin/env node

import sharp from 'sharp';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createCanvas } from 'canvas';
import { PNG } from 'pngjs';
import ico from 'ico-endec';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logoPath = path.join(__dirname, '../public/i/assets/veganblatt-logo.svg');
const publicDir = path.join(__dirname, '../public');

// Simplified SVG logo without text for small icons
const simpleLogoSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 90">
  <path fill="#76A11E" d="M210 37l-4.1 46.8L163.1 64l4.3-46.8"/>
  <path fill="#B8CF32" d="M197.1 47.2l-1.4 18.5-9.1-15.8.7-9.6-.4-.1-.7 8.9-7.9-13.4-.4.3 7.7 13.4-8-3.8-.2.4 8.8 4.2 9 15.7-16.9-7.9-.2.5 17.6 8.2 8.4 14.6.3-.3-8.3-14.6 1.6-19.1"/>
  <path fill="#A0B634" d="M232.7 45.4l-26.8 38.4-27-38.4 27-38.5"/>
  <path fill="#3D6118" d="M216.7 47.8L206.1 63V44.8l5.5-7.9-.4-.3-5.1 7.3V28.5h-.4v15.4l-5.1-7.3-.4.3 5.5 7.9V63L195 47.8l-.4.3 11.1 15.8v16.7h.4V63.9l11.1-15.8"/>
  <path fill="#B8CF32" d="M248.6 64l-42.7 19.8-4.2-46.8 42.6-19.8"/>
  <path fill="#3D6118" d="M233.3 58l-16.8 7.8 9.1-15.7 8.7-4.1-.2-.4-8.1 3.8 7.6-13.4-.3-.3-7.7 13.4-.9-8.9-.3.1.7 9.6-8.9 15.8-1.7-18.5h-.4l1.7 19.2-8.6 14.6.4.3 8.6-14.6 17.3-8.2"/>
</svg>`;

// Icon sizes to generate
const iconSizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'apple-touch-icon-180x180.png', size: 180 },
  { name: 'apple-touch-icon-152x152.png', size: 152 },
  { name: 'apple-touch-icon-120x120.png', size: 120 },
  { name: 'apple-touch-icon-76x76.png', size: 76 },
  { name: 'apple-touch-icon-60x60.png', size: 60 },
  { name: 'mstile-150x150.png', size: 150 }
];

async function generateIcon(svgContent, size, outputPath) {
  try {
    await sharp(Buffer.from(svgContent))
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(outputPath);
    console.log(`Generated: ${path.basename(outputPath)} (${size}x${size})`);
  } catch (err) {
    console.error(`Error generating ${outputPath}:`, err);
  }
}

async function generateFavicon() {
  const sizes = [16, 32, 48];
  const buffers = [];
  
  for (const size of sizes) {
    const buffer = await sharp(Buffer.from(simpleLogoSVG))
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toBuffer();
    buffers.push(buffer);
  }
  
  // Create ICO file
  const icoBuffer = ico.encode(buffers);
  const faviconPath = path.join(publicDir, 'favicon.ico');
  await fs.writeFile(faviconPath, icoBuffer);
  console.log('Generated: favicon.ico (16x16, 32x32, 48x48)');
}

async function generateAllIcons() {
  console.log('Starting icon generation...\n');
  
  // Generate PNG icons
  for (const icon of iconSizes) {
    const outputPath = path.join(publicDir, icon.name);
    // Use simple logo for smaller sizes, full logo for larger ones
    const svgContent = icon.size < 100 ? simpleLogoSVG : fs.readFileSync(logoPath, 'utf8');
    await generateIcon(svgContent, icon.size, outputPath);
  }
  
  // Generate favicon.ico
  await generateFavicon();
  
  console.log('\nAll icons generated successfully!');
}

// Run the generation
generateAllIcons().catch(console.error);