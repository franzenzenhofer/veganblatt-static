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

async function getArticlesWithoutImages(limit: number = 20): Promise<string[]> {
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

async function generateImageForArticle(articleFile: string): Promise<boolean> {
  try {
    const articlePath = path.join("/Users/franzenzenhofer/dev/veganblatt-static/src/data/articles", articleFile);
    const content = await fs.readFile(articlePath, "utf-8");
    const { data, content: markdown } = matter(content) as { data: ArticleData; content: string };
    
    console.log(`\n📝 Processing: ${data.title}`);
    
    // Use the working model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    // Create informative prompt
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
    
    // Extract image
    let imageData: Buffer | null = null;
    for (const candidate of response.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData) {
          imageData = Buffer.from(part.inlineData.data, "base64");
        }
      }
    }
    
    if (!imageData) {
      console.log("   ❌ No image generated");
      return false;
    }
    
    // Save image
    const slug = data.slug || articleFile.replace(".md", "");
    const filename = `ai-${slug}.jpg`;
    const imagePath = path.join("/Users/franzenzenhofer/dev/veganblatt-static/public/i/ai", filename);
    
    await fs.writeFile(imagePath, imageData);
    console.log(`   💾 Saved: ${filename}`);
    
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
    console.log(`   📄 Created metadata`);
    
    // Update article with featuredImage
    const updatedContent = content.replace(
      /^---\n([\s\S]*?)^---\n/m,
      (match, frontmatter) => {
        if (frontmatter.includes("featuredImage:")) {
          return match.replace(/featuredImage:.*$/m, `featuredImage: "ai/${filename}"`);
        } else {
          // Add featuredImage before the last ---
          return match.replace(/^---\n$/m, `featuredImage: "ai/${filename}"\n---\n`);
        }
      }
    );
    
    await fs.writeFile(articlePath, updatedContent);
    console.log(`   ✅ Updated article`);
    
    return true;
  } catch (error) {
    console.error(`   ❌ Error: ${error}`);
    return false;
  }
}

async function main() {
  console.log("🚀 Generating AI Images for VeganBlatt Articles");
  console.log("=" .repeat(60));
  
  const articles = await getArticlesWithoutImages(10); // Reduced batch size
  console.log(`\nFound ${articles.length} articles without images\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const article of articles) {
    const success = await generateImageForArticle(article);
    if (success) {
      successCount++;
    } else {
      failCount++;
      // On failure, wait longer before next attempt
      console.log("   ⏳ Waiting 10 seconds after failure...");
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    // Longer delay to respect rate limits (6 seconds between requests)
    if (successCount > 0 && successCount % 5 === 0) {
      console.log("\n⏳ Rate limit pause - waiting 30 seconds...\n");
      await new Promise(resolve => setTimeout(resolve, 30000));
    } else {
      await new Promise(resolve => setTimeout(resolve, 6000));
    }
  }
  
  console.log("\n" + "=" .repeat(60));
  console.log("🎉 COMPLETE");
  console.log("=" .repeat(60));
  console.log(`\n📊 Results:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
}

main().catch(console.error);