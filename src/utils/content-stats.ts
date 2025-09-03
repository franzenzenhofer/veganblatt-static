import fs from 'fs/promises';
import path from 'path';

export class ContentStats {
  async getStats(srcDir: string): Promise<{ articles: number; recipes: number; total: number }> {
    const articlesDir = path.join(srcDir, 'articles');
    const recipesDir = path.join(srcDir, 'recipes');
    
    // Count actual markdown files
    const articleFiles = await fs.readdir(articlesDir);
    const recipeFiles = await fs.readdir(recipesDir);
    
    const articles = articleFiles.filter(f => f.endsWith('.md')).length;
    const recipes = recipeFiles.filter(f => f.endsWith('.md')).length;
    
    return {
      articles,
      recipes,
      total: articles + recipes
    };
  }
  
  generateDescription(stats: { articles: number; recipes: number }): string {
    return `VeganBlatt - Dein Magazin für vegane Ernährung mit ${stats.recipes} leckeren Rezepten und ${stats.articles} Artikeln über nachhaltigen Lebensstil`;
  }
}