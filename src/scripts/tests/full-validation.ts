#!/usr/bin/env tsx
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

async function runFullValidation(): Promise<void> {
  const errors: string[] = [];
  
  console.log(' Running HARDCORE validation suite...\n');
  
  // 1. TypeScript strict check
  console.log(' TypeScript strict mode check...');
  try {
    execSync('npx tsc --noEmit --strict', { stdio: 'pipe' });
    console.log(' TypeScript: PASSED\n');
  } catch (error: any) {
    console.log(' TypeScript: FAILED');
    console.log(error.stdout?.toString() || error.message);
    errors.push('TypeScript validation');
  }
  
  // 2. ESLint hardcore mode
  console.log(' ESLint hardcore rules check...');
  try {
    execSync('npx eslint src --ext .ts', { stdio: 'pipe' });
    console.log(' ESLint: PASSED\n');
  } catch (error: any) {
    console.log(' ESLint: FAILED');
    console.log(error.stdout?.toString() || error.message);
    errors.push('ESLint validation');
  }
  
  // 3. HTML validation
  console.log(' HTML semantic validation...');
  const publicDir = path.join(process.cwd(), 'public');
  const htmlFiles = [
    'index.html',
    'articles.html', 
    'recipes.html',
    'impressum.html'
  ];
  
  for (const file of htmlFiles) {
    try {
      execSync(`npx html-validate ${path.join(publicDir, file)}`, { stdio: 'pipe' });
      console.log(`   ${file}`);
    } catch {
      console.log(`   ${file}`);
      errors.push(`HTML validation: ${file}`);
    }
  }
  
  // 4. SVG validation
  console.log('\n SVG semantic validation...');
  const svgFile = path.join(publicDir, 'i/assets/veganblatt-logo.svg');
  try {
    const svgContent = await fs.readFile(svgFile, 'utf-8');
    if (!svgContent.includes('<svg') || !svgContent.includes('viewBox')) {
      throw new Error('Invalid SVG structure');
    }
    console.log(' SVG: Valid structure\n');
  } catch {
    console.log(' SVG: Invalid structure\n');
    errors.push('SVG validation');
  }
  
  // 5. File size checks
  console.log(' File size validation...');
  const stats = await fs.stat(path.join(publicDir, 'css/styles.css'));
  if (stats.size > 50000) {
    console.log(`   CSS too large: ${stats.size} bytes`);
    errors.push('CSS file size');
  } else {
    console.log(`   CSS size: ${stats.size} bytes`);
  }
  
  // Results
  console.log('\n' + '='.repeat(50));
  if (errors.length > 0) {
    console.log(' VALIDATION FAILED!');
    console.log('Errors:', errors.join(', '));
    process.exit(1);
  } else {
    console.log(' ALL VALIDATIONS PASSED!');
  }
}

runFullValidation().catch(console.error);