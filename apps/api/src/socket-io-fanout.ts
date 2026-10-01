import { resolveProcessRole, shouldStartPublicHttpApi } from './runtime/process-role';

export const SOCKET_IO_FANOUT_REFUSED =
  'REDIS_EVENTS_URL/REDIS_URL unset — Socket.IO distributed fan-out refused';

export type SocketIoFanoutDecision =
  | { mode: 'redis'; url: string }
  | { mode: 'process-local' }
  | { mode: 'refused'; reason: string };

/**
 * Socket.IO fan-out mode.
 * Redis URL matches `getRedisEventsUrl`: REDIS_EVENTS_URL, then REDIS_URL.
 * Process-local is only the local `all` role with Redis unset.
 */
export function resolveSocketIoFanout(
  env: NodeJS.ProcessEnv = process.env,
): SocketIoFanoutDecision {
  const role = resolveProcessRole(env);
  const url = readSocketIoRedisUrl(env);
  if (!shouldStartPublicHttpApi(env)) {
    return { mode: 'refused', reason: `${SOCKET_IO_FANOUT_REFUSED} for PROCESS_ROLE=${role}` };
  }
  if (url) return { mode: 'redis', url };
  if (role === 'all') return { mode: 'process-local' };
  return { mode: 'refused', reason: `${SOCKET_IO_FANOUT_REFUSED} for PROCESS_ROLE=${role}` };
}

/** Same URL order as `getRedisEventsUrl`, reading the supplied env. */
export function readSocketIoRedisUrl(env: NodeJS.ProcessEnv): string | undefined {
  const dedicated = env.REDIS_EVENTS_URL?.trim();
  if (dedicated) return dedicated;
  const shared = env.REDIS_URL?.trim();
  return shared ? shared : undefined;
}
