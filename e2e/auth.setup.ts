import { test as setup } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const authFile = path.join(__dirname, '.auth/user.json');

setup('authenticate as member', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/e-?post|email/i).fill('lars@ting.com');
  await page.getByLabel(/passord|password/i).fill('user123');
  await page.getByRole('button', { name: /logg inn|login/i }).click();
  await page.waitForURL('/catalog');
  await page.context().storageState({ path: authFile });
});
