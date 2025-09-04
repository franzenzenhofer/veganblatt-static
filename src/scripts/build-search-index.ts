#!/usr/bin/env tsx
import fs from 'fs/promises';
import path from 'path';
// Build-time only MiniSearch import
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import MiniSearch from 'minisearch';

async function readText(filePath: string): Promise<string> {
  const html = await fs.readFile(filePath, 'utf-8');
  const lower = html.toLowerCase();
  const get = (tag: string): string => {
    const open = lower.indexOf('<' + tag);
    if (open === -1) return '';
    const endTag = `</${tag}>`;
    const close = lower.indexOf(endTag, open);
    if (close === -1) return '';
    const startContent = html.indexOf('>', open) + 1;
    if (startContent <= 0) return '';
    return html.slice(startContent, close);
  };
  const main = get('main') || get('article') || get('body') || '';
  const text = main
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const titleRaw = get('title');
  const title = titleRaw ? titleRaw.trim() : '';
  return JSON.stringify({ title, text });
}

async function build() {
  const root = path.join(process.cwd(), 'public');
  const sections = [
    { dir: 'a', prefix: '/a/' },
    { dir: 'r', prefix: '/r/' }
  ];
  const docs: { id: string; url: string; title: string; text: string }[] = [];
  for (const s of sections) {
    const dir = path.join(root, s.dir);
    let files: string[] = [];
    try { files = await fs.readdir(dir); } catch { files = []; }
    for (const f of files.filter(f => f.endsWith('.html'))) {
      const full = path.join(dir, f);
      const meta = JSON.parse(await readText(full));
      const url = `${s.prefix}${f}`;
      docs.push({ id: url, url, title: meta.title, text: meta.text });
    }
  }

  // Also index index.html, artikel.html, rezepte.html (lightly)
  for (const f of ['index.html', 'artikel.html', 'rezepte.html', 'impressum.html']) {
    const full = path.join(root, f);
    try {
      const meta = JSON.parse(await readText(full));
      const url = `/${f}`;
      docs.push({ id: url, url, title: meta.title, text: meta.text });
    } catch {}
  }

  // Build MiniSearch index
  const mini = new MiniSearch({
    fields: ['title', 'text'],
    storeFields: ['title', 'url'],
    searchOptions: { boost: { title: 3 }, fuzzy: 0.2, prefix: true }
  });
  mini.addAll(docs);
  const out = path.join(root, 'search-index.json');
  await fs.writeFile(out, JSON.stringify(mini.toJSON()));
  console.log(`Indexed ${docs.length} pages → ${out}`);
}

build().catch(err => { console.error(err); process.exit(1); });
