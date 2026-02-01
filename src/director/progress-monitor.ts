/**
 * Progress monitor for Director
 * Monitors dashboard.md for task completion
 */

import fs from 'fs/promises'
import { logger } from '../utils/logger.js'
import { sleep } from '../core/types.js'

export class ProgressMonitor {
  private isMonitoring = false
  private monitoringInterval = 10000 // 10 seconds

  /**
   * Watch dashboard.md for completion status
   */
  async watch(dashboardPath: string): Promise<void> {
    logger.info('Starting progress monitoring...', { dashboardPath })
    this.isMonitoring = true

    while (this.isMonitoring) {
      try {
        // Check if dashboard exists
        const exists = await this.fileExists(dashboardPath)
        if (!exists) {
          logger.debug('Dashboard file not found, waiting...')
          await sleep(this.monitoringInterval)
          continue
        }

        // Read dashboard content
        const content = await fs.readFile(dashboardPath, 'utf-8')

        // Check for completion indicators
        // Dashboard should contain status information from Captain
        const allCompleted = this.checkAllTasksCompleted(content)

        if (allCompleted) {
          logger.success('All tasks completed!')
          this.stop()
          break
        }

        // Check for blockers
        const hasBlockers = this.checkForBlockers(content)
        if (hasBlockers) {
          logger.warn('Blockers detected in dashboard')
        }

        await sleep(this.monitoringInterval)
      } catch (error) {
        logger.error('Error monitoring progress:', error)
        await sleep(this.monitoringInterval)
      }
    }
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    logger.info('Stopping progress monitoring')
    this.isMonitoring = false
  }

  /**
   * Check if all tasks are completed
   */
  private checkAllTasksCompleted(dashboardContent: string): boolean {
    // Look for completion indicators in dashboard
    // This is a simple implementation; Captain should maintain clear status
    const lines = dashboardContent.toLowerCase()

    // Check for "all tasks completed" or similar
    if (lines.includes('all tasks completed') || lines.includes('status: completed')) {
      return true
    }

    // Check for individual task completion
    // If there are any "in progress" or "assigned" tasks, not all complete
    if (lines.includes('in progress') || lines.includes('assigned') || lines.includes('pending')) {
      return false
    }

    return false
  }

  /**
   * Check for blockers in dashboard
   */
  private checkForBlockers(dashboardContent: string): boolean {
    const lines = dashboardContent.toLowerCase()
    return lines.includes('blocked') || lines.includes('blocker')
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get current status summary from dashboard
   */
  async getStatusSummary(dashboardPath: string): Promise<string> {
    try {
      const exists = await this.fileExists(dashboardPath)
      if (!exists) {
        return 'Dashboard not found'
      }

      const content = await fs.readFile(dashboardPath, 'utf-8')
      // Extract relevant status information
      // This is a simple implementation
      const lines = content.split('\n').slice(0, 10) // First 10 lines
      return lines.join('\n')
    } catch (error) {
      logger.error('Error getting status summary:', error)
      return 'Error reading dashboard'
    }
  }
}

export const progressMonitor = new ProgressMonitor()
