#!/usr/bin/env tsx
import fs from 'fs/promises';
import path from 'path';

async function run() {
  const rezeptePath = path.join(process.cwd(), 'public', 'rezepte.html');
  const html = await fs.readFile(rezeptePath, 'utf-8');
  const m = html.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g);
  if (!m) throw new Error('No JSON-LD found on rezepte.html');
  const found = m.some(block => {
    try {
      const json = JSON.parse(block.replace(/^[\s\S]*?>/, '').replace(/<\/script>$/, ''));
      return json['@type'] === 'ItemList' && Array.isArray(json.itemListElement) && json.itemListElement.length > 0;
    } catch { return false; }
  });
  if (!found) throw new Error('ItemList JSON-LD not found or invalid on rezepte.html');
  console.log('✅ ItemList JSON-LD present on rezepte.html');
}

run().catch(err => { console.error(err); process.exit(1); });

