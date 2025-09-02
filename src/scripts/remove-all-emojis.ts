#!/usr/bin/env node --loader tsx

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Remove ALL emojis from the entire static site generator
 */
class EmojiRemover {
  private replacements = 0;
  
  // Comprehensive emoji removal regex
  private emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F191}-\u{1F251}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F170}-\u{1F171}]|[\u{1F17E}-\u{1F17F}]|[\u{1F18E}]|[\u{1F201}-\u{1F20F}]|[\u{1F21A}]|[\u{1F22F}]|[\u{1F232}-\u{1F23A}]|[\u{1F250}-\u{1F251}]|[\u{203C}]|[\u{2049}]|[\u{2139}]|[\u{2194}-\u{2199}]|[\u{21A9}-\u{21AA}]|[\u{231A}-\u{231B}]|[\u{2328}]|[\u{23CF}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{24C2}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]/gu;

  async run(): Promise<void> {
    console.log('Removing ALL emojis from static site generator...\n');
    
    // Update generate-site.ts
    await this.removeEmojisFromFile(
      path.join(__dirname, 'generate-site.ts'),
      {
        ' Starting': 'Starting',
        '🧹 Cleaning': 'Cleaning',
        '📷 Loading': 'Loading',
        '📄 Processing articles': 'Processing articles',
        '🍽 Processing recipes': 'Processing recipes',
        '🏠 Generating': 'Generating',
        ' Generating': 'Generating',
        ' Copying': 'Copying',
        ' Generation': 'Generation',
        ' Error': 'Error',
        ' Loaded': 'Loaded',
        '🚫 QUARANTINED': 'QUARANTINED',
        '🚫 REMOVED': 'REMOVED',
        '📄 ': '',
        '🍽 ': '',
        '🌱 ': '',
        '📚 ': '',
        'ℹ ': '',
        '✓ ': '* '
      }
    );
    
    console.log(`\nTotal replacements: ${this.replacements}`);
    console.log('Emoji removal complete!');
  }

  private async removeEmojisFromFile(filePath: string, replacements: Record<string, string>): Promise<void> {
    try {
      let content = await fs.readFile(filePath, 'utf-8');
      const originalContent = content;
      
      // Apply specific replacements
      for (const [find, replace] of Object.entries(replacements)) {
        const before = content.length;
        content = content.split(find).join(replace);
        if (content.length !== before) {
          this.replacements++;
          console.log(`  Replaced: "${find}" -> "${replace}"`);
        }
      }
      
      // Remove any remaining emojis
      const beforeGeneral = content;
      content = content.replace(this.emojiRegex, '');
      if (content !== beforeGeneral) {
        console.log('  Removed remaining emojis');
        this.replacements++;
      }
      
      if (content !== originalContent) {
        await fs.writeFile(filePath, content, 'utf-8');
        console.log(`Updated: ${path.basename(filePath)}`);
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  }
}

// Run the emoji remover
const remover = new EmojiRemover();
remover.run().catch(console.error);