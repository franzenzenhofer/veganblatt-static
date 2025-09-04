import matter from 'gray-matter';
import { marked } from 'marked';
import fs from 'fs';
import path from 'path';
import { Article, Recipe } from '../types';

interface Frontmatter {
  slug?: string;
  title?: string;
  date?: string;
  excerpt?: string;
  featuredImage?: string;
  recipe?: Recipe['recipe'];
}
import { ImageProcessor } from './ImageProcessor';

export class ContentProcessor {
  private skippedImagesLog: string[] = [];
  private currentFile: string = '';
  
  constructor(private imageProcessor?: ImageProcessor) {
    marked.setOptions({
      breaks: true,
      gfm: true,
      renderer: this.createRenderer()
    });
    
    // Create log directory if it doesn't exist
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }
  
  setCurrentFile(filename: string): void {
    this.currentFile = filename;
  }

  private createRenderer() {
    const renderer = new marked.Renderer();
    
    // Handle links: internal same tab, external new tab
    renderer.link = (href, title, text) => {
      const isExternal = href?.startsWith('http://') || href?.startsWith('https://');
      const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${href}"${titleAttr}${target}>${text}</a>`;
    };
    
    // Handle inline images - use ImageProcessor to get metadata
    renderer.image = (href, _title, _text) => {
      // Skip YouTube/Vimeo URLs that might be mistakenly parsed as images
      if (href?.includes('youtube.com') || href?.includes('youtu.be') || 
          href?.includes('vimeo.com') || href?.includes('watch?v=')) {
        return ''; // Don't render video URLs as images
      }
      
      // Extract filename from URL
      const filename = href?.split('/').pop() || '';
      
      // If we have an ImageProcessor, use it to get proper metadata
      if (this.imageProcessor) {
        const imageHtml = this.imageProcessor.generateImageHtml(filename, 800);
        // If no metadata/copyright, log and skip (FAIL LOUD - no image without copyright!)
        if (!imageHtml) {
          const timestamp = new Date().toISOString();
          const logEntry = `[${timestamp}] SKIPPED IMAGE: ${filename} in file: ${this.currentFile} - NO METADATA/COPYRIGHT`;
          this.skippedImagesLog.push(logEntry);
          console.warn(logEntry);
          return '';
        }
        return imageHtml;
      }
      
      // No ImageProcessor = no image (FAIL LOUD)
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] NO IMAGE PROCESSOR: ${filename} in file: ${this.currentFile}`;
      this.skippedImagesLog.push(logEntry);
      console.warn(logEntry);
      return '';
    };
    
    return renderer;
  }

  parseMarkdown<T = Frontmatter>(content: string): { data: T; content: string } {
    return matter(content) as unknown as { data: T; content: string };
  }

  async renderMarkdown(markdown: string): Promise<string> {
    let processedMarkdown = markdown;
    
    // Normalize markdown before processing
    
    // Convert YouTube iframes to links (handle src with // prefix)
    processedMarkdown = processedMarkdown.replace(
      /<iframe[^>]*src=["']?(?:https?:)?\/\/(?:www\.)?(?:youtube\.com\/embed\/|youtu\.be\/)([^"'\s?]+)[^>]*>.*?<\/iframe>/gi,
      (_match, videoId) => {
        // Handle undefined video IDs
        if (!videoId || videoId === 'undefined') {
          return ''; // Remove broken iframes
        }
        return `[Video auf YouTube ansehen](https://www.youtube.com/watch?v=${videoId})`;
      }
    );
    
    // Convert Vimeo iframes to links
    processedMarkdown = processedMarkdown.replace(
      /<iframe[^>]*(?:player\.)?vimeo\.com\/video\/(\d+)[^>]*>.*?<\/iframe>/gi,
      (_match, videoId) => {
        if (!videoId) {
          return ''; // Remove broken iframes
        }
        return `[Video auf Vimeo ansehen](https://vimeo.com/${videoId})`;
      }
    );
    
    // Convert embedresponsive shortcodes to YouTube links
    processedMarkdown = processedMarkdown.replace(
      /\[embedresponsive[^\]]*videourl=["']?(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^"'\]]+)["']?[^\]]*\]/gi,
      (_match, videoId) => {
        if (!videoId || videoId === 'undefined') {
          return ''; // Remove broken embeds
        }
        return `[Video auf YouTube ansehen](https://www.youtube.com/watch?v=${videoId})`;
      }
    );
    
    // Remove WordPress shortcodes
    processedMarkdown = processedMarkdown.replace(
      /\[luckyform[^\]]*\]/gi,
      '(Gewinnspiel-Formular entfernt)'
    );
    processedMarkdown = processedMarkdown.replace(
      /\[contact[^\]]*\]/gi,
      '(Kontakt-Formular entfernt)'
    );
    processedMarkdown = processedMarkdown.replace(
      /\[gallery[^\]]*\]/gi,
      ''  // Remove gallery shortcodes completely
    );
    processedMarkdown = processedMarkdown.replace(
      /\[caption[^\]]*\](.*?)\[\/caption\]/gi,
      '$1'  // Keep content, remove caption wrapper
    );
    
    // Remove any other WordPress shortcodes (but not markdown link/image syntax)
    // Only remove standalone [something] that isn't followed by (url)
    processedMarkdown = processedMarkdown.replace(
      /\[([^\]]+)\](?!\()/g,
      ''
    );
    
    // Fix escaped asterisks after image removal comments
    processedMarkdown = processedMarkdown.replace(
      /\\\*\s*([^*]+?)\s*\\\*/g,
      '_$1_'  // Convert to italics
    );
    
    return marked(processedMarkdown);
  }

  extractExcerpt(content: string, maxLength = 150): string {
    const text = content.replace(/[#*`\[\]]/g, '').trim();
    return text.length > maxLength 
      ? text.substring(0, maxLength) + '...' 
      : text;
  }

  processArticle(filename: string, content: string): Article {
    const { data, content: markdown } = this.parseMarkdown<Frontmatter>(content);
    // ALWAYS use slug from markdown - NO FALLBACK
    if (!data.slug) {
      throw new Error(`Missing slug in ${filename} - EVERY FILE MUST HAVE A SLUG!`);
    }
    return {
      title: data.title || 'Untitled',
      slug: data.slug,
      date: data.date,
      excerpt: data.excerpt || this.extractExcerpt(markdown),
      featuredImage: data.featuredImage,
      content: markdown
    };
  }

  processRecipe(filename: string, content: string): Recipe {
    const article = this.processArticle(filename, content);
    const { data } = this.parseMarkdown<Frontmatter>(content);
    return {
      ...article,
      recipe: data.recipe
    };
  }
  
  writeSkippedImagesReport(): void {
    if (this.skippedImagesLog.length > 0) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const logFile = path.join(process.cwd(), 'logs', `skipped-images-${timestamp}.log`);
      const report = [
        '===========================================',
        'SKIPPED IMAGES REPORT - NO COPYRIGHT METADATA',
        `Generated: ${new Date().toISOString()}`,
        '===========================================',
        '',
        `Total skipped images: ${this.skippedImagesLog.length}`,
        '',
        'DETAILED LOG:',
        '-------------',
        ...this.skippedImagesLog,
        '',
        '===========================================',
        'END OF REPORT'
      ].join('\n');
      
      fs.writeFileSync(logFile, report, 'utf-8');
      console.log(`\n📝 Skipped images report written to: ${logFile}`);
      console.log(`   Total images skipped: ${this.skippedImagesLog.length}`);
    }
  }
}
