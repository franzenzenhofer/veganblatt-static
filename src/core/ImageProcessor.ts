import { ImageMetadata } from '../types';

export class ImageProcessor {
  private imageCache = new Map<string, ImageMetadata>();

  loadMetadata(imageName: string, metadata: ImageMetadata): void {
    this.imageCache.set(imageName, metadata);
  }

  getMetadata(imageName: string): ImageMetadata | undefined {
    return this.imageCache.get(imageName);
  }

  validateCopyright(metadata?: ImageMetadata): boolean {
    if (!metadata?.copyright) return false;
    const copyright = metadata.copyright.trim();
    return copyright !== '' && 
           copyright !== 'null' && 
           copyright !== 'undefined';
  }

  generateImageHtml(imageName: string, width?: number): string {
    // Skip AI SVG images that don't exist
    if (imageName && imageName.startsWith('ai/')) return '';
    
    const metadata = this.getMetadata(imageName);
    if (!this.validateCopyright(metadata)) return '';

    const widthAttr = width ? `width="${width}"` : '';
    const alt = this.escapeHtml(metadata?.altText || imageName);
    
    return `
<div class="image-container">
  <img src="/i/${encodeURIComponent(imageName)}" alt="${alt}" ${widthAttr} loading="lazy">
  <div class="copyright">${this.escapeHtml(metadata!.copyright!)}</div>
</div>`;
  }

  generateThumbnail(imageName?: string): string {
    if (!imageName) return '';
    
    // FAIL LOUD: No thumbnails without metadata/copyright!
    const metadata = this.getMetadata(imageName);
    if (!this.validateCopyright(metadata)) {
      console.warn(`WARNING: Skipping thumbnail without metadata/copyright: ${imageName}`);
      return ''; // Return empty - no image without copyright!
    }
    
    const alt = this.escapeHtml(metadata?.altText || imageName);
    // For list pages, we show thumbnails without visible copyright
    // but ONLY if the metadata exists (copyright is validated above)
    return `<img src="/i/${encodeURIComponent(imageName)}" alt="${alt}" width="80" loading="lazy">`;
  }

  private escapeHtml(str: string): string {
    return str.replace(/[&<>"']/g, m => 
      ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]!));
  }
}