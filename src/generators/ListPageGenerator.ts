import path from 'path';
import { Article, Recipe, SiteConfig } from '../types';
import { FileSystemManager } from '../core/FileSystemManager';
import { ContentProcessor } from '../core/ContentProcessor';
import { ListTemplate } from '../templates/ListTemplate';
import { TemplateEngine } from '../templates/TemplateEngine';

export class ListPageGenerator {
  private templateEngine: TemplateEngine;
  
  constructor(
    private config: SiteConfig,
    private fs: FileSystemManager,
    private content: ContentProcessor,
    private template: ListTemplate
  ) {
    this.templateEngine = new TemplateEngine();
  }

  async generateArticlesList(): Promise<void> {
    const articles = await this.loadArticles();
    const articlesWithImages = articles.filter(a => a.featuredImage);
    
    // Generate artikel.html (20 random with images, recent first)
    const randomArticles = this.getRandomWithRecent(articlesWithImages, 20);
    const randomListHtml = this.template.renderList(randomArticles, 'a');
    
    const artikelHtml = this.wrapInLayout(
      'Artikel',
      `<h1>Artikel</h1>
      <ul class="article-list">${randomListHtml}</ul>
      <p style="text-align: center; margin-top: 40px;">
        <a href="/alle-artikel.html">→ Alle ${articles.length} Artikel anzeigen</a>
      </p>`,
      'artikel.html'
    );
    
    await this.fs.writeFile(
      path.join(this.config.publicDir, 'artikel.html'),
      artikelHtml
    );
    
    // Generate alle-artikel.html (ALL articles chronologically)
    const allListHtml = this.template.renderList(articles, 'a');
    
    const alleArtikelHtml = this.wrapInLayout(
      'Alle Artikel',
      `<h1>Alle Artikel</h1>
      <p>${articles.length} Artikel über vegane Ernährung</p>
      <ul class="article-list">${allListHtml}</ul>`,
      'alle-artikel.html'
    );
    
    await this.fs.writeFile(
      path.join(this.config.publicDir, 'alle-artikel.html'),
      alleArtikelHtml
    );
    
    // Keep old articles.html for backward compatibility
    await this.fs.writeFile(
      path.join(this.config.publicDir, 'articles.html'),
      alleArtikelHtml
    );
  }

  async generateRecipesList(): Promise<void> {
    const recipes = await this.loadRecipes();
    const recipesWithImages = recipes.filter(r => r.featuredImage);
    
    // Generate rezepte.html (20 random with images, recent first)
    const randomRecipes = this.getRandomWithRecent(recipesWithImages, 20);
    const randomListHtml = this.template.renderList(randomRecipes, 'r');
    
    const rezepteHtml = this.wrapInLayout(
      'Rezepte',
      `<h1>Rezepte</h1>
      <ul class="article-list">${randomListHtml}</ul>
      <p style="text-align: center; margin-top: 40px;">
        <a href="/alle-rezepte.html">→ Alle ${recipes.length} Rezepte anzeigen</a>
      </p>`,
      'rezepte.html'
    );
    
    await this.fs.writeFile(
      path.join(this.config.publicDir, 'rezepte.html'),
      rezepteHtml
    );
    
    // Generate alle-rezepte.html (ALL recipes chronologically)
    const allListHtml = this.template.renderList(recipes, 'r');
    
    const alleRezepteHtml = this.wrapInLayout(
      'Alle Rezepte',
      `<h1>Alle Rezepte</h1>
      <p>${recipes.length} vegane Rezepte</p>
      <ul class="article-list">${allListHtml}</ul>`,
      'alle-rezepte.html'
    );
    
    await this.fs.writeFile(
      path.join(this.config.publicDir, 'alle-rezepte.html'),
      alleRezepteHtml
    );
    
    // Keep old recipes.html for backward compatibility
    await this.fs.writeFile(
      path.join(this.config.publicDir, 'recipes.html'),
      alleRezepteHtml
    );
  }

  private async loadArticles(): Promise<Article[]> {
    const articlesDir = path.join(this.config.srcDir, 'articles');
    const files = await this.fs.readDir(articlesDir);
    const articles: Article[] = [];
    
    for (const file of files.filter(f => f.endsWith('.md'))) {
      const content = await this.fs.readFile(path.join(articlesDir, file));
      articles.push(this.content.processArticle(file, content));
    }
    
    return articles.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }

  private async loadRecipes(): Promise<Recipe[]> {
    const recipesDir = path.join(this.config.srcDir, 'recipes');
    const files = await this.fs.readDir(recipesDir);
    const recipes: Recipe[] = [];
    
    for (const file of files.filter(f => f.endsWith('.md'))) {
      const content = await this.fs.readFile(path.join(recipesDir, file));
      recipes.push(this.content.processRecipe(file, content));
    }
    
    return recipes.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }

  private wrapInLayout(title: string, content: string, _cssPath: string): string {
    return this.templateEngine.generateLayout(title, content);
  }

  private getRandomWithRecent<T extends { date?: string }>(items: T[], count: number): T[] {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0] || '';
    
    // Get recent items from last month
    const recentItems = items.filter(item => (item.date || '') > oneMonthAgoStr);
    
    // If we have enough recent items, just use them
    if (recentItems.length >= count) {
      return recentItems.slice(0, count);
    }
    
    // Otherwise, fill up with random older items
    const olderItems = items.filter(item => (item.date || '') <= oneMonthAgoStr);
    const randomOlder = [...olderItems].sort(() => Math.random() - 0.5);
    const needed = count - recentItems.length;
    
    return [...recentItems, ...randomOlder.slice(0, needed)];
  }
}