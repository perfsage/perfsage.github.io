#!/usr/bin/env node
/**
 * Publish a post on the PerfSage LinkedIn company page via CDP.
 *
 * Prereqs:
 *   npm run linkedin:chrome   # or logged-in Chrome with DevToolsActivePort
 *
 * Usage:
 *   node scripts/linkedin-company-post.mjs --dry-run
 *   node scripts/linkedin-company-post.mjs --post
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const COMPANY_ID = '115801924';
const ADMIN_DASHBOARD = `https://www.linkedin.com/company/${COMPANY_ID}/admin/dashboard/`;

const POST_TEXT = `Your LLM can talk about load tests.

Can it actually run JMeter?

Wrong Java. Missing plugins. Hand-written CSRF extractors. Guesswork thread counts. Average-only "green" reports that lie.

I got tired of that toolchain tax — so I shipped PerfSage JMeter MCP.

Point Cursor / Claude at it and ask for a performance test. The agent will:

→ heal Java + Apache JMeter 5.6.3 under ~/.perfsage
→ import HAR / OpenAPI / Postman
→ auto-correlate tokens into extractors
→ discover the capacity knee
→ ship a PASS/WARN/FAIL led by p95 + p99

Not chatbot theater. Real tools. Real verdicts.

Field Notes #9:
https://perfsage.com/blog/introducing-perfsage-jmeter-mcp/

Try it:
uvx perfsage-jmeter-mcp
github.com/perfsage/perfsage-jmeter-mcp

Analysis, not dashboards.

#PerformanceEngineering #JMeter #MCP #LoadTesting #SRE #OpenSource #PerfSage`;

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run') || !args.has('--post');

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

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function connectBrowser() {
  const ws = await resolveWsEndpoint();
  return puppeteer.connect({
    browserWSEndpoint: ws,
    defaultViewport: { width: 1440, height: 900 },
  });
}

async function getLinkedInPage(browser) {
  const pages = await browser.pages();
  let page = pages.find((p) => p.url().includes('linkedin.com'));
  if (!page) page = await browser.newPage();
  await page.bringToFront();
  return page;
}

async function clickByText(page, text, { partial = false, timeout = 10000 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const clicked = await page.evaluate(
      (label, isPartial) => {
        const norm = (s) => s.replace(/\s+/g, ' ').trim();
        const target = norm(label).toLowerCase();
        const candidates = [
          ...document.querySelectorAll('button, [role="button"], a, span, div'),
        ];
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
      await wait(1500);
      return true;
    }
    await wait(400);
  }
  return false;
}

async function openComposer(page) {
  await page.goto(ADMIN_DASHBOARD, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await wait(4000);

  const opened =
    (await clickByText(page, 'Start a post', { partial: true })) ||
    (await clickByText(page, 'Create a post', { partial: true })) ||
    (await clickByText(page, 'Write article', { partial: true }));

  if (!opened) {
    const clickedShare = await page.evaluate(() => {
      for (const el of document.querySelectorAll('[data-control-name], button, div[role="button"]')) {
        const t = (el.innerText || '').toLowerCase();
        if (t.includes('start a post') || t.includes('share an update')) {
          el.click();
          return true;
        }
      }
      return false;
    });
    if (!clickedShare) throw new Error('Could not open LinkedIn post composer');
  }
  await wait(2000);
}

async function typePost(page, text) {
  const typed = await page.evaluate((val) => {
    const editors = [
      ...document.querySelectorAll(
        '[contenteditable="true"][role="textbox"], div[data-placeholder*="post" i], .ql-editor, [aria-label*="Text editor" i]',
      ),
    ];
    for (const el of editors) {
      if (el.offsetParent === null) continue;
      el.focus();
      el.innerText = val;
      el.dispatchEvent(new InputEvent('input', { bubbles: true }));
      return true;
    }
    return false;
  }, text);

  if (!typed) {
    await page.keyboard.type(text, { delay: 5 });
  }
  await wait(1500);
  return typed;
}

async function publishPost(page) {
  if (DRY_RUN) {
    await page.screenshot({ path: '/tmp/linkedin-post-draft.png', fullPage: true });
    return { dryRun: true, screenshot: '/tmp/linkedin-post-draft.png' };
  }

  const posted =
    (await clickByText(page, 'Post', { partial: false })) ||
    (await clickByText(page, 'Publish', { partial: true }));

  if (!posted) {
    throw new Error('Could not click Post/Publish button');
  }
  await wait(5000);
  await page.screenshot({ path: '/tmp/linkedin-post-published.png', fullPage: true });
  return { dryRun: false, screenshot: '/tmp/linkedin-post-published.png', url: page.url() };
}

async function main() {
  const browser = await connectBrowser();
  try {
    const page = await getLinkedInPage(browser);
    await openComposer(page);
    await typePost(page, POST_TEXT);
    const result = await publishPost(page);
    console.log(
      JSON.stringify(
        {
          mode: DRY_RUN ? 'dry-run' : 'post',
          postPreview: POST_TEXT.slice(0, 200) + '...',
          result,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.disconnect();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
