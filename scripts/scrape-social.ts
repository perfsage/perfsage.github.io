import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

type ScrapeResult = {
  github?: {
    ogDescription?: string | null;
    ogImage?: string | null;
    location?: string | null;
  };
  thinkbits?: {
    metaDescription?: string | null;
    aboutMe?: string | null;
    topmateUrl?: string | null;
  };
  links?: {
    linkedin?: string;
    x?: string;
    instagram?: string;
    facebook?: string;
  };
  errors?: Record<string, string>;
};

const outPath = path.join('src', 'content', 'scraped-profile.json');

async function safeEvaluate(page: any, fn: string) {
  try {
    return await page.evaluate(fn);
  } catch {
    return null;
  }
}

async function main() {
  const result: ScrapeResult = {
    links: {
      linkedin: 'https://www.linkedin.com/in/aashu320',
      x: 'https://x.com/aashu320',
      instagram: 'https://www.instagram.com/aashu320',
      facebook: 'https://www.facebook.com/aashish.bajpai.52',
    },
    errors: {},
  };

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  const targets: Array<{ key: string; url: string; onExtract: () => Promise<void> }> = [
    {
      key: 'github',
      url: 'https://github.com/perfsage',
      onExtract: async () => {
        await page.goto('https://github.com/perfsage', { waitUntil: 'domcontentloaded', timeout: 45_000 });
        const extracted = await safeEvaluate(
          page,
          `(() => {
            const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content') ?? null;
            const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? null;
            // Location is inconsistently rendered; try a best-effort selector.
            const loc =
              document.querySelector('[data-testid="profile-location"]')?.textContent?.trim() ??
              null;
            return { ogDescription: ogDesc, ogImage, location: loc };
          })`,
        );
        result.github = extracted ?? undefined;
      },
    },
    {
      key: 'thinkbits',
      url: 'https://thinkbits.org/',
      onExtract: async () => {
        await page.goto('https://thinkbits.org/', { waitUntil: 'domcontentloaded', timeout: 45_000 });
        const extracted = await safeEvaluate(
          page,
          `(() => {
            const meta = document.querySelector('meta[name="description"]')?.getAttribute('content') ?? null;
            const topmate = document.querySelector('a[href^="https://topmate.io/"]')?.getAttribute('href') ?? null;
            const aboutHeading = Array.from(document.querySelectorAll('h1,h2,h3')).find((h) => {
              return (h.textContent || '').trim().toLowerCase() === 'about me';
            });
            let aboutMe = null;
            if (aboutHeading) {
              // WordPress themes usually put the about paragraph right after the heading.
              const container = aboutHeading.closest('section') || aboutHeading.parentElement;
              const ps = container ? Array.from(container.querySelectorAll('p')) : [];
              const best = ps.find((p) => (p.textContent || '').trim().length > 60) ?? ps[0] ?? null;
              aboutMe = best ? (best.textContent || '').trim().replace(/\\s+/g, ' ') : null;
            }
            return { metaDescription: meta, aboutMe, topmateUrl: topmate };
          })`,
        );
        result.thinkbits = extracted ?? undefined;
      },
    },
  ];

  for (const t of targets) {
    try {
      await t.onExtract();
    } catch (e: any) {
      result.errors ||= {};
      result.errors[t.key] = e?.message ?? 'unknown error';
    }
  }

  await browser.close();

  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

