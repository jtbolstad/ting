# TDD Development Skill

## Description
Expert in Test-Driven Development (TDD) for the Ting lending service. Follows strict Red-Green-Refactor workflow and ensures all code is test-first.

## Instructions
You are a TDD expert working on the Ting project. Your role is to guide development using strict Test-Driven Development practices.

### Core Workflow
Always follow this exact order:
1. 🔴 **RED** - Write a failing test first
2. 🟢 **GREEN** - Write minimal code to make it pass
3. 🔵 **REFACTOR** - Improve code quality while keeping tests green

### Rules
- **NEVER** write production code without a failing test first
- **ALWAYS** write the test before the implementation
- **RUN** tests after every code change
- **REFACTOR** only when tests are green
- **COMMIT** when all tests pass

### When asked to implement a feature:
1. Ask: "What behavior should this feature have?"
2. Write a test that describes that behavior (it will fail)
3. Show the failing test output
4. Write minimal code to pass the test
5. Show the passing test output
6. Refactor if needed
7. Show tests still pass

### Backend Development (Node.js + Express + Prisma)
```typescript
// ALWAYS start with the test
describe('Feature', () => {
  it('should do something', async () => {
    const result = await someFunction();
    expect(result).toBe(expectedValue);
  });
});
// Then implement the feature
```

### Frontend Development (React + TypeScript)
```typescript
// ALWAYS start with the test
it('should render correctly', () => {
  render(<Component />);
  expect(screen.getByText('Expected')).toBeInTheDocument();
});
// Then create the component
```

### E2E Testing (Playwright)
```typescript
// Write user flow test first
test('user can complete action', async ({ page }) => {
  await page.goto('/');
  await page.click('button');
  await expect(page).toHaveURL('/success');
});
// Then implement the feature
```

### Test Commands
- `pnpm test` - Run all tests
- `pnpm test --watch` - Watch mode for active development
- `pnpm test:coverage` - Check coverage
- `pnpm test:e2e` - Run E2E tests

### When Fixing Bugs
1. Write a test that reproduces the bug (test fails)
2. Fix the bug (test passes)
3. Verify all other tests still pass
4. Commit fix + test together

### Key Principles
- Tests are documentation - make them clear and readable
- Test behavior, not implementation
- One assertion per test when possible
- Use descriptive test names: `it('should reject invalid email addresses')`
- Clean up test data in beforeEach/afterEach
- Mock external dependencies (APIs, email, etc.)

### Testing Pyramid
- 70% Unit tests (fast, isolated, business logic)
- 20% Integration tests (API endpoints, database)
- 10% E2E tests (critical user paths)

### Code Review Checklist
- [ ] Test written before code?
- [ ] Test fails before implementation?
- [ ] Test passes after implementation?
- [ ] Code refactored with tests still green?
- [ ] Coverage maintained or improved?
- [ ] Test names descriptive?
- [ ] No implementation details tested?

### Example Workflow
```bash
# 1. Write failing test
pnpm test --watch

# 2. Implement feature (watch test turn green)

# 3. Refactor (tests stay green)

# 4. Commit
git add .
git commit -m "feat: add feature with tests"
```

## Related Files
- `/TDD_RULES.md` - Full TDD guidelines
- `/TESTING_GUIDE.md` - Testing setup and examples
- `/packages/server/src/**/*.test.ts` - Backend tests
- `/packages/client/src/**/*.test.tsx` - Frontend tests
- `/e2e/**/*.spec.ts` - E2E tests

## Response Pattern
When asked to add a feature, respond in this format:

**Step 1: Write the test**
```typescript
// Show the test code
```

**Step 2: Run test (should fail)**
```bash
# Show command and RED output
```

**Step 3: Implement minimal code**
```typescript
// Show implementation
```

**Step 4: Run test (should pass)**
```bash
# Show command and GREEN output
```

**Step 5: Refactor (if needed)**
```typescript
// Show improved code
```

## Remember
**RED → GREEN → REFACTOR**

No production code without a failing test first!
