export class LinkProcessor {
  private readonly domainMappings = new Map([
    ['der-veganizer.de', 'veganblatt.com'],
    ['veganblatt.de', 'veganblatt.com'],
    ['www.veganblatt.de', 'veganblatt.com']
  ]);

  processInternalLinks(content: string): string {
    let processed = content;
    
    for (const [oldDomain, newDomain] of this.domainMappings) {
      const pattern = new RegExp(
        `https?://(www\\.)?${oldDomain.replace('.', '\\.')}`,
        'gi'
      );
      processed = processed.replace(pattern, `https://${newDomain}`);
    }
    
    return this.convertToRelativeLinks(processed);
  }

  private convertToRelativeLinks(content: string): string {
    return content
      .replace(/https?:\/\/veganblatt\.com\/a\//gi, '/a/')
      .replace(/https?:\/\/veganblatt\.com\/r\//gi, '/r/')
      .replace(/https?:\/\/veganblatt\.com\//gi, '/');
  }

  updateImagePaths(content: string): string {
    return content.replace(
      /\/wp-content\/uploads\//gi,
      '/i/'
    );
  }

  fixBrokenLinks(content: string): string {
    return content
      .replace(/href=""/g, 'href="#"')
      .replace(/src=""/g, 'src="/i/placeholder.jpg"');
  }

  extractLinks(content: string): string[] {
    const linkPattern = /href="([^"]+)"/gi;
    const links: string[] = [];
    let match;
    
    while ((match = linkPattern.exec(content)) !== null) {
      if (match[1]) {
        links.push(match[1]);
      }
    }
    
    return links;
  }
}