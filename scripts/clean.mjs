#!/usr/bin/env node
import { rm } from 'fs/promises';
import { existsSync } from 'fs';

const targets = [
  'dist',
  '.vite',
  'node_modules/.vite',
  '.cache',
  'coverage',
  'build',
  'tmp',
  'dist-ssr'
];

console.log('Cleaning project folders...');
for (const t of targets) {
  if (existsSync(t)) {
    try {
      await rm(t, { recursive: true, force: true });
      console.log(`Removed: ${t}`);
    } catch (err) {
      console.error(`Failed to remove ${t}:`, err?.message || err);
    }
  }
}
console.log('Clean finished.');
