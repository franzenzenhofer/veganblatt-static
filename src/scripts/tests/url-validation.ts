#!/usr/bin/env tsx

/**
 * URL Validation Script - VeganBlatt
 * 
 * Tests all image URLs for existence and proper encoding
 * CRITICAL: All images must exist and be properly encoded
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface ValidationResult {
  url: string;
  exists: boolean;
  actualPath: string;
  error?: string;
}

class URLValidator {
  private baseDir: string;
  private results: ValidationResult[] = [];
  private errors: string[] = [];

  constructor(publicDir: string = './public') {
    this.baseDir = path.resolve(publicDir);
    console.log(`🔍 URL Validator - Base directory: ${this.baseDir}`);
  }

  async validateAllUrls(): Promise<void> {
    console.log('\n📋 VALIDATING ALL URLS IN GENERATED FILES...');
    
    // Find all HTML files
    const htmlFiles = await glob('**/*.html', { 
      cwd: this.baseDir
    });

    console.log(`   Found ${htmlFiles.length} HTML files to validate`);

    for (const htmlFile of htmlFiles) {
      await this.validateHtmlFile(htmlFile);
    }

    this.printResults();
    this.failLoudIfErrors();
  }

  private async validateHtmlFile(filePath: string): Promise<void> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativeFile = path.relative(this.baseDir, filePath);
    
    // Extract all image URLs
    const imageUrls = this.extractImageUrls(content);
    
    for (const url of imageUrls) {
      const result = this.validateImageUrl(url);
      this.results.push(result);
      
      if (!result.exists) {
        this.errors.push(`MISSING IMAGE: ${url} in ${relativeFile}`);
      }
    }
  }

  private extractImageUrls(content: string): string[] {
    const urls: string[] = [];
    
    // Extract img src URLs
    const imgSrcRegex = /<img[^>]+src=["']([^"']+)["']/g;
    let match;
    while ((match = imgSrcRegex.exec(content)) !== null) {
      if (match[1]) {
        urls.push(match[1]);
      }
    }
    
    // Extract og:image URLs
    const ogImageRegex = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/g;
    while ((match = ogImageRegex.exec(content)) !== null) {
      // Convert full URLs to relative paths
      const url = match[1];
      if (url && url.includes('veganblatt.com/i/')) {
        urls.push(url.substring(url.indexOf('/i/')));
      }
    }
    
    return urls.filter(url => url.startsWith('/i/'));
  }

  private validateImageUrl(url: string): ValidationResult {
    // Convert URL to file system path
    let filePath: string;
    
    try {
      // Remove /i/ prefix and decode URL
      const imagePath = url.substring(3); // Remove '/i/'
      const decodedPath = decodeURIComponent(imagePath);
      filePath = path.join(this.baseDir, 'i', decodedPath);
      
      const exists = fs.existsSync(filePath);
      
      // Check for encoding issues
      let error: string | undefined;
      if (!exists && imagePath.includes('%2F')) {
        error = `ENCODING ISSUE: Contains %2F (encoded slash) - should be plain slash`;
      }
      
      return {
        url,
        exists,
        actualPath: filePath,
        error
      };
      
    } catch (err) {
      return {
        url,
        exists: false,
        actualPath: 'DECODE_ERROR',
        error: `Failed to decode URL: ${err}`
      };
    }
  }

  private printResults(): void {
    console.log('\n📊 URL VALIDATION RESULTS');
    console.log('========================');
    
    const totalImages = this.results.length;
    const existingImages = this.results.filter(r => r.exists).length;
    const missingImages = this.results.filter(r => !r.exists).length;
    const encodingIssues = this.results.filter(r => r.error?.includes('ENCODING')).length;
    
    console.log(`   Total image URLs found: ${totalImages}`);
    console.log(`   ✅ Images found: ${existingImages}`);
    console.log(`   ❌ Images missing: ${missingImages}`);
    console.log(`   🔧 Encoding issues: ${encodingIssues}`);
    
    if (encodingIssues > 0) {
      console.log('\n🔧 ENCODING ISSUES:');
      this.results
        .filter(r => r.error?.includes('ENCODING'))
        .forEach(r => {
          console.log(`   ❌ ${r.url}`);
          console.log(`      ${r.error}`);
        });
    }
    
    if (missingImages > 0) {
      console.log('\n❌ MISSING IMAGES:');
      this.results
        .filter(r => !r.exists && !r.error?.includes('ENCODING'))
        .forEach(r => {
          console.log(`   ❌ ${r.url} → ${r.actualPath}`);
        });
    }
  }

  private failLoudIfErrors(): void {
    if (this.errors.length > 0) {
      console.log('\n💥 FAIL LOUD - URL VALIDATION FAILED!');
      console.log('====================================');
      this.errors.forEach(error => console.log(`   ${error}`));
      console.log(`\n   Total errors: ${this.errors.length}`);
      console.log('   🚫 DEPLOYMENT BLOCKED - FIX ALL URLS FIRST!');
      process.exit(1);
    }
    
    console.log('\n✅ URL VALIDATION PASSED - ALL IMAGES EXIST!');
  }

  // Method to check specific AI image URLs
  checkAiImageUrls(): void {
    console.log('\n🤖 CHECKING AI IMAGE URLS...');
    
    const aiImagePattern = /\/i\/ai%2F/g;
    const htmlFiles = fs.readdirSync(path.join(this.baseDir))
      .filter(f => f.endsWith('.html'))
      .map(f => path.join(this.baseDir, f));
    
    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const matches = content.match(aiImagePattern);
      
      if (matches) {
        console.log(`   ❌ DOUBLE ENCODING FOUND in ${path.basename(file)}`);
        console.log(`      Found ${matches.length} instances of /i/ai%2F`);
        this.errors.push(`Double encoding in ${path.basename(file)}`);
      }
    }
    
    if (this.errors.length === 0) {
      console.log('   ✅ No AI image encoding issues found');
    }
  }
}

// Run validation
async function main() {
  try {
    const validator = new URLValidator();
    
    // Check for specific AI image encoding issues
    validator.checkAiImageUrls();
    
    // Validate all URLs
    await validator.validateAllUrls();
    
  } catch (error) {
    console.error('💥 URL VALIDATION ERROR:', error);
    process.exit(1);
  }
}

// Run if this is the main module
main();

export { URLValidator };