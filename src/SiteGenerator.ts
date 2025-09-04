import path from 'path';
import matter from 'gray-matter';
import { SiteConfig } from './types';
import { FileSystemManager } from './core/FileSystemManager';
import { ContentProcessor } from './core/ContentProcessor';
import { ImageProcessor } from './core/ImageProcessor';
import { StatisticsCollector } from './core/StatisticsCollector';
import { TemplateEngine } from './templates/TemplateEngine';
import { ArticleTemplate } from './templates/ArticleTemplate';
import { RecipeTemplate } from './templates/RecipeTemplate';
import { ListTemplate } from './templates/ListTemplate';
import { ArticleGenerator } from './generators/ArticleGenerator';
import { RecipeGenerator } from './generators/RecipeGenerator';
import { ListPageGenerator } from './generators/ListPageGenerator';
import { HomePageGenerator } from './generators/HomePageGenerator';
import { createStaticPageGenerators } from './generators/static';
import { SitemapGenerator } from './generators/SitemapGenerator';

export class SiteGenerator {
  private fs: FileSystemManager;
  private content: ContentProcessor;
  private image: ImageProcessor;
  private stats: StatisticsCollector;
  private template: TemplateEngine;

  constructor(private config: SiteConfig) {
    this.fs = new FileSystemManager();
    this.image = new ImageProcessor();
    this.content = new ContentProcessor(this.image);
    this.stats = new StatisticsCollector();
    this.template = new TemplateEngine();
  }

  async generate(): Promise<void> {
    await this.fs.ensureDir(this.config.publicDir);
    await this.fs.ensureDir(`${this.config.publicDir}/a`);
    await this.fs.ensureDir(`${this.config.publicDir}/r`);
    await this.fs.ensureDir(`${this.config.publicDir}/about`);
    
    // Load image metadata
    await this.loadImageMetadata();
    
    // Validate that all featured images have metadata (FAIL HARD)
    await this.validateFeaturedImageMetadata();

    const articleTemplate = new ArticleTemplate(this.image);
    const recipeTemplate = new RecipeTemplate(this.image);
    const listTemplate = new ListTemplate();
    
    const articleGen = new ArticleGenerator(
      this.config, this.fs, this.content,
      articleTemplate, this.stats
    );
    
    const recipeGen = new RecipeGenerator(
      this.config, this.fs, this.content,
      recipeTemplate, this.stats
    );
    
    const listGen = new ListPageGenerator(
      this.config, this.fs, this.content,
      listTemplate
    );
    
    const homeGen = new HomePageGenerator(
      this.config, this.fs, this.template
    );

    // Generate all content
    await Promise.all([
      articleGen.generate(),
      recipeGen.generate(),
      // Static pages (modular registry)
      ...createStaticPageGenerators(this.config, this.fs, this.template).map(g => g.generate())
    ]);
    
    // Load all articles and recipes for list/home pages
    const articles = await this.loadAllArticles();
    const recipes = await this.loadAllRecipes();
    
    // Generate list and home pages
    await Promise.all([
      listGen.generateArticlesList(),
      listGen.generateRecipesList(),
      homeGen.generate(articles, recipes)
    ]);
    
    // Write skipped images report if any images were skipped
    this.content.writeSkippedImagesReport();
    
    // Generate sitemaps and robots.txt
    const sitemapGen = new SitemapGenerator();
    await sitemapGen.generate(this.config.srcDir, this.config.publicDir);
    
    await this.stats.saveReport(`${this.config.publicDir}/generation-stats.txt`);
  }
  
  private async loadAllArticles(): Promise<import('./types').Article[]> {
    const articlesDir = path.join(this.config.srcDir, 'articles');
    const files = await this.fs.readDir(articlesDir);
    const articles: import('./types').Article[] = [];
    
    for (const file of files.filter(f => f.endsWith('.md'))) {
      const content = await this.fs.readFile(path.join(articlesDir, file));
      articles.push(this.content.processArticle(file, content));
    }
    
    return articles.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }
  
  private async loadAllRecipes(): Promise<import('./types').Recipe[]> {
    const recipesDir = path.join(this.config.srcDir, 'recipes');
    const files = await this.fs.readDir(recipesDir);
    const recipes: import('./types').Recipe[] = [];
    
    for (const file of files.filter(f => f.endsWith('.md'))) {
      const content = await this.fs.readFile(path.join(recipesDir, file));
      recipes.push(this.content.processRecipe(file, content));
    }
    
    return recipes.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }
  
  private async loadImageMetadata(): Promise<void> {
    const metadataDir = path.join(this.config.srcDir, 'image-metadata');
    
    // Load regular image metadata
    try {
      const files = await this.fs.readDir(metadataDir);
      
      for (const file of files.filter(f => f.endsWith('.md'))) {
        const content = await this.fs.readFile(path.join(metadataDir, file));
        const { data } = this.content.parseMarkdown<{ filename?: string; copyright?: string; altText?: string }>(content);
        
        if (data.filename && data.copyright) {
          this.image.loadMetadata(data.filename, {
            copyright: data.copyright,
            altText: data.altText || data.filename.replace(/\.[^.]+$/, '').replace(/-/g, ' ')
          });
        }
      }
    } catch {
      console.log('Warning: No image metadata found');
    }
    
    // Load AI image metadata from ai/ subdirectory
    const aiMetadataDir = path.join(metadataDir, 'ai');
    try {
      const aiFiles = await this.fs.readDir(aiMetadataDir);
      let loadedCount = 0;
      
      for (const file of aiFiles.filter(f => f.endsWith('.md') || f.endsWith('.yaml') || f.endsWith('.yml'))) {
        try {
          const content = await this.fs.readFile(path.join(aiMetadataDir, file));
          
          let data: { filename?: string; copyright?: string; altText?: string };
          if (file.endsWith('.md')) {
            // Parse as markdown frontmatter
            const parsed = this.content.parseMarkdown<{ filename?: string; copyright?: string; altText?: string }>(content);
            data = parsed.data;
          } else {
            // Parse pure YAML file by treating it as frontmatter only
            console.log(`Parsing YAML file: ${file}`);
            const parsed = matter('---\n' + content + '\n---\n');
            data = parsed.data;
          }
        
          if (data.filename && data.copyright) {
            // Store AI images with their filename (without ai/ prefix)
            this.image.loadMetadata(data.filename, {
              copyright: data.copyright,
              altText: data.altText || data.filename.replace(/\.[^.]+$/, '').replace(/-/g, ' ')
            });
            loadedCount++;
          } else {
            // FAIL HARD - if metadata file exists but is invalid, throw error
            throw new Error(`INVALID AI METADATA FILE: ${file} - Missing filename or copyright!`);
          }
        } catch (fileError) {
          throw new Error(`ERROR PARSING AI METADATA FILE ${file}: ${fileError}`);
        }
      }
      console.log(`Loaded ${loadedCount} AI image metadata files`);
    } catch (error) {
      // FAIL HARD - AI metadata loading errors should stop the build
      throw new Error(`FAILED TO LOAD AI METADATA: ${error}`);
    }
  }
  
  private async validateFeaturedImageMetadata(): Promise<void> {
    const missingMetadata: string[] = [];
    
    // Check all articles
    const articlesDir = path.join(this.config.srcDir, 'articles');
    try {
      const articleFiles = await this.fs.readDir(articlesDir);
      for (const file of articleFiles.filter(f => f.endsWith('.md'))) {
        const content = await this.fs.readFile(path.join(articlesDir, file));
        const { data } = this.content.parseMarkdown<{ featuredImage?: string }>(content);
        
        if (data.featuredImage) {
          const metadata = this.image.getMetadata(data.featuredImage);
          if (!this.image.validateCopyright(metadata)) {
            missingMetadata.push(`Article ${file}: ${data.featuredImage}`);
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not validate articles metadata: ${error}`);
    }
    
    // Check all recipes  
    const recipesDir = path.join(this.config.srcDir, 'recipes');
    try {
      const recipeFiles = await this.fs.readDir(recipesDir);
      for (const file of recipeFiles.filter(f => f.endsWith('.md'))) {
        const content = await this.fs.readFile(path.join(recipesDir, file));
        const { data } = this.content.parseMarkdown<{ featuredImage?: string }>(content);
        
        if (data.featuredImage) {
          const metadata = this.image.getMetadata(data.featuredImage);
          if (!this.image.validateCopyright(metadata)) {
            missingMetadata.push(`Recipe ${file}: ${data.featuredImage}`);
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not validate recipes metadata: ${error}`);
    }
    
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
}
