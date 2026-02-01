/**
 * Logger utility with colored output
 */

import chalk from 'chalk'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

class Logger {
  private logLevel: LogLevel = 'info'

  setLogLevel(level: LogLevel): void {
    this.logLevel = level
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    return levels.indexOf(level) >= levels.indexOf(this.logLevel)
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`

    if (data !== undefined) {
      const dataStr = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)
      return `${prefix} ${message}\n${dataStr}`
    }

    return `${prefix} ${message}`
  }

  debug(message: string, data?: unknown): void {
    if (!this.shouldLog('debug')) return
    console.log(chalk.gray(this.formatMessage('debug', message, data)))
  }

  info(message: string, data?: unknown): void {
    if (!this.shouldLog('info')) return
    console.log(chalk.blue(this.formatMessage('info', message, data)))
  }

  warn(message: string, data?: unknown): void {
    if (!this.shouldLog('warn')) return
    console.warn(chalk.yellow(this.formatMessage('warn', message, data)))
  }

  error(message: string, data?: unknown): void {
    if (!this.shouldLog('error')) return
    console.error(chalk.red(this.formatMessage('error', message, data)))
  }

  success(message: string, data?: unknown): void {
    if (!this.shouldLog('info')) return
    console.log(chalk.green(this.formatMessage('info', message, data)))
  }
}

export const logger = new Logger()

// Set default log level from environment variable
const envLogLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel
if (envLogLevel && ['debug', 'info', 'warn', 'error'].includes(envLogLevel)) {
  logger.setLogLevel(envLogLevel)
}
