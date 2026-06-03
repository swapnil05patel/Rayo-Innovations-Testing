const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

const AUTH_STATE_FILE = path.join(__dirname, 'auth-state.json');
const HEADLESS = process.env.HEADLESS !== 'false';

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  timeout: 120000,
  expect: {
    timeout: 15000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    headless: HEADLESS,
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
    actionTimeout: 15000,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    baseURL: 'https://website-bookmark.rayoinnovations.com/',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    launchOptions: {
      args: HEADLESS ? [] : ['--start-maximized'],
    },
    storageState: require('fs').existsSync(AUTH_STATE_FILE) ? AUTH_STATE_FILE : undefined,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
