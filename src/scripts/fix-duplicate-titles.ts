#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { exec as _exec } from 'child_process';
import { promisify } from 'util';

const exec = promisify(_exec);

async function listProblemFiles(): Promise<string[]> {
  const { stdout } = await exec("rg -l '^title: .* title:' src/data");
  return stdout.split('\n').map(s => s.trim()).filter(Boolean);
}

function extractFrontmatterBounds(lines: string[]): { start: number; end: number } | null {
  if (lines[0]?.trim() !== '---') return null;
  const end = lines.findIndex((l, i) => i > 0 && l.trim() === '---');
  if (end === -1) return null;
  return { start: 0, end };
}

function dedupeTrailingWord(s: string): string {
  const words = s.trim().split(/\s+/);
  while (words.length >= 2) {
    const last = words[words.length - 1];
    const prev = words[words.length - 2];
    if (last.toLowerCase() === prev.toLowerCase()) {
      words.pop();
    } else {
      break;
    }
  }
  return words.join(' ');
}

function sanitizeTitleFromLine(line: string): string {
  // Prefer the last quoted title occurrence
  const quotedMatches = [...line.matchAll(/title:\s*"([^"]+)"/g)].map(m => m[1]);
  let chosen: string;
  if (quotedMatches.length > 0) {
    chosen = quotedMatches[quotedMatches.length - 1];
  } else {
    // Fallback: take substring after last 'title:' token
    const idx = line.lastIndexOf('title:');
    chosen = line.slice(idx + 'title:'.length).trim();
    // Strip surrounding quotes if present
    if ((chosen.startsWith('"') && chosen.endsWith('"')) || (chosen.startsWith("'") && chosen.endsWith("'"))) {
      chosen = chosen.slice(1, -1);
    }
  }

  // Remove embedded occurrences of 'title:' that slipped into the chosen value
  chosen = chosen.replace(/\s*title:\s*/gi, ' ').replace(/\s{2,}/g, ' ').trim();

  // Heuristic cleanup of duplicated trailing words
  chosen = dedupeTrailingWord(chosen);

  return `title: "${chosen.replace(/"/g, '\\"')}"`;
}

async function fixFile(file: string): Promise<boolean> {
  const content = await fs.readFile(file, 'utf-8');
  const lines = content.split(/\r?\n/);
  const fm = extractFrontmatterBounds(lines);
  if (!fm) return false;
  const titleIdx = lines.slice(fm.start + 1, fm.end).findIndex(l => l.startsWith('title:'));
  if (titleIdx === -1) return false;
  const absoluteIdx = fm.start + 1 + titleIdx;
  const original = lines[absoluteIdx];
  if (!/^title: .* title:/i.test(original)) return false;

  const cleaned = sanitizeTitleFromLine(original);
  if (cleaned !== original) {
    lines[absoluteIdx] = cleaned;
    await fs.writeFile(file, lines.join('\n'));
    console.log(`Fixed ${path.relative(process.cwd(), file)}\n  - ${original}\n  + ${cleaned}`);
    return true;
  }
  return false;
}

async function main() {
  const files = await listProblemFiles();
  let fixed = 0;
  for (const f of files) {
    try {
      if (await fixFile(f)) fixed++;
    } catch (e) {
      console.error(`Failed to fix ${f}:`, e);
    }
  }
  console.log(`\nDone. Fixed ${fixed} files.`);
}

main();
