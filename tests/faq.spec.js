import { test } from '@playwright/test';
import { fillEnglishFaq, processFaqTranslations } from '../utils/faqHelper.js';
import languages from '../data/languages.json' assert { type: 'json' };
import faqData from '../data/faqData.json' assert { type: 'json' };
import translations from '../data/translations.json' assert { type: 'json' };

test('update FAQ translations using JSON data', async ({ page }) => {
  await page.goto('https://bookmark.rayoinnovations.com/login');

  await page.getByRole('textbox', { name: 'Enter Email' }).fill('yogs174@gmail.com');
  await page.getByRole('textbox', { name: 'Enter Password' }).fill('7i4X6N>$him4');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.getByRole('link', { name: 'FAQ' }).click();
  await page.getByRole('button', { name: 'Edit' }).nth(1).click();
  await page.waitForTimeout(1000);

  for (const faq of faqData) {
    await fillEnglishFaq(page, faq);
    const faqTranslations = translations[faq.translationKey ?? faq.englishQuestion];
    if (!faqTranslations) {
      console.warn(`Translations not found for FAQ: ${faq.englishQuestion}`);
      continue;
    }
    await processFaqTranslations(page, languages, faqTranslations);
  }

  // Explicitly ensure Chinese (Simplified) translation is set for a sample entry
  try {
    await page.getByRole('button', { name: 'zh-CN Chinese Simplified' }).click();
    const cnQuestion = page.getByRole('textbox', { name: 'Question (Chinese Simplified)' });
    await cnQuestion.click();
    await cnQuestion.fill('Link Saver 可以免费使用吗？');

    const editor = page.locator('.ql-editor.ql-blank').first();
    await editor.click();
    // select all then paste plain text (uses platform modifier)
    await editor.press('ControlOrMeta+a');
    await page.locator('body').press('ControlOrMeta+Shift+V');
    await editor.click();
  } catch (err) {
    console.warn('Explicit Chinese translation flow failed:', err.message);
  }

  await page.getByRole('button', { name: 'Save Changes' }).click();
});
