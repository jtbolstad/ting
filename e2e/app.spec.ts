import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should register a new user', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[type="email"]', `test-${Date.now()}@test.com`);
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[type="password"]', 'password123');

    await page.click('button[type="submit"]');

    // Should redirect to catalog after registration
    await expect(page).toHaveURL('/catalog');
    await expect(page.locator('text=Test User')).toBeVisible();
  });

  test('should login with existing account', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'user@ting.com');
    await page.fill('input[type="password"]', 'user123');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/catalog');
    await expect(page.locator('text=Test User')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'wrong@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=/Invalid credentials/i')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'user@ting.com');
    await page.fill('input[type="password"]', 'user123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/catalog');

    // Then logout
    await page.click('button:has-text("Logout")');

    // Should redirect to login and show login/register options
    await expect(page.locator('a:has-text("Login")')).toBeVisible();
  });
});

test.describe('Item Catalog', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'user@ting.com');
    await page.fill('input[type="password"]', 'user123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/catalog');
  });

  test('should display items in catalog', async ({ page }) => {
    await page.goto('/catalog');

    // Should show items
    await expect(page.locator('text=Cordless Drill')).toBeVisible();
    await expect(page.locator('text=Circular Saw')).toBeVisible();
  });

  test('should search for items', async ({ page }) => {
    await page.goto('/catalog');

    await page.fill('input[placeholder*="Search"]', 'drill');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Cordless Drill')).toBeVisible();
    await expect(page.locator('text=Circular Saw')).not.toBeVisible();
  });

  test('should filter by category', async ({ page }) => {
    await page.goto('/catalog');

    await page.click('button:has-text("Power Tools")');

    await expect(page.locator('text=Cordless Drill')).toBeVisible();
  });

  test('should view item details', async ({ page }) => {
    await page.goto('/catalog');

    await page.click('text=Cordless Drill');

    await expect(page.locator('h1:has-text("Cordless Drill")')).toBeVisible();
    await expect(page.locator('text=AVAILABLE')).toBeVisible();
  });
});

test.describe('Reservations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'user@ting.com');
    await page.fill('input[type="password"]', 'user123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/catalog');
  });

  test('should create a reservation', async ({ page }) => {
    await page.goto('/catalog');
    await page.click('text=Cordless Drill');

    // Fill reservation form
    const tomorrow = new Date(Date.now() + 86400000);
    const dayAfter = new Date(Date.now() + 172800000);

    await page.fill('input[type="date"]', tomorrow.toISOString().split('T')[0]);
    await page.locator('input[type="date"]').nth(1).fill(dayAfter.toISOString().split('T')[0]);

    await page.click('button:has-text("Reserve")');

    await expect(page.locator('text=/success/i')).toBeVisible();
  });

  test('should view reservations in dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.locator('h2:has-text("My Reservations")')).toBeVisible();
  });

  test('should cancel a reservation', async ({ page }) => {
    await page.goto('/dashboard');

    // Click cancel on first reservation
    await page.click('button:has-text("Cancel")');

    // Confirm if there's a confirmation dialog
    page.on('dialog', dialog => dialog.accept());

    await expect(page.locator('text=/cancelled/i')).toBeVisible();
  });
});

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@ting.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/catalog');
  });

  test('should access admin dashboard', async ({ page }) => {
    await page.goto('/admin');

    await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
    await expect(page.locator('text=Total Items')).toBeVisible();
  });

  test('should add new item', async ({ page }) => {
    await page.goto('/admin');

    await page.click('button:has-text("Add Item")');

    await page.fill('input[type="text"]', 'New Test Item');
    await page.fill('textarea', 'Description of new item');
    await page.selectOption('select', { index: 0 });

    await page.click('button:has-text("Add Item")');

    await expect(page.locator('text=New Test Item')).toBeVisible();
  });

  test('should checkout item to user', async ({ page }) => {
    await page.goto('/admin');

    await page.click('button:has-text("Checkout Item")');

    // Select item and user
    await page.selectOption('select', { index: 0 });
    
    const weekFromNow = new Date(Date.now() + 604800000);
    await page.fill('input[type="date"]', weekFromNow.toISOString().split('T')[0]);

    await page.click('button[type="submit"]');

    await expect(page.locator('text=/checked out/i')).toBeVisible();
  });

  test('should view all users', async ({ page }) => {
    await page.goto('/admin');

    await page.click('button:has-text("Users")');

    await expect(page.locator('text=admin@ting.com')).toBeVisible();
    await expect(page.locator('text=user@ting.com')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have proper page titles', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Ting/);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/login');

    // Tab through form fields
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="email"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="password"]')).toBeFocused();
  });
});
