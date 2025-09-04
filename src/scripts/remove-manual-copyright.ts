#!/usr/bin/env tsx
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

async function removeManualCopyright() {
  console.log('🧹 Removing manual copyright texts from markdown files...');
  
  // Find all markdown files
  const files = await glob('src/data/**/*.md', { cwd: process.cwd() });
  let processedCount = 0;
  let modifiedCount = 0;
  
  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    
    // Pattern to match escaped asterisks with copyright text: \* © something\*
    // This appears after inline images and creates duplicate copyright
    const pattern = /\s*\\\*\s*©[^\\]*\\\*/g;
    
    if (pattern.test(content)) {
      // Remove the manual copyright text
      const newContent = content.replace(pattern, '');
      
      await fs.writeFile(file, newContent, 'utf-8');
      console.log(`✅ Cleaned: ${path.basename(file)}`);
      modifiedCount++;
    }
    
    processedCount++;
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Processed: ${processedCount} files`);
  console.log(`   Modified: ${modifiedCount} files`);
  console.log(`   Manual copyright texts removed!`);
}

removeManualCopyright().catch(console.error);