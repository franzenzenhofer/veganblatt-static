import { SharedHeader } from './SharedHeader';
import { SharedFooter } from './SharedFooter';
import { MetaTags, MetaTagOptions } from './MetaTags';

export class PageTemplate {
  escapeHtml(str: string): string {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => 
      ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]!));
  }

  renderHead(title: string, description = '', metaOptions?: Partial<MetaTagOptions>): string {
    const fullTitle = `${this.escapeHtml(title)} - VeganBlatt`;
    const metaTags = metaOptions 
      ? MetaTags.render({ 
          title: fullTitle, 
          description,
          ...metaOptions 
        } as MetaTagOptions)
      : '';
      
    return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fullTitle}</title>${metaTags}
  <link rel="stylesheet" href="/css/styles.css">
</head>`;
  }

  renderHeader(_currentPage: 'articles' | 'recipes' | 'home'): string {
    return SharedHeader.render();
  }

  renderFooter(): string {
    return SharedFooter.render() + '\n</body>\n</html>';
  }
}