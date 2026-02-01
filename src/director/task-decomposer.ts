/**
 * Task decomposer for Director
 * Breaks down user commands into subtasks following AI-driven principles
 */

import { Subtask } from '../core/schemas/command.js'
import { logger } from '../utils/logger.js'

export interface UserCommand {
  description: string
  type?: 'feature' | 'fix' | 'refactor' | 'docs' | 'test'
  context?: string
}

export class TaskDecomposer {
  /**
   * Decompose user command into subtasks
   * Following AI-driven principles:
   * - 1 ticket = 1 purpose
   * - Small PRs (< 200 lines recommended, max 400)
   * - TDD required
   * - Separate feature changes from refactoring
   */
  async decompose(userCommand: UserCommand): Promise<Subtask[]> {
    logger.info('Decomposing user command...', { description: userCommand.description })

    // Simple decomposition logic for Phase 3
    // In future phases, this could use AI for intelligent decomposition
    const subtasks: Subtask[] = []

    // Generate unique task ID
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const taskId = `TASK-${timestamp}-001`

    // For Phase 3, create a single subtask
    // Future: More intelligent decomposition based on command complexity
    subtasks.push({
      id: taskId,
      description: userCommand.description,
      assigned_to: 'player1', // Default assignment, Captain will optimize
      goal: this.generateGoal(userCommand),
      type: userCommand.type || 'feature',
      context: userCommand.context,
      quality_gates: {
        lint: true,
        typecheck: true,
        test_coverage: 80,
        max_lines: 200,
      },
    })

    logger.success(`Decomposed into ${subtasks.length} subtask(s)`)
    return subtasks
  }

  /**
   * Generate clear goal statement for subtask
   */
  private generateGoal(userCommand: UserCommand): string {
    const type = userCommand.type || 'feature'
    const desc = userCommand.description

    switch (type) {
      case 'feature':
        return `Implement new feature: ${desc}\n\nFollow TDD (RED-GREEN-REFACTOR) and keep PR < 200 lines.`
      case 'fix':
        return `Fix bug: ${desc}\n\nWrite failing test first, then fix. Verify with existing tests.`
      case 'refactor':
        return `Refactor: ${desc}\n\nEnsure all existing tests pass. No behavior changes.`
      case 'docs':
        return `Document: ${desc}\n\nProvide clear examples and comprehensive coverage.`
      case 'test':
        return `Add tests for: ${desc}\n\nAchieve >= 80% coverage for new code.`
      default:
        return desc
    }
  }

  /**
   * Validate subtasks against AI-driven principles
   */
  validateSubtasks(subtasks: Subtask[]): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    for (const subtask of subtasks) {
      // Check for clear description
      if (!subtask.description || subtask.description.length < 10) {
        errors.push(`Subtask ${subtask.id}: Description too short`)
      }

      // Check for clear goal
      if (!subtask.goal || subtask.goal.length < 20) {
        errors.push(`Subtask ${subtask.id}: Goal not clear enough`)
      }

      // Check for player assignment
      if (!subtask.assigned_to) {
        errors.push(`Subtask ${subtask.id}: No player assigned`)
      }

      // Check quality gates
      if (subtask.quality_gates) {
        if (subtask.quality_gates.test_coverage && subtask.quality_gates.test_coverage < 80) {
          errors.push(`Subtask ${subtask.id}: Test coverage should be >= 80%`)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

export const taskDecomposer = new TaskDecomposer()
