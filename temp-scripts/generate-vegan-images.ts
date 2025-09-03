#!/usr/bin/env tsx

import fetch from 'node-fetch';
import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';
import dotenv from 'dotenv';

dotenv.config();

interface RecipeData {
  title: string;
  slug: string;
  excerpt: string;
  recipe?: {
    ingredients?: string[];
    instructions?: string[];
  };
}

async function generateVeganFoodImage(recipeData: RecipeData) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('No API key');
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;
  
  // Create an appetizing, specific prompt
  const ingredients = recipeData.recipe?.ingredients?.slice(0, 5).join(', ') || '';
  const prompt = `Create a stunning professional food photograph of: ${recipeData.title}

Description: ${recipeData.excerpt}

CRITICAL REQUIREMENTS:
- This is 100% VEGAN food - absolutely no animal products
- Ultra high quality, magazine-style food photography
- Show the EXACT dish as described
${ingredients ? `- Key visible ingredients: ${ingredients}` : ''}

VISUAL STYLE:
- Professional food photography with perfect lighting
- Appetizing "food porn" quality that makes people hungry
- Natural daylight, soft shadows, warm tones
- Beautiful plating on elegant dishware
- Shallow depth of field with creamy bokeh
- Shot from 45-degree angle showing the best features
- Clean, minimal background (wood or marble surface)
- Fresh herbs or garnishes as appropriate
- Steam or moisture if the dish is hot/fresh

Make this the most appetizing vegan ${recipeData.title} photo ever created.`;
  
  const requestBody = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.9,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    }
  };
  
  console.log(`   📸 Generating image for: ${recipeData.title}`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error ${response.status}: ${error}`);
    }
    
    const data = await response.json() as any;
    
    // Extract image data
    const parts = data.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        const imageData = Buffer.from(part.inlineData.data, 'base64');
        const filename = `ai-${recipeData.slug}.jpg`;
        const imagePath = `/Users/franzenzenhofer/dev/veganblatt-static/public/i/ai/${filename}`;
        
        await fs.writeFile(imagePath, imageData);
        console.log(`   ✅ Saved: ${filename} (${(imageData.length / 1024).toFixed(0)} KB)`);
        
        // Create metadata file
        await createImageMetadata(filename, recipeData, prompt);
        
        // Update recipe with featured image
        await updateRecipeFile(recipeData.slug, filename);
        
        return { success: true, filename };
      }
    }
    
    throw new Error('No image in response');
    
  } catch (error: any) {
    console.log(`   ❌ Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function createImageMetadata(filename: string, recipeData: RecipeData, prompt: string) {
  const metadataPath = `/Users/franzenzenhofer/dev/veganblatt-static/src/data/image-metadata/ai/${filename}.md`;
  
  const metadata = `---
filename: "${filename}"
copyright: "© AI Generated - VeganBlatt"
source: "Gemini 2.5 Flash Image Preview"
altText: "${recipeData.title}"
width: 1024
height: 1024
mimeType: "image/jpeg"
uploadDate: "${new Date().toISOString()}"
originalUrl: "https://www.veganblatt.com/i/ai/${filename}"
aiGenerated: true
model: "gemini-2.5-flash-image-preview"
---

# AI Generated Image

This image was generated for VeganBlatt using Gemini 2.5 Flash Image Preview.

## Recipe
${recipeData.title}

## Copyright
© AI Generated - VeganBlatt - Creative Commons CC0
`;
  
  await fs.writeFile(metadataPath, metadata);
  console.log(`   📄 Created metadata: ${filename}.md`);
}

async function updateRecipeFile(slug: string, imageFilename: string) {
  const recipesDir = '/Users/franzenzenhofer/dev/veganblatt-static/src/data/recipes';
  const files = await fs.readdir(recipesDir);
  
  // Find the recipe file
  const recipeFile = files.find(f => f.includes(slug));
  if (!recipeFile) {
    console.log(`   ⚠️  Could not find recipe file for: ${slug}`);
    return;
  }
  
  const recipePath = path.join(recipesDir, recipeFile);
  let content = await fs.readFile(recipePath, 'utf-8');
  
  // Add featuredImage to frontmatter
  const frontmatterEnd = content.indexOf('---', 4);
  if (frontmatterEnd > 0) {
    const beforeEnd = content.substring(0, frontmatterEnd);
    const afterEnd = content.substring(frontmatterEnd);
    
    // Check if featuredImage already exists
    if (!beforeEnd.includes('featuredImage:')) {
      content = `${beforeEnd}featuredImage: ai/${imageFilename}\n${afterEnd}`;
      await fs.writeFile(recipePath, content);
      console.log(`   📝 Updated recipe with featured image`);
    }
  }
}

async function main() {
  console.log('🎨 Generating AI Images for Vegan Recipes\n');
  
  // Get recipes without images
  const recipesDir = '/Users/franzenzenhofer/dev/veganblatt-static/src/data/recipes';
  const files = await fs.readdir(recipesDir);
  
  const recipesToProcess: RecipeData[] = [];
  
  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    
    const content = await fs.readFile(path.join(recipesDir, file), 'utf-8');
    const { data } = matter(content);
    
    if (!data.featuredImage && recipesToProcess.length < 5) {
      recipesToProcess.push({
        title: data.title,
        slug: data.slug || file.replace('.md', ''),
        excerpt: data.excerpt || '',
        recipe: data.recipe
      });
    }
  }
  
  console.log(`Found ${recipesToProcess.length} recipes to process\n`);
  
  // Process each recipe with delay
  for (let i = 0; i < recipesToProcess.length; i++) {
    const recipe = recipesToProcess[i];
    console.log(`\n[${i + 1}/${recipesToProcess.length}] Processing: ${recipe.title}`);
    
    // Add delay between requests (6 seconds for safety)
    if (i > 0) {
      console.log('   ⏳ Waiting 6 seconds...');
      await new Promise(resolve => setTimeout(resolve, 6000));
    }
    
    await generateVeganFoodImage(recipe);
  }
  
  console.log('\n✨ Generation complete!');
  console.log('Run "npm run build" to rebuild the site with new images');
}

main().catch(console.error);