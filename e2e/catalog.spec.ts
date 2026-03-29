import { test, expect } from '@playwright/test';

test.describe('Katalog', () => {
  test('viser ting i katalogen', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page.getByRole('heading', { name: '18V Cordless Drill' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Orbital Sander' }).first()).toBeVisible();
  });

  test('kan søke etter ting', async ({ page }) => {
    await page.goto('/catalog');
    await page.getByRole('textbox').fill('drill');
    await page.getByRole('button', { name: /søk|search/i }).click();
    await expect(page.getByRole('heading', { name: '18V Cordless Drill' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Orbital Sander' })).not.toBeVisible();
  });

  test('kan åpne detaljer for et ting', async ({ page }) => {
    await page.goto('/catalog');
    await page.getByRole('link', { name: /18V Cordless Drill/ }).first().click();
    await expect(page).toHaveURL(/\/items\/18v-cordless-drill-/);
    await expect(page.getByRole('heading', { name: '18V Cordless Drill' })).toBeVisible();
  });
});
