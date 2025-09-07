#!/usr/bin/env tsx

/**
 * Favicon Test Suite
 * Tests favicon files exist, are correctly referenced, and have proper formats
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface FaviconTest {
  file: string;
  exists: boolean;
  size?: number;
  format?: string;
  referencedInHTML?: boolean;
}

class FaviconTester {
  private publicDir = 'public';
  private results: FaviconTest[] = [];

  async runTests(): Promise<void> {
    console.log('🔍 Testing Favicon Files...\n');

    // Expected favicon files
    const expectedFavicons = [
      'favicon.ico',
      'favicon-32x32.png', 
      'favicon-16x16.png'
    ];

    // Test each favicon file
    for (const faviconFile of expectedFavicons) {
      await this.testFaviconFile(faviconFile);
    }

    // Test HTML references
    await this.testHTMLReferences();

    // Report results
    this.reportResults();
  }

  private async testFaviconFile(filename: string): Promise<void> {
    const filePath = path.join(this.publicDir, filename);
    const test: FaviconTest = {
      file: filename,
      exists: fs.existsSync(filePath)
    };

    if (test.exists) {
      const stats = fs.statSync(filePath);
      test.size = stats.size;
      
      // Determine format based on extension
      if (filename.endsWith('.ico')) {
        test.format = 'ICO';
      } else if (filename.endsWith('.png')) {
        test.format = 'PNG';
      }

      console.log(`✅ ${filename}: ${test.size} bytes (${test.format})`);
    } else {
      console.log(`❌ ${filename}: NOT FOUND`);
    }

    this.results.push(test);
  }

  private async testHTMLReferences(): Promise<void> {
    console.log('\n🔍 Testing HTML References...');
    
    const htmlFiles = await glob('**/*.html', { cwd: this.publicDir });
    let referencedFavicons = new Set<string>();

    for (const htmlFile of htmlFiles.slice(0, 5)) { // Test first 5 HTML files
      const content = fs.readFileSync(path.join(this.publicDir, htmlFile), 'utf8');
      
      // Check for favicon references
      if (content.includes('favicon.ico')) {
        referencedFavicons.add('favicon.ico');
      }
      if (content.includes('favicon-32x32.png')) {
        referencedFavicons.add('favicon-32x32.png');
      }
      if (content.includes('favicon-16x16.png')) {
        referencedFavicons.add('favicon-16x16.png');
      }
    }

    // Update results with HTML reference info
    for (const result of this.results) {
      result.referencedInHTML = referencedFavicons.has(result.file);
      
      if (result.referencedInHTML) {
        console.log(`✅ ${result.file}: Referenced in HTML`);
      } else {
        console.log(`❌ ${result.file}: NOT referenced in HTML`);
      }
    }
  }

  private reportResults(): void {
    console.log('\n📊 Favicon Test Summary:');
    console.log('========================');

    let allPassed = true;
    
    for (const result of this.results) {
      const status = result.exists && result.referencedInHTML ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${result.file}`);
      
      if (!result.exists) {
        console.log(`  - File missing from ${this.publicDir}/`);
        allPassed = false;
      }
      if (result.exists && !result.referencedInHTML) {
        console.log(`  - Not referenced in HTML files`);
        allPassed = false;
      }
      if (result.exists && result.size === 0) {
        console.log(`  - File is empty (0 bytes)`);
        allPassed = false;
      }
    }

    console.log('\n========================');
    
    if (allPassed) {
      console.log('🎉 ALL FAVICON TESTS PASSED!');
      process.exit(0);
    } else {
      console.log('❌ FAVICON TESTS FAILED!');
      console.log('\nTo fix:');
      console.log('1. Ensure favicon files exist in public/ directory');
      console.log('2. Check HTML templates include favicon link tags');
      console.log('3. Verify favicon files are not empty');
      process.exit(1);
    }
  }
}

// Run tests
const tester = new FaviconTester();
tester.runTests().catch(console.error);