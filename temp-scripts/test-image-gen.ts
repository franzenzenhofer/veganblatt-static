#!/usr/bin/env tsx

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

async function generateSingleImage() {
  console.log('🎨 Testing Gemini Image Generation...\n');
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not found');
  }
  
  console.log('API Key found:', apiKey.substring(0, 10) + '...');
  
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Try using the correct model name
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash-exp" // This model supports image generation
  });
  
  const prompt = `Generate a photorealistic image of a delicious vegan chocolate brownie with vanilla ice cream.

REQUIREMENTS:
- Ultra high resolution: 2000x1250 pixels
- Professional food photography
- Show a square piece of dark chocolate brownie with visible walnuts
- A scoop of creamy white vanilla ice cream on top
- Rich chocolate sauce drizzled over everything
- Served on a white plate
- Shallow depth of field with blurred background
- Warm, appetizing lighting
- The image should look like it came from a high-end vegan restaurant
- Make it look absolutely irresistible - true food porn quality`;

  try {
    console.log('Generating image...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Response:', text);
    
    // Check if there's image data in the response
    const candidates = response.candidates || [];
    for (const candidate of candidates) {
      const parts = candidate.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          console.log('✅ Image data found!');
          const imageData = Buffer.from(part.inlineData.data, 'base64');
          await fs.writeFile('/Users/franzenzenhofer/dev/veganblatt-static/public/i/ai/test-brownie.jpg', imageData);
          console.log('Image saved to /public/i/ai/test-brownie.jpg');
          return;
        }
      }
    }
    
    console.log('No image data in response. The model might not support image generation.');
    console.log('Full response structure:', JSON.stringify(response, null, 2));
    
  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.message.includes('429')) {
      console.log('\n⚠️  Rate limit hit. Your API key may still be on free tier.');
      console.log('To upgrade: Visit https://aistudio.google.com/app/apikey');
      console.log('Enable billing for your Google Cloud project.');
    }
  }
}

generateSingleImage().catch(console.error);