import { test as setup } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

// Defaults match the local seed data (prisma/seed.ts). Override when running
// against a deployed environment — staging users are userN@staging.invalid
// with the password set by scripts/refresh-staging-db.sh.
const email = process.env.E2E_EMAIL || 'lars@ting.com';
const password = process.env.E2E_PASSWORD || 'user123';

setup('authenticate as member', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/e-?post|email/i).fill(email);
  await page.getByLabel(/passord|password/i).fill(password);
  await page.getByRole('button', { name: /logg inn|login/i }).click();
  await page.waitForURL('/catalog');
  await page.context().storageState({ path: authFile });
});
