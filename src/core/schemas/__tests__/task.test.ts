/**
 * Tests for Task Schema
 */

import { TaskSchema, DependenciesSchema } from '../task.js'
import { z } from 'zod'

describe('TaskSchema', () => {
  describe('DependenciesSchema', () => {
    it('should validate valid dependencies', () => {
      const validDeps = {
        install: 'npm install express',
        depends_on: 'TASK-001',
      }

      expect(() => DependenciesSchema.parse(validDeps)).not.toThrow()
    })

    it('should allow optional fields', () => {
      const minimalDeps = {}

      expect(() => DependenciesSchema.parse(minimalDeps)).not.toThrow()
    })

    it('should allow null depends_on', () => {
      const deps = {
        install: 'npm install',
        depends_on: null,
      }

      expect(() => DependenciesSchema.parse(deps)).not.toThrow()
    })
  })

  describe('TaskSchema', () => {
    const validTask = {
      task: {
        id: 'TASK-20260202-001',
        parent_id: 'CMD-20260202-001',
        description: 'Implement user authentication',
        goal: 'Create JWT-based authentication system',
        type: 'feature',
        status: 'assigned',
        timestamp: '2026-02-02T10:00:00Z',
      },
    }

    it('should validate valid task', () => {
      expect(() => TaskSchema.parse(validTask)).not.toThrow()
    })

    it('should validate task with all optional fields', () => {
      const fullTask = {
        task: {
          ...validTask.task,
          completed_at: '2026-02-02T12:00:00Z',
          context: 'Additional context',
          output_location: './reports',
          output_format: 'yaml',
          output_filename: 'report.yaml',
          quality_gates: {
            lint: true,
            typecheck: true,
            test_coverage: 80,
            max_lines: 200,
          },
          dependencies: {
            install: 'npm install jsonwebtoken',
            depends_on: null,
          },
        },
      }

      expect(() => TaskSchema.parse(fullTask)).not.toThrow()
    })

    it('should reject invalid task ID type', () => {
      const invalidTask = {
        task: {
          ...validTask.task,
          id: 123, // Should be string
        },
      }

      expect(() => TaskSchema.parse(invalidTask)).toThrow(z.ZodError)
    })

    it('should reject invalid status', () => {
      const invalidTask = {
        task: {
          ...validTask.task,
          status: 'invalid_status',
        },
      }

      expect(() => TaskSchema.parse(invalidTask)).toThrow(z.ZodError)
    })

    it('should validate all valid status values', () => {
      const statuses = ['assigned', 'in_progress', 'completed', 'done', 'failed', 'blocked']

      for (const status of statuses) {
        const task = {
          task: {
            ...validTask.task,
            status,
          },
        }

        expect(() => TaskSchema.parse(task)).not.toThrow()
      }
    })

    it('should reject invalid timestamp format', () => {
      const invalidTask = {
        task: {
          ...validTask.task,
          timestamp: '2026-02-02', // Not datetime format
        },
      }

      expect(() => TaskSchema.parse(invalidTask)).toThrow(z.ZodError)
    })

    it('should allow null parent_id', () => {
      const taskWithoutParent = {
        task: {
          ...validTask.task,
          parent_id: null,
        },
      }

      expect(() => TaskSchema.parse(taskWithoutParent)).not.toThrow()
    })

    it('should reject missing required fields', () => {
      const incompleteTask = {
        task: {
          id: 'TASK-001',
          // Missing other required fields
        },
      }

      expect(() => TaskSchema.parse(incompleteTask)).toThrow(z.ZodError)
    })

    it('should validate task type values', () => {
      const types = ['feature', 'fix', 'refactor', 'docs', 'test']

      for (const type of types) {
        const task = {
          task: {
            ...validTask.task,
            type,
          },
        }

        expect(() => TaskSchema.parse(task)).not.toThrow()
      }
    })
  })
})
