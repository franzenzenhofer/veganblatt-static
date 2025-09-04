import { SharedHeader } from './SharedHeader';
import { SharedFooter } from './SharedFooter';
import { MetaTags, MetaTagOptions } from './MetaTags';
import fs from 'fs';
import path from 'path';

export class PageTemplate {
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
      
    const versionTag = PageTemplate.getBuildVersion() || '';
    const cssHref = `/css/styles.css${versionTag ? `?v=${encodeURIComponent(versionTag)}` : ''}`;

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
