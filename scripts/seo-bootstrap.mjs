#!/usr/bin/env node
/**
 * Ping search engines and IndexNow after deploy.
 * Run: npm run seo:bootstrap
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SITE = 'https://perfsage.com';
const SITEMAP = `${SITE}/sitemap-index.xml`;
const INDEXNOW_KEY = 'perfsage2026indexnow';
const INDEXNOW_KEY_LOCATION = `${SITE}/${INDEXNOW_KEY}.txt`;

async function fetchUrlsFromSitemap() {
  const res = await fetch(SITEMAP);
  if (!res.ok) throw new Error(`Sitemap fetch failed: ${res.status}`);
  const xml = await res.text();
  const indexMatch = xml.match(/<loc>([^<]+sitemap-\d+\.xml)<\/loc>/);
  if (!indexMatch) return [SITE + '/'];

  const childRes = await fetch(indexMatch[1]);
  if (!childRes.ok) throw new Error(`Child sitemap fetch failed: ${childRes.status}`);
  const childXml = await childRes.text();
  return [...childXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

async function ping(url, label) {
  try {
    const res = await fetch(url, { method: 'GET' });
    console.log(`${label}: ${res.status} ${res.statusText}`);
    return res.ok;
  } catch (err) {
    console.error(`${label}: ${err.message}`);
    return false;
  }
}

async function submitIndexNow(urls) {
  const host = new URL(SITE).hostname;
  const body = {
    host,
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_LOCATION,
    urlList: urls.slice(0, 10000),
  };
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  console.log(`IndexNow: ${res.status} ${res.statusText}`);
  return res.ok || res.status === 202;
}

function printManualSteps() {
  console.log(`
── Manual steps (required for Google traffic) ──

1. Google Search Console: https://search.google.com/search-console
   - Add property: perfsage.com
   - Verify via HTML tag → copy token → set PUBLIC_GOOGLE_SITE_VERIFICATION in GitHub Secrets
   - Submit sitemap: ${SITEMAP}

2. Bing Webmaster Tools: https://www.bing.com/webmasters
   - Add site, verify, submit same sitemap

3. Analytics (measure what works):
   - Plausible (privacy-friendly): https://plausible.io → set PUBLIC_PLAUSIBLE_DOMAIN
   - Or GA4 → set PUBLIC_GA_MEASUREMENT_ID

4. Distribution (week 1):
   - Cross-post Field Notes to Dev.to + LinkedIn (personal + company)
   - Show HN / Reddit r/devops for Reveal or SignalPilot launch
   - Add perfsage.com link to GitHub repo READMEs (reveal, signalpilot, slo-reporter)

5. LinkedIn company page: npm run linkedin:apply (update About with SignalPilot)
`);
}

async function main() {
  console.log('PerfSage SEO bootstrap\n');

  const urls = await fetchUrlsFromSitemap();
  console.log(`Found ${urls.length} URLs in sitemap\n`);

  await ping(`https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP)}`, 'Bing sitemap ping');
  await submitIndexNow(urls);

  printManualSteps();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
