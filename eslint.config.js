import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import css from "@eslint/css";
import { defineConfig } from "eslint/config";

const customRules = {
  // Base rules for all JavaScript/TypeScript files
  javascript: {
    // === ERRORS: Potential Runtime Issues ===
    "no-undef": "error",                  // Undefined variables
    "no-global-assign": "error",          // Prevents overwriting global variables
    "no-invalid-regexp": "error",         // Invalid RegExp syntax
    "no-dupe-keys": "error",              // Duplicate keys in object literals
    "no-unreachable": "error",            // Unreachable code
    "eqeqeq": "error",                    // Require === instead of == to prevent type coercion issues
    "no-var": "error",                    // Disallow var to prevent hoisting issues
    "no-const-assign": "error",           // Prevent reassigning constants
    "no-this-before-super": "error",      // Prevent this/super before calling super() in constructors
    "no-dupe-class-members": "error",     // Prevent duplicate class members
    "no-unsafe-finally": "error",         // Prevent control flow statements in finally blocks
    "no-throw-literal": "error",          // Prevent throwing non-Error objects

    // === WARNINGS: Code Style & Best Practices ===
    "no-unused-vars": "warn",             // Unused variables
    "prefer-const": "warn",               // Use const when variables aren't reassigned
    "no-console": "warn",                 // Console statements often left in by accident
    "no-debugger": "warn",                // Debugger statements often left in by accident
    "no-empty": "warn",                   // Empty blocks
    "no-extra-semi": "warn",              // Extra semicolons
    "no-multiple-empty-lines": "warn",    // Multiple empty lines
    "prefer-template": "warn",            // Template literals over string concatenation
    "prefer-destructuring": "warn",       // Destructuring when possible
    "arrow-body-style": ["warn", "as-needed"], // Concise arrow functions
    "no-param-reassign": "warn",          // Reassigning function parameters
  },
  typsecript: {
    // === ERRORS: Potential Runtime Issues ===
    "@typescript-eslint/no-misused-promises": "error", // Prevents common Promise mistakes
    "@typescript-eslint/no-floating-promises": "error", // Requires Promise handling
    "@typescript-eslint/await-thenable": "error",      // Ensures await is only used with Promises
    "@typescript-eslint/no-unnecessary-type-assertion": "error", // Prevents redundant type assertions
    //"@typescript-eslint/no-unsafe-assignment": "error", // Prevents unsafe assignments from any
    //"@typescript-eslint/no-unsafe-call": "error",       // Prevents unsafe function calls
    //"@typescript-eslint/no-unsafe-return": "error",     // Prevents returning any implicitly
    "@typescript-eslint/restrict-plus-operands": "error", // Prevents string + number issues
    "@typescript-eslint/no-dynamic-delete": "error",    // Prevents dynamic property deletion
    "@typescript-eslint/no-namespace": "error",         // Prevents outdated namespace usage

    // === WARNINGS: Code Style & Best Practices ===
    "@typescript-eslint/no-explicit-any": "warn",      // Using 'any' type
    "@typescript-eslint/no-unused-vars": "warn",       // Unused variables (TS-aware)
    "@typescript-eslint/explicit-function-return-type": ["warn", {
      "allowExpressions": true,
      "allowHigherOrderFunctions": true
    }],                                                // Function return types
    "@typescript-eslint/no-non-null-assertion": "warn", // Non-null assertions (!)
    "@typescript-eslint/prefer-optional-chain": "warn", // Optional chaining
    //"@typescript-eslint/prefer-nullish-coalescing": "warn", // Nullish coalescing
    //"@typescript-eslint/no-unnecessary-condition": "warn", // Conditions that are always truthy/falsy
    "@typescript-eslint/ban-ts-comment": "warn",       // @ts-ignore and similar comments
    "@typescript-eslint/explicit-member-accessibility": ["warn", {
      "accessibility": "no-public"
    }],                                                // Explicit visibility modifiers
    "@typescript-eslint/member-ordering": "warn",      // Consistent member ordering
  }
};

export default defineConfig([
  { ignores: ['**/build/**', '**/dist/**', '**/node_modules/**', 'watch-tickets.ts', 'index.js', 'eslint.config.js', 'lint-local.js'] },
  { rules: customRules.javascript },
  {
    files: ["**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser }
  },
  tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    rules: customRules.typsecript,
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",  // Path to your tsconfig.json
        tsconfigRootDir: process.cwd()
      },
    },
  },
  pluginReact.configs.flat.recommended,
  {
    files: ["**/*.css"],
    plugins: { css },
    language: "css/css",
    extends: ["css/recommended"]
  },
]);
