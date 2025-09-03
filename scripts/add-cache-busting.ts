#!/usr/bin/env tsx
import { readFileSync, writeFileSync, readdirSync, statSync, renameSync, existsSync, mkdirSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';

// Get version from package.json
const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
const version = packageJson.version;

console.log('🔧 Adding cache busting for static assets...');

// 1. Version fingerprint CSS
const cssPath = 'public/css/styles.css';
if (existsSync(cssPath)) {
  const cssContent = readFileSync(cssPath, 'utf-8');
  const hash = createHash('md5').update(cssContent).digest('hex').substring(0, 8);
  const newCssName = `styles.${version}.${hash}.css`;
  const newCssPath = `public/css/${newCssName}`;
  
  // Rename CSS file
  renameSync(cssPath, newCssPath);
  console.log(`  ✅ CSS: styles.css → ${newCssName}`);
  
  // Update all HTML files to reference new CSS
  const htmlFiles = [];
  
  // Find all HTML files
  function findHtmlFiles(dir: string) {
    const files = readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = statSync(fullPath);
      if (stat.isDirectory() && !file.startsWith('.')) {
        findHtmlFiles(fullPath);
      } else if (file.endsWith('.html')) {
        htmlFiles.push(fullPath);
      }
    }
  }
  
  findHtmlFiles('public');
  
  // Update references in HTML files
  for (const htmlFile of htmlFiles) {
    let content = readFileSync(htmlFile, 'utf-8');
    content = content.replace(
      /href="\/css\/styles\.css"/g,
      `href="/css/${newCssName}"`
    );
    writeFileSync(htmlFile, content);
  }
  
  console.log(`  ✅ Updated ${htmlFiles.length} HTML files with new CSS reference`);
}

// 2. Version fingerprint ALL assets in /i/assets/
const assetsDir = 'public/i/assets';
if (existsSync(assetsDir)) {
  const assetFiles = readdirSync(assetsDir);
  const assetMapping: Record<string, string> = {};
  
  for (const file of assetFiles) {
    const fullPath = path.join(assetsDir, file);
    if (statSync(fullPath).isFile()) {
      const content = readFileSync(fullPath);
      const hash = createHash('md5').update(content).digest('hex').substring(0, 8);
      const ext = path.extname(file);
      const baseName = path.basename(file, ext);
      const newFileName = `${baseName}.${version}.${hash}${ext}`;
      const newFilePath = path.join(assetsDir, newFileName);
      
      // Rename the file
      renameSync(fullPath, newFilePath);
      assetMapping[file] = newFileName;
      console.log(`  ✅ Asset: ${file} → ${newFileName}`);
    }
  }
  
  // Update all HTML files with new asset references
  const htmlFiles = [];
  findHtmlFiles('public');
  
  for (const htmlFile of htmlFiles) {
    let content = readFileSync(htmlFile, 'utf-8');
    
    // Replace each asset reference
    for (const [oldName, newName] of Object.entries(assetMapping)) {
      const oldPattern = new RegExp(`/i/assets/${oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
      content = content.replace(oldPattern, `/i/assets/${newName}`);
    }
    
    writeFileSync(htmlFile, content);
  }
  
  console.log(`  ✅ Updated asset references in ${htmlFiles.length} HTML files`);
}

// 3. Create cache configuration for Cloudflare Pages
const cacheConfig = {
  version: version,
  generated: new Date().toISOString(),
  cacheRules: {
    'css/*': {
      'cache-control': 'public, max-age=31536000, immutable'
    },
    'i/assets/*': {
      'cache-control': 'public, max-age=31536000, immutable'
    },
    'i/*.jpg': {
      'cache-control': 'public, max-age=604800, must-revalidate'
    },
    'i/*.png': {
      'cache-control': 'public, max-age=604800, must-revalidate'
    },
    '*.html': {
      'cache-control': 'public, max-age=0, must-revalidate'
    }
  }
};

// 4. Write _headers file for Cloudflare Pages
const headersContent = `# Cache Control Headers for VeganBlatt
# Generated: ${new Date().toISOString()}
# Version: ${version}

# Versioned CSS - Cache forever (1 year)
/css/*.css
  Cache-Control: public, max-age=31536000, immutable
  
# Versioned assets - Cache forever (1 year)
/i/assets/*
  Cache-Control: public, max-age=31536000, immutable

# Images (root and subpaths) - Cache long, immutable
/i/*.jpg
  Cache-Control: public, max-age=31536000, immutable
/i/*.jpeg
  Cache-Control: public, max-age=31536000, immutable
/i/*.png
  Cache-Control: public, max-age=31536000, immutable
/i/*.gif
  Cache-Control: public, max-age=31536000, immutable
/i/*.webp
  Cache-Control: public, max-age=31536000, immutable
/i/*.avif
  Cache-Control: public, max-age=31536000, immutable
/i/*.svg
  Cache-Control: public, max-age=31536000, immutable

/i/**/*.jpg
  Cache-Control: public, max-age=31536000, immutable
/i/**/*.jpeg
  Cache-Control: public, max-age=31536000, immutable
/i/**/*.png
  Cache-Control: public, max-age=31536000, immutable
/i/**/*.gif
  Cache-Control: public, max-age=31536000, immutable
/i/**/*.webp
  Cache-Control: public, max-age=31536000, immutable
/i/**/*.avif
  Cache-Control: public, max-age=31536000, immutable
/i/**/*.svg
  Cache-Control: public, max-age=31536000, immutable

# Sitemaps and robots - shorter cache
/sitemap*.xml
  Cache-Control: public, max-age=3600, must-revalidate

/robots.txt
  Cache-Control: public, max-age=86400, must-revalidate

# HTML pages (explicit extensions)
/*.html
  Cache-Control: public, max-age=0, must-revalidate

/a/*.html
  Cache-Control: public, max-age=0, must-revalidate

/r/*.html
  Cache-Control: public, max-age=0, must-revalidate

# Extensionless HTML routes
/
  Cache-Control: public, max-age=0, must-revalidate

/artikel
  Cache-Control: public, max-age=0, must-revalidate

/rezepte
  Cache-Control: public, max-age=0, must-revalidate

/impressum
  Cache-Control: public, max-age=0, must-revalidate

/a/*
  Cache-Control: public, max-age=0, must-revalidate

/r/*
  Cache-Control: public, max-age=0, must-revalidate
`;

writeFileSync('public/_headers', headersContent);
console.log('  ✅ Created _headers file for Cloudflare Pages');

// Helper function
function findHtmlFiles(dir: string) {
  const htmlFiles: string[] = [];
  const files = readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = statSync(fullPath);
    if (stat.isDirectory() && !file.startsWith('.')) {
      htmlFiles.push(...findHtmlFiles(fullPath).map(f => f));
    } else if (file.endsWith('.html')) {
      htmlFiles.push(fullPath);
    }
  }
  return htmlFiles;
}

console.log('');
console.log('✅ Cache busting complete!');
console.log('  - CSS files are version fingerprinted');
console.log('  - Logo is version fingerprinted');
console.log('  - Cache headers configured');
console.log('  - Ready for deployment with optimal caching');
