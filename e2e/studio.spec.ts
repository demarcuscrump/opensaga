import { expect, test } from '@playwright/test';

test('creator studio opens and saves AI provider settings', async ({ page }) => {
  await page.goto('/#/studio');

  await expect(page.getByRole('application', { name: 'Creator Studio' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Character Forge Deep profiles/i })).toBeVisible();

  await page.getByRole('button', { name: 'Open AI provider settings' }).click();
  await expect(page.getByRole('dialog', { name: 'AI Settings' })).toBeVisible();

  await page.getByLabel('Provider', { exact: true }).selectOption('openrouter');
  await page.getByLabel('Model').fill('openai/gpt-4o');
  await page.getByLabel('API Key').fill('sk-test-openrouter');
  await page.getByRole('button', { name: 'Save Settings' }).click();

  await expect(page.getByRole('dialog', { name: 'AI Settings' })).not.toBeVisible();
});
