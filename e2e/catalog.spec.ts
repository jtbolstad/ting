import { test, expect } from '@playwright/test';

test.describe('Katalog', () => {
  test('viser ting i katalogen', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page.getByText('18V Cordless Drill')).toBeVisible();
    await expect(page.getByText('Orbital Sander')).toBeVisible();
  });

  test('kan søke etter ting', async ({ page }) => {
    await page.goto('/catalog');
    await page.getByRole('textbox').fill('drill');
    await page.getByRole('button', { name: /søk|search/i }).click();
    await expect(page.getByText('18V Cordless Drill')).toBeVisible();
    await expect(page.getByText('Orbital Sander')).not.toBeVisible();
  });

  test('kan åpne detaljer for et ting', async ({ page }) => {
    await page.goto('/catalog');
    await page.getByText('18V Cordless Drill').click();
    await expect(page).toHaveURL(/\/items\/18v-cordless-drill-/);
    await expect(page.getByRole('heading', { name: '18V Cordless Drill' })).toBeVisible();
  });
});
