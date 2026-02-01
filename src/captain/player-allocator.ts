/**
 * Player allocator for Captain
 * Assigns tasks to available players with load balancing
 */

import { Subtask } from '../core/schemas/command.js'
import { logger } from '../utils/logger.js'

export interface PlayerAssignment {
  playerId: string
  subtask: Subtask
}

export class PlayerAllocator {
  private readonly availablePlayers = ['player1', 'player2', 'player3', 'player4', 'player5']
  private playerWorkload: Map<string, number> = new Map()

  constructor() {
    // Initialize workload tracking
    for (const player of this.availablePlayers) {
      this.playerWorkload.set(player, 0)
    }
  }

  /**
   * Assign subtasks to players
   * Uses round-robin + load balancing strategy
   */
  async assign(subtasks: Subtask[]): Promise<PlayerAssignment[]> {
    logger.info(`Assigning ${subtasks.length} subtask(s) to players...`)

    const assignments: PlayerAssignment[] = []

    for (const subtask of subtasks) {
      // Check if subtask already has assignment
      const playerId = subtask.assigned_to || this.selectPlayer(subtask)

      assignments.push({
        playerId,
        subtask,
      })

      // Update workload
      const currentLoad = this.playerWorkload.get(playerId) || 0
      this.playerWorkload.set(playerId, currentLoad + 1)

      logger.debug(`Assigned ${subtask.id} to ${playerId}`)
    }

    logger.success(`Assigned ${assignments.length} task(s)`)
    return assignments
  }

  /**
   * Select best player for subtask
   */
  private selectPlayer(_subtask: Subtask): string {
    // Simple strategy: Select player with lowest workload
    let selectedPlayer = this.availablePlayers[0]
    let minWorkload = this.playerWorkload.get(selectedPlayer) || 0

    for (const player of this.availablePlayers) {
      const workload = this.playerWorkload.get(player) || 0
      if (workload < minWorkload) {
        minWorkload = workload
        selectedPlayer = player
      }
    }

    // Future enhancement: Consider task type, player expertise, etc.

    return selectedPlayer
  }

  /**
   * Mark task as completed for player
   */
  completeTask(playerId: string): void {
    const currentLoad = this.playerWorkload.get(playerId) || 0
    this.playerWorkload.set(playerId, Math.max(0, currentLoad - 1))
    logger.debug(`Player ${playerId} completed task, workload: ${this.playerWorkload.get(playerId)}`)
  }

  /**
   * Get current workload distribution
   */
  getWorkloadSummary(): Record<string, number> {
    const summary: Record<string, number> = {}
    for (const [player, workload] of this.playerWorkload.entries()) {
      summary[player] = workload
    }
    return summary
  }

  /**
   * Reset all workloads
   */
  reset(): void {
    for (const player of this.availablePlayers) {
      this.playerWorkload.set(player, 0)
    }
    logger.debug('Player workload reset')
  }
}

export const playerAllocator = new PlayerAllocator()
