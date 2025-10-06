# Developer Tools & Automation Guide

This document covers the developer tools and automation configured for the NXFS Frontend project to ensure code quality, consistency, and efficient workflows.

## Table of Contents

- [Overview](#overview)
- [Pre-commit Hooks (Husky)](#pre-commit-hooks-husky)
- [Lint-staged](#lint-staged)
- [Commit Message Standards (Commitlint)](#commit-message-standards-commitlint)
- [ESLint Configuration](#eslint-configuration)
- [GitHub Actions CI/CD](#github-actions-cicd)
- [Dependabot](#dependabot)
- [Troubleshooting](#troubleshooting)

---

## Overview

The project uses a comprehensive suite of developer tools to maintain code quality:

- **Husky** - Git hooks automation
- **lint-staged** - Run linters on staged files only
- **commitlint** - Enforce commit message conventions
- **ESLint** - Code quality and style checking
- **GitHub Actions** - Automated CI/CD pipeline
- **Dependabot** - Automated dependency updates

---

## Pre-commit Hooks (Husky)

### What It Does

Husky runs automated checks **before** your code is committed to Git. This catches issues early, before they reach the repository.

### Configured Hooks

**1. Pre-commit Hook** (`.husky/pre-commit`)

```bash
# Runs on: git commit
# Does: Lints and formats only staged files
npx lint-staged
```

**2. Commit Message Hook** (`.husky/commit-msg`)

```bash
# Runs on: git commit
# Does: Validates commit message format
npx commitlint --edit $1
```

### How It Works

```bash
$ git commit -m "add new feature"

🔍 Running pre-commit checks...
✅ Linting staged files
✅ Formatting code
✅ Type checking

📝 Checking commit message...
❌ Error: Commit message must follow conventional format!

Expected format: <type>(<scope>): <subject>
Example: feat(tasks): add task creation workflow
```

### Bypassing Hooks (Emergency Only)

```bash
# Skip all hooks (use with caution!)
git commit --no-verify -m "emergency fix"

# Or disable specific hooks temporarily
HUSKY=0 git commit -m "skip hooks"
```

---

## Lint-staged

### What It Does

Runs linters and formatters **only on files you're committing**, not the entire codebase. This makes commits fast while ensuring quality.

### Configuration (`.lintstagedrc.js`)

```javascript
module.exports = {
  // TypeScript/JavaScript files
  '*.{ts,tsx,js,jsx}': [
    'eslint --fix', // Fix linting issues
    'prettier --write', // Format code
  ],

  // JSON, CSS, Markdown
  '*.{json,css,md}': ['prettier --write'],

  // TypeScript type checking (no auto-fix)
  '*.{ts,tsx}': () => 'tsc --noEmit',
};
```

### What Gets Checked

| File Type     | Checks Performed               |
| ------------- | ------------------------------ |
| `.ts`, `.tsx` | ESLint + Prettier + TypeScript |
| `.js`, `.jsx` | ESLint + Prettier              |
| `.json`       | Prettier formatting            |
| `.css`        | Prettier formatting            |
| `.md`         | Prettier formatting            |

### Example Output

```bash
$ git commit -m "feat: add new component"

✔ Preparing lint-staged...
✔ Running tasks for staged files...
  ✔ .lintstagedrc.js — 3 files
    ✔ *.{ts,tsx,js,jsx} — 2 files
      ✔ eslint --fix
      ✔ prettier --write
    ✔ *.{ts,tsx} — 2 files
      ✔ tsc --noEmit
✔ Applying modifications from tasks...
✔ Cleaning up temporary files...
```

---

## Commit Message Standards (Commitlint)

### Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Allowed Types

| Type       | Description             | Example                                   |
| ---------- | ----------------------- | ----------------------------------------- |
| `feat`     | New feature             | `feat(tasks): add task filtering`         |
| `fix`      | Bug fix                 | `fix(auth): resolve login timeout`        |
| `docs`     | Documentation           | `docs(readme): update setup instructions` |
| `style`    | Code style (formatting) | `style(components): fix indentation`      |
| `refactor` | Code refactoring        | `refactor(api): simplify error handling`  |
| `perf`     | Performance improvement | `perf(images): optimize loading`          |
| `test`     | Adding tests            | `test(hooks): add useDebounce tests`      |
| `build`    | Build system changes    | `build(webpack): update config`           |
| `ci`       | CI/CD changes           | `ci(actions): add E2E workflow`           |
| `chore`    | Maintenance tasks       | `chore(deps): update dependencies`        |
| `revert`   | Revert previous commit  | `revert: feat(tasks): add filtering`      |

### Examples

**Good Commits** ✅

```bash
feat(auth): add social login support
fix(api): handle network timeout errors
docs(testing): add E2E testing guide
test(hooks): add useLocalStorage tests
refactor(tasks): simplify task creation logic
```

**Bad Commits** ❌

```bash
added stuff              # No type
fixed bug                # Too vague
WIP                      # Not descriptive
asdf                     # Meaningless
Update code              # No type, vague
```

### Rules Enforced

- ✅ Type must be one of the allowed types
- ✅ Subject cannot be empty
- ✅ Subject cannot end with a period
- ✅ Header max length: 100 characters

### Configuration (`.commitlintrc.js`)

See the configuration file for detailed rules and customization options.

---

## ESLint Configuration

### Enhanced Rules

The ESLint configuration has been upgraded from "disabled" to "enforced" for better code quality.

### Rule Categories

**TypeScript Rules**

```javascript
"@typescript-eslint/no-explicit-any": "warn"           // Discourage 'any'
"@typescript-eslint/no-unused-vars": "error"           // Remove unused variables
"@typescript-eslint/prefer-as-const": "error"          // Prefer 'as const'
```

**React Rules**

```javascript
"react-hooks/exhaustive-deps": "warn"                  // Complete dependencies
"react/no-unescaped-entities": "warn"                  // Escape special chars
```

**Code Quality Rules**

```javascript
"prefer-const": "error"                                // Use const when possible
"no-console": ["warn", { allow: ["warn", "error"] }]  // Limit console usage
"no-debugger": "error"                                 // No debugger statements
"no-var": "error"                                      // Use let/const
"eqeqeq": ["error", "always"]                          // Require === over ==
```

### Running ESLint

```bash
# Lint all files
npm run lint

# Auto-fix issues
npm run lint -- --fix

# Lint specific file
npx eslint src/components/MyComponent.tsx
```

### VS Code Integration

Install the ESLint extension and add to `.vscode/settings.json`:

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
}
```

---

## GitHub Actions CI/CD

### Workflow Overview

The CI/CD pipeline runs automatically on every push and pull request.

### Jobs

**1. Lint & Type Check** (2-3 minutes)

- ✅ Run ESLint on all files
- ✅ Run TypeScript compiler check

**2. Unit Tests** (1-2 minutes)

- ✅ Run Jest unit tests
- ✅ Generate coverage report
- ✅ Upload to Codecov

**3. E2E Tests** (3-5 minutes)

- ✅ Install Playwright
- ✅ Run E2E tests in Chromium
- ✅ Upload test reports

**4. Build** (3-4 minutes)

- ✅ Build Next.js production bundle
- ✅ Upload build artifacts

**5. Security Audit** (30 seconds)

- ✅ Run npm audit for vulnerabilities

**6. Quality Summary** (5 seconds)

- ✅ Display results summary

### Workflow Triggers

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
```

### GitHub PR Integration

When you create a pull request, you'll see:

```
Checks:
✅ Lint & Type Check (2m 15s)
✅ Unit Tests (1m 30s)
✅ E2E Tests (3m 20s)
✅ Build (3m 45s)
✅ Security Audit (25s)

All checks have passed!
```

### Required Secrets

Add these to GitHub Settings → Secrets:

| Secret                | Description     | Required         |
| --------------------- | --------------- | ---------------- |
| `NEXT_PUBLIC_API_URL` | Backend API URL | No (has default) |
| `NEXT_PUBLIC_N8N_URL` | N8N webhook URL | No (has default) |

### Viewing Results

- **Actions Tab**: See all workflow runs
- **Coverage**: Check code coverage reports
- **Artifacts**: Download build outputs and test reports

---

## Dependabot

### What It Does

Dependabot automatically:

1. ✅ Checks for dependency updates weekly
2. ✅ Creates pull requests for updates
3. ✅ Groups related updates together
4. ✅ Runs tests before suggesting merges

### Update Schedule

```yaml
schedule:
  interval: 'weekly'
  day: 'monday'
  time: '09:00'
```

### Grouping Strategy

**Development Dependencies**

- Groups: `@types/*`, `eslint*`, `prettier`, testing libraries
- Update types: Minor and patch versions

**React Ecosystem**

- Groups: `react`, `react-dom`, `next`
- Update types: Minor and patch versions

**UI Libraries**

- Groups: `@radix-ui/*`, `framer-motion`, `tailwindcss`
- Update types: Minor and patch versions

### Example PRs

```
🤖 Dependabot PR #125
chore(deps): update development-dependencies group
- @types/node: 20.11.0 → 20.11.5
- @types/react: 19.0.0 → 19.0.1
- eslint: 9.0.0 → 9.1.0

✅ All tests passed
📊 Coverage: 85%
```

### Auto-merge (Optional)

You can enable auto-merge for patch updates:

```yaml
# In .github/dependabot.yml
auto-merge:
  - match:
      dependency-type: 'development'
      update-type: 'semver:patch'
```

### Security Alerts

Dependabot also monitors security vulnerabilities:

```
🚨 Security Alert
axios has a high severity vulnerability

📦 Update to axios@1.11.0
🤖 PR created: #126
```

---

## Troubleshooting

### Pre-commit Hooks Failing

**Problem**: Husky hook fails with permission error

```bash
Solution: Make hooks executable
chmod +x .husky/pre-commit .husky/commit-msg
```

**Problem**: TypeScript errors in pre-commit

```bash
Solution: Fix TypeScript errors or temporarily bypass
git commit --no-verify -m "fix: emergency patch"
```

### Commit Message Rejected

**Problem**: Invalid commit message format

```bash
❌ feat add new feature  # Missing colon
✅ feat: add new feature  # Correct

❌ added feature         # Wrong type
✅ feat: add feature      # Correct
```

### ESLint Errors

**Problem**: Too many linting errors

```bash
# Auto-fix what's possible
npm run lint -- --fix

# See specific errors
npm run lint
```

**Problem**: False positive errors

```bash
# Disable for specific line
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = response;

# Disable for file (use sparingly!)
/* eslint-disable @typescript-eslint/no-explicit-any */
```

### GitHub Actions Failing

**Problem**: Tests pass locally but fail in CI

```bash
# Ensure dependencies are installed
npm ci  # Use ci instead of install in CI

# Check Node version matches
node -v  # Should be 20.x
```

**Problem**: E2E tests timeout

```bash
# Increase timeout in playwright.config.ts
timeout: 60000  # 60 seconds
```

### Dependabot Issues

**Problem**: PR conflicts

```bash
# Update your branch first
git pull origin main

# Dependabot will auto-rebase
```

**Problem**: Test failures in Dependabot PR

```bash
# Review the PR
# Fix compatibility issues
# Close PR if update is incompatible
```

---

## Best Practices

### Daily Workflow

```bash
# 1. Pull latest changes
git pull origin main

# 2. Create feature branch
git checkout -b feat/my-feature

# 3. Make changes
# ... code code code ...

# 4. Stage files
git add .

# 5. Commit (hooks run automatically!)
git commit -m "feat(tasks): add task filtering"

# 6. Push to remote
git push origin feat/my-feature

# 7. Create PR (CI runs automatically!)
```

### Code Review Checklist

Before creating a PR:

- ✅ All tests pass locally (`npm run test:ci`)
- ✅ No linting errors (`npm run lint`)
- ✅ TypeScript compiles (`npm run build`)
- ✅ Commit messages follow convention
- ✅ Changes are well-documented

### Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update specific package
npm update package-name

# Or wait for Dependabot PR 🤖
```

---

## Quick Reference

### Commands

| Command                 | Description                 |
| ----------------------- | --------------------------- |
| `git commit`            | Triggers pre-commit hooks   |
| `npm run lint`          | Run ESLint                  |
| `npm run lint -- --fix` | Auto-fix ESLint issues      |
| `npm run test:ci`       | Run all tests with coverage |
| `npm run format`        | Format code with Prettier   |

### Files

| File                       | Purpose                   |
| -------------------------- | ------------------------- |
| `.husky/pre-commit`        | Pre-commit hook script    |
| `.husky/commit-msg`        | Commit message validation |
| `.lintstagedrc.js`         | Lint-staged configuration |
| `.commitlintrc.js`         | Commitlint rules          |
| `eslint.config.mjs`        | ESLint rules              |
| `.github/workflows/ci.yml` | CI/CD pipeline            |
| `.github/dependabot.yml`   | Dependency automation     |

---

_Last Updated: 2025-10-06_
_Phase 3: Developer Tools & Automation - Complete ✅_
