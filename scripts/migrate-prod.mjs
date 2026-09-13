#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDotEnv } from './coolify-sequential-deploy.lib.mjs';
import {
  ANSI,
  classifyMigrateStatusOutput,
  colorEnabled,
  extractPendingMigrations,
  formatMigrateStatusReport,
  paint,
  parseMigrateProdArgs,
  redactSecrets,
  resolveProdDirectUrl,
} from './migrate-prod.lib.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(repoRoot, '.env.local');

function printHelp() {
  process.stdout.write(`Production Prisma migrate (manual). Uses DIRECT_URL_PROD only.

Same idea as deploy: the short command always runs.

Usage:
  pnpm db:migrate:prod:status     # check only
  pnpm db:migrate:prod            # apply pending migrations
  pnpm db:migrate:prod -- --dry-run

Put DIRECT_URL_PROD in repo-root .env.local (gitignored).
Never uses local DIRECT_URL. Does not print the connection string.
`);
}

function loadEnv() {
  const fromFile = parseDotEnv(readFileSync(envPath, 'utf8'));
  return { ...fromFile, ...process.env };
}

function childEnv(prodUrl) {
  return { ...process.env, DIRECT_URL: prodUrl };
}

function runPnpm(args, prodUrl) {
  return new Promise((resolveRun, reject) => {
    const child = spawn('pnpm', args, {
      cwd: repoRoot,
      env: childEnv(prodUrl),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      resolveRun({ code: code ?? 1, output: `${stdout}${stderr}` });
    });
  });
}

function printRawIfNeeded(status, output) {
  if (status !== 'unknown' && status !== 'blocked') return;
  const text = redactSecrets(output).trim();
  if (text) process.stdout.write(`${text}\n`);
}

async function readStatus(prodUrl) {
  const result = await runPnpm(['db:migrate:status'], prodUrl);
  const status = classifyMigrateStatusOutput(result.output);
  return {
    status,
    pending: extractPendingMigrations(result.output),
    output: result.output,
  };
}

async function applyMigrations(prodUrl) {
  const result = await runPnpm(['db:migrate:deploy'], prodUrl);
  if (result.code === 0) return;
  const text = redactSecrets(result.output).trim();
  if (text) process.stderr.write(`${text}\n`);
  throw new Error('pnpm db:migrate:deploy failed');
}

async function main() {
  const options = parseMigrateProdArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }
  const { url, host } = resolveProdDirectUrl(loadEnv());
  if (options.dryRun) {
    process.stdout.write(`Production DB: ${host}\n`);
    process.stdout.write(
      options.statusOnly
        ? 'Dry run. Would check status only.\n'
        : 'Dry run. Would apply pending migrations.\n',
    );
    return;
  }
  const before = await readStatus(url);
  const color = colorEnabled();
  process.stdout.write(
    formatMigrateStatusReport({
      host,
      status: before.status,
      pending: before.pending,
      checkOnly: options.statusOnly,
      color,
    }),
  );
  printRawIfNeeded(before.status, before.output);
  if (before.status === 'blocked') {
    throw new Error('Production migration history is blocked. Stop and inspect.');
  }
  if (options.statusOnly) return;
  if (before.status === 'up_to_date') return;
  if (before.status !== 'pending' && before.status !== 'unknown') {
    throw new Error(`Cannot apply from status "${before.status}".`);
  }
  process.stdout.write(`${paint(color, ANSI.cyan, 'Applying pending migrations…')}\n`);
  await applyMigrations(url);
  const after = await readStatus(url);
  process.stdout.write(
    formatMigrateStatusReport({
      host,
      status: after.status,
      pending: after.pending,
      checkOnly: false,
      color,
    }),
  );
  printRawIfNeeded(after.status, after.output);
  if (after.status !== 'up_to_date') {
    throw new Error(`Production migrate finished, but status is ${after.status}.`);
  }
  process.stdout.write(`${paint(color, ANSI.green, '✓ Production migrations applied.')}\n`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${paint(colorEnabled(), ANSI.red, `✕ ${message}`)}\n`);
  process.exitCode = 1;
});
