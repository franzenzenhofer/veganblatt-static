import { SharedHeader } from './SharedHeader';
import { SharedFooter } from './SharedFooter';
import { MetaTags, MetaTagOptions } from './MetaTags';
import { Assets } from './Assets';

export class PageTemplate {
  // Versioning and CSS href come from Assets to keep things DRY
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
      
    const cssHref = Assets.cssHref('css/styles.css');

    return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fullTitle}</title>${metaTags}
  <link rel="stylesheet" href="${cssHref}">
</head>`;
  }

  renderHeader(_currentPage: 'articles' | 'recipes' | 'home'): string {
    return SharedHeader.render();
  }

  renderFooter(): string {
    return SharedFooter.render() + '\n</body>\n</html>';
  }
}
