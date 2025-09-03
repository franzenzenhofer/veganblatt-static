import { Article, Recipe } from '../types';
import { PageTemplate } from './PageTemplate';

export class ListTemplate extends PageTemplate {
  constructor() {
    super();
  }

  renderArticleItem(item: Article | Recipe, type: 'a' | 'r'): string {
    let imageTag = '';
    if (item.featuredImage) {
      // Handle URL encoding properly - don't double-encode path separators
      let imageUrl: string;
      if (item.featuredImage.startsWith('ai/')) {
        const filename = item.featuredImage.substring(3); // Remove 'ai/'
        imageUrl = `/i/ai/${encodeURIComponent(filename)}`;
      } else {
        imageUrl = `/i/${encodeURIComponent(item.featuredImage)}`;
      }
      const altText = this.escapeHtml(item.featuredImage.replace(/\.[^.]+$/, '').replace(/-/g, ' '));
      imageTag = `<img src="${imageUrl}" alt="${altText}" width="80" class="list-thumb">\n  `;
    }

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