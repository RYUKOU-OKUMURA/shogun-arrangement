# Quality Gates

## Overview

Quality gates are automated checks that enforce code quality standards. All code must pass these gates before being considered complete.

## Mandatory Quality Gates

### 1. Test Coverage ≥80%

**Why:** Ensures code is properly tested and reduces bugs in production.

**How to Check:**
```bash
# Run tests with coverage
npm test -- --coverage

# Check coverage report
# Look for "All files" line in output
# Statements, Branches, Functions, Lines should all be ≥80%
```

**Example Output:**
```
All files       | 85.2  | 82.1  | 88.3  | 85.2  |
✅ PASS - Coverage above 80%
```

**What to Track:**
- **Statements**: 80%+ (each line of code executed)
- **Branches**: 80%+ (each if/else path tested)
- **Functions**: 80%+ (each function called)
- **Lines**: 80%+ (each line covered)

**If Coverage Fails:**
1. Run `npm test -- --coverage --verbose` to see uncovered lines
2. Add tests for uncovered code paths
3. Focus on edge cases and error handling
4. DO NOT use `/* istanbul ignore */` to cheat coverage

### 2. Lint Passing

**Why:** Enforces consistent code style and catches common errors.

**How to Check:**
```bash
# Run linter
npm run lint

# Auto-fix issues (if possible)
npm run lint -- --fix
```

**Common Rules:**
- No unused variables
- Consistent indentation (2 spaces)
- No console.log in production code
- Proper import ordering
- No any types in TypeScript
- Max line length (100 characters)

**If Lint Fails:**
1. Read error message carefully
2. Fix manually or use `--fix` flag
3. DO NOT use `eslint-disable` comments (fix the root cause)
4. If rule seems wrong, discuss with team before disabling

### 3. Type Check Passing

**Why:** Catches type errors before runtime, improves code reliability.

**How to Check:**
```bash
# Run TypeScript compiler
npm run typecheck
# or
tsc --noEmit
```

**Common Type Errors:**
```typescript
// ❌ Error: Type 'string | undefined' not assignable to 'string'
function greet(name: string) {
  return `Hello, ${name}`
}
const user = getUser() // returns User | undefined
greet(user.name) // Error!

// ✅ Fix: Handle undefined case
function greet(name: string) {
  return `Hello, ${name}`
}
const user = getUser()
if (user) {
  greet(user.name) // OK
}
```

**If Type Check Fails:**
1. Read error message and location
2. Fix type annotations (don't use `any`)
3. Handle undefined/null cases properly
4. DO NOT use `@ts-ignore` (fix the type error)

### 4. All Tests Passing

**Why:** Confirms code works as expected and doesn't break existing functionality.

**How to Check:**
```bash
# Run all tests
npm test

# Run specific test file
npm test -- auth.test.ts

# Run in watch mode during development
npm test -- --watch
```

**Test Types Required:**

#### Unit Tests (70%)
Test individual functions/components in isolation.

```typescript
// Example: Unit test for utility function
describe('formatCurrency', () => {
  it('should format USD correctly', () => {
    expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56')
  })

  it('should handle zero', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00')
  })

  it('should handle negative numbers', () => {
    expect(formatCurrency(-100, 'USD')).toBe('-$100.00')
  })
})
```

#### Integration Tests (20%)
Test how components work together.

```typescript
// Example: Integration test for API endpoint
describe('POST /api/auth/login', () => {
  it('should return token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
    expect(res.body.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)
  })
})
```

#### E2E Tests (10%)
Test critical user flows end-to-end.

```typescript
// Example: E2E test with Playwright
test('user can sign up and log in', async ({ page }) => {
  // Sign up
  await page.goto('/signup')
  await page.fill('[name=email]', 'user@example.com')
  await page.fill('[name=password]', 'securePassword123')
  await page.click('button[type=submit]')
  await expect(page).toHaveURL('/dashboard')

  // Log out
  await page.click('[data-testid=logout]')
  await expect(page).toHaveURL('/login')

  // Log in
  await page.fill('[name=email]', 'user@example.com')
  await page.fill('[name=password]', 'securePassword123')
  await page.click('button[type=submit]')
  await expect(page).toHaveURL('/dashboard')
})
```

**If Tests Fail:**
1. Read failure message carefully
2. Check if it's a flaky test (run again)
3. If consistently failing, fix the implementation
4. DO NOT modify tests to make them pass (unless tests are wrong)

### 5. No console.log

**Why:** Console statements clutter production code and impact performance.

**What's Allowed:**
```typescript
// ✅ OK: Proper logging
import logger from './logger'
logger.info('User logged in', { userId: user.id })
logger.error('Database connection failed', { error: err.message })

// ✅ OK: Development-only debugging (with guard)
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data)
}
```

**What's NOT Allowed:**
```typescript
// ❌ NOT OK: Console statements
console.log('user:', user)
console.error('Error:', error)
console.warn('Warning:', message)
```

**How to Check:**
```bash
# Search for console statements
grep -r "console\." src/

# Captain's hook will warn about console.log after edits
```

**If Found:**
1. Replace with proper logging library
2. Remove debug statements
3. Add environment guards if needed for debugging

### 6. PR Size <200 Lines

**Why:** Smaller PRs are easier to review, merge, and rollback.

**How to Check:**
```bash
# Count lines changed in current branch
git diff main --shortstat

# Example output:
# 15 files changed, 180 insertions(+), 45 deletions(-)
# Total: 180 + 45 = 225 lines (over limit!)
```

**Targets:**
- **Ideal**: <200 lines
- **Acceptable**: 200-400 lines (with good reason)
- **Too Large**: >400 lines (must split)

**If Over Limit:**
1. Split into multiple PRs with dependencies
2. Separate feature from refactoring
3. Move test files to separate PR (if needed)
4. Extract utility functions to separate PR

**Example Split:**
```
Original PR (500 lines):
├─ PR1: Add utility functions (100 lines)
├─ PR2: Add tests (150 lines) - depends on PR1
├─ PR3: Implement feature (200 lines) - depends on PR1, PR2
└─ PR4: Update docs (50 lines) - depends on PR3
```

## Code Quality Standards

### 1. Immutability

**Why:** Prevents bugs, makes code easier to test and reason about.

**❌ WRONG: Mutation**
```typescript
function addItem(cart: Cart, item: Item): Cart {
  cart.items.push(item) // Mutation!
  cart.total += item.price // Mutation!
  return cart
}
```

**✅ CORRECT: Immutability**
```typescript
function addItem(cart: Cart, item: Item): Cart {
  return {
    ...cart,
    items: [...cart.items, item],
    total: cart.total + item.price
  }
}
```

**Common Patterns:**
```typescript
// Arrays
const newArray = [...oldArray, newItem] // Add
const filtered = oldArray.filter(x => x.id !== removeId) // Remove
const updated = oldArray.map(x => x.id === id ? { ...x, ...changes } : x) // Update

// Objects
const newObj = { ...oldObj, key: newValue } // Update property
const { removed, ...rest } = oldObj // Remove property
const merged = { ...obj1, ...obj2 } // Merge objects
```

### 2. Error Handling

**Why:** Prevents crashes, provides better user experience.

**❌ WRONG: Suppress errors**
```typescript
try {
  await riskyOperation()
} catch (e) {
  // Ignore
}
```

**✅ CORRECT: Handle properly**
```typescript
try {
  const result = await riskyOperation()
  return { success: true, data: result }
} catch (error) {
  logger.error('Operation failed', { error, context })
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error'
  }
}
```

**Requirements:**
- All async operations must have try/catch
- All errors must be logged with context
- User-facing errors must be friendly (no stack traces)
- System errors must include debugging info

### 3. Shallow Nesting (Max 4 Levels)

**Why:** Deep nesting is hard to read and test.

**❌ WRONG: Deep nesting (5 levels)**
```typescript
function processOrder(order: Order) {
  if (order.items.length > 0) {
    for (const item of order.items) {
      if (item.quantity > 0) {
        if (item.inStock) {
          if (item.price > 0) {
            // Level 5 - too deep!
          }
        }
      }
    }
  }
}
```

**✅ CORRECT: Early returns, extracted functions**
```typescript
function processOrder(order: Order) {
  if (order.items.length === 0) return

  for (const item of order.items) {
    processItem(item)
  }
}

function processItem(item: Item) {
  if (item.quantity <= 0) return
  if (!item.inStock) return
  if (item.price <= 0) return

  // Process item (level 2)
}
```

### 4. Pure Functions

**Why:** Easier to test, easier to reason about, no side effects.

**❌ WRONG: Side effects**
```typescript
let total = 0 // Global state

function addToTotal(amount: number) {
  total += amount // Side effect!
  console.log(total) // Side effect!
}
```

**✅ CORRECT: Pure function**
```typescript
function calculateTotal(current: number, amount: number): number {
  return current + amount // No side effects
}

// Side effects isolated to caller
let total = 0
total = calculateTotal(total, 100)
logger.info('Total updated', { total })
```

**Pure Function Rules:**
- Same input → same output (deterministic)
- No side effects (no mutations, no I/O, no randomness)
- No external dependencies

### 5. Clear Naming

**Why:** Code is read more than written. Names should explain intent.

**❌ WRONG: Unclear names**
```typescript
function f(x: number, y: number): number {
  return x * y * 0.2
}

const data = await fetch('/api')
const result = data.filter(x => x.a > 100)
```

**✅ CORRECT: Self-documenting names**
```typescript
function calculateTax(price: number, quantity: number): number {
  const TAX_RATE = 0.2
  return price * quantity * TAX_RATE
}

const orders = await fetchOrders()
const largeOrders = orders.filter(order => order.amount > 100)
```

**Naming Conventions:**
- Variables: `camelCase`, descriptive nouns
- Functions: `camelCase`, verb + noun (e.g., `getUserById`, `calculateTotal`)
- Classes: `PascalCase`, nouns (e.g., `UserService`, `OrderRepository`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`, `API_BASE_URL`)
- Booleans: `is/has/can` prefix (e.g., `isValid`, `hasPermission`, `canEdit`)

### 6. No Hardcoded Values

**Why:** Makes code configurable, testable, maintainable.

**❌ WRONG: Hardcoded**
```typescript
if (user.age < 18) {
  return 'Too young'
}

setTimeout(callback, 5000)

fetch('https://api.example.com/users')
```

**✅ CORRECT: Constants/Config**
```typescript
const MIN_AGE = 18

if (user.age < MIN_AGE) {
  return 'Too young'
}

const RETRY_DELAY_MS = 5000
setTimeout(callback, RETRY_DELAY_MS)

const API_BASE_URL = process.env.API_BASE_URL || 'https://api.example.com'
fetch(`${API_BASE_URL}/users`)
```

## Test Quality Standards

### 1. Test Pyramid Respected

**Distribution:**
- 70% Unit tests (fast, isolated)
- 20% Integration tests (medium speed, components together)
- 10% E2E tests (slow, full user flows)

**Why:** Fast feedback loop, reliable tests, good coverage.

### 2. AAA Pattern Used

**Structure every test:**
```typescript
test('description', () => {
  // ARRANGE: Setup test data and preconditions
  const input = { ... }
  const expected = { ... }

  // ACT: Execute the code under test
  const result = functionUnderTest(input)

  // ASSERT: Verify the results
  expect(result).toEqual(expected)
})
```

### 3. No Flaky Tests

**Flaky test = test that sometimes passes, sometimes fails.**

**Common Causes:**
- Time-dependent code
- Random values
- Async race conditions
- External dependencies (network, database)
- Shared state between tests

**How to Prevent:**
```typescript
// ❌ Flaky: Uses real time
test('token should expire', async () => {
  const token = createToken({ expiresIn: '1s' })
  await sleep(2000)
  expect(isExpired(token)).toBe(true)
})

// ✅ Reliable: Mocks time
test('token should expire', () => {
  jest.useFakeTimers()
  const token = createToken({ expiresIn: '1s' })
  jest.advanceTimersByTime(2000)
  expect(isExpired(token)).toBe(true)
})
```

**Verification:**
```bash
# Run test 3 times to check for flakiness
npm test -- --testNamePattern="test name" --run-in-band --repeat=3
```

### 4. Edge Cases Covered

**Required edge cases:**
- Empty input ([], '', null, undefined)
- Boundary values (0, -1, MAX_INT)
- Invalid input (wrong type, malformed data)
- Error conditions (network failure, timeout)
- Large datasets (performance testing)

**Example:**
```typescript
describe('calculateDiscount', () => {
  // Happy path
  it('should calculate 10% discount', () => { ... })

  // Edge cases
  it('should handle zero price', () => { ... })
  it('should handle negative price', () => { ... })
  it('should handle null input', () => { ... })
  it('should handle undefined discount', () => { ... })
  it('should cap discount at 100%', () => { ... })
  it('should handle very large numbers', () => { ... })
})
```

### 5. Meaningful Assertions

**❌ WRONG: Vague assertions**
```typescript
expect(result).toBeTruthy()
expect(error).toBeDefined()
```

**✅ CORRECT: Specific assertions**
```typescript
expect(result.status).toBe(200)
expect(result.body).toEqual({ id: 1, name: 'John' })

expect(error.message).toBe('User not found')
expect(error.code).toBe('NOT_FOUND')
```

## Captain's Quality Monitoring

Captain tracks these metrics in `dashboard.md`:

```markdown
## Quality Metrics
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Test Coverage | 85% | 80% | ✅ |
| Avg PR Size | 180 lines | <200 | ✅ |
| Build Status | Passing | Passing | ✅ |
| Flaky Tests | 0 | <1% | ✅ |
| Lint Errors | 0 | 0 | ✅ |
| Type Errors | 0 | 0 | ✅ |
```

**Thresholds:**

| Indicator | Green ✅ | Yellow 🟡 | Red 🔴 |
|-----------|---------|-----------|--------|
| Test coverage | ≥80% | 70-79% | <70% |
| PR size | <200 lines | 200-400 | >400 |
| Build status | Passing | - | Failing |
| Flaky tests | 0 | 1-2 | >2 |

**Red = Immediate intervention required**

## Summary

Quality gates ensure:
- **Reliability**: Tests catch bugs before production
- **Maintainability**: Clean code is easier to change
- **Performance**: Small PRs deploy faster
- **Consistency**: Lint and types enforce standards
- **Confidence**: High coverage means fewer surprises

**No exceptions. All gates must pass.**
