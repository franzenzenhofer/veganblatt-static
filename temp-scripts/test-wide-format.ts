#!/usr/bin/env tsx

import fetch from 'node-fetch';
import * as fs from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

async function testWideFormat() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('No API key');
  
  console.log('🎨 Testing Wide Format Image Generation\n');
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;
  
  // Try multiple prompt variations
  const prompts = [
    // Prompt 1: Explicit dimensions
    `Generate a 2048x1280 pixel image. Wide landscape format. 16:10 aspect ratio.
    
Professional food photograph of a colorful vegan Buddha bowl.
Show quinoa, roasted vegetables, avocado, tahini drizzle.
The image must be 2048 pixels wide and 1280 pixels tall.
Wide landscape orientation. Horizontal format.`,

    // Prompt 2: Aspect ratio emphasis
    `ASPECT RATIO: 16:9 LANDSCAPE
Generate in 16:9 widescreen format.
    
Create a stunning professional food photograph of vegan sushi rolls.
Colorful vegetables, avocado, rice, nori, soy sauce.
Professional food photography.

IMAGE FORMAT: 16:9 landscape aspect ratio, wide horizontal image.`,

    // Prompt 3: Cinema format
    `Create a cinematic widescreen food photograph.
Aspect ratio: 2.35:1 ultra-wide cinematic format.

Vegan pasta with tomato sauce and fresh basil.
Professional food photography with dramatic lighting.

Generate in ultra-wide cinematic 2.35:1 aspect ratio.`
  ];
  
  for (let i = 0; i < prompts.length; i++) {
    console.log(`\nTest ${i + 1}/3: ${prompts[i].substring(0, 50)}...`);
    
    if (i > 0) {
      console.log('Waiting 5 seconds...');
      await new Promise(r => setTimeout(r, 5000));
    }
    
    const requestBody = {
      contents: [{
        parts: [{
          text: prompts[i]
        }]
      }],
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192
      }
    };
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ API Error: ${error.substring(0, 100)}`);
        continue;
      }
      
      const data = await response.json() as any;
      
      // Extract image
      const parts = data.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          const imageData = Buffer.from(part.inlineData.data, 'base64');
          const filename = `/Users/franzenzenhofer/dev/veganblatt-static/public/i/ai/test-wide-${i + 1}.jpg`;
          
          await fs.writeFile(filename, imageData);
          
          // Check dimensions
          const { execSync } = await import('child_process');
          try {
            const dimensions = execSync(`identify -format "%wx%h" "${filename}"`).toString();
            const [width, height] = dimensions.split('x').map(Number);
            const ratio = (width / height).toFixed(2);
            console.log(`✅ Generated: ${dimensions} (ratio ${ratio}:1)`);
          } catch (e) {
            console.log('✅ Image saved');
          }
        }
      }
      
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
}

testWideFormat().catch(console.error);