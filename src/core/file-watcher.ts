/**
 * File watcher for event-driven YAML monitoring
 */

import chokidar from 'chokidar'
import { logger } from '../utils/logger.js'
import { FileWatcherError } from '../utils/errors.js'

type FileChangeCallback = (filePath: string) => Promise<void>

export class FileWatcher {
  private watchers: Map<string, chokidar.FSWatcher> = new Map()

  /**
   * Watch file for changes and execute callback
   */
  watch(filePath: string, callback: FileChangeCallback): void {
    if (this.watchers.has(filePath)) {
      logger.warn(`Already watching: ${filePath}`)
      return
    }

    const watcher = chokidar.watch(filePath, {
      persistent: true,
      ignoreInitial: true, // Skip initial add event
      awaitWriteFinish: {
        stabilityThreshold: 200, // Wait 200ms after last write
        pollInterval: 100,
      },
      // Additional options for reliability
      usePolling: false, // Use native FS events (faster)
      depth: 0, // Don't watch subdirectories
    })

    watcher.on('change', async (path) => {
      logger.info(`File changed: ${path}`)
      try {
        await callback(path)
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`Callback error for ${path}:`, error.message)
        } else {
          logger.error(`Callback error for ${path}:`, error)
        }
      }
    })

    watcher.on('error', (error) => {
      logger.error(`Watcher error for ${filePath}:`, error)
      throw new FileWatcherError(
        `File watcher error: ${error instanceof Error ? error.message : String(error)}`,
        { filePath }
      )
    })

    watcher.on('ready', () => {
      logger.info(`Started watching: ${filePath}`)
    })

    this.watchers.set(filePath, watcher)
  }

  /**
   * Watch multiple files with same callback
   */
  watchMultiple(filePaths: string[], callback: FileChangeCallback): void {
    for (const filePath of filePaths) {
      this.watch(filePath, callback)
    }
  }

  /**
   * Stop watching a file
   */
  async unwatch(filePath: string): Promise<void> {
    const watcher = this.watchers.get(filePath)
    if (watcher) {
      await watcher.close()
      this.watchers.delete(filePath)
      logger.info(`Stopped watching: ${filePath}`)
    }
  }

  /**
   * Stop watching all files
   */
  async unwatchAll(): Promise<void> {
    for (const [filePath, watcher] of this.watchers) {
      await watcher.close()
      logger.info(`Stopped watching: ${filePath}`)
    }
    this.watchers.clear()
  }

  /**
   * Get list of watched files
   */
  getWatchedFiles(): string[] {
    return Array.from(this.watchers.keys())
  }

  /**
   * Check if file is being watched
   */
  isWatching(filePath: string): boolean {
    return this.watchers.has(filePath)
  }
}

export const fileWatcher = new FileWatcher()
