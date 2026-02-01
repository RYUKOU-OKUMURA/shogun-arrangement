/**
 * Common types for shogun-arrangement
 */

export type TaskType = 'feature' | 'fix' | 'refactor' | 'docs' | 'test'

export type CommandStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

export type TaskStatus = 'assigned' | 'in_progress' | 'completed' | 'done' | 'failed' | 'blocked'

export type PlayerId = 'player1' | 'player2' | 'player3' | 'player4' | 'player5'

export interface QualityGates {
  lint?: boolean
  typecheck?: boolean
  test_coverage?: number
  max_lines?: number
  comprehensive?: boolean
  sources_cited?: boolean
}

export interface Dependencies {
  install?: string
  depends_on?: string | null
}

export interface Subtask {
  id: string
  description: string
  assigned_to: string
  goal: string
  type: TaskType
  context?: string
  output_location?: string
  output_format?: string
  output_filename?: string
  depends_on?: string | null
  quality_gates?: QualityGates
}

export interface Command {
  command: {
    id: string
    timestamp: string
    description: string
    type: TaskType
    status: CommandStatus
    small_pr: boolean
    tdd_required: boolean
    subtasks: Subtask[]
  }
}

export interface Task {
  task: {
    id: string
    parent_id: string | null
    description: string
    goal: string
    type: TaskType
    status: TaskStatus
    timestamp: string
    completed_at?: string
    context?: string
    output_location?: string
    output_format?: string
    output_filename?: string
    quality_gates?: QualityGates
    dependencies?: Dependencies
  }
}

export interface QualityMetrics {
  test_coverage?: number
  lines_of_code?: number
  lint_passed?: boolean
  typecheck_passed?: boolean
  tests_passed?: boolean
}

export interface Report {
  player_id: string
  task_id: string
  status: 'completed' | 'failed' | 'blocked'
  timestamp: string
  report_location?: string
  quality_metrics?: QualityMetrics
  blockers?: string[]
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
