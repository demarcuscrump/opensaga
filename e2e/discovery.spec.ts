import { expect, test } from '@playwright/test';

test('discovery search filters worlds and characters', async ({ page }) => {
  await page.goto('/#/explore');

  await expect(page.getByRole('heading', { name: 'Explore' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Neo-Tokyo 2087' })).toBeVisible();

  await page.getByPlaceholder('Search worlds, characters, genres...').fill('Aethelgard');

  await expect(page.getByRole('heading', { name: 'Aethelgard' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Neo-Tokyo 2087' })).not.toBeVisible();
});
