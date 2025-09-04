#!/usr/bin/env tsx
import fs from 'fs/promises';
import path from 'path';

async function copyMiniSearch() {
  const src = path.join(process.cwd(), 'node_modules', 'minisearch', 'dist', 'es', 'index.js');
  const dest = path.join(process.cwd(), 'public', 'js', 'minisearch.esm.js');
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(src, dest);
  console.log(`Copied MiniSearch → ${dest}`);
}

copyMiniSearch().catch(err => { console.error(err); process.exit(1); });
