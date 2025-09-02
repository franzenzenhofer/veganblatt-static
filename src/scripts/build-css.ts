#!/usr/bin/env node --loader tsx

import fs from 'fs/promises';
import path from 'path';

async function buildCSS() {
  const srcDir = path.join(process.cwd(), 'src', 'css');
  const outFile = path.join(process.cwd(), 'public', 'css', 'styles.css');
  
  // Ensure output directory exists
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  
  // Get all CSS files sorted by name
  const files = await fs.readdir(srcDir);
  const cssFiles = files.filter(f => f.endsWith('.css')).sort();
  
  // Combine all CSS files
  let combinedCSS = '/* VeganBlatt - Minimal Clean Design */\n';
  
  for (const file of cssFiles) {
    const content = await fs.readFile(path.join(srcDir, file), 'utf-8');
    combinedCSS += `\n/* ${file} */\n${content}\n`;
  }
  
  // Write combined CSS
  await fs.writeFile(outFile, combinedCSS);
  console.log(` CSS built: ${cssFiles.length} files combined → ${outFile}`);
}

buildCSS().catch(console.error);