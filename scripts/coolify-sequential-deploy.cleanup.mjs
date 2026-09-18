/** Coolify docker cleanup helpers. Never delete volumes or networks. */

export const CLEANUP_TIMEOUT_MS = 10 * 60 * 1000;
const WEB_APP_NAME = 'web';

/**
 * Extra cleanup before Next.js, after backend apps in the same run.
 * A web-only run already cleaned at start — do not prune twice.
 *
 * @param {string[]} apps
 * @param {string} app
 * @returns {boolean}
 */
export function shouldCleanupBeforeApp(apps, app) {
  return app === WEB_APP_NAME && apps[0] !== WEB_APP_NAME;
}

export const DOCKER_CLEANUP_SAFE_BODY = {
  delete_unused_volumes: false,
  delete_unused_networks: false,
};

/**
 * @param {string} serverUuid
 * @returns {{ method: 'POST', path: string, body: typeof DOCKER_CLEANUP_SAFE_BODY }}
 */
export function buildDockerCleanupRunRequest(serverUuid) {
  return {
    method: 'POST',
    path: `/servers/${serverUuid}/docker-cleanup/run`,
    body: { ...DOCKER_CLEANUP_SAFE_BODY },
  };
}

/**
 * @param {string} serverUuid
 * @returns {string}
 */
export function cleanupExecutionsPath(serverUuid) {
  return `/servers/${serverUuid}/docker-cleanup/executions`;
}

/**
 * @param {unknown} payload
 * @returns {Record<string, unknown>[]}
 */
export function extractCleanupExecutions(payload) {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (isRecord(payload) && Array.isArray(payload.data)) return payload.data.filter(isRecord);
  return [];
}

/**
 * @param {Record<string, unknown> | undefined} execution
 * @returns {'running' | 'success' | 'failed'}
 */
export function classifyCleanupExecution(execution) {
  if (!execution) return 'running';
  const status = String(execution.status ?? '')
    .trim()
    .toLowerCase();
  if (status === 'failed') return 'failed';
  if (status === 'success') return 'success';
  if (execution.finished_at && status !== 'in_progress' && status !== 'running') return 'success';
  return 'running';
}

/**
 * @param {string | undefined} previousUuid
 * @param {Record<string, unknown> | undefined} latest
 * @returns {boolean}
 */
export function isSameCleanupExecution(previousUuid, latest) {
  if (!previousUuid || !latest) return false;
  return String(latest.uuid ?? '') === previousUuid;
}

/**
 * @param {number | undefined} status
 * @param {string} [fallback]
 * @returns {string}
 */
export function formatCleanupHttpError(status, fallback) {
  if (status === 404) {
    return 'Coolify docker-cleanup API returned 404. Need Coolify >= 4.3.0. No SSH fallback.';
  }
  if (status === 401 || status === 403) {
    return 'Coolify docker cleanup is forbidden. Token needs write, and read for executions.';
  }
  return fallback ?? `Coolify docker cleanup failed (${status ?? 'unknown'})`;
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isRecord(value) {
  return typeof value === 'object' && value !== null;
}
