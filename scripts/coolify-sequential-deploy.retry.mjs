/** Decide whether a failed Coolify deploy should be retried once. */

export const MAX_APP_FAILURE_RETRIES = 1;

const CANCELLED_STATUSES = new Set(['cancelled', 'cancelled-by-user']);

const NON_RETRYABLE_LOG_PATTERNS = [
  /cancelled-by-user/i,
  /cancelled by user/i,
  /waiting for healthcheck/i,
  /health ?check failed/i,
  /healthcheck to pass/i,
  /nest can't resolve/i,
  /unknowndependenciesexception/i,
  /unknownexportsexception/i,
  /cannot find module/i,
];

const RETRYABLE_LOG_PATTERNS = [
  /#25\b/,
  /exporting layers/i,
  /no space left on device/i,
  /enospc/i,
  /deploymentexception/i,
  /build:web/i,
  /pnpm deploy/i,
];

export class DeployFailedError extends Error {
  /**
   * @param {string} appName
   * @param {string | undefined} status
   * @param {unknown} logs
   */
  constructor(appName, status, logs) {
    super(`${appName} deploy ended with status ${status ?? 'unknown'}`);
    this.name = 'DeployFailedError';
    this.appName = appName;
    this.status = status;
    this.logs = logs;
  }
}

/**
 * @param {{ status?: string, logs?: unknown }} failure
 * @returns {boolean}
 */
export function shouldRetryFailedDeploy(failure) {
  const status = failure.status?.trim().toLowerCase() ?? '';
  if (CANCELLED_STATUSES.has(status) || status !== 'failed') return false;
  const text = flattenDeploymentLogs(failure.logs);
  if (NON_RETRYABLE_LOG_PATTERNS.some((pattern) => pattern.test(text))) return false;
  if (text.length === 0) return true;
  return RETRYABLE_LOG_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * @param {unknown} logs
 * @returns {string}
 */
export function flattenDeploymentLogs(logs) {
  if (typeof logs === 'string') return flattenLogString(logs);
  if (Array.isArray(logs)) {
    return logs
      .map((entry) => flattenLogEntry(entry))
      .filter(Boolean)
      .join('\n');
  }
  return flattenLogEntry(logs);
}

/**
 * @param {string} logs
 * @returns {string}
 */
function flattenLogString(logs) {
  const trimmed = logs.trim();
  if (!trimmed) return '';
  try {
    return flattenDeploymentLogs(JSON.parse(trimmed));
  } catch {
    return trimmed;
  }
}

/**
 * @param {unknown} entry
 * @returns {string}
 */
function flattenLogEntry(entry) {
  if (typeof entry === 'string') return entry;
  if (typeof entry !== 'object' || entry === null) return '';
  return ['output', 'message', 'command']
    .map((key) => entry[key])
    .filter((value) => typeof value === 'string')
    .join('\n');
}
