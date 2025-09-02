import { GenerationStats } from '../types';
import fs from 'fs/promises';

export class StatisticsCollector {
  private stats: GenerationStats = {
    articlesProcessed: 0,
    recipesProcessed: 0,
    imagesProcessed: 0,
    brokenLinks: 0,
    startTime: new Date()
  };

  incrementArticles(): void {
    this.stats.articlesProcessed++;
  }

  incrementRecipes(): void {
    this.stats.recipesProcessed++;
  }

  incrementImages(): void {
    this.stats.imagesProcessed++;
  }

  addBrokenLink(): void {
    this.stats.brokenLinks++;
  }

  finalize(): GenerationStats {
    this.stats.endTime = new Date();
    return this.stats;
  }

  async saveReport(filePath: string): Promise<void> {
    const report = this.generateReport();
    await fs.writeFile(filePath, report, 'utf-8');
  }

  private generateReport(): string {
    const stats = this.finalize();
    const duration = stats.endTime ? 
      (stats.endTime.getTime() - stats.startTime.getTime()) / 1000 : 0;
    
    return `Generation Statistics:
- Articles: ${stats.articlesProcessed}
- Recipes: ${stats.recipesProcessed}  
- Images: ${stats.imagesProcessed}
- Broken Links: ${stats.brokenLinks}
- Duration: ${duration}s`;
  }
}