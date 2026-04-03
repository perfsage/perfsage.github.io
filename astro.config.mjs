import { defineConfig } from 'astro/config';

// Custom domain; GitHub Pages serves from repo root of user/org site.
export default defineConfig({
  site: 'https://perfsage.com',
  output: 'static',
  trailingSlash: 'always',
});
