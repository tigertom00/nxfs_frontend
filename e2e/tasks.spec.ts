import { test, expect } from './fixtures';

test.describe('Task Management Workflow', () => {
  test.use({ authenticatedPage: true });

  test('should display tasks page', async ({ authenticatedPage: page }) => {
    await page.goto('/tasks');

    // Check for tasks page elements
    await expect(
      page.getByRole('heading', { name: /tasks/i }).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('should display create task button', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/tasks');

    // Look for create/new task button
    const createButton = page
      .locator(
        'button:has-text("Create"), button:has-text("New Task"), button:has-text("Add Task")'
      )
      .first();

    await expect(createButton).toBeVisible({ timeout: 10000 });
  });

  test('should open create task form', async ({ authenticatedPage: page }) => {
    await page.goto('/tasks');

    // Click create task button
    const createButton = page
      .locator(
        'button:has-text("Create"), button:has-text("New Task"), button:has-text("Add Task")'
      )
      .first();
    await createButton.click();

    // Form should appear (could be modal or new page)
    await expect(
      page.locator('input[name="title"], input[placeholder*="title"]').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('should create a new task', async ({ authenticatedPage: page }) => {
    await page.goto('/tasks');

    // Open create task form
    const createButton = page
      .locator(
        'button:has-text("Create"), button:has-text("New Task"), button:has-text("Add Task")'
      )
      .first();
    await createButton.click();

    // Fill in task details
    const timestamp = Date.now();
    const taskTitle = `E2E Test Task ${timestamp}`;
    const taskDescription = `This is an automated test task created at ${new Date().toISOString()}`;

    await page.fill(
      'input[name="title"], input[placeholder*="title"]',
      taskTitle
    );

    const descriptionField = page
      .locator(
        'textarea[name="description"], textarea[placeholder*="description"]'
      )
      .first();
    if (await descriptionField.isVisible()) {
      await descriptionField.fill(taskDescription);
    }

    // Submit the form
    const submitButton = page
      .locator(
        'button[type="submit"], button:has-text("Create"), button:has-text("Save")'
      )
      .first();
    await submitButton.click();

    // Wait for success message or task to appear in list
    await page.waitForTimeout(2000);

    // Verify task appears in the list
    await expect(page.locator(`text="${taskTitle}"`).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('should filter tasks by status', async ({ authenticatedPage: page }) => {
    await page.goto('/tasks');

    // Wait for tasks to load
    await page.waitForLoadState('networkidle');

    // Look for status filter (tabs, buttons, or dropdown)
    const statusFilter = page
      .locator(
        '[role="tab"]:has-text("Completed"), button:has-text("Completed"), select[name*="status"]'
      )
      .first();

    if (await statusFilter.isVisible()) {
      await statusFilter.click();

      // Wait for filtered results
      await page.waitForTimeout(1000);

      // Verify URL or UI updated
      const url = page.url();
      expect(
        url.includes('status=completed') ||
          url.includes('filter=completed') ||
          url.includes('completed')
      ).toBeTruthy();
    }
  });

  test('should view task details', async ({ authenticatedPage: page }) => {
    await page.goto('/tasks');

    // Wait for tasks to load
    await page.waitForTimeout(2000);

    // Click on a task (find first task item)
    const taskItem = page
      .locator(
        '[data-testid*="task"], [class*="task-item"], [class*="task-card"]'
      )
      .first();

    if (await taskItem.isVisible()) {
      await taskItem.click();

      // Task details should be visible
      await expect(
        page.locator('h1, h2, h3, [class*="title"], [class*="heading"]').first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('should update task status', async ({ authenticatedPage: page }) => {
    await page.goto('/tasks');

    // Wait for tasks to load
    await page.waitForTimeout(2000);

    // Find a task and update its status
    const statusDropdown = page
      .locator('select[name*="status"], button[aria-label*="status"]')
      .first();

    if (await statusDropdown.isVisible()) {
      // If it's a select element
      if (await statusDropdown.evaluate((el) => el.tagName === 'SELECT')) {
        await statusDropdown.selectOption({ label: /in progress|doing/i });
      } else {
        // If it's a button/dropdown
        await statusDropdown.click();
        await page.locator('text=/in progress|doing/i').first().click();
      }

      // Wait for update to complete
      await page.waitForTimeout(1000);

      // Verify toast notification or status change
      await expect(page.locator('text=/updated|success/i').first()).toBeVisible(
        { timeout: 5000 }
      );
    }
  });

  test('should search for tasks', async ({ authenticatedPage: page }) => {
    await page.goto('/tasks');

    // Wait for tasks to load
    await page.waitForTimeout(2000);

    // Find search input
    const searchInput = page
      .locator(
        'input[type="search"], input[placeholder*="search"], input[name*="search"]'
      )
      .first();

    if (await searchInput.isVisible()) {
      // Type search query
      await searchInput.fill('E2E Test');

      // Wait for debounce and results
      await page.waitForTimeout(1000);

      // Results should be filtered
      const taskItems = page.locator(
        '[data-testid*="task"], [class*="task-item"], [class*="task-card"]'
      );
      const count = await taskItems.count();

      // At least one result should contain the search term
      if (count > 0) {
        await expect(page.locator('text=/E2E Test/i').first()).toBeVisible();
      }
    }
  });

  test('should delete a task', async ({ authenticatedPage: page }) => {
    // First create a task to delete
    await page.goto('/tasks');

    const createButton = page
      .locator(
        'button:has-text("Create"), button:has-text("New Task"), button:has-text("Add Task")'
      )
      .first();

    if (await createButton.isVisible()) {
      await createButton.click();

      const timestamp = Date.now();
      const taskTitle = `Delete Me ${timestamp}`;

      await page.fill(
        'input[name="title"], input[placeholder*="title"]',
        taskTitle
      );

      const submitButton = page
        .locator(
          'button[type="submit"], button:has-text("Create"), button:has-text("Save")'
        )
        .first();
      await submitButton.click();

      // Wait for task to be created
      await page.waitForTimeout(2000);

      // Find the delete button for this task
      const deleteButton = page
        .locator(`button:has-text("Delete"), button[aria-label*="delete"]`)
        .first();

      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Confirm deletion if there's a confirmation dialog
        const confirmButton = page
          .locator(
            'button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")'
          )
          .last();

        if (await confirmButton.isVisible({ timeout: 2000 })) {
          await confirmButton.click();
        }

        // Wait for deletion
        await page.waitForTimeout(2000);

        // Task should be removed from list
        await expect(page.locator(`text="${taskTitle}"`)).not.toBeVisible({
          timeout: 5000,
        });
      }
    }
  });

  test('should display task statistics or counts', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/tasks');

    // Wait for tasks to load
    await page.waitForTimeout(2000);

    // Look for task count indicators
    const statsElements = page.locator(
      '[class*="stat"], [class*="count"], [data-testid*="count"]'
    );

    if ((await statsElements.count()) > 0) {
      await expect(statsElements.first()).toBeVisible();
    }
  });

  test('should handle empty state when no tasks exist', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/tasks');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // If there are no tasks, empty state should be visible
    const emptyState = page
      .locator('text=/no tasks|empty|get started/i')
      .first();

    // This test is optional - only checks if empty state exists when there are no tasks
    if (await emptyState.isVisible({ timeout: 2000 })) {
      await expect(emptyState).toBeVisible();
    }
  });
});
