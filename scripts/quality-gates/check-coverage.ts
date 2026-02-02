#!/usr/bin/env tsx
/**
 * Test Coverage Enforcer
 *
 * Checks test coverage and enforces minimum thresholds:
 * - Minimum: 80% for lines, branches, functions, and statements
 *
 * Usage: npm run check:coverage
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

const MINIMUM_COVERAGE = 80;

interface CoverageSummary {
  total: {
    lines: { pct: number };
    statements: { pct: number };
    functions: { pct: number };
    branches: { pct: number };
  };
}

function getCoverageSummary(): CoverageSummary | null {
  const coveragePath = join(process.cwd(), 'coverage', 'coverage-summary.json');

  if (!existsSync(coveragePath)) {
    console.log(chalk.yellow('⚠️  Coverage report not found. Running tests with coverage...'));
    try {
      execSync('npm run test:coverage', { stdio: 'inherit' });
    } catch (error) {
      console.error(chalk.red('Failed to generate coverage report'));
      return null;
    }
  }

  try {
    const coverageData = JSON.parse(readFileSync(coveragePath, 'utf-8'));
    return coverageData;
  } catch (error) {
    console.error(chalk.red('Failed to read coverage summary:'), error);
    return null;
  }
}

function formatPercentage(value: number, threshold: number): string {
  const formatted = `${value.toFixed(2)}%`;
  if (value >= threshold) {
    return chalk.green(formatted);
  } else if (value >= threshold - 10) {
    return chalk.yellow(formatted);
  } else {
    return chalk.red(formatted);
  }
}

function displayCoverage(summary: CoverageSummary): boolean {
  const { total } = summary;

  console.log(chalk.blue('\n📊 Test Coverage Report:'));
  console.log(chalk.gray(`Minimum required: ${MINIMUM_COVERAGE}%\n`));

  const metrics = [
    { name: 'Lines', value: total.lines.pct },
    { name: 'Statements', value: total.statements.pct },
    { name: 'Functions', value: total.functions.pct },
    { name: 'Branches', value: total.branches.pct },
  ];

  let allPassed = true;

  for (const metric of metrics) {
    const status = metric.value >= MINIMUM_COVERAGE ? '✅' : '❌';
    const formatted = formatPercentage(metric.value, MINIMUM_COVERAGE);
    console.log(`  ${status} ${metric.name.padEnd(12)}: ${formatted}`);

    if (metric.value < MINIMUM_COVERAGE) {
      allPassed = false;
    }
  }

  return allPassed;
}

function generateReport(summary: CoverageSummary): string {
  const { total } = summary;

  const lines = [
    '## Coverage Report',
    '',
    '| Metric | Coverage | Status |',
    '|--------|----------|--------|',
    `| Lines | ${total.lines.pct.toFixed(2)}% | ${total.lines.pct >= MINIMUM_COVERAGE ? '✅' : '❌'} |`,
    `| Statements | ${total.statements.pct.toFixed(2)}% | ${total.statements.pct >= MINIMUM_COVERAGE ? '✅' : '❌'} |`,
    `| Functions | ${total.functions.pct.toFixed(2)}% | ${total.functions.pct >= MINIMUM_COVERAGE ? '✅' : '❌'} |`,
    `| Branches | ${total.branches.pct.toFixed(2)}% | ${total.branches.pct >= MINIMUM_COVERAGE ? '✅' : '❌'} |`,
    '',
    `**Minimum Required:** ${MINIMUM_COVERAGE}%`,
  ];

  return lines.join('\n');
}

function provideSuggestions(): void {
  console.log('\n' + chalk.yellow('💡 Coverage Improvement Suggestions:'));
  console.log(chalk.gray('  1. Identify uncovered lines: Check coverage/lcov-report/index.html'));
  console.log(chalk.gray('  2. Add unit tests for edge cases and error handling'));
  console.log(chalk.gray('  3. Test public APIs and exported functions thoroughly'));
  console.log(chalk.gray('  4. Use test coverage as a guide, not a goal'));
  console.log(chalk.gray('  5. Focus on critical business logic first'));
}

function main(): void {
  console.log(chalk.blue('🔍 Checking test coverage...'));

  const summary = getCoverageSummary();

  if (!summary) {
    console.error(chalk.red('\n❌ Failed to get coverage summary'));
    process.exit(1);
  }

  const passed = displayCoverage(summary);

  // Generate markdown report for CI
  const report = generateReport(summary);
  console.log('\n' + chalk.gray('Markdown Report:'));
  console.log(chalk.gray('─'.repeat(60)));
  console.log(report);
  console.log(chalk.gray('─'.repeat(60)));

  if (!passed) {
    console.log(chalk.red.bold('\n❌ Coverage is below minimum threshold'));
    console.log(chalk.red(`Required: ${MINIMUM_COVERAGE}% for all metrics`));
    provideSuggestions();
    process.exit(1);
  } else {
    console.log(chalk.green.bold('\n✅ Coverage meets minimum requirements'));
    process.exit(0);
  }
}

main();
