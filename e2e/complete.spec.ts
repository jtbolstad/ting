import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should register a new user', async ({ page }) => {
    await page.click('text=Register');
    await expect(page).toHaveURL('/register');

    // Fill registration form
    await page.fill('input[type="email"]', `testuser${Date.now()}@example.com`);
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[name="name"], input[placeholder*="name" i]', 'Test User');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to catalog after successful registration
    await expect(page).toHaveURL('/catalog', { timeout: 5000 });
    await expect(page.locator('text=Logout')).toBeVisible();
  });

  test('should login existing user', async ({ page }) => {
    await page.click('text=Login');
    await expect(page).toHaveURL('/login');

    // Login with seeded user
    await page.fill('input[type="email"]', 'user@ting.com');
    await page.fill('input[type="password"]', 'user123');
    await page.click('button[type="submit"]');

    // Should redirect to catalog
    await expect(page).toHaveURL('/catalog', { timeout: 5000 });
    await expect(page.locator('text=Logout')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.click('text=Login');
    
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=/invalid|failed|error/i')).toBeVisible({ timeout: 3000 });
  });

  test('should logout user', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'user@ting.com');
    await page.fill('input[type="password"]', 'user123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/catalog');

    // Logout
    await page.click('text=Logout');
    
    // Should show login/register buttons
    await expect(page.locator('text=Login')).toBeVisible();
    await expect(page.locator('text=Register')).toBeVisible();
  });
});

test.describe('Catalog and Search', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'user@ting.com');
    await page.fill('input[type="password"]', 'user123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/catalog');
  });

  test('should display catalog items', async ({ page }) => {
    // Should see items from seed data
    await expect(page.locator('text=Cordless Drill')).toBeVisible();
    await expect(page.locator('text=Power Tools')).toBeVisible();
  });

  test('should filter by category', async ({ page }) => {
    // Click on a category
    await page.click('text=Gardening');

    // Should show gardening items
    await expect(page.locator('text=Lawn Mower')).toBeVisible();
  });

  test('should search items', async ({ page }) => {
    await page.fill('input[placeholder*="Search" i]', 'drill');
    await page.click('button[type="submit"]:has-text("Search")');

    // Should show drill items
    await expect(page.locator('text=/drill/i')).toBeVisible();
  });

  test('should navigate to item detail', async ({ page }) => {
    await page.click('text=Cordless Drill').first();

    // Should be on item detail page
    await expect(page).toHaveURL(/\/items\/[a-z0-9-]+/);
    await expect(page.locator('text=Cordless Drill')).toBeVisible();
    await expect(page.locator('text=/available|checked out/i')).toBeVisible();
  });
});

test.describe('Reservations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'user@ting.com');
    await page.fill('input[type="password"]', 'user123');
    await page.click('button[type="submit"]');
    await page.goto('/catalog');
  });

  test('should create a reservation', async ({ page }) => {
    // Find an available item
    await page.click('text=Cordless Drill').first();

    // Fill reservation form
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    await page.fill('input[type="date"]', tomorrow.toISOString().split('T')[0]);
    await page.fill('input[type="date"]:nth-of-type(2)', nextWeek.toISOString().split('T')[0]);

    await page.click('button:has-text("Reserve")');

    // Should show success message or redirect
    await expect(
      page.locator('text=/success|reserved|dashboard/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should view reservations in dashboard', async ({ page }) => {
    await page.click('text=My Dashboard');
    await expect(page).toHaveURL('/dashboard');

    // Should see reservations section
    await expect(page.locator('text=/reservations/i')).toBeVisible();
  });
});

test.describe('Language Switching', () => {
  test('should switch to Norwegian', async ({ page }) => {
    await page.goto('/');

    // Click language switcher
    await page.click('text=🇬🇧');
    await page.click('text=Norsk');

    // Should see Norwegian text
    await expect(page.locator('text=Logg Inn')).toBeVisible();
    await expect(page.locator('text=Registrer')).toBeVisible();
  });

  test('should switch to Danish', async ({ page }) => {
    await page.goto('/');

    await page.click('text=🇬🇧');
    await page.click('text=Dansk');

    // Should see Danish text
    await expect(page.locator('text=Log Ind')).toBeVisible();
    await expect(page.locator('text=Tilmeld')).toBeVisible();
  });

  test('should persist language choice', async ({ page }) => {
    await page.goto('/');
    
    // Switch to Norwegian
    await page.click('text=🇬🇧');
    await page.click('text=Norsk');
    
    // Reload page
    await page.reload();
    
    // Should still be in Norwegian
    await expect(page.locator('text=Logg Inn')).toBeVisible();
  });
});

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@ting.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.goto('/admin');
  });

  test('should display admin dashboard', async ({ page }) => {
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
    await expect(page.locator('text=/total items/i')).toBeVisible();
    await expect(page.locator('text=/active loans/i')).toBeVisible();
  });

  test('should show tabs', async ({ page }) => {
    await expect(page.locator('text=Loans')).toBeVisible();
    await expect(page.locator('text=Items')).toBeVisible();
    await expect(page.locator('text=Users')).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    // Click Items tab
    await page.click('button:has-text("Items")');
    await expect(page.locator('button:has-text("Add Item")')).toBeVisible();

    // Click Users tab
    await page.click('button:has-text("Users")');
    await expect(page.locator('text=/user|member/i')).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Should still render correctly
    await expect(page.locator('text=Ting')).toBeVisible();
    await expect(page.locator('text=Login')).toBeVisible();
  });

  test('should work on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    await expect(page.locator('text=Ting')).toBeVisible();
  });
});
