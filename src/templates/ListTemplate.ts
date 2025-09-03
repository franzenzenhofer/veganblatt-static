import { Article, Recipe } from '../types';
import { PageTemplate } from './PageTemplate';

export class ListTemplate extends PageTemplate {
  constructor() {
    super();
  }

  renderArticleItem(item: Article | Recipe, type: 'a' | 'r'): string {
    // Skip AI SVG images that don't exist
    const shouldShowImage = item.featuredImage && !item.featuredImage.startsWith('ai/');
    const imageTag = shouldShowImage && item.featuredImage
      ? `<img src="/i/${encodeURIComponent(item.featuredImage)}" alt="${this.escapeHtml(item.featuredImage.replace(/\.[^.]+$/, '').replace(/-/g, ' '))}" width="80" class="list-thumb">\n  `
      : '';

    return `<li class="article-item">
  ${imageTag}<div class="article-text">
    <a href="/${type}/${item.slug}.html" class="article-link">${this.escapeHtml(item.title)}</a>
    ${item.excerpt ? `<p class="article-excerpt">${this.escapeHtml(item.excerpt)}</p>` : ''}
  </div>
</li>`;
  }

  renderList(items: (Article | Recipe)[], type: 'a' | 'r'): string {
    return items.map(item => this.renderArticleItem(item, type)).join('\n');
  }
}