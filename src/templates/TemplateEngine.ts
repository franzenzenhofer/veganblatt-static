import { SharedHeader } from './SharedHeader';
import { SharedFooter } from './SharedFooter';

export class TemplateEngine {
  generateLayout(
    title: string,
    content: string,
    cssPath: string = 'css/styles.css'
  ): string {
    return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(title)} - VeganBlatt</title>
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