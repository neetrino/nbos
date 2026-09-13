#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  APP_ENV_KEYS,
  DEPLOY_TIMEOUT_MS,
  MAX_QUEUE_RETRIES,
  POLL_INTERVAL_MS,
  QUEUE_RETRY_DEFAULT_MS,
  classifyDeploymentStatus,
  extractDeploymentRecords,
  parseCliArgs,
  parseDotEnv,
  parseQueuedDeploymentUuid,
  pickDeployment,
  resolveCoolifyConfig,
} from './coolify-sequential-deploy.lib.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(repoRoot, '.env.local');

function printHelp() {
  process.stdout.write(`Sequential Coolify production deploy (manual CD).

Usage:
  pnpm deploy:prod
  pnpm deploy:prod -- backend
  pnpm deploy:prod -- web
  pnpm deploy:prod -- --force api worker

Put values in repo-root .env.local (gitignored):
  COOLIFY_API_URL
  COOLIFY_API_TOKEN   or COOLIFY_TOKEN
  ${APP_ENV_KEYS.api}
  ${APP_ENV_KEYS.worker}
  ${APP_ENV_KEYS.scheduler}
  ${APP_ENV_KEYS.web}

UUIDs come from Coolify → app → Configuration → Webhooks → Deploy Webhook.
Migrate production first when the schema changed. This script does not migrate.
`);
}

function loadEnv() {
  const fromFile = parseDotEnv(readFileSync(envPath, 'utf8'));
  return { ...fromFile, ...process.env };
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function parseRetryAfterMs(response) {
  const raw = response.headers.get('retry-after');
  if (!raw) return QUEUE_RETRY_DEFAULT_MS;
  const seconds = Number.parseInt(raw, 10);
  return Number.isInteger(seconds) && seconds > 0 ? seconds * 1000 : QUEUE_RETRY_DEFAULT_MS;
}

async function coolifyRequest(api, method, path, body) {
  const response = await fetch(`${api.baseUrl}/api/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${api.token}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = payload && typeof payload === 'object' ? payload.message : text;
    const error = new Error(
      `Coolify ${method} ${path} failed (${response.status}): ${message || response.statusText}`,
    );
    error.status = response.status;
    error.retryAfterMs = parseRetryAfterMs(response);
    throw error;
  }
  return payload;
}

async function queueDeploy(api, appUuid, force) {
  for (let attempt = 1; attempt <= MAX_QUEUE_RETRIES; attempt += 1) {
    try {
      const payload = await coolifyRequest(api, 'POST', '/deploy', { uuid: appUuid, force });
      return parseQueuedDeploymentUuid(payload, appUuid);
    } catch (error) {
      if (error.status !== 429 || attempt === MAX_QUEUE_RETRIES) throw error;
      process.stderr.write(`Coolify queue full, retry ${attempt}/${MAX_QUEUE_RETRIES}\n`);
      await sleep(error.retryAfterMs ?? QUEUE_RETRY_DEFAULT_MS);
    }
  }
  throw new Error('Coolify deploy queue stayed full');
}

async function readDeploymentStatus(api, appUuid, deploymentUuid) {
  try {
    const byId = await coolifyRequest(api, 'GET', `/deployments/${deploymentUuid}`);
    const status = extractDeploymentRecords(byId)[0]?.status;
    if (typeof status === 'string') return status;
  } catch (error) {
    if (error.status !== 404) throw error;
  }
  const list = await coolifyRequest(api, 'GET', `/deployments/applications/${appUuid}?take=10`);
  const match = pickDeployment(extractDeploymentRecords(list), deploymentUuid);
  return typeof match?.status === 'string' ? match.status : undefined;
}

async function waitForDeployment(api, appName, appUuid, deploymentUuid) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < DEPLOY_TIMEOUT_MS) {
    const status = await readDeploymentStatus(api, appUuid, deploymentUuid);
    const outcome = classifyDeploymentStatus(status);
    if (outcome === 'success') return;
    if (outcome === 'failed') {
      throw new Error(`${appName} deploy ended with status ${status ?? 'unknown'}`);
    }
    process.stdout.write(`  ${appName}: ${status ?? 'pending'}\n`);
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error(`${appName} deploy timed out after ${DEPLOY_TIMEOUT_MS / 60000} minutes`);
}

async function deployApp(api, appName, appUuid, force) {
  process.stdout.write(`Deploy ${appName}\n`);
  const deploymentUuid = await queueDeploy(api, appUuid, force);
  process.stdout.write(`  queued ${deploymentUuid}\n`);
  await waitForDeployment(api, appName, appUuid, deploymentUuid);
  process.stdout.write(`  ${appName} finished\n`);
}

async function main() {
  const options = parseCliArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }
  const config = resolveCoolifyConfig(loadEnv(), options.apps);
  process.stdout.write(
    `Coolify sequential deploy: ${options.apps.join(' → ')}${options.force ? ' (force)' : ''}\n`,
  );
  if (options.dryRun) {
    process.stdout.write('Dry run only. No deploy started.\n');
    return;
  }
  for (const app of options.apps) {
    await deployApp(config, app, config.uuids[app], options.force);
  }
  process.stdout.write('All selected apps finished.\n');
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
  process.exitCode = 1;
});
