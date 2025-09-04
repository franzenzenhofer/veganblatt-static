#!/usr/bin/env tsx

import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY || "";
if (!API_KEY) {
  console.error("❌ GEMINI_API_KEY not found in environment");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

interface ArticleData {
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;
}

class SmartImageGenerator {
  private waitTime = 20000; // Start with 20 seconds
  private consecutiveFailures = 0;
  private consecutiveSuccesses = 0;
  
  async adjustWaitTime(success: boolean) {
    if (success) {
      this.consecutiveSuccesses++;
      this.consecutiveFailures = 0;
      
      // After 3 successes, try reducing wait time
      if (this.consecutiveSuccesses >= 3) {
        this.waitTime = Math.max(10000, this.waitTime - 2000); // Reduce by 2s, min 10s
        console.log(`   📉 Reducing wait time to ${this.waitTime/1000}s due to success streak`);
        this.consecutiveSuccesses = 0;
      }
    } else {
      this.consecutiveFailures++;
      this.consecutiveSuccesses = 0;
      
      // After any failure, increase wait time
      this.waitTime = Math.min(60000, this.waitTime + 10000); // Increase by 10s, max 60s
      console.log(`   📈 Increasing wait time to ${this.waitTime/1000}s due to failure`);
    }
  }
  
  async wait() {
    const seconds = this.waitTime / 1000;
    console.log(`   ⏳ Smart wait: ${seconds} seconds...`);
    
    // Show countdown for last 5 seconds only
    for (let s = seconds; s > 0; s--) {
      if (s <= 5) {
        process.stdout.write(`\r   ⏳ ${s}...`);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log("\r   ✓ Ready!     ");
  }
  
  async generateImage(articleFile: string): Promise<boolean> {
    try {
      const articlePath = path.join("/Users/franzenzenhofer/dev/veganblatt-static/src/data/articles", articleFile);
      const content = await fs.readFile(articlePath, "utf-8");
      const { data, content: markdown } = matter(content) as { data: ArticleData; content: string };
      
      console.log(`📝 ${data.title}`);
      
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      
      const prompt = `Generate a photorealistic, high-quality image for this vegan lifestyle article:
      
Title: ${data.title}
Summary: ${data.excerpt || markdown.slice(0, 300)}

Create an image that:
- Is photorealistic and professional quality
- Shows vegan food, lifestyle, or nature themes
- Uses bright, natural lighting
- Has a clean, modern aesthetic
- Features green accents where appropriate
- NO text or logos
- NO people's faces
- Appetizing if showing food

Style: Professional photography, bright, fresh, modern, minimalist`;
      
      const result = await model.generateContent([{ text: prompt }]);
      const response = result.response;
      
      let imageData: Buffer | null = null;
      for (const candidate of response.candidates || []) {
        for (const part of candidate.content?.parts || []) {
          if (part.inlineData) {
            imageData = Buffer.from(part.inlineData.data, "base64");
          }
        }
      }
      
      if (!imageData) {
        return false;
      }
      
      // Save image
      const slug = data.slug || articleFile.replace(".md", "");
      const filename = `ai-${slug}.jpg`;
      const imagePath = path.join("/Users/franzenzenhofer/dev/veganblatt-static/public/i/ai", filename);
      
      await fs.writeFile(imagePath, imageData);
      console.log(`   💾 ${filename}`);
      
      // Create metadata
      const metadataDir = "/Users/franzenzenhofer/dev/veganblatt-static/src/data/image-metadata/ai";
      const metadataPath = path.join(metadataDir, `${filename}.md`);
      const metadata = `---
filename: "${filename}"
copyright: "© Bild AI generiert zu Illustrationszwecken"
altText: "${data.title}"
---
`;
      
      await fs.writeFile(metadataPath, metadata);
      
      // Update article
      const updatedContent = content.replace(
        /^---\n([\s\S]*?)^---\n/m,
        (match, frontmatter) => {
          if (frontmatter.includes("featuredImage:")) {
            return match.replace(/featuredImage:.*$/m, `featuredImage: "ai/${filename}"`);
          } else {
            return match.replace(/^---\n$/m, `featuredImage: "ai/${filename}"\n---\n`);
          }
        }
      );
      
      await fs.writeFile(articlePath, updatedContent);
      
      return true;
    } catch (error: any) {
      if (error?.message?.includes('429') || error?.message?.includes('quota')) {
        console.log(`   ⚠️ Rate limit hit!`);
      }
      return false;
    }
  }
}

async function getArticlesWithoutImages(limit: number): Promise<string[]> {
  const articlesDir = "/Users/franzenzenhofer/dev/veganblatt-static/src/data/articles";
  const files = await fs.readdir(articlesDir);
  const mdFiles = files.filter(f => f.endsWith(".md")).sort();
  
  const articlesWithoutImages: string[] = [];
  
  for (const file of mdFiles) {
    const content = await fs.readFile(path.join(articlesDir, file), "utf-8");
    const { data } = matter(content) as { data: ArticleData };
    
    if (!data.featuredImage || (!data.featuredImage.startsWith("ai/") && !data.featuredImage.includes(".jpg"))) {
      articlesWithoutImages.push(file);
      if (articlesWithoutImages.length >= limit) break;
    }
  }
  
  return articlesWithoutImages;
}

async function main() {
  console.log("🤖 Smart AI Image Generator for VeganBlatt");
  console.log("=" .repeat(60));
  console.log("📊 Starting with 20s wait, will auto-adjust based on success/failure");
  console.log("=" .repeat(60));
  
  const generator = new SmartImageGenerator();
  const articles = await getArticlesWithoutImages(100);
  
  console.log(`\n📁 Found ${articles.length} articles without images\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < articles.length; i++) {
    console.log(`\n[${i + 1}/${articles.length}]`);
    
    if (i > 0) {
      await generator.wait();
    }
    
    const success = await generator.generateImage(articles[i]);
    
    if (success) {
      successCount++;
      console.log(`   ✅ Total success: ${successCount}`);
    } else {
      failCount++;
      console.log(`   ❌ Total failures: ${failCount}`);
    }
    
    await generator.adjustWaitTime(success);
  }
  
  console.log("\n" + "=" .repeat(60));
  console.log(`🎉 COMPLETE - Success: ${successCount}, Failed: ${failCount}`);
  console.log("=" .repeat(60));
}

main().catch(console.error);