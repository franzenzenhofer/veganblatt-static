import { Article } from '../types';
import { PageTemplate } from './PageTemplate';
import { ImageProcessor } from '../core/ImageProcessor';

export class ArticleTemplate extends PageTemplate {
  constructor(protected imageProcessor: ImageProcessor) {
    super();
  }

  async render(article: Article, htmlContent: string): Promise<string> {
    const url = `/a/${article.slug}.html`;
    const head = this.renderHead(article.title, article.excerpt, {
      url,
      type: 'article',
      publishedTime: article.date,
      image: article.featuredImage
    });
    const header = this.renderHeader('articles');
    const footer = this.renderFooter();
    
    const meta = article.date 
      ? `<div class="meta">${this.formatDate(article.date)}</div>`
      : '';
    
    const featuredImageHtml = article.featuredImage
      ? this.imageProcessor.generateImageHtml(article.featuredImage, 800, true)
      : '';

    return `${head}
<body>
  ${header}
  <article>
    <h1>${this.escapeHtml(article.title)}</h1>
    ${meta}
    ${featuredImageHtml}
    ${htmlContent}
  </article>
  ${footer}`;
  }

  private formatDate(date: string): string {
    return new Date(date).toLocaleDateString('de-DE');
  }
}
