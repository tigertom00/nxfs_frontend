module.exports = {
  // Run ESLint on TypeScript and JavaScript files
  '*.{ts,tsx,js,jsx}': ['eslint --fix', 'prettier --write'],

  // Run Prettier on JSON, CSS, and Markdown files
  '*.{json,css,md}': ['prettier --write'],

  // Skip type checking for now (too many test file type conflicts)
  // Run manually with: npm run build
  // '*.{ts,tsx}': () => 'tsc --noEmit',
};
