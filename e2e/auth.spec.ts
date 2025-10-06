import { test, expect } from './fixtures';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies and storage before each test
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should display sign in page', async ({ page }) => {
    await page.goto('/auth/signin');

    // Check for sign in form elements
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show validation errors for empty form submission', async ({
    page,
  }) => {
    await page.goto('/auth/signin');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Wait for validation errors to appear
    await expect(page.locator('text=/required/i').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin');

    // Fill in invalid credentials
    await page.fill('input[name="username"]', 'invaliduser');
    await page.fill('input[name="password"]', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for error message
    await expect(
      page.locator('text=/invalid|error|incorrect/i').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('should successfully sign in with valid credentials', async ({
    page,
  }) => {
    await page.goto('/auth/signin');

    // Fill in valid credentials (adjust these to match your test environment)
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect away from sign in page
    await page.waitForURL((url) => !url.pathname.includes('/auth/signin'), {
      timeout: 10000,
    });

    // Verify we're on a protected page (e.g., dashboard or home)
    expect(page.url()).not.toContain('/auth/signin');

    // Verify navbar is present (indicates authenticated state)
    await expect(page.locator('nav').first()).toBeVisible();
  });

  test('should redirect to sign in when accessing protected page while unauthenticated', async ({
    page,
  }) => {
    // Try to access a protected page
    await page.goto('/tasks');

    // Should be redirected to sign in
    await page.waitForURL('**/auth/signin', { timeout: 10000 });
    expect(page.url()).toContain('/auth/signin');
  });

  test('should display sign up page', async ({ page }) => {
    await page.goto('/auth/signup');

    // Check for sign up form elements
    await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible();
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();
  });

  test('should navigate between sign in and sign up pages', async ({
    page,
  }) => {
    await page.goto('/auth/signin');

    // Look for link to sign up page
    const signUpLink = page.locator('a[href*="signup"]');
    await expect(signUpLink).toBeVisible();
    await signUpLink.click();

    // Should be on sign up page
    await expect(page).toHaveURL(/.*signup/);

    // Look for link back to sign in page
    const signInLink = page.locator('a[href*="signin"]');
    await expect(signInLink).toBeVisible();
    await signInLink.click();

    // Should be back on sign in page
    await expect(page).toHaveURL(/.*signin/);
  });

  test('should persist authentication across page reloads', async ({
    page,
  }) => {
    // Sign in first
    await page.goto('/auth/signin');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');

    // Wait for successful authentication
    await page.waitForURL((url) => !url.pathname.includes('/auth/signin'), {
      timeout: 10000,
    });

    // Reload the page
    await page.reload();

    // Should still be authenticated (not redirected to sign in)
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/auth/signin');

    // Navbar should still be visible
    await expect(page.locator('nav').first()).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Sign in first
    await page.goto('/auth/signin');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');

    // Wait for successful authentication
    await page.waitForURL((url) => !url.pathname.includes('/auth/signin'), {
      timeout: 10000,
    });

    // Find and click logout button (may be in a dropdown or menu)
    // This selector may need to be adjusted based on your UI
    const logoutButton = page
      .locator('button:has-text("Log out"), a:has-text("Log out")')
      .first();

    // If logout is in a dropdown, open it first
    const userMenuButton = page
      .locator('[aria-label*="user menu"], [aria-label*="account"]')
      .first();
    if (await userMenuButton.isVisible()) {
      await userMenuButton.click();
    }

    await logoutButton.click();

    // Should be redirected to sign in page
    await page.waitForURL('**/auth/signin', { timeout: 10000 });
    expect(page.url()).toContain('/auth/signin');
  });
});
