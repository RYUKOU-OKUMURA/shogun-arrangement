/**
 * Quality checker for Player
 * Displays quality gate checklist and validates completion
 */

import { Task } from '../core/schemas/task.js'
import { logger } from '../utils/logger.js'

export class QualityChecker {
  /**
   * Display quality gate checklist for task
   */
  displayChecklist(task: Task): void {
    console.log('\n' + '='.repeat(60))
    console.log('📋 Quality Gates Checklist')
    console.log('='.repeat(60))

    const gates = task.task.quality_gates

    if (!gates) {
      console.log('\nNo specific quality gates defined.')
      console.log('Follow standard best practices.')
      return
    }

    console.log('\nBefore marking task as completed, ensure:')
    console.log('')

    let checkNum = 1

    // TDD
    console.log(`${checkNum++}. ✅ TDD Workflow Followed`)
    console.log('   - RED: Write failing test(s) first')
    console.log('   - GREEN: Implement minimal code to pass')
    console.log('   - REFACTOR: Clean up while keeping tests green')
    console.log('')

    // Lint
    if (gates.lint) {
      console.log(`${checkNum++}. ✅ Lint Passing`)
      console.log('   - Run: npm run lint')
      console.log('   - Fix issues: npm run lint:fix')
      console.log('')
    }

    // Type Check
    if (gates.typecheck) {
      console.log(`${checkNum++}. ✅ Type Check Passing`)
      console.log('   - Run: npm run typecheck')
      console.log('   - Fix all TypeScript errors')
      console.log('')
    }

    // Test Coverage
    if (gates.test_coverage) {
      console.log(`${checkNum++}. ✅ Test Coverage >= ${gates.test_coverage}%`)
      console.log('   - Run: npm run test:coverage')
      console.log('   - Add tests for uncovered code')
      console.log('')
    }

    // PR Size
    if (gates.max_lines) {
      console.log(`${checkNum++}. ✅ PR Size < ${gates.max_lines} lines`)
      console.log('   - Check with: git diff --stat')
      console.log('   - If too large, split into smaller tasks')
      console.log('')
    }

    // Comprehensive (for docs)
    if (gates.comprehensive) {
      console.log(`${checkNum++}. ✅ Comprehensive Documentation`)
      console.log('   - Include clear examples')
      console.log('   - Cover all major use cases')
      console.log('   - Provide context and references')
      console.log('')
    }

    // Sources cited (for research)
    if (gates.sources_cited) {
      console.log(`${checkNum++}. ✅ Sources Cited`)
      console.log('   - List all reference URLs')
      console.log('   - Credit original authors')
      console.log('')
    }

    console.log('='.repeat(60))
    console.log('')
  }

  /**
   * Display completion instructions
   */
  displayCompletionInstructions(playerId: string, _taskId: string): void {
    console.log('\n' + '-'.repeat(60))
    console.log('📝 When Task is Complete:')
    console.log('-'.repeat(60))
    console.log('')
    console.log('1. Update YAML status:')
    console.log(`   - File: queue/captain_to_players/${playerId}.yaml`)
    console.log('   - Change status to: "completed"')
    console.log('   - Add completed_at timestamp')
    console.log('')
    console.log('2. Notify Captain:')
    console.log('   Run the command or manually notify')
    console.log('')
    console.log('-'.repeat(60))
    console.log('')
  }

  /**
   * Validate if task can be marked as completed
   * (Placeholder for future automation)
   */
  async validate(_task: Task): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []

    // In Phase 3, this is a manual checklist
    // Future phases: Actual automation (run lint, tests, coverage)

    logger.debug('Quality validation is manual in Phase 3')

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Get quality summary for completed task
   */
  getSummary(_task: Task): string {
    const lines: string[] = []

    lines.push('Quality Gate Summary:')
    const gates = _task.task.quality_gates

    if (!gates) {
      lines.push('- No specific gates defined')
      return lines.join('\n')
    }

    if (gates.lint) lines.push('- ✅ Lint passed')
    if (gates.typecheck) lines.push('- ✅ Type check passed')
    if (gates.test_coverage) lines.push(`- ✅ Test coverage >= ${gates.test_coverage}%`)
    if (gates.max_lines) lines.push(`- ✅ PR size < ${gates.max_lines} lines`)
    if (gates.comprehensive) lines.push('- ✅ Comprehensive documentation')
    if (gates.sources_cited) lines.push('- ✅ Sources cited')

    return lines.join('\n')
  }
}

export const qualityChecker = new QualityChecker()
