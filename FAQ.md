import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://bookmark.rayoinnovations.com/login');
  await page.getByRole('textbox', { name: 'Enter Email' }).click();
  await page.getByRole('textbox', { name: 'Enter Email' }).fill('yogs174@gmail.com');
  await page.getByRole('textbox', { name: 'Enter Password' }).click();
  await page.getByRole('textbox', { name: 'Enter Password' }).click();
  await page.getByRole('textbox', { name: 'Enter Password' }).fill('7i4X6N>$him4');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'FAQ' }).click();
  await page.getByRole('button', { name: 'Edit' }).nth(1).click();
  await page.getByRole('textbox', { name: 'Question (English) *' }).click();
  await page.locator('.ql-editor').first().click();
  await page.getByRole('button', { name: 'zh-CN Chinese Simplified' }).click();
  await page.getByRole('textbox', { name: 'Question (Chinese Simplified)' }).click();
  await page.locator('div').filter({ hasText: /^书签链接是一个工具，可以帮助您保存、组织和管理您喜爱的链接、网站、文章、视频和在线资源，并将它们集中在一处以便快速访问。$/ }).nth(4).click();
  await page.getByRole('button', { name: 'es-ES Spanish ES Optional' }).click();
  await page.getByRole('textbox', { name: 'Question (Spanish ES)' }).click();
  await page.locator('[id="_r_n_-form-item"] > .rich-text-editor > .quill > .ql-container > .ql-editor').click();
  await page.getByRole('button', { name: 'es-MX Spanish MX Optional' }).click();
  await page.getByRole('button', { name: 'es-MX Spanish MX Optional' }).click();
  await page.getByRole('button', { name: 'ar Arabic Optional' }).click();
  await page.getByRole('button', { name: 'hi Hindi Optional' }).click({
    button: 'middle'
  });
  await page.getByRole('button', { name: 'hi Hindi Optional' }).click();
  await page.getByRole('button', { name: 'pt-BR Portuguese BR Optional' }).click();
  await page.getByRole('button', { name: 'fr French Optional' }).click();
  await page.getByRole('button', { name: 'fr French Optional' }).click();
  await page.getByRole('button', { name: 'ru Russian Optional' }).click();
  await page.getByRole('button', { name: 'de German Optional' }).click();
  await page.getByRole('button', { name: 'ja Japanese Optional' }).click();
  await page.getByRole('button', { name: 'id Indonesian Optional' }).click();
  await page.getByRole('button', { name: 'ko Korean Optional' }).click();
  await page.getByRole('button', { name: 'tr Turkish Optional' }).click();
  await page.getByRole('button', { name: 'it Italian Optional' }).click();
  await page.getByRole('button', { name: 'gu Gujarati Optional' }).click();
  await page.getByRole('button', { name: 'vi Vietnamese Optional' }).click();
  await page.getByRole('button', { name: 'pl Polish Optional' }).click();
  await page.getByRole('button', { name: 'nl Dutch Optional' }).click();
  await page.getByRole('button', { name: 'th Thai Optional' }).click();
  await page.getByRole('button', { name: 'pt-PT Portuguese PT Optional' }).click();
  await page.getByRole('button', { name: 'uk Ukrainian Optional' }).click();
  await page.getByRole('button', { name: 'uk Ukrainian Optional' }).click();
  await page.getByRole('button', { name: 'fa Persian Optional' }).click();
  await page.getByRole('button', { name: 'bn Bengali Optional' }).click();
  await page.getByRole('button', { name: 'fil Filipino Optional' }).click();
  await page.getByRole('button', { name: 'ms Malay Optional' }).click();
  await page.getByRole('button', { name: 'he Hebrew Optional' }).click();
  await page.getByRole('button', { name: 'ro Romanian Optional' }).click();
  await page.getByRole('button', { name: 'sv Swedish Optional' }).click();
  await page.getByRole('textbox', { name: 'Question (Swedish)' }).click();
  await page.getByRole('textbox', { name: 'Question (Swedish)' }).press('ControlOrMeta+Shift+V');
  await page.getByRole('textbox', { name: 'Question (Swedish)' }).fill('Vad är Link Bookmark?');
  await page.locator('[id="_r_2b_-form-item"] > .rich-text-editor > .quill > .ql-container > .ql-editor').click();
  await page.locator('[id="_r_2b_-form-item"] > .rich-text-editor > .quill > .ql-container > .ql-editor').click();
  await page.locator('[id="_r_2b_-form-item"] > .rich-text-editor > .quill > .ql-container > .ql-editor').press('ControlOrMeta+Shift+V');
  await page.getByRole('button', { name: 'cs Czech Optional' }).click();
  await page.getByRole('button', { name: 'el Greek Optional' }).click();
  await page.getByRole('button', { name: 'hu Hungarian Optional' }).click();
  await page.getByRole('button', { name: 'da Danish Optional' }).click();
  await page.getByRole('button', { name: 'fi Finnish Optional' }).click();
  await page.getByRole('button', { name: 'fi Finnish Optional' }).click();
  await page.getByRole('button', { name: 'no Norwegian Optional' }).click();
  await page.getByRole('button', { name: 'no Norwegian Optional' }).click();
  await page.getByRole('button', { name: 'hr Croatian Optional' }).click();
  await page.getByRole('button', { name: 'sr Serbian Optional' }).click();
  await page.getByRole('button', { name: 'bg Bulgarian Optional' }).click();
  await page.getByRole('button', { name: 'ca Catalan Optional' }).click();
  await page.getByRole('button', { name: 'af Afrikaans Optional' }).click();
  await page.getByRole('button', { name: 'sw Swahili Optional' }).click();
  await page.getByRole('button', { name: 'zh-TW Chinese Traditional' }).click();
  await page.getByRole('button', { name: 'ur Urdu Optional' }).click();
  await page.getByRole('button', { name: 'si Sinhala Optional' }).click();
  await page.getByRole('button', { name: 'am Amharic Optional' }).click();
  await page.getByRole('button', { name: 'my Burmese Optional' }).click();
  await page.getByRole('button', { name: 'Save Changes' }).click();
});


I have a Playwright automation script written in JavaScript using `@playwright/test` for updating FAQ translations.

I want to convert this script into a fully data-driven framework.

Requirements:

1. Keep the login and navigation flow exactly as it is:

   * Open the login page.
   * Enter credentials.
   * Click Login.
   * Navigate to FAQ.
   * Click:

     ```javascript
     await page.getByRole('button', { name: 'Edit' }).nth(1).click();
     ```

2. Create separate files:

   * `faq.spec.js` → Main Playwright test.
   * `languages.json` → Contains all language button names in the required order.
   * `faqData.json` → Contains the English FAQ question and answer.
   * `translations.json` → Contains translated question and answer for each language.
   * `faqHelper.js` → Helper functions for filling translations.

3. The language list should include:

   * Chinese Simplified
   * Spanish ES
   * Spanish MX
   * Arabic
   * Hindi
   * Portuguese BR
   * French
   * Russian
   * German
   * Japanese
   * Indonesian
   * Korean
   * Turkish
   * Italian
   * Gujarati
   * Vietnamese
   * Polish
   * Dutch
   * Thai
   * Portuguese PT
   * Ukrainian
   * Persian
   * Bengali
   * Filipino
   * Malay
   * Hebrew
   * Romanian
   * Swedish
   * Czech
   * Greek
   * Hungarian
   * Danish
   * Finnish
   * Norwegian
   * Slovak
   * Croatian
   * Serbian
   * Bulgarian
   * Catalan
   * Afrikaans
   * Swahili
   * Chinese Traditional
   * Urdu
   * Sinhala
   * Amharic
   * Burmese

4. For each language:

   * Click the language button.
   * Find the corresponding Question textbox.
   * Find the corresponding Answer rich-text editor (Quill editor).

5. Before filling data:

   * Check whether BOTH the Question textbox and the Answer editor are empty.
   * If BOTH are empty:

     * Read the translated question and answer from `translations.json`.
     * Fill the Question textbox.
     * Fill the Quill Answer editor.
   * If either field already contains data:

     * Skip that language.
     * Continue to the next language.

6. Use reusable helper functions such as:

   ```javascript
   async function isQuestionEmpty(page, language) {}
   async function isAnswerEmpty(page, language) {}
   async function fillTranslation(page, language, translation) {}
   ```

7. The framework should support multiple FAQs by reading data from `faqData.json`.

8. After processing all languages for a FAQ:

   ```javascript
   await page.getByRole('button', { name: 'Save Changes' }).click();
   ```

9. Add proper error handling:

   * If a language button is not found, log it and continue.
   * If a translation is missing from `translations.json`, log it and continue.
   * The script should never stop because of one failed language.

10. Generate complete code for all files:

    * `tests/faq.spec.js`
    * `utils/faqHelper.js`
    * `data/languages.json`
    * `data/faqData.json`
    * `data/translations.json`

11. Use modern JavaScript (ES Modules) compatible with Playwright.

12. The final solution should require no code changes when adding new FAQs or languages. Only the JSON files should be updated.

Provide the complete folder structure and the full implementation of every file