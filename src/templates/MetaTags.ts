export interface MetaTagOptions {
  title: string;
  description: string;
  url: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  version?: string;
  buildTime?: string;
}

export class MetaTags {
  static render(options: MetaTagOptions): string {
    const { title, description, url, image, type = 'website', publishedTime, version, buildTime } = options;
    const canonicalUrl = `https://www.veganblatt.com${url}`;
    const ogImageUrl = image ? `https://www.veganblatt.com/i/${encodeURIComponent(image)}` : 'https://www.veganblatt.com/i/assets/veganblatt-logo.svg';
    
    let tags = `
    <!-- Canonical URL -->
    <link rel="canonical" href="${canonicalUrl}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${type}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:title" content="${this.escapeHtml(title)}">
    <meta property="og:description" content="${this.escapeHtml(description)}">
    <meta property="og:image" content="${ogImageUrl}">
    <meta property="og:site_name" content="VeganBlatt">
    <meta property="og:locale" content="de_DE">`;
    
    if (type === 'article' && publishedTime) {
      tags += `
    <meta property="article:published_time" content="${publishedTime}">
    <meta property="article:author" content="VeganBlatt">`;
    }
    
    // Add basic meta tags
    tags += `
    
    <!-- Basic Meta Tags -->
    <meta name="description" content="${this.escapeHtml(description)}">
    <meta name="author" content="VeganBlatt">
    <meta name="robots" content="index, follow">
    <meta name="language" content="de">`;
    
    // Add version info if provided (only on homepage)
    if (version && url === '/') {
      tags += `
    
    <!-- Build Version -->
    <meta name="version" content="${version}">
    <meta name="build-time" content="${buildTime || new Date().toISOString()}">`;
    }
    
    return tags;
  }
  
  private static escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return text.replace(/[&<>"']/g, m => map[m] || m);
  }
}