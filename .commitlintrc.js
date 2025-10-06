module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type must be one of these
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation changes
        'style', // Code style changes (formatting, etc.)
        'refactor', // Code refactoring
        'perf', // Performance improvements
        'test', // Adding or updating tests
        'build', // Build system changes
        'ci', // CI/CD changes
        'chore', // Other changes (dependencies, etc.)
        'revert', // Revert previous commit
      ],
    ],
    // Subject (commit message) should not be empty
    'subject-empty': [2, 'never'],
    // Subject should not end with a period
    'subject-full-stop': [2, 'never', '.'],
    // Subject should be lowercase (we'll allow flexibility)
    'subject-case': [0],
    // Header (first line) max length
    'header-max-length': [2, 'always', 100],
  },
};
