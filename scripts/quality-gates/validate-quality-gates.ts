#!/usr/bin/env tsx
/**
 * Quality Gate Validator
 *
 * Runs all quality checks in sequence:
 * 1. Lint
 * 2. TypeScript type check
 * 3. Tests
 * 4. Coverage check
 * 5. Security audit
 *
 * Usage: npm run quality-gates
 */

import { execSync } from 'child_process';
import chalk from 'chalk';

interface Check {
  name: string;
  command: string;
  critical: boolean; // If true, failure blocks execution
}

const CHECKS: Check[] = [
  {
    name: 'Lint',
    command: 'npm run lint',
    critical: true,
  },
  {
    name: 'TypeScript Type Check',
    command: 'npm run typecheck',
    critical: true,
  },
  {
    name: 'Unit Tests',
    command: 'npm test',
    critical: true,
  },
  {
    name: 'Test Coverage',
    command: 'tsx scripts/quality-gates/check-coverage.ts',
    critical: true,
  },
  {
    name: 'Security Audit',
    command: 'tsx scripts/quality-gates/check-security.ts',
    critical: false, // Warning only
  },
];

interface CheckResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

function runCheck(check: Check): CheckResult {
  const startTime = Date.now();

  try {
    console.log(chalk.blue(`\n🔍 Running: ${check.name}...`));
    execSync(check.command, { stdio: 'inherit' });

    const duration = Date.now() - startTime;
    console.log(chalk.green(`✅ ${check.name} passed (${duration}ms)`));

    return {
      name: check.name,
      passed: true,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);

    if (check.critical) {
      console.log(chalk.red(`❌ ${check.name} failed (${duration}ms)`));
    } else {
      console.log(chalk.yellow(`⚠️  ${check.name} failed (${duration}ms)`));
    }

    return {
      name: check.name,
      passed: false,
      error: errorMsg,
      duration,
    };
  }
}

function displaySummary(results: CheckResult[]): void {
  console.log(chalk.blue('\n' + '='.repeat(60)));
  console.log(chalk.blue.bold('📊 Quality Gates Summary'));
  console.log(chalk.blue('='.repeat(60) + '\n'));

  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  for (const result of results) {
    const status = result.passed ? chalk.green('✅ PASS') : chalk.red('❌ FAIL');
    const duration = chalk.gray(`(${result.duration}ms)`);
    console.log(`${status} ${result.name.padEnd(30)} ${duration}`);
  }

  console.log(chalk.gray('\n' + '-'.repeat(60)));
  console.log(
    chalk.bold(`Total: ${passed} passed, ${failed} failed (${(totalDuration / 1000).toFixed(2)}s)`)
  );
  console.log(chalk.gray('-'.repeat(60)));
}

function main(): void {
  console.log(chalk.blue.bold('\n🚀 Running Quality Gates\n'));
  console.log(chalk.gray('This will run all quality checks to ensure code meets standards.'));

  const results: CheckResult[] = [];
  let criticalFailure = false;

  for (const check of CHECKS) {
    const result = runCheck(check);
    results.push(result);

    // Stop on critical failures
    if (!result.passed && check.critical) {
      criticalFailure = true;
      console.log(chalk.red.bold(`\n⛔ Critical check failed: ${check.name}`));
      console.log(chalk.red('Stopping quality gate execution.'));
      break;
    }
  }

  displaySummary(results);

  if (criticalFailure) {
    console.log(chalk.red.bold('\n❌ Quality gates failed'));
    console.log(chalk.red('Please fix the issues above before proceeding.'));
    process.exit(1);
  } else {
    const allPassed = results.every((r) => r.passed);
    if (allPassed) {
      console.log(chalk.green.bold('\n✅ All quality gates passed!'));
      console.log(chalk.green('Your code is ready for review.'));
      process.exit(0);
    } else {
      console.log(chalk.yellow.bold('\n⚠️  Some non-critical checks failed'));
      console.log(chalk.yellow('Review warnings above, but you may proceed.'));
      process.exit(0);
    }
  }
}

main();
