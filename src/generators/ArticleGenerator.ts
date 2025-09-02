import path from 'path';
import { SiteConfig } from '../types';
import { FileSystemManager } from '../core/FileSystemManager';
import { ContentProcessor } from '../core/ContentProcessor';
import { ArticleTemplate } from '../templates/ArticleTemplate';
import { StatisticsCollector } from '../core/StatisticsCollector';

export class ArticleGenerator {
  constructor(
    private config: SiteConfig,
    private fs: FileSystemManager,
    private content: ContentProcessor,
    private template: ArticleTemplate,
    private stats: StatisticsCollector
  ) {}

  async generate(): Promise<void> {
    const articlesDir = path.join(this.config.srcDir, 'articles');
    const files = await this.fs.readDir(articlesDir);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    const toProcess = this.config.testMode 
      ? mdFiles.slice(0, this.config.testCount)
      : mdFiles;

    console.log(`Processing ${toProcess.length} articles...`);
    for (const file of toProcess) {
      await this.processArticle(path.join(articlesDir, file));
    }
  }

  private async processArticle(filePath: string): Promise<void> {
    const content = await this.fs.readFile(filePath);
    const filename = path.basename(filePath);
    const article = this.content.processArticle(filename, content);
    const htmlContent = await this.content.renderMarkdown(article.content);
    const html = await this.template.render(article, htmlContent);
    
    const outputPath = path.join(
      this.config.publicDir, 
      'a', 
      `${article.slug}.html`
    );
    
    await this.fs.writeFile(outputPath, html);
    this.stats.incrementArticles();
  }
}