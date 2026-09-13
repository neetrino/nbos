/** Local Coolify sequential deploy helpers. Keep secrets out of this file. */

import { ANSI, paint } from './cli-style.mjs';

export const APP_ORDER = ['api', 'worker', 'scheduler', 'web'];

export const APP_ENV_KEYS = {
  api: 'COOLIFY_APP_API_UUID',
  worker: 'COOLIFY_APP_WORKER_UUID',
  scheduler: 'COOLIFY_APP_SCHEDULER_UUID',
  web: 'COOLIFY_APP_WEB_UUID',
};

export const GROUP_APPS = {
  all: ['api', 'worker', 'scheduler', 'web'],
  backend: ['api', 'worker', 'scheduler'],
  web: ['web'],
  api: ['api'],
  worker: ['worker'],
  scheduler: ['scheduler'],
};

export const POLL_INTERVAL_MS = 15_000;
export const DEPLOY_TIMEOUT_MS = 45 * 60 * 1000;
export const QUEUE_RETRY_DEFAULT_MS = 30_000;
export const MAX_QUEUE_RETRIES = 5;

const SUCCESS_STATUSES = new Set(['finished']);
const FAILED_STATUSES = new Set(['failed', 'cancelled-by-user', 'cancelled']);
const RUNNING_STATUSES = new Set(['queued', 'in_progress']);

/**
 * @param {string} contents
 * @returns {Record<string, string>}
 */
export function parseDotEnv(contents) {
  const values = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator <= 0) continue;
    const key = line.slice(0, separator).trim();
    values[key] = stripEnvQuotes(line.slice(separator + 1).trim());
  }
  return values;
}

/**
 * @param {string} value
 * @returns {string}
 */
export function stripEnvQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

/**
 * @param {string} url
 * @returns {string}
 */
export function normalizeCoolifyUrl(url) {
  return url.trim().replace(/\/+$/, '');
}

/**
 * @param {string[]} argv
 * @returns {{ apps: string[], force: boolean, dryRun: boolean, help: boolean }}
 */
export function parseCliArgs(argv) {
  const flags = { force: false, dryRun: false, help: false };
  const tokens = [];
  for (const arg of argv) {
    if (arg === '--force') flags.force = true;
    else if (arg === '--dry-run' || arg === '--status') flags.dryRun = true;
    else if (arg === '--help' || arg === '-h') flags.help = true;
    else tokens.push(arg);
  }
  return { ...flags, apps: resolveApps(tokens) };
}

/**
 * @param {string[]} tokens
 * @returns {string[]}
 */
export function resolveApps(tokens) {
  const selected = new Set();
  const requested = tokens.length === 0 ? ['all'] : tokens;
  for (const token of requested) {
    const group = GROUP_APPS[token];
    if (!group) {
      throw new Error(
        `Unknown deploy target "${token}". Use all, backend, api, worker, scheduler, or web.`,
      );
    }
    for (const app of group) selected.add(app);
  }
  return APP_ORDER.filter((app) => selected.has(app));
}

/**
 * @param {Record<string, string | undefined>} env
 * @returns {string}
 */
export function resolveCoolifyToken(env) {
  const token = env.COOLIFY_API_TOKEN?.trim() || env.COOLIFY_TOKEN?.trim() || '';
  if (!token) {
    throw new Error('Set COOLIFY_API_TOKEN or COOLIFY_TOKEN in .env.local');
  }
  return token;
}

/**
 * @param {Record<string, string | undefined>} env
 * @param {string[]} apps
 * @returns {{ baseUrl: string, token: string, uuids: Record<string, string> }}
 */
export function resolveCoolifyConfig(env, apps) {
  const baseUrl = normalizeCoolifyUrl(env.COOLIFY_API_URL ?? '');
  if (!baseUrl) throw new Error('Set COOLIFY_API_URL in .env.local');
  const token = resolveCoolifyToken(env);
  const uuids = {};
  for (const app of apps) {
    const value = env[APP_ENV_KEYS[app]]?.trim() ?? '';
    if (!value) throw new Error(`Set ${APP_ENV_KEYS[app]} in .env.local`);
    uuids[app] = value;
  }
  return { baseUrl, token, uuids };
}

/**
 * @param {string | undefined} status
 * @returns {'running' | 'success' | 'failed' | 'unknown'}
 */
export function classifyDeploymentStatus(status) {
  const normalized = status?.trim().toLowerCase() ?? '';
  if (SUCCESS_STATUSES.has(normalized)) return 'success';
  if (FAILED_STATUSES.has(normalized)) return 'failed';
  if (RUNNING_STATUSES.has(normalized)) return 'running';
  return 'unknown';
}

/**
 * @param {unknown} payload
 * @returns {Record<string, unknown>[]}
 */
export function extractDeploymentRecords(payload) {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (!isRecord(payload)) return [];
  if (Array.isArray(payload.data)) return payload.data.filter(isRecord);
  if (Array.isArray(payload.deployments)) return payload.deployments.filter(isRecord);
  return [payload];
}

/**
 * @param {unknown} payload
 * @param {string} resourceUuid
 * @returns {string}
 */
export function parseQueuedDeploymentUuid(payload, resourceUuid) {
  const records = extractDeploymentRecords(payload);
  const match =
    records.find((record) => String(record.resource_uuid ?? '') === resourceUuid) ?? records[0];
  const deploymentUuid = String(match?.deployment_uuid ?? '').trim();
  if (!deploymentUuid) {
    const message = String(match?.message ?? 'Coolify did not return a deployment UUID');
    throw new Error(message);
  }
  return deploymentUuid;
}

/**
 * @param {Record<string, unknown>[]} records
 * @param {string} deploymentUuid
 * @returns {Record<string, unknown> | undefined}
 */
export function pickDeployment(records, deploymentUuid) {
  return records.find((record) => {
    const current = String(record.deployment_uuid ?? record.uuid ?? '');
    return current === deploymentUuid;
  });
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isRecord(value) {
  return typeof value === 'object' && value !== null;
}

/**
 * @param {{
 *   apps: string[],
 *   force: boolean,
 *   checkOnly: boolean,
 *   color?: boolean,
 * }} report
 * @returns {string}
 */
export function formatDeployReadyReport(report) {
  const color = report.color ?? true;
  const order = report.apps.join(' → ');
  const lines = [
    `Coolify deploy: ${paint(color, ANSI.cyan, order)}${report.force ? ' (force)' : ''}`,
    '',
  ];
  if (report.checkOnly) {
    lines.push(paint(color, ANSI.yellow, '⚠ Check only. No deploy started.'));
    lines.push(`Next: ${paint(color, ANSI.cyan, 'pnpm deploy:prod')}`);
  } else {
    lines.push(paint(color, ANSI.cyan, '▶ Starting sequential deploy'));
  }
  return `${lines.join('\n')}\n`;
}

/**
 * @param {string} appName
 * @param {'start' | 'queued' | 'running' | 'success' | 'failed'} phase
 * @param {string} [detail]
 * @param {boolean} [color]
 * @returns {string}
 */
export function formatDeployAppLine(appName, phase, detail, color = true) {
  if (phase === 'start') return paint(color, ANSI.cyan, `▶ Deploy ${appName}`);
  if (phase === 'queued') return `  ${paint(color, ANSI.yellow, '•')} queued ${detail ?? ''}`;
  if (phase === 'running') return `  ${appName}: ${paint(color, ANSI.yellow, detail ?? 'pending')}`;
  if (phase === 'success') return paint(color, ANSI.green, `✓ ${appName} finished`);
  return paint(color, ANSI.red, `✕ ${appName} failed${detail ? ` — ${detail}` : ''}`);
}
