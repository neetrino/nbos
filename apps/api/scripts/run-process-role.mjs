/**
 * Set PROCESS_ROLE then spawn node with remaining args.
 * Usage: node scripts/run-process-role.mjs api --import tsx dist/main.js
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const role = process.argv[2];
const nodeArgs = process.argv.slice(3);
if (!role || nodeArgs.length === 0) {
  // eslint-disable-next-line no-console
  console.error('Usage: run-process-role.mjs <role> <node-args...>');
  process.exit(1);
}

process.env.PROCESS_ROLE = role;
const child = spawn(process.execPath, nodeArgs, {
  stdio: 'inherit',
  env: process.env,
  cwd: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
});
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
