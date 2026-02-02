/**
 * Dashboard Updater
 *
 * Updates dashboard.md in real-time with:
 * - Player status (idle/working/blocked)
 * - Quality metrics (coverage, PR size, flaky tests)
 * - Blocker alerts
 */

import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  getLatestCoverage,
  getPRSizeStats,
  getBlockerFrequency,
  getPlayerUtilizationSummary,
  loadMetrics,
} from './collector.js';

export type PlayerStatus = 'idle' | 'working' | 'blocked';

export interface PlayerState {
  playerId: string;
  status: PlayerStatus;
  currentTask?: string;
  blockerReason?: string;
}

export interface QualityMetrics {
  coverage: {
    lines: number;
    statements: number;
    functions: number;
    branches: number;
  };
  prSize: {
    average: number;
    overThreshold: number;
  };
  flakyTests: number;
}

const DASHBOARD_PATH = join(process.cwd(), 'dashboard.md');

/**
 * Update dashboard with current state
 */
export function updateDashboard(playerStates: PlayerState[], qualityMetrics: QualityMetrics): void {
  const content = generateDashboardContent(playerStates, qualityMetrics);
  writeFileSync(DASHBOARD_PATH, content, 'utf-8');
}

/**
 * Generate dashboard markdown content
 */
function generateDashboardContent(
  playerStates: PlayerState[],
  qualityMetrics: QualityMetrics
): string {
  const timestamp = new Date().toISOString();
  const blockerStats = getBlockerFrequency();

  let content = `# AI Development Dashboard\n\n`;
  content += `**Last Updated**: ${timestamp}\n\n`;
  content += `---\n\n`;

  // Player Status Section
  content += `## 🎮 Player Status\n\n`;
  for (const player of playerStates) {
    const statusEmoji = getStatusEmoji(player.status);
    content += `### ${player.playerId} ${statusEmoji}\n`;
    content += `- **Status**: ${player.status}\n`;
    if (player.currentTask) {
      content += `- **Current Task**: ${player.currentTask}\n`;
    }
    if (player.blockerReason) {
      content += `- **⚠️ Blocker**: ${player.blockerReason}\n`;
    }

    // Add utilization summary
    const utilization = getPlayerUtilizationSummary(player.playerId);
    if (utilization.totalTasksCompleted > 0) {
      content += `- **Tasks Completed**: ${utilization.totalTasksCompleted}\n`;
      content += `- **Utilization Rate**: ${(utilization.utilizationRate * 100).toFixed(1)}%\n`;
    }
    content += `\n`;
  }

  // Quality Metrics Section
  content += `---\n\n`;
  content += `## 📊 Quality Metrics\n\n`;

  // Coverage
  content += `### Test Coverage\n`;
  content += `- **Lines**: ${qualityMetrics.coverage.lines.toFixed(1)}%\n`;
  content += `- **Statements**: ${qualityMetrics.coverage.statements.toFixed(1)}%\n`;
  content += `- **Functions**: ${qualityMetrics.coverage.functions.toFixed(1)}%\n`;
  content += `- **Branches**: ${qualityMetrics.coverage.branches.toFixed(1)}%\n\n`;

  const coverageStatus = getCoverageStatus(qualityMetrics.coverage.lines);
  content += `**Status**: ${coverageStatus}\n\n`;

  // PR Size
  content += `### PR Size Trends\n`;
  content += `- **Average Size**: ${qualityMetrics.prSize.average.toFixed(0)} lines\n`;
  content += `- **Over Threshold (>200)**: ${qualityMetrics.prSize.overThreshold}\n\n`;

  const prSizeStatus = getPRSizeStatus(qualityMetrics.prSize.average);
  content += `**Status**: ${prSizeStatus}\n\n`;

  // Flaky Tests
  content += `### Flaky Tests\n`;
  content += `- **Count**: ${qualityMetrics.flakyTests}\n\n`;

  const flakyStatus = getFlakyTestStatus(qualityMetrics.flakyTests);
  content += `**Status**: ${flakyStatus}\n\n`;

  // Blocker Alerts Section
  if (blockerStats.unresolved > 0) {
    content += `---\n\n`;
    content += `## 🚨 Blocker Alerts\n\n`;
    content += `- **Total Blockers**: ${blockerStats.total}\n`;
    content += `- **⚠️ Unresolved**: ${blockerStats.unresolved}\n`;
    content += `- **Average Resolution Time**: ${(blockerStats.averageResolutionTime / 1000 / 60).toFixed(1)} minutes\n\n`;

    // List unresolved blockers
    const metrics = loadMetrics();
    const unresolvedBlockers = metrics.blockers.filter((b) => !b.resolved);
    if (unresolvedBlockers.length > 0) {
      content += `### Unresolved Blockers\n\n`;
      for (const blocker of unresolvedBlockers) {
        const elapsed = Date.now() - new Date(blocker.timestamp).getTime();
        content += `- **${blocker.playerId}**: ${blocker.reason} (${(elapsed / 1000 / 60).toFixed(0)} minutes ago)\n`;
      }
      content += `\n`;
    }
  }

  // KPIs Section
  content += `---\n\n`;
  content += `## 🎯 KPIs\n\n`;
  content += `| Metric | Target | Current | Status |\n`;
  content += `|--------|--------|---------|--------|\n`;
  content += `| Test Coverage | ≥ 80% | ${qualityMetrics.coverage.lines.toFixed(1)}% | ${qualityMetrics.coverage.lines >= 80 ? '✅' : '❌'} |\n`;
  content += `| Lines per PR | < 200 | ${qualityMetrics.prSize.average.toFixed(0)} | ${qualityMetrics.prSize.average < 200 ? '✅' : '⚠️'} |\n`;
  content += `| Flaky Test Rate | < 1% | ${qualityMetrics.flakyTests} | ${qualityMetrics.flakyTests === 0 ? '✅' : '⚠️'} |\n`;
  content += `| Unresolved Blockers | 0 | ${blockerStats.unresolved} | ${blockerStats.unresolved === 0 ? '✅' : '⚠️'} |\n\n`;

  content += `---\n\n`;
  content += `*Dashboard auto-generated by Shogun Arrangement system*\n`;

  return content;
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
 * Get coverage status message
 */
function getCoverageStatus(coverage: number): string {
  if (coverage >= 80) {
    return '✅ Meets target (≥ 80%)';
  } else if (coverage >= 70) {
    return '⚠️ Below target (70-80%)';
  } else {
    return '❌ Critical - Below 70%';
  }
}

/**
 * Get PR size status message
 */
function getPRSizeStatus(average: number): string {
  if (average < 200) {
    return '✅ Within recommended size';
  } else if (average < 300) {
    return '⚠️ Above recommended (200-300 lines)';
  } else {
    return '❌ Too large - Consider smaller PRs';
  }
}

/**
 * Get flaky test status message
 */
function getFlakyTestStatus(count: number): string {
  if (count === 0) {
    return '✅ No flaky tests detected';
  } else if (count <= 2) {
    return '⚠️ Some flaky tests detected';
  } else {
    return '❌ High number of flaky tests';
  }
}

/**
 * Load player states from file
 */
export function loadPlayerStates(): PlayerState[] {
  const statesFile = join(process.cwd(), 'metrics', 'player-states.json');

  if (!existsSync(statesFile)) {
    return [
      { playerId: 'player1', status: 'idle' },
      { playerId: 'player2', status: 'idle' },
      { playerId: 'player3', status: 'idle' },
    ];
  }

  try {
    const data = readFileSync(statesFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [
      { playerId: 'player1', status: 'idle' },
      { playerId: 'player2', status: 'idle' },
      { playerId: 'player3', status: 'idle' },
    ];
  }
}

/**
 * Save player states to file
 */
export function savePlayerStates(states: PlayerState[]): void {
  const statesFile = join(process.cwd(), 'metrics', 'player-states.json');
  writeFileSync(statesFile, JSON.stringify(states, null, 2), 'utf-8');
}

/**
 * Update a specific player's state
 */
export function updatePlayerState(
  playerId: string,
  status: PlayerStatus,
  currentTask?: string,
  blockerReason?: string
): void {
  const states = loadPlayerStates();
  const index = states.findIndex((s) => s.playerId === playerId);

  const newState: PlayerState = {
    playerId,
    status,
    currentTask,
    blockerReason,
  };

  if (index >= 0) {
    states[index] = newState;
  } else {
    states.push(newState);
  }

  savePlayerStates(states);

  // Update dashboard with new state
  const qualityMetrics = getCurrentQualityMetrics();
  updateDashboard(states, qualityMetrics);
}

/**
 * Get current quality metrics
 */
export function getCurrentQualityMetrics(): QualityMetrics {
  const latestCoverage = getLatestCoverage();
  const prSizeStats = getPRSizeStats();

  return {
    coverage: {
      lines: latestCoverage?.lines || 0,
      statements: latestCoverage?.statements || 0,
      functions: latestCoverage?.functions || 0,
      branches: latestCoverage?.branches || 0,
    },
    prSize: {
      average: prSizeStats.average,
      overThreshold: prSizeStats.overThreshold,
    },
    flakyTests: 0, // TODO: Implement flaky test detection
  };
}

/**
 * Refresh dashboard with current data
 */
export function refreshDashboard(): void {
  const playerStates = loadPlayerStates();
  const qualityMetrics = getCurrentQualityMetrics();
  updateDashboard(playerStates, qualityMetrics);
}
