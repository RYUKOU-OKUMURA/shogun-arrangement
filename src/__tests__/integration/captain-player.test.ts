/**
 * Integration Tests: Captain → Player Communication
 */

import fs from 'fs/promises'
import { YamlHandler } from '../../core/yaml-handler.js'
import { TaskSchema } from '../../core/schemas/task.js'
import { ReportSchema } from '../../core/schemas/report.js'

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

describe('Captain → Player Communication', () => {
  let yamlHandler: YamlHandler
  const mockWriteFile = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  const mockReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>

  beforeEach(() => {
    yamlHandler = new YamlHandler()
    jest.clearAllMocks()
  })

  describe('Task Assignment', () => {
    it('should assign task to player via YAML', async () => {
      mockWriteFile.mockResolvedValue()

      const task = {
        task: {
          id: 'TASK-001',
          parent_id: 'CMD-001',
          description: 'Implement JWT auth',
          goal: 'Create token generation and validation',
          type: 'feature' as const,
          status: 'assigned' as const,
          timestamp: new Date().toISOString(),
          quality_gates: {
            lint: true,
            typecheck: true,
            test_coverage: 80,
            max_lines: 200,
          },
        },
      }

      await yamlHandler.write('/queue/captain_to_players/player1.yaml', task)

      expect(mockWriteFile).toHaveBeenCalledWith(
        '/queue/captain_to_players/player1.yaml',
        expect.stringContaining('TASK-001'),
        'utf-8'
      )
    })

    it('should validate task schema before assignment', async () => {
      const invalidTask = {
        task: {
          id: 'TASK-001',
          // Missing required fields
        },
      }

      await expect(
        yamlHandler.write('/queue/captain_to_players/player1.yaml', invalidTask, TaskSchema)
      ).rejects.toThrow()
    })
  })

  describe('Player reads task', () => {
    it('should read and validate assigned task', async () => {
      const yamlContent = `
task:
  id: TASK-001
  parent_id: CMD-001
  description: Implement JWT auth
  goal: Create token generation
  type: feature
  status: assigned
  timestamp: 2026-02-02T10:00:00Z
      `

      mockReadFile.mockResolvedValue(yamlContent)

      const task = await yamlHandler.read('/queue/captain_to_players/player1.yaml', TaskSchema)

      expect(task.task.id).toBe('TASK-001')
      expect(task.task.status).toBe('assigned')
    })

    it('should handle enriched prompt context', async () => {
      const yamlContent = `
task:
  id: TASK-001
  parent_id: CMD-001
  description: Implement JWT auth
  goal: Create token generation
  type: feature
  status: assigned
  timestamp: 2026-02-02T10:00:00Z
  context: |
    Additional context about the task
    - Use jsonwebtoken library
    - Follow TDD approach
      `

      mockReadFile.mockResolvedValue(yamlContent)

      const task = await yamlHandler.read('/queue/captain_to_players/player1.yaml', TaskSchema)

      expect(task.task.context).toContain('jsonwebtoken')
    })
  })

  describe('Player reports completion', () => {
    it('should write completion report', async () => {
      mockWriteFile.mockResolvedValue()

      const report = {
        player_id: 'player1',
        task_id: 'TASK-001',
        status: 'completed' as const,
        timestamp: new Date().toISOString(),
        report_location: '/player1/reports/RPT-001.md',
        quality_metrics: {
          test_coverage: 95,
          lines_of_code: 150,
          lint_passed: true,
          typecheck_passed: true,
          tests_passed: true,
        },
      }

      await yamlHandler.write('/player1/reports/RPT-001.yaml', report)

      expect(mockWriteFile).toHaveBeenCalled()
    })

    it('should report blockers', async () => {
      mockWriteFile.mockResolvedValue()

      const report = {
        player_id: 'player2',
        task_id: 'TASK-002',
        status: 'blocked' as const,
        timestamp: new Date().toISOString(),
        blockers: ['Missing AWS credentials', 'Need VPN access'],
      }

      await yamlHandler.write('/player2/reports/RPT-002.yaml', report)

      expect(mockWriteFile).toHaveBeenCalled()
    })
  })

  describe('Captain reads report', () => {
    it('should read and validate player report', async () => {
      const yamlContent = `
player_id: player1
task_id: TASK-001
status: completed
timestamp: 2026-02-02T12:00:00Z
      `

      mockReadFile.mockResolvedValue(yamlContent)

      const report = await yamlHandler.read('/player1/reports/RPT-001.yaml', ReportSchema)

      expect(report.player_id).toBe('player1')
      expect(report.task_id).toBe('TASK-001')
      expect(report.status).toBe('completed')
    })

    it('should detect quality gate failures', async () => {
      const yamlContent = `
player_id: player3
task_id: TASK-003
status: completed
timestamp: 2026-02-02T12:00:00Z
quality_metrics:
  test_coverage: 65
  lint_passed: true
  typecheck_passed: true
  tests_passed: true
      `

      mockReadFile.mockResolvedValue(yamlContent)

      const report = await yamlHandler.read('/player3/reports/RPT-003.yaml', ReportSchema)

      expect(report.status).toBe('completed')
      expect(report.quality_metrics?.test_coverage).toBeLessThan(80)
    })
  })

  describe('Task Status Updates', () => {
    it('should update task status from assigned to in_progress', async () => {
      const yamlContent = `
task:
  id: TASK-001
  parent_id: CMD-001
  description: Test task
  goal: Complete the task
  type: feature
  status: assigned
  timestamp: 2026-02-02T10:00:00Z
      `

      mockReadFile.mockResolvedValue(yamlContent)
      mockWriteFile.mockResolvedValue()

      // Player reads task
      await yamlHandler.read('/queue/captain_to_players/player1.yaml', TaskSchema)

      // Player updates status to in_progress
      await yamlHandler.updateField(
        '/queue/captain_to_players/player1.yaml',
        ['task', 'status'],
        'in_progress'
      )

      expect(mockWriteFile).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle file read errors gracefully', async () => {
      mockReadFile.mockRejectedValue(new Error('File not found'))

      await expect(
        yamlHandler.read('/queue/captain_to_players/missing.yaml', TaskSchema)
      ).rejects.toThrow('File not found')
    })

    it('should handle invalid report format', async () => {
      const invalidYaml = `
player_id: 123
status: invalid_status
      `

      mockReadFile.mockResolvedValue(invalidYaml)

      await expect(yamlHandler.read('/player1/reports/invalid.yaml', ReportSchema)).rejects.toThrow()
    })
  })
})
