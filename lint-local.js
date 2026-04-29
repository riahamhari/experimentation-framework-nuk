#!/usr/bin/env node

// lint-here.mjs
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';

// Get the current directory relative to the project root
const projectRoot = process.cwd();
const currentDir = process.env.INIT_CWD || projectRoot;
const relativePath = path.relative(projectRoot, currentDir);

// If we're in the project root, lint the current directory
const pathToLint = relativePath || '.';

// Get any additional arguments
const additionalArgs = process.argv.slice(2);

console.log(`Running ESLint on: ${pathToLint}`);

// Run ESLint on the current directory
const result = spawnSync('npx', ['eslint', pathToLint, ...additionalArgs], {
  stdio: 'inherit',
  shell: true
});

// Exit with the same code as ESLint
process.exit(result.status);