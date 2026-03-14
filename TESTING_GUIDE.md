# Testing Guide for Ting

## Overview

This project uses:
- **Vitest** - Fast unit testing framework
- **@vitest/browser** - Browser-based component testing
- **Playwright** - End-to-end testing across browsers
- **Testing Library** - React component testing utilities

## Running Tests

### All Tests
```bash
pnpm test              # Run all unit tests
pnpm test:e2e          # Run E2E tests with Playwright
pnpm test:coverage     # Run tests with coverage report
```

### Backend Tests (Server)
```bash
cd packages/server
pnpm test              # Run all backend tests
pnpm test:ui           # Run with Vitest UI
pnpm test:coverage     # Generate coverage report
```

Tests include:
- `auth.test.ts` - Authentication flow (register, login, token validation)
- `items.test.ts` - Database operations (CRUD, querying, filtering)

### Frontend Tests (Client)
```bash
cd packages/client
pnpm test              # Run all React component tests
pnpm test:ui           # Run with Vitest UI
pnpm test:coverage     # Generate coverage report
```

Tests include:
- `Login.test.tsx` - Login component rendering and validation
- `Navbar.test.tsx` - Navigation component for different auth states

### E2E Tests (Playwright)
```bash
pnpm test:e2e                    # Run all E2E tests
pnpm test:e2e --project=chromium # Run in specific browser
pnpm test:e2e --ui               # Run with Playwright UI
pnpm test:e2e --debug            # Run in debug mode
```

E2E test suites:
- Authentication flow (register, login, logout)
- Catalog browsing and search
- Item reservations
- Language switching (EN, NO, DA)
- Admin dashboard
- Responsive design (mobile, tablet, desktop)

## Test Structure

### Backend Tests

**Database Tests** (`items.test.ts`):
- Uses separate test database (`test-items.db`)
- Tests Prisma operations directly
- Covers CRUD operations, querying, filtering

**API Tests** (`auth.test.ts`):
- Uses supertest for HTTP testing
- Tests full request/response cycle
- Validates authentication flow

### Frontend Tests

**Component Tests**:
- Uses Testing Library for rendering
- Mocks i18next for translations
- Tests user interactions and state changes

**Browser Tests** (with @vitest/browser):
```bash
cd packages/client
pnpm test --browser  # Run tests in real browser
```

### E2E Tests

Tests cover complete user journeys:
1. **Authentication**: Register → Login → Logout
2. **Browsing**: View catalog → Filter categories → Search items
3. **Reservations**: Select item → Create reservation → View in dashboard
4. **i18n**: Switch languages → Verify translations persist
5. **Admin**: View dashboard → Manage items/users/loans

## Writing Tests

### Backend API Test Example
```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './app';

describe('GET /items', () => {
  it('should return items list', async () => {
    const response = await request(app).get('/items');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### React Component Test Example
```typescript
import { render, screen } from '@testing-library/react';
import { Login } from './Login';

test('renders login form', () => {
  render(<Login />);
  expect(screen.getByLabelText('Email')).toBeInTheDocument();
});
```

### E2E Test Example
```typescript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'user@ting.com');
  await page.fill('input[type="password"]', 'user123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/catalog');
});
```

## Coverage

View coverage reports:
```bash
# Backend
cd packages/server && pnpm test:coverage
# Opens: packages/server/coverage/index.html

# Frontend
cd packages/client && pnpm test:coverage
# Opens: packages/client/coverage/index.html
```

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Pre-deployment checks

GitHub Actions workflow:
```yaml
- Run backend tests
- Run frontend tests
- Run E2E tests (chromium only in CI)
- Upload coverage reports
```

## Debugging Tests

### Vitest UI
```bash
pnpm test:ui  # Interactive test runner
```

### Playwright Debug
```bash
pnpm test:e2e --debug          # Step through tests
pnpm test:e2e --headed         # See browser
pnpm test:e2e --trace on       # Record trace
```

### Watch Mode
```bash
pnpm test --watch  # Re-run on file changes
```

## Test Data

- **Seeded users**: admin@ting.com / admin123, user@ting.com / user123
- **Test databases**: Created automatically in test mode
- **Cleanup**: Tests clean up after themselves

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Reset database state before/after tests
3. **Mocking**: Mock external services (email, etc.)
4. **Assertions**: Use descriptive expect messages
5. **Coverage**: Aim for >80% coverage on critical paths
