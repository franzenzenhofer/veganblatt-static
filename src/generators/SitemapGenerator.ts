import { FileSystemManager } from '../core/FileSystemManager';
import path from 'path';
import fs from 'fs/promises';

interface SitemapEntry {
  loc: string;
  lastmod: string;
}

export class SitemapGenerator {
  private fs: FileSystemManager;
  private baseUrl = 'https://www.veganblatt.com';
  
  constructor() {
    this.fs = new FileSystemManager();
  }

  async generate(srcDir: string, publicDir: string): Promise<void> {
    console.log('🗺️  Generating sitemaps...');
    
    // Collect all URLs by type
    const articles = await this.collectArticles(srcDir);
    const recipes = await this.collectRecipes(srcDir);
    const staticPages = this.getStaticPages();
    
    // Generate individual sitemaps
    await this.generateArticlesSitemap(articles, publicDir);
    await this.generateRecipesSitemap(recipes, publicDir);
    await this.generateStaticSitemap(staticPages, publicDir);
    
    // Generate sitemap index
    await this.generateSitemapIndex(publicDir);
    
    // Generate robots.txt
    await this.generateRobotsTxt(publicDir);
    
    console.log('✅ Sitemaps and robots.txt generated');
  }

  private async collectArticles(srcDir: string): Promise<SitemapEntry[]> {
    const articlesDir = path.join(srcDir, 'articles');
    const files = await this.fs.readDir(articlesDir);
    const entries: SitemapEntry[] = [];
    
    for (const file of files.filter(f => f.endsWith('.md'))) {
      const slug = file.replace('.md', '');
      const filePath = path.join(articlesDir, file);
      const stats = await fs.stat(filePath);
      
      entries.push({
        loc: `${this.baseUrl}/a/${slug}.html`,
        lastmod: stats.mtime.toISOString().split('T')[0] || ''
      });
    }
    
    return entries;
  }

  private async collectRecipes(srcDir: string): Promise<SitemapEntry[]> {
    const recipesDir = path.join(srcDir, 'recipes');
    const files = await this.fs.readDir(recipesDir);
    const entries: SitemapEntry[] = [];
    
    for (const file of files.filter(f => f.endsWith('.md'))) {
      const slug = file.replace('.md', '');
      const filePath = path.join(recipesDir, file);
      const stats = await fs.stat(filePath);
      
      entries.push({
        loc: `${this.baseUrl}/r/${slug}.html`,
        lastmod: stats.mtime.toISOString().split('T')[0] || ''
      });
    }
    
    return entries;
  }

  private getStaticPages(): SitemapEntry[] {
    const today = new Date().toISOString().split('T')[0] || '';
    
    return [
      {
        loc: this.baseUrl,
        lastmod: today
      },
      {
        loc: `${this.baseUrl}/articles.html`,
        lastmod: today
      },
      {
        loc: `${this.baseUrl}/recipes.html`,
        lastmod: today
      },
      {
        loc: `${this.baseUrl}/about/impressum.html`,
        lastmod: today
      },
      {
        loc: `${this.baseUrl}/about/datenschutz.html`,
        lastmod: today
      },
      {
        loc: `${this.baseUrl}/about/kontakt.html`,
        lastmod: today
      }
    ];
  }

  private generateSitemapXml(entries: SitemapEntry[]): string {
    const xml = entries.map(entry => `  <url>
    <loc>${this.escapeXml(entry.loc)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
  </url>`).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xml}
</urlset>`;
  }

  private async generateArticlesSitemap(entries: SitemapEntry[], publicDir: string): Promise<void> {
    const xml = this.generateSitemapXml(entries);
    await fs.writeFile(path.join(publicDir, 'sitemap-articles.xml'), xml, 'utf-8');
    console.log(`  Generated sitemap-articles.xml (${entries.length} URLs)`);
  }

  private async generateRecipesSitemap(entries: SitemapEntry[], publicDir: string): Promise<void> {
    const xml = this.generateSitemapXml(entries);
    await fs.writeFile(path.join(publicDir, 'sitemap-recipes.xml'), xml, 'utf-8');
    console.log(`  Generated sitemap-recipes.xml (${entries.length} URLs)`);
  }

  private async generateStaticSitemap(entries: SitemapEntry[], publicDir: string): Promise<void> {
    const xml = this.generateSitemapXml(entries);
    await fs.writeFile(path.join(publicDir, 'sitemap-static.xml'), xml, 'utf-8');
    console.log(`  Generated sitemap-static.xml (${entries.length} URLs)`);
  }

  private async generateSitemapIndex(publicDir: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0] || '';
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${this.baseUrl}/sitemap-static.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${this.baseUrl}/sitemap-articles.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${this.baseUrl}/sitemap-recipes.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;

    await fs.writeFile(path.join(publicDir, 'sitemap.xml'), xml, 'utf-8');
    console.log('  Generated sitemap.xml (index)');
  }

  private async generateRobotsTxt(publicDir: string): Promise<void> {
    const robotsTxt = `# VeganBlatt Robots.txt
# Generated: ${new Date().toISOString()}

User-agent: *
Allow: /

# Sitemaps
Sitemap: ${this.baseUrl}/sitemap.xml
Sitemap: ${this.baseUrl}/sitemap-static.xml
Sitemap: ${this.baseUrl}/sitemap-articles.xml
Sitemap: ${this.baseUrl}/sitemap-recipes.xml

# Crawl-delay for politeness
Crawl-delay: 1

# Disallow admin paths (if any existed)
Disallow: /wp-admin/
Disallow: /wp-includes/
Disallow: /*.json$
Disallow: /*.xml.gz$`;

    await fs.writeFile(path.join(publicDir, 'robots.txt'), robotsTxt, 'utf-8');
    console.log('  Generated robots.txt');
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}