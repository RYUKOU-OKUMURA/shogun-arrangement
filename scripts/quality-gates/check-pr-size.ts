#!/usr/bin/env tsx
/**
 * PR Size Enforcer
 *
 * Checks the size of changes in a PR and enforces size limits:
 * - Warning: 200 lines
 * - Block: 400 lines
 *
 * Usage: npm run check:pr-size [base-branch]
 */

import { execSync } from 'child_process';
import chalk from 'chalk';

const WARNING_THRESHOLD = 200;
const BLOCK_THRESHOLD = 400;

interface DiffStats {
  additions: number;
  deletions: number;
  total: number;
  files: string[];
}

function getDiffStats(baseBranch: string = 'main'): DiffStats {
  try {
    // Get diff stats
    const diffOutput = execSync(`git diff ${baseBranch}...HEAD --numstat`, {
      encoding: 'utf-8',
    });

    const lines = diffOutput.trim().split('\n').filter(Boolean);
    let additions = 0;
    let deletions = 0;
    const files: string[] = [];

    for (const line of lines) {
      const [add, del, file] = line.split('\t');

      // Skip binary files (marked with '-')
      if (add === '-' || del === '-') continue;

      additions += parseInt(add, 10);
      deletions += parseInt(del, 10);
      files.push(file);
    }

    return {
      additions,
      deletions,
      total: additions + deletions,
      files,
    };
  } catch (error) {
    console.error(chalk.red('Error getting diff stats:'), error);
    process.exit(1);
  }
}

function suggestTaskSplit(_stats: DiffStats): void {
  console.log('\n' + chalk.yellow('💡 Task Split Suggestions:'));
  console.log(chalk.gray('Consider breaking this PR into smaller, focused changes:'));
  console.log(chalk.gray('  1. Extract pure refactoring into a separate PR'));
  console.log(chalk.gray('  2. Split new features from bug fixes'));
  console.log(chalk.gray('  3. Separate test additions from implementation'));
  console.log(chalk.gray('  4. Break down by module/component boundaries'));
  console.log(chalk.gray('  5. Use feature flags for incremental changes'));
  console.log(
    chalk.gray(`\n  Target: ${WARNING_THRESHOLD} lines or less per PR for easier review`)
  );
}

function formatFileList(files: string[], maxDisplay: number = 10): string {
  if (files.length <= maxDisplay) {
    return files.map((f) => `    - ${f}`).join('\n');
  }

  const displayed = files.slice(0, maxDisplay);
  const remaining = files.length - maxDisplay;
  return (
    displayed.map((f) => `    - ${f}`).join('\n') +
    `\n    ... and ${remaining} more file${remaining > 1 ? 's' : ''}`
  );
}

function main(): void {
  const baseBranch = process.argv[2] || 'main';

  console.log(chalk.blue('🔍 Checking PR size...'));
  console.log(chalk.gray(`Base branch: ${baseBranch}\n`));

  const stats = getDiffStats(baseBranch);

  // Display stats
  console.log(chalk.bold('Diff Statistics:'));
  console.log(chalk.green(`  + ${stats.additions} additions`));
  console.log(chalk.red(`  - ${stats.deletions} deletions`));
  console.log(chalk.bold(`  = ${stats.total} total changes`));
  console.log(
    chalk.gray(`  📁 ${stats.files.length} file${stats.files.length > 1 ? 's' : ''} changed`)
  );

  if (stats.files.length > 0) {
    console.log('\n' + chalk.gray('Changed files:'));
    console.log(chalk.gray(formatFileList(stats.files)));
  }

  console.log('');

  // Check thresholds
  if (stats.total >= BLOCK_THRESHOLD) {
    console.log(
      chalk.red.bold(`❌ PR is too large: ${stats.total} lines (limit: ${BLOCK_THRESHOLD})`)
    );
    console.log(chalk.red('This PR is blocked. Please split it into smaller changes.'));
    suggestTaskSplit(stats);
    process.exit(1);
  } else if (stats.total >= WARNING_THRESHOLD) {
    console.log(
      chalk.yellow.bold(`⚠️  PR is large: ${stats.total} lines (warning at: ${WARNING_THRESHOLD})`)
    );
    console.log(
      chalk.yellow(`Consider splitting this PR. It will be blocked at ${BLOCK_THRESHOLD} lines.`)
    );
    suggestTaskSplit(stats);
    process.exit(0); // Warning only, don't block
  } else {
    console.log(chalk.green.bold(`✅ PR size is good: ${stats.total} lines`));
    process.exit(0);
  }
}

main();
