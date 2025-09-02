import fs from 'fs/promises';
import path from 'path';

export class FileSystemManager {
  constructor() {}

  async ensureDir(dir: string): Promise<void> {
    await fs.mkdir(dir, { recursive: true });
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    await this.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
  }

  async readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8');
  }

  async readDir(dir: string): Promise<string[]> {
    return fs.readdir(dir);
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async copyFile(src: string, dest: string): Promise<void> {
    await this.ensureDir(path.dirname(dest));
    await fs.copyFile(src, dest);
  }

  async cleanDir(dir: string, pattern?: RegExp): Promise<void> {
    const files = await this.readDir(dir);
    for (const file of files) {
      if (!pattern || pattern.test(file)) {
        await fs.unlink(path.join(dir, file));
      }
    }
  }
}