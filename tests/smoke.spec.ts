import { expect, test } from '@playwright/test';

test.describe('Smoke', () => {
  test('home loads with hero and key sections', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await expect(page).toHaveTitle(/PerfSage/i);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Engineering with AI/i);
    await expect(page.locator('#features')).toBeVisible();
    await expect(page.locator('#plugin')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();

    expect(errors, `Console errors: ${errors.join('; ')}`).toEqual([]);
  });

  test('docs page loads', async ({ page }) => {
    await page.goto('/docs/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Documentation/i);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Documentation');
  });

  test('changelog page loads', async ({ page }) => {
    await page.goto('/changelog/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Changelog/i);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Changelog');
  });
});
