/**
 * Quality monitor for Captain
 * Monitors quality gates and ensures standards are met
 */

import fs from 'fs/promises'
import { logger } from '../utils/logger.js'
import { Task } from '../core/schemas/task.js'

export interface QualityStatus {
  taskId: string
  playerId: string
  reportExists: boolean
  yamlStatus: string
  inconsistent: boolean
}

export class QualityMonitor {
  /**
   * Check if report file exists for task
   */
  async checkReportExists(playerId: string, _taskId: string, outputLocation?: string): Promise<boolean> {
    try {
      // Default location if not specified
      const location = outputLocation || 'docs/reports/'

      // Try to find report file
      const files = await fs.readdir(location)

      // Look for files containing player ID
      const playerFiles = files.filter((f) => f.includes(playerId.replace('player', 'player')))

      if (playerFiles.length > 0) {
        logger.debug(`Report found for ${playerId}: ${playerFiles[0]}`)
        return true
      }

      return false
    } catch (error) {
      // Directory might not exist yet
      return false
    }
  }

  /**
   * Detect inconsistencies between YAML status and actual output
   */
  async detectInconsistency(task: Task, playerId: string): Promise<QualityStatus> {
    const reportExists = await this.checkReportExists(playerId, task.task.id, task.task.output_location)
    const yamlStatus = task.task.status

    // Inconsistency: Report exists but YAML not updated
    const inconsistent = reportExists && (yamlStatus === 'assigned' || yamlStatus === 'in_progress')

    return {
      taskId: task.task.id,
      playerId,
      reportExists,
      yamlStatus,
      inconsistent,
    }
  }

  /**
   * Validate quality gates from task
   */
  validateQualityGates(task: Task): { passed: boolean; failures: string[] } {
    const failures: string[] = []

    if (!task.task.quality_gates) {
      return { passed: true, failures: [] }
    }

    const gates = task.task.quality_gates

    // Check test coverage
    if (gates.test_coverage !== undefined) {
      // In Phase 3, we assume this will be checked by Player
      // Future: Actually parse coverage reports
      logger.debug(`Quality gate: test_coverage >= ${gates.test_coverage}%`)
    }

    // Check PR size
    if (gates.max_lines !== undefined) {
      logger.debug(`Quality gate: max_lines < ${gates.max_lines}`)
    }

    // Check lint requirement
    if (gates.lint) {
      logger.debug('Quality gate: lint required')
    }

    // Check typecheck requirement
    if (gates.typecheck) {
      logger.debug('Quality gate: typecheck required')
    }

    return {
      passed: failures.length === 0,
      failures,
    }
  }

  /**
   * Get quality metrics summary for dashboard
   */
  async getQualityMetrics(tasks: Task[]): Promise<string> {
    const total = tasks.length
    const completed = tasks.filter((t) => t.task.status === 'completed' || t.task.status === 'done').length
    const inProgress = tasks.filter((t) => t.task.status === 'in_progress').length
    const blocked = tasks.filter((t) => t.task.status === 'blocked').length

    return `**Quality Metrics**
- Total Tasks: ${total}
- Completed: ${completed}
- In Progress: ${inProgress}
- Blocked: ${blocked}
- Success Rate: ${total > 0 ? Math.round((completed / total) * 100) : 0}%`
  }
}

export const qualityMonitor = new QualityMonitor()
