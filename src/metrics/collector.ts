/**
 * Metrics Collector
 *
 * Collects and stores various metrics for data-driven development process improvement:
 * - Task completion time tracking
 * - Test coverage history (time series)
 * - PR size trends
 * - Blocker frequency analysis
 * - Player utilization rate
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Metric data structures
export interface TaskMetric {
  taskId: string;
  playerId: string;
  startTime: string;
  endTime: string;
  durationMs: number;
  status: 'completed' | 'failed' | 'blocked';
  blockerReason?: string;
}

export interface CoverageMetric {
  timestamp: string;
  lines: number;
  statements: number;
  functions: number;
  branches: number;
}

export interface PRSizeMetric {
  timestamp: string;
  prNumber?: number;
  additions: number;
  deletions: number;
  total: number;
  filesChanged: number;
}

export interface BlockerMetric {
  timestamp: string;
  playerId: string;
  reason: string;
  resolved: boolean;
  resolutionTime?: number;
}

export interface PlayerUtilization {
  playerId: string;
  period: string; // ISO date string (day)
  idleTime: number;
  workingTime: number;
  blockedTime: number;
  tasksCompleted: number;
}

export interface MetricsData {
  tasks: TaskMetric[];
  coverage: CoverageMetric[];
  prSizes: PRSizeMetric[];
  blockers: BlockerMetric[];
  playerUtilization: PlayerUtilization[];
}

const METRICS_DIR = join(process.cwd(), 'metrics');
const METRICS_FILE = join(METRICS_DIR, 'data.json');

/**
 * Ensure metrics directory exists
 */
function ensureMetricsDir(): void {
  if (!existsSync(METRICS_DIR)) {
    mkdirSync(METRICS_DIR, { recursive: true });
  }
}

/**
 * Load metrics from file
 */
export function loadMetrics(): MetricsData {
  ensureMetricsDir();

  if (!existsSync(METRICS_FILE)) {
    return {
      tasks: [],
      coverage: [],
      prSizes: [],
      blockers: [],
      playerUtilization: [],
    };
  }

  try {
    const data = readFileSync(METRICS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {
      tasks: [],
      coverage: [],
      prSizes: [],
      blockers: [],
      playerUtilization: [],
    };
  }
}

/**
 * Save metrics to file
 */
export function saveMetrics(metrics: MetricsData): void {
  ensureMetricsDir();
  writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2), 'utf-8');
}

/**
 * Record a task completion
 */
export function recordTaskCompletion(
  taskId: string,
  playerId: string,
  startTime: Date,
  endTime: Date,
  status: 'completed' | 'failed' | 'blocked',
  blockerReason?: string
): void {
  const metrics = loadMetrics();

  const taskMetric: TaskMetric = {
    taskId,
    playerId,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    durationMs: endTime.getTime() - startTime.getTime(),
    status,
    blockerReason,
  };

  metrics.tasks.push(taskMetric);
  saveMetrics(metrics);
}

/**
 * Record coverage data
 */
export function recordCoverage(
  lines: number,
  statements: number,
  functions: number,
  branches: number
): void {
  const metrics = loadMetrics();

  const coverageMetric: CoverageMetric = {
    timestamp: new Date().toISOString(),
    lines,
    statements,
    functions,
    branches,
  };

  metrics.coverage.push(coverageMetric);
  saveMetrics(metrics);
}

/**
 * Record PR size data
 */
export function recordPRSize(
  additions: number,
  deletions: number,
  filesChanged: number,
  prNumber?: number
): void {
  const metrics = loadMetrics();

  const prSizeMetric: PRSizeMetric = {
    timestamp: new Date().toISOString(),
    prNumber,
    additions,
    deletions,
    total: additions + deletions,
    filesChanged,
  };

  metrics.prSizes.push(prSizeMetric);
  saveMetrics(metrics);
}

/**
 * Record a blocker
 */
export function recordBlocker(playerId: string, reason: string): void {
  const metrics = loadMetrics();

  const blockerMetric: BlockerMetric = {
    timestamp: new Date().toISOString(),
    playerId,
    reason,
    resolved: false,
  };

  metrics.blockers.push(blockerMetric);
  saveMetrics(metrics);
}

/**
 * Resolve a blocker
 */
export function resolveBlocker(playerId: string, blockerTimestamp: string): void {
  const metrics = loadMetrics();

  const blocker = metrics.blockers.find(
    (b) => b.playerId === playerId && b.timestamp === blockerTimestamp && !b.resolved
  );

  if (blocker) {
    blocker.resolved = true;
    const resolutionTime = new Date().getTime() - new Date(blocker.timestamp).getTime();
    blocker.resolutionTime = resolutionTime;
    saveMetrics(metrics);
  }
}

/**
 * Record player utilization for a period
 */
export function recordPlayerUtilization(
  playerId: string,
  period: string,
  idleTime: number,
  workingTime: number,
  blockedTime: number,
  tasksCompleted: number
): void {
  const metrics = loadMetrics();

  // Check if utilization for this player and period already exists
  const existingIndex = metrics.playerUtilization.findIndex(
    (u) => u.playerId === playerId && u.period === period
  );

  const utilization: PlayerUtilization = {
    playerId,
    period,
    idleTime,
    workingTime,
    blockedTime,
    tasksCompleted,
  };

  if (existingIndex >= 0) {
    metrics.playerUtilization[existingIndex] = utilization;
  } else {
    metrics.playerUtilization.push(utilization);
  }

  saveMetrics(metrics);
}

/**
 * Get average task completion time
 */
export function getAverageTaskTime(playerId?: string): number {
  const metrics = loadMetrics();
  let tasks = metrics.tasks.filter((t) => t.status === 'completed');

  if (playerId) {
    tasks = tasks.filter((t) => t.playerId === playerId);
  }

  if (tasks.length === 0) return 0;

  const totalTime = tasks.reduce((sum, task) => sum + task.durationMs, 0);
  return totalTime / tasks.length;
}

/**
 * Get latest coverage
 */
export function getLatestCoverage(): CoverageMetric | null {
  const metrics = loadMetrics();
  if (metrics.coverage.length === 0) return null;
  return metrics.coverage[metrics.coverage.length - 1];
}

/**
 * Get coverage trend (last N entries)
 */
export function getCoverageTrend(count: number = 10): CoverageMetric[] {
  const metrics = loadMetrics();
  return metrics.coverage.slice(-count);
}

/**
 * Get PR size statistics
 */
export function getPRSizeStats(): {
  average: number;
  median: number;
  max: number;
  overThreshold: number;
} {
  const metrics = loadMetrics();
  const sizes = metrics.prSizes.map((pr) => pr.total);

  if (sizes.length === 0) {
    return { average: 0, median: 0, max: 0, overThreshold: 0 };
  }

  const average = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
  const sorted = [...sizes].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const max = Math.max(...sizes);
  const overThreshold = metrics.prSizes.filter((pr) => pr.total > 200).length;

  return { average, median, max, overThreshold };
}

/**
 * Get blocker frequency
 */
export function getBlockerFrequency(): {
  total: number;
  unresolved: number;
  averageResolutionTime: number;
} {
  const metrics = loadMetrics();
  const total = metrics.blockers.length;
  const unresolved = metrics.blockers.filter((b) => !b.resolved).length;

  const resolvedBlockers = metrics.blockers.filter((b) => b.resolved && b.resolutionTime);
  const averageResolutionTime =
    resolvedBlockers.length > 0
      ? resolvedBlockers.reduce((sum, b) => sum + (b.resolutionTime || 0), 0) /
        resolvedBlockers.length
      : 0;

  return { total, unresolved, averageResolutionTime };
}

/**
 * Get player utilization summary
 */
export function getPlayerUtilizationSummary(playerId?: string): {
  totalIdleTime: number;
  totalWorkingTime: number;
  totalBlockedTime: number;
  totalTasksCompleted: number;
  utilizationRate: number;
} {
  const metrics = loadMetrics();
  let utilizations = metrics.playerUtilization;

  if (playerId) {
    utilizations = utilizations.filter((u) => u.playerId === playerId);
  }

  const totalIdleTime = utilizations.reduce((sum, u) => sum + u.idleTime, 0);
  const totalWorkingTime = utilizations.reduce((sum, u) => sum + u.workingTime, 0);
  const totalBlockedTime = utilizations.reduce((sum, u) => sum + u.blockedTime, 0);
  const totalTasksCompleted = utilizations.reduce((sum, u) => sum + u.tasksCompleted, 0);

  const totalTime = totalIdleTime + totalWorkingTime + totalBlockedTime;
  const utilizationRate = totalTime > 0 ? totalWorkingTime / totalTime : 0;

  return {
    totalIdleTime,
    totalWorkingTime,
    totalBlockedTime,
    totalTasksCompleted,
    utilizationRate,
  };
}
