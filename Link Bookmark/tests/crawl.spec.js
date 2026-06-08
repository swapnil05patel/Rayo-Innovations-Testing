import { test, expect } from '@playwright/test';
import { crawlSite } from '../utils/crawlHelper.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const START_URL = 'https://landing-bookmark.rayoinnovations.com/';
const REPORT_DIR = path.join(__dirname, '..', 'reports');

test.describe('Link Bookmark full site crawl', () => {
  test('crawls internal pages and validates page health', async ({ browser }) => {
    await fs.promises.mkdir(REPORT_DIR, { recursive: true });

    const report = await crawlSite(browser, START_URL, {
      domain: new URL(START_URL).hostname,
      screenshotDir: path.join(REPORT_DIR, 'screenshots'),
      maxPages: 100,
    });

    const reportPath = path.join(REPORT_DIR, 'crawl-results.json');
    await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));

    const failedPages = report.pages.filter((page) => page.status === 'Fail');
    expect(failedPages.length, `Failed pages: ${failedPages.map((page) => page.url).join(', ')}`).toBe(0);
  });
});
