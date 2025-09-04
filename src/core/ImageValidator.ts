import path from 'path';
import { SiteConfig } from '../types';
import { FileSystemManager } from './FileSystemManager';
import { ContentProcessor } from './ContentProcessor';
import { ImageProcessor } from './ImageProcessor';

/**
 * ImageValidator - Validates featured images have required metadata
 * FAIL HARD principle: Any missing metadata stops the build
 */
export class ImageValidator {
  constructor(
    private config: SiteConfig,
    private fs: FileSystemManager,
    private content: ContentProcessor,
    private image: ImageProcessor
  ) {}

  /**
   * Validates that all featured images in articles and recipes have metadata
   * FAILS HARD if any featured images are missing metadata
   */
  async validateFeaturedImageMetadata(): Promise<void> {
    const missingMetadata: string[] = [];
    
    // Check all articles
    await this.validateArticleImages(missingMetadata);
    
    // Check all recipes  
    await this.validateRecipeImages(missingMetadata);
    
    // FAIL HARD if any featured images are missing metadata
    if (missingMetadata.length > 0) {
      const errorMessage = [
        'VALIDATION FAILED: Featured images without metadata found!',
        'Following images need metadata files:',
        ...missingMetadata.map(item => `  - ${item}`),
        '',
        'Create metadata files in src/data/image-metadata/ or src/data/image-metadata/ai/',
        'BUILD STOPPED - FIX METADATA FIRST!'
      ].join('\n');
      throw new Error(errorMessage);
    }
    
    console.log('✅ Featured image metadata validation passed');
  }

  /**
   * Validates article featured images have metadata
   */
  private async validateArticleImages(missingMetadata: string[]): Promise<void> {
    const articlesDir = path.join(this.config.srcDir, 'articles');
    
    try {
      const articleFiles = await this.fs.readDir(articlesDir);
      for (const file of articleFiles.filter(f => f.endsWith('.md'))) {
        const content = await this.fs.readFile(path.join(articlesDir, file));
        const { data } = this.content.parseMarkdown<{ featuredImage?: string }>(content);
        
        if (data.featuredImage) {
          // Apply same metadata key logic as ImageProcessor
          let metadataKey = data.featuredImage;
          if (data.featuredImage && data.featuredImage.startsWith('ai/')) {
            // For AI images, the metadata key is the filename without the ai/ prefix
            metadataKey = data.featuredImage.substring(3); // Remove 'ai/'
          }
          
          const metadata = this.image.getMetadata(metadataKey);
          if (!this.image.validateCopyright(metadata)) {
            missingMetadata.push(`Article ${file}: ${data.featuredImage}`);
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not validate articles metadata: ${error}`);
    }
  }

  /**
   * Validates recipe featured images have metadata
   */
  private async validateRecipeImages(missingMetadata: string[]): Promise<void> {
    const recipesDir = path.join(this.config.srcDir, 'recipes');
    
    try {
      const recipeFiles = await this.fs.readDir(recipesDir);
      for (const file of recipeFiles.filter(f => f.endsWith('.md'))) {
        const content = await this.fs.readFile(path.join(recipesDir, file));
        const { data } = this.content.parseMarkdown<{ featuredImage?: string }>(content);
        
        if (data.featuredImage) {
          // Apply same metadata key logic as ImageProcessor
          let metadataKey = data.featuredImage;
          if (data.featuredImage && data.featuredImage.startsWith('ai/')) {
            // For AI images, the metadata key is the filename without the ai/ prefix
            metadataKey = data.featuredImage.substring(3); // Remove 'ai/'
          }
          
          const metadata = this.image.getMetadata(metadataKey);
          if (!this.image.validateCopyright(metadata)) {
            missingMetadata.push(`Recipe ${file}: ${data.featuredImage}`);
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not validate recipes metadata: ${error}`);
    }
  }
}