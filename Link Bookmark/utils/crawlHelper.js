import fs from 'fs';
import path from 'path';

const DEFAULT_MAX_PAGES = 100;
const MAX_LINK_CHECKS = 5;

/**
 * Crawl the application starting from a URL and build a stability report.
 * Only pages on the configured domain are visited.
 */
export async function crawlSite(browser, startUrl, options = {}) {
  const domain = options.domain || new URL(startUrl).hostname;
  const screenshotDir = options.screenshotDir || path.resolve(process.cwd(), 'Link Bookmark', 'reports', 'screenshots');
  const maxPages = options.maxPages || DEFAULT_MAX_PAGES;
  const visited = new Set();
  const queue = [normalizeUrl(startUrl, startUrl)];
  const pages = [];

  await fs.promises.mkdir(screenshotDir, { recursive: true });

  console.log(`\n🚀 Starting crawl of ${startUrl}\n`);
  console.log(`Domain: ${domain}`);
  console.log(`Max pages to crawl: ${maxPages}\n`);
  console.log(`─`.repeat(80));

  while (queue.length > 0 && visited.size < maxPages) {
    const pageUrl = queue.shift();
    if (!pageUrl || visited.has(pageUrl)) continue;
    visited.add(pageUrl);

    console.log(`\n📄 Crawling [${visited.size}/${maxPages}]: ${pageUrl}`);

    const context = await browser.newContext();
    const page = await context.newPage();
    const pageResult = await validatePage(page, pageUrl, { domain, screenshotDir });
    await page.close();
    await context.close();

    console.log(`   Status: ${pageResult.status === 'Pass' ? '✅ Pass' : '❌ Fail'}`);
    console.log(`   Response: ${pageResult.responseStatus} | Load time: ${pageResult.loadTimeMs}ms`);
    if (pageResult.forms.length > 0) {
      console.log(`   Forms found: ${pageResult.forms.length}`);
    }
    if (pageResult.uiSuggestions.length > 0) {
      pageResult.uiSuggestions.forEach((suggestion) => {
        console.log(`   ⚠️  UI Suggestion: ${suggestion}`);
      });
    }
    if (pageResult.notes.length > 0) {
      pageResult.notes.forEach((note) => {
        console.log(`   ℹ️  ${note}`);
      });
    }

    pages.push(pageResult);

    for (const link of pageResult.internalLinks) {
      if (!visited.has(link) && !queue.includes(link) && queue.length < maxPages) {
        queue.push(link);
      }
    }
  }

  console.log(`\n${`─`.repeat(80)}`);
  console.log(`✅ Crawl complete! Crawled ${visited.size} pages.\n`);

  return {
    startUrl,
    crawledAt: new Date().toISOString(),
    domain,
    pages,
  };
}

/**
 * Validate a single page, collect metadata, capture a screenshot, and detect broken links.
 */
async function validatePage(page, url, options) {
  const { domain, screenshotDir } = options;
  const pageResult = {
    url,
    status: 'Pass',
    responseStatus: null,
    title: '',
    brokenLinks: 0,
    imageFailures: 0,
    loadTimeMs: null,
    screenshotPath: '',
    consoleErrors: [],
    internalLinks: [],
    forms: [],
    uiSuggestions: [],
    notes: [],
  };

  page.on('console', (message) => {
    if (message.type() === 'error') {
      pageResult.consoleErrors.push(message.text());
    }
  });

  const startTime = Date.now();
  let response = null;

  try {
    response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  } catch (error) {
    pageResult.status = 'Fail';
    pageResult.notes.push(`Navigation failed: ${error.message}`);
  }

  pageResult.loadTimeMs = Date.now() - startTime;
  pageResult.responseStatus = response ? response.status() : 0;

  if (!response || !response.ok()) {
    pageResult.status = 'Fail';
    pageResult.notes.push(`Invalid HTTP status: ${pageResult.responseStatus}`);
  }

  try {
    const title = await page.title();
    pageResult.title = title.trim();
    if (!pageResult.title) {
      pageResult.status = 'Fail';
      pageResult.notes.push('Page title is empty.');
    }
  } catch (error) {
    pageResult.status = 'Fail';
    pageResult.notes.push(`Title extraction failed: ${error.message}`);
  }

  const screenshotPath = getScreenshotPath(url, screenshotDir);
  pageResult.screenshotPath = screenshotPath;
  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
  } catch (error) {
    pageResult.notes.push(`Screenshot failed: ${error.message}`);
  }

  await inspectFormsAndDropdowns(page, pageResult, url);

  pageResult.internalLinks = await extractInternalLinks(page, domain, url);
  pageResult.brokenLinks = await countBrokenLinks(page, pageResult.internalLinks);
  if (pageResult.brokenLinks > 0) {
    pageResult.status = 'Fail';
    pageResult.notes.push(`${pageResult.brokenLinks} broken internal link(s) detected.`);
  }

  pageResult.imageFailures = await countImageFailures(page, url);
  if (pageResult.imageFailures > 0) {
    pageResult.status = 'Fail';
    pageResult.notes.push(`${pageResult.imageFailures} image(s) failed to load.`);
  }

  if (pageResult.consoleErrors.length > 0) {
    pageResult.status = 'Fail';
    pageResult.notes.push(`${pageResult.consoleErrors.length} console error(s) found.`);
  }

  return pageResult;
}

/**
 * Build a stable screenshot file path from the page URL.
 */
function getScreenshotPath(url, screenshotDir) {
  const safeFileName = url
    .replace(/https?:\/\//, '')
    .replace(/[^a-zA-Z0-9-_./]/g, '-')
    .replace(/-+/g, '-')
    .replace(/\/$/, '') || 'root-page';
  return path.join(screenshotDir, `${safeFileName}.png`);
}

/**
 * Normalize a URL by removing fragments and applying a base URL.
 */
export function normalizeUrl(rawUrl, baseUrl) {
  try {
    const normalized = new URL(rawUrl, baseUrl);
    normalized.hash = '';
    return normalized.href;
  } catch {
    return null;
  }
}

/**
 * Extract same-domain internal links from the page.
 */
async function extractInternalLinks(page, domain, baseUrl) {
  const hrefs = await page.$$eval('a[href]', (anchors) =>
    anchors.map((anchor) => anchor.getAttribute('href')).filter(Boolean)
  );

  const uniqueLinks = new Set();
  for (const rawLink of hrefs) {
    const normalized = normalizeUrl(rawLink, baseUrl);
    if (!normalized) continue;
    try {
      const { hostname, protocol } = new URL(normalized);
      if (hostname !== domain) continue;
      if (!protocol.startsWith('http')) continue;
      uniqueLinks.add(normalized);
    } catch {
      continue;
    }
  }

  return [...uniqueLinks];
}

/**
 * Count broken internal links by issuing lightweight requests.
 */
async function countBrokenLinks(page, internalLinks) {
  let brokenCount = 0;
  const request = page.request;

  for (const link of internalLinks) {
    if (!link) continue;
    try {
      const response = await request.get(link, { timeout: 20000 });
      if (!response.ok()) {
        brokenCount += 1;
      }
    } catch {
      brokenCount += 1;
    }
  }

  return brokenCount;
}

/**
 * Verify that images referenced by the page load successfully.
 */
async function countImageFailures(page, baseUrl) {
  const imageSources = await page.$$eval('img[src]', (images) =>
    images.map((img) => img.getAttribute('src')).filter(Boolean)
  );

  let failures = 0;
  for (const rawSrc of imageSources) {
    const normalized = normalizeUrl(rawSrc, baseUrl);
    if (!normalized) {
      failures += 1;
      continue;
    }

    try {
      const response = await page.request.get(normalized, { timeout: 20000 });
      if (!response.ok()) failures += 1;
    } catch {
      failures += 1;
    }
  }

  return failures;
}

/**
 * Inspect forms on the page, fill dropdowns, and create UI improvement recommendations.
 */
async function inspectFormsAndDropdowns(page, pageResult, pageUrl) {
  const formHandles = await page.$$('form');
  if (formHandles.length === 0) return;

  for (let formIndex = 0; formIndex < formHandles.length; formIndex++) {
    const formHandle = formHandles[formIndex];
    const formSummary = {
      index: formIndex + 1,
      name: await formHandle.getAttribute('name') || '',
      id: await formHandle.getAttribute('id') || '',
      action: await formHandle.getAttribute('action') || '',
      method: (await formHandle.getAttribute('method') || 'get').toLowerCase(),
      selects: [],
      filledFields: [],
      issues: [],
    };

    const selectHandles = await formHandle.$$('select');
    for (const selectHandle of selectHandles) {
      const options = await selectHandle.$$eval('option', (opts) =>
        opts.map((option) => ({
          value: option.value,
          text: option.textContent?.trim() || '',
          disabled: option.disabled,
        }))
      );
      const firstValid = options.find((option) => option.value && !option.disabled) || options[0];
      if (!firstValid) {
        formSummary.issues.push('Dropdown contains no selectable options.');
      } else {
        if (!firstValid.value) {
          formSummary.issues.push('First dropdown option has an empty value; use a visible placeholder or default valid choice.');
        }
        try {
          await selectHandle.selectOption(firstValid.value);
        } catch (error) {
          formSummary.issues.push(`Unable to select dropdown value: ${error.message}`);
        }
        formSummary.selects.push({ value: firstValid.value, label: firstValid.text, totalOptions: options.length });
      }
    }

    const inputHandles = await formHandle.$$('input');
    for (const inputHandle of inputHandles) {
      const type = (await inputHandle.getAttribute('type')) || 'text';
      const name = await inputHandle.getAttribute('name') || ''; 
      const id = await inputHandle.getAttribute('id') || '';
      const placeholder = await inputHandle.getAttribute('placeholder');
      const ariaLabel = await inputHandle.getAttribute('aria-label');
      const labelText = await getLabelText(page, inputHandle, id);
      if (!labelText && !ariaLabel) {
        formSummary.issues.push(`Input field ${name || id || type} is missing a visible label or aria-label.`);
      }
      const sampleValue = getSampleValue(type, placeholder);
      if (sampleValue !== null) {
        try {
          await inputHandle.fill(sampleValue);
          formSummary.filledFields.push({ name, type, value: sampleValue });
        } catch {
          formSummary.issues.push(`Could not fill input ${name || id || type} automatically.`);
        }
      }
    }

    const textareaHandles = await formHandle.$$('textarea');
    for (const textareaHandle of textareaHandles) {
      const id = await textareaHandle.getAttribute('id') || '';
      const name = await textareaHandle.getAttribute('name') || '';
      const placeholder = await textareaHandle.getAttribute('placeholder');
      const labelText = await getLabelText(page, textareaHandle, id);
      if (!labelText) {
        formSummary.issues.push(`Textarea ${name || id} is missing a visible label.`);
      }
      const sampleValue = placeholder || 'Test message';
      try {
        await textareaHandle.fill(sampleValue);
        formSummary.filledFields.push({ name, type: 'textarea', value: sampleValue });
      } catch {
        formSummary.issues.push(`Could not fill textarea ${name || id} automatically.`);
      }
    }

    const submitButton = await formHandle.$('button[type=submit], input[type=submit]');
    if (!submitButton) {
      formSummary.issues.push('Form does not contain a submit button; add a visible submit action.');
    }

    if (formSummary.issues.length > 0) {
      pageResult.uiSuggestions.push(`Form ${formSummary.index}: ${formSummary.issues.join(' ')}`);
    }
    pageResult.forms.push(formSummary);
  }
}

async function getLabelText(page, elementHandle, id) {
  return page.evaluate((element, elementId) => {
    const labelByFor = elementId ? document.querySelector(`label[for="${elementId}"]`) : null;
    if (labelByFor && labelByFor.textContent) return labelByFor.textContent.trim();
    let parent = element.parentElement;
    while (parent) {
      if (parent.tagName.toLowerCase() === 'label' && parent.textContent) return parent.textContent.trim();
      parent = parent.parentElement;
    }
    return '';
  }, elementHandle, id);
}

function getSampleValue(type, placeholder) {
  const lowerType = type.toLowerCase();
  if (lowerType === 'email') return 'test@example.com';
  if (lowerType === 'tel') return '555-123-4567';
  if (lowerType === 'password') return 'P@ssw0rd123';
  if (lowerType === 'url') return 'https://example.com';
  if (lowerType === 'number') return '42';
  if (lowerType === 'search') return 'test';
  if (lowerType === 'date') return '2025-01-01';
  if (lowerType === 'datetime-local') return '2025-01-01T12:00';
  if (lowerType === 'time') return '12:00';
  if (lowerType === 'color') return '#000000';
  if (lowerType === 'checkbox' || lowerType === 'radio') return null;
  return placeholder || 'Test value';
}
