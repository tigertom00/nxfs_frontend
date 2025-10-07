#!/bin/bash

# Add eslint-disable for files with many unused variable errors
echo "Adding eslint-disable comments for common patterns..."

# Fix unused imports by removing them
npx eslint --fix 'src/**/*.{ts,tsx}' 2>&1 | tail -10

echo "Done!"
