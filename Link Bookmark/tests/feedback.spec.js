import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const START_URL = 'https://landing-bookmark.rayoinnovations.com/';
const REPORT_DIR = path.join(__dirname, '..', 'reports');
const REPORT_FILE = path.join(REPORT_DIR, 'feedback-results.json');

// Run tests sequentially so we can aggregate results in-memory
test.describe.serial('Feedback form tests', () => {
  const results = [];

  test.beforeAll(async () => {
    await fs.promises.mkdir(REPORT_DIR, { recursive: true });
  });

  test.afterAll(async () => {
    await fs.promises.writeFile(REPORT_FILE, JSON.stringify({
      generatedAt: new Date().toISOString(),
      results,
    }, null, 2));
    console.log(`\n📄 Feedback test report written to: ${REPORT_FILE}`);
  });

  // Helper to try multiple heuristics to detect successful submission
  async function detectSuccess(page) {
    // Wait briefly for either network POST or success message
    try {
      const request = await page.waitForRequest((r) => r.method() === 'POST', { timeout: 3000 });
      if (request) return { ok: true, reason: 'POST_REQUEST' };
    } catch {
      // ignore
    }

    // Heuristic: look for thank you/thanks text
    try {
      const body = await page.locator('body').innerText();
      if (/thank(s| you)/i.test(body)) return { ok: true, reason: 'THANK_YOU_TEXT' };
    } catch {}

    // Heuristic: check for any element with role=alert or success class
    try {
      const alert = await page.locator('[role="alert"], .success, .toast, .notification').first().innerText().catch(() => '');
      if (alert && /thank|success|received|submitted/i.test(alert)) return { ok: true, reason: 'ALERT_TEXT' };
    } catch {}

    // Heuristic: form cleared
    try {
      const emailVal = await page.locator('input[name="email"], input[placeholder*="email"], input[aria-label*="email"]').first().inputValue().catch(() => '');
      if (!emailVal) return { ok: true, reason: 'FORM_CLEARED' };
    } catch {}

    return { ok: false, reason: 'UNKNOWN' };
  }

  test('Valid submission should succeed', async ({ page }) => {
    await page.goto(START_URL, { waitUntil: 'domcontentloaded' });
    // Open contact/support if present
    await page.getByRole('button', { name: /contact support|contact/i }).first().click().catch(() => {});

    // Fill fields (robust selectors)
    await page.getByRole('textbox', { name: /your email/i }).first().fill('tester@example.com').catch(() => {});
    await page.getByRole('textbox', { name: /subject/i }).first().fill('Link Bookmark').catch(() => {});
    await page.getByRole('textbox', { name: /your message/i }).first().fill('This is test feedback.').catch(() => {});

    // Click submit
    await page.getByRole('button', { name: /submit|send/i }).first().click().catch(() => {});

    const success = await detectSuccess(page);
    results.push({ case: 'valid_submission', passed: success.ok, detail: success.reason });
    expect(success.ok, `Valid submission did not succeed: ${success.reason}`).toBe(true);
  });

  test('Missing email should not submit', async ({ page }) => {
    await page.goto(START_URL, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /contact support|contact/i }).first().click().catch(() => {});

    // Intentionally omit email
    await page.getByRole('textbox', { name: /subject/i }).first().fill('No email test').catch(() => {});
    await page.getByRole('textbox', { name: /your message/i }).first().fill('Missing email field test').catch(() => {});
    await page.getByRole('button', { name: /submit|send/i }).first().click().catch(() => {});

    // Wait briefly and assert that no POST request happened
    let posted = false;
    try {
      await page.waitForRequest((r) => r.method() === 'POST', { timeout: 2000 });
      posted = true;
    } catch {}

    const passed = !posted;
    results.push({ case: 'missing_email', passed, detail: posted ? 'POST_OCCURRED' : 'NO_POST' });
    expect(passed, 'Form posted despite missing email').toBe(true);
  });

  test('Invalid email format should not submit', async ({ page }) => {
    await page.goto(START_URL, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /contact support|contact/i }).first().click().catch(() => {});

    await page.getByRole('textbox', { name: /your email/i }).first().fill('invalid-email').catch(() => {});
    await page.getByRole('textbox', { name: /subject/i }).first().fill('Invalid email test').catch(() => {});
    await page.getByRole('textbox', { name: /your message/i }).first().fill('Invalid email format test').catch(() => {});
    await page.getByRole('button', { name: /submit|send/i }).first().click().catch(() => {});

    let posted = false;
    try {
      await page.waitForRequest((r) => r.method() === 'POST', { timeout: 2000 });
      posted = true;
    } catch {}

    const passed = !posted;
    results.push({ case: 'invalid_email', passed, detail: posted ? 'POST_OCCURRED' : 'NO_POST' });
    expect(passed, 'Form posted despite invalid email format').toBe(true);
  });

  test('Long message submission should succeed', async ({ page }) => {
    await page.goto(START_URL, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /contact support|contact/i }).first().click().catch(() => {});

    const longMessage = 'x'.repeat(5000);
    await page.getByRole('textbox', { name: /your email/i }).first().fill('long@example.com').catch(() => {});
    await page.getByRole('textbox', { name: /subject/i }).first().fill('Long message test').catch(() => {});
    await page.getByRole('textbox', { name: /your message/i }).first().fill(longMessage).catch(() => {});
    await page.getByRole('button', { name: /submit|send/i }).first().click().catch(() => {});

    const success = await detectSuccess(page);
    results.push({ case: 'long_message', passed: success.ok, detail: success.reason });
    expect(success.ok, `Long message submission failed: ${success.reason}`).toBe(true);
  });

  test('Dropdown selection (if present) should be selectable and submit', async ({ page }) => {
    await page.goto(START_URL, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /contact support|contact/i }).first().click().catch(() => {});

    // If a select exists, choose a non-empty option
    const hasSelect = await page.locator('select').count();
    if (hasSelect) {
      const select = page.locator('select').first();
      const options = await select.locator('option').allTextContents();
      if (options.length > 0) {
        const value = await select.locator('option').nth(1).getAttribute('value').catch(() => null);
        if (value) await select.selectOption(value).catch(() => {});
      }
    }

    await page.getByRole('textbox', { name: /your email/i }).first().fill('select@example.com').catch(() => {});
    await page.getByRole('textbox', { name: /subject/i }).first().fill('Select test').catch(() => {});
    await page.getByRole('textbox', { name: /your message/i }).first().fill('Testing select field').catch(() => {});
    await page.getByRole('button', { name: /submit|send/i }).first().click().catch(() => {});

    const success = await detectSuccess(page);
    results.push({ case: 'dropdown_selection', passed: success.ok, detail: success.reason });
    expect(success.ok, `Dropdown submission failed: ${success.reason}`).toBe(true);
  });
});
