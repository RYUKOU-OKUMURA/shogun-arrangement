#!/usr/bin/env node
/**
 * Player - Execution unit for multi-agent system
 * Receives tasks from Captain, displays guidance, and supports execution
 */

import { fileWatcher } from '../core/file-watcher.js'
import { yamlHandler } from '../core/yaml-handler.js'
import { logger } from '../utils/logger.js'
import { TaskSchema } from '../core/schemas/task.js'
import { qualityChecker } from './quality-checker.js'
import { tddWorkflow } from './tdd-workflow.js'

async function main() {
  // Get player ID from command line args
  const args = process.argv.slice(2)
  const playerIdArg = args.find((arg) => arg.startsWith('--player-id='))

  if (!playerIdArg) {
    console.error('Error: --player-id required')
    console.error('Usage: npm run player -- --player-id=1')
    process.exit(1)
  }

  const playerNum = playerIdArg.split('=')[1]
  const playerId = `player${playerNum}`
  const taskFile = `queue/captain_to_players/${playerId}.yaml`

  logger.info(`=== Player ${playerNum} Started ===`)
  logger.info('Role: Task executor')
  logger.info(`Watching: ${taskFile}`)

  // Watch for task assignments
  fileWatcher.watch(taskFile, async (filePath) => {
    logger.info(`New task detected: ${filePath}`)
    await handleTask(filePath, playerId)
  })

  logger.info(`${playerId} ready. Waiting for Captain assignments...\n`)

  // Keep process alive
  await new Promise(() => {}) // Run forever
}

async function handleTask(filePath: string, playerId: string): Promise<void> {
  try {
    // Read task
    const task = await yamlHandler.read(filePath, TaskSchema)

    console.log('\n' + '='.repeat(80))
    console.log('🎯 NEW TASK ASSIGNED')
    console.log('='.repeat(80))
    console.log('')
    console.log(`Task ID: ${task.task.id}`)
    console.log(`Type: ${task.task.type}`)
    console.log(`Status: ${task.task.status}`)
    console.log('')
    console.log('Description:')
    console.log(`  ${task.task.description}`)
    console.log('')
    console.log('Goal:')
    console.log(task.task.goal.split('\n').map((line) => `  ${line}`).join('\n'))
    console.log('')

    if (task.task.context) {
      console.log('Context:')
      console.log(task.task.context.split('\n').map((line) => `  ${line}`).join('\n'))
      console.log('')
    }

    console.log('='.repeat(80))

    // Display TDD workflow guide
    tddWorkflow.displayGuide()

    // Display quality gates checklist
    qualityChecker.displayChecklist(task)

    // Display completion instructions
    qualityChecker.displayCompletionInstructions(playerId, task.task.id)

    console.log('\n✨ Ready to begin. Follow TDD workflow and quality gates.\n')
    console.log('Execute the task using Claude Code, then update YAML when complete.\n')
  } catch (error) {
    logger.error('Error handling task:', error)
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('\nShutting down Player...')
  await fileWatcher.unwatchAll()
  process.exit(0)
})

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error('Fatal error:', error)
    process.exit(1)
  })
}
