import { SharedHeader } from './SharedHeader';
import { SharedFooter } from './SharedFooter';
import { MetaTags, MetaTagOptions } from './MetaTags';

export class TemplateEngine {
  generateLayout(
    title: string,
    content: string,
    cssPath: string = 'css/styles.css',
    metaOptions?: Partial<MetaTagOptions>
  ): string {
    const fullTitle = `${this.escapeHtml(title)} - VeganBlatt`;
    const description = metaOptions?.description || 
      'VeganBlatt - Dein Magazin für vegane Ernährung, leckere Rezepte und nachhaltigen Lebensstil';
    
    const metaTags = MetaTags.render({
      title: fullTitle,
      description,
      url: metaOptions?.url || '/',
      type: metaOptions?.type || 'website',
      ...metaOptions
    } as MetaTagOptions);
    
    return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fullTitle}</title>${metaTags}
  <link rel="stylesheet" href="/${cssPath}">
</head>
<body>
  ${this.generateHeader()}
  <main>${content}</main>
  ${this.generateFooter()}
</body>
</html>`;
  }

  generateHeader(): string {
    return SharedHeader.render();
  }

  generateFooter(): string {
    return SharedFooter.render();
  }

  escapeHtml(str: string): string {
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;',
      '"': '&quot;', "'": '&#39;'
    })[m] || m);
  }
}