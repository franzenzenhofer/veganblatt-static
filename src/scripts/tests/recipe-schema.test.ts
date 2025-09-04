#!/usr/bin/env tsx
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

async function parseJsonLd(html: string): Promise<any[]> {
  const scripts = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  const arr: any[] = [];
  for (const m of scripts) {
    try {
      const json = JSON.parse(m[1]);
      if (Array.isArray(json)) json.forEach(j => arr.push(j));
      else arr.push(json);
    } catch {
      // ignore parse failures
    }
  }
  return arr;
}

function isAbsolute(url?: string) {
  return !!url && /^https?:\/\//i.test(url);
}

async function testRecipeSchema() {
  const publicDir = path.join(process.cwd(), 'public');
  const files = await glob('r/*.html', { cwd: publicDir });
  if (files.length === 0) {
    console.error('No recipe pages found under public/r');
    process.exit(1);
  }

  const sample = files.slice(0, Math.min(3, files.length));
  for (const f of sample) {
    const html = await fs.readFile(path.join(publicDir, f), 'utf-8');
    const jsonld = await parseJsonLd(html);
    const recipe = jsonld.find(j => j['@type'] === 'Recipe');
    if (!recipe) {
      throw new Error(`Recipe JSON-LD missing in ${f}`);
    }
    // Required properties for Google Recipe rich result
    const mustHave = ['name', 'image', 'recipeIngredient', 'recipeInstructions'];
    for (const k of mustHave) {
      if (!recipe[k] || (Array.isArray(recipe[k]) && recipe[k].length === 0)) {
        throw new Error(`Missing required property '${k}' in ${f}`);
      }
    }
    if (!isAbsolute(recipe.image)) {
      throw new Error(`Image must be absolute URL in ${f}`);
    }
    if (!recipe.mainEntityOfPage || typeof recipe.mainEntityOfPage !== 'string') {
      throw new Error(`mainEntityOfPage missing in ${f}`);
    }
    // Instructions should be HowToStep objects with text
    if (!Array.isArray(recipe.recipeInstructions) || !recipe.recipeInstructions.every((s: any) => s['@type'] === 'HowToStep' && !!s.text)) {
      throw new Error(`recipeInstructions should be HowToStep array with text in ${f}`);
    }
  }
  console.log(`✅ Recipe schema JSON-LD valid for ${sample.length} recipe pages`);
}

testRecipeSchema().catch(err => { console.error(err); process.exit(1); });

