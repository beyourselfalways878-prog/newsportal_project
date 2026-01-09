import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const targets = [
  'dist',
  '.vite',
  path.join('node_modules', '.vite'),
  path.join('node_modules', '.cache'),
];

const removeTarget = (relativePath) => {
  const absolutePath = path.resolve(root, relativePath);
  if (!fs.existsSync(absolutePath)) return { relativePath, removed: false };

  fs.rmSync(absolutePath, { recursive: true, force: true });
  return { relativePath, removed: true };
};

const results = targets.map(removeTarget);

for (const result of results) {
  // Keep output readable in CI/local terminals
  process.stdout.write(`${result.removed ? 'Removed' : 'Missing'}: ${result.relativePath}\n`);
}
