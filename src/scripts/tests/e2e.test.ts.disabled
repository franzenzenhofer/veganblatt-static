import { test, expect } from '@playwright/test';

test.describe('VeganBlatt E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
  });

  test('homepage loads with correct structure', async ({ page }) => {
    await expect(page).toHaveTitle(/VeganBlatt/);
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('.logo')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Willkommen');
  });

  test('navigation works', async ({ page }) => {
    await page.click('nav a[href="/articles.html"]');
    await expect(page).toHaveURL(/articles\.html/);
    await expect(page.locator('h1')).toContainText('Artikel');
  });

  test('articles page has images with correct size', async ({ page }) => {
    await page.goto('http://localhost:8080/articles.html');
    const images = page.locator('.article-list img');
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
    
    for (let i = 0; i < Math.min(5, count); i++) {
      const width = await images.nth(i).getAttribute('width');
      expect(width).toBe('80');
    }
  });

  test('recipes page loads', async ({ page }) => {
    await page.goto('http://localhost:8080/recipes.html');
    await expect(page.locator('h1')).toContainText('Rezepte');
    const items = page.locator('.article-list li');
    expect(await items.count()).toBeGreaterThan(0);
  });

  test('links are green and underlined', async ({ page }) => {
    const link = page.locator('.article-link').first();
    const color = await link.evaluate(el => 
      window.getComputedStyle(el).color
    );
    expect(color).toContain('119, 161, 30'); // RGB for #76A11E
    
    const textDecoration = await link.evaluate(el => 
      window.getComputedStyle(el).textDecoration
    );
    expect(textDecoration).toContain('underline');
  });

  test('nav stays single-line on mobile (no wrap)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('http://localhost:8080');
    const tops = await page.$$eval('nav.nav a', (els) => els.map(el => (el as HTMLElement).getBoundingClientRect().top));
    // All links share the same top position if not wrapped
    expect(new Set(tops.map(t => Math.round(t))).size).toBe(1);
  });

  test('mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:8080');
    
    const main = page.locator('main');
    const width = await main.evaluate((el: HTMLElement) => el.offsetWidth);
    expect(width).toBeLessThanOrEqual(375);
  });

  test('no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:8080');
    await page.goto('http://localhost:8080/articles.html');
    await page.goto('http://localhost:8080/recipes.html');
    
    expect(errors).toHaveLength(0);
  });

  test('performance metrics', async ({ page }) => {
    await page.goto('http://localhost:8080');
    
    const metrics = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
        loadComplete: perf.loadEventEnd - perf.loadEventStart
      };
    });
    
    expect(metrics.domContentLoaded).toBeLessThan(1000);
    expect(metrics.loadComplete).toBeLessThan(2000);
  });
});
