#!/usr/bin/env tsx
/**
 * Metrics Report Generator
 *
 * Generates weekly and monthly reports with:
 * - Task completion statistics
 * - Coverage trends
 * - PR size analysis
 * - Blocker analysis
 * - Player utilization
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import {
  loadMetrics,
  getCoverageTrend,
  getPRSizeStats,
  getBlockerFrequency,
  getPlayerUtilizationSummary,
  getAverageTaskTime,
  type CoverageMetric,
} from './collector.js';

export type ReportPeriod = 'weekly' | 'monthly';

interface ReportData {
  period: ReportPeriod;
  startDate: Date;
  endDate: Date;
  tasks: {
    total: number;
    completed: number;
    failed: number;
    blocked: number;
    averageTime: number;
  };
  coverage: {
    trend: CoverageMetric[];
    current: number;
    change: number;
  };
  prSizes: {
    average: number;
    median: number;
    max: number;
    overThreshold: number;
  };
  blockers: {
    total: number;
    unresolved: number;
    averageResolutionTime: number;
  };
  players: {
    [playerId: string]: {
      tasksCompleted: number;
      utilizationRate: number;
      averageTaskTime: number;
    };
  };
}

const REPORTS_DIR = join(process.cwd(), 'reports');

/**
 * Ensure reports directory exists
 */
function ensureReportsDir(): void {
  if (!existsSync(REPORTS_DIR)) {
    mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

/**
 * Generate report for a given period
 */
export function generateReport(period: ReportPeriod = 'weekly'): void {
  const { startDate, endDate } = getDateRange(period);
  const reportData = collectReportData(period, startDate, endDate);

  const markdown = generateMarkdownReport(reportData);
  const filename = `${period}-${startDate.toISOString().split('T')[0]}.md`;

  ensureReportsDir();
  const filepath = join(REPORTS_DIR, filename);
  writeFileSync(filepath, markdown, 'utf-8');

  console.log(chalk.green(`✅ Report generated: ${filepath}`));
}

/**
 * Get date range for report period
 */
function getDateRange(period: ReportPeriod): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();

  if (period === 'weekly') {
    startDate.setDate(endDate.getDate() - 7);
  } else {
    startDate.setMonth(endDate.getMonth() - 1);
  }

  return { startDate, endDate };
}

/**
 * Collect data for report
 */
function collectReportData(period: ReportPeriod, startDate: Date, endDate: Date): ReportData {
  const metrics = loadMetrics();

  // Filter tasks by date range
  const tasksInRange = metrics.tasks.filter((task) => {
    const taskDate = new Date(task.startTime);
    return taskDate >= startDate && taskDate <= endDate;
  });

  const completed = tasksInRange.filter((t) => t.status === 'completed');
  const failed = tasksInRange.filter((t) => t.status === 'failed');
  const blocked = tasksInRange.filter((t) => t.status === 'blocked');

  const averageTime =
    completed.length > 0
      ? completed.reduce((sum, t) => sum + t.durationMs, 0) / completed.length
      : 0;

  // Coverage trend
  const coverageTrend = getCoverageTrend(10);
  const currentCoverage =
    coverageTrend.length > 0 ? coverageTrend[coverageTrend.length - 1].lines : 0;
  const previousCoverage = coverageTrend.length > 1 ? coverageTrend[0].lines : currentCoverage;
  const coverageChange = currentCoverage - previousCoverage;

  // PR sizes
  const prSizes = getPRSizeStats();

  // Blockers
  const blockers = getBlockerFrequency();

  // Player statistics
  const playerIds = ['player1', 'player2', 'player3'];
  const players: ReportData['players'] = {};

  for (const playerId of playerIds) {
    const playerTasks = completed.filter((t) => t.playerId === playerId);
    const utilization = getPlayerUtilizationSummary(playerId);
    const avgTaskTime = getAverageTaskTime(playerId);

    players[playerId] = {
      tasksCompleted: playerTasks.length,
      utilizationRate: utilization.utilizationRate,
      averageTaskTime: avgTaskTime,
    };
  }

  return {
    period,
    startDate,
    endDate,
    tasks: {
      total: tasksInRange.length,
      completed: completed.length,
      failed: failed.length,
      blocked: blocked.length,
      averageTime,
    },
    coverage: {
      trend: coverageTrend,
      current: currentCoverage,
      change: coverageChange,
    },
    prSizes,
    blockers,
    players,
  };
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(data: ReportData): string {
  const periodTitle = data.period === 'weekly' ? 'Weekly' : 'Monthly';
  const dateRange = `${data.startDate.toLocaleDateString()} - ${data.endDate.toLocaleDateString()}`;

  let md = `# ${periodTitle} Metrics Report\n\n`;
  md += `**Period**: ${dateRange}\n`;
  md += `**Generated**: ${new Date().toLocaleString()}\n\n`;
  md += `---\n\n`;

  // Executive Summary
  md += `## 📊 Executive Summary\n\n`;
  md += `- **Total Tasks**: ${data.tasks.total}\n`;
  md += `- **Completed**: ${data.tasks.completed} (${((data.tasks.completed / data.tasks.total) * 100).toFixed(1)}%)\n`;
  md += `- **Failed**: ${data.tasks.failed}\n`;
  md += `- **Blocked**: ${data.tasks.blocked}\n`;
  md += `- **Average Task Time**: ${(data.tasks.averageTime / 1000 / 60).toFixed(1)} minutes\n\n`;

  // Task Performance
  md += `---\n\n`;
  md += `## ⏱️ Task Performance\n\n`;
  md += `### Completion Rate\n\n`;
  const completionRate = data.tasks.total > 0 ? (data.tasks.completed / data.tasks.total) * 100 : 0;
  md += `${getProgressBar(completionRate)} ${completionRate.toFixed(1)}%\n\n`;

  md += `### Status Breakdown\n\n`;
  md += `| Status | Count | Percentage |\n`;
  md += `|--------|-------|------------|\n`;
  md += `| ✅ Completed | ${data.tasks.completed} | ${((data.tasks.completed / data.tasks.total) * 100).toFixed(1)}% |\n`;
  md += `| ❌ Failed | ${data.tasks.failed} | ${((data.tasks.failed / data.tasks.total) * 100).toFixed(1)}% |\n`;
  md += `| 🚧 Blocked | ${data.tasks.blocked} | ${((data.tasks.blocked / data.tasks.total) * 100).toFixed(1)}% |\n\n`;

  // Coverage Trends
  md += `---\n\n`;
  md += `## 🎯 Test Coverage Trends\n\n`;
  md += `- **Current Coverage**: ${data.coverage.current.toFixed(1)}%\n`;
  md += `- **Change**: ${data.coverage.change >= 0 ? '+' : ''}${data.coverage.change.toFixed(1)}%\n`;
  md += `- **Status**: ${data.coverage.current >= 80 ? '✅ Meets target' : '⚠️ Below target'}\n\n`;

  if (data.coverage.trend.length > 0) {
    md += `### Coverage History\n\n`;
    md += `| Date | Lines | Statements | Functions | Branches |\n`;
    md += `|------|-------|------------|-----------|----------|\n`;
    for (const entry of data.coverage.trend.slice(-5)) {
      const date = new Date(entry.timestamp).toLocaleDateString();
      md += `| ${date} | ${entry.lines.toFixed(1)}% | ${entry.statements.toFixed(1)}% | ${entry.functions.toFixed(1)}% | ${entry.branches.toFixed(1)}% |\n`;
    }
    md += `\n`;
  }

  // PR Size Analysis
  md += `---\n\n`;
  md += `## 📝 PR Size Analysis\n\n`;
  md += `- **Average Size**: ${data.prSizes.average.toFixed(0)} lines\n`;
  md += `- **Median Size**: ${data.prSizes.median} lines\n`;
  md += `- **Largest PR**: ${data.prSizes.max} lines\n`;
  md += `- **Over Threshold (>200)**: ${data.prSizes.overThreshold}\n`;
  md += `- **Status**: ${data.prSizes.average < 200 ? '✅ Within recommended' : '⚠️ Above recommended'}\n\n`;

  // Blocker Analysis
  md += `---\n\n`;
  md += `## 🚨 Blocker Analysis\n\n`;
  md += `- **Total Blockers**: ${data.blockers.total}\n`;
  md += `- **Unresolved**: ${data.blockers.unresolved}\n`;
  md += `- **Average Resolution Time**: ${(data.blockers.averageResolutionTime / 1000 / 60).toFixed(1)} minutes\n`;
  md += `- **Status**: ${data.blockers.unresolved === 0 ? '✅ All resolved' : '⚠️ Active blockers'}\n\n`;

  // Player Performance
  md += `---\n\n`;
  md += `## 👥 Player Performance\n\n`;
  md += `| Player | Tasks | Utilization | Avg Time |\n`;
  md += `|--------|-------|-------------|----------|\n`;

  for (const [playerId, stats] of Object.entries(data.players)) {
    const avgMinutes = (stats.averageTaskTime / 1000 / 60).toFixed(1);
    md += `| ${playerId} | ${stats.tasksCompleted} | ${(stats.utilizationRate * 100).toFixed(1)}% | ${avgMinutes}m |\n`;
  }
  md += `\n`;

  // KPIs
  md += `---\n\n`;
  md += `## 🎯 KPIs Status\n\n`;
  md += `| Metric | Target | Current | Status |\n`;
  md += `|--------|--------|---------|--------|\n`;
  md += `| Test Coverage | ≥ 80% | ${data.coverage.current.toFixed(1)}% | ${data.coverage.current >= 80 ? '✅' : '❌'} |\n`;
  md += `| Lines per PR | < 200 | ${data.prSizes.average.toFixed(0)} | ${data.prSizes.average < 200 ? '✅' : '⚠️'} |\n`;
  md += `| Task Completion | ≥ 95% | ${completionRate.toFixed(1)}% | ${completionRate >= 95 ? '✅' : '⚠️'} |\n`;
  md += `| Unresolved Blockers | 0 | ${data.blockers.unresolved} | ${data.blockers.unresolved === 0 ? '✅' : '⚠️'} |\n\n`;

  // Recommendations
  md += `---\n\n`;
  md += `## 💡 Recommendations\n\n`;

  const recommendations: string[] = [];

  if (data.coverage.current < 80) {
    recommendations.push('- 🎯 **Improve test coverage**: Current coverage is below 80% target');
  }

  if (data.prSizes.average > 200) {
    recommendations.push(
      '- 📝 **Reduce PR size**: Consider breaking down large changes into smaller PRs'
    );
  }

  if (data.blockers.unresolved > 0) {
    recommendations.push(
      `- 🚨 **Resolve blockers**: ${data.blockers.unresolved} active blocker(s) need attention`
    );
  }

  if (completionRate < 95) {
    recommendations.push(
      '- ⚠️ **Improve task completion rate**: Focus on reducing failed/blocked tasks'
    );
  }

  const lowUtilizationPlayers = Object.entries(data.players).filter(
    ([_, stats]) => stats.utilizationRate < 0.5
  );
  if (lowUtilizationPlayers.length > 0) {
    recommendations.push(
      `- 👥 **Optimize player utilization**: ${lowUtilizationPlayers.map(([id]) => id).join(', ')} have low utilization`
    );
  }

  if (recommendations.length === 0) {
    md += `✅ All metrics are within target ranges. Keep up the good work!\n\n`;
  } else {
    md += recommendations.join('\n') + '\n\n';
  }

  md += `---\n\n`;
  md += `*Report auto-generated by Shogun Arrangement system*\n`;

  return md;
}

/**
 * Generate progress bar for markdown
 */
function getProgressBar(percentage: number): string {
  const barLength = 20;
  const filled = Math.round((percentage / 100) * barLength);
  const empty = barLength - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Main function
 */
function main(): void {
  const args = process.argv.slice(2);
  const period = (args[0] as ReportPeriod) || 'weekly';

  if (period !== 'weekly' && period !== 'monthly') {
    console.error(chalk.red('Invalid period. Use "weekly" or "monthly"'));
    process.exit(1);
  }

  console.log(chalk.blue(`\n📊 Generating ${period} report...\n`));
  generateReport(period);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
