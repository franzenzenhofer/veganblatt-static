#!/usr/bin/env tsx

import fetch from 'node-fetch';
import * as fs from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

async function testLandscapeImage() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('No API key');
  
  console.log('🎨 Testing Landscape Image Generation (16:9)\n');
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;
  
  const prompt = `Create a stunning professional food photograph of vegan chocolate brownies with vanilla ice cream.

CRITICAL REQUIREMENTS:
- Aspect ratio: 16:9 landscape format
- Landscape orientation, wide format
- Ultra high quality, professional food photography
- Show rich, dark chocolate brownies with visible walnuts
- Creamy vanilla ice cream on top melting slightly
- Rich chocolate sauce drizzled over
- Beautiful white plate on wooden table

VISUAL STYLE:
- 16:9 widescreen landscape format
- Professional food photography with perfect lighting
- Appetizing "food porn" quality
- Natural daylight from left side
- Shallow depth of field
- Shot from 45-degree angle
- Clean, minimal background

Generate in 16:9 landscape aspect ratio. Wide format image.`;
  
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
      maxOutputTokens: 8192
    }
  };
  
  console.log('📡 Requesting 16:9 landscape image...\n');
  
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
    
    // Extract image
    const parts = data.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        const imageData = Buffer.from(part.inlineData.data, 'base64');
        const filename = '/Users/franzenzenhofer/dev/veganblatt-static/public/i/ai/test-landscape-brownie.jpg';
        
        await fs.writeFile(filename, imageData);
        console.log(`✅ Image saved: ${filename}`);
        console.log(`   Size: ${(imageData.length / 1024).toFixed(0)} KB`);
        
        // Check actual dimensions with identify command
        const { execSync } = await import('child_process');
        try {
          const dimensions = execSync(`identify -format "%wx%h" "${filename}"`).toString();
          console.log(`   Dimensions: ${dimensions}`);
          
          const [width, height] = dimensions.split('x').map(Number);
          const ratio = (width / height).toFixed(2);
          console.log(`   Aspect ratio: ${ratio}:1 (target was 1.78:1 for 16:9)`);
        } catch (e) {
          console.log('   (Could not check dimensions)');
        }
        
        return;
      }
      
      if (part.text) {
        console.log('Text response:', part.text);
      }
    }
    
    throw new Error('No image in response');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

testLandscapeImage().catch(console.error);