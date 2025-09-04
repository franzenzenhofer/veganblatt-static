#!/usr/bin/env tsx

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Load environment variables
dotenv.config();

interface ContentData {
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

interface ImageMetadata {
  filename: string;
  copyright: string;
  source: string;
  altText: string;
  aiGenerated: boolean;
  model: string;
  uploadDate: string;
}

type ContentType = 'recipe' | 'article';

interface GeneratorOptions {
  type: ContentType;
  limit?: number;
  skipExisting?: boolean;
}

class VeganContentImageGenerator {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private generatedCount = 0;
  private logFile: string;
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-image-preview" 
    });
    
    // Create log file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFile = `/Users/franzenzenhofer/dev/veganblatt-static/logs/ai-generation-${timestamp}.log`;
  }

  async log(message: string): Promise<void> {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message);
    
    // Ensure logs directory exists
    await fs.mkdir(path.dirname(this.logFile), { recursive: true });
    await fs.appendFile(this.logFile, logMessage);
  }

  async getExistingImages(): Promise<Set<string>> {
    const aiDir = '/Users/franzenzenhofer/dev/veganblatt-static/public/i/ai';
    const files = await fs.readdir(aiDir);
    return new Set(files);
  }

  async generateImages(options: GeneratorOptions): Promise<void> {
    const { type, limit = 5, skipExisting = true } = options;
    const contentName = type === 'recipe' ? 'Vegan Recipes' : 'Vegan Articles';
    
    await this.log(`🎨 Starting AI Image Generation for ${contentName}`);
    await this.log('Using PAID Gemini API - Professional mode');
    
    // Get existing images
    const existingImages = skipExisting ? await this.getExistingImages() : new Set();
    await this.log(`Found ${existingImages.size} existing AI images`);
    
    // Find content without featured images
    const contentDir = type === 'recipe' 
      ? '/Users/franzenzenhofer/dev/veganblatt-static/src/data/recipes'
      : '/Users/franzenzenhofer/dev/veganblatt-static/src/data/articles';
    const files = await fs.readdir(contentDir);
    
    const contentWithoutImages: string[] = [];
    
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      
      const content = await fs.readFile(path.join(contentDir, file), 'utf-8');
      const { data } = matter(content);
      
      if (!data.featuredImage) {
        // Check if we already generated this image
        const slug = data.slug || file.replace('.md', '');
        const expectedFilename = `ai-${slug}.jpg`;
        
        if (!existingImages.has(expectedFilename)) {
          contentWithoutImages.push(file);
        }
      }
    }
    
    await this.log(`Found ${contentWithoutImages.length} ${type}s needing images`);
    
    // Process only the first 'limit' items
    const itemsToProcess = contentWithoutImages.slice(0, limit);
    
    for (let i = 0; i < itemsToProcess.length; i++) {
      const contentFile = itemsToProcess[i];
      
      await this.log(`\n📝 Processing [${i + 1}/${itemsToProcess.length}]: ${contentFile}`);
      
      // Small delay between requests
      if (i > 0) {
        await this.log('   ⏳ Waiting 2 seconds...');
        await this.delay(2000);
      }
      
      try {
        await this.generateImageForContent(contentFile, type);
        this.generatedCount++;
        await this.log(`   ✅ SUCCESS - Total generated: ${this.generatedCount}`);
      } catch (error: any) {
        await this.log(`   ❌ FAILED: ${error.message}`);
        
        // If we hit a rate limit, wait longer
        if (error.message?.includes('429') || error.message?.includes('quota')) {
          await this.log('   ⏳ Rate limit hit. Waiting 30 seconds...');
          await this.delay(30000);
        }
      }
    }
    
    await this.printFinalReport();
  }

  private async generateImageForContent(contentFile: string, type: ContentType): Promise<void> {
    // Load content data
    const contentDir = type === 'recipe' 
      ? '/Users/franzenzenhofer/dev/veganblatt-static/src/data/recipes'
      : '/Users/franzenzenhofer/dev/veganblatt-static/src/data/articles';
    const contentPath = path.join(contentDir, contentFile);
    const content = await fs.readFile(contentPath, 'utf-8');
    const { data, content: markdown } = matter(content) as { data: ContentData; content: string };
    
    // Create appropriate prompt based on content type
    const prompt = type === 'recipe' 
      ? this.createFoodPhotographyPrompt(data)
      : this.createArticleImagePrompt(data, markdown);
    await this.log(`   📸 Generating with optimized prompt (${prompt.length} chars)`);
    
    // Generate the image
    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    
    // Extract image from response
    let imageData: Buffer | null = null;
    
    for (const candidate of response.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData) {
          imageData = Buffer.from(part.inlineData.data, 'base64');
        }
      }
    }
    
    if (!imageData) {
      throw new Error('No image generated in response');
    }
    
    // Save the image
    const slug = data.slug || contentFile.replace('.md', '');
    const filename = `ai-${slug}.jpg`;
    const imagePath = path.join('/Users/franzenzenhofer/dev/veganblatt-static/public/i/ai', filename);
    
    await fs.writeFile(imagePath, imageData);
    await this.log(`   💾 Saved: ${filename}`);
    
    // Crop to 16:10 aspect ratio (1024x640)
    await this.log(`   ✂️  Cropping to 16:10 aspect ratio...`);
    await execAsync(`magick "${imagePath}" -gravity center -crop 1024x640+0+0 +repage "${imagePath}"`);
    await this.log(`   ✅ Cropped to 1024x640`);
    
    // Create metadata
    const metadata = await this.createImageMetadata(filename, data);
    await this.saveMetadata(metadata);
    
    // Update content file
    await this.updateContentWithImage(contentFile, filename, type);
    await this.log(`   📝 Updated ${type} with image`);
  }

  private createArticleImagePrompt(data: ContentData, markdown: string): string {
    const title = data.title;
    const excerpt = data.excerpt || '';
    
    // Extract key topics from content for better context
    const contentPreview = markdown.substring(0, 500);
    
    return `Create a modern, professional vegan lifestyle photograph for a VEGAN BLOG ARTICLE.

CRITICAL REQUIREMENTS:
✅ NO TEXT, LABELS, WRITING, WORDS, OR LETTERS ANYWHERE
✅ NO HUMANS IN THE IMAGE - lifestyle and objects only
✅ ALL ABOUT VEGAN LIFESTYLE AND THEMES
✅ Article: "${title}" - ${excerpt}
✅ EVERYTHING 100% VEGAN - no animal products visible
✅ Square format 1024x1024 for center cropping

ARTICLE CONTEXT:
${contentPreview.substring(0, 200)}...

VISUAL STYLE:
- Clean, modern, editorial photography
- Natural lighting, bright and inviting
- Minimalist Scandinavian aesthetic
- Professional blog/magazine quality
- Shallow depth of field for artistic effect

COMPOSITION:
- CENTERED COMPOSITION for perfect cropping
- Main subject takes 60% of center frame
- Equal spacing on all sides
- Clean backgrounds (white, wood, marble)
- No clutter, minimal props

SUBJECT MATTER (choose appropriate for article):
- Fresh vegetables and fruits artistically arranged
- Plant-based ingredients in bowls or jars
- Vegan pantry items and superfoods
- Green smoothies, plant milk, fresh juices
- Sustainable lifestyle items (reusable bags, bamboo)
- Kitchen scenes with vegan ingredients
- Nature elements (leaves, herbs, flowers)

MOOD:
Fresh, healthy, sustainable, ethical, modern, clean.
Convey the positive vegan lifestyle message.
Professional blogger/influencer quality.`;
  }

  private createFoodPhotographyPrompt(data: ContentData): string {
    const title = data.title;
    const ingredients = data.recipe?.ingredients?.join(', ') || '';
    const excerpt = data.excerpt || '';
    
    return `Create an ultra-modern, professional vegan food photograph for a VEGAN FOOD BLOG.

CRITICAL REQUIREMENTS:
✅ NO TEXT, LABELS, WRITING, WORDS, OR LETTERS ANYWHERE
✅ FOR A VEGAN FOOD BLOG - pure food photography only
✅ The dish: "${title}" - ${excerpt}
✅ EVERYTHING 100% VEGAN - no dairy, eggs, meat, fish, honey
✅ ALL props, garnishes, sauces MUST BE VEGAN
✅ Square format 1024x1024 for center cropping

MODERN PHOTOGRAPHY STYLE:
- Instagram-worthy, trending food photography 2024 style
- Natural light from 45° angle creating soft shadows
- Shallow depth of field (f/1.8-2.8) with creamy bokeh
- Shot with 85mm lens perspective
- Color grading: warm but natural, slightly desaturated
- Minimalist Scandinavian aesthetic
- Clean negative space around the dish
- NO FOG OR STEAM - crystal clear, sharp image

COMPOSITION (CRITICAL FOR CROPPING):
- CENTERED COMPOSITION - main dish EXACTLY in center
- Hero angle: 45° overhead (flatlay-ish but with depth)
- Main dish takes 60% of center frame
- Equal spacing on all sides for perfect center crop
- Natural imperfections that add authenticity
- Fresh ingredients visible showing texture
- NO STEAM, NO FOG, NO HAZE - clear visibility
- Natural garnish that makes sense (no random herbs)

SURFACE & PROPS:
- Light wood, white marble, or matte ceramic surface
- Maximum 1-2 minimal props (linen, simple cutlery)
- Props in soft focus, not distracting
- Clean but lived-in feel

FOOD STYLING:
- Photogenic but realistic portions
- Natural drips, crumbs, or imperfections
- Fresh and vibrant appearance
- Correct physics - nothing floating or impossible
- Ingredients clearly identifiable as vegan
${ingredients ? `- Key visible elements: ${ingredients}` : ''}

OVERALL MOOD:
Fresh, healthy, appetizing, modern, clean, authentic.
Make viewers immediately crave this vegan dish.
Professional food blogger/cookbook quality.`;
  }

  private async createImageMetadata(filename: string, contentData: ContentData): Promise<ImageMetadata> {
    return {
      filename,
      copyright: '© Bild AI generiert zu Illustrationszwecken',
      source: 'Gemini 2.5 Flash Image Preview',
      altText: contentData.title,
      aiGenerated: true,
      model: 'gemini-2.5-flash-image-preview',
      uploadDate: new Date().toISOString()
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
aiGenerated: true
model: "${metadata.model}"
uploadDate: "${metadata.uploadDate}"
---

# AI Generated Image

This image was generated by ${metadata.model} for VeganBlatt.

## Copyright
${metadata.copyright}
`;
    
    await fs.writeFile(metadataPath, content);
  }

  private async updateContentWithImage(contentFile: string, imageFilename: string, type: ContentType): Promise<void> {
    const contentDir = type === 'recipe' 
      ? '/Users/franzenzenhofer/dev/veganblatt-static/src/data/recipes'
      : '/Users/franzenzenhofer/dev/veganblatt-static/src/data/articles';
    const contentPath = path.join(contentDir, contentFile);
    let content = await fs.readFile(contentPath, 'utf-8');
    
    // Parse the frontmatter
    const { data, content: markdown } = matter(content);
    
    // Update or add the fields
    data.aiGeneratedDate = new Date().toISOString();
    data.featuredImage = `ai/${imageFilename}`;
    
    // Rebuild the file with updated frontmatter
    const newContent = matter.stringify(markdown, data);
    await fs.writeFile(contentPath, newContent);
  }

  private async printFinalReport(): Promise<void> {
    const report = `
${'='.repeat(60)}
🎉 AI IMAGE GENERATION COMPLETE
${'='.repeat(60)}

📊 Results:
   ✅ Generated: ${this.generatedCount} images
   💰 Estimated Cost: $${(this.generatedCount * 0.039).toFixed(3)}
   
📌 Next Steps:
   1. Check images in /public/i/ai/
   2. Run npm run build
   3. Deploy if satisfied

📋 Log file: ${this.logFile}
`;
    
    await this.log(report);
  }

  async regenerateSpecificImages(slugs: string[], type: ContentType = 'recipe'): Promise<void> {
    await this.log('🔄 REGENERATING SPECIFIC IMAGES');
    
    for (const slug of slugs) {
      await this.log(`\nRegenerating: ${slug}`);
      
      // Find the content file
      const contentDir = type === 'recipe'
        ? '/Users/franzenzenhofer/dev/veganblatt-static/src/data/recipes'
        : '/Users/franzenzenhofer/dev/veganblatt-static/src/data/articles';
      const files = await fs.readdir(contentDir);
      
      for (const file of files) {
        if (!file.endsWith('.md')) continue;
        
        const content = await fs.readFile(path.join(contentDir, file), 'utf-8');
        const { data } = matter(content);
        
        if (data.slug === slug || file.includes(slug)) {
          await this.log(`   Found ${type}: ${file}`);
          
          // Delete old image if exists
          const oldImagePath = path.join('/Users/franzenzenhofer/dev/veganblatt-static/public/i/ai', `ai-${slug}.jpg`);
          try {
            await fs.unlink(oldImagePath);
            await this.log(`   Deleted old image`);
          } catch {}
          
          // Generate new image
          await this.generateImageForContent(file, type);
          await this.log(`   ✅ Regenerated successfully`);
          
          // Small delay
          await this.delay(2000);
          break;
        }
      }
    }
  }
}

// Main execution
async function main() {
  try {
    const generator = new VeganContentImageGenerator();
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    
    if (args[0] === '--regenerate' && args[1]) {
      const slug = args[1];
      const type = args[2] as ContentType || 'recipe';
      console.log(`🔄 Regenerating AI image for ${type}: ${slug}\n`);
      await generator.regenerateSpecificImages([slug], type);
    } else if (args[0] === '--articles') {
      const batchSize = parseInt(args[1]) || 5;
      console.log(`📦 Generating ${batchSize} AI images for VeganBlatt articles\n`);
      await generator.generateImages({ type: 'article', limit: batchSize });
    } else if (args[0] === '--recipes') {
      const batchSize = parseInt(args[1]) || 5;
      console.log(`📦 Generating ${batchSize} AI images for VeganBlatt recipes\n`);
      await generator.generateImages({ type: 'recipe', limit: batchSize });
    } else {
      // Default to recipes for backward compatibility
      const batchSize = parseInt(args[0]) || 5;
      console.log(`📦 Generating ${batchSize} AI images for VeganBlatt recipes\n`);
      await generator.generateImages({ type: 'recipe', limit: batchSize });
    }
    
    console.log('\n✅ Done! Run npm run deploy to deploy');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
main();

export { VeganContentImageGenerator };