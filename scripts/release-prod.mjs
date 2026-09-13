#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ANSI, colorEnabled, paint } from './cli-style.mjs';
import {
  formatReleaseBanner,
  formatReleaseFinished,
  formatReleaseStopped,
  parseReleaseProdArgs,
  shouldStartDeploy,
} from './release-prod.lib.mjs';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptsDir, '..');
const migrateScript = resolve(scriptsDir, 'migrate-prod.mjs');
const deployScript = resolve(scriptsDir, 'coolify-sequential-deploy.mjs');

function printHelp() {
  process.stdout.write(`Production release: migrate first, deploy only if migrate succeeds.

Usage:
  pnpm release:prod:status
  pnpm release:prod
  pnpm release:prod -- backend
  pnpm release:prod -- web

If migrate fails, Coolify is not touched.
`);
}

function runScript(scriptPath, args) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      cwd: repoRoot,
      env: process.env,
      stdio: 'inherit',
    });
    child.on('error', reject);
    child.on('close', (code) => resolveRun(code ?? 1));
  });
}

async function main() {
  const options = parseReleaseProdArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }
  const color = colorEnabled();
  process.stdout.write(formatReleaseBanner(options.statusOnly, color));
  const migrateCode = await runScript(migrateScript, options.statusOnly ? ['--status'] : []);
  if (!shouldStartDeploy(migrateCode)) {
    process.stderr.write(formatReleaseStopped('migrate', color));
    process.exitCode = migrateCode;
    return;
  }
  const deployArgs = options.statusOnly ? ['--status', ...options.deployArgs] : options.deployArgs;
  const deployCode = await runScript(deployScript, deployArgs);
  if (deployCode !== 0) {
    process.stderr.write(formatReleaseStopped('deploy', color));
    process.exitCode = deployCode;
    return;
  }
  if (!options.statusOnly) process.stdout.write(formatReleaseFinished(color));
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${paint(colorEnabled(), ANSI.red, `✕ ${message}`)}\n`);
  process.exitCode = 1;
});
