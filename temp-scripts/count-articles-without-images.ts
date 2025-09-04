#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const articlesDir = '/Users/franzenzenhofer/dev/veganblatt-static/src/data/articles';
const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));

let noImageCount = 0;
let withImageCount = 0;
const articlesWithoutImages: string[] = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(articlesDir, file), 'utf-8');
  const { data } = matter(content);
  
  if (!data.featuredImage || data.featuredImage === '') {
    noImageCount++;
    articlesWithoutImages.push(file);
  } else {
    withImageCount++;
  }
}

console.log('📊 Article Image Statistics:');
console.log('============================');
console.log(`✅ Articles WITH images: ${withImageCount}`);
console.log(`❌ Articles WITHOUT images: ${noImageCount}`);
console.log(`📁 Total articles: ${files.length}`);
console.log(`\n📝 First 10 articles without images:`);
articlesWithoutImages.slice(0, 10).forEach(f => console.log(`   - ${f}`));