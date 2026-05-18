import { expect, test } from '@playwright/test';

test('landing page supports theme switching and exploration navigation', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Forge Universes.')).toBeVisible();
  await expect(page.getByText('Govern Canon.')).toBeVisible();

  await page.getByRole('button', { name: /Noir/i }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper');

  await page.getByRole('link', { name: /Explore Worlds/i }).click();
  await expect(page).toHaveURL(/#\/explore$/);
  await expect(page.getByRole('heading', { name: 'Explore' })).toBeVisible();
});
