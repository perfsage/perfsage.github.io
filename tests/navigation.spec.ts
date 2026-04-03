import { expect, test } from '@playwright/test';

test.describe('Navigation', () => {
  test('nav links are present on home', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
    await expect(page.getByRole('link', { name: /About/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Contact/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /GitHub/i }).first()).toBeVisible();
  });

  test('about nav link navigates to about page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'About', exact: true }).click();
    await expect(page).toHaveURL(/\/about\//);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Aashish/i);
  });

  test('contact nav link navigates to contact page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Contact', exact: true }).click();
    await expect(page).toHaveURL(/\/contact\//);
  });

  test('hero CTA "Explore Tools" anchor targets #tools section', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Explore Tools/i }).click();
    await expect(page).toHaveURL(/#tools/);
    await expect(page.locator('#tools')).toBeInViewport();
  });

  test('external links use noopener noreferrer', async ({ page }) => {
    for (const path of ['/', '/about/', '/contact/']) {
      await page.goto(path);
      const links = page.locator('a[target="_blank"][href^="http"]');
      const count = await links.count();
      for (let i = 0; i < count; i++) {
        const link = links.nth(i);
        const href = await link.getAttribute('href');
        const rel = (await link.getAttribute('rel')) ?? '';
        expect(rel, `Missing noopener on ${href} at ${path}`).toMatch(/noopener/);
        expect(rel, `Missing noreferrer on ${href} at ${path}`).toMatch(/noreferrer/);
      }
    }
  });

  test('active nav link is highlighted on about page', async ({ page }) => {
    await page.goto('/about/');
    const activeLink = page.locator('.nav-link--active');
    await expect(activeLink).toBeVisible();
    await expect(activeLink).toContainText(/About/i);
  });

  test('active nav link is highlighted on contact page', async ({ page }) => {
    await page.goto('/contact/');
    const activeLink = page.locator('.nav-link--active');
    await expect(activeLink).toBeVisible();
    await expect(activeLink).toContainText(/Contact/i);
  });

  test('legacy docs.html redirects', async ({ page }) => {
    await page.goto('/docs.html', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/docs\//);
  });

  test('legacy changelog.html redirects', async ({ page }) => {
    await page.goto('/changelog.html', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/changelog\//);
  });
});
