# Testing Guide

This document provides comprehensive guidance for testing the NXFS Frontend application using Jest, React Testing Library, and Playwright.

## Table of Contents

- [Testing Stack](#testing-stack)
- [Running Tests](#running-tests)
- [Unit Testing with Jest](#unit-testing-with-jest)
- [E2E Testing with Playwright](#e2e-testing-with-playwright)
- [Test Structure](#test-structure)
- [Best Practices](#best-practices)
- [Chrome DevTools MCP Integration](#chrome-devtools-mcp-integration)
- [Writing New Tests](#writing-new-tests)
- [CI/CD Integration](#cicd-integration)

## Testing Stack

### Unit & Integration Testing

- **Jest** - Testing framework with coverage reporting
- **React Testing Library** - Component testing utilities
- **@testing-library/user-event** - User interaction simulation
- **@testing-library/jest-dom** - Custom DOM matchers

### End-to-End Testing

- **Playwright** - Browser automation and E2E testing
- **Chrome DevTools MCP** - Advanced debugging and performance profiling
- Multi-browser support (Chromium, Firefox, WebKit)
- Mobile device emulation

## Running Tests

### Unit Tests

```bash
# Run tests in watch mode (for development)
npm run test

# Run all tests once with coverage (for CI)
npm run test:ci

# Run tests with coverage report
npm run test:coverage
```

### E2E Tests

```bash
# Run E2E tests headless
npm run test:e2e

# Run E2E tests with UI (interactive mode)
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed
```

## Unit Testing with Jest

### Configuration

Jest is configured via `jest.config.ts`:

- **Test Environment**: jsdom (simulates browser environment)
- **Path Mapping**: `@/*` aliases to `src/*`
- **Setup File**: `jest.setup.ts` (runs before each test)
- **Coverage Thresholds**: 50% for all metrics (branches, functions, lines, statements)

### Test Utilities

#### Test Utils (`src/__tests__/utils/test-utils.tsx`)

```typescript
import { renderWithProviders } from '@/__tests__/utils/test-utils';

test('renders component with providers', () => {
  const { getByText } = renderWithProviders(<MyComponent />);
  expect(getByText('Hello')).toBeInTheDocument();
});
```

**Available Utilities:**

- `renderWithProviders()` - Renders components with QueryClient and other providers
- `createTestQueryClient()` - Creates isolated QueryClient for testing
- `mockLocalStorage` - Mock localStorage implementation
- `mockSessionStorage` - Mock sessionStorage implementation
- `waitForCondition()` - Wait for async conditions
- `flushPromises()` - Flush pending promises

#### Mock Data (`src/__tests__/utils/mock-data.ts`)

```typescript
import { mockUser, mockTask, mockTokens } from '@/__tests__/utils/mock-data';

// Use pre-defined mock data in your tests
expect(response).toEqual(mockUser);
```

**Available Mocks:**

- `mockUser` - Standard user object
- `mockAdminUser` - Admin user object
- `mockTask` - Single task object
- `mockTasks` - Array of tasks
- `mockBlogPost` - Blog post object
- `mockTokens` - JWT tokens
- `createMockPaginatedResponse()` - Generate paginated API responses

### Writing Unit Tests

#### Testing Hooks

```typescript
// src/hooks/__tests__/use-debounce.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useDebounce } from '../use-debounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    rerender({ value: 'updated', delay: 500 });
    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(result.current).toBe('updated');
    });
  });
});
```

#### Testing API Clients

```typescript
// src/lib/api/__tests__/tasks-api.test.ts
import axios from 'axios';
import { tasksAPI } from '@/lib/api';
import { mockTasks } from '@/__tests__/utils/mock-data';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('tasksAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all tasks successfully', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockTasks });

    const result = await tasksAPI.getTasks();

    expect(mockedAxios.get).toHaveBeenCalledWith('/app/tasks/tasks/');
    expect(result).toEqual(mockTasks);
  });

  it('should handle errors when fetching tasks', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

    await expect(tasksAPI.getTasks()).rejects.toThrow('Network error');
  });
});
```

#### Testing Components

```typescript
import { renderWithProviders, userEvent } from '@/__tests__/utils/test-utils';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should handle user interactions', async () => {
    const user = userEvent.setup();
    const { getByRole, getByText } = renderWithProviders(<MyComponent />);

    const button = getByRole('button', { name: /submit/i });
    await user.click(button);

    expect(getByText('Success!')).toBeInTheDocument();
  });
});
```

## E2E Testing with Playwright

### Configuration

Playwright is configured via `playwright.config.ts`:

- **Base URL**: `http://10.20.30.202:3000` (development server)
- **Test Directory**: `e2e/`
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Auto-start Dev Server**: Runs `npm run dev` before tests
- **Screenshots**: Captured on failure
- **Videos**: Retained on failure
- **Traces**: Recorded on retry

### Test Fixtures

Custom fixtures in `e2e/fixtures.ts`:

```typescript
import { test, expect } from './fixtures';

test.describe('Protected Page', () => {
  // Automatically authenticated
  test.use({ authenticatedPage: true });

  test('should access protected content', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });
});
```

### Writing E2E Tests

#### Authentication Flow

```typescript
// e2e/auth.spec.ts
import { test, expect } from './fixtures';

test.describe('Authentication Flow', () => {
  test('should successfully sign in', async ({ page }) => {
    await page.goto('/auth/signin');

    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => !url.pathname.includes('/auth/signin'));
    expect(page.url()).not.toContain('/auth/signin');
  });
});
```

#### Task Management Workflow

```typescript
// e2e/tasks.spec.ts
import { test, expect } from './fixtures';

test.describe('Task Management', () => {
  test.use({ authenticatedPage: true });

  test('should create a new task', async ({ authenticatedPage: page }) => {
    await page.goto('/tasks');

    const createButton = page.locator('button:has-text("Create")').first();
    await createButton.click();

    const taskTitle = `E2E Test Task ${Date.now()}`;
    await page.fill('input[name="title"]', taskTitle);
    await page.click('button[type="submit"]');

    await expect(page.locator(`text="${taskTitle}"`)).toBeVisible();
  });
});
```

## Chrome DevTools MCP Integration

Playwright tests have access to Chrome DevTools MCP for advanced debugging and performance profiling.

### Performance Testing

```typescript
// Use Chrome DevTools MCP in tests
test('should meet performance budgets', async ({ page }) => {
  // Start performance trace
  await page.evaluate(() => {
    // Interact with Chrome DevTools MCP
  });

  await page.goto('/');

  // Analyze Core Web Vitals
  // Check LCP, CLS, FCP metrics
});
```

### Network Debugging

```typescript
test('should handle API errors gracefully', async ({ page }) => {
  // Monitor network requests
  page.on('request', (request) => {
    console.log('Request:', request.url());
  });

  page.on('response', (response) => {
    console.log('Response:', response.status(), response.url());
  });

  await page.goto('/tasks');
});
```

## Test Structure

### Directory Organization

```
nxfs_frontend/
├── src/
│   ├── hooks/
│   │   ├── __tests__/
│   │   │   ├── use-debounce.test.ts
│   │   │   └── use-local-storage.test.ts
│   │   └── ...
│   ├── lib/
│   │   └── api/
│   │       ├── __tests__/
│   │       │   ├── auth-api.test.ts
│   │       │   └── tasks-api.test.ts
│   │       └── ...
│   └── __tests__/
│       └── utils/
│           ├── test-utils.tsx
│           └── mock-data.ts
├── e2e/
│   ├── fixtures.ts
│   ├── auth.spec.ts
│   └── tasks.spec.ts
├── jest.config.ts
├── jest.setup.ts
└── playwright.config.ts
```

### Naming Conventions

- **Unit Tests**: `*.test.ts` or `*.test.tsx`
- **E2E Tests**: `*.spec.ts`
- **Test Directories**: `__tests__/` (for unit tests)
- **E2E Directory**: `e2e/` (at project root)

## Best Practices

### Unit Testing

1. **Isolate Tests**: Each test should be independent
2. **Mock External Dependencies**: Use jest.mock() for API calls, external services
3. **Test Behavior, Not Implementation**: Focus on what the code does, not how
4. **Use Descriptive Names**: Test names should explain what is being tested
5. **Arrange-Act-Assert**: Structure tests with clear setup, action, and verification
6. **Clean Up**: Reset mocks and timers in afterEach()

```typescript
describe('Component', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should do something when condition is met', () => {
    // Arrange
    const props = { value: 'test' };

    // Act
    const { getByText } = renderWithProviders(<Component {...props} />);

    // Assert
    expect(getByText('test')).toBeInTheDocument();
  });
});
```

### E2E Testing

1. **Use Page Object Model**: Encapsulate page interactions
2. **Wait for Network Idle**: Ensure page is fully loaded
3. **Use Semantic Selectors**: Prefer role, label, text over CSS selectors
4. **Test User Flows**: Test complete workflows, not just individual actions
5. **Handle Async Operations**: Use waitFor, waitForURL, waitForTimeout appropriately
6. **Clean State**: Clear cookies/storage before each test

```typescript
test.beforeEach(async ({ page }) => {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});
```

### Coverage Goals

- **Statements**: 50% minimum
- **Branches**: 50% minimum
- **Functions**: 50% minimum
- **Lines**: 50% minimum

These thresholds are enforced by Jest and will cause the test suite to fail if not met.

## Writing New Tests

### Adding Unit Tests

1. Create test file next to the file being tested:

   ```
   src/hooks/use-my-hook.ts
   src/hooks/__tests__/use-my-hook.test.ts
   ```

2. Import test utilities:

   ```typescript
   import { renderHook } from '@testing-library/react';
   import { useMyHook } from '../use-my-hook';
   ```

3. Write tests following AAA pattern:

   ```typescript
   describe('useMyHook', () => {
     it('should do something', () => {
       // Arrange
       const initialValue = 'test';

       // Act
       const { result } = renderHook(() => useMyHook(initialValue));

       // Assert
       expect(result.current).toBe('test');
     });
   });
   ```

### Adding E2E Tests

1. Create test file in `e2e/` directory:

   ```
   e2e/my-feature.spec.ts
   ```

2. Import fixtures:

   ```typescript
   import { test, expect } from './fixtures';
   ```

3. Write test scenario:
   ```typescript
   test.describe('My Feature', () => {
     test('should complete user flow', async ({ page }) => {
       await page.goto('/my-feature');
       // ... test steps
     });
   });
   ```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

### Pre-commit Hooks (Future)

When Husky is configured (Phase 3):

```bash
# Automatically runs before commit
- npm run lint
- npm run format
- npm run test:ci
```

## Troubleshooting

### Jest Issues

**Problem**: "Cannot find module"
**Solution**: Check path aliases in jest.config.ts match tsconfig.json

**Problem**: "Timeout"
**Solution**: Increase timeout in jest.config.ts or specific test:

```typescript
jest.setTimeout(10000);
```

### Playwright Issues

**Problem**: "Timed out waiting for selector"
**Solution**: Increase timeout or check if element is dynamic:

```typescript
await expect(element).toBeVisible({ timeout: 10000 });
```

**Problem**: "Browser not found"
**Solution**: Install browsers:

```bash
npx playwright install
```

## Test Coverage Reports

Coverage reports are generated in `coverage/` directory:

- **HTML Report**: `coverage/lcov-report/index.html`
- **Text Summary**: Printed to console after `npm run test:coverage`

View HTML report:

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Chrome DevTools MCP Integration](./CHROME_DEVTOOLS_MCP.md)

---

_Last Updated: 2025-10-06_
_Testing Infrastructure: Phase 2 Complete ✅_
