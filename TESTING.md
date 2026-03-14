# Testing Guide

## Backend API Tests

### Running Tests

```bash
# Run all tests
cd packages/server
pnpm test

# Run tests in watch mode
pnpm test -- --watch

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

### Test Structure

The server tests are organized as follows:

```
packages/server/src/test/
├── setup.ts              # Test database setup
├── helpers.ts            # Test data factories
├── auth.test.ts          # Authentication API tests
├── items.test.ts         # Items API tests
├── reservations.test.ts  # Reservations API tests
├── loans.test.ts         # Loans API tests
└── services/
    └── auth.test.ts      # Auth service unit tests
```

### Test Coverage

The backend tests cover:

#### 1. Authentication API (`auth.test.ts`)
- ✅ User registration
  - Successful registration
  - Duplicate email validation
  - Required fields validation
- ✅ User login
  - Valid credentials
  - Invalid email/password
  - Missing fields
- ✅ Get current user
  - With valid token
  - Without token
  - With invalid token

#### 2. Items API (`items.test.ts`)
- ✅ List items
  - Pagination
  - Category filtering
  - Search by name
  - Status filtering
- ✅ Get item by ID
  - Valid item
  - Non-existent item
- ✅ Create item (admin only)
  - Successful creation
  - Non-admin rejection
  - Missing fields validation
- ✅ Update item (admin only)
  - Update name, description
  - Update status
  - Non-admin rejection
- ✅ Delete item (admin only)
  - Successful deletion
  - Non-admin rejection

#### 3. Reservations API (`reservations.test.ts`)
- ✅ List user reservations
  - Own reservations
  - Unauthorized access
- ✅ Check availability
  - Available dates
  - Conflicting reservations
  - Missing parameters
- ✅ Create reservation
  - Successful booking
  - Conflict detection
  - Non-existent item
  - Missing fields
- ✅ Update reservation
  - Update own reservation
  - Cannot update others' reservations
- ✅ Cancel reservation
  - Cancel own reservation
  - Cannot cancel others' reservations

#### 4. Loans API (`loans.test.ts`)
- ✅ List loans
  - User's loans
  - Filter by active status
  - Filter by overdue
- ✅ Checkout item
  - Admin checkout
  - Duplicate checkout prevention
  - Non-existent item
  - Missing fields
- ✅ Checkin item
  - Return own loan
  - Admin can return any loan
  - Already returned validation
  - Cannot return others' loans

#### 5. Auth Service Unit Tests (`services/auth.test.ts`)
- ✅ Password hashing
  - Hash generation
  - Different hashes for same password (salt)
- ✅ Password comparison
  - Correct password verification
  - Incorrect password rejection
- ✅ JWT token generation
  - Token structure validation
- ✅ JWT token verification
  - Valid token decoding
  - Invalid token rejection
  - Tampered token rejection

### Test Utilities

#### Test Setup (`setup.ts`)
- Creates isolated test database
- Runs migrations
- Cleans up data between tests

#### Test Helpers (`helpers.ts`)
Factory functions for creating test data:
- `createTestUser()` - Create user with optional data
- `createTestCategory()` - Create category
- `createTestItem()` - Create item in category
- `createTestReservation()` - Create reservation
- `createTestLoan()` - Create loan

Example usage:
```typescript
const user = await createTestUser({ 
  email: 'test@test.com',
  role: 'ADMIN' 
});

const category = await createTestCategory({ name: 'Tools' });
const item = await createTestItem(category.id, { name: 'Drill' });
```

### Writing New Tests

Example test structure:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import myRoutes from '../routes/my-routes.js';
import { createTestUser } from './helpers.js';

const app = express();
app.use(express.json());
app.use('/api/my-routes', myRoutes);

describe('My API', () => {
  let userToken: string;

  beforeEach(async () => {
    // Setup
    const user = await createTestUser();
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'password123' });
    userToken = response.body.data.token;
  });

  it('should do something', async () => {
    const response = await request(app)
      .get('/api/my-routes')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

### Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use `beforeEach` to reset state
3. **Descriptive names**: Use clear test descriptions
4. **Arrange-Act-Assert**: Structure tests clearly
5. **Test edge cases**: Not just happy paths
6. **Use factories**: Leverage test helpers for data

### Running Specific Tests

```bash
# Run specific test file
pnpm test auth.test.ts

# Run tests matching pattern
pnpm test -- --grep "should create item"

# Run in watch mode for specific file
pnpm test items.test.ts -- --watch
```

### Coverage Reports

After running `pnpm test:coverage`, view the HTML report:
```bash
cd packages/server
# Open coverage/index.html in browser
```

Current coverage targets:
- Statements: >80%
- Branches: >75%
- Functions: >80%
- Lines: >80%
