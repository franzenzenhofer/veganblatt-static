#!/usr/bin/env tsx
import { SiteGenerator } from '../SiteGenerator';
import { SitemapGenerator } from '../generators/SitemapGenerator';
import { SiteConfig } from '../types';
import path from 'path';
import { execSync } from 'child_process';

const config: SiteConfig = {
  srcDir: path.join(process.cwd(), 'src', 'data'),
  publicDir: path.join(process.cwd(), 'public'),
  testMode: false, // Always production for publish
  testCount: 10,
  imageMetadataDir: path.join(process.cwd(), 'src', 'data', 'image-metadata')
};

async function main() {
  console.log('🚀 Starting production publish process...');
  
  try {
    // Step 1: Build TypeScript
    console.log('📦 Building TypeScript...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Step 2: Run tests
    console.log('🧪 Running tests...');
    execSync('npm run test', { stdio: 'inherit' });
    
    // Step 3: Clean public directory
    console.log('🧹 Cleaning public directory...');
    execSync('rm -rf public/*', { stdio: 'inherit' });
    
    // Step 4: Generate site
    console.log('🔨 Generating site...');
    const generator = new SiteGenerator(config);
    await generator.generate();
    
    // Step 5: Generate sitemaps (already done in generate, but verify)
    console.log('🗺️  Verifying sitemaps...');
    const sitemapGen = new SitemapGenerator();
    await sitemapGen.generate(config.srcDir, config.publicDir);
    
    // Step 6: Copy CSS
    console.log('🎨 Copying CSS...');
    execSync('cp -r src/css public/', { stdio: 'inherit' });
    
    // Step 7: Copy images
    console.log('🖼️  Copying images...');
    execSync('cp -r src/data/images public/i 2>/dev/null || true', { stdio: 'inherit' });
    execSync('cp -r src/data/assets public/i/ 2>/dev/null || true', { stdio: 'inherit' });
    
    // Step 8: Verify build
    console.log('✅ Verifying build...');
    const requiredFiles = [
      'public/index.html',
      'public/articles.html',
      'public/recipes.html',
      'public/sitemap.xml',
      'public/robots.txt',
      'public/css/styles.css'
    ];
    
    for (const file of requiredFiles) {
      if (!require('fs').existsSync(file)) {
        throw new Error(`Required file missing: ${file}`);
      }
    }
    
    console.log('✨ Publish preparation complete!');
    console.log('📤 Ready to deploy with: npm run deploy');
    
  } catch (error) {
    console.error('❌ Publish failed:', error);
    process.exit(1);
  }
}

main();