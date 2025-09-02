#!/usr/bin/env node --loader tsx

import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ImageMetadata {
  filename: string;
  copyright?: string;
  photographer?: string;
}

class DataCopyrightCleaner {
  private baseDir = path.join(__dirname, '..', '..');
  private srcDir = path.join(this.baseDir, 'src', 'data');
  private imageMetadataCache = new Map<string, ImageMetadata>();
  
  private stats = {
    articlesProcessed: 0,
    recipesProcessed: 0,
    featuredImagesRemoved: 0,
    frontmatterImagesRemoved: 0,
    contentImagesRemoved: 0,
    totalFilesModified: 0
  };

  async run(): Promise<void> {
    console.log('🧹 CLEANING DATA AT SOURCE LEVEL - REMOVING ALL NON-COPYRIGHT IMAGES\n');
    
    // Load image metadata to check copyright
    await this.loadImageMetadata();
    
    // Clean articles
    await this.cleanDirectory('articles');
    
    // Clean recipes  
    await this.cleanDirectory('recipes');
    
    // Git commit the changes
    await this.gitCommit();
    
    // Print summary
    this.printSummary();
  }

  private async loadImageMetadata(): Promise<void> {
    console.log('📷 Loading image metadata for copyright checking...');
    
    const metadataDir = path.join(this.srcDir, 'image-metadata');
    
    try {
      const files = await fs.readdir(metadataDir);
      
      for (const file of files) {
        if (!file.endsWith('.md')) continue;
        
        const content = await fs.readFile(path.join(metadataDir, file), 'utf-8');
        const { data } = matter(content);
        
        const imageName = file.replace('.md', '');
        this.imageMetadataCache.set(imageName, {
          filename: data.filename || imageName,
          copyright: data.copyright,
          photographer: data.photographer
        });
      }
      
      console.log(`   Loaded ${this.imageMetadataCache.size} metadata files\n`);
    } catch {
      console.log('   No metadata directory found\n');
    }
  }

  private async cleanDirectory(type: 'articles' | 'recipes'): Promise<void> {
    console.log(` Cleaning ${type}...`);
    
    const dir = path.join(this.srcDir, type);
    const files = await fs.readdir(dir);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    for (const file of mdFiles) {
      const filePath = path.join(dir, file);
      const originalContent = await fs.readFile(filePath, 'utf-8');
      const { data: frontmatter, content } = matter(originalContent);
      
      let modified = false;
      const fileModifications: string[] = [];
      
      // 1. Clean featured image
      if (frontmatter.featuredImage) {
        if (!this.hasValidCopyright(frontmatter.featuredImage)) {
          console.log(`    🚫 REMOVING featuredImage: ${frontmatter.featuredImage} from ${file}`);
          delete frontmatter.featuredImage;
          this.stats.featuredImagesRemoved++;
          modified = true;
          fileModifications.push(`Removed featuredImage: ${frontmatter.featuredImage}`);
        }
      }
      
      // 2. Clean images array in frontmatter
      if (frontmatter.images && Array.isArray(frontmatter.images)) {
        const originalCount = frontmatter.images.length;
        frontmatter.images = frontmatter.images.filter((img: string) => {
          const hasValidCopyright = this.hasValidCopyright(img);
          if (!hasValidCopyright) {
            console.log(`    🚫 REMOVING from images array: ${img} from ${file}`);
            this.stats.frontmatterImagesRemoved++;
            fileModifications.push(`Removed from images array: ${img}`);
          }
          return hasValidCopyright;
        });
        
        if (frontmatter.images.length !== originalCount) {
          modified = true;
          console.log(`     Reduced images array: ${originalCount} → ${frontmatter.images.length} in ${file}`);
        }
        
        // Remove empty images array
        if (frontmatter.images.length === 0) {
          delete frontmatter.images;
        }
      }
      
      // 3. Clean markdown content images
      let cleanedContent = content;
      const imageReferences = [
        /!\[([^\]]*)\]\(([^)]+)\)/g,  // ![alt](image.jpg)
        /\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)/g,  // [![alt](image.jpg)](link)
        /<img[^>]+src="([^"]+)"[^>]*>/g  // <img src="image.jpg">
      ];
      
      for (const regex of imageReferences) {
        let match;
        while ((match = regex.exec(content)) !== null) {
          const fullMatch = match[0];
          let imageSrc = '';
          
          // Extract image source from different patterns
          if (regex.source.includes('img')) {
            imageSrc = match[1] || ''; // HTML img tag
          } else if (match[2]) {
            imageSrc = match[2] || ''; // Markdown format
          }
          
          const imageName = path.basename(imageSrc);
          
          if (!this.hasValidCopyright(imageName)) {
            console.log(`    🚫 REMOVING content image: ${imageName} from ${file}`);
            cleanedContent = cleanedContent.replace(fullMatch, `<!-- Image removed (no copyright): ${imageName} -->`);
            this.stats.contentImagesRemoved++;
            modified = true;
            fileModifications.push(`Removed content image: ${imageName}`);
          }
        }
      }
      
      // Save cleaned file if modified
      if (modified) {
        const newFileContent = matter.stringify(cleanedContent, frontmatter);
        await fs.writeFile(filePath, newFileContent);
        this.stats.totalFilesModified++;
        console.log(`     CLEANED: ${file} (${fileModifications.length} changes)`);
      }
      
      if (type === 'articles') {
        this.stats.articlesProcessed++;
      } else {
        this.stats.recipesProcessed++;
      }
    }
    
    console.log(`   Processed ${mdFiles.length} ${type}\n`);
  }

  private hasValidCopyright(imageName: string): boolean {
    const metadata = this.imageMetadataCache.get(imageName);
    return !!(metadata?.copyright && 
              metadata.copyright.trim() !== '' && 
              metadata.copyright !== 'null' && 
              metadata.copyright !== 'undefined');
  }

  private async gitCommit(): Promise<void> {
    console.log(' Committing cleaned data to Git...');
    
    try {
      execSync('git add -A', { cwd: this.baseDir });
      
      const message = `🧹 DATA CLEANING: Remove all images without copyright

CRITICAL COPYRIGHT COMPLIANCE:
- Removed ${this.stats.featuredImagesRemoved} featuredImages without copyright
- Removed ${this.stats.frontmatterImagesRemoved} images from frontmatter arrays
- Removed ${this.stats.contentImagesRemoved} images from markdown content
- Modified ${this.stats.totalFilesModified} files total

DATA IS NOW COPYRIGHT COMPLIANT AT SOURCE LEVEL!
All markdown files cleaned to only reference images with valid copyright.`;

      execSync(`git commit -m "${message}"`, { cwd: this.baseDir });
      console.log('   Changes committed to Git\n');
    } catch (error: any) {
      if (error.message.includes('nothing to commit')) {
        console.log('  ℹ No changes to commit\n');
      } else {
        console.log('   Git commit failed:', error.message);
      }
    }
  }

  private printSummary(): void {
    console.log('='.repeat(70));
    console.log('🧹 DATA CLEANING COMPLETE - COPYRIGHT COMPLIANCE ACHIEVED');
    console.log('='.repeat(70));
    console.log(`
📊 Cleaning Statistics:
  • Articles processed: ${this.stats.articlesProcessed}
  • Recipes processed: ${this.stats.recipesProcessed}
  • Files modified: ${this.stats.totalFilesModified}
  
🚫 Images Removed:
  • Featured images: ${this.stats.featuredImagesRemoved}
  • Frontmatter images: ${this.stats.frontmatterImagesRemoved}  
  • Content images: ${this.stats.contentImagesRemoved}
  • TOTAL REMOVED: ${this.stats.featuredImagesRemoved + this.stats.frontmatterImagesRemoved + this.stats.contentImagesRemoved}

 RESULT: 
  ALL MARKDOWN FILES NOW COPYRIGHT COMPLIANT!
  Only images with valid copyright remain in the data.
`);
    console.log('='.repeat(70));
  }
}

// Run the cleaner
const cleaner = new DataCopyrightCleaner();
cleaner.run().catch(error => {
  console.error(' Cleaning failed:', error);
  process.exit(1);
});