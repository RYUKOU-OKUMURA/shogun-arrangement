/**
 * TDD workflow guide for Player
 * Provides guidance on Test-Driven Development
 */

export class TddWorkflow {
  /**
   * Display TDD workflow guide
   */
  displayGuide(): void {
    console.log('\n' + '='.repeat(60))
    console.log('🔴 🟢 🔵 TDD Workflow Guide')
    console.log('='.repeat(60))
    console.log('')
    console.log('Follow the RED-GREEN-REFACTOR cycle:')
    console.log('')

    console.log('🔴 Phase 1: RED - Write Failing Test')
    console.log('   1. Write a test that describes desired behavior')
    console.log('   2. Run test - it should FAIL (no implementation yet)')
    console.log('   3. Verify failure message is meaningful')
    console.log('')

    console.log('🟢 Phase 2: GREEN - Make Test Pass')
    console.log('   1. Write MINIMAL code to make test pass')
    console.log('   2. Run test - it should PASS')
    console.log('   3. Avoid over-engineering at this stage')
    console.log('')

    console.log('🔵 Phase 3: REFACTOR - Improve Code')
    console.log('   1. Clean up code while keeping tests green')
    console.log('   2. Remove duplication (DRY principle)')
    console.log('   3. Improve names, structure, patterns')
    console.log('   4. Run ALL tests after each change')
    console.log('')

    console.log('🔄 Repeat: Start next feature with RED phase')
    console.log('')
    console.log('='.repeat(60))
    console.log('')
  }

  /**
   * Display test writing tips
   */
  displayTestTips(): void {
    console.log('\n📝 Test Writing Tips:')
    console.log('')
    console.log('1. AAA Pattern:')
    console.log('   - Arrange: Set up test data')
    console.log('   - Act: Execute the code under test')
    console.log('   - Assert: Verify expected outcome')
    console.log('')
    console.log('2. Test Naming:')
    console.log('   - Describe WHAT is being tested')
    console.log('   - Example: "should return empty array when no items found"')
    console.log('')
    console.log('3. Edge Cases:')
    console.log('   - Test boundary conditions')
    console.log('   - Test error handling')
    console.log('   - Test empty/null/undefined inputs')
    console.log('')
  }

  /**
   * Get TDD summary
   */
  getSummary(): string {
    return `TDD Cycle: 🔴 Write failing test → 🟢 Make it pass → 🔵 Refactor → Repeat`
  }
}

export const tddWorkflow = new TddWorkflow()
