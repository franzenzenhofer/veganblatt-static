#!/usr/bin/env node --loader tsx

import fs from 'fs/promises';
import path from 'path';

async function testGeneration() {
  const publicDir = path.join(process.cwd(), 'public');
  const errors: string[] = [];
  
  // Check critical files
  const criticalFiles = [
    'index.html',
    'articles.html', 
    'recipes.html',
    'impressum.html',
    'css/styles.css',
    'i/assets/veganblatt-logo.svg'
  ];
  
  console.log(' Testing generated files...\n');
  
  for (const file of criticalFiles) {
    const filePath = path.join(publicDir, file);
    try {
      await fs.access(filePath);
      console.log(` ${file}`);
    } catch {
      console.log(` ${file} - MISSING!`);
      errors.push(file);
    }
  }
  
  // Check article pages exist
  const articlesDir = path.join(publicDir, 'a');
  try {
    const articles = await fs.readdir(articlesDir);
    const htmlFiles = articles.filter(f => f.endsWith('.html'));
    console.log(`\n Articles: ${htmlFiles.length} generated`);
  } catch {
    console.log('\n Articles directory missing!');
    errors.push('articles directory');
  }
  
  // Check recipe pages exist
  const recipesDir = path.join(publicDir, 'r');
  try {
    const recipes = await fs.readdir(recipesDir);
    const htmlFiles = recipes.filter(f => f.endsWith('.html'));
    console.log(` Recipes: ${htmlFiles.length} generated`);
  } catch {
    console.log(' Recipes directory missing!');
    errors.push('recipes directory');
  }
  
  // Check for images on list pages
  console.log('\n Testing list page images...');
  const articlesHtml = await fs.readFile(path.join(publicDir, 'articles.html'), 'utf-8');
  const imageCount = (articlesHtml.match(/width="80"/g) || []).length;
  if (imageCount > 0) {
    console.log(` Articles page: ${imageCount} images with width="80"`);
  } else {
    console.log(' Articles page: NO IMAGES FOUND!');
    errors.push('images on articles page');
  }
  
  const recipesHtml = await fs.readFile(path.join(publicDir, 'recipes.html'), 'utf-8');
  const recipeImageCount = (recipesHtml.match(/width="80"/g) || []).length;
  if (recipeImageCount > 0) {
    console.log(` Recipes page: ${recipeImageCount} images with width="80"`);
  } else {
    console.log(' Recipes page: NO IMAGES FOUND!');
    errors.push('images on recipes page');
  }
  
  if (errors.length > 0) {
    console.log('\n TESTS FAILED!');
    console.log('Missing files:', errors.join(', '));
    process.exit(1);
  } else {
    console.log('\n ALL TESTS PASSED!');
  }
}

testGeneration().catch(console.error);