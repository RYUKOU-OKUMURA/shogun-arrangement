/**
 * Unit tests for metrics collector
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import {
  loadMetrics,
  saveMetrics,
  recordTaskCompletion,
  recordCoverage,
  recordPRSize,
  recordBlocker,
  resolveBlocker,
  recordPlayerUtilization,
  getAverageTaskTime,
  getLatestCoverage,
  getCoverageTrend,
  getPRSizeStats,
  getBlockerFrequency,
  getPlayerUtilizationSummary,
  type MetricsData,
} from '../collector.js';

const TEST_METRICS_FILE = join(process.cwd(), 'metrics', 'data.json');

describe('Metrics Collector', () => {
  beforeEach(() => {
    // Clean up test data
    if (existsSync(TEST_METRICS_FILE)) {
      unlinkSync(TEST_METRICS_FILE);
    }
  });

  afterEach(() => {
    // Clean up test data
    if (existsSync(TEST_METRICS_FILE)) {
      unlinkSync(TEST_METRICS_FILE);
    }
  });

  describe('loadMetrics and saveMetrics', () => {
    it('should return empty metrics when file does not exist', () => {
      const metrics = loadMetrics();
      expect(metrics.tasks).toEqual([]);
      expect(metrics.coverage).toEqual([]);
      expect(metrics.prSizes).toEqual([]);
      expect(metrics.blockers).toEqual([]);
      expect(metrics.playerUtilization).toEqual([]);
    });

    it('should save and load metrics', () => {
      const testData: MetricsData = {
        tasks: [
          {
            taskId: 'task1',
            playerId: 'player1',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            durationMs: 1000,
            status: 'completed',
          },
        ],
        coverage: [],
        prSizes: [],
        blockers: [],
        playerUtilization: [],
      };

      saveMetrics(testData);
      const loaded = loadMetrics();

      expect(loaded.tasks).toHaveLength(1);
      expect(loaded.tasks[0].taskId).toBe('task1');
    });
  });

  describe('recordTaskCompletion', () => {
    it('should record a completed task', () => {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 5000);

      recordTaskCompletion('task1', 'player1', startTime, endTime, 'completed');

      const metrics = loadMetrics();
      expect(metrics.tasks).toHaveLength(1);
      expect(metrics.tasks[0].taskId).toBe('task1');
      expect(metrics.tasks[0].playerId).toBe('player1');
      expect(metrics.tasks[0].status).toBe('completed');
      expect(metrics.tasks[0].durationMs).toBe(5000);
    });

    it('should record a blocked task with reason', () => {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 2000);

      recordTaskCompletion(
        'task2',
        'player2',
        startTime,
        endTime,
        'blocked',
        'Missing dependencies'
      );

      const metrics = loadMetrics();
      expect(metrics.tasks).toHaveLength(1);
      expect(metrics.tasks[0].status).toBe('blocked');
      expect(metrics.tasks[0].blockerReason).toBe('Missing dependencies');
    });
  });

  describe('recordCoverage', () => {
    it('should record coverage data', () => {
      recordCoverage(85.5, 88.2, 90.0, 82.3);

      const metrics = loadMetrics();
      expect(metrics.coverage).toHaveLength(1);
      expect(metrics.coverage[0].lines).toBe(85.5);
      expect(metrics.coverage[0].statements).toBe(88.2);
      expect(metrics.coverage[0].functions).toBe(90.0);
      expect(metrics.coverage[0].branches).toBe(82.3);
    });
  });

  describe('recordPRSize', () => {
    it('should record PR size data', () => {
      recordPRSize(150, 50, 5, 123);

      const metrics = loadMetrics();
      expect(metrics.prSizes).toHaveLength(1);
      expect(metrics.prSizes[0].additions).toBe(150);
      expect(metrics.prSizes[0].deletions).toBe(50);
      expect(metrics.prSizes[0].total).toBe(200);
      expect(metrics.prSizes[0].filesChanged).toBe(5);
      expect(metrics.prSizes[0].prNumber).toBe(123);
    });
  });

  describe('recordBlocker and resolveBlocker', () => {
    it('should record a blocker', () => {
      recordBlocker('player1', 'API rate limit');

      const metrics = loadMetrics();
      expect(metrics.blockers).toHaveLength(1);
      expect(metrics.blockers[0].playerId).toBe('player1');
      expect(metrics.blockers[0].reason).toBe('API rate limit');
      expect(metrics.blockers[0].resolved).toBe(false);
    });

    it('should resolve a blocker', () => {
      recordBlocker('player1', 'API rate limit');

      const metrics = loadMetrics();
      const timestamp = metrics.blockers[0].timestamp;

      // Wait a bit before resolving
      setTimeout(() => {
        resolveBlocker('player1', timestamp);

        const updatedMetrics = loadMetrics();
        expect(updatedMetrics.blockers[0].resolved).toBe(true);
        expect(updatedMetrics.blockers[0].resolutionTime).toBeGreaterThan(0);
      }, 100);
    });
  });

  describe('recordPlayerUtilization', () => {
    it('should record player utilization', () => {
      recordPlayerUtilization('player1', '2024-01-15', 1000, 5000, 500, 3);

      const metrics = loadMetrics();
      expect(metrics.playerUtilization).toHaveLength(1);
      expect(metrics.playerUtilization[0].playerId).toBe('player1');
      expect(metrics.playerUtilization[0].idleTime).toBe(1000);
      expect(metrics.playerUtilization[0].workingTime).toBe(5000);
      expect(metrics.playerUtilization[0].blockedTime).toBe(500);
      expect(metrics.playerUtilization[0].tasksCompleted).toBe(3);
    });

    it('should update existing player utilization for same period', () => {
      recordPlayerUtilization('player1', '2024-01-15', 1000, 5000, 500, 3);
      recordPlayerUtilization('player1', '2024-01-15', 2000, 6000, 300, 5);

      const metrics = loadMetrics();
      expect(metrics.playerUtilization).toHaveLength(1);
      expect(metrics.playerUtilization[0].tasksCompleted).toBe(5);
    });
  });

  describe('getAverageTaskTime', () => {
    it('should return 0 when no tasks exist', () => {
      expect(getAverageTaskTime()).toBe(0);
    });

    it('should calculate average task time', () => {
      const startTime1 = new Date();
      const endTime1 = new Date(startTime1.getTime() + 3000);
      recordTaskCompletion('task1', 'player1', startTime1, endTime1, 'completed');

      const startTime2 = new Date();
      const endTime2 = new Date(startTime2.getTime() + 5000);
      recordTaskCompletion('task2', 'player1', startTime2, endTime2, 'completed');

      expect(getAverageTaskTime()).toBe(4000);
    });

    it('should filter by player ID', () => {
      const startTime1 = new Date();
      const endTime1 = new Date(startTime1.getTime() + 2000);
      recordTaskCompletion('task1', 'player1', startTime1, endTime1, 'completed');

      const startTime2 = new Date();
      const endTime2 = new Date(startTime2.getTime() + 4000);
      recordTaskCompletion('task2', 'player2', startTime2, endTime2, 'completed');

      expect(getAverageTaskTime('player1')).toBe(2000);
      expect(getAverageTaskTime('player2')).toBe(4000);
    });
  });

  describe('getLatestCoverage', () => {
    it('should return null when no coverage data exists', () => {
      expect(getLatestCoverage()).toBeNull();
    });

    it('should return latest coverage entry', () => {
      recordCoverage(80, 82, 85, 78);
      recordCoverage(85, 87, 90, 83);

      const latest = getLatestCoverage();
      expect(latest).not.toBeNull();
      expect(latest?.lines).toBe(85);
    });
  });

  describe('getCoverageTrend', () => {
    it('should return last N coverage entries', () => {
      recordCoverage(70, 72, 75, 68);
      recordCoverage(75, 77, 80, 73);
      recordCoverage(80, 82, 85, 78);
      recordCoverage(85, 87, 90, 83);

      const trend = getCoverageTrend(2);
      expect(trend).toHaveLength(2);
      expect(trend[0].lines).toBe(80);
      expect(trend[1].lines).toBe(85);
    });
  });

  describe('getPRSizeStats', () => {
    it('should return zero stats when no PR data exists', () => {
      const stats = getPRSizeStats();
      expect(stats.average).toBe(0);
      expect(stats.median).toBe(0);
      expect(stats.max).toBe(0);
      expect(stats.overThreshold).toBe(0);
    });

    it('should calculate PR size statistics', () => {
      recordPRSize(100, 50, 3);
      recordPRSize(200, 100, 5);
      recordPRSize(150, 75, 4);

      const stats = getPRSizeStats();
      expect(stats.average).toBe(225);
      expect(stats.median).toBe(225);
      expect(stats.max).toBe(300);
      expect(stats.overThreshold).toBe(2);
    });
  });

  describe('getBlockerFrequency', () => {
    it('should return zero stats when no blockers exist', () => {
      const stats = getBlockerFrequency();
      expect(stats.total).toBe(0);
      expect(stats.unresolved).toBe(0);
      expect(stats.averageResolutionTime).toBe(0);
    });

    it('should calculate blocker statistics', () => {
      recordBlocker('player1', 'Issue 1');
      recordBlocker('player2', 'Issue 2');

      const stats = getBlockerFrequency();
      expect(stats.total).toBe(2);
      expect(stats.unresolved).toBe(2);
    });
  });

  describe('getPlayerUtilizationSummary', () => {
    it('should return zero summary when no utilization data exists', () => {
      const summary = getPlayerUtilizationSummary();
      expect(summary.totalIdleTime).toBe(0);
      expect(summary.totalWorkingTime).toBe(0);
      expect(summary.totalBlockedTime).toBe(0);
      expect(summary.totalTasksCompleted).toBe(0);
      expect(summary.utilizationRate).toBe(0);
    });

    it('should calculate utilization summary', () => {
      recordPlayerUtilization('player1', '2024-01-15', 1000, 5000, 500, 3);
      recordPlayerUtilization('player2', '2024-01-15', 1500, 4000, 300, 2);

      const summary = getPlayerUtilizationSummary();
      expect(summary.totalIdleTime).toBe(2500);
      expect(summary.totalWorkingTime).toBe(9000);
      expect(summary.totalBlockedTime).toBe(800);
      expect(summary.totalTasksCompleted).toBe(5);
      expect(summary.utilizationRate).toBeCloseTo(0.735, 2);
    });

    it('should filter by player ID', () => {
      recordPlayerUtilization('player1', '2024-01-15', 1000, 5000, 500, 3);
      recordPlayerUtilization('player2', '2024-01-15', 1500, 4000, 300, 2);

      const summary = getPlayerUtilizationSummary('player1');
      expect(summary.totalTasksCompleted).toBe(3);
      expect(summary.utilizationRate).toBeCloseTo(0.769, 2);
    });
  });
});
