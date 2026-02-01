/**
 * Dashboard updater for Captain
 * Maintains docs/dashboard.md with current status
 */

import fs from 'fs/promises'
import { logger } from '../utils/logger.js'
import { PlayerAssignment } from './player-allocator.js'

export class DashboardUpdater {
  private readonly dashboardPath = 'docs/dashboard.md'

  /**
   * Initialize dashboard
   */
  async initialize(assignments: PlayerAssignment[]): Promise<void> {
    logger.info('Initializing dashboard...')

    const content = this.generateDashboard(assignments, [])

    await fs.writeFile(this.dashboardPath, content, 'utf-8')
    logger.success('Dashboard initialized')
  }

  /**
   * Update dashboard with current progress
   */
  async update(assignments: PlayerAssignment[], completedTasks: string[]): Promise<void> {
    logger.debug('Updating dashboard...')

    const content = this.generateDashboard(assignments, completedTasks)

    await fs.writeFile(this.dashboardPath, content, 'utf-8')
    logger.debug('Dashboard updated')
  }

  /**
   * Mark all tasks as completed
   */
  async markAllCompleted(): Promise<void> {
    logger.info('Marking all tasks as completed...')

    const content = await fs.readFile(this.dashboardPath, 'utf-8')
    const updatedContent = content + '\n\n---\n\n## Status: Completed\n\nAll tasks completed successfully! ✅'

    await fs.writeFile(this.dashboardPath, updatedContent, 'utf-8')
    logger.success('Dashboard marked as completed')
  }

  /**
   * Generate dashboard content
   */
  private generateDashboard(assignments: PlayerAssignment[], completedTasks: string[]): string {
    const timestamp = new Date().toISOString()

    const lines: string[] = []

    lines.push('# Multi-Agent Development Dashboard')
    lines.push('')
    lines.push(`**Last Updated**: ${timestamp}`)
    lines.push('')
    lines.push('---')
    lines.push('')
    lines.push('## Task Overview')
    lines.push('')

    // Task summary
    const total = assignments.length
    const completed = completedTasks.length
    const inProgress = total - completed

    lines.push(`- **Total Tasks**: ${total}`)
    lines.push(`- **Completed**: ${completed}`)
    lines.push(`- **In Progress**: ${inProgress}`)
    lines.push(`- **Progress**: ${total > 0 ? Math.round((completed / total) * 100) : 0}%`)
    lines.push('')
    lines.push('---')
    lines.push('')
    lines.push('## Player Assignments')
    lines.push('')

    // Group by player
    const byPlayer = new Map<string, PlayerAssignment[]>()
    for (const assignment of assignments) {
      const existing = byPlayer.get(assignment.playerId) || []
      existing.push(assignment)
      byPlayer.set(assignment.playerId, existing)
    }

    for (const [playerId, playerAssignments] of byPlayer.entries()) {
      lines.push(`### ${playerId}`)
      lines.push('')

      for (const assignment of playerAssignments) {
        const status = completedTasks.includes(assignment.subtask.id) ? '✅ Completed' : '⏳ In Progress'
        lines.push(`- **${assignment.subtask.id}**: ${assignment.subtask.description} - ${status}`)
      }

      lines.push('')
    }

    lines.push('---')
    lines.push('')
    lines.push('## Next Steps')
    lines.push('')

    if (completed === total) {
      lines.push('All tasks completed! Notifying Director...')
    } else {
      lines.push(`Waiting for ${inProgress} task(s) to complete...`)
    }

    return lines.join('\n')
  }

  /**
   * Add blocker to dashboard
   */
  async addBlocker(playerId: string, taskId: string, blocker: string): Promise<void> {
    logger.warn(`Adding blocker for ${playerId}:${taskId}`)

    const content = await fs.readFile(this.dashboardPath, 'utf-8')

    const blockerSection = `\n\n## ⚠️ Blockers\n\n- **${playerId}** (${taskId}): ${blocker}\n`
    const updatedContent = content + blockerSection

    await fs.writeFile(this.dashboardPath, updatedContent, 'utf-8')
    logger.warn('Blocker added to dashboard')
  }
}

export const dashboardUpdater = new DashboardUpdater()
