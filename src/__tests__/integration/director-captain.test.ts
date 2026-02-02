/**
 * Integration Tests: Director → Captain Communication
 */

import fs from 'fs/promises'
import { TaskDecomposer } from '../../director/task-decomposer.js'
import { YamlHandler } from '../../core/yaml-handler.js'

// Mock fs/promises
jest.mock('fs/promises')

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

describe('Director → Captain Communication', () => {
  let decomposer: TaskDecomposer
  let yamlHandler: YamlHandler
  const mockWriteFile = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  const mockReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>

  beforeEach(() => {
    decomposer = new TaskDecomposer()
    yamlHandler = new YamlHandler()
    jest.clearAllMocks()
  })

  describe('Task Flow', () => {
    it('should decompose and write task to queue', async () => {
      mockWriteFile.mockResolvedValue()

      // Director decomposes user command
      const subtasks = await decomposer.decompose({
        description: 'Implement user authentication',
        type: 'feature',
        context: 'JWT-based auth system',
      })

      expect(subtasks).toHaveLength(1)
      expect(subtasks[0].description).toBe('Implement user authentication')

      // Director writes to YAML queue (without schema validation for simplicity)
      const command = {
        id: 'CMD-001',
        timestamp: new Date().toISOString(),
        description: 'Implement user authentication',
        type: 'feature',
        status: 'pending',
        subtasks,
      }

      await yamlHandler.write('/queue/director_to_captain.yaml', { command })

      expect(mockWriteFile).toHaveBeenCalledWith(
        '/queue/director_to_captain.yaml',
        expect.stringContaining('Implement user authentication'),
        'utf-8'
      )
    })

    it('should handle multiple subtasks', async () => {
      mockWriteFile.mockResolvedValue()

      const subtasks = [
        {
          id: 'TASK-001',
          description: 'Create auth module',
          assigned_to: 'player1',
          goal: 'Implement authentication',
          type: 'feature' as const,
        },
        {
          id: 'TASK-002',
          description: 'Add tests',
          assigned_to: 'player2',
          goal: 'Write comprehensive tests',
          type: 'test' as const,
        },
      ]

      const command = {
        id: 'CMD-001',
        timestamp: new Date().toISOString(),
        description: 'Implement authentication',
        type: 'feature' as const,
        status: 'pending' as const,
        subtasks,
      }

      await yamlHandler.write('/queue/director_to_captain.yaml', { command })

      expect(mockWriteFile).toHaveBeenCalled()
    })
  })

  describe('Captain reads command', () => {
    it('should read command from queue', async () => {
      const yamlContent = `
command:
  id: CMD-001
  timestamp: 2026-02-02T10:00:00Z
  description: Implement user authentication
  type: feature
  status: pending
  subtasks:
    - id: TASK-001
      description: Create auth module
      assigned_to: player1
      goal: Implement authentication
      type: feature
      `

      mockReadFile.mockResolvedValue(yamlContent)

      const command = await yamlHandler.readRaw('/queue/director_to_captain.yaml')

      expect(command).toHaveProperty('command')
      expect((command as any).command.id).toBe('CMD-001')
      expect((command as any).command.subtasks).toHaveLength(1)
    })

    it('should handle malformed YAML', async () => {
      const invalidYaml = `
command:
  id: CMD-001
    invalid_indent: value
      `

      mockReadFile.mockResolvedValue(invalidYaml)

      await expect(yamlHandler.readRaw('/queue/director_to_captain.yaml')).rejects.toThrow()
    })
  })

  describe('Error Handling', () => {
    it('should handle file write errors', async () => {
      mockWriteFile.mockRejectedValue(new Error('Write failed'))

      const command = {
        id: 'CMD-001',
        timestamp: new Date().toISOString(),
        description: 'Test',
        type: 'feature' as const,
        status: 'pending' as const,
        subtasks: [],
      }

      await expect(
        yamlHandler.write('/queue/director_to_captain.yaml', { command })
      ).rejects.toThrow('Write failed')
    })

    it('should handle file read errors', async () => {
      mockReadFile.mockRejectedValue(new Error('File not found'))

      await expect(yamlHandler.readRaw('/queue/director_to_captain.yaml')).rejects.toThrow(
        'File not found'
      )
    })

    it('should validate task decomposition errors', () => {
      const invalidSubtasks = [
        {
          id: 'TASK-001',
          description: 'Short',
          assigned_to: '',
          goal: 'Bad',
          type: 'feature' as const,
        },
      ]

      const validation = decomposer.validateSubtasks(invalidSubtasks)

      expect(validation.valid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })
  })

  describe('Retry Logic', () => {
    it('should retry on transient failures', async () => {
      let attempts = 0
      mockWriteFile.mockImplementation(() => {
        attempts++
        if (attempts < 3) {
          return Promise.reject(new Error('Transient error'))
        }
        return Promise.resolve()
      })

      // Simple retry logic
      const writeWithRetry = async (maxRetries = 3) => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            await yamlHandler.write('/queue/test.yaml', { test: 'data' })
            return
          } catch (error) {
            if (i === maxRetries - 1) throw error
            await new Promise((resolve) => setTimeout(resolve, 100))
          }
        }
      }

      await expect(writeWithRetry()).resolves.not.toThrow()
      expect(attempts).toBe(3)
    })
  })
})
