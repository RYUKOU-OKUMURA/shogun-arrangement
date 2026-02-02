/**
 * Tests for Task Decomposer
 */

import { TaskDecomposer, UserCommand } from '../task-decomposer.js'
import { Subtask } from '../../core/schemas/command.js'

// Mock logger
jest.mock('../../utils/logger.js', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    success: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe('TaskDecomposer', () => {
  let decomposer: TaskDecomposer

  beforeEach(() => {
    decomposer = new TaskDecomposer()
    jest.clearAllMocks()
  })

  describe('decompose', () => {
    it('should decompose simple feature request', async () => {
      const command: UserCommand = {
        description: 'Add user authentication',
        type: 'feature',
      }

      const subtasks = await decomposer.decompose(command)

      expect(subtasks).toHaveLength(1)
      expect(subtasks[0]).toMatchObject({
        description: 'Add user authentication',
        type: 'feature',
        assigned_to: 'player1',
      })
      expect(subtasks[0].id).toMatch(/^TASK-\d{8}-\d{3}$/)
    })

    it('should generate correct goal for feature type', async () => {
      const command: UserCommand = {
        description: 'Implement dark mode',
        type: 'feature',
      }

      const subtasks = await decomposer.decompose(command)

      expect(subtasks[0].goal).toContain('Implement new feature')
      expect(subtasks[0].goal).toContain('TDD')
      expect(subtasks[0].goal).toContain('200 lines')
    })

    it('should generate correct goal for fix type', async () => {
      const command: UserCommand = {
        description: 'Fix login button bug',
        type: 'fix',
      }

      const subtasks = await decomposer.decompose(command)

      expect(subtasks[0].goal).toContain('Fix bug')
      expect(subtasks[0].goal).toContain('failing test first')
    })

    it('should generate correct goal for refactor type', async () => {
      const command: UserCommand = {
        description: 'Refactor authentication module',
        type: 'refactor',
      }

      const subtasks = await decomposer.decompose(command)

      expect(subtasks[0].goal).toContain('Refactor')
      expect(subtasks[0].goal).toContain('all existing tests pass')
    })

    it('should include context in subtask', async () => {
      const command: UserCommand = {
        description: 'Add pagination',
        type: 'feature',
        context: 'User list page needs pagination for better UX',
      }

      const subtasks = await decomposer.decompose(command)

      expect(subtasks[0].context).toBe('User list page needs pagination for better UX')
    })

    it('should set quality gates', async () => {
      const command: UserCommand = {
        description: 'Add search feature',
        type: 'feature',
      }

      const subtasks = await decomposer.decompose(command)

      expect(subtasks[0].quality_gates).toEqual({
        lint: true,
        typecheck: true,
        test_coverage: 80,
        max_lines: 200,
      })
    })

    it('should default to feature type if not specified', async () => {
      const command: UserCommand = {
        description: 'Add analytics dashboard',
      }

      const subtasks = await decomposer.decompose(command)

      expect(subtasks[0].type).toBe('feature')
    })
  })

  describe('validateSubtasks', () => {
    it('should validate valid subtasks', () => {
      const subtasks: Subtask[] = [
        {
          id: 'TASK-001',
          description: 'Valid task description that is long enough',
          assigned_to: 'player1',
          goal: 'This is a clear goal that explains what to do',
          type: 'feature',
          quality_gates: {
            lint: true,
            typecheck: true,
            test_coverage: 80,
            max_lines: 200,
          },
        },
      ]

      const result = decomposer.validateSubtasks(subtasks)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect short description', () => {
      const subtasks: Subtask[] = [
        {
          id: 'TASK-001',
          description: 'Short',
          assigned_to: 'player1',
          goal: 'This is a clear goal',
          type: 'feature',
        },
      ]

      const result = decomposer.validateSubtasks(subtasks)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Subtask TASK-001: Description too short')
    })

    it('should detect missing goal', () => {
      const subtasks: Subtask[] = [
        {
          id: 'TASK-001',
          description: 'Valid description here',
          assigned_to: 'player1',
          goal: 'Short',
          type: 'feature',
        },
      ]

      const result = decomposer.validateSubtasks(subtasks)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Subtask TASK-001: Goal not clear enough')
    })

    it('should detect missing player assignment', () => {
      const subtasks: Subtask[] = [
        {
          id: 'TASK-001',
          description: 'Valid description here',
          assigned_to: '',
          goal: 'This is a clear goal that explains what to do',
          type: 'feature',
        },
      ]

      const result = decomposer.validateSubtasks(subtasks)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Subtask TASK-001: No player assigned')
    })

    it('should detect low test coverage', () => {
      const subtasks: Subtask[] = [
        {
          id: 'TASK-001',
          description: 'Valid description here',
          assigned_to: 'player1',
          goal: 'This is a clear goal',
          type: 'feature',
          quality_gates: {
            lint: true,
            typecheck: true,
            test_coverage: 50,
            max_lines: 200,
          },
        },
      ]

      const result = decomposer.validateSubtasks(subtasks)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Subtask TASK-001: Test coverage should be >= 80%')
    })

    it('should collect multiple errors', () => {
      const subtasks: Subtask[] = [
        {
          id: 'TASK-001',
          description: 'Short',
          assigned_to: '',
          goal: 'Bad',
          type: 'feature',
        },
      ]

      const result = decomposer.validateSubtasks(subtasks)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
    })
  })
})
