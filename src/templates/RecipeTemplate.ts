import { Recipe } from '../types';
import { ArticleTemplate } from './ArticleTemplate';

export class RecipeTemplate extends ArticleTemplate {
  async render(recipe: Recipe, htmlContent: string): Promise<string> {
    // Override the render to include proper recipe URL
    const url = `/r/${recipe.slug}.html`;
    const head = this.renderHead(recipe.title, recipe.excerpt, {
      url,
      type: 'article',
      publishedTime: recipe.date,
      image: recipe.featuredImage
    });
    const header = this.renderHeader('recipes');
    const footer = this.renderFooter();
    
    const featuredImageHtml = recipe.featuredImage
      ? (this as any).imageProcessor.generateImageHtml(recipe.featuredImage, 800)
      : '';
    
    const baseHtml = `${head}
<body>
  ${header}
  <article>
    <h1>${this.escapeHtml(recipe.title)}</h1>
    ${featuredImageHtml}
    ${htmlContent}`;
    
    if (!recipe.recipe) {
      return baseHtml + `</article>\n${footer}`;
    }
    
    const recipeCard = this.renderRecipeCard(recipe.recipe);
    return baseHtml + `${recipeCard}</article>\n${footer}`;
  }

  private renderRecipeCard(recipe: any): string {
    const meta = this.renderMeta(recipe);
    const ingredients = this.renderIngredients(recipe.ingredients);
    const instructions = this.renderInstructions(recipe.instructions);
    const notes = recipe.notes ? `<div class="recipe-section">
      <h3>Notizen</h3><p>${this.escapeHtml(recipe.notes)}</p></div>` : '';

    return `<div class="recipe-card">
      <h2>Rezept</h2>
      ${meta}${ingredients}${instructions}${notes}
    </div>`;
  }

  private renderMeta(recipe: any): string {
    if (!recipe.prepTime && !recipe.cookTime && !recipe.servings) return '';
    return `<div class="recipe-meta">
      ${recipe.prepTime ? `<span>Zubereitungszeit: ${recipe.prepTime}</span>` : ''}
      ${recipe.cookTime ? `<span>Kochzeit: ${recipe.cookTime}</span>` : ''}
      ${recipe.servings ? `<span>Portionen: ${recipe.servings}</span>` : ''}
    </div>`;
  }

  private renderIngredients(ingredients?: string[]): string {
    if (!ingredients?.length) return '';
    const items = ingredients.map(i => `<li>${this.escapeHtml(i)}</li>`).join('\n');
    return `<div class="recipe-section">
      <h3>Zutaten</h3><ul class="recipe-ingredients">${items}</ul></div>`;
  }

  private renderInstructions(instructions?: string[]): string {
    if (!instructions?.length) return '';
    const items = instructions.map(i => `<li>${this.escapeHtml(i)}</li>`).join('\n');
    return `<div class="recipe-section">
      <h3>Zubereitung</h3><ol class="recipe-instructions">${items}</ol></div>`;
  }
}