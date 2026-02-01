/**
 * Prompt optimizer for Captain
 * Enriches tasks with context for better Claude Code execution
 */

import { Subtask } from '../core/schemas/command.js'
import { Task } from '../core/schemas/task.js'
import { logger } from '../utils/logger.js'

export class PromptOptimizer {
  /**
   * Enrich subtask with additional context for Player
   */
  async enrich(subtask: Subtask, parentCommand: string): Promise<Task> {
    logger.debug('Enriching prompt for subtask:', { id: subtask.id })

    // Build enriched context
    const enrichedContext = this.buildContext(subtask, parentCommand)

    // Create task with optimized prompt
    const task: Task = {
      task: {
        id: subtask.id,
        parent_id: null,
        description: subtask.description,
        goal: this.optimizeGoal(subtask, enrichedContext),
        type: subtask.type,
        status: 'assigned',
        timestamp: new Date().toISOString(),
        context: enrichedContext,
        output_location: subtask.output_location,
        output_format: subtask.output_format,
        output_filename: subtask.output_filename,
        quality_gates: subtask.quality_gates,
      },
    }

    logger.success('Prompt enriched successfully')
    return task
  }

  /**
   * Build rich context for task
   */
  private buildContext(subtask: Subtask, parentCommand: string): string {
    const contextParts: string[] = []

    // Parent command context
    contextParts.push(`## Parent Command\n${parentCommand}`)

    // Task-specific context
    if (subtask.context) {
      contextParts.push(`\n## Additional Context\n${subtask.context}`)
    }

    // Quality expectations
    contextParts.push('\n## Quality Requirements')
    contextParts.push('- Follow TDD: Write tests FIRST (RED), then implement (GREEN), then refactor (REFACTOR)')
    contextParts.push('- Keep PR size < 200 lines (recommended), max 400 lines')
    contextParts.push('- Ensure test coverage >= 80%')
    contextParts.push('- All lint and type checks must pass')
    contextParts.push('- No console.log statements in production code')

    // Output expectations
    if (subtask.output_location) {
      contextParts.push(`\n## Output Location\n${subtask.output_location}`)
      if (subtask.output_filename) {
        contextParts.push(`Filename: ${subtask.output_filename}`)
      }
    }

    // Dependencies
    if (subtask.depends_on) {
      contextParts.push(`\n## Dependencies\nThis task depends on: ${subtask.depends_on}`)
      contextParts.push('Ensure dependent task is completed before starting.')
    }

    return contextParts.join('\n')
  }

  /**
   * Optimize goal statement
   */
  private optimizeGoal(subtask: Subtask, _context: string): string {
    let goal = subtask.goal

    // Add step-by-step guidance
    goal += '\n\n## Implementation Steps'
    goal += '\n1. **RED**: Write failing test(s) first'
    goal += '\n2. **GREEN**: Implement minimal code to make tests pass'
    goal += '\n3. **REFACTOR**: Clean up code while keeping tests green'
    goal += '\n4. **VERIFY**: Run all quality gates (lint, typecheck, coverage)'
    goal += '\n5. **UPDATE**: Update YAML status to completed'
    goal += '\n6. **NOTIFY**: Send completion notice to Captain'

    // Add quality gate reminders
    if (subtask.quality_gates) {
      goal += '\n\n## Quality Gate Checklist'
      if (subtask.quality_gates.lint) {
        goal += '\n- [ ] Lint passing'
      }
      if (subtask.quality_gates.typecheck) {
        goal += '\n- [ ] Type check passing'
      }
      if (subtask.quality_gates.test_coverage) {
        goal += `\n- [ ] Test coverage >= ${subtask.quality_gates.test_coverage}%`
      }
      if (subtask.quality_gates.max_lines) {
        goal += `\n- [ ] PR size < ${subtask.quality_gates.max_lines} lines`
      }
    }

    return goal
  }

  /**
   * Add examples to task (if applicable)
   */
  addExamples(task: Task, _examples: string[]): Task {
    if (_examples.length === 0) return task

    const examplesSection = '\n\n## Examples\n' + _examples.map((ex, i) => `${i + 1}. ${ex}`).join('\n')

    task.task.context = (task.task.context || '') + examplesSection

    return task
  }
}

export const promptOptimizer = new PromptOptimizer()
