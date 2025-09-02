import path from 'path';
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
import { StaticPageGenerator } from './generators/StaticPageGenerator';

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
      new StaticPageGenerator(this.config, this.fs, this.template).generate()
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
    
    await this.stats.saveReport(`${this.config.publicDir}/generation-stats.txt`);
  }
  
  private async loadAllArticles(): Promise<any[]> {
    const articlesDir = path.join(this.config.srcDir, 'articles');
    const files = await this.fs.readDir(articlesDir);
    const articles = [];
    
    for (const file of files.filter(f => f.endsWith('.md'))) {
      const content = await this.fs.readFile(path.join(articlesDir, file));
      articles.push(this.content.processArticle(file, content));
    }
    
    return articles.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }
  
  private async loadAllRecipes(): Promise<any[]> {
    const recipesDir = path.join(this.config.srcDir, 'recipes');
    const files = await this.fs.readDir(recipesDir);
    const recipes = [];
    
    for (const file of files.filter(f => f.endsWith('.md'))) {
      const content = await this.fs.readFile(path.join(recipesDir, file));
      recipes.push(this.content.processRecipe(file, content));
    }
    
    return recipes.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }
  
  private async loadImageMetadata(): Promise<void> {
    const metadataDir = path.join(this.config.srcDir, 'image-metadata');
    try {
      const files = await this.fs.readDir(metadataDir);
      
      for (const file of files.filter(f => f.endsWith('.md'))) {
        const content = await this.fs.readFile(path.join(metadataDir, file));
        const { data } = this.content.parseMarkdown(content);
        
        if (data.filename && data.copyright) {
          this.image.loadMetadata(data.filename, {
            copyright: data.copyright,
            altText: data.filename.replace(/\.[^.]+$/, '').replace(/-/g, ' ')
          });
        }
      }
    } catch {
      console.log('Warning: No image metadata found');
    }
  }
}