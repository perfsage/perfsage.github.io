import { expect, test } from '@playwright/test';

test.describe('Navigation', () => {
  test('in-page anchor navigates to plugin section', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Explore Plugin/i }).click();
    await expect(page).toHaveURL(/#plugin$/);
    await expect(page.locator('#plugin')).toBeInViewport();
  });

  test('external links opened in new tab use noopener noreferrer', async ({ page }) => {
    await page.goto('/');
    const links = page.locator('a[target="_blank"][href^="http"]');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const href = await link.getAttribute('href');
      const rel = (await link.getAttribute('rel')) ?? '';
      expect(rel, href ?? '').toMatch(/noopener/);
      expect(rel, href ?? '').toMatch(/noreferrer/);
    }
  });

  test('legacy docs.html redirects to docs', async ({ page }) => {
    await page.goto('/docs.html', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/docs\/?$/);
  });

  test('legacy changelog.html redirects to changelog', async ({ page }) => {
    await page.goto('/changelog.html', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/changelog\/?$/);
  });
});
