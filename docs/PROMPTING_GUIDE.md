# Prompting Guide for AI-Driven Development

## Overview

Effective prompting is critical for AI-driven development. This guide shows how to craft prompts that produce high-quality, maintainable code.

## Core Principles

### 1. Provide Rich Context

AI needs complete information to make good decisions.

#### ❌ Poor Prompt
```
Write authentication middleware
```

#### ✅ Good Prompt
```
Write JWT authentication middleware for Express.js API

Context:
- Language: TypeScript
- Framework: Express.js 4.18 + Passport
- Auth Strategy: JWT (jsonwebtoken@9.0.0)
- Secret: Loaded from process.env.JWT_SECRET
- Token Location: Authorization header (Bearer token)

Expected Behavior:
1. Extract token from "Authorization: Bearer <token>" header
2. Verify token signature using JWT_SECRET
3. If valid: attach decoded payload to req.user, call next()
4. If invalid/expired: return 401 with error message
5. If missing: return 401 with "No token provided"

Edge Cases:
- Expired tokens → 401 "Token expired"
- Invalid signature → 401 "Invalid token"
- Malformed header → 401 "No token provided"
- Missing header → 401 "No token provided"

Security Requirements:
- Use constant-time comparison for tokens
- No token/secret leakage in error messages
- Rate limit: 100 req/min per IP

Related Files:
- src/auth/types.ts (JwtPayload interface)
- src/middleware/errorHandler.ts (error handling pattern)
- src/config/env.ts (environment variables)

Reference Implementation:
- See src/middleware/apiKeyAuth.ts for similar pattern

Quality Gates:
- TypeScript strict mode
- 80%+ test coverage
- All tests passing
- Lint passing
- <200 lines of code
```

### 2. Specify Success Criteria

Define what "done" means.

#### ❌ Vague
```
Make it work
```

#### ✅ Specific
```
Success Criteria:
1. All 5 test cases passing (valid/invalid/expired/missing/malformed tokens)
2. Test coverage ≥ 85%
3. TypeScript compiles with no errors
4. Lint passes with no warnings
5. Implementation < 150 lines
6. Response time < 50ms for token validation
7. Error messages match API spec exactly
```

### 3. Include Examples

Show, don't just tell.

#### ❌ Abstract
```
Use AAA pattern for tests
```

#### ✅ Concrete
```
Use AAA pattern for tests (Arrange-Act-Assert):

Example:
describe('authMiddleware', () => {
  it('should return 401 when token is expired', () => {
    // ARRANGE: Setup test data
    const expiredToken = jwt.sign({ userId: 1 }, SECRET, { expiresIn: '-1h' })
    const req = mockRequest({ headers: { authorization: `Bearer ${expiredToken}` }})
    const res = mockResponse()
    const next = jest.fn()

    // ACT: Execute the code
    authMiddleware(req, res, next)

    // ASSERT: Verify results
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Token expired' })
    expect(next).not.toHaveBeenCalled()
  })
})

Follow this pattern for all 5 test cases.
```

### 4. Provide Technical Constraints

Specify versions, dependencies, limitations.

#### ❌ Incomplete
```
Use React hooks
```

#### ✅ Complete
```
Technical Constraints:
- React: 18.2.0 (use concurrent features)
- TypeScript: 5.3.0 (strict mode enabled)
- Node: 20.x LTS
- Target: ES2022
- Bundle size: < 10KB gzipped
- Browser support: Last 2 versions of Chrome/Firefox/Safari
- No external dependencies (built-in hooks only)
- Memory limit: < 50MB heap for 1000 items
```

### 5. Identify Edge Cases

List non-happy-path scenarios.

#### ❌ Happy Path Only
```
Validate email and return user
```

#### ✅ Comprehensive
```
Validate email and return user

Edge Cases to Handle:
1. Empty string → return error "Email required"
2. Invalid format → return error "Invalid email format"
3. Email too long (>254 chars) → return error "Email too long"
4. User not found → return null (not error)
5. Database connection lost → retry 3 times, then error
6. Multiple users with same email → return first, log warning
7. Null/undefined input → return error "Email required"
8. SQL injection attempt → sanitize and validate
9. Unicode characters → normalize and validate
10. Case sensitivity → normalize to lowercase

Test each edge case separately.
```

## Prompt Templates

### Feature Implementation

```
# Feature: [Feature Name]

## Goal
[What this feature should accomplish]

## Context
- Language: [e.g., TypeScript]
- Framework: [e.g., Next.js 14]
- Dependencies: [list with versions]
- Related Files: [files to reference]

## Requirements
1. [Specific requirement 1]
2. [Specific requirement 2]
3. [Specific requirement 3]

## Success Criteria
- [ ] All tests passing (≥80% coverage)
- [ ] TypeScript compiles with no errors
- [ ] Lint passes
- [ ] Performance: [specific benchmark]
- [ ] Accessibility: [WCAG level]
- [ ] PR size: <200 lines

## Edge Cases
1. [Edge case 1] → [expected behavior]
2. [Edge case 2] → [expected behavior]

## Examples
[Code examples or screenshots]

## Quality Gates
- lint: required
- typecheck: required
- test_coverage: 80%
- max_lines: 200
- security_review: required (if auth/input/secrets)

## References
- [Link to similar implementation]
- [Link to design doc]
- [Link to API spec]
```

### Bug Fix

```
# Bug Fix: [Bug Title]

## Problem
[Clear description of the bug]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior
[What should happen]

## Actual Behavior
[What currently happens]

## Error Messages
```
[Full error stack trace]
```

## Root Cause Analysis
[If known, otherwise "To be investigated"]

## Proposed Fix
[High-level approach]

## Test Strategy
1. Add regression test to prevent recurrence
2. Verify existing tests still pass
3. Test edge cases: [list specific cases]

## Success Criteria
- [ ] Bug no longer reproducible
- [ ] Regression test added
- [ ] All existing tests passing
- [ ] Root cause documented
- [ ] PR size: <100 lines (bug fixes should be small)

## Related Issues
- [Link to related bugs]
- [Link to original feature]
```

### Refactoring

```
# Refactoring: [Component/Module Name]

## Goal
[What to improve: performance, readability, maintainability]

## Current Issues
1. [Issue 1] - [Why it's a problem]
2. [Issue 2] - [Why it's a problem]

## Proposed Changes
1. [Change 1] - [Why it helps]
2. [Change 2] - [Why it helps]

## Non-Goals
- [What we're NOT changing]
- [Features we're NOT adding]

## Constraints
- Zero behavior changes (same inputs → same outputs)
- All existing tests must pass unchanged
- Performance: no regression (ideally improvement)
- PR size: <200 lines

## Test Strategy
1. Run all existing tests (must pass)
2. Add performance benchmarks
3. Compare before/after metrics

## Success Criteria
- [ ] All existing tests passing (no changes to tests)
- [ ] Code coverage maintained or improved
- [ ] Complexity reduced (lower cyclomatic complexity)
- [ ] Performance maintained or improved
- [ ] Lint/typecheck passing

## Rollback Plan
[How to revert if issues found]
```

### Test Writing

```
# Test Suite: [Component/Function Name]

## What to Test
[Component/function to write tests for]

## Test Framework
- Framework: [e.g., Jest, Vitest]
- Utilities: [e.g., @testing-library/react]
- Mocking: [e.g., jest.mock, msw]

## Test Cases (AAA Pattern)

### 1. Happy Path
- Valid input → expected output
- [List specific test cases]

### 2. Edge Cases
- Empty input → [expected behavior]
- Invalid input → [expected behavior]
- Boundary values → [expected behavior]
- [List specific test cases]

### 3. Error Cases
- Network failure → [expected behavior]
- Timeout → [expected behavior]
- Invalid state → [expected behavior]
- [List specific test cases]

## Test Pyramid
- Unit tests: [70% - test pure functions, utilities]
- Integration tests: [20% - test API endpoints, DB operations]
- E2E tests: [10% - test critical user flows]

## Coverage Requirements
- Overall: ≥80%
- New code: 100%
- Critical paths: 100%

## Performance
- Each test should complete in <100ms
- Total suite should complete in <5s
- No flaky tests (run 3 times to verify)

## Success Criteria
- [ ] All test cases implemented
- [ ] AAA pattern followed
- [ ] No flaky tests
- [ ] Coverage ≥80%
- [ ] All tests passing
- [ ] Test execution time <5s
```

## Prompt Optimization Techniques

### 1. Chain of Thought

Guide AI through reasoning steps.

```
Before implementing, consider:
1. What are the possible approaches?
   - Approach A: [description] - Pros: [list] - Cons: [list]
   - Approach B: [description] - Pros: [list] - Cons: [list]

2. Which approach is simplest?
   - [Analysis]

3. What are the edge cases?
   - [List edge cases]

4. What tests are needed?
   - [List test cases]

Now implement using the simplest approach.
```

### 2. Few-Shot Learning

Provide multiple examples.

```
Write error messages following this pattern:

Example 1:
Input: email=''
Output: { error: 'Email required', field: 'email', code: 'REQUIRED' }

Example 2:
Input: email='invalid'
Output: { error: 'Invalid email format', field: 'email', code: 'INVALID_FORMAT' }

Example 3:
Input: email='too-long@example...'
Output: { error: 'Email too long (max 254 characters)', field: 'email', code: 'TOO_LONG' }

Now write error messages for password validation following the same pattern.
```

### 3. Iterative Refinement

Start broad, then narrow.

```
Step 1: List all possible error cases
[AI generates comprehensive list]

Step 2: Prioritize by likelihood
[AI ranks errors]

Step 3: Implement handling for top 5
[AI implements]

Step 4: Verify edge cases covered
[AI reviews]
```

### 4. Constraint-First

Define what NOT to do.

```
Implement user search with these constraints:

MUST NOT:
- Use SELECT * (specify columns)
- Use LIKE '%term%' (use full-text search)
- Skip input sanitization
- Return passwords or secrets
- Exceed 100ms response time
- Use synchronous operations
- Mutate input parameters

MUST:
- Use parameterized queries
- Validate input (max length, allowed chars)
- Paginate results (max 50 per page)
- Return only public fields
- Use async/await
- Handle errors gracefully
- Log query performance
```

## Common Pitfalls

### ❌ Pitfall 1: Vague Requirements

```
"Make it faster"
```

**Why it fails:** AI doesn't know what to optimize or what "faster" means.

**✅ Better:**
```
Optimize database query performance

Current: 2500ms average
Target: <200ms average

Profiling shows:
- N+1 queries (300 queries for 100 users)
- Missing index on user.created_at
- Full table scan on orders table

Implement:
1. Use JOIN instead of N+1 queries
2. Add index: CREATE INDEX idx_users_created ON users(created_at)
3. Add WHERE clause to limit rows scanned

Measure before/after with:
- EXPLAIN ANALYZE
- Application performance monitoring
- Load test with 1000 concurrent users
```

### ❌ Pitfall 2: Missing Context

```
"Fix the bug in auth.ts"
```

**Why it fails:** AI doesn't know which bug or what the expected behavior is.

**✅ Better:**
```
Fix JWT expiration check in auth.ts:117

Bug: Expired tokens are being accepted as valid

Root Cause: Token expiration check uses > instead of <
Current: if (decoded.exp > Date.now() / 1000)
Should be: if (decoded.exp < Date.now() / 1000)

Steps to Reproduce:
1. Create token with expiresIn: '1s'
2. Wait 2 seconds
3. Call /api/protected with expired token
4. Expected: 401, Actual: 200 (bug)

Test Case to Add:
it('should reject expired tokens', async () => {
  const expiredToken = createToken({ exp: Date.now() / 1000 - 3600 })
  const res = await request(app)
    .get('/api/protected')
    .set('Authorization', `Bearer ${expiredToken}`)
  expect(res.status).toBe(401)
  expect(res.body.error).toBe('Token expired')
})
```

### ❌ Pitfall 3: No Success Criteria

```
"Improve error handling"
```

**Why it fails:** AI doesn't know what "improved" means.

**✅ Better:**
```
Improve error handling to meet production standards

Current Issues:
1. Errors swallowed silently (no logging)
2. Generic "Something went wrong" messages
3. No error codes for client handling
4. Stack traces exposed to users
5. No retry logic for transient failures

Success Criteria:
- [ ] All errors logged with context (user ID, request ID, timestamp)
- [ ] Specific error messages for each case
- [ ] Error codes following API spec (ERR_001, ERR_002, etc.)
- [ ] Stack traces only in development (not production)
- [ ] Automatic retry for network errors (max 3 attempts)
- [ ] Error response format: { error: string, code: string, requestId: string }
- [ ] All tests passing with new error handling
```

## Director-Specific Prompting

When decomposing tasks, provide:

```
Task: [High-level feature]

Decomposition Strategy:
1. Identify work types (feature, fix, refactor, docs, test)
2. Ensure 1 ticket = 1 purpose (no mixing)
3. Keep each subtask <200 lines
4. Order by dependency (tests before implementation)

Subtasks:
- subtask_001 (test): Write tests for [X]
  - Goal: 80% coverage for [specific functionality]
  - Assigned: player1
  - Lines: ~100

- subtask_002 (feature): Implement [X]
  - Goal: Pass all tests from subtask_001
  - Assigned: player2
  - Lines: ~150
  - Depends on: subtask_001

- subtask_003 (docs): Document [X]
  - Goal: README and JSDoc comments
  - Assigned: player3
  - Lines: ~50
  - Depends on: subtask_002

Quality Gates (all subtasks):
- lint: required
- typecheck: required
- test_coverage: 80%
- max_lines: 200
```

## Captain-Specific Prompting

When optimizing prompts for Players, add:

```
Original Instruction: [from Director]

Enriched Context:
- Files to work with: [specific paths]
- Related components: [list]
- Code style: [specific conventions]
- Common pitfalls: [warnings]
- Similar existing code: [reference]

Expected Test Cases:
1. [Specific test case 1 with example]
2. [Specific test case 2 with example]

Performance Benchmarks:
- Target: [specific number]
- Measurement: [how to measure]

Quality Thresholds:
- Coverage: ≥80%
- Complexity: ≤10 (cyclomatic)
- Lines: <200
```

## Summary

Effective prompting requires:
1. **Rich Context**: Language, framework, dependencies, files
2. **Clear Success Criteria**: Specific, measurable outcomes
3. **Concrete Examples**: Show the desired pattern
4. **Technical Constraints**: Versions, limits, requirements
5. **Edge Cases**: Non-happy-path scenarios
6. **Quality Gates**: Automated checks

**The more specific the prompt, the better the code.**
