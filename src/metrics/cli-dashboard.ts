#!/usr/bin/env tsx
/**
 * CLI Dashboard
 *
 * Displays metrics in a terminal-friendly format
 * - Player status
 * - Quality metrics
 * - Blocker alerts
 * - KPIs
 */

import chalk from 'chalk';
import {
  getLatestCoverage,
  getPRSizeStats,
  getBlockerFrequency,
  getPlayerUtilizationSummary,
  getAverageTaskTime,
  loadMetrics,
} from './collector.js';
import { loadPlayerStates, type PlayerStatus } from './dashboard-updater.js';

/**
 * Display dashboard in terminal
 */
export function displayDashboard(): void {
  console.clear();
  console.log(chalk.bold.blue('\n🎯 AI Development Dashboard\n'));
  console.log(chalk.gray(`Last Updated: ${new Date().toLocaleString()}`));
  console.log(chalk.gray('─'.repeat(60)));

  displayPlayerStatus();
  displayQualityMetrics();
  displayBlockerAlerts();
  displayKPIs();

  console.log(chalk.gray('\n─'.repeat(60)));
  console.log(chalk.dim('Press Ctrl+C to exit\n'));
}

/**
 * Display player status section
 */
function displayPlayerStatus(): void {
  console.log(chalk.bold.yellow('\n🎮 Player Status\n'));

  const playerStates = loadPlayerStates();

  for (const player of playerStates) {
    const statusEmoji = getStatusEmoji(player.status);
    const statusColor = getStatusColor(player.status);

    console.log(chalk.bold(`${statusEmoji} ${player.playerId}`));
    console.log(`   Status: ${statusColor(player.status)}`);

    if (player.currentTask) {
      console.log(`   Task: ${chalk.cyan(player.currentTask)}`);
    }

    if (player.blockerReason) {
      console.log(chalk.red(`   ⚠️  Blocker: ${player.blockerReason}`));
    }

    const utilization = getPlayerUtilizationSummary(player.playerId);
    if (utilization.totalTasksCompleted > 0) {
      console.log(`   Tasks: ${chalk.green(utilization.totalTasksCompleted)} completed`);
      console.log(
        `   Utilization: ${getUtilizationBar(utilization.utilizationRate)} ${(utilization.utilizationRate * 100).toFixed(1)}%`
      );
    }

    const avgTime = getAverageTaskTime(player.playerId);
    if (avgTime > 0) {
      console.log(`   Avg Time: ${chalk.cyan((avgTime / 1000 / 60).toFixed(1))} minutes`);
    }

    console.log('');
  }
}

/**
 * Display quality metrics section
 */
function displayQualityMetrics(): void {
  console.log(chalk.bold.yellow('📊 Quality Metrics\n'));

  // Coverage
  const coverage = getLatestCoverage();
  if (coverage) {
    console.log(chalk.bold('  Test Coverage'));
    console.log(`    Lines:      ${getCoverageBar(coverage.lines)} ${coverage.lines.toFixed(1)}%`);
    console.log(
      `    Statements: ${getCoverageBar(coverage.statements)} ${coverage.statements.toFixed(1)}%`
    );
    console.log(
      `    Functions:  ${getCoverageBar(coverage.functions)} ${coverage.functions.toFixed(1)}%`
    );
    console.log(
      `    Branches:   ${getCoverageBar(coverage.branches)} ${coverage.branches.toFixed(1)}%`
    );
    console.log('');
  } else {
    console.log(chalk.gray('  No coverage data available\n'));
  }

  // PR Size
  const prStats = getPRSizeStats();
  if (prStats.average > 0) {
    console.log(chalk.bold('  PR Size Trends'));
    console.log(`    Average: ${chalk.cyan(prStats.average.toFixed(0))} lines`);
    console.log(`    Median:  ${chalk.cyan(prStats.median)} lines`);
    console.log(`    Max:     ${chalk.cyan(prStats.max)} lines`);
    console.log(
      `    Over 200: ${prStats.overThreshold > 0 ? chalk.red(prStats.overThreshold) : chalk.green(0)}`
    );
    console.log('');
  } else {
    console.log(chalk.gray('  No PR data available\n'));
  }

  // Task completion time
  const avgTaskTime = getAverageTaskTime();
  if (avgTaskTime > 0) {
    console.log(chalk.bold('  Task Performance'));
    console.log(`    Avg Completion: ${chalk.cyan((avgTaskTime / 1000 / 60).toFixed(1))} minutes`);
    console.log('');
  }
}

/**
 * Display blocker alerts section
 */
function displayBlockerAlerts(): void {
  const blockerStats = getBlockerFrequency();

  if (blockerStats.total === 0) {
    return;
  }

  console.log(chalk.bold.yellow('🚨 Blocker Alerts\n'));
  console.log(`  Total Blockers:     ${chalk.cyan(blockerStats.total)}`);
  console.log(
    `  Unresolved:         ${blockerStats.unresolved > 0 ? chalk.red.bold(blockerStats.unresolved) : chalk.green(0)}`
  );
  console.log(
    `  Avg Resolution:     ${chalk.cyan((blockerStats.averageResolutionTime / 1000 / 60).toFixed(1))} minutes`
  );

  if (blockerStats.unresolved > 0) {
    console.log(chalk.red.bold('\n  ⚠️  Active Blockers:'));
    const metrics = loadMetrics();
    const unresolvedBlockers = metrics.blockers.filter((b) => !b.resolved);
    for (const blocker of unresolvedBlockers) {
      const elapsed = Date.now() - new Date(blocker.timestamp).getTime();
      console.log(
        chalk.red(
          `    • ${blocker.playerId}: ${blocker.reason} (${(elapsed / 1000 / 60).toFixed(0)}m ago)`
        )
      );
    }
  }

  console.log('');
}

/**
 * Display KPIs section
 */
function displayKPIs(): void {
  console.log(chalk.bold.yellow('🎯 KPIs\n'));

  const coverage = getLatestCoverage();
  const prStats = getPRSizeStats();
  const blockerStats = getBlockerFrequency();

  // Coverage KPI
  const coverageValue = coverage?.lines || 0;
  const coverageStatus = coverageValue >= 80;
  console.log(
    `  ${coverageStatus ? chalk.green('✅') : chalk.red('❌')} Test Coverage:     ${coverageValue.toFixed(1)}% (target: ≥ 80%)`
  );

  // PR Size KPI
  const prSizeValue = prStats.average;
  const prSizeStatus = prSizeValue < 200 || prSizeValue === 0;
  console.log(
    `  ${prSizeStatus ? chalk.green('✅') : chalk.yellow('⚠️ ')} Lines per PR:      ${prSizeValue.toFixed(0)} (target: < 200)`
  );

  // Blocker KPI
  const blockerStatus = blockerStats.unresolved === 0;
  console.log(
    `  ${blockerStatus ? chalk.green('✅') : chalk.yellow('⚠️ ')} Unresolved Blockers: ${blockerStats.unresolved} (target: 0)`
  );

  console.log('');
}

/**
 * Get status emoji for player status
 */
function getStatusEmoji(status: PlayerStatus): string {
  switch (status) {
    case 'idle':
      return '💤';
    case 'working':
      return '⚙️';
    case 'blocked':
      return '🚧';
  }
}

/**
 * Get color function for player status
 */
function getStatusColor(status: PlayerStatus): (text: string) => string {
  switch (status) {
    case 'idle':
      return chalk.gray;
    case 'working':
      return chalk.green;
    case 'blocked':
      return chalk.red;
  }
}

/**
 * Generate coverage progress bar
 */
function getCoverageBar(percentage: number): string {
  const barLength = 20;
  const filled = Math.round((percentage / 100) * barLength);
  const empty = barLength - filled;

  let color: (text: string) => string;
  if (percentage >= 80) {
    color = chalk.green;
  } else if (percentage >= 70) {
    color = chalk.yellow;
  } else {
    color = chalk.red;
  }

  return color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}

/**
 * Generate utilization progress bar
 */
function getUtilizationBar(rate: number): string {
  const barLength = 10;
  const filled = Math.round(rate * barLength);
  const empty = barLength - filled;

  let color: (text: string) => string;
  if (rate >= 0.7) {
    color = chalk.green;
  } else if (rate >= 0.5) {
    color = chalk.yellow;
  } else {
    color = chalk.red;
  }

  return color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}

/**
 * Main function - display dashboard once
 */
function main(): void {
  displayDashboard();
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
