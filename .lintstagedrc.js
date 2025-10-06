module.exports = {
  // Run ESLint on TypeScript and JavaScript files
  '*.{ts,tsx,js,jsx}': ['eslint --fix', 'prettier --write'],

  // Run Prettier on JSON, CSS, and Markdown files
  '*.{json,css,md}': ['prettier --write'],

  // Type check TypeScript files
  '*.{ts,tsx}': () => 'tsc --noEmit',
};
