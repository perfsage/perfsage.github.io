import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Custom domain; GitHub Pages serves from repo root of user/org site.
export default defineConfig({
  site: 'https://perfsage.com',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
