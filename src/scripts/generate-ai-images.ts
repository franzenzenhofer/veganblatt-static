#!/usr/bin/env tsx

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface RecipeData {
  title: string;
  slug: string;
  excerpt: string;
  recipe?: {
    name: string;
    ingredients: string[];
    instructions: string[];
  };
  content: string;
}

interface ImageGenerationResult {
  success: boolean;
  filename?: string;
  metadata?: ImageMetadata;
  error?: string;
  reviewScore?: number;
  reviewComments?: string;
}

interface ImageMetadata {
  filename: string;
  copyright: string;
  source: string;
  altText: string;
  width: number;
  height: number;
  mimeType: string;
  uploadDate: string;
  originalUrl: string;
  aiGenerated: boolean;
  model: string;
  prompt: string;
}

class VeganFoodImageGenerator {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private reviewModel: any;
  private generatedCount = 0;
  private readonly MAX_COST = 5.00; // Maximum $5 for testing
  private readonly COST_PER_IMAGE = 0.039; // $0.039 per image as per API docs
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    // Use the image generation model
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-image-preview" 
    });
    // Use standard model for review
    this.reviewModel = this.genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-latest" 
    });
  }

  async generateImagesForRecipes(limit = 5): Promise<void> {
    console.log('🎨 Starting AI Image Generation for Vegan Recipes...\n');
    console.log('⚠️  Using rate-limited API - adding delays between requests\n');
    
    // Find recipes without featured images
    const recipesDir = '/Users/franzenzenhofer/dev/veganblatt-static/src/data/recipes';
    const files = await fs.readdir(recipesDir);
    
    const recipesWithoutImages: string[] = [];
    
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      
      const content = await fs.readFile(path.join(recipesDir, file), 'utf-8');
      const { data } = matter(content);
      
      if (!data.featuredImage) {
        recipesWithoutImages.push(file);
      }
    }
    
    console.log(`Found ${recipesWithoutImages.length} recipes without images\n`);
    
    // Process only the first 'limit' recipes
    const recipesToProcess = recipesWithoutImages.slice(0, limit);
    const results: ImageGenerationResult[] = [];
    
    for (let i = 0; i < recipesToProcess.length; i++) {
      const recipeFile = recipesToProcess[i];
      
      if (this.generatedCount * this.COST_PER_IMAGE >= this.MAX_COST) {
        console.log('⚠️  Cost limit reached. Stopping generation.');
        break;
      }
      
      console.log(`\n📝 Processing [${i + 1}/${recipesToProcess.length}]: ${recipeFile}`);
      
      // Add delay to respect rate limits (7 seconds for free tier: 10 RPM)
      if (i > 0) {
        console.log('   ⏳ Waiting 7 seconds for rate limit...');
        await this.delay(7000);
      }
      
      const result = await this.generateImageForRecipe(recipeFile);
      results.push(result);
      
      if (result.success) {
        this.generatedCount++;
        console.log(`✅ Success! Review Score: ${result.reviewScore}/10`);
      } else {
        console.log(`❌ Failed: ${result.error}`);
        
        // If we hit a rate limit, wait longer
        if (result.error?.includes('429') || result.error?.includes('quota')) {
          console.log('   ⏳ Rate limit hit. Waiting 30 seconds...');
          await this.delay(30000);
        }
      }
    }
    
    // Final report
    this.printFinalReport(results);
  }

  private async generateImageForRecipe(recipeFile: string): Promise<ImageGenerationResult> {
    try {
      // Load recipe data
      const recipePath = path.join('/Users/franzenzenhofer/dev/veganblatt-static/src/data/recipes', recipeFile);
      const content = await fs.readFile(recipePath, 'utf-8');
      const { data, content: markdown } = matter(content) as { data: RecipeData; content: string };
      
      // Create a detailed, appetizing prompt
      const prompt = this.createFoodPornPrompt(data);
      console.log(`   📸 Generating image with prompt length: ${prompt.length} chars`);
      
      // Generate the image
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      // Extract image from response
      let imageData: Buffer | null = null;
      let textResponse = '';
      
      for (const candidate of response.candidates || []) {
        for (const part of candidate.content?.parts || []) {
          if (part.text) {
            textResponse += part.text;
          } else if (part.inlineData) {
            // Image data is base64 encoded
            imageData = Buffer.from(part.inlineData.data, 'base64');
          }
        }
      }
      
      if (!imageData) {
        throw new Error('No image generated in response');
      }
      
      // Save the image
      const slug = data.slug || recipeFile.replace('.md', '');
      const filename = `ai-${slug}.jpg`;
      const imagePath = path.join('/Users/franzenzenhofer/dev/veganblatt-static/public/i/ai', filename);
      
      await fs.writeFile(imagePath, imageData);
      console.log(`   💾 Saved image: ${filename}`);
      
      // Review the generated image
      const { score, comments } = await this.reviewGeneratedImage(imageData, data.title, prompt);
      
      if (score < 8) {
        // If score is too low, delete the image and try again (once)
        console.log(`   ⚠️  Low quality score (${score}/10). Regenerating...`);
        await fs.unlink(imagePath);
        
        // Try with enhanced prompt
        const enhancedPrompt = this.enhancePromptForBetterQuality(prompt, comments);
        const retryResult = await this.model.generateContent(enhancedPrompt);
        const retryResponse = await retryResult.response;
        
        // Extract new image
        imageData = null;
        for (const candidate of retryResponse.candidates || []) {
          for (const part of candidate.content?.parts || []) {
            if (part.inlineData) {
              imageData = Buffer.from(part.inlineData.data, 'base64');
            }
          }
        }
        
        if (imageData) {
          await fs.writeFile(imagePath, imageData);
          const retry = await this.reviewGeneratedImage(imageData, data.title, enhancedPrompt);
          if (retry.score >= 8) {
            console.log(`   ✨ Improved to ${retry.score}/10!`);
          }
        }
      }
      
      // Create metadata file
      const metadata = await this.createImageMetadata(filename, data, prompt);
      await this.saveMetadata(metadata);
      
      // Update the recipe file with the new image
      await this.updateRecipeWithImage(recipeFile, filename);
      
      return {
        success: true,
        filename,
        metadata,
        reviewScore: score,
        reviewComments: comments
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private createFoodPornPrompt(data: RecipeData): string {
    // Extract key information
    const title = data.title;
    const ingredients = data.recipe?.ingredients?.join(', ') || '';
    const excerpt = data.excerpt || '';
    
    // Create a detailed, appetizing prompt
    return `Create a stunning, professional food photography image of "${title}".

CRITICAL REQUIREMENTS:
- Show the EXACT finished dish as described: ${excerpt}
- This is 100% VEGAN - no animal products visible
- Ultra high resolution: 2000x1250 pixels (16:10 aspect ratio, 2000px width)
- Professional food photography with perfect lighting

VISUAL STYLE:
- Photorealistic, appetizing "food porn" quality
- Natural daylight from a window, soft shadows
- Shallow depth of field with beautiful bokeh
- Rich, vibrant colors that make the food look irresistible
- Steam or freshness indicators if appropriate
- Styled on a beautiful wooden table or marble surface
- Elegant but not overly fancy plating

COMPOSITION:
- 45-degree angle showing the dish's best features
- Main dish prominently centered
- Thoughtful garnishes: fresh herbs, lemon wedges, pepper, etc.
- Subtle props: vintage cutlery, linen napkin, small plant
- Clean, minimalist background that doesn't distract

SPECIFIC DETAILS FOR THIS DISH:
${ingredients ? `Key ingredients visible: ${ingredients}` : ''}
The dish should look exactly as described, showing the textures, colors, and appeal that would make someone immediately want to eat it.

MOOD: Warm, inviting, fresh, healthy, and absolutely delicious. This should be the most appetizing vegan ${title} anyone has ever seen.`;
  }

  private enhancePromptForBetterQuality(originalPrompt: string, reviewComments: string): string {
    return `${originalPrompt}

QUALITY IMPROVEMENTS BASED ON REVIEW:
${reviewComments}

ENHANCED REQUIREMENTS:
- Even more appetizing and professional looking
- Perfect lighting with golden hour warmth
- Impeccable food styling with attention to every detail
- Magazine-quality composition
- Make it so delicious-looking that it's impossible to resist`;
  }

  private async reviewGeneratedImage(imageData: Buffer, title: string, prompt: string): Promise<{ score: number; comments: string }> {
    try {
      // Convert image to base64 for the review model
      const base64Image = imageData.toString('base64');
      
      const reviewPrompt = `You are a professional food photographer and vegan chef reviewing an AI-generated food image.

Image Title: "${title}"
Original Generation Prompt: "${prompt}"

Please review this image and provide:
1. A quality score from 1-10 (10 being perfect food photography)
2. Brief comments on what could be improved

EVALUATION CRITERIA:
- Does it look authentically vegan?
- Is it appetizing and would make someone want to eat it?
- Professional photography quality (lighting, composition, focus)
- Does it accurately represent the dish described?
- Color accuracy and vibrancy
- Food styling and presentation

Respond in this exact format:
SCORE: [number]
COMMENTS: [your brief feedback]`;

      const result = await this.reviewModel.generateContent([
        reviewPrompt,
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image
          }
        }
      ]);
      
      const response = await result.response;
      const text = response.text();
      
      // Parse the response
      const scoreMatch = text.match(/SCORE:\s*(\d+)/);
      const commentsMatch = text.match(/COMMENTS:\s*(.+)/s);
      
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;
      const comments = commentsMatch ? commentsMatch[1].trim() : 'No specific feedback';
      
      return { score, comments };
      
    } catch (error) {
      console.log('   ⚠️  Review failed, using default score');
      return { score: 7, comments: 'Review unavailable' };
    }
  }

  private async createImageMetadata(filename: string, recipeData: RecipeData, prompt: string): Promise<ImageMetadata> {
    return {
      filename,
      copyright: '© AI Generated - VeganBlatt',
      source: 'Gemini 2.5 Flash Image Preview',
      altText: recipeData.title,
      width: 2000,
      height: 1250,
      mimeType: 'image/jpeg',
      uploadDate: new Date().toISOString(),
      originalUrl: `https://www.veganblatt.com/i/ai/${filename}`,
      aiGenerated: true,
      model: 'gemini-2.5-flash-image-preview',
      prompt: prompt.substring(0, 500) // Store first 500 chars of prompt
    };
  }

  private async saveMetadata(metadata: ImageMetadata): Promise<void> {
    const metadataPath = path.join(
      '/Users/franzenzenhofer/dev/veganblatt-static/src/data/image-metadata/ai',
      `${metadata.filename}.md`
    );
    
    const content = `---
filename: "${metadata.filename}"
copyright: "${metadata.copyright}"
source: "${metadata.source}"
altText: "${metadata.altText}"
width: ${metadata.width}
height: ${metadata.height}
mimeType: "${metadata.mimeType}"
uploadDate: "${metadata.uploadDate}"
originalUrl: "${metadata.originalUrl}"
aiGenerated: true
model: "${metadata.model}"
---

# AI Generated Image

This image was generated by ${metadata.model} for VeganBlatt.

## Copyright
${metadata.copyright}
`;
    
    await fs.writeFile(metadataPath, content);
    console.log(`   📄 Created metadata: ${metadata.filename}.md`);
  }

  private async updateRecipeWithImage(recipeFile: string, imageFilename: string): Promise<void> {
    const recipePath = path.join('/Users/franzenzenhofer/dev/veganblatt-static/src/data/recipes', recipeFile);
    let content = await fs.readFile(recipePath, 'utf-8');
    
    // Add featuredImage to frontmatter
    const frontmatterEnd = content.indexOf('---', 4);
    if (frontmatterEnd > 0) {
      const beforeEnd = content.substring(0, frontmatterEnd);
      const afterEnd = content.substring(frontmatterEnd);
      
      // Add featuredImage before the closing ---
      content = `${beforeEnd}featuredImage: ai/${imageFilename}\n${afterEnd}`;
      
      await fs.writeFile(recipePath, content);
      console.log(`   📝 Updated recipe with featured image`);
    }
  }

  private printFinalReport(results: ImageGenerationResult[]): void {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 AI IMAGE GENERATION COMPLETE');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`\n📊 Results:`);
    console.log(`   ✅ Successful: ${successful.length}`);
    console.log(`   ❌ Failed: ${failed.length}`);
    
    if (successful.length > 0) {
      console.log(`\n🌟 Generated Images:`);
      successful.forEach(r => {
        console.log(`   • ${r.filename} (Score: ${r.reviewScore}/10)`);
      });
    }
    
    const totalCost = this.generatedCount * this.COST_PER_IMAGE;
    console.log(`\n💰 Total Cost: $${totalCost.toFixed(3)}`);
    
    console.log('\n📌 Next Steps:');
    console.log('   1. Review generated images in /public/i/ai/');
    console.log('   2. Run npm run build to rebuild the site');
    console.log('   3. Deploy if images are perfect');
  }
}

// Main execution
async function main() {
  try {
    const generator = new VeganFoodImageGenerator();
    await generator.generateImagesForRecipes(1); // Test with just 1 recipe first
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
main();

export { VeganFoodImageGenerator };