#!/usr/bin/env node
/**
 * Captain - Coordinator and monitor for multi-agent system
 * Receives Director commands, optimizes prompts, assigns to Players, and actively monitors progress
 */

import { yamlHandler } from '../core/yaml-handler.js'
import { tmuxHelper } from '../core/tmux-helper.js'
import { fileWatcher } from '../core/file-watcher.js'
import { logger } from '../utils/logger.js'
import { CommandSchema } from '../core/schemas/command.js'
import { TaskSchema } from '../core/schemas/task.js'
import { promptOptimizer } from './prompt-optimizer.js'
import { playerAllocator, PlayerAssignment } from './player-allocator.js'
import { qualityMonitor } from './quality-monitor.js'
import { dashboardUpdater } from './dashboard-updater.js'
import { sleep } from '../core/types.js'

const COMMAND_FILE = 'queue/director_to_captain.yaml'
const PLAYER_TASK_DIR = 'queue/captain_to_players/'
const MONITORING_INTERVAL = 15000 // 15 seconds

let currentAssignments: PlayerAssignment[] = []
let completedTasks: string[] = []
let isMonitoring = false

async function main() {
  logger.info('=== Captain Started ===')
  logger.info('Role: Coordinator and active monitor')

  // Watch for Director commands
  logger.info(`Watching for commands: ${COMMAND_FILE}`)

  fileWatcher.watch(COMMAND_FILE, async (filePath) => {
    logger.info(`New command detected: ${filePath}`)
    await handleDirectorCommand(filePath)
  })

  logger.info('Captain ready. Waiting for Director commands...')

  // Keep process alive
  await new Promise(() => {}) // Run forever
}

async function handleDirectorCommand(filePath: string): Promise<void> {
  try {
    // Read and validate command
    const command = await yamlHandler.read(filePath, CommandSchema)
    logger.info(`Received command: ${command.command.id}`)

    // Optimize prompts for each subtask
    logger.info('Optimizing prompts...')
    const tasks = []
    for (const subtask of command.command.subtasks) {
      const task = await promptOptimizer.enrich(subtask, command.command.description)
      tasks.push(task)
    }

    // Assign to players
    logger.info('Assigning tasks to players...')
    currentAssignments = await playerAllocator.assign(command.command.subtasks)

    // Write tasks to player files
    for (const assignment of currentAssignments) {
      const taskFile = `${PLAYER_TASK_DIR}${assignment.playerId}.yaml`

      // Find corresponding task
      const task = tasks.find((t) => t.task.id === assignment.subtask.id)
      if (!task) continue

      logger.info(`Writing task to ${taskFile}`)
      await yamlHandler.write(taskFile, task, TaskSchema)

      // Notify player
      const playerIndex = parseInt(assignment.playerId.replace('player', '')) - 1
      await tmuxHelper.sendMessage(
        `players:0.${playerIndex}`,
        `新しいタスクが割り当てられました。${taskFile}を確認してください。`
      )
    }

    logger.success('All tasks assigned and players notified')

    // Initialize dashboard
    await dashboardUpdater.initialize(currentAssignments)

    // Start active monitoring
    if (!isMonitoring) {
      isMonitoring = true
      activeMonitoring().catch((error) => {
        logger.error('Monitoring error:', error)
        isMonitoring = false
      })
    }
  } catch (error) {
    logger.error('Error handling Director command:', error)
  }
}

async function activeMonitoring(): Promise<void> {
  logger.info('Starting active monitoring (15-second intervals)...')

  while (isMonitoring) {
    await sleep(MONITORING_INTERVAL)

    if (currentAssignments.length === 0) {
      continue
    }

    logger.debug('Checking progress...')

    for (const assignment of currentAssignments) {
      // Skip already completed tasks
      if (completedTasks.includes(assignment.subtask.id)) {
        continue
      }

      const taskFile = `${PLAYER_TASK_DIR}${assignment.playerId}.yaml`

      try {
        // Read current task status
        const task = await yamlHandler.read(taskFile, TaskSchema)

        // Check for inconsistencies
        const status = await qualityMonitor.detectInconsistency(task, assignment.playerId)

        if (status.inconsistent) {
          // Report exists but YAML not updated
          logger.warn(`Inconsistency detected: ${assignment.playerId} - ${task.task.id}`)

          const playerIndex = parseInt(assignment.playerId.replace('player', '')) - 1
          await tmuxHelper.sendMessage(
            `players:0.${playerIndex}`,
            `レポートは作成済みですが、YAMLファイル(${taskFile})のstatusをcompletedに更新してください。`
          )
        } else if (!status.reportExists && task.task.status === 'assigned') {
          // No progress detected
          logger.info(`No progress for ${assignment.playerId}, sending reminder...`)

          const playerIndex = parseInt(assignment.playerId.replace('player', '')) - 1
          await tmuxHelper.sendMessage(
            `players:0.${playerIndex}`,
            `タスク${task.task.id}の進捗を確認してください。ブロックされている場合は報告してください。`
          )
        } else if (task.task.status === 'completed' || task.task.status === 'done') {
          // Task completed
          logger.success(`Task completed: ${task.task.id} by ${assignment.playerId}`)
          completedTasks.push(task.task.id)
          playerAllocator.completeTask(assignment.playerId)
        }
      } catch (error) {
        logger.error(`Error checking ${assignment.playerId}:`, error)
      }
    }

    // Update dashboard
    await dashboardUpdater.update(currentAssignments, completedTasks)

    // Check if all tasks completed
    if (completedTasks.length === currentAssignments.length) {
      logger.success('All tasks completed!')
      await dashboardUpdater.markAllCompleted()

      // Notify Director
      await tmuxHelper.sendMessage(
        'director:0.0',
        `Captain: すべてのタスクが完了しました。レポートはdocs/reports/に保存されています。`
      )

      // Stop monitoring
      isMonitoring = false
      break
    }
  }

  logger.info('Active monitoring stopped')
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('\nShutting down Captain...')
  isMonitoring = false
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
