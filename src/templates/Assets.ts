import fs from 'fs';
import path from 'path';

// Centralized asset helpers to keep CSS and version logic DRY
export class Assets {
  private static cachedVersion: string | null | undefined = undefined;

  static getBuildVersion(): string | null {
    if (this.cachedVersion !== undefined) return this.cachedVersion;
    try {
      const raw = fs.readFileSync(path.join(process.cwd(), 'version.json'), 'utf-8');
      const parsed = JSON.parse(raw) as { version?: string };
      this.cachedVersion = parsed.version || null;
    } catch {
      this.cachedVersion = null;
    }
    return this.cachedVersion;
  }

  static cssHref(cssPath = 'css/styles.css'): string {
    const v = this.getBuildVersion();
    return `/${cssPath}${v ? `?v=${encodeURIComponent(v)}` : ''}`;
  }
}

