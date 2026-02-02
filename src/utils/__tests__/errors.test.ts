/**
 * Tests for Custom Error Classes
 */

import {
  ShogunError,
  YamlValidationError,
  TmuxCommunicationError,
  FileWatcherError,
  TaskDecompositionError,
  QualityGateError,
} from '../errors.js'

describe('Custom Error Classes', () => {
  describe('ShogunError', () => {
    it('should create error with message and code', () => {
      const error = new ShogunError('Test error', 'TEST_ERROR')

      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST_ERROR')
      expect(error.name).toBe('ShogunError')
    })

    it('should create error with context', () => {
      const context = { file: 'test.ts', line: 42 }
      const error = new ShogunError('Test error', 'TEST_ERROR', context)

      expect(error.context).toEqual(context)
    })

    it('should be instance of Error', () => {
      const error = new ShogunError('Test error', 'TEST_ERROR')

      expect(error).toBeInstanceOf(Error)
    })

    it('should have stack trace', () => {
      const error = new ShogunError('Test error', 'TEST_ERROR')

      expect(error.stack).toBeDefined()
    })
  })

  describe('YamlValidationError', () => {
    it('should create YAML validation error', () => {
      const error = new YamlValidationError('Invalid YAML')

      expect(error.message).toBe('Invalid YAML')
      expect(error.code).toBe('YAML_VALIDATION_ERROR')
      expect(error.name).toBe('YamlValidationError')
    })

    it('should be instance of ShogunError', () => {
      const error = new YamlValidationError('Invalid YAML')

      expect(error).toBeInstanceOf(ShogunError)
    })

    it('should include context', () => {
      const context = { filePath: 'test.yaml', errors: ['Missing field'] }
      const error = new YamlValidationError('Invalid YAML', context)

      expect(error.context).toEqual(context)
    })
  })

  describe('TmuxCommunicationError', () => {
    it('should create tmux communication error', () => {
      const error = new TmuxCommunicationError('Failed to send keys')

      expect(error.message).toBe('Failed to send keys')
      expect(error.code).toBe('TMUX_COMMUNICATION_ERROR')
      expect(error.name).toBe('TmuxCommunicationError')
    })

    it('should be instance of ShogunError', () => {
      const error = new TmuxCommunicationError('Failed to send keys')

      expect(error).toBeInstanceOf(ShogunError)
    })
  })

  describe('FileWatcherError', () => {
    it('should create file watcher error', () => {
      const error = new FileWatcherError('Watcher failed')

      expect(error.message).toBe('Watcher failed')
      expect(error.code).toBe('FILE_WATCHER_ERROR')
      expect(error.name).toBe('FileWatcherError')
    })

    it('should be instance of ShogunError', () => {
      const error = new FileWatcherError('Watcher failed')

      expect(error).toBeInstanceOf(ShogunError)
    })
  })

  describe('TaskDecompositionError', () => {
    it('should create task decomposition error', () => {
      const error = new TaskDecompositionError('Failed to decompose task')

      expect(error.message).toBe('Failed to decompose task')
      expect(error.code).toBe('TASK_DECOMPOSITION_ERROR')
      expect(error.name).toBe('TaskDecompositionError')
    })

    it('should be instance of ShogunError', () => {
      const error = new TaskDecompositionError('Failed to decompose task')

      expect(error).toBeInstanceOf(ShogunError)
    })
  })

  describe('QualityGateError', () => {
    it('should create quality gate error', () => {
      const error = new QualityGateError('Quality check failed')

      expect(error.message).toBe('Quality check failed')
      expect(error.code).toBe('QUALITY_GATE_ERROR')
      expect(error.name).toBe('QualityGateError')
    })

    it('should be instance of ShogunError', () => {
      const error = new QualityGateError('Quality check failed')

      expect(error).toBeInstanceOf(ShogunError)
    })

    it('should include quality check context', () => {
      const context = {
        checks: {
          lint: false,
          coverage: 75,
        },
      }
      const error = new QualityGateError('Quality check failed', context)

      expect(error.context).toEqual(context)
    })
  })

  describe('Error catching', () => {
    it('should be catchable as specific error type', () => {
      const throwError = () => {
        throw new YamlValidationError('Invalid YAML')
      }

      expect(throwError).toThrow(YamlValidationError)
    })

    it('should be catchable as ShogunError', () => {
      const throwError = () => {
        throw new YamlValidationError('Invalid YAML')
      }

      expect(throwError).toThrow(ShogunError)
    })

    it('should be catchable as Error', () => {
      const throwError = () => {
        throw new YamlValidationError('Invalid YAML')
      }

      expect(throwError).toThrow(Error)
    })
  })
})
