#!/usr/bin/env node
/**
 * Director - Strategic planner for multi-agent system
 * Receives user commands, decomposes into subtasks, and delegates to Captain
 */

import * as readline from 'readline'
import { yamlHandler } from '../core/yaml-handler.js'
import { tmuxHelper } from '../core/tmux-helper.js'
import { logger } from '../utils/logger.js'
import { CommandSchema } from '../core/schemas/command.js'
import { taskDecomposer } from './task-decomposer.js'
import { progressMonitor } from './progress-monitor.js'

const COMMAND_FILE = 'queue/director_to_captain.yaml'
const DASHBOARD_FILE = 'docs/dashboard.md'

async function main() {
  logger.info('=== Director Started ===')
  logger.info('Role: Strategic planner and task coordinator')

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  // Get user command
  const userInput = await askQuestion(rl, '\n📋 Enter task description: ')

  if (!userInput || userInput.trim().length === 0) {
    logger.warn('No task description provided. Exiting.')
    rl.close()
    return
  }

  try {
    // Decompose task
    logger.info('Decomposing task into subtasks...')
    const subtasks = await taskDecomposer.decompose({
      description: userInput.trim(),
      type: 'feature', // Default type
    })

    // Validate subtasks
    const validation = taskDecomposer.validateSubtasks(subtasks)
    if (!validation.valid) {
      logger.error('Task validation failed:', validation.errors)
      rl.close()
      return
    }

    // Generate command ID
    const timestamp = new Date().toISOString()
    const commandId = `CMD-${timestamp.split('T')[0].replace(/-/g, '')}-001`

    // Create command
    const command = {
      command: {
        id: commandId,
        timestamp,
        description: userInput.trim(),
        type: 'feature' as const,
        status: 'pending' as const,
        small_pr: true,
        tdd_required: true,
        subtasks,
      },
    }

    // Write to YAML
    logger.info(`Writing command to ${COMMAND_FILE}...`)
    await yamlHandler.write(COMMAND_FILE, command, CommandSchema)
    logger.success('Command written to queue')

    // Notify Captain
    logger.info('Notifying Captain...')
    await tmuxHelper.sendMessage(
      'captain:0.0',
      `新しい指示があります。${COMMAND_FILE}を確認して実行してください。`
    )
    logger.success('Captain notified')

    // Start progress monitoring
    logger.info('Starting progress monitoring...')
    console.log('\n⏳ Monitoring progress... (Press Ctrl+C to stop)\n')

    // Monitor in background
    const monitorPromise = progressMonitor.watch(DASHBOARD_FILE)

    // Wait for completion or user interrupt
    await monitorPromise

    logger.success('Task completed successfully!')
  } catch (error) {
    logger.error('Director error:', error)
  } finally {
    progressMonitor.stop()
    rl.close()
  }
}

function askQuestion(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer)
    })
  })
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('\nShutting down Director...')
  progressMonitor.stop()
  process.exit(0)
})

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error('Fatal error:', error)
    process.exit(1)
  })
}
