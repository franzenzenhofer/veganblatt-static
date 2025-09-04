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
  <!-- Favicons -->
  <link rel="icon" type="image/x-icon" href="https://www.veganblatt.com/favicon.ico">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152.png">
  <link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon-120x120.png">
  <link rel="apple-touch-icon" sizes="76x76" href="/apple-touch-icon-76x76.png">
  <link rel="apple-touch-icon" sizes="60x60" href="/apple-touch-icon-60x60.png">
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#76A11E">
  <meta property="og:image" content="https://veganblatt.com/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
</head>`;
  }

  renderHeader(_currentPage: 'articles' | 'recipes' | 'home'): string {
    return SharedHeader.render();
  }

  renderFooter(): string {
    return SharedFooter.render() + '\n</body>\n</html>';
  }
}
