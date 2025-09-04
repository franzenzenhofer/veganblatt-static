import { SharedHeader } from './SharedHeader';
import { SharedFooter } from './SharedFooter';
import { MetaTags, MetaTagOptions } from './MetaTags';
import fs from 'fs';
import path from 'path';

export class TemplateEngine {
  private static cachedVersion: string | null | undefined = undefined;

  private static getBuildVersion(): string | null {
    if (this.cachedVersion !== undefined) return this.cachedVersion;
    try {
      const data = fs.readFileSync(path.join(process.cwd(), 'version.json'), 'utf-8');
      const { version } = JSON.parse(data) as { version?: string };
      this.cachedVersion = version || null;
    } catch {
      this.cachedVersion = null;
    }
    return this.cachedVersion;
  }
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
    
    const versionTag = metaOptions?.version || TemplateEngine.getBuildVersion() || '';
    const cssHref = `/${cssPath}${versionTag ? `?v=${encodeURIComponent(versionTag)}` : ''}`;

    return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fullTitle}</title>${metaTags}
  <link rel="stylesheet" href="${cssHref}">
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
