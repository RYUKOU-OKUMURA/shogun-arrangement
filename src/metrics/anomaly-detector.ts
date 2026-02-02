#!/usr/bin/env tsx
/**
 * Anomaly Detector
 *
 * Detects anomalies in metrics:
 * - Coverage drops (>10% decrease)
 * - PR size increases (average >200 lines)
 * - Blocker spikes (>3 active blockers)
 * - Task completion rate drops (<80%)
 */

import chalk from 'chalk';
import { getCoverageTrend, getPRSizeStats, getBlockerFrequency, loadMetrics } from './collector.js';

export interface Anomaly {
  type: 'coverage_drop' | 'pr_size_increase' | 'blocker_spike' | 'completion_rate_drop';
  severity: 'high' | 'medium' | 'low';
  message: string;
  current: number;
  threshold: number;
  timestamp: string;
}

/**
 * Detect all anomalies
 */
export function detectAnomalies(): Anomaly[] {
  const anomalies: Anomaly[] = [];

  // Check for coverage drops
  const coverageAnomaly = detectCoverageDrop();
  if (coverageAnomaly) anomalies.push(coverageAnomaly);

  // Check for PR size increases
  const prSizeAnomaly = detectPRSizeIncrease();
  if (prSizeAnomaly) anomalies.push(prSizeAnomaly);

  // Check for blocker spikes
  const blockerAnomaly = detectBlockerSpike();
  if (blockerAnomaly) anomalies.push(blockerAnomaly);

  // Check for task completion rate drops
  const completionAnomaly = detectCompletionRateDrop();
  if (completionAnomaly) anomalies.push(completionAnomaly);

  return anomalies;
}

/**
 * Detect coverage drops
 */
function detectCoverageDrop(): Anomaly | null {
  const trend = getCoverageTrend(5);

  if (trend.length < 2) {
    return null;
  }

  const current = trend[trend.length - 1].lines;
  const previous = trend[trend.length - 2].lines;
  const drop = previous - current;

  // Alert if coverage drops by more than 10%
  if (drop > 10) {
    return {
      type: 'coverage_drop',
      severity: drop > 20 ? 'high' : drop > 15 ? 'medium' : 'low',
      message: `Test coverage dropped by ${drop.toFixed(1)}% (from ${previous.toFixed(1)}% to ${current.toFixed(1)}%)`,
      current,
      threshold: previous - 10,
      timestamp: new Date().toISOString(),
    };
  }

  // Alert if coverage is below 80%
  if (current < 80) {
    return {
      type: 'coverage_drop',
      severity: current < 70 ? 'high' : 'medium',
      message: `Test coverage is below target at ${current.toFixed(1)}%`,
      current,
      threshold: 80,
      timestamp: new Date().toISOString(),
    };
  }

  return null;
}

/**
 * Detect PR size increases
 */
function detectPRSizeIncrease(): Anomaly | null {
  const prStats = getPRSizeStats();

  if (prStats.average === 0) {
    return null;
  }

  // Alert if average PR size is over 200 lines
  if (prStats.average > 200) {
    return {
      type: 'pr_size_increase',
      severity: prStats.average > 300 ? 'high' : 'medium',
      message: `Average PR size is ${prStats.average.toFixed(0)} lines (threshold: 200)`,
      current: prStats.average,
      threshold: 200,
      timestamp: new Date().toISOString(),
    };
  }

  // Alert if many PRs are over threshold
  if (prStats.overThreshold > 3) {
    return {
      type: 'pr_size_increase',
      severity: 'medium',
      message: `${prStats.overThreshold} PRs are over 200 lines`,
      current: prStats.overThreshold,
      threshold: 3,
      timestamp: new Date().toISOString(),
    };
  }

  return null;
}

/**
 * Detect blocker spikes
 */
function detectBlockerSpike(): Anomaly | null {
  const blockerStats = getBlockerFrequency();

  // Alert if more than 3 unresolved blockers
  if (blockerStats.unresolved > 3) {
    return {
      type: 'blocker_spike',
      severity: blockerStats.unresolved > 5 ? 'high' : 'medium',
      message: `${blockerStats.unresolved} unresolved blockers detected`,
      current: blockerStats.unresolved,
      threshold: 3,
      timestamp: new Date().toISOString(),
    };
  }

  // Alert if resolution time is too long (>2 hours)
  const resolutionHours = blockerStats.averageResolutionTime / 1000 / 60 / 60;
  if (resolutionHours > 2 && blockerStats.total > 0) {
    return {
      type: 'blocker_spike',
      severity: resolutionHours > 4 ? 'high' : 'medium',
      message: `Average blocker resolution time is ${resolutionHours.toFixed(1)} hours`,
      current: resolutionHours,
      threshold: 2,
      timestamp: new Date().toISOString(),
    };
  }

  return null;
}

/**
 * Detect task completion rate drops
 */
function detectCompletionRateDrop(): Anomaly | null {
  const metrics = loadMetrics();

  // Look at last 10 tasks
  const recentTasks = metrics.tasks.slice(-10);

  if (recentTasks.length === 0) {
    return null;
  }

  const completed = recentTasks.filter((t) => t.status === 'completed').length;
  const completionRate = (completed / recentTasks.length) * 100;

  // Alert if completion rate is below 80%
  if (completionRate < 80) {
    return {
      type: 'completion_rate_drop',
      severity: completionRate < 60 ? 'high' : completionRate < 70 ? 'medium' : 'low',
      message: `Task completion rate is ${completionRate.toFixed(1)}% (last ${recentTasks.length} tasks)`,
      current: completionRate,
      threshold: 80,
      timestamp: new Date().toISOString(),
    };
  }

  return null;
}

/**
 * Display anomalies in terminal
 */
export function displayAnomalies(anomalies: Anomaly[]): void {
  if (anomalies.length === 0) {
    console.log(chalk.green('\n✅ No anomalies detected\n'));
    return;
  }

  console.log(chalk.yellow.bold('\n⚠️  Anomalies Detected\n'));

  const grouped = {
    high: anomalies.filter((a) => a.severity === 'high'),
    medium: anomalies.filter((a) => a.severity === 'medium'),
    low: anomalies.filter((a) => a.severity === 'low'),
  };

  for (const severity of ['high', 'medium', 'low'] as const) {
    const items = grouped[severity];
    if (items.length === 0) continue;

    const color =
      severity === 'high' ? chalk.red : severity === 'medium' ? chalk.yellow : chalk.blue;
    console.log(color.bold(`${severity.toUpperCase()} Severity (${items.length}):`));

    for (const anomaly of items) {
      console.log(color(`  • ${anomaly.message}`));
      console.log(
        color.dim(`    Current: ${anomaly.current.toFixed(1)}, Threshold: ${anomaly.threshold}`)
      );
    }
    console.log('');
  }
}

/**
 * Get anomaly recommendations
 */
export function getRecommendations(anomalies: Anomaly[]): string[] {
  const recommendations: string[] = [];

  for (const anomaly of anomalies) {
    switch (anomaly.type) {
      case 'coverage_drop':
        recommendations.push('📊 Add more unit tests to increase coverage');
        recommendations.push('🔍 Review untested code paths and edge cases');
        break;
      case 'pr_size_increase':
        recommendations.push('✂️ Break down large PRs into smaller, focused changes');
        recommendations.push('🎯 Follow the Single Responsibility Principle');
        break;
      case 'blocker_spike':
        recommendations.push('🚨 Prioritize resolving active blockers');
        recommendations.push('👥 Consider pair programming for blocked tasks');
        break;
      case 'completion_rate_drop':
        recommendations.push('🔄 Review task complexity and estimation');
        recommendations.push('💡 Provide clearer task requirements');
        break;
    }
  }

  // Remove duplicates
  return [...new Set(recommendations)];
}

/**
 * Main function
 */
function main(): void {
  console.log(chalk.blue('🔍 Running anomaly detection...\n'));

  const anomalies = detectAnomalies();
  displayAnomalies(anomalies);

  if (anomalies.length > 0) {
    console.log(chalk.yellow('💡 Recommendations:\n'));
    const recommendations = getRecommendations(anomalies);
    recommendations.forEach((rec) => console.log(chalk.gray(`  ${rec}`)));
    console.log('');

    const highSeverity = anomalies.filter((a) => a.severity === 'high');
    if (highSeverity.length > 0) {
      console.log(
        chalk.red.bold(`\n❌ ${highSeverity.length} high severity anomaly/anomalies detected`)
      );
      process.exit(1);
    } else {
      console.log(chalk.yellow.bold('\n⚠️  Anomalies detected (non-critical)'));
      process.exit(0);
    }
  } else {
    console.log(chalk.green.bold('✅ All metrics are within normal ranges'));
    process.exit(0);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
