import { test as base } from '@playwright/test';

/**
 * Extended test fixture with common setup and utilities
 */
export const test = base.extend({
  /**
   * Authenticated page - automatically logs in before each test
   */
  // eslint-disable-next-line react-hooks/rules-of-hooks
  authenticatedPage: async ({ page }, use) => {
    // Navigate to sign in page
    await page.goto('/auth/signin');

    // Fill in login credentials (these should match your test user)
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpassword');

    // Click sign in button
    await page.click('button[type="submit"]');

    // Wait for navigation to complete
    await page.waitForURL(/^(?!.*\/auth\/signin)/);

    // Use the authenticated page
    await use(page);
  },
});

export { expect } from '@playwright/test';
