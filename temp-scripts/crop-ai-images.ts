#!/usr/bin/env tsx

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

async function cropAllAiImages() {
  console.log('🖼️  Cropping AI images from 1024x1024 to 1024x640 (16:10 aspect ratio)...\n');
  
  const aiDir = '/Users/franzenzenhofer/dev/veganblatt-static/public/i/ai';
  const files = await fs.readdir(aiDir);
  
  for (const file of files) {
    if (!file.startsWith('ai-') || !file.endsWith('.jpg')) continue;
    
    const filePath = path.join(aiDir, file);
    
    // Check current dimensions
    const { stdout: dimensions } = await execAsync(`identify -format "%wx%h" "${filePath}"`);
    
    if (dimensions.trim() === '1024x1024') {
      console.log(`📐 Cropping ${file}...`);
      
      // Crop center: 1024x640
      // This crops 192 pixels from top and 192 from bottom (384 total)
      // Keeping the center of the image where food is typically composed
      await execAsync(`magick "${filePath}" -gravity center -crop 1024x640+0+0 +repage "${filePath}"`);
      
      console.log(`   ✅ Cropped to 1024x640`);
    } else if (dimensions.trim() === '1024x640') {
      console.log(`   ⏭️  ${file} already correct aspect ratio`);
    } else {
      console.log(`   ⚠️  ${file} has unexpected dimensions: ${dimensions}`);
    }
  }
  
  console.log('\n✨ All AI images cropped to 16:10 aspect ratio!');
}

// Run the cropping
cropAllAiImages().catch(console.error);