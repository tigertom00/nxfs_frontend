#!/bin/bash

# Script to automatically fix common ESLint errors

echo "Fixing unused error variables in catch blocks..."
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/} catch (error)/} catch (_error)/g' {} \;
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/} catch (err)/} catch (_err)/g' {} \;
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/} catch (e)/} catch (_e)/g' {} \;

echo "Running ESLint auto-fix..."
npx eslint --fix 'src/**/*.{ts,tsx}' 2>&1 | tail -20

echo "Done! Run 'npm run lint' to see remaining issues."
