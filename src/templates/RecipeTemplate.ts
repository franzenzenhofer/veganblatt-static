import { Recipe } from '../types';
import { ArticleTemplate } from './ArticleTemplate';

export class RecipeTemplate extends ArticleTemplate {
  async render(recipe: Recipe, htmlContent: string): Promise<string> {
    // Remove date for recipes by setting it to undefined
    const recipeWithoutDate = { ...recipe, date: undefined };
    const baseHtml = await super.render(recipeWithoutDate, htmlContent);
    if (!recipe.recipe) return baseHtml;
    
    const recipeCard = this.renderRecipeCard(recipe.recipe);
    return baseHtml.replace('</article>', `${recipeCard}</article>`);
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