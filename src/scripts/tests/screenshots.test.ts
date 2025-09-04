import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

test.describe('Visual screenshots', () => {
  test('capture key pages at mobile and desktop', async ({ page }) => {
    const outDir = path.join(process.cwd(), 'screenshots');
    ensureDir(outDir);

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:8080');
    await page.screenshot({ path: path.join(outDir, 'home-mobile.png'), fullPage: true });
    // Ensure nav is single-line: all links share same top
    const tops = await page.$$eval('nav.nav a', els => els.map(el => (el as HTMLElement).getBoundingClientRect().top));
    if (new Set(tops.map(t => Math.round(t))).size !== 1) {
      throw new Error('Nav wrapped to multiple lines on mobile viewport');
    }
    await page.goto('http://localhost:8080/artikel.html');
    await page.screenshot({ path: path.join(outDir, 'artikel-mobile.png'), fullPage: true });
    await page.goto('http://localhost:8080/rezepte.html');
    await page.screenshot({ path: path.join(outDir, 'rezepte-mobile.png'), fullPage: true });

    // Desktop
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('http://localhost:8080');
    await page.screenshot({ path: path.join(outDir, 'home-desktop.png'), fullPage: true });
    await page.goto('http://localhost:8080/artikel.html');
    await page.screenshot({ path: path.join(outDir, 'artikel-desktop.png'), fullPage: true });
    await page.goto('http://localhost:8080/rezepte.html');
    await page.screenshot({ path: path.join(outDir, 'rezepte-desktop.png'), fullPage: true });
  });
});
