import type { AuthSessionClientKind } from '@/lib/api/auth';

export const AUTH_SESSION_CLIENT_MESSAGE_KEYS: Record<
  AuthSessionClientKind,
  'clientWeb' | 'clientWorkApp' | 'clientMessenger' | 'clientVault'
> = {
  web: 'clientWeb',
  mobile_work: 'clientWorkApp',
  mobile_messenger: 'clientMessenger',
  mobile_vault: 'clientVault',
};

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export type SessionActivity =
  | { kind: 'thisDevice' }
  | { kind: 'unknown' }
  | { kind: 'activeNow' }
  | { kind: 'minutesAgo'; count: number }
  | { kind: 'hoursAgo'; count: number }
  | { kind: 'daysAgo'; count: number };

export function resolveSessionActivity(
  iso: string | null,
  current: boolean,
  nowMs: number = Date.now(),
): SessionActivity {
  if (current) return { kind: 'thisDevice' };
  if (!iso) return { kind: 'unknown' };
  const delta = nowMs - Date.parse(iso);
  if (!Number.isFinite(delta) || delta < MINUTE_MS) return { kind: 'activeNow' };
  if (delta < HOUR_MS) return { kind: 'minutesAgo', count: Math.floor(delta / MINUTE_MS) };
  if (delta < DAY_MS) return { kind: 'hoursAgo', count: Math.floor(delta / HOUR_MS) };
  return { kind: 'daysAgo', count: Math.floor(delta / DAY_MS) };
}
