#!/usr/bin/env tsx
import { SitemapGenerator } from '../generators/SitemapGenerator';
import path from 'path';
import fs from 'fs/promises';

async function testSitemapGeneration() {
  console.log('📝 Testing Sitemap Generation...\n');
  
  const testDir = path.join(process.cwd(), 'test-output');
  const srcDir = path.join(process.cwd(), 'src', 'data');
  
  try {
    // Clean test directory
    await fs.rm(testDir, { recursive: true, force: true });
    await fs.mkdir(testDir, { recursive: true });
    
    // Test 1: Create generator
    console.log('✅ Test 1: Created SitemapGenerator instance');
    const generator = new SitemapGenerator();
    
    // Test 2: Generate sitemaps
    console.log('⏳ Test 2: Generating sitemaps...');
    await generator.generate(srcDir, testDir);
    
    // Test 3: Check if files were created
    const expectedFiles = [
      'sitemap.xml',
      'sitemap-articles.xml',
      'sitemap-recipes.xml',
      'sitemap-static.xml',
      'robots.txt'
    ];
    
    for (const file of expectedFiles) {
      const filePath = path.join(testDir, file);
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      
      if (exists) {
        const stats = await fs.stat(filePath);
        console.log(`✅ Test 3: ${file} created (${stats.size} bytes)`);
      } else {
        console.log(`❌ Test 3: ${file} NOT created`);
        throw new Error(`Missing file: ${file}`);
      }
    }
    
    // Test 4: Validate sitemap XML structure
    const sitemapIndex = await fs.readFile(path.join(testDir, 'sitemap.xml'), 'utf-8');
    if (!sitemapIndex.includes('<?xml version="1.0" encoding="UTF-8"?>')) {
      throw new Error('Invalid XML declaration');
    }
    if (!sitemapIndex.includes('<sitemapindex')) {
      throw new Error('Missing sitemapindex element');
    }
    if (!sitemapIndex.includes('sitemap-articles.xml')) {
      throw new Error('Missing articles sitemap reference');
    }
    console.log('✅ Test 4: Sitemap index structure is valid');
    
    // Test 5: Validate robots.txt
    const robotsTxt = await fs.readFile(path.join(testDir, 'robots.txt'), 'utf-8');
    if (!robotsTxt.includes('User-agent: *')) {
      throw new Error('Missing User-agent directive');
    }
    if (!robotsTxt.includes('Sitemap: https://www.veganblatt.com/sitemap.xml')) {
      throw new Error('Missing sitemap reference in robots.txt');
    }
    console.log('✅ Test 5: robots.txt is valid');
    
    // Test 6: Check for changefreq and priority (should NOT exist)
    const articlesSitemap = await fs.readFile(path.join(testDir, 'sitemap-articles.xml'), 'utf-8');
    if (articlesSitemap.includes('<changefreq>')) {
      throw new Error('changefreq should not be present in sitemap');
    }
    if (articlesSitemap.includes('<priority>')) {
      throw new Error('priority should not be present in sitemap');
    }
    console.log('✅ Test 6: No changefreq or priority in sitemaps');
    
    // Clean up
    await fs.rm(testDir, { recursive: true, force: true });
    
    console.log('\n🎉 All sitemap tests passed!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testSitemapGeneration();