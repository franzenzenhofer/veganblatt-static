import fs from 'fs/promises';
import path from 'path';

export class VersionManager {
  private versionFile = path.join(process.cwd(), 'version.json');
  
  async getCurrentVersion(): Promise<string> {
    try {
      const data = await fs.readFile(this.versionFile, 'utf-8');
      const { version } = JSON.parse(data);
      return version;
    } catch {
      // If no version file exists, start with 1.0.0
      return '1.0.0';
    }
  }
  
  async incrementVersion(): Promise<string> {
    const current = await this.getCurrentVersion();
    const parts = current.split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    const newVersion = `${parts[0]}.${parts[1]}.${patch}`;
    
    // Save new version with timestamp
    const versionData = {
      version: newVersion,
      buildTime: new Date().toISOString(),
      buildNumber: Date.now()
    };
    
    await fs.writeFile(this.versionFile, JSON.stringify(versionData, null, 2));
    console.log(`📦 Version bumped: ${current} → ${newVersion}`);
    
    return newVersion;
  }
  
  async getBuildInfo(): Promise<{ version: string; buildTime: string; buildNumber: number }> {
    try {
      const data = await fs.readFile(this.versionFile, 'utf-8');
      return JSON.parse(data);
    } catch {
      return {
        version: '1.0.0',
        buildTime: new Date().toISOString(),
        buildNumber: Date.now()
      };
    }
  }
}