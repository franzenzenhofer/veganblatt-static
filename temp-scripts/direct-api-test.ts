#!/usr/bin/env tsx

import fetch from 'node-fetch';
import * as fs from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

async function testDirectAPI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('No API key');
  }
  
  console.log('🔧 Direct API Test for Gemini Image Generation\n');
  console.log('API Key:', apiKey.substring(0, 15) + '...\n');
  
  // Use the correct image generation model
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;
  
  const prompt = `Create a beautiful photograph of a fresh green salad with colorful vegetables. 
Professional food photography, bright natural lighting, appetizing presentation.
High resolution image, 2000x1250 pixels.
Show: mixed greens, cherry tomatoes, cucumber slices, carrot ribbons, and a light vinaigrette.
Style: Clean, healthy, vibrant, professional food magazine quality.`;
  
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
  
  console.log('📡 Calling API endpoint:', url.replace(apiKey, 'API_KEY'));
  console.log('📝 Request body:', JSON.stringify(requestBody, null, 2));
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    const responseText = await response.text();
    console.log('\n📥 Response Status:', response.status);
    console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      console.error('❌ API Error:', responseText);
      
      // Parse error for more details
      try {
        const errorData = JSON.parse(responseText);
        console.log('\n🔍 Error Details:');
        console.log(JSON.stringify(errorData, null, 2));
        
        if (errorData.error?.details) {
          errorData.error.details.forEach((detail: any) => {
            if (detail.violations) {
              console.log('\n⚠️  Quota Violations:');
              detail.violations.forEach((v: any) => {
                console.log(`  - ${v.quotaMetric}`);
                console.log(`    Quota ID: ${v.quotaId}`);
                if (v.quotaDimensions) {
                  console.log(`    Dimensions:`, v.quotaDimensions);
                }
              });
            }
          });
        }
      } catch (e) {
        // Could not parse as JSON
      }
      return;
    }
    
    const data = JSON.parse(responseText);
    console.log('\n✅ Success! Response structure:');
    console.log(JSON.stringify(data, null, 2).substring(0, 500) + '...');
    
    // Check for image data
    if (data.candidates?.[0]?.content?.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData) {
          console.log('\n🎨 Image data found!');
          console.log('  MIME type:', part.inlineData.mimeType);
          console.log('  Data length:', part.inlineData.data.length);
          
          // Save the image
          const imageData = Buffer.from(part.inlineData.data, 'base64');
          const filename = '/Users/franzenzenhofer/dev/veganblatt-static/public/i/ai/test-salad.jpg';
          await fs.writeFile(filename, imageData);
          console.log(`\n💾 Image saved to: ${filename}`);
          console.log(`   Size: ${(imageData.length / 1024).toFixed(2)} KB`);
        }
        if (part.text) {
          console.log('\n📝 Text response:', part.text);
        }
      }
    }
    
  } catch (error: any) {
    console.error('❌ Network/System Error:', error.message);
  }
}

testDirectAPI().catch(console.error);