#!/usr/bin/env tsx
import { SiteGenerator } from '../SiteGenerator';
import { SiteConfig } from '../types';
import path from 'path';

const config: SiteConfig = {
  srcDir: path.join(process.cwd(), 'src', 'data'),
  publicDir: path.join(process.cwd(), 'public'),
  testMode: process.env.TEST_MODE === 'true',
  testCount: 10,
  imageMetadataDir: path.join(process.cwd(), 'src', 'data', 'image-metadata')
};

async function main() {
  console.log(' Starting site generation...');
  console.log(`Mode: ${config.testMode ? 'TEST' : 'PRODUCTION'}`);
  
  try {
    const generator = new SiteGenerator(config);
    await generator.generate();
    console.log(' Site generation complete!');
  } catch (error) {
    console.error(' Generation failed:', error);
    process.exit(1);
  }
}

main();