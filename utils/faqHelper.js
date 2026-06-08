export function getQuestionName(language) {
  return `Question (${language})`;
}

export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function getButtonLocator(page, buttonLabel) {
  const exactButton = page.getByRole('button', { name: buttonLabel });
  if ((await exactButton.count()) > 0) {
    return exactButton.first();
  }

  const fieldLanguage = getFieldLanguage(buttonLabel);
  const regexButton = page.getByRole('button', { name: new RegExp(escapeRegex(fieldLanguage), 'i') });
  if ((await regexButton.count()) > 0) {
    return regexButton.first();
  }

  const hasTextButton = page.locator('button', { hasText: fieldLanguage });
  if ((await hasTextButton.count()) > 0) {
    return hasTextButton.first();
  }

  return null;
}

export async function clickLanguageButton(page, language) {
  const button = await getButtonLocator(page, language);
  if (!button) {
    console.warn(`Language button not found: ${language}`);
    return false;
  }

  try {
    await button.click();
    await page.waitForTimeout(500);
    return true;
  } catch (error) {
    console.warn(`Could not click language button for ${language}: ${error.message}`);
    return false;
  }
}

export function getFieldLanguage(buttonLabel) {
  const labelWithoutOptional = buttonLabel.replace(/\s+Optional$/i, '').trim();
  const codeMatch = labelWithoutOptional.match(/^([a-z]{2}(?:-[A-Z0-9]{2,4})?)\s+(.+)$/);
  if (codeMatch) {
    return codeMatch[2].trim();
  }
  return labelWithoutOptional;
}

export async function getQuestionLocator(page, buttonLabel) {
  const fieldLanguage = getFieldLanguage(buttonLabel);
  const exactLocator = page.getByRole('textbox', { name: getQuestionName(fieldLanguage) });
  if ((await exactLocator.count()) > 0) {
    return exactLocator.first();
  }

  const regexLocator = page.getByRole('textbox', {
    name: new RegExp(`Question \(${escapeRegex(fieldLanguage)}\)`, 'i'),
  });
  if ((await regexLocator.count()) > 0) {
    return regexLocator.first();
  }

  const labelLocator = page.locator('label', { hasText: fieldLanguage }).first();
  if ((await labelLocator.count()) > 0) {
    const fieldLocator = labelLocator.locator('input,textarea').first();
    if ((await fieldLocator.count()) > 0) {
      return fieldLocator;
    }
  }

  return null;
}

export async function getAnswerLocator(page, buttonLabel) {
  const questionLocator = await getQuestionLocator(page, buttonLabel);
  if (!questionLocator) {
    return null;
  }

  const answerLocator = questionLocator.locator(
    'xpath=ancestor::div[contains(@id, "-form-item")][1]/following::div[contains(@class, "rich-text-editor")][1]//div[contains(@class, "ql-editor")]'
  );

  if ((await answerLocator.count()) > 0) {
    return answerLocator;
  }

  const fallback = page.locator('.rich-text-editor .ql-editor').first();
  return (await fallback.count()) > 0 ? fallback : null;
}

export async function getEditorText(editorLocator) {
  if (!editorLocator) {
    return '';
  }
  return (await editorLocator.evaluate((node) => node.innerText || node.textContent || '')).trim();
}

export async function isQuestionEmpty(page, language) {
  const questionLocator = await getQuestionLocator(page, language);
  if (!questionLocator) {
    console.warn(`Question field not found for ${language}`);
    return false;
  }

  const value = (await questionLocator.inputValue()).trim();
  return value.length === 0;
}

export async function isAnswerEmpty(page, language) {
  const answerLocator = await getAnswerLocator(page, language);
  if (!answerLocator) {
    console.warn(`Answer editor not found for ${language}`);
    return false;
  }

  const editorText = await getEditorText(answerLocator);
  return editorText.length === 0;
}

export async function fillRichTextEditor(page, editorLocator, text) {
  await editorLocator.click();

  try {
    await editorLocator.fill(text);
    return;
  } catch {
    await editorLocator.press('ControlOrMeta+A');
    await page.keyboard.type(text);
  }
}

export async function fillEnglishFaq(page, faq) {
  let englishQuestion = page.getByRole('textbox', { name: 'Question (English) *' });
  if ((await englishQuestion.count()) === 0) {
    englishQuestion = page.getByRole('textbox', { name: /Question \(English\)/i }).first();
  }

  if ((await englishQuestion.count()) === 0) {
    console.warn('English question textbox not found.');
  } else {
    const currentQuestion = (await englishQuestion.inputValue()).trim();
    if (currentQuestion.length === 0) {
      await englishQuestion.click();
      await englishQuestion.fill(faq.englishQuestion);
    } else {
      console.log('English question already contains data; leaving unchanged.');
    }
  }

  const englishAnswer = englishQuestion.locator(
    'xpath=ancestor::div[contains(@id, "-form-item")][1]/following::div[contains(@class, "rich-text-editor")][1]//div[contains(@class, "ql-editor")]'
  );

  if ((await englishAnswer.count()) === 0) {
    console.warn('English answer editor not found.');
  } else {
    const currentAnswer = await getEditorText(englishAnswer);
    if (currentAnswer.length === 0) {
      await fillRichTextEditor(page, englishAnswer, faq.englishAnswer);
    } else {
      console.log('English answer already contains data; leaving unchanged.');
    }
  }
}

export async function fillTranslation(page, languageButton, translation) {
  if (!(await clickLanguageButton(page, languageButton))) {
    return;
  }

  const questionLocator = await getQuestionLocator(page, languageButton);
  const answerLocator = await getAnswerLocator(page, languageButton);

  if (!questionLocator || !answerLocator) {
    console.warn(`Unable to locate fields for ${languageButton}. Skipping.`);
    return;
  }

  const questionEmpty = await isQuestionEmpty(page, languageButton);
  const answerEmpty = await isAnswerEmpty(page, languageButton);

  if (!questionEmpty || !answerEmpty) {
    console.log(`Skipping ${languageButton}: either question or answer already contains data.`);
    return;
  }

  if (!translation || !translation.question || !translation.answer) {
    console.warn(`Translation data missing for ${languageButton}. Skipping.`);
    return;
  }

  await questionLocator.click();
  await questionLocator.fill(translation.question);
  await fillRichTextEditor(page, answerLocator, translation.answer);
  console.log(`Filled translation for ${languageButton}`);
}

export async function processFaqTranslations(page, languages, translationsForFaq) {
  for (const languageButton of languages) {
    const fieldLanguage = getFieldLanguage(languageButton);
    const translation = translationsForFaq?.[fieldLanguage];
    if (!translation) {
      console.warn(`Missing translation entry for ${fieldLanguage} (${languageButton}).`);
      continue;
    }
    await fillTranslation(page, languageButton, translation);
  }
}
