# Test-Driven Development (TDD) Rules for Ting

## Core TDD Principles

Follow the **Red-Green-Refactor** cycle:

1. 🔴 **RED** - Write a failing test
2. 🟢 **GREEN** - Write minimal code to make it pass
3. 🔵 **REFACTOR** - Improve code while keeping tests green

## TDD Workflow

### Step 1: Write the Test First

Before writing any production code:

```typescript
// ❌ DON'T start by writing the feature
// ✅ DO start by writing the test

// Example: Adding a new API endpoint
describe('GET /api/categories', () => {
  it('should return all categories', async () => {
    const response = await request(app).get('/api/categories');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeInstanceOf(Array);
  });
});
```

Run the test: `pnpm test` → Should FAIL ✅

### Step 2: Write Minimal Code to Pass

```typescript
// packages/server/src/routes/categories.ts
router.get('/', async (req, res) => {
  const categories = await prisma.category.findMany();
  res.json({ success: true, data: categories });
});
```

Run the test: `pnpm test` → Should PASS ✅

### Step 3: Refactor

Improve code quality without changing behavior:

```typescript
router.get('/', async (req, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    
    const response: ApiResponse<Category[]> = {
      success: true,
      data: categories,
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});
```

Run the test: `pnpm test` → Should STILL PASS ✅

## TDD Rules for This Project

### Backend (API) Development

**1. Database Operations**
```typescript
// First: Write the test
describe('Category CRUD', () => {
  it('should create a category', async () => {
    const category = await prisma.category.create({
      data: { name: 'Test', description: 'Test category' }
    });
    expect(category.id).toBeDefined();
    expect(category.name).toBe('Test');
  });
});

// Then: Ensure migration exists
// Then: Verify test passes
```

**2. API Endpoints**
```typescript
// First: Write the integration test
it('should handle invalid data', async () => {
  const response = await request(app)
    .post('/api/categories')
    .send({ name: '' });
  
  expect(response.status).toBe(400);
});

// Then: Implement validation
// Then: Verify test passes
```

**3. Business Logic**
```typescript
// First: Write unit tests for edge cases
describe('calculateLateFee', () => {
  it('should return 0 for items returned on time', () => {
    const fee = calculateLateFee(new Date(), new Date());
    expect(fee).toBe(0);
  });
  
  it('should calculate fee for overdue items', () => {
    const dueDate = new Date('2024-01-01');
    const returnDate = new Date('2024-01-10'); // 9 days late
    const fee = calculateLateFee(dueDate, returnDate);
    expect(fee).toBe(9 * 5); // $5 per day
  });
});

// Then: Implement function
// Then: Verify all tests pass
```

### Frontend (React) Development

**1. Component Behavior**
```typescript
// First: Write the test
describe('ItemCard', () => {
  it('should display item name and status', () => {
    const item = { name: 'Drill', status: 'AVAILABLE' };
    render(<ItemCard item={item} />);
    
    expect(screen.getByText('Drill')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
  });
});

// Then: Create component
// Then: Verify test passes
```

**2. User Interactions**
```typescript
// First: Write interaction test
it('should call onReserve when button clicked', async () => {
  const onReserve = vi.fn();
  render(<ItemCard item={item} onReserve={onReserve} />);
  
  await userEvent.click(screen.getByRole('button', { name: /reserve/i }));
  
  expect(onReserve).toHaveBeenCalledWith(item.id);
});

// Then: Implement handler
// Then: Verify test passes
```

**3. Form Validation**
```typescript
// First: Write validation tests
it('should show error for invalid email', async () => {
  render(<LoginForm />);
  
  await userEvent.type(screen.getByLabelText(/email/i), 'invalid');
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));
  
  expect(screen.getByText(/valid email/i)).toBeInTheDocument();
});

// Then: Add validation
// Then: Verify test passes
```

### E2E (User Flows)

**1. Critical Paths**
```typescript
// First: Write the complete user flow test
test('user can borrow an item', async ({ page }) => {
  // 1. Login
  await page.goto('/login');
  await page.fill('input[type="email"]', 'user@ting.com');
  await page.fill('input[type="password"]', 'user123');
  await page.click('button[type="submit"]');
  
  // 2. Find item
  await page.click('text=Catalog');
  await page.click('text=Drill');
  
  // 3. Reserve
  await page.fill('input[name="startDate"]', '2024-06-01');
  await page.fill('input[name="endDate"]', '2024-06-07');
  await page.click('button:has-text("Reserve")');
  
  // 4. Verify reservation
  await expect(page.locator('text=Success')).toBeVisible();
});

// Then: Implement features to make test pass
// Then: Verify E2E test passes
```

## TDD Best Practices

### ✅ DO

1. **Write the test first** - No exceptions
2. **One test at a time** - Focus on one behavior
3. **Small steps** - Write minimal code to pass
4. **Run tests frequently** - After every change
5. **Keep tests simple** - Easy to read and understand
6. **Test behavior, not implementation** - Tests should survive refactoring
7. **Use descriptive test names** - `it('should reject reservation for checked-out items')`
8. **Clean up test data** - Use `beforeEach`/`afterEach`

### ❌ DON'T

1. **Write production code without a failing test**
2. **Write multiple tests before making them pass**
3. **Skip the refactor step**
4. **Test implementation details**
5. **Write tests after the code**
6. **Ignore failing tests**
7. **Make tests dependent on each other**
8. **Leave commented-out code**

## TDD Command Workflow

```bash
# 1. Write test (it will fail)
# 2. Run test in watch mode
pnpm test --watch

# 3. Write minimal code to pass
# 4. Watch test turn green
# 5. Refactor
# 6. Ensure test stays green

# Commit when all tests pass
git add .
git commit -m "feat: add category filtering"
```

## Testing Pyramid

```
         /\
        /E2E\        ← Few (Critical user paths)
       /------\
      / API   \      ← Some (Integration tests)
     /----------\
    /   Unit     \   ← Many (Business logic)
   /--------------\
```

**Unit Tests (70%)** - Fast, isolated, test single functions
**Integration Tests (20%)** - Test components together
**E2E Tests (10%)** - Slow but test complete flows

## Example: Adding a New Feature (TDD)

### Feature: Add "Favorite Items" functionality

#### 1. Write Backend Test First
```typescript
// packages/server/src/routes/favorites.test.ts
describe('POST /api/favorites', () => {
  it('should add item to user favorites', async () => {
    const response = await request(app)
      .post('/api/favorites')
      .set('Authorization', `Bearer ${token}`)
      .send({ itemId: 'item-123' });
    
    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
  });
});
```

#### 2. Run Test (Should Fail)
```bash
cd packages/server
pnpm test favorites.test.ts
# ❌ FAIL - Route doesn't exist
```

#### 3. Write Minimal Backend Code
```typescript
// packages/server/src/routes/favorites.ts
router.post('/', authenticate, async (req, res) => {
  const { itemId } = req.body;
  const favorite = await prisma.favorite.create({
    data: { userId: req.user!.id, itemId }
  });
  res.status(201).json({ success: true, data: favorite });
});
```

#### 4. Run Test (Should Pass)
```bash
pnpm test favorites.test.ts
# ✅ PASS
```

#### 5. Write Frontend Test
```typescript
// packages/client/src/components/FavoriteButton.test.tsx
it('should toggle favorite when clicked', async () => {
  const onToggle = vi.fn();
  render(<FavoriteButton itemId="123" isFavorite={false} onToggle={onToggle} />);
  
  await userEvent.click(screen.getByRole('button'));
  expect(onToggle).toHaveBeenCalled();
});
```

#### 6. Implement Frontend Component
```typescript
export function FavoriteButton({ itemId, isFavorite, onToggle }) {
  return (
    <button onClick={() => onToggle(itemId)}>
      {isFavorite ? '❤️' : '🤍'}
    </button>
  );
}
```

#### 7. Write E2E Test
```typescript
test('user can favorite an item', async ({ page }) => {
  await page.goto('/catalog');
  await page.click('text=Drill');
  await page.click('button[aria-label="Favorite"]');
  await expect(page.locator('text=❤️')).toBeVisible();
});
```

#### 8. Refactor (All Tests Still Green)
- Extract favorite logic to service
- Add optimistic UI updates
- Add error handling
- Improve accessibility

## Measuring TDD Success

**Good Signs:**
- ✅ Tests written before code
- ✅ High code coverage (>80%)
- ✅ Tests run fast (<5s)
- ✅ Few bugs in production
- ✅ Easy to refactor

**Warning Signs:**
- ⚠️ Low test coverage
- ⚠️ Tests written after code
- ⚠️ Flaky tests
- ⚠️ Slow test suite (>1min)
- ⚠️ Fear of refactoring

## Tools for TDD

```bash
# Watch mode - Tests re-run on save
pnpm test --watch

# UI mode - Visual test runner
pnpm test:ui

# Coverage - See what's not tested
pnpm test:coverage

# Single test - Focus on one
pnpm test -t "should add favorite"

# Debug - Step through tests
pnpm test --inspect-brk
```

## TDD for Bug Fixes

When fixing a bug:

1. **Write a test that reproduces the bug** (test fails)
2. **Fix the bug** (test passes)
3. **Verify old tests still pass**
4. **Commit fix + test together**

```typescript
// Bug: Items with 0 quantity show as available
it('should mark items as unavailable when quantity is 0', () => {
  const item = { id: '1', name: 'Drill', quantity: 0 };
  expect(isAvailable(item)).toBe(false); // ❌ FAILS (bug exists)
});

// Fix the code
function isAvailable(item) {
  return item.quantity > 0 && item.status === 'AVAILABLE';
}

// ✅ Test now passes
```

## TDD Cheat Sheet

| Step | Action | Command |
|------|--------|---------|
| 1 | Write failing test | `pnpm test --watch` |
| 2 | See test fail | Verify RED ❌ |
| 3 | Write minimal code | Editor |
| 4 | See test pass | Verify GREEN ✅ |
| 5 | Refactor | Editor |
| 6 | See tests still pass | Verify GREEN ✅ |
| 7 | Commit | `git commit` |

## Summary

**TDD = Better Design + Fewer Bugs + Confidence to Refactor**

Remember:
- 🔴 RED - Write a test that fails
- 🟢 GREEN - Make it pass quickly
- 🔵 REFACTOR - Make it clean

**Never write production code without a failing test first!**
