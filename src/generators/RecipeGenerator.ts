import path from 'path';
import { SiteConfig } from '../types';
import { FileSystemManager } from '../core/FileSystemManager';
import { ContentProcessor } from '../core/ContentProcessor';
import { RecipeTemplate } from '../templates/RecipeTemplate';
import { StatisticsCollector } from '../core/StatisticsCollector';

export class RecipeGenerator {
  constructor(
    private config: SiteConfig,
    private fs: FileSystemManager,
    private content: ContentProcessor,
    private template: RecipeTemplate,
    private stats: StatisticsCollector
  ) {}

  async generate(): Promise<void> {
    const recipesDir = path.join(this.config.srcDir, 'recipes');
    const files = await this.fs.readDir(recipesDir);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    const toProcess = this.config.testMode 
      ? mdFiles.slice(0, this.config.testCount)
      : mdFiles;

    for (const file of toProcess) {
      await this.processRecipe(path.join(recipesDir, file));
    }
  }

  private async processRecipe(filePath: string): Promise<void> {
    const content = await this.fs.readFile(filePath);
    const filename = path.basename(filePath);
    const recipe = this.content.processRecipe(filename, content);
    const htmlContent = await this.content.renderMarkdown(recipe.content);
    const html = await this.template.render(recipe, htmlContent);
    
    const outputPath = path.join(
      this.config.publicDir,
      'r',
      `${recipe.slug}.html`
    );
    
    await this.fs.writeFile(outputPath, html);
    this.stats.incrementRecipes();
  }
}