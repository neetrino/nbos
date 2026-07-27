/**
 * Explicit process roles for API / BullMQ worker / scheduler split.
 * Production forbids PROCESS_ROLE=all (no silent fallback).
 */

export const PROCESS_ROLES = ['api', 'worker', 'scheduler', 'all'] as const;

export type ProcessRole = (typeof PROCESS_ROLES)[number];

export type ProcessEntrypoint = 'api' | 'worker' | 'scheduler';

const MAX_REASONABLE_ROLE_LENGTH = 32;

export function isProcessRole(value: string): value is ProcessRole {
  return (PROCESS_ROLES as readonly string[]).includes(value);
}

/**
 * Resolve PROCESS_ROLE from env.
 * - Production: required; `all` rejected.
 * - Non-production: default `all` when unset (local/dev/tests).
 */
export function resolveProcessRole(env: NodeJS.ProcessEnv = process.env): ProcessRole {
  const isProduction = env.NODE_ENV === 'production';
  const raw = env.PROCESS_ROLE?.trim();

  if (!raw) {
    if (isProduction) {
      throw new Error(
        'PROCESS_ROLE is required in production. Use api | worker | scheduler (not all).',
      );
    }
    return 'all';
  }

  if (raw.length > MAX_REASONABLE_ROLE_LENGTH || !isProcessRole(raw)) {
    throw new Error(`Invalid PROCESS_ROLE="${raw}". Expected one of: ${PROCESS_ROLES.join(', ')}.`);
  }

  if (isProduction && raw === 'all') {
    throw new Error(
      'PROCESS_ROLE=all is forbidden in production. Use dedicated api and worker processes.',
    );
  }

  return raw;
}

/** Entrypoint must match the resolved role (except `all` for local). */
export function assertProcessRoleForEntrypoint(
  entrypoint: ProcessEntrypoint,
  env: NodeJS.ProcessEnv = process.env,
): ProcessRole {
  const role = resolveProcessRole(env);
  if (role === 'all') {
    return role;
  }
  if (role !== entrypoint) {
    throw new Error(
      `Entrypoint "${entrypoint}" cannot run with PROCESS_ROLE=${role}. ` +
        `Start the matching binary (main/worker/scheduler) or set PROCESS_ROLE=${entrypoint}|all.`,
    );
  }
  return role;
}

export function shouldRegisterBullmqWorkers(env: NodeJS.ProcessEnv = process.env): boolean {
  const role = resolveProcessRole(env);
  return role === 'worker' || role === 'all';
}

export function shouldRegisterQueueProducers(env: NodeJS.ProcessEnv = process.env): boolean {
  const role = resolveProcessRole(env);
  return role === 'api' || role === 'all' || role === 'worker';
}

/** HTTP public API, Socket.IO, SSE — api and local all only. */
export function shouldStartPublicHttpApi(env: NodeJS.ProcessEnv = process.env): boolean {
  const role = resolveProcessRole(env);
  return role === 'api' || role === 'all';
}

/** API-side background (e.g. IMAP idle) — not on dedicated worker. */
export function shouldStartApiSideEffects(env: NodeJS.ProcessEnv = process.env): boolean {
  const role = resolveProcessRole(env);
  return role === 'api' || role === 'all';
}
