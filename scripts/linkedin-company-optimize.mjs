#!/usr/bin/env node
/**
 * Optimize PerfSage LinkedIn company page via CDP.
 *
 * Connection modes (first match wins):
 * 1. BROWSER_URL=http://127.0.0.1:9333  — automation Chrome (see npm run linkedin:chrome)
 * 2. Chrome DevToolsActivePort websocket — your open Chrome session
 *
 * Usage:
 *   node scripts/linkedin-company-optimize.mjs audit
 *   node scripts/linkedin-company-optimize.mjs apply
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const MODE = process.argv[2] || 'audit';
const COMPANY_ID = '115801924';
const ADMIN_DASHBOARD = `https://www.linkedin.com/company/${COMPANY_ID}/admin/dashboard/`;
const EDIT_PAGE = `https://www.linkedin.com/company/${COMPANY_ID}/admin/page-info/`;

export const BRAND = {
  tagline:
    'AI-powered performance engineering — JMeter plugins, SLO tooling & reliability patterns for blazing-fast systems.',
  about: `PerfSage helps performance engineers, SREs, and platform teams turn load-test data into decisions — not just dashboards.

We build open-source JMeter tooling, Kubernetes RCA, and SRE-grade reliability patterns so performance, availability, and observability work together in production.

What we build & share:
• PerfSage Reveal — upload a JTL, get expert charts, SLO verdicts & actionable insights in one Docker command
• PerfSage SignalPilot — open-source Kubernetes RCA after deploy (correlate events, metrics, logs, git)
• Open-source JMeter plugins — SLO Reporter for CI gates on p99, error rate, throughput
• SLO/SLI patterns — error budgets, percentile checks, and telemetry clarity
• Chaos engineering — fault injection strategies that build real confidence in failure modes
• Field notes & deep guides at perfsage.com/blog

Founded by Aashish Bajpai — 9+ years in performance engineering & SRE at VMware, EY, Oracle and beyond. AWS Solutions Architect. Gremlin Certified Chaos Engineer.

🔗 perfsage.com · github.com/perfsage · Book mentorship via Topmate`,
  website: 'https://perfsage.com',
  specialties: [
    'Performance Engineering',
    'Load Testing',
    'Apache JMeter',
    'Site Reliability Engineering',
    'SLO/SLI',
    'Chaos Engineering',
    'Observability',
    'Kubernetes',
    'Capacity Planning',
    'AI Test Analysis',
  ],
  hashtags: [
    'PerformanceEngineering',
    'SRE',
    'JMeter',
    'LoadTesting',
    'Observability',
    'ChaosEngineering',
    'DevOps',
    'OpenSource',
    'PerfSage',
  ],
  customButton: { label: 'Visit website', url: 'https://perfsage.com' },
};

async function resolveWsEndpoint() {
  if (process.env.BROWSER_URL) {
    const res = await fetch(`${process.env.BROWSER_URL.replace(/\/$/, '')}/json/version`);
    if (!res.ok) throw new Error(`BROWSER_URL ${process.env.BROWSER_URL} returned ${res.status}`);
    const data = await res.json();
    return data.webSocketDebuggerUrl;
  }
  const portFile = path.join(
    os.homedir(),
    'Library/Application Support/Google/Chrome/DevToolsActivePort',
  );
  const [port, wsPath] = fs
    .readFileSync(portFile, 'utf8')
    .trim()
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  return `ws://127.0.0.1:${port}${wsPath}`;
}

async function connectBrowser() {
  const ws = await resolveWsEndpoint();
  return puppeteer.connect({
    browserWSEndpoint: ws,
    defaultViewport: { width: 1440, height: 900 },
  });
}

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getLinkedInPage(browser) {
  const pages = await browser.pages();
  let page = pages.find((p) => p.url().includes('linkedin.com'));
  if (!page) {
    page = await browser.newPage();
  }
  await page.bringToFront();
  return page;
}

async function clickByText(page, text, { partial = false, timeout = 8000 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const clicked = await page.evaluate(
      (label, isPartial) => {
        const norm = (s) => s.replace(/\s+/g, ' ').trim();
        const target = norm(label).toLowerCase();
        const candidates = [...document.querySelectorAll('a, button, [role="button"], span, div')];
        for (const el of candidates) {
          const t = norm(el.innerText || el.textContent || '').toLowerCase();
          if (!t) continue;
          const match = isPartial ? t.includes(target) : t === target;
          if (match && el.offsetParent !== null) {
            el.click();
            return true;
          }
        }
        return false;
      },
      text,
      partial,
    );
    if (clicked) {
      await wait(2000);
      return true;
    }
    await wait(400);
  }
  return false;
}

async function scrapeCurrentState(page) {
  return page.evaluate(() => {
    const body = document.body.innerText;
    const pick = (re) => {
      const m = body.match(re);
      return m ? m[1].trim() : null;
    };
    return {
      url: location.href,
      title: document.title,
      h1: document.querySelector('h1')?.innerText?.trim() || null,
      tagline: pick(/Tagline\n(.+)/) || pick(/tagline[:\s]+(.+)/i),
      website: pick(/Website\n(.+)/) || pick(/https?:\/\/[^\s]+/),
      industry: pick(/Industry\n(.+)/),
      size: pick(/Company size\n(.+)/) || pick(/(\d+-\d+ employees)/),
      about: (() => {
        const idx = body.indexOf('Overview');
        if (idx === -1) return null;
        return body.slice(idx, idx + 1200);
      })(),
      bodySample: body.slice(0, 10000),
    };
  });
}

async function auditPage(page) {
  await page.goto(ADMIN_DASHBOARD, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await wait(5000);
  const dashboard = await scrapeCurrentState(page);
  await page.screenshot({ path: '/tmp/linkedin-audit-dashboard.png', fullPage: true });

  await clickByText(page, 'View as member');
  await wait(5000);
  const publicView = await scrapeCurrentState(page);
  await page.screenshot({ path: '/tmp/linkedin-audit-public.png', fullPage: true });

  await page.goto(ADMIN_DASHBOARD, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await wait(3000);
  await clickByText(page, 'Edit Page');
  await wait(5000);
  if (!(await page.url()).includes('page-info')) {
    await page.goto(EDIT_PAGE, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    await wait(4000);
  }
  const editPage = await scrapeCurrentState(page);
  editPage.inputs = await page.evaluate(() =>
    [...document.querySelectorAll('input, textarea, [contenteditable="true"]')].map((el) => ({
      tag: el.tagName,
      type: el.type,
      aria: el.getAttribute('aria-label'),
      placeholder: el.placeholder,
      value: (el.value || el.innerText || '').slice(0, 250),
    })),
  );
  await page.screenshot({ path: '/tmp/linkedin-audit-edit.png', fullPage: true });

  return { dashboard, publicView, editPage };
}

async function typeInto(page, patterns, value) {
  const patternsArr = Array.isArray(patterns) ? patterns : [patterns];
  return page.evaluate(
    (pats, val) => {
      const test = (label) => pats.some((p) => new RegExp(p, 'i').test(label));
      const set = (el, v) => {
        el.focus();
        if (el.isContentEditable) {
          el.innerText = v;
          el.dispatchEvent(new InputEvent('input', { bubbles: true }));
          return true;
        }
        const proto =
          el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (setter) setter.call(el, v);
        else el.value = v;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      };
      for (const el of document.querySelectorAll('input, textarea, [contenteditable="true"]')) {
        const label = el.getAttribute('aria-label') || el.placeholder || el.name || el.id || '';
        if (test(label)) return set(el, val);
      }
      for (const labelEl of document.querySelectorAll('label')) {
        if (!test(labelEl.innerText || '')) continue;
        const id = labelEl.getAttribute('for');
        const el = id ? document.getElementById(id) : labelEl.querySelector('input, textarea');
        if (el) return set(el, val);
      }
      return false;
    },
    patternsArr,
    value,
  );
}

async function applyUpdates(page) {
  await page.goto(ADMIN_DASHBOARD, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await wait(3000);
  await clickByText(page, 'Edit Page');
  await wait(4000);
  if (!page.url().includes('page-info')) {
    await page.goto(EDIT_PAGE, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    await wait(4000);
  }

  const results = {};
  results.tagline = await typeInto(page, ['tagline', 'headline'], BRAND.tagline);
  results.about = await typeInto(page, ['about', 'description', 'overview'], BRAND.about);
  results.website = await typeInto(page, ['website', 'url'], BRAND.website);

  // Open Page info / Details sections if collapsed
  for (const section of ['Page info', 'Details', 'Overview', 'Button']) {
    await clickByText(page, section, { partial: true });
    await wait(800);
  }

  results.saveClicked = await page.evaluate(() => {
    for (const el of document.querySelectorAll('button')) {
      const t = (el.innerText || '').trim();
      if (/^(save|done|save changes)$/i.test(t)) {
        el.click();
        return t;
      }
    }
    return null;
  });
  await wait(3000);
  await page.screenshot({ path: '/tmp/linkedin-after-apply.png', fullPage: true });
  results.finalUrl = page.url();
  return results;
}

async function main() {
  const browser = await connectBrowser();
  try {
    const page = await getLinkedInPage(browser);
    if (MODE === 'apply') {
      const results = await applyUpdates(page);
      console.log(JSON.stringify({ mode: MODE, results, brand: BRAND }, null, 2));
    } else {
      const audit = await auditPage(page);
      console.log(JSON.stringify({ mode: MODE, audit }, null, 2));
    }
  } finally {
    await browser.disconnect();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
