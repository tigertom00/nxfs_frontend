import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: ["e2e/**/*"], // Ignore E2E test files from React hooks rules
  },
  {
    rules: {
      // TypeScript - Enforce type safety (errors)
      "@typescript-eslint/no-explicit-any": "warn", // Warn on 'any' usage
      "@typescript-eslint/no-unused-vars": ["error", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }],
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/prefer-as-const": "error",

      // React - Best practices (errors and warnings)
      "react-hooks/exhaustive-deps": "warn",
      "react/no-unescaped-entities": "warn",
      "react/display-name": "off", // Allow anonymous components
      "react/prop-types": "off", // TypeScript handles this

      // Next.js - Best practices
      "@next/next/no-img-element": "warn", // Prefer next/image
      "@next/next/no-html-link-for-pages": "error",

      // JavaScript - Code quality
      "prefer-const": "error", // Enforce const when possible
      "no-unused-vars": "off", // Use TypeScript version
      "no-console": ["warn", { allow: ["warn", "error"] }], // Allow error/warn
      "no-debugger": "error", // Block debugger in production
      "no-empty": "warn",
      "no-irregular-whitespace": "error",
      "no-case-declarations": "warn",
      "no-fallthrough": "warn",
      "no-mixed-spaces-and-tabs": "error",
      "no-redeclare": "error",
      "no-undef": "off", // TypeScript handles this
      "no-unreachable": "error",
      "no-useless-escape": "warn",

      // Additional best practices
      "no-var": "error", // Use let/const instead of var
      "eqeqeq": ["error", "always"], // Require === instead of ==
      "curly": ["error", "all"], // Require curly braces
      "no-eval": "error", // Disallow eval()
      "no-implied-eval": "error",
    },
  },
];

export default eslintConfig;
