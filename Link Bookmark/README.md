# Link Bookmark Playwright Test Suite

This folder contains a dedicated Playwright test automation suite for the landing page:

- `https://landing-bookmark.rayoinnovations.com/`

## Project Structure

- `package.json` — project dependencies and test scripts
- `playwright.config.js` — Playwright configuration, HTML reporter, failure artifacts
- `tests/crawl.spec.js` — crawler test that validates each internal page
- `utils/crawlHelper.js` — reusable helper functions for crawling and validation
- `reports/` — generated crawl report output and screenshots

## What this suite validates

- page load success and HTTP status
- non-empty page title
- no critical console errors
- detection of broken internal links
- verification that images load successfully
- screenshots of each page
- page load time measurement
- structured JSON report generation
- HTML report output via Playwright reporter

## Install dependencies

From the `Link Bookmark` folder:

```bash
cd "Link Bookmark"
npm install
npx playwright install
```

## Execute the tests

```bash
cd "Link Bookmark"
npm test
```

## Execute the live headed crawl

```bash
cd "Link Bookmark"
npm run test:live
```

The `test:live` command opens the browser and performs the crawl in headed mode.

## View the HTML report

```bash
cd "Link Bookmark"
npm run report
```

## Report output

The test writes a structured JSON report to:

- `Link Bookmark/reports/crawl-results.json`

It includes:

- page URL
- test status (Pass/Fail)
- page title
- number of broken links
- load time
- screenshot path

Screenshots are saved to:

- `Link Bookmark/reports/screenshots/`
