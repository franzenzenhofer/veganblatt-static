#!/usr/bin/env tsx

import { VeganFoodImageGenerator } from './generate-ai-images-v2';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

async function deployToCloudflare(): Promise<void> {
  console.log('\n🚀 Deploying to Cloudflare...');
  
  try {
    // Build the site
    console.log('   📦 Building site...');
    await execAsync('npm run build');
    console.log('   ✅ Build complete');
    
    // Deploy
    console.log('   ☁️  Deploying to Cloudflare...');
    await execAsync('npm run deploy');
    console.log('   ✅ Deployed successfully!');
    
  } catch (error) {
    console.error('   ❌ Deployment failed:', error);
    throw error;
  }
}

async function countRecipesWithoutImages(): Promise<number> {
  const recipesDir = '/Users/franzenzenhofer/dev/veganblatt-static/src/data/recipes';
  const { stdout } = await execAsync(`grep -L "featuredImage:" ${recipesDir}/*.md | wc -l`);
  return parseInt(stdout.trim());
}

async function main() {
  console.log('🎯 BATCH GENERATION WITH AUTO-DEPLOYMENT\n');
  console.log('📋 Important Notes:');
  console.log('   • Main dish CENTERED for cropping');
  console.log('   • NO FOG OR STEAM');
  console.log('   • Everything 100% VEGAN');
  console.log('   • No text in images\n');
  
  const generator = new VeganFoodImageGenerator();
  
  // Count remaining recipes
  const remainingRecipes = await countRecipesWithoutImages();
  console.log(`📊 Recipes without images: ${remainingRecipes}\n`);
  
  if (remainingRecipes === 0) {
    console.log('✅ All recipes already have images!');
    return;
  }
  
  // Calculate number of batches needed
  const batchSize = 10;
  const totalBatches = Math.ceil(Math.min(remainingRecipes, 100) / batchSize); // Max 100 images total
  
  console.log(`📦 Will generate ${Math.min(remainingRecipes, 100)} images in ${totalBatches} batches\n`);
  
  // Create a log for this session
  const sessionLog = `/Users/franzenzenhofer/dev/veganblatt-static/logs/batch-session-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
  await fs.appendFile(sessionLog, `Batch Generation Session Started: ${new Date().toISOString()}\n`);
  await fs.appendFile(sessionLog, `Total recipes without images: ${remainingRecipes}\n\n`);
  
  for (let batch = 1; batch <= totalBatches; batch++) {
    console.log('='.repeat(60));
    console.log(`📦 BATCH ${batch}/${totalBatches}`);
    console.log('='.repeat(60));
    
    await fs.appendFile(sessionLog, `\nBatch ${batch}/${totalBatches} started: ${new Date().toISOString()}\n`);
    
    try {
      // Generate 10 images
      await generator.generateImagesForRecipes(batchSize, true);
      
      await fs.appendFile(sessionLog, `Batch ${batch} completed successfully\n`);
      
      // Commit changes
      console.log('\n📝 Committing changes...');
      await execAsync('git add -A');
      await execAsync(`git commit -m "✨ Add batch ${batch} of AI-generated vegan images (10 images)"`);
      console.log('   ✅ Changes committed');
      
      // Deploy to Cloudflare
      await deployToCloudflare();
      
      await fs.appendFile(sessionLog, `Batch ${batch} deployed successfully\n`);
      
      // Count remaining
      const newRemaining = await countRecipesWithoutImages();
      console.log(`\n📊 Remaining recipes without images: ${newRemaining}`);
      
      if (batch < totalBatches) {
        console.log('\n⏳ Waiting 10 seconds before next batch...\n');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
      
    } catch (error) {
      console.error(`\n❌ Batch ${batch} failed:`, error);
      await fs.appendFile(sessionLog, `Batch ${batch} FAILED: ${error}\n`);
      
      // Ask user if they want to continue
      console.log('\n⚠️  Batch failed. Check the error and fix if needed.');
      console.log('   The script will continue to the next batch in 30 seconds...');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 BATCH GENERATION COMPLETE!');
  console.log('='.repeat(60));
  
  const finalRemaining = await countRecipesWithoutImages();
  console.log(`\n📊 Final Statistics:`);
  console.log(`   • Started with: ${remainingRecipes} recipes without images`);
  console.log(`   • Generated: ${remainingRecipes - finalRemaining} images`);
  console.log(`   • Remaining: ${finalRemaining} recipes without images`);
  
  await fs.appendFile(sessionLog, `\nSession completed: ${new Date().toISOString()}\n`);
  await fs.appendFile(sessionLog, `Final remaining: ${finalRemaining}\n`);
  
  console.log(`\n📋 Session log: ${sessionLog}`);
}

// Run the batch generation
main().catch(console.error);