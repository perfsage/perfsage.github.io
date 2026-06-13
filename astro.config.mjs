import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const blogDir = join(process.cwd(), 'src/content/blog');
const blogLastmod = {};

for (const file of readdirSync(blogDir)) {
  if (!file.endsWith('.md')) continue;
  const raw = readFileSync(join(blogDir, file), 'utf8');
  if (/draft:\s*true/.test(raw)) continue;

  const slug = file.replace(/\.mdx?$/, '');
  const updated = raw.match(/updatedDate:\s*([^\n]+)/)?.[1]?.trim();
  const published = raw.match(/pubDate:\s*([^\n]+)/)?.[1]?.trim();
  const dateStr = updated || published;
  if (dateStr) {
    blogLastmod[`https://perfsage.com/blog/${slug}/`] = new Date(dateStr).toISOString();
  }
}

// Custom domain; GitHub Pages serves from repo root of user/org site.
export default defineConfig({
  site: 'https://perfsage.com',
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      serialize(item) {
        const lastmod = blogLastmod[item.url];
        if (lastmod) {
          return { ...item, lastmod };
        }
        return item;
      },
    }),
  ],
});
