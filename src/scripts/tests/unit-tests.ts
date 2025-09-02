#!/usr/bin/env tsx
import { ContentProcessor } from '../../core/ContentProcessor';
import { ImageProcessor } from '../../core/ImageProcessor';
import { FileSystemManager } from '../../core/FileSystemManager';
import assert from 'assert';

console.log(' Running Unit Tests...\n');

// Test ContentProcessor
console.log(' Testing ContentProcessor...');
const contentProcessor = new ContentProcessor();

const testMarkdown = `---
title: Test Article
date: 2024-01-01
featuredImage: test.jpg
excerpt: Test excerpt
---

# Test Content

This is test content.`;

const article = contentProcessor.processArticle('test-article.md', testMarkdown);
assert.strictEqual(article.title, 'Test Article', 'Title parsing failed');
assert.strictEqual(article.slug, 'test-article', 'Slug generation failed');
assert.strictEqual(article.featuredImage, 'test.jpg', 'Featured image parsing failed');
assert.strictEqual(article.excerpt, 'Test excerpt', 'Excerpt parsing failed');
assert(article.content.includes('# Test Content'), 'Content parsing failed');
console.log('   Article parsing works');

// Test recipe parsing
const testRecipeMarkdown = `---
title: Test Recipe
recipe:
  prepTime: 10min
  cookTime: 20min
---
Recipe content`;

const recipe = contentProcessor.processRecipe('test-recipe.md', testRecipeMarkdown);
assert.strictEqual(recipe.title, 'Test Recipe', 'Recipe title failed');
assert(recipe.recipe, 'Recipe data missing');
console.log('   Recipe parsing works\n');

// Test ImageProcessor
console.log(' Testing ImageProcessor...');
const imageProcessor = new ImageProcessor();

const thumbnail = imageProcessor.generateThumbnail('test-image.jpg');
assert(thumbnail.includes('width="80"'), 'Thumbnail width missing');
assert(thumbnail.includes('alt="test image"'), 'Alt text missing');
assert(thumbnail.includes('/i/test-image.jpg'), 'Image path incorrect');
console.log('   Thumbnail generation works');

const emptyThumbnail = imageProcessor.generateThumbnail();
assert.strictEqual(emptyThumbnail, '', 'Empty thumbnail should return empty string');
console.log('   Empty thumbnail handling works\n');

// Test FileSystemManager
console.log(' Testing FileSystemManager...');
const fs = new FileSystemManager();
assert(typeof fs.ensureDir === 'function', 'ensureDir method missing');
assert(typeof fs.readFile === 'function', 'readFile method missing');
assert(typeof fs.writeFile === 'function', 'writeFile method missing');
console.log('   FileSystemManager methods exist\n');

console.log(' ALL UNIT TESTS PASSED!');