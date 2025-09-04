import path from 'path';
import { Article, Recipe, SiteConfig } from '../types';
import { FileSystemManager } from '../core/FileSystemManager';
import { TemplateEngine } from '../templates/TemplateEngine';
import { VersionManager } from '../utils/version';
import { ContentStats } from '../utils/content-stats';
import { ListTemplate } from '../templates/ListTemplate';

export class HomePageGenerator {
  constructor(
    private config: SiteConfig,
    private fs: FileSystemManager,
    private template: TemplateEngine
  ) {}

  async generate(articles: Article[], recipes: Recipe[]): Promise<void> {
    // ONLY select content WITH images
    const articlesWithImages = articles.filter(a => a.featuredImage);
    const recipesWithImages = recipes.filter(r => r.featuredImage);
    
    // Get content from last month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0] || '';
    
    // First 7 MUST be recipes (recent ones first, then random)
    const recentRecipes = recipesWithImages.filter(r => (r.date || '') > oneMonthAgoStr);
    const olderRecipes = recipesWithImages.filter(r => (r.date || '') <= oneMonthAgoStr);
    
    // Get 7 recipes total
    let first7Recipes: Recipe[] = [];
    if (recentRecipes.length >= 7) {
      first7Recipes = this.getRandomItems(recentRecipes, 7);
    } else {
      first7Recipes = [
        ...recentRecipes,
        ...this.getRandomItems(olderRecipes, 7 - recentRecipes.length)
      ];
    }
    
    // For the remaining 13 slots, mix articles and recipes
    const recentArticles = articlesWithImages.filter(a => (a.date || '') > oneMonthAgoStr);
    const olderArticles = articlesWithImages.filter(a => (a.date || '') <= oneMonthAgoStr);
    
    // Exclude the recipes we already used
    const usedRecipeSlugs = new Set(first7Recipes.map(r => r.slug));
    const availableRecipes = recipesWithImages.filter(r => !usedRecipeSlugs.has(r.slug));
    
    // Mix all available content for the remaining 13 slots
    const mixedPool = [
      ...recentArticles.map(a => ({ ...a, type: 'a' as const })),
      ...availableRecipes.filter(r => (r.date || '') > oneMonthAgoStr).map(r => ({ ...r, type: 'r' as const }))
    ];
    
    let remaining13: Array<(Article | Recipe) & { type: 'a' | 'r' }> = [];
    if (mixedPool.length >= 13) {
      remaining13 = this.getRandomItems(mixedPool, 13);
    } else {
      // Need more content from older items
      const olderMixed = [
        ...olderArticles.map(a => ({ ...a, type: 'a' as const })),
        ...availableRecipes.filter(r => (r.date || '') <= oneMonthAgoStr).map(r => ({ ...r, type: 'r' as const }))
      ];
      remaining13 = [
        ...mixedPool,
        ...this.getRandomItems(olderMixed, 13 - mixedPool.length)
      ];
    }
    
    // Combine: first 7 recipes, then 13 mixed
    const finalContent = [
      ...first7Recipes.map(r => ({ ...r, type: 'r' as const })),
      ...remaining13
    ];
    
    // Check for NEW content from last 28 days
    const today = new Date();
    const twentyEightDaysAgo = new Date();
    twentyEightDaysAgo.setDate(today.getDate() - 28);
    const twentyEightDaysAgoStr = twentyEightDaysAgo.toISOString().split('T')[0] || '';
    
    const newArticles = articlesWithImages
      .filter(a => (a.date || '') > twentyEightDaysAgoStr)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    
    const newRecipes = recipesWithImages
      .filter(r => (r.date || '') > twentyEightDaysAgoStr)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    
    // Mix new content chronologically
    const newContent = [
      ...newArticles.map(a => ({ ...a, type: 'a' as const, sortDate: a.date || '' })),
      ...newRecipes.map(r => ({ ...r, type: 'r' as const, sortDate: r.date || '' }))
    ].sort((a, b) => b.sortDate.localeCompare(a.sortDate));
    
    // Build the page content using the shared ListTemplate (consistency with list pages)
    const listTemplate = new ListTemplate();
    let pageContent = '';
    
    // Only show NEW section if there is new content
    if (newContent.length > 0) {
      pageContent += `<h2>Neu</h2>
    <ul class="article-list">
      ${listTemplate.renderMixedList(newContent)}
    </ul>
    <hr style="margin: 40px 0; border: none; border-top: 1px solid #eee;">`;
    }
    
    // Add the main 20 items
    pageContent += `<ul class="article-list">
      ${listTemplate.renderMixedList(finalContent)}
    </ul>`;
    
    // Get version info
    const versionManager = new VersionManager();
    const buildInfo = await versionManager.getBuildInfo();
    
    // Get real content stats
    const contentStats = new ContentStats();
    const stats = await contentStats.getStats(this.config.srcDir);
    const description = contentStats.generateDescription(stats);
    
    const html = this.template.generateLayout('Home', pageContent, 'css/styles.css', {
      url: '/',
      description,
      type: 'website',
      version: buildInfo.version,
      buildTime: buildInfo.buildTime
    });
    await this.fs.writeFile(path.join(this.config.publicDir, 'index.html'), html);
  }

  // Rendering moved to ListTemplate for reuse and consistency

  private getRandomItems<T>(arr: T[], count: number): T[] {
    return [...arr].sort(() => Math.random() - 0.5).slice(0, count);
  }
}
