import { expect, test } from '@playwright/test';

test.describe('Smoke', () => {
  test('home — loads with title, hero h1, tools section, footer', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await expect(page).toHaveTitle(/PerfSage/i);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Blazing Fast/i);
    await expect(page.locator('#tools')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();

    expect(errors, `Console errors on home: ${errors.join('; ')}`).toEqual([]);
  });

  test('about — loads title and Aashish Bajpai heading', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/about/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/About/i);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Aashish Bajpai/i);
    await expect(page.getByRole('contentinfo')).toBeVisible();
    expect(errors, `Console errors on about: ${errors.join('; ')}`).toEqual([]);
  });

  test('contact — loads title, hero heading and email button', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/contact/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Contact/i);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Fast/i);
    await expect(page.getByRole('button', { name: /Open in Email Client/i })).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    expect(errors, `Console errors on contact: ${errors.join('; ')}`).toEqual([]);
  });

  test('blog index — loads with heading and at least one post card', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/blog/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Blog.*PerfSage/i);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Blog/i);
    await expect(page.locator('.blog-card').first()).toBeVisible();
    expect(errors, `Console errors on blog index: ${errors.join('; ')}`).toEqual([]);
  });

  test('blog post — loads with title and prose content', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/blog/public-api-bakeoff-with-perfsage-slo-reporter/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/JMeter.*SLOs|SLOs.*JMeter|PerfSage Blog/i);
    await expect(page.locator('.prose')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    expect(errors, `Console errors on blog post: ${errors.join('; ')}`).toEqual([]);
  });

  test('home — recent posts section is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('From the Blog')).toBeVisible();
    await expect(page.locator('.blog-grid .blog-card').first()).toBeVisible();
  });

  test('docs — still loads (legacy page)', async ({ page }) => {
    await page.goto('/docs/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Documentation/i);
  });

  test('changelog — still loads (legacy page)', async ({ page }) => {
    await page.goto('/changelog/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Changelog/i);
  });
});
