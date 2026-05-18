import { expect, test } from '@playwright/test';

test('world creation flow advances through all steps in demo mode', async ({ page }) => {
  await page.goto('/#/create');

  await expect(page.getByRole('heading', { name: 'What will you forge?' })).toBeVisible();

  await page.getByRole('button', { name: /New World/i }).click();
  await page.getByLabel('Name').fill('Test Realm');
  await page.getByLabel('Short Description').fill('A collaborative universe created during an E2E smoke test.');

  await page.getByRole('button', { name: /Next Step/i }).click();
  await expect(page.getByLabel('Primary Genre')).toBeVisible();
  await page.getByLabel('Primary Genre').selectOption('scifi');
  await page.getByLabel('Governance Model').selectOption('community');

  await page.getByRole('button', { name: /Next Step/i }).click();
  await page.getByLabel('Full Lore').fill('Founders document every rule before citizens vote on canon.');

  await expect(page.getByRole('button', { name: /Publish Proposal/i })).toBeEnabled();
});
