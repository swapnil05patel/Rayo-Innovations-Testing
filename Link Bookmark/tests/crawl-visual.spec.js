import { test, expect } from '@playwright/test';
import { crawlSite } from '../utils/crawlHelper.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const START_URL = 'https://landing-bookmark.rayoinnovations.com/';
const REPORT_DIR = path.join(__dirname, '..', 'reports');

/**
 * Visual Crawl Test
 * This test runs with a visible browser window showing all actions in real-time
 * with pauses so you can watch each page being crawled and links being clicked.
 */
test.describe('Link Bookmark visual crawl with browser window', () => {
  test('crawls pages and displays browser activity', async ({ browser, page }) => {
    await fs.promises.mkdir(REPORT_DIR, { recursive: true });

    console.log('\n🎬 Visual Crawl Starting...\n');
    console.log(`📌 Landing Page: ${START_URL}`);

    try {
      await page.goto(START_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
      });
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (error) {
      console.error(`❌ Failed to load landing page: ${error.message}`);
      expect.fail('Cannot load landing page');
    }

    console.log(`✅ Landing page loaded`);
    await page.screenshot({ path: path.join(REPORT_DIR, 'screenshots', 'landing-page.png'), fullPage: true });

    // Extract and display all links
    const links = await page.$$eval('a[href]', (anchors) =>
      anchors
        .map((a) => ({
          text: a.textContent?.trim().substring(0, 50) || 'No text',
          href: a.getAttribute('href'),
          visible: a.offsetParent !== null,
        }))
        .filter((a) => a.href && !a.href.startsWith('javascript:') && !a.href.startsWith('#'))
    );

    const internalLinks = links.filter((link) => {
      try {
        const url = new URL(link.href, START_URL);
        return url.hostname === new URL(START_URL).hostname;
      } catch {
        return false;
      }
    });

    console.log(`\n🔗 Found ${internalLinks.length} internal links on landing page:\n`);
    internalLinks.slice(0, 10).forEach((link, i) => {
      console.log(`   ${i + 1}. ${link.text || '(Untitled)'} → ${link.href}`);
    });

    // Demonstrate clicking on each link with visual pauses
    console.log(`\n🖱️  Clicking links...\n`);
    for (let i = 0; i < Math.min(5, internalLinks.length); i++) {
      const link = internalLinks[i];
      console.log(`\n   [${i + 1}/${Math.min(5, internalLinks.length)}] Clicking: ${link.text}`);

      try {
        const navigationPromise = page.waitForNavigation({ timeout: 30000, waitUntil: 'domcontentloaded' }).catch(() => null);
        await page.click(`a[href="${link.href}"]`).catch(async () => {
          // If click fails, try navigation directly
          await page.goto(link.href, { waitUntil: 'domcontentloaded' });
        });
        await navigationPromise;
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);

        const title = await page.title();
        console.log(`       ✅ Loaded: ${title}`);
        console.log(`       📍 URL: ${page.url()}`);

        // Capture screenshot
        const screenshotName = `page-${i + 1}.png`;
        await page.screenshot({ path: path.join(REPORT_DIR, 'screenshots', screenshotName), fullPage: true });
        console.log(`       📷 Screenshot: ${screenshotName}`);

        // Show any forms
        const formCount = await page.locator('form').count();
        if (formCount > 0) {
          console.log(`       📋 Forms found: ${formCount}`);
        }

        // Add visual pause
        await page.waitForTimeout(1000);
      } catch (error) {
        console.log(`       ❌ Failed: ${error.message}`);
      }
    }

    console.log(`\n✅ Visual crawl complete!\n`);
    console.log(`📊 Report: ${path.join(REPORT_DIR, 'crawl-results.json')}`);
    console.log(`📸 Screenshots: ${path.join(REPORT_DIR, 'screenshots/')}\n`);
  });
});
