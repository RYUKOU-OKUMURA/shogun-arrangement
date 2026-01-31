# AI-Driven Development Workflow

## Overview

This document describes the complete AI-driven development workflow used in the tmux-parallel-core system.

## Core Principles

### 1 Ticket = 1 Purpose

**NEVER mix different types of work in one task:**
- ✅ Feature implementation (separate ticket)
- ✅ Refactoring (separate ticket)
- ✅ Bug fix (separate ticket)
- ❌ Feature + refactoring in same ticket

**Why?**
- Easier to review
- Easier to rollback
- Clear git history
- Faster deployment

### Small PR Principle

**Target PR sizes:**
- **Ideal**: < 200 lines
- **Maximum**: 400 lines
- **Over 400**: Split into multiple PRs

**Research shows:**
- Teams with <200 line PRs deploy 40% more code
- Smaller PRs = faster reviews
- Smaller PRs = fewer bugs
- Smaller PRs = easier rollbacks

## Development Flow

### Step 1: Task Decomposition (Director)

```yaml
# Director creates task breakdown
command:
  id: cmd_001
  description: "Implement user authentication"
  type: feature
  small_pr: true
  tdd_required: true

  subtasks:
    - id: subtask_001
      type: test
      description: "Write authentication tests"
      assigned_to: player1

    - id: subtask_002
      type: feature
      description: "Implement auth middleware"
      assigned_to: player2
      depends_on: subtask_001
```

**Director responsibilities:**
- Decompose into subtasks (<200 lines each)
- Define clear success criteria
- Set quality gates
- Identify dependencies

### Step 2: Prompt Optimization (Captain)

Captain enriches Director's instructions with:

**Missing details:**
- File paths to work with
- Related components
- Code style conventions
- Common pitfalls

**Success criteria:**
- Specific test assertions
- Performance benchmarks
- Quality thresholds

**Examples:**
- Similar existing code
- Expected input/output
- Test case patterns

### Step 3: TDD Execution (Players)

Players follow strict TDD workflow:

#### RED Phase: Write Failing Test

```typescript
describe('authentication', () => {
  it('should return 401 when token is expired', () => {
    // ARRANGE: Setup test data
    const expiredToken = 'expired.jwt.token'
    const req = mockRequest({ headers: { authorization: expiredToken }})
    const res = mockResponse()

    // ACT: Execute the code
    authMiddleware(req, res, next)

    // ASSERT: Verify results
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Token expired' })
  })
})
```

**Commit:** `test: add tests for X`

**Verify:** Run tests → they MUST fail

#### GREEN Phase: Minimal Implementation

```typescript
export function authMiddleware(req, res, next) {
  const token = req.headers.authorization

  try {
    const decoded = jwt.verify(token, SECRET_KEY)
    req.user = decoded
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' })
    }
    return res.status(401).json({ error: 'Invalid token' })
  }
}
```

**Commit:** `feat: implement X`

**Verify:** Run tests → they MUST pass

#### REFACTOR Phase: Improve Quality

```typescript
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req.headers.authorization)

  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    const decoded = verifyToken(token)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: getErrorMessage(error) })
  }
}

function extractToken(authHeader?: string): string | null {
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
}

function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET_KEY) as JwtPayload
}

function getErrorMessage(error: unknown): string {
  if (error instanceof jwt.TokenExpiredError) return 'Token expired'
  if (error instanceof jwt.JsonWebTokenError) return 'Invalid token'
  return 'Authentication failed'
}
```

**Commit:** `refactor: improve X` (separate commit!)

**Verify:** Tests still pass, coverage ≥80%

### Step 4: Quality Verification (Players)

Before reporting completion, verify ALL items:

#### Quality Gates ✅
- [ ] Tests written FIRST (TDD followed)
- [ ] All tests passing
- [ ] Test coverage ≥80%
- [ ] Lint passing
- [ ] Type check passing
- [ ] No console.log
- [ ] PR size <200 lines

#### Code Quality ✅
- [ ] Immutability (no mutations)
- [ ] Error handling (all errors caught)
- [ ] Shallow nesting (max 4 levels)
- [ ] Pure functions (side effects isolated)
- [ ] Clear naming
- [ ] No hardcoded values

#### Test Quality ✅
- [ ] Test Pyramid respected (Unit > Integration > E2E)
- [ ] AAA pattern used
- [ ] No flaky tests (run 3 times)
- [ ] Edge cases covered
- [ ] Meaningful assertions

### Step 5: Completion Report (Players)

```markdown
# Completion Report: subtask_001

## Task
Write authentication tests

## What I Did
- Created src/auth/__tests__/auth.test.ts
- Wrote 5 test cases covering valid/invalid/expired tokens
- All tests passing

## Quality Metrics
- ✅ Test coverage: 85% (target: 80%)
- ✅ Lines of code: 120 (target: <200)
- ✅ Lint: Passed
- ✅ TypeCheck: Passed
- ✅ Build: Passed
- ✅ Tests: 5/5 passing (no flaky)

## Files Changed
- Created: src/auth/__tests__/auth.test.ts
- Modified: package.json (added jest config)

## What's Next
- subtask_002 can now proceed (implementation)
- Tests are ready for TDD workflow

## Blockers/Issues
- None
```

### Step 6: Monitoring & Escalation (Captain)

Captain monitors quality metrics:

| Indicator | Green | Yellow | Red |
|-----------|-------|--------|-----|
| Test coverage | ≥80% | 70-79% | <70% |
| PR size | <200 lines | 200-400 | >400 |
| Build status | Passing | - | Failing |
| Review time | <2h | 2-4h | >4h |
| Flaky tests | 0 | 1-2 | >2 |

**Red = Immediate intervention required**

Captain escalates to Director if:
- Player stuck >30 minutes
- Quality gates failing
- PR growing beyond 400 lines
- Flaky tests detected

## Communication Protocol

### Event-Driven (No Polling)

**Director → Captain:**
```bash
# Write to YAML
cat > queue/director_to_captain.yaml

# Notify Captain (2 separate calls!)
tmux send-keys -t captain:0.0 'New instructions in queue/director_to_captain.yaml. Execute.'
tmux send-keys -t captain:0.0 Enter
```

**Captain → Player:**
```bash
# Write to YAML
cat > queue/captain_to_players/player1.yaml

# Notify Player (2 separate calls!)
tmux send-keys -t players:0.0 'Task assigned. Check queue/captain_to_players/player1.yaml'
tmux send-keys -t players:0.0 Enter
```

**Player → Captain:**
```markdown
# Update dashboard.md only (NO send-keys to avoid interrupting user)
Players report completion by updating their section in dashboard.md
Captain reads dashboard.md periodically
```

## Metrics Tracking

### Key Metrics (via dashboard.md)

| Metric | Target | Purpose |
|--------|--------|---------|
| Review wait time | < 2 hours | Fast feedback loop |
| PR lifecycle | < 1 day | Quick iteration |
| Test coverage | ≥ 80% | Code quality |
| Flaky test rate | < 1% | Reliability |
| Lines per PR | < 200 | Reviewability |

### Dashboard Format

```markdown
## Quality Metrics
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Test Coverage | 85% | 80% | ✅ |
| Avg PR Size | 180 lines | <200 | ✅ |
| Build Status | Passing | Passing | ✅ |
| Flaky Tests | 0 | <1% | ✅ |
```

## Best Practices

### Do's ✅

- **Write tests first** (TDD)
- **Keep PRs small** (<200 lines)
- **Separate concerns** (1 ticket = 1 purpose)
- **Use immutable patterns** (spread, map, filter)
- **Handle all errors** (no silent failures)
- **Provide rich context** (in prompts)
- **Track metrics** (dashboard.md)
- **Escalate blockers** (>30 min stuck)

### Don'ts ❌

- **Don't mix work types** (feature + refactor)
- **Don't skip tests** (TDD is mandatory)
- **Don't mutate objects** (use immutability)
- **Don't suppress errors** (fix root cause)
- **Don't over-engineer** (minimal implementation first)
- **Don't hardcode values** (use constants/config)
- **Don't skip quality gates** (enforce standards)
- **Don't poll** (use event-driven communication)

## Error Handling Philosophy

```typescript
// ❌ WRONG: Suppress errors
try {
  riskyOperation()
} catch (e) {
  // Ignore
}

// ✅ CORRECT: Handle properly
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  throw new Error('User-friendly message with context')
}
```

## When to Ask for Help

- Stuck for >30 minutes → Report blocker to Captain
- Requirements unclear → Ask Captain for clarification
- Quality gates failing repeatedly → Request guidance
- Scope growing beyond 200 lines → Request task split

## Summary

The AI-Driven Development Workflow ensures:
- **Quality**: TDD + Quality Gates + 80% coverage
- **Speed**: Small PRs + Fast reviews + Quick iteration
- **Reliability**: Immutability + Error handling + No flaky tests
- **Maintainability**: Clear code + Good naming + Shallow nesting
- **Scalability**: Event-driven + Metrics tracking + Blocker detection
