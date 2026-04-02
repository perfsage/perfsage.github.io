import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const urlArg = process.argv[2];
if (!urlArg) {
  console.error('Usage: npm run analyze-site -- <url>');
  process.exit(1);
}

let target: URL;
try {
  target = new URL(urlArg);
} catch {
  console.error('Invalid URL:', urlArg);
  process.exit(1);
}

const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
const outDir = path.join('artifacts', 'site-analysis', stamp);

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  await page.goto(target.href, { waitUntil: 'networkidle', timeout: 90_000 });
  await page.screenshot({ path: path.join(outDir, 'full.png'), fullPage: true });

  // String body avoids tsx/esbuild injecting helpers (e.g. `__name`) into the browser context.
  const landmarks = await page.evaluate(`() => {
    function pickText(sel) {
      return Array.from(document.querySelectorAll(sel))
        .map(function (el) {
          return (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 120);
        })
        .filter(function (t) { return !!t; })
        .slice(0, 10);
    }
    var meta = document.querySelector('meta[name="description"]');
    var canonical = document.querySelector('link[rel="canonical"]');
    var body = document.body;
    var cs = getComputedStyle(body);
    return {
      title: document.title,
      description: meta ? meta.getAttribute('content') : null,
      canonical: canonical ? canonical.getAttribute('href') : null,
      h1: pickText('h1'),
      h2: pickText('h2'),
      typography: {
        bodyFontFamily: cs.fontFamily,
        bodyFontSize: cs.fontSize,
        bodyColor: cs.color,
        bodyBackgroundColor: cs.backgroundColor
      }
    };
  }`);

  const notesPath = path.join(outDir, 'notes.md');
  await writeFile(
    notesPath,
    [
      `# Site analysis`,
      ``,
      `- URL: ${target.href}`,
      `- Captured: ${new Date().toISOString()}`,
      ``,
      `## Extracted`,
      ``,
      '```json',
      JSON.stringify(landmarks, null, 2),
      '```',
      ``,
    ].join('\n'),
    'utf8',
  );

  await browser.close();
  console.log(`Wrote ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
