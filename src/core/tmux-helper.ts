/**
 * tmux helper for inter-agent communication
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { logger } from '../utils/logger.js'
import { TmuxCommunicationError } from '../utils/errors.js'
import { sleep } from './types.js'

const execAsync = promisify(exec)

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

export class TmuxHelper {
  /**
   * Send message to tmux pane (without Enter key)
   * Important: Call sendEnter() separately after this
   */
  async sendToPane(target: string, message: string, retries = 0): Promise<void> {
    try {
      const escapedMessage = this.escapeMessage(message)
      const command = `tmux send-keys -t ${target} '${escapedMessage}'`

      await execAsync(command)
      logger.debug(`Sent to ${target}: ${message}`)
    } catch (error) {
      if (retries < MAX_RETRIES) {
        logger.warn(`Failed to send to ${target}, retrying (${retries + 1}/${MAX_RETRIES})...`)
        await sleep(RETRY_DELAY)
        return this.sendToPane(target, message, retries + 1)
      }

      logger.error(`Failed to send to ${target} after ${MAX_RETRIES} retries:`, error)
      throw new TmuxCommunicationError(
        `tmux send-keys failed: ${error instanceof Error ? error.message : String(error)}`,
        { target, message, retries }
      )
    }
  }

  /**
   * Send Enter key to tmux pane
   * Must be called separately after sendToPane()
   */
  async sendEnter(target: string, retries = 0): Promise<void> {
    try {
      const command = `tmux send-keys -t ${target} Enter`
      await execAsync(command)
      logger.debug(`Sent Enter to ${target}`)
    } catch (error) {
      if (retries < MAX_RETRIES) {
        logger.warn(`Failed to send Enter to ${target}, retrying (${retries + 1}/${MAX_RETRIES})...`)
        await sleep(RETRY_DELAY)
        return this.sendEnter(target, retries + 1)
      }

      logger.error(`Failed to send Enter to ${target} after ${MAX_RETRIES} retries:`, error)
      throw new TmuxCommunicationError(
        `tmux send-keys Enter failed: ${error instanceof Error ? error.message : String(error)}`,
        { target, retries }
      )
    }
  }

  /**
   * Send message and Enter key (convenience method)
   * Automatically adds 100ms delay between message and Enter
   */
  async sendMessage(target: string, message: string): Promise<void> {
    await this.sendToPane(target, message)
    await sleep(100) // Short delay as per existing pattern in start.sh
    await this.sendEnter(target)
  }

  /**
   * Escape message for shell safety
   */
  private escapeMessage(message: string): string {
    // Escape single quotes for shell
    return message.replace(/'/g, "'\\''")
  }

  /**
   * Check if tmux session exists
   */
  async sessionExists(sessionName: string): Promise<boolean> {
    try {
      await execAsync(`tmux has-session -t ${sessionName}`)
      return true
    } catch {
      return false
    }
  }

  /**
   * Capture pane output
   */
  async capturePane(target: string, lines: number = 20): Promise<string> {
    try {
      const command = `tmux capture-pane -t ${target} -p | tail -${lines}`
      const { stdout } = await execAsync(command)
      return stdout
    } catch (error) {
      logger.error(`Failed to capture pane ${target}:`, error)
      throw new TmuxCommunicationError(
        `tmux capture-pane failed: ${error instanceof Error ? error.message : String(error)}`,
        { target, lines }
      )
    }
  }

  /**
   * List all tmux sessions
   */
  async listSessions(): Promise<string[]> {
    try {
      const { stdout } = await execAsync('tmux list-sessions -F "#{session_name}"')
      return stdout.trim().split('\n').filter(Boolean)
    } catch (error) {
      // If no sessions exist, tmux returns an error
      if (error instanceof Error && error.message.includes('no server running')) {
        return []
      }
      throw error
    }
  }

  /**
   * Get pane ID for a target
   */
  async getPaneId(target: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`tmux display-message -t ${target} -p "#{pane_id}"`)
      return stdout.trim()
    } catch (error) {
      throw new TmuxCommunicationError(
        `Failed to get pane ID: ${error instanceof Error ? error.message : String(error)}`,
        { target }
      )
    }
  }
}

export const tmuxHelper = new TmuxHelper()
