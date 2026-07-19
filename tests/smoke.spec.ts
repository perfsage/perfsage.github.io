import { expect, test } from '@playwright/test';

test.describe('Smoke', () => {
  test('home — loads with title, hero h1, announcement, footer', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await expect(page).toHaveTitle(/PerfSage/i);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Blazing Fast/i);
    await expect(page.getByRole('region', { name: 'Product announcement' })).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();

    expect(errors, `Console errors on home: ${errors.join('; ')}`).toEqual([]);
  });

  test('signalpilot landing — loads with K8s RCA title and GitHub CTA', async ({ page }) => {
    await page.goto('/signalpilot/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/SignalPilot|Kubernetes RCA/i);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Kubernetes RCA/i);
    await expect(page.getByRole('main').getByRole('link', { name: /View on GitHub/i })).toHaveAttribute(
      'href',
      /github\.com\/perfsage\/signalpilot/,
    );
  });

  test('reveal landing — loads with JMeter title and H1', async ({ page }) => {
    await page.goto('/reveal/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Reveal|JMeter/i);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/JMeter JTL/i);
  });

  test('blog post — has article schema and non-logo og:image', async ({ page }) => {
    await page.goto('/blog/introducing-perfsage-reveal-jmeter-analysis/', { waitUntil: 'domcontentloaded' });
    const ogType = await page.locator('meta[property="og:type"]').getAttribute('content');
    expect(ogType).toBe('article');
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toBeTruthy();
    expect(ogImage).not.toContain('perfsage-logo.png');
    const ldJson = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(ldJson).toContain('BlogPosting');
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
    await expect(page).toHaveTitle(/Performance Engineering Blog|Blog.*PerfSage/i);
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

  test('blog post — SignalPilot CPU/memory sizing Field Notes loads', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/blog/cpu-memory-sizing-from-real-usage-signalpilot/', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page).toHaveTitle(/CPU|Memory|Sizing|SignalPilot|PerfSage Blog/i);
    await expect(page.locator('.prose')).toBeVisible();
    await expect(page.getByText('Field Notes #8 · TL;DR')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    expect(errors, `Console errors on sizing blog post: ${errors.join('; ')}`).toEqual([]);
  });

  test('blog post — article body is visible without scrolling (no reveal trap)', async ({ page }) => {
    await page.goto('/blog/the-p99-trap-why-your-load-test-passed-production-failed/', {
      waitUntil: 'domcontentloaded',
    });
    const prose = page.locator('article.prose');
    await expect(prose).toBeVisible();
    await expect(prose.getByRole('heading', { name: /stand-up that didn/i })).toBeVisible();
    const opacity = await prose.evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(opacity)).toBeGreaterThan(0.9);
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

  test('blog post — related Field Notes section when tags overlap', async ({ page }) => {
    await page.goto('/blog/introducing-perfsage-reveal-jmeter-analysis/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Related Field Notes' })).toBeVisible();
    await expect(page.locator('.related-posts__link').first()).toBeVisible();
  });

  test('blog index — product ladder links to reveal and signalpilot', async ({ page }) => {
    await page.goto('/blog/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: /Reveal — JMeter JTL/i })).toHaveAttribute('href', '/reveal/');
    await expect(page.getByRole('link', { name: /SignalPilot — K8s RCA/i })).toHaveAttribute(
      'href',
      '/signalpilot/',
    );
  });

  test('changelog — still loads (legacy page)', async ({ page }) => {
    await page.goto('/changelog/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Changelog/i);
  });

  test('blog RSS — serves valid feed with latest post', async ({ page }) => {
    const res = await page.goto('/blog/rss.xml', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);
    const body = await page.content();
    expect(body).toMatch(/<rss[^>]*version="2\.0"/);
    expect(body).toContain('PerfSage Field Notes');
    expect(body).toContain('why-im-building-signalpilot-kubernetes-rca');
  });

  test('llms.txt — discovery file is live', async ({ page }) => {
    const res = await page.goto('/llms.txt', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);
    const body = await page.locator('body').innerText();
    expect(body).toContain('perfsage.com');
    expect(body).toContain('SignalPilot');
  });

  test('home — Google Search Console verification meta tag', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const content = await page
      .locator('meta[name="google-site-verification"]')
      .getAttribute('content');
    expect(content).toBe('ptC-auIvLW7i43hQqm9iy4LANvZfHs55_QoyTRMeqAM');
  });

  test('home — GA4 analytics script', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const script = page.locator('script[src*="googletagmanager.com/gtag/js"]');
    await expect(script).toHaveAttribute('src', 'https://www.googletagmanager.com/gtag/js?id=G-ZWZG6CS3G3');
  });
});
