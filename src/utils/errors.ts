/**
 * Custom error classes for shogun-arrangement
 */

export class ShogunError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ShogunError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export class YamlValidationError extends ShogunError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'YAML_VALIDATION_ERROR', context)
    this.name = 'YamlValidationError'
  }
}

export class TmuxCommunicationError extends ShogunError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'TMUX_COMMUNICATION_ERROR', context)
    this.name = 'TmuxCommunicationError'
  }
}

export class FileWatcherError extends ShogunError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'FILE_WATCHER_ERROR', context)
    this.name = 'FileWatcherError'
  }
}

export class TaskDecompositionError extends ShogunError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'TASK_DECOMPOSITION_ERROR', context)
    this.name = 'TaskDecompositionError'
  }
}

export class QualityGateError extends ShogunError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'QUALITY_GATE_ERROR', context)
    this.name = 'QualityGateError'
  }
}
