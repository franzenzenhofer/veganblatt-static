#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBuTkN626dnV-ymciVPd5rYeKGbrcBpdco';
const RECIPES_DIR = path.join(__dirname, '../../src/data/recipes');
const AI_IMAGES_DIR = path.join(__dirname, '../../public/i/ai');
const IMAGE_METADATA_DIR = path.join(__dirname, '../../src/data/image-metadata');

async function generatePrompt(title: string, excerpt: string): Promise<string> {
  return `Create an ultra-modern, professional vegan food photograph for a VEGAN FOOD BLOG.
  
  CRITICAL REQUIREMENTS:
  ✅ NO TEXT, LABELS, WRITING, WORDS, OR LETTERS ANYWHERE
  ✅ FOR A VEGAN FOOD BLOG - pure food photography only
  ✅ The dish: "${title}" - ${excerpt}
  ✅ EVERYTHING 100% VEGAN - no dairy, eggs, meat, fish, honey
  ✅ ALL props, garnishes, sauces MUST BE VEGAN
  ✅ Square format 1024x1024 for center cropping
  
  COMPOSITION (CRITICAL FOR CENTER CROPPING):
  - CENTERED COMPOSITION - main dish EXACTLY in center
  - Hero angle: 45° overhead (flatlay-ish but with depth)  
  - Main dish takes 60% of center frame
  - Equal spacing on all sides for perfect center crop
  - NO STEAM, NO FOG, NO HAZE - clear visibility
  
  ARTISTIC DIRECTION:
  - Style: Magazine-quality editorial food photography
  - Lighting: Natural, bright, clean - like a sunny kitchen
  - Background: Minimal, neutral (white/light wood/marble)
  - Props: Minimal, elegant (fresh herbs, simple dishware, natural textures)
  - Colors: Vibrant but natural - the food is the star
  - Mood: Fresh, appetizing, makes viewer immediately hungry
  
  FOCUS: Sharp focus on the dish, shallow depth of field for artistic blur on edges.
  
  Remember: This is for a vegan food blog. The photo should look so delicious that even non-vegans would want to try it!`;
}

async function generateImage(genAI: any, recipe: any): Promise<void> {
  const slug = recipe.slug;
  const title = recipe.title;
  const excerpt = recipe.excerpt || '';
  
  const imageName = `ai-${slug}.jpg`;
  const imagePath = path.join(AI_IMAGES_DIR, imageName);
  
  console.log(`   📸 Generating image for: ${title}`);
  
  const prompt = await generatePrompt(title, excerpt);
  
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.4,
      topP: 1,
      topK: 32,
      maxOutputTokens: 8192,
    }
  });
  
  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: Buffer.from('dummy').toString('base64')
      }
    }
  ]);
  
  const response = await result.response;
  const candidates = response.candidates || [];
  
  if (candidates.length > 0 && candidates[0].content?.parts) {
    for (const part of candidates[0].content.parts) {
      if (part.inlineData?.data) {
        const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
        fs.writeFileSync(imagePath, imageBuffer);
        
        console.log(`   ✅ Image saved: ${imagePath}`);
        
        // Center crop from 1024x1024 to 1024x640
        console.log('   🔧 Center cropping to 16:10 aspect ratio...');
        await execAsync(`magick "${imagePath}" -gravity center -crop 1024x640+0+0 +repage "${imagePath}"`);
        console.log('   ✅ Cropped to 1024x640');
        
        // Update metadata
        const metadataFile = `ai-${slug}.jpg.yml`;
        const metadataPath = path.join(IMAGE_METADATA_DIR, metadataFile);
        const metadata = {
          filename: `ai/${imageName}`,
          copyright: '© AI Generated - for illustration',
          altText: title
        };
        
        const yamlContent = `filename: "${metadata.filename}"\ncopyright: "${metadata.copyright}"\naltText: "${metadata.altText}"\n`;
        fs.writeFileSync(metadataPath, yamlContent);
        console.log(`   ✅ Metadata updated: ${metadataFile}`);
        
        // Update recipe file
        const recipeFile = path.join(RECIPES_DIR, '2013-07-07-schoko-mohn-cheesecake.md');
        const recipeContent = fs.readFileSync(recipeFile, 'utf-8');
        const parsed = matter(recipeContent);
        
        parsed.data.featuredImage = `ai/${imageName}`;
        parsed.data.aiGeneratedDate = new Date().toISOString();
        
        const updatedContent = matter.stringify(parsed.content, parsed.data);
        fs.writeFileSync(recipeFile, updatedContent);
        console.log(`   ✅ Recipe updated with new image`);
        
        return;
      }
    }
  }
  
  console.log('   ❌ No image generated');
}

async function main() {
  console.log('🎨 Regenerating AI image for Schoko-Mohn-Cheesecake\n');
  
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  
  // Read the specific recipe
  const recipeFile = path.join(RECIPES_DIR, '2013-07-07-schoko-mohn-cheesecake.md');
  const content = fs.readFileSync(recipeFile, 'utf-8');
  const { data } = matter(content);
  
  await generateImage(genAI, data);
  
  console.log('\n✅ Done!');
}

main().catch(console.error);