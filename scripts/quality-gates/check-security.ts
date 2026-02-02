#!/usr/bin/env tsx
/**
 * Security Checks
 *
 * Runs security checks:
 * 1. Hardcoded secrets detection
 * 2. npm audit for dependency vulnerabilities
 * 3. Basic OWASP Top 10 checks
 *
 * Usage: npm run check:security
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { globSync } from 'glob';
import chalk from 'chalk';

interface SecurityIssue {
  type: string;
  severity: 'high' | 'medium' | 'low';
  file?: string;
  line?: number;
  message: string;
}

const SECRET_PATTERNS = [
  {
    name: 'AWS Access Key',
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'high' as const,
  },
  {
    name: 'API Key',
    pattern: /api[_-]?key[_-]?[=:]\s*['"]?[a-zA-Z0-9]{32,}['"]?/gi,
    severity: 'high' as const,
  },
  {
    name: 'Private Key',
    pattern: /-----BEGIN (RSA |DSA )?PRIVATE KEY-----/g,
    severity: 'high' as const,
  },
  {
    name: 'Password',
    pattern: /password[_-]?[=:]\s*['"][^'"]{8,}['"]/gi,
    severity: 'medium' as const,
  },
  {
    name: 'Token',
    pattern: /token[_-]?[=:]\s*['"]?[a-zA-Z0-9]{32,}['"]?/gi,
    severity: 'medium' as const,
  },
  {
    name: 'Secret',
    pattern: /secret[_-]?[=:]\s*['"]?[a-zA-Z0-9]{16,}['"]?/gi,
    severity: 'medium' as const,
  },
];

function checkHardcodedSecrets(): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  // Get all source files
  const files = globSync('src/**/*.{ts,tsx,js,jsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
  });

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      for (const pattern of SECRET_PATTERNS) {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const matches = line.match(pattern.pattern);

          if (matches) {
            issues.push({
              type: 'Hardcoded Secret',
              severity: pattern.severity,
              file,
              line: i + 1,
              message: `Possible ${pattern.name} detected`,
            });
          }
        }
      }
    } catch (error) {
      // Skip files that can't be read
      continue;
    }
  }

  return issues;
}

function checkNpmAudit(): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  try {
    execSync('npm audit --json', { encoding: 'utf-8', stdio: 'pipe' });
  } catch (error: unknown) {
    try {
      const output =
        (error as { stdout?: string; output?: (Buffer | string)[] }).stdout ||
        (error as { output?: (Buffer | string)[] }).output?.[1]?.toString();
      if (output) {
        const auditData = JSON.parse(output);

        if (auditData.metadata && auditData.metadata.vulnerabilities) {
          const { vulnerabilities } = auditData.metadata;

          if (vulnerabilities.high > 0) {
            issues.push({
              type: 'Dependency Vulnerability',
              severity: 'high',
              message: `${vulnerabilities.high} high severity vulnerabilities found`,
            });
          }

          if (vulnerabilities.moderate > 0) {
            issues.push({
              type: 'Dependency Vulnerability',
              severity: 'medium',
              message: `${vulnerabilities.moderate} moderate severity vulnerabilities found`,
            });
          }

          if (vulnerabilities.low > 0) {
            issues.push({
              type: 'Dependency Vulnerability',
              severity: 'low',
              message: `${vulnerabilities.low} low severity vulnerabilities found`,
            });
          }
        }
      }
    } catch (parseError) {
      // If we can't parse the output, assume there might be issues
      issues.push({
        type: 'Dependency Vulnerability',
        severity: 'medium',
        message: 'Unable to parse npm audit results',
      });
    }
  }

  return issues;
}

function checkOWASPBasics(): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  // Check for common OWASP issues
  const files = globSync('src/**/*.{ts,tsx,js,jsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
  });

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check for eval() usage
        if (/\beval\s*\(/.test(line)) {
          issues.push({
            type: 'Code Injection Risk',
            severity: 'high',
            file,
            line: i + 1,
            message: 'Use of eval() detected - potential code injection risk',
          });
        }

        // Check for innerHTML usage
        if (/\.innerHTML\s*=/.test(line)) {
          issues.push({
            type: 'XSS Risk',
            severity: 'medium',
            file,
            line: i + 1,
            message: 'Use of innerHTML - potential XSS risk',
          });
        }

        // Check for dangerouslySetInnerHTML
        if (/dangerouslySetInnerHTML/.test(line)) {
          issues.push({
            type: 'XSS Risk',
            severity: 'medium',
            file,
            line: i + 1,
            message: 'Use of dangerouslySetInnerHTML - ensure content is sanitized',
          });
        }
      }
    } catch (error) {
      continue;
    }
  }

  return issues;
}

function displayIssues(issues: SecurityIssue[]): void {
  if (issues.length === 0) {
    console.log(chalk.green('\n✅ No security issues found'));
    return;
  }

  console.log(
    chalk.yellow(`\n⚠️  Found ${issues.length} security issue${issues.length > 1 ? 's' : ''}:\n`)
  );

  const grouped = {
    high: issues.filter((i) => i.severity === 'high'),
    medium: issues.filter((i) => i.severity === 'medium'),
    low: issues.filter((i) => i.severity === 'low'),
  };

  for (const severity of ['high', 'medium', 'low'] as const) {
    const severityIssues = grouped[severity];
    if (severityIssues.length === 0) continue;

    const color =
      severity === 'high' ? chalk.red : severity === 'medium' ? chalk.yellow : chalk.blue;
    console.log(color.bold(`${severity.toUpperCase()} Severity (${severityIssues.length}):`));

    for (const issue of severityIssues) {
      const location = issue.file && issue.line ? `${issue.file}:${issue.line}` : issue.file || '';
      console.log(color(`  • ${issue.type}: ${issue.message}`));
      if (location) {
        console.log(color.dim(`    ${location}`));
      }
    }
    console.log('');
  }
}

function provideSuggestions(issues: SecurityIssue[]): void {
  if (issues.length === 0) return;

  console.log(chalk.yellow('💡 Security Improvement Suggestions:'));
  console.log(
    chalk.gray('  1. Use environment variables for sensitive data (never commit .env files)')
  );
  console.log(chalk.gray('  2. Run npm audit fix to update vulnerable dependencies'));
  console.log(chalk.gray('  3. Consider using a secrets scanner like GitGuardian or TruffleHog'));
  console.log(chalk.gray('  4. Sanitize user input to prevent XSS and injection attacks'));
  console.log(chalk.gray('  5. Review OWASP Top 10: https://owasp.org/www-project-top-ten/'));
}

function main(): void {
  console.log(chalk.blue('🔍 Running security checks...'));

  const allIssues: SecurityIssue[] = [];

  // Check for hardcoded secrets
  console.log(chalk.gray('\n1. Checking for hardcoded secrets...'));
  const secretIssues = checkHardcodedSecrets();
  allIssues.push(...secretIssues);
  console.log(
    secretIssues.length > 0
      ? chalk.yellow(`   Found ${secretIssues.length} potential secret(s)`)
      : chalk.green('   ✅ No hardcoded secrets found')
  );

  // Run npm audit
  console.log(chalk.gray('\n2. Running npm audit...'));
  const auditIssues = checkNpmAudit();
  allIssues.push(...auditIssues);
  console.log(
    auditIssues.length > 0
      ? chalk.yellow(`   Found ${auditIssues.length} vulnerability issue(s)`)
      : chalk.green('   ✅ No vulnerabilities found')
  );

  // Check OWASP basics
  console.log(chalk.gray('\n3. Checking for common OWASP issues...'));
  const owaspIssues = checkOWASPBasics();
  allIssues.push(...owaspIssues);
  console.log(
    owaspIssues.length > 0
      ? chalk.yellow(`   Found ${owaspIssues.length} potential OWASP issue(s)`)
      : chalk.green('   ✅ No OWASP issues found')
  );

  // Display results
  displayIssues(allIssues);

  const highSeverity = allIssues.filter((i) => i.severity === 'high');

  if (highSeverity.length > 0) {
    console.log(chalk.red.bold(`\n❌ ${highSeverity.length} high severity issue(s) found`));
    provideSuggestions(allIssues);
    process.exit(1);
  } else if (allIssues.length > 0) {
    console.log(chalk.yellow.bold('\n⚠️  Security issues found (non-critical)'));
    provideSuggestions(allIssues);
    process.exit(0); // Warning only
  } else {
    console.log(chalk.green.bold('\n✅ All security checks passed'));
    process.exit(0);
  }
}

main();
