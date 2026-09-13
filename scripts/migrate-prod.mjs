#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDotEnv } from './coolify-sequential-deploy.lib.mjs';
import {
  classifyMigrateStatusOutput,
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

function printOutput(output) {
  const text = redactSecrets(output).trim();
  if (text) process.stdout.write(`${text}\n`);
}

async function readStatus(prodUrl) {
  const result = await runPnpm(['db:migrate:status'], prodUrl);
  printOutput(result.output);
  return classifyMigrateStatusOutput(result.output);
}

async function applyMigrations(prodUrl) {
  const result = await runPnpm(['db:migrate:deploy'], prodUrl);
  printOutput(result.output);
  if (result.code !== 0) throw new Error('pnpm db:migrate:deploy failed');
}

async function main() {
  const options = parseMigrateProdArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }
  const { url, host } = resolveProdDirectUrl(loadEnv());
  process.stdout.write(`Production migrate host: ${host}\n`);
  if (options.dryRun) {
    process.stdout.write(
      options.statusOnly
        ? 'Dry run. Would run status only.\n'
        : 'Dry run. Would run status → deploy → status.\n',
    );
    return;
  }
  const before = await readStatus(url);
  if (before === 'blocked') {
    throw new Error('Production migration history is blocked. Stop and inspect.');
  }
  if (options.statusOnly) {
    process.stdout.write('Status only. Nothing applied.\n');
    return;
  }
  if (before === 'up_to_date') {
    process.stdout.write('No pending production migrations.\n');
    return;
  }
  if (before !== 'pending' && before !== 'unknown') {
    throw new Error(`Cannot apply from status "${before}".`);
  }
  await applyMigrations(url);
  const after = await readStatus(url);
  if (after !== 'up_to_date') {
    throw new Error(`Production migrate finished, but status is ${after}.`);
  }
  process.stdout.write('Production migrations applied.\n');
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
  process.exitCode = 1;
});
