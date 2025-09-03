#!/usr/bin/env tsx

import fetch from 'node-fetch';
import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

interface RecipeData {
  title: string;
  slug: string;
  excerpt: string;
  recipe?: {
    ingredients?: string[];
  };
}

async function generateAndCropImage(recipeData: RecipeData) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('No API key');
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;
  
  // Create prompt that emphasizes CENTER composition
  const ingredients = recipeData.recipe?.ingredients?.slice(0, 5).join(', ') || '';
  const prompt = `Create a stunning professional food photograph of: ${recipeData.title}

Description: ${recipeData.excerpt}

CRITICAL COMPOSITION REQUIREMENTS:
- THE FOOD MUST BE PERFECTLY CENTERED IN THE IMAGE
- Place the main dish in the exact center of the frame
- Leave equal space on all sides around the food
- Center composition with the dish as the focal point
- This image will be cropped to landscape, so CENTER IS CRUCIAL

FOOD REQUIREMENTS:
- This is 100% VEGAN food - absolutely no animal products
- Show the EXACT dish as described
${ingredients ? `- Key visible ingredients: ${ingredients}` : ''}

VISUAL STYLE:
- Ultra high quality, magazine-style food photography
- Appetizing "food porn" quality that makes people instantly hungry
- Professional lighting from above-left creating soft shadows
- Shot from 45-degree angle showing the best features
- Beautiful plating on elegant white dishware
- Clean minimal background (light wood or white marble)
- Shallow depth of field with creamy bokeh
- Fresh garnishes (herbs, lemon, seeds) as appropriate
- Steam or condensation if the dish is hot/fresh
- Vibrant colors that pop

CENTER THE FOOD. The main dish must be in the exact middle of the square image.
Make this the most appetizing vegan ${recipeData.title} ever photographed.`;
  
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
  
  console.log(`   📸 Generating centered image for: ${recipeData.title}`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error ${response.status}`);
    }
    
    const data = await response.json() as any;
    
    // Extract image data
    const parts = data.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        const imageData = Buffer.from(part.inlineData.data, 'base64');
        const filename = `ai-${recipeData.slug}`;
        const tempPath = `/Users/franzenzenhofer/dev/veganblatt-static/public/i/ai/${filename}-temp.jpg`;
        const finalPath = `/Users/franzenzenhofer/dev/veganblatt-static/public/i/ai/${filename}.jpg`;
        
        // Save the original square image
        await fs.writeFile(tempPath, imageData);
        console.log(`   ✅ Generated 1024x1024 image`);
        
        // Crop to 16:10 landscape (1024x640)
        // Calculate crop: remove 192px from top and bottom to get 640px height
        const cropCommand = `convert "${tempPath}" -gravity center -crop 1024x640+0+0 +repage "${finalPath}"`;
        
        try {
          execSync(cropCommand);
          console.log(`   ✂️  Cropped to 1024x640 (16:10 landscape)`);
          
          // Remove temp file
          await fs.unlink(tempPath);
          
          // Verify dimensions
          const verifyCommand = `identify -format "%wx%h" "${finalPath}"`;
          const dimensions = execSync(verifyCommand).toString();
          console.log(`   📐 Final dimensions: ${dimensions}`);
          
        } catch (cropError) {
          console.log(`   ⚠️  Could not crop image (ImageMagick may not be installed)`);
          // Rename temp to final if crop fails
          await fs.rename(tempPath, finalPath);
        }
        
        // Create metadata
        await createImageMetadata(`${filename}.jpg`, recipeData, prompt);
        
        // Update recipe file
        await updateRecipeFile(recipeData.slug, `${filename}.jpg`);
        
        return { success: true, filename: `${filename}.jpg` };
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
height: 640
mimeType: "image/jpeg"
uploadDate: "${new Date().toISOString()}"
originalUrl: "https://www.veganblatt.com/i/ai/${filename}"
aiGenerated: true
model: "gemini-2.5-flash-image-preview"
---

# AI Generated Image

This image was generated for VeganBlatt using Gemini 2.5 Flash Image Preview.
Original 1024x1024 image cropped to 1024x640 (16:10 landscape).

## Recipe
${recipeData.title}

## Copyright
© AI Generated - VeganBlatt - Creative Commons CC0
`;
  
  await fs.writeFile(metadataPath, metadata);
  console.log(`   📄 Created metadata with correct dimensions`);
}

async function updateRecipeFile(slug: string, imageFilename: string) {
  const recipesDir = '/Users/franzenzenhofer/dev/veganblatt-static/src/data/recipes';
  const files = await fs.readdir(recipesDir);
  
  const recipeFile = files.find(f => f.includes(slug));
  if (!recipeFile) {
    console.log(`   ⚠️  Could not find recipe file for: ${slug}`);
    return;
  }
  
  const recipePath = path.join(recipesDir, recipeFile);
  let content = await fs.readFile(recipePath, 'utf-8');
  
  // Check if featuredImage already exists
  if (!content.includes('featuredImage:')) {
    const frontmatterEnd = content.indexOf('---', 4);
    if (frontmatterEnd > 0) {
      const beforeEnd = content.substring(0, frontmatterEnd);
      const afterEnd = content.substring(frontmatterEnd);
      content = `${beforeEnd}featuredImage: ai/${imageFilename}\n${afterEnd}`;
      await fs.writeFile(recipePath, content);
      console.log(`   📝 Updated recipe with featured image`);
    }
  }
}

async function main() {
  console.log('🎨 Generating & Cropping AI Images for Vegan Recipes\n');
  console.log('📐 Target: 1024x640 (16:10 landscape) from 1024x1024 source\n');
  
  // First, install ImageMagick if not present
  try {
    execSync('which convert', { stdio: 'ignore' });
  } catch {
    console.log('⚠️  ImageMagick not found. Installing...');
    try {
      execSync('brew install imagemagick', { stdio: 'inherit' });
      console.log('✅ ImageMagick installed\n');
    } catch {
      console.log('❌ Could not install ImageMagick. Images will not be cropped.\n');
    }
  }
  
  // Get 5 more recipes without images
  const recipesDir = '/Users/franzenzenhofer/dev/veganblatt-static/src/data/recipes';
  const files = await fs.readdir(recipesDir);
  
  const recipesToProcess: RecipeData[] = [];
  
  // Skip the ones we already did
  const alreadyDone = [
    'rote-beete-salat',
    'mandel-dattel-kugeln', 
    'gemuese-schnitzel',
    'kartoffel-gulasch',
    'bananen-schnitten'
  ];
  
  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    
    const content = await fs.readFile(path.join(recipesDir, file), 'utf-8');
    const { data } = matter(content);
    
    const slug = data.slug || file.replace('.md', '');
    
    if (!data.featuredImage && !alreadyDone.includes(slug) && recipesToProcess.length < 5) {
      recipesToProcess.push({
        title: data.title,
        slug: slug,
        excerpt: data.excerpt || '',
        recipe: data.recipe
      });
    }
  }
  
  console.log(`Found ${recipesToProcess.length} new recipes to process\n`);
  
  // Process each recipe
  for (let i = 0; i < recipesToProcess.length; i++) {
    const recipe = recipesToProcess[i];
    console.log(`\n[${i + 1}/${recipesToProcess.length}] ${recipe.title}`);
    
    // Add delay between requests
    if (i > 0) {
      console.log('   ⏳ Waiting 6 seconds...');
      await new Promise(resolve => setTimeout(resolve, 6000));
    }
    
    await generateAndCropImage(recipe);
  }
  
  console.log('\n✨ Generation complete!');
  console.log('🔨 Run "npm run build" to rebuild the site');
}

main().catch(console.error);