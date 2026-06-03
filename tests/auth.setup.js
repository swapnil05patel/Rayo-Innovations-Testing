require('dotenv').config();
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const GOOGLE_EMAIL = process.env.GOOGLE_EMAIL;
const GOOGLE_PASSWORD = process.env.GOOGLE_PASSWORD;
const AUTH_STATE_FILE = path.join(__dirname, '..', 'auth-state.json');

(async () => {
  if (!GOOGLE_EMAIL || !GOOGLE_PASSWORD) {
    console.error('Missing GOOGLE_EMAIL or GOOGLE_PASSWORD in environment variables.');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Navigating to website...');
    await page.goto('https://website-bookmark.rayoinnovations.com/');

    console.log('Clicking Continue with Google...');
    const googleButton = page.locator('text=Continue with Google');
    await googleButton.waitFor({ state: 'visible', timeout: 30000 });
    await googleButton.click();

    const popup = await page.waitForEvent('popup', { timeout: 15000 }).catch(() => null);
    const loginPage = popup || page;

    console.log('Waiting for Google login page...');
    await loginPage.waitForURL(/accounts\.google\.com|google\.com/, { timeout: 60000 });
    await loginPage.waitForTimeout(1000);

    console.log('Current URL:', loginPage.url());
    console.log('Entering email...');
    const emailInput = loginPage.locator('input[type="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 30000 });
    await emailInput.fill(GOOGLE_EMAIL);
    console.log('Email entered:', GOOGLE_EMAIL);
    
    const nextButton = loginPage.locator('button:has-text("Next")').first();
    await nextButton.click();
    console.log('Next button clicked');

    console.log('Waiting for password field...');
    await loginPage.waitForTimeout(2000);
    
    const passwordField = loginPage.locator('input[type="password"]');
    console.log('Waiting for password field to be visible or attached...');
    
    try {
      await passwordField.first().waitFor({ timeout: 30000 });
    } catch (e) {
      console.error('Password field not found, taking screenshot...');
      await loginPage.screenshot({ path: 'auth-debug.png' });
      console.error('Screenshot saved to auth-debug.png');
      throw new Error('Password field did not appear within 30 seconds. Check auth-debug.png for what\'s on screen. Google may be blocking automation.');
    }
    
    await loginPage.waitForTimeout(1000);
    
    console.log('Password field found, filling...');
    await passwordField.fill(GOOGLE_PASSWORD);
    console.log('Password filled');
    
    await loginPage.locator('button:has-text("Next")').nth(1).click();
    console.log('Password Next button clicked');

    console.log('Waiting for redirect back to website...');
    await loginPage.waitForURL(/website-bookmark\.rayoinnovations\.com|rayoinnovations\.com/, { timeout: 120000 });

    console.log('Saving authentication state...');
    await context.storageState({ path: AUTH_STATE_FILE });

    console.log(`✓ Authentication successful! State saved to ${AUTH_STATE_FILE}`);
  } catch (error) {
    console.error('✗ Authentication failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
