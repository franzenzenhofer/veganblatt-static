#!/usr/bin/env tsx

import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY || "";
if (!API_KEY) {
  console.error("❌ GEMINI_API_KEY not found in environment");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

interface OGImageConfig {
  name: string;
  filename: string;
  prompt: string;
  width: number;
  height: number;
}

const OG_IMAGES: OGImageConfig[] = [
  {
    name: "Homepage",
    filename: "og-home.jpg",
    prompt: `Create a vibrant, modern Open Graph social media preview image for VeganBlatt, a German vegan lifestyle website. 
    The image should feature:
    - A beautiful, appetizing arrangement of colorful vegan dishes, fresh vegetables, and plant-based foods
    - Modern, clean aesthetic with bright natural lighting
    - Green accents (#76A11E) subtly incorporated
    - Professional food photography style
    - Multiple dishes showing variety: salads, pasta, desserts, smoothies
    - Fresh herbs and vegetables as decoration
    - White/light background with pops of color from the food
    - No text or logos (will be added separately)
    - Aspect ratio optimized for social media sharing
    Style: Professional food photography, bright, fresh, appetizing, modern minimalist`,
    width: 1200,
    height: 630
  },
  {
    name: "Articles List",
    filename: "og-articles.jpg",
    prompt: `Create an Open Graph social media preview image for the articles section of VeganBlatt.
    The image should feature:
    - A lifestyle scene showing someone reading on a tablet/laptop with vegan food nearby
    - Cozy, educational atmosphere
    - Natural light, warm but modern setting
    - Plant-based meal or smoothie visible
    - Some plants or herbs in the background
    - Clean, minimalist Scandinavian style
    - Green accents (#76A11E) in subtle details
    - No text or logos
    Style: Lifestyle photography, educational, warm, inviting, modern`,
    width: 1200,
    height: 630
  },
  {
    name: "Recipes List",
    filename: "og-recipes.jpg",
    prompt: `Create an Open Graph social media preview image for the recipes section of VeganBlatt.
    The image should feature:
    - A kitchen scene with multiple finished vegan dishes
    - Cooking ingredients and utensils artfully arranged
    - Bright, clean kitchen setting
    - Various colorful vegan dishes: pasta, salad, dessert, soup
    - Fresh ingredients visible: vegetables, herbs, grains
    - Natural daylight from a window
    - White/bright surfaces with wood accents
    - Green color (#76A11E) in herbs or details
    - No text or logos
    Style: Recipe photography, bright kitchen, appetizing, professional food styling`,
    width: 1200,
    height: 630
  },
  {
    name: "Search Page",
    filename: "og-search.jpg",
    prompt: `Create an Open Graph social media preview image for the search page of VeganBlatt.
    The image should feature:
    - A flat lay of various vegan ingredients organized in a grid pattern
    - Clean white background
    - Colorful variety: vegetables, fruits, grains, legumes, nuts
    - Everything neatly organized and categorized
    - Minimalist, organized aesthetic
    - Natural shadows for depth
    - Green elements (#76A11E) prominently featured
    - No text or logos
    Style: Flat lay photography, organized, clean, minimalist, colorful variety`,
    width: 1200,
    height: 630
  }
];

async function generateOGImage(config: OGImageConfig): Promise<boolean> {
  try {
    console.log(`\n📸 Generating OG image: ${config.name}`);
    console.log(`   Filename: ${config.filename}`);
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
    });

    const fullPrompt = `Generate a photorealistic image: ${config.prompt}`;

    const result = await model.generateContent([
      {
        text: fullPrompt
      }
    ]);

    const response = result.response;
    const candidates = response.candidates;
    
    if (!candidates || candidates.length === 0) {
      console.error("❌ No image generated");
      return false;
    }

    const firstCandidate = candidates[0];
    if (!firstCandidate.content || !firstCandidate.content.parts) {
      console.error("❌ Invalid response structure");
      return false;
    }

    const imagePart = firstCandidate.content.parts.find(
      (part: any) => part.inlineData?.mimeType?.startsWith("image/")
    );

    if (!imagePart || !imagePart.inlineData) {
      console.error("❌ No image in response");
      return false;
    }

    const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");
    
    // Ensure proper dimensions for OG image
    const outputPath = path.join("public/i/assets", config.filename);
    
    await sharp(imageBuffer)
      .resize(config.width, config.height, {
        fit: "cover",
        position: "center"
      })
      .jpeg({ quality: 90 })
      .toFile(outputPath);
    
    console.log(`✅ Saved: ${outputPath}`);
    
    // Create metadata file
    const metadataPath = path.join("src/data/image-metadata/assets", `${config.filename}.md`);
    const metadata = `---
filename: "${config.filename}"
copyright: "© Bild AI generiert für VeganBlatt"
altText: "${config.name} - VeganBlatt"
---
`;
    
    // Ensure metadata directory exists
    const metadataDir = path.dirname(metadataPath);
    if (!fs.existsSync(metadataDir)) {
      fs.mkdirSync(metadataDir, { recursive: true });
    }
    
    fs.writeFileSync(metadataPath, metadata);
    console.log(`📄 Created metadata: ${config.filename}.md`);
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to generate ${config.name}:`, error);
    return false;
  }
}

async function main() {
  console.log("🎨 Generating Open Graph Images for VeganBlatt");
  console.log("=" .repeat(60));
  
  let successCount = 0;
  let failCount = 0;
  
  for (const config of OG_IMAGES) {
    const success = await generateOGImage(config);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    
    // Wait between requests to avoid rate limiting
    if (OG_IMAGES.indexOf(config) < OG_IMAGES.length - 1) {
      console.log("⏳ Waiting 2 seconds...");
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log("\n" + "=" .repeat(60));
  console.log("🎉 OG IMAGE GENERATION COMPLETE");
  console.log("=" .repeat(60));
  console.log(`\n📊 Results:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  
  console.log(`\n📌 Next Steps:`);
  console.log(`   1. Review generated OG images in /public/i/assets/`);
  console.log(`   2. Update HTML templates to use new OG images`);
  console.log(`   3. Test with social media debuggers`);
}

main().catch(console.error);